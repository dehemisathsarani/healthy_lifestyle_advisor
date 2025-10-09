import jwt
import logging
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import re

from settings import settings

logger = logging.getLogger(__name__)
security = HTTPBearer()

def create_access_token(user_data: Dict[str, Any]) -> str:
    """Create a JWT access token for a user"""
    try:
        # Add expiration time
        expire = datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
        
        to_encode = user_data.copy()
        to_encode.update({"exp": expire})
        
        encoded_jwt = jwt.encode(
            to_encode, 
            settings.JWT_SECRET_KEY, 
            algorithm=settings.JWT_ALGORITHM
        )
        
        return encoded_jwt
        
    except Exception as e:
        logger.error(f"Token creation error: {e}")
        raise HTTPException(status_code=500, detail="Could not create access token")

def verify_token(token: str) -> Dict[str, Any]:
    """Verify and decode a JWT token"""
    try:
        payload = jwt.decode(
            token, 
            settings.JWT_SECRET_KEY, 
            algorithms=[settings.JWT_ALGORITHM]
        )
        
        # Check if token is expired
        if datetime.fromtimestamp(payload.get("exp", 0)) < datetime.utcnow():
            raise HTTPException(status_code=401, detail="Token expired")
            
        return payload
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        logger.error(f"Token verification error: {e}")
        raise HTTPException(status_code=401, detail="Token verification failed")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """Get current authenticated user from JWT token"""
    try:
        token = credentials.credentials
        user_data = verify_token(token)
        
        if not user_data.get("user_id"):
            raise HTTPException(status_code=401, detail="Invalid token format")
            
        return user_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get current user error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")

def analyze_crisis_indicators(text: str) -> Dict[str, Any]:
    """Analyze text for crisis indicators and risk level"""
    crisis_keywords = settings.CRISIS_KEYWORDS
    text_lower = text.lower()
    
    detected_keywords = []
    risk_score = 0.0
    
    # Check for direct crisis keywords
    for keyword in crisis_keywords:
        if keyword in text_lower:
            detected_keywords.append(keyword)
            risk_score += 0.3
    
    # Check for intensity indicators
    intensity_words = ["really", "very", "extremely", "so", "too", "can't"]
    negative_words = ["hopeless", "worthless", "empty", "numb", "alone", "isolated"]
    
    for word in intensity_words:
        if word in text_lower:
            risk_score += 0.1
    
    for word in negative_words:
        if word in text_lower:
            risk_score += 0.2
    
    # Determine risk level
    if risk_score >= settings.CRISIS_RISK_THRESHOLD:
        risk_level = "crisis"
    elif risk_score >= 0.5:
        risk_level = "high"
    elif risk_score >= 0.3:
        risk_level = "medium"
    else:
        risk_level = "low"
    
    return {
        "risk_level": risk_level,
        "risk_score": min(risk_score, 1.0),
        "detected_keywords": detected_keywords,
        "requires_intervention": risk_score >= 0.5
    }

def get_mood_appropriate_suggestions(mood: str, risk_level: str = "low") -> list:
    """Get appropriate intervention suggestions based on mood and risk level"""
    suggestions = {
        "happy": [
            "Consider journaling about what made you happy today",
            "Share your positive mood with someone you care about",
            "Engage in a creative activity you enjoy",
            "Practice gratitude for the good things in your life"
        ],
        "sad": [
            "Try some gentle breathing exercises",
            "Listen to uplifting music",
            "Reach out to a trusted friend or family member",
            "Consider writing about your feelings",
            "Take a warm bath or shower"
        ],
        "anxious": [
            "Practice deep breathing or meditation",
            "Try progressive muscle relaxation",
            "Go for a walk in nature",
            "Listen to calming music",
            "Use grounding techniques (5-4-3-2-1 method)"
        ],
        "angry": [
            "Try some physical exercise to release tension",
            "Practice deep breathing",
            "Count to 10 before reacting",
            "Write about your feelings in a journal",
            "Listen to music that helps you relax"
        ],
        "stressed": [
            "Take a few minutes to breathe deeply",
            "Try a short meditation session",
            "Make a to-do list to organize your thoughts",
            "Take a break from what's stressing you",
            "Practice progressive muscle relaxation"
        ],
        "overwhelmed": [
            "Break down your tasks into smaller, manageable steps",
            "Practice mindfulness meditation",
            "Reach out for support from friends or family",
            "Take regular breaks throughout your day",
            "Consider prioritizing your most important tasks"
        ]
    }
    
    # Add crisis-specific suggestions for high-risk situations
    if risk_level in ["high", "crisis"]:
        crisis_suggestions = [
            "Please reach out to a mental health professional",
            "Consider calling a crisis helpline",
            "Talk to someone you trust right now",
            "Remember that you are not alone and help is available"
        ]
        return crisis_suggestions + suggestions.get(mood, suggestions["sad"])
    
    return suggestions.get(mood, suggestions["sad"])

def sanitize_user_input(text: str) -> str:
    """Sanitize user input to prevent injection attacks"""
    # Remove potential HTML/script tags
    text = re.sub(r'<[^>]*>', '', text)
    
    # Remove excessive whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    # Limit length
    if len(text) > 1000:
        text = text[:1000] + "..."
    
    return text

def format_mood_response(mood_data: Dict[str, Any]) -> Dict[str, Any]:
    """Format mood analysis response with appropriate suggestions"""
    mood = mood_data.get("mood", "neutral")
    confidence = mood_data.get("confidence", 0.5)
    
    # Analyze for crisis indicators
    text = mood_data.get("text", "")
    crisis_analysis = analyze_crisis_indicators(text)
    
    # Get appropriate suggestions
    suggestions = get_mood_appropriate_suggestions(mood, crisis_analysis["risk_level"])
    
    # Format confidence as string
    if confidence >= 0.8:
        confidence_str = "high"
    elif confidence >= 0.6:
        confidence_str = "medium"
    else:
        confidence_str = "low"
    
    return {
        "mood": mood,
        "confidence": confidence_str,
        "reason": mood_data.get("reason", f"Analysis indicates {mood} mood"),
        "suggestions": suggestions,
        "crisis_analysis": crisis_analysis
    }

def validate_mood_entry(entry: Dict[str, Any]) -> bool:
    """Validate mood entry data"""
    required_fields = ["rating", "type", "notes"]
    
    for field in required_fields:
        if field not in entry:
            return False
    
    # Validate rating range
    if not isinstance(entry["rating"], int) or entry["rating"] < 1 or entry["rating"] > 5:
        return False
    
    # Validate mood type
    valid_moods = [
        "happy", "sad", "anxious", "angry", "neutral", 
        "excited", "stressed", "calm", "overwhelmed", "content"
    ]
    if entry["type"] not in valid_moods:
        return False
    
    # Validate notes length
    if len(entry["notes"]) > 1000:
        return False
    
    return True

def get_crisis_resources() -> Dict[str, Any]:
    """Get crisis resources and hotline information"""
    return {
        "crisis_detected": True,
        "message": "We're concerned about you. Please reach out for immediate support.",
        "resources": settings.CRISIS_HOTLINE_NUMBERS,
        "priority": "immediate",
        "additional_resources": [
            {
                "type": "online_chat",
                "name": "Crisis Text Line",
                "contact": "Text HOME to 741741",
                "description": "Free 24/7 crisis support via text message"
            },
            {
                "type": "website",
                "name": "National Suicide Prevention Lifeline",
                "contact": "https://suicidepreventionlifeline.org/",
                "description": "Comprehensive suicide prevention resources"
            }
        ]
    }