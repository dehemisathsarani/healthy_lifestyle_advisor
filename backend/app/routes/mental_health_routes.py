from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import httpx
import random
import re
from datetime import datetime, timedelta
import os
from bson import ObjectId

from ..core.database import get_database
from ..models.mental_health_models import (
    MoodEntryModel, 
    InterventionModel, 
    UserMentalHealthProfileModel,
    MoodAnalyticsModel
)

router = APIRouter(prefix="/mental-health", tags=["Mental Health"])

# Models
class MoodAnalysisRequest(BaseModel):
    text: str
    user_id: Optional[str] = None

class MoodAnalysisResponse(BaseModel):
    detected_mood: str
    confidence: float
    message: str
    suggestions: List[str]

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
    caption: str

class HistoryRequest(BaseModel):
    user_id: str
    item_type: str
    content: Dict[str, Any]

class HistoryResponse(BaseModel):
    user_id: str
    items: List[Dict[str, Any]]
    total_count: int

# Mood-based YouTube playlists
YOUTUBE_PLAYLISTS = {
    "sad": [
        {"title": "Weightless", "artist": "Marconi Union", "youtube_id": "UfcAVejslrU", "duration": "8:08", "mood_type": "calm"},
        {"title": "Claire de Lune", "artist": "Claude Debussy", "youtube_id": "CvFH_6DNRCY", "duration": "5:20", "mood_type": "calm"},
        {"title": "Gymnopédie No. 1", "artist": "Erik Satie", "youtube_id": "S-Xm7s9eGM8", "duration": "4:32", "mood_type": "calm"},
        {"title": "Mad World", "artist": "Gary Jules", "youtube_id": "4N3N1MlvVc4", "duration": "3:07", "mood_type": "calm"},
        {"title": "The Sound of Silence", "artist": "Simon & Garfunkel", "youtube_id": "4fWyzwo1xg0", "duration": "3:05", "mood_type": "calm"}
    ],
    "anxious": [
        {"title": "Weightless", "artist": "Marconi Union", "youtube_id": "UfcAVejslrU", "duration": "8:08", "mood_type": "meditation"},
        {"title": "Aqueous Transmission", "artist": "Incubus", "youtube_id": "3k0-sGqxIiQ", "duration": "7:49", "mood_type": "meditation"},
        {"title": "Breathe Me", "artist": "Sia", "youtube_id": "hSH7fblcGWM", "duration": "4:30", "mood_type": "meditation"},
        {"title": "River", "artist": "Leon Bridges", "youtube_id": "0Hegd4xNfRo", "duration": "4:02", "mood_type": "meditation"},
        {"title": "Holocene", "artist": "Bon Iver", "youtube_id": "TWcyIpul8OE", "duration": "5:36", "mood_type": "meditation"}
    ],
    "angry": [
        {"title": "Happy", "artist": "Pharrell Williams", "youtube_id": "ZbZSe6N_BXs", "duration": "3:53", "mood_type": "upbeat"},
        {"title": "Can't Stop the Feeling", "artist": "Justin Timberlake", "youtube_id": "ru0K8uYEZWw", "duration": "3:56", "mood_type": "upbeat"},
        {"title": "Uptown Funk", "artist": "Mark Ronson ft. Bruno Mars", "youtube_id": "OPf0YbXqDm0", "duration": "4:30", "mood_type": "upbeat"},
        {"title": "Good as Hell", "artist": "Lizzo", "youtube_id": "SmbmeOgWsqE", "duration": "2:39", "mood_type": "upbeat"},
        {"title": "Shake It Off", "artist": "Taylor Swift", "youtube_id": "nfWlot6h_JM", "duration": "3:39", "mood_type": "upbeat"}
    ],
    "tired": [
        {"title": "Stronger", "artist": "Kelly Clarkson", "youtube_id": "Xn676-fLq7I", "duration": "3:42", "mood_type": "motivational"},
        {"title": "Eye of the Tiger", "artist": "Survivor", "youtube_id": "btPJPFnesV4", "duration": "4:05", "mood_type": "motivational"},
        {"title": "Don't Stop Believin'", "artist": "Journey", "youtube_id": "1k8craCGpgs", "duration": "4:09", "mood_type": "motivational"},
        {"title": "Roar", "artist": "Katy Perry", "youtube_id": "CevxZvSJLk8", "duration": "3:43", "mood_type": "motivational"},
        {"title": "Fight Song", "artist": "Rachel Platten", "youtube_id": "xo1VInw-SKc", "duration": "3:24", "mood_type": "motivational"}
    ],
    "happy": [
        {"title": "Walking on Sunshine", "artist": "Katrina and the Waves", "youtube_id": "iPUmE-tne5U", "duration": "3:59", "mood_type": "upbeat"},
        {"title": "Good Vibrations", "artist": "The Beach Boys", "youtube_id": "Eab_beh07HU", "duration": "3:39", "mood_type": "upbeat"},
        {"title": "Mr. Blue Sky", "artist": "Electric Light Orchestra", "youtube_id": "wuJIqmha2Hc", "duration": "5:03", "mood_type": "upbeat"},
        {"title": "Three Little Birds", "artist": "Bob Marley", "youtube_id": "zaGUr6wzyT8", "duration": "3:01", "mood_type": "upbeat"},
        {"title": "Here Comes the Sun", "artist": "The Beatles", "youtube_id": "KQetemT1sWc", "duration": "3:05", "mood_type": "upbeat"}
    ]
}

