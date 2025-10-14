from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from typing import List

from auth import create_access_token, get_current_user
from settings import settings
from routers import users, workouts, dashboard, health, workout_planner

# RabbitMQ integration
from mq import rabbitmq_client
import asyncio
import logging
from database import get_database, COLLECTIONS
from fastapi import Depends

# Import new Fitness Messaging routes
from routers.fitness_messaging_routes import router as fitness_messaging_router

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Fitness Agent API",
    description="Backend API for the Fitness Agent application",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router)
app.include_router(workouts.router)
app.include_router(dashboard.router)
app.include_router(health.router)
app.include_router(workout_planner.router)  # New workout planner router
app.include_router(fitness_messaging_router)  # New RabbitMQ messaging routes


@app.on_event("startup")
async def startup_event():
    """Initialize RabbitMQ client and register handlers on startup."""
    try:
        # connect to rabbitmq (diet exchange)
        await rabbitmq_client.connect()

        # Register handlers to process diet messages
        # Handler when nutrition updates arrive (meal logged, hydration)
        async def nutrition_handler(message: dict):
            # Insert nutrition log and adjust user profile targets
            try:
                user_id = message.get('user_id')
                nutrition = message.get('nutrition_data') or message.get('data') or {}
                db = await get_database()

                # store a nutrition log (collection name chosen conservatively)
                await db["nutrition_logs"].insert_one({
                    "user_id": user_id,
                    "nutrition": nutrition,
                    "source": "diet_agent",
                    "timestamp": datetime.utcnow()
                })

                logger.info(f"Stored nutrition log for {user_id}")

                # Example: if calories consumed present, update recent calorie average in user_profiles
                calories = None
                if isinstance(nutrition, dict):
                    calories = nutrition.get('calories') or nutrition.get('energy_kcal')

                if calories:
                    # Upsert a quick profile summary with last_calories and increment meal count
                    await db[COLLECTIONS['user_profiles']].update_one(
                        {"user_id": user_id},
                        {
                            "$set": {"last_meal_calories": calories, "last_meal_at": datetime.utcnow()},
                            "$inc": {"meals_logged": 1}
                        },
                        upsert=True
                    )

                # Further integrations: adjust workout intensity, recovery advice, or schedule reminders
            except Exception as e:
                logger.error(f"nutrition_handler error: {e}")

        async def notifications_handler(message: dict):
            try:
                user_id = message.get('user_id')
                notification_type = message.get('notification_type')
                db = await get_database()
                logger.info(f"Notification for user {user_id}: {notification_type}")

                # If an achievement notification, award XP to the user
                if message.get('achievement'):
                    achievement = message['achievement']
                    points = achievement.get('points', 5) if isinstance(achievement, dict) else 5
                    await db[COLLECTIONS['user_profiles']].update_one(
                        {"user_id": user_id},
                        {"$inc": {"xp": points}, "$set": {"last_achievement": achievement, "last_achievement_at": datetime.utcnow()}},
                        upsert=True
                    )
                    logger.info(f"Awarded {points} XP to {user_id} for achievement")

                # Additional notification types can be mapped to fitness actions here
            except Exception as e:
                logger.error(f"notifications_handler error: {e}")

        rabbitmq_client.register_handler('nutrition', nutrition_handler)
        rabbitmq_client.register_handler('notifications', notifications_handler)

        # start consuming in background
        asyncio.create_task(rabbitmq_client.consume())

    except Exception as e:
        logger.warning(f"RabbitMQ not available at startup: {e}")


@app.on_event("shutdown")
async def shutdown_event():
    try:
        await rabbitmq_client.disconnect()
    except Exception:
        pass


@app.get("/")
def read_root():
    """Root endpoint"""
    return {
        "message": "Welcome to the Fitness Agent API",
        "documentation": "/docs",
        "version": "1.0.0"
    }


@app.post(f"{settings.API_PREFIX}/auth/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """Generate a JWT token for authentication"""
    # In a real app, we would verify username/password against a database
    # For demo purposes, we'll accept any username/password
    
    # For development/demo, accept any credentials
    if settings.DEMO_MODE:
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": form_data.username}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
    
    # In production, we would validate against a database
    # Check username/password here...
    
    # For now, accept any credentials
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": form_data.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.get(f"{settings.API_PREFIX}/auth/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get information about the current authenticated user"""
    return current_user


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=True)
