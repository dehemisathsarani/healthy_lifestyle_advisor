"""
Enhanced Diet-Fitness Messaging Routes
Handles meal_logged and workout_completed events with specific message attributes
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import logging
import uuid

from ..services.rabbitmq_service import RabbitMQService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/messaging", tags=["Diet-Fitness Messaging"])

# ============================================================================
# MESSAGE MODELS
# ============================================================================

class MealLoggedMessage(BaseModel):
    """Message structure for meal_logged event (Diet → Fitness)"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique message ID")
    name: str = Field(..., description="Meal name or description")
    time: str = Field(default_factory=lambda: datetime.now().strftime("%H:%M:%S"), description="Time of meal (HH:MM:SS)")
    date: str = Field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d"), description="Date of meal (YYYY-MM-DD)")
    userId: str = Field(..., description="User ID")
    mealTime: str = Field(..., description="Meal category (breakfast, lunch, dinner, snack)")
    calorieCount: float = Field(..., description="Total calories in meal")
    
    # Optional fields for enhanced data
    protein: Optional[float] = Field(None, description="Protein in grams")
    carbs: Optional[float] = Field(None, description="Carbohydrates in grams")
    fat: Optional[float] = Field(None, description="Fat in grams")
    fiber: Optional[float] = Field(None, description="Fiber in grams")
    foodItems: Optional[list] = Field(default_factory=list, description="List of food items")
    

