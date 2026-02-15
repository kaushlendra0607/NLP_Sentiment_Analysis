import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path

# --- FIX: FORCE PATH LOADING ---
# 1. Get the folder where main.py is located
BASE_DIR = Path(__file__).resolve().parent

# 2. Point to the .env file explicitly
env_path = BASE_DIR / ".env"

# 3. Load it
load_dotenv(dotenv_path=env_path)

# 4. Debug Check (So you know it worked)
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
print(f"DEBUG: Key Loaded? {GROQ_API_KEY is not None}")
print(f"DEBUG: Path used: {env_path}")

# 2. Initialize App & AI Client
app = FastAPI()
client = Groq(api_key=GROQ_API_KEY)

# 3. Enable CORS (So your React frontend can talk to this backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (good for hackathons)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Define Data Models (Input/Output)
class FeedbackRequest(BaseModel):
    text: str

class FeedbackResponse(BaseModel):
    category: str
    confidence: float
    sentiment: str

# 5. The Core Logic (NLP Route)
@app.post("/analyze", response_model=FeedbackResponse)
async def analyze_feedback(request: FeedbackRequest):
    if not request.text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    # The Prompt Engineering (The "Brain")
    system_prompt = """
    You are an AI classifier for student feedback. 
    Analyze the text and categorize it into EXACTLY one of these 3 categories:
    1. Concerns
    2. Appreciation
    3. Suggestions

    Also determine the sentiment (Positive, Negative, Neutral).
    
    Return JSON format only: {"category": "...", "sentiment": "..."}
    """

    try:
            chat_completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": request.text}
                ],
                model="llama3-8b-8192", 
                response_format={"type": "json_object"} 
            )
            
            # --- FIX STARTS HERE ---
            # 1. Get the content safely
            raw_content = chat_completion.choices[0].message.content
            
            # 2. Check if it is None or Empty
            if not raw_content:
                raise HTTPException(status_code=500, detail="AI returned empty response")
                
            # 3. Parse it (Now Python knows raw_content is definitely a string)
            import json
            result = json.loads(raw_content)
            # --- FIX ENDS HERE ---
            
            return FeedbackResponse(
                category=result.get("category", "Uncategorized"),
                confidence=1.0, 
                sentiment=result.get("sentiment", "Neutral")
            )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 6. Health Check (To verify server is running)
@app.get("/")
def home():
    return {"status": "Vibe Check API is Live 🚀"}