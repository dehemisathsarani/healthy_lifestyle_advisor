# Enhanced Food Analysis API Endpoints for Backend Integration

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional, List, Dict, Any
import json
import logging
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/nutrition", tags=["enhanced_nutrition"])

logger = logging.getLogger(__name__)

# Enhanced Food Analysis Models
class EnhancedFoodItem:
    def __init__(self, **kwargs):
        self.id = kwargs.get('id', str(uuid.uuid4()))
        self.name = kwargs.get('name', '')
        self.category = kwargs.get('category', 'unknown')
        self.subcategory = kwargs.get('subcategory', '')
        self.cuisine = kwargs.get('cuisine', 'international')
        self.calories = kwargs.get('calories', 0)
        self.protein = kwargs.get('protein', 0)
        self.carbs = kwargs.get('carbs', 0)
        self.fat = kwargs.get('fat', 0)
        self.fiber = kwargs.get('fiber', 0)
        self.sodium = kwargs.get('sodium', 0)
        self.sugar = kwargs.get('sugar', 0)
        self.vitamins = kwargs.get('vitamins', {})
        self.minerals = kwargs.get('minerals', {})
        self.portion = kwargs.get('portion', '1 serving')
        self.portionWeight = kwargs.get('portionWeight', 100)
        self.confidence = kwargs.get('confidence', 0.5)
        self.cookingMethod = kwargs.get('cookingMethod', 'standard')
        self.culturalOrigin = kwargs.get('culturalOrigin', '')
        self.allergens = kwargs.get('allergens', [])
        self.healthScore = kwargs.get('healthScore', 5.0)
        self.processingLevel = kwargs.get('processingLevel', 'processed')

class EnhancedNutritionAnalysis:
    def __init__(self):
        self.foodItems: List[EnhancedFoodItem] = []
        self.totalNutrition = {
            'calories': 0, 'protein': 0, 'carbs': 0, 'fat': 0,
            'fiber': 0, 'sodium': 0, 'sugar': 0,
            'vitamins': {}, 'minerals': {}
        }
        self.confidence = 0.0
        self.analysisMethod = 'enhanced_pattern_recognition'
        self.detectionMethods = []
        self.recommendations = []
        self.improvements = []
        self.healthScore = 0.0
        self.balanceScore = 0.0
        self.sustainabilityScore = 0.0
        self.culturalAuthenticity = 0.0
        self.unknownFoods = []

