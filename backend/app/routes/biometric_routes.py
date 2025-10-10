"""
Biometric API Routes for comprehensive health profile management
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, Any, Optional, List
from datetime import datetime, date
from ..auth.dependencies import get_current_user
from ..services.biometric_service import biometric_service
from ..models.biometric_models import (
    BiometricProfile,
    ExerciseEntry,
    HydrationEntry,
    WeeklyProgress,
    ActivityLevelEnum
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/biometric", tags=["biometric"])

@router.post("/profile")
async def create_biometric_profile(
    profile_data: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Create a biometric profile for the current user"""
    try:
        user_id = current_user["user_id"]
        result = await biometric_service.create_biometric_profile(user_id, profile_data)
        
        if result["success"]:
            return {
                "message": result["message"],
                "profile": result["data"]
            }
        else:
            raise HTTPException(status_code=400, detail=result["message"])
            
    except Exception as e:
        logger.error(f"❌ Error in create_biometric_profile endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create biometric profile: {str(e)}")

@router.get("/profile")
async def get_biometric_profile(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get biometric profile for the current user"""
    try:
        user_id = current_user["user_id"]
        result = await biometric_service.get_biometric_profile(user_id)
        
        if result["success"]:
            return {
                "profile": result["data"]
            }
        else:
            raise HTTPException(status_code=404, detail=result["message"])
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error in get_biometric_profile endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get biometric profile: {str(e)}")

@router.put("/profile")
async def update_biometric_profile(
    update_data: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Update biometric profile for the current user"""
    try:
        user_id = current_user["user_id"]
        result = await biometric_service.update_biometric_profile(user_id, update_data)
        
        if result["success"]:
            return {
                "message": result["message"],
                "profile": result["data"]
            }
        else:
            raise HTTPException(status_code=400, detail=result["message"])
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error in update_biometric_profile endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update biometric profile: {str(e)}")

@router.post("/exercise")
async def log_exercise(
    exercise_data: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Log an exercise entry"""
    try:
        user_id = current_user["user_id"]
        
        # Ensure date is properly formatted
        if "date" not in exercise_data:
            exercise_data["date"] = datetime.utcnow()
        elif isinstance(exercise_data["date"], str):
            exercise_data["date"] = datetime.fromisoformat(exercise_data["date"].replace('Z', '+00:00'))
        
        result = await biometric_service.log_exercise(user_id, exercise_data)
        
        if result["success"]:
            return {
                "message": result["message"],
                "exercise": result["data"]
            }
        else:
            raise HTTPException(status_code=400, detail=result["message"])
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error in log_exercise endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to log exercise: {str(e)}")

@router.post("/hydration")
async def log_hydration(
    hydration_data: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Log a hydration entry"""
    try:
        user_id = current_user["user_id"]
        
        # Ensure date is properly formatted
        if "date" not in hydration_data:
            hydration_data["date"] = datetime.utcnow()
        elif isinstance(hydration_data["date"], str):
            hydration_data["date"] = datetime.fromisoformat(hydration_data["date"].replace('Z', '+00:00'))
        
        result = await biometric_service.log_hydration(user_id, hydration_data)
        
        if result["success"]:
            return {
                "message": result["message"],
                "hydration": result["data"]
            }
        else:
            raise HTTPException(status_code=400, detail=result["message"])
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error in log_hydration endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to log hydration: {str(e)}")

@router.get("/hydration/daily")
async def get_daily_hydration_summary(
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get daily hydration summary"""
    try:
        user_id = current_user["user_id"]
        result = await biometric_service.get_daily_hydration_summary(user_id, date)
        
        if result["success"]:
            return {
                "hydration_summary": result["data"]
            }
        else:
            raise HTTPException(status_code=400, detail=result["message"])
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error in get_daily_hydration_summary endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get hydration summary: {str(e)}")

@router.get("/exercise/weekly")
async def get_weekly_exercise_summary(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get weekly exercise summary"""
    try:
        user_id = current_user["user_id"]
        result = await biometric_service.get_weekly_exercise_summary(user_id)
        
        if result["success"]:
            return {
                "exercise_summary": result["data"]
            }
        else:
            raise HTTPException(status_code=400, detail=result["message"])
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error in get_weekly_exercise_summary endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get exercise summary: {str(e)}")

@router.post("/progress")
async def create_weekly_progress(
    progress_data: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Create a weekly progress entry"""
    try:
        user_id = current_user["user_id"]
        
        # Ensure week_start_date is properly formatted
        if "week_start_date" not in progress_data:
            # Use the start of current week (Monday)
            today = datetime.utcnow().date()
            week_start = today - timedelta(days=today.weekday())
            progress_data["week_start_date"] = datetime.combine(week_start, datetime.min.time())
        elif isinstance(progress_data["week_start_date"], str):
            progress_data["week_start_date"] = datetime.fromisoformat(progress_data["week_start_date"].replace('Z', '+00:00'))
        
        result = await biometric_service.create_weekly_progress(user_id, progress_data)
        
        if result["success"]:
            return {
                "message": result["message"],
                "progress": result["data"]
            }
        else:
            raise HTTPException(status_code=400, detail=result["message"])
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error in create_weekly_progress endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create weekly progress: {str(e)}")

@router.get("/progress")
async def get_progress_history(
    weeks: int = Query(12, description="Number of weeks to retrieve", ge=1, le=52),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get progress history for the last N weeks"""
    try:
        user_id = current_user["user_id"]
        result = await biometric_service.get_progress_history(user_id, weeks)
        
        if result["success"]:
            return {
                "progress_history": result["data"]
            }
        else:
            raise HTTPException(status_code=400, detail=result["message"])
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error in get_progress_history endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get progress history: {str(e)}")

@router.get("/dashboard")
async def get_comprehensive_dashboard(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get comprehensive health dashboard data"""
    try:
        user_id = current_user["user_id"]
        result = await biometric_service.get_comprehensive_dashboard(user_id)
        
        if result["success"]:
            return {
                "dashboard": result["data"]
            }
        else:
            raise HTTPException(status_code=400, detail=result["message"])
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error in get_comprehensive_dashboard endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get dashboard data: {str(e)}")

@router.get("/calculations/bmi")
async def calculate_bmi(
    height: float = Query(..., description="Height in centimeters", gt=0),
    weight: float = Query(..., description="Weight in kilograms", gt=0)
):
    """Calculate BMI for given height and weight"""
    try:
        from ..models.biometric_models import BiometricCalculations
        
        calculations = BiometricCalculations()
        bmi = calculations.calculate_bmi(weight, height)
        
        # Determine BMI category
        if bmi < 18.5:
            category = "Underweight"
            description = "Below normal weight"
        elif 18.5 <= bmi < 25:
            category = "Normal weight"
            description = "Healthy weight range"
        elif 25 <= bmi < 30:
            category = "Overweight"
            description = "Above normal weight"
        else:
            category = "Obese"
            description = "Significantly above normal weight"
        
        return {
            "bmi": round(bmi, 2),
            "category": category,
            "description": description,
            "height_cm": height,
            "weight_kg": weight
        }
        
    except Exception as e:
        logger.error(f"❌ Error in calculate_bmi endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to calculate BMI: {str(e)}")

@router.get("/calculations/bmr")
async def calculate_bmr(
    weight: float = Query(..., description="Weight in kilograms", gt=0),
    height: float = Query(..., description="Height in centimeters", gt=0),
    age: int = Query(..., description="Age in years", gt=0),
    gender: str = Query(..., description="Gender (male/female)")
):
    """Calculate BMR (Basal Metabolic Rate)"""
    try:
        from ..models.biometric_models import BiometricCalculations
        
        calculations = BiometricCalculations()
        bmr = calculations.calculate_bmr(weight, height, age, gender)
        
        return {
            "bmr": round(bmr, 2),
            "description": "Calories burned at rest per day",
            "weight_kg": weight,
            "height_cm": height,
            "age": age,
            "gender": gender
        }
        
    except Exception as e:
        logger.error(f"❌ Error in calculate_bmr endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to calculate BMR: {str(e)}")

@router.get("/calculations/tdee")
async def calculate_tdee(
    height: float = Query(..., description="Height in centimeters", gt=0),
    weight: float = Query(..., description="Weight in kilograms", gt=0),
    age: int = Query(..., description="Age in years", gt=0),
    gender: str = Query(..., description="Gender (male/female)"),
    activity_level: str = Query(..., description="Activity level (sedentary/light/moderate/active/very_active)"),
    exercise_calories: float = Query(0, description="Additional exercise calories per day", ge=0)
):
    """Calculate TDEE (Total Daily Energy Expenditure) from basic biometric data"""
    try:
        from ..models.biometric_models import BiometricCalculations
        
        calculations = BiometricCalculations()
        
        # First calculate BMR
        bmr = calculations.calculate_bmr(weight, height, age, gender)
        
        # Then calculate TDEE
        tdee = calculations.calculate_tdee(bmr, activity_level, exercise_calories)
        
        return {
            "tdee": round(tdee, 2),
            "bmr": round(bmr, 2),
            "description": "Total calories burned per day including activity",
            "weight_kg": weight,
            "height_cm": height,
            "age": age,
            "gender": gender,
            "activity_level": activity_level,
            "exercise_calories": exercise_calories
        }
        
    except Exception as e:
        logger.error(f"❌ Error in calculate_tdee endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to calculate TDEE: {str(e)}")

@router.get("/calculations/hydration")
async def calculate_hydration_goal(
    weight: float = Query(..., description="Weight in kilograms", gt=0),
    activity_level: str = Query(..., description="Activity level (sedentary/lightly_active/moderately_active/very_active/extra_active)")
):
    """Calculate daily hydration goal"""
    try:
        from ..models.biometric_models import BiometricCalculations
        
        calculations = BiometricCalculations()
        hydration_goal = calculations.calculate_daily_hydration_goal(weight, activity_level)
        
        return {
            "daily_hydration_goal_ml": round(hydration_goal, 0),
            "daily_hydration_goal_liters": round(hydration_goal / 1000, 2),
            "weight_kg": weight,
            "activity_level": activity_level,
            "description": "Recommended daily water intake"
        }
        
    except Exception as e:
        logger.error(f"❌ Error in calculate_hydration_goal endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to calculate hydration goal: {str(e)}")

@router.get("/calculations/macros")
async def calculate_macro_goals(
    calorie_goal: float = Query(..., description="Daily calorie goal", gt=0),
    fitness_goal: str = Query(..., description="Fitness goal (weight_loss/weight_gain/maintenance/muscle_gain)"),
    body_weight: float = Query(..., description="Body weight in kilograms", gt=0)
):
    """Calculate macro nutrient goals"""
    try:
        from ..models.biometric_models import BiometricCalculations
        
        calculations = BiometricCalculations()
        macro_goals = calculations.calculate_macro_goals(calorie_goal, fitness_goal, body_weight)
        
        return {
            "macro_goals": macro_goals,
            "calorie_goal": calorie_goal,
            "fitness_goal": fitness_goal,
            "body_weight_kg": body_weight,
            "description": "Daily macro nutrient targets"
        }
        
    except Exception as e:
        logger.error(f"❌ Error in calculate_macro_goals endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to calculate macro goals: {str(e)}")

# Add import for timedelta at the top
from datetime import timedelta
