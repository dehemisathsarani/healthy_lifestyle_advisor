from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from typing import List

from auth import create_access_token, get_current_user
from settings import settings
from routers import users, workouts, dashboard, health

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
