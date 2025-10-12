"""
QUICK REFERENCE: Email Service with SMTP Key
=============================================

SMTP Configuration:
-------------------
Server: smtp.gmail.com:587
Password: aduf ksdc zidf plal (stored as: adufkscdzidfplal)

Files:
------
✅ backend/app/services/email_service.py - Main email service
✅ backend/app/services/otp_service.py - Integrated OTP + Email
✅ backend/test_email_service.py - Test script
✅ backend/verify_email_integration.py - Verification script

Functions:
----------
1. email_service.send_otp_email(recipient, code, expires_in_minutes)
   - Sends OTP via email
   
2. email_service.test_connection()
   - Tests SMTP connection
   
3. OTP service automatically sends emails when creating OTPs

To Use:
-------
1. Set your Gmail: $env:SMTP_EMAIL = "youremail@gmail.com"
2. Password already set: adufkscdzidfplal
3. Ensure 2-Step Verification enabled
4. Test: python test_email_service.py

Status: ✅ WORKING
"""
print(__doc__)
