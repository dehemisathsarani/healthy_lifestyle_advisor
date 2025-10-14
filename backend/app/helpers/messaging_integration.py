"""
Messaging Integration Helper
Add these functions to your existing meal logging and workout completion code
WITHOUT modifying your existing functionality
"""

import requests
import logging
from datetime import datetime
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Configuration
MESSAGING_SERVICE_URL = "http://localhost:8005"  # Backend messaging service


def publish_meal_logged_event(
    meal_name: str,
    user_id: str,
    meal_time: str,  # "breakfast", "lunch", "dinner", "snack"
    calorie_count: int,
    protein: Optional[int] = None,
    carbs: Optional[int] = None,
    fat: Optional[int] = None,
    fiber: Optional[int] = None,
    food_items: Optional[list] = None
) -> bool:
    """
    Publish meal_logged event to messaging system
    Call this AFTER saving the meal to your database
    
    Args:
        meal_name: Name/description of the meal
        user_id: User identifier
        meal_time: Meal category (breakfast, lunch, dinner, snack)
        calorie_count: Total calories in the meal
        protein: Protein in grams (optional)
        carbs: Carbohydrates in grams (optional)
        fat: Fat in grams (optional)
        fiber: Fiber in grams (optional)
        food_items: List of food items in the meal (optional)
    
    Returns:
        bool: True if published successfully, False otherwise
    
    Example:
        # In your existing meal logging endpoint, add this:
        success = publish_meal_logged_event(
            meal_name="Healthy Breakfast",
            user_id=current_user.id,
            meal_time="breakfast",
            calorie_count=450,
            protein=25,
            carbs=55,
            fat=15
        )
    """
    try:
        message_data = {
            "name": meal_name,
            "userId": user_id,
            "mealTime": meal_time,
            "calorieCount": calorie_count
        }
        
        # Add optional fields
        if protein is not None:
            message_data["protein"] = protein
        if carbs is not None:
            message_data["carbs"] = carbs
        if fat is not None:
            message_data["fat"] = fat
        if fiber is not None:
            message_data["fiber"] = fiber
        if food_items:
            message_data["foodItems"] = food_items
        
        logger.info(f"📤 Publishing meal_logged event for user {user_id}")
        
        response = requests.post(
            f"{MESSAGING_SERVICE_URL}/api/messaging/diet/meal-logged",
            json=message_data,
            timeout=5
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                logger.info(f"✅ Meal event published: {result.get('data', {}).get('message_id')}")
                return True
            else:
                logger.error(f"❌ Failed to publish meal event: {result.get('message')}")
                return False
        else:
            logger.error(f"❌ Messaging service error: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Could not connect to messaging service: {e}")
        # Don't fail the meal logging if messaging fails
        return False
    except Exception as e:
        logger.error(f"❌ Unexpected error publishing meal event: {e}")
        return False


def publish_workout_completed_event(
    workout_name: str,
    user_id: str,
    exercise_duration: int,  # in minutes
    calories_burnt: int,
    workout_type: Optional[str] = None,  # "cardio", "strength", "flexibility", etc.
    intensity: Optional[str] = None,  # "low", "moderate", "high"
    exercises: Optional[list] = None,
    heart_rate: Optional[int] = None
) -> bool:
    """
    Publish workout_completed event to messaging system
    Call this AFTER saving the workout to your database
    
    Args:
        workout_name: Name/description of the workout
        user_id: User identifier
        exercise_duration: Duration in minutes
        calories_burnt: Total calories burned
        workout_type: Type of workout (optional)
        intensity: Intensity level (optional)
        exercises: List of exercises performed (optional)
        heart_rate: Average heart rate (optional)
    
    Returns:
        bool: True if published successfully, False otherwise
    
    Example:
        # In your existing workout completion endpoint, add this:
        success = publish_workout_completed_event(
            workout_name="Morning Run",
            user_id=current_user.id,
            exercise_duration=30,
            calories_burnt=320,
            workout_type="cardio",
            intensity="moderate"
        )
    """
    try:
        message_data = {
            "name": workout_name,
            "userId": user_id,
            "exerciseDuration": exercise_duration,
            "caloriesBurnt": calories_burnt
        }
        
        # Add optional fields
        if workout_type:
            message_data["workoutType"] = workout_type
        if intensity:
            message_data["intensity"] = intensity
        if exercises:
            message_data["exercises"] = exercises
        if heart_rate is not None:
            message_data["heartRate"] = heart_rate
        
        logger.info(f"📤 Publishing workout_completed event for user {user_id}")
        
        response = requests.post(
            f"{MESSAGING_SERVICE_URL}/api/messaging/fitness/workout-completed",
            json=message_data,
            timeout=5
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                logger.info(f"✅ Workout event published: {result.get('data', {}).get('message_id')}")
                return True
            else:
                logger.error(f"❌ Failed to publish workout event: {result.get('message')}")
                return False
        else:
            logger.error(f"❌ Messaging service error: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Could not connect to messaging service: {e}")
        # Don't fail the workout logging if messaging fails
        return False
    except Exception as e:
        logger.error(f"❌ Unexpected error publishing workout event: {e}")
        return False


# ============================================================================
# INTEGRATION EXAMPLES
# ============================================================================

def example_meal_logging_integration():
    """
    Example: How to integrate with your existing meal logging endpoint
    
    Add the publish call AFTER successfully saving to database
    """
    
    # YOUR EXISTING CODE (don't change this):
    # meal = save_meal_to_database(meal_data)
    # 
    # ADD THIS NEW CODE (just add these lines):
    
    try:
        # Publish event to messaging system
        publish_meal_logged_event(
            meal_name=meal_data.get('name'),
            user_id=current_user_id,
            meal_time=meal_data.get('meal_type'),  # Your field name might be different
            calorie_count=meal_data.get('calories'),
            protein=meal_data.get('protein'),
            carbs=meal_data.get('carbs'),
            fat=meal_data.get('fat')
        )
        # Messaging happens in background - doesn't affect your response
    except Exception as e:
        logger.error(f"Messaging error: {e}")
        # Continue anyway - don't fail the meal logging
    
    # YOUR EXISTING CODE (don't change this):
    # return {"success": True, "meal": meal}


def example_workout_completion_integration():
    """
    Example: How to integrate with your existing workout completion endpoint
    
    Add the publish call AFTER successfully saving to database
    """
    
    # YOUR EXISTING CODE (don't change this):
    # workout = save_workout_to_database(workout_data)
    # 
    # ADD THIS NEW CODE (just add these lines):
    
    try:
        # Publish event to messaging system
        publish_workout_completed_event(
            workout_name=workout_data.get('name'),
            user_id=current_user_id,
            exercise_duration=workout_data.get('duration'),
            calories_burnt=workout_data.get('calories_burnt'),
            workout_type=workout_data.get('workout_type'),
            intensity=workout_data.get('intensity')
        )
        # Messaging happens in background - doesn't affect your response
    except Exception as e:
        logger.error(f"Messaging error: {e}")
        # Continue anyway - don't fail the workout logging
    
    # YOUR EXISTING CODE (don't change this):
    # return {"success": True, "workout": workout}


# ============================================================================
# ASYNC VERSION (if you're using async/await in your endpoints)
# ============================================================================

async def publish_meal_logged_event_async(
    meal_name: str,
    user_id: str,
    meal_time: str,
    calorie_count: int,
    **kwargs
) -> bool:
    """
    Async version for async endpoints
    """
    import httpx
    
    try:
        message_data = {
            "name": meal_name,
            "userId": user_id,
            "mealTime": meal_time,
            "calorieCount": calorie_count,
            **kwargs
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{MESSAGING_SERVICE_URL}/api/messaging/diet/meal-logged",
                json=message_data,
                timeout=5.0
            )
            
            return response.status_code == 200
            
    except Exception as e:
        logger.error(f"❌ Async messaging error: {e}")
        return False


async def publish_workout_completed_event_async(
    workout_name: str,
    user_id: str,
    exercise_duration: int,
    calories_burnt: int,
    **kwargs
) -> bool:
    """
    Async version for async endpoints
    """
    import httpx
    
    try:
        message_data = {
            "name": workout_name,
            "userId": user_id,
            "exerciseDuration": exercise_duration,
            "caloriesBurnt": calories_burnt,
            **kwargs
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{MESSAGING_SERVICE_URL}/api/messaging/fitness/workout-completed",
                json=message_data,
                timeout=5.0
            )
            
            return response.status_code == 200
            
    except Exception as e:
        logger.error(f"❌ Async messaging error: {e}")
        return False
