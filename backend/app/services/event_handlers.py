"""
Event Handlers for Diet-Fitness Messaging
Processes meal_logged and workout_completed events and updates user profiles
"""

import json
import logging
from typing import Dict, Any
from datetime import datetime
import asyncio

logger = logging.getLogger(__name__)


# ============================================================================
# FITNESS AGENT EVENT HANDLER
# Consumes meal_logged events from Diet Agent
# ============================================================================

class FitnessEventHandler:
    """Handles incoming meal_logged events from Diet Agent"""
    
    def __init__(self):
        """Initialize the fitness event handler"""
        self.processed_events = set()  # Track processed event IDs for idempotency
        
    async def handle_meal_logged(self, message: Dict[str, Any]) -> None:
        """
        Process meal_logged event and update fitness profile
        
        Message structure:
        {
            'event_name': 'meal_logged',
            'user_id': 'user_123',
            'timestamp': '2025-10-13T08:30:00Z',
            'source': 'diet_agent',
            'summary_card': {
                'id': 'uuid',
                'name': 'Breakfast',
                'time': '08:30:00',
                'date': '2025-10-13',
                'userId': 'user_123',
                'mealTime': 'breakfast',
                'calorieCount': 470,
                'protein': 20,
                'carbs': 60,
                'fat': 15
            }
        }
        """
        try:
            # Extract message data
            event_name = message.get('event_name')
            user_id = message.get('user_id')
            summary = message.get('summary_card', {})
            
            # Get message attributes
            message_id = summary.get('id')
            meal_name = summary.get('name')
            meal_time = summary.get('time')
            meal_date = summary.get('date')
            meal_category = summary.get('mealTime')
            calorie_count = summary.get('calorieCount', 0)
            
            logger.info(f"📥 FITNESS AGENT: Processing meal_logged event")
            logger.info(f"   Message ID: {message_id}")
            logger.info(f"   User: {user_id}")
            logger.info(f"   Meal: {meal_name} ({meal_category})")
            logger.info(f"   Calories: {calorie_count} kcal")
            logger.info(f"   Time: {meal_date} {meal_time}")
            
            # Check for duplicate processing
            if message_id in self.processed_events:
                logger.warning(f"⚠️  Event {message_id} already processed, skipping")
                return
            
            # ================================================================
            # UPDATE FITNESS PROFILE BASED ON MEAL DATA
            # ================================================================
            
            # 1. Calculate updated calorie balance
            daily_consumed = calorie_count  # In real app, get running total from DB
            daily_burn_goal = 2200  # Get from user profile
            
            # 2. Calculate remaining calories to burn
            remaining_burn = max(0, daily_burn_goal - daily_consumed)
            
            # 3. Update user's calorie target
            profile_updates = {
                'last_meal_time': f"{meal_date}T{meal_time}",
                'daily_calories_consumed': daily_consumed,
                'remaining_burn_target': remaining_burn,
                'last_updated': datetime.now().isoformat()
            }
            
            logger.info(f"📊 FITNESS PROFILE UPDATE:")
            logger.info(f"   Daily consumed: {daily_consumed} kcal")
            logger.info(f"   Burn goal: {daily_burn_goal} kcal")
            logger.info(f"   Remaining to burn: {remaining_burn} kcal")
            
            # 4. Generate workout recommendations based on calories
            if remaining_burn > 500:
                recommendation = f"🏃 High-intensity workout recommended: Burn {remaining_burn} kcal"
                suggested_workout = "45-min cardio session"
            elif remaining_burn > 300:
                recommendation = f"🚶 Moderate workout suggested: Burn {remaining_burn} kcal"
                suggested_workout = "30-min brisk walk"
            elif remaining_burn > 0:
                recommendation = f"✨ Light activity: Burn {remaining_burn} kcal"
                suggested_workout = "20-min yoga or stretching"
            else:
                recommendation = "✅ Calorie goal met! Consider light activity"
                suggested_workout = "Gentle stretching"
            
            logger.info(f"💡 RECOMMENDATION: {recommendation}")
            logger.info(f"   Suggested: {suggested_workout}")
            
            # 5. Generate detailed workout plan
            from app.services.workout_recommendation_service import workout_recommendation_service
            workout_plan = workout_recommendation_service.recommend_workout(
                remaining_calories=remaining_burn,
                meal_time=meal_category
            )
            
            logger.info(f"📋 WORKOUT PLAN GENERATED:")
            logger.info(f"   Name: {workout_plan.get('name')}")
            logger.info(f"   Duration: {workout_plan.get('duration')} minutes")
            logger.info(f"   Est. Burn: {workout_plan.get('estimated_burn')} kcal")
            
            # 6. Store updates in database (pseudo-code - implement with your DB)
            # await fitness_db.update_user_profile(user_id, profile_updates)
            
            # 7. Send notification to user with workout recommendation
            from app.services.notification_service import notification_service
            await notification_service.send_workout_recommendation(
                user_id=user_id,
                meal_calories=calorie_count,
                remaining_burn=remaining_burn,
                workout_plan=workout_plan
            )
            
            # 8. Mark event as processed
            self.processed_events.add(message_id)
            
            logger.info(f"✅ FITNESS AGENT: Successfully processed meal_logged for user {user_id}")
            
        except Exception as e:
            logger.error(f"❌ FITNESS AGENT: Error handling meal_logged: {e}")
            # Don't raise - we don't want to stop processing other messages


