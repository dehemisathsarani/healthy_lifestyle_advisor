import asyncio
import os
from pathlib import Path
from typing import Optional

import motor.motor_asyncio
from pymongo.errors import PyMongoError, ConnectionFailure, ServerSelectionTimeoutError
from dotenv import load_dotenv


# Load .env from a few likely locations so the backend picks up config
repo_root = Path(__file__).resolve().parents[3]
env_candidates = [
    repo_root / '.env',
    repo_root / 'aiservices' / '.env',
    repo_root / 'aiservices' / 'fitnessbackend' / '.env',
    repo_root / 'backend' / '.env',
]
loaded_any = False
for p in env_candidates:
    try:
        if p.exists():
            load_dotenv(dotenv_path=str(p), override=False)
            print(f"Loaded environment from {p}")
            loaded_any = True
    except Exception:
        pass

if not loaded_any:
    # fallback to default behavior (will load .env in cwd if present)
    load_dotenv()


# Mongo config (support either MONGO_URI or MONGODB_URL)
MONGO_URI = os.getenv("MONGO_URI", os.getenv("MONGODB_URL", "mongodb://localhost:27017"))
DB_NAME = os.getenv("MONGO_DB_NAME", os.getenv("DB_NAME", "HealthAgent"))

# Global connection state
client: Optional[motor.motor_asyncio.AsyncIOMotorClient] = None
db: Optional[motor.motor_asyncio.AsyncIOMotorDatabase] = None


def _mask_uri(uri: str) -> str:
    try:
        if "@" in uri:
            left, right = uri.split("@", 1)
            if ":" in left:
                scheme_rest = left.split("//", 1)
                scheme = scheme_rest[0] + "//" if len(scheme_rest) > 1 else ""
                return f"{scheme}***:***@{right}"
            return f"***@{right}"
    except Exception:
        pass
    return uri


async def connect_to_mongo() -> bool:
    global client, db
    try:
        print(" Initializing MongoDB connection...")
        masked = _mask_uri(MONGO_URI)
        print(f" URI: {masked[:120]}" + ("..." if len(masked) > 120 else ""))
        print(f"  Database: {DB_NAME}")

        client = motor.motor_asyncio.AsyncIOMotorClient(
            MONGO_URI,
            serverSelectionTimeoutMS=15000,
            connectTimeoutMS=10000,
            socketTimeoutMS=10000,
            maxPoolSize=10,
            minPoolSize=1,
            retryWrites=True,
            w='majority'
        )

        print(" Testing connection...")
        await asyncio.wait_for(client.admin.command('ping'), timeout=10.0)

        db = client[DB_NAME]

        collections = await asyncio.wait_for(db.list_collection_names(), timeout=10.0)

        print(" MongoDB connection established successfully!")
        print(f" Connected to database: {DB_NAME}")
        print(f" Collections found: {len(collections)}")

        if collections:
            print(f" Available collections: {', '.join(collections[:5])}")
            if len(collections) > 5:
                print(f"    ... and {len(collections) - 5} more")
        else:
            print(" No collections found (normal for new databases)")

        try:
            await db.connection_test.insert_one({"test": "connection", "timestamp": asyncio.get_event_loop().time()})
            await db.connection_test.delete_one({"test": "connection"})
            print(" Database write/read test successful")
        except Exception as e:
            print(f"  Database write test failed: {str(e)}")

        return True

    except ServerSelectionTimeoutError:
        print(" MongoDB connection failed: Server selection timeout")
        print(" Troubleshooting steps:")
        print("   1. Check if MongoDB Atlas cluster is running")
        print("   2. Verify your IP address is whitelisted")
        print("   3. Check network connectivity")
        print("   4. Verify connection string credentials")
        return False

    except ConnectionFailure as e:
        print(f" MongoDB connection failed: {str(e)}")
        print(" Check your connection string and credentials")
        return False

    except asyncio.TimeoutError:
        print(" MongoDB connection timeout")
        print(" Network or server response too slow")
        return False

    except PyMongoError as e:
        print(f" MongoDB error: {str(e)}")
        print(f" Error type: {type(e).__name__}")
        return False

    except Exception as e:
        print(f" Unexpected error during MongoDB connection: {str(e)}")
        print(f" Error type: {type(e).__name__}")
        return False


async def close_mongo_connection():
    global client, db
    try:
        if client:
            client.close()
            print(" MongoDB connection closed successfully")
        else:
            print("ℹ  No active MongoDB connection to close")

        client = None
        db = None

    except Exception as e:
        print(f"  Error closing MongoDB connection: {str(e)}")


def get_database():
    global db
    if db is None:
        raise RuntimeError(" Database not connected. Call connect_to_mongo() first.")
    return db


async def verify_database() -> bool:
    global db
    if db is None:
        print(" Database not connected")
        return False
    try:
        await asyncio.wait_for(db.command("ping"), timeout=5.0)
        print(" Database verification successful")
        return True
    except asyncio.TimeoutError:
        print(" Database verification timeout")
        return False
    except Exception as e:
        print(f" Database verification failed: {str(e)}")
        return False


async def get_db_health() -> dict:
    try:
        if db is None:
            return {"status": "disconnected", "error": "Database not initialized"}
        await asyncio.wait_for(db.command("ping"), timeout=5.0)
        try:
            stats = await asyncio.wait_for(db.command("dbStats"), timeout=5.0)
            collections = await asyncio.wait_for(db.list_collection_names(), timeout=5.0)
            return {
                "status": "connected",
                "database": DB_NAME,
                "collections_count": len(collections),
                "collections": collections[:10],
                "data_size": stats.get("dataSize", 0),
                "storage_size": stats.get("storageSize", 0),
                "index_size": stats.get("indexSize", 0),
                "objects": stats.get("objects", 0),
            }
        except Exception as e:
            return {"status": "connected", "database": DB_NAME, "warning": f"Could not get detailed stats: {str(e)}"}
    except asyncio.TimeoutError:
        return {"status": "timeout", "error": "Database response timeout"}
    except Exception as e:
        return {"status": "error", "error": str(e)}


async def test_connection():
    print(" Testing database connection...")
    success = await connect_to_mongo()
    if success:
        health = await get_db_health()
        print(f" Health status: {health}")
        await close_mongo_connection()
    return success
