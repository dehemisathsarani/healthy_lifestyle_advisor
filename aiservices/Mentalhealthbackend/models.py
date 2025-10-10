from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class MoodTypeEnum(str, Enum):
    happy = "happy"
    sad = "sad"
    anxious = "anxious"
    angry = "angry"
    neutral = "neutral"
    excited = "excited"
    stressed = "stressed"
    calm = "calm"
    overwhelmed = "overwhelmed"
    content = "content"

class InterventionTypeEnum(str, Enum):
    music = "music"
    meditation = "meditation"
    exercise = "exercise"
    games = "games"
    breathing = "breathing"
    journaling = "journaling"
    joke = "joke"
    image = "image"
    youtube = "youtube"
    therapy = "therapy"

class EffectivenessEnum(str, Enum):
    helpful = "helpful"
    somewhat_helpful = "somewhat_helpful"
    not_helpful = "not_helpful"
    helped = "helped"

class User(BaseModel):
    user_id: str
    name: str
    email: EmailStr
    phone: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserMentalHealthProfile(BaseModel):
    user_id: str
    name: str
    email: EmailStr
    phone: Optional[str] = None
    preferences: Dict[str, Any] = {
        "interventions": [],
        "musicGenres": [],
        "meditationTypes": [],
        "gamePreferences": [],
        "therapyTopics": []
    }
    emergency_contacts: List[Dict[str, str]] = []
    crisis_plan: Optional[str] = None
    mental_health_goals: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class MoodEntry(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    user_id: str
    rating: int  # 1-5 scale
    type: MoodTypeEnum
    notes: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    mood_emoji: Optional[str] = None
    energy_level: Optional[int] = None  # 1-10
    stress_level: Optional[int] = None  # 1-10
    interventions: Optional[List[str]] = []  # List of intervention IDs
    triggers: Optional[List[str]] = []
    location: Optional[str] = None
    weather: Optional[str] = None
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

class InterventionHistory(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    user_id: str
    mood_entry_id: str  # Reference to mood entry
    type: InterventionTypeEnum
    details: Dict[str, Any]  # Specific intervention details
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    effectiveness: Optional[EffectivenessEnum] = None
    feedback: Optional[str] = None
    duration: Optional[int] = None  # Duration in minutes
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

class MoodAnalysis(BaseModel):
    mood_entry_id: str
    detected_mood: str
    confidence: float
    emotional_analysis: Dict[str, Any]
    recommendations: List[str]
    crisis_indicators: List[str] = []
    risk_level: str = "low"  # low, medium, high, crisis
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class MeditationSession(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    user_id: str
    type: str  # breathing, mindfulness, guided, body-scan, visualization, nature-sounds
    title: str
    duration: int  # Duration in minutes
    completed: bool = False
    progress: int = 0  # Progress percentage
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    effectiveness_rating: Optional[int] = None  # 1-5 scale
    notes: Optional[str] = None
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

class TherapySession(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    user_id: str
    session_type: str  # individual, group, cbt, dbt, etc.
    therapist_id: Optional[str] = None
    date: datetime
    duration: int  # Duration in minutes
    topics_discussed: List[str] = []
    mood_before: Optional[int] = None  # 1-10 scale
    mood_after: Optional[int] = None  # 1-10 scale
    session_notes: Optional[str] = None
    homework_assigned: Optional[str] = None
    next_session_date: Optional[datetime] = None
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

class CrisisAlert(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    user_id: str
    mood_entry_id: Optional[str] = None
    alert_type: str  # suicide_risk, self_harm, severe_depression, panic_attack
    risk_level: str  # medium, high, crisis
    triggered_by: str  # mood_analysis, user_report, emergency_contact
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    response_actions: List[str] = []
    resolved: bool = False
    resolved_at: Optional[datetime] = None
    emergency_contacts_notified: bool = False
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

class MentalHealthGoal(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    user_id: str
    goal_type: str  # mood_improvement, stress_reduction, anxiety_management, etc.
    title: str
    description: str
    target_value: Optional[float] = None
    current_value: Optional[float] = None
    unit: Optional[str] = None  # days, sessions, rating, etc.
    deadline: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed: bool = False
    completed_at: Optional[datetime] = None
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

class DailyMoodSummary(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    user_id: str
    date: datetime
    mood_entries_count: int
    average_mood_rating: float
    dominant_mood: str
    mood_variance: float
    interventions_used: List[str] = []
    mood_trend: str  # improving, declining, stable
    summary_notes: Optional[str] = None
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True