from pydantic import BaseModel
from typing import List, Optional, Dict

class EmotionDetail(BaseModel):
    keyword: str
    emotion: str
    confidence_score: float

class APIResSchema(BaseModel):
    provider: str
    model_used: str
    status: str  # "success" or "error"
    api_latency_ms: float
    output_tokens_per_second: Optional[float] = None
    prompt_tokens: Optional[int] = None
    completion_tokens: Optional[int] = None
    
    # --- Updated NLP Fields ---
    tone: Optional[str] = None
    overall_sentiment: Optional[str] = None
    minor_emotions: Optional[List[str]] = None
    emotion_breakdown: Optional[List[EmotionDetail]] = None
    sarcasm_flag: Optional[bool] = None
    
    hosted_on: Optional[str] = None 
    error_message: Optional[str] = None
    provider_status_code: Optional[int] = None
    
    frontend_total_latency_ms: Optional[float] = None 
    cloud_network_overhead_ms: Optional[float] = None

class AnalyzeRequest(BaseModel):
    text: str
    # Dynamic models with Optionality for the "OR" logic in services
    model_gemini: Optional[str] = None
    model_groq: Optional[str] = None
    model_mistral: Optional[str] = None

class ResearchSummarySchema(BaseModel):
    fastest_model: Optional[str] = None
    fastest_latency_ms: Optional[float] = 0.0
    highest_tps_model: Optional[str] = None
    highest_tps_value: Optional[float] = 0.0
    tone_consensus: Optional[str] = None
    sarcasm_detected_by_majority: bool = False
    successful_calls: int = 0
    failed_calls: int = 0
    cloud_environment: Optional[str] = None
    db_write_latency_ms: Optional[float] = None
    cache_write_latency_ms: Optional[float] = None

class SummaryRequest(BaseModel):
    gemini: Optional[APIResSchema] = None
    groq: Optional[APIResSchema] = None
    mistral: Optional[APIResSchema] = None

class ResearchAnalyticsResponse(BaseModel):
    analyzed_records: int
    average_llm_latency_ms: Dict[str, Optional[float]]
    average_cloud_roundtrip_ms: Dict[str, Optional[float]]
    last_db_read_latency_ms: Optional[float] = None
    last_cache_read_latency_ms: Optional[float] = None