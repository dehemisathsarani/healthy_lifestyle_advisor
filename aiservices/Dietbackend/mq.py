import asyncio
import json
import logging
from typing import Dict, Any, Optional, Callable
import aio_pika
from aio_pika import Message, DeliveryMode, ExchangeType
from datetime import datetime

from settings import settings

logger = logging.getLogger(__name__)

class RabbitMQClient:
    """RabbitMQ client for handling message publishing and consuming."""
    
    def __init__(self):
        self.connection: Optional[aio_pika.Connection] = None
        self.channel: Optional[aio_pika.Channel] = None
        self.exchange: Optional[aio_pika.Exchange] = None
        self.queues: Dict[str, aio_pika.Queue] = {}
        
    async def connect(self):
        """Establish connection to RabbitMQ."""
        try:
            # Connect to RabbitMQ
            self.connection = await aio_pika.connect_robust(
                settings.RABBITMQ_URL,
                heartbeat=600,
                blocked_connection_timeout=300,
            )
            
            # Create channel
            self.channel = await self.connection.channel()
            
            # Set QoS for fair dispatch
            await self.channel.set_qos(prefetch_count=10)
            
            # Declare exchange
            self.exchange = await self.channel.declare_exchange(
                "diet_agent_exchange",
                ExchangeType.TOPIC,
                durable=True
            )
            
            # Declare queues
            await self._declare_queues()
            
            logger.info("Connected to RabbitMQ successfully")
            
        except Exception as e:
            logger.error(f"Failed to connect to RabbitMQ: {e}")
            raise
    
    async def disconnect(self):
        """Close RabbitMQ connection."""
        if self.connection and not self.connection.is_closed:
            await self.connection.close()
            logger.info("Disconnected from RabbitMQ")
    
    async def _declare_queues(self):
        """Declare all required queues."""
        queue_configs = [
            {
                "name": settings.DIET_QUEUE,
                "routing_key": "diet.*",
                "durable": True
            },
            {
                "name": settings.NUTRITION_QUEUE,
                "routing_key": "nutrition.*",
                "durable": True
            },
            {
                "name": settings.IMAGE_QUEUE,
                "routing_key": "image.*",
                "durable": True
            },
            {
                "name": "notifications",
                "routing_key": "notifications.*",
                "durable": True
            },
            {
                "name": "analytics",
                "routing_key": "analytics.*",
                "durable": True
            }
        ]
        
        for config in queue_configs:
            queue = await self.channel.declare_queue(
                config["name"],
                durable=config["durable"]
            )
            
            # Bind queue to exchange
            await queue.bind(self.exchange, config["routing_key"])
            
            self.queues[config["name"]] = queue
            logger.info(f"Declared queue: {config['name']}")
    
    async def publish_message(
        self,
        routing_key: str,
        message_data: Dict[str, Any],
        queue_name: Optional[str] = None,
        priority: int = 0
    ):
        """Publish message to queue."""
        try:
            # Add metadata
            message_data.update({
                "timestamp": datetime.now().isoformat(),
                "source": "diet_backend"
            })
            
            # Create message
            message = Message(
                json.dumps(message_data).encode(),
                delivery_mode=DeliveryMode.PERSISTENT,
                priority=priority,
                headers={
                    "content_type": "application/json",
                    "source_service": "diet_backend"
                }
            )
            
            # Publish to exchange or directly to queue
            if queue_name and queue_name in self.queues:
                await self.channel.default_exchange.publish(
                    message,
                    routing_key=queue_name
                )
            else:
                await self.exchange.publish(
                    message,
                    routing_key=routing_key
                )
            
            logger.info(f"Published message to {routing_key}")
            
        except Exception as e:
            logger.error(f"Failed to publish message: {e}")
            raise
    
    async def consume_messages(
        self,
        queue_name: str,
        callback: Callable,
        auto_ack: bool = False
    ):
        """Start consuming messages from a queue."""
        try:
            if queue_name not in self.queues:
                raise ValueError(f"Queue {queue_name} not declared")
            
            queue = self.queues[queue_name]
            
            await queue.consume(
                callback,
                no_ack=auto_ack
            )
            
            logger.info(f"Started consuming from queue: {queue_name}")
            
        except Exception as e:
            logger.error(f"Failed to start consuming: {e}")
            raise
    
    async def publish_diet_analysis_request(
        self,
        user_id: str,
        request_type: str,
        data: Dict[str, Any]
    ) -> str:
        """Publish diet analysis request."""
        message_data = {
            "user_id": user_id,
            "request_type": request_type,
            "data": data,
            "request_id": f"diet_{user_id}_{datetime.now().timestamp()}"
        }
        
        await self.publish_message(
            "diet.analysis",
            message_data,
            settings.DIET_QUEUE
        )
        
        return message_data["request_id"]
    
    async def publish_nutrition_update(
        self,
        user_id: str,
        nutrition_data: Dict[str, Any]
    ):
        """Publish nutrition update for tracking."""
        message_data = {
            "user_id": user_id,
            "nutrition_data": nutrition_data,
            "update_type": "meal_logged"
        }
        
        await self.publish_message(
            "nutrition.update",
            message_data,
            settings.NUTRITION_QUEUE
        )
    
    async def publish_hydration_update(
        self,
        user_id: str,
        amount_ml: int
    ):
        """Publish hydration update."""
        message_data = {
            "user_id": user_id,
            "amount_ml": amount_ml,
            "update_type": "hydration"
        }
        
        await self.publish_message(
            "nutrition.hydration",
            message_data,
            settings.NUTRITION_QUEUE
        )
    
    async def publish_user_achievement(
        self,
        user_id: str,
        achievement_data: Dict[str, Any]
    ):
        """Publish user achievement notification."""
        message_data = {
            "user_id": user_id,
            "achievement": achievement_data,
            "notification_type": "achievement"
        }
        
        await self.publish_message(
            "notifications.achievement",
            message_data,
            "notifications"
        )
    
    async def publish_daily_summary(
        self,
        user_id: str,
        summary_data: Dict[str, Any]
    ):
        """Publish daily nutrition summary for analytics."""
        message_data = {
            "user_id": user_id,
            "summary": summary_data,
            "analytics_type": "daily_summary"
        }
        
        await self.publish_message(
            "analytics.daily",
            message_data,
            "analytics"
        )
    
    async def publish_goal_reminder(
        self,
        user_id: str,
        reminder_type: str,
        data: Dict[str, Any]
    ):
        """Publish goal reminder notification."""
        message_data = {
            "user_id": user_id,
            "reminder_type": reminder_type,
            "data": data,
            "notification_type": "reminder"
        }
        
        await self.publish_message(
            "notifications.reminder",
            message_data,
            "notifications"
        )

