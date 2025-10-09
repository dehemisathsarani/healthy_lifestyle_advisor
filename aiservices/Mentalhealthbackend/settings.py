from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database Configuration
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "mental_health_db"
    
    # RabbitMQ Configuration
    RABBITMQ_URL: str = "amqp://guest:guest@localhost:5672/"
    
    # AI Service Configuration
    AI_SERVICE_URL: str = "http://localhost:8008"
    
    # Authentication Configuration
    JWT_SECRET_KEY: str = "your-secret-key-here"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    
    # API Configuration
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8006
    
    # Logging Configuration
    LOG_LEVEL: str = "INFO"
    
    # External APIs
    YOUTUBE_API_KEY: Optional[str] = None
    SPOTIFY_CLIENT_ID: Optional[str] = None
    SPOTIFY_CLIENT_SECRET: Optional[str] = None
    
    # Crisis Resources
    CRISIS_HOTLINE_NUMBERS: list = [
        {"country": "US", "number": "988", "name": "Suicide & Crisis Lifeline"},
        {"country": "US", "number": "1-800-366-8288", "name": "SAMHSA National Helpline"},
        {"country": "UK", "number": "116 123", "name": "Samaritans"},
        {"country": "CA", "number": "1-833-456-4566", "name": "Talk Suicide Canada"}
    ]
    
    # Mental Health Configuration
    MOOD_ANALYSIS_CONFIDENCE_THRESHOLD: float = 0.7
    CRISIS_KEYWORDS: list = [
        "suicide", "kill myself", "end it all", "not worth living",
        "want to die", "harm myself", "cut myself", "overdose"
    ]
    CRISIS_RISK_THRESHOLD: float = 0.8
    
    # Intervention Configuration
    MAX_JOKE_RETRIES: int = 3
    MAX_MUSIC_SUGGESTIONS: int = 5
    MEDITATION_SESSION_TYPES: list = [
        "breathing", "mindfulness", "guided", "body-scan", 
        "visualization", "nature-sounds"
    ]
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()