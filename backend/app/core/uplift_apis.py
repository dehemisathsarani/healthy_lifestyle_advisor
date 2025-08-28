"""
Utility functions for external API interactions (jokes, activities, etc)
"""

import httpx
import random
import logging
from typing import Dict, Any, Optional, List

logger = logging.getLogger(__name__)

async def get_random_joke() -> Dict[str, Any]:
    """
    Get a random family-friendly joke from multiple APIs
    Falls back to other APIs if primary one fails
    """
    # Define our joke API endpoints in order of preference
    joke_apis = [
        {"url": "https://v2.jokeapi.dev/joke/Any?safe-mode", "parser": parse_joke_api},
        {"url": "https://official-joke-api.appspot.com/jokes/random", "parser": parse_official_joke_api},
        {"url": "https://icanhazdadjoke.com/", "parser": parse_dad_joke_api},
    ]
    
    # Try each API in order until we get a successful response
    for api in joke_apis:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                headers = {"Accept": "application/json"}
                response = await client.get(api["url"], headers=headers)
                
                if response.status_code == 200:
                    return api["parser"](response.json())
                    
        except Exception as e:
            logger.warning(f"Joke API call failed: {str(e)}")
            # Continue to next API
    
    # If all APIs fail, return a fallback joke
    return {
        "joke": "Why don't scientists trust atoms? Because they make up everything!",
        "type": "fallback"
    }

def parse_joke_api(data: Dict[str, Any]) -> Dict[str, Any]:
    """Parse response from JokeAPI"""
    if data.get("type") == "single":
        return {"joke": data.get("joke", ""), "type": "single"}
    else:
        return {
            "joke": f"{data.get('setup', '')} \n{data.get('delivery', '')}",
            "type": "twopart"
        }

def parse_official_joke_api(data: Dict[str, Any]) -> Dict[str, Any]:
    """Parse response from Official Joke API"""
    return {
        "joke": f"{data.get('setup', '')} \n{data.get('punchline', '')}",
        "type": "twopart"
    }

def parse_dad_joke_api(data: Dict[str, Any]) -> Dict[str, Any]:
    """Parse response from icanhazdadjoke API"""
    return {"joke": data.get("joke", ""), "type": "single"}

async def get_random_activity() -> Dict[str, Any]:
    """
    Get a random activity suggestion from Bored API
    Falls back to predefined activities if API fails
    """
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get("https://bored-api.appbrewery.com/random")
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "activity": data.get("activity", ""),
                    "type": data.get("type", ""),
                    "participants": data.get("participants", 1),
                    "source": "bored-api"
                }
                
    except Exception as e:
        logger.warning(f"Activity API call failed: {str(e)}")
        # Continue to fallback
    
    # Fallback activities if API fails
    fallback_activities = [
        {"activity": "Take a 5-minute mindfulness break", "type": "relaxation", "participants": 1},
        {"activity": "Draw a quick doodle of something that makes you happy", "type": "creative", "participants": 1},
        {"activity": "Write down three things you're grateful for", "type": "mindfulness", "participants": 1},
        {"activity": "Do 10 jumping jacks to get your blood flowing", "type": "physical", "participants": 1},
        {"activity": "Look out the window and find 5 interesting things", "type": "observation", "participants": 1},
        {"activity": "Drink a glass of water and stretch", "type": "self-care", "participants": 1},
        {"activity": "Send a kind message to a friend", "type": "social", "participants": 1},
        {"activity": "Take three deep breaths, holding each for 5 seconds", "type": "relaxation", "participants": 1}
    ]
    
    return {**random.choice(fallback_activities), "source": "fallback"}
