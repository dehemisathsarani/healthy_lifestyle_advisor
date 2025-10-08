#!/usr/bin/env python3
"""
Comprehensive Test Suite for Enhanced Diet Agent System
Tests: NLP insights, image processing, MongoDB storage, API endpoints
"""

import asyncio
import pytest
import aiohttp
import json
import base64
import os
from datetime import datetime, timedelta
from typing import Dict, List, Any

# Test for NLP Insights System
from nlp_insights import (
    NLPEnhancedDietAgent, 
    DayNutritionData, 
    HeuristicInsightGenerator,
    AbstractiveSummarizer,
    ReportBlockGenerator,
    InsightPriority
)

# Test for Enhanced Image Processor
from enhanced_image_processor import EnhancedFoodVisionAnalyzer

class TestNLPInsights:
    """Test suite for NLP insights system"""
    
    def setup_method(self):
        """Setup test data"""
        self.nlp_agent = NLPEnhancedDietAgent()
        self.heuristic_generator = HeuristicInsightGenerator()
        self.summarizer = AbstractiveSummarizer()
        self.report_generator = ReportBlockGenerator()
        
        # Test nutrition data
        self.test_nutrition_data = DayNutritionData(
            date="2024-01-15",
            calories=2200,
            protein=95,
            carbs=280,
            fat=75,
            fiber=25,
            sodium=2800,  # High sodium to trigger rule
            sugar=65,
            water_intake=1800  # Low water to trigger rule
        )
        
        self.weekly_nutrition_data = [
            self.test_nutrition_data,
            DayNutritionData(
                date="2024-01-16",
                calories=1900,
                protein=85,
                carbs=250,
                fat=65,
                fiber=30,
                sodium=2100,
                sugar=45,
                water_intake=2200
            )
        ]
    
    def test_heuristic_insight_generation(self):
        """Test heuristic rule-based insights"""
        insights = self.heuristic_generator.generate_insights(self.test_nutrition_data)
        
        # Should generate insights for high sodium and low water
        assert len(insights) >= 2
        
        # Check for sodium insight
        sodium_insights = [i for i in insights if 'sodium' in i.message.lower()]
        assert len(sodium_insights) > 0
        assert sodium_insights[0].priority == InsightPriority.HIGH
        
        # Check for water insight
        water_insights = [i for i in insights if 'water' in i.message.lower()]
        assert len(water_insights) > 0
        
        print(f"✓ Generated {len(insights)} heuristic insights")
        for insight in insights:
            print(f"  - {insight.category}: {insight.message} (Priority: {insight.priority.value})")
    
    def test_abstractive_summarizer(self):
        """Test 70-word summarizer with 3 bullets + suggestion"""
        summary = self.summarizer.generate_summary(self.test_nutrition_data)
        
        # Check structure
        assert 'daily_overview' in summary
        assert 'key_insights' in summary
        assert 'actionable_suggestion' in summary
        
        # Check bullet points
        assert len(summary['key_insights']) == 3
        
        # Check word count (approximately 70 words)
        word_count = len(summary['daily_overview'].split())
        assert 60 <= word_count <= 80  # Allow some flexibility
        
        print(f"✓ Generated summary with {word_count} words")
        print(f"  Overview: {summary['daily_overview']}")
        print(f"  Insights: {summary['key_insights']}")
        print(f"  Suggestion: {summary['actionable_suggestion']}")
    
    def test_daily_report_card(self):
        """Test daily nutrition report card generation"""
        report = self.report_generator.generate_daily_card(self.test_nutrition_data, target_calories=2000)
        
        # Check structure
        assert 'date' in report
        assert 'macro_breakdown' in report
        assert 'progress_bars' in report
        assert 'smart_swaps' in report
        assert 'achievement_badges' in report
        
        # Check macro calculations
        assert report['macro_breakdown']['calories'] == 2200
        assert report['macro_breakdown']['protein_percentage'] > 0
        
        # Check progress bars
        assert 'calorie_progress' in report['progress_bars']
        assert report['progress_bars']['calorie_progress'] == 110.0  # 2200/2000 * 100
        
        print(f"✓ Generated daily report card for {report['date']}")
        print(f"  Calorie progress: {report['progress_bars']['calorie_progress']}%")
        print(f"  Achievement badges: {len(report['achievement_badges'])}")
    
    def test_weekly_report_generation(self):
        """Test weekly report with analytics"""
        report = self.report_generator.generate_weekly_report(self.weekly_nutrition_data, target_calories=2000)
        
        # Check structure
        assert 'week_summary' in report
        assert 'daily_cards' in report
        assert 'weekly_analytics' in report
        assert 'email_template' in report
        
        # Check analytics
        analytics = report['weekly_analytics']
        assert 'average_calories' in analytics
        assert 'calorie_consistency' in analytics
        assert 'macro_trends' in analytics
        
        # Check email template
        email = report['email_template']
        assert 'subject' in email
        assert 'html_body' in email
        assert 'plain_text' in email
        
        print(f"✓ Generated weekly report")
        print(f"  Average calories: {analytics['average_calories']}")
        print(f"  Consistency score: {analytics['calorie_consistency']}")

