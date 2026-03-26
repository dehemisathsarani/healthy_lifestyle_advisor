import httpx
import json
from typing import Dict, List, Optional, Tuple
from pydantic import BaseModel
from settings import settings
import logging

logger = logging.getLogger(__name__)

class NutritionInfo(BaseModel):
    calories: float
    protein: float  # grams
    carbs: float    # grams
    fat: float      # grams
    fiber: Optional[float] = None
    sugar: Optional[float] = None
    sodium: Optional[float] = None
    vitamins: Optional[Dict[str, float]] = {}
    minerals: Optional[Dict[str, float]] = {}

class BMICalculator:
    @staticmethod
    def calculate_bmi(weight_kg: float, height_cm: float) -> float:
        """Calculate BMI from weight and height."""
        height_m = height_cm / 100
        return weight_kg / (height_m ** 2)
    
    @staticmethod
    def get_bmi_category(bmi: float) -> str:
        """Get BMI category based on BMI value."""
        if bmi < 18.5:
            return "Underweight"
        elif 18.5 <= bmi < 25:
            return "Normal weight"
        elif 25 <= bmi < 30:
            return "Overweight"
        else:
            return "Obese"

class TDEECalculator:
    @staticmethod
    def calculate_bmr(weight_kg: float, height_cm: float, age: int, gender: str) -> float:
        """Calculate Basal Metabolic Rate using Mifflin-St Jeor Equation."""
        if gender.lower() == 'male':
            return 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
        else:
            return 10 * weight_kg + 6.25 * height_cm - 5 * age - 161
    
    @staticmethod
    def calculate_tdee(bmr: float, activity_level: str) -> float:
        """Calculate Total Daily Energy Expenditure."""
        activity_multipliers = {
            'sedentary': 1.2,      # Little or no exercise
            'light': 1.375,        # Light exercise 1-3 days/week
            'moderate': 1.55,      # Moderate exercise 3-5 days/week
            'active': 1.725,       # Hard exercise 6-7 days/week
            'very_active': 1.9     # Very hard exercise, physical job
        }
        return bmr * activity_multipliers.get(activity_level.lower(), 1.2)

