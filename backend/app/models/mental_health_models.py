"""
Mental Health Models for MongoDB
Stores mood entries, interventions, and user mental health data
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId


class MoodEntryModel(BaseModel):
    """Model for mood entry stored in MongoDB"""
    id: Optional[str] = Field(alias="_id", default=None)
    user_id: str
    rating: int  # 1-5 scale
    type: str  # happy, sad, anxious, angry, neutral, excited, stressed, calm, overwhelmed, content
    notes: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    mood_emoji: Optional[str] = None
    energy_level: Optional[int] = None  # 1-10
    stress_level: Optional[int] = None  # 1-10
    interventions: Optional[List[str]] = []  # List of intervention IDs

    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)


class InterventionModel(BaseModel):
    """Model for intervention history stored in MongoDB"""
    id: Optional[str] = Field(alias="_id", default=None)
    user_id: str
    mood_entry_id: str  # Reference to mood entry
    type: str  # music, meditation, exercise, games, breathing, journaling, joke, image, youtube
    details: Dict[str, Any]  # Specific intervention details
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    effectiveness: Optional[str] = None  # helpful, somewhat_helpful, not_helpful, helped
    feedback: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)


class UserMentalHealthProfileModel(BaseModel):
    """Model for user mental health profile stored in MongoDB"""
    id: Optional[str] = Field(alias="_id", default=None)
    user_id: str
    name: str
    email: str
    phone: Optional[str] = None
    preferences: Dict[str, Any] = {
        "interventions": [],
        "musicGenres": [],
        "exerciseTypes": []
    }
    goals: List[str] = []
    emergency_contacts: List[Dict[str, str]] = []
    risk_level: str = "low"  # low, medium, high
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)


class MoodAnalyticsModel(BaseModel):
    """Model for mood analytics/insights"""
    user_id: str
    date_range: Dict[str, datetime]
    total_entries: int
    average_mood_rating: float
    average_energy_level: float
    average_stress_level: float
    most_common_mood: str
    mood_distribution: Dict[str, int]
    intervention_effectiveness: Dict[str, Dict[str, int]]
    trends: Dict[str, Any]


class MoodActivityModel(BaseModel):
    """Model for activities within a mood log"""
    id: str
    type: str  # joke, quote, image, music, game
    content: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)


class EnhancedMoodLogModel(BaseModel):
    """Model for enhanced mood logs with activities - stores in MongoDB"""
    id: Optional[str] = Field(alias="_id", default=None)
    user_id: str
    mood_type: str  # happy, sad, anxious, stressed, angry, excited, calm, overwhelmed, neutral, content
    mood: str  # positive or negative
    rating: int  # 1-10 scale
    description: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    activities: List[MoodActivityModel] = []
    factors: List[str] = []  # Contributing factors to the mood
    
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)
