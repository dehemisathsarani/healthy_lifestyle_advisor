#!/usr/bin/env python3
"""
Test complete three-step OTP workflow
"""

import asyncio
import sys
import os
from datetime import datetime

# Add backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from app.services.otp_service import create_email_verification_otp, create_download_access_otp, create_decrypt_access_otp, verify_otp_code
from app.services.email_service import send_otp_email

async def test_three_step_workflow():
    """Test the complete three-step OTP workflow"""
    print("🧪 Testing Three-Step OTP Workflow")
    print("=" * 50)
    
    # Test email for OTP
    test_email = "nethmijasinarachchi@gmail.com"
    
    # Step 1: Email Verification OTP
    print("\n📧 Step 1: Email Verification")
    print("-" * 30)
    
    try:
        # Create email verification OTP
        otp_result = await create_email_verification_otp(test_email)
        print(f"✅ Email verification OTP created: {otp_result['otp_code']}")
        
        # Send email
        email_sent = await send_otp_email(test_email, otp_result['otp_code'], "email_verification")
        if email_sent:
            print(f"✅ Email verification OTP sent to {test_email}")
        else:
            print(f"❌ Failed to send email verification OTP")
            return
            
        # Verify OTP
        verification_result = await verify_otp_code(test_email, otp_result['otp_code'], "email_verification")
        if verification_result:
            print("✅ Email verification OTP verified successfully")
        else:
            print("❌ Email verification OTP verification failed")
            return
            
    except Exception as e:
        print(f"❌ Error in email verification step: {e}")
        return
    
    # Step 2: Download Access OTP
    print("\n📥 Step 2: Download Access")
    print("-" * 30)
    
    try:
        # Create download access OTP
        otp_result = await create_download_access_otp(test_email)
        print(f"✅ Download access OTP created: {otp_result['otp_code']}")
        
        # Send email
        email_sent = await send_otp_email(test_email, otp_result['otp_code'], "download_access")
        if email_sent:
            print(f"✅ Download access OTP sent to {test_email}")
        else:
            print(f"❌ Failed to send download access OTP")
            return
            
        # Verify OTP
        verification_result = await verify_otp_code(test_email, otp_result['otp_code'], "download_access")
        if verification_result:
            print("✅ Download access OTP verified successfully")
        else:
            print("❌ Download access OTP verification failed")
            return
            
    except Exception as e:
        print(f"❌ Error in download access step: {e}")
        return
    
    # Step 3: Decrypt Access OTP
    print("\n🔓 Step 3: Decrypt Access")
    print("-" * 30)
    
    try:
        # Create decrypt access OTP
        otp_result = await create_decrypt_access_otp(test_email)
        print(f"✅ Decrypt access OTP created: {otp_result['otp_code']}")
        
        # Send email
        email_sent = await send_otp_email(test_email, otp_result['otp_code'], "decrypt_access")
        if email_sent:
            print(f"✅ Decrypt access OTP sent to {test_email}")
        else:
            print(f"❌ Failed to send decrypt access OTP")
            return
            
        # Verify OTP
        verification_result = await verify_otp_code(test_email, otp_result['otp_code'], "decrypt_access")
        if verification_result:
            print("✅ Decrypt access OTP verified successfully")
        else:
            print("❌ Decrypt access OTP verification failed")
            return
            
    except Exception as e:
        print(f"❌ Error in decrypt access step: {e}")
        return
    
    print("\n🎉 Complete Three-Step Workflow Test Result")
    print("=" * 50)
    print("✅ ALL THREE STEPS COMPLETED SUCCESSFULLY!")
    print("✅ Email verification: PASSED")
    print("✅ Download access: PASSED")
    print("✅ Decrypt access: PASSED")
    print("\n📧 Check your Gmail inbox for all three OTP emails!")

if __name__ == "__main__":
    asyncio.run(test_three_step_workflow())