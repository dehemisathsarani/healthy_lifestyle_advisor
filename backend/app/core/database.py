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

# Global variables for database connection
client: Optional[motor.motor_asyncio.AsyncIOMotorClient] = None
db: Optional[motor.motor_asyncio.AsyncIOMotorDatabase] = None

async def connect_to_mongo() -> bool:
    """Connect to MongoDB with comprehensive error handling"""
    global client, db
    
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
    if db is None:
        raise RuntimeError("❌ Database not connected. Call connect_to_mongo() first.")
    return db

async def verify_database() -> bool:
    """Verify database connection is active and working"""
    global db
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