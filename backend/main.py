from fastapi import FastAPI, Depends, HTTPException
from app.schemas.schemas import FeedbackInput, FeedbackResponse
from app.services.llm import analyze_feedback_with_ai
from app.core.security import verify_api_key
from app.core.logger import logger

app = FastAPI(
    title="Vibe Check API",
    description="Sentiment Analysis for Student Feedback",
    version="1.0.0"
)

@app.get("/")
def health_check():
    return {"status": "active", "service": "Vibe Check Backend"}

@app.post("/analyze", response_model=FeedbackResponse)
async def analyze_feedback(
    input_data: FeedbackInput, 
    api_key: str = Depends(verify_api_key)
):
    logger.info("📩 Received new feedback for analysis.")
    
    try:
        result = await analyze_feedback_with_ai(input_data.feedback_text)
        return FeedbackResponse(
            category=result.get("category", "Uncategorized"),
            sentiment=result.get("sentiment", "Neutral"),
            confidence_score=result.get("confidence", 0.0)
        )
    except Exception as e:
        logger.critical(f"System Crash during analysis: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Processing Error")

if __name__ == "__main__":
    import uvicorn
    # Log that server is starting (without revealing paths)
    logger.info("Server starting on port 8000...")
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)