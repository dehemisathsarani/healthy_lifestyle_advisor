"""
Simple test to verify the Mental Health Agent mood tracking works
"""

import asyncio
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

async def test_mood_tracking():
    """Test mood tracking functionality directly"""
    print("🧪 Testing Mental Health Agent mood tracking...")
    
    try:
        from app.agents.agent_manager import agent_manager
        
        # Initialize the agent system
        print("1. Initializing agent system...")
        success = await agent_manager.initialize_system()
        if not success:
            print("❌ Failed to initialize agent system")
            return
        print("✅ Agent system initialized successfully")
        
        # Test mood tracking with a valid user_id
        print("\n2. Testing mood tracking...")
        mood_request = {
            "type": "mood_tracking",
            "user_id": "test_user_123",  # This should work now
            "mood_score": 7,
            "notes": "Feeling good today!"
        }
        
        mood_response = await agent_manager.process_request(mood_request)
        if "error" not in mood_response:
            print("✅ Mood tracking successful")
            print(f"   Response: {mood_response}")
        else:
            print(f"❌ Mood tracking failed: {mood_response['error']}")
        
        print("\n🎉 Test completed!")
        
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_mood_tracking())
