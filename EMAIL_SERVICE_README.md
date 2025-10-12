# Email Service Configuration Guide

## Overview
The Healthy Lifestyle Advisor application now has a fully functional email service for sending OTP codes and notifications to users.

## SMTP Configuration

### Current Setup
- **SMTP Server**: smtp.gmail.com
- **SMTP Port**: 587 (TLS)
- **Default Password**: `aduf ksdc zidf plal` (stored as `adufkscdzidfplal` without spaces)

### Files Modified
1. `backend/app/services/email_service.py` - Email service implementation
2. `backend/app/services/otp_service.py` - Integrated with email service
3. `backend/test_email_service.py` - Test script for email functionality

## How It Works

### Email Service (`email_service.py`)
The email service provides three main functions:

1. **`send_otp_email(recipient_email, otp_code, expires_in_minutes)`**
   - Sends OTP codes to users via email
   - Includes professional HTML email template
   - Shows OTP code clearly with expiration time

2. **`send_welcome_email(recipient_email, username)`**
   - Sends welcome emails to new users
   - Lists features of the application

3. **`test_connection()`**
   - Tests SMTP connection and authentication
   - Useful for troubleshooting

### OTP Service Integration
The OTP service (`otp_service.py`) now:
- Automatically sends OTP codes via email when identifier type is "email"
- Falls back to showing OTP in API response if email fails
- Hides OTP code from API response when email is successfully sent
- Provides clear user feedback about email delivery status

## Configuration

### Method 1: Environment Variables (Recommended for Production)
Set environment variables before starting the application:

```powershell
# PowerShell
$env:SMTP_EMAIL = "your-email@gmail.com"
$env:SMTP_PASSWORD = "adufkscdzidfplal"
```

```bash
# Linux/Mac
export SMTP_EMAIL="your-email@gmail.com"
export SMTP_PASSWORD="adufkscdzidfplal"
```

### Method 2: Default Values (Current Setup)
The service uses default values if environment variables are not set:
- Email: `your-email@gmail.com`
- Password: `adufkscdzidfplal`

## Testing the Email Service

### Test 1: Connection Test
```powershell
cd backend
python test_email_service.py
```

This will:
1. Display current configuration
2. Test SMTP connection
3. Optionally send a test OTP email

### Test 2: API Integration Test
```python
# Send OTP via API
POST http://localhost:8000/api/auth/send-otp
Content-Type: application/json

{
    "identifier": "user@example.com",
    "identifier_type": "email"
}
```

Expected response when email is sent:
```json
{
    "success": true,
    "data": {
        "identifier": "user@example.com",
        "expires_in_minutes": 10,
        "message": "OTP code has been sent to your email: user@example.com",
        "email_sent": true,
        "otp_code": "******"
    }
}
```

## Gmail App Password Setup

### Step-by-Step Instructions

1. **Enable 2-Step Verification**
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification if not already enabled

2. **Generate App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer" (or Other)
   - Click "Generate"
   - Copy the 16-character password (format: `xxxx xxxx xxxx xxxx`)

3. **Use the Password**
   - Remove spaces: `aduf ksdc zidf plal` → `adufkscdzidfplal`
   - Set as `SMTP_PASSWORD` environment variable
   - Or update default in `email_service.py`

## Troubleshooting

### Error: "Username and Password not accepted"
**Cause**: Incorrect email or password, or 2-Step Verification not enabled

**Solutions**:
1. Verify Gmail address is correct
2. Verify App Password is correct (16 characters, no spaces)
3. Ensure 2-Step Verification is enabled
4. Generate a new App Password
5. Try using environment variables instead of defaults

### Error: "Connection timeout"
**Cause**: Firewall or network blocking SMTP port

**Solutions**:
1. Check firewall settings
2. Verify port 587 is open
3. Try port 465 (SSL) instead

### Email Not Received
**Possible Issues**:
1. Check spam/junk folder
2. Verify recipient email address
3. Check Gmail sending limits (500 emails/day for free accounts)
4. Review Gmail account for suspicious activity warnings

## Security Best Practices

1. **Never Commit Credentials**
   - Use environment variables
   - Add `.env` to `.gitignore`
   - Never hardcode passwords in code

2. **Use App Passwords**
   - Never use your actual Gmail password
   - Use Gmail App Passwords specifically

3. **Rotate Passwords**
   - Regenerate App Passwords periodically
   - Revoke unused App Passwords

4. **Monitor Usage**
   - Check Gmail account for unusual activity
   - Monitor email sending logs

## Email Templates

### OTP Email Template
The OTP email includes:
- Professional design with green color scheme
- Large, clear OTP code display
- Expiration time warning
- Security notice

### Welcome Email Template (Future)
Can be customized in `send_welcome_email()` method

## API Response Examples

### Success with Email Sent
```json
{
    "success": true,
    "data": {
        "identifier": "user@example.com",
        "expires_at": "2025-10-12T12:00:00",
        "expires_in_minutes": 10,
        "message": "OTP code has been sent to your email: user@example.com",
        "email_sent": true,
        "otp_code": "******"
    }
}
```

### Fallback (Email Not Sent)
```json
{
    "success": true,
    "data": {
        "identifier": "user@example.com",
        "expires_at": "2025-10-12T12:00:00",
        "expires_in_minutes": 10,
        "note": "OTP code shown here (in production, sent via email/SMS)",
        "email_sent": false,
        "otp_code": "123456"
    }
}
```

## Future Enhancements

1. **SMS Support**
   - Integrate Twilio or similar for SMS OTP
   - Support phone number identifiers

2. **Email Templates**
   - Password reset emails
   - Account verification emails
   - Weekly health reports

3. **Rate Limiting**
   - Prevent email spam
   - Limit OTP requests per user

4. **Email Queue**
   - Use Celery for async email sending
   - Retry failed emails

5. **Multiple Providers**
   - Support SendGrid, AWS SES
   - Fallback to secondary provider

## Conclusion

The email service is now fully configured and integrated with the OTP system. Users will receive professional, well-formatted OTP emails when they request authentication codes. The system gracefully handles failures and provides clear feedback to both developers and users.

---

**Last Updated**: October 12, 2025
**SMTP Key**: aduf ksdc zidf plal (stored as adufkscdzidfplal)
