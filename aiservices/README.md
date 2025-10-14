# 🥗 AI Diet Agent - Complete Deployment Guide

## Overview

This is a comprehensive AI-powered diet analysis system using LangChain, RabbitMQ, and modern web technologies. The system provides:

- **AI Food Recognition**: Computer vision to identify foods from images
- **Nutrition Analysis**: Detailed macro and micronutrient calculations
- **Personalized Recommendations**: AI-powered diet advice using LangChain
- **Real-time Processing**: Asynchronous message handling with RabbitMQ
- **Modern UI**: React frontend with Tailwind CSS

## 🏗️ Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │───▶│   Backend   │───▶│ AI Service  │
│  (React)    │    │  (FastAPI)  │    │ (LangChain) │
└─────────────┘    └─────────────┘    └─────────────┘
                           │                   │
                           ▼                   ▼
                   ┌─────────────┐    ┌─────────────┐
                   │  Database   │    │ RabbitMQ    │
                   │ (MongoDB)   │    │ (Messages)  │
                   └─────────────┘    └─────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- OpenAI API Key
- Google Cloud Vision API Key (optional)
- At least 4GB RAM available

### 1. Clone and Setup Environment

```bash
cd /Users/chanuka/Desktop/Healthagent/healthy_lifestyle_advisor/aiservices
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` file with your API keys:

```bash
# AI Service Configuration
OPENAI_API_KEY=your_openai_api_key_here
GOOGLE_API_KEY=your_google_api_key_here

# Optional: Google Cloud Vision (for better food recognition)
GOOGLE_APPLICATION_CREDENTIALS=/app/google-credentials.json

# Database URLs (keep as default for Docker)
MONGODB_URL=mongodb://admin:password@mongo:27017
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/
```

### 3. Add Google Cloud Credentials (Optional)

If using Google Vision API, place your service account JSON file as:

```bash
# Place your Google Cloud service account JSON file here
cp /path/to/your/google-service-account.json ./google-credentials.json
```

### 4. Deploy with Docker Compose

```bash
# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **AI Service**: http://localhost:8001
- **RabbitMQ Management**: http://localhost:15672 (guest/guest)
- **MongoDB**: localhost:27017

## 📊 Service Details

### AI Service (Port 8001)

- **Technology**: Python, LangChain, FastAPI
- **Features**:
  - Food image analysis using Google Vision
  - Nutrition calculation with external APIs
  - AI-powered diet recommendations
  - Macro tracking and goal setting

### Backend API (Port 8000)

- **Technology**: Python, FastAPI, MongoDB
- **Features**:
  - User authentication (JWT)
  - Meal logging and history
  - Dashboard data aggregation
  - RabbitMQ message publishing

### Frontend (Port 5173)

- **Technology**: React, TypeScript, Tailwind CSS
- **Features**:
  - Food photo upload and analysis
  - Real-time nutrition dashboard
  - Progress tracking and goals
  - Responsive mobile design

### Message Queue (RabbitMQ)

- **Queues**:
  - `diet_processing`: Main diet analysis
  - `nutrition_analysis`: Nutrition calculations
  - `image_processing`: Image analysis tasks
  - `notifications`: User notifications

## 🔧 API Endpoints

### Backend API (http://localhost:8000)

```
POST /auth/register          # Register new user
POST /auth/login             # User login
POST /analyze/image          # Analyze food image
POST /analyze/text           # Analyze meal description
GET  /meal-plan             # Get AI meal plan
POST /hydration             # Update water intake
GET  /dashboard             # Get dashboard data
GET  /history               # Get meal history
PUT  /profile               # Update user profile
```

### AI Service (http://localhost:8001)

```
POST /analyze/image          # Direct image analysis
POST /analyze/text-meal      # Direct text analysis
POST /meal-plan             # Generate meal plan
POST /hydration             # Track hydration
POST /calculate/bmi         # Calculate BMI
POST /calculate/tdee        # Calculate TDEE
GET  /analysis/{request_id} # Get analysis result
GET  /health                # Health check
```

## 🧪 Testing the System

### 1. Health Checks

```bash
# Check all services
curl http://localhost:8000/health
curl http://localhost:8001/health

