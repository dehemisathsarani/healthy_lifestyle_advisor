from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
import uuid
from datetime import datetime
from fastapi.encoders import jsonable_encoder

from auth import get_current_user
from models import Exercise, Workout, WorkoutPlan, WorkoutPlanCreate, WorkoutPlanBase, WorkoutPlanRequest, WorkoutHistoryEntry
from settings import settings
from database import get_database, COLLECTIONS
from utils import get_demo_exercises, get_demo_workout_plan, generate_workout_plan

router = APIRouter(prefix=f"{settings.API_PREFIX}/workouts", tags=["workouts"])


@router.post("/plans", response_model=WorkoutPlan)
async def create_workout_plan(
    plan_request: WorkoutPlanRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Generate a new workout plan based on user preferences"""
    if settings.DEMO_MODE:
        # In demo mode, generate a mock workout plan
        return generate_workout_plan(plan_request, current_user["id"])
    
    # Generate workout plan
    workout_plan = generate_workout_plan(plan_request, current_user["id"])
    
    # Save to workout plans collection in health database
    workout_plan_doc = jsonable_encoder(workout_plan)
    result = await db[COLLECTIONS["workout_plans"]].insert_one(workout_plan_doc)
    
    if not result.inserted_id:
        raise HTTPException(status_code=500, detail="Failed to create workout plan")
    
    return workout_plan


@router.get("/plans/{plan_id}", response_model=WorkoutPlan)
async def get_workout_plan(
    plan_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get a specific workout plan by ID"""
    if settings.DEMO_MODE:
        # In demo mode, return a mock workout plan
        mock_plan = get_demo_workout_plan(current_user["id"])
        if mock_plan.id != plan_id:
            mock_plan.id = plan_id  # Just for demo purposes
        return mock_plan
    
    # Query workout plans collection in health database for the specific plan
    workout_plan_doc = await db[COLLECTIONS["workout_plans"]].find_one({
        "id": plan_id,
        "user_id": current_user["id"]
    })
    
    if not workout_plan_doc:
        raise HTTPException(status_code=404, detail="Workout plan not found")
    
    return WorkoutPlan(**workout_plan_doc)


@router.get("/plans", response_model=List[WorkoutPlan])
async def list_workout_plans(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """List all workout plans for the current user"""
    if settings.DEMO_MODE:
        # In demo mode, return mock workout plans
        mock_plan = get_demo_workout_plan(current_user["id"])
        mock_plan2 = get_demo_workout_plan(current_user["id"])
        mock_plan2.id = str(uuid.uuid4())
        mock_plan2.name = "Endurance Training Program"
        mock_plan2.goal = "endurance"
        return [mock_plan, mock_plan2]
    
    # Query workout plans collection in health database for all user's plans
    cursor = db[COLLECTIONS["workout_plans"]].find({
        "user_id": current_user["id"]
    })
    workout_plans = []
    async for doc in cursor:
        workout_plans.append(WorkoutPlan(**doc))
    
    return workout_plans


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
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Record a completed workout"""
    if settings.DEMO_MODE:
        # In demo mode, just return success
        return {"status": "success", "message": "Workout recorded successfully"}
    
    # Create workout history entry
    workout_history = WorkoutHistoryEntry(
        id=str(uuid.uuid4()),
        user_id=current_user["id"],
        workout_id=workout_data.get("workout_id", ""),
        workout_plan_id=workout_data.get("workout_plan_id", ""),
        completed_at=datetime.utcnow(),
        duration=workout_data.get("duration", 0),
        calories_burned=workout_data.get("calories_burned", 0),
        exercises_completed=workout_data.get("exercises_completed", 0),
        rating=workout_data.get("rating"),
        notes=workout_data.get("notes")
    )
    
    # Save to workout history collection in health database
    history_doc = jsonable_encoder(workout_history)
    result = await db[COLLECTIONS["workout_history"]].insert_one(history_doc)
    
    if not result.inserted_id:
        raise HTTPException(status_code=500, detail="Failed to record workout")
    
    return {"status": "success", "message": "Workout recorded successfully", "id": workout_history.id}
