"""
Simple OTP debugging script with database connection
"""
import asyncio
import sys
import os
from datetime import datetime

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import connect_to_mongo, get_database
from app.services.otp_service import OTPService

async def simple_otp_debug():
    """Simple OTP debugging"""
    print("🔍 OTP DEBUGGING")
    print("=" * 50)
    
    # Connect to database
    print("1. Connecting to database...")
    try:
        connected = await connect_to_mongo()
        if not connected:
            print("❌ Failed to connect to database")
            return
        print("✅ Database connected")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return
    
    # Get database and create OTP service
    try:
        db = await get_database()
        otp_service = OTPService(db)
        print("✅ OTP service initialized")
    except Exception as e:
        print(f"❌ Failed to initialize OTP service: {e}")
        return
    
    # Check current OTPs in the system
    print("\n2. Checking existing OTPs...")
    try:
        # Count total OTPs
        total_otps = await otp_service.otp_collection.count_documents({})
        print(f"   Total OTPs in system: {total_otps}")
        
        # Get recent OTPs (last 10)
        recent_otps = await otp_service.otp_collection.find({}).sort("created_at", -1).limit(10).to_list(length=10)
        
        if recent_otps:
            print("   Recent OTPs:")
            for i, otp in enumerate(recent_otps, 1):
                status = "Active" if not otp.get("verified", False) else "Used"
                expired = "Expired" if datetime.utcnow() > otp.get("expires_at", datetime.utcnow()) else "Valid"
                print(f"   {i}. Email: {otp.get('identifier', 'N/A')}")
                print(f"      Code: {otp.get('otp_code', 'N/A')} | {status} | {expired}")
                print(f"      Created: {otp.get('created_at', 'N/A')}")
        else:
            print("   No OTPs found in system")
    except Exception as e:
        print(f"❌ Failed to check OTPs: {e}")
        return
    
    # Test OTP creation
    print("\n3. Testing OTP creation...")
    test_email = "debug@test.com"
    try:
        result = await otp_service.create_otp(
            identifier=test_email,
            identifier_type="email",
            expires_in_minutes=10
        )
        print(f"✅ OTP created for {test_email}")
        print(f"   Code: {result.get('otp_code', 'Hidden')}")
        print(f"   Email sent: {result.get('email_sent', False)}")
        
        # Get the actual OTP code if it's hidden
        actual_otp = result.get('otp_code')
        if actual_otp == "******":
            otp_doc = await otp_service.otp_collection.find_one({
                "identifier": test_email.lower(),
                "verified": False
            })
            if otp_doc:
                actual_otp = otp_doc['otp_code']
                print(f"   Actual code: {actual_otp}")
        
        # Test verification
        print(f"\n4. Testing OTP verification...")
        verify_result = await otp_service.verify_otp(
            identifier=test_email,
            otp_code=actual_otp,
            identifier_type="email"
        )
        print(f"   Verification result: {'✅ Success' if verify_result.get('success') else '❌ Failed'}")
        if not verify_result.get('success'):
            print(f"   Error message: {verify_result.get('message')}")
        
        # Cleanup
        await otp_service.otp_collection.delete_many({"identifier": test_email.lower()})
        print("✅ Test data cleaned up")
        
    except Exception as e:
        print(f"❌ OTP test failed: {e}")
        import traceback
        traceback.print_exc()
    
    print(f"\n{'='*50}")

# Main execution
if __name__ == "__main__":
    asyncio.run(simple_otp_debug())