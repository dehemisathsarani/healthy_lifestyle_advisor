from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, date


class HealthMetric(BaseModel):
    """Base class for all health metrics"""
    user_id: str
    timestamp: datetime
    source: str  # Device or app that provided the data


class HeartRateMetric(HealthMetric):
    """Heart rate data from wearable devices"""
    bpm: int
    activity_state: str  # "rest", "active", "exercise"
    confidence: Optional[float] = None  # Confidence level of the measurement (0-1)


class StepMetric(HealthMetric):
    """Step count data from wearable devices"""
    count: int
    distance_meters: Optional[float] = None
    floors_climbed: Optional[int] = None
    elevation_gain: Optional[float] = None  # In meters


class SleepMetric(HealthMetric):
    """Sleep data from wearable devices"""
    start_time: datetime
    end_time: datetime
    duration_minutes: int
    deep_sleep_minutes: Optional[int] = None
    light_sleep_minutes: Optional[int] = None
    rem_sleep_minutes: Optional[int] = None
    awake_minutes: Optional[int] = None
    sleep_score: Optional[int] = None  # 0-100 score
    interruptions: Optional[int] = None


class CalorieMetric(HealthMetric):
    """Calorie burn data from wearable devices"""
    total: int
    active: Optional[int] = None  # Calories burned during activity
    resting: Optional[int] = None  # Base metabolic rate calories
    activity_type: Optional[str] = None  # Type of activity if applicable


class BloodPressureMetric(HealthMetric):
    """Blood pressure data"""
    systolic: int  # Top number, in mmHg
    diastolic: int  # Bottom number, in mmHg
    pulse: Optional[int] = None  # Pulse rate during measurement


class OxygenSaturationMetric(HealthMetric):
    """Blood oxygen saturation data"""
    percentage: float  # SpO2 percentage
    confidence: Optional[float] = None  # Confidence level of the measurement (0-1)


class DeviceInfo(BaseModel):
    """Information about a connected wearable device"""
    id: str
    name: str
    type: str  # "smartwatch", "fitness_band", "smart_ring", etc.
    manufacturer: str
    model: str
    last_sync: Optional[datetime] = None
    battery_level: Optional[int] = None  # Percentage
    connected: bool = False


class HealthInsight(BaseModel):
    """Generated health insights based on metrics"""
    id: str
    user_id: str
    type: str  # "heart_rate_anomaly", "sleep_quality", "recovery_needed", etc.
    title: str
    description: str
    severity: str  # "info", "low", "medium", "high"
    metrics_referenced: List[str]  # IDs of metrics this insight is based on
    generated_at: datetime
    dismissed: bool = False
    actions: Optional[List[str]] = None  # Suggested actions for the user


class RecoveryAdvice(BaseModel):
    """Generated recovery advice based on health data"""
    id: str
    user_id: str
    title: str
    description: str
    advice_date: date
    
    # Overall recovery metrics
    recovery_score: int  # 0-100 score
    recovery_status: str  # "optimal", "good", "moderate", "needs_recovery"
    factors: Dict[str, float]  # Factors affecting recovery with their scores
    
    # Personalization factors
    workout_intensity_history: Dict[str, int] = {}  # Recent workout intensity by date
    sleep_quality_factor: int = 70  # 0-100
    hrv_trend: str = "stable"  # "declining", "stable", "improving"
    stress_level: int = 50  # 0-100
    
    # Categorized recommendations
    physical_recommendations: List[Dict[str, Any]] = []  # Stretches, mobility, etc.
    mental_recommendations: List[Dict[str, Any]] = []  # Meditation, stress relief
    nutritional_recommendations: List[Dict[str, Any]] = []  # Hydration, nutrients
    sleep_recommendations: List[Dict[str, Any]] = []  # Sleep hygiene tips
    
    # Legacy field for backward compatibility
    suggestions: List[str] = []
    
    # Schedule and timing
    recommended_recovery_windows: List[Dict[str, Any]] = []
    next_workout_recommendation: Dict[str, Any] = {}
    
    # User preference factors
    preferred_recovery_activities: List[str] = []
    available_equipment: List[str] = []
    weather_appropriate_options: List[str] = []
    
    # Summary fields
    priority_recommendations: List[Dict[str, Any]] = []
    expected_recovery_time: str = ""
    
    generated_at: datetime
