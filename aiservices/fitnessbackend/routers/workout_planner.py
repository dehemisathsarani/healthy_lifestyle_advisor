"""
Complete Workout Planner Router
Handles all workout planner functionality and user data storage
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime

from auth import get_current_user
from workout_planner_models import (
    UserPersonalInfo,
    UserPersonalInfoCreate,
    FitnessGoals,
    FitnessGoalsCreate,
    WorkoutPreferences,
    WorkoutPreferencesCreate,
    GeneratedWorkoutPlan,
    WorkoutPlannerSession,
    WorkoutPlannerSessionCreate
)
from settings import settings
from database import get_database, COLLECTIONS
from fastapi.encoders import jsonable_encoder

router = APIRouter(
    prefix=f"{settings.API_PREFIX}/workout-planner",
    tags=["workout-planner"],
    responses={404: {"description": "Not found"}},
)

@router.post("/personal-info", response_model=UserPersonalInfo)
async def save_personal_info(
    personal_info: UserPersonalInfoCreate,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Save user's personal information from workout planner"""
    
    session = WorkoutPlannerSession(
        id=str(uuid.uuid4()),
        user_id=current_user["id"],
        personal_info=None,
        fitness_goals=None,
        workout_preferences=None
    )
    
    if not settings.DEMO_MODE:
        # Save session to database
        session_doc = jsonable_encoder(session)
        result = await db[COLLECTIONS["workout_planner_sessions"]].insert_one(session_doc)
        
        if not result.inserted_id:
            raise HTTPException(status_code=500, detail="Failed to start workout planner session")
    
    return {
        "session_id": session.id,
        "status": "started",
        "message": "Workout planner session started successfully"
    }


