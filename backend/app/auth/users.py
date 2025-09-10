from typing import Optional, Dict, Any, List
from datetime import datetime
from app.core.database import get_database
from app.auth.jwt import get_password_hash, verify_password
from app.auth.models import UserCreate, UserProfile
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import DuplicateKeyError
from bson import ObjectId


async def create_user(user: UserCreate) -> Optional[Dict[str, Any]]:
    """Create a new user in the database"""
    print(f"🔄 Attempting to create user with email: {user.email}")
    print(f"🔄 User data received: name='{user.name}', email='{user.email}', age={user.age}, country='{user.country}', mobile='{user.mobile}'")
    
    db = get_database()
    print(f"🔄 Database connection obtained: {type(db)}")
    
    # Check if user already exists
    print(f"🔄 Checking if user with email {user.email} already exists...")
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        print(f"⚠️ User with email {user.email} already exists")
        return None
    print(f"✅ User with email {user.email} does not exist, proceeding with creation...")
    
    # Prepare user document
    user_dict = user.model_dump()
    print(f"🔄 User dict before password hashing: {list(user_dict.keys())}")
    user_dict["password"] = get_password_hash(user.password)
    user_dict["created_at"] = datetime.utcnow()
    user_dict["refresh_tokens"] = []  # List to store valid refresh tokens
    print(f"🔄 User dict prepared for insertion: {list(user_dict.keys())}")
    
    try:
        print(f"🔄 Inserting user document for {user.email}")
        result = await db.users.insert_one(user_dict)
        print(f"🔄 Insert result: inserted_id={result.inserted_id}, acknowledged={result.acknowledged}")
        
        if result.inserted_id:
            print(f"✅ User created successfully with ID: {result.inserted_id}")
            # Get the created user
            created_user = await db.users.find_one({"_id": result.inserted_id})
            if created_user:
                print(f"✅ Created user retrieved from database: {list(created_user.keys())}")
                # Convert ObjectId to string for the response
                created_user["_id"] = str(created_user["_id"])
                # Remove sensitive fields
                created_user.pop("password", None)
                created_user.pop("refresh_tokens", None)
                print(f"✅ Returning user data: {list(created_user.keys())}")
                return created_user
            else:
                print("⚠️ Created user could not be retrieved")
        else:
            print("⚠️ No inserted_id returned after user creation")
    except DuplicateKeyError:
        print(f"⚠️ DuplicateKeyError for email: {user.email}")
        return None
    except Exception as e:
        print(f"❌ Error creating user: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
    
    print("❌ Returning None - user creation failed")
    return None


async def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Get a user by email"""
    db = get_database()
    user = await db.users.find_one({"email": email})
    if user:
        user["_id"] = str(user["_id"])
    return user


async def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Get a user by ID"""
    db = get_database()
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if user:
            user["_id"] = str(user["_id"])
        return user
    except:
        return None


async def verify_user_credentials(email: str, password: str) -> Optional[Dict[str, Any]]:
    """Verify user credentials and return user if valid"""
    user = await get_user_by_email(email)
    if not user:
        return None
    
    if not verify_password(password, user["password"]):
        return None
    
    # Remove sensitive data
    user.pop("password", None)
    user.pop("refresh_tokens", None)
    return user


async def store_refresh_token(user_id: str, refresh_token: str) -> bool:
    """Store a refresh token in the user's document"""
    db = get_database()
    try:
        # Store token and current timestamp
        result = await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$push": {"refresh_tokens": {
                "token": refresh_token,
                "created_at": datetime.utcnow()
            }}}
        )
        return result.modified_count > 0
    except:
        return False


async def verify_refresh_token(user_id: str, refresh_token: str) -> bool:
    """Verify if a refresh token exists in the user's document"""
    db = get_database()
    try:
        user = await db.users.find_one({
            "_id": ObjectId(user_id),
            "refresh_tokens.token": refresh_token
        })
        return user is not None
    except:
        return False


async def invalidate_refresh_token(user_id: str, refresh_token: str) -> bool:
    """Remove a refresh token from the user's document"""
    db = get_database()
    try:
        result = await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$pull": {"refresh_tokens": {"token": refresh_token}}}
        )
        return result.modified_count > 0
    except:
        return False


async def invalidate_all_refresh_tokens(user_id: str) -> bool:
    """Remove all refresh tokens for a user (logout from all devices)"""
    db = get_database()
    try:
        result = await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"refresh_tokens": []}}
        )
        return result.modified_count > 0
    except:
        return False


async def update_user_profile(user_id: str, profile_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Update user profile information"""
    db = get_database()
    
    # Remove fields that shouldn't be updated
    if "password" in profile_data:
        del profile_data["password"]
    if "email" in profile_data:
        del profile_data["email"]
    
    try:
        result = await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": profile_data}
        )
        
        if result.modified_count > 0:
            updated_user = await get_user_by_id(user_id)
            if updated_user:
                updated_user.pop("password", None)
                updated_user.pop("refresh_tokens", None)
                return updated_user
    except:
        return None
    
    return None


async def setup_user_collection():
    """Setup user collection with proper indexes"""
    print("🔄 Setting up user collection...")
    db = get_database()
    
    # Create unique index on email field
    try:
        await db.users.create_index("email", unique=True)
        print("📋 Email index created")
    except Exception as e:
        print(f"⚠️ Index creation warning: {e}")
    
    # Check if any users exist
    user_count = await db.users.count_documents({})
    print(f"📋 Current user count: {user_count}")
    
    # Create a test user if no users exist
    if user_count == 0:
        print("🔄 No users found, creating test users...")
        test_users = [
            UserCreate(
                name="Dehemi",
                email="dehemi@example.com", 
                password="dehemi12345",
                age=24,
                country="Sri Lanka"
            ),
            UserCreate(
                name="John",
                email="john@example.com",
                password="john12345",
                age=28,
                country="United States"
            ),
            UserCreate(
                name="Leo",
                email="leo@example.com",
                password="leo12345",
                age=26,
                country="Canada"
            )
        ]
        
        created_count = 0
        for test_user in test_users:
            try:
                # Create the test user
                user_dict = test_user.model_dump()
                user_dict["password"] = get_password_hash(test_user.password)
                user_dict["created_at"] = datetime.utcnow()
                user_dict["refresh_tokens"] = []
                
                result = await db.users.insert_one(user_dict)
                if result.inserted_id:
                    created_count += 1
                    print(f"✅ Test user created successfully: {test_user.email} (ID: {result.inserted_id})")
                else:
                    print(f"❌ Failed to create test user: {test_user.email}")
            except Exception as e:
                print(f"❌ Error creating test user {test_user.email}: {e}")
        
        print(f"✅ {created_count} test users created successfully")
        print("🔐 You can login with:")
        print("   - dehemi@example.com / dehemi12345")
        print("   - john@example.com / john12345") 
        print("   - leo@example.com / leo12345")
    
    # Confirm the collection exists
    collections = await db.list_collection_names()
    print(f"📋 Available collections after setup: {', '.join(collections)}")
    print("✅ User collection setup complete")
