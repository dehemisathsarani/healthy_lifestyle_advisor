# Enhanced Accurate Food Analysis Service with MongoDB Integration
# Provides precise, food-specific nutritional analysis

import os
import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
import openai
from transformers import pipeline
import numpy as np

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==================== MONGODB CONFIGURATION ====================

MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://Admin:X1bzjS2IGHrNHFgS@healthagent.ucnrbse.mongodb.net/HealthAgent")
DB_NAME = "HealthAgent"

# Global MongoDB client
db_client: Optional[AsyncIOMotorClient] = None
db = None

async def connect_to_mongo():
    """Connect to MongoDB Atlas"""
    global db_client, db
    try:
        db_client = AsyncIOMotorClient(MONGO_URI)
        db = db_client[DB_NAME]
        # Test connection
        await db.command('ping')
        logger.info("✅ Connected to MongoDB for food analysis storage")
        return True
    except Exception as e:
        logger.error(f"❌ MongoDB connection failed: {e}")
        return False

async def close_mongo_connection():
    """Close MongoDB connection"""
    global db_client
    if db_client:
        db_client.close()
        logger.info("MongoDB connection closed")

# ==================== DATA MODELS ====================

class FoodNutrition(BaseModel):
    """Accurate nutritional information for a specific food item"""
    food_name: str
    serving_size: str
    calories: float
    protein: float
    carbs: float
    fat: float
    fiber: float
    sugar: float
    sodium: float
    vitamins: Dict[str, float] = Field(default_factory=dict)
    minerals: Dict[str, float] = Field(default_factory=dict)
    
class FoodAnalysisResult(BaseModel):
    """Complete food analysis result"""
    analysis_id: str
    user_id: str
    timestamp: datetime
    food_items: List[FoodNutrition]
    total_calories: float
    total_protein: float
    total_carbs: float
    total_fat: float
    total_fiber: float
    meal_type: Optional[str] = None  # breakfast, lunch, dinner, snack
    ai_insights: Optional[str] = None
    
class NutritionLogEntry(BaseModel):
    """Nutrition log entry for tracking"""
    log_id: str
    user_id: str
    date: datetime
    meal_type: str
    food_items: List[FoodNutrition]
    total_nutrition: Dict[str, float]
    analysis_id: Optional[str] = None  # Link to original analysis
    notes: Optional[str] = None

class WeeklyMealSummary(BaseModel):
    """Weekly meal summary with NLP-generated insights"""
    summary_id: str
    user_id: str
    week_start: datetime
    week_end: datetime
    total_meals: int
    daily_averages: Dict[str, float]
    top_foods: List[str]
    nutrition_trends: Dict[str, Any]
    nlp_summary: str  # AI-generated weekly summary
    recommendations: List[str]

# ==================== COMPREHENSIVE FOOD DATABASE ====================

