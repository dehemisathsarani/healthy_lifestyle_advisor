import requests
import json
from datetime import datetime

# Test credentials for the 3 users
USERS = [
    {"name": "Dehemi", "email": "dehemi@example.com", "password": "dehemi12345"},
    {"name": "John", "email": "john@example.com", "password": "john12345"},
    {"name": "Leo", "email": "leo@example.com", "password": "leo12345"}
]

BASE_URL = "http://localhost:8000"

def test_login(user):
    """Test login for a specific user"""
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": user["email"], "password": user["password"]},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            return {
                "success": True,
                "user": user,
                "token": data.get("accessToken", "")[:50] + "...",
                "response": data
            }
        else:
            return {
                "success": False,
                "user": user,
                "error": f"HTTP {response.status_code}: {response.text}"
            }
    except Exception as e:
        return {
            "success": False,
            "user": user,
            "error": str(e)
        }

def test_protected_endpoint(token):
    """Test protected endpoint with token"""
    try:
        response = requests.get(
            f"{BASE_URL}/auth/me",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        
        if response.status_code == 200:
            return {"success": True, "data": response.json()}
        else:
            return {"success": False, "error": f"HTTP {response.status_code}: {response.text}"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def check_database_users():
    """Check what users exist in the database"""
    try:
        response = requests.get(f"{BASE_URL}/auth/debug/users", timeout=10)
        if response.status_code == 200:
            return {"success": True, "data": response.json()}
        else:
            return {"success": False, "error": f"HTTP {response.status_code}: {response.text}"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def main():
    print("🧪 Testing Login System - Dehemi, John, Leo")
    print("=" * 55)
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Check database users first
    print("1. Checking Database Users:")
    print("-" * 30)
    db_result = check_database_users()
    if db_result["success"]:
        users_data = db_result["data"]
        print(f"✅ Found {users_data['count']} users in database:")
        for user in users_data["users"]:
            print(f"   - {user['name']} ({user['email']})")
    else:
        print(f"❌ Failed to check database: {db_result['error']}")
    print()
    
    # Test login for each user
    print("2. Testing Login for Each User:")
    print("-" * 30)
    
    successful_logins = 0
    login_results = []
    
    for user in USERS:
        print(f"Testing {user['name']} ({user['email']})...")
        result = test_login(user)
        login_results.append(result)
        
        if result["success"]:
            print(f"✅ Login successful!")
            print(f"   Token: {result['token']}")
            
            # Test protected endpoint
            if "response" in result and "accessToken" in result["response"]:
                full_token = result["response"]["accessToken"]
                me_result = test_protected_endpoint(full_token)
                if me_result["success"]:
                    user_info = me_result["data"]
                    print(f"✅ Protected endpoint test passed")
                    print(f"   Profile: {user_info.get('name')} ({user_info.get('email')})")
                else:
                    print(f"❌ Protected endpoint failed: {me_result['error']}")
            successful_logins += 1
        else:
            print(f"❌ Login failed: {result['error']}")
        print()
    
    # Summary
    print("📊 Test Summary:")
    print("-" * 30)
    print(f"Total Users: {len(USERS)}")
    print(f"Successful Logins: {successful_logins}")
    print(f"Failed Logins: {len(USERS) - successful_logins}")
    print(f"Success Rate: {(successful_logins / len(USERS) * 100):.1f}%")
    
    if successful_logins == len(USERS):
        print("\n🎉 ALL TESTS PASSED! Login system is working correctly for all 3 users.")
    else:
        print(f"\n⚠️  {len(USERS) - successful_logins} test(s) failed. Check the details above.")
    
    # Show detailed results
    print("\n📋 Detailed Results:")
    print("-" * 30)
    for i, result in enumerate(login_results, 1):
        user = result["user"]
        status = "✅ SUCCESS" if result["success"] else "❌ FAILED"
        print(f"{i}. {user['name']} - {status}")

if __name__ == "__main__":
    main()
