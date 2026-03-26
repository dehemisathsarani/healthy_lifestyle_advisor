#!/usr/bin/env python3

print("🧪 Starting user registration test...")

try:
    import requests
    print("✅ Requests library imported successfully")
    
    import json
    import time
    import random
    
    url = "http://localhost:8002/auth/register"
    
    # Generate unique email to avoid conflicts
    timestamp = int(time.time())
    random_id = random.randint(1000, 9999)
    
    test_user = {
        "name": "Test User",
        "email": f"testuser{timestamp}_{random_id}@example.com", 
        "password": "testpassword123",
        "age": 25,
        "country": "Sri Lanka",
        "mobile": "+94712345678"
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    print(f"📍 URL: {url}")
    print(f"📋 Data: {json.dumps(test_user, indent=2)}")
    print("🔄 Sending request...")
    
    response = requests.post(url, headers=headers, json=test_user, timeout=10)
    
    print(f"📊 Response Status Code: {response.status_code}")
    print(f"📋 Response Headers: {dict(response.headers)}")
    
    if response.status_code == 201:
        print("✅ Registration successful!")
        try:
            response_json = response.json()
            print(f"📋 Response: {json.dumps(response_json, indent=2)}")
        except:
            print(f"📋 Response (raw): {response.text}")
    else:
        print("❌ Registration failed!")
        print(f"📋 Error Response: {response.text}")
        
except ImportError as e:
    print(f"❌ Import error: {e}")
except requests.exceptions.ConnectionError:
    print("❌ Connection error - make sure the server is running on port 8001")
except requests.exceptions.Timeout:
    print("❌ Request timeout")
except Exception as e:
    print(f"❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()

print("🏁 Test completed.")