class WorkoutCompletedMessage(BaseModel):
    """Message structure for workout_completed event (Fitness → Diet)"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique message ID")
    name: str = Field(..., description="Workout name or type")
    date: str = Field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d"), description="Date of workout (YYYY-MM-DD)")
    userId: str = Field(..., description="User ID")
    exerciseDuration: int = Field(..., description="Duration in minutes")
    caloriesBurnt: float = Field(..., description="Total calories burned")
    
    # Optional fields for enhanced data
    workoutType: Optional[str] = Field(None, description="Type of workout (cardio, strength, etc.)")
    intensity: Optional[str] = Field(None, description="Intensity level (low, medium, high)")
    exercises: Optional[list] = Field(default_factory=list, description="List of exercises")
    heartRate: Optional[int] = Field(None, description="Average heart rate during workout")


class MessageResponse(BaseModel):
    """Standard response for message operations"""
    success: bool
    message: str
    data: Optional[dict] = None


# ============================================================================
# DEPENDENCY: GET RABBITMQ SERVICE
# ============================================================================

def get_rabbitmq_service():
    """Dependency to get RabbitMQ service instance"""
    try:
        return RabbitMQService()
    except Exception as e:
        logger.error(f"Failed to initialize RabbitMQ service: {e}")
        raise HTTPException(status_code=503, detail="Messaging service unavailable")


# ============================================================================
# DIET AGENT ENDPOINTS (Publish meal_logged)
# ============================================================================

@router.post("/diet/meal-logged", response_model=MessageResponse)
async def publish_meal_logged(
    meal_data: MealLoggedMessage,
    rabbitmq: RabbitMQService = Depends(get_rabbitmq_service)
):
    """
    Publish meal_logged event from Diet Agent to Fitness Agent
    
    This endpoint sends a message when a user logs a meal, containing:
    - id: Unique message identifier
    - name: Meal name/description
    - time: Time of meal (HH:MM:SS)
    - date: Date of meal (YYYY-MM-DD)
    - userId: User identifier
    - mealTime: Meal category (breakfast, lunch, dinner, snack)
    - calorieCount: Total calories in meal
    """
    try:
        logger.info(f"📥 Received meal_logged request for user {meal_data.userId}")
        
        # Prepare summary card with all message attributes
        summary_card = {
            'id': meal_data.id,
            'name': meal_data.name,
            'time': meal_data.time,
            'date': meal_data.date,
            'userId': meal_data.userId,
            'mealTime': meal_data.mealTime,
            'calorieCount': meal_data.calorieCount,
            'total_calories': meal_data.calorieCount,  # For compatibility with existing code
            'macronutrients': {
                'protein': meal_data.protein or 0,
                'carbs': meal_data.carbs or 0,
                'fat': meal_data.fat or 0,
                'fiber': meal_data.fiber or 0
            },
            'sources': meal_data.foodItems,
            'meal_type': meal_data.mealTime,
            'timestamp': f"{meal_data.date}T{meal_data.time}"
        }
        
        # Publish to RabbitMQ
        success = rabbitmq.send_diet_to_fitness(
            event_name='meal_logged',
            user_id=meal_data.userId,
            summary_card=summary_card
        )
        
        if success:
            logger.info(f"✅ Published meal_logged event for user {meal_data.userId}")
            return MessageResponse(
                success=True,
                message="Meal logged event published successfully",
                data={
                    'message_id': meal_data.id,
                    'event': 'meal_logged',
                    'userId': meal_data.userId,
                    'calorieCount': meal_data.calorieCount,
                    'timestamp': f"{meal_data.date}T{meal_data.time}"
                }
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to publish message")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error publishing meal_logged: {e}")
        raise HTTPException(status_code=500, detail=f"Error publishing message: {str(e)}")


# ============================================================================
# FITNESS AGENT ENDPOINTS (Publish workout_completed)
# ============================================================================

@router.post("/fitness/workout-completed", response_model=MessageResponse)
async def publish_workout_completed(
    workout_data: WorkoutCompletedMessage,
    rabbitmq: RabbitMQService = Depends(get_rabbitmq_service)
):
    """
    Publish workout_completed event from Fitness Agent to Diet Agent
    
    This endpoint sends a message when a user completes a workout, containing:
    - id: Unique message identifier
    - name: Workout name/type
    - date: Date of workout (YYYY-MM-DD)
    - userId: User identifier
    - exerciseDuration: Duration in minutes
    - caloriesBurnt: Total calories burned
    """
    try:
        logger.info(f"📥 Received workout_completed request for user {workout_data.userId}")
        
        # Prepare summary card with all message attributes
        summary_card = {
            'id': workout_data.id,
            'name': workout_data.name,
            'date': workout_data.date,
            'userId': workout_data.userId,
            'exerciseDuration': workout_data.exerciseDuration,
            'caloriesBurnt': workout_data.caloriesBurnt,
            'calories_burned': workout_data.caloriesBurnt,  # For compatibility
            'workout_type': workout_data.workoutType or workout_data.name,
            'duration_minutes': workout_data.exerciseDuration,
            'intensity': workout_data.intensity or 'medium',
            'exercises': workout_data.exercises,
            'heart_rate': workout_data.heartRate,
            'workout_timestamp': workout_data.date
        }
        
        # Publish to RabbitMQ
        success = rabbitmq.send_fitness_to_diet(
            event_name='workout_completed',
            user_id=workout_data.userId,
            summary_card=summary_card
        )
        
        if success:
            logger.info(f"✅ Published workout_completed event for user {workout_data.userId}")
            return MessageResponse(
                success=True,
                message="Workout completed event published successfully",
                data={
                    'message_id': workout_data.id,
                    'event': 'workout_completed',
                    'userId': workout_data.userId,
                    'caloriesBurnt': workout_data.caloriesBurnt,
                    'exerciseDuration': workout_data.exerciseDuration,
                    'timestamp': workout_data.date
                }
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to publish message")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error publishing workout_completed: {e}")
        raise HTTPException(status_code=500, detail=f"Error publishing message: {str(e)}")


# ============================================================================
# TEST ENDPOINTS
# ============================================================================

@router.get("/health")
async def messaging_health_check():
    """Health check for messaging service"""
    try:
        rabbitmq = RabbitMQService()
        return {
            "status": "healthy",
            "service": "diet-fitness-messaging",
            "rabbitmq_connected": rabbitmq.connection is not None
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "service": "diet-fitness-messaging",
            "error": str(e)
        }


@router.post("/test/meal-logged")
async def test_meal_logged():
    """Test endpoint to publish a sample meal_logged event"""
    sample_meal = MealLoggedMessage(
        name="Breakfast - Oatmeal and Banana",
        userId="test_user_123",
        mealTime="breakfast",
        calorieCount=470,
        protein=20,
        carbs=60,
        fat=15,
        fiber=8,
        foodItems=["Oatmeal", "Banana", "Almonds", "Honey"]
    )
    
    return await publish_meal_logged(sample_meal)


@router.post("/test/workout-completed")
async def test_workout_completed():
    """Test endpoint to publish a sample workout_completed event"""
    sample_workout = WorkoutCompletedMessage(
        name="Morning Cardio",
        userId="test_user_123",
        exerciseDuration=45,
        caloriesBurnt=520,
        workoutType="cardio",
        intensity="high",
        exercises=["Running", "Jumping Jacks", "Burpees"],
        heartRate=145
    )
    
    return await publish_workout_completed(sample_workout)
