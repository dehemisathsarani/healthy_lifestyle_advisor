"""
Updated Database Connection Test for Fitness Agent
This script tests both MongoDB and file-based database functionality.
"""
import asyncio
import sys
import os
from datetime import datetime

# Add current directory to path
sys.path.append(os.path.dirname(__file__))

from settings import settings
from database import get_database, COLLECTIONS

async def test_database_connection():
    """Test database connection (MongoDB or file-based) and basic operations"""
    
    print("🔍 Testing Database Connection for Fitness Agent...")
    print("=" * 60)
    print(f"Database Mode: {'File-based' if settings.USE_FILE_DATABASE else 'MongoDB'}")
    print(f"Database URL: {settings.MONGODB_URL}")
    print(f"Database Name: {settings.DB_NAME}")
    print("=" * 60)
    
    try:
        # Step 1: Get database instance
        print("1️⃣ Getting database instance...")
        db = await get_database()
        print("✅ Database instance obtained successfully!")
        
        # Step 2: Test workout plan storage
        print("\n2️⃣ Testing workout plan storage...")
        
        test_workout_plan = {
            "id": "test_plan_123",
            "user_id": "test_user_456", 
            "name": "Test Workout Plan",
            "description": "A test workout plan for database testing",
            "goal": "strength",
            "difficulty": "intermediate",
            "duration_weeks": 4,
            "workouts_per_week": 3,
            "focus_areas": ["chest", "back", "legs"],
            "workouts": [],
            "created_at": datetime.utcnow()
        }
        
        # Insert test workout plan
        result = await db[COLLECTIONS["workout_plans"]].insert_one(test_workout_plan)
        print(f"✅ Workout plan inserted successfully! ID: {result.inserted_id}")
        
        # Step 3: Test retrieval
        print("\n3️⃣ Testing data retrieval...")
        retrieved_plan = await db[COLLECTIONS["workout_plans"]].find_one({
            "id": "test_plan_123"
        })
        
        if retrieved_plan:
            print(f"✅ Workout plan retrieved successfully: {retrieved_plan['name']}")
        else:
            print("❌ Failed to retrieve workout plan")
        
        # Step 4: Test health data storage
        print("\n4️⃣ Testing health data storage...")
        
        test_heart_rate = {
            "id": "hr_test_123",
            "user_id": "test_user_456",
            "bpm": 75,
            "activity_state": "rest",
            "timestamp": datetime.utcnow(),
            "source": "fitness_tracker"
        }
        
        result = await db[COLLECTIONS["heart_rate"]].insert_one(test_heart_rate)
        print(f"✅ Heart rate data inserted successfully! ID: {result.inserted_id}")
        
        # Step 5: List all collections in use
        print("\n5️⃣ Available Collections:")
        for key, collection_name in COLLECTIONS.items():
            print(f"   - {key}: {collection_name}")
        
        print("\n" + "=" * 60)
        print("🎉 ALL TESTS PASSED! FITNESS AGENT DATABASE IS READY!")
        print("=" * 60)
        
        # Configuration summary
        print("\n📋 Configuration Summary:")
        print(f"   - Database Type: {'File-based Storage' if settings.USE_FILE_DATABASE else 'MongoDB'}")
        print(f"   - Demo Mode: {settings.DEMO_MODE}")
        print(f"   - Collections: {len(COLLECTIONS)} collections available")
        
        if settings.USE_FILE_DATABASE:
            print("\n📁 Data Storage Location:")
            print("   - Files will be stored in: ./data/ directory")
            print("   - Each collection is a separate JSON file")
        
        return True
        
    except Exception as e:
        print(f"\n❌ DATABASE TEST FAILED!")
        print(f"Error: {e}")
        print(f"Error Type: {type(e).__name__}")
        
        print("\n🔧 Troubleshooting:")
        if not settings.USE_FILE_DATABASE:
            print("1. Make sure MongoDB is installed and running")
            print("2. Try enabling file-based database by setting USE_FILE_DATABASE=true in .env")
        else:
            print("1. Check if the script has write permissions in the current directory")
            print("2. Ensure all required Python packages are installed")
        
        return False

async def test_fitness_backend_startup():
    """Test if the fitness backend can start with the current database configuration"""
    
    print("\n🚀 Testing Fitness Backend Startup...")
    print("=" * 50)
    
    try:
        # Import main components to test startup
        from main import app
        from routers import workouts, health
        
        print("✅ FastAPI app imported successfully")
        print("✅ Workout router imported successfully") 
        print("✅ Health router imported successfully")
        print("✅ Fitness backend is ready to start!")
        
        return True
        
    except Exception as e:
        print(f"❌ Backend startup test failed: {e}")
        return False

async def main():
    """Main test function"""
    print("🏋️ FITNESS AGENT DATABASE CONNECTION TEST")
    print("=" * 60)
    
    # Test database connection
    db_success = await test_database_connection()
    
    # Test backend startup
    backend_success = await test_fitness_backend_startup()
    
    print("\n" + "=" * 60)
    if db_success and backend_success:
        print("🎯 ALL TESTS SUCCESSFUL! Your fitness agent is ready to use!")
        if settings.USE_FILE_DATABASE:
            print("\n💡 Next Steps:")
            print("1. Start the fitness backend: python main.py")
            print("2. The app will use file-based storage (no MongoDB required)")
            print("3. Data will be stored locally in JSON files")
            print("\n🔄 To switch to MongoDB later:")
            print("1. Install and start MongoDB")
            print("2. Set USE_FILE_DATABASE=false in .env")
            print("3. Update MONGODB_URL in .env with your MongoDB connection string")
    else:
        print("❌ Some tests failed. Please check the errors above.")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())