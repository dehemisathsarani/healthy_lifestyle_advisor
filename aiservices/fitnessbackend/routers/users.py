from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
import uuid
from datetime import datetime, timedelta

from auth import get_current_user
from models import UserProfile, UserProfileCreate, UserProfileBase
from settings import settings
from utils import get_demo_user_profile

router = APIRouter(prefix=f"{settings.API_PREFIX}/users", tags=["users"])


@router.post("/profile", response_model=UserProfile)
async def create_user_profile(
    profile: UserProfileBase,
    current_user: dict = Depends(get_current_user)
):
    """Create a new user profile"""
    if settings.DEMO_MODE:
        # In demo mode, return a mock profile
        mock_profile = get_demo_user_profile()
        mock_profile.name = profile.name
        mock_profile.age = profile.age
        mock_profile.gender = profile.gender
        mock_profile.height_cm = profile.height_cm
        mock_profile.weight_kg = profile.weight_kg
        mock_profile.fitness_level = profile.fitness_level
        mock_profile.fitness_goal = profile.fitness_goal
        return mock_profile
    
    # In production, we would save to the database
    profile_data = profile.dict()
    profile_data["user_id"] = current_user["id"]
    profile_data["id"] = str(uuid.uuid4())
    profile_data["created_at"] = datetime.now()
    profile_data["updated_at"] = datetime.now()
    
    # TODO: Save to database
    
    return UserProfile(**profile_data)


@router.get("/profile", response_model=UserProfile)
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    """Get the current user's profile"""
    if settings.DEMO_MODE:
        # In demo mode, return a mock profile
        return get_demo_user_profile()
    
    # In production, we would query the database
    # TODO: Query database for user profile
    
    # Mock response for now
    return get_demo_user_profile()


@router.put("/profile", response_model=UserProfile)
async def update_user_profile(
    profile: UserProfileBase,
    current_user: dict = Depends(get_current_user)
):
    """Update the current user's profile"""
    if settings.DEMO_MODE:
        # In demo mode, return the updated mock profile
        mock_profile = get_demo_user_profile()
        mock_profile.name = profile.name
        mock_profile.age = profile.age
        mock_profile.gender = profile.gender
        mock_profile.height_cm = profile.height_cm
        mock_profile.weight_kg = profile.weight_kg
        mock_profile.fitness_level = profile.fitness_level
        mock_profile.fitness_goal = profile.fitness_goal
        mock_profile.updated_at = datetime.now()
        return mock_profile
    
    # In production, we would update the database
    # TODO: Update user profile in database
    
    # Mock response for now
    updated_profile = get_demo_user_profile()
    updated_profile.name = profile.name
    updated_profile.age = profile.age
    updated_profile.gender = profile.gender
    updated_profile.height_cm = profile.height_cm
    updated_profile.weight_kg = profile.weight_kg
    updated_profile.fitness_level = profile.fitness_level
    updated_profile.fitness_goal = profile.fitness_goal
    updated_profile.updated_at = datetime.now()
    
    return updated_profile
