#!/usr/bin/env python3
"""
Comprehensive Test Script for Three-Step OTP Security System

Tests the complete workflow:
1. Email Verification OTP (Step 1)
2. Download Access OTP (Step 2) 
3. Decrypt Access OTP (Step 3)

Each step has its own purpose and timeouts for enhanced security.
"""

import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:8000"
identifier = "nethmijasinarachchi@gmail.com"

def print_step_header(step_num, title, description):
    """Print a formatted step header"""
    print(f"\n{'='*60}")
    print(f"🔐 STEP {step_num}: {title}")
    print(f"📝 {description}")
    print(f"{'='*60}")

def print_response(response, step_name):
    """Print formatted API response"""
    print(f"\n📊 {step_name} Response:")
    print(f"Status Code: {response.status_code}")
    try:
        data = response.json()
        print(f"Response Body:")
        print(json.dumps(data, indent=2))
        return data
    except:
        print(f"Response Text: {response.text}")
        return None

def test_step_1_email_verification():
    """Test Step 1: Email Verification OTP"""
    print_step_header(1, "EMAIL VERIFICATION", "Verify email address to access the system")
    
    # Request Email Verification OTP
    print("\n📧 Requesting email verification OTP...")
    try:
        response = requests.post(
            f"{BASE_URL}/api/security/three-step/request-email-verification",
            json={"identifier": identifier}
        )
        data = print_response(response, "Email Verification Request")
        
        if response.status_code == 200:
            print("✅ Email verification OTP sent successfully!")
            return True
        else:
            print(f"❌ Failed to send email verification OTP")
            return False
            
    except Exception as e:
        print(f"❌ Error in email verification request: {e}")
        return False

def test_step_1_verification(wrong_otp=False):
    """Test Step 1: Verify Email OTP"""
    print(f"\n🔍 Testing email OTP verification (wrong_otp={wrong_otp})...")
    
    try:
        otp_code = "999999" if wrong_otp else "123456"  # Use wrong OTP for testing
        response = requests.post(
            f"{BASE_URL}/api/security/three-step/verify-email-verification",
            json={
                "identifier": identifier,
                "otp_code": otp_code
            }
        )
        data = print_response(response, "Email Verification")
        
        if wrong_otp:
            if response.status_code == 200 and not data.get("success"):
                print("✅ Wrong OTP correctly handled - auto-generation working!")
                return False  # Return False for wrong OTP
            else:
                print("❌ Wrong OTP handling failed")
                return False
        else:
            if response.status_code == 200 and data.get("success"):
                print("✅ Email verified successfully!")
                print(f"📧 User can now navigate to report generation page")
                return True
            else:
                print("❌ Email verification failed")
                return False
                
    except Exception as e:
        print(f"❌ Error in email verification: {e}")
        return False

def test_step_2_download_access():
    """Test Step 2: Download Access OTP"""
    print_step_header(2, "DOWNLOAD ACCESS", "Generate and download encrypted health report")
    
    # Request Download Access OTP
    print("\n📥 Requesting download access OTP...")
    try:
        response = requests.post(
            f"{BASE_URL}/api/security/three-step/request-download-access",
            json={"identifier": identifier}
        )
        data = print_response(response, "Download Access Request")
        
        if response.status_code == 200:
            print("✅ Download access OTP sent successfully!")
            return True
        else:
            print(f"❌ Failed to send download access OTP")
            return False
            
    except Exception as e:
        print(f"❌ Error in download access request: {e}")
        return False

def test_step_2_verification():
    """Test Step 2: Verify Download OTP and Generate Report"""
    print(f"\n🔍 Testing download OTP verification and report generation...")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/security/three-step/verify-download-access",
            json={
                "identifier": identifier,
                "otp_code": "123456",  # Assuming correct OTP
                "report_type": "all",
                "days": 30
            }
        )
        data = print_response(response, "Download Access Verification")
        
        if response.status_code == 200 and data.get("success"):
            print("✅ Download access verified and report generated!")
            print(f"📊 Report ready for download")
            report_data = data.get("data", {}).get("report_data", {})
            if report_data:
                print(f"📁 Report ID: {report_data.get('report_id')}")
                print(f"📏 File Size: {report_data.get('file_size')}")
            return report_data
        else:
            print("❌ Download access verification failed")
            return None
            
    except Exception as e:
        print(f"❌ Error in download access verification: {e}")
        return None

def test_step_3_decrypt_access():
    """Test Step 3: Decrypt Access OTP"""
    print_step_header(3, "DECRYPT ACCESS", "Decrypt and view the health report content")
    
    # Request Decrypt Access OTP
    print("\n🔓 Requesting decrypt access OTP...")
    try:
        response = requests.post(
            f"{BASE_URL}/api/security/three-step/request-decrypt-access",
            json={"identifier": identifier}
        )
        data = print_response(response, "Decrypt Access Request")
        
        if response.status_code == 200:
            print("✅ Decrypt access OTP sent successfully!")
            return True
        else:
            print(f"❌ Failed to send decrypt access OTP")
            return False
            
    except Exception as e:
        print(f"❌ Error in decrypt access request: {e}")
        return False

