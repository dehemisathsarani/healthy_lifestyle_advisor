from pydantic import BaseModel, Field
from typing import Dict, Optional, List
from datetime import datetime
from enum import Enum

class PrivacyLevel(str, Enum):
    BASIC = "basic"
    STANDARD = "standard"
    STRICT = "strict"

class BackupLocation(str, Enum):
    CLOUD = "cloud"
    LOCAL = "local"
    BOTH = "both"

class BackupFrequency(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"

class DataSharingPreferences(BaseModel):
    analytics: bool = Field(default=False)
    marketing: bool = Field(default=False)
    research: bool = Field(default=False)
    third_party: bool = Field(default=False)

class BackupPreferences(BaseModel):
    frequency: BackupFrequency = Field(default=BackupFrequency.WEEKLY)
    location: BackupLocation = Field(default=BackupLocation.CLOUD)
    encryption: bool = Field(default=True)

class NotificationPreferences(BaseModel):
    security_alerts: bool = Field(default=True)
    privacy_updates: bool = Field(default=True)
    data_reports: bool = Field(default=False)

class SecurityProfile(BaseModel):
    user_id: str
    privacy_level: PrivacyLevel = Field(default=PrivacyLevel.STANDARD)
    data_sharing: DataSharingPreferences
    backup_preferences: BackupPreferences
    notification_preferences: NotificationPreferences
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class HealthData(BaseModel):
    user_id: str
    data_type: str  # diet, fitness, mental_health
    content: Dict
    encrypted: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class HealthDataExport(BaseModel):
    user_id: str
    data_types: List[str]
    from_date: Optional[datetime] = None
    to_date: Optional[datetime] = None

class DataDeletionRequest(BaseModel):
    user_id: str
    delete_all: bool = False
    data_types: Optional[List[str]] = None
