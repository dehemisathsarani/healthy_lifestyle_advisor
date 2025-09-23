"""
Simple in-memory message queue to replace RabbitMQ for local development
"""
import asyncio
import json
import logging
from typing import Dict, List, Optional, Callable, Any
from datetime import datetime

logger = logging.getLogger(__name__)

class SimpleMessageQueue:
    def __init__(self):
        self.queues: Dict[str, asyncio.Queue] = {}
        self.consumers: Dict[str, List[Callable]] = {}
        self.running = False
        
    async def declare_queue(self, queue_name: str):
        """Declare a queue (create if not exists)"""
        if queue_name not in self.queues:
            self.queues[queue_name] = asyncio.Queue()
            self.consumers[queue_name] = []
            logger.info(f"Declared queue: {queue_name}")
    
    async def publish(self, queue_name: str, message: Dict[str, Any]):
        """Publish a message to a queue"""
        if queue_name not in self.queues:
            await self.declare_queue(queue_name)
        
        message_with_timestamp = {
            **message,
            "timestamp": datetime.now().isoformat(),
            "queue": queue_name
        }
        
        await self.queues[queue_name].put(message_with_timestamp)
        logger.info(f"Published message to {queue_name}: {message.get('type', 'unknown')}")
    
    async def consume(self, queue_name: str, callback: Callable):
        """Consume messages from a queue"""
        if queue_name not in self.queues:
            await self.declare_queue(queue_name)
        
        self.consumers[queue_name].append(callback)
        logger.info(f"Added consumer for queue: {queue_name}")
    
    async def start_consuming(self):
        """Start consuming messages from all queues"""
        self.running = True
        tasks = []
        
        for queue_name in self.queues:
            task = asyncio.create_task(self._consume_queue(queue_name))
            tasks.append(task)
        
        logger.info("Started consuming messages from all queues")
        await asyncio.gather(*tasks, return_exceptions=True)
    
    async def _consume_queue(self, queue_name: str):
        """Internal method to consume from a specific queue"""
        queue = self.queues[queue_name]
        consumers = self.consumers[queue_name]
        
        while self.running:
            try:
                # Wait for a message with timeout
                message = await asyncio.wait_for(queue.get(), timeout=1.0)
                
                # Process message with all consumers
                for consumer in consumers:
                    try:
                        if asyncio.iscoroutinefunction(consumer):
                            await consumer(message)
                        else:
                            consumer(message)
                    except Exception as e:
                        logger.error(f"Error in consumer for {queue_name}: {e}")
                
                # Mark task as done
                queue.task_done()
                
            except asyncio.TimeoutError:
                # Continue checking if still running
                continue
            except Exception as e:
                logger.error(f"Error consuming from {queue_name}: {e}")
                await asyncio.sleep(1)
    
    async def stop_consuming(self):
        """Stop consuming messages"""
        self.running = False
        logger.info("Stopped consuming messages")
    
    def get_queue_info(self) -> Dict[str, Any]:
        """Get information about all queues"""
        info = {}
        for queue_name, queue in self.queues.items():
            info[queue_name] = {
                "size": queue.qsize(),
                "consumers": len(self.consumers.get(queue_name, []))
            }
        return info

# Global instance
simple_mq = SimpleMessageQueue()