#!/usr/bin/env python3
"""
MongoDB Data Storage Investigation for Diet Agent
This script will test all aspects of data storage and retrieval
"""

import aiohttp
import asyncio
import json
from datetime import datetime, timedelta
import sys
import os

# Add backend path to import modules
sys.path.append('/Users/chanuka/Desktop/Healthagent/healthy_lifestyle_advisor/backend')

# Direct MongoDB connection for verification
try:
    from app.core.database import get_database
    from motor.motor_asyncio import AsyncIOMotorClient
    from pymongo import MongoClient
    MONGO_AVAILABLE = True
except ImportError:
    MONGO_AVAILABLE = False
    print("⚠️ MongoDB modules not available - will use API tests only")

BASE_URL = "http://localhost:8000/api/diet"
MONGO_URI = "mongodb+srv://Admin:X1bzjS2IGHrNHFgS@healthagent.ucnrbse.mongodb.net/HealthAgent"

class MongoDBStorageInvestigator:
    def __init__(self):
        self.session = None
        self.test_results = []
        self.user_id = None
        self.profile_data = None
        
    def log_result(self, test_name, status, details):
        """Log test results"""
        emoji = "✅" if status else "❌"
        print(f"{emoji} {test_name}: {details}")
        self.test_results.append({
            "test": test_name,
            "status": status,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
    
    async def check_backend_health(self):
        """Check if backend is running"""
        try:
            async with self.session.get(f"{BASE_URL}/health") as response:
                if response.status == 200:
                    data = await response.json()
                    self.log_result("Backend Health", True, f"Backend running: {data.get('message', 'OK')}")
                    return True
                else:
                    self.log_result("Backend Health", False, f"Backend returned status {response.status}")
                    return False
        except Exception as e:
            self.log_result("Backend Health", False, f"Cannot connect to backend: {str(e)}")
            return False
    
    async def direct_mongo_check(self):
        """Direct MongoDB connection test"""
        if not MONGO_AVAILABLE:
            self.log_result("Direct MongoDB Check", False, "MongoDB modules not available")
            return False
            
        try:
            # Synchronous connection for quick check
            client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
            db = client.HealthAgent
            
            # Test connection
            collections = db.list_collection_names()
            self.log_result("Direct MongoDB Check", True, f"Connected! Collections: {collections}")
            
            # Count documents in each collection
            for collection_name in ['user_profiles', 'meal_analyses', 'daily_nutrition', 'nutrition_entries']:
                if collection_name in collections:
                    count = db[collection_name].count_documents({})
                    self.log_result(f"Collection Count - {collection_name}", True, f"{count} documents")
                else:
                    self.log_result(f"Collection Count - {collection_name}", False, "Collection not found")
            
            client.close()
            return True
            
        except Exception as e:
            self.log_result("Direct MongoDB Check", False, f"MongoDB connection failed: {str(e)}")
            return False
    
    async def test_profile_creation(self):
        """Test user profile creation and storage"""
        test_profile = {
            "name": "Test Investigation User",
            "email": f"test_investigation_{datetime.now().strftime('%Y%m%d_%H%M%S')}@healthagent.com",
            "age": 28,
            "weight": 70.0,
            "height": 175.0,
            "gender": "female",
            "activity_level": "moderately_active",
            "goal": "maintenance",
            "preferences": ["vegetarian", "high_protein"],
            "allergies": ["nuts"]
        }
        
        try:
            async with self.session.post(
                f"{BASE_URL}/profile",
                json=test_profile,
                headers={"Content-Type": "application/json"}
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("success") and data.get("data"):
                        self.profile_data = data["data"]
                        self.user_id = self.profile_data.get("_id")
                        
                        # Extract calculated metrics
                        bmi = self.profile_data.get("bmi")
                        bmr = self.profile_data.get("bmr")
                        tdee = self.profile_data.get("tdee")
                        calorie_goal = self.profile_data.get("daily_calorie_goal")
                        
                        self.log_result(
                            "Profile Creation", 
                            True, 
                            f"Created user {self.user_id} | BMI: {bmi} | BMR: {bmr} | TDEE: {tdee} | Goal: {calorie_goal} cal"
                        )
                        return True
                    else:
                        self.log_result("Profile Creation", False, f"Invalid response format: {data}")
                        return False
                else:
                    error_text = await response.text()
                    self.log_result("Profile Creation", False, f"HTTP {response.status}: {error_text}")
                    return False
        except Exception as e:
            self.log_result("Profile Creation", False, f"Error: {str(e)}")
            return False
    
    async def test_profile_retrieval(self):
        """Test profile retrieval"""
        if not self.user_id:
            self.log_result("Profile Retrieval", False, "No user ID available")
            return False
            
        try:
            async with self.session.get(f"{BASE_URL}/profile/{self.user_id}") as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("success") and data.get("data"):
                        profile = data["data"]
                        self.log_result(
                            "Profile Retrieval", 
                            True, 
                            f"Retrieved profile for {profile.get('name')} | Email: {profile.get('email')}"
                        )
                        return True
                    else:
                        self.log_result("Profile Retrieval", False, f"Invalid response: {data}")
                        return False
                else:
                    error_text = await response.text()
                    self.log_result("Profile Retrieval", False, f"HTTP {response.status}: {error_text}")
                    return False
        except Exception as e:
            self.log_result("Profile Retrieval", False, f"Error: {str(e)}")
            return False
    
    async def test_meal_analysis(self):
        """Test meal analysis and storage"""
        if not self.user_id:
            self.log_result("Meal Analysis", False, "No user ID available")
            return False
            
        test_meal = {
            "user_id": self.user_id,
            "food_items": [
                {
                    "name": "Grilled Chicken Breast",
                    "calories": 180,
                    "protein": 35,
                    "carbs": 0,
                    "fat": 4,
                    "quantity": "150g"
                },
                {
                    "name": "Brown Rice",
                    "calories": 130,
                    "protein": 3,
                    "carbs": 26,
                    "fat": 1,
                    "quantity": "100g"
                },
                {
                    "name": "Steamed Broccoli",
                    "calories": 35,
                    "protein": 3,
                    "carbs": 7,
                    "fat": 0,
                    "quantity": "100g"
                }
            ],
            "total_calories": 345,
            "total_protein": 41,
            "total_carbs": 33,
            "total_fat": 5,
            "analysis_method": "text",
            "meal_type": "lunch",
            "text_description": "Healthy balanced lunch with chicken, rice, and vegetables"
        }
        
        try:
            async with self.session.post(
                f"{BASE_URL}/analyze",
                json=test_meal,
                headers={"Content-Type": "application/json"}
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("success"):
                        analysis_id = data.get("data", {}).get("_id")
                        self.log_result(
                            "Meal Analysis", 
                            True, 
                            f"Stored meal analysis {analysis_id} | {test_meal['total_calories']} calories"
                        )
                        return analysis_id
                    else:
                        self.log_result("Meal Analysis", False, f"Analysis failed: {data}")
                        return False
                else:
                    error_text = await response.text()
                    self.log_result("Meal Analysis", False, f"HTTP {response.status}: {error_text}")
                    return False
        except Exception as e:
            self.log_result("Meal Analysis", False, f"Error: {str(e)}")
            return False
    
    async def test_meal_history(self):
        """Test meal history retrieval"""
        if not self.user_id:
            self.log_result("Meal History", False, "No user ID available")
            return False
            
        try:
            async with self.session.get(f"{BASE_URL}/meal-history/{self.user_id}") as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("success") and data.get("data"):
                        meals = data["data"]
                        total_calories = sum(meal.get("total_calories", 0) for meal in meals)
                        self.log_result(
                            "Meal History", 
                            True, 
                            f"Retrieved {len(meals)} meals | Total calories: {total_calories}"
                        )
                        return True
                    else:
                        self.log_result("Meal History", False, f"No meals found: {data}")
                        return False
                else:
                    error_text = await response.text()
                    self.log_result("Meal History", False, f"HTTP {response.status}: {error_text}")
                    return False
        except Exception as e:
            self.log_result("Meal History", False, f"Error: {str(e)}")
            return False
    
    async def test_daily_summary(self):
        """Test daily nutrition summary"""
        if not self.user_id:
            self.log_result("Daily Summary", False, "No user ID available")
            return False
            
        try:
            async with self.session.get(f"{BASE_URL}/daily-summary/{self.user_id}") as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("success") and data.get("data"):
                        summary = data["data"]
                        calories = summary.get("total_calories", 0)
                        meals = summary.get("meal_count", 0)
                        self.log_result(
                            "Daily Summary", 
                            True, 
                            f"Daily total: {calories} calories from {meals} meals"
                        )
                        return True
                    else:
                        self.log_result("Daily Summary", False, f"No summary found: {data}")
                        return False
                else:
                    error_text = await response.text()
                    self.log_result("Daily Summary", False, f"HTTP {response.status}: {error_text}")
                    return False
        except Exception as e:
            self.log_result("Daily Summary", False, f"Error: {str(e)}")
            return False
    
    async def test_nutrition_entry(self):
        """Test individual nutrition entry creation"""
        if not self.user_id:
            self.log_result("Nutrition Entry", False, "No user ID available")
            return False
            
        nutrition_entry = {
            "user_id": self.user_id,
            "date": datetime.now().isoformat(),
            "meal_type": "snack",
            "food_description": "Apple with almond butter",
            "calories": 190,
            "protein": 4,
            "carbs": 25,
            "fat": 8,
            "fiber": 4
        }
        
        try:
            async with self.session.post(
                f"{BASE_URL}/nutrition-entry",
                json=nutrition_entry,
                headers={"Content-Type": "application/json"}
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("success"):
                        entry_id = data.get("data", {}).get("_id")
                        self.log_result(
                            "Nutrition Entry", 
                            True, 
                            f"Created nutrition entry {entry_id} | {nutrition_entry['calories']} calories"
                        )
                        return True
                    else:
                        self.log_result("Nutrition Entry", False, f"Entry creation failed: {data}")
                        return False
                else:
                    error_text = await response.text()
                    self.log_result("Nutrition Entry", False, f"HTTP {response.status}: {error_text}")
                    return False
        except Exception as e:
            self.log_result("Nutrition Entry", False, f"Error: {str(e)}")
            return False
    
    async def test_conversation_storage(self):
        """Test RAG conversation storage"""
        conversation_data = {
            "user_id": self.user_id or "test_user",
            "query": "What should I eat for breakfast to gain muscle?",
            "response": "For muscle gain, focus on protein-rich breakfasts like eggs, Greek yogurt with granola, or protein smoothies with banana and protein powder.",
            "context": "muscle_gain_nutrition",
            "timestamp": datetime.now().isoformat()
        }
        
        try:
            # Test RAG chat endpoint
            async with self.session.post(
                "http://localhost:8000/api/chat",
                json={
                    "message": conversation_data["query"],
                    "chat_mode": "nutrition",
                    "user_id": conversation_data["user_id"]
                },
                headers={"Content-Type": "application/json"}
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    self.log_result(
                        "RAG Conversation", 
                        True, 
                        f"RAG response received: {len(data.get('response', ''))} characters"
                    )
                    return True
                else:
                    error_text = await response.text()
                    self.log_result("RAG Conversation", False, f"RAG endpoint failed: {error_text}")
                    return False
        except Exception as e:
            self.log_result("RAG Conversation", False, f"RAG endpoint error: {str(e)}")
            return False
    
    async def generate_report(self):
        """Generate comprehensive investigation report"""
        print("\n" + "="*80)
        print("📊 MONGODB STORAGE INVESTIGATION REPORT")
        print("="*80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["status"])
        
        print(f"\n📈 SUMMARY: {passed_tests}/{total_tests} tests passed ({(passed_tests/total_tests)*100:.1f}%)")
        
        if self.profile_data:
            print(f"\n👤 TEST USER CREATED:")
            print(f"   User ID: {self.user_id}")
            print(f"   Name: {self.profile_data.get('name')}")
            print(f"   Email: {self.profile_data.get('email')}")
            print(f"   BMI: {self.profile_data.get('bmi')}")
            print(f"   Daily Calorie Goal: {self.profile_data.get('daily_calorie_goal')}")
        
        print(f"\n🔍 DETAILED RESULTS:")
        for result in self.test_results:
            status_emoji = "✅" if result["status"] else "❌"
            print(f"   {status_emoji} {result['test']}: {result['details']}")
        
        # Analysis and recommendations
        print(f"\n🎯 ANALYSIS:")
        
        failed_tests = [r for r in self.test_results if not r["status"]]
        if failed_tests:
            print(f"   ⚠️ ISSUES FOUND:")
            for test in failed_tests:
                print(f"      - {test['test']}: {test['details']}")
        else:
            print(f"   ✅ ALL SYSTEMS OPERATIONAL - MongoDB storage working correctly!")
        
        print(f"\n💡 RECOMMENDATIONS:")
        if any("Backend" in r["test"] and not r["status"] for r in self.test_results):
            print(f"   1. Start the backend server: python -m uvicorn main:app --reload --port 8000")
        if any("MongoDB" in r["test"] and not r["status"] for r in self.test_results):
            print(f"   2. Check MongoDB connection and credentials")
        if any("RAG" in r["test"] and not r["status"] for r in self.test_results):
            print(f"   3. Start RAG service or fix OpenAI API quota")
        
        if passed_tests == total_tests:
            print(f"   ✨ System is working perfectly! All user data is being stored in MongoDB.")
        
        print("\n" + "="*80)
        
        # Save report to file
        report_file = f"/Users/chanuka/Desktop/Healthagent/healthy_lifestyle_advisor/mongodb_investigation_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w') as f:
            json.dump({
                "timestamp": datetime.now().isoformat(),
                "summary": {
                    "total_tests": total_tests,
                    "passed_tests": passed_tests,
                    "success_rate": f"{(passed_tests/total_tests)*100:.1f}%"
                },
                "test_user": self.profile_data,
                "test_results": self.test_results
            }, f, indent=2)
        
        print(f"📄 Report saved to: {report_file}")
    
    async def run_investigation(self):
        """Run complete MongoDB storage investigation"""
        print("🔍 Starting MongoDB Storage Investigation...")
        print("="*60)
        
        # Initialize session
        self.session = aiohttp.ClientSession()
        
        try:
            # Core tests
            await self.check_backend_health()
            await self.direct_mongo_check()
            
            # User data tests
            await self.test_profile_creation()
            await self.test_profile_retrieval()
            
            # Nutrition data tests
            await self.test_meal_analysis()
            await self.test_meal_history()
            await self.test_daily_summary()
            await self.test_nutrition_entry()
            
            # RAG conversation test
            await self.test_conversation_storage()
            
            # Generate comprehensive report
            await self.generate_report()
            
        finally:
            await self.session.close()

async def main():
    """Run the investigation"""
    investigator = MongoDBStorageInvestigator()
    await investigator.run_investigation()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n⚠️ Investigation interrupted by user")
    except Exception as e:
        print(f"❌ Investigation failed: {str(e)}")