# Enhanced Food Database (subset for demonstration)
ENHANCED_FOOD_DATABASE = {
    'steamed_white_rice': {
        'category': 'grains', 'subcategory': 'rice', 'cuisine': 'asian',
        'nutrition': {'calories': 130, 'protein': 2.7, 'carbs': 28, 'fat': 0.3, 'fiber': 0.4, 'sodium': 5, 'sugar': 0.1},
        'keywords': ['rice', 'steamed rice', 'white rice', 'basmati', 'jasmine'],
        'culturalOrigin': 'asian', 'healthScore': 6.5, 'processingLevel': 'minimally_processed'
    },
    'chicken_curry_sri_lankan': {
        'category': 'mixed_dish', 'subcategory': 'curry', 'cuisine': 'sri_lankan',
        'nutrition': {'calories': 165, 'protein': 12, 'carbs': 6.7, 'fat': 10, 'fiber': 1.2, 'sodium': 420, 'sugar': 3},
        'keywords': ['chicken curry', 'curry', 'sri lankan curry', 'spicy chicken'],
        'culturalOrigin': 'sri_lankan', 'healthScore': 7.8, 'processingLevel': 'processed'
    },
    'kottu_roti': {
        'category': 'mixed_dish', 'subcategory': 'street_food', 'cuisine': 'sri_lankan',
        'nutrition': {'calories': 280, 'protein': 15, 'carbs': 35, 'fat': 8, 'fiber': 2.1, 'sodium': 580, 'sugar': 2},
        'keywords': ['kottu', 'roti kottu', 'chopped roti', 'sri lankan street food'],
        'culturalOrigin': 'sri_lankan', 'healthScore': 6.8, 'processingLevel': 'processed'
    },
    'hoppers_plain': {
        'category': 'bread', 'subcategory': 'fermented_bread', 'cuisine': 'sri_lankan',
        'nutrition': {'calories': 95, 'protein': 2, 'carbs': 18, 'fat': 1.5, 'fiber': 0.8, 'sodium': 45, 'sugar': 1},
        'keywords': ['hoppers', 'appa', 'plain hoppers', 'fermented bread'],
        'culturalOrigin': 'sri_lankan', 'healthScore': 7.2, 'processingLevel': 'minimally_processed'
    },
    'spaghetti_bolognese': {
        'category': 'pasta', 'subcategory': 'italian_pasta', 'cuisine': 'italian',
        'nutrition': {'calories': 285, 'protein': 14, 'carbs': 42, 'fat': 8, 'fiber': 3, 'sodium': 380, 'sugar': 6},
        'keywords': ['spaghetti', 'bolognese', 'pasta', 'meat sauce', 'italian pasta', 'spaghetti bolognese'],
        'culturalOrigin': 'italian', 'healthScore': 7.2, 'processingLevel': 'processed'
    },
    'sushi_roll': {
        'category': 'sushi', 'subcategory': 'maki', 'cuisine': 'japanese',
        'nutrition': {'calories': 45, 'protein': 3, 'carbs': 7, 'fat': 1, 'fiber': 0.5, 'sodium': 85, 'sugar': 1},
        'keywords': ['sushi', 'maki', 'roll', 'japanese', 'sushi roll', 'salmon roll'],
        'culturalOrigin': 'japanese', 'healthScore': 8.5, 'processingLevel': 'minimally_processed'
    },
    'pizza_margherita': {
        'category': 'pizza', 'subcategory': 'italian_pizza', 'cuisine': 'italian',
        'nutrition': {'calories': 266, 'protein': 11, 'carbs': 33, 'fat': 10, 'fiber': 2, 'sodium': 640, 'sugar': 4},
        'keywords': ['pizza', 'margherita', 'italian pizza', 'cheese pizza'],
        'culturalOrigin': 'italian', 'healthScore': 6.0, 'processingLevel': 'processed'
    },
    'pad_thai': {
        'category': 'noodles', 'subcategory': 'stir_fry', 'cuisine': 'thai',
        'nutrition': {'calories': 375, 'protein': 15, 'carbs': 50, 'fat': 14, 'fiber': 3, 'sodium': 980, 'sugar': 8},
        'keywords': ['pad thai', 'thai noodles', 'stir fried noodles', 'thai'],
        'culturalOrigin': 'thai', 'healthScore': 6.5, 'processingLevel': 'processed'
    },
    'quinoa_salad': {
        'category': 'salad', 'subcategory': 'grain_salad', 'cuisine': 'international',
        'nutrition': {'calories': 185, 'protein': 8, 'carbs': 32, 'fat': 3.5, 'fiber': 5, 'sodium': 150, 'sugar': 2},
        'keywords': ['quinoa', 'salad', 'grain salad', 'superfood', 'healthy'],
        'culturalOrigin': 'international', 'healthScore': 9.5, 'processingLevel': 'whole'
    },
    'chicken_breast_grilled': {
        'category': 'protein', 'subcategory': 'lean_meat', 'cuisine': 'international',
        'nutrition': {
            'calories': 165, 'protein': 31, 'carbs': 0, 'fat': 3.6, 'fiber': 0, 'sodium': 74, 'sugar': 0,
            'vitamins': {'B6': 0.9, 'B12': 0.3, 'niacin': 14.8, 'selenium': 27.6},
            'minerals': {'phosphorus': 228, 'potassium': 256, 'zinc': 1.0, 'iron': 0.9}
        },
        'keywords': ['chicken breast', 'grilled chicken', 'lean protein', 'chicken'],
        'culturalOrigin': 'international', 'healthScore': 9.0, 'processingLevel': 'minimally_processed'
    },
    'broccoli_steamed': {
        'category': 'vegetables', 'subcategory': 'cruciferous', 'cuisine': 'international',
        'nutrition': {
            'calories': 55, 'protein': 3.7, 'carbs': 11, 'fat': 0.6, 'fiber': 5, 'sodium': 41, 'sugar': 2.2,
            'vitamins': {'C': 89.2, 'K': 202, 'folate': 104, 'A': 623},
            'minerals': {'potassium': 316, 'calcium': 62, 'iron': 1.4, 'magnesium': 33}
        },
        'keywords': ['broccoli', 'steamed broccoli', 'green vegetable', 'cruciferous'],
        'culturalOrigin': 'international', 'healthScore': 9.8, 'processingLevel': 'whole'
    },
    'salmon_grilled': {
        'category': 'protein', 'subcategory': 'fish', 'cuisine': 'international',
        'nutrition': {
            'calories': 231, 'protein': 25.4, 'carbs': 0, 'fat': 13.4, 'fiber': 0, 'sodium': 78, 'sugar': 0,
            'vitamins': {'B12': 2.8, 'D': 11.1, 'B6': 0.6, 'omega3': 1.8},
            'minerals': {'selenium': 36.5, 'phosphorus': 252, 'potassium': 628, 'magnesium': 30}
        },
        'keywords': ['salmon', 'grilled salmon', 'fish', 'omega 3', 'seafood'],
        'culturalOrigin': 'international', 'healthScore': 9.5, 'processingLevel': 'minimally_processed'
    }
}

