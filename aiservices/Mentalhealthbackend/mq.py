import aio_pika
import json
import logging
from typing import Dict, Any, Optional, Callable
from settings import settings

logger = logging.getLogger(__name__)

class RabbitMQClient:
    """RabbitMQ client for mental health agent communication"""
    
    def __init__(self):
        self.connection: Optional[aio_pika.Connection] = None
        self.channel: Optional[aio_pika.Channel] = None
        self.exchange: Optional[aio_pika.Exchange] = None
    
    async def connect(self):
        """Establish connection to RabbitMQ"""
        try:
            self.connection = await aio_pika.connect_robust(settings.RABBITMQ_URL)
            self.channel = await self.connection.channel()
            
            # Declare exchange for mental health messages
            self.exchange = await self.channel.declare_exchange(
                "mental_health_exchange",
                aio_pika.ExchangeType.TOPIC,
                durable=True
            )
            
            logger.info("🐰 Connected to RabbitMQ")
            
        except Exception as e:
            logger.error(f"❌ RabbitMQ connection failed: {e}")
            raise
    
    async def close(self):
        """Close RabbitMQ connection"""
        try:
            if self.connection:
                await self.connection.close()
                logger.info("🐰 RabbitMQ connection closed")
        except Exception as e:
            logger.error(f"❌ Error closing RabbitMQ connection: {e}")
    
    async def publish_mood_analysis(self, user_id: str, mood_data: Dict[str, Any]):
        """Publish mood analysis result to exchange"""
        try:
            message_body = {
                "user_id": user_id,
                "type": "mood_analysis",
                "data": mood_data,
                "timestamp": mood_data.get("timestamp")
            }
            
            message = aio_pika.Message(
                json.dumps(message_body).encode(),
                content_type="application/json",
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT
            )
            
            await self.exchange.publish(
                message,
                routing_key=f"mood.analysis.{user_id}"
            )
            
            logger.info(f"📤 Published mood analysis for user {user_id}")
            
        except Exception as e:
            logger.error(f"❌ Failed to publish mood analysis: {e}")
            raise
    
    async def publish_intervention_request(self, user_id: str, intervention_data: Dict[str, Any]):
        """Publish intervention request to AI services"""
        try:
            message_body = {
                "user_id": user_id,
                "type": "intervention_request",
                "data": intervention_data,
                "timestamp": intervention_data.get("timestamp")
            }
            
            message = aio_pika.Message(
                json.dumps(message_body).encode(),
                content_type="application/json",
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT
            )
            
            await self.exchange.publish(
                message,
                routing_key=f"intervention.request.{intervention_data.get('type', 'general')}"
            )
            
            logger.info(f"📤 Published intervention request for user {user_id}")
            
        except Exception as e:
            logger.error(f"❌ Failed to publish intervention request: {e}")
            raise
    
    async def publish_crisis_alert(self, user_id: str, crisis_data: Dict[str, Any]):
        """Publish crisis alert for immediate attention"""
        try:
            message_body = {
                "user_id": user_id,
                "type": "crisis_alert",
                "data": crisis_data,
                "timestamp": crisis_data.get("timestamp"),
                "priority": "high"
            }
            
            message = aio_pika.Message(
                json.dumps(message_body).encode(),
                content_type="application/json",
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
                priority=255  # Highest priority
            )
            
            await self.exchange.publish(
                message,
                routing_key=f"crisis.alert.{user_id}"
            )
            
            logger.warning(f"🚨 Published crisis alert for user {user_id}")
            
        except Exception as e:
            logger.error(f"❌ Failed to publish crisis alert: {e}")
            raise
    
    async def setup_consumer(self, routing_key: str, callback: Callable):
        """Set up a consumer for specific routing key"""
        try:
            # Declare queue
            queue = await self.channel.declare_queue(
                f"mental_health_{routing_key}",
                durable=True
            )
            
            # Bind queue to exchange
            await queue.bind(self.exchange, routing_key)
            
            # Set up consumer
            await queue.consume(callback, no_ack=False)
            
            logger.info(f"👂 Set up consumer for routing key: {routing_key}")
            
        except Exception as e:
            logger.error(f"❌ Failed to set up consumer: {e}")
            raise
    
    async def publish_meditation_session(self, user_id: str, session_data: Dict[str, Any]):
        """Publish meditation session data"""
        try:
            message_body = {
                "user_id": user_id,
                "type": "meditation_session",
                "data": session_data,
                "timestamp": session_data.get("timestamp")
            }
            
            message = aio_pika.Message(
                json.dumps(message_body).encode(),
                content_type="application/json",
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT
            )
            
            await self.exchange.publish(
                message,
                routing_key=f"meditation.session.{user_id}"
            )
            
            logger.info(f"📤 Published meditation session for user {user_id}")
            
        except Exception as e:
            logger.error(f"❌ Failed to publish meditation session: {e}")
            raise
    
    async def publish_therapy_session(self, user_id: str, session_data: Dict[str, Any]):
        """Publish therapy session data"""
        try:
            message_body = {
                "user_id": user_id,
                "type": "therapy_session",
                "data": session_data,
                "timestamp": session_data.get("timestamp")
            }
            
            message = aio_pika.Message(
                json.dumps(message_body).encode(),
                content_type="application/json",
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT
            )
            
            await self.exchange.publish(
                message,
                routing_key=f"therapy.session.{user_id}"
            )
            
            logger.info(f"📤 Published therapy session for user {user_id}")
            
        except Exception as e:
            logger.error(f"❌ Failed to publish therapy session: {e}")
            raise