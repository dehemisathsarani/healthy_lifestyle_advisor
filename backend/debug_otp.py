"""
OTP Debugging Script - Diagnose OTP issues
"""
import sys
import os
import asyncio
from datetime import datetime

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import get_database
from app.services.otp_service import OTPService

async def debug_otp_service():
    """Debug OTP service functionality"""
    print("=" * 70)
    print("OTP SERVICE DEBUGGING")
    print("=" * 70)
    
    # Get database connection
    try:
        db = await get_database()
        if not db:
            print("❌ Failed to connect to database")
            return
        
        print("✅ Database connection established")
        otp_service = OTPService(db)
        
        # Test email for debugging
        test_email = "test@example.com"
        test_otp = "123456"
        
        print(f"\n🔍 Debugging with test email: {test_email}")
        
        # 1. Check existing OTPs
        print("\n1. Checking existing OTPs for test email...")
        existing_otps = await otp_service.otp_collection.find({
            "identifier": test_email.lower()
        }).to_list(length=10)
        
        if existing_otps:
            print(f"   Found {len(existing_otps)} existing OTP(s):")
            for i, otp in enumerate(existing_otps, 1):
                status = "✅ Active" if not otp.get("verified", False) else "❌ Used"
                expired = "⏰ Expired" if datetime.utcnow() > otp.get("expires_at", datetime.utcnow()) else "⏱️ Valid"
                print(f"   {i}. Code: {otp.get('otp_code', 'N/A')} | {status} | {expired}")
                print(f"      Created: {otp.get('created_at', 'N/A')}")
                print(f"      Expires: {otp.get('expires_at', 'N/A')}")
                print(f"      Attempts: {otp.get('attempts', 0)}/{otp.get('max_attempts', 5)}")
        else:
            print("   No existing OTPs found")
        
        # 2. Create new OTP
        print(f"\n2. Creating new OTP for {test_email}...")
        try:
            result = await otp_service.create_otp(
                identifier=test_email,
                identifier_type="email",
                expires_in_minutes=10
            )
            print("   ✅ OTP created successfully:")
            print(f"      Code: {result.get('otp_code', 'Hidden')}")
            print(f"      Email sent: {result.get('email_sent', False)}")
            created_otp_code = result.get('otp_code')
            if created_otp_code == "******":
                # OTP was hidden, let's find it in database
                new_otp_doc = await otp_service.otp_collection.find_one({
                    "identifier": test_email.lower(),
                    "verified": False
                })
                if new_otp_doc:
                    created_otp_code = new_otp_doc['otp_code']
                    print(f"      Actual code: {created_otp_code}")
        except Exception as e:
            print(f"   ❌ Failed to create OTP: {e}")
            return
        
        # 3. Test verification with correct code
        print(f"\n3. Testing verification with correct code...")
        try:
            verify_result = await otp_service.verify_otp(
                identifier=test_email,
                otp_code=created_otp_code,
                identifier_type="email"
            )
            print(f"   Result: {'✅ Success' if verify_result.get('success') else '❌ Failed'}")
            print(f"   Message: {verify_result.get('message', 'N/A')}")
        except Exception as e:
            print(f"   ❌ Verification failed: {e}")
        
        # 4. Test verification with wrong code
        print(f"\n4. Testing verification with wrong code...")
        try:
            verify_result = await otp_service.verify_otp(
                identifier=test_email,
                otp_code="999999",
                identifier_type="email"
            )
            print(f"   Result: {'✅ Success' if verify_result.get('success') else '❌ Failed'}")
            print(f"   Message: {verify_result.get('message', 'N/A')}")
        except Exception as e:
            print(f"   ❌ Verification failed: {e}")
        
        # 5. Test with non-existent email
        print(f"\n5. Testing with non-existent email...")
        try:
            verify_result = await otp_service.verify_otp(
                identifier="nonexistent@example.com",
                otp_code="123456",
                identifier_type="email"
            )
            print(f"   Result: {'✅ Success' if verify_result.get('success') else '❌ Failed'}")
            print(f"   Message: {verify_result.get('message', 'N/A')}")
        except Exception as e:
            print(f"   ❌ Verification failed: {e}")
        
        # 6. Clean up test data
        print(f"\n6. Cleaning up test data...")
        cleanup_result = await otp_service.otp_collection.delete_many({
            "identifier": test_email.lower()
        })
        print(f"   Deleted {cleanup_result.deleted_count} test OTP(s)")
        
        print(f"\n{'='*70}")
        print("DEBUGGING COMPLETE")
        print("="*70)
        
    except Exception as e:
        print(f"❌ Debug failed: {e}")
        import traceback
        traceback.print_exc()

def debug_user_otp(email: str, otp_code: str = None):
    """Debug specific user OTP"""
    async def debug_specific():
        print("=" * 70)
        print(f"DEBUGGING OTP FOR: {email}")
        print("=" * 70)
        
        try:
            db = await get_database()
            if not db:
                print("❌ Failed to connect to database")
                return
            
            otp_service = OTPService(db)
            
            # Check existing OTPs for this user
            print(f"\n📋 Checking OTPs for {email}...")
            existing_otps = await otp_service.otp_collection.find({
                "identifier": email.lower()
            }).to_list(length=10)
            
            if existing_otps:
                print(f"Found {len(existing_otps)} OTP(s):")
                for i, otp in enumerate(existing_otps, 1):
                    status = "✅ Active" if not otp.get("verified", False) else "❌ Used"
                    expired = "⏰ Expired" if datetime.utcnow() > otp.get("expires_at", datetime.utcnow()) else "⏱️ Valid"
                    print(f"{i}. Code: {otp.get('otp_code')} | {status} | {expired}")
                    print(f"   Created: {otp.get('created_at')}")
                    print(f"   Expires: {otp.get('expires_at')}")
                    print(f"   Attempts: {otp.get('attempts', 0)}/{otp.get('max_attempts', 5)}")
                    
                # If OTP code provided, test verification
                if otp_code:
                    print(f"\n🔍 Testing verification with code: {otp_code}")
                    verify_result = await otp_service.verify_otp(
                        identifier=email,
                        otp_code=otp_code,
                        identifier_type="email"
                    )
                    print(f"Result: {'✅ Success' if verify_result.get('success') else '❌ Failed'}")
                    print(f"Message: {verify_result.get('message')}")
            else:
                print("❌ No OTPs found for this email")
                print("💡 User needs to request an OTP first")
                
        except Exception as e:
            print(f"❌ Debug failed: {e}")
            import traceback
            traceback.print_exc()
    
    asyncio.run(debug_specific())

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Debug OTP Service')
    parser.add_argument('--email', help='Email to debug')
    parser.add_argument('--otp', help='OTP code to test')
    parser.add_argument('--full', action='store_true', help='Run full debug test')
    
    args = parser.parse_args()
    
    if args.full:
        asyncio.run(debug_otp_service())
    elif args.email:
        debug_user_otp(args.email, args.otp)
    else:
        print("Usage:")
        print("  python debug_otp.py --full                    # Run full debug")
        print("  python debug_otp.py --email user@example.com  # Debug specific email")
        print("  python debug_otp.py --email user@example.com --otp 123456  # Test specific OTP")