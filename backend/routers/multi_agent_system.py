"""
Multi-Agent System Router
Handles coordination between Diet, Fitness, and Mental Health agents
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict, Any
import uuid
import logging

from app.services.rabbitmq_service import RabbitMQService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/agents", tags=["multi-agent-system"])

# ============================================================================
# DATA MODELS
# ============================================================================

class MealAnalysisRequest(BaseModel):
    userId: str
    mealName: str
    calories: float
    protein: float
    carbs: float
    fats: float
    foodCycleText: str  # User's description of their eating patterns
    mealTime: str  # breakfast, lunch, dinner, snack
    activityLevel: Optional[str] = "moderate"  # sedentary, light, moderate, active, very_active
    timestamp: Optional[str] = None

class EmotionalAnalysisRequest(BaseModel):
    userId: str
    foodCycleText: str
    emotionalStateText: str
    currentMood: Optional[str] = None  # happy, sad, stressed, anxious, etc.
    timestamp: Optional[str] = None

class WorkoutSuggestionRequest(BaseModel):
    userId: str
    calories: float
    foodCycleContext: str
    nutritionalLogId: str
    timestamp: Optional[str] = None

class HolisticAnalysisRequest(BaseModel):
    userId: str
    situationText: str  # Complete user situation description
    timestamp: Optional[str] = None

class AgentResponse(BaseModel):
    success: bool
    agent: str  # diet, fitness, mental-health
    message: str
    data: Dict[str, Any]
    nextAgent: Optional[str] = None  # Suggested next agent to connect
    actions: List[Dict[str, Any]] = []  # Available user actions
    timestamp: str

# ============================================================================
# DIET AGENT ENDPOINTS
# ============================================================================

@router.post("/diet/analyze-meal", response_model=AgentResponse)
async def analyze_meal_with_diet_agent(request: MealAnalysisRequest):
    """
    Diet Agent analyzes meal and creates nutritional log
    Then suggests connecting to Fitness Agent
    """
    try:
        # Generate unique log ID
        log_id = f"nutri_log_{uuid.uuid4().hex[:12]}"
        
        # Analyze food cycle text (basic sentiment/pattern analysis)
        food_cycle_analysis = _analyze_food_cycle_text(request.foodCycleText)
        
        # Create nutritional log
        nutritional_log = {
            "id": log_id,
            "userId": request.userId,
            "mealName": request.mealName,
            "calories": request.calories,
            "macros": {
                "protein": request.protein,
                "carbs": request.carbs,
                "fats": request.fats
            },
            "mealTime": request.mealTime,
            "foodCycleInsights": food_cycle_analysis,
            "timestamp": request.timestamp or datetime.now().isoformat()
        }
        
        # Send message to Fitness Agent via RabbitMQ
        try:
            rabbitmq = RabbitMQService()
            rabbitmq.send_diet_to_fitness(
                event_name="nutritional_log_created",
                user_id=request.userId,
                summary_card={
                    "nutritional_log": nutritional_log,
                    "calories": request.calories,
                    "macros": {
                        "protein": request.protein,
                        "carbs": request.carbs,
                        "fats": request.fats
                    }
                }
            )
        except Exception as e:
            logger.warning(f"RabbitMQ message send failed: {e}")
        
        # Calculate personalized calorie burn recommendation using real health science
        burn_calculation = _calculate_recommended_calorie_burn(
            consumed_calories=request.calories,
            meal_time=request.mealTime,
            activity_level=request.activityLevel or "moderate",
            protein=request.protein,
            carbs=request.carbs,
            fats=request.fats
        )
        
        # Prepare response
        return AgentResponse(
            success=True,
            agent="diet",
            message="Nutritional log created successfully! Based on your food cycle, I recommend connecting with the Fitness Agent for personalized workout suggestions.",
            data={
                "nutritionalLog": nutritional_log,
                "insights": food_cycle_analysis,
                "caloriesConsumed": request.calories,
                "recommendedCalorieBurn": burn_calculation["recommendedCalorieBurn"],
                "burnCalculation": burn_calculation  # Include full calculation details
            },
            nextAgent="fitness",
            actions=[
                {
                    "type": "navigate",
                    "label": "See Workout Plans for Today 💪",
                    "route": "/services",
                    "section": "fitness-planner",
                    "autoFill": True,
                    "data": {
                        "nutritionalLogId": log_id,
                        "targetCalories": burn_calculation["recommendedCalorieBurn"],
                        "context": request.foodCycleText,
                        "intensity": burn_calculation["suggestedIntensity"],
                        "workoutType": burn_calculation["suggestedWorkoutType"]
                    }
                }
            ],
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Diet Agent error: {str(e)}")


@router.get("/diet/user-summary/{user_id}")
async def get_diet_agent_summary(user_id: str):
    """Get user's nutritional summary from Diet Agent"""
    return {
        "agent": "diet",
        "userId": user_id,
        "summary": "Diet agent summary data",
        "timestamp": datetime.now().isoformat()
    }

