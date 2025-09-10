#!/usr/bin/env python3
"""
Debug script to test authentication endpoints and create a test user
"""
import requests
import json

def create_test_user():
    """Create a test user for debugging"""
    url = "http://localhost:8000/auth/register"
    data = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "testpass123"
    }
    
    print("🔧 Creating test user...")
    try:
        response = requests.post(url, json=data)
        print(f"Status: {response.status_code}")
        if response.status_code == 201:
            print("✅ Test user created successfully!")
            print(f"Response: {response.json()}")
            return True
        else:
            print(f"❌ Failed to create user: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_login():
    """Test login with the test user"""
    url = "http://localhost:8000/auth/login"
    data = {
        "email": "test@example.com",
        "password": "testpass123"
    }
    
    print("\n🔐 Testing login...")
    try:
        response = requests.post(url, json=data)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ Login successful!")
            result = response.json()
            print(f"Access Token: {result.get('accessToken', 'Not found')[:50]}...")
            return True
        else:
            print(f"❌ Login failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_backend_health():
    """Test if backend is healthy"""
    print("🏥 Testing backend health...")
    try:
        response = requests.get("http://localhost:8000/")
        print(f"Backend status: {response.status_code}")
        if response.status_code == 200:
            print("✅ Backend is healthy")
            return True
        else:
            print("❌ Backend not responding correctly")
            return False
    except Exception as e:
        print(f"❌ Backend connection error: {e}")
        return False

def main():
    print("🧪 Authentication Debug Script")
    print("=" * 50)
    
    # Test backend health first
    if not test_backend_health():
        print("❌ Backend is not running. Please start it first.")
        return
    
    # Try to create test user
    user_created = create_test_user()
    
    # Test login regardless of user creation result (user might already exist)
    login_success = test_login()
    
    print("\n" + "=" * 50)
    print("📋 Summary:")
    print(f"Backend Health: {'✅' if True else '❌'}")
    print(f"User Creation: {'✅' if user_created else '⚠️'}")
    print(f"Login Test: {'✅' if login_success else '❌'}")
    
    if login_success:
        print("\n🎉 Authentication is working! You can now login from the frontend.")
    else:
        print("\n⚠️  Authentication issues detected. Check backend logs.")

if __name__ == "__main__":
    main()
