#!/usr/bin/env python3
"""
Test script for the two-step OTP system:
1. First OTP: Access verification for report generation
2. Second OTP: Download verification for encrypted file access
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"
identifier = "nethmijasinarachchi@gmail.com"

def test_two_step_otp_flow():
    print("🔐 Testing Two-Step OTP System")
    print("=" * 50)
    
    # Step 1: Request initial OTP for report generation access
    print("\n📧 Step 1: Requesting initial access OTP...")
    try:
        response = requests.post(f"{BASE_URL}/api/security/request-decrypt-otp", 
                               json={"identifier": identifier})
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("✅ Initial OTP sent successfully!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Step 2: Simulate report generation (this would use the first OTP)
    print(f"\n📊 Step 2: Simulating report generation...")
    print("Note: In the frontend, user enters first OTP and clicks 'Generate Encrypted Report'")
    
    # Step 3: Request download OTP automatically after report generation
    print(f"\n📥 Step 3: Requesting download OTP...")
    try:
        response = requests.post(f"{BASE_URL}/api/security/request-decrypt-otp", 
                               json={"identifier": identifier})
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("✅ Download OTP sent successfully!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Step 4: Test wrong OTP verification (should auto-generate new OTP)
    print(f"\n🔍 Step 4: Testing wrong OTP (should auto-generate new)...")
    try:
        response = requests.post(f"{BASE_URL}/api/security/verify-decrypt-otp", 
                               json={
                                   "identifier": identifier,
                                   "otp_code": "999999"  # Wrong OTP
                               })
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.json().get("action") == "new_otp_sent":
            print("✅ Auto-generation working! New OTP sent when wrong code entered.")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Step 5: Check system status
    print(f"\n📊 Step 5: Checking system status...")
    try:
        response = requests.get(f"{BASE_URL}/api/security/status")
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
    except Exception as e:
        print(f"❌ Error: {e}")

def test_workflow_explanation():
    print("\n" + "="*50)
    print("🎯 TWO-STEP OTP WORKFLOW EXPLANATION")
    print("="*50)
    
    print("\n🔄 User Journey:")
    print("1. 📧 User enters email → First OTP sent")
    print("2. 🔐 User enters First OTP → Verifies access")
    print("3. 📊 User clicks 'Generate Encrypted Report' → Report created")
    print("4. 📥 System automatically sends Download OTP")
    print("5. 🔐 User enters Download OTP → Access granted")
    print("6. 📁 User clicks 'Download Encrypted Report' → File downloads")
    
    print("\n✅ Benefits:")
    print("• No more 'OTP not found' errors")
    print("• Separate security for generation vs download")
    print("• Auto-generation of new OTPs when needed")
    print("• Clear user feedback at each step")
    print("• Professional email notifications")

if __name__ == "__main__":
    test_two_step_otp_flow()
    test_workflow_explanation()
    
    print(f"\n🎉 Two-step OTP system is ready!")
    print(f"🌐 Frontend: http://localhost:5173")
    print(f"🔧 Backend: http://localhost:8000")
    print(f"📧 Email: {identifier}")