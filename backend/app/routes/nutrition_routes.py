from fastapi import APIRouter, HTTPException, Depends, Query, status
from fastapi.responses import JSONResponse
from typing import List, Optional
from datetime import datetime, timedelta
import logging

from ..auth.dependencies import get_current_user
from ..models.nutrition_models import (
    NutritionLog, NutritionLogCreate, NutritionLogUpdate,
    WeeklyReport, WeeklyReportRequest, DailyNutritionSummary,
    UserNutritionPreferences, FoodAnalysisRequest, FoodAnalysisResponse,
    ApiResponse, PaginatedNutritionLogs, NutritionData, FoodItem,
    NutritionCalculations
)
from ..services.nutrition_service import nutrition_service

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/nutrition",
    tags=["Advanced Nutrition Hub"],
    responses={404: {"description": "Not found"}}
)

# Food Analysis Endpoints
@router.post("/analyze", response_model=FoodAnalysisResponse)
async def analyze_food(
    request: FoodAnalysisRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Analyze food from text input or image
    """
    try:
        user_id = current_user.get("user_id") or current_user.get("sub")
        
        if not request.text_input and request.analysis_method != "image":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Text input is required for text analysis"
            )
        
        # Simple Sri Lankan food database for text analysis
        food_database = {
            'rice': {'calories': 130, 'protein': 2.7, 'carbs': 28, 'fat': 0.3, 'fiber': 0.4},
            'chicken curry': {'calories': 165, 'protein': 12, 'carbs': 6.7, 'fat': 10, 'fiber': 1.2},
            'dhal curry': {'calories': 120, 'protein': 7, 'carbs': 15, 'fat': 5, 'fiber': 3.5},
            'kottu': {'calories': 280, 'protein': 15, 'carbs': 35, 'fat': 8, 'fiber': 2.1},
            'hoppers': {'calories': 95, 'protein': 2, 'carbs': 18, 'fat': 1.5, 'fiber': 0.8},
            'string hoppers': {'calories': 110, 'protein': 2.5, 'carbs': 22, 'fat': 1, 'fiber': 1.2},
            'fish curry': {'calories': 140, 'protein': 18, 'carbs': 4, 'fat': 6, 'fiber': 0.5},
            'milk rice': {'calories': 200, 'protein': 4, 'carbs': 35, 'fat': 5, 'fiber': 1.0},
            'pol sambol': {'calories': 80, 'protein': 1, 'carbs': 3, 'fat': 8, 'fiber': 2.0},
            'papadum': {'calories': 45, 'protein': 2, 'carbs': 6, 'fat': 1.5, 'fiber': 1.0},
            'vegetable curry': {'calories': 90, 'protein': 3, 'carbs': 12, 'fat': 4, 'fiber': 4.0},
            'roti': {'calories': 150, 'protein': 4, 'carbs': 30, 'fat': 2, 'fiber': 2.0}
        }
        
        food_items = []
        
        if request.analysis_method == "text" and request.text_input:
            # Parse text input
            foods = request.text_input.lower().split(',')
            foods = [food.strip() for food in foods if food.strip()]
            
            for food in foods:
                # Simple fuzzy matching
                matched_food = None
                for key in food_database.keys():
                    if key in food or food in key:
                        matched_food = (key, food_database[key])
                        break
                
                if matched_food:
                    name, nutrition = matched_food
                    food_items.append(FoodItem(
                        name=name.title(),
                        quantity="1 serving",
                        nutrition=NutritionData(**nutrition),
                        confidence=0.85,
                        sri_lankan_food=True,
                        food_category=name.split()[-1] if 'curry' in name else 'staple'
                    ))
                else:
                    # Unknown food
                    food_items.append(FoodItem(
                        name=food.title(),
                        quantity="1 serving",
                        nutrition=NutritionData(calories=0, protein=0, carbs=0, fat=0),
                        confidence=0.3,
                        sri_lankan_food=False
                    ))
        
        elif request.analysis_method == "image":
            # Mock image analysis results
            food_items = [
                FoodItem(
                    name="Rice",
                    quantity="200g",
                    nutrition=NutritionData(calories=260, protein=5, carbs=55, fat=1),
                    confidence=0.92,
                    sri_lankan_food=True
                ),
                FoodItem(
                    name="Chicken Curry",
                    quantity="150g",
                    nutrition=NutritionData(calories=250, protein=18, carbs=10, fat=15),
                    confidence=0.88,
                    sri_lankan_food=True
                )
            ]
        
        # Calculate total nutrition
        total_nutrition = NutritionCalculations.calculate_total_nutrition(food_items)
        
        # Generate AI insights
        ai_insights = NutritionCalculations.generate_ai_insights(total_nutrition)
        
        # Calculate overall confidence score
        confidence_score = sum(item.confidence or 0.5 for item in food_items) / len(food_items) if food_items else 0.0
        
        return FoodAnalysisResponse(
            success=True,
            food_items=food_items,
            total_nutrition=total_nutrition,
            ai_insights=ai_insights,
            confidence_score=round(confidence_score, 2),
            analysis_method=request.analysis_method
        )
        
    except Exception as e:
        logger.error(f"Error in food analysis: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to analyze food"
        )

# Nutrition Logs Endpoints
@router.post("/logs", response_model=ApiResponse)
async def create_nutrition_log(
    log_data: NutritionLogCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new nutrition log entry
    """
    try:
        user_id = current_user.get("user_id") or current_user.get("sub")
        
        nutrition_log = await nutrition_service.create_nutrition_log(user_id, log_data)
        
        if nutrition_log:
            return ApiResponse(
                success=True,
                message="Nutrition log created successfully",
                data=nutrition_log.dict()
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create nutrition log"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating nutrition log: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create nutrition log"
        )

@router.get("/logs", response_model=PaginatedNutritionLogs)
async def get_nutrition_logs(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(10, ge=1, le=100, description="Items per page"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get paginated nutrition logs for the current user
    """
    try:
        user_id = current_user.get("user_id") or current_user.get("sub")
        
        result = await nutrition_service.get_nutrition_logs(
            user_id=user_id,
            page=page,
            per_page=per_page,
            start_date=start_date,
            end_date=end_date
        )
        
        return PaginatedNutritionLogs(
            success=True,
            message="Nutrition logs retrieved successfully",
            logs=result["logs"],
            total=result["total"],
            page=result["page"],
            per_page=result["per_page"],
            total_pages=result["total_pages"]
        )
        
    except Exception as e:
        logger.error(f"Error getting nutrition logs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve nutrition logs"
        )

@router.get("/logs/{log_id}", response_model=ApiResponse)
async def get_nutrition_log(
    log_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get a specific nutrition log by ID
    """
    try:
        user_id = current_user.get("user_id") or current_user.get("sub")
        
        nutrition_log = await nutrition_service.get_nutrition_log_by_id(user_id, log_id)
        
        if nutrition_log:
            return ApiResponse(
                success=True,
                message="Nutrition log retrieved successfully",
                data=nutrition_log.dict()
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Nutrition log not found"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting nutrition log: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve nutrition log"
        )

@router.put("/logs/{log_id}", response_model=ApiResponse)
async def update_nutrition_log(
    log_id: str,
    update_data: NutritionLogUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update a nutrition log
    """
    try:
        user_id = current_user.get("user_id") or current_user.get("sub")
        
        nutrition_log = await nutrition_service.update_nutrition_log(user_id, log_id, update_data)
        
        if nutrition_log:
            return ApiResponse(
                success=True,
                message="Nutrition log updated successfully",
                data=nutrition_log.dict()
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Nutrition log not found or update failed"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating nutrition log: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update nutrition log"
        )

@router.delete("/logs/{log_id}", response_model=ApiResponse)
async def delete_nutrition_log(
    log_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a nutrition log
    """
    try:
        user_id = current_user.get("user_id") or current_user.get("sub")
        
        success = await nutrition_service.delete_nutrition_log(user_id, log_id)
        
        if success:
            return ApiResponse(
                success=True,
                message="Nutrition log deleted successfully"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Nutrition log not found"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting nutrition log: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete nutrition log"
        )

# Daily Summary Endpoints
@router.get("/daily-summary", response_model=ApiResponse)
async def get_daily_summary(
    date: Optional[str] = Query(None, description="Date (YYYY-MM-DD), defaults to today"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get daily nutrition summary
    """
    try:
        user_id = current_user.get("user_id") or current_user.get("sub")
        
        summary = await nutrition_service.get_daily_summary(user_id, date)
        
        if summary:
            return ApiResponse(
                success=True,
                message="Daily summary retrieved successfully",
                data=summary.dict()
            )
        else:
            return ApiResponse(
                success=True,
                message="No data available for this date",
                data=None
            )
            
    except Exception as e:
        logger.error(f"Error getting daily summary: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve daily summary"
        )

@router.get("/weekly-summaries", response_model=ApiResponse)
async def get_weekly_summaries(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get daily summaries for a week
    """
    try:
        user_id = current_user.get("user_id") or current_user.get("sub")
        
        summaries = await nutrition_service.get_weekly_summaries(user_id, start_date, end_date)
        
        return ApiResponse(
            success=True,
            message="Weekly summaries retrieved successfully",
            data=[summary.dict() for summary in summaries]
        )
        
    except Exception as e:
        logger.error(f"Error getting weekly summaries: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve weekly summaries"
        )

# Weekly Report Endpoints
@router.post("/reports/weekly", response_model=ApiResponse)
async def generate_weekly_report(
    request: WeeklyReportRequest = WeeklyReportRequest(),
    current_user: dict = Depends(get_current_user)
):
    """
    Generate a comprehensive weekly nutrition report
    """
    try:
        user_id = current_user.get("user_id") or current_user.get("sub")
        
        report = await nutrition_service.generate_weekly_report(
            user_id=user_id,
            start_date=request.start_date,
            end_date=request.end_date
        )
        
        if report:
            return ApiResponse(
                success=True,
                message="Weekly report generated successfully",
                data=report.dict()
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No nutrition data available for the specified period"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating weekly report: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate weekly report"
        )

@router.get("/reports/weekly", response_model=ApiResponse)
async def get_weekly_reports(
    limit: int = Query(10, ge=1, le=50, description="Number of reports to retrieve"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get user's weekly reports
    """
    try:
        user_id = current_user.get("user_id") or current_user.get("sub")
        
        reports = await nutrition_service.get_weekly_reports(user_id, limit)
        
        return ApiResponse(
            success=True,
            message="Weekly reports retrieved successfully",
            data=[report.dict() for report in reports]
        )
        
    except Exception as e:
        logger.error(f"Error getting weekly reports: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve weekly reports"
        )

# User Preferences Endpoints
@router.get("/preferences", response_model=ApiResponse)
async def get_nutrition_preferences(
    current_user: dict = Depends(get_current_user)
):
    """
    Get user's nutrition preferences and goals
    """
    try:
        user_id = current_user.get("user_id") or current_user.get("sub")
        
        preferences = await nutrition_service.get_user_nutrition_preferences(user_id)
        
        return ApiResponse(
            success=True,
            message="Nutrition preferences retrieved successfully",
            data=preferences.dict() if preferences else None
        )
        
    except Exception as e:
        logger.error(f"Error getting nutrition preferences: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve nutrition preferences"
        )

@router.put("/preferences", response_model=ApiResponse)
async def update_nutrition_preferences(
    preferences: UserNutritionPreferences,
    current_user: dict = Depends(get_current_user)
):
    """
    Update user's nutrition preferences and goals
    """
    try:
        user_id = current_user.get("user_id") or current_user.get("sub")
        
        updated_preferences = await nutrition_service.update_user_nutrition_preferences(user_id, preferences)
        
        if updated_preferences:
            return ApiResponse(
                success=True,
                message="Nutrition preferences updated successfully",
                data=updated_preferences.dict()
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update nutrition preferences"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating nutrition preferences: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update nutrition preferences"
        )

# Statistics and Analytics Endpoints
@router.get("/stats/overview", response_model=ApiResponse)
async def get_nutrition_overview(
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get nutrition overview statistics
    """
    try:
        user_id = current_user.get("user_id") or current_user.get("sub")
        
        # Calculate date range
        end_date = datetime.now().strftime("%Y-%m-%d")
        start_date = (datetime.now() - timedelta(days=days-1)).strftime("%Y-%m-%d")
        
        # Get nutrition logs
        logs_data = await nutrition_service.get_nutrition_logs(
            user_id=user_id,
            per_page=1000,
            start_date=start_date,
            end_date=end_date
        )
        
        logs = logs_data["logs"]
        
        if not logs:
            return ApiResponse(
                success=True,
                message="No data available for the specified period",
                data={
                    "total_logs": 0,
                    "days_tracked": 0,
                    "average_daily_calories": 0,
                    "most_common_meal_type": None,
                    "total_meals_analyzed": 0
                }
            )
        
        # Calculate statistics
        total_calories = sum(log.total_nutrition.calories for log in logs)
        days_tracked = len(set(log.date for log in logs))
        avg_daily_calories = total_calories / days_tracked if days_tracked > 0 else 0
        
        # Most common meal type
        meal_types = [log.meal_type for log in logs]
        most_common_meal = max(set(meal_types), key=meal_types.count) if meal_types else None
        
        # Total meals analyzed
        total_meals = sum(len(log.meals) for log in logs)
        
        stats = {
            "total_logs": len(logs),
            "days_tracked": days_tracked,
            "average_daily_calories": round(avg_daily_calories, 1),
            "most_common_meal_type": most_common_meal,
            "total_meals_analyzed": total_meals,
            "period": f"{start_date} to {end_date}"
        }
        
        return ApiResponse(
            success=True,
            message="Nutrition overview retrieved successfully",
            data=stats
        )
        
    except Exception as e:
        logger.error(f"Error getting nutrition overview: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve nutrition overview"
        )

@router.post("/chat", response_model=dict)
async def rag_chat_endpoint(
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    RAG-powered nutrition chat endpoint
    """
    try:
        user_id = request.get("user_id", current_user.get("email", "unknown"))
        message = request.get("message", "")
        context_type = request.get("context_type", "general_nutrition")
        user_profile = request.get("user_profile", {})
        nutrition_context = request.get("nutrition_context", {})
        
        # Basic RAG response generation
        response = await generate_rag_response(
            message, 
            context_type, 
            user_profile, 
            nutrition_context
        )
        
        return {
            "success": True,
            "response": response,
            "context_type": context_type,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in RAG chat endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process chat request"
        )

async def generate_rag_response(message: str, context_type: str, user_profile: dict, nutrition_context: dict) -> str:
    """
    Generate enhanced RAG response for nutrition queries
    """
    try:
        # Intent-specific responses
        if context_type == "protein_inquiry":
            weight = user_profile.get("weight", 70)
            protein_target = round(float(weight) * 1.2) if weight else "80-120"
            return f"""Great protein question! Based on your profile:

💪 **Daily Protein Target:** Aim for {protein_target}g protein daily
🥩 **Best Sources:** Lean meats, fish, eggs, dairy, legumes, nuts, and seeds
⏰ **Timing:** Spread protein across all meals for optimal absorption
🏋️ **Post-Workout:** Consume protein within 2 hours after exercise

**High-Quality Protein Foods:**
• Chicken breast: 31g per 100g
• Fish (salmon): 25g per 100g  
• Eggs: 6g per egg
• Greek yogurt: 10g per 100g
• Lentils: 9g per 100g (cooked)
• Quinoa: 4.4g per 100g (cooked)

For your {user_profile.get('fitnessGoal', 'fitness')} goals, focus on complete proteins that contain all essential amino acids."""

        elif context_type == "weight_loss":
            return f"""I can help with sustainable weight loss strategies!

📉 **Calorie Deficit:** Create a moderate deficit of 300-500 calories/day
🍽️ **Food Focus:** High-protein, high-fiber foods for satiety
🥗 **Plate Method:** Fill half your plate with non-starchy vegetables
⚖️ **Portion Control:** Use smaller plates and eat mindfully

**Weight Loss Foods:**
• Lean proteins (chicken, fish, tofu)
• Leafy greens and colorful vegetables  
• Berries and low-sugar fruits
• Whole grains in moderation
• Healthy fats (avocado, nuts) in small amounts

**Tips for Success:**
• Track your food intake
• Stay hydrated (8-10 glasses water daily)
• Get adequate sleep (7-9 hours)
• Include strength training to preserve muscle"""

        elif context_type == "sri_lankan_food":
            return f"""Excellent question about Sri Lankan cuisine! Here's how to enjoy it healthily:

🍚 **Rice & Curry Optimization:**
• Use brown rice or reduce white rice portions by 30%
• Load up on vegetable curries (dhal, green beans, okra)
• Include protein-rich curries (fish, chicken, lentils)
• Control coconut milk usage in curries

🥥 **Healthy Sri Lankan Choices:**
• Dhal curry: Excellent plant protein and fiber
• Fish curry: High-quality protein + omega-3s  
• Vegetable curries: Nutrient-dense and low-calorie
• String hoppers: Lower calorie than regular hoppers

⚠️ **Enjoy in Moderation:**
• Kottu: High in calories and oil
• Fried preparations (fish, chicken)
• Coconut-heavy desserts
• Excessive rice portions

**Balanced Sri Lankan Meal:**
1 cup rice + 2-3 different curries (including dhal) + vegetables + small portion protein curry"""

        elif context_type == "meal_planning":
            activity_level = user_profile.get("activityLevel", "moderate")
            return f"""Perfect meal planning question! For your {activity_level.replace('_', ' ')} lifestyle:

🍽️ **Balanced Meal Structure:**
• 1/2 plate: Non-starchy vegetables
• 1/4 plate: Lean protein
• 1/4 plate: Complex carbohydrates
• Small portion: Healthy fats

📅 **Weekly Meal Prep Tips:**
• Plan 3-4 base proteins for the week
• Prep vegetables on Sunday
• Cook grains in batches
• Prepare healthy snacks in advance

🌈 **Daily Variety Goals:**
• 5-7 different colored fruits/vegetables
• 2-3 different protein sources
• Whole grains over refined options
• Stay hydrated throughout the day

**Sample Day:**
• Breakfast: Greek yogurt + berries + nuts
• Lunch: Quinoa bowl + chicken + mixed vegetables  
• Dinner: Salmon + roasted vegetables + sweet potato
• Snacks: Apple with almond butter, or carrots with hummus"""

        else:
            # General nutrition response
            fitness_goal = user_profile.get("fitnessGoal", "general health")
            return f"""Great nutrition question! Based on your {fitness_goal.replace('_', ' ')} goals:

🥗 **Nutrition Fundamentals:**
• Focus on whole, unprocessed foods
• Include protein with every meal
• Eat a rainbow of fruits and vegetables
• Choose complex carbohydrates over simple sugars
• Include healthy fats in moderation

💧 **Hydration:** Aim for 8-10 glasses of water daily
🕐 **Meal Timing:** Eat every 3-4 hours to maintain energy
⚖️ **Portion Control:** Use the plate method for balanced meals
🌱 **Plant Power:** Include plenty of vegetables and fruits

**Key Nutrients to Focus On:**
• Protein: For muscle maintenance and satiety
• Fiber: For digestive health and fullness
• Healthy fats: For hormone production and absorption
• Vitamins & minerals: From colorful whole foods

💡 **Want specific advice?** Ask me about meal planning, protein needs, weight management, or any specific foods you'd like to know about!"""

    except Exception as e:
        logger.error(f"Error generating RAG response: {e}")
        return "I apologize, but I'm having trouble processing your nutrition question right now. Please try asking in a different way or contact support if the issue persists."
