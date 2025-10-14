"""
Test MongoDB Atlas Connection for Fitness Agent
This script tests the connection to your MongoDB Atlas database
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(__file__))

async def test_mongodb_atlas_connection():
    """Test MongoDB Atlas connection and create collections"""
    
    print("🏋️ TESTING MONGODB ATLAS CONNECTION FOR FITNESS AGENT")
    print("=" * 65)
    
    # Your MongoDB Atlas connection details
    MONGODB_URL = "mongodb+srv://Admin:X1bzjS2IGHrNHFgS@healthagent.ucnrbse.mongodb.net/HealthAgent"
    DB_NAME = "HealthAgent"
    
    try:
        print("🔗 Connecting to MongoDB Atlas...")
        client = AsyncIOMotorClient(MONGODB_URL)
        db = client[DB_NAME]
        
        # Test connection
        print("📡 Testing server connection...")
        await client.admin.command('ping')
        print("✅ MongoDB Atlas connection successful!")
        
        # List existing databases
        print("\n📊 Available databases:")
        databases = await client.list_database_names()
        for db_name in databases:
            print(f"   📁 {db_name}")
        
        # List existing collections in HealthAgent database
        print(f"\n📋 Collections in '{DB_NAME}' database:")
        collections = await db.list_collection_names()
        if collections:
            for collection in collections:
                count = await db[collection].count_documents({})
                print(f"   📄 {collection} ({count} documents)")
        else:
            print("   ⚪ No collections found (database is new)")
        
        # Create fitness agent collections
        print("\n🏗️ Creating Fitness Agent Collections...")
        
        fitness_collections = {
            # Workout Planner Collections
            "workout_planner_personal_info": "Personal information from workout planner forms",
            "workout_planner_fitness_goals": "Fitness goals from workout planner forms", 
            "workout_planner_preferences": "Workout preferences from forms",
            "workout_planner_sessions": "Complete workout planning sessions",
            
            # Workout Plans Collections
            "workout_plans": "User-created workout plans",
            "workout_history": "Completed workout records",
            "generated_workout_plans": "AI-generated workout plans",
            
            # Health Tracking Collections
            "heart_rate_metrics": "Heart rate data from health forms",
            "step_metrics": "Step count data from health forms",
            "sleep_metrics": "Sleep tracking data from health forms",
            "calorie_metrics": "Calorie burn data from health forms",
            "blood_pressure_metrics": "Blood pressure readings",
            "oxygen_saturation_metrics": "Blood oxygen saturation data",
            
            # Additional Collections
            "health_insights": "AI-generated health insights",
            "recovery_advice": "Recovery recommendations",
            "connected_devices": "User's connected fitness devices",
            "exercise_library": "Available exercises database"
        }
        
        for collection_name, description in fitness_collections.items():
            # Insert a sample document to create the collection
            sample_doc = {
                "_collection_info": {
                    "name": collection_name,
                    "description": description,
                    "created_at": datetime.utcnow(),
                    "fitness_agent_version": "1.0.0"
                },
                "sample_data": True
            }
            
            result = await db[collection_name].insert_one(sample_doc)
            print(f"   ✅ Created collection: {collection_name}")
        
        # Test data insertion and retrieval
        print("\n🧪 Testing Data Operations...")
        
        # Test workout planner data
        test_personal_info = {
            "user_id": "test_user_atlas_123",
            "name": "Atlas Test User",
            "age": 30,
            "gender": "male",
            "height_cm": 180.0,
            "weight_kg": 75.0,
            "fitness_level": "intermediate",
            "created_at": datetime.utcnow()
        }
        
        result = await db["workout_planner_personal_info"].insert_one(test_personal_info)
        print(f"✅ Inserted workout planner data: {result.inserted_id}")
        
        # Test health tracking data
        test_heart_rate = {
            "user_id": "test_user_atlas_123",
            "bpm": 72,
            "activity_state": "rest",
            "timestamp": datetime.utcnow(),
            "source": "mongodb_atlas_test"
        }
        
        result = await db["heart_rate_metrics"].insert_one(test_heart_rate)
        print(f"✅ Inserted heart rate data: {result.inserted_id}")
        
        # Test workout plan data
        test_workout_plan = {
            "user_id": "test_user_atlas_123",
            "name": "Atlas Test Workout Plan",
            "description": "Test workout plan stored in MongoDB Atlas",
            "goal": "strength",
            "duration_weeks": 8,
            "created_at": datetime.utcnow()
        }
        
        result = await db["workout_plans"].insert_one(test_workout_plan)
        print(f"✅ Inserted workout plan: {result.inserted_id}")
        
        # Verify data retrieval
        print("\n🔍 Verifying Data Retrieval...")
        
        retrieved_user = await db["workout_planner_personal_info"].find_one(
            {"user_id": "test_user_atlas_123"}
        )
        if retrieved_user:
            print(f"✅ Retrieved user data: {retrieved_user['name']}")
        
        retrieved_hr = await db["heart_rate_metrics"].find_one(
            {"user_id": "test_user_atlas_123"}
        )
        if retrieved_hr:
            print(f"✅ Retrieved heart rate: {retrieved_hr['bpm']} BPM")
        
        retrieved_plan = await db["workout_plans"].find_one(
            {"user_id": "test_user_atlas_123"}
        )
        if retrieved_plan:
            print(f"✅ Retrieved workout plan: {retrieved_plan['name']}")
        
        # Final collection count
        print("\n📊 Final Collection Summary:")
        collections = await db.list_collection_names()
        total_docs = 0
        for collection in collections:
            count = await db[collection].count_documents({})
            total_docs += count
            print(f"   📄 {collection}: {count} documents")
        
        print(f"\n🎯 Total: {len(collections)} collections, {total_docs} documents")
        
        print("\n" + "=" * 65)
        print("🎉 SUCCESS! MONGODB ATLAS CONNECTION ESTABLISHED!")
        print("=" * 65)
        print("✅ Your fitness agent is now connected to MongoDB Atlas!")
        print("✅ All collections are created and ready!")
        print("✅ Data can be stored and retrieved successfully!")
        print("\n💡 Your fitness agent will now store all form data in MongoDB Atlas collections!")
        
        return True
        
    except Exception as e:
        print(f"\n❌ CONNECTION FAILED!")
        print(f"Error: {e}")
        print(f"Error Type: {type(e).__name__}")
        
        print("\n🔧 Troubleshooting:")
        print("1. Check your internet connection")
        print("2. Verify MongoDB Atlas credentials")
        print("3. Ensure database user has read/write permissions") 
        print("4. Check if your IP is whitelisted in Atlas")
        
        return False

if __name__ == "__main__":
    asyncio.run(test_mongodb_atlas_connection())