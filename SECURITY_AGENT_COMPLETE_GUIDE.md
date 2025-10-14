# Data & Security Agent - Complete Setup Guide

## 🎯 Overview

This guide walks you through setting up and using the **Data & Security Agent** with OTP authentication and encrypted health report download.

## 📋 Complete Feature List

### Backend Features
1. ✅ **OTP Generation & Verification**
   - Email/Phone based OTP
   - Configurable expiration (default: 10 minutes)
   - Maximum attempt limits (5 attempts)
   - Automatic cleanup of expired OTPs

2. ✅ **Fernet Encryption**
   - User-specific key derivation (PBKDF2HMAC)
   - 100,000 iterations for security
   - SHA-256 hashing algorithm

3. ✅ **Data Aggregation**
   - Diet agent data (meals, summaries, goals)
   - Fitness agent data (workouts, plans, logs)
   - Mental health data (mood, stress, mindfulness)

4. ✅ **Secure Report Generation**
   - OTP-verified report access
   - Multiple report types
   - Custom date ranges
   - Automatic encryption

5. ✅ **Decryption Methods**
   - Token-based (recommended)
   - User ID-based
   - Secure key management

### Frontend Features
1. ✅ **Modern UI/UX**
   - Step-by-step wizard
   - Progress tracking
   - Responsive design
   - Icon-based navigation

2. ✅ **OTP Workflow**
   - Email/Phone selection
   - OTP display (demo mode)
   - Real-time verification

3. ✅ **Report Request**
   - Report type selector
   - Date range picker
   - Visual feedback

4. ✅ **Data Decryption**
   - Encrypted data preview
   - Credential management
   - Copy to clipboard
   - JSON download

## 🚀 Quick Start

### Step 1: Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies (including cryptography)
pip install -r requirements.txt

# Verify .env configuration
# Check ENCRYPTION_MASTER_KEY and ENCRYPTION_SALT are set

# Start backend
uvicorn main:app --reload --port 8000
```

### Step 2: Frontend Setup

```bash
# Navigate to security agent frontend
cd aiservices/securityagentfrontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Step 3: Access the Application

Open your browser and navigate to:
- Frontend: `http://localhost:5004`
- API Docs: `http://localhost:8000/docs`

## 🔧 Configuration

### Backend Environment Variables

Add to `backend/.env`:

