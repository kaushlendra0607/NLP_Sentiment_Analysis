from fastapi import HTTPException, Security, status
from fastapi.security import APIKeyHeader
from app.core.config import settings
from app.core.logger import log_safe

api_key_header = APIKeyHeader(name="x-api-key", auto_error=False)

async def verify_api_key(api_key: str = Security(api_key_header)):
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Missing API Key"
        )
    
    if api_key != settings.API_KEY_SECRET:
        log_safe("⚠️ Unauthorized access attempt with key", api_key)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Invalid API Key"
        )
    
    return api_key