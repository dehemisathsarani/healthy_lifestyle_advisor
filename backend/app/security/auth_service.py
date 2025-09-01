from datetime import datetime, timedelta
from typing import Optional, Dict
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from .data_models import AccessToken, AccessPermission
import os

# OAuth2 configuration
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# JWT settings
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key")  # Change in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

class AuthService:
    def __init__(self):
        """Initialize authentication service"""
        self.secret_key = SECRET_KEY
        self.algorithm = ALGORITHM
        self.access_token_expire_minutes = ACCESS_TOKEN_EXPIRE_MINUTES

    def create_access_token(self, data: Dict) -> AccessToken:
        """Create JWT access token"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        to_encode.update({"exp": expire})
        
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        refresh_token = self._create_refresh_token(data)
        
        return AccessToken(
            token=encoded_jwt,
            token_type="bearer",
            expires_in=self.access_token_expire_minutes * 60,
            refresh_token=refresh_token
        )

    def _create_refresh_token(self, data: Dict) -> str:
        """Create refresh token with longer expiry"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=7)  # 7 days expiry for refresh token
        to_encode.update({"exp": expire, "refresh": True})
        
        return jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)

    def verify_token(self, token: str) -> Dict:
        """Verify JWT token and return payload"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

    def get_current_user(
        self,
        token: str = Depends(oauth2_scheme)
    ) -> Dict:
        """Get current user from token"""
        return self.verify_token(token)

    def check_permission(
        self,
        user: Dict,
        required_permission: str
    ) -> bool:
        """Check if user has required permission"""
        try:
            user_permissions = user.get("permissions", [])
            return required_permission in user_permissions
        except Exception:
            return False

    def create_permission(
        self,
        user_id: str,
        role: str,
        permissions: list[str],
        access_level: str,
        expires_in_days: int = 30
    ) -> AccessPermission:
        """Create new access permission"""
        return AccessPermission(
            user_id=user_id,
            role=role,
            permissions=permissions,
            access_level=access_level,
            expires_at=datetime.utcnow() + timedelta(days=expires_in_days)
        )

    def get_role_permissions(self, role: str) -> list[str]:
        """Get default permissions for a role"""
        role_permissions = {
            "doctor": [
                "read:health_summary",
                "read:detailed_health",
                "write:health_notes",
                "read:mental_health"
            ],
            "coach": [
                "read:fitness_data",
                "read:diet_summary",
                "write:workout_plan"
            ],
            "user": [
                "read:own_data",
                "write:own_data",
                "manage:privacy"
            ]
        }
        return role_permissions.get(role, [])