```env
# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017
DATABASE_NAME=HealthAgent

# Encryption Configuration
ENCRYPTION_MASTER_KEY=your-strong-master-key-here-change-in-production
ENCRYPTION_SALT=your-salt-here-change-in-production

# JWT Configuration (existing)
JWT_SECRET_KEY=your-secret-key-here-change-in-production
JWT_REFRESH_SECRET_KEY=your-refresh-secret-key-here-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

### Security Best Practices

1. **Master Key**: Use a strong, random key (32+ characters)
2. **Salt**: Use a unique salt value
3. **HTTPS**: Always use HTTPS in production
4. **Key Storage**: Store keys in secure vaults (Azure Key Vault, AWS Secrets Manager)

## 📝 Complete User Flow Example

### Scenario: User wants to download their 30-day health report

#### Step 1: Request OTP (Frontend)

```
1. User opens http://localhost:5004
2. User selects "Email" as contact method
3. User enters: user@example.com
4. User clicks "Send OTP"
5. System displays OTP code: 123456 (demo mode)
```

**Backend API Call**:
```json
POST /api/security/request-otp
{
  "identifier": "user@example.com",
  "identifier_type": "email"
}
```

**Response**:
```json
{
  "success": true,
  "otp_code": "123456",
  "expires_at": "2025-10-12T11:40:00",
  "note": "In production, OTP will be sent to your email"
}
```

#### Step 2: Verify OTP & Request Report

```
1. User enters OTP: 123456
2. User clicks "Verify OTP"
3. User selects "All Health Data"
4. User keeps "Last 30 days" selected
5. User clicks "Get Encrypted Report"
```

**Backend API Calls**:

1. Verify OTP:
```json
POST /api/security/verify-otp
{
  "identifier": "user@example.com",
  "otp_code": "123456",
  "identifier_type": "email"
}
```

2. Get Report:
```json
POST /api/security/secure-report
{
  "identifier": "user@example.com",
  "otp_code": "123456",
  "report_type": "all",
  "days": 30
}
```

**Response**:
```json
{
  "success": true,
  "message": "Report generated and encrypted successfully",
  "encrypted_report": "gAAAAABo6yfU...",
  "user_id": "507f1f77bcf86cd799439011",
  "report_type": "all",
  "decryption_token": "ajVFdWlveDk0WEpGbW84Uk9halFSTV...",
  "instructions": {
    "step_1": "Save the 'encrypted_report' value",
    "step_2": "To decrypt, use /decrypt endpoint with your user_id",
    "step_3": "Or use /decrypt-with-token endpoint with the decryption_token"
  }
}
```

#### Step 3: Decrypt Report

```
1. System displays encrypted report (first 100 chars)
2. System shows decryption token and user ID
3. User selects "Use Decryption Token" (recommended)
4. User clicks "Decrypt Report"
5. System displays decrypted health data
6. User clicks "Download as JSON"
```

**Backend API Call**:
```json
POST /api/security/decrypt-with-token
{
  "encrypted_data": "gAAAAABo6yfU...",
  "decryption_token": "ajVFdWlveDk0WEpGbW84Uk9halFSTV..."
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user_id": "507f1f77bcf86cd799439011",
    "generated_at": "2025-10-12T10:30:00",
    "period_days": 30,
    "diet_agent": {
      "total_meals_analyzed": 45,
      "meal_analyses": [...],
      "daily_summaries": [...]
    },
    "fitness_agent": {
      "total_workouts": 20,
      "workout_logs": [...]
    },
    "mental_health_agent": {
      "total_mood_entries": 30,
      "mood_logs": [...]
    }
  }
}
```

## 🔐 Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Request Flow                        │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
    ┌─────────────────────────────────────────┐
    │  Step 1: Request OTP                    │
    │  - User enters email/phone              │
    │  - System generates 6-digit OTP         │
    │  - Stores in MongoDB with expiration    │
    └─────────────────────────────────────────┘
                          │
                          ▼
    ┌─────────────────────────────────────────┐
    │  Step 2: Verify OTP                     │
    │  - User submits OTP code                │
    │  - System validates against DB          │
    │  - Checks expiration & attempts         │
    └─────────────────────────────────────────┘
                          │
                          ▼
    ┌─────────────────────────────────────────┐
    │  Step 3: Generate Report                │
    │  - Fetch data from Diet Agent           │
    │  - Fetch data from Fitness Agent        │
    │  - Fetch data from Mental Health Agent  │
    │  - Aggregate all data                   │
    └─────────────────────────────────────────┘
                          │
                          ▼
    ┌─────────────────────────────────────────┐
    │  Step 4: Encrypt Report                 │
    │  - Derive user-specific key (PBKDF2)    │
    │  - Encrypt with Fernet                  │
    │  - Generate decryption token            │
    └─────────────────────────────────────────┘
                          │
                          ▼
    ┌─────────────────────────────────────────┐
    │  Step 5: User Decrypts                  │
    │  - User provides encrypted data         │
    │  - User provides token or user_id       │
    │  - System derives same key              │
    │  - Decrypts and returns data            │
    └─────────────────────────────────────────┘
```

## 🧪 Testing Guide

### Test Case 1: Complete Flow

```bash
# 1. Start backend
cd backend
uvicorn main:app --reload --port 8000

# 2. Start frontend
cd aiservices/securityagentfrontend
npm run dev

# 3. Open browser
# Navigate to http://localhost:5004

# 4. Follow UI prompts
```

### Test Case 2: API Only (using curl or Postman)

```bash
# 1. Request OTP
curl -X POST http://localhost:8000/api/security/request-otp \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "test@example.com",
    "identifier_type": "email"
  }'

# 2. Verify OTP (use OTP from step 1 response)
curl -X POST http://localhost:8000/api/security/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "test@example.com",
    "otp_code": "123456",
    "identifier_type": "email"
  }'

# 3. Get Secure Report
curl -X POST http://localhost:8000/api/security/secure-report \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "test@example.com",
    "otp_code": "123456",
    "report_type": "all",
    "days": 30
  }'

# 4. Decrypt Report (use token from step 3)
curl -X POST http://localhost:8000/api/security/decrypt-with-token \
  -H "Content-Type: application/json" \
  -d '{
    "encrypted_data": "gAAAAABo...",
    "decryption_token": "ajVFdWlve..."
  }'
```