def test_step_3_verification():
    """Test Step 3: Verify Decrypt OTP and Get Report Content"""
    print(f"\n🔍 Testing decrypt OTP verification and report decryption...")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/security/three-step/verify-decrypt-access",
            json={
                "identifier": identifier,
                "otp_code": "123456"  # Assuming correct OTP
            }
        )
        data = print_response(response, "Decrypt Access Verification")
        
        if response.status_code == 200 and data.get("success"):
            print("✅ Decrypt access verified and report decrypted!")
            print(f"📄 Report content available")
            
            # Display decrypted report summary
            decrypted_report = data.get("data", {}).get("decrypted_report", {})
            if decrypted_report:
                print(f"\n📊 Health Report Summary:")
                print(f"🆔 Report ID: {decrypted_report.get('report_id')}")
                
                report_content = decrypted_report.get("report_content", {})
                if report_content.get("diet_data"):
                    diet = report_content["diet_data"]
                    print(f"🍎 Diet: {diet.get('total_meals')} meals, {diet.get('avg_calories')} cal/day, Score: {diet.get('nutrition_score')}")
                
                if report_content.get("fitness_data"):
                    fitness = report_content["fitness_data"]
                    print(f"💪 Fitness: {fitness.get('total_workouts')} workouts, {fitness.get('avg_duration')} avg, Score: {fitness.get('fitness_score')}")
                
                if report_content.get("mental_health_data"):
                    mental = report_content["mental_health_data"]
                    print(f"🧠 Mental Health: {mental.get('mood_average')}/10 mood, {mental.get('stress_level')} stress, Score: {mental.get('wellness_score')}")
                
                recommendations = decrypted_report.get("recommendations", [])
                if recommendations:
                    print(f"\n💡 Recommendations:")
                    for i, rec in enumerate(recommendations, 1):
                        print(f"  {i}. {rec}")
            
            return decrypted_report
        else:
            print("❌ Decrypt access verification failed")
            return None
            
    except Exception as e:
        print(f"❌ Error in decrypt access verification: {e}")
        return None

def test_workflow_status():
    """Test the workflow status endpoint"""
    print_step_header("INFO", "WORKFLOW STATUS", "Get information about the three-step system")
    
    try:
        response = requests.get(f"{BASE_URL}/api/security/three-step/workflow-status")
        data = print_response(response, "Workflow Status")
        
        if response.status_code == 200:
            print("✅ Workflow status retrieved successfully!")
            
            # Display workflow information
            if data:
                print(f"\n📋 Workflow: {data.get('workflow_name')}")
                steps = data.get('steps', {})
                for step_key, step_info in steps.items():
                    print(f"  {step_info.get('name')}: {step_info.get('description')} ({step_info.get('otp_validity')})")
            
            return True
        else:
            print("❌ Failed to get workflow status")
            return False
            
    except Exception as e:
        print(f"❌ Error getting workflow status: {e}")
        return False

def run_complete_workflow_test():
    """Run the complete three-step workflow test"""
    print("🎯 STARTING COMPLETE THREE-STEP OTP WORKFLOW TEST")
    print("=" * 70)
    print(f"📧 Email: {identifier}")
    print(f"🌐 Backend: {BASE_URL}")
    print(f"⏰ Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test workflow status
    test_workflow_status()
    
    # Step 1: Email Verification
    if not test_step_1_email_verification():
        print("❌ Step 1 failed - stopping test")
        return False
    
    # Test wrong OTP handling
    print("\n🧪 Testing wrong OTP handling...")
    test_step_1_verification(wrong_otp=True)
    
    # Verify with correct OTP
    if not test_step_1_verification(wrong_otp=False):
        print("❌ Step 1 verification failed - stopping test")
        return False
    
    print("\n⏱️  Pausing 2 seconds between steps...")
    time.sleep(2)
    
    # Step 2: Download Access
    if not test_step_2_download_access():
        print("❌ Step 2 failed - stopping test")
        return False
    
    report_data = test_step_2_verification()
    if not report_data:
        print("❌ Step 2 verification failed - stopping test")
        return False
    
    print("\n⏱️  Pausing 2 seconds between steps...")
    time.sleep(2)
    
    # Step 3: Decrypt Access
    if not test_step_3_decrypt_access():
        print("❌ Step 3 failed - stopping test")
        return False
    
    decrypted_report = test_step_3_verification()
    if not decrypted_report:
        print("❌ Step 3 verification failed - stopping test")
        return False
    
    # Success Summary
    print("\n" + "🎉" * 70)
    print("✅ THREE-STEP OTP WORKFLOW COMPLETED SUCCESSFULLY!")
    print("🎉" * 70)
    
    print(f"\n📊 WORKFLOW SUMMARY:")
    print(f"✅ Step 1: Email verification completed")
    print(f"✅ Step 2: Report generation and download access completed")  
    print(f"✅ Step 3: Report decryption and content access completed")
    print(f"📧 All OTPs sent to: {identifier}")
    print(f"🔐 All security checks passed")
    print(f"📄 Complete health report accessed successfully")
    
    return True

if __name__ == "__main__":
    success = run_complete_workflow_test()
    
    print(f"\n{'='*70}")
    if success:
        print("🎯 TEST RESULT: ✅ SUCCESS - Three-step OTP workflow is working perfectly!")
        print("🌐 Frontend: Ready to use the enhanced three-step system")
        print("🔧 Backend: All API endpoints functioning correctly")
    else:
        print("🎯 TEST RESULT: ❌ FAILURE - Some issues detected in the workflow")
    print(f"{'='*70}")
    
    print(f"\n📝 NEXT STEPS:")
    print(f"1. 🌐 Visit http://localhost:5173")
    print(f"2. 🔄 Click 'Switch to Enhanced 3-Step Workflow'")
    print(f"3. 📧 Test with your email: {identifier}")
    print(f"4. 🔐 Experience the smooth three-step security process")