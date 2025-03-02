import { GEMINI_API_KEY, UPSTASH_REDIS_REST_TOKEN, UPSTASH_REDIS_REST_URL } from '../config/env.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 

import axios from 'axios';
// Import JSDOM
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

import crypto from 'crypto';

const languages = ["english", "romanian", "spanish", "french", "german", "greek", "italian", "portugese"];
const validLanguage = (language) => {
    if (languages.includes(language)) return true;
    return false;
}

const summaryStyles = {
    professional: [
        "- Use concise, formal, and neutral language with no unnecessary embellishments.",
        "- Structure the summary with clear, and logical flow.",
        "- Maintain an objective tone, avoiding personal opinions or emotional expressions."
    ],
    casual: [
        "- Use a friendly, conversational tone as if explaining to a friend.",
        "- Keep sentences short and engaging, avoiding complex jargon.",
        "- Add light phrasing or humor where appropiate, but keep the core message intact."
    ],
    academic: [
        "- Use formal and precise language, incorporating key terms from the text",
        "- Ensure the summary retains the logical structure and essential arguments",
        "- Provide balanced explanations without personal bias or oversimplification."
    ],
    creative: [
        "- Use vivid, descriptive language to make the summary engaging.",
        "- Focus on key themes and emotions, not just facts.",
        "- Allow for metaphors, analogies, or storytelling elements where relevant.",
    ]
}

export const summarizeText = async (req, res) => {
    try {
        const { text, length = 'short', language="english", bullet_point=false, summary_style='professional' } = req.body;

        // Check if all the fields are valid.
        if (!text) res.status(400).json({success:false, error:"Text is required."});
        if (!["short", "medium", "long"].includes(length)) return res.status(400).json({success: false, error: "Invalid summary length."});
        if (!validLanguage(language)) return res.status(400).json({success: false, error: "Invalid language."});
        if (!summaryStyles[summary_style]) return res.status(400).json({success: false, error: "Invalid summary style."});

        const prompt = `
            You are an expert in text summarization, skilled in producing concise, coherent, and contextually relevant summaries.  
            Your task is to summarize the following text while maintaining key information, clarity, and readability.

            # Length definitions:
            - Short: A compact summary of aproximately 50-100 words.
            - Medium: A more detailed summary of aproximately 150-250 words.
            - Long: A comprehensive summary of aproximately 300-450 words, preserving all critical points.

            # Instructions:
            - Identify the core message and key details while removing redundancy.
            - Maintain logical flow and ensure the summary is easy to understand.
            ${summaryStyles[summary_style].join("\n")}

            ${bullet_point ? "- Return the summary in form of BULLET-POINTS that are in a JSON object of the following format: {summary: [ <all bullet points text> ]}" : "- Return the summary as a JSON object in the following format: { summary: <generated_summary> }"}
            !! Also make sure to add the topic of the summary in that JSON object ({topic: <topic>})

            # Input text: " ${text} "
            # Desired summary length: ${length}
            # Desired language of the summary: ${language}
        `;

        const result = await model.generateContent(prompt);
        const summary = JSON.parse(result.response.text().replace(/```json|```/g, '').trim());

        const returnObject = {
            success: true,
            summary: summary.summary,
            original_text: text,
            original_length: text.split(" ").length,
            length,
            summary_style,
            language,
            summary_topic: summary.topic,
            summary_length: bullet_point ? summary.summary.length : summary.summary.split(" ").length,
        }
        res.json(returnObject);
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, error: "Failed to summarize text. Try again later!" });
    }
};

