"""
Mental Health API endpoints for the Healthy Lifestyle Advisor
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from ..agents.agent_manager import agent_manager
from ..auth.dependencies import get_current_user
from ..core.uplift_apis import get_random_joke, get_random_activity
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
    
class JournalUpdateRequest(BaseModel):
    entry: str = Field(..., description="Journal entry text about current mood influences")
    
class MedicationInfoRequest(BaseModel):
    medication_name: str = Field(..., description="Name of medication to get information about")

@router.post("/mood/analyze")
async def analyze_mood(
    request: MoodAnalysisRequest,
    current_user: dict = Depends(get_current_user)
):
    """Analyze user's mood based on various indicators"""
    try:
        agent_request = {
            "type": "mood_analysis",
            "user_id": current_user["_id"],
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
            "user_id": current_user["_id"],
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
            "user_id": current_user["_id"],
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
            "user_id": current_user["_id"],
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
            "user_id": current_user["_id"],
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
            "user_id": current_user["_id"],
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
        logger.info(f"Mood tracking request from user {current_user.get('_id', 'unknown')}")
        agent_request = {
            "type": "mood_tracking",
            "user_id": current_user["_id"],
            "mood_score": request.mood_score,
            "notes": request.notes
        }
        
        response = await agent_manager.process_request(agent_request)
        
        if "error" in response:
            logger.error(f"Agent returned error: {response['error']}")
            raise HTTPException(status_code=500, detail=response["error"])
        
        logger.info(f"Mood tracking successful for user {current_user['_id']}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Mood tracking failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to track mood")

@router.get("/wellness/report")
async def get_wellness_report(
    current_user: dict = Depends(get_current_user)
):
    """Generate comprehensive wellness report"""
    try:
        agent_request = {
            "type": "wellness_report",
            "user_id": current_user["_id"]
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

@router.get("/mood/history")
async def get_mood_history(
    days: int = 7,
    current_user: dict = Depends(get_current_user)
):
    """Get mood history for visualization"""
    try:
        agent_request = {
            "type": "mood_history",
            "user_id": current_user["_id"],
            "days": days
        }
        
        response = await agent_manager.process_request(agent_request)
        
        if "error" in response:
            raise HTTPException(status_code=500, detail=response["error"])
        
        return response
        
    except Exception as e:
        logger.error(f"Mood history request failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get mood history")

@router.get("/uplift/more")
async def get_more_uplift(
    current_user: dict = Depends(get_current_user)
):
    """Get more uplift content (jokes and activities) to improve mood"""
    try:
        joke = await get_random_joke()
        activity = await get_random_activity()
        
        return {
            "joke": joke,
            "activity": activity,
            "message": "Here's something else to brighten your day!"
        }
            
    except Exception as e:
        logger.error(f"Uplift content request failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get uplift content")

@router.get("/wellness/breathing")
async def get_breathing_exercise(
    technique: str = Query("box", description="Breathing technique type (box)"),
    current_user: dict = Depends(get_current_user)
):
    """Get breathing exercise instructions (box breathing 4-4-4-4)"""
    try:
        agent_request = {
            "type": "breathing_exercise",
            "user_id": current_user["_id"],
            "technique": technique
        }
        
        response = await agent_manager.process_request(agent_request)
        
        if "error" in response:
            raise HTTPException(status_code=500, detail=response["error"])
        
        return response
            
    except Exception as e:
        logger.error(f"Breathing exercise request failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get breathing exercise")

@router.get("/wellness/grounding")
async def get_grounding_technique():
    """Get 5-4-3-2-1 grounding technique for anxiety"""
    try:
        logger.info("Grounding technique request received")
        agent_request = {
            "type": "grounding_technique",
            "user_id": "temp_user"  # Temporary user ID for testing
        }
        
        logger.info(f"Sending request to agent manager: {agent_request}")
        response = await agent_manager.process_request(agent_request)
        logger.info(f"Response received from agent: {response}")
        
        if "error" in response:
            logger.error(f"Error in agent response: {response['error']}")
            raise HTTPException(status_code=500, detail=response["error"])
        
        return response
            
    except Exception as e:
        logger.error(f"Grounding technique request failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get grounding technique: {str(e)}")

@router.get("/wellness/gratitude")
async def get_gratitude_prompt():
    """Get a gratitude prompt for reflection"""
    try:
        logger.info("Gratitude prompt request received")
        agent_request = {
            "type": "gratitude_prompt",
            "user_id": "temp_user"  # Temporary user ID for testing
        }
        
        logger.info(f"Sending request to agent manager: {agent_request}")
        response = await agent_manager.process_request(agent_request)
        logger.info(f"Response received from agent: {response}")
        
        if "error" in response:
            logger.error(f"Error in agent response: {response['error']}")
            raise HTTPException(status_code=500, detail=response["error"])
        
        return response
            
    except Exception as e:
        logger.error(f"Gratitude prompt request failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get gratitude prompt: {str(e)}")

@router.get("/wellness/routine")
async def get_wellness_routine(
    area: str = Query("general", description="Wellness area (sleep, nutrition, movement, social, or general)"),
    current_user: dict = Depends(get_current_user)
):
    """Get gentle wellness routine suggestions"""
    try:
        agent_request = {
            "type": "wellness_routine",
            "user_id": current_user["_id"],
            "area": area
        }
        
        response = await agent_manager.process_request(agent_request)
        
        if "error" in response:
            raise HTTPException(status_code=500, detail=response["error"])
        
        return response
            
    except Exception as e:
        logger.error(f"Wellness routine request failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get wellness routine")

@router.post("/journal/mood-update")
async def update_mood_journal(
    request: JournalUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update journal with entry about mood influences"""
    try:
        agent_request = {
            "type": "journal_entry",
            "user_id": current_user["_id"],
            "entry": request.entry,
            "entry_type": "mood_reflection"
        }
        
        response = await agent_manager.process_request(agent_request)
        
        if "error" in response:
            raise HTTPException(status_code=500, detail=response["error"])
        
        return response
            
    except Exception as e:
        logger.error(f"Journal mood update failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update mood journal")

@router.post("/education/medication")
async def get_medication_information(
    request: MedicationInfoRequest,
    current_user: dict = Depends(get_current_user)
):
    """Get evidence-based medication information (educational only, not medical advice)"""
    try:
        agent_request = {
            "type": "medication_info",
            "user_id": current_user["_id"],
            "medication_name": request.medication_name
        }
        
        response = await agent_manager.process_request(agent_request)
        
        if "error" in response:
            raise HTTPException(status_code=500, detail=response["error"])
        
        return response
            
    except Exception as e:
        logger.error(f"Medication information request failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get medication information")

@router.get("/education/health-topic")
async def get_health_topic_information(
    topic: str = Query(..., description="Health topic to get information about"),
    current_user: dict = Depends(get_current_user)
):
    """Get evidence-based health topic information (educational only, not medical advice)"""
    try:
        agent_request = {
            "type": "health_topic",
            "user_id": current_user["_id"],
            "topic": topic
        }
        
        response = await agent_manager.process_request(agent_request)
        
        if "error" in response:
            raise HTTPException(status_code=500, detail=response["error"])
        
        return response
            
    except Exception as e:
        logger.error(f"Health topic information request failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get health topic information")
