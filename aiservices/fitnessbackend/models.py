from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class UserProfileBase(BaseModel):
    name: str
    age: int
    gender: str
    height_cm: float
    weight_kg: float
    fitness_level: str
    fitness_goal: str


class UserProfileCreate(UserProfileBase):
    user_id: str


class UserProfile(UserProfileBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class Exercise(BaseModel):
    id: str
    name: str
    description: str
    difficulty: str
    type: str
    muscle_groups: List[str]
    equipment: List[str]
    instructions: List[str]
    recommended_sets: Optional[int] = None
    recommended_reps: Optional[int] = None
    recommended_rest: Optional[int] = None
    calories_per_min: float
    image_url: Optional[str] = None
    video_url: Optional[str] = None


class WorkoutExercise(BaseModel):
    exercise: Exercise
    sets_reps: Optional[str] = None
    duration: Optional[int] = None  # in seconds
    
    
class Workout(BaseModel):
    id: str
    name: str
    focus: str
    total_duration: int  # in minutes
    total_calories: int
    rest_day: bool = False
    exercises: List[WorkoutExercise] = []
    instructions: Optional[str] = None


class WorkoutPlanBase(BaseModel):
    name: str
    description: str
    goal: str
    difficulty: str
    duration_weeks: int
    workouts_per_week: int
    focus_areas: List[str]


class WorkoutPlanCreate(WorkoutPlanBase):
    user_id: str
    workouts: List[Workout] = []


class WorkoutPlan(WorkoutPlanBase):
    id: str
    user_id: str
    workouts: List[Workout] = []
    created_at: datetime
    
    class Config:
        from_attributes = True


class WorkoutHistoryEntry(BaseModel):
    id: str
    user_id: str
    workout_id: str
    workout_plan_id: str
    completed_at: datetime
    duration: int  # in minutes
    calories_burned: int
    exercises_completed: int
    rating: Optional[int] = None
    notes: Optional[str] = None


class WorkoutPlanRequest(BaseModel):
    goal: str
    fitness_level: str = "intermediate"
    duration_weeks: int = 4
    frequency: int = 3  # workouts per week
    preferences: dict = {}
    

class WeeklyActivitySummary(BaseModel):
    date: str
    calories_burned: int
    minutes_active: int
    workouts_completed: int


class FitnessStats(BaseModel):
    workout_consistency: float  # percentage
    

class DashboardData(BaseModel):
    active_plan: Optional[WorkoutPlan] = None
    upcoming_workout: Optional[Workout] = None
    workout_streak: int
    total_workouts_completed: int
    total_calories_burned: int
    weekly_activity_summary: List[WeeklyActivitySummary]
    fitness_stats: FitnessStats
