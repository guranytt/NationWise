from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/nationwise"
    SUPABASE_DATABASE_URL: str | None = None
    ALEMBIC_DATABASE_URL: str | None = None
    MAX_SUBMISSIONS_24H: int = 5
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "admin123"
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    DEBUG: bool = False
    GEMINI_API_KEY: str = ""
    RESEND_API_KEY: str = ""
    EMAIL_FROM: str = "NationWise Alerts <alerts@nationwise.ng>"
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""

    # When on Vercel or Supabase, use SUPABASE_DATABASE_URL.
    @property
    def get_db_url(self) -> str:
        return self.SUPABASE_DATABASE_URL or self.DATABASE_URL

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
