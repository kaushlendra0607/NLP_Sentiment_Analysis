import httpx
import json
from app.core.config import settings
from app.core.logger import log_safe, log_error
from app.services.prompts import SYSTEM_PROMPT

async def analyze_feedback_with_ai(text: str) -> dict:
    """
    Calls the LLM provider (Groq/OpenAI compatible) to analyze text.
    """
    # URL for Groq (Change if using OpenAI)
    url = "https://api.groq.com/openai/v1/chat/completions" 
    
    headers = {
        "Authorization": f"Bearer {settings.AI_PROVIDER_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": settings.AI_MODEL_NAME,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Feedback: {text}"}
        ],
        "temperature": 0.1,
        "response_format": {"type": "json_object"}
    }

    # Debug Print (Visible in terminal)
    print(f"🚀 [DEBUG] Sending request to AI Provider: {settings.AI_MODEL_NAME}", flush=True)
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=headers, timeout=10.0)
            
            if response.status_code != 200:
                log_error("AI Provider returned error", Exception(f"Status: {response.status_code}, Body: {response.text}"))
                raise Exception(f"Provider Error {response.status_code}")

            data = response.json()
            content = data["choices"][0]["message"]["content"]
            
            log_safe("✅ AI Response received successfully")
            return json.loads(content)

    except Exception as e:
        log_error("Failed to analyze feedback", e)
        # Fallback response so the app doesn't crash
        return {"category": "Uncategorized", "sentiment": "Neutral", "confidence": 0.0}