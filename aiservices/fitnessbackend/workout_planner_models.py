"""
Enhanced Models for Workout Planner Data Storage
This file contains all the models needed for storing user workout planner data
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid


class UserPersonalInfoCreate(BaseModel):
    """Personal information for creating new user profile"""
    full_name: str
    age: int
    gender: str  # "male", "female", "other"
    height_cm: float
    weight_kg: float
    activity_level: str  # "sedentary", "lightly_active", "moderately_active", "very_active"


class UserPersonalInfo(UserPersonalInfoCreate):
    """Personal information collected during workout planning"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class FitnessGoalsCreate(BaseModel):
    """Fitness goals for creating new profile"""
    primary_goal: str  # "weight_loss", "muscle_gain", "endurance", "strength", "general_fitness"
    target_weight_kg: Optional[float] = None
    target_body_fat_percentage: Optional[float] = None
    weekly_workout_frequency: int  # 2-7 days per week
    session_duration_minutes: int  # 30-120 minutes
    preferred_workout_time: str  # "morning", "afternoon", "evening", "flexible"
    available_equipment: List[str] = []  # "dumbbells", "barbell", "resistance_bands", etc.
    fitness_level: str  # "beginner", "intermediate", "advanced"
    injuries_limitations: List[str] = []
    preferred_workout_types: List[str] = []  # "cardio", "strength", "yoga", "pilates", etc.


class FitnessGoals(FitnessGoalsCreate):
    """User's fitness goals and preferences"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class WorkoutPreferencesCreate(BaseModel):
    """Workout preferences for creating new profile"""
    plan_duration_weeks: int
    focus_areas: List[str]  # "upper_body", "lower_body", "core", "full_body"
    difficulty_progression: str  # "gradual", "moderate", "aggressive"
    rest_day_preferences: Dict[str, Any] = {}
    nutrition_integration: bool = False
    progress_tracking_preferences: List[str] = []


class WorkoutPreferences(WorkoutPreferencesCreate):
    """Detailed workout plan preferences from the planner"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class GeneratedWorkoutPlan(BaseModel):
    """Complete workout plan generated for the user"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    plan_name: str
    description: str
    
    # References to user data
    user_personal_info_id: str
    fitness_goals_id: str
    workout_preferences_id: str
    
    # Plan details
    total_weeks: int
    workouts_per_week: int
    estimated_calories_per_session: int
    difficulty_level: str
    
    # Workout schedule
    weekly_schedule: Dict[str, Any] = {}  # Day-by-day workout plan
    exercises: List[Dict[str, Any]] = []
    progression_milestones: List[Dict[str, Any]] = []
    
    # Metadata
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True
    completion_percentage: float = 0.0


class WorkoutPlannerSessionCreate(BaseModel):
    """Create new workout planner session"""
    personal_info: UserPersonalInfoCreate
    fitness_goals: FitnessGoalsCreate
    workout_preferences: WorkoutPreferencesCreate


class WorkoutPlannerSession(BaseModel):
    """Complete session data from workout planner interaction"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    session_started_at: datetime = Field(default_factory=datetime.utcnow)
    session_completed_at: Optional[datetime] = None
    
    # All collected data
    personal_info: UserPersonalInfo
    fitness_goals: FitnessGoals
    workout_preferences: WorkoutPreferences
    generated_plan: Optional[GeneratedWorkoutPlan] = None
    
    # Session metadata
    planner_version: str = "1.0"
    completion_status: str = "in_progress"  # "in_progress", "completed", "abandoned"
    steps_completed: List[str] = []
    total_time_spent_minutes: Optional[int] = None