import { GEMINI_API_KEY } from '../config/env.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 

import axios from 'axios';
// Import JSDOM
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

const languages = ["english", "romanian", "spanish", "french", "german", "greek", "italian", "portugese"];
const validLanguage = (language) => {
    if (languages.includes(language)) return true;
    return false;
}

export const summarizeText = async (req, res) => {
    try {
        const { text, length } = req.body;

        // Check if all the fields are valid.
        if (!text) res.status(400).json({success:false, error:"Text is required."});
        if (!["short", "medium", "long"].includes(length)) return res.status(400).json({success: false, error: "Invalid summary length."});

        const prompt = `
            You are an expert in text summarization, skilled in producing concise, coherent, and contextually relevant summaries.  
            Your task is to summarize the following text while maintaining key information, clarity, and readability.
            !!! KEEP THE SAME LANGUAGE AS THE INPUT TEXT !!!

            # Length definitions:
            - Short: A compact summary of aproximately 50-100 words.
            - Medium: A more detailed summary of aproximately 150-250 words.
            - Long: A comprehensive summary of aproximately 300-450 words, preserving all critical points.

            # Instructions:
            - Identify the core message and key details while removing redundancy.
            - Maintain logical flow and ensure the summary is easy to understand.
            - Use professional language while keeping it accessible.
            - Do not add any opinions, extra information, or unrelated details.
            - Return the summary as a JSON object in the following format:
            {
                "summary": "<generated summary>"
            }

            # Input text: " ${text} "
            # Desired summary length: ${length || 'short'}
        `;

        const result = await model.generateContent(prompt);
        const summary = JSON.parse(result.response.text().replace(/```json|```/g, '').trim());
        res.json({
            success: true,
            summary: summary.summary,
            original_text: text,
            original_length: text.split(" ").length,
            summary_length: summary.summary.split(" ").length,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, error: "Failed to summarize text. Try again later!" });
    }
};

export const summarizeURL = async (req, res) => {
    try {
        const { url, length = "short", language="english" } = req.body;

        // Check if all the fields are valid.
        if (!url) return res.status(400).json({success: false, error: "URL is required."});
        if (!["short", "medium", "long"].includes(length)) return res.status(400).json({success: false, error: "Invalid summary length."});
        if (!validLanguage(language)) return res.status(400).json({success: false, error: "Invalid language."});

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
            - **Return a JSON response in this format:**
            {
                "summary": "<generated summary>"
            }

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
            summary_length: summary.summary.split(' ').length,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, error: "Failed to summarize URL. Try again later!" });
    }
}

import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

const extractDataFromPDF = async (buffer) => {
    const data = await pdfParse(buffer);
    return data;
}

const extractDataFromDOCX = async (buffer) => {
    const data = await mammoth.extractRawText(buffer);
    return data;
}

export const summarizePDF = async (req, res) => {
    try {
        const file = req.file;
        if (!file) return res.status(404).json({success: false, error: "You need to enter a PDF or a DOCX file."});

        // Check if all the fields are valid.
        const length = req.body.length || "short";
        const language = req.body.language || "english";
        if (!["short", "medium", "long"].includes(length)) return res.status(400).json({success: false, error: "Invalid summary length."});
        if (!validLanguage(language)) return res.status(400).json({success: false, error: "Invalid language."});

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
            - Use **precise, professional, and neutral language** suitable for reports, research, or general understanding.
            - **Avoid** summarizing metadata, footnotes, references, or any unnecessary details.
            - Ensure the summary is **well-structured** with bullet points or sections when appropriate.

            # Length definitions:
            - **Short:** A compact summary (~50-100 words) focusing only on the key takeaways.
            - **Medium:** A more detailed summary (~150-250 words) capturing essential insights.
            - **Long:** A comprehensive summary (~300-450 words) preserving all critical details.

            !! Output the summary in the following JSON format:
            {
                "summary": <summary>
            }

            # Document content to summarize: ${extractedData}
            # Desired summary length: ${length}
            # Desired language of the summary: ${language}
        `

        const result = await model.generateContent(prompt);
        const summary = JSON.parse(result.response.text().replace(/```json|```/g, '').trim());

        return res.json({
            success: true,
            summary: summary.summary,
            length,
            summary_length: summary.summary.split(" ").length,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({success: false, error: "Failed to summarize your PDF file. Try again later!"});
    }
}