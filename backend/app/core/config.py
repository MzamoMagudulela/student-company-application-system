import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "Mzamo's Youth Development Company — Student Company Application System"
    BRAND_NAME: str = "Mzamo's Youth Development Company"
    CREATOR_NAME: str = "Mzamo Sandile Magudulela"
    CREATOR_ROLE: str = "ICT Student & System Developer"
    TAGLINE: str = "Your Skills. Your Opportunity. Your Future."
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "mydc_super_secure_enterprise_secret_key_2026_mzamo_sandile_magudulela_ict"
    SESSION_EXPIRE_HOURS: int = 24
    RECOVERY_TOKEN_EXPIRE_MINUTES: int = 15
    MAX_FAILED_LOGIN_ATTEMPTS: int = 5
    ACCOUNT_LOCK_MINUTES: int = 15
    
    # Database
    DATABASE_URL: str = f"sqlite:///{BASE_DIR / 'mydc_app.db'}"
    
    # Storage
    STORAGE_DIR: Path = BASE_DIR / "storage"
    CVS_DIR: Path = BASE_DIR / "storage" / "cvs"
    OFFERS_DIR: Path = BASE_DIR / "storage" / "offers"
    
    # Frontend origin for CORS and QR origin verification
    FRONTEND_URL: str = "http://localhost:5173"
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000"
    ]

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

# Ensure storage directories exist
settings.CVS_DIR.mkdir(parents=True, exist_ok=True)
settings.OFFERS_DIR.mkdir(parents=True, exist_ok=True)