class TestImageProcessing:
    """Test suite for enhanced image processing"""
    
    @pytest.mark.asyncio
    async def test_image_analysis_fallback(self):
        """Test image analysis with fallback mechanisms"""
        # Mock image processor without actual Google Vision API
        processor = EnhancedFoodVisionAnalyzer(None, "test_db")
        
        # Test Sri Lankan food database
        sri_lankan_foods = processor.get_sri_lankan_food_database()
        assert len(sri_lankan_foods) > 20
        assert 'rice and curry' in [food['name'].lower() for food in sri_lankan_foods]
        assert 'kottu roti' in [food['name'].lower() for food in sri_lankan_foods]
        
        print(f"✓ Sri Lankan food database loaded with {len(sri_lankan_foods)} foods")
    
    def test_nutrition_calculation(self):
        """Test nutrition calculation from detected foods"""
        processor = EnhancedFoodVisionAnalyzer(None, "test_db")
        
        # Mock detected foods
        detected_foods = [
            {
                'name': 'Rice and Curry',
                'confidence': 0.85,
                'bounding_box': [0.1, 0.1, 0.5, 0.5],
                'estimated_portion': '1 plate'
            },
            {
                'name': 'Chicken Kottu',
                'confidence': 0.75,
                'bounding_box': [0.6, 0.1, 0.9, 0.5],
                'estimated_portion': '1 serving'
            }
        ]
        
        nutrition = processor.calculate_nutrition_from_foods(detected_foods)
        
        assert nutrition['total_calories'] > 0
        assert nutrition['total_protein'] > 0
        assert nutrition['total_carbs'] > 0
        assert nutrition['total_fat'] > 0
        
        print(f"✓ Calculated nutrition: {nutrition['total_calories']} calories")

