# Data and Security Agent Documentation

## Overview

The **Data and Security Agent** is a comprehensive security module that provides encryption/decryption capabilities for sensitive health data and aggregates data from multiple health agents (Diet, Fitness, and Mental Health). This agent ensures that users can securely download their health reports in encrypted form and decrypt them using secure methods.

## Features

### 1. **Data Encryption & Decryption**
- Uses **Fernet symmetric encryption** from the `cryptography` library
- User-specific key derivation using PBKDF2
- Secure encryption of any health data
- Two decryption methods:
  - User ID-based decryption
  - Token-based decryption

### 2. **Multi-Agent Data Aggregation**
- Fetches data from Diet Agent collections
- Fetches data from Fitness Agent collections
- Fetches data from Mental Health Agent collections
- Generates comprehensive health reports

### 3. **Secure Health Report Downloads**
- Download encrypted health reports
- Generate decryption tokens for secure access
- Support for different report types (diet, fitness, mental_health, all)
- Historical data retrieval (1-365 days)

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│           Data and Security Agent                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────┐      ┌─────────────────────┐    │
│  │ Security Service │      │ Data Aggregation    │    │
│  │                  │      │ Service             │    │
│  │ • Encrypt Data   │      │                     │    │
│  │ • Decrypt Data   │      │ • Diet Data         │    │
│  │ • Generate Token │      │ • Fitness Data      │    │
│  │ • Key Derivation │      │ • Mental Health Data│    │
│  └──────────────────┘      └─────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │   MongoDB Database    │
              │   (HealthAgent)       │
              ├───────────────────────┤
              │ • diet_user_profiles  │
              │ • diet_meal_analyses  │
              │ • fitness_profiles    │
              │ • fitness_workout_logs│
              │ • mental_health_...   │
              └───────────────────────┘
