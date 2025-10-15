"""
RabbitMQ Messaging Service for Diet Agent ↔ Fitness Agent Communication

This service enables asynchronous message passing between agents with structured event data:
- Event Name
- User ID
- Timestamp
- Summary Card (calories, macros, BMI, goals, sources)
"""

import pika
import json
import logging
from datetime import datetime
from typing import Dict, Optional, Any, Callable
import os
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

class RabbitMQService:
    """RabbitMQ Service for inter-agent communication"""
    
    def __init__(self):
        # RabbitMQ Configuration
        self.rabbitmq_url = os.getenv('CLOUDAMQP_URL', 'amqp://guest:guest@localhost:5672/')
        self.connection = None
        self.channel = None
        self.is_connected = False
        
        # Exchange and Queue Names
        self.DIET_TO_FITNESS_EXCHANGE = 'diet_to_fitness_exchange'
        self.FITNESS_TO_DIET_EXCHANGE = 'fitness_to_diet_exchange'
        self.DIET_TO_FITNESS_QUEUE = 'diet_to_fitness_queue'
        self.FITNESS_TO_DIET_QUEUE = 'fitness_to_diet_queue'
        
        # Routing Keys
        self.DIET_EVENT_KEY = 'diet.event'
        self.FITNESS_EVENT_KEY = 'fitness.event'
        
        try:
            self.connect()
        except Exception as e:
            logger.warning(f"⚠️  RabbitMQ not available during initialization: {e}")
            logger.info("   Service will operate in degraded mode without messaging")
    
    def connect(self):
        """Establish connection to RabbitMQ"""
        try:
            parameters = pika.URLParameters(self.rabbitmq_url)
            parameters.heartbeat = 600
            parameters.blocked_connection_timeout = 300
            
            self.connection = pika.BlockingConnection(parameters)
            self.channel = self.connection.channel()
            
            # Declare exchanges
            self.channel.exchange_declare(
                exchange=self.DIET_TO_FITNESS_EXCHANGE,
                exchange_type='topic',
                durable=True
            )
            self.channel.exchange_declare(
                exchange=self.FITNESS_TO_DIET_EXCHANGE,
                exchange_type='topic',
                durable=True
            )
            
            # Declare queues
            self.channel.queue_declare(queue=self.DIET_TO_FITNESS_QUEUE, durable=True)
            self.channel.queue_declare(queue=self.FITNESS_TO_DIET_QUEUE, durable=True)
            
            # Bind queues to exchanges
            self.channel.queue_bind(
                exchange=self.DIET_TO_FITNESS_EXCHANGE,
                queue=self.DIET_TO_FITNESS_QUEUE,
                routing_key=self.DIET_EVENT_KEY
            )
            self.channel.queue_bind(
                exchange=self.FITNESS_TO_DIET_EXCHANGE,
                queue=self.FITNESS_TO_DIET_QUEUE,
                routing_key=self.FITNESS_EVENT_KEY
            )
            
            self.is_connected = True
            logger.info("✅ RabbitMQ connection established successfully")
            logger.info(f"📊 Exchanges: {self.DIET_TO_FITNESS_EXCHANGE}, {self.FITNESS_TO_DIET_EXCHANGE}")
            logger.info(f"📬 Queues: {self.DIET_TO_FITNESS_QUEUE}, {self.FITNESS_TO_DIET_QUEUE}")
            
        except Exception as e:
            self.is_connected = False
            logger.error(f"❌ Failed to connect to RabbitMQ: {e}")
            logger.warning("   RabbitMQ messaging features will be unavailable")
            # Don't raise - allow service to continue without RabbitMQ
    
    def create_diet_message(
        self,
        event_name: str,
        user_id: str,
        summary_card: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Create a standardized diet message for Fitness Agent
        
        Args:
            event_name: Type of event (e.g., 'food_analyzed', 'meal_logged', 'nutrition_updated')
            user_id: User identifier
            summary_card: Dictionary containing:
                - total_calories: int
                - macronutrients: dict {protein, carbs, fat, fiber}
                - bmi: float (optional)
                - goal: str (e.g., 'weight_loss', 'muscle_gain', 'maintenance')
                - sources: list of food items
                - meal_type: str (breakfast, lunch, dinner, snack)
                - timestamp: str (ISO format)
        
        Returns:
            Formatted message dictionary
        """
        message = {
            'event_name': event_name,
            'user_id': user_id,
            'timestamp': datetime.now().isoformat(),
            'source': 'diet_agent',
            'summary_card': {
                'total_calories': summary_card.get('total_calories', 0),
                'macronutrients': {
                    'protein': summary_card.get('macronutrients', {}).get('protein', 0),
                    'carbs': summary_card.get('macronutrients', {}).get('carbs', 0),
                    'fat': summary_card.get('macronutrients', {}).get('fat', 0),
                    'fiber': summary_card.get('macronutrients', {}).get('fiber', 0)
                },
                'bmi': summary_card.get('bmi'),
                'goal': summary_card.get('goal', 'maintenance'),
                'sources': summary_card.get('sources', []),
                'meal_type': summary_card.get('meal_type', 'meal'),
                'meal_timestamp': summary_card.get('meal_timestamp', datetime.now().isoformat()),
                'health_score': summary_card.get('health_score'),
                'balance_score': summary_card.get('balance_score'),
                'recommendations': summary_card.get('recommendations', [])
            },
            'metadata': {
                'version': '1.0',
                'agent_type': 'diet',
                'priority': summary_card.get('priority', 'normal')
            }
        }
        return message
    
    def create_fitness_message(
        self,
        event_name: str,
        user_id: str,
        summary_card: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Create a standardized fitness message for Diet Agent
        
        Args:
            event_name: Type of event (e.g., 'workout_completed', 'exercise_logged', 'calories_burned')
            user_id: User identifier
            summary_card: Dictionary containing:
                - calories_burned: int
                - workout_type: str
                - duration_minutes: int
                - intensity: str (low, medium, high)
                - bmi: float (optional)
                - goal: str
                - exercises: list of exercises
        
        Returns:
            Formatted message dictionary
        """
        message = {
            'event_name': event_name,
            'user_id': user_id,
            'timestamp': datetime.now().isoformat(),
            'source': 'fitness_agent',
            'summary_card': {
                'calories_burned': summary_card.get('calories_burned', 0),
                'workout_type': summary_card.get('workout_type', 'general'),
                'duration_minutes': summary_card.get('duration_minutes', 0),
                'intensity': summary_card.get('intensity', 'medium'),
                'bmi': summary_card.get('bmi'),
                'goal': summary_card.get('goal', 'maintenance'),
                'exercises': summary_card.get('exercises', []),
                'workout_timestamp': summary_card.get('workout_timestamp', datetime.now().isoformat()),
                'heart_rate': summary_card.get('heart_rate'),
                'steps': summary_card.get('steps'),
                'distance_km': summary_card.get('distance_km')
            },
            'metadata': {
                'version': '1.0',
                'agent_type': 'fitness',
                'priority': summary_card.get('priority', 'normal')
            }
        }
        return message
    
    def send_diet_to_fitness(
        self,
        event_name: str,
        user_id: str,
        summary_card: Dict[str, Any]
    ) -> bool:
        """
        Send message from Diet Agent to Fitness Agent
        
        Args:
            event_name: Event type
            user_id: User identifier
            summary_card: Summary data
        
        Returns:
            True if successful, False otherwise
        """
        try:
            message = self.create_diet_message(event_name, user_id, summary_card)
            
            self.channel.basic_publish(
                exchange=self.DIET_TO_FITNESS_EXCHANGE,
                routing_key=self.DIET_EVENT_KEY,
                body=json.dumps(message),
                properties=pika.BasicProperties(
                    delivery_mode=2,  # Make message persistent
                    content_type='application/json',
                    headers={
                        'event_name': event_name,
                        'user_id': user_id,
                        'timestamp': message['timestamp']
                    }
                )
            )
            
            logger.info(f"📤 Diet → Fitness: {event_name} for user {user_id}")
            logger.debug(f"   Calories: {summary_card.get('total_calories')} | Goal: {summary_card.get('goal')}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to send diet message: {e}")
            return False
    
    def send_fitness_to_diet(
        self,
        event_name: str,
        user_id: str,
        summary_card: Dict[str, Any]
    ) -> bool:
        """
        Send message from Fitness Agent to Diet Agent
        
        Args:
            event_name: Event type
            user_id: User identifier
            summary_card: Summary data
        
        Returns:
            True if successful, False otherwise
        """
        try:
            message = self.create_fitness_message(event_name, user_id, summary_card)
            
            self.channel.basic_publish(
                exchange=self.FITNESS_TO_DIET_EXCHANGE,
                routing_key=self.FITNESS_EVENT_KEY,
                body=json.dumps(message),
                properties=pika.BasicProperties(
                    delivery_mode=2,  # Make message persistent
                    content_type='application/json',
                    headers={
                        'event_name': event_name,
                        'user_id': user_id,
                        'timestamp': message['timestamp']
                    }
                )
            )
            
            logger.info(f"📤 Fitness → Diet: {event_name} for user {user_id}")
            logger.debug(f"   Calories Burned: {summary_card.get('calories_burned')} | Workout: {summary_card.get('workout_type')}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to send fitness message: {e}")
            return False
    
    def consume_fitness_messages(self, callback: Callable):
        """
        Start consuming messages from Fitness Agent (for Diet Agent)
        
        Args:
            callback: Function to handle received messages
                     Signature: callback(message: Dict) -> None
        """
        def on_message(ch, method, properties, body):
            try:
                message = json.loads(body)
                logger.info(f"📥 Diet Agent received: {message['event_name']} from user {message['user_id']}")
                callback(message)
                ch.basic_ack(delivery_tag=method.delivery_tag)
            except Exception as e:
                logger.error(f"❌ Error processing fitness message: {e}")
                ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
        
        self.channel.basic_qos(prefetch_count=1)
        self.channel.basic_consume(
            queue=self.FITNESS_TO_DIET_QUEUE,
            on_message_callback=on_message
        )
        
        logger.info(f"👂 Diet Agent listening for Fitness messages...")
        self.channel.start_consuming()
    
    def consume_diet_messages(self, callback: Callable):
        """
        Start consuming messages from Diet Agent (for Fitness Agent)
        
        Args:
            callback: Function to handle received messages
                     Signature: callback(message: Dict) -> None
        """
        def on_message(ch, method, properties, body):
            try:
                message = json.loads(body)
                logger.info(f"📥 Fitness Agent received: {message['event_name']} from user {message['user_id']}")
                callback(message)
                ch.basic_ack(delivery_tag=method.delivery_tag)
            except Exception as e:
                logger.error(f"❌ Error processing diet message: {e}")
                ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
        
        self.channel.basic_qos(prefetch_count=1)
        self.channel.basic_consume(
            queue=self.DIET_TO_FITNESS_QUEUE,
            on_message_callback=on_message
        )
        
        logger.info(f"👂 Fitness Agent listening for Diet messages...")
        self.channel.start_consuming()
    
    def close(self):
        """Close RabbitMQ connection"""
        try:
            if self.connection and not self.connection.is_closed:
                self.connection.close()
                logger.info("✅ RabbitMQ connection closed")
        except Exception as e:
            logger.error(f"❌ Error closing RabbitMQ connection: {e}")


# Singleton instance
_rabbitmq_service: Optional[RabbitMQService] = None

def get_rabbitmq_service() -> RabbitMQService:
    """Get or create RabbitMQ service singleton"""
    global _rabbitmq_service
    if _rabbitmq_service is None:
        _rabbitmq_service = RabbitMQService()
    return _rabbitmq_service


# Event Type Constants
class DietEvents:
    """Diet Agent Event Types"""
    FOOD_ANALYZED = 'food_analyzed'
    MEAL_LOGGED = 'meal_logged'
    NUTRITION_UPDATED = 'nutrition_updated'
    DAILY_SUMMARY = 'daily_nutrition_summary'
    GOAL_UPDATED = 'nutrition_goal_updated'
    BMI_CALCULATED = 'bmi_calculated'


class FitnessEvents:
    """Fitness Agent Event Types"""
    WORKOUT_COMPLETED = 'workout_completed'
    EXERCISE_LOGGED = 'exercise_logged'
    CALORIES_BURNED = 'calories_burned'
    DAILY_SUMMARY = 'daily_fitness_summary'
    GOAL_UPDATED = 'fitness_goal_updated'
    BMI_UPDATED = 'bmi_updated'
    STEPS_LOGGED = 'steps_logged'