@router.post("/personal-info/{session_id}")
async def save_personal_info(
    session_id: str,
    personal_info_data: dict,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Save user's personal information from workout planner"""
    
    # Create personal info object
    personal_info = UserPersonalInfo(
        id=str(uuid.uuid4()),
        user_id=current_user["id"],
        full_name=personal_info_data.get("full_name", ""),
        age=personal_info_data.get("age", 0),
        gender=personal_info_data.get("gender", ""),
        height_cm=float(personal_info_data.get("height_cm", 0)),
        weight_kg=float(personal_info_data.get("weight_kg", 0)),
        activity_level=personal_info_data.get("activity_level", "moderately_active")
    )
    
    if not settings.DEMO_MODE:
        # Save to personal info collection
        personal_info_doc = jsonable_encoder(personal_info)
        result = await db[COLLECTIONS["user_personal_info"]].insert_one(personal_info_doc)
        
        # Update session with personal info reference
        await db[COLLECTIONS["workout_planner_sessions"]].update_one(
            {"id": session_id, "user_id": current_user["id"]},
            {
                "$set": {
                    "personal_info": personal_info_doc,
                    "steps_completed": ["personal_info"],
                    "last_updated": datetime.utcnow()
                }
            }
        )
        
        if not result.inserted_id:
            raise HTTPException(status_code=500, detail="Failed to save personal information")
    
    return {
        "personal_info_id": personal_info.id,
        "status": "saved",
        "message": "Personal information saved successfully",
        "next_step": "fitness_goals"
    }


@router.post("/fitness-goals/{session_id}")
async def save_fitness_goals(
    session_id: str,
    goals_data: dict,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Save user's fitness goals from workout planner"""
    
    fitness_goals = FitnessGoals(
        id=str(uuid.uuid4()),
        user_id=current_user["id"],
        primary_goal=goals_data.get("primary_goal", "general_fitness"),
        target_weight_kg=goals_data.get("target_weight_kg"),
        target_body_fat_percentage=goals_data.get("target_body_fat_percentage"),
        weekly_workout_frequency=int(goals_data.get("weekly_workout_frequency", 3)),
        session_duration_minutes=int(goals_data.get("session_duration_minutes", 60)),
        preferred_workout_time=goals_data.get("preferred_workout_time", "flexible"),
        available_equipment=goals_data.get("available_equipment", []),
        fitness_level=goals_data.get("fitness_level", "intermediate"),
        injuries_limitations=goals_data.get("injuries_limitations", []),
        preferred_workout_types=goals_data.get("preferred_workout_types", [])
    )
    
    if not settings.DEMO_MODE:
        # Save to fitness goals collection
        goals_doc = jsonable_encoder(fitness_goals)
        result = await db[COLLECTIONS["fitness_goals"]].insert_one(goals_doc)
        
        # Update session
        await db[COLLECTIONS["workout_planner_sessions"]].update_one(
            {"id": session_id, "user_id": current_user["id"]},
            {
                "$set": {
                    "fitness_goals": goals_doc,
                    "last_updated": datetime.utcnow()
                },
                "$addToSet": {"steps_completed": "fitness_goals"}
            }
        )
        
        if not result.inserted_id:
            raise HTTPException(status_code=500, detail="Failed to save fitness goals")
    
    return {
        "fitness_goals_id": fitness_goals.id,
        "status": "saved", 
        "message": "Fitness goals saved successfully",
        "next_step": "workout_preferences"
    }


@router.post("/workout-preferences/{session_id}")
async def save_workout_preferences(
    session_id: str,
    preferences_data: dict,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Save user's workout preferences from workout planner"""
    
    preferences = WorkoutPreferences(
        id=str(uuid.uuid4()),
        user_id=current_user["id"],
        preferred_workout_types=preferences_data.get("preferred_workout_types", []),
        available_equipment=preferences_data.get("available_equipment", []),
        workout_location=preferences_data.get("workout_location", "home"),
        preferred_workout_times=preferences_data.get("preferred_workout_times", []),
        intensity_preference=preferences_data.get("intensity_preference", "moderate"),
        focus_areas=preferences_data.get("focus_areas", []),
        injuries_limitations=preferences_data.get("injuries_limitations", []),
        dislikes_avoid=preferences_data.get("dislikes_avoid", []),
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    
    if not settings.DEMO_MODE:
        # Save to preferences collection
        preferences_doc = jsonable_encoder(preferences)
        result = await db[COLLECTIONS["workout_preferences"]].insert_one(preferences_doc)
        
        # Update session
        await db[COLLECTIONS["workout_planner_sessions"]].update_one(
            {"id": session_id, "user_id": current_user["id"]},
            {
                "$set": {
                    "workout_preferences": preferences_doc,
                    "last_updated": datetime.utcnow()
                },
                "$addToSet": {"steps_completed": "workout_preferences"}
            }
        )
        
        if not result.inserted_id:
            raise HTTPException(status_code=500, detail="Failed to save workout preferences")
    
    return {
        "workout_preferences_id": preferences.id,
        "status": "saved",
        "message": "Workout preferences saved successfully", 
        "next_step": "generate_plan"
    }


@router.post("/generate-plan/{session_id}")
async def generate_workout_plan(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Generate a complete workout plan based on all user inputs"""
    
    if not settings.DEMO_MODE:
        # Get the complete session data
        session_doc = await db[COLLECTIONS["workout_planner_sessions"]].find_one({
            "id": session_id,
            "user_id": current_user["id"]
        })
        
        if not session_doc:
            raise HTTPException(status_code=404, detail="Workout planner session not found")
        
        # Generate workout plan (simplified for demo)
        generated_plan = GeneratedWorkoutPlan(
            id=str(uuid.uuid4()),
            user_id=current_user["id"],
            plan_name=f"Custom Workout Plan - {datetime.now().strftime('%Y-%m-%d')}",
            description="Personalized workout plan based on your preferences",
            user_personal_info_id=session_doc.get("personal_info", {}).get("id", ""),
            fitness_goals_id=session_doc.get("fitness_goals", {}).get("id", ""),
            workout_preferences_id=session_doc.get("workout_preferences", {}).get("id", ""),
            total_weeks=session_doc.get("workout_preferences", {}).get("plan_duration_weeks", 8),
            workouts_per_week=session_doc.get("fitness_goals", {}).get("weekly_workout_frequency", 3),
            estimated_calories_per_session=300,
            difficulty_level=session_doc.get("fitness_goals", {}).get("fitness_level", "intermediate"),
            weekly_schedule={
                "monday": {"workout_type": "strength", "focus": "upper_body"},
                "wednesday": {"workout_type": "cardio", "focus": "endurance"},
                "friday": {"workout_type": "strength", "focus": "lower_body"}
            }
        )
        
        # Save generated plan
        plan_doc = jsonable_encoder(generated_plan)
        result = await db[COLLECTIONS["generated_workout_plans"]].insert_one(plan_doc)
        
        # Complete the session
        await db[COLLECTIONS["workout_planner_sessions"]].update_one(
            {"id": session_id, "user_id": current_user["id"]},
            {
                "$set": {
                    "generated_plan": plan_doc,
                    "completion_status": "completed",
                    "session_completed_at": datetime.utcnow(),
                    "last_updated": datetime.utcnow()
                },
                "$addToSet": {"steps_completed": "plan_generated"}
            }
        )
        
        return {
            "workout_plan_id": generated_plan.id,
            "plan_name": generated_plan.plan_name,
            "total_weeks": generated_plan.total_weeks,
            "workouts_per_week": generated_plan.workouts_per_week,
            "status": "generated",
            "message": "Workout plan generated successfully!"
        }
    
    else:
        # Demo mode response
        return {
            "workout_plan_id": str(uuid.uuid4()),
            "plan_name": "Demo Workout Plan",
            "total_weeks": 8,
            "workouts_per_week": 3,
            "status": "generated",
            "message": "Demo workout plan generated! (Enable database mode for full functionality)"
        }


@router.get("/user-data/{user_id}")
async def get_user_workout_data(
    user_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get all workout planner data for a user"""
    
    if current_user["id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if settings.DEMO_MODE:
        return {"message": "Demo mode - no stored data available"}
    
    # Get all user data
    personal_info = await db[COLLECTIONS["user_personal_info"]].find_one({"user_id": user_id})
    fitness_goals = await db[COLLECTIONS["fitness_goals"]].find_one({"user_id": user_id})
    workout_preferences = await db[COLLECTIONS["workout_preferences"]].find_one({"user_id": user_id})
    
    # Get user's workout plans
    cursor = db[COLLECTIONS["generated_workout_plans"]].find({"user_id": user_id})
    workout_plans = []
    async for plan in cursor:
        workout_plans.append(plan)
    
    return {
        "user_id": user_id,
        "personal_info": personal_info,
        "fitness_goals": fitness_goals,
        "workout_preferences": workout_preferences,
        "workout_plans": workout_plans,
        "total_plans": len(workout_plans)
    }


@router.get("/personal-info", response_model=Optional[UserPersonalInfo])
async def get_personal_info(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get user's personal information"""
    
    user_info_doc = await db[COLLECTIONS["user_personal_info"]].find_one({
        "user_id": current_user["id"]
    })
    
    if not user_info_doc:
        return None
    
    return UserPersonalInfo(**user_info_doc)


@router.get("/fitness-goals", response_model=Optional[FitnessGoals])
async def get_fitness_goals(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get user's fitness goals"""
    
    goals_doc = await db[COLLECTIONS["fitness_goals"]].find_one({
        "user_id": current_user["id"]
    })
    
    if not goals_doc:
        return None
    
    return FitnessGoals(**goals_doc)


@router.get("/workout-preferences", response_model=Optional[WorkoutPreferences])
async def get_workout_preferences(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get user's workout preferences"""
    
    prefs_doc = await db[COLLECTIONS["workout_preferences"]].find_one({
        "user_id": current_user["id"]
    })
    
    if not prefs_doc:
        return None
    
    return WorkoutPreferences(**prefs_doc)


@router.get("/generated-plans", response_model=List[GeneratedWorkoutPlan])
async def get_generated_plans(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get all generated workout plans for the user"""
    
    plans = await db[COLLECTIONS["generated_workout_plans"]].find({
        "user_id": current_user["id"]
    })
    
    result = []
    async for plan_doc in plans:
        result.append(GeneratedWorkoutPlan(**plan_doc))
    
    return result


@router.get("/sessions", response_model=List[WorkoutPlannerSession])
async def get_workout_planner_sessions(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get all workout planner sessions for the user"""
    
    sessions = await db[COLLECTIONS["workout_planner_sessions"]].find({
        "user_id": current_user["id"]
    })
    
    result = []
    async for session_doc in sessions:
        result.append(WorkoutPlannerSession(**session_doc))
    
    return result


@router.get("/complete-profile", response_model=Dict[str, Any])
async def get_complete_user_profile(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get the complete user profile including personal info, goals, and preferences"""
    
    personal_info = await get_personal_info(current_user, db)
    fitness_goals = await get_fitness_goals(current_user, db) 
    workout_prefs = await get_workout_preferences(current_user, db)
    
    return {
        "user_id": current_user["id"],
        "personal_info": personal_info,
        "fitness_goals": fitness_goals,
        "workout_preferences": workout_prefs,
        "profile_completion": {
            "personal_info_completed": personal_info is not None,
            "fitness_goals_completed": fitness_goals is not None,
            "workout_preferences_completed": workout_prefs is not None,
            "overall_completion": all([personal_info, fitness_goals, workout_prefs])
        }
    }