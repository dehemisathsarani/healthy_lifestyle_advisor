"""
Test script for email service functionality
"""
import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.email_service import email_service


def test_email_configuration():
    """Test email service configuration"""
    print("=" * 70)
    print("EMAIL SERVICE CONFIGURATION TEST")
    print("=" * 70)
    
    print(f"\n📧 SMTP Server: {email_service.smtp_server}:{email_service.smtp_port}")
    print(f"📨 Sender Email: {email_service.sender_email}")
    print(f"🔑 Password Set: {'Yes' if email_service.sender_password else 'No'}")
    print(f"🔑 Password Length: {len(email_service.sender_password)} characters")
    print(f"🔑 Password (masked): {email_service.sender_password[:4]}...{email_service.sender_password[-4:]}")
    
    print("\n" + "=" * 70)
    print("TESTING SMTP CONNECTION")
    print("=" * 70)
    
    result = email_service.test_connection()
    
    if result:
        print("\n✅ SUCCESS: Email service is configured correctly!")
        print("\n📝 Next steps:")
        print("   1. The SMTP configuration is working")
        print("   2. OTP emails can be sent to users")
        print("   3. Welcome emails can be sent to new users")
    else:
        print("\n❌ FAILED: Email service configuration has issues")
        print("\n🔧 Troubleshooting steps:")
        print("   1. Verify your Gmail address is correct")
        print("   2. Verify your App Password is: aduf ksdc zidf plal (without spaces)")
        print("   3. Make sure 2-Step Verification is enabled in your Google Account")
        print("   4. Generate a new App Password at: https://myaccount.google.com/apppasswords")
        print("   5. Set environment variables:")
        print("      $env:SMTP_EMAIL='your-email@gmail.com'")
        print("      $env:SMTP_PASSWORD='adufkscdzidfplal'")
    
    print("\n" + "=" * 70)
    return result


def test_send_otp():
    """Test sending OTP email"""
    print("\n" + "=" * 70)
    print("TESTING OTP EMAIL SENDING")
    print("=" * 70)
    
    test_email = input("\nEnter email address to send test OTP (or press Enter to skip): ").strip()
    
    if not test_email:
        print("Skipped OTP email test")
        return
    
    test_otp = "123456"
    result = email_service.send_otp_email(test_email, test_otp, expires_in_minutes=10)
    
    if result:
        print(f"\n✅ SUCCESS: OTP email sent to {test_email}")
        print(f"📧 Check your inbox for OTP: {test_otp}")
    else:
        print(f"\n❌ FAILED: Could not send OTP email to {test_email}")


if __name__ == "__main__":
    print("\n🧪 Starting Email Service Tests...\n")
    
    # Test configuration
    config_result = test_email_configuration()
    
    # Test sending OTP (only if configuration is successful)
    if config_result:
        test_send_otp()
    
    print("\n🏁 Testing complete!\n")
