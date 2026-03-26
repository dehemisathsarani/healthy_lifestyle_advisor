from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from bson import ObjectId
import logging

from ..core.database import get_database

logger = logging.getLogger(__name__)

# Create router for Diet Agent endpoints  
router = APIRouter(prefix="/api/diet", tags=["Diet Agent"])

# Simple models defined directly in routes for now
class SimpleUserProfile(BaseModel):
    name: str
    email: str
    age: int
    weight: float
    height: float
    gender: str
    activity_level: str
    goal: str

class SimpleFoodItem(BaseModel):
    name: str
    calories: float
    protein: float
    carbs: float
    fat: float
    quantity: str

class SimpleMealAnalysis(BaseModel):
    user_id: str
    food_items: List[SimpleFoodItem]
    total_calories: float
    total_protein: float
    total_carbs: float
    total_fat: float
    analysis_method: str
    meal_type: Optional[str] = None

class ApiResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None
    error: Optional[str] = None
    timestamp: datetime = datetime.utcnow()

# Basic endpoints to test connectivity
@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return ApiResponse(
        success=True,
        message="Diet Agent API is healthy",
        timestamp=datetime.utcnow()
    )

@router.post("/profile")
async def create_profile(profile: SimpleUserProfile):
    """Create user profile and store in MongoDB"""
    try:
        db = get_database()
        
        # Calculate health metrics
        bmi = round(profile.weight / ((profile.height / 100) ** 2), 1)
        
        # Calculate BMR using Mifflin-St Jeor Equation
        if profile.gender.lower() == 'male':
            bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5
        else:
            bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161
        
        # Calculate TDEE
        activity_multipliers = {
            'sedentary': 1.2,
            'lightly_active': 1.375,
            'moderately_active': 1.55,
            'very_active': 1.725,
            'extra_active': 1.9
        }
        tdee = round(bmr * activity_multipliers.get(profile.activity_level, 1.55), 1)
        
        # Calculate calorie goal based on fitness goal
        if profile.goal == 'weight_loss':
            calorie_goal = round(tdee - 500, 1)
        elif profile.goal == 'weight_gain':
            calorie_goal = round(tdee + 500, 1)
        else:
            calorie_goal = round(tdee, 1)
        
        # Prepare profile data for MongoDB
        profile_data = profile.dict()
        profile_data.update({
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "bmi": bmi,
            "bmr": round(bmr, 1),
            "tdee": tdee,
            "daily_calorie_goal": calorie_goal
        })
        
        # Insert into MongoDB
        result = await db.user_profiles.insert_one(profile_data)
        profile_data["_id"] = str(result.inserted_id)
        
        return ApiResponse(
            success=True,
            message="Profile created successfully and stored in MongoDB",
            data=profile_data
        )
    except Exception as e:
        logger.error(f"Error creating profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze")
async def analyze_meal(meal: SimpleMealAnalysis):
    """Analyze meal and store in MongoDB"""
    try:
        db = get_database()
        
        # Prepare meal analysis data for MongoDB
        analysis_data = meal.dict()
        analysis_data.update({
            "created_at": datetime.utcnow(),
            "confidence_score": 0.85,  # Default confidence
            "image_url": None,
            "text_description": f"Meal with {len(meal.food_items)} food items"
        })
        
        # Insert into MongoDB
        result = await db.meal_analyses.insert_one(analysis_data)
        analysis_data["_id"] = str(result.inserted_id)
        
        # Update daily nutrition summary
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Check if daily summary exists
        daily_summary = await db.daily_nutrition.find_one({
            "user_id": meal.user_id,
            "date": {"$gte": today, "$lt": today + timedelta(days=1)}
        })
        
        if daily_summary:
            # Update existing summary
            await db.daily_nutrition.update_one(
                {"_id": daily_summary["_id"]},
                {
                    "$inc": {
                        "total_calories": meal.total_calories,
                        "total_protein": meal.total_protein,
                        "total_carbs": meal.total_carbs,
                        "total_fat": meal.total_fat,
                        "meal_count": 1
                    },
                    "$push": {"meals": str(result.inserted_id)},
                    "$set": {"updated_at": datetime.utcnow()}
                }
            )
        else:
            # Create new daily summary
            await db.daily_nutrition.insert_one({
                "user_id": meal.user_id,
                "date": today,
                "total_calories": meal.total_calories,
                "total_protein": meal.total_protein,
                "total_carbs": meal.total_carbs,
                "total_fat": meal.total_fat,
                "meal_count": 1,
                "meals": [str(result.inserted_id)],
                "calorie_goal": 2000,  # Default, should get from user profile
                "goal_achieved": False,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            })
        
        return ApiResponse(
            success=True,
            message="Meal analyzed and stored in MongoDB successfully",
            data=analysis_data
        )
    except Exception as e:
        logger.error(f"Error analyzing meal: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/profile/{user_id}")
