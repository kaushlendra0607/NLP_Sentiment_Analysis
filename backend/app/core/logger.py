# backend/app/core/logger.py
import sys
from datetime import datetime
from typing import Optional

def log_safe(message: str, sensitive_data: Optional[str] = None):
    timestamp = datetime.now().strftime("%H:%M:%S")
    
    if sensitive_data:
        # Mask the secret (Show first 3 chars, hide the rest)
        masked = f"{sensitive_data[:2]}...***" if len(sensitive_data) > 4 else "***"
        print(f"[{timestamp}] INFO: {message}: {masked}", flush=True)
    else:
        print(f"[{timestamp}] INFO: {message}", flush=True)

def log_error(message: str, error: Exception):
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] ❌ ERROR: {message}: {str(error)}", flush=True)