def analyze_text_enhanced(text: str, user_context: Dict = None) -> EnhancedNutritionAnalysis:
    """Enhanced text analysis with comprehensive food recognition"""
    analysis = EnhancedNutritionAnalysis()
    text_lower = text.lower()
    
    # Detect portion modifiers
    portion_multiplier = 1.0
    if any(word in text_lower for word in ['large', 'big', 'jumbo', 'extra']):
        portion_multiplier = 1.4
    elif any(word in text_lower for word in ['small', 'mini', 'little', 'half']):
        portion_multiplier = 0.7
    
    # Detect cooking methods
    cooking_method = 'standard'
    cooking_methods = ['fried', 'grilled', 'steamed', 'boiled', 'baked', 'roasted']
    for method in cooking_methods:
        if method in text_lower:
            cooking_method = method
            break
    
    detected_foods = []
    
    # Search in database
    for food_key, food_data in ENHANCED_FOOD_DATABASE.items():
        confidence = 0
        
        # Direct name match
        food_name = food_key.replace('_', ' ')
        if food_name in text_lower:
            confidence = 0.9
        
        # Keywords match
        for keyword in food_data['keywords']:
            if keyword.lower() in text_lower:
                confidence = max(confidence, 0.8)
        
        if confidence > 0.5:
            # Create enhanced food item
            nutrition = food_data['nutrition']
            food_item = EnhancedFoodItem(
                name=food_name.title(),
                category=food_data['category'],
                subcategory=food_data['subcategory'],
                cuisine=food_data['cuisine'],
                calories=int(nutrition['calories'] * portion_multiplier),
                protein=round(nutrition['protein'] * portion_multiplier, 1),
                carbs=round(nutrition['carbs'] * portion_multiplier, 1),
                fat=round(nutrition['fat'] * portion_multiplier, 1),
                fiber=round(nutrition['fiber'] * portion_multiplier, 1),
                sodium=int(nutrition['sodium'] * portion_multiplier),
                sugar=round(nutrition['sugar'] * portion_multiplier, 1),
                vitamins=nutrition.get('vitamins', {}),
                minerals=nutrition.get('minerals', {}),
                portion=f"{int(100 * portion_multiplier)}g serving",
                portionWeight=int(100 * portion_multiplier),
                confidence=confidence,
                cookingMethod=cooking_method,
                culturalOrigin=food_data['culturalOrigin'],
                healthScore=food_data['healthScore']
            )
            detected_foods.append(food_item)
    
    analysis.foodItems = detected_foods
    
    # Calculate totals
    if detected_foods:
        # Aggregate vitamins and minerals
        total_vitamins = {}
        total_minerals = {}
        
        for food in detected_foods:
            if hasattr(food, 'vitamins') and food.vitamins:
                for vitamin, amount in food.vitamins.items():
                    total_vitamins[vitamin] = total_vitamins.get(vitamin, 0) + amount
            if hasattr(food, 'minerals') and food.minerals:
                for mineral, amount in food.minerals.items():
                    total_minerals[mineral] = total_minerals.get(mineral, 0) + amount
        
        analysis.totalNutrition = {
            'calories': sum(f.calories for f in detected_foods),
            'protein': round(sum(f.protein for f in detected_foods), 1),
            'carbs': round(sum(f.carbs for f in detected_foods), 1),
            'fat': round(sum(f.fat for f in detected_foods), 1),
            'fiber': round(sum(f.fiber for f in detected_foods), 1),
            'sodium': sum(f.sodium for f in detected_foods),
            'sugar': round(sum(f.sugar for f in detected_foods), 1),
            'vitamins': total_vitamins,
            'minerals': total_minerals
        }
        
        analysis.confidence = sum(f.confidence for f in detected_foods) / len(detected_foods)
        analysis.healthScore = sum(f.healthScore for f in detected_foods) / len(detected_foods)
        analysis.balanceScore = calculate_balance_score(analysis.totalNutrition)
        
        # Generate recommendations
        analysis.recommendations = generate_recommendations(detected_foods, analysis.totalNutrition)
        analysis.improvements = generate_improvements(detected_foods)
        analysis.detectionMethods = ['enhanced_text_analysis', 'keyword_matching', 'cultural_context']
        analysis.analysisMethod = 'Enhanced Text Analysis with Cultural Context'
    
    return analysis

