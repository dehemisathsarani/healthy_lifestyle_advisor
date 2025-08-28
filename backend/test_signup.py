#!/usr/bin/env python3

import requests
import json
import time
import random

def test_user_registration():
    """Test user registration endpoint"""
    url = "http://localhost:8000/auth/register"
    
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
    
    try:
        print("Testing user registration...")
        print(f"URL: {url}")
        print(f"Data: {json.dumps(test_user, indent=2)}")
        
        response = requests.post(url, headers=headers, json=test_user)
        
        print(f"\nResponse Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 201:
            print("✅ Registration successful!")
            print(f"Response: {json.dumps(response.json(), indent=2)}")
        else:
            print("❌ Registration failed!")
            print(f"Error: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection error - make sure the server is running on port 8000")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    test_user_registration()
