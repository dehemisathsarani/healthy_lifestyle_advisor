# Healthy Lifestyle Advisor - Project Overview

## 🌟 System Architecture

The Healthy Lifestyle Advisor is a comprehensive health management system with a microservices architecture:

1. **Main Application**
   - Frontend: React, Vite, TypeScript, Tailwind CSS
   - Backend: FastAPI, Python, MongoDB

2. **Diet Agent Service**
   - AI-powered food analysis and nutrition tracking
   - Containerized microservice with its own frontend/backend

3. **Mental Health Service**
   - Wellness tools, mood tracking, and meditation guidance
   - Standalone microservice with simplified frontend

## 🚀 Getting Started

### Quick Start

Use the provided batch scripts to start all services:

```bash
# Start all services
./start_services.bat

# Stop all services
./stop_services.bat
```

### Manual Setup

1. **Main Application**
   ```bash
   # Start backend
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --reload
   
   # Start frontend
   cd frontend
   npm install
   npm run dev
   ```

2. **AI Services**
   ```bash
   # Start all microservices
   cd aiservices
   docker-compose up -d
   ```

## 📊 Services & Ports

| Service | Port | URL |
|---------|------|-----|
| Main Frontend | 5173 | http://localhost:5173 |
| Main Backend | 8000 | http://localhost:8000 |
| Diet AI Service | 8001 | http://localhost:8001 |
| Diet Frontend | (via Main) | http://localhost:5173/diet |
| Mental Health API | 8002 | http://localhost:8002 |
| Mental Health UI | 5175 | http://localhost:5175 |
| MongoDB | 27017 | mongodb://localhost:27017 |
| RabbitMQ | 5672, 15672 | http://localhost:15672 |

## 🛠️ Development Guide

### Project Structure

```
healthy_lifestyle_advisor/
├── frontend/             # Main React frontend
├── backend/              # Main FastAPI backend
└── aiservices/
    ├── Dietagentfrontend/   # Diet agent frontend
    ├── dietaiservices/      # Diet agent AI service
    ├── Dietbackend/         # Diet agent backend
    ├── Mentalhealthfrontend/  # Mental health frontend 
    └── mentalhealthaiservices/ # Mental health backend
```

### Adding New Features

1. **Frontend Components**: Add to `frontend/src/components/`
2. **Backend Endpoints**: Add to `backend/app/routers/`
3. **AI Services**: Implement in the appropriate service directory

## 🧪 Testing

Each component includes test files to verify functionality:

```bash
# Run backend tests
cd backend
pytest

# Run diet AI service tests
cd aiservices/dietaiservices
pytest
```

## 📱 Accessing the Application

- **Main Application**: http://localhost:5173
- **Diet Agent**: http://localhost:5173/diet
- **Mental Health Tools**: http://localhost:5175

## 🔒 Security

- JWT authentication for API access
- CORS protection for frontend-backend communication
- Secure Docker container configuration

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
