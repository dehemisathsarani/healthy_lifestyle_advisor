"""
Test script for Mental Health Agent
"""

import asyncio
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.agents.agent_manager import agent_manager

async def test_mental_health_agent():
    """Test the Mental Health Agent functionality"""
    print("🧪 Testing Mental Health Agent...")
    
    # Initialize the agent system
    print("1. Initializing agent system...")
    success = await agent_manager.initialize_system()
    if not success:
        print("❌ Failed to initialize agent system")
        return
    print("✅ Agent system initialized successfully")
    
    # Test mood analysis
    print("\n2. Testing mood analysis...")
    mood_request = {
        "type": "mood_analysis",
        "user_id": "test_user_123",
        "mood_data": {
            "mood_score": 7,
            "emotions": ["happy", "excited"],
            "recent_activities": ["exercise", "meeting friends"],
            "sleep_quality": 8
        }
    }
    
    mood_response = await agent_manager.process_request(mood_request)
    if "error" not in mood_response:
        print("✅ Mood analysis successful")
        print(f"   Current mood: {mood_response.get('current_mood', {}).get('category', 'unknown')}")
    else:
        print(f"❌ Mood analysis failed: {mood_response['error']}")
    
    # Test stress prediction
    print("\n3. Testing stress prediction...")
    stress_request = {
        "type": "stress_prediction",
        "user_id": "test_user_123",
        "indicators": {
            "heart_rate": 85,
            "sleep_hours": 6,
            "workload_level": 8,
            "social_interactions": 3,
            "physical_symptoms": ["headache"]
        }
    }
    
    stress_response = await agent_manager.process_request(stress_request)
    if "error" not in stress_response:
        print("✅ Stress prediction successful")
        print(f"   Stress level: {stress_response.get('stress_level', 'unknown')}")
    else:
        print(f"❌ Stress prediction failed: {stress_response['error']}")
    
    # Test meditation suggestion
    print("\n4. Testing meditation suggestion...")
    meditation_request = {
        "type": "meditation_suggestion",
        "user_id": "test_user_123",
        "preferences": {
            "duration": 10,
            "focus": "stress",
            "experience": "beginner"
        }
    }
    
    meditation_response = await agent_manager.process_request(meditation_request)
    if "error" not in meditation_response:
        print("✅ Meditation suggestion successful")
        print(f"   Suggested: {meditation_response.get('meditation', {}).get('title', 'unknown')}")
    else:
        print(f"❌ Meditation suggestion failed: {meditation_response['error']}")
    
    # Test companion chat
    print("\n5. Testing companion chat...")
    chat_request = {
        "type": "companion_chat",
        "user_id": "test_user_123",
        "message": "I'm feeling a bit anxious today"
    }
    
    chat_response = await agent_manager.process_request(chat_request)
    if "error" not in chat_response:
        print("✅ Companion chat successful")
        print(f"   Response: {chat_response.get('response', 'No response')[:100]}...")
    else:
        print(f"❌ Companion chat failed: {chat_response['error']}")
    
    # Test system status
    print("\n6. Testing system status...")
    status = await agent_manager.get_system_status()
    print(f"✅ System status retrieved")
    print(f"   Initialized: {status.get('initialized', False)}")
    print(f"   Total agents: {status.get('total_agents', 0)}")
    
    print("\n🎉 Mental Health Agent testing completed!")

if __name__ == "__main__":
    asyncio.run(test_mental_health_agent())
