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
    MoodAnalyticsModel,
    EnhancedMoodLogModel,
    MoodActivityModel
)

router = APIRouter(prefix="/mental-health", tags=["Mental Health"])

# Models
class MoodAnalysisRequest(BaseModel):
    text: str
    user_id: Optional[str] = None

class MoodAnalysisResponse(BaseModel):
    mood: str  # Changed from detected_mood
    confidence: str  # Changed from float to str (high/medium/low)
    reason: str  # Changed from message
    suggestions: Optional[List[str]] = None  # Keep for additional info

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

class QuoteResponse(BaseModel):
    text: str
    author: str
    category: str
    source: str

class BatchQuotesResponse(BaseModel):
    quotes: List[QuoteResponse]
    mood: str
    count: int

class HistoryRequest(BaseModel):
    user_id: str
    item_type: str
    content: Dict[str, Any]

class BatchContentRequest(BaseModel):
    mood: str
    count: Optional[int] = 3  # Default to 3 items

class BatchYouTubeResponse(BaseModel):
    tracks: List[YouTubeTrackResponse]
    mood: str
    count: int

class BatchJokesResponse(BaseModel):
    jokes: List[JokeResponse]
    count: int

class BatchImagesResponse(BaseModel):
    images: List[FunnyImageResponse]
    count: int

class GameRecommendation(BaseModel):
    title: str
    description: str
    url: str
    mood_benefit: str
    duration: str
    game_type: str

class BatchGamesResponse(BaseModel):
    games: List[GameRecommendation]
    mood: str
    count: int

class HistoryResponse(BaseModel):
    user_id: str
    items: List[Dict[str, Any]]
    total_count: int

class MeditationTechnique(BaseModel):
    id: str
    name: str
    duration_minutes: int
    difficulty: str
    description: str
    benefits: List[str]
    steps: List[str]
    tips: List[str]
    category: str

class MeditationSession(BaseModel):
    technique_id: str
    duration_seconds: int
    completed: bool
    notes: Optional[str] = None

class MeditationSessionRequest(BaseModel):
    user_id: str
    technique_id: str
    duration_seconds: int
    completed: bool
    notes: Optional[str] = None
    mood_before: Optional[str] = None
    mood_after: Optional[str] = None

# Meditation Techniques Database
MEDITATION_TECHNIQUES = {
    "mindfulness_breathing": {
        "id": "mindfulness_breathing",
        "name": "Mindfulness Breathing",
        "duration_minutes": 5,
        "difficulty": "beginner",
        "description": "A simple yet powerful technique to anchor yourself in the present moment through conscious breathing.",
        "benefits": [
            "Reduces stress and anxiety",
            "Improves focus and concentration",
            "Lowers blood pressure",
            "Enhances emotional regulation",
            "Clears negative thoughts"
        ],
        "steps": [
            "Find a quiet, comfortable place to sit with your back straight and feet flat on the floor.",
            "Close your eyes gently or keep them half-open with a soft gaze downward.",
            "Begin by taking a few deep breaths, inhaling through your nose and exhaling through your mouth.",
            "Now breathe naturally. Don't try to control your breath – just observe it.",
            "Notice the sensation of air moving in and out of your nostrils.",
            "Feel your chest and belly rising and falling with each breath.",
            "When your mind wanders (and it will), acknowledge the thought without judgment.",
            "Gently bring your attention back to your breathing.",
            "Continue for 1-10 minutes. Even 60 seconds can help clear negative thoughts.",
            "When ready, slowly open your eyes and take a moment before moving."
        ],
        "tips": [
            "Start with just 1-2 minutes if you're new to meditation",
            "Set a gentle timer so you don't worry about time",
            "It's normal for your mind to wander – that's part of the practice",
            "Practice at the same time each day to build a habit",
            "Don't judge yourself for 'doing it wrong' – there's no wrong way"
        ],
        "category": "breathing"
    },
    "walking_meditation": {
        "id": "walking_meditation",
        "name": "Walking Meditation",
        "duration_minutes": 10,
        "difficulty": "beginner",
        "description": "Transform ordinary walking into a mindful practice by bringing full awareness to the movement of your body.",
        "benefits": [
            "Combines physical activity with mindfulness",
            "Grounds you in the present moment",
            "Reduces racing thoughts",
            "Improves body awareness",
            "Can be done anywhere"
        ],
        "steps": [
            "Select a quiet path that is approximately 10 to 30 steps long (can be indoors or outdoors).",
            "Stand at one end of your path with feet hip-width apart, hands resting comfortably.",
            "Take a moment to feel your body standing – notice your posture and balance.",
            "Begin walking at a slower pace than usual, about half your normal speed.",
            "Pay attention to the sensation in your feet and legs as you walk.",
            "Notice each foot lifting off the ground – feel the weight shift.",
            "Feel the foot moving through the air.",
            "Notice the foot touching back down – heel, then toe.",
            "Be aware of the weight transferring to that foot.",
            "When you reach the end of your path, pause, turn slowly, and walk back.",
            "If your mind wanders to thoughts or sounds, acknowledge them and return focus to walking.",
            "Continue for 10-20 minutes, maintaining slow, deliberate steps."
        ],
        "tips": [
            "You can walk in a straight line back and forth, or in a circle",
            "Keep your gaze soft, looking a few feet ahead",
            "Let your arms swing naturally or hold hands in front/behind",
            "If you feel dizzy, you're walking too slowly – speed up slightly",
            "Try walking barefoot to enhance sensory awareness"
        ],
        "category": "movement"
    },
    "body_scan": {
        "id": "body_scan",
        "name": "Body Scan Meditation",
        "duration_minutes": 15,
        "difficulty": "beginner",
        "description": "A practice of systematically bringing attention to different parts of your body, releasing tension and promoting relaxation.",
        "benefits": [
            "Releases physical tension",
            "Increases body awareness",
            "Promotes deep relaxation",
            "Helps with insomnia",
            "Reduces chronic pain"
        ],
        "steps": [
            "Lie down on your back in a comfortable position (or sit if lying isn't possible).",
            "Close your eyes and take three deep, slow breaths.",
            "Start by bringing awareness to your toes. Notice any sensations.",
            "Imagine breathing into your toes, then releasing tension as you exhale.",
            "Move your attention to your feet, ankles, lower legs, knees.",
            "Continue scanning upward: thighs, hips, lower back.",
            "Notice your belly, chest, and upper back.",
            "Bring awareness to your fingers, hands, arms, shoulders.",
            "Scan your neck, jaw, face, and top of your head.",
            "Finally, feel your whole body at once, breathing as one unit.",
            "Rest in this awareness for a few minutes.",
            "When ready, gently wiggle your fingers and toes, then slowly open your eyes."
        ],
        "tips": [
            "Don't worry if you fall asleep – your body may need rest",
            "Spend 20-30 seconds on each body part",
            "You don't need to change anything – just observe",
            "Use a guided audio if you're new to this practice",
            "Try doing this before bed to improve sleep"
        ],
        "category": "relaxation"
    },
    "loving_kindness": {
        "id": "loving_kindness",
        "name": "Loving-Kindness Meditation (Metta)",
        "duration_minutes": 10,
        "difficulty": "intermediate",
        "description": "Cultivate compassion and positive emotions toward yourself and others through intentional well-wishing.",
        "benefits": [
            "Increases self-compassion",
            "Reduces self-criticism",
            "Enhances empathy and connection",
            "Decreases negative emotions",
            "Improves relationships"
        ],
        "steps": [
            "Sit comfortably and close your eyes.",
            "Take a few deep breaths to settle into the present moment.",
            "Begin by directing loving-kindness toward yourself. Silently repeat:",
            "  'May I be happy. May I be healthy. May I be safe. May I live with ease.'",
            "Feel the meaning of these words. If emotions arise, acknowledge them.",
            "Now think of someone you love. Picture them and repeat:",
            "  'May you be happy. May you be healthy. May you be safe. May you live with ease.'",
            "Next, bring to mind a neutral person (someone you see but don't know well).",
            "Extend the same wishes to them.",
            "If comfortable, think of someone you have difficulty with.",
            "Try to extend the same genuine wishes to them.",
            "Finally, expand to all beings: 'May all beings be happy, healthy, safe, and at ease.'",
            "Sit with this feeling of universal loving-kindness for a few moments.",
            "Gently open your eyes when ready."
        ],
        "tips": [
            "Start with yourself – you can't pour from an empty cup",
            "Use phrases that resonate with you personally",
            "It's okay if you don't feel immediate warmth – intention matters",
            "Practice regularly for cumulative benefits",
            "Be patient with difficult emotions that may arise"
        ],
        "category": "compassion"
    },
    "box_breathing": {
        "id": "box_breathing",
        "name": "Box Breathing (4-4-4-4)",
        "duration_minutes": 5,
        "difficulty": "beginner",
        "description": "A powerful breathing technique used by Navy SEALs to stay calm and focused under pressure.",
        "benefits": [
            "Quickly reduces stress and anxiety",
            "Improves focus and concentration",
            "Regulates the nervous system",
            "Can be done anywhere, anytime",
            "Enhances performance under pressure"
        ],
        "steps": [
            "Sit upright in a comfortable position with feet flat on the floor.",
            "Place one hand on your belly to feel it rise and fall.",
            "Exhale completely to empty your lungs.",
            "Inhale slowly through your nose for 4 counts (1-2-3-4).",
            "Hold your breath for 4 counts (1-2-3-4).",
            "Exhale slowly through your mouth for 4 counts (1-2-3-4).",
            "Hold your breath again (empty lungs) for 4 counts (1-2-3-4).",
            "This completes one cycle. Repeat for 5-10 cycles.",
            "Return to normal breathing when finished.",
            "Notice how you feel – calmer, more centered."
        ],
        "tips": [
            "Visualize tracing a box as you breathe (up, across, down, across)",
            "Keep counts even – don't rush any part",
            "If 4 counts feels too long, try 3-3-3-3 instead",
            "Use this technique before stressful situations",
            "Practice twice daily for best results"
        ],
        "category": "breathing"
    },
    "guided_visualization": {
        "id": "guided_visualization",
        "name": "Guided Visualization",
        "duration_minutes": 15,
        "difficulty": "intermediate",
        "description": "Use your imagination to create a peaceful mental sanctuary that promotes relaxation and positive emotions.",
        "benefits": [
            "Reduces stress and anxiety",
            "Enhances creativity",
            "Improves mood",
            "Provides mental escape",
            "Boosts positive emotions"
        ],
        "steps": [
            "Sit or lie down in a comfortable position.",
            "Close your eyes and take several deep, calming breaths.",
            "Imagine yourself in a peaceful place (beach, forest, mountain, garden).",
            "Engage all your senses: What do you see? What colors surround you?",
            "What sounds do you hear? Birds, waves, wind?",
            "What do you smell? Ocean breeze, pine trees, flowers?",
            "What do you feel? Warmth of sun, soft grass, gentle breeze?",
            "Walk around in your mind, exploring this peaceful place.",
            "Find a comfortable spot to rest in your visualization.",
            "Feel completely safe, peaceful, and relaxed here.",
            "Spend 10-15 minutes in this peaceful sanctuary.",
            "When ready, slowly bring your awareness back to the room.",
            "Wiggle your fingers and toes, then gently open your eyes."
        ],
        "tips": [
            "Choose a place that feels naturally calming to you",
            "Return to the same place each time to deepen the experience",
            "Use guided meditation apps or recordings if helpful",
            "Add personal meaningful elements to your sanctuary",
            "Practice regularly to make visualization easier"
        ],
        "category": "visualization"
    }
}

