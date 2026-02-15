# 🎓 Vibe Check: AI Student Feedback Analyzer

### 1. Project Overview
**Project Name:** Vibe Check AI  
**Team ID:** [Enter Your Team ID]  
**One-Liner:** An AI-powered dashboard for universities to instantly categorize and analyze student feedback vibes for better campus management.

---

### 2. Technical Architecture
* **Cloud Provider:** Render (Backend) & Vercel (Frontend)
* **Frontend:** React 19 (Vite), Tailwind CSS 4, Framer Motion
* **Backend:** FastAPI (Python 3.12), Uvicorn, Httpx
* **AI Engine:** Groq Cloud (Llama-3-8b-8192) for JSON-structured inference
* **Database:** Stateless Architecture (In-memory processing for zero-latency and cost)

---

### 3. Proof of "Zero-Cost" Cloud Usage
This project is built 100% on Free Tier infrastructure to ensure a $0.00 operating cost:
* **Render/Vercel Free Tiers:** Used for hosting the web service and frontend assets without subscription fees.
* **Groq Cloud Free Tier:** Provides high-speed LLM inference (up to 14,000 tokens per minute) at zero cost.
* **Scalability & Concurrency:** To handle **800+ concurrent users**, the application utilizes **Asynchronous Request Handling (ASGI)** in FastAPI. By using non-blocking I/O (via `httpx`), the backend can process multiple AI analysis requests simultaneously without waiting for individual LLM responses to finish, effectively scaling within free-tier resource limits.

---

### 4. Important Links
* **Live Demo Link:** https://nlp-sentiment-analysis.netlify.app/
* **GitHub Repository:** https://github.com/kaushlendra0607/NLP_Sentiment_Analysis

---

## 🛠️ Installation & Setup

### Backend (Python)
1. Navigate to the backend folder: `cd backend`
2. Create a virtual environment: `python -m venv venv`
3. Activate it: `.\venv\Scripts\activate` (Windows)
4. Install dependencies: `pip install -r requirements.txt`
5. Create a `.env` file with `AI_PROVIDER_API_KEY` and `API_KEY_SECRET`.
6. Run the server: `uvicorn main:app --reload`

### Frontend (React)
1. Navigate to the frontend folder: `cd frontend`
2. Install dependencies: `npm install`
3. Create a `.env` file:
   ```env
   VITE_API_URL=https://nlp-sentiment-analysis.netlify.app/
   VITE_API_KEY=nlp_api_key_2580