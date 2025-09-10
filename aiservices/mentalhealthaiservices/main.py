"""
Mental Health AI Service - Main Entry Point
"""

from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
import logging
import os
import json
import uvicorn
from datetime import datetime, timedelta
import random

# Create FastAPI app
app = FastAPI(
    title="Mental Health AI Service",
    description="AI-powered mental health analysis, mood tracking, and wellness recommendations",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pydantic models for request/response validation
class MoodAnalysisRequest(BaseModel):
    mood_score: int = Field(..., ge=1, le=10, description="Mood score from 1-10")
    emotions: list[str] = Field(default=[], description="List of emotions")
    recent_activities: list[str] = Field(default=[], description="Recent activities")
    sleep_quality: int = Field(default=5, ge=1, le=10, description="Sleep quality from 1-10")

class StressPredictionRequest(BaseModel):
    heart_rate: Optional[int] = Field(default=70, description="Heart rate in BPM")
    sleep_hours: Optional[float] = Field(default=8, description="Hours of sleep")
    workload_level: int = Field(default=5, ge=1, le=10, description="Workload level 1-10")
    social_interactions: int = Field(default=5, ge=1, le=10, description="Social interaction level 1-10")
    physical_symptoms: list[str] = Field(default=[], description="Physical symptoms")

class MeditationSuggestionRequest(BaseModel):
    duration: int = Field(default=10, ge=5, le=60, description="Desired meditation duration in minutes")
    focus: str = Field(default="general", description="Focus area (stress, anxiety, sleep, etc.)")
    experience: str = Field(default="beginner", description="User experience level")

# Mental health agent functionality
def get_grounding_technique():
    """Return a grounding technique to help with anxiety or stress"""
    techniques = [
        {
            "name": "5-4-3-2-1 Technique",
            "description": "Identify 5 things you can see, 4 things you can touch, 3 things you can hear, 2 things you can smell, and 1 thing you can taste.",
            "benefits": ["Reduces anxiety", "Brings focus to the present", "Interrupts worry cycles"],
            "steps": [
                "Look around and name 5 things you can see",
                "Name 4 things you can physically touch or feel",
                "Listen carefully and name 3 things you can hear",
                "Identify 2 things you can smell (or like to smell)",
                "Name 1 thing you can taste (or would like to taste)"
            ],
            "duration": "5 minutes",
            "difficulty": "easy"
        },
        {
            "name": "Body Scan",
            "description": "Systematically focus attention on different parts of the body, from head to toe, observing sensations without judgment.",
            "benefits": ["Releases physical tension", "Increases body awareness", "Reduces stress"],
            "steps": [
                "Find a comfortable position sitting or lying down",
                "Close your eyes and take several deep breaths",
                "Bring attention to your feet, noticing any sensations",
                "Slowly move attention upward through each part of your body",
                "Notice areas of tension and consciously relax them"
            ],
            "duration": "10 minutes",
            "difficulty": "medium"
        },
        {
            "name": "Object Focus",
            "description": "Select an object in your environment and focus on it intensely, noting all of its characteristics.",
            "benefits": ["Interrupts anxious thoughts", "Improves concentration", "Anchors you to the present"],
            "steps": [
                "Choose an object nearby",
                "Examine its color, texture, shape, and size",
                "Notice any patterns, imperfections, or unique features",
                "Consider its function, origin, or meaning",
                "If your mind wanders, gently return focus to the object"
            ],
            "duration": "3-5 minutes",
            "difficulty": "easy"
        }
    ]
    
    return random.choice(techniques)

def get_gratitude_prompt():
    """Return a gratitude prompt to improve positive mindset"""
    prompts = [
        {
            "title": "Unexpected Blessings",
            "prompt": "What are three unexpected good things that happened today or this week?",
            "explanation": "Recognizing unexpected positive events helps train the brain to notice more good things in life.",
            "benefits": ["Increases positive emotions", "Improves optimism", "Enhances resilience"],
            "follow_up": "How did these unexpected good things make you feel?"
        },
        {
            "title": "Simple Pleasures",
            "prompt": "What simple pleasures or small joys did you experience today?",
            "explanation": "Appreciating everyday joys increases overall life satisfaction.",
            "benefits": ["Enhances present-moment awareness", "Increases contentment", "Reduces hedonic adaptation"],
            "follow_up": "How can you incorporate more of these small joys into your daily routine?"
        },
        {
            "title": "Support Network",
            "prompt": "Who are the people in your life that you're grateful for? Why?",
            "explanation": "Recognizing our social connections strengthens relationships and improves well-being.",
            "benefits": ["Strengthens relationships", "Increases feelings of connection", "Reduces loneliness"],
            "follow_up": "How might you express your appreciation to one of these people this week?"
        }
    ]
    
    return random.choice(prompts)

def get_wellness_routine():
    """Return a suggested wellness routine"""
    routines = [
        {
            "title": "Morning Energizer",
            "description": "A morning routine to boost energy and set a positive tone for the day",
            "activities": [
                {"name": "5-minute stretching", "duration": "5 mins", "benefit": "Improves circulation and flexibility"},
                {"name": "Mindful breathing", "duration": "3 mins", "benefit": "Reduces stress and increases focus"},
                {"name": "Gratitude journaling", "duration": "5 mins", "benefit": "Improves mood and outlook"},
                {"name": "Hydration", "duration": "1 min", "benefit": "Rehydrates body after sleep"}
            ],
            "time_of_day": "morning",
            "difficulty": "easy",
            "total_duration": "15 minutes"
        },
        {
            "title": "Midday Reset",
            "description": "A midday routine to combat stress and restore energy",
            "activities": [
                {"name": "Short walk", "duration": "10 mins", "benefit": "Boosts energy and creativity"},
                {"name": "Deep breathing", "duration": "3 mins", "benefit": "Reduces stress and tension"},
                {"name": "Mindful eating", "duration": "15 mins", "benefit": "Improves digestion and satisfaction"}
            ],
            "time_of_day": "afternoon",
            "difficulty": "easy",
            "total_duration": "28 minutes"
        },
        {
            "title": "Evening Wind-Down",
            "description": "An evening routine to improve sleep quality and transition to rest",
            "activities": [
                {"name": "Digital sunset", "duration": "60+ mins", "benefit": "Improves sleep quality"},
                {"name": "Gentle yoga", "duration": "10 mins", "benefit": "Releases physical tension"},
                {"name": "Reflection journaling", "duration": "5 mins", "benefit": "Processes daily experiences"},
                {"name": "Reading", "duration": "15 mins", "benefit": "Relaxes mind and prepares for sleep"}
            ],
            "time_of_day": "evening",
            "difficulty": "medium",
            "total_duration": "30+ minutes"
        }
    ]
    
    return random.choice(routines)

def get_box_breathing():
    """Return instructions for box breathing exercise"""
    return {
        "name": "Box Breathing",
        "description": "A simple breathing technique to reduce stress and improve focus",
        "benefits": [
            "Reduces stress and anxiety",
            "Improves concentration",
            "Regulates autonomic nervous system",
            "Can lower blood pressure",
            "Promotes mindfulness"
        ],
        "steps": [
            "Sit in a comfortable position with your back straight",
            "Slowly exhale completely through your mouth",
            "Inhale slowly through your nose to a count of 4",
            "Hold your breath for a count of 4",
            "Exhale slowly through your mouth for a count of 4",
            "Hold your breath for a count of 4",
            "Repeat the cycle 4-5 times or for up to 5 minutes"
        ],
        "visualization": "Imagine tracing the four sides of a square as you breathe - up, across, down, and across",
        "recommended_duration": "5 minutes",
        "variations": [
            "Extend counts to 5 or 6 as you become more comfortable",
            "Place one hand on chest and one on stomach to ensure diaphragmatic breathing"
        ]
    }

# API Routes
@app.get("/")
async def root():
    """Root endpoint for the Mental Health AI Service"""
    return {
        "service": "Mental Health AI Service",
        "status": "running",
        "version": "1.0.0",
        "endpoints": [
            "/api/mental-health/analyze-mood",
            "/api/mental-health/predict-stress",
            "/api/mental-health/meditation/suggest",
            "/api/mental-health/wellness/breathing-exercise",
            "/api/mental-health/wellness/grounding-technique",
            "/api/mental-health/wellness/gratitude-prompt",
            "/api/mental-health/wellness/routine"
        ]
    }

@app.post("/api/mental-health/analyze-mood")
async def analyze_mood(request: MoodAnalysisRequest):
    """Analyze user's mood and provide insights"""
    logger.info(f"Mood analysis request received: {request}")
    
    # Simple mood analysis logic
    mood_category = "positive" if request.mood_score >= 7 else "neutral" if request.mood_score >= 4 else "negative"
    
    analysis = {
        "mood_category": mood_category,
        "analysis": f"Your mood score of {request.mood_score}/10 indicates a {mood_category} mood state.",
        "insights": [
            f"Your sleep quality of {request.sleep_quality}/10 is {'good' if request.sleep_quality >= 7 else 'moderate' if request.sleep_quality >= 5 else 'poor'}",
            f"You reported feeling {', '.join(request.emotions) if request.emotions else 'no specific emotions'}",
            f"Recent activities include {', '.join(request.recent_activities) if request.recent_activities else 'none reported'}"
        ],
        "recommendations": []
    }
    
    # Add recommendations based on mood
    if mood_category == "negative":
        analysis["recommendations"].extend([
            "Consider doing a 5-minute breathing exercise",
            "Engage in light physical activity like walking",
            "Reach out to a friend or family member"
        ])
    elif mood_category == "neutral":
        analysis["recommendations"].extend([
            "Practice gratitude by noting 3 things you appreciate",
            "Take a short break from screens"
        ])
    else:
        analysis["recommendations"].extend([
            "Share your positive energy with someone",
            "Journal about what contributed to your good mood"
        ])
    
    return analysis

@app.post("/api/mental-health/predict-stress")
async def predict_stress(request: StressPredictionRequest):
    """Predict stress levels based on physiological and behavioral indicators"""
    logger.info(f"Stress prediction request received: {request}")
    
    # Simple weighted stress prediction
    stress_factors = {
        "workload": request.workload_level * 2,  # Higher weight for workload
        "social": (10 - request.social_interactions) * 1.5,  # Inverted, less social interaction can increase stress
        "heart_rate": (request.heart_rate - 60) * 0.1 if request.heart_rate > 60 else 0,  # Only count elevated HR
        "sleep": (8 - request.sleep_hours) * 2 if request.sleep_hours < 8 else 0,  # Sleep deficit
        "symptoms": len(request.physical_symptoms) * 3  # Physical symptoms are strong indicators
    }
    
    # Calculate stress score (0-100)
    stress_score = min(100, sum(stress_factors.values()))
    
    # Determine stress level
    stress_level = "high" if stress_score > 60 else "moderate" if stress_score > 30 else "low"
    
    return {
        "stress_score": round(stress_score, 1),
        "stress_level": stress_level,
        "analysis": f"Your current stress level appears to be {stress_level}.",
        "contributing_factors": [k for k, v in stress_factors.items() if v > 5],
        "recommendations": get_stress_recommendations(stress_level)
    }

def get_stress_recommendations(stress_level: str) -> List[str]:
    """Generate recommendations based on stress level"""
    if stress_level == "high":
        return [
            "Consider speaking with a mental health professional",
            "Try the box breathing technique (4-4-4-4 pattern)",
            "Take short breaks throughout the day",
            "Limit caffeine and alcohol consumption",
            "Ensure you're getting 7-9 hours of sleep"
        ]
    elif stress_level == "moderate":
        return [
            "Practice a 10-minute meditation",
            "Take a walk outside in nature",
            "Connect with a supportive friend or family member",
            "Engage in a hobby or activity you enjoy"
        ]
    else:
        return [
            "Maintain your current wellness practices",
            "Consider keeping a gratitude journal",
            "Continue monitoring your stress levels"
        ]

@app.post("/api/mental-health/meditation/suggest")
async def suggest_meditation(request: MeditationSuggestionRequest):
    """Suggest meditation based on user preferences"""
    logger.info(f"Meditation suggestion request received: {request}")
    
    # Dictionary of meditation programs by focus area
    meditation_programs = {
        "stress": [
            {
                "title": "Calm in the Storm",
                "description": "A meditation focused on finding stillness in stressful situations",
                "duration_minutes": max(5, min(request.duration, 20)),
                "difficulty": "beginner" if request.experience == "beginner" else "intermediate",
                "instructions": [
                    "Find a comfortable seated position",
                    "Close your eyes and take 3 deep breaths",
                    "Scan your body for tension and release it",
                    "Visualize yourself as a mountain - solid and unmoving while weather (stress) passes around you",
                    "Return to regular breathing, maintaining the image of stability"
                ],
                "benefits": ["Reduces cortisol levels", "Improves emotional regulation", "Builds stress resilience"]
            },
            {
                "title": "Mindful Release",
                "description": "A progressive relaxation meditation to release stress from the body",
                "duration_minutes": max(8, min(request.duration, 25)),
                "difficulty": "beginner",
                "instructions": [
                    "Lie down or sit comfortably",
                    "Take several deep breaths",
                    "Starting with your toes, tense each muscle group for 5 seconds, then release",
                    "Move upward through your entire body",
                    "After completing the body scan, rest in awareness of your relaxed state"
                ],
                "benefits": ["Reduces physical tension", "Improves body awareness", "Decreases stress symptoms"]
            }
        ],
        "anxiety": [
            {
                "title": "Grounding Breath",
                "description": "A meditation focused on using breath as an anchor during anxious moments",
                "duration_minutes": max(5, min(request.duration, 15)),
                "difficulty": "beginner",
                "instructions": [
                    "Find a seated position or lie down",
                    "Place one hand on your chest and one on your abdomen",
                    "Breathe deeply into your abdomen, feeling your hand rise",
                    "Count your breaths from 1 to 10, then start over",
                    "When thoughts arise, gently acknowledge them and return to counting"
                ],
                "benefits": ["Reduces anxious thoughts", "Activates parasympathetic nervous system", "Improves focus"]
            }
        ],
        "sleep": [
            {
                "title": "Peaceful Descent",
                "description": "A body scan meditation designed to prepare for sleep",
                "duration_minutes": max(10, min(request.duration, 30)),
                "difficulty": "beginner",
                "instructions": [
                    "Lie down in bed in a comfortable position",
                    "Take three deep breaths, extending the exhale",
                    "Starting from your feet, bring awareness to each part of your body",
                    "Visualize each body part becoming heavy and relaxed",
                    "If your mind wanders, gently return to the last body part you focused on"
                ],
                "benefits": ["Reduces time to fall asleep", "Improves sleep quality", "Releases physical tension"]
            }
        ],
        "general": [
            {
                "title": "Present Moment Awareness",
                "description": "A simple meditation to develop mindfulness and present-moment awareness",
                "duration_minutes": request.duration,
                "difficulty": request.experience,
                "instructions": [
                    "Sit in a comfortable position with a straight back",
                    "Close your eyes or maintain a soft gaze",
                    "Bring attention to your breath, noticing the sensations",
                    "When your mind wanders, gently bring attention back to the breath",
                    "Continue for the duration, simply observing without judgment"
                ],
                "benefits": ["Improves concentration", "Reduces rumination", "Increases self-awareness"]
            }
        ]
    }
    
    # Select appropriate meditations based on focus
    focus_area = request.focus.lower()
    available_meditations = meditation_programs.get(
        focus_area, 
        meditation_programs["general"]  # Fallback to general meditations
    )
    
    # Select appropriate meditation based on experience level and duration
    appropriate_meditations = [
        m for m in available_meditations 
        if (request.experience == "beginner" and m["difficulty"] == "beginner") or 
           (request.experience != "beginner")
    ]
    
    if not appropriate_meditations:
        appropriate_meditations = available_meditations
    
    # Select meditation closest to requested duration
    selected = min(
        appropriate_meditations, 
        key=lambda m: abs(m["duration_minutes"] - request.duration)
    )
    
    return selected

@app.get("/api/mental-health/wellness/breathing-exercise")
async def get_breathing_exercise():
    """Return a breathing exercise"""
    logger.info("Breathing exercise request received")
    return get_box_breathing()

@app.get("/api/mental-health/wellness/grounding-technique")
async def get_grounding_technique_api():
    """Return a grounding technique"""
    logger.info("Grounding technique request received")
    return get_grounding_technique()

@app.get("/api/mental-health/wellness/gratitude-prompt")
async def get_gratitude_prompt_api():
    """Return a gratitude prompt"""
    logger.info("Gratitude prompt request received")
    return get_gratitude_prompt()

@app.get("/api/mental-health/wellness/routine")
async def get_wellness_routine_api():
    """Return a wellness routine"""
    logger.info("Wellness routine request received")
    return get_wellness_routine()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
