#!/usr/bin/env python3
"""
Complete Project Status Verification
"""
import requests
import json
import subprocess
import time

def check_port_status(port, service_name):
    """Check if a service is running on a specific port"""
    try:
        response = requests.get(f"http://localhost:{port}", timeout=3)
        return True, response.status_code
    except:
        return False, None

def test_authentication():
    """Test the complete authentication flow"""
    base_url = "http://localhost:8000"
    
    print("🔐 Testing Authentication Flow...")
    
    # Test login with demo user
    login_data = {
        "email": "demo@example.com",
        "password": "demo12345"
    }
    
    try:
        response = requests.post(f"{base_url}/auth/login", json=login_data)
        if response.status_code == 200:
            result = response.json()
            print("✅ Login successful!")
            print(f"   Access Token: {result.get('accessToken', '')[:50]}...")
            return True, result.get('accessToken')
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return False, None
    except Exception as e:
        print(f"❌ Login error: {e}")
        return False, None

def test_protected_endpoints(token):
    """Test protected endpoints with authentication"""
    base_url = "http://localhost:8000"
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n🛡️ Testing Protected Endpoints...")
    
    endpoints = [
        "/api/mental-health/health",
        "/api/mental-health/status"
    ]
    
    for endpoint in endpoints:
        try:
            response = requests.get(f"{base_url}{endpoint}", headers=headers)
            if response.status_code == 200:
                print(f"✅ {endpoint} - Working")
            else:
                print(f"⚠️  {endpoint} - Status: {response.status_code}")
        except Exception as e:
            print(f"❌ {endpoint} - Error: {e}")

def main():
    print("🚀 HEALTHY LIFESTYLE ADVISOR - PROJECT STATUS")
    print("=" * 60)
    
    # Check backend
    backend_running, backend_status = check_port_status(8000, "Backend")
    print(f"🔧 Backend (Port 8000): {'✅ RUNNING' if backend_running else '❌ STOPPED'}")
    if backend_running:
        print(f"   HTTP Status: {backend_status}")
    
    # Check frontend
    frontend_running, frontend_status = check_port_status(5173, "Frontend")
    print(f"🌐 Frontend (Port 5173): {'✅ RUNNING' if frontend_running else '❌ STOPPED'}")
    if frontend_running:
        print(f"   HTTP Status: {frontend_status}")
    
    print("\n" + "=" * 60)
    
    if backend_running:
        # Test authentication
        login_success, token = test_authentication()
        
        if login_success and token:
            # Test protected endpoints
            test_protected_endpoints(token)
        
        print("\n" + "=" * 60)
        print("📋 SUMMARY:")
        print(f"✅ Backend API: {'RUNNING' if backend_running else 'STOPPED'}")
        print(f"✅ Frontend UI: {'RUNNING' if frontend_running else 'STOPPED'}")
        print(f"✅ Authentication: {'WORKING' if login_success else 'FAILED'}")
        print(f"✅ Test User: demo@example.com / demo12345")
        
        if backend_running and frontend_running and login_success:
            print("\n🎉 PROJECT IS FULLY OPERATIONAL!")
            print("📱 Access the app at: http://localhost:5173")
            print("📚 API docs at: http://localhost:8000/docs")
            print("🔐 Login with: demo@example.com / demo12345")
        else:
            print("\n⚠️  Some services need attention")
    else:
        print("\n❌ Backend not running. Please start it first.")

if __name__ == "__main__":
    main()