export const summarizeURL = async (req, res) => {
    try {
        const { url, length = "short", language="english", bullet_point=false, summary_style="professional" } = req.body;

        // Check if all the fields are valid.
        if (!url) return res.status(400).json({success: false, error: "URL is required."});
        if (!["short", "medium", "long"].includes(length)) return res.status(400).json({success: false, error: "Invalid summary length."});
        if (!validLanguage(language)) return res.status(400).json({success: false, error: "Invalid language."});
        if (!summaryStyles[summary_style]) return res.status(400).json({success: false, error: "Invalid summary style."});

        // Fetch the content of the URL
        const axiosResponse = await axios.request({ method: "GET", url, headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36" } });
        const html = axiosResponse.data;

        // Extract text from HTML using cheerio
        // Use Readability to extract the main content
        const dom = new JSDOM(html);
        const reader = new Readability(dom.window.document);
        const readableContent = reader.parse();
        const extractedText = readableContent.textContent.trim() || "";

        if (!extractedText || extractedText.length < 200) return res.status(400).json({success: false, error: "Extracted text is too short for summarization."});

        // Generate summary using the model
        const prompt = `
            You are an advanced text summarization AI. Your task is to extract the **most important information** from the given content while preserving clarity and accuracy.
            
            ## Summary Length Definitions:
            - **Short**: 50-100 words
            - **Medium**: 150-250 words
            - **Long**: 300-450 words

            ## Rules:
            - **Summarize in the language mentioned**
            - Remove irrelevant content such as ads, footers, and menus.
            - Maintain logical flow and coherence.
            ${summaryStyles[summary_style].join("\n")}

            ${bullet_point ? "- Return the summary in form of BULLET-POINTS that are in a JSON object of the following format: {summary: [ <all bullet points text> ]}" : "- Return the summary as a JSON object in the following format: { summary: <generated_summary> }"}
            !! Also make sure to add the topic of the summary in that JSON object ({topic: <topic>})

            ## Content to summarize:
            ${extractedText}

            # Language to summary: ${language}

            ## Desired summary length: ${length}
        `;

        const result = await model.generateContent(prompt);
        const summary = JSON.parse(result.response.text().replace(/```json|```/g, '').trim());
        res.json({
            success: true,
            summary: summary.summary,
            language,
            length,
            summary_topic: summary.topic,
            summary_style,
            summary_length: bullet_point ? summary.summary.length : summary.summary.split(" ").length,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, error: "Failed to summarize URL. Try again later!" });
    }
}

import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { Redis } from '@upstash/redis';

const extractDataFromPDF = async (buffer) => {
    const data = await pdfParse(buffer);
    return data;
}

const extractDataFromDOCX = async (buffer) => {
    const data = await mammoth.extractRawText(buffer);
    return data;
}

const hashString = (input) => {
    return crypto.createHash('sha256').update(input).digest('hex');
}

const createCacheKey = (fileHash, optionsHash) => {
    return `${fileHash}-${optionsHash}`;
}

const redis = new Redis({
    url: UPSTASH_REDIS_REST_URL,
    token: UPSTASH_REDIS_REST_TOKEN
});

export const summarizeFile = async (req, res) => {
    try {
        const file = req.file;
        if (!file) return res.status(404).json({success: false, error: "You need to enter a PDF or a DOCX file."});
        
        // Check if all the fields are valid.
        const length = req.body.length || "short";
        const language = req.body.language || "english";
        const bullet_point = req.body.bullet_point || false;
        const summary_style = req.body.summary_style || "professional";
        if (!["short", "medium", "long"].includes(length)) return res.status(400).json({success: false, error: "Invalid summary length."});
        if (!validLanguage(language)) return res.status(400).json({success: false, error: "Invalid language."});
        if (!summaryStyles[summary_style]) return res.status(400).json({success: false, error: "Invalid summary style."});
        
        let extractedData;
        if (file.mimetype === 'application/pdf') {
            extractedData = await extractDataFromPDF(file.buffer);
            if (extractedData.numpages > 50) return res.status(400).json({success: false, error: "PDF files with more than 50 pages are not supported."});
            extractedData = extractedData.text;
        } else {
            extractedData = await extractDataFromDOCX(file.buffer);
            if (extractedData.value.length > 125000) return res.status(400).json({success: false, error: "DOCX files with more than 125,000 characters are not supported."});
            extractedData = extractedData.value;
        }

        const prompt = `
            You are an advanced AI specialized in text analysis and summarization. Your task is to summarize the content of a provided document while preserving key insisghts, structure, and clarity.

            # Instructions:
            - Extract the **core information** from the document while removing redundant or non-essential content.
            - Maintain the **logical flow** and readability of the summary.
            - **Avoid** summarizing metadata, footnotes, references, or any unnecessary details.
            - Ensure the summary is **well-structured**.
            ${summaryStyles[summary_style].join("\n")}

            # Length definitions:
            - **Short:** A compact summary (~50-100 words) focusing only on the key takeaways.
            - **Medium:** A more detailed summary (~150-250 words) capturing essential insights.
            - **Long:** A comprehensive summary (~300-450 words) preserving all critical details.

            ${bullet_point ? "Return the summary in form of BULLET-POINTS that are in a JSON object of the following format: {summary: [ <all bullet points text> ]}" : "Return the summary as a JSON object in the following format: { summary: <generated_summary> }"}
            !! Also make sure to add the topic of the summary in that JSON object ({topic: <topic>})

            # Document content to summarize: ${extractedData}
            # Desired summary length: ${length}
            # Desired language of the summary: ${language}
        `;

        const cacheKey = createCacheKey( hashString(file.buffer), hashString(`${length}-${language}-${summary_style}-${bullet_point}`) );
        const cachedObj = await redis.get(cacheKey);

        let result;
        let summaryObj;
        if (!cachedObj) {
            result = await model.generateContent(prompt);
            summaryObj = JSON.parse(result.response.text().replace(/```json|```/g, '').trim());
        }
        const summary = cachedObj ? cachedObj : summaryObj.summary;

        await redis.set(cacheKey, summary);

        return res.json({
            success: true,
            summary,
            length,
            language,
            summary_style,
            summary_topic: summaryObj ? summaryObj.topic : "Undefined yet.",
            summary_length: bullet_point ? summary.length : summary.split(" ").length,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({success: false, error: "Failed to summarize your file. Try again later!"});
    }
}