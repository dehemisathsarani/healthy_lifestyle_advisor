from pydantic_settings import BaseSettings
from typing import Optional, List


class Settings(BaseSettings):
    # MongoDB settings
    MONGODB_URL: str = "mongodb://localhost:27017"
    DB_NAME: str = "fitness_db"
    
    # JWT settings
    JWT_SECRET_KEY: str = "your_secret_key"  # Replace in production
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # API settings
    API_PREFIX: str = "/api/v1"
    DEMO_MODE: bool = True  # Enable for development without DB
    
    # Wearable device integration settings
    WEARABLE_API_ENABLED: bool = True
    FITBIT_CLIENT_ID: str = ""
    FITBIT_CLIENT_SECRET: str = ""
    GARMIN_CONSUMER_KEY: str = ""
    GARMIN_CONSUMER_SECRET: str = ""
    APPLE_HEALTH_INTEGRATION: bool = False
    GOOGLE_FIT_CLIENT_ID: str = ""
    WEARABLE_SYNC_INTERVAL: int = 15  # minutes
    
    # Health monitoring settings
    ANOMALY_DETECTION_ENABLED: bool = True
    ANOMALY_SENSITIVITY: str = "medium"  # low, medium, high
    HEART_RATE_ALERT_THRESHOLD: int = 120  # bpm
    RECOVERY_ADVICE_AUTO_REFRESH: bool = True
    
    # CORS settings
    CORS_ORIGINS: List[str] = ["*"]
    
    class Config:
        env_file = ".env"


settings = Settings()
