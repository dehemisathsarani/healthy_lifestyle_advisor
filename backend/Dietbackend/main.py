from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx
import json
import uuid
import base64
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import motor.motor_asyncio
from pydantic import BaseModel
import jwt

from models import User, UserProfile, MealEntry, DietAnalysis, DailyNutrition
from settings import settings
from mq import RabbitMQClient
from utils import verify_token, get_current_user

# Setup logging
logging.basicConfig(level=getattr(logging, settings.LOG_LEVEL))
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Diet Agent Backend API",
    description="Backend service for the AI-powered diet agent system",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Global connections
db_client = None
db = None
rabbitmq_client = None
ai_service_client = None

# Request/Response Models
class FoodAnalysisRequest(BaseModel):
    meal_description: Optional[str] = None
    meal_type: str  # breakfast, lunch, dinner, snack
    timestamp: Optional[datetime] = None

class MealPlanRequest(BaseModel):
    date: Optional[str] = None
    preferences: Optional[List[str]] = []

class HydrationUpdateRequest(BaseModel):
    amount_ml: int
    timestamp: Optional[datetime] = None

class UserRegistrationRequest(BaseModel):
    email: str
    password: str
    name: str
    age: int
    gender: str
    height_cm: float
    weight_kg: float
    activity_level: str
    goal: str

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Initialize connections on startup."""
    global db_client, db, rabbitmq_client, ai_service_client
    
    try:
        # Connect to MongoDB
        db_client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URL)
        db = db_client[settings.DATABASE_NAME]
        
        # Initialize RabbitMQ client
        rabbitmq_client = RabbitMQClient()
        await rabbitmq_client.connect()
        
        # Initialize AI service HTTP client
        ai_service_client = httpx.AsyncClient(
            base_url=settings.AI_SERVICE_URL,
            timeout=30.0
        )
        
        logger.info("Backend connections established successfully")
        
    except Exception as e:
        logger.error(f"Failed to establish connections: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Close connections on shutdown."""
    global db_client, rabbitmq_client, ai_service_client
    
    if db_client:
        db_client.close()
    if rabbitmq_client:
        await rabbitmq_client.disconnect()
    if ai_service_client:
        await ai_service_client.aclose()