# ============================================================================
# DIET AGENT EVENT HANDLER
# Consumes workout_completed events from Fitness Agent
# ============================================================================

class DietEventHandler:
    """Handles incoming workout_completed events from Fitness Agent"""
    
    def __init__(self):
        """Initialize the diet event handler"""
        self.processed_events = set()  # Track processed event IDs for idempotency
        
    async def handle_workout_completed(self, message: Dict[str, Any]) -> None:
        """
        Process workout_completed event and update diet profile
        
        Message structure:
        {
            'event_name': 'workout_completed',
            'user_id': 'user_123',
            'timestamp': '2025-10-13T10:00:00Z',
            'source': 'fitness_agent',
            'summary_card': {
                'id': 'uuid',
                'name': 'Morning Cardio',
                'date': '2025-10-13',
                'userId': 'user_123',
                'exerciseDuration': 45,
                'caloriesBurnt': 520,
                'workoutType': 'cardio'
            }
        }
        """
        try:
            # Extract message data
            event_name = message.get('event_name')
            user_id = message.get('user_id')
            summary = message.get('summary_card', {})
            
            # Get message attributes
            message_id = summary.get('id')
            workout_name = summary.get('name')
            workout_date = summary.get('date')
            exercise_duration = summary.get('exerciseDuration', 0)
            calories_burnt = summary.get('caloriesBurnt', 0)
            workout_type = summary.get('workoutType', 'exercise')
            
            logger.info(f"📥 DIET AGENT: Processing workout_completed event")
            logger.info(f"   Message ID: {message_id}")
            logger.info(f"   User: {user_id}")
            logger.info(f"   Workout: {workout_name} ({workout_type})")
            logger.info(f"   Duration: {exercise_duration} minutes")
            logger.info(f"   Calories Burnt: {calories_burnt} kcal")
            logger.info(f"   Date: {workout_date}")
            
            # Check for duplicate processing
            if message_id in self.processed_events:
                logger.warning(f"⚠️  Event {message_id} already processed, skipping")
                return
            
            # ================================================================
            # UPDATE DIET PROFILE BASED ON WORKOUT DATA
            # ================================================================
            
            # 1. Calculate updated calorie balance
            daily_consumed = 1800  # Get from user profile/DB
            daily_goal = 2500  # Get from user profile
            daily_burnt = calories_burnt  # In real app, get running total
            
            # 2. Calculate net calories and remaining allowance
            net_calories = daily_consumed - daily_burnt
            remaining_allowance = max(0, daily_goal - net_calories)
            
            # 3. Update user's nutrition targets
            profile_updates = {
                'last_workout_time': workout_date,
                'daily_calories_burned': daily_burnt,
                'net_calories': net_calories,
                'remaining_calorie_allowance': remaining_allowance,
                'last_updated': datetime.now().isoformat()
            }
            
            logger.info(f"📊 DIET PROFILE UPDATE:")
            logger.info(f"   Daily consumed: {daily_consumed} kcal")
            logger.info(f"   Daily burned: {daily_burnt} kcal")
            logger.info(f"   Net calories: {net_calories} kcal")
            logger.info(f"   Remaining allowance: {remaining_allowance} kcal")
            
            # 4. Generate nutrition recommendations based on workout
            if remaining_allowance > 600:
                recommendation = f"🍽️ Great workout! You can have {remaining_allowance} kcal more today"
                suggested_meal = "Balanced dinner with protein and complex carbs"
            elif remaining_allowance > 300:
                recommendation = f"🥗 Good job! {remaining_allowance} kcal remaining for today"
                suggested_meal = "Light dinner or healthy snack"
            elif remaining_allowance > 0:
                recommendation = f"✨ Almost at goal! {remaining_allowance} kcal left"
                suggested_meal = "Small healthy snack"
            else:
                recommendation = "✅ Daily calorie goal achieved!"
                suggested_meal = "Stay hydrated, avoid heavy meals"
            
            # 5. Protein recommendation after workout
            if workout_type in ['strength', 'resistance', 'weightlifting']:
                protein_needed = int(exercise_duration * 0.5)  # Rough estimate
                recommendation += f" | 💪 Consider {protein_needed}g protein for muscle recovery"
            
            logger.info(f"💡 RECOMMENDATION: {recommendation}")
            logger.info(f"   Suggested: {suggested_meal}")
            
            # 6. Generate detailed nutrition recommendation
            from app.services.workout_recommendation_service import workout_recommendation_service
            from datetime import datetime
            
            current_hour = datetime.now().hour
            if current_hour < 12:
                time_of_day = 'morning'
            elif current_hour < 17:
                time_of_day = 'afternoon'
            else:
                time_of_day = 'evening'
            
            nutrition_rec = workout_recommendation_service.get_nutrition_recommendation(
                calories_burnt=calories_burnt,
                workout_intensity=workout_type,
                time_of_day=time_of_day
            )
            
            logger.info(f"🥗 NUTRITION GUIDANCE: {nutrition_rec}")
            
            # 7. Store updates in database (pseudo-code - implement with your DB)
            # await diet_db.update_user_profile(user_id, profile_updates)
            
            # 8. Send notification to user with calorie balance update
            from app.services.notification_service import notification_service
            await notification_service.send_calorie_balance_update(
                user_id=user_id,
                workout_name=workout_name,
                calories_burnt=calories_burnt,
                new_allowance=remaining_allowance,
                nutrition_recommendation=nutrition_rec
            )
            
            # 9. Check if daily goal achieved
            if remaining_allowance <= 100:  # Within 100 kcal of goal
                await notification_service.send_calorie_goal_achieved(
                    user_id=user_id,
                    total_consumed=daily_consumed,
                    total_burnt=calories_burnt
                )
            
            # 10. Mark event as processed
            self.processed_events.add(message_id)
            
            logger.info(f"✅ DIET AGENT: Successfully processed workout_completed for user {user_id}")
            
        except Exception as e:
            logger.error(f"❌ DIET AGENT: Error handling workout_completed: {e}")
            # Don't raise - we don't want to stop processing other messages


