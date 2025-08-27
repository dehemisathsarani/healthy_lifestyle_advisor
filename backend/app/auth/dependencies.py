from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from typing import Optional, Dict, Any

from app.auth.jwt import decode_token
from app.auth.users import get_user_by_id

# OAuth2PasswordBearer for token extraction from request
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login",
    auto_error=False  # Don't auto-raise errors, we'll handle them
)

async def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """
    Dependency to get the current authenticated user
    
    This validates the JWT token and returns the user if valid
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Handle missing token
    if not token:
        raise credentials_exception
    
    # Decode and validate token
    token_data = decode_token(token)
    if token_data is None:
        raise credentials_exception
    
    # Get user from database
    user = await get_user_by_id(token_data.sub)
    if user is None:
        raise credentials_exception
    
    # Remove sensitive data
    user.pop("password", None)
    user.pop("refresh_tokens", None)
    
    return user

async def get_optional_user(token: str = Depends(oauth2_scheme)) -> Optional[Dict[str, Any]]:
    """
    Dependency to optionally get the current user
    
    Does not raise exceptions if no user is found
    """
    if not token:
        return None
    
    try:
        # Decode and validate token
        token_data = decode_token(token)
        if token_data is None:
            return None
        
        # Get user from database
        user = await get_user_by_id(token_data.sub)
        if user is None:
            return None
        
        # Remove sensitive data
        user.pop("password", None)
        user.pop("refresh_tokens", None)
        
        return user
    except:
        return None


def get_token_from_request(request: Request) -> Optional[str]:
    """Extract token from authorization header in any request"""
    authorization = request.headers.get("Authorization")
    if not authorization:
        return None
    
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    
    return parts[1]