# Authentication endpoints
@app.post("/auth/register")
async def register_user(request: UserRegistrationRequest):
    """Register a new user."""
    try:
        # Check if user already exists
        existing_user = await db.users.find_one({"email": request.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="User already exists")
        
        # Create user
        user_data = request.dict()
        user_data['user_id'] = str(uuid.uuid4())
        user_data['created_at'] = datetime.now()
        user_data['password'] = hash(request.password)  # Use proper password hashing in production
        
        await db.users.insert_one(user_data)
        
        # Create user profile for AI service
        user_profile = UserProfile(
            user_id=user_data['user_id'],
            age=request.age,
            gender=request.gender,
            height_cm=request.height_cm,
            weight_kg=request.weight_kg,
            activity_level=request.activity_level,
            goal=request.goal
        )
        
        # Store user profile
        await db.user_profiles.insert_one(user_profile.dict())
        
        # Generate JWT token
        token = jwt.encode(
            {
                "user_id": user_data['user_id'],
                "email": request.email,
                "exp": datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
            },
            settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM
        )
        
        return {
            "message": "User registered successfully",
            "user_id": user_data['user_id'],
            "token": token
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error registering user: {e}")
        raise HTTPException(status_code=500, detail="Registration failed")

@app.post("/auth/login")
async def login_user(email: str, password: str):
    """Login user and return JWT token."""
    try:
        # Find user
        user = await db.users.find_one({"email": email})
        if not user or user['password'] != hash(password):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Generate JWT token
        token = jwt.encode(
            {
                "user_id": user['user_id'],
                "email": email,
                "exp": datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
            },
            settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM
        )
        
        return {
            "message": "Login successful",
            "user_id": user['user_id'],
            "token": token
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error logging in user: {e}")
        raise HTTPException(status_code=500, detail="Login failed")

# Main API endpoints
@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "message": "Diet Agent Backend API is running",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/analyze/image")
async def analyze_food_image(
    file: UploadFile = File(...),
    meal_type: str = "meal",
    current_user: dict = Depends(get_current_user)
):
    """Analyze food from uploaded image using AI service."""
    try:
        # Get user profile
        user_profile = await db.user_profiles.find_one({"user_id": current_user['user_id']})
        if not user_profile:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        # Send image to AI service
        files = {"file": (file.filename, await file.read(), file.content_type)}
        data = {
            "user_profile": json.dumps(user_profile)
        }
        
        response = await ai_service_client.post("/analyze/image", files=files, data=data)
        
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="AI analysis failed")
        
        analysis_result = response.json()
        
        # Store meal entry in database
        meal_entry = {
            "user_id": current_user['user_id'],
            "meal_type": meal_type,
            "analysis_result": analysis_result,
            "image_filename": file.filename,
            "timestamp": datetime.now(),
            "request_id": analysis_result.get('request_id')
        }
        
        await db.meal_entries.insert_one(meal_entry)
        
        # Send a nutrition update to RabbitMQ for other agents (fitness, analytics)
        await rabbitmq_client.publish_nutrition_update(
            current_user['user_id'],
            {
                "meal_entry": meal_entry,
                "calories": meal_entry.get('analysis_result', {}).get('calories'),
                "macros": meal_entry.get('analysis_result', {}).get('macros')
            }
        )
        
        return analysis_result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing food image: {e}")
        raise HTTPException(status_code=500, detail="Analysis failed")

@app.post("/analyze/text")
async def analyze_text_meal(
    request: FoodAnalysisRequest,
    current_user: dict = Depends(get_current_user)
):
    """Analyze meal from text description."""
    try:
        # Get user profile
        user_profile = await db.user_profiles.find_one({"user_id": current_user['user_id']})
        if not user_profile:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        # Send to AI service
        ai_request = {
            "user_profile": user_profile,
            "meal_description": request.meal_description
        }
        
        response = await ai_service_client.post("/analyze/text-meal", json=ai_request)
        
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="AI analysis failed")
        
        analysis_result = response.json()
        
        # Store meal entry
        meal_entry = {
            "user_id": current_user['user_id'],
            "meal_type": request.meal_type,
            "meal_description": request.meal_description,
            "analysis_result": analysis_result,
            "timestamp": request.timestamp or datetime.now(),
            "request_id": analysis_result.get('request_id')
        }
        
        await db.meal_entries.insert_one(meal_entry)
        
        return analysis_result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing text meal: {e}")
        raise HTTPException(status_code=500, detail="Analysis failed")


@app.post("/test/publish-nutrition")
async def test_publish_nutrition(user_id: str, calories: int = 400):
    """Test helper: publish a nutrition.update message to RabbitMQ so other agents (fitness) can consume it."""
    try:
        if not rabbitmq_client:
            raise HTTPException(status_code=503, detail="RabbitMQ client not initialized")

        await rabbitmq_client.publish_nutrition_update(
            user_id,
            {"calories": calories, "macros": {"protein": 20, "fat": 10, "carbs": 50}}
        )

        return {"message": "Published nutrition update", "user_id": user_id, "calories": calories}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error publishing test nutrition message: {e}")
        raise HTTPException(status_code=500, detail="Publish failed")

@app.get("/meal-plan")
async def get_meal_plan(
    date: Optional[str] = None,
    goal_type: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get personalized meal plan for the day."""
    try:
        from nutrition_service import nutrition_service
        
        if not date:
            date = datetime.now().strftime('%Y-%m-%d')
        
        # Get current day's intake
        current_intake = await db.meal_entries.find({
            "user_id": current_user['user_id'],
            "timestamp": {
                "$gte": datetime.strptime(date, '%Y-%m-%d'),
                "$lt": datetime.strptime(date, '%Y-%m-%d') + timedelta(days=1)
            }
        }).to_list(None)
        
        # Get user profile
        user_profile_data = await db.user_profiles.find_one({"user_id": current_user['user_id']})
        
        if not user_profile_data:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        # Convert to Pydantic model
        user_profile = UserProfile(**user_profile_data)
        
        # Update goal if provided
        if goal_type and goal_type in ["lose_weight", "gain_weight", "maintain"]:
            user_profile.goal = goal_type
            # Update in DB
            await db.user_profiles.update_one(
                {"user_id": current_user['user_id']},
                {"$set": {"goal": goal_type}}
            )
        
        # Generate meal plan
        meal_plan = await nutrition_service.generate_meal_plan(user_profile, date)
        
        # Store meal plan in DB
        meal_plan_dict = meal_plan.dict()
        result = await db.meal_plans.insert_one(meal_plan_dict)
        meal_plan_dict["plan_id"] = str(result.inserted_id)
        
        return meal_plan_dict
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting meal plan: {e}")
        raise HTTPException(status_code=500, detail="Meal plan generation failed")

@app.post("/hydration")
async def update_hydration(
    request: HydrationUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update water intake."""
    try:
        # Send to AI service for tracking
        ai_request = {
            "user_id": current_user['user_id'],
            "water_amount_ml": request.amount_ml
        }
        
        response = await ai_service_client.post("/hydration", json=ai_request)
        
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Hydration update failed")
        
        result = response.json()
        
        # Store in local database as well
        await db.hydration_entries.insert_one({
            "user_id": current_user['user_id'],
            "amount_ml": request.amount_ml,
            "timestamp": request.timestamp or datetime.now(),
            "date": datetime.now().strftime('%Y-%m-%d')
        })
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating hydration: {e}")
        raise HTTPException(status_code=500, detail="Hydration update failed")

@app.get("/dashboard")
async def get_dashboard_data(
    date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get comprehensive dashboard data for the user."""
    try:
        if not date:
            date = datetime.now().strftime('%Y-%m-%d')
        
        # Get daily summary from AI service
        response = await ai_service_client.get(f"/user/{current_user['user_id']}/daily-summary?date={date}")
        
        if response.status_code != 200:
            daily_summary = {"message": "Summary not available"}
        else:
            daily_summary = response.json()
        
        # Get recent meal entries
        recent_meals = await db.meal_entries.find({
            "user_id": current_user['user_id'],
            "timestamp": {
                "$gte": datetime.strptime(date, '%Y-%m-%d'),
                "$lt": datetime.strptime(date, '%Y-%m-%d') + timedelta(days=1)
            }
        }).sort("timestamp", -1).limit(10).to_list(None)
        
        # Get user profile for BMI/TDEE calculations
        user_profile = await db.user_profiles.find_one({"user_id": current_user['user_id']})
        
        # Calculate BMI and TDEE
        bmi_response = await ai_service_client.post("/calculate/bmi", json={
            "weight_kg": user_profile['weight_kg'],
            "height_cm": user_profile['height_cm']
        })
        
        tdee_response = await ai_service_client.post("/calculate/tdee", json=user_profile)
        
        bmi_data = bmi_response.json() if bmi_response.status_code == 200 else {}
        tdee_data = tdee_response.json() if tdee_response.status_code == 200 else {}
        
        return {
            "date": date,
            "daily_summary": daily_summary,
            "recent_meals": recent_meals,
            "bmi_data": bmi_data,
            "tdee_data": tdee_data,
            "user_profile": user_profile
        }
        
    except Exception as e:
        logger.error(f"Error getting dashboard data: {e}")
        raise HTTPException(status_code=500, detail="Dashboard data retrieval failed")

@app.get("/history")
async def get_meal_history(
    days: int = 7,
    current_user: dict = Depends(get_current_user)
):
    """Get meal history for the specified number of days."""
    try:
        start_date = datetime.now() - timedelta(days=days)
        
        meals = await db.meal_entries.find({
            "user_id": current_user['user_id'],
            "timestamp": {"$gte": start_date}
        }).sort("timestamp", -1).to_list(None)
        
        # Group by date
        history_by_date = {}
        for meal in meals:
            date_key = meal['timestamp'].strftime('%Y-%m-%d')
            if date_key not in history_by_date:
                history_by_date[date_key] = []
            history_by_date[date_key].append(meal)
        
        return {
            "days": days,
            "history": history_by_date,
            "total_entries": len(meals)
        }
        
    except Exception as e:
        logger.error(f"Error getting meal history: {e}")
        raise HTTPException(status_code=500, detail="History retrieval failed")

@app.put("/profile")
async def update_user_profile(
    weight_kg: Optional[float] = None,
    height_cm: Optional[float] = None,
    activity_level: Optional[str] = None,
    goal: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Update user profile."""
    try:
        update_data = {}
        if weight_kg is not None:
            update_data['weight_kg'] = weight_kg
        if height_cm is not None:
            update_data['height_cm'] = height_cm
        if activity_level is not None:
            update_data['activity_level'] = activity_level
        if goal is not None:
            update_data['goal'] = goal
        
        if update_data:
            update_data['updated_at'] = datetime.now()
            
            await db.user_profiles.update_one(
                {"user_id": current_user['user_id']},
                {"$set": update_data}
            )
        
        return {"message": "Profile updated successfully"}
        
    except Exception as e:
        logger.error(f"Error updating profile: {e}")
        raise HTTPException(status_code=500, detail="Profile update failed")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)