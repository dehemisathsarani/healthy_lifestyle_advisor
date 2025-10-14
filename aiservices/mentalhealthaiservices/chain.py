from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, PromptTemplate
from langchain.chains import LLMChain
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, ConfigDict
import json
import logging
import asyncio
from datetime import datetime, timezone

from settings import settings

logger = logging.getLogger(__name__)

class MoodEntry(BaseModel):
    user_id: str
    timestamp: datetime
    mood_score: int  # 1-10
    stress_level: int  # 1-10
    energy_level: int  # 1-10
    emotions: List[str]
    notes: Optional[str] = None

class MentalHealthProfile(BaseModel):
    user_id: str
    age: int
    gender: str
    stress_triggers: List[str] = []
    coping_strategies: List[str] = []
    therapy_preferences: List[str] = []
    crisis_contacts: List[str] = []

class MentalHealthAdvice(BaseModel):
    recommendation: str
    reasoning: str
    intervention_type: str  # immediate, daily_practice, long_term
    resources: List[str]
    crisis_level: int  # 1-5 (5 being crisis requiring immediate attention)
    meditation_suggestion: Optional[str] = None
    breathing_exercise: Optional[str] = None

class MentalHealthAgentChain:
    def __init__(self):
        self.llm = ChatOpenAI(
            model_name=settings.MODEL_NAME,
            temperature=0.7,  # Slightly higher for empathetic responses
            max_tokens=settings.MAX_TOKENS,
            openai_api_key=settings.OPENAI_API_KEY
        )
        
        # Initialize conversation history for context
        self.conversation_history = []
        
        # Mental health specific prompts
        self.mood_analysis_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a compassionate mental health assistant. Analyze the user's mood and provide supportive guidance.
            
            Guidelines:
            - Be empathetic and non-judgmental
            - Provide practical coping strategies
            - Recognize crisis situations and escalate when needed
            - Suggest appropriate interventions based on mood patterns
            - Include breathing exercises or meditation when helpful
            - Always remind users to seek professional help for serious concerns
            
            Crisis indicators:
            - Mentions of self-harm or suicide
            - Extreme hopelessness or despair
            - Substance abuse concerns
            - Inability to function in daily life
            
            Response format: JSON with recommendation, reasoning, intervention_type, resources, crisis_level (1-5), and optional meditation_suggestion or breathing_exercise."""),
            ("human", "{mood_data}")
        ])
        
        self.stress_management_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a stress management specialist. Provide personalized stress reduction techniques based on user context.
            
            Focus areas:
            - Immediate stress relief techniques
            - Long-term stress management strategies
            - Workplace stress solutions
            - Relationship stress guidance
            - Academic pressure management
            
            Include specific, actionable advice that can be implemented immediately."""),
            ("human", "{stress_context}")
        ])
        
        self.meditation_guide_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a meditation and mindfulness guide. Create personalized meditation sessions based on user needs.
            
            Types of meditation to consider:
            - Breathing meditation for anxiety
            - Body scan for stress relief
            - Loving-kindness for depression
            - Mindfulness for general well-being
            - Walking meditation for restlessness
            
            Provide step-by-step instructions with timing and gentle guidance."""),
            ("human", "{meditation_request}")
        ])

    async def analyze_mood(self, mood_entry: MoodEntry, user_profile: Optional[MentalHealthProfile] = None) -> MentalHealthAdvice:
        """Analyze mood data and provide mental health recommendations"""
        try:
            # Prepare context including mood history if available
            mood_context = {
                "current_mood": {
                    "score": mood_entry.mood_score,
                    "stress": mood_entry.stress_level,
                    "energy": mood_entry.energy_level,
                    "emotions": mood_entry.emotions,
                    "notes": mood_entry.notes
                },
                "user_profile": user_profile.dict() if user_profile else None,
                "timestamp": mood_entry.timestamp.isoformat()
            }
            
            # Format conversation history for context
            history_context = self._format_conversation_history()
            
            mood_data = f"""
            Current Mood Analysis Request:
            {json.dumps(mood_context, indent=2)}
            
            Previous Conversation Context:
            {history_context}
            
            Please analyze this mood data and provide appropriate mental health guidance.
            """
            
            response = await self.llm.ainvoke(
                self.mood_analysis_prompt.format(mood_data=mood_data)
            )
            
            # Parse response
            try:
                advice_data = json.loads(response.content)
                advice = MentalHealthAdvice(**advice_data)
            except json.JSONDecodeError:
                # Fallback if JSON parsing fails
                advice = MentalHealthAdvice(
                    recommendation=response.content,
                    reasoning="AI analysis of current mood state",
                    intervention_type="daily_practice",
                    resources=["Consider speaking with a mental health professional"],
                    crisis_level=2 if mood_entry.mood_score <= 3 else 1
                )
            
            # Update conversation history
            self.conversation_history.append({
                "timestamp": mood_entry.timestamp.isoformat(),
                "mood_score": mood_entry.mood_score,
                "advice": advice.recommendation
            })
            
            return advice
            
        except Exception as e:
            logger.error(f"Error in mood analysis: {str(e)}")
            # Return safe fallback advice
            return MentalHealthAdvice(
                recommendation="I'm having trouble analyzing your mood right now. Please take some deep breaths and consider reaching out to a trusted friend or mental health professional if you're feeling distressed.",
                reasoning="System error occurred during analysis",
                intervention_type="immediate",
                resources=["National Suicide Prevention Lifeline: 988", "Crisis Text Line: Text HOME to 741741"],
                crisis_level=2
            )

    async def generate_meditation_guide(self, meditation_type: str, duration: int, user_context: Optional[str] = None) -> Dict[str, Any]:
        """Generate personalized meditation guidance"""
        try:
            meditation_request = f"""
            Meditation Request:
            - Type: {meditation_type}
            - Duration: {duration} minutes
            - User Context: {user_context or 'General relaxation'}
            
            Please provide a step-by-step guided meditation with:
            1. Preparation instructions
            2. Main meditation steps with timing
            3. Closing and integration
            4. Benefits explanation
            """
            
            response = await self.llm.ainvoke(
                self.meditation_guide_prompt.format(meditation_request=meditation_request)
            )
            
            return {
                "meditation_type": meditation_type,
                "duration": duration,
                "guide": response.content,
                "generated_at": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error generating meditation guide: {str(e)}")
            return {
                "meditation_type": meditation_type,
                "duration": duration,
                "guide": "Take a comfortable position and focus on your breathing. Breathe in slowly for 4 counts, hold for 4, and breathe out for 4. Continue this pattern throughout your meditation.",
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "error": "Generated fallback meditation due to system error"
            }

    async def assess_crisis_level(self, text_content: str) -> Dict[str, Any]:
        """Assess crisis level from user text input"""
        crisis_keywords = [
            "suicide", "kill myself", "end it all", "can't go on", "worthless",
            "hopeless", "self-harm", "hurt myself", "want to die", "no point"
        ]
        
        crisis_score = 0
        detected_keywords = []
        
        text_lower = text_content.lower()
        for keyword in crisis_keywords:
            if keyword in text_lower:
                crisis_score += 1
                detected_keywords.append(keyword)
        
        # Basic crisis assessment
        if crisis_score >= 3:
            crisis_level = 5  # High crisis
        elif crisis_score >= 2:
            crisis_level = 4  # Moderate crisis
        elif crisis_score >= 1:
            crisis_level = 3  # Mild crisis indicators
        else:
            crisis_level = 1  # No crisis indicators
        
        return {
            "crisis_level": crisis_level,
            "detected_keywords": detected_keywords,
            "immediate_action_needed": crisis_level >= 4,
            "resources": self._get_crisis_resources() if crisis_level >= 3 else []
        }

    def _get_crisis_resources(self) -> List[str]:
        """Get crisis intervention resources"""
        return [
            "National Suicide Prevention Lifeline: 988",
            "Crisis Text Line: Text HOME to 741741",
            "Emergency Services: 911",
            "SAMHSA National Helpline: 1-800-662-4357"
        ]

    def _format_conversation_history(self) -> str:
        """Format recent conversation history for context"""
        if not self.conversation_history:
            return "No previous conversation history."
        
        # Get last 3 entries for context
        recent_history = self.conversation_history[-3:]
        formatted = []
        
        for entry in recent_history:
            formatted.append(f"- {entry['timestamp']}: Mood {entry['mood_score']}/10 - {entry['advice'][:100]}...")
        
        return "\n".join(formatted)

    async def get_daily_wellness_tip(self) -> str:
        """Generate daily mental wellness tip"""
        tips_prompt = """Generate a brief, encouraging mental wellness tip for today. 
        Include a practical action the user can take to improve their mental well-being.
        Keep it positive, actionable, and under 100 words."""
        
        try:
            response = await self.llm.ainvoke([HumanMessage(content=tips_prompt)])
            return response.content
        except Exception as e:
            logger.error(f"Error generating wellness tip: {str(e)}")
            return "Take a moment today to practice gratitude. Write down three things you're thankful for, no matter how small. This simple practice can help shift your mindset and improve your overall mood."

# Initialize the chain
mental_health_chain = MentalHealthAgentChain()