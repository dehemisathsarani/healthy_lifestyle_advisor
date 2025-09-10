import asyncio
import aiohttp
import json
from datetime import datetime

# Test credentials for all 3 users
TEST_USERS = [
    {"email": "demo@example.com", "password": "demo12345", "name": "Demo User"},
    {"email": "admin@healthagent.com", "password": "admin123", "name": "Test Admin"},
    {"email": "john.smith@example.com", "password": "john2024", "name": "John Smith"}
]

BASE_URL = "http://localhost:8000"

async def test_login(session, user_creds):
    """Test login for a specific user"""
    try:
        login_data = {
            "email": user_creds["email"],
            "password": user_creds["password"]
        }
        
        async with session.post(f"{BASE_URL}/auth/login", json=login_data) as response:
            status = response.status
            response_data = await response.json()
            
            return {
                "email": user_creds["email"],
                "name": user_creds["name"],
                "status": status,
                "success": status == 200,
                "response": response_data,
                "access_token": response_data.get("access_token") if status == 200 else None
            }
    except Exception as e:
        return {
            "email": user_creds["email"],
            "name": user_creds["name"],
            "status": "ERROR",
            "success": False,
            "error": str(e)
        }

async def test_protected_endpoint(session, access_token):
    """Test accessing a protected endpoint with token"""
    try:
        headers = {"Authorization": f"Bearer {access_token}"}
        async with session.get(f"{BASE_URL}/auth/me", headers=headers) as response:
            status = response.status
            response_data = await response.json()
            return {
                "status": status,
                "success": status == 200,
                "response": response_data
            }
    except Exception as e:
        return {
            "status": "ERROR",
            "success": False,
            "error": str(e)
        }

async def test_registration():
    """Test user registration"""
    try:
        async with aiohttp.ClientSession() as session:
            new_user_data = {
                "name": "Test Registration",
                "email": "test.reg@example.com",
                "password": "test123456",
                "age": 26,
                "country": "Australia"
            }
            
            async with session.post(f"{BASE_URL}/auth/register", json=new_user_data) as response:
                status = response.status
                response_data = await response.json()
                
                return {
                    "status": status,
                    "success": status == 200,
                    "response": response_data
                }
    except Exception as e:
        return {
            "status": "ERROR",
            "success": False,
            "error": str(e)
        }

async def main():
    print("🧪 Testing Login System with 3 Users")
    print("=" * 50)
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    async with aiohttp.ClientSession() as session:
        # Test login for all 3 users
        print("1. Testing Login for All Users:")
        print("-" * 30)
        
        login_results = []
        for user in TEST_USERS:
            result = await test_login(session, user)
            login_results.append(result)
            
            status_emoji = "✅" if result["success"] else "❌"
            print(f"{status_emoji} {result['name']} ({result['email']})")
            print(f"   Status: {result['status']}")
            
            if result["success"]:
                print(f"   Token: {result['access_token'][:50]}...")
            else:
                print(f"   Error: {result.get('error', result.get('response', 'Unknown error'))}")
            print()
        
        # Test protected endpoints with valid tokens
        print("2. Testing Protected Endpoints:")
        print("-" * 30)
        
        for result in login_results:
            if result["success"] and result["access_token"]:
                me_result = await test_protected_endpoint(session, result["access_token"])
                status_emoji = "✅" if me_result["success"] else "❌"
                print(f"{status_emoji} /auth/me for {result['name']}")
                
                if me_result["success"]:
                    user_info = me_result["response"]
                    print(f"   User: {user_info.get('name')} ({user_info.get('email')})")
                else:
                    print(f"   Error: {me_result.get('error', 'Unknown error')}")
                print()
        
        # Test registration
        print("3. Testing User Registration:")
        print("-" * 30)
        
        reg_result = await test_registration()
        status_emoji = "✅" if reg_result["success"] else "❌"
        print(f"{status_emoji} New User Registration")
        print(f"   Status: {reg_result['status']}")
        
        if reg_result["success"]:
            user_data = reg_result["response"].get("user", {})
            print(f"   Created: {user_data.get('name')} ({user_data.get('email')})")
        else:
            print(f"   Error: {reg_result.get('error', reg_result.get('response', 'Unknown error'))}")
        print()
        
        # Summary
        print("📊 Test Summary:")
        print("-" * 30)
        successful_logins = sum(1 for r in login_results if r["success"])
        print(f"✅ Successful Logins: {successful_logins}/{len(TEST_USERS)}")
        print(f"✅ Registration Test: {'PASSED' if reg_result['success'] else 'FAILED'}")
        
        if successful_logins == len(TEST_USERS) and reg_result["success"]:
            print("\n🎉 ALL TESTS PASSED! Login system is working correctly.")
        else:
            print(f"\n⚠️  Some tests failed. Check the details above.")

if __name__ == "__main__":
    asyncio.run(main())
