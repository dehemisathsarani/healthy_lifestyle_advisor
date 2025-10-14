"""
Workout Recommendation Service
Generates personalized workout plans based on calorie intake
"""

import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)


class WorkoutRecommendationService:
    """Generates workout recommendations based on meal calories"""
    
    def __init__(self):
        """Initialize workout recommendation service"""
        self.workout_database = self._init_workout_database()
    
    def _init_workout_database(self) -> Dict[str, List[Dict[str, Any]]]:
        """Initialize workout database with various exercises"""
        return {
            'high_intensity': [
                {
                    'name': 'HIIT Cardio Blast',
                    'duration': 45,
                    'calories_per_min': 12,
                    'exercises': ['Burpees', 'Mountain Climbers', 'Jump Squats', 'High Knees'],
                    'intensity': 'high',
                    'description': '45-minute high-intensity interval training'
                },
                {
                    'name': 'Running Session',
                    'duration': 40,
                    'calories_per_min': 10,
                    'exercises': ['Jogging', 'Sprints', 'Hill Runs'],
                    'intensity': 'high',
                    'description': '40-minute running workout'
                },
                {
                    'name': 'CrossFit Circuit',
                    'duration': 50,
                    'calories_per_min': 13,
                    'exercises': ['Box Jumps', 'Kettlebell Swings', 'Rope Climbs', 'Wall Balls'],
                    'intensity': 'high',
                    'description': '50-minute CrossFit circuit'
                }
            ],
            'moderate': [
                {
                    'name': 'Brisk Walking',
                    'duration': 30,
                    'calories_per_min': 5,
                    'exercises': ['Power Walking', 'Light Jogging'],
                    'intensity': 'moderate',
                    'description': '30-minute brisk walk'
                },
                {
                    'name': 'Cycling Session',
                    'duration': 35,
                    'calories_per_min': 7,
                    'exercises': ['Steady Cycling', 'Hill Climbs'],
                    'intensity': 'moderate',
                    'description': '35-minute cycling workout'
                },
                {
                    'name': 'Swimming Laps',
                    'duration': 30,
                    'calories_per_min': 8,
                    'exercises': ['Freestyle', 'Backstroke', 'Breaststroke'],
                    'intensity': 'moderate',
                    'description': '30-minute swimming session'
                }
            ],
            'light': [
                {
                    'name': 'Yoga Flow',
                    'duration': 30,
                    'calories_per_min': 3,
                    'exercises': ['Sun Salutations', 'Warrior Poses', 'Balance Poses'],
                    'intensity': 'light',
                    'description': '30-minute yoga session'
                },
                {
                    'name': 'Stretching Routine',
                    'duration': 20,
                    'calories_per_min': 2,
                    'exercises': ['Full Body Stretches', 'Flexibility Work'],
                    'intensity': 'light',
                    'description': '20-minute stretching routine'
                },
                {
                    'name': 'Gentle Walk',
                    'duration': 25,
                    'calories_per_min': 3.5,
                    'exercises': ['Leisurely Walking'],
                    'intensity': 'light',
                    'description': '25-minute gentle walk'
                }
            ]
        }
    
    def recommend_workout(
        self, 
        remaining_calories: int, 
        user_fitness_level: str = 'moderate',
        meal_time: str = 'any'
    ) -> Dict[str, Any]:
        """
        Recommend workout based on remaining calories to burn
        
        Args:
            remaining_calories: Calories user needs to burn
            user_fitness_level: User's fitness level (beginner, moderate, advanced)
            meal_time: Time of meal (breakfast, lunch, dinner, snack)
            
        Returns:
            Recommended workout plan with details
        """
        try:
            # Determine workout intensity based on calories
            if remaining_calories > 500:
                intensity = 'high_intensity'
                category_name = 'High-Intensity'
            elif remaining_calories > 300:
                intensity = 'moderate'
                category_name = 'Moderate'
            elif remaining_calories > 0:
                intensity = 'light'
                category_name = 'Light'
            else:
                # Goal met, suggest maintenance workout
                intensity = 'light'
                category_name = 'Maintenance'
            
            # Get workout from database
            workouts = self.workout_database.get(intensity, [])
            
            if not workouts:
                # Fallback workout
                return {
                    'name': 'General Cardio',
                    'duration': max(20, min(60, remaining_calories // 10)),
                    'estimated_burn': remaining_calories,
                    'category': category_name,
                    'exercises': ['Mixed Cardio Exercises'],
                    'intensity': intensity.replace('_', ' ').title(),
                    'description': f'Burn approximately {remaining_calories} calories'
                }
            
            # Select appropriate workout
            import random
            workout = random.choice(workouts)
            
            # Calculate estimated burn
            estimated_burn = workout['duration'] * workout['calories_per_min']
            
            # Adjust duration if needed to match remaining calories
            if remaining_calories > 0:
                adjusted_duration = min(60, max(15, remaining_calories // workout['calories_per_min']))
                adjusted_burn = adjusted_duration * workout['calories_per_min']
            else:
                adjusted_duration = workout['duration']
                adjusted_burn = estimated_burn
            
            recommendation = {
                'name': workout['name'],
                'duration': adjusted_duration,
                'estimated_burn': adjusted_burn,
                'target_burn': remaining_calories,
                'category': category_name,
                'exercises': workout['exercises'],
                'intensity': workout['intensity'],
                'description': workout['description'],
                'tips': self._get_workout_tips(intensity, meal_time)
            }
            
            logger.info(f"💡 Generated workout recommendation:")
            logger.info(f"   Name: {recommendation['name']}")
            logger.info(f"   Duration: {recommendation['duration']} minutes")
            logger.info(f"   Estimated burn: {recommendation['estimated_burn']} kcal")
            
            return recommendation
            
        except Exception as e:
            logger.error(f"❌ Failed to generate workout recommendation: {e}")
            return {
                'name': 'Basic Cardio',
                'duration': 30,
                'estimated_burn': remaining_calories,
                'category': 'General',
                'exercises': ['Walking', 'Light Jogging'],
                'intensity': 'moderate',
                'description': 'Basic cardio workout'
            }
    
    def _get_workout_tips(self, intensity: str, meal_time: str) -> List[str]:
        """Get workout tips based on intensity and meal time"""
        tips = []
        
        # Intensity-based tips
        if intensity == 'high_intensity':
            tips.append("💪 Warm up for 5-10 minutes before starting")
            tips.append("💧 Stay hydrated throughout the workout")
            tips.append("⚡ Take 1-minute breaks between sets")
        elif intensity == 'moderate':
            tips.append("🚶 Start with a gentle warm-up")
            tips.append("💧 Drink water every 10-15 minutes")
        else:
            tips.append("🧘 Focus on breathing and form")
            tips.append("💆 This is great for recovery days")
        
        # Meal time-based tips
        if meal_time == 'breakfast':
            tips.append("☀️ Best to wait 30-60 minutes after eating")
        elif meal_time in ['lunch', 'dinner']:
            tips.append("🕐 Wait 1-2 hours after a large meal")
        
        return tips
    
    def get_nutrition_recommendation(
        self, 
        calories_burnt: int,
        workout_intensity: str,
        time_of_day: str = 'any'
    ) -> str:
        """
        Get nutrition recommendation after workout
        
        Args:
            calories_burnt: Calories burned in workout
            workout_intensity: Intensity level
            time_of_day: Time when workout was completed
            
        Returns:
            Nutrition recommendation string
        """
        try:
            recommendations = []
            
            # Protein recommendation
            if workout_intensity in ['high', 'high_intensity']:
                protein_grams = int(calories_burnt * 0.4 / 4)  # 40% from protein
                recommendations.append(
                    f"💪 Consume {protein_grams}g protein for muscle recovery"
                )
            
            # Hydration
            water_ml = int(calories_burnt * 1.5)
            recommendations.append(
                f"💧 Drink at least {water_ml}ml of water"
            )
            
            # Meal timing
            if time_of_day == 'morning':
                recommendations.append(
                    "🍳 Consider a protein-rich breakfast within 30 minutes"
                )
            elif time_of_day == 'afternoon':
                recommendations.append(
                    "🥗 Have a balanced lunch with protein and carbs"
                )
            elif time_of_day == 'evening':
                recommendations.append(
                    "🍽️ Eat a light dinner with lean protein"
                )
            
            # Carbs for energy replenishment
            if calories_burnt > 400:
                carb_grams = int(calories_burnt * 0.5 / 4)  # 50% from carbs
                recommendations.append(
                    f"🍚 Include {carb_grams}g of complex carbs for energy"
                )
            
            return " | ".join(recommendations)
            
        except Exception as e:
            logger.error(f"❌ Failed to generate nutrition recommendation: {e}")
            return "Stay hydrated and eat a balanced meal"


# Global workout recommendation service instance
workout_recommendation_service = WorkoutRecommendationService()
