#!/usr/bin/env python3
"""
Test script to verify Mental Health Agent integration
"""
import requests
import json

def test_mental_health_integration():
    """Test the Mental Health Agent integration"""
    base_url = "http://localhost:8000"
    
    print("🧪 Testing Mental Health Agent Integration...")
    print("=" * 50)
    
    # Test 1: Health Check
    print("\n1. Testing Health Check endpoint...")
    try:
        response = requests.get(f"{base_url}/api/mental-health/health")
        if response.status_code == 200:
            print("✅ Health check passed")
            data = response.json()
            print(f"   Status: {data.get('status')}")
            print(f"   Agent: {data.get('agent')}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Health check error: {e}")
    
    # Test 2: Status Check
    print("\n2. Testing Status endpoint...")
    try:
        response = requests.get(f"{base_url}/api/mental-health/status")
        if response.status_code == 200:
            print("✅ Status check passed")
            data = response.json()
            print(f"   System initialized: {data.get('system_initialized')}")
            agent_info = data.get('mental_health_agent', {})
            print(f"   Agent status: {agent_info.get('status')}")
        else:
            print(f"❌ Status check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Status check error: {e}")
    
    # Test 3: Authentication Required Endpoints
    print("\n3. Testing authenticated endpoints (should require auth)...")
    endpoints_to_test = [
        "/api/mental-health/mood/track",
        "/api/mental-health/meditation/suggest",
        "/api/mental-health/breathing/exercise"
    ]
    
    for endpoint in endpoints_to_test:
        try:
            if "track" in endpoint:
                response = requests.post(f"{base_url}{endpoint}", 
                                       json={"mood_score": 7, "notes": "test"})
            elif "suggest" in endpoint:
                response = requests.post(f"{base_url}{endpoint}", 
                                       json={"duration": 10, "focus": "stress"})
            else:
                response = requests.get(f"{base_url}{endpoint}")
                
            if response.status_code == 401:
                print(f"✅ {endpoint} - Correctly requires authentication")
            else:
                print(f"⚠️  {endpoint} - Status: {response.status_code}")
        except Exception as e:
            print(f"❌ {endpoint} - Error: {e}")
    
    print("\n" + "=" * 50)
    print("✅ Mental Health Agent Integration Test Complete!")
    print("\nTo test the frontend integration:")
    print("1. Open http://localhost:5173 in your browser")
    print("2. Login to your account")
    print("3. Go to Services page")
    print("4. Click 'Launch Mental Health' button")
    print("5. Verify the Mental Health Dashboard loads correctly")

if __name__ == "__main__":
    test_mental_health_integration()
