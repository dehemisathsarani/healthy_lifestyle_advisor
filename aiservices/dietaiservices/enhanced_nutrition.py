"""
Enhanced Nutrition Analyzer with Comprehensive Food Database
Provides accurate, detailed nutrition information for food analysis
"""

import json
import logging
from typing import Dict, List, Optional, Tuple, Any
from pydantic import BaseModel
import re

# Define NutritionInfo locally if not available
class NutritionInfo(BaseModel):
    """Basic nutrition information"""
    calories: float
    protein_g: float
    carbohydrates_g: float
    fat_g: float

logger = logging.getLogger(__name__)

class DetailedNutritionInfo(BaseModel):
    """Enhanced nutrition information with more detailed breakdown"""
    calories: float
    protein: float  # grams
    carbs: float    # grams
    fat: float      # grams
    fiber: float = 0.0
    sugar: float = 0.0
    sodium: float = 0.0  # mg
    cholesterol: float = 0.0  # mg
    saturated_fat: float = 0.0  # grams
    trans_fat: float = 0.0  # grams
    vitamins: Dict[str, float] = {}
    minerals: Dict[str, float] = {}
    portion_size: str = "medium"
    food_category: str = "unknown"
    glycemic_index: Optional[int] = None
    health_score: float = 5.0  # 1-10 scale
    
