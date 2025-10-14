"""
Backend Messaging Routes for Meal → Fitness → Diet Integration
Handles workout completion messages and calorie updates
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
import uuid

from app.services.rabbitmq_service import RabbitMQService

router = APIRouter(prefix="/api/integration", tags=["integration"])

# Data Models
class MealData(BaseModel):
    name: str  # Meal name/description
    userId: str
    mealTime: str
    calorieCount: int
    protein: float
    carbs: float
    fat: float
    timestamp: str
    userProfile: dict

class WorkoutData(BaseModel):
    name: str  # Workout name/description
    userId: str
    workoutType: Optional[str] = None  # Optional for compatibility
    exerciseDuration: int  # Duration in minutes (matches existing API)
    duration: Optional[int] = None  # Keep for backward compatibility
    caloriesBurnt: int  # Matches existing API spelling
    caloriesBurned: Optional[int] = None  # Keep for backward compatibility
    date: str = None  # Date of workout
    timestamp: str
    relatedMealId: Optional[str] = None
    
    def __init__(self, **data):
        # Auto-populate date if not provided
        if 'date' not in data or not data['date']:
            data['date'] = datetime.now().strftime("%Y-%m-%d")
        # Support both spellings of caloriesBurned/caloriesBurnt
        if 'caloriesBurned' in data and 'caloriesBurnt' not in data:
            data['caloriesBurnt'] = data['caloriesBurned']
        if 'duration' in data and 'exerciseDuration' not in data:
            data['exerciseDuration'] = data['duration']
        super().__init__(**data)

class CalorieUpdate(BaseModel):
    userId: str
    caloriesBurned: int
    mealId: Optional[str] = None
    timestamp: str

# In-memory storage (replace with database in production)
workout_completions = {}
calorie_updates = {}
meal_logs = {}

@router.post("/diet/meal-logged")
async def meal_logged(meal_data: MealData):
    """
    Receives meal data from food analysis and sends to Fitness Agent
    
    Process:
    1. Store meal data
    2. Create message for fitness agent queue
    3. Return success with message ID
    """
    try:
        message_id = str(uuid.uuid4())
        
        # Store meal data
        meal_logs[message_id] = {
            **meal_data.dict(),
            "message_id": message_id,
            "created_at": datetime.now().isoformat()
        }
        
        # Log the meal logging event
        print("=" * 60)
        print("🍽️  MEAL LOGGED - SENDING TO FITNESS AGENT")
        print("=" * 60)
        print(f"Message ID: {message_id}")
        print(f"User ID: {meal_data.userId}")
        print(f"Meal Time: {meal_data.mealTime}")
        print(f"Calories: {meal_data.calorieCount} kcal")
        print(f"Protein: {meal_data.protein}g")
        print(f"Carbs: {meal_data.carbs}g")
        print(f"Fat: {meal_data.fat}g")
        print(f"User Profile:")
        print(f"  - Age: {meal_data.userProfile.get('age', 'N/A')}")
        print(f"  - Weight: {meal_data.userProfile.get('weight_kg', 'N/A')} kg")
        print(f"  - Goal: {meal_data.userProfile.get('goal', 'N/A')}")
        print(f"  - Activity Level: {meal_data.userProfile.get('activity_level', 'N/A')}")
        print("=" * 60)
        print("✅ Message ready for Fitness Agent consumption")
        print("=" * 60)
        
        # TODO: Send to RabbitMQ/CloudAMQP queue for fitness agent
        # await publish_message("fitness_agent_queue", meal_logs[message_id])
        
        return {
            "success": True,
            "message_id": message_id,
            "data": {
                "userId": meal_data.userId,
                "calorieCount": meal_data.calorieCount,
                "message_id": message_id,
                "timestamp": datetime.now().isoformat()
            },
            "message": f"Meal logged successfully. {meal_data.calorieCount} calories recorded."
        }
        
    except Exception as e:
        print(f"❌ Error logging meal: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to log meal: {str(e)}")


@router.post("/fitness/workout-completed")
async def workout_completed(workout_data: WorkoutData):
    """
    Receives workout completion data and updates diet profile
    
    Process:
    1. Store workout completion data
    2. Calculate net calories if meal is linked
    3. Send notification to user
    4. Update nutrition profile
    """
    try:
        workout_id = str(uuid.uuid4())
        
        # Store workout data
        workout_completions[workout_id] = {
            **workout_data.dict(),
            "workout_id": workout_id,
            "created_at": datetime.now().isoformat()
        }
        
        # Calculate net calories if meal is linked
        net_calories = 0
        meal_calories = 0
        
        if workout_data.relatedMealId and workout_data.relatedMealId in meal_logs:
            meal = meal_logs[workout_data.relatedMealId]
            meal_calories = meal.get("calorieCount", 0)
            net_calories = meal_calories - workout_data.caloriesBurnt
        
        # Log workout completion
        print("=" * 60)
        print("💪 WORKOUT COMPLETED - UPDATING DIET PROFILE")
        print("=" * 60)
        print(f"Workout ID: {workout_id}")
        print(f"User ID: {workout_data.userId}")
        print(f"Workout Name: {workout_data.name}")
        print(f"Workout Type: {workout_data.workoutType or 'Not specified'}")
        print(f"Duration: {workout_data.exerciseDuration} minutes")
        print(f"Calories Burned: {workout_data.caloriesBurnt} kcal")
        
        if workout_data.relatedMealId:
            print(f"Related Meal: {workout_data.relatedMealId}")
            print(f"Meal Calories: {meal_calories} kcal")
            print(f"Net Calories: {net_calories} kcal")
        
        print("=" * 60)
        print("✅ Workout completion recorded")
        print("=" * 60)
        
        # TODO: Send notification to user
        # await send_notification(workout_data.userId, {
        #     "type": "workout_completed",
        #     "title": "💪 Workout Completed!",
        #     "message": f"Great job! You burned {workout_data.caloriesBurned} calories.",
        #     "data": workout_completions[workout_id]
        # })
        
        return {
            "success": True,
            "workout_id": workout_id,
            "netCalories": net_calories,
            "data": {
                "userId": workout_data.userId,
                "caloriesBurnt": workout_data.caloriesBurnt,
                "caloriesBurned": workout_data.caloriesBurnt,  # Include both for compatibility
                "netCalories": net_calories,
                "workout_id": workout_id,
                "timestamp": datetime.now().isoformat()
            },
            "message": f"Workout completed! Burned {workout_data.caloriesBurnt} calories."
        }
        
    except Exception as e:
        print(f"❌ Error recording workout completion: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to record workout: {str(e)}")


@router.post("/nutrition/update-calories")
async def update_calories(calorie_update: CalorieUpdate):
    """
    Updates user's calorie balance after workout
    
    Process:
    1. Get meal data if meal ID provided
    2. Calculate net calories
    3. Update user's nutrition profile
    4. Return updated balance
    """
    try:
        update_id = str(uuid.uuid4())
        
        # Get meal data if available
        meal_calories = 0
        if calorie_update.mealId and calorie_update.mealId in meal_logs:
            meal = meal_logs[calorie_update.mealId]
            meal_calories = meal.get("calorieCount", 0)
        
        # Calculate net calories
        net_calories = meal_calories - calorie_update.caloriesBurned if meal_calories > 0 else -calorie_update.caloriesBurned
        
        # Store calorie update
        calorie_updates[update_id] = {
            **calorie_update.dict(),
            "update_id": update_id,
            "meal_calories": meal_calories,
            "net_calories": net_calories,
            "created_at": datetime.now().isoformat()
        }
        
        # Log calorie update
        print("=" * 60)
        print("📊 CALORIE BALANCE UPDATED")
        print("=" * 60)
        print(f"Update ID: {update_id}")
        print(f"User ID: {calorie_update.userId}")
        print(f"Calories Burned: {calorie_update.caloriesBurned} kcal")
        
        if calorie_update.mealId:
            print(f"Meal ID: {calorie_update.mealId}")
            print(f"Meal Calories: {meal_calories} kcal")
        
        print(f"Net Calories: {net_calories} kcal")
        print("=" * 60)
        print("✅ Calorie balance updated successfully")
        print("=" * 60)
        
        # TODO: Update database with new calorie balance
        # await update_user_nutrition_profile(
        #     user_id=calorie_update.userId,
        #     calories_burned=calorie_update.caloriesBurned,
        #     net_calories=net_calories
        # )
        
        return {
            "success": True,
            "update_id": update_id,
            "netCalories": net_calories,
            "data": {
                "userId": calorie_update.userId,
                "caloriesBurned": calorie_update.caloriesBurned,
                "mealCalories": meal_calories,
                "netCalories": net_calories,
                "update_id": update_id,
                "timestamp": datetime.now().isoformat()
            },
            "message": f"Calorie balance updated. Net: {net_calories} kcal"
        }
        
    except Exception as e:
        print(f"❌ Error updating calorie balance: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update calories: {str(e)}")


@router.get("/nutrition/user/{user_id}/summary")
async def get_user_nutrition_summary(user_id: str):
    """
    Get user's nutrition summary including meals, workouts, and calorie balance
    """
    try:
        # Filter user's data
        user_meals = [m for m in meal_logs.values() if m.get("userId") == user_id]
        user_workouts = [w for w in workout_completions.values() if w.get("userId") == user_id]
        user_updates = [u for u in calorie_updates.values() if u.get("userId") == user_id]
        
        # Calculate totals
        total_calories_consumed = sum(m.get("calorieCount", 0) for m in user_meals)
        total_calories_burned = sum(w.get("caloriesBurned", 0) for w in user_workouts)
        net_calories = total_calories_consumed - total_calories_burned
        
        return {
            "success": True,
            "data": {
                "userId": user_id,
                "totalMeals": len(user_meals),
                "totalWorkouts": len(user_workouts),
                "totalCaloriesConsumed": total_calories_consumed,
                "totalCaloriesBurned": total_calories_burned,
                "netCalories": net_calories,
                "recentMeals": user_meals[-5:],
                "recentWorkouts": user_workouts[-5:],
                "recentUpdates": user_updates[-5:]
            }
        }
        
    except Exception as e:
        print(f"❌ Error getting nutrition summary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get summary: {str(e)}")
