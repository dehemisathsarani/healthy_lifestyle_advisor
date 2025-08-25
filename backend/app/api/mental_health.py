"""
Mental Health API endpoints for the Healthy Lifestyle Advisor
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from ..agents.agent_manager import agent_manager
from ..auth.dependencies import get_current_user
import logging

# Create router for mental health endpoints
router = APIRouter(prefix="/api/mental-health", tags=["mental-health"])
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

class MeditationRequest(BaseModel):
    duration: int = Field(default=10, description="Preferred duration in minutes")
    focus: str = Field(default="general", description="Focus area: general, stress, anxiety, sleep, focus")
    experience: str = Field(default="beginner", description="Experience level: beginner, intermediate, advanced")

class JournalRequest(BaseModel):
    entry: str = Field(..., description="Journal entry text")

class CompanionChatRequest(BaseModel):
    message: str = Field(..., description="Message to AI companion")

class MoodTrackingRequest(BaseModel):
    mood_score: int = Field(..., ge=1, le=10, description="Daily mood score 1-10")
    notes: str = Field(default="", description="Optional notes about mood")

@router.post("/mood/analyze")
async def analyze_mood(
    request: MoodAnalysisRequest,
    current_user: dict = Depends(get_current_user)
):
    """Analyze user's mood based on various indicators"""
    try:
        agent_request = {
            "type": "mood_analysis",
            "user_id": current_user["user_id"],
            "mood_data": {
                "mood_score": request.mood_score,
                "emotions": request.emotions,
                "recent_activities": request.recent_activities,
                "sleep_quality": request.sleep_quality
            }
        }
        
        response = await agent_manager.process_request(agent_request)
        
        if "error" in response:
            raise HTTPException(status_code=500, detail=response["error"])
        
        return response
        
    except Exception as e:
        logger.error(f"Mood analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to analyze mood")

@router.post("/stress/predict")
async def predict_stress(
    request: StressPredictionRequest,
    current_user: dict = Depends(get_current_user)
):
    """Predict stress levels based on various indicators"""
    try:
        agent_request = {
            "type": "stress_prediction",
            "user_id": current_user["user_id"],
            "indicators": {
                "heart_rate": request.heart_rate,
                "sleep_hours": request.sleep_hours,
                "workload_level": request.workload_level,
                "social_interactions": request.social_interactions,
                "physical_symptoms": request.physical_symptoms
            }
        }
        
        response = await agent_manager.process_request(agent_request)
        
        if "error" in response:
            raise HTTPException(status_code=500, detail=response["error"])
        
        return response
        
    except Exception as e:
        logger.error(f"Stress prediction failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to predict stress")

@router.post("/meditation/suggest")
async def suggest_meditation(
    request: MeditationRequest,
    current_user: dict = Depends(get_current_user)
):
    """Get personalized meditation suggestions"""
    try:
        agent_request = {
            "type": "meditation_suggestion",
            "user_id": current_user["user_id"],
            "preferences": {
                "duration": request.duration,
                "focus": request.focus,
                "experience": request.experience
            }
        }
        
        response = await agent_manager.process_request(agent_request)
        
        if "error" in response:
            raise HTTPException(status_code=500, detail=response["error"])
        
        return response
        
    except Exception as e:
        logger.error(f"Meditation suggestion failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to suggest meditation")

@router.get("/breathing/exercise")
async def get_breathing_exercise(
    difficulty: str = "beginner",
    current_user: dict = Depends(get_current_user)
):
    """Get breathing exercise based on difficulty level"""
    try:
        agent_request = {
            "type": "breathing_exercise",
            "user_id": current_user["user_id"],
            "difficulty": difficulty
        }
        
        response = await agent_manager.process_request(agent_request)
        
        if "error" in response:
            raise HTTPException(status_code=500, detail=response["error"])
        
        return response
        
    except Exception as e:
        logger.error(f"Breathing exercise request failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get breathing exercise")

@router.post("/journal/entry")
async def submit_journal_entry(
    request: JournalRequest,
    current_user: dict = Depends(get_current_user)
):
    """Submit and analyze journal entry"""
    try:
        agent_request = {
            "type": "journal_entry",
            "user_id": current_user["user_id"],
            "entry": request.entry
        }
        
        response = await agent_manager.process_request(agent_request)
        
        if "error" in response:
            raise HTTPException(status_code=500, detail=response["error"])
        
        return response
        
    except Exception as e:
        logger.error(f"Journal entry submission failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process journal entry")

@router.post("/companion/chat")
async def companion_chat(
    request: CompanionChatRequest,
    current_user: dict = Depends(get_current_user)
):
    """Chat with AI companion for emotional support"""
    try:
        agent_request = {
            "type": "companion_chat",
            "user_id": current_user["user_id"],
            "message": request.message
        }
        
        response = await agent_manager.process_request(agent_request)
        
        if "error" in response:
            raise HTTPException(status_code=500, detail=response["error"])
        
        return response
        
    except Exception as e:
        logger.error(f"Companion chat failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process companion chat")

@router.post("/mood/track")
async def track_mood(
    request: MoodTrackingRequest,
    current_user: dict = Depends(get_current_user)
):
    """Track daily mood score"""
    try:
        agent_request = {
            "type": "mood_tracking",
            "user_id": current_user["user_id"],
            "mood_score": request.mood_score,
            "notes": request.notes
        }
        
        response = await agent_manager.process_request(agent_request)
        
        if "error" in response:
            raise HTTPException(status_code=500, detail=response["error"])
        
        return response
        
    except Exception as e:
        logger.error(f"Mood tracking failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to track mood")

@router.get("/wellness/report")
async def get_wellness_report(
    current_user: dict = Depends(get_current_user)
):
    """Generate comprehensive wellness report"""
    try:
        agent_request = {
            "type": "wellness_report",
            "user_id": current_user["user_id"]
        }
        
        response = await agent_manager.process_request(agent_request)
        
        if "error" in response:
            raise HTTPException(status_code=500, detail=response["error"])
        
        return response
        
    except Exception as e:
        logger.error(f"Wellness report generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate wellness report")

@router.get("/status")
async def get_mental_health_agent_status():
    """Get Mental Health Agent status (admin endpoint)"""
    try:
        status = await agent_manager.get_system_status()
        return {
            "mental_health_agent": status.get("agents", {}).get("mental_health", {}),
            "system_initialized": status.get("initialized", False)
        }
        
    except Exception as e:
        logger.error(f"Status check failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get agent status")

@router.get("/health")
async def health_check():
    """Health check endpoint for Mental Health Agent"""
    try:
        health = await agent_manager.health_check()
        mental_health_status = health.get("agents", {}).get("mental_health", {})
        
        if mental_health_status.get("healthy", False):
            return {"status": "healthy", "agent": "mental_health", "details": mental_health_status}
        else:
            raise HTTPException(
                status_code=503, 
                detail={"status": "unhealthy", "agent": "mental_health", "details": mental_health_status}
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Health check failed")