```

## MongoDB Collections Used

The agent fetches data from the following collections:

### Diet Agent Collections
- `diet_user_profiles` - User dietary profiles
- `diet_meal_analyses` - Meal analysis history
- `diet_daily_summaries` - Daily nutrition summaries
- `diet_nutrition_goals` - User nutrition goals

### Fitness Agent Collections
- `fitness_profiles` - User fitness profiles
- `fitness_workout_plans` - Workout plans
- `fitness_workout_logs` - Workout history
- `fitness_goals` - User fitness goals

### Mental Health Agent Collections
- `mental_health_profiles` - User mental health profiles
- `mental_health_mood_logs` - Mood tracking logs
- `mental_health_stress_assessments` - Stress assessments
- `mental_health_mindfulness_sessions` - Meditation/mindfulness sessions

## API Endpoints

### 1. Encrypt Data
**POST** `/api/security/encrypt`

Encrypt any data for secure storage or transmission.

**Request:**
```json
{
  "user_id": "507f1f77bcf86cd799439011",
  "data": {
    "name": "John Doe",
    "health_data": {
      "weight": 70,
      "height": 175
    }
  }
}
```

**Response:**
```json
{
  "encrypted_data": "gAAAAABk1mZX...",
  "user_id": "507f1f77bcf86cd799439011",
  "encrypted_at": "2025-10-12T10:30:00",
  "encryption_method": "Fernet (symmetric)",
  "note": "Use the decryption endpoint with your user_id to decrypt this data"
}
```

### 2. Decrypt Data
**POST** `/api/security/decrypt`

Decrypt previously encrypted data using user_id.

**Request:**
```json
{
  "encrypted_data": "gAAAAABk1mZX...",
  "user_id": "507f1f77bcf86cd799439011"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "John Doe",
    "health_data": {
      "weight": 70,
      "height": 175
    }
  }
}
```

### 3. Generate Decryption Token
**POST** `/api/security/generate-token`

Generate a decryption token for secure access.

**Request:**
```json
{
  "user_id": "507f1f77bcf86cd799439011",
  "expires_in_hours": 24
}
```

**Response:**
```json
{
  "success": true,
  "decryption_token": "d09GRktfa3RpbWVf...",
  "user_id": "507f1f77bcf86cd799439011",
  "valid_until": "24 hours from now",
  "instructions": "Use this token with the /decrypt-with-token endpoint to decrypt your data"
}
```

### 4. Decrypt with Token
**POST** `/api/security/decrypt-with-token`

Decrypt data using a decryption token.

**Request:**
```json
{
  "encrypted_data": "gAAAAABk1mZX...",
  "decryption_token": "d09GRktfa3RpbWVf..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "John Doe",
    "health_data": {...}
  }
}
```

### 5. Get Health Report
**POST** `/api/security/health-report`

Get comprehensive health report from all agents.

**Request:**
```json
{
  "user_id": "507f1f77bcf86cd799439011",
  "report_type": "all",
  "days": 30,
  "encrypt": true
}
```

**Response (Encrypted):**
```json
{
  "success": true,
  "report_type": "all",
  "encrypted_data": "gAAAAABk1mZX...",
  "user_id": "507f1f77bcf86cd799439011",
  "encrypted_at": "2025-10-12T10:30:00",
  "encryption_method": "Fernet (symmetric)",
  "note": "Use the decryption endpoint with your user_id to decrypt this data"
}
```

**Response (Not Encrypted):**
```json
{
  "success": true,
  "report_type": "all",
  "data": {
    "user_id": "507f1f77bcf86cd799439011",
    "generated_at": "2025-10-12T10:30:00",
    "period_days": 30,
    "diet_agent": {...},
    "fitness_agent": {...},
    "mental_health_agent": {...},
    "summary": {
      "total_meal_analyses": 45,
      "total_workouts": 20,
      "total_mood_entries": 30
    }
  },
  "note": "Data is not encrypted. Set 'encrypt=true' for encrypted download."
}
```

### 6. Get Specific Agent Data
**GET** `/api/security/agent-data/{agent_type}/{user_id}`

Get data from a specific health agent.

**Parameters:**
- `agent_type`: diet | fitness | mental_health
- `user_id`: User identifier
- `days` (query): Number of days (default: 30)
- `encrypt` (query): Whether to encrypt (default: false)

**Example:**
```
GET /api/security/agent-data/diet/507f1f77bcf86cd799439011?days=30&encrypt=true
```

**Response:**
```json
{
  "success": true,
  "agent_type": "diet",
  "encrypted_data": "gAAAAABk1mZX...",
  "user_id": "507f1f77bcf86cd799439011",
  "encrypted_at": "2025-10-12T10:30:00",
  "encryption_method": "Fernet (symmetric)",
  "note": "Use the decryption endpoint with your user_id to decrypt this data"
}
```

### 7. Health Check
**GET** `/api/security/health`

Check the status of the Data and Security Agent.

**Response:**
```json
{
  "status": "healthy",
  "agent": "Data and Security Agent",
  "features": [
    "Data Encryption (Fernet)",
    "Data Decryption",
    "Token-based Decryption",
    "Multi-Agent Data Aggregation",
    "Encrypted Health Reports"
  ],
  "encryption_method": "Fernet (symmetric encryption)",
  "supported_agents": ["diet", "fitness", "mental_health"]
}
```

## Security Features

### Encryption Details

1. **Symmetric Encryption**: Uses Fernet from the `cryptography` library
2. **Key Derivation**: PBKDF2 with SHA-256
   - 100,000 iterations for key strengthening
   - User-specific salt (master salt + user_id)
   - 32-byte key length

3. **User-Specific Keys**: Each user gets a unique encryption key derived from:
   - Master key (stored in environment variables)
   - User ID (unique identifier)
   - Salt (additional randomness)

### Best Practices

1. **Environment Variables**: Always change default encryption keys in production
2. **HTTPS**: Use HTTPS in production to protect data in transit
3. **Key Management**: Store master keys in secure vaults (Azure Key Vault, AWS Secrets Manager)
4. **Token Expiration**: Set appropriate token expiration times
5. **Access Control**: Implement proper authentication before allowing data access

## Usage Flow

### Scenario 1: Download Encrypted Health Report

1. **Request Encrypted Report:**
```bash
POST /api/security/health-report
{
  "user_id": "USER_ID",
  "report_type": "all",
  "days": 30,
  "encrypt": true
}
```

2. **Receive Encrypted Data:**
```json
{
  "encrypted_data": "gAAAAABk1mZX...",
  "user_id": "USER_ID",
  ...
}
```

3. **Decrypt Data:**
```bash
POST /api/security/decrypt
{
  "encrypted_data": "gAAAAABk1mZX...",
  "user_id": "USER_ID"
}
```

### Scenario 2: Token-Based Decryption

1. **Generate Token:**
```bash
POST /api/security/generate-token
{
  "user_id": "USER_ID",
  "expires_in_hours": 24
}
```

2. **Receive Token:**
```json
{
  "decryption_token": "d09GRktfa3RpbWVf...",
  ...
}
```

3. **Use Token to Decrypt:**
```bash
POST /api/security/decrypt-with-token
{
  "encrypted_data": "gAAAAABk1mZX...",
  "decryption_token": "d09GRktfa3RpbWVf..."
}
```

## Installation & Setup

### 1. Install Dependencies

```bash
pip install cryptography==41.0.7
```

### 2. Configure Environment Variables

Add to `.env`:
```env
ENCRYPTION_MASTER_KEY=your-strong-master-key-here
ENCRYPTION_SALT=your-salt-here
```

### 3. Run the Application

```bash
cd backend
uvicorn main:app --reload --port 8000
```

### 4. Test the Endpoints

Visit: `http://localhost:8000/docs` for interactive API documentation.

## Database Configuration

The agent connects to MongoDB using:
- **URI**: `mongodb://localhost:27017`
- **Database**: `HealthAgent`

Ensure MongoDB is running and the database exists with the necessary collections.

## Error Handling

All endpoints include comprehensive error handling:

- **400 Bad Request**: Invalid input or decryption failure
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server-side errors

Example error response:
```json
{
  "detail": "Decryption failed: Invalid or expired token."
}
```

## Future Enhancements

1. **Asymmetric Encryption**: Add RSA for public/private key encryption
2. **Token Expiration**: Implement actual token expiration validation
3. **Audit Logging**: Log all encryption/decryption operations
4. **Rate Limiting**: Prevent brute force attacks
5. **Data Masking**: Mask sensitive fields in logs
6. **Backup Encryption**: Encrypt database backups
7. **Multi-Factor Authentication**: Require MFA for sensitive operations

## Testing

Test the endpoints using the interactive docs at `/docs` or use curl:

```bash
# Health check
curl http://localhost:8000/api/security/health

# Encrypt data
curl -X POST http://localhost:8000/api/security/encrypt \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "507f1f77bcf86cd799439011",
    "data": {"test": "data"}
  }'
```

## Support

For issues or questions, refer to the main project documentation or contact the development team.

---

**Version**: 1.0.0  
**Last Updated**: October 12, 2025
