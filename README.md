# BriefAIze
🔥 AI-Powered Summarization API
A production-ready API designed for learning purposes, showcasing authentication, rate-limiting, and AI-Powered text processing.

## Features
- **AI-Powered summarization**
- **API key-based authentication** with limits based on the plan
- **Rate-limiting**
- **File upload support** for PDF & DOCX summarization

## 🚀 API Documentation

### 🛠 Request Options

| **Parameter**    | **Description**                              | **Possible Values**                      |
|-----------------|------------------------------------------|------------------------------------------|
| `text`          | Input text to be summarized             | Any string                              |
| `url`           | URL of a webpage to summarize          | Any valid URL                           |
| `file`          | File for summarization (PDF/DOCX)      | Multipart form-data file                |
| `length`        | Determines the length of the summary   | `short`, `medium`, `long`               |
| `bullet_point`  | Formats the summary as bullet points   | `true`, `false`                         |
| `summary_style` | Controls the tone of the summary       | `casual`, `professional`, `formal`      |
| `language`      | Specifies the language of the summary  | `english` `romanian` `spanish` `french` `german` `greek` `italian` `portugese` |


### 🔑 Authentication
To use this API, include your API in the `x-api-key` header.

⬇️ /summarize/text
```
{
    text,
    length,
    bullet_point,
    summary_style,
    language        
}
```

⬇️ /summarize/url
```
{
  url,
  language,
  bullet_point,
  length,
  summary_style
}
```

⬇️ /summarize/file
(Multipart form-data with):
* file (PDF or DOCX)
* length
* bullet_point
* summary_style
* language

### 🛠️ Environment Variables
```
PORT,
GEMINI_API_KEY,
ARCJET_KEY,
UPSTASH_REDIS_REST_URL,
UPSTASH_REDIS_REST_TOKEN
SUPABASE_URL
SUPABASE_KEY
```