# Crisis detection keywords
CRISIS_KEYWORDS = [
    "suicide", "kill myself", "end it all", "hurt myself", "self harm", "self-harm",
    "want to die", "better off dead", "no point living", "worthless", "hopeless",
    "cut myself", "overdose", "jump off", "hang myself"
]

# Emergency contacts and resources
CRISIS_RESOURCES = {
    "emergency_numbers": [
        {"name": "National Suicide Prevention Lifeline (US)", "number": "988"},
        {"name": "Crisis Text Line", "number": "Text HOME to 741741"},
        {"name": "International Association for Suicide Prevention", "url": "https://www.iasp.info/resources/Crisis_Centres/"}
    ],
    "immediate_support": [
        "You are not alone in this. Your life has value.",
        "Please reach out to someone you trust - a friend, family member, or counselor.",
        "Consider calling a crisis helpline where trained professionals can help.",
        "If you're in immediate danger, please call emergency services (911)."
    ]
}

def detect_mood_from_text(text: str) -> Dict[str, Any]:
    """Detect mood from user input text"""
    text_lower = text.lower()
    
    # Check for crisis indicators first
    crisis_detected = any(keyword in text_lower for keyword in CRISIS_KEYWORDS)
    if crisis_detected:
        return {
            "detected_mood": "crisis",
            "confidence": 0.95,
            "message": "I'm concerned about what you've shared. Your safety and wellbeing are important.",
            "crisis_response": True
        }
    
    mood_patterns = {
        "sad": ["sad", "depressed", "down", "low", "blue", "unhappy", "miserable", "crying", "tears"],
        "anxious": ["anxious", "worried", "nervous", "stressed", "panic", "fear", "scared", "overwhelmed"],
        "angry": ["angry", "mad", "frustrated", "annoyed", "irritated", "furious", "rage", "pissed"],
        "tired": ["tired", "exhausted", "drained", "sleepy", "fatigue", "worn out", "weary"],
        "happy": ["happy", "good", "great", "excellent", "amazing", "wonderful", "joy", "excited", "cheerful"]
    }
    
    mood_scores = {}
    for mood, keywords in mood_patterns.items():
        score = sum(1 for keyword in keywords if keyword in text_lower)
        if score > 0:
            mood_scores[mood] = score / len(keywords)
    
    if not mood_scores:
        return {
            "detected_mood": "unclear",
            "confidence": 0.0,
            "message": "How are you feeling right now?",
            "prompt_needed": True
        }
    
    detected_mood = max(mood_scores, key=mood_scores.get)
    confidence = mood_scores[detected_mood]
    
    return {
        "detected_mood": detected_mood,
        "confidence": confidence,
        "message": f"I understand you're feeling {detected_mood}. Let me help with that. 💙",
        "crisis_response": False
    }

