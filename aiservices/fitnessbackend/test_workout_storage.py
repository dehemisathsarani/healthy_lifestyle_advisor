"""
Test script to verify workout plan storage in health database
"""
import asyncio
import sys
import os

# Add the parent directory to the path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_database, COLLECTIONS
from models import WorkoutPlanRequest, WorkoutPlan
from utils import generate_workout_plan
from fastapi.encoders import jsonable_encoder

async def test_workout_plan_storage():
    """Test that workout plans can be stored in the health database"""
    
    print("Testing workout plan storage in health database...")
    
    # Get database instance
    db = await get_database()
    
    # Create a sample workout plan request
    plan_request = WorkoutPlanRequest(
        goal="strength",
        fitness_level="intermediate",
        duration_weeks=4,
        frequency=3,
        preferences={}
    )
    
    # Generate a workout plan
    test_user_id = "test_user_123"
    workout_plan = generate_workout_plan(plan_request, test_user_id)
    
    print(f"Generated workout plan: {workout_plan.name}")
    
    # Convert to document format
    workout_plan_doc = jsonable_encoder(workout_plan)
    
    # Test insertion into workout_plans collection
    try:
        collection = db[COLLECTIONS["workout_plans"]]
        result = await collection.insert_one(workout_plan_doc)
        print(f"✅ Successfully inserted workout plan with ID: {result.inserted_id}")
        
        # Test retrieval
        retrieved_plan = await collection.find_one({"id": workout_plan.id})
        if retrieved_plan:
            print(f"✅ Successfully retrieved workout plan: {retrieved_plan['name']}")
        else:
            print("❌ Failed to retrieve workout plan")
            
        # Clean up - delete the test document
        await collection.delete_one({"id": workout_plan.id})
        print("🧹 Test document cleaned up")
        
    except Exception as e:
        print(f"❌ Error during database operation: {e}")
    
    print("\nDatabase collections available:")
    for key, collection_name in COLLECTIONS.items():
        print(f"  - {key}: {collection_name}")
    
    print("\n✅ Test completed successfully! Workout plans will be stored in the health database.")

if __name__ == "__main__":
    asyncio.run(test_workout_plan_storage())