# Mood-based YouTube playlists
YOUTUBE_PLAYLISTS = {
    "happy": [
        {"title": "Walking on Sunshine", "artist": "Katrina and the Waves", "youtube_id": "iPUmE-tne5U", "duration": "3:59", "mood_type": "upbeat"},
        {"title": "Good Vibrations", "artist": "The Beach Boys", "youtube_id": "Eab_beh07HU", "duration": "3:39", "mood_type": "upbeat"},
        {"title": "Mr. Blue Sky", "artist": "Electric Light Orchestra", "youtube_id": "wuJIqmha2Hc", "duration": "5:03", "mood_type": "upbeat"},
        {"title": "Three Little Birds", "artist": "Bob Marley", "youtube_id": "zaGUr6wzyT8", "duration": "3:01", "mood_type": "upbeat"},
        {"title": "Here Comes the Sun", "artist": "The Beatles", "youtube_id": "KQetemT1sWc", "duration": "3:05", "mood_type": "upbeat"}
    ],
    "calm": [
        {"title": "Weightless", "artist": "Marconi Union", "youtube_id": "UfcAVejslrU", "duration": "8:08", "mood_type": "meditation"},
        {"title": "Spa Music", "artist": "Meditation Relax Music", "youtube_id": "2OEL4P1Rz04", "duration": "3:00:00", "mood_type": "meditation"},
        {"title": "Ocean Waves", "artist": "Nature Sounds", "youtube_id": "V1bFr2SWP1I", "duration": "1:00:00", "mood_type": "meditation"},
        {"title": "Clair de Lune", "artist": "Claude Debussy", "youtube_id": "CvFH_6DNRCY", "duration": "5:20", "mood_type": "meditation"},
        {"title": "Peaceful Piano", "artist": "Meditation Music", "youtube_id": "EgxPGN7GV0g", "duration": "2:00:00", "mood_type": "meditation"}
    ],
    "neutral": [
        {"title": "Lofi Hip Hop Radio", "artist": "Lofi Girl", "youtube_id": "jfKfPfyJRdk", "duration": "LIVE", "mood_type": "background"},
        {"title": "Coffee Shop Music", "artist": "Smooth Jazz", "youtube_id": "oZjpp-yowWU", "duration": "1:30:00", "mood_type": "background"},
        {"title": "Study Music", "artist": "Calm Radio", "youtube_id": "BMjTxH37jH0", "duration": "2:00:00", "mood_type": "background"},
        {"title": "Chill Vibes", "artist": "ChillHop Music", "youtube_id": "5yx6BWlEVcY", "duration": "1:00:00", "mood_type": "background"},
        {"title": "Acoustic Covers", "artist": "Chill Out Records", "youtube_id": "kxUdIfRaTtE", "duration": "1:15:00", "mood_type": "background"}
    ],
    "sad": [
        {"title": "Fix You", "artist": "Coldplay", "youtube_id": "k4V3Mo61fJM", "duration": "4:54", "mood_type": "comforting"},
        {"title": "The Scientist", "artist": "Coldplay", "youtube_id": "RB-RcX5DS5A", "duration": "5:09", "mood_type": "comforting"},
        {"title": "Someone Like You", "artist": "Adele", "youtube_id": "hLQl3WQQoQ0", "duration": "4:45", "mood_type": "comforting"},
        {"title": "Let It Be", "artist": "The Beatles", "youtube_id": "QDYfEBY9NM4", "duration": "4:03", "mood_type": "comforting"},
        {"title": "Lean On Me", "artist": "Bill Withers", "youtube_id": "fOZ-MySzAac", "duration": "4:17", "mood_type": "comforting"}
    ],
    "angry": [
        {"title": "Happy", "artist": "Pharrell Williams", "youtube_id": "ZbZSe6N_BXs", "duration": "3:53", "mood_type": "upbeat"},
        {"title": "Can't Stop the Feeling", "artist": "Justin Timberlake", "youtube_id": "ru0K8uYEZWw", "duration": "3:56", "mood_type": "upbeat"},
        {"title": "Uptown Funk", "artist": "Mark Ronson ft. Bruno Mars", "youtube_id": "OPf0YbXqDm0", "duration": "4:30", "mood_type": "upbeat"},
        {"title": "Good as Hell", "artist": "Lizzo", "youtube_id": "SmbmeOgWsqE", "duration": "2:39", "mood_type": "upbeat"},
        {"title": "Shake It Off", "artist": "Taylor Swift", "youtube_id": "nfWlot6h_JM", "duration": "3:39", "mood_type": "upbeat"}
    ],
    "anxious": [
        {"title": "Weightless", "artist": "Marconi Union", "youtube_id": "UfcAVejslrU", "duration": "8:08", "mood_type": "meditation"},
        {"title": "Aqueous Transmission", "artist": "Incubus", "youtube_id": "3k0-sGqxIiQ", "duration": "7:49", "mood_type": "meditation"},
        {"title": "Breathe Me", "artist": "Sia", "youtube_id": "hSH7fblcGWM", "duration": "4:30", "mood_type": "meditation"},
        {"title": "River", "artist": "Leon Bridges", "youtube_id": "0Hegd4xNfRo", "duration": "4:02", "mood_type": "meditation"},
        {"title": "Holocene", "artist": "Bon Iver", "youtube_id": "TWcyIpul8OE", "duration": "5:36", "mood_type": "meditation"}
    ],
    "stressed": [
        {"title": "Don't Worry Be Happy", "artist": "Bobby McFerrin", "youtube_id": "d-diB65scQU", "duration": "4:52", "mood_type": "uplifting"},
        {"title": "Stronger", "artist": "Kelly Clarkson", "youtube_id": "Xn676-fLq7I", "duration": "3:42", "mood_type": "motivational"},
        {"title": "Eye of the Tiger", "artist": "Survivor", "youtube_id": "btPJPFnesV4", "duration": "4:05", "mood_type": "motivational"},
        {"title": "Roar", "artist": "Katy Perry", "youtube_id": "CevxZvSJLk8", "duration": "3:43", "mood_type": "motivational"},
        {"title": "Fight Song", "artist": "Rachel Platten", "youtube_id": "xo1VInw-SKc", "duration": "3:24", "mood_type": "motivational"}
    ]
}

