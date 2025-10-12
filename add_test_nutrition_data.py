"""
Add test nutrition data directly to MongoDB
This bypasses the YOLO analysis and populates the database for testing
"""
import pymongo
from datetime import datetime, timedelta
import random

# MongoDB connection (MongoDB Atlas)
MONGODB_URL = "mongodb+srv://Admin:X1bzjS2IGHrNHFgS@healthagent.ucnrbse.mongodb.net/HealthAgent"
client = pymongo.MongoClient(MONGODB_URL)
db = client["HealthAgent"]
nutrition_logs = db["nutrition_logs"]

# Test user
TEST_USER_ID = "test_user_diet_001"

# Sample meal data
sample_meals = [
    {
        "food": "Oatmeal with Banana",
        "meal_type": "breakfast",
        "days_ago": 0,
        "calories": 320,
        "protein": 12,
        "carbs": 58,
        "fat": 6,
        "fiber": 8
    },
    {
        "food": "Grilled Chicken Salad",
        "meal_type": "lunch",
        "days_ago": 0,
        "calories": 350,
        "protein": 42,
        "carbs": 15,
        "fat": 14,
        "fiber": 5
    },
    {
        "food": "Rice and Curry",
        "meal_type": "dinner",
        "days_ago": 0,
        "calories": 580,
        "protein": 28,
        "carbs": 75,
        "fat": 18,
        "fiber": 6
    },
    {
        "food": "Whole Wheat Bread Toast",
        "meal_type": "breakfast",
        "days_ago": 1,
        "calories": 250,
        "protein": 10,
        "carbs": 42,
        "fat": 4,
        "fiber": 6
    },
    {
        "food": "Tuna Sandwich",
        "meal_type": "lunch",
        "days_ago": 1,
        "calories": 380,
        "protein": 28,
        "carbs": 38,
        "fat": 12,
        "fiber": 4
    },
    {
        "food": "Fish Curry with Vegetables",
        "meal_type": "dinner",
        "days_ago": 1,
        "calories": 420,
        "protein": 35,
        "carbs": 28,
        "fat": 20,
        "fiber": 5
    },
    {
        "food": "Fruit Smoothie",
        "meal_type": "breakfast",
        "days_ago": 2,
        "calories": 280,
        "protein": 8,
        "carbs": 55,
        "fat": 3,
        "fiber": 7
    },
    {
        "food": "Chicken Fried Rice",
        "meal_type": "lunch",
        "days_ago": 2,
        "calories": 520,
        "protein": 30,
        "carbs": 68,
        "fat": 15,
        "fiber": 3
    },
    {
        "food": "Vegetable Stir Fry",
        "meal_type": "dinner",
        "days_ago": 2,
        "calories": 320,
        "protein": 12,
        "carbs": 45,
        "fat": 10,
        "fiber": 8
    },
    {
        "food": "Hoppers with Sambol",
        "meal_type": "breakfast",
        "days_ago": 3,
        "calories": 310,
        "protein": 12,
        "carbs": 48,
        "fat": 8,
        "fiber": 4
    },
    {
        "food": "String Hoppers with Curry",
        "meal_type": "lunch",
        "days_ago": 3,
        "calories": 340,
        "protein": 14,
        "carbs": 52,
        "fat": 9,
        "fiber": 5
    },
    {
        "food": "Vegetable Kottu",
        "meal_type": "dinner",
        "days_ago": 3,
        "calories": 480,
        "protein": 18,
        "carbs": 62,
        "fat": 16,
        "fiber": 6
    },
    {
        "food": "Egg Sandwich",
        "meal_type": "breakfast",
        "days_ago": 4,
        "calories": 380,
        "protein": 22,
        "carbs": 38,
        "fat": 16,
        "fiber": 3
    },
    {
        "food": "Dhal Curry with Rice",
        "meal_type": "lunch",
        "days_ago": 4,
        "calories": 450,
        "protein": 18,
        "carbs": 72,
        "fat": 12,
        "fiber": 10
    },
    {
        "food": "Grilled Fish with Salad",
        "meal_type": "dinner",
        "days_ago": 4,
        "calories": 380,
        "protein": 38,
        "carbs": 18,
        "fat": 18,
        "fiber": 6
    }
]

print("="*70)
print("Adding Test Nutrition Logs to MongoDB")
print("="*70)
print(f"User ID: {TEST_USER_ID}")
print(f"Database: {db.name}")
print(f"Collection: nutrition_logs")
print(f"Total meals to add: {len(sample_meals)}")
print()

# Clear existing test data for this user
print(f"Clearing existing data for {TEST_USER_ID}...")
deleted = nutrition_logs.delete_many({"user_id": TEST_USER_ID})
print(f"Deleted {deleted.deleted_count} existing records")
print()

# Add new test data
added_count = 0
for meal in sample_meals:
    try:
        # Calculate timestamp
        meal_datetime = datetime.now() - timedelta(days=meal['days_ago'])
        # Add some random hours to make it more realistic
        meal_datetime = meal_datetime.replace(
            hour=random.choice([8, 12, 19]) if meal['meal_type'] in ['breakfast', 'lunch', 'dinner'] else random.randint(0, 23),
            minute=random.randint(0, 59)
        )
        
        # Create nutrition log document
        log_document = {
            "user_id": TEST_USER_ID,
            "timestamp": meal_datetime,
            "meal_type": meal['meal_type'],
            "detected_foods": [
                {
                    "name": meal['food'],
                    "portion": "1 serving",
                    "calories": meal['calories'],
                    "protein": meal['protein'],
                    "carbs": meal['carbs'],
                    "fat": meal['fat'],
                    "fiber": meal.get('fiber', 0),
                    "confidence": 0.85
                }
            ],
            "total_nutrition": {
                "calories": meal['calories'],
                "protein": meal['protein'],
                "carbs": meal['carbs'],
                "fat": meal['fat'],
                "fiber": meal.get('fiber', 0)
            },
            "analysis_method": "test_data",
            "created_at": meal_datetime
        }
        
        # Insert into MongoDB
        result = nutrition_logs.insert_one(log_document)
        added_count += 1
        print(f"✅ Added: {meal['food']} ({meal['meal_type']}, {meal['days_ago']} days ago)")
        
    except Exception as e:
        print(f"❌ Error adding {meal['food']}: {e}")

print()
print("="*70)
print(f"✅ Successfully added {added_count}/{len(sample_meals)} nutrition logs!")
print("="*70)
print()
print("You can now test:")
print("1. Weekly Report Generation:")
print(f"   POST http://localhost:8001/generate-weekly-report?user_id={TEST_USER_ID}")
print()
print("2. View logs in MongoDB Compass:")
print(f"   Database: HealthAgent")
print(f"   Collection: nutrition_logs")
print(f"   Filter: {{ user_id: '{TEST_USER_ID}' }}")
print()
print("3. Run the comprehensive test:")
print("   python test_diet_features.py")
