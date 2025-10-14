#!/usr/bin/env python3
"""
Test Real vs Mock Data - Comprehensive verification
"""

import asyncio
import requests
import json
from datetime import datetime

async def test_real_data_report():
    print("🧪 TESTING REAL DATA IN FINAL REPORT")
    print("=" * 60)
    
    backend_url = "http://127.0.0.1:8000"
    
    # Test with your actual email
    test_email = "nethmijasinarachchi@gmail.com"
    
    try:
        print(f"📧 Testing with email: {test_email}")
        print("🔄 Simulating three-step OTP workflow...\n")
        
        # Step 1: Email Verification OTP
        print("📨 Step 1: Requesting Email Verification OTP")
        response = requests.post(f"{backend_url}/api/security/three-step/request-email-verification", 
                               json={"identifier": test_email})
        
        if response.status_code == 200:
            print("✅ Email OTP requested successfully")
            
            # Step 2: Download Access OTP  
            print("📥 Step 2: Requesting Download Access OTP")
            response = requests.post(f"{backend_url}/api/security/three-step/request-download-access",
                                   json={"identifier": test_email})
            
            if response.status_code == 200:
                print("✅ Download OTP requested successfully")
                
                # Step 3: Decrypt Access OTP
                print("🔐 Step 3: Requesting Decrypt Access OTP")
                response = requests.post(f"{backend_url}/api/security/three-step/request-decrypt-access",
                                       json={"identifier": test_email})
                
                if response.status_code == 200:
                    print("✅ Decrypt OTP requested successfully")
                    
                    print("\n🔍 ANALYZING REAL DATA INTEGRATION:")
                    print("=" * 60)
                    
                    # Direct test of real health data service
                    print("🏥 Testing Real Health Data Service directly...")
                    
                    # Create test to verify real data service
                    test_code = '''
import sys
sys.path.append(".")
from app.core.database import connect_to_mongo, get_database
from app.services.real_health_data_service import RealHealthDataService
import asyncio

async def test_service():
    await connect_to_mongo()
    db = get_database()
    service = RealHealthDataService(db)
    report = await service.get_user_health_report("nethmijasinarachchi@gmail.com")
    
    print("📊 REAL DATA REPORT ANALYSIS:")
    print("=" * 50)
    print(f"Report ID: {report.get('report_id')}")
    print(f"Data Source: {report.get('data_source')}")
    print(f"User ID: {report.get('user_id', 'Not found')}")
    print(f"Generated At: {report.get('generated_at')}")
    
    diet_data = report.get('report_content', {}).get('diet_data', {})
    fitness_data = report.get('report_content', {}).get('fitness_data', {})
    mental_data = report.get('report_content', {}).get('mental_health_data', {})
    
    print("\\n🍎 DIET DATA:")
    for key, value in diet_data.items():
        print(f"   {key}: {value}")
        
    print("\\n💪 FITNESS DATA:")
    for key, value in fitness_data.items():
        print(f"   {key}: {value}")
        
    print("\\n🧠 MENTAL HEALTH DATA:")
    for key, value in mental_data.items():
        print(f"   {key}: {value}")
    
    print("\\n💡 RECOMMENDATIONS:")
    for i, rec in enumerate(report.get('recommendations', []), 1):
        print(f"   {i}. {rec}")
    
    # Determine if data is real
    print("\\n🎯 DATA AUTHENTICITY ANALYSIS:")
    print("=" * 50)
    
    data_source = report.get('data_source')
    if data_source == 'REAL_DATABASE_COLLECTIONS':
        print("✅ SUCCESS: Report contains REAL health data from cloud database!")
        print("🏥 Data includes actual user records, not mock data")
    elif data_source == 'DEMO_DATA_USER_NOT_FOUND':
        print("📝 INFO: User not found in database - showing demo structure")  
        print("💡 Real data integration working, but no data for this user")
    else:
        print("❌ WARNING: Still using mock/fallback data")
    
    return report

if __name__ == "__main__":
    asyncio.run(test_service())
'''
                    
                    # Write and execute test
                    with open("test_data_service.py", "w") as f:
                        f.write(test_code)
                    
                    import subprocess
                    result = subprocess.run(["python", "test_data_service.py"], 
                                          capture_output=True, text=True, cwd=".")
                    
                    print(result.stdout)
                    if result.stderr:
                        print("Errors:", result.stderr)
                        
                    # Clean up
                    import os
                    if os.path.exists("test_data_service.py"):
                        os.remove("test_data_service.py")
                    
                else:
                    print(f"❌ Decrypt OTP request failed: {response.status_code}")
                    print(f"Response: {response.text}")
            else:
                print(f"❌ Download OTP request failed: {response.status_code}")
        else:
            print(f"❌ Email OTP request failed: {response.status_code}")
            print(f"Response: {response.text}")
            
        print(f"\n🎯 FINAL VERIFICATION STEPS:")
        print("=" * 60)
        print("1. 🌐 Open: http://127.0.0.1:5006/")
        print("2. 📧 Enter email: nethmijasinarachchi@gmail.com")
        print("3. 🔐 Complete OTP workflow with codes from email")
        print("4. 📊 Check final report for data source indicator")
        print("5. ✅ Verify: 'Real Health Data from Cloud Database' appears")
        
    except Exception as e:
        print(f"❌ Test error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_real_data_report())