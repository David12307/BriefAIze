# BriefAIze
🔥 AI-Powered Summarization API
A production-ready API designed for learning purposes, showcasing authentication, rate-limiting, and AI-Powered text processing.

## Features
- **AI-Powered summarization**
- **API key-based authentication** with limits based on the plan
- **Rate-limiting**
- **File upload support** for PDF & DOCX summarization

## 🚀 API Documentation

### 🔑 Authentication
To use this API, include your API in the `x-api-key` header.

⬇️ /summarize/text
```
    {
        "text": "",
        "length": "short",
        "bullet_point": true,
        "summary_style": "casual",
        "language": "spanish"
        
    }
```