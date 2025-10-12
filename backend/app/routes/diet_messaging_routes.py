"""
Diet Agent RabbitMQ Integration
Handles sending nutrition data to Fitness Agent and receiving fitness data
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import logging
from datetime import datetime
import asyncio

from ..services.rabbitmq_service import (
    get_rabbitmq_service,
    DietEvents,
    FitnessEvents
)

router = APIRouter(prefix="/api/diet-messaging", tags=["Diet Messaging"])
logger = logging.getLogger(__name__)

# Request Models
class NutritionSummaryCard(BaseModel):
    total_calories: int
    macronutrients: Dict[str, float]  # {protein, carbs, fat, fiber}
    bmi: Optional[float] = None
    goal: str = "maintenance"  # weight_loss, muscle_gain, maintenance
    sources: List[str] = []  # List of food items
    meal_type: str = "meal"  # breakfast, lunch, dinner, snack
    meal_timestamp: Optional[str] = None
    health_score: Optional[float] = None
    balance_score: Optional[float] = None
    recommendations: List[str] = []
    priority: str = "normal"  # normal, high, urgent

class SendNutritionDataRequest(BaseModel):
    event_name: str
    user_id: str
    summary_card: NutritionSummaryCard


# Message Handler for Fitness Agent messages
class FitnessMessageHandler:
    """Handles incoming messages from Fitness Agent"""
    
    @staticmethod
    def handle_workout_completed(message: Dict):
        """Handle workout completed event"""
        user_id = message['user_id']
        summary = message['summary_card']
        
        logger.info(f"🏋️ User {user_id} completed workout:")
        logger.info(f"   Type: {summary['workout_type']}")
        logger.info(f"   Calories Burned: {summary['calories_burned']}")
        logger.info(f"   Duration: {summary['duration_minutes']} min")
        
        # TODO: Update user's nutrition recommendations based on workout
        # - Adjust calorie targets
        # - Suggest post-workout nutrition
        # - Update macro recommendations
    
    @staticmethod
    def handle_calories_burned(message: Dict):
        """Handle calories burned event"""
        user_id = message['user_id']
        summary = message['summary_card']
        
        logger.info(f"🔥 User {user_id} burned {summary['calories_burned']} calories")
        
        # TODO: Adjust daily calorie budget
    
    @staticmethod
    def handle_bmi_updated(message: Dict):
        """Handle BMI update from fitness agent"""
        user_id = message['user_id']
        summary = message['summary_card']
        
        logger.info(f"📊 User {user_id} BMI updated to {summary['bmi']}")
        
        # TODO: Update nutrition goals based on new BMI
    
    @staticmethod
    def handle_daily_summary(message: Dict):
        """Handle daily fitness summary"""
        user_id = message['user_id']
        summary = message['summary_card']
        
        logger.info(f"📈 Daily Fitness Summary for {user_id}:")
        logger.info(f"   Total Calories Burned: {summary['calories_burned']}")
        logger.info(f"   Total Duration: {summary['duration_minutes']} min")
        
        # TODO: Generate coordinated daily report
    
    @staticmethod
    def process_message(message: Dict):
        """Route message to appropriate handler"""
        event_name = message['event_name']
        
        handlers = {
            FitnessEvents.WORKOUT_COMPLETED: FitnessMessageHandler.handle_workout_completed,
            FitnessEvents.CALORIES_BURNED: FitnessMessageHandler.handle_calories_burned,
            FitnessEvents.BMI_UPDATED: FitnessMessageHandler.handle_bmi_updated,
            FitnessEvents.DAILY_SUMMARY: FitnessMessageHandler.handle_daily_summary,
        }
        
        handler = handlers.get(event_name)
        if handler:
            handler(message)
        else:
            logger.warning(f"⚠️ No handler for event: {event_name}")


# API Endpoints
@router.post("/send-to-fitness")
async def send_nutrition_to_fitness(request: SendNutritionDataRequest):
    """
    Send nutrition data from Diet Agent to Fitness Agent
    
    Example payload:
    {
        "event_name": "food_analyzed",
        "user_id": "user123",
        "summary_card": {
            "total_calories": 650,
            "macronutrients": {
                "protein": 35.5,
                "carbs": 75.2,
                "fat": 18.5,
                "fiber": 8.2
            },
            "bmi": 24.5,
            "goal": "muscle_gain",
            "sources": ["Grilled Chicken Breast", "Brown Rice", "Steamed Broccoli"],
            "meal_type": "lunch",
            "health_score": 8.5,
            "balance_score": 7.8,
            "recommendations": ["Good protein content", "Add more vegetables"]
        }
    }
    """
    try:
        rabbitmq = get_rabbitmq_service()
        
        summary_dict = request.summary_card.dict()
        
        success = rabbitmq.send_diet_to_fitness(
            event_name=request.event_name,
            user_id=request.user_id,
            summary_card=summary_dict
        )
        
        if success:
            return {
                'status': 'success',
                'message': f'Nutrition data sent to Fitness Agent',
                'event_name': request.event_name,
                'user_id': request.user_id,
                'timestamp': datetime.now().isoformat()
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to send message")
            
    except Exception as e:
        logger.error(f"❌ Error sending nutrition data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/send-meal-logged")
async def send_meal_logged(
    user_id: str,
    total_calories: int,
    protein: float,
    carbs: float,
    fat: float,
    fiber: float,
    meal_type: str,
    sources: List[str],
    bmi: Optional[float] = None,
    goal: str = "maintenance"
):
    """
    Quick endpoint to send meal logged event
    
    Example:
    POST /api/diet-messaging/send-meal-logged
    {
        "user_id": "user123",
        "total_calories": 650,
        "protein": 35.5,
        "carbs": 75.2,
        "fat": 18.5,
        "fiber": 8.2,
        "meal_type": "lunch",
        "sources": ["Chicken", "Rice", "Broccoli"],
        "bmi": 24.5,
        "goal": "muscle_gain"
    }
    """
    try:
        rabbitmq = get_rabbitmq_service()
        
        summary_card = {
            'total_calories': total_calories,
            'macronutrients': {
                'protein': protein,
                'carbs': carbs,
                'fat': fat,
                'fiber': fiber
            },
            'bmi': bmi,
            'goal': goal,
            'sources': sources,
            'meal_type': meal_type,
            'meal_timestamp': datetime.now().isoformat()
        }
        
        success = rabbitmq.send_diet_to_fitness(
            event_name=DietEvents.MEAL_LOGGED,
            user_id=user_id,
            summary_card=summary_card
        )
        
        if success:
            return {
                'status': 'success',
                'message': f'Meal logged and sent to Fitness Agent',
                'user_id': user_id,
                'calories': total_calories,
                'meal_type': meal_type
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to send message")
            
    except Exception as e:
        logger.error(f"❌ Error logging meal: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/connection-status")
async def get_connection_status():
    """Check RabbitMQ connection status"""
    try:
        rabbitmq = get_rabbitmq_service()
        is_connected = rabbitmq.connection and not rabbitmq.connection.is_closed
        
        return {
            'status': 'connected' if is_connected else 'disconnected',
            'service': 'diet_agent',
            'exchanges': {
                'diet_to_fitness': rabbitmq.DIET_TO_FITNESS_EXCHANGE,
                'fitness_to_diet': rabbitmq.FITNESS_TO_DIET_EXCHANGE
            },
            'queues': {
                'outgoing': rabbitmq.DIET_TO_FITNESS_QUEUE,
                'incoming': rabbitmq.FITNESS_TO_DIET_QUEUE
            }
        }
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e)
        }


# Background consumer (start this in main.py)
def start_fitness_message_consumer():
    """Start consuming messages from Fitness Agent"""
    try:
        rabbitmq = get_rabbitmq_service()
        logger.info("🚀 Starting Diet Agent message consumer...")
        rabbitmq.consume_fitness_messages(FitnessMessageHandler.process_message)
    except Exception as e:
        logger.error(f"❌ Failed to start message consumer: {e}")
