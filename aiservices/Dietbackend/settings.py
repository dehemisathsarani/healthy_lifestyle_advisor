import os
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database Configuration
    MONGODB_URL: str = "mongodb://admin:password@mongo:27017"
    DATABASE_NAME: str = "healthy_lifestyle"
    
    # RabbitMQ Configuration
    RABBITMQ_URL: str = "amqp://guest:guest@rabbitmq:5672/"
    DIET_QUEUE: str = "diet_processing"
    NUTRITION_QUEUE: str = "nutrition_analysis"
    IMAGE_QUEUE: str = "image_processing"
    
    # Redis Configuration
    REDIS_URL: str = "redis://redis:6379"
    
    # AI Service Configuration
    AI_SERVICE_URL: str = "http://ai_service:8001"
    
    # JWT Configuration
    JWT_SECRET_KEY: str = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    
    # Application Settings
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"
    APP_NAME: str = "Diet Agent Backend"
    APP_VERSION: str = "1.0.0"
    
    # CORS Settings
    ALLOWED_ORIGINS: list = ["*"]  # Configure properly for production
    
    # File Upload Settings
    MAX_FILE_SIZE_MB: int = 10
    ALLOWED_IMAGE_TYPES: list = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
    
    # External API Settings
    NUTRITION_API_KEY: Optional[str] = None
    GOOGLE_API_KEY: Optional[str] = None
    
    # Notification Settings
    ENABLE_NOTIFICATIONS: bool = True
    NOTIFICATION_QUEUE: str = "notifications"
    
    # Cache Settings
    CACHE_TTL_SECONDS: int = 3600  # 1 hour
    ENABLE_CACHING: bool = True
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Global settings instance
settings = Settings()