class NutritionAnalyzer:
    def __init__(self):
        self.client = httpx.AsyncClient()
        
    async def analyze_food_text(self, food_text: str) -> NutritionInfo:
        """Analyze nutrition from text description of food."""
        try:
            # Use Edamam Nutrition Analysis API
            url = f"{settings.NUTRITION_API_URL}"
            params = {
                'app_id': 'your_app_id',  # Replace with actual credentials
                'app_key': settings.NUTRITION_API_KEY,
                'ingr': food_text
            }
            
            response = await self.client.get(url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                return self._parse_nutrition_data(data)
            else:
                # Fallback to estimation
                return self._estimate_nutrition(food_text)
                
        except Exception as e:
            logger.error(f"Error analyzing nutrition: {e}")
            return self._estimate_nutrition(food_text)
    
    def _parse_nutrition_data(self, data: Dict) -> NutritionInfo:
        """Parse nutrition data from API response."""
        nutrients = data.get('totalNutrients', {})
        
        return NutritionInfo(
            calories=nutrients.get('ENERC_KCAL', {}).get('quantity', 0),
            protein=nutrients.get('PROCNT', {}).get('quantity', 0),
            carbs=nutrients.get('CHOCDF', {}).get('quantity', 0),
            fat=nutrients.get('FAT', {}).get('quantity', 0),
            fiber=nutrients.get('FIBTG', {}).get('quantity', 0),
            sugar=nutrients.get('SUGAR', {}).get('quantity', 0),
            sodium=nutrients.get('NA', {}).get('quantity', 0),
            vitamins={
                'vitamin_c': nutrients.get('VITC', {}).get('quantity', 0),
                'vitamin_d': nutrients.get('VITD', {}).get('quantity', 0),
                'vitamin_b12': nutrients.get('VITB12', {}).get('quantity', 0),
            },
            minerals={
                'calcium': nutrients.get('CA', {}).get('quantity', 0),
                'iron': nutrients.get('FE', {}).get('quantity', 0),
                'potassium': nutrients.get('K', {}).get('quantity', 0),
            }
        )
    
    def _estimate_nutrition(self, food_text: str) -> NutritionInfo:
        """Fallback nutrition estimation based on common foods."""
        # Basic estimation logic - you can enhance this with ML models
        common_foods = {
            'apple': {'calories': 95, 'protein': 0.5, 'carbs': 25, 'fat': 0.3},
            'banana': {'calories': 105, 'protein': 1.3, 'carbs': 27, 'fat': 0.4},
            'chicken breast': {'calories': 165, 'protein': 31, 'carbs': 0, 'fat': 3.6},
            'rice': {'calories': 130, 'protein': 2.7, 'carbs': 28, 'fat': 0.3},
            'bread': {'calories': 265, 'protein': 9, 'carbs': 49, 'fat': 3.2},
        }
        
        food_lower = food_text.lower()
        for food, nutrition in common_foods.items():
            if food in food_lower:
                return NutritionInfo(**nutrition)
        
        # Default estimation
        return NutritionInfo(calories=200, protein=5, carbs=30, fat=8)

class MacroTracker:
    def __init__(self):
        self.daily_goals = {
            'calories': 2000,
            'protein': 150,  # grams
            'carbs': 250,    # grams
            'fat': 67        # grams
        }
    
    def set_goals(self, calories: float, protein: float, carbs: float, fat: float):
        """Set daily macro goals."""
        self.daily_goals = {
            'calories': calories,
            'protein': protein,
            'carbs': carbs,
            'fat': fat
        }
    
    def calculate_progress(self, consumed: List[NutritionInfo]) -> Dict[str, Dict[str, float]]:
        """Calculate progress towards daily goals."""
        total_calories = sum(food.calories for food in consumed)
        total_protein = sum(food.protein for food in consumed)
        total_carbs = sum(food.carbs for food in consumed)
        total_fat = sum(food.fat for food in consumed)
        
        return {
            'calories': {
                'consumed': total_calories,
                'goal': self.daily_goals['calories'],
                'percentage': (total_calories / self.daily_goals['calories']) * 100
            },
            'protein': {
                'consumed': total_protein,
                'goal': self.daily_goals['protein'],
                'percentage': (total_protein / self.daily_goals['protein']) * 100
            },
            'carbs': {
                'consumed': total_carbs,
                'goal': self.daily_goals['carbs'],
                'percentage': (total_carbs / self.daily_goals['carbs']) * 100
            },
            'fat': {
                'consumed': total_fat,
                'goal': self.daily_goals['fat'],
                'percentage': (total_fat / self.daily_goals['fat']) * 100
            }
        }
    
    def get_recommendations(self, progress: Dict) -> List[str]:
        """Generate recommendations based on current progress."""
        recommendations = []
        
        if progress['calories']['percentage'] > 100:
            recommendations.append("⚠️ You've exceeded your daily calorie goal. Consider lighter meals.")
        elif progress['calories']['percentage'] < 80:
            recommendations.append("💡 You're under your calorie goal. Make sure you're eating enough!")
        
        if progress['protein']['percentage'] < 80:
            recommendations.append("🥩 Consider adding more protein-rich foods like chicken, fish, or legumes.")
        
        if progress['carbs']['percentage'] > 120:
            recommendations.append("🍞 You've had quite a bit of carbs today. Try adding more vegetables.")
        
        if progress['fat']['percentage'] < 70:
            recommendations.append("🥑 Add some healthy fats like avocado, nuts, or olive oil.")
        
        return recommendations

class HydrationTracker:
    def __init__(self):
        self.daily_goal = 2000  # ml
        self.current_intake = 0
    
    def add_water(self, amount_ml: int):
        """Add water intake."""
        self.current_intake += amount_ml
    
    def get_hydration_status(self) -> Dict[str, any]:
        """Get current hydration status."""
        percentage = (self.current_intake / self.daily_goal) * 100
        
        if percentage < 50:
            status = "Low - Drink more water! 💧"
        elif percentage < 80:
            status = "Moderate - You're doing well, keep it up! 💦"
        elif percentage <= 100:
            status = "Good - Perfect hydration! ✨"
        else:
            status = "Excellent - Well hydrated! 🌟"
        
        return {
            'current_ml': self.current_intake,
            'goal_ml': self.daily_goal,
            'percentage': percentage,
            'status': status,
            'remaining_ml': max(0, self.daily_goal - self.current_intake)
        }
    
    def reset_daily(self):
        """Reset daily intake counter."""
        self.current_intake = 0