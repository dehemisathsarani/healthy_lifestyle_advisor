"""
Enhanced Fallback System for RAG Chatbot
Provides comprehensive nutrition responses when OpenAI API is unavailable
"""

import logging
import re
import json
from typing import Dict, List, Any, Optional
from datetime import datetime
import random

logger = logging.getLogger(__name__)

class EnhancedNutritionFallback:
    """
    Comprehensive fallback system with intelligent pattern matching
    and personalized nutrition responses
    """
    
    def __init__(self):
        self.nutrition_database = self._initialize_nutrition_database()
        self.response_templates = self._initialize_response_templates()
        self.food_database = self._initialize_food_database()
        
    def _initialize_nutrition_database(self) -> Dict[str, Any]:
        """Initialize comprehensive nutrition knowledge database"""
        return {
            "macronutrients": {
                "protein": {
                    "description": "Essential for muscle building, repair, and maintenance",
                    "daily_intake": "0.8-2.0g per kg body weight depending on activity level",
                    "sources": [
                        "Lean meats (chicken, turkey, lean beef)",
                        "Fish and seafood",
                        "Eggs and dairy products",
                        "Legumes and beans",
                        "Nuts and seeds",
                        "Quinoa and tofu"
                    ],
                    "vegetarian_sources": [
                        "Lentils and chickpeas",
                        "Greek yogurt and cottage cheese",
                        "Nuts and nut butters",
                        "Hemp seeds and chia seeds",
                        "Spirulina and nutritional yeast"
                    ],
                    "benefits": [
                        "Muscle growth and repair",
                        "Immune system support",
                        "Hormone production",
                        "Feeling full and satisfied"
                    ]
                },
                "carbohydrates": {
                    "description": "Primary energy source for brain and muscles",
                    "daily_intake": "45-65% of total daily calories",
                    "complex_sources": [
                        "Brown rice and quinoa",
                        "Oats and whole grain bread",
                        "Sweet potatoes and vegetables",
                        "Legumes and beans"
                    ],
                    "simple_sources": [
                        "Fruits and berries",
                        "Milk and yogurt",
                        "Honey (in moderation)"
                    ],
                    "benefits": [
                        "Quick energy for workouts",
                        "Brain fuel",
                        "Muscle glycogen storage",
                        "Fiber for digestive health"
                    ]
                },
                "fats": {
                    "description": "Essential for hormone production and nutrient absorption",
                    "daily_intake": "20-35% of total daily calories",
                    "healthy_sources": [
                        "Avocados and olive oil",
                        "Nuts and seeds",
                        "Fatty fish (salmon, sardines)",
                        "Coconut oil (in moderation)"
                    ],
                    "benefits": [
                        "Hormone production",
                        "Brain health",
                        "Vitamin absorption",
                        "Long-lasting energy"
                    ]
                }
            },
            "hydration": {
                "daily_intake": "8-10 glasses (2-2.5 liters) per day",
                "factors": [
                    "Increase with exercise and hot weather",
                    "Body weight affects requirements",
                    "Pregnancy and breastfeeding increase needs"
                ],
                "signs_of_dehydration": [
                    "Dark yellow urine",
                    "Fatigue and headaches",
                    "Dry mouth and lips",
                    "Dizziness"
                ],
                "hydrating_foods": [
                    "Watermelon and cucumber",
                    "Oranges and berries",
                    "Soups and broths",
                    "Lettuce and tomatoes"
                ]
            },
            "weight_management": {
                "weight_loss": {
                    "caloric_deficit": "500-750 calories per day for 1-2 lbs per week",
                    "strategies": [
                        "Focus on whole, unprocessed foods",
                        "Increase protein intake",
                        "Control portion sizes",
                        "Eat regular meals to prevent overeating",
                        "Stay hydrated",
                        "Include physical activity"
                    ],
                    "foods_to_emphasize": [
                        "Lean proteins",
                        "Vegetables and fruits",
                        "Whole grains in moderation",
                        "Healthy fats in small amounts"
                    ]
                },
                "weight_gain": {
                    "caloric_surplus": "300-500 calories per day",
                    "strategies": [
                        "Eat frequent, nutrient-dense meals",
                        "Include healthy fats",
                        "Strength training to build muscle",
                        "Protein-rich snacks"
                    ]
                }
            },
            "special_diets": {
                "vegetarian": {
                    "key_nutrients": ["Protein", "Iron", "B12", "Omega-3"],
                    "protein_combinations": [
                        "Rice and beans",
                        "Hummus and whole grain pita",
                        "Peanut butter and whole grain bread"
                    ],
                    "iron_sources": [
                        "Spinach and dark leafy greens",
                        "Lentils and chickpeas",
                        "Fortified cereals",
                        "Pumpkin seeds"
                    ]
                },
                "vegan": {
                    "supplements_needed": ["B12", "Vitamin D", "Iron"],
                    "protein_sources": [
                        "Legumes and beans",
                        "Nuts and seeds",
                        "Tofu and tempeh",
                        "Nutritional yeast"
                    ]
                },
                "gluten_free": {
                    "safe_grains": [
                        "Rice and quinoa",
                        "Corn and millet",
                        "Oats (certified gluten-free)"
                    ],
                    "hidden_sources": [
                        "Soy sauce and some seasonings",
                        "Processed meats",
                        "Some medications"
                    ]
                }
            }
        }
    
    def _initialize_response_templates(self) -> Dict[str, List[str]]:
        """Initialize response templates for different types of questions"""
        return {
            "protein_questions": [
                "Protein is essential for {purpose}. I recommend {sources} for your needs.",
                "Based on your profile, aim for {amount} of protein daily from sources like {sources}.",
                "Great protein options include {sources}. These will help with {benefits}."
            ],
            "weight_loss": [
                "For healthy weight loss, focus on creating a moderate caloric deficit while maintaining nutrition quality.",
                "I recommend emphasizing {foods} and {strategies} for sustainable weight loss.",
                "Weight loss success comes from {principles}. Consider these approaches: {strategies}."
            ],
            "hydration": [
                "Proper hydration is crucial for {benefits}. Aim for {amount} daily.",
                "Stay hydrated with {sources}. Watch for signs like {signs} that indicate you need more fluids.",
                "Your hydration needs depend on {factors}. Generally, {amount} is recommended."
            ],
            "general_nutrition": [
                "Nutrition is highly individual, but here are some evidence-based recommendations for {topic}.",
                "Based on nutritional science, {recommendations} can help with {goals}.",
                "For {topic}, focus on {strategies} and consider {foods}."
            ]
        }
    
    def _initialize_food_database(self) -> Dict[str, Dict[str, Any]]:
        """Initialize specific food information database"""
        return {
            "rice": {
                "types": {
                    "white_rice": {
                        "nutrition": "High in carbs, low in fiber, quick energy",
                        "recommendation": "Good for post-workout, moderate portions"
                    },
                    "brown_rice": {
                        "nutrition": "Complex carbs, fiber, B vitamins, minerals",
                        "recommendation": "Better choice for sustained energy and nutrition"
                    }
                },
                "alternatives": ["Quinoa", "Cauliflower rice", "Wild rice", "Barley"]
            },
            "curry": {
                "benefits": [
                    "Spices like turmeric have anti-inflammatory properties",
                    "Can include vegetables for nutrients",
                    "Protein from meat, legumes, or dairy"
                ],
                "healthier_preparation": [
                    "Use less oil and coconut milk",
                    "Add more vegetables",
                    "Choose lean proteins",
                    "Control portion sizes"
                ]
            },
            "sri_lankan_foods": {
                "rice_and_curry": {
                    "nutrition": "Complete meal with carbs, protein, and vegetables",
                    "tips": "Choose brown rice, include dal for protein, load up on vegetable curries"
                },
                "hoppers": {
                    "nutrition": "Fermented rice flour, easier to digest",
                    "tips": "Pair with egg for protein, limit coconut milk versions"
                },
                "kottu": {
                    "nutrition": "High in carbs and calories",
                    "tips": "Enjoy occasionally, ask for extra vegetables, smaller portions"
                }
            }
        }
    
    def get_intelligent_response(self, message: str, user_profile: Optional[Dict] = None, 
                               nutrition_context: Optional[Dict] = None) -> str:
        """
        Generate intelligent nutrition response based on message analysis
        """
        try:
            message_lower = message.lower()
            
            # Analyze message intent
            intent = self._analyze_message_intent(message_lower)
            
            # Get personalized response based on intent
            if intent == "protein_inquiry":
                return self._handle_protein_question(message_lower, user_profile)
            elif intent == "weight_management":
                return self._handle_weight_question(message_lower, user_profile)
            elif intent == "hydration":
                return self._handle_hydration_question(message_lower, user_profile)
            elif intent == "food_specific":
                return self._handle_food_specific_question(message_lower, user_profile)
            elif intent == "meal_planning":
                return self._handle_meal_planning(message_lower, user_profile, nutrition_context)
            elif intent == "substitutions":
                return self._handle_substitution_question(message_lower, user_profile)
            else:
                return self._handle_general_nutrition(message_lower, user_profile)
                
        except Exception as e:
            logger.error(f"Error in intelligent response generation: {e}")
            return self._get_default_response()
    
    def _analyze_message_intent(self, message: str) -> str:
        """Analyze message to determine the type of nutrition question"""
        
        intent_patterns = {
            "protein_inquiry": [
                r"protein", r"amino acid", r"muscle", r"build", r"repair"
            ],
            "weight_management": [
                r"lose weight", r"weight loss", r"gain weight", r"diet", r"calories"
            ],
            "hydration": [
                r"water", r"drink", r"hydrat", r"fluid", r"thirst"
            ],
            "food_specific": [
                r"rice", r"curry", r"chicken", r"fish", r"hoppers", r"kottu"
            ],
            "meal_planning": [
                r"breakfast", r"lunch", r"dinner", r"meal", r"eat", r"food plan"
            ],
            "substitutions": [
                r"alternative", r"substitute", r"replace", r"instead of"
            ]
        }
        
        intent_scores = {}
        for intent, patterns in intent_patterns.items():
            score = sum(1 for pattern in patterns if re.search(pattern, message))
            if score > 0:
                intent_scores[intent] = score
        
        # Return intent with highest score, or general if no specific intent found
        if intent_scores:
            return max(intent_scores.keys(), key=lambda k: intent_scores[k])
        else:
            return "general_nutrition"
    
    def _handle_protein_question(self, message: str, user_profile: Optional[Dict] = None) -> str:
        """Handle protein-related questions"""
        protein_info = self.nutrition_database["macronutrients"]["protein"]
        
        # Determine if vegetarian
        is_vegetarian = (user_profile and 
                        "vegetarian" in user_profile.get("dietary_restrictions", []))
        
        sources = (protein_info["vegetarian_sources"] if is_vegetarian 
                  else protein_info["sources"])
        
        # Calculate protein needs if weight available
        protein_amount = "adequate"
        if user_profile and user_profile.get("weight"):
            weight = user_profile["weight"]
            activity_level = user_profile.get("activity_level", "moderate")
            
            if activity_level in ["high", "very_active"]:
                protein_needed = weight * 1.6  # Higher end for active individuals
            else:
                protein_needed = weight * 1.0  # Moderate amount
                
            protein_amount = f"{protein_needed:.0f}g"
        
        response = f"""🥩 **Protein Information**

**Daily Needs:** {protein_amount} (generally {protein_info['daily_intake']})

**Best Sources for You:**
{self._format_list(sources[:4])}

**Key Benefits:**
{self._format_list(protein_info['benefits'])}

**Tips:**
- Spread protein intake throughout the day
- Include protein with each meal for satiety
- Post-workout protein helps with muscle recovery"""

        if is_vegetarian:
            response += "\n- Combine different plant proteins for complete amino acid profiles"
            
        return response
    
    def _handle_weight_question(self, message: str, user_profile: Optional[Dict] = None) -> str:
        """Handle weight management questions"""
        
        # Determine if weight loss or gain
        is_weight_loss = any(term in message for term in ["lose", "loss", "reduce", "cut"])
        is_weight_gain = any(term in message for term in ["gain", "build", "increase"])
        
        goal = "weight_loss" if is_weight_loss else "weight_gain" if is_weight_gain else "weight_loss"
        
        # Get user's stated goal if available
        if user_profile and user_profile.get("goal"):
            if "loss" in user_profile["goal"].lower():
                goal = "weight_loss"
            elif "gain" in user_profile["goal"].lower():
                goal = "weight_gain"
        
        weight_info = self.nutrition_database["weight_management"][goal]
        
        response = f"""⚖️ **{goal.replace('_', ' ').title()} Guidance**

**Caloric Approach:** {weight_info.get('caloric_deficit', weight_info.get('caloric_surplus', 'Balanced calories'))}

**Key Strategies:**
{self._format_list(weight_info['strategies'])}
"""
        
        if goal == "weight_loss" and "foods_to_emphasize" in weight_info:
            response += f"""
**Foods to Emphasize:**
{self._format_list(weight_info['foods_to_emphasize'])}"""

        response += """
**Important Reminders:**
- Sustainable changes work better than drastic measures
- Include physical activity for best results
- Stay hydrated and get adequate sleep
- Consider consulting a healthcare provider for personalized advice"""

        return response
    
    def _handle_hydration_question(self, message: str, user_profile: Optional[Dict] = None) -> str:
        """Handle hydration-related questions"""
        hydration_info = self.nutrition_database["hydration"]
        
        response = f"""💧 **Hydration Guidelines**

**Daily Intake:** {hydration_info['daily_intake']}

**Factors Affecting Needs:**
{self._format_list(hydration_info['factors'])}

**Signs You Need More Water:**
{self._format_list(hydration_info['signs_of_dehydration'])}

**Hydrating Foods to Include:**
{self._format_list(hydration_info['hydrating_foods'])}

**Pro Tips:**
- Start your day with a glass of water
- Keep a water bottle with you
- Drink before, during, and after exercise
- Monitor your urine color as a hydration indicator"""

        return response
    
    def _handle_food_specific_question(self, message: str, user_profile: Optional[Dict] = None) -> str:
        """Handle questions about specific foods"""
        
        if "rice" in message:
            rice_info = self.food_database["rice"]
            response = """🍚 **Rice Nutrition Information**

**White Rice:**
- """ + rice_info["types"]["white_rice"]["nutrition"] + """
- """ + rice_info["types"]["white_rice"]["recommendation"] + """

**Brown Rice:**
- """ + rice_info["types"]["brown_rice"]["nutrition"] + """
- """ + rice_info["types"]["brown_rice"]["recommendation"] + """

**Healthy Alternatives:**
""" + self._format_list(rice_info["alternatives"]) + """

**Tips for Rice Consumption:**
- Choose brown rice for more nutrients
- Control portion sizes (1/2 to 3/4 cup cooked)
- Pair with protein and vegetables for balanced meals"""

        elif "curry" in message:
            curry_info = self.food_database["curry"]
            response = f"""🍛 **Curry Nutrition Information**

**Health Benefits:**
{self._format_list(curry_info['benefits'])}

**For Healthier Curry:**
{self._format_list(curry_info['healthier_preparation'])}

**Nutrition Tips:**
- Curries can be very nutritious when prepared mindfully
- The variety of spices provides antioxidants and anti-inflammatory compounds
- Include plenty of vegetables in your curry
- Choose lean proteins like chicken breast, fish, or legumes"""

        elif any(food in message for food in ["hoppers", "kottu", "sri lankan"]):
            sl_foods = self.food_database["sri_lankan_foods"]
            response = """🇱🇰 **Sri Lankan Food Nutrition**

**Rice and Curry:**
- """ + sl_foods["rice_and_curry"]["nutrition"] + """
- Tips: """ + sl_foods["rice_and_curry"]["tips"] + """

**Hoppers:**
- """ + sl_foods["hoppers"]["nutrition"] + """
- Tips: """ + sl_foods["hoppers"]["tips"] + """

**Kottu:**
- """ + sl_foods["kottu"]["nutrition"] + """
- Tips: """ + sl_foods["kottu"]["tips"] + """

**General Tips for Sri Lankan Cuisine:**
- Focus on vegetable curries for nutrients
- Include dal (lentil curry) for protein
- Use coconut products in moderation
- Balance portions of rice with plenty of vegetables"""

        else:
            response = self._handle_general_nutrition(message, user_profile)
            
        return response
    
    def _handle_meal_planning(self, message: str, user_profile: Optional[Dict] = None, 
                            nutrition_context: Optional[Dict] = None) -> str:
        """Handle meal planning questions"""
        
        meal_type = "general"
        if "breakfast" in message:
            meal_type = "breakfast"
        elif "lunch" in message:
            meal_type = "lunch"
        elif "dinner" in message:
            meal_type = "dinner"
        
        # Get user preferences
        is_vegetarian = (user_profile and 
                        "vegetarian" in user_profile.get("dietary_restrictions", []))
        goal = user_profile.get("goal", "general_health") if user_profile else "general_health"
        
        meal_suggestions = {
            "breakfast": {
                "general": [
                    "Greek yogurt with berries and nuts",
                    "Oatmeal with banana and almond butter",
                    "Eggs with whole grain toast and avocado",
                    "Smoothie with protein powder, spinach, and fruit"
                ],
                "vegetarian": [
                    "Chia seed pudding with fruits",
                    "Whole grain cereal with milk and berries",
                    "Avocado toast with hemp seeds",
                    "Vegetable omelet with whole grain toast"
                ]
            },
            "lunch": {
                "general": [
                    "Grilled chicken salad with mixed vegetables",
                    "Quinoa bowl with roasted vegetables and protein",
                    "Soup with whole grain bread",
                    "Fish with sweet potato and steamed broccoli"
                ],
                "vegetarian": [
                    "Lentil and vegetable curry with brown rice",
                    "Quinoa salad with chickpeas and vegetables",
                    "Bean and vegetable soup",
                    "Tofu stir-fry with brown rice"
                ]
            },
            "dinner": {
                "general": [
                    "Grilled fish with roasted vegetables",
                    "Lean meat with quinoa and salad",
                    "Chicken curry with brown rice",
                    "Egg curry with vegetables"
                ],
                "vegetarian": [
                    "Dal curry with brown rice and vegetables",
                    "Stuffed bell peppers with quinoa",
                    "Vegetable curry with roti",
                    "Lentil soup with whole grain bread"
                ]
            }
        }
        
        diet_type = "vegetarian" if is_vegetarian else "general"
        suggestions = meal_suggestions.get(meal_type, meal_suggestions["general"])[diet_type]
        
        response = f"""🍽️ **{meal_type.title()} Planning**

**Recommended Options:**
{self._format_list(suggestions)}

**Meal Planning Principles:**
- Include protein for satiety and muscle health
- Add colorful vegetables for vitamins and minerals
- Choose complex carbohydrates for sustained energy
- Include healthy fats in moderation

**Portion Guidelines:**
- Fill half your plate with vegetables
- Quarter with lean protein
- Quarter with whole grains or starchy vegetables"""

        if goal and "weight_loss" in goal:
            response += """

**For Weight Loss:**
- Control portions and eat slowly
- Start with a salad or soup
- Choose grilled, steamed, or baked preparations
- Limit added oils and high-calorie sauces"""

        if nutrition_context and nutrition_context.get("recent_foods"):
            recent_foods = nutrition_context["recent_foods"]
            response += f"""

**Based on Your Recent Eating:**
- You've been eating: {', '.join(recent_foods[-3:])}
- Consider adding variety with different protein sources and vegetables
- Try to include foods from all food groups throughout the week"""

        return response
    
    def _handle_substitution_question(self, message: str, user_profile: Optional[Dict] = None) -> str:
        """Handle food substitution questions"""
        
        substitutions = {
            "rice": ["Brown rice", "Quinoa", "Cauliflower rice", "Wild rice"],
            "bread": ["Whole grain bread", "Ezekiel bread", "Lettuce wraps", "Sweet potato"],
            "pasta": ["Zucchini noodles", "Shirataki noodles", "Whole grain pasta", "Spaghetti squash"],
            "sugar": ["Stevia", "Monk fruit", "Date paste", "Applesauce"],
            "oil": ["Cooking spray", "Broth for sautéing", "Applesauce in baking", "Avocado"],
            "meat": ["Tofu", "Tempeh", "Legumes", "Mushrooms", "Jackfruit"],
            "dairy": ["Almond milk", "Coconut yogurt", "Nutritional yeast", "Cashew cream"]
        }
        
        response = """🔄 **Healthy Food Substitutions**

**Common Substitutions:**
"""
        
        # Find relevant substitutions based on message
        found_subs = []
        for food, subs in substitutions.items():
            if food in message:
                found_subs.append(f"**{food.title()}:** {', '.join(subs)}")
        
        if found_subs:
            response += "\n".join(found_subs)
        else:
            # Show general substitutions
            for food, subs in list(substitutions.items())[:4]:
                response += f"**{food.title()}:** {', '.join(subs)}\n"
        
        response += """
**Substitution Tips:**
- Start with small changes to allow your taste buds to adjust
- Experiment with different options to find what you enjoy
- Consider the nutritional benefits of the substitution
- Remember that healthier options often provide more nutrients and fiber"""

        return response
    
    def _handle_general_nutrition(self, message: str, user_profile: Optional[Dict] = None) -> str:
        """Handle general nutrition questions"""
        
        general_tips = [
            "Focus on whole, unprocessed foods",
            "Include a variety of colorful fruits and vegetables",
            "Choose lean proteins from various sources",
            "Select complex carbohydrates over simple sugars",
            "Include healthy fats in moderation",
            "Stay adequately hydrated throughout the day",
            "Practice portion control and mindful eating",
            "Plan and prepare meals when possible"
        ]
        
        response = f"""🌱 **General Nutrition Guidance**

**Fundamental Principles:**
{self._format_list(general_tips)}

**Building a Balanced Plate:**
- 50% vegetables and fruits
- 25% lean protein
- 25% whole grains or starchy vegetables
- Small amount of healthy fats

**Daily Habits for Success:**
- Eat regular meals to maintain energy
- Stay hydrated with water as your main beverage
- Get adequate sleep (affects hunger hormones)
- Be physically active most days
- Listen to your body's hunger and fullness cues"""

        if user_profile:
            if user_profile.get("goal"):
                response += f"\n**For your goal of {user_profile['goal']}:** Focus on consistent healthy habits rather than drastic changes."
            
            if user_profile.get("dietary_restrictions"):
                restrictions = user_profile["dietary_restrictions"]
                response += f"\n**Considering your dietary preferences ({', '.join(restrictions)}):** Make sure to get nutrients that might be limited in your diet."

        return response
    
    def _format_list(self, items: List[str]) -> str:
        """Format a list of items with bullet points"""
        return "\n".join(f"• {item}" for item in items)
    
    def _get_default_response(self) -> str:
        """Get a default response when other methods fail"""
        responses = [
            """🌟 **Nutrition Guidance**

I'm here to help with your nutrition questions! Here are some general principles:

• Focus on whole, unprocessed foods
• Include plenty of vegetables and fruits
• Choose lean proteins and healthy fats
• Stay hydrated throughout the day
• Practice portion control and mindful eating

For personalized advice, consider completing your profile with your goals, preferences, and any dietary restrictions.""",

            """🍎 **Healthy Eating Basics**

Good nutrition is about balance and making informed choices:

• Eat a variety of foods from all food groups
• Choose nutrient-dense options over empty calories
• Plan your meals and snacks
• Listen to your body's hunger and fullness signals
• Stay consistent with your healthy habits

Feel free to ask specific questions about foods, nutrients, or meal planning!"""
        ]
        
        return random.choice(responses)

# Global fallback instance
enhanced_nutrition_fallback = EnhancedNutritionFallback()
