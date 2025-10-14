# 🏋️ Fitness Agent Services

## Overview
The Fitness Agent consists of two separate services that work together:

1. **Fitness Backend** (Port 8002) - FastAPI service handling workout plans, user data, health tracking
2. **Fitness Frontend** (Port 5174) - React application with complete UI for fitness planning

## Architecture

```
Main Web App (localhost:3000)
    ↓
  Services Page
    ↓
  Click "Launch Fitness Hub"
    ↓
  Opens Fitness Frontend (localhost:5174) ← → Fitness Backend (localhost:8002)
```

## Quick Start

### Option 1: Start Fitness Services Only
```bash
# Windows
cd aiservices
start-fitness-services.bat

# Linux/Mac
cd aiservices
chmod +x start-fitness-services.sh
./start-fitness-services.sh
```

### Option 2: Start All Services (Recommended)
```bash
# Windows
START_ALL_SERVICES.bat

# This starts:
# - Main Backend (8000)
# - Diet AI Service (8001)
# - Fitness Backend (8002)
# - Fitness Frontend (5174)
# - Main Frontend (3000)
```

### Option 3: Manual Start

#### Start Fitness Backend
```bash
cd aiservices/fitnessbackend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8002
```

#### Start Fitness Frontend
```bash
cd aiservices/fitnessagentfrontend
npm run dev
```

## Usage Flow

1. **Start Services**: Run `START_ALL_SERVICES.bat` to start all services
2. **Open Main App**: Navigate to http://localhost:3000
3. **Go to Services**: Click on "Services" in the navigation
4. **Launch Fitness Hub**: Click "Launch Fitness Hub" button
5. **Fitness App Opens**: A new tab opens with the fitness frontend (http://localhost:5174)

## Fitness Frontend Features

### 📊 Dashboard
- Active workout plans
- Progress statistics
- Recent activities
- Workout streak tracking

### 🗓️ Workout Planner
- Create custom workout plans
- AI-powered exercise recommendations
- Schedule weekly routines
- Track workout sessions

### 📚 Exercise Library
- Comprehensive exercise database
- Filter by muscle group, difficulty, equipment
- Exercise instructions and demonstrations
- Custom exercise creation

### 🎯 Fitness Goals
- Set personalized fitness objectives
- Track goal progress
- Milestone achievements
- Goal-based recommendations

### 💓 Health Data
- Track vital metrics (weight, heart rate, etc.)
- Health data visualization
- Progress charts and trends

## API Endpoints

### Fitness Backend (http://localhost:8002)

- **GET** `/api/dashboard` - Get user dashboard data
- **GET** `/api/workouts` - List all workouts
- **POST** `/api/workouts` - Create new workout
- **GET** `/api/workout-planner/plans` - Get workout plans
- **POST** `/api/workout-planner/generate` - Generate AI workout plan
- **GET** `/api/health/metrics` - Get health metrics
- **POST** `/api/health/metrics` - Log health data

## Configuration

### Fitness Backend (.env)
```env
MONGODB_URI=your_mongodb_connection_string
SECRET_KEY=your_secret_key
RABBITMQ_URL=amqp://guest:guest@localhost/
```

### Fitness Frontend (vite.config.ts)
```typescript
server: {
  port: 5174,
  proxy: {
    '/api': 'http://localhost:8002'
  }
}
```

## Development

### Fitness Backend
- **Framework**: FastAPI
- **Database**: MongoDB
- **Message Queue**: RabbitMQ
- **Authentication**: JWT OAuth2

### Fitness Frontend
- **Framework**: React 18 + TypeScript
- **Routing**: React Router v6
- **Charts**: Chart.js + react-chartjs-2
- **HTTP Client**: Axios
- **Build Tool**: Vite

## Troubleshooting

### Fitness Frontend not loading
- Ensure port 5174 is not in use
- Check if npm dependencies are installed: `cd aiservices/fitnessagentfrontend && npm install`
- Verify Vite is running: Check the terminal for errors

### Fitness Backend not responding
- Ensure port 8002 is not in use
- Check MongoDB connection in .env file
- Verify Python dependencies: `cd aiservices/fitnessbackend && pip install -r requirements.txt`

### Cannot connect to backend from frontend
- Check if backend is running on port 8002
- Verify CORS settings in backend main.py
- Check browser console for CORS errors

## Port Summary

| Service | Port | URL |
|---------|------|-----|
| Main Backend | 8000 | http://localhost:8000 |
| Diet AI Service | 8001 | http://localhost:8001 |
| **Fitness Backend** | **8002** | **http://localhost:8002** |
| **Fitness Frontend** | **5174** | **http://localhost:5174** |
| Main Frontend | 3000 | http://localhost:3000 |

## Integration with Main App

The main web app (localhost:3000) acts as a hub that launches the fitness services. When users click "Launch Fitness Hub" on the Services page:

1. A new browser tab opens pointing to http://localhost:5174
2. The fitness frontend loads and connects to the fitness backend (8002)
3. Users interact with the complete fitness application
4. Data is synced between services via RabbitMQ (optional)

This architecture allows:
- Independent development of fitness features
- Separate deployment and scaling
- Clean separation of concerns
- Easy maintenance and updates
