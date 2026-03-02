from fastapi import Security, HTTPException
from fastapi.security import APIKeyHeader
import os

API_KEY_HEADER = APIKeyHeader(name="X-Research-API-Key")
# In production, load this from .env
VALID_API_KEY = os.getenv("RESEARCH_API_KEY", "dev-test-key-123") 

def verify_api_key(api_key: str = Security(API_KEY_HEADER)):
    if api_key != VALID_API_KEY:
        print(f"[SECURITY] Unauthorized access attempt blocked.")
        raise HTTPException(status_code=403, detail="Invalid API Key")
    return api_key