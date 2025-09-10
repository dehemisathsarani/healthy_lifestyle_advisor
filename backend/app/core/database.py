import motor.motor_asyncio
from pymongo.errors import PyMongoError, ConnectionFailure, ServerSelectionTimeoutError
import os
from dotenv import load_dotenv
import asyncio
from typing import Optional

# Load environment variables
load_dotenv()

# MongoDB configuration
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGO_DB_NAME", "HealthAgent")
USE_MOCK_DB = os.getenv("USE_MOCK_DB", "false").lower() == "true"

# Global variables for database connection
client: Optional[motor.motor_asyncio.AsyncIOMotorClient] = None
db: Optional[motor.motor_asyncio.AsyncIOMotorDatabase] = None
mock_db_data = {}  # In-memory storage for mock mode

async def connect_to_mongo() -> bool:
    """Connect to MongoDB with comprehensive error handling"""
    global client, db
    
    # Use mock database if configured
    if USE_MOCK_DB:
        print("🔄 Using mock in-memory database (no MongoDB connection required)")
        return True
    
    try:
        print("🔄 Initializing MongoDB connection...")
        print(f"📍 URI: {MONGO_URI[:50]}..." if len(MONGO_URI) > 50 else f"📍 URI: {MONGO_URI}")
        print(f"🗄️  Database: {DB_NAME}")
        
        # Create client with optimal configuration
        client = motor.motor_asyncio.AsyncIOMotorClient(
            MONGO_URI,
            serverSelectionTimeoutMS=15000,  # 15 second timeout
            connectTimeoutMS=10000,          # 10 second connect timeout
            socketTimeoutMS=10000,           # 10 second socket timeout
            maxPoolSize=10,                  # Maximum 10 connections
            minPoolSize=1,                   # Minimum 1 connection
            retryWrites=True,               # Enable retry writes
            w='majority'                     # Write concern
        )
        
        # Test the connection with ping
        print("🔍 Testing connection...")
        await asyncio.wait_for(client.admin.command('ping'), timeout=10.0)
        
        # Get database reference
        db = client[DB_NAME]
        
        # Verify database access by listing collections
        collections = await asyncio.wait_for(db.list_collection_names(), timeout=10.0)
        
        print("✅ MongoDB connection established successfully!")
        print(f"📁 Connected to database: {DB_NAME}")
        print(f"📊 Collections found: {len(collections)}")
        
        if collections:
            print(f"📋 Available collections: {', '.join(collections[:5])}")
            if len(collections) > 5:
                print(f"    ... and {len(collections) - 5} more")
        else:
            print("📋 No collections found (normal for new databases)")
        
        # Test write operation
        try:
            await db.connection_test.insert_one({"test": "connection", "timestamp": asyncio.get_event_loop().time()})
            await db.connection_test.delete_one({"test": "connection"})
            print("✅ Database write/read test successful")
        except Exception as e:
            print(f"⚠️  Database write test failed: {str(e)}")
        
        return True
        
    except ServerSelectionTimeoutError:
        print("❌ MongoDB connection failed: Server selection timeout")
        print("💡 Troubleshooting steps:")
        print("   1. Check if MongoDB Atlas cluster is running")
        print("   2. Verify your IP address is whitelisted")
        print("   3. Check network connectivity")
        print("   4. Verify connection string credentials")
        return False
        
    except ConnectionFailure as e:
        print(f"❌ MongoDB connection failed: {str(e)}")
        print("💡 Check your connection string and credentials")
        return False
        
    except asyncio.TimeoutError:
        print("❌ MongoDB connection timeout")
        print("💡 Network or server response too slow")
        return False
        
    except PyMongoError as e:
        print(f"❌ MongoDB error: {str(e)}")
        print(f"🔍 Error type: {type(e).__name__}")
        return False
        
    except Exception as e:
        print(f"❌ Unexpected error during MongoDB connection: {str(e)}")
        print(f"🔍 Error type: {type(e).__name__}")
        return False

async def close_mongo_connection():
    """Close MongoDB connection safely"""
    global client, db
    try:
        if client:
            client.close()
            print("🛑 MongoDB connection closed successfully")
        else:
            print("ℹ️  No active MongoDB connection to close")
        
        # Reset global variables
        client = None
        db = None
        
    except Exception as e:
        print(f"⚠️  Error closing MongoDB connection: {str(e)}")

def get_database():
    """Get database instance with validation"""
    global db
    
    # Return a mock database handler if in mock mode
    if USE_MOCK_DB:
        return MockDatabase()
        
    if db is None:
        raise RuntimeError("❌ Database not connected. Call connect_to_mongo() first.")
    return db

