import os
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # API Keys
    OPENAI_API_KEY: Optional[str] = None
    GOOGLE_API_KEY: Optional[str] = None
    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = None
    
    # Database
    MONGODB_URL: str = "mongodb://mongo:27017"
    DATABASE_NAME: str = "healthy_lifestyle"
    
    # Redis
    REDIS_URL: str = "redis://redis:6379"
    
    # RabbitMQ
    RABBITMQ_URL: str = "amqp://guest:guest@rabbitmq:5672/"
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
    
    class Config:
        env_file = "../.env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra environment variables

# Global settings instance
settings = Settings()