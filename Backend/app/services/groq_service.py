import time
import json
import os
from groq import Groq
from ..schemas.schema import APIResSchema, EmotionDetail
from ..configs.prompt import get_research_prompt
from ..utils.logger import log_and_print
from typing import Optional

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


async def call_groq(text: str, model_name: Optional[str] = None) -> APIResSchema:
    provider = "groq"
    cloud_env = os.getenv("CLOUD_PROVIDER", "Unknown")
    log_and_print(provider, "Starting request (Low Latency Mode)...")
    start_time = time.perf_counter()

    try:
        response = client.chat.completions.create(
            model=model_name
            or "llama-3.3-70b-versatile",  # or llama-3.1-70b-versatile or llama3-8b-8192
            messages=[{"role": "user", "content": get_research_prompt(text)}],
            response_format={"type": "json_object"},
        )

        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

        # DYNAMIC METADATA EXTRACTION
        prompt_tokens = response.usage.prompt_tokens if response.usage else 0
        completion_tokens = response.usage.completion_tokens if response.usage else 0
        tps = round(completion_tokens / (latency_ms / 1000), 2) if latency_ms > 0 else 0

        data = json.loads(response.choices[0].message.content or "{}")

        return APIResSchema(
            provider=provider,
            provider_status_code= 200,
            model_used=model_name or "llama-3.3-70b-versatile",
            hosted_on=cloud_env,
            status="success",
            error_message='None',
            api_latency_ms=latency_ms,
            output_tokens_per_second=tps,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            overall_sentiment=data.get("overall_sentiment"),
            emotion_breakdown=[
                EmotionDetail(**e) for e in data.get("emotion_breakdown", [])
            ],
            sarcasm_flag=data.get("sarcasm_flag"),
            tone=data.get("tone"),
            minor_emotions=data.get(
                "minor_emotions", []
            ),  # Uses an empty list if the LLM forgets it
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
            provider_status_code= status_code,
            model_used=model_name or "llama-3.3-70b-versatile",
            status="error",
            api_latency_ms=0,
            error_message=str(e),
        )
