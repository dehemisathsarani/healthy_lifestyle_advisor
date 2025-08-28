"""
Utility functions for wellness support features including breathing exercises, grounding techniques, and gratitude prompts
"""

import random
from typing import Dict, Any, List, Optional

# Box Breathing Technique (4-4-4-4)
def get_box_breathing() -> Dict[str, Any]:
    """Return box breathing exercise (4-4-4-4 pattern)"""
    return {
        "name": "Box Breathing",
        "description": "A simple technique to calm the mind and reduce stress",
        "steps": [
            "Breathe in through your nose for 4 seconds",
            "Hold your breath for 4 seconds",
            "Exhale through your mouth for 4 seconds",
            "Hold your breath for 4 seconds"
        ],
        "repetitions": "Repeat 4-6 times",
        "benefits": [
            "Reduces stress and anxiety",
            "Improves concentration",
            "Can help with sleep"
        ]
    }

# 5-4-3-2-1 Grounding Exercise
def get_grounding_technique() -> Dict[str, Any]:
    """Return 5-4-3-2-1 grounding technique for anxiety"""
    return {
        "name": "5-4-3-2-1 Grounding Technique",
        "description": "A sensory awareness exercise to help you connect with the present moment",
        "steps": [
            "Acknowledge 5 things you can SEE around you",
            "Acknowledge 4 things you can TOUCH or FEEL",
            "Acknowledge 3 things you can HEAR",
            "Acknowledge 2 things you can SMELL",
            "Acknowledge 1 thing you can TASTE"
        ],
        "benefits": [
            "Helps with anxiety attacks",
            "Reduces overwhelming feelings",
            "Brings you back to the present moment"
        ]
    }

# Gratitude Prompts
def get_gratitude_prompt() -> Dict[str, Any]:
    """Return a random gratitude prompt"""
    prompts = [
        {
            "prompt": "What's something small that brought you joy today?",
            "example": "The first sip of my morning coffee, a kind message from a friend"
        },
        {
            "prompt": "Who is someone you're grateful to have in your life right now?",
            "example": "A supportive friend, a family member who checked in on you"
        },
        {
            "prompt": "What's something about your body or health you're thankful for?",
            "example": "Being able to take a deep breath, having the energy to go for a walk"
        },
        {
            "prompt": "What's a simple pleasure you enjoyed recently?",
            "example": "The taste of a favorite food, a moment of quiet, a good song"
        },
        {
            "prompt": "What's something you're looking forward to?",
            "example": "A future event, the weekend, a special meal"
        },
        {
            "prompt": "What's a challenge you've overcome that you're grateful for now?",
            "example": "Learning a new skill, getting through a difficult time"
        },
        {
            "prompt": "What's something in nature that brought you peace recently?",
            "example": "Sunshine, a tree, clouds, stars, a flower"
        }
    ]
    
    return random.choice(prompts)

# Gentle Routines
def get_wellness_routine(area: str) -> Dict[str, Any]:
    """
    Return gentle routines for different wellness areas
    
    Areas: sleep, nutrition, movement, social
    """
    routines = {
        "sleep": {
            "name": "Gentle Sleep Routine",
            "description": "Simple habits to improve sleep quality",
            "suggestions": [
                "Try to go to bed and wake up at the same time each day",
                "Avoid screens 30-60 minutes before bedtime",
                "Create a comfortable sleep environment (cool, dark, quiet)",
                "Consider a short wind-down routine (reading, stretching, deep breathing)",
                "Limit caffeine after noon"
            ]
        },
        "nutrition": {
            "name": "Mindful Nutrition Habits",
            "description": "Simple nutrition approaches for wellbeing",
            "suggestions": [
                "Try to include a fruit or vegetable with each meal",
                "Stay hydrated throughout the day",
                "Eat slowly and without distractions when possible",
                "Notice how different foods affect your energy and mood",
                "Plan simple, balanced meals when you can"
            ]
        },
        "movement": {
            "name": "Gentle Movement Practices",
            "description": "Accessible ways to incorporate movement",
            "suggestions": [
                "Find small opportunities to move (short walks, stretching breaks)",
                "Choose movement you enjoy rather than what you 'should' do",
                "Start with 5-10 minutes if longer feels overwhelming",
                "Connect movement with daily habits (stretch while waiting for coffee)",
                "Notice how your body feels before and after moving"
            ]
        },
        "social": {
            "name": "Supportive Social Connection",
            "description": "Nurturing social wellbeing",
            "suggestions": [
                "Identify relationships that feel supportive and energizing",
                "Set small, manageable social goals if feeling isolated",
                "Consider how different interactions affect your energy",
                "Practice setting boundaries in relationships when needed",
                "Remember that quality of connections often matters more than quantity"
            ]
        }
    }
    
    if area.lower() in routines:
        return routines[area.lower()]
    else:
        # Return a random routine if the requested area isn't found
        return random.choice(list(routines.values()))
