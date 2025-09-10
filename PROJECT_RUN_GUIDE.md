# 🚀 Healthy Lifestyle Advisor - Project Setup & Run Guide

## ✅ Current Status
- **Backend API**: ✅ Running on http://localhost:8000
- **Database**: ✅ Using mock in-memory database (no MongoDB required)
- **Mental Health Agent**: ✅ Initialized and ready
- **Environment**: ✅ All .env files configured

## 🏃‍♂️ Quick Start Instructions

### Prerequisites
You need to install Node.js to run the frontend. Download from: https://nodejs.org/

### 1. Backend (Already Running! ✅)
The FastAPI backend is already running on port 8000 with:
- Mental Health Agent initialized
- Mock database for development
- API documentation available at: http://localhost:8000/docs

### 2. Frontend Setup & Run
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (first time only)
npm install

# Start the frontend development server
npm run dev
```
The frontend will be available at: http://localhost:5173

### 3. Optional: Diet AI Services
If you want to run the diet AI services:
```bash
# Navigate to diet AI services
cd aiservices/dietaiservices

# Install Python dependencies
pip install -r requirements.txt

# Run the service
python main.py
```

### 4. Optional: Mental Health Frontend (Standalone)
```bash
# Navigate to mental health frontend
cd aiservices/Mentalhealthfrontend

# Install dependencies
npm install

# Start the service
npm start
```

## 🌐 Access Points

### Main Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

### Services
- **Mental Health**: Integrated in main app (login required)
- **Diet Agent**: Integrated in main app (login required)
- **Fitness Planner**: Available in services
- **Security & Privacy**: Available in services

## 🔐 Authentication
The application now requires login to access services:
1. Go to http://localhost:5173
2. Click "Register" to create an account
3. Login with your credentials
4. Access services through the Services page

## 🧪 Testing
- Health check: http://localhost:8000/api/mental-health/health
- API status: http://localhost:8000/api/mental-health/status

## 📝 Notes
- The backend uses a mock database for development (no MongoDB setup required)
- All services are protected by authentication
- Mental Health agent is fully integrated into the main application
- Environment variables are properly configured

## 🔧 Troubleshooting
1. **Backend not responding**: Check if running on port 8000
2. **Frontend won't start**: Ensure Node.js is installed and run `npm install`
3. **Authentication issues**: Clear browser localStorage and re-login
4. **API errors**: Check backend logs in the terminal

## 🎯 What's Running
Currently active:
- ✅ FastAPI Backend (Port 8000)
- ✅ Mental Health Agent Service
- ✅ Mock Database System
- ⏳ Frontend (needs Node.js to start)

Next step: Install Node.js and run the frontend to complete the setup!