# Games recommendations by mood
GAMES_BY_MOOD = {
    "happy": [
        {"title": "Color Match", "description": "Match colors in this fun and vibrant game", "url": "/games/color-match", "mood_benefit": "Keeps your happy mood going", "duration": "5-10 min", "game_type": "puzzle"},
        {"title": "Dance Party", "description": "Interactive rhythm game with fun music", "url": "/games/dance-party", "mood_benefit": "Channel your positive energy", "duration": "10-15 min", "game_type": "rhythm"},
        {"title": "Star Collector", "description": "Collect stars and unlock achievements", "url": "/games/star-collector", "mood_benefit": "Celebrate your happiness", "duration": "10-20 min", "game_type": "adventure"}
    ],
    "calm": [
        {"title": "Zen Garden", "description": "Create and maintain a peaceful zen garden", "url": "/games/zen-garden", "mood_benefit": "Enhances relaxation", "duration": "10-15 min", "game_type": "meditation"},
        {"title": "Puzzle Flow", "description": "Relaxing puzzle game with calming visuals", "url": "/games/puzzle-flow", "mood_benefit": "Maintains peaceful state", "duration": "15-20 min", "game_type": "puzzle"},
        {"title": "Cloud Watching", "description": "Identify shapes in the clouds", "url": "/games/cloud-watching", "mood_benefit": "Promotes mindfulness", "duration": "5-10 min", "game_type": "casual"}
    ],
    "neutral": [
        {"title": "Word Search", "description": "Find hidden words in the grid", "url": "/games/word-search", "mood_benefit": "Gentle mental stimulation", "duration": "10-15 min", "game_type": "puzzle"},
        {"title": "Memory Match", "description": "Classic memory card matching game", "url": "/games/memory-match", "mood_benefit": "Improves focus", "duration": "5-10 min", "game_type": "memory"},
        {"title": "Tic Tac Toe", "description": "Play classic tic-tac-toe", "url": "/games/tic-tac-toe", "mood_benefit": "Simple entertainment", "duration": "5 min", "game_type": "strategy"}
    ],
    "sad": [
        {"title": "Kindness Quest", "description": "Spread kindness and collect happy moments", "url": "/games/kindness-quest", "mood_benefit": "Uplifts your spirits", "duration": "10-15 min", "game_type": "adventure"},
        {"title": "Gratitude Journal", "description": "Interactive gratitude journaling game", "url": "/games/gratitude-journal", "mood_benefit": "Focuses on positives", "duration": "5-10 min", "game_type": "reflection"},
        {"title": "Smile Challenge", "description": "Fun challenges to make you smile", "url": "/games/smile-challenge", "mood_benefit": "Boosts mood", "duration": "10 min", "game_type": "interactive"}
    ],
    "angry": [
        {"title": "Stress Ball", "description": "Virtual stress relief by squeezing balls", "url": "/games/stress-ball", "mood_benefit": "Releases tension", "duration": "5 min", "game_type": "stress-relief"},
        {"title": "Bubble Pop", "description": "Pop bubbles to release frustration", "url": "/games/bubble-pop", "mood_benefit": "Calms anger", "duration": "5-10 min", "game_type": "casual"},
        {"title": "Breathing Dragon", "description": "Control a dragon with your breathing", "url": "/games/breathing-dragon", "mood_benefit": "Teaches calm breathing", "duration": "10 min", "game_type": "breathing"}
    ],
    "anxious": [
        {"title": "Calm Waters", "description": "Guide a boat through calm waters", "url": "/games/calm-waters", "mood_benefit": "Reduces anxiety", "duration": "10-15 min", "game_type": "relaxation"},
        {"title": "Pattern Breathing", "description": "Follow breathing patterns to calm down", "url": "/games/pattern-breathing", "mood_benefit": "Controls anxiety", "duration": "5-10 min", "game_type": "breathing"},
        {"title": "Safe Space Builder", "description": "Create your own virtual safe space", "url": "/games/safe-space", "mood_benefit": "Provides comfort", "duration": "10-15 min", "game_type": "creative"}
    ],
    "stressed": [
        {"title": "Quick Break", "description": "Mini games for quick stress relief", "url": "/games/quick-break", "mood_benefit": "Instant stress relief", "duration": "5 min", "game_type": "casual"},
        {"title": "Priority Organizer", "description": "Organize tasks in a fun gamified way", "url": "/games/priority-organizer", "mood_benefit": "Reduces overwhelm", "duration": "10 min", "game_type": "productivity"},
        {"title": "Meditation Timer", "description": "Gamified meditation with rewards", "url": "/games/meditation-timer", "mood_benefit": "Promotes relaxation", "duration": "10-15 min", "game_type": "meditation"}
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
    """
    Detect mood from user input text with emoji support.
    Returns mood classification: happy, calm, neutral, sad, angry, anxious, stressed
    """
    text_lower = text.lower().strip()
    
    # Check for crisis indicators first
    crisis_detected = any(keyword in text_lower for keyword in CRISIS_KEYWORDS)
    if crisis_detected:
        return {
            "detected_mood": "crisis",
            "confidence": "high",
            "reason": "Crisis keywords detected indicating immediate help needed.",
            "message": "I'm concerned about what you've shared. Your safety and wellbeing are important.",
            "crisis_response": True
        }
    
    # Enhanced mood patterns with comprehensive keywords and emojis
    mood_patterns = {
        "happy": {
            "keywords": [
                "happy", "joy", "joyful", "great", "excellent", "amazing", "wonderful", 
                "fantastic", "excited", "cheerful", "thrilled", "delighted", "pleased",
                "glad", "good", "awesome", "perfect", "love", "loving", "blessed",
                "grateful", "thankful", "celebrating", "celebration", "yay", "woohoo",
                "ecstatic", "elated", "overjoyed", "content", "satisfied", "proud"
            ],
            "emojis": ["😊", "😄", "😃", "😁", "🙂", "😀", "🤗", "😍", "🥰", "😘", 
                      "🎉", "🎊", "🥳", "✨", "⭐", "💖", "💕", "❤️", "🌟", "🎈"]
        },
        "calm": {
            "keywords": [
                "calm", "peaceful", "relaxed", "serene", "tranquil", "quiet", "zen",
                "comfortable", "ease", "eased", "okay", "fine", "alright", "stable",
                "balanced", "centered", "composed", "mellow", "chill", "chilling",
                "resting", "rest", "comfortable", "at peace", "settled"
            ],
            "emojis": ["😌", "😊", "🧘", "🧘‍♀️", "🧘‍♂️", "🕊️", "🌿", "🍃", "☮️", "🌸"]
        },
        "sad": {
            "keywords": [
                "sad", "unhappy", "depressed", "down", "low", "blue", "miserable",
                "crying", "cry", "tears", "tearful", "upset", "hurt", "heartbroken",
                "disappointed", "discouraged", "gloomy", "melancholy", "sorrowful",
                "grieving", "grief", "loss", "lonely", "alone", "miss", "missing",
                "empty", "hopeless", "defeated", "broken"
            ],
            "emojis": ["😢", "😭", "😔", "☹️", "🙁", "😞", "😿", "💔", "😪", "🥺"]
        },
        "angry": {
            "keywords": [
                "angry", "mad", "furious", "rage", "enraged", "pissed", "annoyed",
                "irritated", "frustrated", "aggravated", "upset", "outraged", "livid",
                "hate", "hating", "disgusted", "fed up", "sick of", "can't stand",
                "infuriated", "fuming", "seething", "hostile", "resentful", "bitter"
            ],
            "emojis": ["😠", "😡", "🤬", "😤", "💢", "👿", "🔥", "😾"]
        },
        "anxious": {
            "keywords": [
                "anxious", "anxiety", "worried", "worry", "nervous", "panic", "panicking",
                "fear", "scared", "afraid", "frightened", "terrified", "uneasy",
                "apprehensive", "tense", "restless", "on edge", "concerned", "paranoid",
                "insecure", "uncertain", "unsure", "doubt", "doubting", "hesitant"
            ],
            "emojis": ["😰", "😨", "😧", "😦", "😟", "😱", "🥶", "😬", "😓"]
        },
        "stressed": {
            "keywords": [
                "stressed", "stress", "overwhelmed", "pressure", "pressured", "burden",
                "exhausted", "drained", "tired", "weary", "worn out", "burnt out",
                "burnout", "overworked", "swamped", "buried", "too much", "can't cope",
                "struggling", "difficult", "hard", "tough", "heavy", "taxing",
                "demanding", "intense", "hectic", "chaotic", "crazy"
            ],
            "emojis": ["😫", "😩", "😣", "😖", "😵", "🤯", "😮‍💨", "💆", "💆‍♀️", "💆‍♂️"]
        },
        "neutral": {
            "keywords": [
                "okay", "ok", "fine", "alright", "normal", "regular", "usual",
                "same", "nothing", "meh", "whatever", "so-so", "average", "moderate"
            ],
            "emojis": ["😐", "😑", "😶", "🙂"]
        }
    }
    
    # Count keyword matches and emoji matches
    mood_scores = {}
    mood_reasons = {}
    
    for mood, patterns in mood_patterns.items():
        score = 0
        matched_keywords = []
        matched_emojis = []
        
        # Check keywords
        for keyword in patterns["keywords"]:
            if keyword in text_lower:
                score += 2  # Keywords have higher weight
                matched_keywords.append(keyword)
        
        # Check emojis
        for emoji in patterns["emojis"]:
            if emoji in text:  # Don't lowercase for emoji matching
                score += 3  # Emojis have highest weight (very clear indicators)
                matched_emojis.append(emoji)
        
        if score > 0:
            mood_scores[mood] = score
            
            # Build reason
            reason_parts = []
            if matched_keywords:
                if len(matched_keywords) <= 2:
                    reason_parts.append(f"Keywords: {', '.join(matched_keywords)}")
                else:
                    reason_parts.append(f"{len(matched_keywords)} relevant keywords found")
            if matched_emojis:
                reason_parts.append(f"Emojis: {' '.join(matched_emojis[:3])}")
            
            mood_reasons[mood] = " | ".join(reason_parts) if reason_parts else "General tone detected"
    
    # Determine confidence based on score
    if not mood_scores:
        # No clear indicators - default to neutral
        return {
            "detected_mood": "neutral",
            "confidence": "medium",
            "reason": "No emotional cues or strong tone detected.",
            "message": "I'm here to listen. How are you feeling?",
            "crisis_response": False
        }
    
    # Get the mood with highest score
    detected_mood = max(mood_scores, key=mood_scores.get)
    max_score = mood_scores[detected_mood]
    
    # Determine confidence level
    if max_score >= 5:
        confidence = "high"
    elif max_score >= 3:
        confidence = "medium"
    else:
        confidence = "low"
    
    # Check if there are competing moods (e.g., sad + anxious)
    sorted_moods = sorted(mood_scores.items(), key=lambda x: x[1], reverse=True)
    if len(sorted_moods) > 1 and sorted_moods[1][1] >= sorted_moods[0][1] * 0.7:
        # There's a strong secondary mood
        secondary_mood = sorted_moods[1][0]
        combined_reason = f"Primary: {mood_reasons[detected_mood]}. Also showing {secondary_mood} indicators."
    else:
        combined_reason = mood_reasons[detected_mood]
    
    # Friendly messages based on mood
    mood_messages = {
        "happy": "That's wonderful! 😊 I'm happy to hear you're feeling good!",
        "calm": "It's great that you're feeling peaceful. 🧘 Let's maintain that calmness.",
        "neutral": "I'm here for you. Would you like to chat or try something uplifting?",
        "sad": "I'm sorry you're feeling this way. 💙 Let me help brighten your day.",
        "angry": "I understand you're upset. Let's find something to help you feel better.",
        "anxious": "I can sense you're worried. Let's try some calming activities together.",
        "stressed": "That sounds overwhelming. Let's work on easing that stress. 🌿"
    }
    
    return {
        "detected_mood": detected_mood,
        "confidence": confidence,
        "reason": combined_reason,
        "message": mood_messages.get(detected_mood, "I'm here to support you. 💙"),
        "crisis_response": False
    }

@router.post("/analyze-mood", response_model=MoodAnalysisResponse)
async def analyze_mood(request: MoodAnalysisRequest):
    """
    Analyze mood from text input with emoji support.
    Returns: {"mood": "happy/calm/neutral/sad/angry/anxious/stressed", "confidence": "high/medium/low", "reason": "..."}
    """
    try:
        analysis = detect_mood_from_text(request.text)
        
        # Handle crisis situation
        if analysis.get("crisis_response"):
            return MoodAnalysisResponse(
                mood="crisis",
                confidence=analysis["confidence"],
                reason=analysis["reason"],
                suggestions=CRISIS_RESOURCES["immediate_support"]
            )
        
        # Enhanced mood suggestions for all 7 categories
        mood_suggestions = {
            "happy": [
                "🎉 Keep that positive energy going!",
                "Want to share your happiness? Try journaling or calling a friend!",
                "How about some upbeat music or fun games?"
            ],
            "calm": [
                "🧘 That's wonderful! Let's maintain this peaceful state.",
                "Perfect time for meditation or gentle activities.",
                "Enjoy some calming music or nature sounds."
            ],
            "neutral": [
                "Would you like to explore something interesting?",
                "How about trying a new activity or listening to music?",
                "I'm here if you want to chat or need suggestions."
            ],
            "sad": [
                "💙 I'm here for you. Let's find something comforting.",
                "Would you like to see something uplifting?",
                "Try some gentle music, funny content, or talk to someone you trust."
            ],
            "angry": [
                "Let's work on cooling down together.",
                "Try some breathing exercises or physical activity.",
                "Upbeat music or stress-relief games might help."
            ],
            "anxious": [
                "🌿 Let's focus on calming activities.",
                "Breathing exercises and meditation can help.",
                "How about some peaceful music or relaxation games?"
            ],
            "stressed": [
                "That sounds overwhelming. Let's ease that stress.",
                "Try taking a break with quick games or calming music.",
                "Breathing exercises and organizing tasks can help."
            ]
        }
        
        suggestions = mood_suggestions.get(
            analysis["detected_mood"], 
            ["I'm here to support you. How can I help?"]
        )
        
        # Return in the new format
        return MoodAnalysisResponse(
            mood=analysis["detected_mood"],
            confidence=analysis["confidence"],
            reason=analysis["reason"],
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

# ==================== BATCH CONTENT ENDPOINTS ====================
# These endpoints return multiple items (2-3) when user asks for "more"

@router.post("/batch/youtube", response_model=BatchYouTubeResponse)
async def get_batch_youtube_tracks(request: BatchContentRequest):
    """Get multiple YouTube tracks for the specified mood"""
    try:
        mood_lower = request.mood.lower()
        count = min(request.count, 5)  # Max 5 tracks
        
        if mood_lower not in YOUTUBE_PLAYLISTS:
            mood_lower = "happy"  # Default
        
        tracks = YOUTUBE_PLAYLISTS[mood_lower]
        
        # Get random unique tracks
        selected_tracks = random.sample(tracks, min(count, len(tracks)))
        
        track_responses = []
        for track in selected_tracks:
            embed_url = f"https://www.youtube.com/embed/{track['youtube_id']}?autoplay=0&controls=1&rel=0&modestbranding=1&showinfo=0"
            track_responses.append(YouTubeTrackResponse(
                title=track["title"],
                artist=track["artist"],
                youtube_id=track["youtube_id"],
                duration=track["duration"],
                mood_type=track["mood_type"],
                embed_url=embed_url
            ))
        
        return BatchYouTubeResponse(
            tracks=track_responses,
            mood=request.mood,
            count=len(track_responses)
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get YouTube tracks: {str(e)}")

@router.get("/batch/jokes/{count}", response_model=BatchJokesResponse)
async def get_batch_jokes(count: int = 3):
    """Get multiple jokes at once"""
    try:
        count = min(count, 5)  # Max 5 jokes
        jokes = []
        
        # Try to get from JokeAPI
        async with httpx.AsyncClient() as client:
            for _ in range(count):
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
                        
                        jokes.append(JokeResponse(
                            joke=joke_text,
                            type=data.get("type", "single"),
                            safe=data.get("safe", True),
                            source="JokeAPI"
                        ))
                except Exception:
                    pass
        
        # Fill with fallback jokes if needed
        fallback_jokes = [
            "Why don't scientists trust atoms? Because they make up everything! 😄",
            "I told my wife she was drawing her eyebrows too high. She looked surprised! 😂",
            "What do you call a bear with no teeth? A gummy bear! 🐻",
            "Why don't eggs tell jokes? They'd crack each other up! 🥚",
            "What do you call a sleeping bull? A bulldozer! 😴",
            "Why don't skeletons fight each other? They don't have the guts! 💀",
            "What's the best thing about Switzerland? I don't know, but the flag is a big plus! 🇨🇭",
            "Why did the scarecrow win an award? Because he was outstanding in his field! 🌾",
            "What do you call a fake noodle? An impasta! 🍝",
            "Why did the bicycle fall over? Because it was two tired! 🚲"
        ]
        
        while len(jokes) < count:
            fallback = random.choice(fallback_jokes)
            jokes.append(JokeResponse(
                joke=fallback,
                type="single",
                safe=True,
                source="fallback"
            ))
        
        return BatchJokesResponse(
            jokes=jokes[:count],
            count=len(jokes[:count])
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get jokes: {str(e)}")

@router.get("/batch/quotes/{mood}", response_model=BatchQuotesResponse)
async def get_batch_quotes(mood: str, count: int = 3):
    """
    Get motivational quotes based on user's mood using ZenQuotes API.
    Supports mood-based filtering and provides fallback quotes.
    """
    try:
        quotes = []
        
        # Mood-based quote keywords for better relevance
        mood_keywords = {
            "happy": ["happiness", "joy", "success", "achievement"],
            "excited": ["motivation", "energy", "enthusiasm", "success"],
            "content": ["peace", "contentment", "gratitude", "balance"],
            "sad": ["hope", "strength", "resilience", "courage"],
            "anxious": ["calm", "peace", "strength", "courage"],
            "angry": ["patience", "peace", "wisdom", "understanding"],
            "stressed": ["calm", "peace", "balance", "relaxation"],
            "neutral": ["inspiration", "wisdom", "motivation", "life"],
            "calm": ["peace", "serenity", "balance", "mindfulness"],
            "overwhelmed": ["strength", "resilience", "courage", "hope"]
        }
        
        # Try to fetch from ZenQuotes API (free, no API key required)
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # ZenQuotes API endpoint for random quotes
                response = await client.get("https://zenquotes.io/api/quotes")
                
                if response.status_code == 200:
                    api_quotes = response.json()
                    
                    # Filter and format quotes
                    for quote_data in api_quotes:
                        if len(quotes) >= count:
                            break
                        
                        quotes.append(QuoteResponse(
                            text=quote_data.get("q", ""),
                            author=quote_data.get("a", "Unknown"),
                            category=mood.lower(),
                            source="ZenQuotes API"
                        ))
        except Exception as api_error:
            print(f"ZenQuotes API error: {api_error}")
        
        # Fallback quotes organized by mood
        fallback_quotes_by_mood = {
            "happy": [
                {"text": "Happiness is not something ready made. It comes from your own actions.", "author": "Dalai Lama"},
                {"text": "The purpose of our lives is to be happy.", "author": "Dalai Lama"},
                {"text": "Happiness is when what you think, what you say, and what you do are in harmony.", "author": "Mahatma Gandhi"}
            ],
            "sad": [
                {"text": "The darkest nights produce the brightest stars.", "author": "Unknown"},
                {"text": "Every storm runs out of rain.", "author": "Maya Angelou"},
                {"text": "This too shall pass.", "author": "Persian Proverb"}
            ],
            "anxious": [
                {"text": "You don't have to control your thoughts. You just have to stop letting them control you.", "author": "Dan Millman"},
                {"text": "Anxiety does not empty tomorrow of its sorrows, but only empties today of its strength.", "author": "Charles Spurgeon"},
                {"text": "Nothing can bring you peace but yourself.", "author": "Ralph Waldo Emerson"}
            ],
            "stressed": [
                {"text": "In the middle of difficulty lies opportunity.", "author": "Albert Einstein"},
                {"text": "The greatest weapon against stress is our ability to choose one thought over another.", "author": "William James"},
                {"text": "Don't let yesterday take up too much of today.", "author": "Will Rogers"}
            ],
            "angry": [
                {"text": "For every minute you are angry you lose sixty seconds of happiness.", "author": "Ralph Waldo Emerson"},
                {"text": "Anger is an acid that can do more harm to the vessel in which it is stored than to anything on which it is poured.", "author": "Mark Twain"},
                {"text": "Holding onto anger is like drinking poison and expecting the other person to die.", "author": "Buddha"}
            ],
            "excited": [
                {"text": "The only way to do great work is to love what you do.", "author": "Steve Jobs"},
                {"text": "Believe you can and you're halfway there.", "author": "Theodore Roosevelt"},
                {"text": "Your limitation—it's only your imagination.", "author": "Unknown"}
            ],
            "calm": [
                {"text": "Peace comes from within. Do not seek it without.", "author": "Buddha"},
                {"text": "In the midst of movement and chaos, keep stillness inside of you.", "author": "Deepak Chopra"},
                {"text": "The quieter you become, the more you can hear.", "author": "Ram Dass"}
            ],
            "overwhelmed": [
                {"text": "You don't have to see the whole staircase, just take the first step.", "author": "Martin Luther King Jr."},
                {"text": "One day at a time—this is enough. Do not look back and grieve over the past for it is gone.", "author": "Ida Scott Taylor"},
                {"text": "Start where you are. Use what you have. Do what you can.", "author": "Arthur Ashe"}
            ]
        }
        
        # Default motivational quotes
        default_fallback_quotes = [
            {"text": "The only impossible journey is the one you never begin.", "author": "Tony Robbins"},
            {"text": "Your life does not get better by chance, it gets better by change.", "author": "Jim Rohn"},
            {"text": "Believe in yourself and all that you are.", "author": "Christian D. Larson"},
            {"text": "You are never too old to set another goal or to dream a new dream.", "author": "C.S. Lewis"},
            {"text": "The future belongs to those who believe in the beauty of their dreams.", "author": "Eleanor Roosevelt"},
            {"text": "Success is not final, failure is not fatal: it is the courage to continue that counts.", "author": "Winston Churchill"},
            {"text": "You are stronger than you think and more capable than you imagine.", "author": "Unknown"},
            {"text": "Every day is a new opportunity to grow and shine.", "author": "Unknown"}
        ]
        
        # If we don't have enough quotes from API, use fallback
        if len(quotes) < count:
            mood_lower = mood.lower()
            fallback_source = fallback_quotes_by_mood.get(mood_lower, default_fallback_quotes)
            
            # Add fallback quotes
            for fallback in fallback_source:
                if len(quotes) >= count:
                    break
                quotes.append(QuoteResponse(
                    text=fallback["text"],
                    author=fallback["author"],
                    category=mood.lower(),
                    source="curated"
                ))
            
            # If still not enough, add from default fallback
            if len(quotes) < count:
                for fallback in default_fallback_quotes:
                    if len(quotes) >= count:
                        break
                    if fallback not in fallback_source:  # Avoid duplicates
                        quotes.append(QuoteResponse(
                            text=fallback["text"],
                            author=fallback["author"],
                            category=mood.lower(),
                            source="curated"
                        ))
        
        return BatchQuotesResponse(
            quotes=quotes[:count],
            mood=mood,
            count=len(quotes[:count])
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get quotes: {str(e)}")

@router.get("/batch/images/{count}", response_model=BatchImagesResponse)
async def get_batch_images(count: int = 3):
    """Get multiple funny/cute images"""
    try:
        count = min(count, 5)  # Max 5 images
        images = []
        
        async with httpx.AsyncClient() as client:
            # Try to get cat images
            try:
                response = await client.get(
                    f"https://api.thecatapi.com/v1/images/search?limit={count}",
                    timeout=5.0
                )
                if response.status_code == 200:
                    data = response.json()
                    for item in data:
                        if item.get("url"):
                            images.append(FunnyImageResponse(
                                url=item["url"],
                                description="Cute cat image",
                                type="cute_cat",
                                caption="Here's a cute cat to brighten your day! 🐱"
                            ))
            except Exception:
                pass
            
            # Get dog images if we need more
            while len(images) < count:
                try:
                    response = await client.get(
                        "https://dog.ceo/api/breeds/image/random",
                        timeout=5.0
                    )
                    if response.status_code == 200:
                        data = response.json()
                        if data.get("status") == "success" and data.get("message"):
                            images.append(FunnyImageResponse(
                                url=data["message"],
                                description="Cute dog image",
                                type="cute_dog",
                                caption="Here's a cute dog to make you smile! 🐕"
                            ))
                except Exception:
                    break
        
        # Fill with emoji fallbacks if needed
        fallback_images = [
            FunnyImageResponse(
                url="",
                description="Happy face emoji collection",
                type="emoji",
                caption="😄😊😃😁🥳🎉 Smile! You're awesome!"
            ),
            FunnyImageResponse(
                url="",
                description="Cute animal emojis",
                type="emoji",
                caption="🐱🐶🦔🐧🦘🐨 Look at these cute animals!"
            ),
            FunnyImageResponse(
                url="",
                description="Positive vibes emojis",
                type="emoji",
                caption="✨🌟💫⭐🌈🎈 Sending you positive vibes!"
            )
        ]
        
        while len(images) < count:
            images.append(random.choice(fallback_images))
        
        return BatchImagesResponse(
            images=images[:count],
            count=len(images[:count])
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get images: {str(e)}")

@router.post("/batch/games", response_model=BatchGamesResponse)
async def get_batch_games(request: BatchContentRequest):
    """Get game recommendations based on mood"""
    try:
        mood_lower = request.mood.lower()
        count = min(request.count, 3)  # Max 3 games
        
        if mood_lower not in GAMES_BY_MOOD:
            mood_lower = "neutral"  # Default
        
        games = GAMES_BY_MOOD[mood_lower]
        
        # Get random unique games
        selected_games = random.sample(games, min(count, len(games)))
        
        game_responses = [GameRecommendation(**game) for game in selected_games]
        
        return BatchGamesResponse(
            games=game_responses,
            mood=request.mood,
            count=len(game_responses)
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get games: {str(e)}")

# Single game endpoint
@router.get("/games/{mood}", response_model=GameRecommendation)
async def get_game_for_mood(mood: str):
    """Get a single game recommendation for the specified mood"""
    try:
        mood_lower = mood.lower()
        
        if mood_lower not in GAMES_BY_MOOD:
            mood_lower = "neutral"
        
        games = GAMES_BY_MOOD[mood_lower]
        selected_game = random.choice(games)
        
        return GameRecommendation(**selected_game)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get game: {str(e)}")

# ==================== END BATCH CONTENT ENDPOINTS ====================

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

# =====================================================
# MEDITATION ENDPOINTS
# =====================================================

@router.get("/meditation/techniques", response_model=List[MeditationTechnique])
async def get_meditation_techniques(category: Optional[str] = None, difficulty: Optional[str] = None):
    """
    Get all available meditation techniques, optionally filtered by category or difficulty
    
    Categories: breathing, movement, relaxation, compassion, visualization
    Difficulty: beginner, intermediate, advanced
    """
    try:
        techniques = list(MEDITATION_TECHNIQUES.values())
        
        # Filter by category if provided
        if category:
            techniques = [t for t in techniques if t["category"] == category.lower()]
        
        # Filter by difficulty if provided
        if difficulty:
            techniques = [t for t in techniques if t["difficulty"] == difficulty.lower()]
        
        return techniques
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get meditation techniques: {str(e)}")

@router.get("/meditation/techniques/{technique_id}", response_model=MeditationTechnique)
async def get_meditation_technique(technique_id: str):
    """Get detailed information about a specific meditation technique"""
    try:
        if technique_id not in MEDITATION_TECHNIQUES:
            raise HTTPException(status_code=404, detail=f"Meditation technique '{technique_id}' not found")
        
        return MEDITATION_TECHNIQUES[technique_id]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get meditation technique: {str(e)}")

@router.post("/meditation/session")
async def save_meditation_session(session: MeditationSessionRequest):
    """Save a completed meditation session to history"""
    try:
        db = get_database()
        
        # Verify technique exists
        if session.technique_id not in MEDITATION_TECHNIQUES:
            raise HTTPException(status_code=404, detail=f"Meditation technique '{session.technique_id}' not found")
        
        technique = MEDITATION_TECHNIQUES[session.technique_id]
        
        # Create session document
        session_document = {
            "user_id": session.user_id,
            "technique_id": session.technique_id,
            "technique_name": technique["name"],
            "technique_category": technique["category"],
            "duration_seconds": session.duration_seconds,
            "duration_minutes": round(session.duration_seconds / 60, 1),
            "completed": session.completed,
            "notes": session.notes,
            "mood_before": session.mood_before,
            "mood_after": session.mood_after,
            "timestamp": datetime.utcnow(),
            "session_date": datetime.utcnow().date().isoformat()
        }
        
        # Save to meditation_sessions collection
        result = await db.meditation_sessions.insert_one(session_document)
        
        # Also save to history for unified tracking
        history_item = {
            "user_id": session.user_id,
            "type": "meditation",
            "content": {
                "technique_id": session.technique_id,
                "technique_name": technique["name"],
                "category": technique["category"],
                "duration_minutes": round(session.duration_seconds / 60, 1),
                "completed": session.completed,
                "mood_before": session.mood_before,
                "mood_after": session.mood_after,
                "notes": session.notes
            },
            "timestamp": datetime.utcnow(),
            "session_id": f"{session.user_id}_{datetime.now().strftime('%Y%m%d_%H')}"
        }
        
        await db.mental_health_history.insert_one(history_item)
        
        return {
            "success": True,
            "session_id": str(result.inserted_id),
            "message": f"Meditation session '{technique['name']}' saved successfully",
            "duration_minutes": round(session.duration_seconds / 60, 1)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save meditation session: {str(e)}")

@router.get("/meditation/history/{user_id}")
async def get_meditation_history(
    user_id: str,
    days: int = 30,
    technique_id: Optional[str] = None
):
    """Get user's meditation history with optional filtering"""
    try:
        db = get_database()
        
        # Calculate date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Build query
        query = {
            "user_id": user_id,
            "timestamp": {"$gte": start_date, "$lte": end_date}
        }
        
        if technique_id:
            query["technique_id"] = technique_id
        
        # Get sessions
        sessions_cursor = db.meditation_sessions.find(query).sort("timestamp", -1)
        sessions = await sessions_cursor.to_list(length=None)
        
        # Convert ObjectId to string
        for session in sessions:
            session["_id"] = str(session["_id"])
        
        # Calculate statistics
        total_sessions = len(sessions)
        completed_sessions = len([s for s in sessions if s.get("completed", False)])
        total_minutes = sum(s.get("duration_minutes", 0) for s in sessions)
        
        # Group by technique
        technique_stats = {}
        for session in sessions:
            tech_id = session.get("technique_id")
            if tech_id not in technique_stats:
                technique_stats[tech_id] = {
                    "technique_name": session.get("technique_name"),
                    "count": 0,
                    "total_minutes": 0
                }
            technique_stats[tech_id]["count"] += 1
            technique_stats[tech_id]["total_minutes"] += session.get("duration_minutes", 0)
        
        # Calculate streak
        streak = 0
        if sessions:
            current_date = datetime.utcnow().date()
            for session in sorted(sessions, key=lambda x: x["timestamp"], reverse=True):
                session_date = session["timestamp"].date()
                if (current_date - session_date).days <= 1:
                    if session_date < current_date:
                        current_date = session_date
                    streak += 1
                else:
                    break
        
        return {
            "success": True,
            "user_id": user_id,
            "date_range": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat(),
                "days": days
            },
            "statistics": {
                "total_sessions": total_sessions,
                "completed_sessions": completed_sessions,
                "completion_rate": round((completed_sessions / total_sessions * 100) if total_sessions > 0 else 0, 1),
                "total_minutes": round(total_minutes, 1),
                "average_minutes_per_session": round((total_minutes / total_sessions) if total_sessions > 0 else 0, 1),
                "current_streak": streak
            },
            "technique_breakdown": technique_stats,
            "sessions": sessions
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get meditation history: {str(e)}")

@router.get("/meditation/recommend/{user_id}")
async def get_meditation_recommendation(user_id: str, mood: Optional[str] = None):
    """Get personalized meditation technique recommendation based on user's mood and history"""
    try:
        db = get_database()
        
        # Get user's recent meditation history
        recent_sessions = await db.meditation_sessions.find(
            {"user_id": user_id}
        ).sort("timestamp", -1).limit(10).to_list(length=10)
        
        # Get user's recent mood entries
        recent_moods = await db.mood_entries.find(
            {"user_id": user_id}
        ).sort("timestamp", -1).limit(5).to_list(length=5)
        
        # Determine current mood
        current_mood = mood
        if not current_mood and recent_moods:
            current_mood = recent_moods[0].get("mood", "").lower()
        
        # Find least practiced techniques
        practiced_techniques = {}
        for session in recent_sessions:
            tech_id = session.get("technique_id")
            practiced_techniques[tech_id] = practiced_techniques.get(tech_id, 0) + 1
        
        # Mood-based recommendations
        mood_recommendations = {
            "anxious": ["mindfulness_breathing", "box_breathing", "body_scan"],
            "stressed": ["box_breathing", "body_scan", "walking_meditation"],
            "sad": ["loving_kindness", "guided_visualization", "mindfulness_breathing"],
            "angry": ["box_breathing", "walking_meditation", "body_scan"],
            "tired": ["body_scan", "guided_visualization", "mindfulness_breathing"],
            "restless": ["walking_meditation", "body_scan", "box_breathing"]
        }
        
        # Get recommendations for current mood
        recommended_ids = mood_recommendations.get(current_mood, ["mindfulness_breathing", "box_breathing"])
        
        # Score techniques (prefer less practiced ones)
        scored_techniques = []
        for tech_id in MEDITATION_TECHNIQUES:
            technique = MEDITATION_TECHNIQUES[tech_id]
            score = 0
            
            # Mood match bonus
            if tech_id in recommended_ids:
                score += 10
            
            # Variety bonus (less practiced = higher score)
            practice_count = practiced_techniques.get(tech_id, 0)
            score += max(0, 5 - practice_count)
            
            # Beginner-friendly bonus if new user
            if len(recent_sessions) < 3 and technique["difficulty"] == "beginner":
                score += 3
            
            scored_techniques.append({
                **technique,
                "recommendation_score": score,
                "times_practiced": practice_count
            })
        
        # Sort by score
        scored_techniques.sort(key=lambda x: x["recommendation_score"], reverse=True)
        
        return {
            "success": True,
            "user_id": user_id,
            "current_mood": current_mood,
            "recommended_technique": scored_techniques[0],
            "alternative_techniques": scored_techniques[1:4],
            "reasoning": f"Based on your {current_mood if current_mood else 'current'} mood and meditation history"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get meditation recommendation: {str(e)}")


# ==================== MOOD LOGS ENDPOINTS - MongoDB Persistence ====================

@router.post("/mood-logs")
async def save_mood_log(mood_log: EnhancedMoodLogModel):
    """
    Save a new mood log to MongoDB with all activities and details
    This stores mood logs permanently for the user
    """
    try:
        db = get_database()
        mood_logs_collection = db["mood_logs"]
        
        # Convert Pydantic model to dict for MongoDB
        log_dict = mood_log.model_dump(by_alias=True, exclude={"id"})
        
        # Ensure timestamp is datetime object
        if isinstance(log_dict.get("timestamp"), str):
            log_dict["timestamp"] = datetime.fromisoformat(log_dict["timestamp"].replace("Z", "+00:00"))
        
        # Convert activities timestamps
        if "activities" in log_dict and log_dict["activities"]:
            for activity in log_dict["activities"]:
                if isinstance(activity.get("timestamp"), str):
                    activity["timestamp"] = datetime.fromisoformat(activity["timestamp"].replace("Z", "+00:00"))
        
        # Insert into MongoDB
        result = await mood_logs_collection.insert_one(log_dict)
        
        # Return success response with the created ID
        log_dict["_id"] = str(result.inserted_id)
        log_dict["id"] = str(result.inserted_id)
        
        return {
            "success": True,
            "message": "Mood log saved successfully to MongoDB",
            "mood_log": log_dict,
            "mood_log_id": str(result.inserted_id)
        }
    
    except Exception as e:
        print(f"Error saving mood log to MongoDB: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to save mood log: {str(e)}")


@router.get("/mood-logs")
async def get_mood_logs(user_id: str, limit: int = 50, skip: int = 0):
    """
    Get all mood logs for a specific user from MongoDB
    Returns logs sorted by timestamp (most recent first)
    """
    try:
        db = get_database()
        mood_logs_collection = db["mood_logs"]
        
        # Query mood logs by user_id with pagination, sorted by timestamp descending
        cursor = mood_logs_collection.find({"user_id": user_id}).sort("timestamp", -1).skip(skip).limit(limit)
        mood_logs = await cursor.to_list(length=limit)
        
        # Get total count for this user
        total_count = await mood_logs_collection.count_documents({"user_id": user_id})
        
        # Convert ObjectId to string and add id field
        for log in mood_logs:
            log["_id"] = str(log["_id"])
            log["id"] = str(log["_id"])
            # Convert timestamps to ISO strings for JSON serialization
            if isinstance(log.get("timestamp"), datetime):
                log["timestamp"] = log["timestamp"].isoformat()
            if "activities" in log:
                for activity in log["activities"]:
                    if isinstance(activity.get("timestamp"), datetime):
                        activity["timestamp"] = activity["timestamp"].isoformat()
        
        return {
            "success": True,
            "mood_logs": mood_logs,
            "total_count": total_count
        }
    
    except Exception as e:
        print(f"Error retrieving mood logs from MongoDB: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve mood logs: {str(e)}")


@router.put("/mood-logs/{log_id}")
async def update_mood_log(log_id: str, mood_log: EnhancedMoodLogModel):
    """
    Update an existing mood log in MongoDB
    """
    try:
        db = get_database()
        mood_logs_collection = db["mood_logs"]
        
        # Convert to dict and prepare for MongoDB
        log_dict = mood_log.model_dump(by_alias=True, exclude={"id"})
        
        # Ensure timestamp is datetime
        if isinstance(log_dict.get("timestamp"), str):
            log_dict["timestamp"] = datetime.fromisoformat(log_dict["timestamp"].replace("Z", "+00:00"))
        
        # Convert activities timestamps
        if "activities" in log_dict and log_dict["activities"]:
            for activity in log_dict["activities"]:
                if isinstance(activity.get("timestamp"), str):
                    activity["timestamp"] = datetime.fromisoformat(activity["timestamp"].replace("Z", "+00:00"))
        
        # Update in MongoDB
        result = await mood_logs_collection.update_one(
            {"_id": ObjectId(log_id)},
            {"$set": log_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Mood log not found")
        
        return {
            "success": True,
            "message": "Mood log updated successfully"
        }
    
    except Exception as e:
        print(f"Error updating mood log in MongoDB: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update mood log: {str(e)}")


@router.delete("/mood-logs/{log_id}")
async def delete_mood_log(log_id: str):
    """
    Delete a mood log from MongoDB
    """
    try:
        db = get_database()
        mood_logs_collection = db["mood_logs"]
        
        # Delete from MongoDB
        result = await mood_logs_collection.delete_one({"_id": ObjectId(log_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Mood log not found")
        
        return {
            "success": True,
            "message": "Mood log deleted successfully"
        }
    
    except Exception as e:
        print(f"Error deleting mood log from MongoDB: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete mood log: {str(e)}")