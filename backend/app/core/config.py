from typing import List
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    PROJECT_NAME: str = "Dheeksha Insurance API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # CORS: comma-separated list of allowed origins
    FRONTEND_URL: str = "http://localhost:5173"
    
    # MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "deeksha_insurance"
    
    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # Admin Credentials
    ADMIN_EMAIL: str
    ADMIN_PASSWORD: str

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        if not v or len(v.strip()) < 32:
            raise ValueError("SECRET_KEY must be a cryptographically secure string with at least 32 characters.")
        return v

    @property
    def frontend_origins(self) -> List[str]:
        if not self.FRONTEND_URL:
            return []
        return [origin.strip() for origin in self.FRONTEND_URL.split(",") if origin.strip()]

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
