import time
import json
import os
from openai import OpenAI
from ..schemas.schema import APIResSchema, EmotionDetail
from ..configs.prompt import get_research_prompt
from ..utils.logger import log_and_print

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def call_openai(text: str) -> APIResSchema:
    provider = "openai"
    log_and_print(provider, "Starting request...")
    start_time = time.perf_counter()
    
    try:
        # standard GPT-4o call
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",# or gpt-4o-mini
            #gpt-3.5-turbo
            messages=[{"role": "user", "content": get_research_prompt(text)}],
            response_format={"type": "json_object"}
        )
        
        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
        
        # DYNAMIC METADATA EXTRACTION
        prompt_tokens = response.usage.prompt_tokens if response.usage else 0
        completion_tokens = response.usage.completion_tokens if response.usage else 0
        tps = round(completion_tokens / (latency_ms / 1000), 2) if latency_ms > 0 else 0
        
        data = json.loads(response.choices[0].message.content or "{}")
        
        return APIResSchema(
            provider=provider,model_used= '', status="success", api_latency_ms=latency_ms,
            output_tokens_per_second=tps, prompt_tokens=prompt_tokens, completion_tokens=completion_tokens,
            overall_sentiment=data.get("overall_sentiment"),
            emotion_breakdown=[EmotionDetail(**e) for e in data.get("emotion_breakdown", [])],
            sarcasm_flag=data.get("sarcasm_flag"),
            tone=data.get("tone"),
            minor_emotions=data.get("minor_emotions", []), # Uses an empty list if the LLM forgets it
        )
    except Exception as e:
        return APIResSchema(provider=provider,model_used= '', status="error", api_latency_ms=0, error_message=str(e))