import time
import json
from google import genai
from ..schemas.schema import APIResSchema, EmotionDetail
from ..configs.prompt import get_research_prompt
from ..utils.logger import log_and_print
import os
from typing import Optional

# Initialize client using the modern 2026 SDK
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

async def call_gemini(text: str, model_name: Optional[str] = None) -> APIResSchema:
    provider = "gemini"
    cloud_env = os.getenv("CLOUD_PROVIDER", "Unknown")
    log_and_print(provider, "Starting request... LLM is thinking.")
    
    start_time = time.perf_counter()
    prompt = get_research_prompt(text)
    
    try:
        # Note: In a real async environment, you might need to run this in an executor 
        # if the specific SDK method is strictly synchronous, but genai supports async calls.
        response = client.models.generate_content(
            model=model_name or 'gemini-2.5-flash',
            contents=prompt,
            config={'response_mime_type': 'application/json'}
        )
        
        end_time = time.perf_counter()
        latency_ms = round((end_time - start_time) * 1000, 3)
        if not response.text:
            raise ValueError("Gemini returned an empty response (likely blocked by safety filters).")
        # Parse the JSON response
        data = json.loads(response.text)
        
        # Extract metadata (simulated here; adjust based on exact SDK response object)
        if response.usage_metadata:
            # Pylance is now happy because we've proven it's not None
            prompt_tokens = response.usage_metadata.prompt_token_count or 0
            completion_tokens = response.usage_metadata.candidates_token_count or 0
            
            # Dynamic TPS Calculation
            if latency_ms > 0:
                tps = round(completion_tokens / (latency_ms / 1000), 3)
        else:
            log_and_print(provider, "Warning: usage_metadata was missing from the response.", "ERROR")
        log_and_print(provider, f"SUCCESS. Time taken: {latency_ms} ms")
        
        return APIResSchema(
            provider=provider,
            provider_status_code = 200,
            model_used=model_name or 'gemini-2.5-flash',
            hosted_on=cloud_env,
            status="success",
            error_message= 'None',
            api_latency_ms=latency_ms,
            output_tokens_per_second=tps,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            overall_sentiment=data.get("overall_sentiment"),
            emotion_breakdown=[EmotionDetail(**e) for e in data.get("emotion_breakdown", [])],
            sarcasm_flag=data.get("sarcasm_flag"),
            tone=data.get("tone"),
            minor_emotions=data.get("minor_emotions", []), # Uses an empty list if the LLM forgets it
        )

    except Exception as e:
        status_code_raw = getattr(e, 'code', None) or getattr(e, 'status_code', None) or getattr(e, 'http_status', None)
        if status_code_raw is None:
            status_code = 500
        else:
            try:
                # Pylance now knows for a fact this is NOT None
                status_code = int(status_code_raw)
            except (ValueError, TypeError):
                status_code = 500
            
        log_and_print(provider, f"ERROR [{status_code}] AFTER {latency_ms} ms: {str(e)}", "ERROR")
        print(e)
        
        return APIResSchema(
            provider=provider,
            model_used=model_name or 'gemini-2.5-flash',
            status="error",
            api_latency_ms=0,
            error_message=str(e),
            provider_status_code=status_code
        )