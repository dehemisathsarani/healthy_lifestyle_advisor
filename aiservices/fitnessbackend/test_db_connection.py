"""
Database Connection Test for Fitness Agent
This script tests the MongoDB connection and database functionality.
"""
import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

async def test_mongodb_connection():
    """Test MongoDB connection and basic operations"""
    
    print("🔍 Testing MongoDB Connection for Fitness Agent...")
    print("=" * 50)
    
    # Connection settings
    MONGODB_URL = "mongodb://localhost:27017"
    DB_NAME = "fitness_db"
    
    client = None
    
    try:
        # Step 1: Test connection
        print("1️⃣ Attempting to connect to MongoDB...")
        client = AsyncIOMotorClient(MONGODB_URL, serverSelectionTimeoutMS=5000)
        
        # Test server connection
        await client.admin.command('ping')
        print("✅ MongoDB connection successful!")
        
        # Step 2: Test database access
        print("\n2️⃣ Testing database access...")
        database = client[DB_NAME]
        
        # List existing collections
        collections = await database.list_collection_names()
        print(f"✅ Database '{DB_NAME}' accessible")
        print(f"📊 Existing collections: {collections if collections else 'None (empty database)'}")
        
        # Step 3: Test collection operations
        print("\n3️⃣ Testing collection operations...")
        
        # Test workout_plans collection
        workout_collection = database["workout_plans"]
        test_doc = {
            "id": "test_connection_123",
            "name": "Connection Test Plan", 
            "user_id": "test_user",
            "created_at": datetime.utcnow(),
            "test": True
        }
        
        # Insert test document
        result = await workout_collection.insert_one(test_doc)
        print(f"✅ Successfully inserted test document: {result.inserted_id}")
        
        # Retrieve test document
        found_doc = await workout_collection.find_one({"id": "test_connection_123"})
        if found_doc:
            print("✅ Successfully retrieved test document")
        else:
            print("❌ Failed to retrieve test document")
        
        # Count documents
        count = await workout_collection.count_documents({})
        print(f"📈 Total documents in workout_plans: {count}")
        
        # Clean up test document
        await workout_collection.delete_one({"id": "test_connection_123"})
        print("🧹 Test document cleaned up")
        
        # Step 4: Test health tracking collections
        print("\n4️⃣ Testing health tracking collections...")
        health_collections = [
            "heart_rate_metrics",
            "step_metrics", 
            "sleep_metrics",
            "recovery_advice"
        ]
        
        for collection_name in health_collections:
            collection = database[collection_name]
            count = await collection.count_documents({})
            print(f"  📊 {collection_name}: {count} documents")
        
        print("\n" + "=" * 50)
        print("🎉 DATABASE CONNECTION TEST PASSED!")
        print("✅ MongoDB is working correctly with the Fitness Agent")
        print("✅ All collections are accessible")
        print("✅ Database operations are functional")
        
        return True
        
    except Exception as e:
        print(f"\n❌ DATABASE CONNECTION FAILED!")
        print(f"Error: {str(e)}")
        print("\n🔧 Troubleshooting steps:")
        print("1. Make sure MongoDB is installed and running")
        print("2. Check if MongoDB service is started:")
        print("   - Windows: net start MongoDB")
        print("   - Or check Services.msc for MongoDB service")
        print("3. Verify MongoDB is listening on localhost:27017")
        print("4. Try running: mongosh --eval 'db.runCommand(\"ping\")'")
        
        return False
        
    finally:
        if client:
            client.close()

async def test_fitness_backend_database():
    """Test the fitness backend database configuration"""
    
    print("\n🏃‍♂️ Testing Fitness Backend Database Configuration...")
    print("=" * 50)
    
    try:
        # Import fitness backend modules
        from database import get_database, COLLECTIONS
        from settings import settings
        
        print(f"📋 Database settings:")
        print(f"  - MongoDB URL: {settings.MONGODB_URL}")
        print(f"  - Database Name: {settings.DB_NAME}")
        print(f"  - Demo Mode: {settings.DEMO_MODE}")
        
        print(f"\n📊 Available collections:")
        for key, collection_name in COLLECTIONS.items():
            print(f"  - {key}: {collection_name}")
        
        # Test database dependency
        db = await get_database()
        server_info = await db.client.server_info()
        print(f"\n✅ Database dependency working!")
        print(f"📊 MongoDB version: {server_info.get('version', 'Unknown')}")
        
        return True
        
    except Exception as e:
        print(f"❌ Fitness backend database test failed: {str(e)}")
        return False

if __name__ == "__main__":
    async def main():
        # Test basic MongoDB connection
        mongo_ok = await test_mongodb_connection()
        
        if mongo_ok:
            # Test fitness backend specific configuration
            await test_fitness_backend_database()
        else:
            print("\n⚠️ Skipping fitness backend test due to MongoDB connection issues")
    
    asyncio.run(main())