@router.post("/analyze-mood", response_model=MoodAnalysisResponse)
async def analyze_mood(request: MoodAnalysisRequest):
    """Analyze mood from user input text"""
    try:
        analysis = detect_mood_from_text(request.text)
        
        if analysis.get("crisis_response"):
            return MoodAnalysisResponse(
                detected_mood="crisis",
                confidence=analysis["confidence"],
                message=analysis["message"],
                suggestions=CRISIS_RESOURCES["immediate_support"]
            )
        
        mood_suggestions = {
            "sad": ["Let's try some uplifting content", "How about a gentle activity?", "Would you like to see something funny?"],
            "anxious": ["Let's focus on calming content", "Some breathing exercises might help", "How about peaceful music?"],
            "angry": ["Let's try something to help you cool down", "Some upbeat music might help", "Physical activity could be good"],
            "tired": ["Let's find something energizing", "Motivational content might help", "How about some uplifting music?"],
            "happy": ["Let's keep that positive energy going!", "How about some celebratory content?", "Want to try something fun?"]
        }
        
        suggestions = mood_suggestions.get(analysis["detected_mood"], ["How can I help you today?"])
        
        return MoodAnalysisResponse(
            detected_mood=analysis["detected_mood"],
            confidence=analysis["confidence"],
            message=analysis["message"],
            suggestions=suggestions
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Mood analysis failed: {str(e)}")

@router.get("/youtube/{mood}", response_model=YouTubeTrackResponse)
async def get_youtube_track(mood: str):
    """Get a random YouTube track for the specified mood"""
    try:
        mood_lower = mood.lower()
        
        if mood_lower not in YOUTUBE_PLAYLISTS:
            # Default to happy if mood not found
            mood_lower = "happy"
        
        tracks = YOUTUBE_PLAYLISTS[mood_lower]
        selected_track = random.choice(tracks)
        
        embed_url = f"https://www.youtube.com/embed/{selected_track['youtube_id']}?autoplay=1&controls=1&rel=0&modestbranding=1&showinfo=0"
        
        return YouTubeTrackResponse(
            title=selected_track["title"],
            artist=selected_track["artist"],
            youtube_id=selected_track["youtube_id"],
            duration=selected_track["duration"],
            mood_type=selected_track["mood_type"],
            embed_url=embed_url
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get YouTube track: {str(e)}")

@router.get("/joke", response_model=JokeResponse)
async def get_joke():
    """Get a random safe joke from JokeAPI"""
    try:
        # Try JokeAPI first
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    "https://v2.jokeapi.dev/joke/Any?safe-mode&type=single,twopart",
                    timeout=5.0
                )
                if response.status_code == 200:
                    data = response.json()
                    if data.get("type") == "single":
                        joke_text = data.get("joke", "")
                    else:
                        setup = data.get("setup", "")
                        delivery = data.get("delivery", "")
                        joke_text = f"{setup}\n{delivery}"
                    
                    return JokeResponse(
                        joke=joke_text,
                        type=data.get("type", "single"),
                        safe=data.get("safe", True),
                        source="JokeAPI"
                    )
            except Exception:
                pass
        
        # Fallback jokes
        fallback_jokes = [
            "Why don't scientists trust atoms? Because they make up everything! 😄",
            "I told my wife she was drawing her eyebrows too high. She looked surprised! 😂",
            "What do you call a bear with no teeth? A gummy bear! 🐻",
            "Why don't eggs tell jokes? They'd crack each other up! 🥚",
            "What do you call a sleeping bull? A bulldozer! 😴",
            "Why don't skeletons fight each other? They don't have the guts! 💀",
            "What's the best thing about Switzerland? I don't know, but the flag is a big plus! 🇨🇭",
            "Why did the scarecrow win an award? Because he was outstanding in his field! 🌾"
        ]
        
        selected_joke = random.choice(fallback_jokes)
        return JokeResponse(
            joke=selected_joke,
            type="single",
            safe=True,
            source="fallback"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get joke: {str(e)}")

@router.get("/funny-image", response_model=FunnyImageResponse)
async def get_funny_image():
    """Get a funny image from various sources"""
    try:
        # Try different APIs
        image_sources = []
        
        # Try Unsplash API for funny/cute images
        async with httpx.AsyncClient() as client:
            try:
                # Try cat images first
                response = await client.get(
                    "https://api.thecatapi.com/v1/images/search?limit=1",
                    timeout=5.0
                )
                if response.status_code == 200:
                    data = response.json()
                    if data and len(data) > 0 and data[0].get("url"):
                        image_sources.append({
                            "url": data[0]["url"],
                            "description": "Cute cat image",
                            "type": "cute_cat",
                            "caption": "Here's a cute cat to brighten your day! 🐱"
                        })
            except Exception:
                pass
            
            try:
                # Try dog images
                response = await client.get(
                    "https://dog.ceo/api/breeds/image/random",
                    timeout=5.0
                )
                if response.status_code == 200:
                    data = response.json()
                    if data.get("status") == "success" and data.get("message"):
                        image_sources.append({
                            "url": data["message"],
                            "description": "Cute dog image",
                            "type": "cute_dog",
                            "caption": "Here's a cute dog to make you smile! 🐕"
                        })
            except Exception:
                pass
        
        # If we got images from APIs, return a random one
        if image_sources:
            selected = random.choice(image_sources)
            return FunnyImageResponse(**selected)
        
        # Fallback to emoji-based images
        fallback_images = [
            {
                "url": "",
                "description": "Happy face emoji collection",
                "type": "emoji",
                "caption": "😄😊😃😁🥳🎉 Smile! You're awesome!"
            },
            {
                "url": "",
                "description": "Cute animal emojis",
                "type": "emoji", 
                "caption": "🐱🐶🦔🐧🦘🐨 Look at these cute animals!"
            },
            {
                "url": "",
                "description": "Positive vibes emojis",
                "type": "emoji",
                "caption": "✨🌟💫⭐🌈🎈 Sending you positive vibes!"
            }
        ]
        
        selected = random.choice(fallback_images)
        return FunnyImageResponse(**selected)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get funny image: {str(e)}")

@router.post("/history")
async def save_to_history(request: HistoryRequest):
    """Save an item to user's mental health history"""
    try:
        db = get_database()
        
        history_item = {
            "user_id": request.user_id,
            "type": request.item_type,  # 'joke', 'image', 'youtube', 'mood_entry'
            "content": request.content,
            "timestamp": datetime.utcnow(),
            "session_id": f"{request.user_id}_{datetime.now().strftime('%Y%m%d_%H')}"
        }
        
        result = await db.mental_health_history.insert_one(history_item)
        
        return {
            "success": True,
            "item_id": str(result.inserted_id),
            "message": "Item saved to history"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save to history: {str(e)}")

@router.get("/history/{user_id}", response_model=HistoryResponse)
async def get_history(user_id: str, limit: int = 50, item_type: Optional[str] = None):
    """Get user's mental health interaction history"""
    try:
        db = get_database()
        
        query = {"user_id": user_id}
        if item_type:
            query["type"] = item_type
        
        cursor = db.mental_health_history.find(query).sort("timestamp", -1).limit(limit)
        items = []
        
        async for item in cursor:
            items.append({
                "id": str(item["_id"]),
                "type": item["type"],
                "content": item["content"],
                "timestamp": item["timestamp"].isoformat(),
                "session_id": item.get("session_id", "")
            })
        
        total_count = await db.mental_health_history.count_documents(query)
        
        return HistoryResponse(
            user_id=user_id,
            items=items,
            total_count=total_count
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get history: {str(e)}")

@router.get("/crisis-resources")
async def get_crisis_resources():
    """Get crisis support resources and emergency contacts"""
    return CRISIS_RESOURCES

@router.delete("/history/{user_id}")
async def clear_history(user_id: str):
    """Clear user's mental health history (use with caution)"""
    try:
        db = get_database()
        result = await db.mental_health_history.delete_many({"user_id": user_id})
        
        return {
            "success": True,
            "deleted_count": result.deleted_count,
            "message": "History cleared successfully"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear history: {str(e)}")


# =====================================================
# MOOD ENTRIES ENDPOINTS (MongoDB Storage)
# =====================================================

@router.post("/mood-entry")
async def create_mood_entry(mood_entry: Dict[str, Any]):
    """Create a new mood entry in MongoDB"""
    try:
        db = get_database()
        
        # Prepare mood entry document
        mood_document = {
            "user_id": mood_entry.get("user_id"),
            "rating": mood_entry.get("rating"),
            "type": mood_entry.get("type"),
            "notes": mood_entry.get("notes", ""),
            "timestamp": datetime.utcnow(),
            "mood_emoji": mood_entry.get("mood_emoji"),
            "energy_level": mood_entry.get("energy_level"),
            "stress_level": mood_entry.get("stress_level"),
            "interventions": mood_entry.get("interventions", [])
        }
        
        result = await db.mood_entries.insert_one(mood_document)
        
        return {
            "success": True,
            "mood_entry_id": str(result.inserted_id),
            "message": "Mood entry saved successfully"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save mood entry: {str(e)}")


@router.get("/mood-entries/{user_id}")
async def get_mood_entries(user_id: str, limit: int = 50):
    """Get user's mood entries from MongoDB"""
    try:
        db = get_database()
        
        cursor = db.mood_entries.find({"user_id": user_id}).sort("timestamp", -1).limit(limit)
        entries = []
        
        async for entry in cursor:
            entries.append({
                "id": str(entry["_id"]),
                "user_id": entry["user_id"],
                "rating": entry["rating"],
                "type": entry["type"],
                "notes": entry.get("notes", ""),
                "timestamp": entry["timestamp"].isoformat(),
                "mood_emoji": entry.get("mood_emoji"),
                "energy_level": entry.get("energy_level"),
                "stress_level": entry.get("stress_level"),
                "interventions": entry.get("interventions", [])
            })
        
        return {
            "success": True,
            "entries": entries,
            "total_count": len(entries)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get mood entries: {str(e)}")


@router.get("/mood-entry/{entry_id}")
async def get_mood_entry(entry_id: str):
    """Get a specific mood entry by ID"""
    try:
        db = get_database()
        
        if not ObjectId.is_valid(entry_id):
            raise HTTPException(status_code=400, detail="Invalid entry ID")
        
        entry = await db.mood_entries.find_one({"_id": ObjectId(entry_id)})
        
        if not entry:
            raise HTTPException(status_code=404, detail="Mood entry not found")
        
        return {
            "success": True,
            "entry": {
                "id": str(entry["_id"]),
                "user_id": entry["user_id"],
                "rating": entry["rating"],
                "type": entry["type"],
                "notes": entry.get("notes", ""),
                "timestamp": entry["timestamp"].isoformat(),
                "mood_emoji": entry.get("mood_emoji"),
                "energy_level": entry.get("energy_level"),
                "stress_level": entry.get("stress_level"),
                "interventions": entry.get("interventions", [])
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get mood entry: {str(e)}")


@router.put("/mood-entry/{entry_id}")
async def update_mood_entry(entry_id: str, updates: Dict[str, Any]):
    """Update a mood entry"""
    try:
        db = get_database()
        
        if not ObjectId.is_valid(entry_id):
            raise HTTPException(status_code=400, detail="Invalid entry ID")
        
        # Remove fields that shouldn't be updated
        updates.pop("_id", None)
        updates.pop("user_id", None)
        updates["updated_at"] = datetime.utcnow()
        
        result = await db.mood_entries.update_one(
            {"_id": ObjectId(entry_id)},
            {"$set": updates}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Mood entry not found")
        
        return {
            "success": True,
            "message": "Mood entry updated successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update mood entry: {str(e)}")


@router.delete("/mood-entry/{entry_id}")
async def delete_mood_entry(entry_id: str):
    """Delete a mood entry"""
    try:
        db = get_database()
        
        if not ObjectId.is_valid(entry_id):
            raise HTTPException(status_code=400, detail="Invalid entry ID")
        
        result = await db.mood_entries.delete_one({"_id": ObjectId(entry_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Mood entry not found")
        
        return {
            "success": True,
            "message": "Mood entry deleted successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete mood entry: {str(e)}")


# =====================================================
# INTERVENTION ENDPOINTS (MongoDB Storage)
# =====================================================

@router.post("/intervention")
async def create_intervention(intervention: Dict[str, Any]):
    """Create a new intervention record in MongoDB"""
    try:
        db = get_database()
        
        intervention_document = {
            "user_id": intervention.get("user_id"),
            "mood_entry_id": intervention.get("mood_entry_id"),
            "type": intervention.get("type"),
            "details": intervention.get("details", {}),
            "timestamp": datetime.utcnow(),
            "effectiveness": intervention.get("effectiveness"),
            "feedback": intervention.get("feedback", "")
        }
        
        result = await db.interventions.insert_one(intervention_document)
        
        # Update mood entry with intervention reference
        if intervention.get("mood_entry_id"):
            await db.mood_entries.update_one(
                {"_id": ObjectId(intervention["mood_entry_id"])},
                {"$push": {"interventions": str(result.inserted_id)}}
            )
        
        return {
            "success": True,
            "intervention_id": str(result.inserted_id),
            "message": "Intervention saved successfully"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save intervention: {str(e)}")


@router.get("/interventions/{user_id}")
async def get_interventions(user_id: str, limit: int = 50, intervention_type: Optional[str] = None):
    """Get user's interventions from MongoDB"""
    try:
        db = get_database()
        
        query = {"user_id": user_id}
        if intervention_type:
            query["type"] = intervention_type
        
        cursor = db.interventions.find(query).sort("timestamp", -1).limit(limit)
        interventions = []
        
        async for intervention in cursor:
            interventions.append({
                "id": str(intervention["_id"]),
                "user_id": intervention["user_id"],
                "mood_entry_id": intervention.get("mood_entry_id"),
                "type": intervention["type"],
                "details": intervention.get("details", {}),
                "timestamp": intervention["timestamp"].isoformat(),
                "effectiveness": intervention.get("effectiveness"),
                "feedback": intervention.get("feedback", "")
            })
        
        return {
            "success": True,
            "interventions": interventions,
            "total_count": len(interventions)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get interventions: {str(e)}")


@router.put("/intervention/{intervention_id}/feedback")
async def update_intervention_feedback(intervention_id: str, effectiveness: str, feedback: Optional[str] = None):
    """Update intervention effectiveness feedback"""
    try:
        db = get_database()
        
        if not ObjectId.is_valid(intervention_id):
            raise HTTPException(status_code=400, detail="Invalid intervention ID")
        
        update_data = {
            "effectiveness": effectiveness,
            "updated_at": datetime.utcnow()
        }
        if feedback:
            update_data["feedback"] = feedback
        
        result = await db.interventions.update_one(
            {"_id": ObjectId(intervention_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Intervention not found")
        
        return {
            "success": True,
            "message": "Intervention feedback updated successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update intervention feedback: {str(e)}")


# =====================================================
# USER PROFILE ENDPOINTS (MongoDB Storage)
# =====================================================

@router.post("/profile")
async def create_or_update_profile(profile: Dict[str, Any]):
    """Create or update user mental health profile"""
    try:
        db = get_database()
        
        user_id = profile.get("user_id")
        if not user_id:
            raise HTTPException(status_code=400, detail="user_id is required")
        
        profile_document = {
            "user_id": user_id,
            "name": profile.get("name"),
            "email": profile.get("email"),
            "phone": profile.get("phone"),
            "preferences": profile.get("preferences", {"interventions": [], "musicGenres": [], "exerciseTypes": []}),
            "goals": profile.get("goals", []),
            "emergency_contacts": profile.get("emergency_contacts", []),
            "risk_level": profile.get("risk_level", "low"),
            "updated_at": datetime.utcnow()
        }
        
        # Upsert: update if exists, create if not
        result = await db.mental_health_profiles.update_one(
            {"user_id": user_id},
            {"$set": profile_document, "$setOnInsert": {"created_at": datetime.utcnow()}},
            upsert=True
        )
        
        return {
            "success": True,
            "profile_id": str(result.upserted_id) if result.upserted_id else user_id,
            "message": "Profile saved successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save profile: {str(e)}")


@router.get("/profile/{user_id}")
async def get_profile(user_id: str):
    """Get user mental health profile"""
    try:
        db = get_database()
        
        profile = await db.mental_health_profiles.find_one({"user_id": user_id})
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        return {
            "success": True,
            "profile": {
                "id": str(profile["_id"]),
                "user_id": profile["user_id"],
                "name": profile.get("name"),
                "email": profile.get("email"),
                "phone": profile.get("phone"),
                "preferences": profile.get("preferences", {}),
                "goals": profile.get("goals", []),
                "emergency_contacts": profile.get("emergency_contacts", []),
                "risk_level": profile.get("risk_level", "low"),
                "created_at": profile.get("created_at", datetime.utcnow()).isoformat(),
                "updated_at": profile.get("updated_at", datetime.utcnow()).isoformat()
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get profile: {str(e)}")


# =====================================================
# ANALYTICS ENDPOINTS (MongoDB Aggregation)
# =====================================================

@router.get("/analytics/{user_id}")
async def get_mood_analytics(user_id: str, days: int = 30):
    """Get mood analytics for a user"""
    try:
        db = get_database()
        
        # Calculate date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Get mood entries in date range
        cursor = db.mood_entries.find({
            "user_id": user_id,
            "timestamp": {"$gte": start_date, "$lte": end_date}
        }).sort("timestamp", -1)
        
        entries = []
        async for entry in cursor:
            entries.append(entry)
        
        if not entries:
            return {
                "success": True,
                "analytics": {
                    "total_entries": 0,
                    "message": "No mood entries found for this period"
                }
            }
        
        # Calculate analytics
        total_entries = len(entries)
        ratings = [e["rating"] for e in entries if "rating" in e]
        energy_levels = [e["energy_level"] for e in entries if "energy_level" in e and e["energy_level"]]
        stress_levels = [e["stress_level"] for e in entries if "stress_level" in e and e["stress_level"]]
        
        avg_mood_rating = sum(ratings) / len(ratings) if ratings else 0
        avg_energy = sum(energy_levels) / len(energy_levels) if energy_levels else 0
        avg_stress = sum(stress_levels) / len(stress_levels) if stress_levels else 0
        
        # Mood distribution
        mood_distribution = {}
        for entry in entries:
            mood_type = entry.get("type", "unknown")
            mood_distribution[mood_type] = mood_distribution.get(mood_type, 0) + 1
        
        most_common_mood = max(mood_distribution.items(), key=lambda x: x[1])[0] if mood_distribution else "unknown"
        
        # Get intervention effectiveness
        intervention_cursor = db.interventions.find({
            "user_id": user_id,
            "timestamp": {"$gte": start_date, "$lte": end_date}
        })
        
        intervention_effectiveness = {}
        async for intervention in intervention_cursor:
            i_type = intervention.get("type", "unknown")
            effectiveness = intervention.get("effectiveness", "not_rated")
            
            if i_type not in intervention_effectiveness:
                intervention_effectiveness[i_type] = {}
            
            intervention_effectiveness[i_type][effectiveness] = intervention_effectiveness[i_type].get(effectiveness, 0) + 1
        
        return {
            "success": True,
            "analytics": {
                "date_range": {
                    "start": start_date.isoformat(),
                    "end": end_date.isoformat()
                },
                "total_entries": total_entries,
                "average_mood_rating": round(avg_mood_rating, 2),
                "average_energy_level": round(avg_energy, 2),
                "average_stress_level": round(avg_stress, 2),
                "most_common_mood": most_common_mood,
                "mood_distribution": mood_distribution,
                "intervention_effectiveness": intervention_effectiveness
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get analytics: {str(e)}")