# Check RabbitMQ
curl http://localhost:15672/api/overview
```

### 2. Register a Test User

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123",
    "name": "Test User",
    "age": 30,
    "gender": "male",
    "height_cm": 175,
    "weight_kg": 70,
    "activity_level": "moderate",
    "goal": "maintain"
  }'
```

### 3. Test Image Analysis

```bash
# Upload a food image (replace with actual token)
curl -X POST http://localhost:8000/analyze/image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@path/to/food-image.jpg" \
  -F "meal_type=lunch"
```

## 🔍 Monitoring and Logs

### View Service Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f ai_service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Monitor RabbitMQ

1. Open http://localhost:15672
2. Login with guest/guest
3. Check queues and message flow

### Monitor Database

```bash
# Connect to MongoDB
docker exec -it mongo mongosh

# Check collections
use healthy_lifestyle
show collections
db.meal_entries.find().limit(5)
```

## 🛠️ Development Setup

### Running Individual Services

```bash
# Backend only
cd Dietbackend
pip install -r requirenment.txt
uvicorn main:app --reload --port 8000

# AI Service only
cd dietaiservices
pip install -r requirements.txt
uvicorn main:app --reload --port 8001

# Frontend only
cd Dietagentfrontend
npm install
npm run dev
```

### Adding New AI Features

1. **Update LangChain chains** in `dietaiservices/chain.py`
2. **Add new message handlers** in `dietaiservices/worker.py`
3. **Create new API endpoints** in `dietaiservices/main.py`
4. **Update frontend components** in `Dietagentfrontend/components/`

## 🚨 Troubleshooting

### Common Issues

**1. Services not starting:**

```bash
# Check logs
docker-compose logs

# Restart services
docker-compose down && docker-compose up --build
```

**2. AI Analysis failing:**

- Check OpenAI API key in `.env`
- Verify Google credentials (if using Vision API)
- Check AI service logs: `docker-compose logs ai_service`

**3. Database connection issues:**

```bash
# Reset database
docker-compose down -v
docker-compose up --build
```

**4. RabbitMQ connection issues:**

```bash
# Check RabbitMQ status
curl http://localhost:15672/api/health/checks/virtual-hosts

# Restart RabbitMQ
docker-compose restart rabbitmq
```

**5. Frontend not connecting to backend:**

- Check CORS settings in backend
- Verify API URLs in frontend `.env`
- Check network connectivity between containers

### Performance Optimization

```bash
# Scale AI workers for better performance
docker-compose up --scale ai_worker=3

# Monitor resource usage
docker stats
```

## 📱 Mobile Usage

The frontend is fully responsive and works on mobile devices:

- Take photos directly from camera
- Touch-optimized interface
- Offline-capable (PWA ready)

## 🔒 Security Considerations

### Production Deployment

1. **Change default passwords** in docker-compose.yml
2. **Use environment-specific `.env` files**
3. **Enable HTTPS** with reverse proxy (nginx/traefik)
4. **Restrict CORS origins** in production
5. **Use proper JWT secrets**
6. **Enable rate limiting**
7. **Regular security updates**

### API Rate Limiting

- OpenAI API: Monitor usage and costs
- Google Vision API: Optimize image sizes
- Nutrition API: Cache common foods

## 📈 Scaling

### Horizontal Scaling

```bash
# Scale AI workers
docker-compose up --scale ai_worker=5

# Scale backend
docker-compose up --scale backend=3
```

### Database Optimization

- Add indexes for frequent queries
- Use database sharding for large datasets
- Implement data archiving

## 🎯 Next Steps

### Feature Enhancements

1. **Meal Planning AI**: Weekly meal plan generation
2. **Recipe Suggestions**: AI-generated healthy recipes
3. **Social Features**: Share meals and progress
4. **Wearable Integration**: Sync with fitness trackers
5. **Voice Commands**: Voice-activated meal logging
6. **Barcode Scanning**: Packaged food recognition

### ML Model Improvements

1. **Custom Food Models**: Train on your own food dataset
2. **Portion Size Detection**: Better serving size estimation
3. **Real-time Analysis**: Faster inference with edge computing
4. **Multi-language Support**: International food recognition

## 🆘 Support

For issues and questions:

1. Check logs: `docker-compose logs -f`
2. Review this documentation
3. Test individual components
4. Check API keys and permissions

## 📝 License

This project is for educational and development purposes.

---

**Happy Healthy Eating! 🥗✨**
