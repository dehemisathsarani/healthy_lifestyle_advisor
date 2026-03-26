"""
Quick Test for Workout Plans & Health Tracking Data Storage
This test verifies that both workout plans and health tracking data are properly stored
"""
import asyncio
import sys
import os
from datetime import datetime, date
import json

# Add current directory to path
sys.path.append(os.path.dirname(__file__))

from database import get_database, COLLECTIONS

async def test_workout_plan_storage():
    """Test workout plan data storage"""
    print("🏋️ Testing Workout Plan Storage...")
    
    db = await get_database()
    
    # Test workout plan data
    workout_plan_data = {
        "id": "wp_test_001",
        "user_id": "user_123",
        "name": "Strength Building Plan",
        "description": "4-week strength training program",
        "goal": "strength",
        "difficulty": "intermediate",
        "duration_weeks": 4,
        "workouts_per_week": 3,
        "focus_areas": ["chest", "back", "legs", "shoulders"],
        "workouts": [
            {
                "id": "workout_001",
                "name": "Upper Body Strength",
                "focus": "upper_body",
                "total_duration": 60,
                "total_calories": 300,
                "exercises": [
                    {"name": "Push-ups", "sets": "3x12", "muscle_groups": ["chest", "triceps"]},
                    {"name": "Pull-ups", "sets": "3x8", "muscle_groups": ["back", "biceps"]}
                ]
            }
        ],
        "created_at": datetime.now().isoformat()
    }
    
    # Store workout plan
    result = await db[COLLECTIONS["workout_plans"]].insert_one(workout_plan_data)
    print(f"✅ Workout plan stored! ID: {result.get('inserted_id', 'success')}")
    
    # Retrieve and verify
    retrieved = await db[COLLECTIONS["workout_plans"]].find_one({"id": "wp_test_001"})
    if retrieved:
        print(f"✅ Workout plan retrieved: {retrieved['name']}")
        return True
    else:
        print("❌ Failed to retrieve workout plan")
        return False

async def test_health_tracking_storage():
    """Test health tracking data storage"""
    print("\n💖 Testing Health Tracking Storage...")
    
    db = await get_database()
    
    # Test heart rate data
    heart_rate_data = {
        "id": "hr_001",
        "user_id": "user_123",
        "bpm": 72,
        "activity_state": "rest",
        "timestamp": datetime.now().isoformat(),
        "source": "fitness_tracker"
    }
    
    result = await db[COLLECTIONS["heart_rate"]].insert_one(heart_rate_data)
    print(f"✅ Heart rate data stored! ID: {result.get('inserted_id', 'success')}")
    
    # Test step data
    step_data = {
        "id": "steps_001",
        "user_id": "user_123",
        "count": 8500,
        "distance_meters": 6800,
        "timestamp": datetime.now().isoformat(),
        "source": "fitness_tracker"
    }
    
    result = await db[COLLECTIONS["steps"]].insert_one(step_data)
    print(f"✅ Step data stored! ID: {result.get('inserted_id', 'success')}")
    
    # Test sleep data
    sleep_data = {
        "id": "sleep_001",
        "user_id": "user_123",
        "start_time": datetime.now().isoformat(),
        "end_time": datetime.now().isoformat(),
        "duration_minutes": 480,
        "deep_sleep_minutes": 120,
        "light_sleep_minutes": 300,
        "rem_sleep_minutes": 60,
        "sleep_score": 85,
        "timestamp": datetime.now().isoformat(),
        "source": "sleep_tracker"
    }
    
    result = await db[COLLECTIONS["sleep"]].insert_one(sleep_data)
    print(f"✅ Sleep data stored! ID: {result.get('inserted_id', 'success')}")
    
    # Verify retrieval
    retrieved_hr = await db[COLLECTIONS["heart_rate"]].find_one({"id": "hr_001"})
    retrieved_steps = await db[COLLECTIONS["steps"]].find_one({"id": "steps_001"})
    retrieved_sleep = await db[COLLECTIONS["sleep"]].find_one({"id": "sleep_001"})
    
    if retrieved_hr and retrieved_steps and retrieved_sleep:
        print("✅ All health tracking data retrieved successfully")
        return True
    else:
        print("❌ Failed to retrieve some health tracking data")
        return False

