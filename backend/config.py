import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "insightflow-secret-key-saas-2026")
    
    # Base directories
    BASE_DIR = BASE_DIR
    UPLOAD_FOLDER = BASE_DIR / "uploads"
    EXPORT_FOLDER = BASE_DIR / "exports"
    SAMPLE_DATA_FOLDER = BASE_DIR / "sample_data"
    
    # Database
    DATABASE_PATH = BASE_DIR / "insightflow.db"
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", f"sqlite:///{DATABASE_PATH.as_posix()}")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Max file size: 100MB
    MAX_CONTENT_LENGTH = 100 * 1024 * 1024
    
    # LLM Settings
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    DEFAULT_LLM_PROVIDER = os.getenv("DEFAULT_LLM_PROVIDER", "gemini") # "gemini", "openai", or "deterministic"
    
    # Server
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", 5000))
    DEBUG = os.getenv("FLASK_DEBUG", "True").lower() in ("true", "1", "yes")

# Ensure required directories exist
Config.UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)
Config.EXPORT_FOLDER.mkdir(parents=True, exist_ok=True)
Config.SAMPLE_DATA_FOLDER.mkdir(parents=True, exist_ok=True)
