from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from datetime import datetime

class HealthData(BaseModel):
    """Model for combined health data from all agents"""
    diet_data: Dict[str, any] = Field(
        description="Diet data including calories and macros",
        default_factory=dict
    )
    fitness_data: Dict[str, any] = Field(
        description="Fitness data including workouts and calories burned",
        default_factory=dict
    )
    mental_health_data: Dict[str, any] = Field(
        description="Mental health data including mood and stress levels",
        default_factory=dict
    )
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class PrivacyPreferences(BaseModel):
    """Model for user privacy preferences"""
    share_with_doctor: bool = Field(
        default=False,
        description="Allow sharing data with healthcare providers"
    )
    share_with_coach: bool = Field(
        default=False,
        description="Allow sharing data with fitness coach"
    )
    share_anonymized_data: bool = Field(
        default=False,
        description="Allow sharing anonymized data for research"
    )
    keep_private: bool = Field(
        default=True,
        description="Keep all data private"
    )
    data_retention_period: int = Field(
        default=365,
        description="Number of days to retain data"
    )

class EncryptedData(BaseModel):
    """Model for encrypted data"""
    data: str = Field(description="Encrypted data string")
    encryption_type: str = Field(description="Type of encryption used (AES/RSA)")
    iv: Optional[str] = Field(description="Initialization vector for AES")
    key_id: Optional[str] = Field(description="ID of the encryption key used")
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class AccessToken(BaseModel):
    """Model for JWT access tokens"""
    token: str
    token_type: str = "bearer"
    expires_in: int
    refresh_token: Optional[str]

class AccessPermission(BaseModel):
    """Model for access permissions"""
    user_id: str
    role: str = Field(description="Role of the user (doctor/coach/user)")
    permissions: List[str] = Field(description="List of allowed actions")
    access_level: str = Field(description="Level of access (full/summary/limited)")
    expires_at: datetime