async def test_user_profile_storage():
    """Test user profile storage"""
    print("\n👤 Testing User Profile Storage...")
    
    db = await get_database()
    
    user_profile_data = {
        "id": "profile_001",
        "user_id": "user_123",
        "name": "John Doe",
        "age": 28,
        "gender": "male",
        "height_cm": 175.0,
        "weight_kg": 70.5,
        "fitness_level": "intermediate",
        "fitness_goal": "strength",
        "activity_level": "moderately_active",
        "medical_conditions": [],
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
    
    result = await db[COLLECTIONS["user_profiles"]].insert_one(user_profile_data)
    print(f"✅ User profile stored! ID: {result.get('inserted_id', 'success')}")
    
    # Retrieve and verify
    retrieved = await db[COLLECTIONS["user_profiles"]].find_one({"id": "profile_001"})
    if retrieved:
        print(f"✅ User profile retrieved: {retrieved['name']}")
        return True
    else:
        print("❌ Failed to retrieve user profile")
        return False

async def test_workout_completion_storage():
    """Test workout completion tracking"""
    print("\n📊 Testing Workout Completion Storage...")
    
    db = await get_database()
    
    workout_completion_data = {
        "id": "completion_001",
        "user_id": "user_123",
        "workout_id": "workout_001",
        "workout_plan_id": "wp_test_001",
        "completed_at": datetime.now().isoformat(),
        "duration": 55,  # minutes
        "calories_burned": 285,
        "exercises_completed": 8,
        "rating": 4,
        "notes": "Great workout, felt strong today!"
    }
    
    result = await db[COLLECTIONS["workout_history"]].insert_one(workout_completion_data)
    print(f"✅ Workout completion stored! ID: {result.get('inserted_id', 'success')}")
    
    # Retrieve and verify
    retrieved = await db[COLLECTIONS["workout_history"]].find_one({"id": "completion_001"})
    if retrieved:
        print(f"✅ Workout completion retrieved: Rating {retrieved['rating']}/5")
        return True
    else:
        print("❌ Failed to retrieve workout completion")
        return False

async def show_database_contents():
    """Show what's stored in the database"""
    print("\n📋 Database Contents Summary:")
    print("=" * 50)
    
    db = await get_database()
    
    for collection_key, collection_name in COLLECTIONS.items():
        try:
            # Count documents in collection
            docs = await db[collection_name].find({})
            count = len(docs) if isinstance(docs, list) else 0
            print(f"📂 {collection_key}: {count} records")
        except Exception as e:
            print(f"📂 {collection_key}: Error accessing ({str(e)[:50]})")

async def main():
    """Main test function"""
    print("🚀 QUICK FITNESS AGENT DATABASE TEST")
    print("=" * 60)
    
    results = []
    
    # Test all components
    results.append(await test_workout_plan_storage())
    results.append(await test_health_tracking_storage())
    results.append(await test_user_profile_storage())
    results.append(await test_workout_completion_storage())
    
    # Show database contents
    await show_database_contents()
    
    print("\n" + "=" * 60)
    if all(results):
        print("🎉 SUCCESS! All data storage tests passed!")
        print("\n✅ Your fitness agent can now store:")
        print("   - Workout plans and details")
        print("   - Health tracking data (heart rate, steps, sleep)")
        print("   - User profiles and preferences")
        print("   - Workout completion history")
        print("\n📁 Data Location: ./data/ directory (JSON files)")
        print("\n🚀 Ready to start fitness backend:")
        print("   Command: python -m uvicorn main:app --reload --port 8001")
    else:
        print("❌ Some tests failed. Check errors above.")
    
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())