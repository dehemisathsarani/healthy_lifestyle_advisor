"""
Verify data exists in MongoDB Atlas
"""
import pymongo
from datetime import datetime

# MongoDB Atlas connection
MONGODB_URL = "mongodb+srv://Admin:X1bzjS2IGHrNHFgS@healthagent.ucnrbse.mongodb.net/HealthAgent"
TEST_USER_ID = "test_user_diet_001"

print("="*70)
print("Verifying MongoDB Atlas Data")
print("="*70)
print(f"Connecting to: {MONGODB_URL[:50]}...")
print()

try:
    client = pymongo.MongoClient(MONGODB_URL, serverSelectionTimeoutMS=5000)
    db = client["HealthAgent"]
    nutrition_logs = db["nutrition_logs"]
    
    # Count total documents
    total_count = nutrition_logs.count_documents({})
    print(f"✅ Connected to MongoDB Atlas")
    print(f"📊 Total nutrition logs in database: {total_count}")
    print()
    
    # Count for test user
    user_count = nutrition_logs.count_documents({"user_id": TEST_USER_ID})
    print(f"👤 Logs for user '{TEST_USER_ID}': {user_count}")
    print()
    
    if user_count > 0:
        print("📋 Sample logs:")
        print("-"*70)
        
        # Get first 3 logs
        logs = nutrition_logs.find({"user_id": TEST_USER_ID}).limit(5)
        
        for i, log in enumerate(logs, 1):
            timestamp = log.get('timestamp', log.get('created_at', 'N/A'))
            meal_type = log.get('meal_type', 'unknown')
            foods = log.get('detected_foods', [])
            
            print(f"\n{i}. Timestamp: {timestamp}")
            print(f"   Meal Type: {meal_type}")
            print(f"   Foods: {len(foods)} items")
            
            if foods:
                for food in foods[:2]:  # Show first 2 foods
                    print(f"      - {food.get('name', 'Unknown')}: {food.get('calories', 0)} cal")
        
        print("\n" + "-"*70)
        print(f"\n✅ Data exists in MongoDB Atlas!")
        print(f"✅ {user_count} nutrition logs found for test user")
        
        # Check date range
        latest = nutrition_logs.find_one(
            {"user_id": TEST_USER_ID},
            sort=[("timestamp", -1)]
        )
        oldest = nutrition_logs.find_one(
            {"user_id": TEST_USER_ID},
            sort=[("timestamp", 1)]
        )
        
        if latest and oldest:
            latest_time = latest.get('timestamp', latest.get('created_at'))
            oldest_time = oldest.get('timestamp', oldest.get('created_at'))
            
            print(f"\n📅 Date Range:")
            print(f"   Oldest: {oldest_time}")
            print(f"   Latest: {latest_time}")
    else:
        print("⚠️  No logs found for test user")
        print("Run: python add_test_nutrition_data.py")
    
    print("\n" + "="*70)
    
    # List all users with data
    pipeline = [
        {"$group": {"_id": "$user_id", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    
    users = list(nutrition_logs.aggregate(pipeline))
    if users:
        print("\n👥 All users with nutrition logs:")
        for user in users:
            print(f"   {user['_id']}: {user['count']} logs")
    
except Exception as e:
    print(f"❌ Error: {e}")
finally:
    if 'client' in locals():
        client.close()
