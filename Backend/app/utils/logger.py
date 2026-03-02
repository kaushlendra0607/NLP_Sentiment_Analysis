import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("research_backend")

def log_and_print(provider: str, message: str, level: str = "INFO"):
    timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    formatted_msg = f"[{timestamp}] [{provider.upper()}] {message}"
    
    # Custom print to bypass Uvicorn swallowing logs
    print(formatted_msg)
    
    # Standard logger for file/cloud logging
    if level == "INFO":
        logger.info(formatted_msg)
    elif level == "ERROR":
        logger.error(formatted_msg)