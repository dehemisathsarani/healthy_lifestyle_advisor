"""
Consumer Service Startup
Starts RabbitMQ consumers for both Diet and Fitness agents
"""

import logging
from threading import Thread
from app.services.rabbitmq_service import RabbitMQService
from app.services.event_handlers import (
    fitness_handler,
    diet_handler
)
import asyncio

logger = logging.getLogger(__name__)


def simple_diet_callback(message):
    """
    Simple wrapper for diet message callback
    Receives parsed message from rabbitmq_service
    """
    try:
        asyncio.run(fitness_handler.handle_meal_logged(message))
    except Exception as e:
        logger.error(f"❌ Error in diet callback: {e}")


def simple_fitness_callback(message):
    """
    Simple wrapper for fitness message callback
    Receives parsed message from rabbitmq_service
    """
    try:
        asyncio.run(diet_handler.handle_workout_completed(message))
    except Exception as e:
        logger.error(f"❌ Error in fitness callback: {e}")


class ConsumerService:
    """Manages RabbitMQ consumers for both agents"""
    
    def __init__(self):
        self.fitness_consumer_thread = None
        self.diet_consumer_thread = None
        self.running = False
        
    def start_fitness_consumer(self):
        """Start Fitness Agent consumer (listens to Diet events)"""
        try:
            logger.info("🏃 Starting Fitness Agent consumer...")
            rabbitmq = RabbitMQService()
            rabbitmq.consume_diet_messages(simple_diet_callback)
        except Exception as e:
            logger.error(f"❌ Fitness consumer error: {e}")
    
    def start_diet_consumer(self):
        """Start Diet Agent consumer (listens to Fitness events)"""
        try:
            logger.info("🥗 Starting Diet Agent consumer...")
            rabbitmq = RabbitMQService()
            rabbitmq.consume_fitness_messages(simple_fitness_callback)
        except Exception as e:
            logger.error(f"❌ Diet consumer error: {e}")
    
    def start_all_consumers(self):
        """Start both consumers in background threads"""
        if self.running:
            logger.warning("⚠️  Consumers already running")
            return
        
        # Start Fitness consumer thread
        self.fitness_consumer_thread = Thread(
            target=self.start_fitness_consumer,
            daemon=True,
            name="FitnessConsumer"
        )
        self.fitness_consumer_thread.start()
        logger.info("✅ Fitness Agent consumer started in background")
        
        # Start Diet consumer thread
        self.diet_consumer_thread = Thread(
            target=self.start_diet_consumer,
            daemon=True,
            name="DietConsumer"
        )
        self.diet_consumer_thread.start()
        logger.info("✅ Diet Agent consumer started in background")
        
        self.running = True
        logger.info("🎉 All consumers running successfully!")
    
    def stop_all_consumers(self):
        """Stop all consumers"""
        self.running = False
        logger.info("🛑 Stopping all consumers...")


# Global instance
consumer_service = ConsumerService()


def startup_consumers():
    """Call this from your FastAPI startup event"""
    consumer_service.start_all_consumers()


def shutdown_consumers():
    """Call this from your FastAPI shutdown event"""
    consumer_service.stop_all_consumers()
