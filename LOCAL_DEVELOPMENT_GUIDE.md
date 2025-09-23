# Healthy Lifestyle Advisor - Local Development Setup

## Fixed Issues ✅

### 1. Google Vision API Warnings
- **Issue**: Google Vision API credentials not found
- **Solution**: Disabled Google Vision API for local development
- **Status**: ✅ Fixed - Services will use fallback methods

### 2. RabbitMQ Connection Errors  
- **Issue**: Trying to connect to Docker RabbitMQ service
- **Solution**: Disabled RabbitMQ for local development
- **Status**: ✅ Fixed - Services work without message queue

### 3. Database Configuration
- **Backend**: Uses cloud MongoDB (configured)
- **AI Services**: Uses localhost MongoDB (optional)
- **Status**: ✅ Ready for local development

## Running the Application

### Method 1: Using Batch Files (Easiest)
1. Double-click `start_backend.bat` (Port 8000)
2. Double-click `start_ai_services.bat` (Port 8001)  
3. Double-click `start_frontend.bat` (Port 3000)

### Method 2: Manual Commands
Open 3 separate Command Prompt windows:

**Terminal 1 (Backend):**
```cmd
cd /d "C:\Users\Asus\Desktop\healthy_lifestyle_advisor\backend"
"C:\Users\Asus\Desktop\healthy_lifestyle_advisor\.venv\Scripts\python.exe" main.py
```

**Terminal 2 (AI Services):**
```cmd
cd /d "C:\Users\Asus\Desktop\healthy_lifestyle_advisor\aiservices\dietaiservices"
"C:\Users\Asus\Desktop\healthy_lifestyle_advisor\.venv\Scripts\python.exe" main.py
```

**Terminal 3 (Frontend):**
```cmd
cd /d "C:\Users\Asus\Desktop\healthy_lifestyle_advisor\frontend"
npm run dev
```

## Access URLs
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/docs
- **AI Services**: http://localhost:8001/docs

## What Works in Local Development
✅ Basic diet analysis and recommendations
✅ Food nutrition calculations  
✅ User authentication and profiles
✅ BMI/TDEE calculations
✅ Web interface and API endpoints
✅ Health tracking features

## What's Disabled for Local Development
⚠️ Google Vision API (image food recognition)
⚠️ RabbitMQ message queuing
⚠️ Redis caching
⚠️ Local MongoDB (using cloud DB)

## To Enable Full Features (Optional)
1. Install and run MongoDB locally
2. Install and run RabbitMQ locally  
3. Set up Google Cloud Vision API credentials
4. Update `.env` files with proper credentials

The application works fully for development without these services!