import os
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # API Keys
    OPENAI_API_KEY: Optional[str] = "demo-key-for-testing"
    GOOGLE_API_KEY: Optional[str] = None
    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = None
    
    # Database
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "healthy_lifestyle"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # RabbitMQ
    RABBITMQ_URL: str = "amqp://guest:guest@localhost:5672/"
    DIET_QUEUE: str = "diet_processing"
    NUTRITION_QUEUE: str = "nutrition_analysis"
    IMAGE_QUEUE: str = "image_processing"
    
    # Nutrition API
    NUTRITION_API_KEY: Optional[str] = None
    NUTRITION_API_URL: str = "https://api.edamam.com/api/nutrition-data"
    
    # AI Model Settings
    MODEL_NAME: str = "gpt-3.5-turbo"
    TEMPERATURE: float = 0.7
    MAX_TOKENS: int = 1000
    
    # Application Settings
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"
    
    # Feature Toggles (for local development)
    DISABLE_GOOGLE_VISION: bool = False
    DISABLE_RABBITMQ: bool = False
    USE_MOCK_GOOGLE_VISION: bool = False
    USE_SIMPLE_MQ: bool = False
    
    # Pydantic v2 configuration
    model_config = {
        "env_file": "../.env",
        "case_sensitive": True,
        "extra": "ignore"  # Ignore extra environment variables
    }

# Global settings instance
settings = Settings()