class AccurateFoodDatabase:
    """
    Comprehensive food database with accurate nutritional information
    Includes Sri Lankan and international foods
    """
    
    # Comprehensive food database (per 100g unless specified)
    FOOD_DATABASE = {
        # BREADS
        "white bread": {
            "calories": 265, "protein": 9, "carbs": 49, "fat": 3.2,
            "fiber": 2.7, "sugar": 5, "sodium": 491,
            "vitamins": {"B1": 0.4, "B2": 0.2, "B3": 4.3, "Folate": 0.1},
            "minerals": {"Iron": 3.6, "Calcium": 160, "Magnesium": 25}
        },
        "whole wheat bread": {
            "calories": 247, "protein": 13, "carbs": 41, "fat": 3.4,
            "fiber": 7, "sugar": 6, "sodium": 400,
            "vitamins": {"B1": 0.3, "B2": 0.1, "B3": 4.5, "E": 0.5},
            "minerals": {"Iron": 2.5, "Calcium": 100, "Magnesium": 82, "Zinc": 2.0}
        },
        "multigrain bread": {
            "calories": 260, "protein": 11, "carbs": 43, "fat": 4.2,
            "fiber": 6.5, "sugar": 5, "sodium": 450,
            "vitamins": {"B1": 0.35, "B2": 0.15, "B6": 0.3},
            "minerals": {"Iron": 3.0, "Calcium": 120, "Selenium": 0.03}
        },
        "rye bread": {
            "calories": 259, "protein": 8.5, "carbs": 48, "fat": 3.3,
            "fiber": 5.8, "sugar": 3.8, "sodium": 603,
            "vitamins": {"B1": 0.3, "B2": 0.2, "B3": 3.8},
            "minerals": {"Iron": 2.8, "Magnesium": 40}
        },
        
        # RICE (Sri Lankan staple)
        "white rice cooked": {
            "calories": 130, "protein": 2.7, "carbs": 28, "fat": 0.3,
            "fiber": 0.4, "sugar": 0.1, "sodium": 1,
            "vitamins": {"B1": 0.02, "B3": 0.4},
            "minerals": {"Iron": 0.2, "Magnesium": 12}
        },
        "brown rice cooked": {
            "calories": 123, "protein": 2.6, "carbs": 25.6, "fat": 1,
            "fiber": 1.6, "sugar": 0.4, "sodium": 3,
            "vitamins": {"B1": 0.1, "B3": 1.5, "B6": 0.15},
            "minerals": {"Iron": 0.5, "Magnesium": 44, "Zinc": 0.6}
        },
        "basmati rice cooked": {
            "calories": 121, "protein": 3, "carbs": 25, "fat": 0.4,
            "fiber": 0.6, "sugar": 0, "sodium": 2,
            "vitamins": {"B1": 0.07, "B3": 1.5},
            "minerals": {"Iron": 0.3, "Magnesium": 15}
        },
        "red rice cooked": {
            "calories": 115, "protein": 2.5, "carbs": 24, "fat": 0.8,
            "fiber": 2, "sugar": 0.2, "sodium": 1,
            "vitamins": {"B1": 0.12, "B6": 0.14},
            "minerals": {"Iron": 0.8, "Magnesium": 50, "Zinc": 0.8}
        },
        
        # TRADITIONAL SRI LANKAN FOODS
        "string hoppers": {
            "calories": 110, "protein": 2, "carbs": 24, "fat": 0.3,
            "fiber": 1, "sugar": 0.5, "sodium": 2,
            "vitamins": {"B1": 0.03},
            "minerals": {"Iron": 0.4, "Calcium": 10}
        },
        "hoppers": {
            "calories": 92, "protein": 2.2, "carbs": 18, "fat": 1.2,
            "fiber": 0.8, "sugar": 0.3, "sodium": 150,
            "vitamins": {"B1": 0.05, "Folate": 0.02},
            "minerals": {"Iron": 0.5, "Calcium": 15}
        },
        "roti": {
            "calories": 180, "protein": 3.5, "carbs": 25, "fat": 7,
            "fiber": 2, "sugar": 0.5, "sodium": 250,
            "vitamins": {"B1": 0.1},
            "minerals": {"Iron": 1.2, "Calcium": 20}
        },
        "pittu": {
            "calories": 95, "protein": 1.8, "carbs": 20, "fat": 0.8,
            "fiber": 1.5, "sugar": 0.2, "sodium": 5,
            "vitamins": {"B1": 0.04},
            "minerals": {"Iron": 0.6, "Magnesium": 18}
        },
        
        # CURRIES
        "chicken curry": {
            "calories": 175, "protein": 18, "carbs": 6, "fat": 9,
            "fiber": 1.5, "sugar": 3, "sodium": 450,
            "vitamins": {"A": 0.05, "C": 8, "B6": 0.3},
            "minerals": {"Iron": 1.2, "Zinc": 1.5, "Potassium": 300}
        },
        "fish curry": {
            "calories": 145, "protein": 20, "carbs": 5, "fat": 5,
            "fiber": 1, "sugar": 2.5, "sodium": 400,
            "vitamins": {"D": 0.008, "B12": 0.003, "A": 0.04},
            "minerals": {"Iron": 0.8, "Calcium": 50, "Selenium": 0.04}
        },
        "dhal curry": {
            "calories": 116, "protein": 9, "carbs": 20, "fat": 0.4,
            "fiber": 8, "sugar": 1.8, "sodium": 250,
            "vitamins": {"B1": 0.2, "B6": 0.2, "Folate": 0.18},
            "minerals": {"Iron": 3.3, "Magnesium": 36, "Zinc": 1.2}
        },
        "potato curry": {
            "calories": 87, "protein": 2, "carbs": 18, "fat": 0.6,
            "fiber": 2.2, "sugar": 1.2, "sodium": 300,
            "vitamins": {"C": 19.7, "B6": 0.3},
            "minerals": {"Potassium": 429, "Iron": 0.8}
        },
        
        # FRUITS
        "banana": {
            "calories": 89, "protein": 1.1, "carbs": 23, "fat": 0.3,
            "fiber": 2.6, "sugar": 12, "sodium": 1,
            "vitamins": {"C": 8.7, "B6": 0.4, "A": 0.003},
            "minerals": {"Potassium": 358, "Magnesium": 27}
        },
        "apple": {
            "calories": 52, "protein": 0.3, "carbs": 14, "fat": 0.2,
            "fiber": 2.4, "sugar": 10, "sodium": 1,
            "vitamins": {"C": 4.6, "K": 0.002},
            "minerals": {"Potassium": 107, "Calcium": 6}
        },
        "mango": {
            "calories": 60, "protein": 0.8, "carbs": 15, "fat": 0.4,
            "fiber": 1.6, "sugar": 13.7, "sodium": 1,
            "vitamins": {"C": 36.4, "A": 0.054, "E": 0.9},
            "minerals": {"Potassium": 168, "Magnesium": 10}
        },
        "papaya": {
            "calories": 43, "protein": 0.5, "carbs": 11, "fat": 0.3,
            "fiber": 1.7, "sugar": 7.8, "sodium": 8,
            "vitamins": {"C": 60.9, "A": 0.047, "Folate": 0.037},
            "minerals": {"Potassium": 182, "Calcium": 20}
        },
        
        # VEGETABLES
        "carrot": {
            "calories": 41, "protein": 0.9, "carbs": 10, "fat": 0.2,
            "fiber": 2.8, "sugar": 4.7, "sodium": 69,
            "vitamins": {"A": 0.835, "C": 5.9, "K": 0.013},
            "minerals": {"Potassium": 320, "Calcium": 33}
        },
        "broccoli": {
            "calories": 34, "protein": 2.8, "carbs": 7, "fat": 0.4,
            "fiber": 2.6, "sugar": 1.7, "sodium": 33,
            "vitamins": {"C": 89.2, "K": 0.102, "A": 0.031},
            "minerals": {"Calcium": 47, "Iron": 0.7, "Magnesium": 21}
        },
        "spinach": {
            "calories": 23, "protein": 2.9, "carbs": 3.6, "fat": 0.4,
            "fiber": 2.2, "sugar": 0.4, "sodium": 79,
            "vitamins": {"A": 0.469, "C": 28.1, "K": 0.483, "Folate": 0.194},
            "minerals": {"Iron": 2.7, "Calcium": 99, "Magnesium": 79}
        },
        
        # PROTEINS
        "chicken breast": {
            "calories": 165, "protein": 31, "carbs": 0, "fat": 3.6,
            "fiber": 0, "sugar": 0, "sodium": 74,
            "vitamins": {"B3": 14.8, "B6": 0.9, "B12": 0.0003},
            "minerals": {"Phosphorus": 228, "Selenium": 0.027, "Zinc": 1}
        },
        "salmon": {
            "calories": 208, "protein": 20, "carbs": 0, "fat": 13,
            "fiber": 0, "sugar": 0, "sodium": 59,
            "vitamins": {"D": 0.011, "B12": 0.003, "B6": 0.6},
            "minerals": {"Selenium": 0.042, "Phosphorus": 252}
        },
        "egg": {
            "calories": 155, "protein": 13, "carbs": 1.1, "fat": 11,
            "fiber": 0, "sugar": 1.1, "sodium": 124,
            "vitamins": {"A": 0.160, "D": 0.002, "B12": 0.001, "Riboflavin": 0.5},
            "minerals": {"Iron": 1.8, "Selenium": 0.031, "Phosphorus": 198}
        },
        "tofu": {
            "calories": 76, "protein": 8, "carbs": 1.9, "fat": 4.8,
            "fiber": 0.3, "sugar": 0.7, "sodium": 7,
            "vitamins": {"Calcium": 350, "Iron": 5.4},
            "minerals": {"Magnesium": 30, "Phosphorus": 97}
        },
        
        # DAIRY
        "milk whole": {
            "calories": 61, "protein": 3.2, "carbs": 4.8, "fat": 3.3,
            "fiber": 0, "sugar": 5.1, "sodium": 43,
            "vitamins": {"D": 0.00005, "B12": 0.0005, "A": 0.046},
            "minerals": {"Calcium": 113, "Phosphorus": 84}
        },
        "yogurt plain": {
            "calories": 59, "protein": 10, "carbs": 3.6, "fat": 0.4,
            "fiber": 0, "sugar": 3.2, "sodium": 36,
            "vitamins": {"B12": 0.0004, "Riboflavin": 0.14},
            "minerals": {"Calcium": 110, "Phosphorus": 135}
        },
        "cheese cheddar": {
            "calories": 403, "protein": 25, "carbs": 1.3, "fat": 33,
            "fiber": 0, "sugar": 0.5, "sodium": 621,
            "vitamins": {"A": 0.265, "B12": 0.001, "D": 0.0005},
            "minerals": {"Calcium": 721, "Phosphorus": 512, "Zinc": 3.1}
        },
    }
    
    @classmethod
    def get_food_nutrition(cls, food_name: str, quantity_grams: float = 100) -> Optional[FoodNutrition]:
        """
        Get accurate nutritional information for a specific food item
        
        Args:
            food_name: Name of the food (case-insensitive)
            quantity_grams: Quantity in grams (default 100g)
            
        Returns:
            FoodNutrition object with accurate data or None if not found
        """
        food_key = food_name.lower().strip()
        
        # Try exact match first
        if food_key in cls.FOOD_DATABASE:
            food_data = cls.FOOD_DATABASE[food_key]
        else:
            # Try partial matching
            matching_foods = [key for key in cls.FOOD_DATABASE.keys() if food_key in key or key in food_key]
            if matching_foods:
                food_key = matching_foods[0]
                food_data = cls.FOOD_DATABASE[food_key]
            else:
                logger.warning(f"Food '{food_name}' not found in database")
                return None
        
        # Calculate nutrition based on quantity
        multiplier = quantity_grams / 100
        
        return FoodNutrition(
            food_name=food_key,
            serving_size=f"{quantity_grams}g",
            calories=round(food_data["calories"] * multiplier, 1),
            protein=round(food_data["protein"] * multiplier, 1),
            carbs=round(food_data["carbs"] * multiplier, 1),
            fat=round(food_data["fat"] * multiplier, 1),
            fiber=round(food_data["fiber"] * multiplier, 1),
            sugar=round(food_data["sugar"] * multiplier, 1),
            sodium=round(food_data["sodium"] * multiplier, 1),
            vitamins={k: round(v * multiplier, 3) for k, v in food_data.get("vitamins", {}).items()},
            minerals={k: round(v * multiplier, 3) for k, v in food_data.get("minerals", {}).items()}
        )
    
    @classmethod
    def search_foods(cls, query: str) -> List[str]:
        """Search for foods matching the query"""
        query = query.lower().strip()
        return [food for food in cls.FOOD_DATABASE.keys() if query in food]

# (Continued in next file due to length...)
