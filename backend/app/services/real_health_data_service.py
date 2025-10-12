"""
Real Health Data Service - Fetches actual user health data from cloud database
"""

from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)

class RealHealthDataService:
    """Service to fetch real health data from cloud database collections"""
    
    def __init__(self, database: AsyncIOMotorDatabase):
        self.db = database
    
    async def get_user_health_report(self, email: str, report_type: str = "all") -> Dict[str, Any]:
        """
        Generate comprehensive health report from real database collections
        
        Args:
            email: User email to generate report for
            report_type: Type of report - 'all', 'diet', 'fitness', 'mental_health'
            
        Returns:
            Dict containing real health data aggregated from multiple collections
        """
        try:
            logger.info(f"🔍 Generating real health report for: {email}")
            
            # Find user by email
            user = await self._find_user_by_email(email)
            user_id = str(user.get('_id')) if user else None
            
            if not user_id:
                logger.warning(f"⚠️ User not found for email: {email}")
                return self._generate_demo_report(email)
            
            logger.info(f"✅ Found user: {user_id} - Report Type: {report_type}")
            
            # Fetch real data from multiple collections based on report type
            report_content = {}
            
            if report_type in ["all", "diet"]:
                diet_data = await self._get_real_diet_data(user_id)
                report_content["diet_data"] = diet_data
            
            if report_type in ["all", "fitness"]:
                fitness_data = await self._get_real_fitness_data(user_id)
                report_content["fitness_data"] = fitness_data
                
            if report_type in ["all", "mental_health"]:
                mental_health_data = await self._get_real_mental_health_data(user_id)
                report_content["mental_health_data"] = mental_health_data
            
            # Generate comprehensive report
            report = {
                "report_id": f"real_health_report_{user_id}_{report_type}_{int(datetime.now().timestamp())}",
                "user_email": email,
                "user_id": user_id,
                "report_type": report_type,
                "generated_at": datetime.now().isoformat(),
                "data_source": "REAL_DATABASE_COLLECTIONS",
                "report_content": report_content,
                "recommendations": await self._generate_filtered_recommendations(report_content, report_type)
            }
            
            logger.info(f"✅ Generated real health report with {len(report['recommendations'])} recommendations")
            return report
            
        except Exception as e:
            logger.error(f"❌ Error generating real health report: {e}")
            return self._generate_demo_report(email)
    
    async def _find_user_by_email(self, email: str) -> Optional[Dict]:
        """Find user in user_profiles or users collections"""
        try:
            # Try user_profiles first
            user = await self.db.user_profiles.find_one({"email": email.lower()})
            if user:
                return user
                
            # Try users collection
            user = await self.db.users.find_one({"email": email.lower()})
            if user:
                return user
                
            # Try with different email field names
            user = await self.db.user_profiles.find_one({"user_email": email.lower()})
            if user:
                return user
                
            return None
            
        except Exception as e:
            logger.error(f"❌ Error finding user: {e}")
            return None
    
    async def _get_real_diet_data(self, user_id: str) -> Dict[str, Any]:
        """Fetch real diet/nutrition data"""
        try:
            # Get nutrition entries
            nutrition_cursor = self.db.nutrition_entries.find({"user_id": user_id})
            nutrition_entries = await nutrition_cursor.to_list(length=100)
            
            # Get meal analyses
            meal_cursor = self.db.meal_analyses.find({"user_id": user_id})
            meal_analyses = await meal_cursor.to_list(length=100)
            
            # Get daily nutrition summaries
            daily_cursor = self.db.daily_nutrition_summaries.find({"user_id": user_id})
            daily_summaries = await daily_cursor.to_list(length=30)
            
            # Calculate aggregates
            total_meals = len(nutrition_entries) + len(meal_analyses)
            
            total_calories = 0
            total_protein = 0
            total_carbs = 0
            total_fat = 0
            
            # Sum from nutrition entries
            for entry in nutrition_entries:
                total_calories += float(entry.get('calories', 0))
                
            # Sum from daily summaries
            for summary in daily_summaries:
                total_calories += float(summary.get('total_calories', 0))
                total_protein += float(summary.get('total_protein', 0))
                total_carbs += float(summary.get('total_carbs', 0))
                total_fat += float(summary.get('total_fat', 0))
            
            avg_calories = total_calories / max(len(daily_summaries), 1) if daily_summaries else 0
            
            # Calculate nutrition score (simple algorithm)
            nutrition_score = min(10.0, (total_protein * 0.3 + total_carbs * 0.2 + (2000 - abs(avg_calories - 2000)) * 0.001))
            
            return {
                "total_meals": total_meals,
                "nutrition_entries_count": len(nutrition_entries),
                "meal_analyses_count": len(meal_analyses),
                "daily_summaries_count": len(daily_summaries),
                "total_calories": round(total_calories, 1),
                "avg_calories_per_day": round(avg_calories, 1),
                "total_protein": round(total_protein, 1),
                "total_carbs": round(total_carbs, 1),
                "total_fat": round(total_fat, 1),
                "nutrition_score": round(nutrition_score, 1),
                "data_period_days": len(daily_summaries),
                "last_meal_date": nutrition_entries[-1].get('date') if nutrition_entries else None
            }
            
        except Exception as e:
            logger.error(f"❌ Error fetching diet data: {e}")
            return {
                "total_meals": 0,
                "avg_calories": 0,
                "nutrition_score": 0,
                "error": "Unable to fetch diet data"
            }
    
    async def _get_real_fitness_data(self, user_id: str) -> Dict[str, Any]:
        """Fetch real fitness/workout data"""
        try:
            # Get workout history
            workout_cursor = self.db.workout_history.find({"user_id": user_id})
            workout_history = await workout_cursor.to_list(length=100)
            
            # Get workout plans
            plans_cursor = self.db.workout_plans.find({"user_id": user_id})
            workout_plans = await plans_cursor.to_list(length=50)
            
            # Get generated workout plans
            generated_cursor = self.db.generated_workout_plans.find({"user_id": user_id})
            generated_plans = await generated_cursor.to_list(length=50)
            
            total_workouts = len(workout_history)
            total_plans = len(workout_plans) + len(generated_plans)
            
            # Calculate average duration and fitness score
            total_duration_minutes = 0
            for workout in workout_history:
                duration = workout.get('duration_minutes', workout.get('duration', 45))
                if isinstance(duration, str) and 'min' in duration:
                    duration = int(duration.replace('min', '').strip())
                total_duration_minutes += int(duration) if duration else 45
                
            avg_duration = total_duration_minutes / max(total_workouts, 1) if total_workouts > 0 else 0
            
            # Simple fitness score calculation
            fitness_score = min(10.0, (total_workouts * 0.5 + total_plans * 0.3 + avg_duration * 0.05))
            
            return {
                "total_workouts": total_workouts,
                "workout_plans_count": len(workout_plans),
                "generated_plans_count": len(generated_plans),
                "total_workout_plans": total_plans,
                "total_duration_minutes": total_duration_minutes,
                "avg_duration_minutes": round(avg_duration, 1),
                "avg_duration": f"{round(avg_duration, 0)} min" if avg_duration > 0 else "No data",
                "fitness_score": round(fitness_score, 1),
                "last_workout_date": workout_history[-1].get('date', workout_history[-1].get('created_at')) if workout_history else None
            }
            
        except Exception as e:
            logger.error(f"❌ Error fetching fitness data: {e}")
            return {
                "total_workouts": 0,
                "avg_duration": "No data",
                "fitness_score": 0,
                "error": "Unable to fetch fitness data"
            }
    
    async def _get_real_mental_health_data(self, user_id: str) -> Dict[str, Any]:
        """Fetch real mental health data"""
        try:
            # Get mental health history
            mental_cursor = self.db.mental_health_history.find({"user_id": user_id})
            mental_history = await mental_cursor.to_list(length=100)
            
            # Get mood logs
            mood_cursor = self.db.mood_logs.find({"user_id": user_id})
            mood_logs = await mood_cursor.to_list(length=100)
            
            # Get meditation sessions
            meditation_cursor = self.db.meditation_sessions.find({"user_id": user_id})
            meditation_sessions = await meditation_cursor.to_list(length=100)
            
            total_entries = len(mental_history)
            total_mood_logs = len(mood_logs)
            total_meditation = len(meditation_sessions)
            
            # Calculate mood average
            mood_sum = 0
            mood_count = 0
            
            for entry in mental_history:
                mood = entry.get('mood_rating', entry.get('mood', entry.get('mood_level')))
                if mood and isinstance(mood, (int, float)):
                    mood_sum += float(mood)
                    mood_count += 1
            
            for log in mood_logs:
                mood = log.get('mood_rating', log.get('mood', log.get('mood_level')))
                if mood and isinstance(mood, (int, float)):
                    mood_sum += float(mood)
                    mood_count += 1
                    
            mood_average = mood_sum / mood_count if mood_count > 0 else 7.0
            
            # Determine stress level
            if mood_average >= 8:
                stress_level = "Low"
            elif mood_average >= 6:
                stress_level = "Moderate"
            else:
                stress_level = "High"
            
            # Calculate wellness score
            wellness_score = min(10.0, (mood_average * 0.7 + total_meditation * 0.2 + total_mood_logs * 0.1))
            
            return {
                "mental_health_entries": total_entries,
                "mood_logs_count": total_mood_logs,
                "meditation_sessions_count": total_meditation,
                "total_mental_health_records": total_entries + total_mood_logs,
                "mood_average": round(mood_average, 1),
                "mood_rating_scale": "1-10",
                "stress_level": stress_level,
                "wellness_score": round(wellness_score, 1),
                "last_mental_health_update": mental_history[-1].get('date', mental_history[-1].get('created_at')) if mental_history else None
            }
            
        except Exception as e:
            logger.error(f"❌ Error fetching mental health data: {e}")
            return {
                "mood_average": 7.0,
                "stress_level": "Unknown",
                "wellness_score": 7.0,
                "error": "Unable to fetch mental health data"
            }
    
    async def _generate_filtered_recommendations(self, report_content: Dict, report_type: str) -> List[str]:
        """Generate recommendations based on selected report type and available data"""
        recommendations = []
        
        try:
            # Diet recommendations
            if "diet_data" in report_content:
                diet_data = report_content["diet_data"]
                if diet_data.get('avg_calories_per_day', 0) < 1500:
                    recommendations.append("🍎 Increase daily calorie intake - you're below recommended levels")
                elif diet_data.get('avg_calories_per_day', 0) > 2500:
                    recommendations.append("🥗 Consider reducing calorie intake for better health balance")
                
                if diet_data.get('total_meals', 0) < 20:
                    recommendations.append("🍽️ Log more meals to get better nutrition insights")
                    
                if diet_data.get('nutrition_score', 0) < 6:
                    recommendations.append("🥬 Focus on improving nutrition quality - add more vegetables and lean proteins")
            
            # Fitness recommendations  
            if "fitness_data" in report_content:
                fitness_data = report_content["fitness_data"]
                if fitness_data.get('total_workouts', 0) < 5:
                    recommendations.append("🏃‍♂️ Increase workout frequency - aim for at least 3-4 sessions per week")
                elif fitness_data.get('total_workouts', 0) > 20:
                    recommendations.append("💪 Great job staying active! Consider adding recovery days")
                    
                if fitness_data.get('avg_duration_minutes', 0) < 30:
                    recommendations.append("⏱️ Try extending workout duration to 30-45 minutes for better results")
            
            # Mental health recommendations
            if "mental_health_data" in report_content:
                mental_health_data = report_content["mental_health_data"]
                if mental_health_data.get('mood_average', 0) < 6:
                    recommendations.append("😌 Consider stress management techniques - your mood scores suggest need for support")
                elif mental_health_data.get('mood_average', 0) > 8:
                    recommendations.append("🌟 Excellent mental wellness! Keep up your positive habits")
                    
                if mental_health_data.get('meditation_sessions_count', 0) < 5:
                    recommendations.append("🧘‍♀️ Try incorporating meditation or mindfulness practices")
            
            # Report type specific recommendations
            if report_type == "diet" and len(recommendations) < 3:
                recommendations.extend([
                    "📊 Keep tracking your nutrition data for better insights",
                    "🎯 Set specific weekly nutrition goals",
                    "💧 Stay hydrated with 8-10 glasses of water daily"
                ])
            elif report_type == "fitness" and len(recommendations) < 3:
                recommendations.extend([
                    "📊 Track your workouts consistently for better progress",
                    "🎯 Set achievable fitness goals",
                    "💤 Ensure adequate rest between intense workout sessions"
                ])
            elif report_type == "mental_health" and len(recommendations) < 3:
                recommendations.extend([
                    "📊 Regular mood tracking helps identify patterns",
                    "🎯 Practice mindfulness daily for mental clarity",
                    "💤 Quality sleep is crucial for mental health"
                ])
            elif len(recommendations) < 3:
                recommendations.extend([
                    "📊 Keep tracking your health data for better insights",
                    "🎯 Set specific weekly health goals",
                    "💤 Maintain consistent sleep schedule for optimal recovery"
                ])
            
            return recommendations[:6]  # Return max 6 recommendations
            
        except Exception as e:
            logger.error(f"❌ Error generating filtered recommendations: {e}")
            return [
                f"📊 Continue tracking your {report_type} data" if report_type != "all" else "📊 Continue tracking your health data",
                "🎯 Set specific health goals",
                "💪 Stay consistent with your health journey"
            ]
    
    async def _generate_real_recommendations(self, diet_data: Dict, fitness_data: Dict, mental_health_data: Dict) -> List[str]:
        """Generate personalized recommendations based on real data"""
        recommendations = []
        
        try:
            # Diet recommendations
            if diet_data.get('avg_calories_per_day', 0) < 1500:
                recommendations.append("🍎 Increase daily calorie intake - you're below recommended levels")
            elif diet_data.get('avg_calories_per_day', 0) > 2500:
                recommendations.append("🥗 Consider reducing calorie intake for better health balance")
            
            if diet_data.get('total_meals', 0) < 20:
                recommendations.append("🍽️ Log more meals to get better nutrition insights")
                
            if diet_data.get('nutrition_score', 0) < 6:
                recommendations.append("🥬 Focus on improving nutrition quality - add more vegetables and lean proteins")
            
            # Fitness recommendations  
            if fitness_data.get('total_workouts', 0) < 5:
                recommendations.append("🏃‍♂️ Increase workout frequency - aim for at least 3-4 sessions per week")
            elif fitness_data.get('total_workouts', 0) > 20:
                recommendations.append("💪 Great job staying active! Consider adding recovery days")
                
            if fitness_data.get('avg_duration_minutes', 0) < 30:
                recommendations.append("⏱️ Try extending workout duration to 30-45 minutes for better results")
            
            # Mental health recommendations
            if mental_health_data.get('mood_average', 0) < 6:
                recommendations.append("😌 Consider stress management techniques - your mood scores suggest need for support")
            elif mental_health_data.get('mood_average', 0) > 8:
                recommendations.append("🌟 Excellent mental wellness! Keep up your positive habits")
                
            if mental_health_data.get('meditation_sessions_count', 0) < 5:
                recommendations.append("🧘‍♀️ Try incorporating meditation or mindfulness practices")
            
            # Overall recommendations
            if len(recommendations) < 3:
                recommendations.extend([
                    "📊 Keep tracking your health data for better insights",
                    "🎯 Set specific weekly health goals",
                    "💤 Maintain consistent sleep schedule for optimal recovery"
                ])
            
            return recommendations[:6]  # Return max 6 recommendations
            
        except Exception as e:
            logger.error(f"❌ Error generating recommendations: {e}")
            return [
                "📊 Continue tracking your health data",
                "🏃‍♂️ Stay active with regular exercise", 
                "🥗 Focus on balanced nutrition",
                "😌 Practice stress management"
            ]
    
    def _generate_demo_report(self, email: str) -> Dict[str, Any]:
        """Fallback demo report when user not found"""
        return {
            "report_id": f"demo_report_{email.replace('@', '_')}_{int(datetime.now().timestamp())}",
            "user_email": email,
            "generated_at": datetime.now().isoformat(),
            "data_source": "DEMO_DATA_USER_NOT_FOUND",
            "report_content": {
                "diet_data": {
                    "total_meals": 0,
                    "avg_calories": 0,
                    "nutrition_score": 0,
                    "note": "No nutrition data found for this user"
                },
                "fitness_data": {
                    "total_workouts": 0,
                    "avg_duration": "No data",
                    "fitness_score": 0,
                    "note": "No fitness data found for this user"
                },
                "mental_health_data": {
                    "mood_average": 0,
                    "stress_level": "Unknown",
                    "wellness_score": 0,
                    "note": "No mental health data found for this user"
                }
            },
            "recommendations": [
                f"👋 Welcome {email}! Start by creating your user profile",
                "📝 Begin logging your meals and nutrition",
                "🏃‍♂️ Add your fitness activities and workouts",
                "😌 Track your mood and mental wellness",
                "📊 Your personalized insights will appear as you add data"
            ]
        }