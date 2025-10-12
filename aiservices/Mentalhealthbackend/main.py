from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx
import json
import uuid
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import motor.motor_asyncio
from pydantic import BaseModel
import jwt

from models import User, UserMentalHealthProfile, MoodEntry, MoodAnalysis, InterventionHistory
from settings import settings
from mq import RabbitMQClient
from utils import verify_token, get_current_user

# Setup logging
logging.basicConfig(level=getattr(logging, settings.LOG_LEVEL))
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Mental Health Agent Backend API",
    description="Backend service for the AI-powered mental health agent system",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Global connections
db_client = None
db = None
rabbitmq_client = None
ai_service_client = None

# Request/Response Models
class MoodAnalysisRequest(BaseModel):
    text: str
    user_id: Optional[str] = None

class MoodAnalysisResponse(BaseModel):
    mood: str
    confidence: str
    reason: str
    suggestions: Optional[List[str]] = None

class YouTubeTrackResponse(BaseModel):
    title: str
    artist: str
    youtube_id: str
    duration: str
    mood_type: str
    embed_url: str

class JokeResponse(BaseModel):
    joke: str
    type: str
    safe: bool
    source: str

class FunnyImageResponse(BaseModel):
    url: str
    description: str
    type: str

class HistoryResponse(BaseModel):
    history: List[Dict[str, Any]]
    total_count: int
    page: int
    per_page: int

class CrisisResources(BaseModel):
    crisis_detected: bool
    resources: List[Dict[str, Any]]
    message: str
    priority: str

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for the mental health backend"""
    return {
        "status": "healthy",
        "service": "Mental Health Backend",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }

# Database startup/shutdown
@app.on_event("startup")
async def startup_event():
    """Initialize connections on startup"""
    global db_client, db, rabbitmq_client, ai_service_client
    
    try:
        # MongoDB connection
        db_client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URL)
        db = db_client[settings.DATABASE_NAME]
        logger.info("🗄️ Connected to MongoDB")
        
        # RabbitMQ connection
        rabbitmq_client = RabbitMQClient()
        await rabbitmq_client.connect()
        logger.info("🐰 Connected to RabbitMQ")
        
        # AI service client
        ai_service_client = httpx.AsyncClient(
            base_url=settings.AI_SERVICE_URL,
            timeout=httpx.Timeout(30.0)
        )
        logger.info("🤖 AI service client initialized")
        
    except Exception as e:
        logger.error(f"❌ Startup failed: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up connections on shutdown"""
    global db_client, rabbitmq_client, ai_service_client
    
    if db_client:
        db_client.close()
        logger.info("🗄️ MongoDB connection closed")
    
    if rabbitmq_client:
        await rabbitmq_client.close()
        logger.info("🐰 RabbitMQ connection closed")
    
    if ai_service_client:
        await ai_service_client.aclose()
        logger.info("🤖 AI service client closed")

# Mental Health Routes
@app.post("/analyze-mood", response_model=MoodAnalysisResponse)
async def analyze_mood(
    request: MoodAnalysisRequest,
    current_user=Depends(get_current_user)
):
    """Analyze user's mood from text input"""
    try:
        # Send request to AI service
        response = await ai_service_client.post(
            "/mental-health/analyze-mood",
            json=request.dict()
        )
        response.raise_for_status()
        
        analysis = response.json()
        return MoodAnalysisResponse(**analysis)
        
    except httpx.HTTPError as e:
        logger.error(f"AI service error: {e}")
        raise HTTPException(status_code=503, detail="AI service unavailable")
    except Exception as e:
        logger.error(f"Mood analysis error: {e}")
        raise HTTPException(status_code=500, detail="Mood analysis failed")

@app.get("/get-joke", response_model=JokeResponse)
async def get_joke(mood: str = "neutral"):
    """Get a mood-appropriate joke"""
    try:
        response = await ai_service_client.get(f"/mental-health/joke?mood={mood}")
        response.raise_for_status()
        
        joke_data = response.json()
        return JokeResponse(**joke_data)
        
    except Exception as e:
        logger.error(f"Joke retrieval error: {e}")
        raise HTTPException(status_code=500, detail="Could not retrieve joke")

@app.get("/get-youtube-track", response_model=YouTubeTrackResponse)
async def get_youtube_track(mood: str = "neutral"):
    """Get a mood-appropriate YouTube music track"""
    try:
        response = await ai_service_client.get(f"/mental-health/youtube-track?mood={mood}")
        response.raise_for_status()
        
        track_data = response.json()
        return YouTubeTrackResponse(**track_data)
        
    except Exception as e:
        logger.error(f"YouTube track retrieval error: {e}")
        raise HTTPException(status_code=500, detail="Could not retrieve music track")

@app.get("/get-funny-image", response_model=FunnyImageResponse)
async def get_funny_image(mood: str = "neutral"):
    """Get a mood-appropriate funny image"""
    try:
        response = await ai_service_client.get(f"/mental-health/funny-image?mood={mood}")
        response.raise_for_status()
        
        image_data = response.json()
        return FunnyImageResponse(**image_data)
        
    except Exception as e:
        logger.error(f"Funny image retrieval error: {e}")
        raise HTTPException(status_code=500, detail="Could not retrieve funny image")

@app.post("/save-mood-entry")
async def save_mood_entry(
    mood_entry: MoodEntry,
    current_user=Depends(get_current_user)
):
    """Save a mood entry to the database"""
    try:
        mood_data = mood_entry.dict()
        mood_data["user_id"] = current_user["user_id"]
        mood_data["timestamp"] = datetime.utcnow()
        
        result = await db.mood_entries.insert_one(mood_data)
        
        return {
            "success": True,
            "mood_entry_id": str(result.inserted_id),
            "message": "Mood entry saved successfully"
        }
        
    except Exception as e:
        logger.error(f"Save mood entry error: {e}")
        raise HTTPException(status_code=500, detail="Could not save mood entry")

@app.get("/history", response_model=HistoryResponse)
async def get_history(
    page: int = 1,
    per_page: int = 10,
    current_user=Depends(get_current_user)
):
    """Get user's mental health history"""
    try:
        skip = (page - 1) * per_page
        
        cursor = db.mood_entries.find(
            {"user_id": current_user["user_id"]}
        ).sort("timestamp", -1).skip(skip).limit(per_page)
        
        history = []
        async for entry in cursor:
            entry["_id"] = str(entry["_id"])
            history.append(entry)
        
        total_count = await db.mood_entries.count_documents(
            {"user_id": current_user["user_id"]}
        )
        
        return HistoryResponse(
            history=history,
            total_count=total_count,
            page=page,
            per_page=per_page
        )
        
    except Exception as e:
        logger.error(f"History retrieval error: {e}")
        raise HTTPException(status_code=500, detail="Could not retrieve history")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8006)