"""
Nutrition Service for Diet Agent Backend
Handles meal plan generation, nutrition analysis, and external API integrations.
"""
import logging
import requests
import json
import os
import random
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any

from models import (
    UserProfile, 
    MealPlan, 
    NutritionInfo, 
    MealEntry, 
    HydrationEntry,
    UserGoals,
    DailyNutrition,
    MealTypeEnum
)

logger = logging.getLogger(__name__)

# Mock food database - in production this would be in MongoDB or call to external API
FOOD_DATABASE = {
    "weight_loss": {
        "breakfast": [
            {
                "name": "Greek yogurt with berries and nuts",
                "ingredients": ["Greek yogurt", "mixed berries", "almonds", "honey"],
                "nutrition": {
                    "calories": 300,
                    "protein": 20,
                    "carbs": 25,
                    "fat": 12,
                    "fiber": 5
                }
            },
            {
                "name": "Vegetable egg white omelet",
                "ingredients": ["egg whites", "spinach", "bell peppers", "onions", "tomatoes"],
                "nutrition": {
                    "calories": 250,
                    "protein": 22,
                    "carbs": 15,
                    "fat": 10,
                    "fiber": 4
                }
            },
            {
                "name": "Overnight oats with chia seeds",
                "ingredients": ["rolled oats", "almond milk", "chia seeds", "banana", "cinnamon"],
                "nutrition": {
                    "calories": 320,
                    "protein": 12,
                    "carbs": 45,
                    "fat": 8,
                    "fiber": 8
                }
            }
        ],
        "lunch": [
            {
                "name": "Grilled chicken salad",
                "ingredients": ["chicken breast", "mixed greens", "cherry tomatoes", "cucumber", "olive oil", "lemon juice"],
                "nutrition": {
                    "calories": 350,
                    "protein": 30,
                    "carbs": 15,
                    "fat": 18,
                    "fiber": 6
                }
            },
            {
                "name": "Lentil soup with vegetables",
                "ingredients": ["lentils", "carrots", "celery", "onion", "garlic", "vegetable broth"],
                "nutrition": {
                    "calories": 280,
                    "protein": 18,
                    "carbs": 40,
                    "fat": 3,
                    "fiber": 12
                }
            },
            {
                "name": "Tuna salad lettuce wraps",
                "ingredients": ["tuna", "Greek yogurt", "dijon mustard", "celery", "lettuce leaves"],
                "nutrition": {
                    "calories": 310,
                    "protein": 35,
                    "carbs": 8,
                    "fat": 15,
                    "fiber": 3
                }
            }
        ],
        "dinner": [
            {
                "name": "Baked salmon with roasted vegetables",
                "ingredients": ["salmon fillet", "broccoli", "bell peppers", "zucchini", "olive oil", "lemon"],
                "nutrition": {
                    "calories": 380,
                    "protein": 28,
                    "carbs": 20,
                    "fat": 22,
                    "fiber": 7
                }
            },
            {
                "name": "Turkey chili",
                "ingredients": ["ground turkey", "beans", "tomatoes", "onion", "bell peppers", "spices"],
                "nutrition": {
                    "calories": 340,
                    "protein": 32,
                    "carbs": 30,
                    "fat": 10,
                    "fiber": 10
                }
            },
            {
                "name": "Stir-fried tofu with vegetables",
                "ingredients": ["tofu", "broccoli", "carrots", "snap peas", "mushrooms", "soy sauce"],
                "nutrition": {
                    "calories": 300,
                    "protein": 20,
                    "carbs": 25,
                    "fat": 15,
                    "fiber": 8
                }
            }
        ],
        "snack": [
            {
                "name": "Apple with almond butter",
                "ingredients": ["apple", "almond butter"],
                "nutrition": {
                    "calories": 180,
                    "protein": 5,
                    "carbs": 20,
                    "fat": 10,
                    "fiber": 4
                }
            },
            {
                "name": "Vegetable sticks with hummus",
                "ingredients": ["carrots", "celery", "cucumber", "hummus"],
                "nutrition": {
                    "calories": 150,
                    "protein": 6,
                    "carbs": 15,
                    "fat": 8,
                    "fiber": 6
                }
            },
            {
                "name": "Hard-boiled eggs",
                "ingredients": ["eggs"],
                "nutrition": {
                    "calories": 140,
                    "protein": 12,
                    "carbs": 1,
                    "fat": 10,
                    "fiber": 0
                }
            }
        ]
    },
    "muscle_gain": {
        "breakfast": [
            {
                "name": "Protein-packed oatmeal",
                "ingredients": ["oats", "protein powder", "banana", "peanut butter", "milk"],
                "nutrition": {
                    "calories": 550,
                    "protein": 35,
                    "carbs": 65,
                    "fat": 15,
                    "fiber": 8
                }
            },
            {
                "name": "Breakfast burrito",
                "ingredients": ["eggs", "black beans", "cheese", "whole wheat tortilla", "avocado"],
                "nutrition": {
                    "calories": 600,
                    "protein": 30,
                    "carbs": 50,
                    "fat": 30,
                    "fiber": 10
                }
            },
            {
                "name": "High-protein smoothie bowl",
                "ingredients": ["protein powder", "banana", "oats", "almond milk", "berries", "nuts"],
                "nutrition": {
                    "calories": 520,
                    "protein": 40,
                    "carbs": 55,
                    "fat": 18,
                    "fiber": 9
                }
            }
        ],
        "lunch": [
            {
                "name": "Chicken and quinoa bowl",
                "ingredients": ["chicken breast", "quinoa", "avocado", "black beans", "salsa"],
                "nutrition": {
                    "calories": 650,
                    "protein": 45,
                    "carbs": 60,
                    "fat": 25,
                    "fiber": 12
                }
            },
            {
                "name": "Lean beef and sweet potato",
                "ingredients": ["lean ground beef", "sweet potato", "broccoli", "olive oil"],
                "nutrition": {
                    "calories": 580,
                    "protein": 40,
                    "carbs": 45,
                    "fat": 25,
                    "fiber": 8
                }
            },
            {
                "name": "Tuna and pasta salad",
                "ingredients": ["tuna", "whole wheat pasta", "olive oil", "cherry tomatoes", "feta cheese"],
                "nutrition": {
                    "calories": 620,
                    "protein": 42,
                    "carbs": 65,
                    "fat": 22,
                    "fiber": 7
                }
            }
        ],
        "dinner": [
            {
                "name": "Salmon with brown rice and asparagus",
                "ingredients": ["salmon fillet", "brown rice", "asparagus", "olive oil", "lemon"],
                "nutrition": {
                    "calories": 580,
                    "protein": 40,
                    "carbs": 50,
                    "fat": 25,
                    "fiber": 6
                }
            },
            {
                "name": "Turkey meatballs with whole wheat pasta",
                "ingredients": ["ground turkey", "whole wheat pasta", "tomato sauce", "parmesan cheese"],
                "nutrition": {
                    "calories": 650,
                    "protein": 45,
                    "carbs": 70,
                    "fat": 18,
                    "fiber": 10
                }
            },
            {
                "name": "Steak with roasted potatoes",
                "ingredients": ["lean steak", "potatoes", "olive oil", "garlic", "herbs"],
                "nutrition": {
                    "calories": 700,
                    "protein": 50,
                    "carbs": 45,
                    "fat": 35,
                    "fiber": 5
                }
            }
        ],
        "snack": [
            {
                "name": "Protein shake with banana",
                "ingredients": ["protein powder", "banana", "milk", "peanut butter"],
                "nutrition": {
                    "calories": 350,
                    "protein": 30,
                    "carbs": 30,
                    "fat": 12,
                    "fiber": 3
                }
            },
            {
                "name": "Greek yogurt with honey and nuts",
                "ingredients": ["Greek yogurt", "honey", "almonds", "berries"],
                "nutrition": {
                    "calories": 300,
                    "protein": 20,
                    "carbs": 25,
                    "fat": 15,
                    "fiber": 3
                }
            },
            {
                "name": "Cottage cheese with pineapple",
                "ingredients": ["cottage cheese", "pineapple chunks"],
                "nutrition": {
                    "calories": 250,
                    "protein": 25,
                    "carbs": 20,
                    "fat": 8,
                    "fiber": 2
                }
            }
        ]
    },
    "keto": {
        "breakfast": [
            {
                "name": "Avocado and bacon omelette",
                "ingredients": ["eggs", "avocado", "bacon", "cheese"],
                "nutrition": {
                    "calories": 550,
                    "protein": 30,
                    "carbs": 6,
                    "fat": 45,
                    "fiber": 4
                }
            },
            {
                "name": "Keto chia pudding",
                "ingredients": ["chia seeds", "coconut milk", "berries", "nuts"],
                "nutrition": {
                    "calories": 420,
                    "protein": 12,
                    "carbs": 10,
                    "fat": 38,
                    "fiber": 8
                }
            },
            {
                "name": "Cream cheese pancakes",
                "ingredients": ["cream cheese", "eggs", "butter", "almond flour"],
                "nutrition": {
                    "calories": 490,
                    "protein": 20,
                    "carbs": 8,
                    "fat": 40,
                    "fiber": 2
                }
            }
        ],
        "lunch": [
            {
                "name": "Tuna salad in lettuce wraps",
                "ingredients": ["tuna", "mayonnaise", "celery", "lettuce leaves"],
                "nutrition": {
                    "calories": 380,
                    "protein": 35,
                    "carbs": 5,
                    "fat": 25,
                    "fiber": 2
                }
            },
            {
                "name": "Cauliflower rice bowl with chicken",
                "ingredients": ["cauliflower", "chicken thigh", "olive oil", "avocado", "cheese"],
                "nutrition": {
                    "calories": 450,
                    "protein": 30,
                    "carbs": 12,
                    "fat": 32,
                    "fiber": 6
                }
            },
            {
                "name": "Cobb salad",
                "ingredients": ["lettuce", "chicken", "bacon", "avocado", "egg", "blue cheese"],
                "nutrition": {
                    "calories": 520,
                    "protein": 35,
                    "carbs": 8,
                    "fat": 40,
                    "fiber": 5
                }
            }
        ],
        "dinner": [
            {
                "name": "Baked salmon with asparagus",
                "ingredients": ["salmon fillet", "asparagus", "butter", "lemon"],
                "nutrition": {
                    "calories": 480,
                    "protein": 35,
                    "carbs": 5,
                    "fat": 35,
                    "fiber": 3
                }
            },
            {
                "name": "Steak with buttered vegetables",
                "ingredients": ["steak", "broccoli", "butter", "mushrooms"],
                "nutrition": {
                    "calories": 550,
                    "protein": 40,
                    "carbs": 6,
                    "fat": 42,
                    "fiber": 3
                }
            },
            {
                "name": "Zucchini noodles with meatballs",
                "ingredients": ["zucchini", "ground beef", "parmesan", "olive oil"],
                "nutrition": {
                    "calories": 470,
                    "protein": 32,
                    "carbs": 8,
                    "fat": 35,
                    "fiber": 4
                }
            }
        ],
        "snack": [
            {
                "name": "Cheese and pepperoni",
                "ingredients": ["cheese", "pepperoni"],
                "nutrition": {
                    "calories": 320,
                    "protein": 15,
                    "carbs": 2,
                    "fat": 28,
                    "fiber": 0
                }
            },
            {
                "name": "Avocado with salt",
                "ingredients": ["avocado", "salt"],
                "nutrition": {
                    "calories": 240,
                    "protein": 3,
                    "carbs": 12,
                    "fat": 22,
                    "fiber": 10
                }
            },
            {
                "name": "Keto fat bombs",
                "ingredients": ["coconut oil", "butter", "cream cheese", "stevia"],
                "nutrition": {
                    "calories": 250,
                    "protein": 2,
                    "carbs": 1,
                    "fat": 26,
                    "fiber": 0
                }
            }
        ]
    },
    "vegan": {
        "breakfast": [
            {
                "name": "Tofu scramble with vegetables",
                "ingredients": ["tofu", "spinach", "mushrooms", "nutritional yeast", "turmeric"],
                "nutrition": {
                    "calories": 280,
                    "protein": 20,
                    "carbs": 15,
                    "fat": 16,
                    "fiber": 7
                }
            },
            {
                "name": "Overnight oats with chia and fruit",
                "ingredients": ["rolled oats", "almond milk", "chia seeds", "banana", "berries"],
                "nutrition": {
                    "calories": 320,
                    "protein": 12,
                    "carbs": 45,
                    "fat": 10,
                    "fiber": 12
                }
            },
            {
                "name": "Avocado toast with hemp seeds",
                "ingredients": ["whole grain bread", "avocado", "hemp seeds", "tomato", "lemon juice"],
                "nutrition": {
                    "calories": 350,
                    "protein": 10,
                    "carbs": 30,
                    "fat": 22,
                    "fiber": 8
                }
            }
        ],
        "lunch": [
            {
                "name": "Chickpea salad sandwich",
                "ingredients": ["chickpeas", "vegan mayo", "mustard", "celery", "whole grain bread"],
                "nutrition": {
                    "calories": 380,
                    "protein": 15,
                    "carbs": 50,
                    "fat": 14,
                    "fiber": 10
                }
            },
            {
                "name": "Quinoa vegetable bowl",
                "ingredients": ["quinoa", "roasted vegetables", "avocado", "tahini dressing"],
                "nutrition": {
                    "calories": 420,
                    "protein": 12,
                    "carbs": 55,
                    "fat": 18,
                    "fiber": 12
                }
            },
            {
                "name": "Lentil vegetable soup",
                "ingredients": ["lentils", "carrots", "celery", "onion", "tomatoes", "spinach"],
                "nutrition": {
                    "calories": 310,
                    "protein": 16,
                    "carbs": 45,
                    "fat": 8,
                    "fiber": 15
                }
            }
        ],
        "dinner": [
            {
                "name": "Stir-fried tempeh with vegetables",
                "ingredients": ["tempeh", "broccoli", "bell peppers", "carrots", "soy sauce", "ginger"],
                "nutrition": {
                    "calories": 350,
                    "protein": 22,
                    "carbs": 30,
                    "fat": 15,
                    "fiber": 8
                }
            },
            {
                "name": "Black bean and sweet potato tacos",
                "ingredients": ["black beans", "sweet potato", "corn tortillas", "avocado", "salsa"],
                "nutrition": {
                    "calories": 400,
                    "protein": 14,
                    "carbs": 60,
                    "fat": 12,
                    "fiber": 14
                }
            },
            {
                "name": "Mushroom and lentil bolognese",
                "ingredients": ["mushrooms", "lentils", "tomato sauce", "whole wheat pasta", "nutritional yeast"],
                "nutrition": {
                    "calories": 380,
                    "protein": 18,
                    "carbs": 55,
                    "fat": 10,
                    "fiber": 12
                }
            }
        ],
        "snack": [
            {
                "name": "Hummus with vegetable sticks",
                "ingredients": ["hummus", "carrots", "celery", "cucumber"],
                "nutrition": {
                    "calories": 180,
                    "protein": 7,
                    "carbs": 18,
                    "fat": 10,
                    "fiber": 6
                }
            },
            {
                "name": "Trail mix with nuts and dried fruit",
                "ingredients": ["almonds", "walnuts", "dried cranberries", "pumpkin seeds"],
                "nutrition": {
                    "calories": 250,
                    "protein": 8,
                    "carbs": 20,
                    "fat": 18,
                    "fiber": 5
                }
            },
            {
                "name": "Apple with almond butter",
                "ingredients": ["apple", "almond butter"],
                "nutrition": {
                    "calories": 200,
                    "protein": 6,
                    "carbs": 25,
                    "fat": 12,
                    "fiber": 5
                }
            }
        ]
    }
}

