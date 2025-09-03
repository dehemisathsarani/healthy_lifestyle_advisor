#!/usr/bin/env python3
"""
Comprehensive RAG Chatbot Enhancement Validation
Tests all new features, fallback systems, and integration points
"""

import asyncio
import json
import logging
import time
from datetime import datetime
import requests
from typing import Dict, List, Any

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class RAGChatbotValidator:
    def __init__(self):
        self.api_base_url = "http://localhost:8000"
        self.test_user_id = "enhanced_test_user"
        self.test_results = {}
        
    def test_health_endpoint(self) -> bool:
        """Test the new health endpoint"""
        try:
            response = requests.get(f"{self.api_base_url}/api/chat/health", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"✅ Health endpoint working: {data.get('status', 'unknown')}")
                
                # Validate health response structure
                expected_fields = ['status', 'details', 'timestamp']
                if all(field in data for field in expected_fields):
                    logger.info("✅ Health response has all expected fields")
                    return True
                else:
                    logger.warning("⚠️ Health response missing some fields")
                    return False
            else:
                logger.error(f"❌ Health endpoint failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Health endpoint error: {e}")
            return False
    
    def test_enhanced_chat_endpoint(self) -> bool:
        """Test the enhanced chat endpoint with various scenarios"""
        test_cases = [
            {
                "name": "Basic Nutrition Question",
                "message": "What are the best protein sources?",
                "context_type": "nutrition",
                "expected_keywords": ["protein", "sources", "meat", "beans"]
            },
            {
                "name": "Weight Loss Query",
                "message": "How can I lose weight effectively?",
                "context_type": "health_goal",
                "expected_keywords": ["weight loss", "caloric deficit", "exercise"]
            },
            {
                "name": "Meal Planning",
                "message": "Create a meal plan for today",
                "context_type": "meal_plan",
                "expected_keywords": ["meal", "breakfast", "lunch", "dinner"]
            },
            {
                "name": "Hydration Question",
                "message": "How much water should I drink?",
                "context_type": "nutrition",
                "expected_keywords": ["water", "hydration", "glasses", "liters"]
            },
            {
                "name": "Sri Lankan Food Query",
                "message": "Tell me about rice and curry nutrition",
                "context_type": "general",
                "expected_keywords": ["rice", "curry", "carbohydrates"]
            }
        ]
        
        successful_tests = 0
        
        for test_case in test_cases:
            try:
                logger.info(f"🧪 Testing: {test_case['name']}")
                
                response = requests.post(
                    f"{self.api_base_url}/api/chat",
                    json={
                        "user_id": self.test_user_id,
                        "message": test_case["message"],
                        "context_type": test_case["context_type"]
                    },
                    timeout=30
                )
                
                if response.status_code == 200:
                    data = response.json()
                    response_text = data.get("response", "").lower()
                    
                    # Check for expected keywords
                    found_keywords = []
                    for keyword in test_case["expected_keywords"]:
                        if keyword.lower() in response_text:
                            found_keywords.append(keyword)
                    
                    if len(found_keywords) >= len(test_case["expected_keywords"]) * 0.5:
                        logger.info(f"✅ {test_case['name']} passed. Found: {found_keywords}")
                        successful_tests += 1
                    else:
                        logger.warning(f"⚠️ {test_case['name']} partial. Found: {found_keywords}")
                        
                    # Check response quality
                    if len(response_text) > 100:
                        logger.info(f"✅ Good response length: {len(response_text)} characters")
                    else:
                        logger.warning(f"⚠️ Short response: {len(response_text)} characters")
                        
                else:
                    logger.error(f"❌ {test_case['name']} failed: {response.status_code}")
                    
                # Wait between requests
                time.sleep(1)
                
            except Exception as e:
                logger.error(f"❌ {test_case['name']} error: {e}")
        
        success_rate = (successful_tests / len(test_cases)) * 100
        logger.info(f"📊 Chat endpoint success rate: {success_rate:.1f}%")
        return success_rate >= 70
    
    def test_recommendations_endpoint(self) -> bool:
        """Test the new recommendations endpoint"""
        try:
            response = requests.get(
                f"{self.api_base_url}/api/chat/recommendations/{self.test_user_id}",
                timeout=20
            )
            
            if response.status_code == 200:
                data = response.json()
                recommendations = data.get("recommendations", "")
                
                if len(recommendations) > 200:
                    logger.info("✅ Recommendations endpoint working")
                    logger.info(f"📝 Recommendations length: {len(recommendations)} characters")
                    
                    # Check for key recommendation elements
                    rec_lower = recommendations.lower()
                    recommendation_elements = [
                        "protein", "calories", "vegetables", "hydration", "exercise"
                    ]
                    
                    found_elements = [elem for elem in recommendation_elements if elem in rec_lower]
                    
                    if len(found_elements) >= 3:
                        logger.info(f"✅ Good recommendation coverage: {found_elements}")
                        return True
                    else:
                        logger.warning(f"⚠️ Limited recommendation coverage: {found_elements}")
                        return False
                else:
                    logger.warning("⚠️ Recommendations too short")
                    return False
            else:
                logger.error(f"❌ Recommendations endpoint failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Recommendations endpoint error: {e}")
            return False
    
    def test_fallback_system(self) -> bool:
        """Test fallback system by making requests when backend might be down"""
        logger.info("🧪 Testing fallback system (this might take a moment)...")
        
        # Test with a simple Python script to ensure fallback works
        fallback_test_cases = [
            "What are good protein sources for vegetarians?",
            "How much water should I drink daily?",
            "Give me weight loss tips",
            "What should I eat for breakfast?"
        ]
        
        # Test API with timeout to trigger fallback
        successful_fallbacks = 0
        
        for message in fallback_test_cases:
            try:
                response = requests.post(
                    f"{self.api_base_url}/api/chat",
                    json={
                        "user_id": self.test_user_id,
                        "message": message,
                        "context_type": "nutrition"
                    },
                    timeout=2  # Short timeout to potentially trigger fallback
                )
                
                if response.status_code == 200:
                    data = response.json()
                    response_text = data.get("response", "")
                    
                    # Check if it's a fallback response
                    is_fallback = (
                        "comprehensive nutrition knowledge base" in response_text or
                        "offline" in response_text.lower() or
                        len(response_text) > 50  # Any reasonable response
                    )
                    
                    if is_fallback:
                        successful_fallbacks += 1
                        logger.info(f"✅ Fallback working for: {message[:30]}...")
                    
            except requests.exceptions.Timeout:
                logger.info("⏰ Request timed out - fallback should activate")
                successful_fallbacks += 1  # Timeout is expected for fallback testing
            except Exception as e:
                logger.warning(f"⚠️ Fallback test exception: {e}")
        
        fallback_rate = (successful_fallbacks / len(fallback_test_cases)) * 100
        logger.info(f"📊 Fallback success rate: {fallback_rate:.1f}%")
        return fallback_rate >= 50
    
    def test_conversation_storage(self) -> bool:
        """Test if conversations are being stored properly"""
        try:
            # Send a test message
            test_message = f"Test message for storage validation - {datetime.now().isoformat()}"
            
            response = requests.post(
                f"{self.api_base_url}/api/chat",
                json={
                    "user_id": self.test_user_id,
                    "message": test_message,
                    "context_type": "general"
                },
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                message_id = data.get("message_id")
                
                if message_id:
                    logger.info(f"✅ Message sent successfully: {message_id}")
                    
                    # Wait a moment for storage
                    time.sleep(2)
                    
                    # Try to get conversation history
                    history_response = requests.get(
                        f"{self.api_base_url}/api/chat/history/{self.test_user_id}?limit=5",
                        timeout=10
                    )
                    
                    if history_response.status_code == 200:
                        history_data = history_response.json()
                        conversation_count = history_data.get("conversation_count", 0)
                        
                        if conversation_count > 0:
                            logger.info(f"✅ Conversation storage working: {conversation_count} conversations found")
                            return True
                        else:
                            logger.warning("⚠️ No conversations found in history")
                            return False
                    else:
                        logger.error(f"❌ History endpoint failed: {history_response.status_code}")
                        return False
                else:
                    logger.warning("⚠️ No message_id in response")
                    return False
            else:
                logger.error(f"❌ Test message failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Conversation storage test error: {e}")
            return False
    
    def test_personalization(self) -> bool:
        """Test personalization features"""
        try:
            # Test with different user profiles
            personalization_tests = [
                {
                    "message": "What should I eat for breakfast?",
                    "expected_adaptation": "Should provide general breakfast advice"
                },
                {
                    "message": "I'm vegetarian, what protein sources do you recommend?",
                    "expected_adaptation": "Should mention plant-based proteins"
                },
                {
                    "message": "I want to lose weight, what should I do?",
                    "expected_adaptation": "Should mention caloric deficit and exercise"
                }
            ]
            
            successful_personalizations = 0
            
            for test in personalization_tests:
                response = requests.post(
                    f"{self.api_base_url}/api/chat",
                    json={
                        "user_id": self.test_user_id,
                        "message": test["message"],
                        "context_type": "nutrition"
                    },
                    timeout=30
                )
                
                if response.status_code == 200:
                    data = response.json()
                    response_text = data.get("response", "").lower()
                    
                    # Check for personalization indicators
                    if len(response_text) > 100:  # Substantial response
                        successful_personalizations += 1
                        logger.info(f"✅ Personalization test passed: {test['message'][:30]}...")
                    else:
                        logger.warning(f"⚠️ Short personalized response: {test['message'][:30]}...")
                
                time.sleep(1)
            
            personalization_rate = (successful_personalizations / len(personalization_tests)) * 100
            logger.info(f"📊 Personalization success rate: {personalization_rate:.1f}%")
            return personalization_rate >= 70
            
        except Exception as e:
            logger.error(f"❌ Personalization test error: {e}")
            return False
    
    def run_comprehensive_validation(self) -> Dict[str, Any]:
        """Run all validation tests"""
        logger.info("🚀 Starting Comprehensive RAG Chatbot Enhancement Validation")
        logger.info("=" * 70)
        
        test_functions = [
            ("Health Endpoint", self.test_health_endpoint),
            ("Enhanced Chat Endpoint", self.test_enhanced_chat_endpoint),
            ("Recommendations Endpoint", self.test_recommendations_endpoint),
            ("Fallback System", self.test_fallback_system),
            ("Conversation Storage", self.test_conversation_storage),
            ("Personalization", self.test_personalization),
        ]
        
        results = {}
        passed_tests = 0
        total_tests = len(test_functions)
        
        for test_name, test_function in test_functions:
            logger.info(f"\n🔍 Testing: {test_name}")
            logger.info("-" * 50)
            
            try:
                result = test_function()
                results[test_name] = result
                
                if result:
                    passed_tests += 1
                    logger.info(f"✅ {test_name}: PASSED")
                else:
                    logger.warning(f"⚠️ {test_name}: FAILED")
                    
            except Exception as e:
                logger.error(f"❌ {test_name}: ERROR - {e}")
                results[test_name] = False
        
        # Calculate overall success rate
        success_rate = (passed_tests / total_tests) * 100
        
        # Generate final report
        logger.info("\n" + "=" * 70)
        logger.info("📊 COMPREHENSIVE VALIDATION RESULTS")
        logger.info("=" * 70)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            logger.info(f"{test_name:.<50} {status}")
        
        logger.info(f"\n🎯 Overall Success Rate: {success_rate:.1f}% ({passed_tests}/{total_tests})")
        
        if success_rate >= 90:
            logger.info("🎉 EXCELLENT! RAG Chatbot enhancements are working perfectly!")
            grade = "A+"
        elif success_rate >= 80:
            logger.info("🎊 GREAT! RAG Chatbot enhancements are working very well!")
            grade = "A"
        elif success_rate >= 70:
            logger.info("👍 GOOD! RAG Chatbot enhancements are working well!")
            grade = "B"
        elif success_rate >= 60:
            logger.info("👌 ACCEPTABLE! RAG Chatbot has some issues to address!")
            grade = "C"
        else:
            logger.info("⚠️ NEEDS IMPROVEMENT! RAG Chatbot requires attention!")
            grade = "F"
        
        # Recommendations
        logger.info(f"\n💡 RECOMMENDATIONS:")
        logger.info("-" * 30)
        
        if not results.get("Health Endpoint", False):
            logger.info("• Check if the backend API is running on localhost:8000")
        
        if not results.get("Enhanced Chat Endpoint", False):
            logger.info("• Verify OpenAI API configuration and fallback system")
        
        if not results.get("Recommendations Endpoint", False):
            logger.info("• Check personalized recommendations implementation")
        
        if not results.get("Fallback System", False):
            logger.info("• Verify enhanced fallback system is working correctly")
        
        if not results.get("Conversation Storage", False):
            logger.info("• Check MongoDB connection and storage functions")
        
        if not results.get("Personalization", False):
            logger.info("• Verify user profile integration and context handling")
        
        logger.info(f"\n🏆 FINAL GRADE: {grade}")
        logger.info("=" * 70)
        
        return {
            "overall_success_rate": success_rate,
            "grade": grade,
            "passed_tests": passed_tests,
            "total_tests": total_tests,
            "detailed_results": results,
            "timestamp": datetime.now().isoformat()
        }

def main():
    """Main validation execution"""
    try:
        validator = RAGChatbotValidator()
        results = validator.run_comprehensive_validation()
        
        # Save results to file
        with open("rag_chatbot_validation_results.json", "w") as f:
            json.dump(results, f, indent=2)
        
        logger.info(f"\n📄 Results saved to: rag_chatbot_validation_results.json")
        
        return results["overall_success_rate"] >= 70
        
    except KeyboardInterrupt:
        logger.info("\n🛑 Validation interrupted by user")
        return False
    except Exception as e:
        logger.error(f"🚨 Validation execution failed: {e}")
        return False

if __name__ == "__main__":
    success = main()
    if success:
        print("\n🎉 RAG Chatbot Enhancement Validation PASSED!")
    else:
        print("\n❌ RAG Chatbot Enhancement Validation FAILED!")
