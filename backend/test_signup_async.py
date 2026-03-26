#!/usr/bin/env python3

import asyncio
import aiohttp
import json
import time
import random

async def test_user_registration():
    """Test user registration endpoint using async http client"""
    url = "http://localhost:8001/auth/register"
    
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
        print("🧪 Testing user registration...")
        print(f"📍 URL: {url}")
        print(f"📋 Data: {json.dumps(test_user, indent=2)}")
        
        async with aiohttp.ClientSession() as session:
            async with session.post(url, headers=headers, json=test_user) as response:
                print(f"\n📊 Response Status Code: {response.status}")
                print(f"📋 Response Headers: {dict(response.headers)}")
                
                response_text = await response.text()
                
                if response.status == 201:
                    print("✅ Registration successful!")
                    try:
                        response_json = json.loads(response_text)
                        print(f"📋 Response: {json.dumps(response_json, indent=2)}")
                    except json.JSONDecodeError:
                        print(f"📋 Response (raw): {response_text}")
                else:
                    print("❌ Registration failed!")
                    print(f"📋 Error Response: {response_text}")
                    
    except aiohttp.ClientConnectorError:
        print("❌ Connection error - make sure the server is running on port 8000")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_user_registration())
