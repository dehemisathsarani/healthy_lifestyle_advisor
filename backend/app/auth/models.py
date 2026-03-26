from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    """Schema for creating a new user"""
    name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)
    age: Optional[int] = None
    country: Optional[str] = None
    mobile: Optional[str] = None


class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str


class UserProfile(BaseModel):
    """Schema for user profile response"""
    name: str
    email: EmailStr
    age: Optional[int] = None
    country: Optional[str] = None
    mobile: Optional[str] = None


class Token(BaseModel):
    """Schema for token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Schema for token payload data"""
    sub: str
    name: Optional[str] = None
    exp: datetime


class RefreshToken(BaseModel):
    """Schema for refresh token request"""
    refresh_token: str


class OAuthRequest(BaseModel):
    """Schema for OAuth code exchange"""
    code: str
    redirectUri: str