# ============================================================================
# MESSAGE CONSUMER CALLBACKS
# ============================================================================

# Initialize handlers
fitness_handler = FitnessEventHandler()
diet_handler = DietEventHandler()


def process_diet_message_callback(ch, method, properties, body):
    """
    Callback for RabbitMQ consumer in Fitness Agent
    Processes messages from diet_to_fitness_queue
    """
    try:
        # Parse message
        message = json.loads(body)
        event_name = message.get('event_name')
        
        logger.info(f"📨 Fitness Agent received: {event_name} from {message.get('source')}")
        
        # Route to appropriate handler
        if event_name == 'meal_logged':
            # Run async handler
            asyncio.run(fitness_handler.handle_meal_logged(message))
        else:
            logger.warning(f"⚠️  Unknown event type: {event_name}")
        
        # Acknowledge message (remove from queue)
        ch.basic_ack(delivery_tag=method.delivery_tag)
        
    except json.JSONDecodeError as e:
        logger.error(f"❌ Invalid JSON in message: {e}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
    except Exception as e:
        logger.error(f"❌ Error processing message: {e}")
        # Negative acknowledgment - requeue for retry
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)


def process_fitness_message_callback(ch, method, properties, body):
    """
    Callback for RabbitMQ consumer in Diet Agent
    Processes messages from fitness_to_diet_queue
    """
    try:
        # Parse message
        message = json.loads(body)
        event_name = message.get('event_name')
        
        logger.info(f"📨 Diet Agent received: {event_name} from {message.get('source')}")
        
        # Route to appropriate handler
        if event_name == 'workout_completed':
            # Run async handler
            asyncio.run(diet_handler.handle_workout_completed(message))
        else:
            logger.warning(f"⚠️  Unknown event type: {event_name}")
        
        # Acknowledge message (remove from queue)
        ch.basic_ack(delivery_tag=method.delivery_tag)
        
    except json.JSONDecodeError as e:
        logger.error(f"❌ Invalid JSON in message: {e}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
    except Exception as e:
        logger.error(f"❌ Error processing message: {e}")
        # Negative acknowledgment - requeue for retry
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)
