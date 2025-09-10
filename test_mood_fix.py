"""
Test mood tracking API with proper authentication
"""
import requests
import json

def test_mood_tracking():
    """Test mood tracking endpoint"""
    print("🧪 Testing mood tracking API fix...")
    
    # First, let's try to register a test user
    base_url = "http://localhost:8000"
    
    # Test user data
    test_user = {
        "username": "testuser123",
        "email": "test@example.com",
        "password": "testpassword123",
        "full_name": "Test User"
    }
    
    print("1. Registering test user...")
    try:
        response = requests.post(f"{base_url}/auth/register", json=test_user)
        print(f"   Registration response: {response.status_code}")
        if response.status_code == 400:
            print("   User might already exist, continuing...")
        elif response.status_code == 201:
            print("   ✅ User registered successfully")
        else:
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   Registration error: {e}")
    
    # Login to get token
    print("\n2. Logging in...")
    try:
        login_data = {
            "username": test_user["username"],
            "password": test_user["password"]
        }
        response = requests.post(f"{base_url}/auth/login", data=login_data)
        print(f"   Login response: {response.status_code}")
        
        if response.status_code == 200:
            token_data = response.json()
            access_token = token_data["access_token"]
            print("   ✅ Login successful")
            
            # Test mood tracking with authentication
            print("\n3. Testing mood tracking...")
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            
            mood_data = {
                "mood_score": 8,
                "notes": "Testing mood tracking fix"
            }
            
            response = requests.post(f"{base_url}/mental-health/mood", 
                                   json=mood_data, headers=headers)
            print(f"   Mood tracking response: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print("   ✅ Mood tracking successful!")
                print(f"   Response: {json.dumps(result, indent=2)}")
            else:
                print(f"   ❌ Mood tracking failed: {response.text}")
                
        else:
            print(f"   ❌ Login failed: {response.text}")
            
    except Exception as e:
        print(f"   Login error: {e}")

if __name__ == "__main__":
    test_mood_tracking()
