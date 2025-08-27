import asyncio
import json
import logging
import traceback
from typing import Dict, Any
import aio_pika
from aio_pika import Message, DeliveryMode
import motor.motor_asyncio
from datetime import datetime
import base64

from settings import settings
from chain import DietAgentChain, UserProfile, DietAdvice
from nutrition import HydrationTracker
from vision_opt import ImagePreprocessor

# Setup logging
logging.basicConfig(level=getattr(logging, settings.LOG_LEVEL))
logger = logging.getLogger(__name__)

class DietWorker:
    def __init__(self):
        self.diet_agent = DietAgentChain()
        self.connection = None
        self.channel = None
        self.db_client = None
        self.db = None
        
    async def connect(self):
        """Initialize connections to RabbitMQ and MongoDB."""
        try:
            # Connect to RabbitMQ
            self.connection = await aio_pika.connect_robust(settings.RABBITMQ_URL)
            self.channel = await self.connection.channel()
            
            # Set QoS for fair dispatch
            await self.channel.set_qos(prefetch_count=1)
            
            # Declare queues
            self.diet_queue = await self.channel.declare_queue(
                settings.DIET_QUEUE, durable=True
            )
            self.nutrition_queue = await self.channel.declare_queue(
                settings.NUTRITION_QUEUE, durable=True
            )
            self.image_queue = await self.channel.declare_queue(
                settings.IMAGE_QUEUE, durable=True
            )
            
            # Connect to MongoDB
            self.db_client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URL)
            self.db = self.db_client[settings.DATABASE_NAME]
            
            logger.info("Worker connections established successfully")
            
        except Exception as e:
            logger.error(f"Failed to establish connections: {e}")
            raise
    
    async def disconnect(self):
        """Close all connections."""
        if self.connection:
            await self.connection.close()
        if self.db_client:
            self.db_client.close()
    
    async def start_consuming(self):
        """Start consuming messages from all queues."""
        try:
            # Setup consumers for different queues
            await self.diet_queue.consume(self.process_diet_request)
            await self.nutrition_queue.consume(self.process_nutrition_request)
            await self.image_queue.consume(self.process_image_request)
            
            logger.info("Started consuming messages from all queues")
            
            # Keep the worker running
            await asyncio.Future()  # Run forever
            
        except Exception as e:
            logger.error(f"Error in message consumption: {e}")
            raise
    
    async def process_diet_request(self, message: aio_pika.IncomingMessage):
        """Process general diet analysis requests."""
        async with message.process():
            try:
                # Parse message
                body = json.loads(message.body.decode())
                logger.info(f"Processing diet request: {body.get('request_id', 'unknown')}")
                
                request_type = body.get('type')
                user_data = body.get('user_profile')
                request_id = body.get('request_id')
                
                # Create user profile
                user_profile = UserProfile(**user_data)
                
                result = None
                
                if request_type == 'meal_plan':
                    current_intake = body.get('current_intake', [])
                    result = await self.diet_agent.get_meal_plan(user_profile, current_intake)
                    
                elif request_type == 'text_meal_analysis':
                    meal_description = body.get('meal_description')
                    result = await self.diet_agent.analyze_text_meal(meal_description, user_profile)
                    
                else:
                    result = {"error": f"Unknown request type: {request_type}"}
                
                # Store result in database
                await self._store_result(request_id, 'diet_analysis', result)
                
                # Send response back
                await self._send_response(body.get('response_queue'), {
                    'request_id': request_id,
                    'status': 'completed',
                    'result': result if isinstance(result, dict) else {'data': result}
                })
                
            except Exception as e:
                logger.error(f"Error processing diet request: {e}")
                logger.error(traceback.format_exc())
                await self._handle_error(body, str(e))
    
    async def process_nutrition_request(self, message: aio_pika.IncomingMessage):
        """Process nutrition analysis requests."""
        async with message.process():
            try:
                body = json.loads(message.body.decode())
                logger.info(f"Processing nutrition request: {body.get('request_id', 'unknown')}")
                
                request_type = body.get('type')
                request_id = body.get('request_id')
                
                if request_type == 'hydration_update':
                    user_id = body.get('user_id')
                    water_amount = body.get('water_amount_ml')
                    
                    # Update hydration tracking
                    hydration_tracker = HydrationTracker()
                    
                    # Load current hydration from database
                    user_hydration = await self.db.hydration.find_one({
                        'user_id': user_id,
                        'date': datetime.now().strftime('%Y-%m-%d')
                    })
                    
                    if user_hydration:
                        hydration_tracker.current_intake = user_hydration.get('total_intake', 0)
                    
                    # Add new water intake
                    hydration_tracker.add_water(water_amount)
                    
                    # Update database
                    await self.db.hydration.update_one(
                        {
                            'user_id': user_id,
                            'date': datetime.now().strftime('%Y-%m-%d')
                        },
                        {
                            '$set': {
                                'total_intake': hydration_tracker.current_intake,
                                'updated_at': datetime.now()
                            }
                        },
                        upsert=True
                    )
                    
                    # Get hydration status
                    status = hydration_tracker.get_hydration_status()
                    
                    await self._send_response(body.get('response_queue'), {
                        'request_id': request_id,
                        'status': 'completed',
                        'result': status
                    })
                
                elif request_type == 'macro_tracking':
                    user_id = body.get('user_id')
                    nutrition_data = body.get('nutrition_data')
                    
                    # Store nutrition entry
                    await self.db.nutrition_entries.insert_one({
                        'user_id': user_id,
                        'date': datetime.now().strftime('%Y-%m-%d'),
                        'timestamp': datetime.now(),
                        'nutrition': nutrition_data,
                        'created_at': datetime.now()
                    })
                    
                    # Get daily summary
                    daily_entries = await self.db.nutrition_entries.find({
                        'user_id': user_id,
                        'date': datetime.now().strftime('%Y-%m-%d')
                    }).to_list(None)
                    
                    total_nutrition = {
                        'calories': sum(entry['nutrition'].get('calories', 0) for entry in daily_entries),
                        'protein': sum(entry['nutrition'].get('protein', 0) for entry in daily_entries),
                        'carbs': sum(entry['nutrition'].get('carbs', 0) for entry in daily_entries),
                        'fat': sum(entry['nutrition'].get('fat', 0) for entry in daily_entries)
                    }
                    
                    await self._send_response(body.get('response_queue'), {
                        'request_id': request_id,
                        'status': 'completed',
                        'result': {
                            'daily_total': total_nutrition,
                            'entry_count': len(daily_entries)
                        }
                    })
                
            except Exception as e:
                logger.error(f"Error processing nutrition request: {e}")
                await self._handle_error(body, str(e))
    
    async def process_image_request(self, message: aio_pika.IncomingMessage):
        """Process food image analysis requests."""
        async with message.process():
            try:
                body = json.loads(message.body.decode())
                logger.info(f"Processing image request: {body.get('request_id', 'unknown')}")
                
                request_id = body.get('request_id')
                user_data = body.get('user_profile')
                image_data_b64 = body.get('image_data')
                
                # Decode image data
                image_data = base64.b64decode(image_data_b64)
                
                # Validate and preprocess image
                if not ImagePreprocessor.validate_image(image_data):
                    raise ValueError("Invalid image format")
                
                # Resize image for processing
                processed_image = ImagePreprocessor.resize_image(image_data)
                enhanced_image = ImagePreprocessor.enhance_food_image(processed_image)
                
                # Create user profile
                user_profile = UserProfile(**user_data)
                
                # Analyze image with diet agent
                diet_advice = await self.diet_agent.analyze_food_image(enhanced_image, user_profile)
                
                # Store analysis result
                await self._store_result(request_id, 'image_analysis', diet_advice.dict())
                
                # Store image analysis in database
                await self.db.image_analyses.insert_one({
                    'request_id': request_id,
                    'user_id': user_profile.user_id,
                    'timestamp': datetime.now(),
                    'analysis': diet_advice.dict(),
                    'image_size': len(image_data),
                    'processed_size': len(enhanced_image)
                })
                
                # Send response
                await self._send_response(body.get('response_queue'), {
                    'request_id': request_id,
                    'status': 'completed',
                    'result': diet_advice.dict()
                })
                
            except Exception as e:
                logger.error(f"Error processing image request: {e}")
                logger.error(traceback.format_exc())
                await self._handle_error(body, str(e))
    
    async def _store_result(self, request_id: str, analysis_type: str, result: Any):
        """Store analysis result in database."""
        try:
            await self.db.analysis_results.insert_one({
                'request_id': request_id,
                'type': analysis_type,
                'result': result,
                'timestamp': datetime.now(),
                'status': 'completed'
            })
        except Exception as e:
            logger.error(f"Error storing result: {e}")
    
    async def _send_response(self, response_queue: str, response_data: Dict[str, Any]):
        """Send response back to the requesting service."""
        if not response_queue:
            return
        
        try:
            response_queue_obj = await self.channel.declare_queue(response_queue, durable=True)
            
            message = Message(
                json.dumps(response_data).encode(),
                delivery_mode=DeliveryMode.PERSISTENT,
            )
            
            await self.channel.default_exchange.publish(
                message,
                routing_key=response_queue
            )
            
        except Exception as e:
            logger.error(f"Error sending response: {e}")
    
    async def _handle_error(self, original_body: Dict, error_message: str):
        """Handle errors and send error response."""
        try:
            error_response = {
                'request_id': original_body.get('request_id'),
                'status': 'error',
                'error': error_message,
                'timestamp': datetime.now().isoformat()
            }
            
            # Store error in database
            await self.db.analysis_errors.insert_one({
                'request_id': original_body.get('request_id'),
                'error': error_message,
                'original_request': original_body,
                'timestamp': datetime.now()
            })
            
            # Send error response
            if original_body.get('response_queue'):
                await self._send_response(original_body.get('response_queue'), error_response)
                
        except Exception as e:
            logger.error(f"Error in error handler: {e}")

# Worker startup function
async def main():
    """Main worker startup function."""
    worker = DietWorker()
    
    try:
        await worker.connect()
        logger.info("Diet AI Worker started successfully")
        await worker.start_consuming()
        
    except KeyboardInterrupt:
        logger.info("Worker shutdown requested")
    except Exception as e:
        logger.error(f"Worker failed: {e}")
        logger.error(traceback.format_exc())
    finally:
        await worker.disconnect()
        logger.info("Worker disconnected")

if __name__ == "__main__":
    asyncio.run(main())