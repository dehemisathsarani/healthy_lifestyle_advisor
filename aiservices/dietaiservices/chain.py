from langchain_openai import OpenAI, ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, PromptTemplate
from langchain.chains import LLMChain
# Updated imports for Pydantic v2 compatibility
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, ConfigDict
import json
import logging

from settings import settings
from nutrition import NutritionAnalyzer, MacroTracker, BMICalculator, TDEECalculator
from vision_opt import FoodVisionAnalyzer, DetectedFood

logger = logging.getLogger(__name__)

class UserProfile(BaseModel):
    user_id: str
    age: int
    gender: str
    height_cm: float
    weight_kg: float
    activity_level: str
    goal: str  # lose_weight, gain_weight, maintain
    dietary_restrictions: List[str] = []
    allergies: List[str] = []

class DietAdvice(BaseModel):
    recommendation: str
    reasoning: str
    healthier_alternatives: List[str]
    warnings: List[str]
    macro_suggestions: Dict[str, str]
    hydration_reminder: Optional[str] = None

class DietAgentChain:
    def __init__(self):
        self.llm = ChatOpenAI(
            model_name=settings.MODEL_NAME,
            temperature=settings.TEMPERATURE,
            max_tokens=settings.MAX_TOKENS,
            openai_api_key=settings.OPENAI_API_KEY
        )
        
        self.nutrition_analyzer = NutritionAnalyzer()
        self.vision_analyzer = FoodVisionAnalyzer()
        self.macro_tracker = MacroTracker()
        
        # Initialize conversation history for context
        self.conversation_history = []
        
        self._setup_chains()
        # Agent functionality disabled for Pydantic v2 compatibility
        # self._setup_agent()
    
    def _setup_chains(self):
        """Setup different LangChain chains for various tasks."""
        
        # Food Analysis Chain
        food_analysis_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a professional nutritionist and diet expert. 
            Analyze the food information provided and give detailed nutritional insights.
            Consider the user's profile, goals, and dietary restrictions.
            Be specific, practical, and encouraging in your advice."""),
            ("human", """
            User Profile: {user_profile}
            Food Detected: {food_items}
            Current Nutrition: {nutrition_info}
            Daily Progress: {macro_progress}
            
            Please provide:
            1. Nutritional analysis of the food
            2. How it fits into their daily goals
            3. Recommendations for improvement
            4. Healthier alternatives if needed
            5. Any warnings or concerns
            """)
        ])
        
        self.food_analysis_chain = LLMChain(
            llm=self.llm,
            prompt=food_analysis_prompt,
            output_key="food_analysis"
        )
        
        # Meal Planning Chain
        meal_planning_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a meal planning expert. Create personalized meal plans 
            based on user goals, preferences, and nutritional needs. Consider their current 
            intake and suggest balanced meals for the rest of the day."""),
            ("human", """
            User Profile: {user_profile}
            Current Daily Intake: {current_intake}
            Remaining Calories Needed: {remaining_calories}
            Remaining Macros Needed: {remaining_macros}
            
            Suggest meals for the rest of the day that will help them meet their goals.
            Include specific portion sizes and preparation tips.
            """)
        ])
        
        self.meal_planning_chain = LLMChain(
            llm=self.llm,
            prompt=meal_planning_prompt,
            output_key="meal_plan"
        )
        
        # Health Warning Chain
        warning_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a health monitoring assistant. Analyze the user's 
            food intake and identify any potential health concerns or nutritional 
            imbalances. Provide gentle warnings and actionable advice."""),
            ("human", """
            User Profile: {user_profile}
            Daily Nutrition Summary: {daily_summary}
            BMI: {bmi}
            TDEE: {tdee}
            
            Check for:
            1. Excessive calorie intake
            2. Macro imbalances
            3. Missing nutrients
            4. Potential health risks
            5. Dehydration
            
            Provide warnings and suggestions if needed.
            """)
        ])
        
        self.warning_chain = LLMChain(
            llm=self.llm,
            prompt=warning_prompt,
            output_key="health_warnings"
        )
    
    def _setup_agent(self):
        """Setup LangChain agent with custom tools - DISABLED for Pydantic v2 compatibility."""
        # Temporarily disabled due to Pydantic v1/v2 compatibility issues
        # The functionality is replaced with direct tool calls in the analysis methods
        pass
        
        # def calculate_bmi_tool(input_str: str) -> str:
        #     """Calculate BMI from weight and height."""
        #     try:
        #         data = json.loads(input_str)
        #         bmi = BMICalculator.calculate_bmi(data['weight'], data['height'])
        #         category = BMICalculator.get_bmi_category(bmi)
        #         return f"BMI: {bmi:.1f} ({category})"
        #     except Exception as e:
        #         return f"Error calculating BMI: {e}"
        
        # self.agent = None  # Agent functionality disabled
    
    async def analyze_food_image(self, image_data: bytes, user_profile: UserProfile) -> DietAdvice:
        """Analyze food from image and provide diet advice."""
        try:
            # Step 1: Detect food in image
            detected_foods = await self.vision_analyzer.analyze_food_image(image_data)
            
            if not detected_foods:
                return DietAdvice(
                    recommendation="No food items detected in the image. Please try again with a clearer image.",
                    reasoning="Image analysis did not identify any recognizable food items.",
                    healthier_alternatives=[],
                    warnings=["Unable to analyze nutrition without food detection"],
                    macro_suggestions={}
                )
            
            # Step 2: Get nutrition information for each detected food
            nutrition_data = []
            for food in detected_foods:
                nutrition = await self.nutrition_analyzer.analyze_food_text(
                    f"{food.estimated_portion} {food.name}"
                )
                nutrition_data.append(nutrition)
            
            # Step 3: Calculate user's daily targets
            bmr = TDEECalculator.calculate_bmr(
                user_profile.weight_kg, user_profile.height_cm, 
                user_profile.age, user_profile.gender
            )
            tdee = TDEECalculator.calculate_tdee(bmr, user_profile.activity_level)
            
            # Adjust calorie target based on goal
            calorie_target = tdee
            if user_profile.goal == "lose_weight":
                calorie_target *= 0.8  # 20% deficit
            elif user_profile.goal == "gain_weight":
                calorie_target *= 1.2  # 20% surplus
            
            # Step 4: Get macro progress (you'd load this from database in real app)
            self.macro_tracker.set_goals(
                calories=calorie_target,
                protein=user_profile.weight_kg * 2,  # 2g per kg body weight
                carbs=calorie_target * 0.45 / 4,     # 45% of calories from carbs
                fat=calorie_target * 0.25 / 9        # 25% of calories from fat
            )
            
            # Step 5: Generate comprehensive advice using LangChain
            food_items_str = "\n".join([
                f"- {food.name} ({food.estimated_portion}) - Confidence: {food.confidence:.2f}"
                for food in detected_foods
            ])
            
            nutrition_str = "\n".join([
                f"- Calories: {n.calories}, Protein: {n.protein}g, Carbs: {n.carbs}g, Fat: {n.fat}g"
                for n in nutrition_data
            ])
            
            # Use the food analysis chain
            analysis_result = await self.food_analysis_chain.arun(
                user_profile=user_profile.dict(),
                food_items=food_items_str,
                nutrition_info=nutrition_str,
                macro_progress=self.macro_tracker.calculate_progress(nutrition_data)
            )
            
            # Parse the analysis and create structured advice
            advice = self._parse_analysis_to_advice(analysis_result, detected_foods, nutrition_data)
            
            return advice
            
        except Exception as e:
            logger.error(f"Error in food image analysis: {e}")
            return DietAdvice(
                recommendation="Sorry, I encountered an error analyzing your food. Please try again.",
                reasoning=f"Technical error: {str(e)}",
                healthier_alternatives=[],
                warnings=["Analysis failed"],
                macro_suggestions={}
            )
    
    async def analyze_text_meal(self, meal_description: str, user_profile: UserProfile) -> DietAdvice:
        """Analyze meal from text description."""
        try:
            # Get nutrition information
            nutrition = await self.nutrition_analyzer.analyze_food_text(meal_description)
            
            # Calculate user targets
            bmr = TDEECalculator.calculate_bmr(
                user_profile.weight_kg, user_profile.height_cm,
                user_profile.age, user_profile.gender
            )
            tdee = TDEECalculator.calculate_tdee(bmr, user_profile.activity_level)
            
            # Generate advice using LangChain
            analysis_result = await self.food_analysis_chain.arun(
                user_profile=user_profile.dict(),
                food_items=meal_description,
                nutrition_info=f"Calories: {nutrition.calories}, Protein: {nutrition.protein}g, Carbs: {nutrition.carbs}g, Fat: {nutrition.fat}g",
                macro_progress=self.macro_tracker.calculate_progress([nutrition])
            )
            
            return self._parse_analysis_to_advice(analysis_result, [], [nutrition])
            
        except Exception as e:
            logger.error(f"Error in text meal analysis: {e}")
            return DietAdvice(
                recommendation="Sorry, I encountered an error analyzing your meal description.",
                reasoning=f"Technical error: {str(e)}",
                healthier_alternatives=[],
                warnings=["Analysis failed"],
                macro_suggestions={}
            )
    
    async def get_meal_plan(self, user_profile: UserProfile, current_intake: List[Dict]) -> str:
        """Generate personalized meal plan for the rest of the day."""
        try:
            # Calculate remaining needs
            bmr = TDEECalculator.calculate_bmr(
                user_profile.weight_kg, user_profile.height_cm,
                user_profile.age, user_profile.gender
            )
            tdee = TDEECalculator.calculate_tdee(bmr, user_profile.activity_level)
            
            # Calculate what's already consumed
            consumed_calories = sum(meal.get('calories', 0) for meal in current_intake)
            remaining_calories = max(0, tdee - consumed_calories)
            
            meal_plan = await self.meal_planning_chain.arun(
                user_profile=user_profile.dict(),
                current_intake=current_intake,
                remaining_calories=remaining_calories,
                remaining_macros={
                    'protein': max(0, user_profile.weight_kg * 2 - sum(meal.get('protein', 0) for meal in current_intake)),
                    'carbs': max(0, tdee * 0.45 / 4 - sum(meal.get('carbs', 0) for meal in current_intake)),
                    'fat': max(0, tdee * 0.25 / 9 - sum(meal.get('fat', 0) for meal in current_intake))
                }
            )
            
            return meal_plan
            
        except Exception as e:
            logger.error(f"Error generating meal plan: {e}")
            return "Sorry, I couldn't generate a meal plan at this time. Please try again later."
    
    def _parse_analysis_to_advice(self, analysis_text: str, detected_foods: List[DetectedFood], nutrition_data: List) -> DietAdvice:
        """Parse the LLM analysis into structured advice."""
        # This is a simplified parser - you might want to use more sophisticated parsing
        lines = analysis_text.split('\n')
        
        recommendation = "Based on your meal analysis:"
        reasoning = "Nutritional assessment completed."
        alternatives = []
        warnings = []
        macro_suggestions = {}
        
        # Extract key information from the analysis
        for line in lines:
            if 'recommend' in line.lower():
                recommendation += f" {line.strip()}"
            elif 'alternative' in line.lower():
                alternatives.append(line.strip())
            elif 'warning' in line.lower() or 'concern' in line.lower():
                warnings.append(line.strip())
        
        # Add specific macro suggestions based on nutrition data
        if nutrition_data:
            total_calories = sum(n.calories for n in nutrition_data)
            total_protein = sum(n.protein for n in nutrition_data)
            
            if total_calories > 600:
                warnings.append("⚠️ This meal is quite high in calories.")
            if total_protein < 10:
                macro_suggestions['protein'] = "Consider adding more protein-rich foods."
        
        return DietAdvice(
            recommendation=recommendation,
            reasoning=reasoning,
            healthier_alternatives=alternatives[:3],  # Limit to 3
            warnings=warnings[:3],  # Limit to 3
            macro_suggestions=macro_suggestions
        )