# Mock database implementation
class MockCollection:
    """Mock collection implementation for testing without MongoDB"""
    
    def __init__(self, name):
        self.name = name
        global mock_db_data
        if name not in mock_db_data:
            mock_db_data[name] = []
            
    async def insert_one(self, document):
        global mock_db_data
        document["_id"] = f"mock_id_{len(mock_db_data[self.name])}"
        mock_db_data[self.name].append(document)
        return MockInsertResult(document["_id"])
        
    async def find_one(self, query=None):
        global mock_db_data
        if not mock_db_data.get(self.name):
            return None
        # Simple implementation that returns the first document
        if query and "_id" in query:
            for doc in mock_db_data[self.name]:
                if doc["_id"] == query["_id"]:
                    return doc
        return mock_db_data[self.name][0] if mock_db_data[self.name] else None
        
    async def delete_one(self, query):
        global mock_db_data
        if not mock_db_data.get(self.name):
            return MockDeleteResult(0)
        before_len = len(mock_db_data[self.name])
        if query and "_id" in query:
            mock_db_data[self.name] = [doc for doc in mock_db_data[self.name] if doc["_id"] != query["_id"]]
        return MockDeleteResult(before_len - len(mock_db_data[self.name]))
        
    async def create_index(self, field_name, unique=False):
        # Mock implementation that just returns a success response
        return {"ok": 1, "field": field_name, "unique": unique}
        
    async def update_one(self, query, update):
        global mock_db_data
        if not mock_db_data.get(self.name):
            return MockUpdateResult(0, 0)
            
        modified_count = 0
        matched_count = 0
        
        # Handle $set operation
        if "$set" in update:
            set_data = update["$set"]
            for i, doc in enumerate(mock_db_data[self.name]):
                # Simple implementation for _id matching
                if "_id" in query and doc.get("_id") == query["_id"]:
                    matched_count += 1
                    for key, value in set_data.items():
                        if doc.get(key) != value:
                            doc[key] = value
                            modified_count += 1
                    mock_db_data[self.name][i] = doc
                    
        # Handle $push operation
        if "$push" in update:
            push_data = update["$push"]
            for i, doc in enumerate(mock_db_data[self.name]):
                # Simple implementation for _id matching
                if "_id" in query and doc.get("_id") == query["_id"]:
                    matched_count += 1
                    for key, value in push_data.items():
                        if key not in doc:
                            doc[key] = []
                        doc[key].append(value)
                        modified_count += 1
                    mock_db_data[self.name][i] = doc
                    
        # Handle $pull operation
        if "$pull" in update:
            pull_data = update["$pull"]
            for i, doc in enumerate(mock_db_data[self.name]):
                # Simple implementation for _id matching
                if "_id" in query and doc.get("_id") == query["_id"]:
                    matched_count += 1
                    for key, criteria in pull_data.items():
                        if key in doc and isinstance(doc[key], list):
                            original_len = len(doc[key])
                            # Very simple implementation
                            doc[key] = [item for item in doc[key] if item != criteria]
                            if len(doc[key]) != original_len:
                                modified_count += 1
                    mock_db_data[self.name][i] = doc
        
        return MockUpdateResult(matched_count, modified_count)

class MockInsertResult:
    def __init__(self, inserted_id):
        self.inserted_id = inserted_id
        
class MockDeleteResult:
    def __init__(self, deleted_count):
        self.deleted_count = deleted_count
        
class MockUpdateResult:
    def __init__(self, matched_count, modified_count):
        self.matched_count = matched_count
        self.modified_count = modified_count

# Mock database implementation
class MockDatabase:
    """Mock database implementation for testing without MongoDB"""
    
    def __init__(self):
        global mock_db_data
        self.collections = {}
        
    def __getattr__(self, name):
        if name not in self.collections:
            self.collections[name] = MockCollection(name)
        return self.collections[name]
        
    async def list_collection_names(self):
        global mock_db_data
        return list(mock_db_data.keys())
        
    async def command(self, command, value=None):
        if command == "ping":
            return {"ok": 1}
        elif command == "collStats":
            return {"count": len(mock_db_data.get(value, [])), "size": 100, "avgObjSize": 100}
        return {"ok": 1}

async def verify_database() -> bool:
    """Verify database connection is active and working"""
    global db
    
    # Always return success if using mock database
    if USE_MOCK_DB:
        print("✅ Mock database verification successful")
        return True
        
    if db is None:
        print("❌ Database not connected")
        return False
    
    try:
        # Test database connectivity with timeout
        await asyncio.wait_for(db.command("ping"), timeout=5.0)
        print("✅ Database verification successful")
        return True
    except asyncio.TimeoutError:
        print("❌ Database verification timeout")
        return False
    except Exception as e:
        print(f"❌ Database verification failed: {str(e)}")
        return False

async def get_db_health() -> dict:
    """Get comprehensive database health status"""
    try:
        # Return mock health data if in mock mode
        if USE_MOCK_DB:
            return {
                "status": "connected",
                "database": "mock_db",
                "collections_count": len(mock_db_data),
                "size_mb": 0,
                "is_mock": True
            }
            
        if db is None:
            return {"status": "disconnected", "error": "Database not initialized"}
        
        # Ping database with timeout
        await asyncio.wait_for(db.command("ping"), timeout=5.0)
        
        # Get database statistics
        try:
            stats = await asyncio.wait_for(db.command("dbStats"), timeout=5.0)
            collections = await asyncio.wait_for(db.list_collection_names(), timeout=5.0)
            
            return {
                "status": "connected",
                "database": DB_NAME,
                "collections_count": len(collections),
                "collections": collections[:10],  # Limit to first 10
                "data_size": stats.get("dataSize", 0),
                "storage_size": stats.get("storageSize", 0),
                "index_size": stats.get("indexSize", 0),
                "objects": stats.get("objects", 0)
            }
        except Exception as e:
            return {
                "status": "connected",
                "database": DB_NAME,
                "warning": f"Could not get detailed stats: {str(e)}"
            }
            
    except asyncio.TimeoutError:
        return {"status": "timeout", "error": "Database response timeout"}
    except Exception as e:
        return {"status": "error", "error": str(e)}

# Test function for development
async def test_connection():
    """Test function for development and debugging"""
    print("🧪 Testing database connection...")
    success = await connect_to_mongo()
    if success:
        health = await get_db_health()
        print(f"📊 Health status: {health}")
        await close_mongo_connection()
    return success