import os
from dotenv import load_dotenv

# Load .env from the root directory
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../../../.env"))
print(f"DEBUG: API Key Loaded? {bool(os.getenv('AI_PROVIDER_API_KEY'))}")

class Settings:
    PROJECT_NAME: str = "Vibe Check API"
    API_KEY_SECRET: str = os.getenv("API_KEY_SECRET", "default_insecure_key")
    AI_PROVIDER_API_KEY: str = os.getenv("AI_PROVIDER_API_KEY") or ""
    AI_MODEL_NAME: str = os.getenv("AI_MODEL_NAME", "llama3-8b-8192")

settings = Settings()