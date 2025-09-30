import jwt
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import motor.motor_asyncio
import logging

from settings import settings

logger = logging.getLogger(__name__)

# Security
security = HTTPBearer()

def hash_password(password: str) -> str:
    """Hash password using SHA-256 with salt."""
    salt = secrets.token_hex(16)
    return hashlib.sha256((password + salt).encode()).hexdigest() + ':' + salt

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash."""
    try:
        password_hash, salt = hashed.split(':')
        return hashlib.sha256((password + salt).encode()).hexdigest() == password_hash
    except ValueError:
        return False

def create_jwt_token(payload: Dict[str, Any]) -> str:
    """Create JWT token with expiration."""
    # Add expiration time
    payload['exp'] = datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
    payload['iat'] = datetime.utcnow()
    
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

def verify_jwt_token(token: str) -> Dict[str, Any]:
    """Verify and decode JWT token."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """Dependency to verify JWT token from request headers."""
    return verify_jwt_token(credentials.credentials)

async def get_current_user(token_data: Dict[str, Any] = Depends(verify_token)) -> Dict[str, Any]:
    """Get current user from token data."""
    user_id = token_data.get('user_id')
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    return token_data

def validate_file_type(content_type: str) -> bool:
    """Validate uploaded file type."""
    return content_type in settings.ALLOWED_IMAGE_TYPES

def validate_file_size(file_size: int) -> bool:
    """Validate uploaded file size."""
    max_size_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    return file_size <= max_size_bytes

def generate_unique_id() -> str:
    """Generate unique ID for resources."""
    return secrets.token_urlsafe(16)

def format_nutrition_data(nutrition: Dict[str, Any]) -> Dict[str, float]:
    """Format and validate nutrition data."""
    formatted = {
        'calories': float(nutrition.get('calories', 0)),
        'protein': float(nutrition.get('protein', 0)),
        'carbs': float(nutrition.get('carbs', 0)),
        'fat': float(nutrition.get('fat', 0)),
        'fiber': float(nutrition.get('fiber', 0)),
        'sugar': float(nutrition.get('sugar', 0)),
        'sodium': float(nutrition.get('sodium', 0))
    }
    
    # Validate ranges
    for key, value in formatted.items():
        if value < 0:
            formatted[key] = 0.0
    
    return formatted

def calculate_calorie_percentage(consumed: float, target: float) -> float:
    """Calculate percentage of calories consumed vs target."""
    if target <= 0:
        return 0.0
    return min((consumed / target) * 100, 200.0)  # Cap at 200%

def get_macro_balance_status(protein_pct: float, carbs_pct: float, fat_pct: float) -> str:
    """Determine macro balance status."""
    # Ideal ranges: Protein 10-35%, Carbs 45-65%, Fat 20-35%
    if (10 <= protein_pct <= 35 and 
        45 <= carbs_pct <= 65 and 
        20 <= fat_pct <= 35):
        return "balanced"
    elif protein_pct < 10:
        return "low_protein"
    elif protein_pct > 35:
        return "high_protein"
    elif carbs_pct < 45:
        return "low_carbs"
    elif carbs_pct > 65:
        return "high_carbs"
    elif fat_pct < 20:
        return "low_fat"
    elif fat_pct > 35:
        return "high_fat"
    else:
        return "unbalanced"

def generate_recommendations(
    calorie_pct: float, 
    macro_status: str, 
    hydration_pct: float,
    meal_count: int
) -> list[str]:
    """Generate health recommendations based on daily intake."""
    recommendations = []
    
    # Calorie recommendations
    if calorie_pct < 80:
        recommendations.append("💡 You're under your calorie goal. Consider adding a healthy snack.")
    elif calorie_pct > 110:
        recommendations.append("⚠️ You've exceeded your calorie goal. Try lighter portions for your next meal.")
    
    # Macro recommendations
    if macro_status == "low_protein":
        recommendations.append("🥩 Add more protein-rich foods like lean meats, fish, legumes, or Greek yogurt.")
    elif macro_status == "high_protein":
        recommendations.append("🥗 Balance your protein with more vegetables and whole grains.")
    elif macro_status == "low_carbs":
        recommendations.append("🍞 Include healthy carbs like whole grains, fruits, and vegetables.")
    elif macro_status == "high_carbs":
        recommendations.append("🥑 Add healthy fats and reduce simple carbohydrates.")
    elif macro_status == "low_fat":
        recommendations.append("🥑 Include healthy fats like avocado, nuts, and olive oil.")
    elif macro_status == "high_fat":
        recommendations.append("🥗 Reduce fatty foods and add more vegetables and lean proteins.")
    
    # Hydration recommendations
    if hydration_pct < 50:
        recommendations.append("💧 You're dehydrated! Drink more water throughout the day.")
    elif hydration_pct < 80:
        recommendations.append("💦 Good hydration! Keep drinking water regularly.")
    
    # Meal frequency recommendations
    if meal_count < 3:
        recommendations.append("🍽️ Try to have at least 3 balanced meals per day.")
    elif meal_count > 6:
        recommendations.append("🕐 Consider larger, more satisfying meals instead of frequent snacking.")
    
    return recommendations

def format_error_response(error: Exception, request_id: Optional[str] = None) -> Dict[str, Any]:
    """Format error response for API endpoints."""
    return {
        "error": type(error).__name__,
        "detail": str(error),
        "timestamp": datetime.now().isoformat(),
        "request_id": request_id
    }

class DatabaseManager:
    """Database connection and operation manager."""
    
    def __init__(self):
        self.client = None
        self.db = None
    
    async def connect(self):
        """Connect to MongoDB."""
        try:
            self.client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URL)
            self.db = self.client[settings.DATABASE_NAME]
            
            # Test connection
            await self.client.admin.command('ping')
            logger.info("Connected to MongoDB successfully")
            
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise
    
    async def disconnect(self):
        """Disconnect from MongoDB."""
        if self.client:
            self.client.close()
            logger.info("Disconnected from MongoDB")
    
    async def create_indexes(self):
        """Create database indexes for better performance."""
        try:
            # User indexes
            await self.db.users.create_index("email", unique=True)
            await self.db.users.create_index("user_id", unique=True)
            
            # Meal entry indexes
            await self.db.meal_entries.create_index([
                ("user_id", 1), 
                ("timestamp", -1)
            ])
            await self.db.meal_entries.create_index("request_id")
            
            # Hydration indexes
            await self.db.hydration_entries.create_index([
                ("user_id", 1), 
                ("date", 1)
            ], unique=True)
            
            # Analysis result indexes
            await self.db.analysis_results.create_index("request_id", unique=True)
            await self.db.analysis_results.create_index([
                ("timestamp", -1)
            ])
            
            logger.info("Database indexes created successfully")
            
        except Exception as e:
            logger.error(f"Failed to create indexes: {e}")

# Global database manager instance
db_manager = DatabaseManager()