async def get_profile(user_id: str):
    """Get user profile from MongoDB"""
    try:
        db = get_database()
        
        # Try to find by ObjectId first, then by string
        try:
            profile = await db.user_profiles.find_one({"_id": ObjectId(user_id)})
        except:
            # If ObjectId fails, search by user_id as string
            profile = await db.user_profiles.find_one({"user_id": user_id})
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        # Convert ObjectId to string for JSON serialization
        profile["_id"] = str(profile["_id"])
        
        return ApiResponse(
            success=True,
            message="Profile retrieved successfully",
            data=profile
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/meal-history/{user_id}")
async def get_meal_history(user_id: str, limit: int = 50):
    """Get meal history for a user from MongoDB"""
    try:
        db = get_database()
        
        # Get recent meal analyses for the user
        cursor = db.meal_analyses.find(
            {"user_id": user_id}
        ).sort("created_at", -1).limit(limit)
        
        meals = []
        async for meal in cursor:
            meal["_id"] = str(meal["_id"])
            meals.append(meal)
        
        return ApiResponse(
            success=True,
            message=f"Retrieved {len(meals)} meals from history",
            data=meals
        )
    except Exception as e:
        logger.error(f"Error getting meal history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/daily-summary/{user_id}")
async def get_daily_summary(user_id: str, date: str = None):
    """Get daily nutrition summary for a user"""
    try:
        db = get_database()
        
        # Use provided date or today
        if date:
            target_date = datetime.fromisoformat(date).replace(hour=0, minute=0, second=0, microsecond=0)
        else:
            target_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Find daily summary
        summary = await db.daily_nutrition.find_one({
            "user_id": user_id,
            "date": {"$gte": target_date, "$lt": target_date + timedelta(days=1)}
        })
        
        if summary:
            summary["_id"] = str(summary["_id"])
            return ApiResponse(
                success=True,
                message="Daily summary retrieved successfully",
                data=summary
            )
        else:
            # Return empty summary if none exists
            return ApiResponse(
                success=True,
                message="No data for this date",
                data={
                    "user_id": user_id,
                    "date": target_date,
                    "total_calories": 0,
                    "total_protein": 0,
                    "total_carbs": 0,
                    "total_fat": 0,
                    "meal_count": 0,
                    "meals": [],
                    "calorie_goal": 2000,
                    "goal_achieved": False
                }
            )
    except Exception as e:
        logger.error(f"Error getting daily summary: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/meals/{user_id}")
async def get_user_meals(user_id: str, limit: int = 10):
    """Get user meal history"""
    # For now, return mock meal data
    mock_meals = [
        {
            "id": f"meal_{i}",
            "user_id": user_id,
            "total_calories": 450 + (i * 50),
            "total_protein": 25 + (i * 2),
            "total_carbs": 45 + (i * 3),
            "total_fat": 15 + i,
            "meal_type": ["breakfast", "lunch", "dinner", "snack"][i % 4],
            "created_at": datetime.utcnow(),
            "food_items": [
                {
                    "name": f"Food Item {i+1}",
                    "calories": 200 + (i * 25),
                    "protein": 12 + i,
                    "carbs": 20 + (i * 2),
                    "fat": 8 + i,
                    "quantity": "1 serving"
                }
            ]
        }
        for i in range(min(limit, 5))
    ]
    
    return ApiResponse(
        success=True,
        message=f"Retrieved {len(mock_meals)} meals",
        data=mock_meals
    )
