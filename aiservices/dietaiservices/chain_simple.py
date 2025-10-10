"""
Simplified chain.py with minimal LangChain dependencies to avoid version conflicts
"""
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import HumanMessage, SystemMessage
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, ConfigDict
import json
import logging
from settings import Settings
from vision_opt import FoodVisionAnalyzer, DetectedFood

logger = logging.getLogger(__name__)
settings = Settings()

class UserProfile(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
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
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    recommendation: str
    reasoning: str
    healthier_alternatives: List[str]
    warnings: List[str]
    macro_suggestions: Dict[str, str]

class SimpleDietAgent:
    """Simplified diet agent without complex LangChain chains"""
    
    def __init__(self):
        self.llm = ChatOpenAI(
            model_name=settings.MODEL_NAME,
            temperature=settings.TEMPERATURE,
            openai_api_key=settings.OPENAI_API_KEY
        )
        self.conversation_history = []
        
    def analyze_food_image(self, image_data: bytes) -> Dict[str, Any]:
        """Analyze food image and provide diet advice"""
        try:
            # Analyze image with Vision API
            vision_analyzer = FoodVisionAnalyzer()
            detected_foods = vision_analyzer.analyze_image(image_data)
            
            # Generate diet advice
            advice = self._generate_diet_advice(detected_foods)
            
            return {
                "detected_foods": [food.dict() for food in detected_foods],
                "diet_advice": advice.dict(),
                "success": True
            }
        except Exception as e:
            logger.error(f"Error analyzing food image: {e}")
            return {
                "error": str(e),
                "success": False
            }
    
    def _generate_diet_advice(self, detected_foods: List[DetectedFood]) -> DietAdvice:
        """Generate diet advice based on detected foods"""
        foods_text = "\n".join([f"- {food.food_name} ({food.confidence:.2f})" for food in detected_foods])
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a professional nutritionist. Analyze the detected foods and provide comprehensive diet advice.
            
            Focus on:
            1. Nutritional analysis of the foods
            2. Health recommendations
            3. Healthier alternatives if needed
            4. Any warnings about the foods
            5. Macro nutrient suggestions
            
            Be specific, helpful, and health-focused."""),
            ("human", f"Detected foods:\n{foods_text}\n\nPlease provide detailed diet advice.")
        ])
        
        messages = prompt.format_messages()
        response = self.llm.invoke(messages)
        
        # Parse response (simplified)
        content = response.content
        
        return DietAdvice(
            recommendation=content,
            reasoning="AI analysis based on detected foods",
            healthier_alternatives=["More vegetables", "Lean proteins", "Whole grains"],
            warnings=["Monitor portion sizes", "Check for allergens"],
            macro_suggestions={
                "protein": "Include lean protein",
                "carbs": "Choose complex carbohydrates",
                "fats": "Opt for healthy fats"
            }
        )
    
    def chat(self, message: str, user_profile: Optional[UserProfile] = None) -> str:
        """Simple chat interface"""
        try:
            context = ""
            if user_profile:
                context = f"User profile: Age {user_profile.age}, Goal: {user_profile.goal}"
            
            prompt = ChatPromptTemplate.from_messages([
                ("system", f"""You are a helpful diet and nutrition assistant. 
                
                {context}
                
                Provide helpful, accurate nutrition advice. Be encouraging and supportive."""),
                ("human", message)
            ])
            
            messages = prompt.format_messages()
            response = self.llm.invoke(messages)
            
            # Save to conversation history
            self.conversation_history.append({"user": message, "assistant": response.content})
            
            return response.content
            
        except Exception as e:
            logger.error(f"Error in chat: {e}")
            return f"I'm sorry, I encountered an error: {str(e)}"

# Alias for backward compatibility
DietAgentChain = SimpleDietAgent