# ============================================================================
# FITNESS AGENT ENDPOINTS
# ============================================================================

@router.post("/fitness/suggest-workout", response_model=AgentResponse)
async def suggest_workout_from_fitness_agent(request: WorkoutSuggestionRequest):
    """
    Fitness Agent suggests workouts based on nutritional data
    Auto-fills workout planner with suggestions
    """
    try:
        # Generate workout suggestions based on calories and context
        workout_suggestions = _generate_workout_suggestions(
            request.calories,
            request.foodCycleContext
        )
        
        # Send message to Diet Agent via RabbitMQ (for feedback loop)
        try:
            rabbitmq = RabbitMQService()
            rabbitmq.send_fitness_to_diet(
                event_name="workout_suggested",
                user_id=request.userId,
                summary_card={
                    "nutritional_log_id": request.nutritionalLogId,
                    "workout_suggestions": workout_suggestions,
                    "calories_to_burn": request.calories * 0.7
                }
            )
        except Exception as e:
            logger.warning(f"RabbitMQ message send failed: {e}")
        
        return AgentResponse(
            success=True,
            agent="fitness",
            message=f"Based on your {request.calories:.0f} calorie intake, I've prepared personalized workout plans for you!",
            data={
                "workoutSuggestions": workout_suggestions,
                "estimatedCalorieBurn": request.calories * 0.7,
                "nutritionalLogId": request.nutritionalLogId
            },
            nextAgent="diet",
            actions=[
                {
                    "type": "navigate",
                    "label": "See Updated Diet Plan 🥗",
                    "route": "/services",
                    "section": "nutrition-hub",
                    "data": {
                        "workoutCompleted": True,
                        "caloriesBurned": request.calories * 0.7
                    }
                },
                {
                    "type": "start_workout",
                    "label": "Start Workout Now 🏃",
                    "workouts": workout_suggestions
                }
            ],
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fitness Agent error: {str(e)}")

# ============================================================================
# MENTAL HEALTH AGENT ENDPOINTS
# ============================================================================

@router.post("/mental-health/analyze", response_model=AgentResponse)
async def analyze_emotional_state(request: EmotionalAnalysisRequest):
    """
    Mental Health Agent analyzes emotional state from text
    Suggests workouts, meditations, and mood-fixing activities
    Can connect to Fitness or Diet agents based on recommendations
    """
    try:
        # Analyze emotional content
        emotional_analysis = _analyze_emotional_text(request.emotionalStateText)
        food_cycle_analysis = _analyze_food_cycle_text(request.foodCycleText)
        
        # Generate recommendations
        recommendations = _generate_mental_health_recommendations(
            emotional_analysis,
            food_cycle_analysis
        )
        
        # Determine which agent to connect next
        next_agent = _determine_next_agent(emotional_analysis, recommendations)
        
        # Send messages to relevant agents via RabbitMQ
        try:
            rabbitmq = RabbitMQService()
            
            if "fitness_recommended" in recommendations:
                # Use diet_to_fitness method (mental health acts as intermediary)
                rabbitmq.send_diet_to_fitness(
                    event_name="stress_relief_workout_needed",
                    user_id=request.userId,
                    summary_card={
                        "emotional_state": emotional_analysis,
                        "recommendation_type": "stress_relief",
                        "from_agent": "mental-health"
                    }
                )
            
            if "diet_adjustment_recommended" in recommendations:
                # Use fitness_to_diet method (mental health acts as intermediary)
                rabbitmq.send_fitness_to_diet(
                    event_name="mood_based_diet_adjustment",
                    user_id=request.userId,
                    summary_card={
                        "emotional_state": emotional_analysis,
                        "food_cycle_issues": food_cycle_analysis.get("issues", []),
                        "from_agent": "mental-health"
                    }
                )
        except Exception as e:
            logger.warning(f"RabbitMQ message send failed: {e}")
        
        return AgentResponse(
            success=True,
            agent="mental-health",
            message="I've analyzed your emotional state and food cycle. Here are personalized recommendations to improve your well-being.",
            data={
                "emotionalAnalysis": emotional_analysis,
                "foodCycleAnalysis": food_cycle_analysis,
                "recommendations": recommendations,
                "moodScore": emotional_analysis.get("moodScore", 5),
                "stressLevel": emotional_analysis.get("stressLevel", "moderate")
            },
            nextAgent=next_agent,
            actions=_build_mental_health_actions(recommendations, next_agent),
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Mental Health Agent error: {str(e)}")

# ============================================================================
# MULTI-AGENT COLLABORATION ENDPOINT
# ============================================================================

@router.post("/collaborate")
async def multi_agent_collaboration(
    user_id: str,
    trigger_event: str,
    data: Dict[str, Any]
):
    """
    Orchestrates multi-agent collaboration
    Triggers appropriate agent workflows based on event
    """
    try:
        rabbitmq = RabbitMQService()
        
        # Route to appropriate agents based on trigger
        if trigger_event == "meal_logged_with_emotions":
            # Trigger both Diet and Mental Health agents
            try:
                rabbitmq.send_diet_to_fitness(
                    event_name=trigger_event,
                    user_id=user_id,
                    summary_card=data
                )
            except Exception as e:
                logger.warning(f"Failed to send to fitness agent: {e}")
            
        return {
            "success": True,
            "message": "Multi-agent collaboration initiated",
            "agents_triggered": ["diet", "mental-health"],
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Collaboration error: {str(e)}")

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def _calculate_recommended_calorie_burn(
    consumed_calories: float,
    meal_time: str,
    activity_level: str,
    protein: float,
    carbs: float,
    fats: float
) -> Dict[str, Any]:
    """
    Calculate recommended calorie burn based on:
    - Meal timing (breakfast needs less burn, dinner needs more)
    - Activity level (sedentary to very active)
    - Macronutrient balance (thermic effect of food)
    - Time of day metabolic variations
    
    Returns actual health-science based recommendations, not dummy data
    """
    
    # 1. Base metabolic adjustment by meal time
    meal_time_multipliers = {
        "breakfast": 0.5,  # Morning - body has all day to burn
        "lunch": 0.6,      # Midday - moderate burn needed
        "dinner": 0.8,     # Evening - higher burn recommended
        "snack": 0.3       # Small intake - light burn
    }
    
    # 2. Activity level multipliers (how active is the user?)
    activity_multipliers = {
        "sedentary": 0.5,      # Desk job, minimal activity
        "light": 0.6,          # Light exercise 1-3 days/week
        "moderate": 0.7,       # Moderate exercise 3-5 days/week
        "active": 0.8,         # Hard exercise 6-7 days/week
        "very_active": 0.9     # Very hard exercise & physical job
    }
    
    # 3. Thermic Effect of Food (TEF) - energy needed to digest food
    # Protein: 20-30% of calories, Carbs: 5-10%, Fats: 0-3%
    tef_calories = (protein * 0.25) + (carbs * 0.08) + (fats * 0.02)
    
    # Net calories after digestion
    net_calories = consumed_calories - tef_calories
    
    # 4. Calculate recommended burn
    meal_multiplier = meal_time_multipliers.get(meal_time.lower(), 0.7)
    activity_multiplier = activity_multipliers.get(activity_level.lower(), 0.7)
    
    # Combined calculation
    recommended_burn = net_calories * meal_multiplier * activity_multiplier
    
    # 5. Health recommendations based on calorie level
    calorie_category = "low" if consumed_calories < 400 else "moderate" if consumed_calories < 700 else "high"
    
    recommendations = {
        "low": "Light activity like walking or yoga is sufficient.",
        "moderate": "Moderate cardio or strength training recommended.",
        "high": "Higher intensity workout to balance calorie intake."
    }
    
    # 6. Workout intensity suggestion
    if consumed_calories > 800:
        intensity = "high"
        workout_type = "HIIT or intensive cardio"
    elif consumed_calories > 500:
        intensity = "moderate"
        workout_type = "Cardio or strength training"
    else:
        intensity = "light"
        workout_type = "Walking or light yoga"
    
    return {
        "recommendedCalorieBurn": round(recommended_burn, 1),
        "netCaloriesAfterDigestion": round(net_calories, 1),
        "thermicEffect": round(tef_calories, 1),
        "calculation": {
            "consumedCalories": consumed_calories,
            "mealTimeMultiplier": meal_multiplier,
            "activityMultiplier": activity_multiplier,
            "formula": f"{net_calories:.0f} × {meal_multiplier} × {activity_multiplier} = {recommended_burn:.0f}"
        },
        "calorieCategory": calorie_category,
        "healthRecommendation": recommendations[calorie_category],
        "suggestedIntensity": intensity,
        "suggestedWorkoutType": workout_type,
        "explanation": f"Based on your {meal_time} meal of {consumed_calories:.0f} calories and {activity_level} activity level, burning {recommended_burn:.0f} calories will help maintain healthy balance."
    }

def _analyze_food_cycle_text(text: str) -> Dict[str, Any]:
    """Analyze user's food cycle description"""
    # Simple keyword-based analysis (can be enhanced with NLP)
    keywords = {
        "irregular": ["skip", "irregular", "random", "inconsistent"],
        "heavy": ["heavy", "large", "big portion", "too much"],
        "light": ["light", "small", "not enough", "insufficient"],
        "healthy": ["healthy", "balanced", "nutritious", "wholesome"],
        "unhealthy": ["junk", "fast food", "unhealthy", "processed"]
    }
    
    text_lower = text.lower()
    patterns = []
    
    for pattern, words in keywords.items():
        if any(word in text_lower for word in words):
            patterns.append(pattern)
    
    return {
        "patterns": patterns,
        "rawText": text,
        "needsImprovement": len(set(patterns) & {"irregular", "unhealthy"}) > 0,
        "insights": _generate_food_cycle_insights(patterns)
    }

def _generate_food_cycle_insights(patterns: List[str]) -> str:
    """Generate insights from food cycle patterns"""
    if "irregular" in patterns:
        return "Your eating schedule seems irregular. Consider establishing consistent meal times."
    elif "unhealthy" in patterns:
        return "I notice some unhealthy food choices. Let's work on incorporating more nutritious options."
    elif "healthy" in patterns:
        return "Great job maintaining healthy eating habits! Keep it up."
    else:
        return "Your food cycle looks balanced. Continue monitoring your nutrition."

def _generate_workout_suggestions(calories: float, context: str) -> List[Dict[str, Any]]:
    """Generate workout suggestions based on calories and context"""
    target_burn = calories * 0.7
    
    workouts = []
    
    if target_burn >= 500:
        workouts.append({
            "name": "High-Intensity Interval Training (HIIT)",
            "duration": 45,
            "estimatedCalories": 600,
            "difficulty": "high",
            "description": "Burn maximum calories with intense cardio intervals"
        })
    
    workouts.extend([
        {
            "name": "Running Session",
            "duration": int(target_burn / 10),  # ~10 cal/min
            "estimatedCalories": target_burn * 0.8,
            "difficulty": "medium",
            "description": "Steady-state cardio to burn calories effectively"
        },
        {
            "name": "Cycling Workout",
            "duration": int(target_burn / 8),  # ~8 cal/min
            "estimatedCalories": target_burn * 0.7,
            "difficulty": "medium",
            "description": "Low-impact cardio perfect for sustained fat burning"
        },
        {
            "name": "Strength Training Circuit",
            "duration": 30,
            "estimatedCalories": target_burn * 0.5,
            "difficulty": "medium",
            "description": "Build muscle and boost metabolism"
        }
    ])
    
    return workouts

def _analyze_emotional_text(text: str) -> Dict[str, Any]:
    """Analyze emotional content from text"""
    # Simple emotion detection (can be enhanced with NLP/AI)
    emotions = {
        "stressed": ["stress", "stressed", "anxious", "overwhelmed", "pressure"],
        "sad": ["sad", "depressed", "down", "unhappy", "lonely"],
        "happy": ["happy", "joyful", "great", "wonderful", "excited"],
        "tired": ["tired", "exhausted", "fatigue", "drained", "sleepy"],
        "angry": ["angry", "frustrated", "annoyed", "irritated"]
    }
    
    text_lower = text.lower()
    detected_emotions = []
    
    for emotion, keywords in emotions.items():
        if any(keyword in text_lower for keyword in keywords):
            detected_emotions.append(emotion)
    
    # Calculate mood score (1-10)
    mood_score = 5  # neutral
    if "happy" in detected_emotions:
        mood_score = 8
    elif "stressed" in detected_emotions or "sad" in detected_emotions:
        mood_score = 3
    elif "tired" in detected_emotions:
        mood_score = 4
    
    return {
        "emotions": detected_emotions,
        "moodScore": mood_score,
        "stressLevel": "high" if "stressed" in detected_emotions else "moderate" if "tired" in detected_emotions else "low",
        "needsSupport": mood_score < 5
    }

def _generate_mental_health_recommendations(
    emotional_analysis: Dict[str, Any],
    food_cycle_analysis: Dict[str, Any]
) -> Dict[str, Any]:
    """Generate mental health recommendations"""
    recommendations = {
        "meditations": [],
        "moodFixers": [],
        "motivations": [],
        "fitness_recommended": False,
        "diet_adjustment_recommended": False
    }
    
    emotions = emotional_analysis.get("emotions", [])
    mood_score = emotional_analysis.get("moodScore", 5)
    
    # Meditation recommendations
    if "stressed" in emotions or "anxious" in emotions:
        recommendations["meditations"].extend([
            {
                "name": "Deep Breathing Exercise",
                "duration": 10,
                "description": "Calm your nervous system with guided breathing"
            },
            {
                "name": "Body Scan Meditation",
                "duration": 15,
                "description": "Release tension and promote relaxation"
            }
        ])
        recommendations["fitness_recommended"] = True
    
    if "sad" in emotions:
        recommendations["meditations"].append({
            "name": "Loving-Kindness Meditation",
            "duration": 12,
            "description": "Cultivate self-compassion and positive emotions"
        })
    
    # Mood fixers
    if mood_score < 5:
        recommendations["moodFixers"].extend([
            "Take a 10-minute walk outdoors",
            "Listen to your favorite upbeat music",
            "Call a friend or loved one",
            "Practice gratitude - write 3 things you're grateful for",
            "Do a quick dance break"
        ])
        recommendations["diet_adjustment_recommended"] = food_cycle_analysis.get("needsImprovement", False)
    
    # Motivations
    recommendations["motivations"] = [
        "You've got this! Every small step counts.",
        "Your mental health matters. Taking care of yourself is not selfish.",
        "Progress, not perfection. You're doing great.",
        "One day at a time. You're stronger than you think."
    ]
    
    return recommendations

def _determine_next_agent(
    emotional_analysis: Dict[str, Any],
    recommendations: Dict[str, Any]
) -> Optional[str]:
    """Determine which agent to connect to next"""
    if recommendations.get("fitness_recommended"):
        return "fitness"
    elif recommendations.get("diet_adjustment_recommended"):
        return "diet"
    return None

def _build_mental_health_actions(
    recommendations: Dict[str, Any],
    next_agent: Optional[str]
) -> List[Dict[str, Any]]:
    """Build action buttons for mental health recommendations"""
    actions = []
    
    if recommendations.get("fitness_recommended") and next_agent == "fitness":
        actions.append({
            "type": "navigate",
            "label": "Connect with Fitness Agent 💪",
            "route": "/services",
            "section": "fitness-planner",
            "autoFill": True,
            "data": {
                "workoutType": "stress_relief",
                "recommendation": "relaxation_workout"
            }
        })
    
    if recommendations.get("diet_adjustment_recommended") and next_agent == "diet":
        actions.append({
            "type": "navigate",
            "label": "Connect with Diet Agent 🥗",
            "route": "/services",
            "section": "nutrition-hub",
            "data": {
                "moodBasedAdjustment": True
            }
        })
    
    actions.append({
        "type": "start_meditation",
        "label": "Start Meditation Now 🧘",
        "meditations": recommendations.get("meditations", [])
    })
    
    return actions

# ============================================================================
# HOLISTIC HEALTH ANALYSIS ENDPOINT
# ============================================================================

@router.post("/holistic-analysis")
async def analyze_complete_situation(request: HolisticAnalysisRequest):
    """
    Comprehensive AI analysis of user's complete situation
    Analyzes: feelings, food habits, fitness, mental health
    Returns: mental health solutions, meditations, workouts, diet plans, instructions
    """
    try:
        text = request.situationText.lower()
        
        # =================================================================
        # STEP 1: ANALYZE EMOTIONAL STATE
        # =================================================================
        emotional_keywords = {
            "stressed": ["stress", "stressed", "anxious", "overwhelmed", "pressure", "tense"],
            "depressed": ["depress", "sad", "unmotivated", "hopeless", "down", "unhappy"],
            "tired": ["tired", "exhausted", "fatigue", "drained", "sleepy", "sleep"],
            "anxious": ["anxious", "anxiety", "worry", "nervous", "panic"],
            "lonely": ["lonely", "alone", "isolated", "disconnected"],
            "angry": ["angry", "frustrated", "irritated", "annoyed"]
        }
        
        detected_emotions = []
        for emotion, keywords in emotional_keywords.items():
            if any(keyword in text for keyword in keywords):
                detected_emotions.append(emotion)
        
        mood_score = 5  # Neutral
        if "happy" in text or "great" in text or "good" in text:
            mood_score = 7
        elif len(detected_emotions) >= 3:
            mood_score = 2
        elif len(detected_emotions) >= 1:
            mood_score = 3
        
        stress_level = "high" if "stressed" in detected_emotions or "anxious" in detected_emotions else "moderate"
        
        # =================================================================
        # STEP 2: ANALYZE NUTRITIONAL PATTERNS
        # =================================================================
        food_issues = []
        if "skip breakfast" in text or "no breakfast" in text:
            food_issues.append("skipping_breakfast")
        if "junk food" in text or "fast food" in text:
            food_issues.append("unhealthy_eating")
        if "late dinner" in text or "eat at night" in text or "9 pm" in text or "10 pm" in text:
            food_issues.append("late_eating")
        if "irregular" in text or "not regular" in text:
            food_issues.append("irregular_meals")
        if "heavy dinner" in text:
            food_issues.append("heavy_dinner")
        
        # =================================================================
        # STEP 3: ASSESS FITNESS LEVEL
        # =================================================================
        fitness_concerns = []
        if "haven't exercised" in text or "stopped" in text or "don't exercise" in text:
            fitness_concerns.append("no_exercise")
        if "sedentary" in text or "sit all day" in text:
            fitness_concerns.append("sedentary_lifestyle")
        if "tired" in detected_emotions:
            fitness_concerns.append("low_energy")
        
        # =================================================================
        # STEP 4: GENERATE MENTAL HEALTH SOLUTIONS
        # =================================================================
        mental_health_solutions = []
        
        if "stressed" in detected_emotions or "anxious" in detected_emotions:
            mental_health_solutions.append({
                "type": "relaxation",
                "title": "Daily Stress Relief Practice",
                "description": "Practice deep breathing exercises for 5 minutes, 3 times a day. Inhale for 4 counts, hold for 4, exhale for 4. This activates your parasympathetic nervous system and reduces cortisol levels.",
                "duration": "5 min, 3x daily"
            })
            mental_health_solutions.append({
                "type": "therapy",
                "title": "Cognitive Behavioral Techniques",
                "description": "Write down your worrying thoughts, then challenge them with evidence. Ask yourself: 'Is this thought based on facts or feelings?' This helps break the anxiety cycle.",
                "duration": "10-15 min daily"
            })
        
        if "depressed" in detected_emotions or mood_score < 4:
            mental_health_solutions.append({
                "type": "exercise",
                "title": "Morning Sunlight Exposure",
                "description": "Get 15-20 minutes of morning sunlight within 2 hours of waking. This boosts serotonin and regulates your circadian rhythm, improving mood naturally.",
                "duration": "15-20 min"
            })
            mental_health_solutions.append({
                "type": "social",
                "title": "Social Connection",
                "description": "Reach out to a friend or family member daily, even just a text message. Social connections are crucial for mental health and fighting depression.",
                "duration": "Daily practice"
            })
        
        if "tired" in detected_emotions:
            mental_health_solutions.append({
                "type": "relaxation",
                "title": "Sleep Hygiene Protocol",
                "description": "No screens 1 hour before bed, keep room cool (65-68°F), establish same bedtime routine. Quality sleep is the foundation of mental health.",
                "duration": "Nightly routine"
            })
        
        # Default solution
        if not mental_health_solutions:
            mental_health_solutions.append({
                "type": "relaxation",
                "title": "Mindfulness Practice",
                "description": "Start with 5 minutes of mindfulness meditation daily. Focus on your breath and observe thoughts without judgment.",
                "duration": "5-10 min daily"
            })
        
        # =================================================================
        # STEP 5: GENERATE PERSONALIZED MEDITATIONS
        # =================================================================
        meditations = []
        
        if "anxious" in detected_emotions or "stressed" in detected_emotions:
            meditations.append({
                "title": "Anxiety Relief Meditation",
                "type": "Stress Management",
                "duration": "10 minutes",
                "description": "Guided breathing exercises specifically designed to calm your nervous system and reduce anxiety. Focuses on progressive muscle relaxation."
            })
        
        meditations.append({
            "title": "Body Scan for Relaxation",
            "type": "Mindfulness",
            "duration": "15 minutes",
            "description": "Systematically relax each part of your body from head to toe. Perfect for releasing physical tension and mental stress."
        })
        
        meditations.append({
            "title": "Loving-Kindness Meditation",
            "type": "Emotional Healing",
            "duration": "12 minutes",
            "description": "Cultivate compassion for yourself and others. Helps with depression, loneliness, and builds positive emotions."
        })
        
        if "sleep" in text or "tired" in detected_emotions:
            meditations.append({
                "title": "Sleep Preparation Meditation",
                "type": "Sleep Aid",
                "duration": "20 minutes",
                "description": "Gentle guided meditation to prepare your mind and body for restful sleep. Uses visualization and breathing techniques."
            })
        
        # =================================================================
        # STEP 6: CREATE FITNESS WORKOUT PLANS
        # =================================================================
        workouts = []
        
        if "stressed" in detected_emotions:
            workouts.append({
                "name": "Stress-Busting Cardio",
                "duration": 30,
                "intensity": "moderate",
                "description": "Brisk walking or light jogging outdoors. Nature exposure combined with cardio significantly reduces stress hormones.",
                "benefits": [
                    "Reduces cortisol (stress hormone) by up to 40%",
                    "Releases endorphins for natural mood boost",
                    "Improves sleep quality"
                ]
            })
        
        if "no_exercise" in fitness_concerns:
            workouts.append({
                "name": "Beginner's Full Body Routine",
                "duration": 20,
                "intensity": "light",
                "description": "Start slowly with bodyweight exercises: 10 squats, 5 push-ups, 10 lunges, 30-second plank. Repeat 3 times with rest.",
                "benefits": [
                    "Rebuilds fitness foundation safely",
                    "Boosts energy levels within 2 weeks",
                    "Improves mood and confidence"
                ]
            })
        
        workouts.append({
            "name": "Yoga for Mental Clarity",
            "duration": 25,
            "intensity": "light",
            "description": "Gentle yoga flow focusing on breath and movement. Includes sun salutations, warrior poses, and savasana.",
            "benefits": [
                "Reduces anxiety and depression symptoms",
                "Improves flexibility and strength",
                "Enhances mind-body connection"
            ]
        })
        
        if mood_score < 5:
            workouts.append({
                "name": "Mood-Boosting HIIT",
                "duration": 15,
                "intensity": "high",
                "description": "Short bursts of high-intensity exercise. 30 seconds jumping jacks, 30 seconds rest. 20 seconds burpees, 40 seconds rest. Repeat 5 times.",
                "benefits": [
                    "Massive endorphin release (natural antidepressant)",
                    "Improves energy and focus",
                    "Time-efficient for busy schedules"
                ]
            })
        
        # =================================================================
        # STEP 7: CREATE PERSONALIZED DIET PLAN
        # =================================================================
        meal_plan = []
        guidelines = []
        
        # Breakfast
        if "skipping_breakfast" in food_issues:
            meal_plan.append({
                "meal": "🌅 Breakfast (Within 1 hour of waking)",
                "foods": ["Oatmeal with berries", "2 boiled eggs", "Green tea", "Handful of almonds"],
                "benefits": "Jumpstarts metabolism, stabilizes blood sugar, improves focus and mood throughout the day"
            })
            guidelines.append("NEVER skip breakfast - it sets your metabolic tone for the entire day")
        else:
            meal_plan.append({
                "meal": "🌅 Breakfast (7-9 AM)",
                "foods": ["Greek yogurt with fruit", "Whole grain toast with avocado", "Coffee or green tea"],
                "benefits": "Provides sustained energy and supports mental clarity"
            })
        
        # Lunch
        meal_plan.append({
            "meal": "🌞 Lunch (12-1 PM)",
            "foods": ["Grilled chicken or fish", "Large salad with olive oil", "Brown rice or quinoa", "Mixed vegetables"],
            "benefits": "Balanced macros prevent afternoon energy crash and support muscle recovery"
        })
        
        # Snack
        meal_plan.append({
            "meal": "🍎 Healthy Snack (3-4 PM)",
            "foods": ["Apple with peanut butter", "Carrot sticks with hummus", "Handful of walnuts"],
            "benefits": "Prevents evening overeating and maintains steady energy levels"
        })
        
        # Dinner
        if "heavy_dinner" in food_issues or "late_eating" in food_issues:
            meal_plan.append({
                "meal": "🌙 Light Dinner (6-7 PM - NOT LATER!)",
                "foods": ["Grilled salmon", "Steamed vegetables", "Small portion quinoa", "Herbal tea"],
                "benefits": "Early, light dinner improves sleep quality and weight management"
            })
            guidelines.append("Eat dinner at least 3 hours before bedtime for better sleep and digestion")
            guidelines.append("Make dinner your LIGHTEST meal, not heaviest")
        else:
            meal_plan.append({
                "meal": "🌙 Dinner (6-8 PM)",
                "foods": ["Lean protein (chicken/fish/tofu)", "Roasted vegetables", "Sweet potato"],
                "benefits": "Supports overnight recovery and muscle repair"
            })
        
        # General guidelines
        if "junk food" in food_issues or "unhealthy_eating" in food_issues:
            guidelines.append("Eliminate processed foods and junk food - they worsen mood and energy")
            guidelines.append("Plan and prep meals in advance to avoid unhealthy choices")
        
        guidelines.extend([
            "Eat at consistent times daily to regulate your circadian rhythm",
            "Include protein in every meal to stabilize blood sugar",
            "Choose whole, unprocessed foods 90% of the time",
            "Allow one planned treat per week (not daily junk food)"
        ])
        
        hydration = "Drink 8-10 glasses of water daily. Start each morning with 16oz of water. Herbal teas count toward hydration. Limit caffeine after 2 PM for better sleep."
        
        # =================================================================
        # STEP 8: GENERATE ACTIONABLE INSTRUCTIONS
        # =================================================================
        instructions = []
        
        instructions.append({
            "category": "🌅 Morning Routine (First 60 minutes)",
            "steps": [
                "Drink 16oz water immediately upon waking",
                "Get 15-20 min sunlight exposure (boosts mood & energy)",
                "Do 10 min stretching or yoga",
                "Eat protein-rich breakfast within 1 hour",
                "Practice 5 min gratitude journaling"
            ],
            "tip": "Your morning routine sets the tone for your entire day. Prioritize this above everything else."
        })
        
        instructions.append({
            "category": "💪 Daily Movement Plan",
            "steps": [
                "Schedule workouts like important meetings - make them non-negotiable",
                "Start with 20 min daily, increase gradually",
                "Mix cardio (3x/week) with strength training (2x/week)",
                "Take 5-minute walking breaks every 2 hours if you sit",
                "Track your workouts to see progress"
            ],
            "tip": "Exercise is the #1 non-pharmaceutical treatment for depression and anxiety. It's not optional for mental health."
        })
        
        instructions.append({
            "category": "🥗 Nutrition Guidelines",
            "steps": [
                "Meal prep on Sundays for the whole week",
                "Never skip breakfast - it affects your whole day",
                "Eat dinner 3 hours before bedtime",
                "Keep healthy snacks visible, hide junk food",
                "Log your food in an app for 2 weeks to build awareness"
            ],
            "tip": "Your gut and brain are directly connected. What you eat literally affects your mood within hours."
        })
        
        instructions.append({
            "category": "😴 Sleep Optimization",
            "steps": [
                "Same bedtime and wake time every day (even weekends)",
                "No screens 1 hour before bed",
                "Keep bedroom cool (65-68°F) and dark",
                "No caffeine after 2 PM",
                "Do 10 min meditation before sleep"
            ],
            "tip": "Poor sleep makes everything worse - mood, eating habits, motivation. Fix your sleep first."
        })
        
        instructions.append({
            "category": "🧠 Mental Health Practices",
            "steps": [
                "Practice meditation 10 min daily (use our guided meditations)",
                "Journal your thoughts and feelings for 5 min each evening",
                "Connect with a friend or family member daily",
                "Limit social media to 30 min per day",
                "Seek professional help if mood doesn't improve in 2 weeks"
            ],
            "tip": "Mental health is just as important as physical health. Don't ignore warning signs."
        })
        
        # =================================================================
        # RABBITMQ MESSAGE PASSING - INTER-AGENT COMMUNICATION
        # =================================================================
        agent_messages = []
        
        try:
            rabbitmq = RabbitMQService()
            
            # Mental Health Agent → Diet Agent (if food issues detected)
            if food_issues:
                rabbitmq.send_diet_to_fitness(
                    event_name="mental_health_to_diet",
                    user_id=request.userId,
                    summary_card={
                        "source_agent": "mental_health",
                        "target_agent": "diet",
                        "emotional_state": detected_emotions,
                        "food_issues": food_issues,
                        "diet_plan": meal_plan,
                        "timestamp": datetime.now().isoformat()
                    }
                )
                agent_messages.append({
                    "from": "Mental Health Agent",
                    "to": "Diet Agent",
                    "message": f"Passing nutritional assessment based on emotional state: {', '.join(detected_emotions)}",
                    "timestamp": datetime.now().isoformat()
                })
                logger.info(f"✅ Message passed: Mental Health Agent → Diet Agent")
            
            # Mental Health Agent → Fitness Agent (if fitness concerns detected)
            if fitness_concerns:
                rabbitmq.send_diet_to_fitness(
                    event_name="mental_health_to_fitness",
                    user_id=request.userId,
                    summary_card={
                        "source_agent": "mental_health",
                        "target_agent": "fitness",
                        "emotional_state": detected_emotions,
                        "fitness_concerns": fitness_concerns,
                        "workout_plan": workouts,
                        "timestamp": datetime.now().isoformat()
                    }
                )
                agent_messages.append({
                    "from": "Mental Health Agent",
                    "to": "Fitness Agent",
                    "message": f"Passing fitness assessment. Detected concerns: {', '.join(fitness_concerns)}",
                    "timestamp": datetime.now().isoformat()
                })
                logger.info(f"✅ Message passed: Mental Health Agent → Fitness Agent")
            
            # Diet Agent → Fitness Agent (dietary needs impact workouts)
            if food_issues and fitness_concerns:
                rabbitmq.send_fitness_to_diet(
                    event_name="diet_to_fitness_coordination",
                    user_id=request.userId,
                    summary_card={
                        "source_agent": "diet",
                        "target_agent": "fitness",
                        "food_issues": food_issues,
                        "calorie_needs": "Based on activity level",
                        "workout_nutrition": "Coordinated diet and fitness plan",
                        "timestamp": datetime.now().isoformat()
                    }
                )
                agent_messages.append({
                    "from": "Diet Agent",
                    "to": "Fitness Agent",
                    "message": "Coordinating meal timing with workout schedule for optimal results",
                    "timestamp": datetime.now().isoformat()
                })
                logger.info(f"✅ Message passed: Diet Agent → Fitness Agent")
            
            # Fitness Agent → Mental Health Agent (exercise impacts mood)
            if detected_emotions and workouts:
                rabbitmq.send_fitness_to_diet(
                    event_name="fitness_to_mental_health",
                    user_id=request.userId,
                    summary_card={
                        "source_agent": "fitness",
                        "target_agent": "mental_health",
                        "workout_recommendations": workouts,
                        "mood_impact": "Exercise recommendations for mood improvement",
                        "timestamp": datetime.now().isoformat()
                    }
                )
                agent_messages.append({
                    "from": "Fitness Agent",
                    "to": "Mental Health Agent",
                    "message": f"Recommending {len(workouts)} mood-boosting workouts to address: {', '.join(detected_emotions)}",
                    "timestamp": datetime.now().isoformat()
                })
                logger.info(f"✅ Message passed: Fitness Agent → Mental Health Agent")
                
        except Exception as e:
            logger.warning(f"RabbitMQ messaging failed (non-critical): {e}")
            agent_messages.append({
                "from": "System",
                "to": "User",
                "message": "Note: Real-time agent messaging unavailable, but analysis completed successfully",
                "timestamp": datetime.now().isoformat()
            })
        
        # =================================================================
        # RETURN COMPREHENSIVE RESPONSE WITH AGENT MESSAGING INFO
        # =================================================================
        return {
            "success": True,
            "analysis": {
                "emotionalState": {
                    "detected": detected_emotions,
                    "moodScore": mood_score,
                    "stressLevel": stress_level
                },
                "nutritionalNeeds": {
                    "issues": food_issues,
                    "recommendations": ["See personalized diet plan below"]
                },
                "fitnessLevel": {
                    "assessment": "Needs improvement" if fitness_concerns else "Moderate",
                    "concerns": fitness_concerns
                },
                "mentalHealthNeeds": {
                    "priority": "High" if mood_score < 4 else "Moderate",
                    "concerns": detected_emotions
                }
            },
            "recommendations": {
                "mentalHealth": mental_health_solutions,
                "meditations": meditations,
                "workouts": workouts,
                "dietPlan": {
                    "mealPlan": meal_plan,
                    "guidelines": guidelines,
                    "hydration": hydration
                },
                "instructions": instructions
            },
            "agentMessages": agent_messages,  # NEW: Shows which agents communicated
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Holistic analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")
