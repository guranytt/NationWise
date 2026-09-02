from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./nationwise.db"
    MAX_SUBMISSIONS_24H: int = 5
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "admin123"
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    DEBUG: bool = False

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
