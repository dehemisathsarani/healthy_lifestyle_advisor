#!/usr/bin/env python3
"""
Enhanced Backend with Content Deduplication Endpoints

This creates a FastAPI backend with endpoints specifically for testing
the enhanced mood tracker content deduplication system.
"""

import sys
import os
import asyncio
import random
from typing import List, Dict, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Content Models
class Quote(BaseModel):
    text: str
    author: str

class Joke(BaseModel):
    id: str
    joke: str
    category: str
    type: str = "single"

class MusicTrack(BaseModel):
    id: str
    title: str
    artist: str
    description: str
    url: str

class Game(BaseModel):
    id: str
    name: str
    description: str
    category: str
    duration: str
    url: str

class ContentRequest(BaseModel):
    mood: str
    count: int = 3

# Create FastAPI app
app = FastAPI(
    title="Enhanced Health Backend",
    description="Backend with content deduplication for mood tracker",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Content Libraries (same as our enhanced frontend system)
MOOD_QUOTES = {
    'happy': [
        {"text": "Happiness is not something ready made. It comes from your own actions.", "author": "Dalai Lama"},
        {"text": "The purpose of our lives is to be happy.", "author": "Dalai Lama"},
        {"text": "Success is not the key to happiness. Happiness is the key to success.", "author": "Albert Schweitzer"},
        {"text": "Keep your face always toward the sunshine—and shadows will fall behind you.", "author": "Walt Whitman"},
        {"text": "Be yourself; everyone else is already taken.", "author": "Oscar Wilde"},
        {"text": "The best way to cheer yourself up is to try to cheer somebody else up.", "author": "Mark Twain"},
        {"text": "Happiness is when what you think, what you say, and what you do are in harmony.", "author": "Mahatma Gandhi"},
        {"text": "Life is really simple, but we insist on making it complicated.", "author": "Confucius"},
        {"text": "The greatest happiness you can have is knowing that you do not necessarily require happiness.", "author": "William Saroyan"},
        {"text": "Happiness depends upon ourselves.", "author": "Aristotle"}
    ],
    'sad': [
        {"text": "The wound is the place where the Light enters you.", "author": "Rumi"},
        {"text": "You are braver than you believe, stronger than you seem.", "author": "A.A. Milne"},
        {"text": "This too shall pass.", "author": "Persian Proverb"},
        {"text": "Every ending is a new beginning.", "author": "Unknown"},
        {"text": "You have been assigned this mountain to show others it can be moved.", "author": "Mel Robbins"},
        {"text": "The darkest nights produce the brightest stars.", "author": "John Green"},
        {"text": "Sometimes you need to be broken down to rebuild yourself stronger.", "author": "Unknown"},
        {"text": "Pain is inevitable. Suffering is optional.", "author": "Buddhist Proverb"},
        {"text": "Even the darkest night will end and the sun will rise.", "author": "Victor Hugo"},
        {"text": "You are stronger than you think and more capable than you imagine.", "author": "Unknown"}
    ],
    'anxious': [
        {"text": "You have power over your mind - not outside events. Realize this, and you will find strength.", "author": "Marcus Aurelius"},
        {"text": "Anxiety does not empty tomorrow of its sorrows, but only empties today of its strength.", "author": "Charles Spurgeon"},
        {"text": "Peace comes from within. Do not seek it without.", "author": "Buddha"},
        {"text": "You are stronger than you think and more capable than you imagine.", "author": "Unknown"},
        {"text": "Breathe in peace, breathe out stress.", "author": "Unknown"},
        {"text": "Worrying does not take away tomorrow's troubles. It takes away today's peace.", "author": "Unknown"},
        {"text": "You can't control everything. Sometimes you just need to relax and have faith that things will work out.", "author": "Kody Keplinger"},
        {"text": "Nothing can bring you peace but yourself.", "author": "Ralph Waldo Emerson"},
        {"text": "The present moment is the only time over which we have dominion.", "author": "Thich Nhat Hanh"},
        {"text": "Anxiety is the dizziness of freedom.", "author": "Søren Kierkegaard"}
    ]
}

MOOD_JOKES = {
    'happy': [
        {"id": "h1", "joke": "Why don't scientists trust atoms? Because they make up everything!", "category": "Science", "type": "single"},
        {"id": "h2", "joke": "I told my wife she was drawing her eyebrows too high. She looked surprised.", "category": "Pun", "type": "single"},
        {"id": "h3", "joke": "What do you call a bear with no teeth? A gummy bear!", "category": "Pun", "type": "single"},
        {"id": "h4", "joke": "Why did the scarecrow win an award? Because he was outstanding in his field!", "category": "Pun", "type": "single"},
        {"id": "h5", "joke": "What's the best thing about Switzerland? I don't know, but the flag is a big plus.", "category": "Geography", "type": "single"},
        {"id": "h6", "joke": "I invented a new word: Plagiarism!", "category": "Wordplay", "type": "single"},
        {"id": "h7", "joke": "Why don't eggs tell jokes? They'd crack each other up!", "category": "Pun", "type": "single"},
        {"id": "h8", "joke": "What do you call a fake noodle? An impasta!", "category": "Food", "type": "single"},
        {"id": "h9", "joke": "Why did the math book look so sad? Because it had too many problems!", "category": "School", "type": "single"},
        {"id": "h10", "joke": "What do you call a dinosaur that crashes his car? Tyrannosaurus Wrecks!", "category": "Pun", "type": "single"}
    ],
    'sad': [
        {"id": "s1", "joke": "Why don't melons get married? Because they cantaloupe!", "category": "Pun", "type": "single"},
        {"id": "s2", "joke": "What do you call a sleeping bull? A bulldozer!", "category": "Animal", "type": "single"},
        {"id": "s3", "joke": "Why did the bicycle fall over? Because it was two-tired!", "category": "Pun", "type": "single"},
        {"id": "s4", "joke": "What do you call a bear in the rain? A drizzly bear!", "category": "Weather", "type": "single"},
        {"id": "s5", "joke": "Why don't elephants use computers? They're afraid of the mouse!", "category": "Technology", "type": "single"},
        {"id": "s6", "joke": "What do you call a pig that does karate? A pork chop!", "category": "Animal", "type": "single"},
        {"id": "s7", "joke": "Why did the cookie go to the doctor? Because it felt crumbly!", "category": "Food", "type": "single"},
        {"id": "s8", "joke": "What do you call a fish wearing a crown? A king fish!", "category": "Animal", "type": "single"},
        {"id": "s9", "joke": "Why don't trees ever get stressed? Because they just leaf their worries behind!", "category": "Nature", "type": "single"},
        {"id": "s10", "joke": "What do you call a happy cowboy? A jolly rancher!", "category": "Western", "type": "single"}
    ]
}

GAMES = [
    {"id": "game_1", "name": "Smile Challenge", "description": "Make yourself smile for 60 seconds", "category": "Wellness", "duration": "2-3 min", "url": "/smile-challenge"},
    {"id": "game_2", "name": "Word Association Game", "description": "Fun word connection challenge", "category": "Brain Training", "duration": "5-10 min", "url": "https://wordassociation.org"},
    {"id": "game_3", "name": "Color Matching Puzzle", "description": "Relaxing color-based puzzle game", "category": "Puzzle", "duration": "10-15 min", "url": "https://colormatch.io"},
    {"id": "game_4", "name": "Breathing Exercise Game", "description": "Interactive breathing for relaxation", "category": "Wellness", "duration": "3-5 min", "url": "/breathing-game"},
    {"id": "game_5", "name": "Pattern Memory Challenge", "description": "Improve memory with patterns", "category": "Memory", "duration": "5-8 min", "url": "https://memorygame.com"},
]

# Session tracking (simple in-memory for testing)
session_shown_content = {
    "quotes": set(),
    "jokes": set(),
    "games": set(),
    "music": set()
}

def get_unique_content(content_type: str, items: List[Dict], count: int) -> List[Dict]:
    """Filter out already shown content and return unique items"""
    shown = session_shown_content.get(content_type, set())
    unique_items = []
    
    for item in items:
        item_id = item.get("id", item.get("text", str(hash(str(item)))))
        if item_id not in shown:
            unique_items.append(item)
            shown.add(item_id)
            if len(unique_items) >= count:
                break
    
    # If we don't have enough unique items, reset and start over
    if len(unique_items) < count and len(shown) > 0:
        session_shown_content[content_type].clear()
        return get_unique_content(content_type, items, count)
    
    return unique_items[:count]

# API Endpoints
@app.get("/")
async def root():
    return {
        "message": "Enhanced Health Backend with Content Deduplication",
        "status": "running",
        "version": "2.0.0",
        "features": ["mood-quotes", "content-deduplication", "mood-jokes", "games"]
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": "2025-10-10"}

@app.post("/api/enhanced-mood/quotes")
async def get_quotes(request: ContentRequest) -> Dict[str, List[Quote]]:
    """Get mood-specific quotes with deduplication"""
    try:
        mood_quotes = MOOD_QUOTES.get(request.mood, MOOD_QUOTES['happy'])
        unique_quotes = get_unique_content("quotes", mood_quotes, request.count)
        
        return {
            "quotes": unique_quotes,
            "mood": request.mood,
            "count": len(unique_quotes),
            "session_shown": len(session_shown_content["quotes"])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching quotes: {str(e)}")

@app.post("/api/enhanced-mood/jokes")
async def get_jokes(request: ContentRequest) -> Dict[str, List[Joke]]:
    """Get mood-specific jokes with deduplication"""
    try:
        mood_jokes = MOOD_JOKES.get(request.mood, MOOD_JOKES['happy'])
        unique_jokes = get_unique_content("jokes", mood_jokes, request.count)
        
        return {
            "jokes": unique_jokes,
            "mood": request.mood,
            "count": len(unique_jokes),
            "session_shown": len(session_shown_content["jokes"])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching jokes: {str(e)}")

@app.post("/api/enhanced-mood/games")
async def get_games(request: ContentRequest) -> Dict[str, List[Game]]:
    """Get games with deduplication"""
    try:
        unique_games = get_unique_content("games", GAMES, request.count)
        
        return {
            "games": unique_games,
            "count": len(unique_games),
            "session_shown": len(session_shown_content["games"])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching games: {str(e)}")

@app.get("/api/enhanced-mood/session-stats")
async def get_session_stats():
    """Get session statistics for debugging"""
    return {
        "session_shown_content": {
            key: len(value) for key, value in session_shown_content.items()
        },
        "total_content_shown": sum(len(v) for v in session_shown_content.values())
    }

@app.post("/api/enhanced-mood/reset-session")
async def reset_session():
    """Reset session content tracking"""
    for key in session_shown_content:
        session_shown_content[key].clear()
    
    return {
        "message": "Session reset successfully",
        "session_shown_content": {key: len(value) for key, value in session_shown_content.items()}
    }

# Test ZenQuotes API integration
@app.get("/api/enhanced-mood/zenquotes-test")
async def test_zenquotes():
    """Test ZenQuotes API integration"""
    try:
        import aiohttp
        async with aiohttp.ClientSession() as session:
            async with session.get('https://zenquotes.io/api/random') as response:
                if response.status == 200:
                    data = await response.json()
                    if data and len(data) > 0:
                        quote = data[0]
                        return {
                            "status": "success",
                            "quote": {
                                "text": quote["q"],
                                "author": quote["a"]
                            }
                        }
                else:
                    return {"status": "error", "message": f"API returned status {response.status}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    print("🚀 Starting Enhanced Health Backend with Content Deduplication...")
    print("📊 Content Library Stats:")
    print(f"   - Quotes: {sum(len(v) for v in MOOD_QUOTES.values())} total")
    print(f"   - Jokes: {sum(len(v) for v in MOOD_JOKES.values())} total")
    print(f"   - Games: {len(GAMES)} total")
    print()
    print("🔗 Available endpoints:")
    print("   - GET  /health - Health check")
    print("   - POST /api/enhanced-mood/quotes - Get mood quotes")
    print("   - POST /api/enhanced-mood/jokes - Get mood jokes")
    print("   - POST /api/enhanced-mood/games - Get games")
    print("   - GET  /api/enhanced-mood/session-stats - Session statistics")
    print("   - POST /api/enhanced-mood/reset-session - Reset session")
    print("   - GET  /api/enhanced-mood/zenquotes-test - Test ZenQuotes API")
    print()
    uvicorn.run(app, host="127.0.0.1", port=8005, reload=False)