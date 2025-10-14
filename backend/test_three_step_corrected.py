#!/usr/bin/env python3
"""
Test three-step OTP workflow with proper class instantiation
"""

import os
import sys
import asyncio
from datetime import datetime

# Add backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from dotenv import load_dotenv
load_dotenv()

async def test_three_step_workflow_corrected():
    print("🧪 Testing Three-Step OTP Workflow (Corrected)")
    print("=" * 50)
    
    test_email = "nethmijasinarachchi@gmail.com"
    
    try:
        # Import required services and database
        from app.core.database import get_database
        from app.services.otp_service import OTPService
        from app.services.email_service import send_otp_email
        
        # Get database connection  
        try:
            from app.core.database import connect_to_mongo
            await connect_to_mongo()
            # Get database instance directly (it's not async)
            db = get_database()
            print("✅ Database connected")
        except Exception as e:
            print(f"❌ Database connection failed: {e}")
            return
        
        # Create OTP service instance
        otp_service = OTPService(db)
        
        # Step 1: Email Verification OTP
        print("\n📧 Step 1: Email Verification")
        print("-" * 30)
        
        # Create email verification OTP
        email_otp_result = await otp_service.create_email_verification_otp(test_email)
        print(f"✅ Email verification OTP created")
        print(f"📝 OTP Code: {email_otp_result.get('otp_code', 'Not available')}")
        print(f"📅 Expires: {email_otp_result.get('expires_at', 'Not available')}")
        
        # Get the OTP code (either visible or need to extract)
        otp_code = email_otp_result.get('otp_code')
        if otp_code and otp_code != "******":
            # OTP is visible, email might not have been sent
            print(f"📝 OTP Code visible: {otp_code}")
            # Try to send email manually
            email_sent = await send_otp_email(test_email, otp_code, "email_verification")
            if email_sent:
                print(f"✅ Email verification OTP sent to {test_email}")
            else:
                print(f"⚠️ Email sending failed, but OTP created: {otp_code}")
        elif email_otp_result.get('email_sent'):
            # Email was sent, we need to simulate the OTP (for testing, get it from DB or use a known test code)
            print(f"✅ Email verification OTP sent to {test_email}")
            # For testing purposes, we'll get the OTP from the result or use a test approach
            # In real use, user would get this from email
            # Let's use a simple approach - get the real OTP for verification
            print("📧 In real use, user would enter OTP from email")
            
            # For testing, let's get the actual OTP from database (this is just for testing)
            otp_cursor = otp_service.otp_collection.find({
                "identifier": test_email.lower(),
                "purpose": "email_verification",
                "verified": False
            }).sort("created_at", -1).limit(1)
            
            otp_doc = await otp_cursor.to_list(length=1)
            if otp_doc:
                otp_code = otp_doc[0]["otp_code"]
                print(f"📝 Retrieved OTP for testing: {otp_code}")
            else:
                print("❌ Could not retrieve OTP for testing")
                return
        else:
            print("❌ Failed to create or send email verification OTP")
            return
        
        # Verify the OTP
        verify_result = await otp_service.verify_email_verification_access(test_email, otp_code)
        if verify_result.get('success'):
            print("✅ Email verification completed successfully")
        else:
            print("❌ Email verification failed")
            return
            
        # Step 2: Download Access OTP
        print("\n📥 Step 2: Download Access")
        print("-" * 30)
        
        # Create download access OTP
        download_otp_result = await otp_service.create_download_access_otp(test_email)
        print(f"✅ Download access OTP created")
        print(f"📝 OTP Code: {download_otp_result.get('otp_code', 'Not available')}")
        print(f"📅 Expires: {download_otp_result.get('expires_at', 'Not available')}")
        
        # Handle download access OTP
        otp_code = download_otp_result.get('otp_code')
        if otp_code and otp_code != "******":
            print(f"📝 Download OTP Code visible: {otp_code}")
            email_sent = await send_otp_email(test_email, otp_code, "download_access")
            if email_sent:
                print(f"✅ Download access OTP sent to {test_email}")
            else:
                print(f"⚠️ Email sending failed, but OTP created: {otp_code}")
        elif download_otp_result.get('email_sent'):
            print(f"✅ Download access OTP sent to {test_email}")
            # Get OTP from database for testing
            otp_cursor = otp_service.otp_collection.find({
                "identifier": test_email.lower(),
                "purpose": "download_access",
                "verified": False
            }).sort("created_at", -1).limit(1)
            
            otp_doc = await otp_cursor.to_list(length=1)
            if otp_doc:
                otp_code = otp_doc[0]["otp_code"]
                print(f"📝 Retrieved download OTP for testing: {otp_code}")
            else:
                print("❌ Could not retrieve download OTP for testing")
                return
        else:
            print("❌ Failed to create download access OTP")
            return
        
        # Verify the download OTP
        verify_result = await otp_service.verify_download_access(test_email, otp_code)
        if verify_result.get('success'):
            print("✅ Download access verified successfully")
        else:
            print("❌ Download access verification failed")
            return
            
        # Step 3: Decrypt Access OTP
        print("\n🔓 Step 3: Decrypt Access")
        print("-" * 30)
        
        # Create decrypt access OTP
        decrypt_otp_result = await otp_service.create_decrypt_access_otp(test_email)
        print(f"✅ Decrypt access OTP created")
        print(f"📝 OTP Code: {decrypt_otp_result.get('otp_code', 'Not available')}")
        print(f"📅 Expires: {decrypt_otp_result.get('expires_at', 'Not available')}")
        
        # Handle decrypt access OTP
        otp_code = decrypt_otp_result.get('otp_code')
        if otp_code and otp_code != "******":
            print(f"📝 Decrypt OTP Code visible: {otp_code}")
            email_sent = await send_otp_email(test_email, otp_code, "decrypt_access")
            if email_sent:
                print(f"✅ Decrypt access OTP sent to {test_email}")
            else:
                print(f"⚠️ Email sending failed, but OTP created: {otp_code}")
        elif decrypt_otp_result.get('email_sent'):
            print(f"✅ Decrypt access OTP sent to {test_email}")
            # Get OTP from database for testing
            otp_cursor = otp_service.otp_collection.find({
                "identifier": test_email.lower(),
                "purpose": "decrypt_access",
                "verified": False
            }).sort("created_at", -1).limit(1)
            
            otp_doc = await otp_cursor.to_list(length=1)
            if otp_doc:
                otp_code = otp_doc[0]["otp_code"]
                print(f"📝 Retrieved decrypt OTP for testing: {otp_code}")
            else:
                print("❌ Could not retrieve decrypt OTP for testing")
                return
        else:
            print("❌ Failed to create decrypt access OTP")
            return
        
        # Verify the decrypt OTP
        verify_result = await otp_service.verify_decrypt_access(test_email, otp_code)
        if verify_result.get('success'):
            print("✅ Decrypt access verified successfully")
        else:
            print("❌ Decrypt access verification failed")
            return
        
        print("\n🎉 Complete Three-Step Workflow Test Result")
        print("=" * 50)
        print("✅ ALL THREE STEPS COMPLETED SUCCESSFULLY!")
        print("✅ Email verification: PASSED")
        print("✅ Download access: PASSED") 
        print("✅ Decrypt access: PASSED")
        print(f"\n📧 Check your Gmail inbox ({test_email}) for all three OTP emails!")
        
    except Exception as e:
        print(f"❌ Error in three-step workflow: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_three_step_workflow_corrected())