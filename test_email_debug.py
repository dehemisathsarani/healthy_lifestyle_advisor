#!/usr/bin/env python3
"""
Test script to debug email service issues
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables from backend/.env
load_dotenv('backend/.env')
print(f"🔧 Loading .env from: backend/.env")

# Add the backend directory to the path
sys.path.append('backend')

# Test 1: Check if environment variables are loaded
print("🔍 Testing Environment Variables")
print(f"SMTP_EMAIL: {os.getenv('SMTP_EMAIL', 'NOT_SET')}")
print(f"SMTP_PASSWORD: {os.getenv('SMTP_PASSWORD', 'NOT_SET')}")

# Test 2: Try to import email service
print("\n🔍 Testing Email Service Import")
try:
    from backend.app.services.email_service import email_service
    print("✅ Email service imported successfully")
    print(f"📧 Configured email: {email_service.sender_email}")
    print(f"🔐 Password set: {'Yes' if email_service.sender_password != 'adufkscdzidfplal' else 'Using default'}")
except ImportError as e:
    print(f"❌ Failed to import email service: {e}")
    sys.exit(1)

# Test 3: Test SMTP connection
print("\n🔍 Testing SMTP Connection")
try:
    connection_test = email_service.test_connection()
    if connection_test:
        print("✅ SMTP connection successful!")
    else:
        print("❌ SMTP connection failed!")
except Exception as e:
    print(f"❌ SMTP connection error: {e}")

# Test 4: Try to send a test email
print("\n🔍 Testing Email Sending")
try:
    test_result = email_service.send_otp_email(
        recipient_email="nethmijasinarachchi@gmail.com",
        otp_code="123456",
        expires_in_minutes=10
    )
    
    if test_result:
        print("✅ Test email sent successfully!")
        print("📧 Check your inbox for the test OTP email")
    else:
        print("❌ Failed to send test email")
        
except Exception as e:
    print(f"❌ Email sending error: {e}")

print("\n📊 Email Service Debug Complete")