from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import DuplicateKeyError, PyMongoError
from bson import ObjectId
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import logging

from ..models.diet_models import (
    UserProfile, UserProfileCreate, UserProfileUpdate, UserProfileResponse,
    MealAnalysis, MealAnalysisCreate,
    DailyNutritionSummary, NutritionGoals,
    HealthCalculations, FoodItem
)
from ..core.database import get_database

logger = logging.getLogger(__name__)

class DietAgentService:
    """Service class for Diet Agent database operations"""
    
    def __init__(self):
        self.db = None
    
    async def get_db(self) -> AsyncIOMotorDatabase:
        """Get database instance"""
        if not self.db:
            self.db = get_database()
        return self.db
    
    # User Profile Operations
    async def create_user_profile(self, profile_data: UserProfileCreate) -> UserProfileResponse:
        """Create a new user profile with health calculations"""
        try:
            db = await self.get_db()
            
            # Check if user already exists
            existing_user = await db.diet_user_profiles.find_one({"email": profile_data.email})
            if existing_user:
                raise ValueError(f"User with email {profile_data.email} already exists")
            
            # Calculate health metrics
            bmi = HealthCalculations.calculate_bmi(profile_data.weight, profile_data.height)
            bmr = HealthCalculations.calculate_bmr(
                profile_data.weight, profile_data.height, 
                profile_data.age, profile_data.gender
            )
            tdee = HealthCalculations.calculate_tdee(bmr, profile_data.activity_level)
            daily_calorie_goal = HealthCalculations.calculate_calorie_goal(tdee, profile_data.goal)
            
            # Create user profile document
            profile_dict = profile_data.dict()
            profile_dict.update({
                "bmi": bmi,
                "bmr": bmr,
                "tdee": tdee,
                "daily_calorie_goal": daily_calorie_goal,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            })
            
            # Insert into database
            result = await db.diet_user_profiles.insert_one(profile_dict)
            
            # Retrieve the created profile
            created_profile = await db.diet_user_profiles.find_one({"_id": result.inserted_id})
            
            # Create initial nutrition goals
            await self._create_initial_nutrition_goals(result.inserted_id, daily_calorie_goal, profile_data)
            
            # Convert to response model
            created_profile["bmi_category"] = HealthCalculations.get_bmi_category(bmi)
            
            logger.info(f"Created user profile for {profile_data.email}")
            return UserProfileResponse(**created_profile)
            
        except DuplicateKeyError:
            raise ValueError(f"User with email {profile_data.email} already exists")
        except Exception as e:
            logger.error(f"Error creating user profile: {str(e)}")
            raise Exception(f"Failed to create user profile: {str(e)}")
    
    async def get_user_profile(self, user_id: str) -> Optional[UserProfileResponse]:
        """Get user profile by ID"""
        try:
            db = await self.get_db()
            
            profile = await db.diet_user_profiles.find_one({"_id": ObjectId(user_id)})
            if not profile:
                return None
            
            # Add BMI category
            if profile.get("bmi"):
                profile["bmi_category"] = HealthCalculations.get_bmi_category(profile["bmi"])
            
            return UserProfileResponse(**profile)
            
        except Exception as e:
            logger.error(f"Error getting user profile {user_id}: {str(e)}")
            raise Exception(f"Failed to get user profile: {str(e)}")
    
    async def get_user_profile_by_email(self, email: str) -> Optional[UserProfileResponse]:
        """Get user profile by email"""
        try:
            db = await self.get_db()
            
            profile = await db.diet_user_profiles.find_one({"email": email})
            if not profile:
                return None
            
            # Add BMI category
            if profile.get("bmi"):
                profile["bmi_category"] = HealthCalculations.get_bmi_category(profile["bmi"])
            
            return UserProfileResponse(**profile)
            
        except Exception as e:
            logger.error(f"Error getting user profile by email {email}: {str(e)}")
            raise Exception(f"Failed to get user profile: {str(e)}")
    
    async def update_user_profile(self, user_id: str, profile_data: UserProfileUpdate) -> UserProfileResponse:
        """Update user profile with recalculated health metrics"""
        try:
            db = await self.get_db()
            
            # Get current profile
            current_profile = await db.diet_user_profiles.find_one({"_id": ObjectId(user_id)})
            if not current_profile:
                raise ValueError("User profile not found")
            
            # Prepare update data
            update_data = {k: v for k, v in profile_data.dict().items() if v is not None}
            update_data["updated_at"] = datetime.utcnow()
            
            # Recalculate health metrics if relevant fields changed
            if any(field in update_data for field in ['weight', 'height', 'age', 'gender', 'activity_level', 'goal']):
                # Use updated values or current values
                weight = update_data.get('weight', current_profile['weight'])
                height = update_data.get('height', current_profile['height'])
                age = update_data.get('age', current_profile['age'])
                gender = update_data.get('gender', current_profile['gender'])
                activity_level = update_data.get('activity_level', current_profile['activity_level'])
                goal = update_data.get('goal', current_profile['goal'])
                
                # Recalculate metrics
                bmi = HealthCalculations.calculate_bmi(weight, height)
                bmr = HealthCalculations.calculate_bmr(weight, height, age, gender)
                tdee = HealthCalculations.calculate_tdee(bmr, activity_level)
                daily_calorie_goal = HealthCalculations.calculate_calorie_goal(tdee, goal)
                
                update_data.update({
                    "bmi": bmi,
                    "bmr": bmr,
                    "tdee": tdee,
                    "daily_calorie_goal": daily_calorie_goal
                })
                
                # Update nutrition goals if calorie goal changed
                await self._update_nutrition_goals(ObjectId(user_id), daily_calorie_goal)
            
            # Update the profile
            await db.diet_user_profiles.update_one(
                {"_id": ObjectId(user_id)}, 
                {"$set": update_data}
            )
            
            # Return updated profile
            updated_profile = await self.get_user_profile(user_id)
            
            logger.info(f"Updated user profile {user_id}")
            return updated_profile
            
        except Exception as e:
            logger.error(f"Error updating user profile {user_id}: {str(e)}")
            raise Exception(f"Failed to update user profile: {str(e)}")
    
    # Meal Analysis Operations
    async def save_meal_analysis(self, analysis_data: MealAnalysisCreate) -> MealAnalysis:
        """Save meal analysis to database"""
        try:
            db = await self.get_db()
            
            # Prepare analysis document
            analysis_dict = analysis_data.dict()
            analysis_dict["user_id"] = ObjectId(analysis_data.user_id)
            analysis_dict["created_at"] = datetime.utcnow()
            
            # Insert into database
            result = await db.diet_meal_analyses.insert_one(analysis_dict)
            
            # Update daily nutrition summary
            await self._update_daily_nutrition_summary(
                ObjectId(analysis_data.user_id), 
                analysis_data, 
                datetime.utcnow().date()
            )
            
            # Retrieve the created analysis
            created_analysis = await db.diet_meal_analyses.find_one({"_id": result.inserted_id})
            
            logger.info(f"Saved meal analysis for user {analysis_data.user_id}")
            return MealAnalysis(**created_analysis)
            
        except Exception as e:
            logger.error(f"Error saving meal analysis: {str(e)}")
            raise Exception(f"Failed to save meal analysis: {str(e)}")
    
    async def get_user_meal_history(self, user_id: str, limit: int = 50, skip: int = 0) -> List[MealAnalysis]:
        """Get user's meal history with pagination"""
        try:
            db = await self.get_db()
            
            cursor = db.diet_meal_analyses.find(
                {"user_id": ObjectId(user_id)}
            ).sort("created_at", -1).skip(skip).limit(limit)
            
            meals = []
            async for meal in cursor:
                meals.append(MealAnalysis(**meal))
            
            return meals
            
        except Exception as e:
            logger.error(f"Error getting meal history for user {user_id}: {str(e)}")
            raise Exception(f"Failed to get meal history: {str(e)}")
    
    async def get_daily_meals(self, user_id: str, date: datetime) -> List[MealAnalysis]:
        """Get meals for a specific day"""
        try:
            db = await self.get_db()
            
            # Define date range for the day
            start_date = datetime.combine(date.date(), datetime.min.time())
            end_date = start_date + timedelta(days=1)
            
            cursor = db.diet_meal_analyses.find({
                "user_id": ObjectId(user_id),
                "created_at": {"$gte": start_date, "$lt": end_date}
            }).sort("created_at", 1)
            
            meals = []
            async for meal in cursor:
                meals.append(MealAnalysis(**meal))
            
            return meals
            
        except Exception as e:
            logger.error(f"Error getting daily meals for user {user_id}: {str(e)}")
            raise Exception(f"Failed to get daily meals: {str(e)}")
    
    # Daily Nutrition Summary Operations
    async def get_daily_nutrition_summary(self, user_id: str, date: datetime) -> Optional[DailyNutritionSummary]:
        """Get daily nutrition summary for a specific date"""
        try:
            db = await self.get_db()
            
            summary = await db.diet_daily_summaries.find_one({
                "user_id": ObjectId(user_id),
                "date": datetime.combine(date.date(), datetime.min.time())
            })
            
            if summary:
                return DailyNutritionSummary(**summary)
            return None
            
        except Exception as e:
            logger.error(f"Error getting daily nutrition summary: {str(e)}")
            raise Exception(f"Failed to get daily nutrition summary: {str(e)}")
    
    async def get_nutrition_trends(self, user_id: str, days: int = 30) -> List[DailyNutritionSummary]:
        """Get nutrition trends over specified number of days"""
        try:
            db = await self.get_db()
            
            start_date = datetime.utcnow() - timedelta(days=days)
            
            cursor = db.diet_daily_summaries.find({
                "user_id": ObjectId(user_id),
                "date": {"$gte": start_date}
            }).sort("date", 1)
            
            summaries = []
            async for summary in cursor:
                summaries.append(DailyNutritionSummary(**summary))
            
            return summaries
            
        except Exception as e:
            logger.error(f"Error getting nutrition trends: {str(e)}")
            raise Exception(f"Failed to get nutrition trends: {str(e)}")
    
    # Helper Methods
    async def _create_initial_nutrition_goals(self, user_id: ObjectId, daily_calories: float, profile: UserProfileCreate):
        """Create initial nutrition goals for a new user"""
        try:
            db = await self.get_db()
            
            # Calculate macro targets (protein: 25%, carbs: 45%, fat: 30%)
            daily_protein = (daily_calories * 0.25) / 4  # 4 calories per gram protein
            daily_carbs = (daily_calories * 0.45) / 4    # 4 calories per gram carbs
            daily_fat = (daily_calories * 0.30) / 9      # 9 calories per gram fat
            
            goals = {
                "user_id": user_id,
                "daily_calories": daily_calories,
                "daily_protein": round(daily_protein, 1),
                "daily_carbs": round(daily_carbs, 1),
                "daily_fat": round(daily_fat, 1),
                "weekly_weight_change": -0.5 if profile.goal == "weight_loss" else (0.5 if profile.goal == "weight_gain" else 0),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            await db.diet_nutrition_goals.insert_one(goals)
            
        except Exception as e:
            logger.error(f"Error creating initial nutrition goals: {str(e)}")
    
    async def _update_nutrition_goals(self, user_id: ObjectId, daily_calories: float):
        """Update nutrition goals when user profile changes"""
        try:
            db = await self.get_db()
            
            # Calculate new macro targets
            daily_protein = (daily_calories * 0.25) / 4
            daily_carbs = (daily_calories * 0.45) / 4
            daily_fat = (daily_calories * 0.30) / 9
            
            await db.diet_nutrition_goals.update_one(
                {"user_id": user_id},
                {"$set": {
                    "daily_calories": daily_calories,
                    "daily_protein": round(daily_protein, 1),
                    "daily_carbs": round(daily_carbs, 1),
                    "daily_fat": round(daily_fat, 1),
                    "updated_at": datetime.utcnow()
                }},
                upsert=True
            )
            
        except Exception as e:
            logger.error(f"Error updating nutrition goals: {str(e)}")
    
    async def _update_daily_nutrition_summary(self, user_id: ObjectId, meal: MealAnalysisCreate, date: datetime.date):
        """Update or create daily nutrition summary"""
        try:
            db = await self.get_db()
            
            summary_date = datetime.combine(date, datetime.min.time())
            
            # Check if summary exists for this date
            existing_summary = await db.diet_daily_summaries.find_one({
                "user_id": user_id,
                "date": summary_date
            })
            
            if existing_summary:
                # Update existing summary
                await db.diet_daily_summaries.update_one(
                    {"user_id": user_id, "date": summary_date},
                    {"$inc": {
                        "total_calories": meal.total_calories,
                        "total_protein": meal.total_protein,
                        "total_carbs": meal.total_carbs,
                        "total_fat": meal.total_fat,
                        "meal_count": 1
                    },
                     "$set": {"updated_at": datetime.utcnow()}
                    }
                )
            else:
                # Get user's calorie goal
                user_profile = await db.diet_user_profiles.find_one({"_id": user_id})
                calorie_goal = user_profile.get("daily_calorie_goal", 2000) if user_profile else 2000
                
                # Create new summary
                new_summary = {
                    "user_id": user_id,
                    "date": summary_date,
                    "total_calories": meal.total_calories,
                    "total_protein": meal.total_protein,
                    "total_carbs": meal.total_carbs,
                    "total_fat": meal.total_fat,
                    "meal_count": 1,
                    "meals": [],
                    "calorie_goal": calorie_goal,
                    "goal_achieved": False,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
                
                await db.diet_daily_summaries.insert_one(new_summary)
            
        except Exception as e:
            logger.error(f"Error updating daily nutrition summary: {str(e)}")
    
    async def delete_user_data(self, user_id: str):
        """Delete all user data (for GDPR compliance)"""
        try:
            db = await self.get_db()
            user_oid = ObjectId(user_id)
            
            # Delete user profile
            await db.diet_user_profiles.delete_one({"_id": user_oid})
            
            # Delete meal analyses
            await db.diet_meal_analyses.delete_many({"user_id": user_oid})
            
            # Delete daily summaries
            await db.diet_daily_summaries.delete_many({"user_id": user_oid})
            
            # Delete nutrition goals
            await db.diet_nutrition_goals.delete_many({"user_id": user_oid})
            
            logger.info(f"Deleted all data for user {user_id}")
            
        except Exception as e:
            logger.error(f"Error deleting user data {user_id}: {str(e)}")
            raise Exception(f"Failed to delete user data: {str(e)}")

# Global service instance
diet_service = DietAgentService()
