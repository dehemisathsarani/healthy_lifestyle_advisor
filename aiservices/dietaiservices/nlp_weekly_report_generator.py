# Enhanced Food Analysis Service - Part 2: Analysis & NLP Weekly Reports
# Continued from enhanced_accurate_food_analysis.py

import os
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import json
from bson import ObjectId
import openai
from transformers import pipeline
import numpy as np

from enhanced_accurate_food_analysis import (
    FoodNutrition, FoodAnalysisResult, NutritionLogEntry, 
    WeeklyMealSummary, AccurateFoodDatabase, db, logger
)

# ==================== ENHANCED FOOD ANALYSIS SERVICE ====================

class EnhancedAccurateFoodAnalyzer:
    """
    Provides accurate, food-specific nutritional analysis
    Stores results in MongoDB and integrates with nutrition logging
    """
    
    def __init__(self):
        self.food_db = AccurateFoodDatabase()
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        if self.openai_api_key:
            openai.api_key = self.openai_api_key
    
    async def analyze_food_text(self, food_text: str, user_id: str, meal_type: Optional[str] = None) -> FoodAnalysisResult:
        """
        Analyze food from text input with accurate nutritional data
        
        Args:
            food_text: Comma-separated list of foods (e.g., "bread, banana, milk")
            user_id: User ID for tracking
            meal_type: Type of meal (breakfast, lunch, dinner, snack)
            
        Returns:
            FoodAnalysisResult with accurate nutritional data
        """
        logger.info(f"📊 Analyzing food text: {food_text}")
        
        # Parse food items
        food_items_raw = [item.strip() for item in food_text.split(',')]
        
        food_items = []
        total_calories = 0
        total_protein = 0
        total_carbs = 0
        total_fat = 0
        total_fiber = 0
        
        for food_raw in food_items_raw:
            # Extract quantity if mentioned (e.g., "2 slices bread", "150g rice")
            quantity = 100  # Default quantity in grams
            food_name = food_raw
            
            # Try to parse quantity from text
            quantity, food_name = self._parse_food_with_quantity(food_raw)
            
            # Get accurate nutrition data from database
            nutrition = self.food_db.get_food_nutrition(food_name, quantity)
            
            if nutrition:
                food_items.append(nutrition)
                total_calories += nutrition.calories
                total_protein += nutrition.protein
                total_carbs += nutrition.carbs
                total_fat += nutrition.fat
                total_fiber += nutrition.fiber
            else:
                # Food not in database - use AI estimation
                logger.warning(f"Food '{food_name}' not in database, using AI estimation")
                estimated_nutrition = await self._estimate_nutrition_with_ai(food_name, quantity)
                if estimated_nutrition:
                    food_items.append(estimated_nutrition)
                    total_calories += estimated_nutrition.calories
                    total_protein += estimated_nutrition.protein
                    total_carbs += estimated_nutrition.carbs
                    total_fat += estimated_nutrition.fat
                    total_fiber += estimated_nutrition.fiber
        
        # Generate AI insights
        ai_insights = await self._generate_ai_insights(food_items, total_calories, total_protein, total_carbs, total_fat)
        
        # Create analysis result
        analysis_id = str(ObjectId())
        analysis = FoodAnalysisResult(
            analysis_id=analysis_id,
            user_id=user_id,
            timestamp=datetime.utcnow(),
            food_items=food_items,
            total_calories=round(total_calories, 1),
            total_protein=round(total_protein, 1),
            total_carbs=round(total_carbs, 1),
            total_fat=round(total_fat, 1),
            total_fiber=round(total_fiber, 1),
            meal_type=meal_type,
            ai_insights=ai_insights
        )
        
        # Store in MongoDB
        await self._save_analysis_to_db(analysis)
        
        logger.info(f"✅ Food analysis complete: {len(food_items)} items, {total_calories} calories")
        return analysis
    
    def _parse_food_with_quantity(self, food_text: str) -> tuple:
        """Parse food quantity from text (e.g., '2 slices bread', '150g rice')"""
        import re
        
        # Pattern for quantity in grams: "150g rice", "200 g chicken"
        gram_pattern = r'(\d+)\s*g(?:ram)?s?\s+(.+)'
        match = re.match(gram_pattern, food_text, re.IGNORECASE)
        if match:
            quantity = float(match.group(1))
            food_name = match.group(2).strip()
            return quantity, food_name
        
        # Pattern for slices: "2 slices bread"
        slice_pattern = r'(\d+)\s+slices?\s+(.+)'
        match = re.match(slice_pattern, food_text, re.IGNORECASE)
        if match:
            num_slices = int(match.group(1))
            food_name = match.group(2).strip()
            # Assume 1 slice = 30g
            quantity = num_slices * 30
            return quantity, food_name
        
        # Pattern for cups: "1 cup rice"
        cup_pattern = r'(\d+(?:\.\d+)?)\s+cups?\s+(.+)'
        match = re.match(cup_pattern, food_text, re.IGNORECASE)
        if match:
            num_cups = float(match.group(1))
            food_name = match.group(2).strip()
            # Assume 1 cup = 150g
            quantity = num_cups * 150
            return quantity, food_name
        
        # Pattern for pieces: "1 banana", "2 eggs"
        piece_pattern = r'(\d+)\s+(.+)'
        match = re.match(piece_pattern, food_text, re.IGNORECASE)
        if match:
            num_pieces = int(match.group(1))
            food_name = match.group(2).strip()
            # Standard serving sizes for common foods
            serving_sizes = {
                'banana': 120, 'apple': 180, 'orange': 140, 'egg': 50,
                'chicken breast': 150, 'potato': 150, 'tomato': 120
            }
            quantity = num_pieces * serving_sizes.get(food_name.lower(), 100)
            return quantity, food_name
        
        # Default: 100g
        return 100, food_text.strip()
    
    async def _estimate_nutrition_with_ai(self, food_name: str, quantity: float) -> Optional[FoodNutrition]:
        """Use AI to estimate nutrition for foods not in database"""
        if not self.openai_api_key:
            return None
        
        try:
            prompt = f"""Estimate the nutritional information for {quantity}g of {food_name}.
Provide accurate values in this JSON format:
{{
    "calories": 0,
    "protein": 0,
    "carbs": 0,
    "fat": 0,
    "fiber": 0,
    "sugar": 0,
    "sodium": 0
}}
Only respond with the JSON object, no additional text."""
            
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=200
            )
            
            nutrition_data = json.loads(response.choices[0].message.content)
            
            return FoodNutrition(
                food_name=food_name,
                serving_size=f"{quantity}g",
                calories=nutrition_data["calories"],
                protein=nutrition_data["protein"],
                carbs=nutrition_data["carbs"],
                fat=nutrition_data["fat"],
                fiber=nutrition_data["fiber"],
                sugar=nutrition_data["sugar"],
                sodium=nutrition_data["sodium"],
                vitamins={},
                minerals={}
            )
        except Exception as e:
            logger.error(f"AI nutrition estimation failed: {e}")
            return None
    
    async def _generate_ai_insights(self, food_items: List[FoodNutrition], 
                                   total_calories: float, total_protein: float, 
                                   total_carbs: float, total_fat: float) -> str:
        """Generate AI insights about the meal"""
        if not self.openai_api_key or not food_items:
            return "Analysis complete. Food items logged successfully."
        
        try:
            food_names = [item.food_name for item in food_items]
            prompt = f"""Analyze this meal:
Foods: {', '.join(food_names)}
Total Calories: {total_calories} kcal
Protein: {total_protein}g, Carbs: {total_carbs}g, Fat: {total_fat}g

Provide a brief 2-3 sentence nutritional insight about this meal. Be encouraging and constructive."""
            
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=150
            )
            
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"AI insights generation failed: {e}")
            return "Meal logged successfully."
    
    async def _save_analysis_to_db(self, analysis: FoodAnalysisResult):
        """Save food analysis to MongoDB"""
        try:
            collection = db["food_analysis_history"]
            analysis_dict = analysis.dict()
            analysis_dict["_id"] = analysis.analysis_id
            await collection.insert_one(analysis_dict)
            logger.info(f"✅ Analysis saved to MongoDB: {analysis.analysis_id}")
        except Exception as e:
            logger.error(f"Failed to save analysis to MongoDB: {e}")
    
    async def add_to_nutrition_log(self, analysis_id: str, user_id: str, 
                                   meal_type: str, notes: Optional[str] = None) -> NutritionLogEntry:
        """
        Add analyzed food to nutrition log
        
        Args:
            analysis_id: ID of the food analysis
            user_id: User ID
            meal_type: Type of meal
            notes: Optional notes
            
        Returns:
            NutritionLogEntry
        """
        # Get the analysis from database
        analysis_collection = db["food_analysis_history"]
        analysis_doc = await analysis_collection.find_one({"_id": analysis_id})
        
        if not analysis_doc:
            raise ValueError(f"Analysis {analysis_id} not found")
        
        # Create nutrition log entry
        log_entry = NutritionLogEntry(
            log_id=str(ObjectId()),
            user_id=user_id,
            date=datetime.utcnow(),
            meal_type=meal_type,
            food_items=[FoodNutrition(**item) for item in analysis_doc["food_items"]],
            total_nutrition={
                "calories": analysis_doc["total_calories"],
                "protein": analysis_doc["total_protein"],
                "carbs": analysis_doc["total_carbs"],
                "fat": analysis_doc["total_fat"],
                "fiber": analysis_doc["total_fiber"]
            },
            analysis_id=analysis_id,
            notes=notes
        )
        
        # Save to nutrition logs collection
        logs_collection = db["nutrition_logs"]
        log_dict = log_entry.dict()
        log_dict["_id"] = log_entry.log_id
        await logs_collection.insert_one(log_dict)
        
        logger.info(f"✅ Added to nutrition log: {log_entry.log_id}")
        return log_entry

