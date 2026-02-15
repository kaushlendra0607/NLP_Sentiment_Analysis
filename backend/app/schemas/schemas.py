from pydantic import BaseModel
from typing import List, Literal

class FeedbackInput(BaseModel):
    feedback_text: str

class FeedbackResponse(BaseModel):
    category: Literal["Concerns", "Appreciation", "Suggestions", "Uncategorized"]
    confidence_score: float
    sentiment: str