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
    """RabbitMQ client for the Fitness backend to consume Diet Agent events."""

    def __init__(self):
        self.connection: Optional[aio_pika.Connection] = None
        self.channel: Optional[aio_pika.Channel] = None
        self.exchange: Optional[aio_pika.Exchange] = None
        self.queues: Dict[str, aio_pika.Queue] = {}

        # callbacks by routing key prefix (e.g., 'nutrition', 'notifications')
        self.handlers: Dict[str, Callable[[Dict[str, Any]], None]] = {}

    async def connect(self):
        try:
            self.connection = await aio_pika.connect_robust(
                settings.RABBITMQ_URL,
                heartbeat=600,
                blocked_connection_timeout=300,
            )

            self.channel = await self.connection.channel()
            await self.channel.set_qos(prefetch_count=10)

            # Use the same exchange name as Diet Agent publishes to
            self.exchange = await self.channel.declare_exchange(
                "diet_agent_exchange",
                ExchangeType.TOPIC,
                durable=True,
            )

            # Declare and bind the queues this service will consume
            await self._declare_and_bind_queues()

            logger.info("Fitness backend connected to RabbitMQ")

        except Exception as e:
            logger.error(f"Fitness RabbitMQ connect failed: {e}")
            raise

    async def disconnect(self):
        if self.connection and not self.connection.is_closed:
            await self.connection.close()
            logger.info("Fitness RabbitMQ disconnected")

    async def _declare_and_bind_queues(self):
        # We'll consume nutrition updates and notifications
        queue_configs = [
            {"name": settings.NUTRITION_QUEUE, "routing_key": "nutrition.*", "durable": True},
            {"name": "notifications", "routing_key": "notifications.*", "durable": True},
        ]

        for cfg in queue_configs:
            q = await self.channel.declare_queue(cfg["name"], durable=cfg["durable"])
            await q.bind(self.exchange, cfg["routing_key"])
            self.queues[cfg["name"]] = q
            logger.info(f"Fitness backend declared and bound queue: {cfg['name']}")

    async def consume(self):
        # Start consumers for declared queues
        for q_name, q in self.queues.items():
            await q.consume(self._make_callback(q_name), no_ack=False)
            logger.info(f"Fitness backend started consuming {q_name}")

    def _make_callback(self, queue_name: str):
        async def _callback(message: aio_pika.IncomingMessage):
            async with message.process():
                try:
                    body = json.loads(message.body.decode())
                    logger.info(f"Fitness received message from {queue_name}: {body.get('request_id', '')}")

                    # Dispatch to a handler based on routing key or message subject
                    routing_key = message.routing_key or ""
                    await self._dispatch(routing_key, body)

                except Exception as e:
                    logger.error(f"Error processing fitness MQ message: {e}")
                    raise

        return _callback

    async def _dispatch(self, routing_key: str, body: Dict[str, Any]):
        # Example routing_key values: 'nutrition.update', 'notifications.achievement'
        prefix = routing_key.split('.')[0] if routing_key else ''
        handler = self.handlers.get(prefix)
        if handler:
            try:
                # allow handlers to be async or sync
                result = handler(body)
                if asyncio.iscoroutine(result):
                    await result
            except Exception as e:
                logger.error(f"Handler for {prefix} failed: {e}")
        else:
            logger.warning(f"No handler registered for routing prefix: {prefix}")

    def register_handler(self, prefix: str, fn: Callable[[Dict[str, Any]], None]):
        """Register a handler for messages whose routing key starts with prefix."""
        self.handlers[prefix] = fn


# Single module-level client
rabbitmq_client = RabbitMQClient()
