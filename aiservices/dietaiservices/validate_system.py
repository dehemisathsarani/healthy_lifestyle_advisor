#!/usr/bin/env python3
"""
End-to-End Validation Script for Enhanced Diet Agent System
Tests complete pipeline: Frontend → Backend → Database → NLP → Response
"""

import asyncio
import aiohttp
import json
import base64
import os
from datetime import datetime
import time

class EnhancedDietAgentValidator:
    """Complete system validation"""
    
    def __init__(self):
        self.backend_url = "http://localhost:8000"
        self.frontend_url = "http://localhost:5173"
        self.results = {}
    
    async def validate_system(self):
        """Run complete system validation"""
        print("🔍 Enhanced Diet Agent System Validation")
        print("=" * 50)
        
        # 1. Backend Health Check
        await self.test_backend_health()
        
        # 2. Database Connectivity
        await self.test_database_connectivity()
        
        # 3. NLP Insights Pipeline
        await self.test_nlp_insights_pipeline()
        
        # 4. Image Processing Pipeline
        await self.test_image_processing_pipeline()
        
        # 5. Real-time Analysis
        await self.test_real_time_analysis()
        
        # 6. Data Persistence
        await self.test_data_persistence()
        
        # 7. Frontend Integration
        await self.test_frontend_integration()
        
        # Generate report
        self.generate_validation_report()
    
    async def test_backend_health(self):
        """Test backend service health"""
        print("\n🏥 Testing Backend Health...")
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.backend_url}/health") as response:
                    if response.status == 200:
                        data = await response.json()
                        if data.get('status') == 'healthy':
                            print("✅ Backend service is healthy")
                            self.results['backend_health'] = True
                        else:
                            print("⚠️  Backend service responded but not healthy")
                            self.results['backend_health'] = False
                    else:
                        print(f"❌ Backend health check failed: HTTP {response.status}")
                        self.results['backend_health'] = False
        except Exception as e:
            print(f"❌ Backend service unavailable: {e}")
            self.results['backend_health'] = False
    
    async def test_database_connectivity(self):
        """Test MongoDB connectivity and collections"""
        print("\n💾 Testing Database Connectivity...")
        try:
            async with aiohttp.ClientSession() as session:
                # Test database health endpoint (if exists)
                async with session.get(f"{self.backend_url}/api/database/health") as response:
                    if response.status == 200:
                        data = await response.json()
                        print("✅ Database connectivity verified")
                        print(f"  Collections: {data.get('collections', [])}")
                        self.results['database_connectivity'] = True
                    else:
                        print("⚠️  Database health endpoint not available")
                        self.results['database_connectivity'] = False
        except Exception as e:
            print(f"⚠️  Database connectivity test failed: {e}")
            self.results['database_connectivity'] = False
    
    async def test_nlp_insights_pipeline(self):
        """Test complete NLP insights pipeline"""
        print("\n🧠 Testing NLP Insights Pipeline...")
        
        test_nutrition_data = {
            "nutrition_data": {
                "date": datetime.now().strftime("%Y-%m-%d"),
                "calories": 2200,
                "protein": 95,
                "carbs": 280,
                "fat": 75,
                "fiber": 25,
                "sodium": 2800,  # High to trigger insights
                "sugar": 65,
                "water_intake": 1800  # Low to trigger insights
            }
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.backend_url}/api/nutrition-insights",
                    json=test_nutrition_data
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        # Validate response structure
                        required_fields = ['insights', 'daily_summary', 'daily_card']
                        if all(field in data for field in required_fields):
                            print("✅ NLP insights pipeline working")
                            print(f"  Generated {len(data['insights'])} insights")
                            print(f"  Daily summary: {len(data['daily_summary']['key_insights'])} bullet points")
                            print(f"  Achievement badges: {len(data['daily_card'].get('achievement_badges', []))}")
                            self.results['nlp_pipeline'] = True
                        else:
                            print(f"❌ NLP response missing required fields: {required_fields}")
                            self.results['nlp_pipeline'] = False
                    else:
                        print(f"❌ NLP insights endpoint failed: HTTP {response.status}")
                        self.results['nlp_pipeline'] = False
                        
        except Exception as e:
            print(f"❌ NLP insights pipeline test failed: {e}")
            self.results['nlp_pipeline'] = False
    
    async def test_image_processing_pipeline(self):
        """Test image processing with mock data"""
        print("\n📸 Testing Image Processing Pipeline...")
        
        # Create a small test image (1x1 pixel base64 encoded)
        test_image_b64 = "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/A=="
        
        try:
            # Test text-based food analysis first
            text_analysis_data = {
                "meal_description": "Rice and curry with chicken kottu",
                "user_id": "test_user_validation",
                "meal_type": "lunch"
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.backend_url}/api/analyze-food-text",
                    json=text_analysis_data
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        if 'analysis' in data and 'detected_foods' in data['analysis']:
                            print("✅ Text-based food analysis working")
                            print(f"  Detected {len(data['analysis']['detected_foods'])} food items")
                            print(f"  Total calories: {data['analysis']['total_nutrition']['calories']}")
                            self.results['text_analysis'] = True
                        else:
                            print("❌ Text analysis response invalid")
                            self.results['text_analysis'] = False
                    else:
                        print(f"❌ Text analysis failed: HTTP {response.status}")
                        self.results['text_analysis'] = False
                        
                # Test image analysis endpoint structure (without actual image processing)
                # This validates the endpoint exists and handles requests
                print("  Testing image analysis endpoint availability...")
                try:
                    form_data = aiohttp.FormData()
                    form_data.add_field('user_id', 'test_user_validation')
                    form_data.add_field('meal_type', 'lunch')
                    form_data.add_field('file', base64.b64decode(test_image_b64), 
                                      filename='test.jpg', content_type='image/jpeg')
                    
                    async with session.post(
                        f"{self.backend_url}/api/analyze-food-image",
                        data=form_data
                    ) as response:
                        if response.status in [200, 400, 422]:  # Expected responses
                            print("✅ Image analysis endpoint available")
                            self.results['image_endpoint'] = True
                        else:
                            print(f"⚠️  Image analysis endpoint returned: HTTP {response.status}")
                            self.results['image_endpoint'] = False
                except Exception as e:
                    print(f"⚠️  Image analysis endpoint test failed: {e}")
                    self.results['image_endpoint'] = False
                        
        except Exception as e:
            print(f"❌ Image processing pipeline test failed: {e}")
            self.results['text_analysis'] = False
            self.results['image_endpoint'] = False
    
    async def test_real_time_analysis(self):
        """Test real-time analysis performance"""
        print("\n⚡ Testing Real-time Analysis Performance...")
        
        test_requests = [
            {
                "meal_description": "Hoppers with coconut sambol",
                "user_id": "perf_test_1",
                "meal_type": "breakfast"
            },
            {
                "meal_description": "Chicken kottu roti",
                "user_id": "perf_test_2", 
                "meal_type": "lunch"
            },
            {
                "meal_description": "Fish curry with rice",
                "user_id": "perf_test_3",
                "meal_type": "dinner"
            }
        ]
        
        try:
            response_times = []
            
            async with aiohttp.ClientSession() as session:
                for i, request_data in enumerate(test_requests):
                    start_time = time.time()
                    
                    async with session.post(
                        f"{self.backend_url}/api/analyze-food-text",
                        json=request_data
                    ) as response:
                        if response.status == 200:
                            await response.json()
                            response_time = time.time() - start_time
                            response_times.append(response_time)
                            print(f"  Request {i+1}: {response_time:.2f}s")
                        else:
                            print(f"  Request {i+1}: Failed (HTTP {response.status})")
                
                if response_times:
                    avg_response_time = sum(response_times) / len(response_times)
                    print(f"✅ Average response time: {avg_response_time:.2f}s")
                    
                    if avg_response_time < 3.0:  # 3 second threshold
                        print("✅ Response time within acceptable limits")
                        self.results['performance'] = True
                    else:
                        print("⚠️  Response time exceeds 3s threshold")
                        self.results['performance'] = False
                else:
                    print("❌ No successful requests for performance testing")
                    self.results['performance'] = False
                    
        except Exception as e:
            print(f"❌ Performance testing failed: {e}")
            self.results['performance'] = False
    
    async def test_data_persistence(self):
        """Test data persistence and retrieval"""
        print("\n💾 Testing Data Persistence...")
        
        # Create a test nutrition entry
        test_entry = {
            "user_id": "persistence_test_user",
            "date": datetime.now().strftime("%Y-%m-%d"),
            "meal_type": "breakfast",
            "food_description": "Test meal for persistence",
            "calories": 300,
            "protein": 15,
            "carbs": 40,
            "fat": 10
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                # Add nutrition entry
                async with session.post(
                    f"{self.backend_url}/api/nutrition-entry",
                    json=test_entry
                ) as response:
                    if response.status == 200:
                        entry_data = await response.json()
                        entry_id = entry_data.get('id')
                        
                        if entry_id:
                            print("✅ Nutrition entry created successfully")
                            
                            # Try to retrieve the entry
                            async with session.get(
                                f"{self.backend_url}/api/nutrition-history/{test_entry['user_id']}"
                            ) as get_response:
                                if get_response.status == 200:
                                    history_data = await get_response.json()
                                    
                                    if history_data.get('entries'):
                                        print("✅ Data persistence and retrieval working")
                                        self.results['data_persistence'] = True
                                    else:
                                        print("⚠️  Entry created but not retrievable")
                                        self.results['data_persistence'] = False
                                else:
                                    print("⚠️  Could not retrieve nutrition history")
                                    self.results['data_persistence'] = False
                        else:
                            print("⚠️  Entry created but no ID returned")
                            self.results['data_persistence'] = False
                    else:
                        print(f"❌ Failed to create nutrition entry: HTTP {response.status}")
                        self.results['data_persistence'] = False
                        
        except Exception as e:
            print(f"❌ Data persistence test failed: {e}")
            self.results['data_persistence'] = False
    
    async def test_frontend_integration(self):
        """Test frontend availability and basic functionality"""
        print("\n🌐 Testing Frontend Integration...")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(self.frontend_url) as response:
                    if response.status == 200:
                        content = await response.text()
                        
                        # Check for key frontend elements
                        if 'Diet Agent' in content and 'React' in content:
                            print("✅ Frontend application accessible")
                            self.results['frontend_accessibility'] = True
                        else:
                            print("⚠️  Frontend accessible but content unclear")
                            self.results['frontend_accessibility'] = False
                    else:
                        print(f"❌ Frontend not accessible: HTTP {response.status}")
                        self.results['frontend_accessibility'] = False
                        
        except Exception as e:
            print(f"⚠️  Frontend integration test failed: {e}")
            print("   (Frontend server might not be running)")
            self.results['frontend_accessibility'] = False
    
    def generate_validation_report(self):
        """Generate comprehensive validation report"""
        print("\n📊 Validation Report")
        print("=" * 50)
        
        total_tests = len(self.results)
        passed_tests = sum(1 for result in self.results.values() if result)
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {total_tests - passed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        print("\nDetailed Results:")
        print("-" * 30)
        
        test_names = {
            'backend_health': 'Backend Health',
            'database_connectivity': 'Database Connectivity',
            'nlp_pipeline': 'NLP Insights Pipeline',
            'text_analysis': 'Text Food Analysis',
            'image_endpoint': 'Image Analysis Endpoint',
            'performance': 'Real-time Performance',
            'data_persistence': 'Data Persistence',
            'frontend_accessibility': 'Frontend Accessibility'
        }
        
        for test_key, result in self.results.items():
            test_name = test_names.get(test_key, test_key)
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{test_name:.<30} {status}")
        
        # Recommendations
        print("\n💡 Recommendations:")
        print("-" * 30)
        
        if not self.results.get('backend_health', False):
            print("• Start the backend service: `python main.py`")
        
        if not self.results.get('database_connectivity', False):
            print("• Check MongoDB connection and credentials")
        
        if not self.results.get('nlp_pipeline', False):
            print("• Verify NLP insights module initialization")
        
        if not self.results.get('frontend_accessibility', False):
            print("• Start the frontend development server: `npm run dev`")
        
        if not self.results.get('performance', False):
            print("• Consider optimizing API response times")
        
        # Overall system status
        if passed_tests == total_tests:
            print("\n🎉 All systems operational! Enhanced Diet Agent is ready for use.")
        elif passed_tests >= total_tests * 0.8:
            print("\n✅ Core systems operational. Minor issues detected.")
        elif passed_tests >= total_tests * 0.6:
            print("\n⚠️  Partial functionality available. Some features may not work.")
        else:
            print("\n❌ Critical issues detected. System requires attention.")

async def main():
    """Run the enhanced diet agent validation"""
    validator = EnhancedDietAgentValidator()
    await validator.validate_system()

if __name__ == "__main__":
    asyncio.run(main())