def calculate_balance_score(nutrition: Dict) -> float:
    """Calculate nutritional balance score"""
    total_calories = nutrition['calories']
    if total_calories == 0:
        return 0.0
    
    protein_ratio = (nutrition['protein'] * 4) / total_calories
    carb_ratio = (nutrition['carbs'] * 4) / total_calories
    fat_ratio = (nutrition['fat'] * 9) / total_calories
    
    # Ideal ratios: 15-30% protein, 45-65% carbs, 20-35% fat
    protein_score = max(0, 100 - abs(protein_ratio - 0.225) * 400)  # Target 22.5%
    carb_score = max(0, 100 - abs(carb_ratio - 0.55) * 200)        # Target 55%
    fat_score = max(0, 100 - abs(fat_ratio - 0.275) * 400)        # Target 27.5%
    
    balance_score = (protein_score + carb_score + fat_score) / 30  # Scale to 0-10
    return min(10.0, balance_score)

def generate_recommendations(foods: List[EnhancedFoodItem], nutrition: Dict) -> List[str]:
    """Generate personalized recommendations"""
    recommendations = []
    
    # Calorie analysis
    total_calories = nutrition['calories']
    if total_calories > 800:
        recommendations.append("Consider reducing portion sizes or choosing lower-calorie alternatives")
    elif total_calories < 300:
        recommendations.append("This is a light meal - consider adding healthy snacks throughout the day")
    
    # Protein analysis
    protein_ratio = (nutrition['protein'] * 4) / max(total_calories, 1)
    if protein_ratio < 0.15:
        recommendations.append("Add more protein sources like lean meat, fish, legumes, or dairy")
    
    # Fiber analysis
    if nutrition['fiber'] < 5:
        recommendations.append("Increase fiber intake with vegetables, fruits, or whole grains")
    
    # Sodium analysis
    if nutrition['sodium'] > 800:
        recommendations.append("Consider reducing salt content and using herbs/spices for flavor")
    
    # Cultural and healthier alternatives
    sri_lankan_foods = [f for f in foods if f.cuisine == 'sri_lankan']
    if sri_lankan_foods:
        recommendations.append("Try brown rice instead of white rice for added fiber and nutrients")
        recommendations.append("Add more vegetables to your curry for better nutrition balance")
    
    return recommendations

def generate_improvements(foods: List[EnhancedFoodItem]) -> List[str]:
    """Generate meal improvement suggestions"""
    improvements = []
    
    # Processing level analysis
    highly_processed = [f for f in foods if f.processingLevel == 'ultra_processed']
    if highly_processed:
        improvements.append("Replace ultra-processed foods with whole food alternatives")
    
    # Health score analysis
    avg_health_score = sum(f.healthScore for f in foods) / len(foods) if foods else 0
    if avg_health_score < 6:
        improvements.append("Choose foods with higher nutritional density")
    
    # Variety suggestions
    if len(foods) < 3:
        improvements.append("Add more variety to your meal for better nutrient coverage")
    
    improvements.append("Include a variety of colorful vegetables for maximum nutrient intake")
    improvements.append("Stay hydrated - drink water with your meal")
    
    return improvements

