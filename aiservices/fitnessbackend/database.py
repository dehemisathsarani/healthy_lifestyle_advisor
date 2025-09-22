from motor.motor_asyncio import AsyncIOMotorClient
from fastapi import Depends
from settings import settings

# Database connection setup
if settings.USE_FILE_DATABASE:
    # Use file-based database for testing
    from alternative_database import get_test_database
    database = None  # Will be handled by get_test_database()
else:
    # Use MongoDB
    try:
        mongo_client = AsyncIOMotorClient(settings.MONGODB_URL)
        # Main health agent database - will contain all collections including workout plans
        database = mongo_client[settings.DB_NAME]
    except Exception as e:
        print(f"Warning: MongoDB connection failed: {e}")
        print("Falling back to file-based database")
        from alternative_database import get_test_database
        database = None  # Will be handled by get_test_database()

# Collection names for the health agent database
COLLECTIONS = {
    # Health tracking collections
    "heart_rate": "heart_rate_metrics",
    "steps": "step_metrics",
    "sleep": "sleep_metrics", 
    "calories": "calorie_metrics",
    "blood_pressure": "blood_pressure_metrics",
    "oxygen": "oxygen_saturation_metrics",
    "devices": "connected_devices",
    "insights": "health_insights",
    "recovery": "recovery_advice",
    
    # Fitness/workout collections - new additions to health database
    "workout_plans": "workout_plans",
    "workout_history": "workout_history", 
    "exercise_library": "exercise_library",
    "user_profiles": "user_profiles",
    
    # Workout planner data collections - stores all user input from workout planner
    "user_personal_info": "user_personal_info",
    "fitness_goals": "fitness_goals",
    "workout_preferences": "workout_preferences",
    "generated_workout_plans": "generated_workout_plans",
    "workout_planner_sessions": "workout_planner_sessions"
}


async def get_database():
    """
    Dependency to get the main database instance (MongoDB or file-based)
    """
    if settings.USE_FILE_DATABASE or database is None:
        from alternative_database import get_test_database
        return await get_test_database()
    return database
