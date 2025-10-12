"""
Data Aggregation Service
Fetches and aggregates data from different health agents (Diet, Fitness, Mental Health)
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase


class DataAggregationService:
    """Service for aggregating health data from multiple agents"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        """Initialize with database connection"""
        self.db = db
    
    async def get_diet_data(self, user_id: str, days: int = 30) -> Dict[str, Any]:
        """
        Fetch diet-related data for a user
        
        Args:
            user_id: User identifier
            days: Number of days of historical data to fetch
            
        Returns:
            Dictionary containing diet data
        """
        try:
            user_object_id = ObjectId(user_id)
            date_threshold = datetime.utcnow() - timedelta(days=days)
            
            # Get user profile
            profile = await self.db.diet_user_profiles.find_one({"_id": user_object_id})
            
            # Get meal analyses
            meal_analyses = await self.db.diet_meal_analyses.find({
                "user_id": user_object_id,
                "analyzed_at": {"$gte": date_threshold}
            }).sort("analyzed_at", -1).to_list(length=100)
            
            # Get daily summaries
            daily_summaries = await self.db.diet_daily_summaries.find({
                "user_id": user_object_id,
                "date": {"$gte": date_threshold}
            }).sort("date", -1).to_list(length=days)
            
            # Get nutrition goals
            nutrition_goals = await self.db.diet_nutrition_goals.find_one({"user_id": user_object_id})
            
            return {
                "agent": "diet",
                "user_profile": self._serialize_document(profile) if profile else None,
                "meal_analyses": [self._serialize_document(m) for m in meal_analyses],
                "daily_summaries": [self._serialize_document(s) for s in daily_summaries],
                "nutrition_goals": self._serialize_document(nutrition_goals) if nutrition_goals else None,
                "period_days": days,
                "total_meals_analyzed": len(meal_analyses)
            }
            
        except Exception as e:
            return {
                "agent": "diet",
                "error": str(e),
                "data": None
            }
    
    async def get_fitness_data(self, user_id: str, days: int = 30) -> Dict[str, Any]:
        """
        Fetch fitness-related data for a user
        
        Args:
            user_id: User identifier
            days: Number of days of historical data to fetch
            
        Returns:
            Dictionary containing fitness data
        """
        try:
            user_object_id = ObjectId(user_id)
            date_threshold = datetime.utcnow() - timedelta(days=days)
            
            # Get fitness profile
            fitness_profile = await self.db.fitness_profiles.find_one({"user_id": user_object_id})
            
            # Get workout plans
            workout_plans = await self.db.fitness_workout_plans.find({
                "user_id": user_object_id,
                "created_at": {"$gte": date_threshold}
            }).sort("created_at", -1).to_list(length=50)
            
            # Get workout logs
            workout_logs = await self.db.fitness_workout_logs.find({
                "user_id": user_object_id,
                "date": {"$gte": date_threshold}
            }).sort("date", -1).to_list(length=100)
            
            # Get fitness goals
            fitness_goals = await self.db.fitness_goals.find_one({"user_id": user_object_id})
            
            return {
                "agent": "fitness",
                "fitness_profile": self._serialize_document(fitness_profile) if fitness_profile else None,
                "workout_plans": [self._serialize_document(w) for w in workout_plans],
                "workout_logs": [self._serialize_document(w) for w in workout_logs],
                "fitness_goals": self._serialize_document(fitness_goals) if fitness_goals else None,
                "period_days": days,
                "total_workouts": len(workout_logs)
            }
            
        except Exception as e:
            return {
                "agent": "fitness",
                "error": str(e),
                "data": None
            }
    
    async def get_mental_health_data(self, user_id: str, days: int = 30) -> Dict[str, Any]:
        """
        Fetch mental health-related data for a user
        
        Args:
            user_id: User identifier
            days: Number of days of historical data to fetch
            
        Returns:
            Dictionary containing mental health data
        """
        try:
            user_object_id = ObjectId(user_id)
            date_threshold = datetime.utcnow() - timedelta(days=days)
            
            # Get mental health profile
            mental_profile = await self.db.mental_health_profiles.find_one({"user_id": user_object_id})
            
            # Get mood logs
            mood_logs = await self.db.mental_health_mood_logs.find({
                "user_id": user_object_id,
                "logged_at": {"$gte": date_threshold}
            }).sort("logged_at", -1).to_list(length=100)
            
            # Get stress assessments
            stress_assessments = await self.db.mental_health_stress_assessments.find({
                "user_id": user_object_id,
                "assessed_at": {"$gte": date_threshold}
            }).sort("assessed_at", -1).to_list(length=50)
            
            # Get meditation/mindfulness sessions
            mindfulness_sessions = await self.db.mental_health_mindfulness_sessions.find({
                "user_id": user_object_id,
                "session_date": {"$gte": date_threshold}
            }).sort("session_date", -1).to_list(length=100)
            
            return {
                "agent": "mental_health",
                "mental_profile": self._serialize_document(mental_profile) if mental_profile else None,
                "mood_logs": [self._serialize_document(m) for m in mood_logs],
                "stress_assessments": [self._serialize_document(s) for s in stress_assessments],
                "mindfulness_sessions": [self._serialize_document(m) for m in mindfulness_sessions],
                "period_days": days,
                "total_mood_entries": len(mood_logs)
            }
            
        except Exception as e:
            return {
                "agent": "mental_health",
                "error": str(e),
                "data": None
            }
    
    async def get_all_health_data(self, user_id: str, days: int = 30) -> Dict[str, Any]:
        """
        Fetch all health data from all agents for a user
        
        Args:
            user_id: User identifier
            days: Number of days of historical data to fetch
            
        Returns:
            Comprehensive health data from all agents
        """
        # Fetch data from all agents
        diet_data = await self.get_diet_data(user_id, days)
        fitness_data = await self.get_fitness_data(user_id, days)
        mental_health_data = await self.get_mental_health_data(user_id, days)
        
        # Aggregate summary statistics
        return {
            "user_id": user_id,
            "generated_at": datetime.utcnow().isoformat(),
            "period_days": days,
            "diet_agent": diet_data,
            "fitness_agent": fitness_data,
            "mental_health_agent": mental_health_data,
            "summary": {
                "total_meal_analyses": diet_data.get("total_meals_analyzed", 0),
                "total_workouts": fitness_data.get("total_workouts", 0),
                "total_mood_entries": mental_health_data.get("total_mood_entries", 0)
            }
        }
    
    async def get_specific_report(
        self, 
        user_id: str, 
        report_type: str, 
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Get a specific type of health report
        
        Args:
            user_id: User identifier
            report_type: Type of report ('diet', 'fitness', 'mental_health', 'all')
            days: Number of days of historical data
            
        Returns:
            Requested health data
        """
        if report_type == "diet":
            return await self.get_diet_data(user_id, days)
        elif report_type == "fitness":
            return await self.get_fitness_data(user_id, days)
        elif report_type == "mental_health":
            return await self.get_mental_health_data(user_id, days)
        elif report_type == "all":
            return await self.get_all_health_data(user_id, days)
        else:
            raise ValueError(f"Invalid report type: {report_type}")
    
    @staticmethod
    def _serialize_document(doc: Dict) -> Dict:
        """Convert MongoDB document to JSON-serializable format"""
        if doc is None:
            return None
        
        serialized = {}
        for key, value in doc.items():
            if isinstance(value, ObjectId):
                serialized[key] = str(value)
            elif isinstance(value, datetime):
                serialized[key] = value.isoformat()
            elif isinstance(value, dict):
                serialized[key] = DataAggregationService._serialize_document(value)
            elif isinstance(value, list):
                serialized[key] = [
                    DataAggregationService._serialize_document(item) if isinstance(item, dict) else item
                    for item in value
                ]
            else:
                serialized[key] = value
        
        return serialized
