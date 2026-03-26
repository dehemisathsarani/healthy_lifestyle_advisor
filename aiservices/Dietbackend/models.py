from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class GenderEnum(str, Enum):
    male = "male"
    female = "female"
    other = "other"

class ActivityLevelEnum(str, Enum):
    sedentary = "sedentary"
    light = "light"
    moderate = "moderate"
    active = "active"
    very_active = "very_active"

class GoalEnum(str, Enum):
    lose_weight = "lose_weight"
    gain_weight = "gain_weight"
    maintain = "maintain"

class MealTypeEnum(str, Enum):
    breakfast = "breakfast"
    lunch = "lunch"
    dinner = "dinner"
    snack = "snack"

class User(BaseModel):
    user_id: str
    email: EmailStr
    name: str
    password: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_active: bool = True

class UserProfile(BaseModel):
    user_id: str
    age: int
    gender: GenderEnum
    height_cm: float
    weight_kg: float
    activity_level: ActivityLevelEnum
    goal: GoalEnum
    dietary_restrictions: List[str] = []
    allergies: List[str] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class NutritionInfo(BaseModel):
    calories: float
    protein: float  # grams
    carbs: float    # grams
    fat: float      # grams
    fiber: Optional[float] = None
    sugar: Optional[float] = None
    sodium: Optional[float] = None
    vitamins: Optional[Dict[str, float]] = {}
    minerals: Optional[Dict[str, float]] = {}

class DetectedFood(BaseModel):
    name: str
    confidence: float
    estimated_portion: str
    nutrition: Optional[NutritionInfo] = None

class DietAdvice(BaseModel):
    recommendation: str
    reasoning: str
    healthier_alternatives: List[str]
    warnings: List[str]
    macro_suggestions: Dict[str, str]
    hydration_reminder: Optional[str] = None

class DietAnalysis(BaseModel):
    request_id: str
    detected_foods: List[DetectedFood]
    total_nutrition: NutritionInfo
    advice: DietAdvice
    analysis_timestamp: datetime
    confidence_score: float

class MealEntry(BaseModel):
    entry_id: Optional[str] = None
    user_id: str
    meal_type: MealTypeEnum
    meal_description: Optional[str] = None
    image_filename: Optional[str] = None
    detected_foods: List[DetectedFood] = []
    total_nutrition: Optional[NutritionInfo] = None
    analysis: Optional[DietAnalysis] = None
    timestamp: datetime
    created_at: Optional[datetime] = None

class HydrationEntry(BaseModel):
    entry_id: Optional[str] = None
    user_id: str
    amount_ml: int
    timestamp: datetime
    date: str  # YYYY-MM-DD format

class DailyNutrition(BaseModel):
    user_id: str
    date: str  # YYYY-MM-DD format
    total_calories: float
    total_protein: float
    total_carbs: float
    total_fat: float
    total_fiber: Optional[float] = None
    total_water_ml: int
    meal_count: int
    goals_met: Dict[str, bool]
    created_at: datetime

class MealPlan(BaseModel):
    plan_id: Optional[str] = None
    user_id: str
    date: str  # YYYY-MM-DD format
    breakfast_plan: Optional[Dict[str, Any]] = None
    lunch_plan: Optional[Dict[str, Any]] = None
    dinner_plan: Optional[Dict[str, Any]] = None
    snack_plans: List[Dict[str, Any]] = []
    total_planned_calories: float
    total_planned_protein: float
    total_planned_carbs: float
    total_planned_fat: float
    created_at: datetime

class UserGoals(BaseModel):
    user_id: str
    daily_calories: float
    daily_protein: float
    daily_carbs: float
    daily_fat: float
    daily_water_ml: int
    weight_goal_kg: Optional[float] = None
    target_date: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

class ProgressEntry(BaseModel):
    entry_id: Optional[str] = None
    user_id: str
    date: str
    weight_kg: Optional[float] = None
    body_fat_percentage: Optional[float] = None
    muscle_mass_kg: Optional[float] = None
    measurements: Optional[Dict[str, float]] = None  # waist, chest, etc.
    energy_level: Optional[int] = None  # 1-10 scale
    mood: Optional[int] = None  # 1-10 scale
    notes: Optional[str] = None
    timestamp: datetime

class Achievement(BaseModel):
    achievement_id: str
    user_id: str
    title: str
    description: str
    category: str  # nutrition, hydration, consistency, etc.
    points: int
    earned_at: datetime
    icon: Optional[str] = None

class NotificationPreference(BaseModel):
    user_id: str
    meal_reminders: bool = True
    hydration_reminders: bool = True
    goal_achievements: bool = True
    weekly_summary: bool = True
    push_notifications: bool = True
    email_notifications: bool = False
    reminder_times: List[str] = []  # HH:MM format

# Response Models
class UserResponse(BaseModel):
    user_id: str
    email: str
    name: str
    created_at: datetime
    is_active: bool

class AuthResponse(BaseModel):
    message: str
    user_id: str
    token: str
    expires_at: datetime

class AnalysisResponse(BaseModel):
    request_id: str
    status: str
    message: str
    estimated_processing_time: Optional[int] = None

class DashboardResponse(BaseModel):
    date: str
    daily_summary: DailyNutrition
    recent_meals: List[MealEntry]
    hydration_status: Dict[str, Any]
    progress_today: Dict[str, float]
    recommendations: List[str]
    achievements_today: List[Achievement]

class ErrorResponse(BaseModel):
    error: str
    detail: str
    timestamp: datetime
    request_id: Optional[str] = None