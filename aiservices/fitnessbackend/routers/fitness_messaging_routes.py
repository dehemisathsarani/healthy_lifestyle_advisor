"""
Fitness Agent RabbitMQ Integration
Handles sending fitness data to Diet Agent and receiving nutrition data
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional
import logging
from datetime import datetime

# Import RabbitMQ service from local copy
from rabbitmq_service import (
    get_rabbitmq_service,
    DietEvents,
    FitnessEvents
)

router = APIRouter(prefix="/api/fitness-messaging", tags=["Fitness Messaging"])
logger = logging.getLogger(__name__)

# Request Models
class FitnessSummaryCard(BaseModel):
    calories_burned: int
    workout_type: str  # cardio, strength, flexibility, sports
    duration_minutes: int
    intensity: str = "medium"  # low, medium, high
    bmi: Optional[float] = None
    goal: str = "maintenance"  # weight_loss, muscle_gain, endurance, maintenance
    exercises: List[str] = []
    workout_timestamp: Optional[str] = None
    heart_rate: Optional[int] = None
    steps: Optional[int] = None
    distance_km: Optional[float] = None
    priority: str = "normal"

class SendFitnessDataRequest(BaseModel):
    event_name: str
    user_id: str
    summary_card: FitnessSummaryCard


# Message Handler for Diet Agent messages
class DietMessageHandler:
    """Handles incoming messages from Diet Agent"""
    
    @staticmethod
    def handle_food_analyzed(message: Dict):
        """Handle food analyzed event"""
        user_id = message['user_id']
        summary = message['summary_card']
        
        logger.info(f"🍽️ User {user_id} analyzed food:")
        logger.info(f"   Calories: {summary['total_calories']}")
        logger.info(f"   Protein: {summary['macronutrients']['protein']}g")
        logger.info(f"   Sources: {', '.join(summary['sources'][:3])}")
        
        # TODO: Update workout recommendations based on nutrition
        # - Suggest timing for workouts
        # - Adjust intensity recommendations
        # - Calculate net calorie budget
    
    @staticmethod
    def handle_meal_logged(message: Dict):
        """Handle meal logged event"""
        user_id = message['user_id']
        summary = message['summary_card']
        
        logger.info(f"🍴 User {user_id} logged {summary['meal_type']}:")
        logger.info(f"   Calories: {summary['total_calories']}")
        logger.info(f"   Macros: P:{summary['macronutrients']['protein']}g C:{summary['macronutrients']['carbs']}g F:{summary['macronutrients']['fat']}g")
        
        # TODO: Adjust fitness recommendations
        # - Pre-workout: suggest energy boost exercises
        # - Post-workout: recovery suggestions
    
    @staticmethod
    def handle_nutrition_updated(message: Dict):
        """Handle nutrition update event"""
        user_id = message['user_id']
        summary = message['summary_card']
        
        logger.info(f"📊 User {user_id} nutrition updated")
        logger.info(f"   Goal: {summary['goal']}")
        logger.info(f"   BMI: {summary.get('bmi', 'N/A')}")
        
        # TODO: Sync fitness goals with nutrition goals
    
    @staticmethod
    def handle_bmi_calculated(message: Dict):
        """Handle BMI calculation from diet agent"""
        user_id = message['user_id']
        summary = message['summary_card']
        
        logger.info(f"📊 User {user_id} BMI: {summary.get('bmi')}")
        
        # TODO: Update fitness intensity recommendations
    
    @staticmethod
    def handle_daily_summary(message: Dict):
        """Handle daily nutrition summary"""
        user_id = message['user_id']
        summary = message['summary_card']
        
        logger.info(f"📈 Daily Nutrition Summary for {user_id}:")
        logger.info(f"   Total Calories: {summary['total_calories']}")
        logger.info(f"   Health Score: {summary.get('health_score', 'N/A')}")
        
        # TODO: Generate coordinated daily report
    
    @staticmethod
    def process_message(message: Dict):
        """Route message to appropriate handler"""
        event_name = message['event_name']
        
        handlers = {
            DietEvents.FOOD_ANALYZED: DietMessageHandler.handle_food_analyzed,
            DietEvents.MEAL_LOGGED: DietMessageHandler.handle_meal_logged,
            DietEvents.NUTRITION_UPDATED: DietMessageHandler.handle_nutrition_updated,
            DietEvents.BMI_CALCULATED: DietMessageHandler.handle_bmi_calculated,
            DietEvents.DAILY_SUMMARY: DietMessageHandler.handle_daily_summary,
        }
        
        handler = handlers.get(event_name)
        if handler:
            handler(message)
        else:
            logger.warning(f"⚠️ No handler for event: {event_name}")


# API Endpoints
@router.post("/send-to-diet")
async def send_fitness_to_diet(request: SendFitnessDataRequest):
    """
    Send fitness data from Fitness Agent to Diet Agent
    
    Example payload:
    {
        "event_name": "workout_completed",
        "user_id": "user123",
        "summary_card": {
            "calories_burned": 450,
            "workout_type": "cardio",
            "duration_minutes": 45,
            "intensity": "high",
            "bmi": 24.5,
            "goal": "weight_loss",
            "exercises": ["Running", "Jump Rope", "Burpees"],
            "heart_rate": 165,
            "steps": 6500,
            "distance_km": 5.2
        }
    }
    """
    try:
        rabbitmq = get_rabbitmq_service()
        
        summary_dict = request.summary_card.dict()
        
        success = rabbitmq.send_fitness_to_diet(
            event_name=request.event_name,
            user_id=request.user_id,
            summary_card=summary_dict
        )
        
        if success:
            return {
                'status': 'success',
                'message': f'Fitness data sent to Diet Agent',
                'event_name': request.event_name,
                'user_id': request.user_id,
                'timestamp': datetime.now().isoformat()
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to send message")
            
    except Exception as e:
        logger.error(f"❌ Error sending fitness data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/send-workout-completed")
async def send_workout_completed(
    user_id: str,
    calories_burned: int,
    workout_type: str,
    duration_minutes: int,
    intensity: str,
    exercises: List[str],
    bmi: Optional[float] = None,
    goal: str = "maintenance",
    heart_rate: Optional[int] = None,
    steps: Optional[int] = None
):
    """
    Quick endpoint to send workout completed event
    
    Example:
    POST /api/fitness-messaging/send-workout-completed
    {
        "user_id": "user123",
        "calories_burned": 450,
        "workout_type": "cardio",
        "duration_minutes": 45,
        "intensity": "high",
        "exercises": ["Running", "Jump Rope"],
        "bmi": 24.5,
        "goal": "weight_loss",
        "heart_rate": 165,
        "steps": 6500
    }
    """
    try:
        rabbitmq = get_rabbitmq_service()
        
        summary_card = {
            'calories_burned': calories_burned,
            'workout_type': workout_type,
            'duration_minutes': duration_minutes,
            'intensity': intensity,
            'bmi': bmi,
            'goal': goal,
            'exercises': exercises,
            'workout_timestamp': datetime.now().isoformat(),
            'heart_rate': heart_rate,
            'steps': steps
        }
        
        success = rabbitmq.send_fitness_to_diet(
            event_name=FitnessEvents.WORKOUT_COMPLETED,
            user_id=user_id,
            summary_card=summary_card
        )
        
        if success:
            return {
                'status': 'success',
                'message': f'Workout completed and sent to Diet Agent',
                'user_id': user_id,
                'calories_burned': calories_burned,
                'workout_type': workout_type
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to send message")
            
    except Exception as e:
        logger.error(f"❌ Error logging workout: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/connection-status")
async def get_connection_status():
    """Check RabbitMQ connection status"""
    try:
        rabbitmq = get_rabbitmq_service()
        is_connected = rabbitmq.connection and not rabbitmq.connection.is_closed
        
        return {
            'status': 'connected' if is_connected else 'disconnected',
            'service': 'fitness_agent',
            'exchanges': {
                'fitness_to_diet': rabbitmq.FITNESS_TO_DIET_EXCHANGE,
                'diet_to_fitness': rabbitmq.DIET_TO_FITNESS_EXCHANGE
            },
            'queues': {
                'outgoing': rabbitmq.FITNESS_TO_DIET_QUEUE,
                'incoming': rabbitmq.DIET_TO_FITNESS_QUEUE
            }
        }
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e)
        }


# Background consumer (start this in main.py)
def start_diet_message_consumer():
    """Start consuming messages from Diet Agent"""
    try:
        rabbitmq = get_rabbitmq_service()
        logger.info("🚀 Starting Fitness Agent message consumer...")
        rabbitmq.consume_diet_messages(DietMessageHandler.process_message)
    except Exception as e:
        logger.error(f"❌ Failed to start message consumer: {e}")