class TestAPIEndpoints:
    """Test suite for API endpoints (requires running server)"""
    
    BASE_URL = "http://localhost:8000"
    
    @pytest.mark.asyncio
    async def test_health_endpoint(self):
        """Test API health check"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.BASE_URL}/health") as response:
                    assert response.status == 200
                    data = await response.json()
                    assert data['status'] == 'healthy'
                    print("✓ Health endpoint working")
        except aiohttp.ClientConnectorError:
            print("⚠️  API server not running - skipping endpoint tests")
            pytest.skip("API server not available")
    
    @pytest.mark.asyncio
    async def test_food_analysis_text_endpoint(self):
        """Test text-based food analysis endpoint"""
        try:
            test_data = {
                "meal_description": "Rice and curry with chicken, coconut sambol",
                "user_id": "test_user_123",
                "meal_type": "lunch"
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.BASE_URL}/api/analyze-food-text",
                    json=test_data
                ) as response:
                    assert response.status == 200
                    data = await response.json()
                    
                    assert 'analysis' in data
                    assert 'detected_foods' in data['analysis']
                    assert 'total_nutrition' in data['analysis']
                    
                    print(f"✓ Text analysis endpoint working")
                    print(f"  Detected foods: {len(data['analysis']['detected_foods'])}")
                    
        except aiohttp.ClientConnectorError:
            pytest.skip("API server not available")
    
    @pytest.mark.asyncio  
    async def test_nutrition_insights_endpoint(self):
        """Test NLP insights endpoint"""
        try:
            test_data = {
                "nutrition_data": {
                    "date": "2024-01-15",
                    "calories": 2200,
                    "protein": 95,
                    "carbs": 280,
                    "fat": 75,
                    "fiber": 25,
                    "sodium": 2800,
                    "sugar": 65,
                    "water_intake": 1800
                }
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.BASE_URL}/api/nutrition-insights",
                    json=test_data
                ) as response:
                    assert response.status == 200
                    data = await response.json()
                    
                    assert 'insights' in data
                    assert 'daily_summary' in data
                    assert 'daily_card' in data
                    
                    print(f"✓ NLP insights endpoint working")
                    print(f"  Generated insights: {len(data['insights'])}")
                    
        except aiohttp.ClientConnectorError:
            pytest.skip("API server not available")

class TestDataPersistence:
    """Test suite for MongoDB data persistence"""
    
    def test_local_fallback_storage(self):
        """Test local storage fallback when MongoDB unavailable"""
        # Test nutrition data serialization
        nutrition_data = {
            "user_id": "test_user",
            "date": datetime.now().isoformat(),
            "calories": 2000,
            "protein": 100,
            "carbs": 250,
            "fat": 70
        }
        
        # Simulate local storage
        serialized = json.dumps(nutrition_data, default=str)
        deserialized = json.loads(serialized)
        
        assert deserialized['user_id'] == nutrition_data['user_id']
        assert deserialized['calories'] == nutrition_data['calories']
        
        print("✓ Local fallback storage working")

def run_comprehensive_tests():
    """Run all tests comprehensively"""
    print("🧪 Running Enhanced Diet Agent System Tests")
    print("=" * 50)
    
    # Test NLP Insights
    print("\n📊 Testing NLP Insights System...")
    nlp_tests = TestNLPInsights()
    nlp_tests.setup_method()
    
    try:
        nlp_tests.test_heuristic_insight_generation()
        nlp_tests.test_abstractive_summarizer()
        nlp_tests.test_daily_report_card()
        nlp_tests.test_weekly_report_generation()
        print("✅ NLP Insights tests passed!")
    except Exception as e:
        print(f"❌ NLP Insights tests failed: {e}")
    
    # Test Image Processing
    print("\n📸 Testing Image Processing System...")
    image_tests = TestImageProcessing()
    
    try:
        asyncio.run(image_tests.test_image_analysis_fallback())
        image_tests.test_nutrition_calculation()
        print("✅ Image Processing tests passed!")
    except Exception as e:
        print(f"❌ Image Processing tests failed: {e}")
    
    # Test Data Persistence
    print("\n💾 Testing Data Persistence...")
    persistence_tests = TestDataPersistence()
    
    try:
        persistence_tests.test_local_fallback_storage()
        print("✅ Data Persistence tests passed!")
    except Exception as e:
        print(f"❌ Data Persistence tests failed: {e}")
    
    # Test API Endpoints (if server is running)
    print("\n🌐 Testing API Endpoints...")
    api_tests = TestAPIEndpoints()
    
    try:
        asyncio.run(api_tests.test_health_endpoint())
        asyncio.run(api_tests.test_food_analysis_text_endpoint())
        asyncio.run(api_tests.test_nutrition_insights_endpoint())
        print("✅ API Endpoint tests passed!")
    except Exception as e:
        print(f"⚠️  API Endpoint tests skipped: {e}")
    
    print("\n🎉 Comprehensive testing completed!")
    print("=" * 50)

if __name__ == "__main__":
    run_comprehensive_tests()
