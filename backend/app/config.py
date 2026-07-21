import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:admin123@localhost:5432/acurax_db"
    REDIS_URL: str = "redis://localhost:6379/0"
    JWT_SECRET: str = "acurax_jwt_secret_2026_xK9mP3nQ7rL1sV5wY8zA4cE6hJ2uT0bF"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    JWT_EXPIRY_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    STORAGE_DIR: str = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "storage"
    )

    class Config:
        # Reads from backend/.env (one level up from app/)
        env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
