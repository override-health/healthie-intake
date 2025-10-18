"""
Configuration for Healthie Intake API
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings"""

    # Healthie API Configuration
    healthie_api_url: str = "https://staging-api.gethealthie.com/graphql"
    healthie_api_key: str = ""

    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 5096

    # CORS Configuration
    cors_origins: list = [
        "http://localhost:5000",
        "https://localhost:5001",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5046",
        "https://localhost:5046"
    ]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Global settings instance
settings = Settings()