# ==================== NLP WEEKLY REPORT GENERATOR ====================

class NLPWeeklyReportGenerator:
    """
    Generate intelligent weekly meal summaries using NLP techniques
    """
    
    def __init__(self):
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        if self.openai_api_key:
            openai.api_key = self.openai_api_key
        
        # Initialize NLP summarization pipeline (fallback if OpenAI not available)
        try:
            self.summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
        except:
            self.summarizer = None
            logger.warning("NLP summarization model not available")
    
    async def generate_weekly_report(self, user_id: str, 
                                    week_start: Optional[datetime] = None) -> WeeklyMealSummary:
        """
        Generate comprehensive weekly meal report with NLP summarization
        
        Args:
            user_id: User ID
            week_start: Start date of the week (defaults to current week)
            
        Returns:
            WeeklyMealSummary with NLP-generated insights
        """
        if not week_start:
            week_start = datetime.utcnow() - timedelta(days=datetime.utcnow().weekday())
        week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
        week_end = week_start + timedelta(days=7)
        
        logger.info(f"📊 Generating weekly report for {user_id}: {week_start.date()} to {week_end.date()}")
        
        # Fetch nutrition logs for the week
        logs_collection = db["nutrition_logs"]
        cursor = logs_collection.find({
            "user_id": user_id,
            "date": {"$gte": week_start, "$lt": week_end}
        }).sort("date", 1)
        
        logs = await cursor.to_list(length=1000)
        
        if not logs:
            return await self._create_empty_report(user_id, week_start, week_end)
        
        # Analyze weekly data
        daily_nutrition = self._aggregate_daily_nutrition(logs)
        daily_averages = self._calculate_daily_averages(daily_nutrition)
        top_foods = self._identify_top_foods(logs)
        nutrition_trends = self._analyze_nutrition_trends(daily_nutrition)
        
        # Generate NLP summary
        nlp_summary = await self._generate_nlp_summary(
            logs, daily_averages, top_foods, nutrition_trends
        )
        
        # Generate recommendations
        recommendations = await self._generate_recommendations(
            daily_averages, nutrition_trends, top_foods
        )
        
        # Create weekly summary
        summary = WeeklyMealSummary(
            summary_id=str(ObjectId()),
            user_id=user_id,
            week_start=week_start,
            week_end=week_end,
            total_meals=len(logs),
            daily_averages=daily_averages,
            top_foods=top_foods,
            nutrition_trends=nutrition_trends,
            nlp_summary=nlp_summary,
            recommendations=recommendations
        )
        
        # Save to MongoDB
        await self._save_weekly_summary(summary)
        
        logger.info(f"✅ Weekly report generated: {summary.summary_id}")
        return summary
    
    def _aggregate_daily_nutrition(self, logs: List[Dict]) -> Dict[str, Dict]:
        """Aggregate nutrition data by day"""
        daily_data = {}
        
        for log in logs:
            date_key = log["date"].strftime("%Y-%m-%d")
            if date_key not in daily_data:
                daily_data[date_key] = {
                    "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0, "meals": 0
                }
            
            daily_data[date_key]["calories"] += log["total_nutrition"]["calories"]
            daily_data[date_key]["protein"] += log["total_nutrition"]["protein"]
            daily_data[date_key]["carbs"] += log["total_nutrition"]["carbs"]
            daily_data[date_key]["fat"] += log["total_nutrition"]["fat"]
            daily_data[date_key]["fiber"] += log["total_nutrition"]["fiber"]
            daily_data[date_key]["meals"] += 1
        
        return daily_data
    
    def _calculate_daily_averages(self, daily_nutrition: Dict) -> Dict[str, float]:
        """Calculate average daily nutrition"""
        if not daily_nutrition:
            return {"calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0}
        
        num_days = len(daily_nutrition)
        totals = {"calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0}
        
        for day_data in daily_nutrition.values():
            for nutrient in totals.keys():
                totals[nutrient] += day_data[nutrient]
        
        return {k: round(v / num_days, 1) for k, v in totals.items()}
    
    def _identify_top_foods(self, logs: List[Dict], top_n: int = 10) -> List[str]:
        """Identify most frequently consumed foods"""
        food_counts = {}
        
        for log in logs:
            for food_item in log.get("food_items", []):
                food_name = food_item["food_name"]
                food_counts[food_name] = food_counts.get(food_name, 0) + 1
        
        # Sort by frequency
        sorted_foods = sorted(food_counts.items(), key=lambda x: x[1], reverse=True)
        return [food[0] for food in sorted_foods[:top_n]]
    
    def _analyze_nutrition_trends(self, daily_nutrition: Dict) -> Dict[str, Any]:
        """Analyze nutrition trends over the week"""
        if not daily_nutrition:
            return {}
        
        # Calculate trends for each nutrient
        trends = {}
        for nutrient in ["calories", "protein", "carbs", "fat", "fiber"]:
            values = [day[nutrient] for day in daily_nutrition.values()]
            trends[nutrient] = {
                "min": round(min(values), 1),
                "max": round(max(values), 1),
                "avg": round(sum(values) / len(values), 1),
                "trend": "increasing" if values[-1] > values[0] else "decreasing" if values[-1] < values[0] else "stable"
            }
        
        return trends
    
    async def _generate_nlp_summary(self, logs: List[Dict], daily_averages: Dict,
                                   top_foods: List[str], nutrition_trends: Dict) -> str:
        """Generate NLP-based weekly summary"""
        if self.openai_api_key:
            return await self._generate_openai_summary(logs, daily_averages, top_foods, nutrition_trends)
        elif self.summarizer:
            return self._generate_transformer_summary(logs, daily_averages, top_foods)
        else:
            return self._generate_template_summary(daily_averages, top_foods)
    
    async def _generate_openai_summary(self, logs, daily_averages, top_foods, nutrition_trends) -> str:
        """Generate summary using OpenAI GPT"""
        try:
            prompt = f"""Generate a comprehensive yet concise weekly meal summary based on this data:

Total Meals Logged: {len(logs)}
Daily Average Nutrition:
- Calories: {daily_averages['calories']} kcal
- Protein: {daily_averages['protein']}g
- Carbs: {daily_averages['carbs']}g
- Fat: {daily_averages['fat']}g
- Fiber: {daily_averages['fiber']}g

Top Foods Consumed: {', '.join(top_foods[:5])}

Calorie Trend: {nutrition_trends.get('calories', {}).get('trend', 'stable')}
Protein Trend: {nutrition_trends.get('protein', {}).get('trend', 'stable')}

Write a friendly, encouraging 4-5 sentence summary highlighting:
1. Overall nutrition quality
2. Notable patterns or achievements
3. Key strengths
4. One area for gentle improvement

Be positive and motivating."""
            
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=250
            )
            
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"OpenAI summary generation failed: {e}")
            return self._generate_template_summary(daily_averages, top_foods)
    
    def _generate_template_summary(self, daily_averages: Dict, top_foods: List[str]) -> str:
        """Generate template-based summary (fallback)"""
        return f"""This week you logged meals with an average of {daily_averages['calories']:.0f} calories per day. 
Your protein intake averaged {daily_averages['protein']:.1f}g daily, while carbs were {daily_averages['carbs']:.1f}g and fats {daily_averages['fat']:.1f}g. 
Your most frequently consumed foods included {', '.join(top_foods[:3])}. 
Overall, you're maintaining consistent nutrition tracking - keep up the great work!"""
    
    async def _generate_recommendations(self, daily_averages: Dict, 
                                       nutrition_trends: Dict, top_foods: List[str]) -> List[str]:
        """Generate personalized recommendations"""
        recommendations = []
        
        # Calorie recommendations
        if daily_averages["calories"] < 1200:
            recommendations.append("Consider increasing your daily calorie intake to meet your body's energy needs.")
        elif daily_averages["calories"] > 2500:
            recommendations.append("You might want to monitor your portion sizes to maintain a balanced calorie intake.")
        
        # Protein recommendations
        if daily_averages["protein"] < 50:
            recommendations.append("Try to include more protein-rich foods like chicken, fish, eggs, or legumes in your meals.")
        
        # Fiber recommendations
        if daily_averages["fiber"] < 25:
            recommendations.append("Increase your fiber intake by adding more vegetables, fruits, and whole grains to your diet.")
        
        # Variety recommendations
        if len(top_foods) < 5:
            recommendations.append("Try to diversify your diet by exploring new food options for better nutritional variety.")
        
        # Trend-based recommendations
        if nutrition_trends.get("calories", {}).get("trend") == "increasing":
            recommendations.append("Your calorie intake has been increasing this week - monitor if this aligns with your health goals.")
        
        return recommendations[:5]  # Return top 5 recommendations
    
    async def _save_weekly_summary(self, summary: WeeklyMealSummary):
        """Save weekly summary to MongoDB"""
        try:
            collection = db["weekly_meal_summaries"]
            summary_dict = summary.dict()
            summary_dict["_id"] = summary.summary_id
            await collection.insert_one(summary_dict)
            logger.info(f"✅ Weekly summary saved: {summary.summary_id}")
        except Exception as e:
            logger.error(f"Failed to save weekly summary: {e}")
    
    async def _create_empty_report(self, user_id: str, week_start: datetime, 
                                  week_end: datetime) -> WeeklyMealSummary:
        """Create empty report when no data available"""
        return WeeklyMealSummary(
            summary_id=str(ObjectId()),
            user_id=user_id,
            week_start=week_start,
            week_end=week_end,
            total_meals=0,
            daily_averages={"calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0},
            top_foods=[],
            nutrition_trends={},
            nlp_summary="No meals logged this week. Start tracking your nutrition to see personalized insights!",
            recommendations=["Begin logging your meals to track your nutrition journey."]
        )

# Export classes
__all__ = [
    'EnhancedAccurateFoodAnalyzer',
    'NLPWeeklyReportGenerator',
    'FoodAnalysisResult',
    'NutritionLogEntry',
    'WeeklyMealSummary'
]
