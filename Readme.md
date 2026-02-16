# 🎓 Vibe Check: AI Student Feedback Analyzer

<p align="center">
AI-Powered Real-Time Sentiment Intelligence for Universities
</p>

<p align="center">

<a href="https://www.python.org/">
  <img src="https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white"/>
</a>

<a href="https://fastapi.tiangolo.com/">
  <img src="https://img.shields.io/badge/FastAPI-ASGI-009688?style=for-the-badge&logo=fastapi&logoColor=white"/>
</a>

<a href="https://react.dev/">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black"/>
</a>

<a href="https://tailwindcss.com/">
  <img src="https://img.shields.io/badge/TailwindCSS-4-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white"/>
</a>

<a href="https://groq.com/">
  <img src="https://img.shields.io/badge/Groq-Llama--3-orange?style=for-the-badge"/>
</a>

<a href="https://render.com/">
  <img src="https://img.shields.io/badge/Render-Backend-46E3B7?style=for-the-badge"/>
</a>

<a href="https://www.netlify.com/">
  <img src="https://img.shields.io/badge/Netlify-Frontend-00C7B7?style=for-the-badge&logo=netlify&logoColor=white"/>
</a>

</p>

---

# 🧠 1. Project Overview

**Project Name:** Vibe Check AI  
**One-Liner:** An AI-powered dashboard for universities to instantly categorize and analyze student feedback vibes for better campus management.

## 🚨 Problem

Universities receive large volumes of unstructured student feedback that:

- Is difficult to manually categorize  
- Lacks structured insights  
- Is not scalable for real-time analysis  

## ✅ Solution

Vibe Check AI:

- Accepts raw textual feedback  
- Uses LLM-based inference for structured sentiment classification  
- Returns JSON-formatted responses  
- Displays categorized results on a dynamic dashboard  
- Operates fully on free-tier cloud infrastructure  

---

# 🏗️ 2. Technical Architecture

## 🔹 System Architecture

```mermaid
flowchart LR
    A[User] --> B[React Frontend]
    B --> C[FastAPI Backend]
    C --> D[Prompt Engineering Layer]
    D --> E[Groq LLM - Llama 3]
    E --> C
    C --> B
    B --> F[Dashboard UI]
```

---

## 🔹 Backend Concurrency Architecture

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant GroqAPI

    User->>Frontend: Submit Feedback
    Frontend->>Backend: POST /analyze
    Backend->>GroqAPI: Async LLM Request
    GroqAPI-->>Backend: JSON Sentiment Response
    Backend-->>Frontend: Structured Data
```

---

## 🔹 Data Flow Pipeline

```mermaid
flowchart TD
    A[Raw Feedback] --> B[FastAPI Endpoint]
    B --> C[Prompt Formatting]
    C --> D[Groq LLM]
    D --> E[Structured JSON Output]
    E --> F[Frontend Dashboard]
```

---

# ☁️ 3. Zero-Cost Cloud Usage

| Service | Usage | Free Tier | Purpose |
|----------|--------|------------|----------|
| Netlify | Frontend Hosting | 100GB/month | React Deployment |
| Render | Backend Hosting | 750 hours/month | FastAPI API |
| Groq Cloud | LLM Inference | 14K tokens/min | Sentiment Analysis |
| Uvicorn | ASGI Server | Free | Concurrency |

### 💰 Total Operating Cost: $0.00

The backend uses **ASGI async request handling** with `httpx` for non-blocking LLM calls, allowing 800+ concurrent requests within free-tier limits.

---

# 🧩 4. Core Technology Stack

```mermaid
flowchart LR
    A[React + Tailwind CSS] --> B[FastAPI]
    B --> C[Uvicorn ASGI]
    B --> D[httpx Async Client]
    D --> E[Groq LLM API]
```

---

## 🔍 Detailed Stack

| Layer | Technology | Version |
|-------|------------|----------|
| Frontend | React | 19 |
| Styling | Tailwind CSS | 4 |
| Animation | Framer Motion | Latest |
| Backend | FastAPI | Latest |
| Runtime | Python | 3.12 |
| HTTP Client | httpx | Async |
| LLM Provider | Groq | Llama-3-8b-8192 |

---

# 🔗 5. Important Links

<p align="center">

<a href="https://nlp-sentiment-analysis.netlify.app/">
  <img src="https://img.shields.io/badge/Live-Demo-00C7B7?style=for-the-badge&logo=netlify&logoColor=white"/>
</a>

<a href="https://github.com/kaushlendra0607/NLP_Sentiment_Analysis">
  <img src="https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white"/>
</a>

</p>

---

# 🛠️ 6. Installation & Setup

## Backend

```bash
cd backend
python -m venv venv
.\venv\Scripts\activate   # Windows
pip install -r requirements.txt
```

Create `.env` file:

```
AI_PROVIDER_API_KEY=your_key_here
API_KEY_SECRET=your_secret_here
```

Run server:

```bash
uvicorn main:app --reload
```

---

## Frontend

```bash
cd frontend
npm install
```

Create `.env` file:

```
VITE_API_URL=https://nlp-sentiment-analysis.netlify.app/
VITE_API_KEY=nlp_api_key_2580
```

Run:

```bash
npm run dev
```

---

# 🚀 7. Performance Features

- Async non-blocking LLM calls  
- Stateless architecture  
- Free-tier optimized  
- Horizontal scaling ready  

---

# 🔐 8. Security

- Environment-based API key storage  
- Backend validation layer  
- No direct frontend exposure of LLM  

---

# 👨‍💻 Author

Kaushlendra Singh  
AI | Cloud | Full Stack Developer