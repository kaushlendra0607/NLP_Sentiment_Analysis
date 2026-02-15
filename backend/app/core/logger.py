import logging
from typing import Optional

# ✅ Get the existing Uvicorn logger instead of making a new one
logger = logging.getLogger("uvicorn.error")
logger.setLevel(logging.INFO)

def log_safe(message: str, sensitive_data: Optional[str] = None):
    """
    Logs a message. If sensitive_data is provided, it masks it.
    """
    if sensitive_data:
        masked = f"{sensitive_data[:3]}...***" if len(sensitive_data) > 4 else "***"
        logger.info(f"{message}: {masked}")
    else:
        logger.info(message)

def log_error(message: str, error: Exception):
    """Logs errors without revealing system paths if possible."""
    logger.error(f"❌ {message}: {str(error)}")