class NutritionService:
    """Service for generating meal plans and analyzing nutrition"""
    
    def __init__(self, db=None):
        self.db = db
        
    async def generate_meal_plan(self, user_profile: UserProfile, date: str) -> MealPlan:
        """Generate a personalized meal plan based on user profile and preferences"""
        
        # Get the diet type based on user goals
        diet_type = self._get_diet_type(user_profile)
        
        # Calculate daily calorie and macro requirements
        calorie_requirement, macro_targets = self._calculate_nutrition_requirements(user_profile)
        
        # Select appropriate meals from the database
        breakfast = random.choice(FOOD_DATABASE[diet_type]["breakfast"])
        lunch = random.choice(FOOD_DATABASE[diet_type]["lunch"])
        dinner = random.choice(FOOD_DATABASE[diet_type]["dinner"])
        snack = random.choice(FOOD_DATABASE[diet_type]["snack"])
        
        # Calculate total nutrition
        total_calories = (breakfast["nutrition"]["calories"] + 
                         lunch["nutrition"]["calories"] + 
                         dinner["nutrition"]["calories"] + 
                         snack["nutrition"]["calories"])
        
        total_protein = (breakfast["nutrition"]["protein"] + 
                         lunch["nutrition"]["protein"] + 
                         dinner["nutrition"]["protein"] + 
                         snack["nutrition"]["protein"])
        
        total_carbs = (breakfast["nutrition"]["carbs"] + 
                       lunch["nutrition"]["carbs"] + 
                       dinner["nutrition"]["carbs"] + 
                       snack["nutrition"]["carbs"])
        
        total_fat = (breakfast["nutrition"]["fat"] + 
                     lunch["nutrition"]["fat"] + 
                     dinner["nutrition"]["fat"] + 
                     snack["nutrition"]["fat"])
        
        # Create meal plan object
        meal_plan = MealPlan(
            plan_id=None,  # Will be set when saved to database
            user_id=user_profile.user_id,
            date=date,
            breakfast_plan=breakfast,
            lunch_plan=lunch,
            dinner_plan=dinner,
            snack_plans=[snack],
            total_planned_calories=total_calories,
            total_planned_protein=total_protein,
            total_planned_carbs=total_carbs,
            total_planned_fat=total_fat,
            created_at=datetime.now()
        )
        
        return meal_plan
    
    def _get_diet_type(self, user_profile: UserProfile) -> str:
        """Determine diet type based on user profile and preferences"""
        
        # Check for specific dietary restrictions
        dietary_restrictions = [r.lower() for r in (user_profile.dietary_restrictions or [])]
        
        if "vegan" in dietary_restrictions:
            return "vegan"
        if "keto" in dietary_restrictions:
            return "keto"
        
        # If no specific diet type, use goal-based diet
        if user_profile.goal == "lose_weight":
            return "weight_loss"
        elif user_profile.goal == "gain_weight":
            return "muscle_gain"
        else:  # maintain
            # Default to balanced approach
            return "weight_loss" if random.choice([True, False]) else "muscle_gain"
    
    def _calculate_nutrition_requirements(self, user_profile: UserProfile) -> tuple:
        """Calculate daily calorie and macro requirements"""
        
        # Basic BMR calculation using Harris-Benedict equation
        if user_profile.gender == "male":
            bmr = 88.362 + (13.397 * user_profile.weight_kg) + (4.799 * user_profile.height_cm) - (5.677 * user_profile.age)
        else:
            bmr = 447.593 + (9.247 * user_profile.weight_kg) + (3.098 * user_profile.height_cm) - (4.330 * user_profile.age)
        
        # Activity factor
        activity_factors = {
            "sedentary": 1.2,
            "light": 1.375,
            "moderate": 1.55,
            "active": 1.725,
            "very_active": 1.9
        }
        
        tdee = bmr * activity_factors[user_profile.activity_level]
        
        # Adjust based on goal
        if user_profile.goal == "lose_weight":
            calorie_target = tdee - 500  # 500 calorie deficit
        elif user_profile.goal == "gain_weight":
            calorie_target = tdee + 500  # 500 calorie surplus
        else:  # maintain
            calorie_target = tdee
        
        # Calculate macro targets
        if user_profile.goal == "lose_weight":
            # Higher protein, moderate fat, lower carb
            protein_target = user_profile.weight_kg * 2.2  # 2.2g per kg
            fat_target = (calorie_target * 0.3) / 9  # 30% of calories from fat
            carb_target = (calorie_target - (protein_target * 4) - (fat_target * 9)) / 4
        elif user_profile.goal == "gain_weight":
            # Higher protein, higher carb, moderate fat
            protein_target = user_profile.weight_kg * 2.0  # 2g per kg
            fat_target = (calorie_target * 0.25) / 9  # 25% of calories from fat
            carb_target = (calorie_target - (protein_target * 4) - (fat_target * 9)) / 4
        else:  # maintain
            # Balanced approach
            protein_target = user_profile.weight_kg * 1.8  # 1.8g per kg
            fat_target = (calorie_target * 0.3) / 9  # 30% of calories from fat
            carb_target = (calorie_target - (protein_target * 4) - (fat_target * 9)) / 4
        
        return calorie_target, {
            "protein": protein_target,
            "fat": fat_target,
            "carbs": carb_target
        }
    
    async def record_meal(self, meal_entry: MealEntry) -> MealEntry:
        """Record a meal in the user's food diary"""
        # In a real implementation, this would save to database
        return meal_entry
    
    async def record_hydration(self, hydration_entry: HydrationEntry) -> HydrationEntry:
        """Record water intake"""
        # In a real implementation, this would save to database
        return hydration_entry
    
    async def get_daily_summary(self, user_id: str, date: str) -> DailyNutrition:
        """Get summary of nutrition for the day"""
        # In a real implementation, this would query database
        # For now, we'll create mock data
        
        daily_nutrition = DailyNutrition(
            user_id=user_id,
            date=date,
            total_calories=1800,
            total_protein=90,
            total_carbs=200,
            total_fat=65,
            total_fiber=25,
            total_water_ml=1500,
            meal_count=3,
            goals_met={
                "calories": True,
                "protein": True,
                "water": False
            },
            created_at=datetime.now()
        )
        
        return daily_nutrition
    
    async def get_nutrition_insights(self, user_id: str, start_date: str, end_date: str) -> Dict:
        """Get nutrition insights over a period of time"""
        # In a real implementation, this would analyze data from database
        # For now, we'll create mock insights
        
        return {
            "average_calories": 1950,
            "average_protein": 95,
            "average_carbs": 210,
            "average_fat": 70,
            "average_water": 1800,
            "goal_completion_rate": 0.8,
            "recommendations": [
                "Try to increase your water intake to reach your hydration goal",
                "Your protein intake has been consistently good",
                "Consider adding more fiber-rich foods to your diet"
            ]
        }

    async def import_from_myfitnesspal(self, username: str, password: str, user_id: str) -> Dict:
        """Import data from MyFitnessPal (mock integration)"""
        # In a real implementation, this would use MyFitnessPal API
        # For now, we'll mock a successful import
        
        return {
            "success": True,
            "message": "Successfully imported data from MyFitnessPal",
            "imported_days": 7,
            "imported_meals": 21
        }
    
    async def get_hydration_reminder(self, user_id: str) -> Dict:
        """Generate hydration reminder based on user's tracked intake"""
        # In a real implementation, this would use actual tracked data
        # For now, we'll mock a reminder
        
        current_time = datetime.now()
        water_consumed = 750  # ml
        daily_target = 2500  # ml
        remaining = daily_target - water_consumed
        
        return {
            "reminder_text": f"Time to hydrate! You've had {water_consumed}ml of water today.",
            "water_consumed": water_consumed,
            "daily_target": daily_target,
            "remaining": remaining,
            "percent_complete": (water_consumed / daily_target) * 100,
            "next_target": "Drink 250ml in the next hour",
            "timestamp": current_time.isoformat()
        }

# Create a singleton instance of the service
nutrition_service = NutritionService()
