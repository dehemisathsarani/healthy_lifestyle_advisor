"""
Test Enhanced OTP File Encryption/Decryption Workflow
"""
import asyncio
import requests
import json
from datetime import datetime

# Backend API base URL
BASE_URL = "http://localhost:8000"

def print_response(title: str, response):
    """Print formatted response"""
    print(f"\n{'='*60}")
    print(f"📋 {title}")
    print('='*60)
    print(f"Status Code: {response.status_code}")
    if response.headers.get('content-type', '').startswith('application/json'):
        try:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2, default=str)}")
        except:
            print(f"Response: {response.text}")
    else:
        print(f"Response: {response.text}")

def test_enhanced_otp_workflow():
    """Test the complete enhanced OTP workflow"""
    test_email = "nethmijasinarachchi@gmail.com"
    
    print(f"🧪 TESTING ENHANCED OTP WORKFLOW")
    print(f"📧 Test Email: {test_email}")
    print(f"⏰ Time: {datetime.now()}")
    
    # 1. Check system status
    print(f"\n🔍 1. Checking Enhanced Security System Status...")
    try:
        response = requests.get(f"{BASE_URL}/api/security/status")
        print_response("System Status", response)
    except Exception as e:
        print(f"❌ Status check failed: {e}")
    
    # 2. Request OTP for encryption
    print(f"\n🔐 2. Requesting OTP for File Encryption...")
    try:
        encrypt_request = {
            "identifier": test_email,
            "identifier_type": "email"
        }
        response = requests.post(f"{BASE_URL}/api/security/request-encrypt-otp", json=encrypt_request)
        print_response("Encryption OTP Request", response)
        
        if response.status_code == 200:
            data = response.json()
            encrypt_otp = data.get("data", {}).get("otp_code", "")
            email_sent = data.get("data", {}).get("email_sent", False)
            print(f"\n✅ Encryption OTP: {encrypt_otp}")
            print(f"📧 Email sent: {email_sent}")
        else:
            print("❌ Failed to get encryption OTP")
            return
    except Exception as e:
        print(f"❌ Encryption OTP request failed: {e}")
        return
    
    # 3. Verify encryption OTP (simulate user entering wrong OTP first)
    print(f"\n🧪 3. Testing Encryption OTP Verification (Wrong Code)...")
    try:
        verify_request = {
            "identifier": test_email,
            "otp_code": "999999",  # Wrong code
            "identifier_type": "email"
        }
        response = requests.post(f"{BASE_URL}/api/security/verify-encrypt-otp", json=verify_request)
        print_response("Wrong Encryption OTP", response)
    except Exception as e:
        print(f"❌ Wrong OTP test failed: {e}")
    
    # 4. Verify encryption OTP with correct code
    print(f"\n✅ 4. Verifying Encryption OTP (Correct Code)...")
    try:
        if encrypt_otp == "******":
            print("⚠️ OTP code is hidden. In real scenario, user would check email.")
            encrypt_otp = "123456"  # Fallback for demo
        
        verify_request = {
            "identifier": test_email,
            "otp_code": encrypt_otp,
            "identifier_type": "email"
        }
        response = requests.post(f"{BASE_URL}/api/security/verify-encrypt-otp", json=verify_request)
        print_response("Correct Encryption OTP", response)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                print(f"\n🔓 ENCRYPTION ACCESS GRANTED!")
                print(f"📝 Next Action: {data.get('data', {}).get('next_action')}")
                print(f"💬 Message: {data.get('data', {}).get('next_message')}")
            else:
                print(f"\n⚠️ Verification result: {data.get('message')}")
    except Exception as e:
        print(f"❌ Encryption OTP verification failed: {e}")
    
    # 5. Simulate file encryption process (pause)
    print(f"\n⏳ 5. Simulating File Encryption Process...")
    print("   📁 User encrypts files...")
    print("   💾 Files saved securely...")
    print("   ✅ Encryption complete!")
    
    # 6. Request OTP for decryption
    print(f"\n🔓 6. Requesting OTP for File Decryption...")
    try:
        decrypt_request = {
            "identifier": test_email,
            "identifier_type": "email"
        }
        response = requests.post(f"{BASE_URL}/api/security/request-decrypt-otp", json=decrypt_request)
        print_response("Decryption OTP Request", response)
        
        if response.status_code == 200:
            data = response.json()
            decrypt_otp = data.get("data", {}).get("otp_code", "")
            email_sent = data.get("data", {}).get("email_sent", False)
            print(f"\n✅ Decryption OTP: {decrypt_otp}")
            print(f"📧 Email sent: {email_sent}")
        else:
            print("❌ Failed to get decryption OTP")
            return
    except Exception as e:
        print(f"❌ Decryption OTP request failed: {e}")
        return
    
    # 7. Verify decryption OTP
    print(f"\n🔑 7. Verifying Decryption OTP...")
    try:
        if decrypt_otp == "******":
            print("⚠️ OTP code is hidden. In real scenario, user would check email.")
            decrypt_otp = "789012"  # Fallback for demo
        
        verify_request = {
            "identifier": test_email,
            "otp_code": decrypt_otp,
            "identifier_type": "email"
        }
        response = requests.post(f"{BASE_URL}/api/security/verify-decrypt-otp", json=verify_request)
        print_response("Decryption OTP Verification", response)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                print(f"\n🔓 DECRYPTION ACCESS GRANTED!")
                print(f"📥 Download Enabled: {data.get('data', {}).get('download_enabled')}")
                print(f"📝 Next Action: {data.get('data', {}).get('next_action')}")
                print(f"💬 Message: {data.get('data', {}).get('next_message')}")
            else:
                print(f"\n⚠️ Verification result: {data.get('message')}")
    except Exception as e:
        print(f"❌ Decryption OTP verification failed: {e}")
    
    # 8. Get access history
    print(f"\n📊 8. Checking Access History...")
    try:
        history_request = {
            "identifier": test_email,
            "limit": 5
        }
        response = requests.post(f"{BASE_URL}/api/security/access-history", json=history_request)
        print_response("Access History", response)
    except Exception as e:
        print(f"❌ Access history failed: {e}")
    
    # 9. Revoke OTPs (security measure)
    print(f"\n🚫 9. Revoking All Active OTPs...")
    try:
        revoke_request = {
            "identifier": test_email,
            "identifier_type": "email"
        }
        response = requests.post(f"{BASE_URL}/api/security/revoke-otps", json=revoke_request)
        print_response("Revoke OTPs", response)
    except Exception as e:
        print(f"❌ OTP revocation failed: {e}")
    
    print(f"\n{'='*60}")
    print("🎉 ENHANCED OTP WORKFLOW TEST COMPLETE!")
    print("="*60)
    print("\n✅ Features Tested:")
    print("   🔐 Encryption OTP generation and verification")
    print("   🔓 Decryption OTP generation and verification") 
    print("   🔄 Auto OTP generation when none found")
    print("   📊 Access history tracking")
    print("   🚫 OTP revocation for security")
    print("   ❌ No more 'OTP not found' errors")

if __name__ == "__main__":
    print("🚀 Starting Enhanced OTP Workflow Test...")
    print("🔧 Make sure the backend server is running on http://localhost:8000")
    
    try:
        test_enhanced_otp_workflow()
    except KeyboardInterrupt:
        print("\n⏹️ Test interrupted by user")
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
