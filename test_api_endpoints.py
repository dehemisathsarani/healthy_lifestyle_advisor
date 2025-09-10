"""
Test API endpoints for Mental Health Agent
"""

import requests
import json

def test_api_endpoints():
    base_url = "http://localhost:8000"
    
    print("🧪 Testing Mental Health Agent API endpoints...")
    
    # Test health endpoint (no auth needed)
    try:
        print("\n1. Testing health endpoint...")
        response = requests.get(f"{base_url}/api/mental-health/health")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ Health endpoint working")
            print(f"Response: {response.json()}")
        else:
            print(f"❌ Health endpoint failed: {response.text}")
    except Exception as e:
        print(f"❌ Health endpoint error: {e}")
    
    # Test status endpoint (no auth needed)
    try:
        print("\n2. Testing status endpoint...")
        response = requests.get(f"{base_url}/api/mental-health/status")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ Status endpoint working")
            print(f"Response: {response.json()}")
        else:
            print(f"❌ Status endpoint failed: {response.text}")
    except Exception as e:
        print(f"❌ Status endpoint error: {e}")
    
    # Test breathing exercise endpoint (no auth needed to check if endpoint exists)
    try:
        print("\n3. Testing breathing exercise endpoint (without auth)...")
        response = requests.get(f"{base_url}/api/mental-health/breathing/exercise")
        print(f"Status: {response.status_code}")
        if response.status_code == 401:
            print("✅ Breathing exercise endpoint exists (requires auth)")
        elif response.status_code == 200:
            print("✅ Breathing exercise endpoint working")
            print(f"Response: {response.json()}")
        else:
            print(f"⚠️ Breathing exercise endpoint response: {response.text}")
    except Exception as e:
        print(f"❌ Breathing exercise endpoint error: {e}")

    print("\n🎉 API endpoint testing completed!")

if __name__ == "__main__":
    test_api_endpoints()
