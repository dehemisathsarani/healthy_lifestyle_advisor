from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
import uuid
from datetime import datetime

from auth import get_current_user
from models import Exercise, Workout, WorkoutPlan, WorkoutPlanCreate, WorkoutPlanBase, WorkoutPlanRequest
from settings import settings
from utils import get_demo_exercises, get_demo_workout_plan, generate_workout_plan

router = APIRouter(prefix=f"{settings.API_PREFIX}/workouts", tags=["workouts"])


@router.post("/plans", response_model=WorkoutPlan)
async def create_workout_plan(
    plan_request: WorkoutPlanRequest,
    current_user: dict = Depends(get_current_user)
):
    """Generate a new workout plan based on user preferences"""
    if settings.DEMO_MODE:
        # In demo mode, generate a mock workout plan
        return generate_workout_plan(plan_request, current_user["id"])
    
    # In production, we would save to the database
    # TODO: Generate and save workout plan to database
    
    # For now, return a mock plan
    return generate_workout_plan(plan_request, current_user["id"])


@router.get("/plans/{plan_id}", response_model=WorkoutPlan)
async def get_workout_plan(
    plan_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific workout plan by ID"""
    if settings.DEMO_MODE:
        # In demo mode, return a mock workout plan
        mock_plan = get_demo_workout_plan(current_user["id"])
        if mock_plan.id != plan_id:
            mock_plan.id = plan_id  # Just for demo purposes
        return mock_plan
    
    # In production, we would query the database
    # TODO: Query database for workout plan
    
    # Mock response for now
    mock_plan = get_demo_workout_plan(current_user["id"])
    if mock_plan.id != plan_id:
        mock_plan.id = plan_id  # Just for demo purposes
    return mock_plan


@router.get("/plans", response_model=List[WorkoutPlan])
async def list_workout_plans(current_user: dict = Depends(get_current_user)):
    """List all workout plans for the current user"""
    if settings.DEMO_MODE:
        # In demo mode, return mock workout plans
        mock_plan = get_demo_workout_plan(current_user["id"])
        mock_plan2 = get_demo_workout_plan(current_user["id"])
        mock_plan2.id = str(uuid.uuid4())
        mock_plan2.name = "Endurance Training Program"
        mock_plan2.goal = "endurance"
        return [mock_plan, mock_plan2]
    
    # In production, we would query the database
    # TODO: Query database for workout plans
    
    # Mock response for now
    mock_plan = get_demo_workout_plan(current_user["id"])
    mock_plan2 = get_demo_workout_plan(current_user["id"])
    mock_plan2.id = str(uuid.uuid4())
    mock_plan2.name = "Endurance Training Program"
    mock_plan2.goal = "endurance"
    return [mock_plan, mock_plan2]


@router.get("/plans/active", response_model=Optional[WorkoutPlan])
async def get_active_workout_plan(current_user: dict = Depends(get_current_user)):
    """Get the user's active workout plan"""
    if settings.DEMO_MODE:
        # In demo mode, return a mock active workout plan
        return get_demo_workout_plan(current_user["id"])
    
    # In production, we would query the database
    # TODO: Query database for active workout plan
    
    # Mock response for now
    return get_demo_workout_plan(current_user["id"])


@router.post("/plans/{plan_id}/activate")
async def activate_workout_plan(
    plan_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Set a workout plan as the active plan"""
    if settings.DEMO_MODE:
        # In demo mode, just return success
        return {"status": "success", "message": f"Workout plan {plan_id} activated"}
    
    # In production, we would update the database
    # TODO: Update active workout plan in database
    
    return {"status": "success", "message": f"Workout plan {plan_id} activated"}


@router.post("/complete")
async def complete_workout(
    workout_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Record a completed workout"""
    if settings.DEMO_MODE:
        # In demo mode, just return success
        return {"status": "success", "message": "Workout recorded successfully"}
    
    # In production, we would save to the database
    # TODO: Save completed workout to database
    
    return {"status": "success", "message": "Workout recorded successfully"}
