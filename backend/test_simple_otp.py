#!/usr/bin/env python3
"""
Simple OTP test
"""

import os
import sys
import asyncio

# Add backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from dotenv import load_dotenv
load_dotenv()

async def test_simple_otp():
    print("🧪 Testing Simple OTP Creation")
    print("=" * 40)
    
    test_email = "nethmijasinarachchi@gmail.com"
    
    try:
        # Import services
        from app.services.otp_service import create_email_verification_otp
        from app.services.email_service import send_otp_email
        
        print(f"📧 Creating OTP for: {test_email}")
        
        # Create OTP
        otp_result = await create_email_verification_otp(test_email)
        print(f"✅ OTP Created: {otp_result['otp_code']}")
        print(f"📅 Expires: {otp_result['expires_at']}")
        
        # Send email
        print(f"📤 Sending OTP email...")
        email_sent = await send_otp_email(test_email, otp_result['otp_code'], "email_verification")
        
        if email_sent:
            print("✅ Email sent successfully!")
            print("📧 Check your Gmail inbox for the OTP!")
        else:
            print("❌ Failed to send email")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_simple_otp())