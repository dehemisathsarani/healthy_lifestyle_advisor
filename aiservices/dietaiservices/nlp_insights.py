"""
NLP-Enhanced Diet Insights System
Features:
1. Abstractive Summarizers with prompt engineering
2. Heuristic Insight Generators with rule-based analysis
3. Professional Report Blocks for daily/weekly summaries
"""

from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum
import json
import re
from pydantic import BaseModel


class InsightPriority(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ReportType(Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


@dataclass
class NutritionInsight:
    """Structured insight with priority and category"""
    category: str
    message: str
    priority: InsightPriority
    rule_triggered: str
    suggested_action: Optional[str] = None
    confidence: float = 1.0


@dataclass
class DayNutritionData:
    """Structured daily nutrition data"""
    date: str
    calories: float
    protein: float
    carbs: float
    fat: float
    fiber: float
    sodium: float
    sugar: float
    water_intake: float
    meals_count: int
    calorie_target: float
    activity_level: str


class HeuristicInsightGenerator:
    """Rule-based insight generator using nutrition science guidelines"""
    
    def __init__(self):
        self.rules = {
            # Sodium Rules (WHO guidelines: <2.3g/day)
            "high_sodium": {
                "condition": lambda data: data.sodium > 2300,
                "message": "High sodium intake detected",
                "priority": InsightPriority.HIGH,
                "action": "Reduce processed foods, choose low-sodium alternatives"
            },
            "moderate_sodium": {
                "condition": lambda data: 1800 <= data.sodium <= 2300,
                "message": "Sodium intake approaching upper limit",
                "priority": InsightPriority.MEDIUM,
                "action": "Monitor sodium in packaged foods"
            },
            
            # Calorie Balance Rules
            "calorie_deficit_large": {
                "condition": lambda data: (data.calorie_target - data.calories) > 500,
                "message": "Large calorie deficit - may affect energy levels",
                "priority": InsightPriority.MEDIUM,
                "action": "Add healthy snacks to meet calorie needs"
            },
            "calorie_surplus_large": {
                "condition": lambda data: (data.calories - data.calorie_target) > 300,
                "message": "Calorie intake significantly above target",
                "priority": InsightPriority.MEDIUM,
                "action": "Consider smaller portions or more physical activity"
            },
            
            # Protein Rules (0.8-1.2g per kg body weight)
            "low_protein": {
                "condition": lambda data: data.protein < 50,  # Minimum for average adult
                "message": "Protein intake below recommended minimum",
                "priority": InsightPriority.HIGH,
                "action": "Include lean proteins: chicken, fish, legumes, or eggs"
            },
            "high_protein": {
                "condition": lambda data: data.protein > 150,
                "message": "Very high protein intake",
                "priority": InsightPriority.LOW,
                "action": "Ensure adequate hydration with high protein intake"
            },
            
            # Fiber Rules (25-35g daily)
            "low_fiber": {
                "condition": lambda data: data.fiber < 15,
                "message": "Low fiber intake - digestive health concern",
                "priority": InsightPriority.MEDIUM,
                "action": "Add fruits, vegetables, whole grains, and legumes"
            },
            "excellent_fiber": {
                "condition": lambda data: data.fiber >= 30,
                "message": "Excellent fiber intake for digestive health",
                "priority": InsightPriority.LOW,
                "action": "Maintain this healthy fiber level"
            },
            
            # Sugar Rules (WHO: <10% of total calories)
            "high_sugar": {
                "condition": lambda data: data.sugar > (data.calories * 0.15 / 4),  # 15% as warning threshold
                "message": "High sugar intake detected",
                "priority": InsightPriority.MEDIUM,
                "action": "Reduce added sugars, choose whole fruits over juices"
            },
            
            # Hydration Rules
            "low_hydration": {
                "condition": lambda data: data.water_intake < 1500,  # mL
                "message": "Low water intake - hydration below recommended",
                "priority": InsightPriority.MEDIUM,
                "action": "Aim for 8-10 glasses of water daily"
            },
            "excellent_hydration": {
                "condition": lambda data: data.water_intake >= 2500,
                "message": "Excellent hydration levels maintained",
                "priority": InsightPriority.LOW,
                "action": "Great job staying hydrated!"
            },
            
            # Meal Frequency Rules
            "too_few_meals": {
                "condition": lambda data: data.meals_count < 2,
                "message": "Very few meals logged - may affect metabolism",
                "priority": InsightPriority.MEDIUM,
                "action": "Aim for 3-4 balanced meals throughout the day"
            },
            "frequent_eating": {
                "condition": lambda data: data.meals_count > 6,
                "message": "Frequent eating pattern detected",
                "priority": InsightPriority.LOW,
                "action": "Ensure portion control with frequent meals"
            }
        }
    
    def generate_insights(self, nutrition_data: DayNutritionData) -> List[NutritionInsight]:
        """Generate rule-based insights from nutrition data"""
        insights = []
        
        for rule_name, rule in self.rules.items():
            try:
                if rule["condition"](nutrition_data):
                    insight = NutritionInsight(
                        category=self._get_category_from_rule(rule_name),
                        message=rule["message"],
                        priority=rule["priority"],
                        rule_triggered=rule_name,
                        suggested_action=rule["action"],
                        confidence=1.0
                    )
                    insights.append(insight)
            except Exception as e:
                print(f"Error evaluating rule {rule_name}: {e}")
                continue
        
        # Sort by priority
        priority_order = {
            InsightPriority.CRITICAL: 0,
            InsightPriority.HIGH: 1,
            InsightPriority.MEDIUM: 2,
            InsightPriority.LOW: 3
        }
        insights.sort(key=lambda x: priority_order[x.priority])
        
        return insights
    
    def _get_category_from_rule(self, rule_name: str) -> str:
        """Extract category from rule name"""
        if "sodium" in rule_name:
            return "Sodium"
        elif "calorie" in rule_name:
            return "Calories"
        elif "protein" in rule_name:
            return "Protein"
        elif "fiber" in rule_name:
            return "Fiber"
        elif "sugar" in rule_name:
            return "Sugar"
        elif "hydration" in rule_name:
            return "Hydration"
        elif "meal" in rule_name:
            return "Meal Timing"
        else:
            return "General"


class AbstractiveSummarizer:
    """Prompt-engineered abstractive summarizer for nutrition data"""
    
    def __init__(self):
        self.daily_summary_prompt = """
        You are a professional nutritionist creating a concise daily summary.
        
        CONSTRAINTS:
        - Maximum 70 words total
        - 3 key bullet points + 1 actionable suggestion
        - Use encouraging, non-judgmental language
        - Focus on achievements and improvements
        
        NUTRITION DATA: {nutrition_json}
        INSIGHTS: {insights_summary}
        
        FORMAT:
        • [Achievement/observation 1]
        • [Achievement/observation 2] 
        • [Achievement/observation 3]
        💡 [One specific, actionable suggestion]
        """
        
        self.weekly_summary_prompt = """
        You are a professional nutritionist creating a weekly progress narrative.
        
        CONSTRAINTS:
        - Maximum 4 sentences
        - Focus on trends and patterns
        - Encouraging and motivational tone
        - Include one specific recommendation
        
        WEEKLY DATA: {weekly_data}
        KEY TRENDS: {trends}
        
        Write a supportive 4-sentence summary focusing on progress and next steps.
        """
    
    def create_daily_summary(self, nutrition_data: DayNutritionData, insights: List[NutritionInsight]) -> str:
        """Generate a 70-word daily summary with 3 bullets + 1 suggestion"""
        
        # Prepare simplified data for prompt
        nutrition_json = {
            "calories": f"{nutrition_data.calories:.0f}/{nutrition_data.calorie_target:.0f}",
            "protein": f"{nutrition_data.protein:.0f}g",
            "fiber": f"{nutrition_data.fiber:.0f}g",
            "water": f"{nutrition_data.water_intake:.0f}ml",
            "meals": nutrition_data.meals_count
        }
        
        # Summarize top insights
        insights_summary = []
        for insight in insights[:3]:  # Top 3 insights
            insights_summary.append(f"{insight.category}: {insight.message}")
        
        # Since we don't have LLM integration, create rule-based summary
        return self._generate_rule_based_daily_summary(nutrition_data, insights)
    
    def generate_summary(self, nutrition_data: DayNutritionData) -> Dict[str, Any]:
        """Generate structured summary with daily overview, key insights, and suggestion"""
        insights = HeuristicInsightGenerator().generate_insights(nutrition_data)
        
        # Generate daily overview (approximately 70 words)
        daily_overview = self._generate_daily_overview(nutrition_data)
        
        # Generate key insights (3 bullet points)
        key_insights = self._generate_key_insights(nutrition_data, insights)
        
        # Generate actionable suggestion
        actionable_suggestion = self._generate_actionable_suggestion(nutrition_data, insights)
        
        return {
            "daily_overview": daily_overview,
            "key_insights": key_insights,
            "actionable_suggestion": actionable_suggestion
        }
    
    def _generate_daily_overview(self, data: DayNutritionData) -> str:
        """Generate approximately 70-word overview"""
        calorie_status = "on track" if abs(data.calories - data.calorie_target) <= 100 else ("above" if data.calories > data.calorie_target else "below")
        protein_status = "excellent" if data.protein >= 80 else ("good" if data.protein >= 50 else "low")
        fiber_status = "excellent" if data.fiber >= 25 else ("good" if data.fiber >= 15 else "low")
        hydration_status = "well-hydrated" if data.water_intake >= 2000 else "needs improvement"
        
        overview = f"Today's nutrition shows {data.calories:.0f} calories, {calorie_status} with your {data.calorie_target:.0f} target. "
        overview += f"Your protein intake of {data.protein:.0f}g was {protein_status}, while fiber at {data.fiber:.0f}g was {fiber_status}. "
        overview += f"With {data.water_intake:.0f}ml water intake, hydration {hydration_status}. "
        overview += f"You consumed {data.meals_count} meals throughout the day, maintaining a {data.activity_level} lifestyle."
        
        return overview
    
    def _generate_key_insights(self, data: DayNutritionData, insights: List[NutritionInsight]) -> List[str]:
        """Generate exactly 3 key insights as bullet points"""
        bullet_insights = []
        
        # Insight 1: Calorie performance
        calorie_diff = data.calories - data.calorie_target
        if abs(calorie_diff) <= 50:
            bullet_insights.append("Excellent calorie target achievement - you're right on track!")
        elif calorie_diff > 0:
            bullet_insights.append(f"Consumed {calorie_diff:.0f} calories above target - consider smaller portions tomorrow")
        else:
            bullet_insights.append(f"Consumed {abs(calorie_diff):.0f} calories below target - ensure adequate fuel for your body")
        
        # Insight 2: Macro balance or top concern
        if insights and insights[0].priority in [InsightPriority.HIGH, InsightPriority.CRITICAL]:
            bullet_insights.append(f"{insights[0].category} attention needed: {insights[0].message.lower()}")
        else:
            protein_pct = (data.protein * 4) / (data.calories if data.calories > 0 else 1) * 100
            if protein_pct >= 15:
                bullet_insights.append(f"Strong protein balance at {protein_pct:.0f}% of calories - great for muscle maintenance")
            else:
                bullet_insights.append(f"Protein at {protein_pct:.0f}% of calories - aim for 15-25% for optimal nutrition")
        
        # Insight 3: Positive achievement or improvement area
        if data.fiber >= 25:
            bullet_insights.append(f"Outstanding fiber intake at {data.fiber:.0f}g - excellent for digestive health")
        elif data.water_intake >= 2500:
            bullet_insights.append(f"Exceptional hydration at {data.water_intake:.0f}ml - keep up the great work!")
        elif data.meals_count >= 3:
            bullet_insights.append(f"Good meal frequency with {data.meals_count} meals - helps maintain stable energy")
        else:
            bullet_insights.append("Focus on consistent meal timing and hydration for better energy levels")
        
        return bullet_insights[:3]  # Ensure exactly 3 insights
    
    def _generate_actionable_suggestion(self, data: DayNutritionData, insights: List[NutritionInsight]) -> str:
        """Generate one specific actionable suggestion"""
        # Prioritize based on insights
        if insights:
            top_insight = insights[0]
            if top_insight.suggested_action:
                return top_insight.suggested_action
        
        # Fallback suggestions based on data
        if data.water_intake < 2000:
            return "Aim to drink an additional 2-3 glasses of water tomorrow"
        elif data.fiber < 20:
            return "Add one serving of fruits or vegetables to tomorrow's meals"
        elif data.protein < 60:
            return "Include a palm-sized portion of lean protein with each meal"
        elif abs(data.calories - data.calorie_target) > 200:
            return "Plan your meals in advance to better meet your calorie targets"
        else:
            return "Continue your excellent nutrition habits and stay consistent!"
    
    def create_weekly_summary(self, weekly_data: List[DayNutritionData]) -> str:
        """Generate a 4-sentence weekly narrative"""
        if not weekly_data:
            return "No nutrition data available for this week."
        
        # Calculate weekly averages and trends
        avg_calories = sum(day.calories for day in weekly_data) / len(weekly_data)
        avg_target = sum(day.calorie_target for day in weekly_data) / len(weekly_data)
        avg_protein = sum(day.protein for day in weekly_data) / len(weekly_data)
        avg_fiber = sum(day.fiber for day in weekly_data) / len(weekly_data)
        
        # Generate rule-based weekly summary
        return self._generate_rule_based_weekly_summary(weekly_data, avg_calories, avg_target, avg_protein, avg_fiber)
    
    def _generate_rule_based_daily_summary(self, data: DayNutritionData, insights: List[NutritionInsight]) -> str:
        """Generate daily summary using rules"""
        bullets = []
        
        # Calorie achievement
        calorie_diff = data.calories - data.calorie_target
        if abs(calorie_diff) <= 100:
            bullets.append("Excellent calorie target achievement")
        elif calorie_diff > 100:
            bullets.append(f"Calories {calorie_diff:.0f} above target")
        else:
            bullets.append(f"Calories {abs(calorie_diff):.0f} below target")
        
        # Protein achievement
        if data.protein >= 80:
            bullets.append(f"Strong protein intake ({data.protein:.0f}g)")
        elif data.protein >= 50:
            bullets.append(f"Adequate protein ({data.protein:.0f}g)")
        else:
            bullets.append(f"Low protein intake ({data.protein:.0f}g)")
        
        # Fiber or hydration achievement
        if data.fiber >= 25:
            bullets.append(f"Excellent fiber intake ({data.fiber:.0f}g)")
        elif data.water_intake >= 2000:
            bullets.append(f"Good hydration ({data.water_intake:.0f}ml)")
        else:
            bullets.append("Room for improvement in fiber/hydration")
        
        # Suggestion based on top insight
        suggestion = "Continue your healthy eating habits!"
        if insights:
            top_insight = insights[0]
            if top_insight.suggested_action:
                suggestion = top_insight.suggested_action
        
        return f"• {bullets[0]}\n• {bullets[1]}\n• {bullets[2]}\n💡 {suggestion}"
    
    def _generate_rule_based_weekly_summary(self, weekly_data: List[DayNutritionData], 
                                          avg_calories: float, avg_target: float,
                                          avg_protein: float, avg_fiber: float) -> str:
        """Generate weekly summary using rules"""
        
        # Analyze consistency
        calorie_consistency = self._calculate_consistency([day.calories for day in weekly_data])
        protein_consistency = self._calculate_consistency([day.protein for day in weekly_data])
        
        # Build narrative
        sentences = []
        
        # Sentence 1: Overall performance
        calorie_diff = avg_calories - avg_target
        if abs(calorie_diff) <= 50:
            sentences.append("This week showed excellent calorie target consistency.")
        elif calorie_diff > 0:
            sentences.append(f"This week averaged {calorie_diff:.0f} calories above your target.")
        else:
            sentences.append(f"This week averaged {abs(calorie_diff):.0f} calories below your target.")
        
        # Sentence 2: Protein performance
        if avg_protein >= 80:
            sentences.append(f"Your protein intake was strong, averaging {avg_protein:.0f}g daily.")
        else:
            sentences.append(f"Protein intake averaged {avg_protein:.0f}g, with room for improvement.")
        
        # Sentence 3: Consistency observation
        if calorie_consistency > 0.8:
            sentences.append("You maintained consistent eating patterns throughout the week.")
        else:
            sentences.append("Your eating patterns varied significantly day-to-day.")
        
        # Sentence 4: Recommendation
        if avg_fiber < 20:
            sentences.append("Focus on adding more fiber-rich foods like fruits and vegetables next week.")
        elif avg_protein < 70:
            sentences.append("Consider adding lean proteins to each meal to optimize your nutrition.")
        else:
            sentences.append("Keep up the great work and maintain these healthy habits!")
        
        return " ".join(sentences)
    
    def _calculate_consistency(self, values: List[float]) -> float:
        """Calculate consistency score (1 - coefficient of variation)"""
        if not values or len(values) < 2:
            return 1.0
        
        mean_val = sum(values) / len(values)
        if mean_val == 0:
            return 1.0
        
        variance = sum((x - mean_val) ** 2 for x in values) / len(values)
        std_dev = variance ** 0.5
        cv = std_dev / mean_val
        
        return max(0, 1 - cv)


class ReportBlockGenerator:
    """Generate professional report blocks for daily cards and weekly emails"""
    
    def __init__(self):
        self.insight_generator = HeuristicInsightGenerator()
        self.summarizer = AbstractiveSummarizer()
    
    def generate_daily_card(self, nutrition_data: DayNutritionData) -> Dict[str, Any]:
        """Generate daily card with calories, macros, and one swap suggestion"""
        
        insights = self.insight_generator.generate_insights(nutrition_data)
        summary = self.summarizer.create_daily_summary(nutrition_data, insights)
        
        # Calculate macro percentages
        total_macros = nutrition_data.protein * 4 + nutrition_data.carbs * 4 + nutrition_data.fat * 9
        protein_pct = (nutrition_data.protein * 4 / total_macros * 100) if total_macros > 0 else 0
        carbs_pct = (nutrition_data.carbs * 4 / total_macros * 100) if total_macros > 0 else 0
        fat_pct = (nutrition_data.fat * 9 / total_macros * 100) if total_macros > 0 else 0
        
        # Generate one smart swap suggestion
        swap_suggestion = self._generate_smart_swap(nutrition_data, insights)
        
        return {
            "date": nutrition_data.date,
            "calories": {
                "consumed": nutrition_data.calories,
                "target": nutrition_data.calorie_target,
                "progress_percentage": (nutrition_data.calories / nutrition_data.calorie_target * 100) if nutrition_data.calorie_target > 0 else 0
            },
            "macro_breakdown": {
                "protein": {"grams": nutrition_data.protein, "percentage": protein_pct},
                "carbs": {"grams": nutrition_data.carbs, "percentage": carbs_pct},
                "fat": {"grams": nutrition_data.fat, "percentage": fat_pct}
            },
            "progress_bars": {
                "calorie_progress": (nutrition_data.calories / nutrition_data.calorie_target * 100) if nutrition_data.calorie_target > 0 else 0,
                "protein_progress": min(100, (nutrition_data.protein / 150) * 100),  # Assuming 150g target
                "fiber_progress": min(100, (nutrition_data.fiber / 25) * 100),  # Assuming 25g target
                "water_progress": min(100, (nutrition_data.water_intake / 2000) * 100)  # Assuming 2000ml target
            },
            "smart_swaps": [swap_suggestion] if swap_suggestion else [],
            "achievement_badges": self._generate_achievement_badges(nutrition_data),
            "daily_summary": summary,
            "insights_count": len(insights),
            "top_priority": insights[0].priority.value if insights else "none"
        }
    
    def generate_weekly_email(self, weekly_data: List[DayNutritionData]) -> Dict[str, Any]:
        """Generate weekly email with trend chart data and 4-sentence narrative"""
        
        if not weekly_data:
            return {"error": "No data available for weekly report"}
        
        # Generate trend data for charts
        trend_data = {
            "dates": [day.date for day in weekly_data],
            "calories": [day.calories for day in weekly_data],
            "calorie_targets": [day.calorie_target for day in weekly_data],
            "protein": [day.protein for day in weekly_data],
            "fiber": [day.fiber for day in weekly_data],
            "water": [day.water_intake for day in weekly_data]
        }
        
        # Calculate weekly statistics
        weekly_stats = {
            "avg_calories": sum(day.calories for day in weekly_data) / len(weekly_data),
            "avg_protein": sum(day.protein for day in weekly_data) / len(weekly_data),
            "avg_fiber": sum(day.fiber for day in weekly_data) / len(weekly_data),
            "days_logged": len(weekly_data),
            "total_meals": sum(day.meals_count for day in weekly_data),
            "calorie_accuracy": self._calculate_target_accuracy(weekly_data)
        }
        
        # Generate insights for the week
        weekly_insights = []
        for day in weekly_data:
            day_insights = self.insight_generator.generate_insights(day)
            weekly_insights.extend(day_insights)
        
        # Group insights by category
        insight_summary = self._summarize_weekly_insights(weekly_insights)
        
        # Generate narrative
        narrative = self.summarizer.create_weekly_summary(weekly_data)
        
        return {
            "week_period": f"{weekly_data[0].date} to {weekly_data[-1].date}",
            "trend_data": trend_data,
            "weekly_stats": weekly_stats,
            "narrative": narrative,
            "insight_summary": insight_summary,
            "achievement_badges": self._generate_achievement_badges(weekly_data, weekly_insights),
            "next_week_focus": self._generate_next_week_focus(weekly_insights)
        }
    
    def _generate_smart_swap(self, nutrition_data: DayNutritionData, insights: List[NutritionInsight]) -> str:
        """Generate one smart food swap suggestion"""
        # Base swaps on top insights
        if insights:
            top_insight = insights[0]
            if "sodium" in top_insight.rule_triggered:
                return "Swap processed snacks → fresh fruits or unsalted nuts"
            elif "protein" in top_insight.rule_triggered:
                return "Add Greek yogurt or lean chicken to your next meal"
            elif "fiber" in top_insight.rule_triggered:
                return "Replace white rice → brown rice or quinoa"
            elif insight.rule_triggered == "calorie_surplus_large":
                return "Swap: Use a smaller plate to help with portion control"
        
        # Default suggestions based on general optimization
        if data.protein < 80:
            return "Swap: Add lean protein to your largest meal"
        elif data.fiber < 20:
            return "Swap: Choose whole grain versions of your carbs"
        elif data.water_intake < 2000:
            return "Swap: Replace one beverage with water"
        else:
            return "Keep up the great work! Your nutrition is well-balanced."
    
    def _calculate_target_accuracy(self, weekly_data: List[DayNutritionData]) -> float:
        """Calculate how close calories were to targets on average"""
        if not weekly_data:
            return 0.0
        
        accuracies = []
        for day in weekly_data:
            if day.calorie_target > 0:
                accuracy = 1 - abs(day.calories - day.calorie_target) / day.calorie_target
                accuracies.append(max(0, accuracy))
        
        return sum(accuracies) / len(accuracies) if accuracies else 0.0
    
    def _summarize_weekly_insights(self, insights: List[NutritionInsight]) -> Dict[str, int]:
        """Summarize insights by category and priority"""
        summary = {}
        
        for insight in insights:
            category = insight.category
            if category not in summary:
                summary[category] = {"total": 0, "high_priority": 0}
            
            summary[category]["total"] += 1
            if insight.priority in [InsightPriority.HIGH, InsightPriority.CRITICAL]:
                summary[category]["high_priority"] += 1
        
        return summary
    
    def _generate_achievement_badges(self, weekly_data: List[DayNutritionData], 
                                   insights: List[NutritionInsight]) -> List[str]:
        """Generate achievement badges for the week"""
        badges = []
        
        # Consistency badges
        if len(weekly_data) >= 7:
            badges.append("🌟 Perfect Week - Logged all 7 days!")
        elif len(weekly_data) >= 5:
            badges.append("💪 Consistent Logger - 5+ days tracked")
        
        # Nutrition badges
        avg_protein = sum(day.protein for day in weekly_data) / len(weekly_data)
        if avg_protein >= 90:
            badges.append("🥩 Protein Champion - Excellent intake")
        
        avg_fiber = sum(day.fiber for day in weekly_data) / len(weekly_data)
        if avg_fiber >= 25:
            badges.append("🥬 Fiber Hero - Great digestive health")
        
        # Hydration badge
        avg_water = sum(day.water_intake for day in weekly_data) / len(weekly_data)
        if avg_water >= 2500:
            badges.append("💧 Hydration Master - Well hydrated!")
        
        # Low-issue badge
        high_priority_issues = sum(1 for i in insights if i.priority == InsightPriority.HIGH)
        if high_priority_issues == 0:
            badges.append("✅ Clean Week - No major nutrition concerns")
        
        return badges
    
    def _generate_next_week_focus(self, insights: List[NutritionInsight]) -> str:
        """Generate focus area for next week"""
        
        # Count insight categories
        category_counts = {}
        for insight in insights:
            if insight.priority in [InsightPriority.HIGH, InsightPriority.MEDIUM]:
                category = insight.category
                category_counts[category] = category_counts.get(category, 0) + 1
        
        if not category_counts:
            return "Continue maintaining your excellent nutrition habits!"
        
        # Find most frequent issue
        top_category = max(category_counts, key=category_counts.get)
        
        focus_recommendations = {
            "Sodium": "Focus on reducing sodium by choosing fresh foods over processed options",
            "Protein": "Prioritize adding lean protein sources to each meal",
            "Fiber": "Emphasize fruits, vegetables, and whole grains for better fiber intake", 
            "Hydration": "Set reminders to drink water throughout the day",
            "Calories": "Work on portion awareness and meal timing",
            "Sugar": "Reduce added sugars and choose whole fruits over juices"
        }
        
        return focus_recommendations.get(top_category, "Continue working on balanced nutrition")


# Integration class for the main Diet Agent
class NLPEnhancedDietAgent:
    """Main integration class for NLP-enhanced diet insights"""
    
    def __init__(self):
        self.insight_generator = HeuristicInsightGenerator()
        self.summarizer = AbstractiveSummarizer()
        self.report_generator = ReportBlockGenerator()
    
    def analyze_daily_nutrition(self, nutrition_data: DayNutritionData) -> Dict[str, Any]:
        """Complete daily analysis with insights and reports"""
        
        insights = self.insight_generator.generate_insights(nutrition_data)
        daily_card = self.report_generator.generate_daily_card(nutrition_data)
        
        return {
            "date": nutrition_data.date,
            "insights": [
                {
                    "category": insight.category,
                    "message": insight.message,
                    "priority": insight.priority.value,
                    "action": insight.suggested_action,
                    "confidence": insight.confidence
                }
                for insight in insights
            ],
            "daily_card": daily_card,
            "summary": daily_card["summary"]
        }
    
    def generate_weekly_report(self, weekly_data: List[DayNutritionData]) -> Dict[str, Any]:
        """Complete weekly analysis with trends and recommendations"""
        
        weekly_email = self.report_generator.generate_weekly_email(weekly_data)
        
        return {
            "report_type": "weekly",
            "generated_at": datetime.now().isoformat(),
            **weekly_email
        }
    
    def get_nutrition_insights(self, nutrition_data: DayNutritionData) -> List[Dict[str, Any]]:
        """Get just the insights for a day"""
        insights = self.insight_generator.generate_insights(nutrition_data)
        
        return [
            {
                "category": insight.category,
                "message": insight.message,
                "priority": insight.priority.value,
                "suggested_action": insight.suggested_action,
                "rule_triggered": insight.rule_triggered,
                "confidence": insight.confidence
            }
            for insight in insights
        ]