class AccurateNutritionAnalyzer:
    """
    Accurate nutrition analyzer with comprehensive Sri Lankan and international food database
    """
    
    def __init__(self):
        self.food_database = self._load_comprehensive_food_database()
        self.portion_multipliers = {
            'small': 0.7,
            'medium': 1.0,
            'large': 1.4,
            'extra_large': 1.8,
            '1 cup': 1.0,
            '1/2 cup': 0.5,
            '1 tablespoon': 0.06,
            '1 teaspoon': 0.02,
            '100g': 1.0,
            '1 serving': 1.0
        }
        
    def _load_comprehensive_food_database(self) -> Dict[str, Dict[str, Any]]:
        """Load comprehensive food database with accurate nutrition data"""
        return {
            # Sri Lankan Staples
            'rice': {
                'nutrition': {
                    'calories': 130, 'protein': 2.7, 'carbs': 28.0, 'fat': 0.3,
                    'fiber': 0.4, 'sugar': 0.1, 'sodium': 5, 'cholesterol': 0,
                    'saturated_fat': 0.1, 'trans_fat': 0.0,
                    'vitamins': {'thiamine_b1': 0.07, 'niacin_b3': 1.6, 'folate': 8},
                    'minerals': {'iron': 0.8, 'magnesium': 25, 'phosphorus': 68}
                },
                'category': 'grains',
                'health_score': 6.5,
                'glycemic_index': 73,
                'aliases': ['rice', 'bath', 'steamed rice', 'white rice', 'basmati rice']
            },
            
            'chicken_curry': {
                'nutrition': {
                    'calories': 215, 'protein': 22.0, 'carbs': 8.0, 'fat': 11.0,
                    'fiber': 2.0, 'sugar': 4.0, 'sodium': 450, 'cholesterol': 65,
                    'saturated_fat': 3.2, 'trans_fat': 0.0,
                    'vitamins': {'vitamin_b6': 0.5, 'vitamin_b12': 0.3, 'niacin_b3': 8.5},
                    'minerals': {'iron': 1.5, 'zinc': 1.8, 'phosphorus': 180}
                },
                'category': 'curry',
                'health_score': 7.0,
                'glycemic_index': 45,
                'aliases': ['chicken curry', 'chicken kari', 'chicken gravy', 'kukul mas curry']
            },
            
            'fish_curry': {
                'nutrition': {
                    'calories': 180, 'protein': 20.0, 'carbs': 6.0, 'fat': 8.0,
                    'fiber': 1.5, 'sugar': 3.0, 'sodium': 400, 'cholesterol': 55,
                    'saturated_fat': 2.1, 'trans_fat': 0.0,
                    'vitamins': {'vitamin_d': 2.3, 'vitamin_b12': 1.2, 'omega_3': 1.8},
                    'minerals': {'iodine': 150, 'selenium': 36, 'phosphorus': 210}
                },
                'category': 'curry',
                'health_score': 8.5,
                'glycemic_index': 40,
                'aliases': ['fish curry', 'fish kari', 'malu curry', 'mackerel curry']
            },
            
            'dal_curry': {
                'nutrition': {
                    'calories': 160, 'protein': 8.0, 'carbs': 25.0, 'fat': 4.0,
                    'fiber': 6.0, 'sugar': 2.0, 'sodium': 350, 'cholesterol': 0,
                    'saturated_fat': 0.5, 'trans_fat': 0.0,
                    'vitamins': {'folate': 180, 'thiamine_b1': 0.4, 'vitamin_b6': 0.2},
                    'minerals': {'iron': 3.3, 'magnesium': 48, 'potassium': 369}
                },
                'category': 'curry',
                'health_score': 9.0,
                'glycemic_index': 38,
                'aliases': ['dal curry', 'dhal', 'lentil curry', 'parippu', 'masoor dal']
            },
            
            'vegetable_curry': {
                'nutrition': {
                    'calories': 90, 'protein': 3.0, 'carbs': 15.0, 'fat': 3.0,
                    'fiber': 5.0, 'sugar': 6.0, 'sodium': 300, 'cholesterol': 0,
                    'saturated_fat': 0.8, 'trans_fat': 0.0,
                    'vitamins': {'vitamin_c': 45, 'vitamin_a': 2800, 'vitamin_k': 85},
                    'minerals': {'potassium': 320, 'calcium': 60, 'iron': 1.2}
                },
                'category': 'curry',
                'health_score': 9.5,
                'glycemic_index': 25,
                'aliases': ['vegetable curry', 'mixed vegetable curry', 'elawalu curry']
            },
            
            'kottu': {
                'nutrition': {
                    'calories': 450, 'protein': 25.0, 'carbs': 55.0, 'fat': 15.0,
                    'fiber': 4.0, 'sugar': 8.0, 'sodium': 800, 'cholesterol': 120,
                    'saturated_fat': 4.5, 'trans_fat': 0.0,
                    'vitamins': {'vitamin_b12': 0.8, 'niacin_b3': 12, 'vitamin_b6': 0.7},
                    'minerals': {'iron': 3.5, 'zinc': 3.2, 'phosphorus': 280}
                },
                'category': 'sri_lankan',
                'health_score': 6.0,
                'glycemic_index': 65,
                'aliases': ['kottu', 'kottu roti', 'chopped roti', 'string hoppers kottu']
            },
            
            'hoppers': {
                'nutrition': {
                    'calories': 150, 'protein': 4.0, 'carbs': 25.0, 'fat': 4.0,
                    'fiber': 1.0, 'sugar': 1.0, 'sodium': 200, 'cholesterol': 0,
                    'saturated_fat': 3.2, 'trans_fat': 0.0,
                    'vitamins': {'thiamine_b1': 0.1, 'riboflavin_b2': 0.05},
                    'minerals': {'iron': 1.0, 'calcium': 20, 'phosphorus': 65}
                },
                'category': 'sri_lankan',
                'health_score': 6.5,
                'glycemic_index': 70,
                'aliases': ['hoppers', 'appa', 'hopper', 'egg hopper', 'plain hopper']
            },
            
            'roti': {
                'nutrition': {
                    'calories': 120, 'protein': 4.0, 'carbs': 22.0, 'fat': 2.0,
                    'fiber': 2.0, 'sugar': 0.5, 'sodium': 150, 'cholesterol': 0,
                    'saturated_fat': 0.5, 'trans_fat': 0.0,
                    'vitamins': {'thiamine_b1': 0.3, 'niacin_b3': 3.5, 'folate': 25},
                    'minerals': {'iron': 2.2, 'magnesium': 35, 'phosphorus': 85}
                },
                'category': 'bread',
                'health_score': 7.0,
                'glycemic_index': 62,
                'aliases': ['roti', 'flatbread', 'chapati', 'pol roti', 'coconut roti']
            },
            
            # International Foods
            'pizza': {
                'nutrition': {
                    'calories': 285, 'protein': 12.0, 'carbs': 36.0, 'fat': 10.0,
                    'fiber': 2.3, 'sugar': 4.0, 'sodium': 640, 'cholesterol': 17,
                    'saturated_fat': 4.5, 'trans_fat': 0.2,
                    'vitamins': {'vitamin_c': 2, 'thiamine_b1': 0.3, 'riboflavin_b2': 0.3},
                    'minerals': {'calcium': 200, 'iron': 2.5, 'phosphorus': 230}
                },
                'category': 'fast_food',
                'health_score': 4.0,
                'glycemic_index': 80,
                'aliases': ['pizza', 'pizza slice', 'margherita pizza', 'cheese pizza']
            },
            
            'burger': {
                'nutrition': {
                    'calories': 540, 'protein': 25.0, 'carbs': 40.0, 'fat': 31.0,
                    'fiber': 3.0, 'sugar': 5.0, 'sodium': 1040, 'cholesterol': 80,
                    'saturated_fat': 12.0, 'trans_fat': 1.5,
                    'vitamins': {'vitamin_b12': 2.1, 'niacin_b3': 6.2},
                    'minerals': {'iron': 4.5, 'zinc': 5.3, 'phosphorus': 300}
                },
                'category': 'fast_food',
                'health_score': 3.0,
                'glycemic_index': 85,
                'aliases': ['burger', 'hamburger', 'cheeseburger', 'beef burger']
            },
            
            # Fruits
            'apple': {
                'nutrition': {
                    'calories': 95, 'protein': 0.5, 'carbs': 25.0, 'fat': 0.3,
                    'fiber': 4.0, 'sugar': 19.0, 'sodium': 2, 'cholesterol': 0,
                    'saturated_fat': 0.1, 'trans_fat': 0.0,
                    'vitamins': {'vitamin_c': 8.4, 'vitamin_k': 4.0, 'vitamin_a': 98},
                    'minerals': {'potassium': 195, 'calcium': 11, 'phosphorus': 20}
                },
                'category': 'fruits',
                'health_score': 9.0,
                'glycemic_index': 36,
                'aliases': ['apple', 'red apple', 'green apple', 'gala apple']
            },
            
            'banana': {
                'nutrition': {
                    'calories': 105, 'protein': 1.3, 'carbs': 27.0, 'fat': 0.4,
                    'fiber': 3.1, 'sugar': 14.4, 'sodium': 1, 'cholesterol': 0,
                    'saturated_fat': 0.1, 'trans_fat': 0.0,
                    'vitamins': {'vitamin_c': 10.3, 'vitamin_b6': 0.4, 'folate': 25},
                    'minerals': {'potassium': 422, 'magnesium': 32, 'phosphorus': 26}
                },
                'category': 'fruits',
                'health_score': 8.5,
                'glycemic_index': 51,
                'aliases': ['banana', 'ripe banana', 'yellow banana', 'kesel']
            },
            
            # Vegetables
            'broccoli': {
                'nutrition': {
                    'calories': 55, 'protein': 3.7, 'carbs': 11.0, 'fat': 0.6,
                    'fiber': 5.1, 'sugar': 2.6, 'sodium': 33, 'cholesterol': 0,
                    'saturated_fat': 0.1, 'trans_fat': 0.0,
                    'vitamins': {'vitamin_c': 132, 'vitamin_k': 141, 'folate': 108},
                    'minerals': {'calcium': 62, 'iron': 1.5, 'potassium': 505}
                },
                'category': 'vegetables',
                'health_score': 10.0,
                'glycemic_index': 10,
                'aliases': ['broccoli', 'green broccoli', 'broccoli florets']
            },
            
            # Beverages
            'tea': {
                'nutrition': {
                    'calories': 30, 'protein': 1.0, 'carbs': 7.0, 'fat': 0.0,
                    'fiber': 0.0, 'sugar': 6.0, 'sodium': 5, 'cholesterol': 0,
                    'saturated_fat': 0.0, 'trans_fat': 0.0,
                    'vitamins': {'vitamin_c': 0, 'riboflavin_b2': 0.02},
                    'minerals': {'calcium': 25, 'potassium': 25, 'fluoride': 0.4}
                },
                'category': 'beverages',
                'health_score': 7.0,
                'glycemic_index': 10,
                'aliases': ['tea', 'milk tea', 'black tea', 'chai', 'ceylon tea']
            },
            
            'coffee': {
                'nutrition': {
                    'calories': 25, 'protein': 1.0, 'carbs': 5.0, 'fat': 0.0,
                    'fiber': 0.0, 'sugar': 4.0, 'sodium': 5, 'cholesterol': 0,
                    'saturated_fat': 0.0, 'trans_fat': 0.0,
                    'vitamins': {'niacin_b3': 0.5, 'riboflavin_b2': 0.18},
                    'minerals': {'potassium': 116, 'magnesium': 7, 'phosphorus': 7}
                },
                'category': 'beverages',
                'health_score': 6.5,
                'glycemic_index': 0,
                'aliases': ['coffee', 'black coffee', 'milk coffee', 'espresso']
            },
            
            # Generic/Mixed
            'mixed_meal': {
                'nutrition': {
                    'calories': 350, 'protein': 20.0, 'carbs': 40.0, 'fat': 12.0,
                    'fiber': 5.0, 'sugar': 8.0, 'sodium': 400, 'cholesterol': 45,
                    'saturated_fat': 3.5, 'trans_fat': 0.0,
                    'vitamins': {'vitamin_c': 15, 'vitamin_b12': 0.5},
                    'minerals': {'iron': 2.5, 'calcium': 80, 'potassium': 350}
                },
                'category': 'mixed',
                'health_score': 7.0,
                'glycemic_index': 55,
                'aliases': ['mixed meal', 'complete meal', 'lunch plate', 'dinner plate']
            }
        }
    
    async def analyze_food_accurately(self, food_text: str, portion: str = "medium") -> DetailedNutritionInfo:
        """
        Analyze food with high accuracy using comprehensive database
        """
        try:
            # Clean and normalize food text
            food_text_clean = self._clean_food_text(food_text)
            
            # Find best matching food
            matched_food = self._find_best_food_match(food_text_clean)
            
            if not matched_food:
                logger.warning(f"No exact match found for '{food_text}', using estimation")
                return self._estimate_nutrition_intelligently(food_text_clean, portion)
            
            # Get portion multiplier
            portion_multiplier = self._get_portion_multiplier(portion, food_text_clean)
            
            # Calculate accurate nutrition
            base_nutrition = matched_food['nutrition']
            
            return DetailedNutritionInfo(
                calories=base_nutrition['calories'] * portion_multiplier,
                protein=base_nutrition['protein'] * portion_multiplier,
                carbs=base_nutrition['carbs'] * portion_multiplier,
                fat=base_nutrition['fat'] * portion_multiplier,
                fiber=base_nutrition.get('fiber', 0) * portion_multiplier,
                sugar=base_nutrition.get('sugar', 0) * portion_multiplier,
                sodium=base_nutrition.get('sodium', 0) * portion_multiplier,
                cholesterol=base_nutrition.get('cholesterol', 0) * portion_multiplier,
                saturated_fat=base_nutrition.get('saturated_fat', 0) * portion_multiplier,
                trans_fat=base_nutrition.get('trans_fat', 0) * portion_multiplier,
                vitamins=base_nutrition.get('vitamins', {}),
                minerals=base_nutrition.get('minerals', {}),
                portion_size=portion,
                food_category=matched_food['category'],
                glycemic_index=matched_food.get('glycemic_index'),
                health_score=matched_food.get('health_score', 5.0)
            )
            
        except Exception as e:
            logger.error(f"Error in accurate food analysis: {e}")
            return self._estimate_nutrition_intelligently(food_text, portion)
    
    def _clean_food_text(self, food_text: str) -> str:
        """Clean and normalize food text for better matching"""
        # Remove common prefixes/suffixes
        food_text = food_text.lower().strip()
        
        # Remove portion indicators
        portion_words = ['small', 'medium', 'large', 'cup', 'plate', 'bowl', 'serving']
        for word in portion_words:
            food_text = food_text.replace(word, '').strip()
        
        # Remove numbers and measurements
        food_text = re.sub(r'\d+', '', food_text).strip()
        food_text = re.sub(r'(g|kg|ml|l|oz|lbs)\b', '', food_text).strip()
        
        # Remove extra spaces
        food_text = ' '.join(food_text.split())
        
        return food_text
    
    def _find_best_food_match(self, food_text: str) -> Optional[Dict[str, Any]]:
        """Find the best matching food in the database"""
        food_text_lower = food_text.lower()
        
        # Direct name match
        if food_text_lower in self.food_database:
            return self.food_database[food_text_lower]
        
        # Check aliases
        for food_name, food_data in self.food_database.items():
            aliases = food_data.get('aliases', [])
            for alias in aliases:
                if alias.lower() in food_text_lower or food_text_lower in alias.lower():
                    return food_data
        
        # Partial match
        for food_name, food_data in self.food_database.items():
            if food_name in food_text_lower or any(word in food_text_lower for word in food_name.split('_')):
                return food_data
        
        return None
    
    def _get_portion_multiplier(self, portion: str, food_text: str) -> float:
        """Get portion multiplier based on portion description and food type"""
        portion_lower = portion.lower()
        
        # Check for specific measurements in the text
        if '100g' in food_text or '100 g' in food_text:
            return 1.0
        elif '200g' in food_text or '200 g' in food_text:
            return 2.0
        elif '1 cup' in food_text:
            return 1.0
        elif '1/2 cup' in food_text or 'half cup' in food_text:
            return 0.5
        
        # Use standard portion multipliers
        return self.portion_multipliers.get(portion_lower, 1.0)
    
    def _estimate_nutrition_intelligently(self, food_text: str, portion: str) -> DetailedNutritionInfo:
        """Intelligent estimation when exact match is not found"""
        # Analyze food text for clues
        calories = 200  # Default
        protein = 8
        carbs = 25
        fat = 8
        health_score = 5.0
        category = "unknown"
        
        food_lower = food_text.lower()
        
        # Adjust based on food type clues
        if any(word in food_lower for word in ['curry', 'gravy', 'kari']):
            calories = 180
            protein = 15
            fat = 9
            health_score = 7.0
            category = "curry"
        elif any(word in food_lower for word in ['rice', 'bread', 'roti', 'noodles']):
            calories = 130
            protein = 3
            carbs = 28
            fat = 1
            health_score = 6.0
            category = "grains"
        elif any(word in food_lower for word in ['chicken', 'beef', 'fish', 'meat']):
            calories = 200
            protein = 25
            carbs = 0
            fat = 8
            health_score = 7.5
            category = "protein"
        elif any(word in food_lower for word in ['vegetable', 'salad', 'green']):
            calories = 50
            protein = 2
            carbs = 10
            fat = 0.5
            health_score = 9.0
            category = "vegetables"
        elif any(word in food_lower for word in ['fruit', 'apple', 'banana', 'orange']):
            calories = 80
            protein = 1
            carbs = 20
            fat = 0.3
            health_score = 8.5
            category = "fruits"
        elif any(word in food_lower for word in ['pizza', 'burger', 'fries']):
            calories = 400
            protein = 15
            carbs = 40
            fat = 20
            health_score = 3.0
            category = "fast_food"
        
        # Apply portion multiplier
        portion_multiplier = self._get_portion_multiplier(portion, food_text)
        
        return DetailedNutritionInfo(
            calories=calories * portion_multiplier,
            protein=protein * portion_multiplier,
            carbs=carbs * portion_multiplier,
            fat=fat * portion_multiplier,
            fiber=3.0 * portion_multiplier,
            sugar=5.0 * portion_multiplier,
            sodium=300 * portion_multiplier,
            portion_size=portion,
            food_category=category,
            health_score=health_score
        )
    
    def analyze_multiple_foods(self, food_list: List[str]) -> List[DetailedNutritionInfo]:
        """Analyze multiple foods accurately"""
        results = []
        for food_item in food_list:
            # Extract portion from food text if present
            portion = "medium"
            if any(size in food_item.lower() for size in ['small', 'large', 'cup']):
                for size in ['small', 'medium', 'large']:
                    if size in food_item.lower():
                        portion = size
                        break
            
            nutrition = self.analyze_food_accurately(food_item, portion)
            results.append(nutrition)
        
        return results
    
    def calculate_total_nutrition(self, nutrition_list: List[DetailedNutritionInfo]) -> DetailedNutritionInfo:
        """Calculate total nutrition from multiple foods"""
        total = DetailedNutritionInfo(
            calories=sum(n.calories for n in nutrition_list),
            protein=sum(n.protein for n in nutrition_list),
            carbs=sum(n.carbs for n in nutrition_list),
            fat=sum(n.fat for n in nutrition_list),
            fiber=sum(n.fiber for n in nutrition_list),
            sugar=sum(n.sugar for n in nutrition_list),
            sodium=sum(n.sodium for n in nutrition_list),
            cholesterol=sum(n.cholesterol for n in nutrition_list),
            saturated_fat=sum(n.saturated_fat for n in nutrition_list),
            trans_fat=sum(n.trans_fat for n in nutrition_list),
            portion_size="total",
            food_category="mixed",
            health_score=sum(n.health_score for n in nutrition_list) / len(nutrition_list) if nutrition_list else 5.0
        )
        return total
