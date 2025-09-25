from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, List, Optional
from datetime import datetime, timedelta

from auth import get_current_user
from models import DashboardData, WeeklyActivitySummary, FitnessStats, Exercise
from settings import settings
from utils import get_demo_dashboard_data, get_demo_exercises

router = APIRouter(prefix=f"{settings.API_PREFIX}/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardData)
async def get_dashboard_data(current_user: dict = Depends(get_current_user)):
    """Get dashboard data for the current user"""
    if settings.DEMO_MODE:
        # In demo mode, return mock dashboard data
        return get_demo_dashboard_data(current_user["id"])
    
    # In production, we would query the database
    # TODO: Query database for dashboard data
    
    # Mock response for now
    return get_demo_dashboard_data(current_user["id"])


@router.get("/exercises", response_model=List[Exercise])
async def get_exercises(
    muscle_group: Optional[str] = None,
    difficulty: Optional[str] = None,
    equipment: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get exercises with optional filters"""
    exercises = get_demo_exercises()
    
    # Apply filters
    if muscle_group:
        exercises = [e for e in exercises if muscle_group in e.muscle_groups]
    
    if difficulty:
        exercises = [e for e in exercises if e.difficulty.lower() == difficulty.lower()]
    
    if equipment:
        if equipment == "none":
            exercises = [e for e in exercises if not e.equipment]
        else:
            exercises = [e for e in exercises if equipment in e.equipment]
    
    if search:
        search = search.lower()
        exercises = [e for e in exercises if (
            search in e.name.lower() or 
            search in e.description.lower() or 
            any(search in m.lower() for m in e.muscle_groups)
        )]
    
    return exercises


@router.get("/exercises/{exercise_id}", response_model=Exercise)
async def get_exercise(
    exercise_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific exercise by ID"""
    exercises = get_demo_exercises()
    
    for exercise in exercises:
        if exercise.id == exercise_id:
            return exercise
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Exercise with ID {exercise_id} not found"
    )