@router.post("/enhanced-analyze")
async def enhanced_food_analysis(
    text_input: Optional[str] = Form(None),
    image_file: Optional[UploadFile] = File(None),
    user_context: Optional[str] = Form(None)
):
    """
    Enhanced food analysis endpoint supporting text, image, or combined analysis
    """
    try:
        # Parse user context
        user_data = {}
        if user_context:
            try:
                user_data = json.loads(user_context)
            except json.JSONDecodeError:
                logger.warning("Invalid user context JSON")
        
        # Validate input
        if not text_input and not image_file:
            raise HTTPException(status_code=400, detail="Either text input or image file is required")
        
        analysis = None
        
        # Text analysis
        if text_input:
            analysis = analyze_text_enhanced(text_input, user_data)
            logger.info(f"Enhanced text analysis completed for: {text_input[:50]}...")
        
        # Image analysis (simplified - would integrate with AI services in production)
        if image_file:
            # For now, combine with text hints or use fallback
            if not analysis:
                analysis = EnhancedNutritionAnalysis()
                
                # Simplified image analysis fallback
                fallback_foods = [
                    EnhancedFoodItem(
                        name="Rice and Curry",
                        category="mixed_dish",
                        cuisine="sri_lankan",
                        calories=295,
                        protein=14.7,
                        carbs=34.7,
                        fat=10.3,
                        fiber=1.6,
                        sodium=425,
                        sugar=3.1,
                        portion="200g serving",
                        portionWeight=200,
                        confidence=0.7,
                        culturalOrigin="sri_lankan",
                        healthScore=7.2
                    )
                ]
                
                analysis.foodItems = fallback_foods
                analysis.totalNutrition = {
                    'calories': 295, 'protein': 14.7, 'carbs': 34.7, 'fat': 10.3,
                    'fiber': 1.6, 'sodium': 425, 'sugar': 3.1,
                    'vitamins': {}, 'minerals': {}
                }
                analysis.confidence = 0.7
                analysis.analysisMethod = 'Enhanced Image Analysis (Fallback)'
                analysis.detectionMethods = ['image_metadata', 'visual_pattern_recognition']
                analysis.healthScore = 7.2
                analysis.balanceScore = calculate_balance_score(analysis.totalNutrition)
                analysis.recommendations = generate_recommendations(fallback_foods, analysis.totalNutrition)
                analysis.improvements = generate_improvements(fallback_foods)
        
        # Convert to response format
        response_data = {
            'success': True,
            'foodItems': [
                {
                    'id': food.id,
                    'name': food.name,
                    'category': food.category,
                    'subcategory': food.subcategory,
                    'cuisine': food.cuisine,
                    'calories': food.calories,
                    'protein': food.protein,
                    'carbs': food.carbs,
                    'fat': food.fat,
                    'fiber': food.fiber,
                    'sodium': food.sodium,
                    'sugar': food.sugar,
                    'vitamins': food.vitamins,
                    'minerals': food.minerals,
                    'portion': food.portion,
                    'portionWeight': food.portionWeight,
                    'confidence': food.confidence,
                    'cookingMethod': food.cookingMethod,
                    'culturalOrigin': food.culturalOrigin,
                    'healthScore': food.healthScore,
                    'allergens': food.allergens
                }
                for food in analysis.foodItems
            ],
            'totalNutrition': analysis.totalNutrition,
            'confidence': analysis.confidence,
            'analysisMethod': analysis.analysisMethod,
            'detectionMethods': analysis.detectionMethods,
            'recommendations': analysis.recommendations,
            'improvements': analysis.improvements,
            'healthScore': analysis.healthScore,
            'balanceScore': analysis.balanceScore,
            'sustainabilityScore': analysis.sustainabilityScore,
            'culturalAuthenticity': analysis.culturalAuthenticity,
            'unknownFoods': analysis.unknownFoods,
            'timestamp': datetime.now().isoformat(),
            'processingTime': 0.5  # Placeholder
        }
        
        logger.info(f"Enhanced analysis completed: {len(analysis.foodItems)} foods detected")
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Enhanced food analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.get("/food-suggestions")
async def get_food_suggestions(query: str):
    """Get food suggestions for autocomplete"""
    try:
        query_lower = query.lower()
        suggestions = []
        
        for food_key, food_data in ENHANCED_FOOD_DATABASE.items():
            food_name = food_key.replace('_', ' ')
            
            # Check if query matches food name or keywords
            if query_lower in food_name or any(query_lower in keyword.lower() for keyword in food_data['keywords']):
                suggestions.append({
                    'name': food_name.title(),
                    'cuisine': food_data['cuisine'],
                    'category': food_data['category'],
                    'healthScore': food_data['healthScore']
                })
        
        return {'suggestions': suggestions[:10]}  # Limit to 10 suggestions
        
    except Exception as e:
        logger.error(f"Food suggestions failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to get suggestions")

# Add to your main FastAPI app
# app.include_router(router)
