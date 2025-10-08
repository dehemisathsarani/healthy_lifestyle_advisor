from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from bson import ObjectId
from pymongo.errors import PyMongoError
import logging

from ..core.database import get_database
from ..models.nutrition_models import (
    NutritionLog, NutritionLogCreate, NutritionLogUpdate,
    WeeklyReport, DailyNutritionSummary, UserNutritionPreferences,
    NutritionData, FoodItem, NutritionCalculations
)

logger = logging.getLogger(__name__)

class NutritionService:
    """Service class for handling nutrition data operations"""
    
    def __init__(self):
        self.db = None
    
    async def get_db(self):
        """Get database instance"""
        if not self.db:
            self.db = await get_database()
        return self.db
    
    # Nutrition Logs Operations
    async def create_nutrition_log(self, user_id: str, log_data: NutritionLogCreate) -> Optional[NutritionLog]:
        """Create a new nutrition log entry"""
        try:
            db = await self.get_db()
            
            # Calculate total nutrition
            total_nutrition = NutritionCalculations.calculate_total_nutrition(log_data.meals)
            
            # Create nutrition log
            nutrition_log = NutritionLog(
                user_id=user_id,
                date=datetime.now().strftime("%Y-%m-%d"),
                meals=log_data.meals,
                total_nutrition=total_nutrition,
                meal_type=log_data.meal_type,
                notes=log_data.notes,
                analysis_method=log_data.analysis_method,
                image_url=log_data.image_url,
                text_input=log_data.text_input,
                ai_insights=log_data.ai_insights or [],
                confidence_score=self._calculate_confidence_score(log_data.meals)
            )
            
            # Insert into database
            result = await db.nutrition_logs.insert_one(nutrition_log.dict(by_alias=True, exclude={'id'}))
            
            if result.inserted_id:
                # Update daily summary
                await self._update_daily_summary(user_id, nutrition_log)
                
                # Return created log with ID
                nutrition_log.id = result.inserted_id
                return nutrition_log
            
            return None
            
        except PyMongoError as e:
            logger.error(f"Database error creating nutrition log: {e}")
            return None
        except Exception as e:
            logger.error(f"Error creating nutrition log: {e}")
            return None
    
    async def get_nutrition_logs(self, user_id: str, page: int = 1, per_page: int = 10, 
                               start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict[str, Any]:
        """Get paginated nutrition logs for a user"""
        try:
            db = await self.get_db()
            
            # Build query
            query = {"user_id": user_id}
            if start_date or end_date:
                date_query = {}
                if start_date:
                    date_query["$gte"] = start_date
                if end_date:
                    date_query["$lte"] = end_date
                query["date"] = date_query
            
            # Get total count
            total = await db.nutrition_logs.count_documents(query)
            
            # Get paginated results
            skip = (page - 1) * per_page
            cursor = db.nutrition_logs.find(query).sort("created_at", -1).skip(skip).limit(per_page)
            logs = []
            
            async for doc in cursor:
                doc['id'] = str(doc['_id'])
                logs.append(NutritionLog(**doc))
            
            total_pages = (total + per_page - 1) // per_page
            
            return {
                "logs": logs,
                "total": total,
                "page": page,
                "per_page": per_page,
                "total_pages": total_pages
            }
            
        except PyMongoError as e:
            logger.error(f"Database error getting nutrition logs: {e}")
            return {"logs": [], "total": 0, "page": page, "per_page": per_page, "total_pages": 0}
    
    async def get_nutrition_log_by_id(self, user_id: str, log_id: str) -> Optional[NutritionLog]:
        """Get a specific nutrition log by ID"""
        try:
            db = await self.get_db()
            
            doc = await db.nutrition_logs.find_one({
                "_id": ObjectId(log_id),
                "user_id": user_id
            })
            
            if doc:
                doc['id'] = str(doc['_id'])
                return NutritionLog(**doc)
            
            return None
            
        except PyMongoError as e:
            logger.error(f"Database error getting nutrition log: {e}")
            return None
    
    async def update_nutrition_log(self, user_id: str, log_id: str, update_data: NutritionLogUpdate) -> Optional[NutritionLog]:
        """Update a nutrition log"""
        try:
            db = await self.get_db()
            
            update_dict = {}
            if update_data.meals is not None:
                update_dict["meals"] = [meal.dict() for meal in update_data.meals]
                update_dict["total_nutrition"] = NutritionCalculations.calculate_total_nutrition(update_data.meals).dict()
            if update_data.meal_type is not None:
                update_dict["meal_type"] = update_data.meal_type
            if update_data.notes is not None:
                update_dict["notes"] = update_data.notes
            if update_data.ai_insights is not None:
                update_dict["ai_insights"] = update_data.ai_insights
            
            update_dict["updated_at"] = datetime.utcnow()
            
            result = await db.nutrition_logs.update_one(
                {"_id": ObjectId(log_id), "user_id": user_id},
                {"$set": update_dict}
            )
            
            if result.modified_count > 0:
                return await self.get_nutrition_log_by_id(user_id, log_id)
            
            return None
            
        except PyMongoError as e:
            logger.error(f"Database error updating nutrition log: {e}")
            return None
    
    async def delete_nutrition_log(self, user_id: str, log_id: str) -> bool:
        """Delete a nutrition log"""
        try:
            db = await self.get_db()
            
            result = await db.nutrition_logs.delete_one({
                "_id": ObjectId(log_id),
                "user_id": user_id
            })
            
            if result.deleted_count > 0:
                # Update daily summary
                await self._recalculate_daily_summary(user_id, datetime.now().strftime("%Y-%m-%d"))
                return True
            
            return False
            
        except PyMongoError as e:
            logger.error(f"Database error deleting nutrition log: {e}")
            return False
    
    # Daily Summary Operations
    async def get_daily_summary(self, user_id: str, date: Optional[str] = None) -> Optional[DailyNutritionSummary]:
        """Get daily nutrition summary"""
        try:
            db = await self.get_db()
            
            if not date:
                date = datetime.now().strftime("%Y-%m-%d")
            
            doc = await db.daily_nutrition_summaries.find_one({
                "user_id": user_id,
                "date": date
            })
            
            if doc:
                doc['id'] = str(doc['_id'])
                return DailyNutritionSummary(**doc)
            
            return None
            
        except PyMongoError as e:
            logger.error(f"Database error getting daily summary: {e}")
            return None
    
    async def get_weekly_summaries(self, user_id: str, start_date: str, end_date: str) -> List[DailyNutritionSummary]:
        """Get daily summaries for a week"""
        try:
            db = await self.get_db()
            
            cursor = db.daily_nutrition_summaries.find({
                "user_id": user_id,
                "date": {"$gte": start_date, "$lte": end_date}
            }).sort("date", 1)
            
            summaries = []
            async for doc in cursor:
                doc['id'] = str(doc['_id'])
                summaries.append(DailyNutritionSummary(**doc))
            
            return summaries
            
        except PyMongoError as e:
            logger.error(f"Database error getting weekly summaries: {e}")
            return []
    
    # Weekly Report Operations
    async def generate_weekly_report(self, user_id: str, start_date: Optional[str] = None, 
                                   end_date: Optional[str] = None) -> Optional[WeeklyReport]:
        """Generate a comprehensive weekly nutrition report"""
        try:
            db = await self.get_db()
            
            # Default to last 7 days if dates not provided
            if not end_date:
                end_date = datetime.now().strftime("%Y-%m-%d")
            if not start_date:
                start_date = (datetime.now() - timedelta(days=6)).strftime("%Y-%m-%d")
            
            # Get nutrition logs for the period
            logs_data = await self.get_nutrition_logs(
                user_id=user_id,
                per_page=1000,  # Get all logs for the period
                start_date=start_date,
                end_date=end_date
            )
            logs = logs_data["logs"]
            
            if not logs:
                return None
            
            # Calculate weekly totals and averages
            total_nutrition = {
                'calories': 0.0, 'protein': 0.0, 'carbs': 0.0, 'fat': 0.0,
                'fiber': 0.0, 'sugar': 0.0, 'sodium': 0.0
            }
            
            meal_frequency = {}
            top_foods = {}
            
            for log in logs:
                # Add to totals
                nutrition = log.total_nutrition
                total_nutrition['calories'] += nutrition.calories
                total_nutrition['protein'] += nutrition.protein
                total_nutrition['carbs'] += nutrition.carbs
                total_nutrition['fat'] += nutrition.fat
                if nutrition.fiber: total_nutrition['fiber'] += nutrition.fiber
                if nutrition.sugar: total_nutrition['sugar'] += nutrition.sugar
                if nutrition.sodium: total_nutrition['sodium'] += nutrition.sodium
                
                # Count meal types
                meal_frequency[log.meal_type] = meal_frequency.get(log.meal_type, 0) + 1
                
                # Count foods
                for meal in log.meals:
                    top_foods[meal.name] = top_foods.get(meal.name, 0) + 1
            
            # Calculate averages
            num_days = len(set(log.date for log in logs))
            avg_daily_calories = total_nutrition['calories'] / num_days if num_days > 0 else 0
            
            # Get user preferences for goal comparison
            preferences = await self.get_user_nutrition_preferences(user_id)
            
            # Calculate health score
            avg_nutrition = NutritionData(
                calories=avg_daily_calories,
                protein=total_nutrition['protein'] / num_days,
                carbs=total_nutrition['carbs'] / num_days,
                fat=total_nutrition['fat'] / num_days,
                fiber=total_nutrition['fiber'] / num_days if total_nutrition['fiber'] else None,
                sugar=total_nutrition['sugar'] / num_days if total_nutrition['sugar'] else None,
                sodium=total_nutrition['sodium'] / num_days if total_nutrition['sodium'] else None
            )
            
            health_score = 85  # Default score
            if preferences:
                health_score = NutritionCalculations.generate_health_score(avg_nutrition, preferences)
            
            # Generate insights and recommendations
            insights = self._generate_weekly_insights(logs, avg_nutrition, preferences)
            recommendations = self._generate_weekly_recommendations(logs, avg_nutrition, preferences)
            
            # Get top foods list
            top_foods_list = sorted(top_foods.keys(), key=lambda x: top_foods[x], reverse=True)[:10]
            
            # Create weekly report
            weekly_report = WeeklyReport(
                user_id=user_id,
                period=f"{start_date} - {end_date}",
                start_date=start_date,
                end_date=end_date,
                average_daily_calories=round(avg_daily_calories, 1),
                total_logs=len(logs),
                nutrition_trends=NutritionData(**total_nutrition),
                insights=insights,
                recommendations=recommendations,
                health_score=health_score,
                meal_frequency=meal_frequency,
                top_foods=top_foods_list,
                nutrition_goals_met=self._calculate_goals_achievement(avg_nutrition, preferences)
            )
            
            # Save to database
            result = await db.weekly_reports.insert_one(weekly_report.dict(by_alias=True, exclude={'id'}))
            if result.inserted_id:
                weekly_report.id = result.inserted_id
            
            return weekly_report
            
        except Exception as e:
            logger.error(f"Error generating weekly report: {e}")
            return None
    
    async def get_weekly_reports(self, user_id: str, limit: int = 10) -> List[WeeklyReport]:
        """Get user's weekly reports"""
        try:
            db = await self.get_db()
            
            cursor = db.weekly_reports.find({
                "user_id": user_id
            }).sort("created_at", -1).limit(limit)
            
            reports = []
            async for doc in cursor:
                doc['id'] = str(doc['_id'])
                reports.append(WeeklyReport(**doc))
            
            return reports
            
        except PyMongoError as e:
            logger.error(f"Database error getting weekly reports: {e}")
            return []
    
    # User Preferences Operations
    async def get_user_nutrition_preferences(self, user_id: str) -> Optional[UserNutritionPreferences]:
        """Get user's nutrition preferences"""
        try:
            db = await self.get_db()
            
            doc = await db.user_nutrition_preferences.find_one({"user_id": user_id})
            
            if doc:
                doc['id'] = str(doc['_id'])
                return UserNutritionPreferences(**doc)
            
            return None
            
        except PyMongoError as e:
            logger.error(f"Database error getting user preferences: {e}")
            return None
    
    async def update_user_nutrition_preferences(self, user_id: str, preferences: UserNutritionPreferences) -> Optional[UserNutritionPreferences]:
        """Update user's nutrition preferences"""
        try:
            db = await self.get_db()
            
            preferences.user_id = user_id
            preferences.updated_at = datetime.utcnow()
            
            result = await db.user_nutrition_preferences.update_one(
                {"user_id": user_id},
                {"$set": preferences.dict(by_alias=True, exclude={'id'})},
                upsert=True
            )
            
            if result.upserted_id or result.modified_count > 0:
                return await self.get_user_nutrition_preferences(user_id)
            
            return None
            
        except PyMongoError as e:
            logger.error(f"Database error updating user preferences: {e}")
            return None
    
    # Helper Methods
    async def _update_daily_summary(self, user_id: str, nutrition_log: NutritionLog):
        """Update daily summary when a new log is added"""
        try:
            db = await self.get_db()
            
            # Get existing summary or create new one
            date = nutrition_log.date
            existing_summary = await self.get_daily_summary(user_id, date)
            
            if existing_summary:
                # Update existing summary
                new_total = NutritionData(
                    calories=existing_summary.total_nutrition.calories + nutrition_log.total_nutrition.calories,
                    protein=existing_summary.total_nutrition.protein + nutrition_log.total_nutrition.protein,
                    carbs=existing_summary.total_nutrition.carbs + nutrition_log.total_nutrition.carbs,
                    fat=existing_summary.total_nutrition.fat + nutrition_log.total_nutrition.fat,
                    fiber=(existing_summary.total_nutrition.fiber or 0) + (nutrition_log.total_nutrition.fiber or 0),
                    sugar=(existing_summary.total_nutrition.sugar or 0) + (nutrition_log.total_nutrition.sugar or 0),
                    sodium=(existing_summary.total_nutrition.sodium or 0) + (nutrition_log.total_nutrition.sodium or 0)
                )
                
                await db.daily_nutrition_summaries.update_one(
                    {"_id": existing_summary.id},
                    {
                        "$set": {
                            "total_nutrition": new_total.dict(),
                            "meal_count": existing_summary.meal_count + 1,
                            "updated_at": datetime.utcnow()
                        },
                        "$push": {"nutrition_logs": nutrition_log.id}
                    }
                )
            else:
                # Create new summary
                summary = DailyNutritionSummary(
                    user_id=user_id,
                    date=date,
                    total_nutrition=nutrition_log.total_nutrition,
                    meal_count=1,
                    nutrition_logs=[nutrition_log.id]
                )
                
                await db.daily_nutrition_summaries.insert_one(summary.dict(by_alias=True, exclude={'id'}))
                
        except Exception as e:
            logger.error(f"Error updating daily summary: {e}")
    
    async def _recalculate_daily_summary(self, user_id: str, date: str):
        """Recalculate daily summary after a log is deleted"""
        try:
            db = await self.get_db()
            
            # Get all logs for the date
            logs_data = await self.get_nutrition_logs(
                user_id=user_id,
                per_page=1000,
                start_date=date,
                end_date=date
            )
            logs = logs_data["logs"]
            
            if logs:
                # Recalculate totals
                total_nutrition = NutritionCalculations.calculate_total_nutrition([
                    meal for log in logs for meal in log.meals
                ])
                
                await db.daily_nutrition_summaries.update_one(
                    {"user_id": user_id, "date": date},
                    {
                        "$set": {
                            "total_nutrition": total_nutrition.dict(),
                            "meal_count": len(logs),
                            "nutrition_logs": [log.id for log in logs],
                            "updated_at": datetime.utcnow()
                        }
                    }
                )
            else:
                # Delete summary if no logs
                await db.daily_nutrition_summaries.delete_one({
                    "user_id": user_id,
                    "date": date
                })
                
        except Exception as e:
            logger.error(f"Error recalculating daily summary: {e}")
    
    def _calculate_confidence_score(self, food_items: List[FoodItem]) -> float:
        """Calculate overall confidence score for a list of food items"""
        if not food_items:
            return 0.0
        
        total_confidence = sum(item.confidence or 0.5 for item in food_items)
        return round(total_confidence / len(food_items), 2)
    
    def _generate_weekly_insights(self, logs: List[NutritionLog], avg_nutrition: NutritionData, 
                                preferences: Optional[UserNutritionPreferences]) -> List[str]:
        """Generate weekly insights based on nutrition data"""
        insights = [
            f"📊 Analyzed {len(logs)} meal entries from the past week",
            f"🍽️ Average daily calories: {avg_nutrition.calories:.0f} kcal",
            f"🥩 Average daily protein: {avg_nutrition.protein:.1f}g",
            f"🍚 Average daily carbs: {avg_nutrition.carbs:.1f}g",
            f"🥑 Average daily fat: {avg_nutrition.fat:.1f}g"
        ]
        
        if preferences:
            calorie_ratio = avg_nutrition.calories / preferences.daily_calorie_goal if preferences.daily_calorie_goal > 0 else 1
            if calorie_ratio > 1.1:
                insights.append("⚠️ Average calorie intake exceeded your daily goal")
            elif calorie_ratio < 0.9:
                insights.append("📉 Average calorie intake was below your daily goal")
            else:
                insights.append("✅ Average calorie intake was well-balanced with your goal")
        
        return insights
    
    def _generate_weekly_recommendations(self, logs: List[NutritionLog], avg_nutrition: NutritionData, 
                                      preferences: Optional[UserNutritionPreferences]) -> List[str]:
        """Generate weekly recommendations"""
        recommendations = [
            "🌱 Include more colorful vegetables in your meals",
            "💧 Maintain hydration with 8-10 glasses of water daily",
            "🏃‍♂️ Balance nutrition with regular physical activity",
            "🥗 Try meal prepping for more consistent nutrition"
        ]
        
        if avg_nutrition.fiber and avg_nutrition.fiber < 20:
            recommendations.append("🌾 Increase fiber intake with whole grains and legumes")
        
        if avg_nutrition.sodium and avg_nutrition.sodium > 2000:
            recommendations.append("🧂 Reduce sodium by limiting processed foods")
        
        return recommendations
    
    def _calculate_goals_achievement(self, avg_nutrition: NutritionData, 
                                   preferences: Optional[UserNutritionPreferences]) -> Dict[str, bool]:
        """Calculate which nutrition goals were met"""
        if not preferences:
            return {}
        
        goals_met = {}
        
        if preferences.daily_calorie_goal > 0:
            ratio = avg_nutrition.calories / preferences.daily_calorie_goal
            goals_met["calories"] = 0.9 <= ratio <= 1.1
        
        if preferences.daily_protein_goal > 0:
            ratio = avg_nutrition.protein / preferences.daily_protein_goal
            goals_met["protein"] = ratio >= 0.8
        
        if preferences.daily_carbs_goal > 0:
            ratio = avg_nutrition.carbs / preferences.daily_carbs_goal
            goals_met["carbs"] = ratio <= 1.2
        
        if preferences.daily_fat_goal > 0:
            ratio = avg_nutrition.fat / preferences.daily_fat_goal
            goals_met["fat"] = ratio <= 1.2
        
        return goals_met

# Create singleton instance
nutrition_service = NutritionService()