### Test Case 3: Python Script

```python
import requests

BASE_URL = "http://localhost:8000/api/security"

# Step 1: Request OTP
response = requests.post(f"{BASE_URL}/request-otp", json={
    "identifier": "test@example.com",
    "identifier_type": "email"
})
otp_data = response.json()
print(f"OTP Code: {otp_data['otp_code']}")

# Step 2: Get Secure Report
response = requests.post(f"{BASE_URL}/secure-report", json={
    "identifier": "test@example.com",
    "otp_code": otp_data['otp_code'],
    "report_type": "all",
    "days": 30
})
report_data = response.json()

# Step 3: Decrypt
response = requests.post(f"{BASE_URL}/decrypt-with-token", json={
    "encrypted_data": report_data['encrypted_report'],
    "decryption_token": report_data['decryption_token']
})
decrypted = response.json()
print("Decrypted Data:", decrypted['data'])
```

## 📊 Database Collections

The security agent uses these MongoDB collections:

### `otp_codes`
```json
{
  "_id": ObjectId("..."),
  "identifier": "user@example.com",
  "identifier_type": "email",
  "otp_code": "123456",
  "created_at": ISODate("2025-10-12T10:30:00Z"),
  "expires_at": ISODate("2025-10-12T10:40:00Z"),
  "verified": false,
  "attempts": 0,
  "max_attempts": 5
}
```

### Data Collections (read-only)
- `diet_user_profiles`
- `diet_meal_analyses`
- `diet_daily_summaries`
- `diet_nutrition_goals`
- `fitness_profiles`
- `fitness_workout_plans`
- `fitness_workout_logs`
- `mental_health_profiles`
- `mental_health_mood_logs`
- `mental_health_stress_assessments`

## 🎓 Best Practices

### For Users
1. **Save your encrypted report** - Store it securely
2. **Keep your decryption token safe** - It's like a password
3. **Use token-based decryption** - More secure than user ID
4. **Download reports regularly** - For backup purposes

### For Developers
1. **Never log sensitive data** - Mask passwords, keys, tokens
2. **Use environment variables** - For all secrets
3. **Implement rate limiting** - Prevent brute force attacks
4. **Add audit logging** - Track all security events
5. **Regular security updates** - Keep dependencies updated

## 🐛 Troubleshooting

### Frontend Issues

**Problem**: White screen / blank page
```bash
# Solution
cd aiservices/securityagentfrontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**Problem**: API connection error
```bash
# Check if backend is running
curl http://localhost:8000/api/security/health
```

### Backend Issues

**Problem**: ImportError: cannot import name 'PBKDF2'
```bash
# Solution: Already fixed - use PBKDF2HMAC
pip install --upgrade cryptography
```

**Problem**: MongoDB connection error
```bash
# Check MongoDB is running
mongosh "mongodb://localhost:27017"
```

**Problem**: OTP not being created
```bash
# Check database permissions
# Ensure users exist in database
```

## 📚 Additional Resources

- [Cryptography Documentation](https://cryptography.io/)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [React Best Practices](https://react.dev/)
- [MongoDB Security](https://www.mongodb.com/docs/manual/security/)

## 🎉 Success Indicators

You'll know everything is working when:

✅ Frontend loads at http://localhost:5004  
✅ Backend health check returns 200: http://localhost:8000/api/security/health  
✅ OTP can be requested and verified  
✅ Encrypted reports are generated  
✅ Decryption works with both methods  
✅ Downloaded JSON contains health data  

## 📞 Support

If you encounter issues:

1. Check this guide first
2. Review the API docs at `/docs`
3. Check backend logs for errors
4. Review browser console for frontend errors
5. Verify all environment variables are set

---

**Version**: 1.0.0  
**Created**: October 12, 2025  
**Author**: Health Agent Development Team
