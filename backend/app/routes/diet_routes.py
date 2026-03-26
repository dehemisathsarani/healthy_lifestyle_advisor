from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import JSONResponse
from typing import List, Optional
from datetime import datetime, date
import logging
import json

from ..models.diet_models import (
    UserProfile, UserProfileCreate, UserProfileUpdate, UserProfileResponse,
    MealAnalysis, MealAnalysisCreate, DailyNutritionSummary,
    ApiResponse, PaginatedResponse, FoodItem
)
from ..services.diet_service import diet_service

logger = logging.getLogger(__name__)

# Create router for Diet Agent endpoints
router = APIRouter(prefix="/api/diet", tags=["Diet Agent"])

# User Profile Endpoints
@router.post("/profile", response_model=ApiResponse)
async def create_user_profile(profile_data: UserProfileCreate):
    """Create a new user profile for diet tracking"""
    try:
        profile = await diet_service.create_user_profile(profile_data)
        return ApiResponse(
            success=True,
            message="User profile created successfully",
            data=profile.dict()
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating profile: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/profile/{user_id}", response_model=ApiResponse)
async def get_user_profile(user_id: str):
    """Get user profile by ID"""
    try:
        profile = await diet_service.get_user_profile(user_id)
        if not profile:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        return ApiResponse(
            success=True,
            message="User profile retrieved successfully",
            data=profile.dict()
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting profile: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/profile/email/{email}", response_model=ApiResponse)
async def get_user_profile_by_email(email: str):
    """Get user profile by email"""
    try:
        profile = await diet_service.get_user_profile_by_email(email)
        if not profile:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        return ApiResponse(
            success=True,
            message="User profile retrieved successfully",
            data=profile.dict()
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting profile by email: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.put("/profile/{user_id}", response_model=ApiResponse)
async def update_user_profile(user_id: str, profile_data: UserProfileUpdate):
    """Update user profile"""
    try:
        profile = await diet_service.update_user_profile(user_id, profile_data)
        return ApiResponse(
            success=True,
            message="User profile updated successfully",
            data=profile.dict()
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating profile: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Meal Analysis Endpoints
@router.post("/analyze-nutrition", response_model=ApiResponse)
async def analyze_nutrition(
    user_id: str = Form(...),
    text_description: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None)
):
    """Analyze nutrition from image and/or text description"""
    try:
        if not image and not text_description:
            raise HTTPException(
                status_code=400, 
                detail="Either image or text description must be provided"
            )
        
        # For now, we'll use a mock analysis
        # In production, this would call your AI service
        analysis_result = await _mock_nutrition_analysis(text_description, image)
        
        # Save analysis to database
        meal_analysis = MealAnalysisCreate(
            user_id=user_id,
            food_items=analysis_result["food_items"],
            total_calories=analysis_result["total_calories"],
            total_protein=analysis_result["total_protein"],
            total_carbs=analysis_result["total_carbs"],
            total_fat=analysis_result["total_fat"],
            analysis_method="hybrid" if image and text_description else ("image" if image else "text"),
            text_description=text_description,
            confidence_score=analysis_result.get("confidence_score", 0.85)
        )
        
        saved_analysis = await diet_service.save_meal_analysis(meal_analysis)
        
        return ApiResponse(
            success=True,
            message="Nutrition analysis completed successfully",
            data={
                "analysis_id": str(saved_analysis.id),
                "food_items": analysis_result["food_items"],
                "total_calories": analysis_result["total_calories"],
                "total_protein": analysis_result["total_protein"],
                "total_carbs": analysis_result["total_carbs"],
                "total_fat": analysis_result["total_fat"],
                "timestamp": saved_analysis.created_at.isoformat()
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing nutrition: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/meal-history/{user_id}", response_model=PaginatedResponse)
async def get_meal_history(
    user_id: str, 
    limit: int = 50, 
    skip: int = 0
):
    """Get user's meal history with pagination"""
    try:
        meals = await diet_service.get_user_meal_history(user_id, limit, skip)
        
        # Count total meals for pagination
        total_meals = len(meals) + skip  # Simplified for demo
        total_pages = (total_meals + limit - 1) // limit
        
        return PaginatedResponse(
            success=True,
            message="Meal history retrieved successfully",
            data=[meal.dict() for meal in meals],
            total=total_meals,
            page=(skip // limit) + 1,
            per_page=limit,
            total_pages=total_pages
        )
        
    except Exception as e:
        logger.error(f"Error getting meal history: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/daily-meals/{user_id}", response_model=ApiResponse)
async def get_daily_meals(user_id: str, date: str = None):
    """Get meals for a specific day"""
    try:
        if date:
            target_date = datetime.fromisoformat(date)
        else:
            target_date = datetime.utcnow()
            
        meals = await diet_service.get_daily_meals(user_id, target_date)
        
        return ApiResponse(
            success=True,
            message="Daily meals retrieved successfully",
            data=[meal.dict() for meal in meals]
        )
        
    except Exception as e:
        logger.error(f"Error getting daily meals: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Nutrition Summary Endpoints
@router.get("/daily-summary/{user_id}", response_model=ApiResponse)
async def get_daily_nutrition_summary(user_id: str, date: str = None):
    """Get daily nutrition summary"""
    try:
        if date:
            target_date = datetime.fromisoformat(date)
        else:
            target_date = datetime.utcnow()
            
        summary = await diet_service.get_daily_nutrition_summary(user_id, target_date)
        
        if not summary:
            return ApiResponse(
                success=True,
                message="No data found for this date",
                data=None
            )
        
        return ApiResponse(
            success=True,
            message="Daily nutrition summary retrieved successfully",
            data=summary.dict()
        )
        
    except Exception as e:
        logger.error(f"Error getting daily summary: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/nutrition-trends/{user_id}", response_model=ApiResponse)
async def get_nutrition_trends(user_id: str, days: int = 30):
    """Get nutrition trends over specified number of days"""
    try:
        trends = await diet_service.get_nutrition_trends(user_id, days)
        
        return ApiResponse(
            success=True,
            message="Nutrition trends retrieved successfully",
            data=[trend.dict() for trend in trends]
        )
        
    except Exception as e:
        logger.error(f"Error getting nutrition trends: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Health Calculations Endpoint
@router.post("/calculate-health-metrics", response_model=ApiResponse)
async def calculate_health_metrics(
    weight: float,
    height: float,
    age: int,
    gender: str,
    activity_level: str,
    goal: str
):
    """Calculate health metrics (BMI, BMR, TDEE, etc.)"""
    try:
        from ..models.diet_models import HealthCalculations
        
        bmi = HealthCalculations.calculate_bmi(weight, height)
        bmr = HealthCalculations.calculate_bmr(weight, height, age, gender)
        tdee = HealthCalculations.calculate_tdee(bmr, activity_level)
        daily_calorie_goal = HealthCalculations.calculate_calorie_goal(tdee, goal)
        bmi_category = HealthCalculations.get_bmi_category(bmi)
        
        return ApiResponse(
            success=True,
            message="Health metrics calculated successfully",
            data={
                "bmi": bmi,
                "bmi_category": bmi_category,
                "bmr": bmr,
                "tdee": tdee,
                "daily_calorie_goal": daily_calorie_goal
            }
        )
        
    except Exception as e:
        logger.error(f"Error calculating health metrics: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Admin/Utility Endpoints
@router.delete("/profile/{user_id}", response_model=ApiResponse)
async def delete_user_data(user_id: str):
    """Delete all user data (GDPR compliance)"""
    try:
        await diet_service.delete_user_data(user_id)
        
        return ApiResponse(
            success=True,
            message="User data deleted successfully",
            data=None
        )
        
    except Exception as e:
        logger.error(f"Error deleting user data: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Mock Analysis Function (Replace with actual AI service call)
async def _mock_nutrition_analysis(text_description: str, image: UploadFile) -> dict:
    """Mock nutrition analysis - replace with actual AI service"""
    
    # Simple keyword-based analysis for demo
    if text_description:
        description_lower = text_description.lower()
        
        # Sri Lankan food detection
        if 'kottu' in description_lower:
            return {
                "food_items": [
                    {
                        "name": "Kottu Roti",
                        "calories": 450,
                        "protein": 25.0,
                        "carbs": 55.0,
                        "fat": 15.0,
                        "quantity": "1 plate",
                        "confidence": 0.9
                    }
                ],
                "total_calories": 450,
                "total_protein": 25.0,
                "total_carbs": 55.0,
                "total_fat": 15.0,
                "confidence_score": 0.9
            }
        elif 'rice' in description_lower and 'curry' in description_lower:
            return {
                "food_items": [
                    {
                        "name": "Rice and Curry",
                        "calories": 520,
                        "protein": 18.0,
                        "carbs": 75.0,
                        "fat": 16.0,
                        "quantity": "1 plate",
                        "confidence": 0.85
                    }
                ],
                "total_calories": 520,
                "total_protein": 18.0,
                "total_carbs": 75.0,
                "total_fat": 16.0,
                "confidence_score": 0.85
            }
        elif 'burger' in description_lower:
            return {
                "food_items": [
                    {
                        "name": "Chicken Burger",
                        "calories": 540,
                        "protein": 30.0,
                        "carbs": 45.0,
                        "fat": 25.0,
                        "quantity": "1 burger",
                        "confidence": 0.88
                    }
                ],
                "total_calories": 540,
                "total_protein": 30.0,
                "total_carbs": 45.0,
                "total_fat": 25.0,
                "confidence_score": 0.88
            }
    
    # Default response for unknown foods
    return {
        "food_items": [
            {
                "name": "Mixed Meal",
                "calories": 350,
                "protein": 20.0,
                "carbs": 35.0,
                "fat": 12.0,
                "quantity": "1 serving",
                "confidence": 0.7
            }
        ],
        "total_calories": 350,
        "total_protein": 20.0,
        "total_carbs": 35.0,
        "total_fat": 12.0,
        "confidence_score": 0.7
    }
