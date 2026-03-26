from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import OAuth2PasswordRequestForm
from typing import Dict, Any, Optional

from app.auth.models import (
    UserCreate, 
    UserLogin, 
    UserProfile, 
    Token, 
    RefreshToken, 
    OAuthRequest
)
from app.auth.jwt import (
    create_access_token, 
    create_refresh_token, 
    decode_refresh_token
)
from app.auth.users import (
    create_user, 
    verify_user_credentials, 
    store_refresh_token,
    verify_refresh_token,
    invalidate_refresh_token,
    invalidate_all_refresh_tokens,
    get_user_by_id
)
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserCreate):
    """
    Register a new user
    
    Creates a new user account with the provided information
    """
    print(f"🔄 Registration endpoint called with data: {user_data.model_dump(exclude={'password'})}")
    
    user = await create_user(user_data)
    if not user:
        print(f"❌ User creation failed for email: {user_data.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    print(f"✅ User created successfully: {user.get('email')} with ID: {user.get('_id')}")
    
    # Create access and refresh tokens
    access_token = create_access_token(
        data={"sub": user["_id"], "name": user["name"]}
    )
    refresh_token = create_refresh_token(
        data={"sub": user["_id"], "name": user["name"]}
    )
    
    print(f"✅ Tokens created for user: {user.get('email')}")
    
    # Store refresh token
    await store_refresh_token(user["_id"], refresh_token)
    print(f"✅ Refresh token stored for user: {user.get('email')}")
    
    # Create user profile response
    user_profile = {
        "name": user["name"],
        "email": user["email"]
    }
    
    # Add optional fields if present
    for field in ["age", "country", "mobile"]:
        if field in user and user[field]:
            user_profile[field] = user[field]
    
    response_data = {
        "accessToken": access_token,
        "refreshToken": refresh_token,
        "user": user_profile
    }
    
    print(f"✅ Registration successful for {user_data.email}, returning response")
    return response_data


@router.post("/login", response_model=Dict[str, Any])
async def login_user(user_data: UserLogin):
    """
    User login
    
    Authenticates a user and returns access and refresh tokens
    """
    user = await verify_user_credentials(user_data.email, user_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access and refresh tokens
    access_token = create_access_token(
        data={"sub": user["_id"], "name": user["name"]}
    )
    refresh_token = create_refresh_token(
        data={"sub": user["_id"], "name": user["name"]}
    )
    
    # Store refresh token
    await store_refresh_token(user["_id"], refresh_token)
    
    # Create user profile response
    user_profile = {
        "name": user["name"],
        "email": user["email"]
    }
    
    # Add optional fields if present
    for field in ["age", "country", "mobile"]:
        if field in user and user[field]:
            user_profile[field] = user[field]
    
    return {
        "accessToken": access_token,
        "refreshToken": refresh_token,
        "user": user_profile
    }


@router.post("/refresh", response_model=Dict[str, Any])
async def refresh_access_token(refresh_request: RefreshToken):
    """
    Refresh access token
    
    Uses a valid refresh token to generate a new access token
    """
    # Decode refresh token
    token_data = decode_refresh_token(refresh_request.refresh_token)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify token exists in database
    user_id = token_data.sub
    if not await verify_refresh_token(user_id, refresh_request.refresh_token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user to verify existence
    user = await get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create new tokens
    access_token = create_access_token(
        data={"sub": user_id, "name": user["name"]}
    )
    new_refresh_token = create_refresh_token(
        data={"sub": user_id, "name": user["name"]}
    )
    
    # Store new refresh token and invalidate old one
    await store_refresh_token(user_id, new_refresh_token)
    await invalidate_refresh_token(user_id, refresh_request.refresh_token)
    
    return {
        "accessToken": access_token,
        "refreshToken": new_refresh_token
    }


@router.get("/me", response_model=UserProfile)
async def get_current_user_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Get current user profile
    
    Returns the profile of the authenticated user
    """
    # Create profile response
    profile = {
        "name": current_user["name"],
        "email": current_user["email"]
    }
    
    # Add optional fields if present
    for field in ["age", "country", "mobile"]:
        if field in current_user and current_user[field]:
            profile[field] = current_user[field]
    
    return profile


@router.post("/logout")
async def logout(
    response: Response,
    refresh_token: Optional[RefreshToken] = None,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Logout user
    
    Invalidates the provided refresh token or all refresh tokens
    """
    user_id = current_user["_id"]
    
    if refresh_token and refresh_token.refresh_token:
        # Logout from single device
        await invalidate_refresh_token(user_id, refresh_token.refresh_token)
    else:
        # Logout from all devices
        await invalidate_all_refresh_tokens(user_id)
    
    response.delete_cookie(key="access_token")
    response.delete_cookie(key="refresh_token")
    
    return {"message": "Successfully logged out"}


# For Token acquisition from form data (Swagger UI compatibility)
@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    OAuth2 compatible token login
    
    This endpoint is compatible with OAuth2 password flow
    """
    user = await verify_user_credentials(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create tokens
    access_token = create_access_token(
        data={"sub": user["_id"], "name": user["name"]}
    )
    refresh_token = create_refresh_token(
        data={"sub": user["_id"], "name": user["name"]}
    )
    
    # Store refresh token
    await store_refresh_token(user["_id"], refresh_token)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }
