from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import json
import uuid
import logging
from typing import Optional, List, Dict, Any
import aio_pika
from datetime import datetime, timezone, timedelta
import motor.motor_asyncio
from bson import ObjectId
import asyncio

from settings import settings
from simple_mq import simple_mq
from chain import MentalHealthAgentChain, MoodEntry, MentalHealthProfile, MentalHealthAdvice

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Mental Health AI Services", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize MongoDB connection
client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URL)
db = client[settings.DATABASE_NAME]
mental_health_collection = db["mental_health_data"]
mood_entries_collection = db["mood_entries"]
meditation_sessions_collection = db["meditation_sessions"]

# Initialize Mental Health Chain
mental_health_chain = MentalHealthAgentChain()

# Pydantic models for API
class MoodAnalysisRequest(BaseModel):
    user_id: str
    mood_score: int
    stress_level: int
    energy_level: int
    emotions: List[str]
    notes: Optional[str] = None

class MeditationRequest(BaseModel):
    user_id: str
    meditation_type: str
    duration: int
    context: Optional[str] = None

class CrisisAssessmentRequest(BaseModel):
    user_id: str
    text_content: str

class WellnessTipRequest(BaseModel):
    user_id: str

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    try:
        # Test database connection
        await client.admin.command('ping')
        logger.info("Connected to MongoDB successfully")
        
        # Initialize message queue connection
        await simple_mq.connect()
        logger.info("Connected to RabbitMQ successfully")
        
    except Exception as e:
        logger.error(f"Startup error: {str(e)}")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    try:
        await simple_mq.close()
        client.close()
        logger.info("Connections closed successfully")
    except Exception as e:
        logger.error(f"Shutdown error: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "mental_health_ai", "timestamp": datetime.now(timezone.utc)}

@app.post("/analyze-mood")
async def analyze_mood(request: MoodAnalysisRequest) -> Dict[str, Any]:
    """Analyze user mood and provide mental health recommendations"""
    try:
        # Create mood entry
        mood_entry = MoodEntry(
            user_id=request.user_id,
            timestamp=datetime.now(timezone.utc),
            mood_score=request.mood_score,
            stress_level=request.stress_level,
            energy_level=request.energy_level,
            emotions=request.emotions,
            notes=request.notes
        )
        
        # Get user profile if exists
        user_profile = None
        profile_data = await mental_health_collection.find_one({"user_id": request.user_id})
        if profile_data:
            user_profile = MentalHealthProfile(**profile_data)
        
        # Analyze mood
        advice = await mental_health_chain.analyze_mood(mood_entry, user_profile)
        
        # Save mood entry to database
        mood_entry_dict = mood_entry.dict()
        mood_entry_dict["_id"] = str(ObjectId())
        mood_entry_dict["timestamp"] = mood_entry.timestamp
        await mood_entries_collection.insert_one(mood_entry_dict)
        
        # Publish to message queue for further processing
        await simple_mq.publish_message(
            "mental_health_analysis",
            {
                "user_id": request.user_id,
                "mood_entry": mood_entry_dict,
                "advice": advice.dict(),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        )
        
        return {
            "advice": advice.dict(),
            "mood_entry_id": mood_entry_dict["_id"],
            "analysis_timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in mood analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Mood analysis failed: {str(e)}")

@app.post("/meditation-guide")
async def get_meditation_guide(request: MeditationRequest) -> Dict[str, Any]:
    """Generate personalized meditation guidance"""
    try:
        meditation_guide = await mental_health_chain.generate_meditation_guide(
            meditation_type=request.meditation_type,
            duration=request.duration,
            user_context=request.context
        )
        
        # Save meditation session
        session_data = {
            "_id": str(ObjectId()),
            "user_id": request.user_id,
            "meditation_type": request.meditation_type,
            "duration": request.duration,
            "context": request.context,
            "generated_at": datetime.now(timezone.utc),
            "guide": meditation_guide["guide"]
        }
        
        await meditation_sessions_collection.insert_one(session_data)
        
        return {
            "meditation_guide": meditation_guide,
            "session_id": session_data["_id"]
        }
        
    except Exception as e:
        logger.error(f"Error generating meditation guide: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Meditation guide generation failed: {str(e)}")

@app.post("/crisis-assessment")
async def assess_crisis(request: CrisisAssessmentRequest) -> Dict[str, Any]:
    """Assess crisis level from user text"""
    try:
        assessment = await mental_health_chain.assess_crisis_level(request.text_content)
        
        # Log crisis assessments for monitoring
        crisis_log = {
            "_id": str(ObjectId()),
            "user_id": request.user_id,
            "text_content": request.text_content[:200],  # Store first 200 chars for privacy
            "assessment": assessment,
            "timestamp": datetime.now(timezone.utc)
        }
        
        # If high crisis level, trigger immediate notifications
        if assessment["immediate_action_needed"]:
            await simple_mq.publish_message(
                "crisis_alert",
                {
                    "user_id": request.user_id,
                    "crisis_level": assessment["crisis_level"],
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "requires_immediate_attention": True
                }
            )
        
        return {
            "assessment": assessment,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in crisis assessment: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Crisis assessment failed: {str(e)}")

@app.post("/wellness-tip")
async def get_wellness_tip(request: WellnessTipRequest) -> Dict[str, Any]:
    """Get daily wellness tip"""
    try:
        tip = await mental_health_chain.get_daily_wellness_tip()
        
        return {
            "wellness_tip": tip,
            "user_id": request.user_id,
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error generating wellness tip: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Wellness tip generation failed: {str(e)}")

@app.get("/mood-history/{user_id}")
async def get_mood_history(user_id: str, days: int = 30) -> Dict[str, Any]:
    """Get user's mood history for the specified number of days"""
    try:
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=days)
        
        cursor = mood_entries_collection.find({
            "user_id": user_id,
            "timestamp": {"$gte": start_date, "$lte": end_date}
        }).sort("timestamp", -1)
        
        mood_entries = []
        async for entry in cursor:
            entry["_id"] = str(entry["_id"])
            mood_entries.append(entry)
        
        # Calculate averages
        if mood_entries:
            avg_mood = sum(entry["mood_score"] for entry in mood_entries) / len(mood_entries)
            avg_stress = sum(entry["stress_level"] for entry in mood_entries) / len(mood_entries)
            avg_energy = sum(entry["energy_level"] for entry in mood_entries) / len(mood_entries)
        else:
            avg_mood = avg_stress = avg_energy = 0
        
        return {
            "mood_entries": mood_entries,
            "statistics": {
                "total_entries": len(mood_entries),
                "average_mood": round(avg_mood, 2),
                "average_stress": round(avg_stress, 2),
                "average_energy": round(avg_energy, 2)
            },
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "days": days
            }
        }
        
    except Exception as e:
        logger.error(f"Error retrieving mood history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Mood history retrieval failed: {str(e)}")

@app.get("/meditation-history/{user_id}")
async def get_meditation_history(user_id: str, limit: int = 20) -> Dict[str, Any]:
    """Get user's meditation session history"""
    try:
        cursor = meditation_sessions_collection.find({
            "user_id": user_id
        }).sort("generated_at", -1).limit(limit)
        
        sessions = []
        async for session in cursor:
            session["_id"] = str(session["_id"])
            sessions.append(session)
        
        return {
            "meditation_sessions": sessions,
            "total_sessions": len(sessions)
        }
        
    except Exception as e:
        logger.error(f"Error retrieving meditation history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Meditation history retrieval failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)