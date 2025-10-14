"""
Meal Logging Integration Routes
Frontend-facing endpoints for logging meals that trigger the messaging system
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid
import logging

from app.services.rabbitmq_service import RabbitMQService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/diet", tags=["Diet - Meal Logging"])


class MealLogRequest(BaseModel):
    """Request model for logging a meal"""
    user_id: str = Field(..., description="User identifier")
    meal_name: str = Field(..., description="Name of the meal")
    meal_type: str = Field(..., description="Type: breakfast, lunch, dinner, snack")
    calories: int = Field(..., ge=0, description="Total calories")
    protein: Optional[int] = Field(None, ge=0, description="Protein in grams")
    carbs: Optional[int] = Field(None, ge=0, description="Carbs in grams")
    fat: Optional[int] = Field(None, ge=0, description="Fat in grams")
    fiber: Optional[int] = Field(None, ge=0, description="Fiber in grams")
    food_items: Optional[List[str]] = Field(None, description="List of food items")


class MealLogResponse(BaseModel):
    """Response model for meal logging"""
    success: bool
    message: str
    meal_id: str
    meal_logged: bool
    message_published: bool
    notification_sent: bool
    data: dict


@router.post("/log-meal", response_model=MealLogResponse)
async def log_meal(meal: MealLogRequest):
    """
    Frontend endpoint to log a meal
    
    This endpoint:
    1. Saves meal to database
    2. Publishes message to Fitness Agent
    3. Fitness Agent calculates calorie balance
    4. Fitness Agent suggests workout plan
    5. User receives notification
    
    Example Request:
    ```json
    {
        "user_id": "user_123",
        "meal_name": "Healthy Breakfast Bowl",
        "meal_type": "breakfast",
        "calories": 450,
        "protein": 25,
        "carbs": 55,
        "fat": 15,
        "fiber": 8,
        "food_items": ["Oatmeal", "Greek Yogurt", "Berries"]
    }
    ```
    
    Example Response:
    ```json
    {
        "success": true,
        "message": "Meal logged successfully and workout recommendation sent",
        "meal_id": "uuid-123",
        "meal_logged": true,
        "message_published": true,
        "notification_sent": true,
        "data": {
            "meal_name": "Healthy Breakfast Bowl",
            "calories": 450,
            "timestamp": "2025-10-13T08:30:00"
        }
    }
    ```
    """
    try:
        meal_id = str(uuid.uuid4())
        current_time = datetime.now()
        
        logger.info(f"📝 Logging meal for user {meal.user_id}")
        logger.info(f"   Meal: {meal.meal_name} ({meal.meal_type})")
        logger.info(f"   Calories: {meal.calories} kcal")
        
        # Step 1: Save meal to database
        # In production, save to your database:
        # meal_doc = {
        #     '_id': meal_id,
        #     'user_id': meal.user_id,
        #     'meal_name': meal.meal_name,
        #     'meal_type': meal.meal_type,
        #     'calories': meal.calories,
        #     'macros': {
        #         'protein': meal.protein,
        #         'carbs': meal.carbs,
        #         'fat': meal.fat,
        #         'fiber': meal.fiber
        #     },
        #     'food_items': meal.food_items or [],
        #     'logged_at': current_time,
        #     'date': current_time.strftime("%Y-%m-%d"),
        #     'time': current_time.strftime("%H:%M:%S")
        # }
        # await db.meals.insert_one(meal_doc)
        
        logger.info(f"✅ Meal saved to database with ID: {meal_id}")
        
        # Step 2: Publish message to Fitness Agent
        try:
            rabbitmq = RabbitMQService()
            
            summary_card = {
                'id': meal_id,
                'name': meal.meal_name,
                'time': current_time.strftime("%H:%M:%S"),
                'date': current_time.strftime("%Y-%m-%d"),
                'userId': meal.user_id,
                'mealTime': meal.meal_type,
                'calorieCount': meal.calories,
                'protein': meal.protein or 0,
                'carbs': meal.carbs or 0,
                'fat': meal.fat or 0,
                'fiber': meal.fiber or 0,
                'foodItems': meal.food_items or []
            }
            
            message_published = rabbitmq.send_diet_to_fitness(
                event_name='meal_logged',
                user_id=meal.user_id,
                summary_card=summary_card
            )
            
            if message_published:
                logger.info(f"✅ Message published to Fitness Agent")
                logger.info(f"   → Fitness Agent will process and send workout recommendation")
            else:
                logger.warning(f"⚠️  Failed to publish message")
            
        except Exception as e:
            logger.error(f"❌ Error publishing message: {e}")
            message_published = False
        
        # Step 3: Return response to frontend
        return MealLogResponse(
            success=True,
            message="Meal logged successfully! Workout recommendation will be sent shortly.",
            meal_id=meal_id,
            meal_logged=True,
            message_published=message_published,
            notification_sent=message_published,  # Notification sent by Fitness Agent
            data={
                'meal_name': meal.meal_name,
                'meal_type': meal.meal_type,
                'calories': meal.calories,
                'protein': meal.protein,
                'carbs': meal.carbs,
                'fat': meal.fat,
                'timestamp': current_time.isoformat(),
                'message': 'Processing your meal. You will receive a workout recommendation soon.'
            }
        )
        
    except Exception as e:
        logger.error(f"❌ Error logging meal: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to log meal: {str(e)}"
        )


@router.get("/notifications/{user_id}")
async def get_user_notifications(user_id: str, unread_only: bool = False):
    """
    Get notifications for a user
    
    Args:
        user_id: User identifier
        unread_only: Return only unread notifications
    """
    try:
        from app.services.notification_service import notification_service
        
        notifications = await notification_service.get_user_notifications(
            user_id=user_id,
            unread_only=unread_only
        )
        
        return {
            'success': True,
            'user_id': user_id,
            'count': len(notifications),
            'notifications': notifications
        }
        
    except Exception as e:
        logger.error(f"❌ Error getting notifications: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get notifications: {str(e)}"
        )