class MessageProcessor:
    """Base class for processing RabbitMQ messages."""
    
    def __init__(self, rabbitmq_client: RabbitMQClient):
        self.rabbitmq_client = rabbitmq_client
    
    async def process_message(self, message: aio_pika.IncomingMessage):
        """Process incoming message."""
        async with message.process():
            try:
                # Decode message
                body = json.loads(message.body.decode())
                
                # Log message received
                logger.info(f"Processing message: {body.get('request_id', 'unknown')}")
                
                # Process based on message type
                await self._handle_message(body)
                
            except Exception as e:
                logger.error(f"Error processing message: {e}")
                # Message will be rejected and potentially requeued
                raise
    
    async def _handle_message(self, body: Dict[str, Any]):
        """Handle message based on its type - to be implemented by subclasses."""
        raise NotImplementedError

class DietResponseProcessor(MessageProcessor):
    """Processor for diet analysis responses."""
    
    def __init__(self, rabbitmq_client: RabbitMQClient, db):
        super().__init__(rabbitmq_client)
        self.db = db
    
    async def _handle_message(self, body: Dict[str, Any]):
        """Handle diet analysis response."""
        request_id = body.get('request_id')
        user_id = body.get('user_id')
        result = body.get('result')
        
        if not all([request_id, user_id, result]):
            logger.error("Invalid message format")
            return
        
        # Store result in database
        await self.db.analysis_results.update_one(
            {"request_id": request_id},
            {
                "$set": {
                    "result": result,
                    "status": "completed",
                    "processed_at": datetime.now()
                }
            },
            upsert=True
        )
        
        # Check if goals are met and send achievements
        if result.get('goals_achieved'):
            await self.rabbitmq_client.publish_user_achievement(
                user_id,
                {
                    "type": "goal_achievement",
                    "description": "Daily nutrition goals met!",
                    "points": 10
                }
            )
        
        logger.info(f"Processed diet analysis response for {request_id}")

class NotificationProcessor(MessageProcessor):
    """Processor for notification messages."""
    
    def __init__(self, rabbitmq_client: RabbitMQClient, db):
        super().__init__(rabbitmq_client)
        self.db = db
    
    async def _handle_message(self, body: Dict[str, Any]):
        """Handle notification message."""
        user_id = body.get('user_id')
        notification_type = body.get('notification_type')
        
        # Store notification in database
        notification_data = {
            "user_id": user_id,
            "type": notification_type,
            "data": body,
            "created_at": datetime.now(),
            "read": False
        }
        
        await self.db.notifications.insert_one(notification_data)
        
        # Send real-time notification (WebSocket, push notification, etc.)
        # This would integrate with your notification service
        
        logger.info(f"Processed notification for user {user_id}")

# Global RabbitMQ client instance
rabbitmq_client = RabbitMQClient()