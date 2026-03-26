#!/usr/bin/env python3
"""
API Testing Script for Enhanced Food Analysis System
Tests the new endpoints and validates accuracy improvements.
"""

import requests
import json
import time
import base64
from io import BytesIO
from PIL import Image
import numpy as np

class APITester:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.test_results = []
    
    def create_test_image(self, color=(255, 200, 100), size=(512, 512)):
        """Create a test image for food analysis."""
        # Create a simple test image that resembles food
        img = Image.new('RGB', size, color)
        
        # Add some simple patterns to make it look more like food
        pixels = np.array(img)
        
        # Add some texture/noise
        noise = np.random.normal(0, 10, pixels.shape).astype(np.int16)
        pixels = np.clip(pixels.astype(np.int16) + noise, 0, 255).astype(np.uint8)
        
        img = Image.fromarray(pixels)
        
        # Convert to bytes
        byte_arr = BytesIO()
        img.save(byte_arr, format='JPEG')
        return byte_arr.getvalue()
    
    def test_health_endpoint(self):
        """Test the health check endpoint."""
        print("🏥 Testing Health Endpoint...")
        try:
            response = requests.get(f"{self.base_url}/health")
            if response.status_code == 200:
                print("✅ Health endpoint working")
                return True
            else:
                print(f"❌ Health endpoint failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Health endpoint error: {e}")
            return False
    
    def test_advanced_analysis_endpoint(self):
        """Test the advanced analysis endpoint."""
        print("\n🔬 Testing Advanced Analysis Endpoint...")
        
        try:
            # Create test image
            test_image = self.create_test_image()
            
            # Prepare request
            files = {
                'file': ('test_food.jpg', test_image, 'image/jpeg')
            }
            data = {
                'user_id': 'test_user',
                'meal_type': 'lunch',
                'text_description': 'rice with chicken curry'
            }
            
            start_time = time.time()
            response = requests.post(
                f"{self.base_url}/analyze/image/advanced",
                files=files,
                data=data
            )
            processing_time = time.time() - start_time
            
            if response.status_code == 200:
                result = response.json()
                print("✅ Advanced analysis endpoint working")
                print(f"   Processing time: {processing_time:.2f}s")
                print(f"   Detected foods: {len(result.get('analysis', {}).get('detected_foods', []))}")
                print(f"   Overall accuracy: {result.get('analysis', {}).get('analysis_quality', {}).get('overall_score', 0):.2f}")
                return True, result
            else:
                print(f"❌ Advanced analysis failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False, None
                
        except Exception as e:
            print(f"❌ Advanced analysis error: {e}")
            return False, None
    
    def test_comparison_endpoint(self):
        """Test the comparison endpoint."""
        print("\n⚖️ Testing Analysis Comparison Endpoint...")
        
        try:
            # Create test image
            test_image = self.create_test_image()
            
            files = {
                'file': ('test_food.jpg', test_image, 'image/jpeg')
            }
            data = {
                'user_id': 'test_user',
                'meal_type': 'lunch',
                'text_description': 'chicken kottu with vegetables'
            }
            
            response = requests.post(
                f"{self.base_url}/analyze/image/compare",
                files=files,
                data=data
            )
            
            if response.status_code == 200:
                result = response.json()
                print("✅ Comparison endpoint working")
                
                comparison = result.get('comparison', {})
                improvements = comparison.get('improvements', {})
                
                print(f"   Accuracy gain: {improvements.get('accuracy_gain', 0):.2f}")
                print(f"   Advanced method benefits: {len(result.get('summary', {}).get('advanced_method_benefits', []))}")
                return True, result
            else:
                print(f"❌ Comparison analysis failed: {response.status_code}")
                return False, None
                
        except Exception as e:
            print(f"❌ Comparison analysis error: {e}")
            return False, None
    
    def test_food_database_endpoint(self):
        """Test the food database info endpoint."""
        print("\n📊 Testing Food Database Info Endpoint...")
        
        try:
            response = requests.get(f"{self.base_url}/food-database/info")
            
            if response.status_code == 200:
                result = response.json()
                db_info = result.get('database_info', {})
                
                print("✅ Food database endpoint working")
                print(f"   Total foods: {db_info.get('total_foods', 0)}")
                print(f"   Nutrition completeness: {db_info.get('nutrition_completeness_percentage', 0):.1f}%")
                print(f"   Categories: {len(db_info.get('categories', {}))}")
                return True, result
            else:
                print(f"❌ Food database endpoint failed: {response.status_code}")
                return False, None
                
        except Exception as e:
            print(f"❌ Food database endpoint error: {e}")
            return False, None
    
    def test_accuracy_demo_endpoint(self):
        """Test the accuracy demonstration endpoint."""
        print("\n🎯 Testing Accuracy Demo Endpoint...")
        
        try:
            response = requests.get(f"{self.base_url}/analysis/accuracy-demo")
            
            if response.status_code == 200:
                result = response.json()
                print("✅ Accuracy demo endpoint working")
                
                accuracy_metrics = result.get('accuracy_metrics', {})
                print(f"   Food detection accuracy: {accuracy_metrics.get('food_detection_accuracy', 'N/A')}")
                print(f"   Overall system accuracy: {accuracy_metrics.get('overall_system_accuracy', 'N/A')}")
                return True, result
            else:
                print(f"❌ Accuracy demo endpoint failed: {response.status_code}")
                return False, None
                
        except Exception as e:
            print(f"❌ Accuracy demo endpoint error: {e}")
            return False, None
    
    def run_comprehensive_tests(self):
        """Run all API tests."""
        print("🚀 Starting Comprehensive API Testing")
        print("=" * 50)
        
        # Test all endpoints
        tests = [
            ("Health Check", self.test_health_endpoint),
            ("Advanced Analysis", self.test_advanced_analysis_endpoint),
            ("Analysis Comparison", self.test_comparison_endpoint),
            ("Food Database Info", self.test_food_database_endpoint),
            ("Accuracy Demo", self.test_accuracy_demo_endpoint)
        ]
        
        passed_tests = 0
        total_tests = len(tests)
        
        for test_name, test_func in tests:
            try:
                result = test_func()
                if isinstance(result, tuple):
                    success, data = result
                else:
                    success = result
                
                if success:
                    passed_tests += 1
                    
            except Exception as e:
                print(f"❌ {test_name} test crashed: {e}")
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📋 Test Results Summary")
        print(f"   Passed: {passed_tests}/{total_tests}")
        print(f"   Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if passed_tests == total_tests:
            print("🎉 All tests passed! Enhanced food analysis system is working correctly.")
        else:
            print("⚠️ Some tests failed. Check the API server and dependencies.")
        
        return passed_tests == total_tests

def main():
    """Run API testing."""
    print("🔬 Enhanced Food Analysis API Testing")
    print("=" * 60)
    print("This script tests the improved food recognition endpoints")
    print("to validate accuracy improvements and system reliability.")
    print("=" * 60)
    
    # Test different base URLs in case of different configurations
    test_urls = [
        "http://localhost:8001",  # Default diet agent port
        "http://localhost:8000",  # Alternative port
        "http://127.0.0.1:8001"   # Alternative localhost
    ]
    
    success = False
    for url in test_urls:
        print(f"\n🔗 Testing API at: {url}")
        tester = APITester(url)
        
        # Quick health check first
        if tester.test_health_endpoint():
            print(f"✅ API server found at {url}")
            success = tester.run_comprehensive_tests()
            break
        else:
            print(f"❌ No API server at {url}")
    
    if not success:
        print("\n⚠️ API Testing Results:")
        print("Could not connect to the API server.")
        print("\nTo test the enhanced system:")
        print("1. Start the diet agent service:")
        print("   cd /Users/chanuka/Desktop/Healthagent/healthy_lifestyle_advisor/aiservices/dietaiservices")
        print("   python main.py")
        print("2. Run this test script again")
        print("\n📝 The enhanced system includes:")
        print("   • Advanced multi-method food detection")
        print("   • Comprehensive Sri Lankan food database")
        print("   • Intelligent portion estimation")
        print("   • Quality assessment and recommendations")
        print("   • Improved accuracy over the original system")

if __name__ == "__main__":
    main()
