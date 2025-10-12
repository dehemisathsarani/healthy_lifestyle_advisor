from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
from bson import ObjectId

class PyObjectId(str):
    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        from pydantic_core import core_schema
        return core_schema.union_schema([
            core_schema.is_instance_schema(ObjectId),
            core_schema.chain_schema([
                core_schema.str_schema(),
                core_schema.no_info_plain_validator_function(cls.validate),
            ])
        ])
    
    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return str(v)
        if isinstance(v, str) and ObjectId.is_valid(v):
            return str(ObjectId(v))
        raise ValueError("Invalid ObjectId")

class GenderEnum(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"

class ActivityLevelEnum(str, Enum):
    SEDENTARY = "sedentary"
    LIGHTLY_ACTIVE = "lightly_active"
    MODERATELY_ACTIVE = "moderately_active"
    VERY_ACTIVE = "very_active"
    EXTRA_ACTIVE = "extra_active"

class GoalEnum(str, Enum):
    WEIGHT_LOSS = "weight_loss"
    MAINTENANCE = "maintenance"
    WEIGHT_GAIN = "weight_gain"

class FoodItem(BaseModel):
    """Individual food item in a meal"""
    name: str = Field(..., description="Name of the food item")
    calories: float = Field(..., ge=0, description="Calories in the food item")
    protein: float = Field(..., ge=0, description="Protein content in grams")
    carbs: float = Field(..., ge=0, description="Carbohydrate content in grams")
    fat: float = Field(..., ge=0, description="Fat content in grams")
    quantity: str = Field(..., description="Quantity/portion size")
    confidence: Optional[float] = Field(None, ge=0, le=1, description="AI confidence score")

class UserProfile(BaseModel):
    """User profile for diet tracking"""
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    name: str = Field(..., min_length=1, max_length=100, description="User's full name")
    email: EmailStr = Field(..., description="User's email address")
    age: int = Field(..., ge=13, le=120, description="User's age in years")
    weight: float = Field(..., ge=20, le=500, description="User's weight in kg")
    height: float = Field(..., ge=100, le=250, description="User's height in cm")
    gender: GenderEnum = Field(..., description="User's gender")
    activity_level: ActivityLevelEnum = Field(..., description="User's activity level")
    goal: GoalEnum = Field(..., description="User's fitness goal")
    preferences: Optional[List[str]] = Field(default=[], description="Dietary preferences")
    allergies: Optional[List[str]] = Field(default=[], description="Food allergies")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Calculated fields
    bmi: Optional[float] = Field(None, description="Body Mass Index")
    bmr: Optional[float] = Field(None, description="Basal Metabolic Rate")
    tdee: Optional[float] = Field(None, description="Total Daily Energy Expenditure")
    daily_calorie_goal: Optional[float] = Field(None, description="Daily calorie target")
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        schema_extra = {
            "example": {
                "name": "John Doe",
                "email": "john.doe@example.com",
                "age": 30,
                "weight": 75.0,
                "height": 175.0,
                "gender": "male",
                "activity_level": "moderately_active",
                "goal": "maintenance",
                "preferences": ["vegetarian", "low-sodium"],
                "allergies": ["nuts", "shellfish"]
            }
        }
    
    @field_validator('updated_at', mode='before')
    @classmethod
    def set_updated_at(cls, v):
        return datetime.utcnow()

class UserProfileCreate(BaseModel):
    """Model for creating a new user profile"""
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    age: int = Field(..., ge=13, le=120)
    weight: float = Field(..., ge=20, le=500)
    height: float = Field(..., ge=100, le=250)
    gender: GenderEnum
    activity_level: ActivityLevelEnum
    goal: GoalEnum
    preferences: Optional[List[str]] = Field(default=[])
    allergies: Optional[List[str]] = Field(default=[])

class UserProfileUpdate(BaseModel):
    """Model for updating user profile"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    age: Optional[int] = Field(None, ge=13, le=120)
    weight: Optional[float] = Field(None, ge=20, le=500)
    height: Optional[float] = Field(None, ge=100, le=250)
    gender: Optional[GenderEnum] = None
    activity_level: Optional[ActivityLevelEnum] = None
    goal: Optional[GoalEnum] = None
    preferences: Optional[List[str]] = None
    allergies: Optional[List[str]] = None

class MealAnalysis(BaseModel):
    """Meal analysis result"""
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId = Field(..., description="Reference to user profile")
    food_items: List[FoodItem] = Field(..., description="List of detected food items")
    total_calories: float = Field(..., ge=0, description="Total calories in the meal")
    total_protein: float = Field(..., ge=0, description="Total protein in grams")
    total_carbs: float = Field(..., ge=0, description="Total carbohydrates in grams")
    total_fat: float = Field(..., ge=0, description="Total fat in grams")
    analysis_method: str = Field(..., description="Method used for analysis (image/text/hybrid)")
    image_url: Optional[str] = Field(None, description="URL to uploaded image")
    text_description: Optional[str] = Field(None, description="Text description provided")
    confidence_score: Optional[float] = Field(None, ge=0, le=1, description="Overall analysis confidence")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    meal_type: Optional[str] = Field(None, description="breakfast/lunch/dinner/snack")
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class MealAnalysisCreate(BaseModel):
    """Model for creating meal analysis"""
    user_id: str = Field(..., description="User ID")
    food_items: List[FoodItem]
    total_calories: float = Field(..., ge=0)
    total_protein: float = Field(..., ge=0)
    total_carbs: float = Field(..., ge=0)
    total_fat: float = Field(..., ge=0)
    analysis_method: str
    image_url: Optional[str] = None
    text_description: Optional[str] = None
    confidence_score: Optional[float] = None
    meal_type: Optional[str] = None

class DailyNutritionSummary(BaseModel):
    """Daily nutrition summary"""
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId = Field(..., description="Reference to user profile")
    date: datetime = Field(..., description="Date for this summary")
    total_calories: float = Field(default=0, ge=0)
    total_protein: float = Field(default=0, ge=0)
    total_carbs: float = Field(default=0, ge=0)
    total_fat: float = Field(default=0, ge=0)
    meal_count: int = Field(default=0, ge=0)
    meals: List[PyObjectId] = Field(default=[], description="References to meal analyses")
    calorie_goal: float = Field(..., ge=0, description="Daily calorie goal")
    goal_achieved: bool = Field(default=False, description="Whether daily goal was achieved")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class NutritionGoals(BaseModel):
    """User's nutrition goals and targets"""
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId = Field(..., description="Reference to user profile")
    daily_calories: float = Field(..., ge=0, description="Daily calorie target")
    daily_protein: float = Field(..., ge=0, description="Daily protein target in grams")
    daily_carbs: float = Field(..., ge=0, description="Daily carbs target in grams")
    daily_fat: float = Field(..., ge=0, description="Daily fat target in grams")
    weekly_weight_change: float = Field(default=0, description="Target weight change per week in kg")
    target_weight: Optional[float] = Field(None, ge=20, le=500, description="Target weight in kg")
    target_date: Optional[datetime] = Field(None, description="Target achievement date")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# Health calculation utilities
class HealthCalculations:
    """Utility class for health-related calculations"""
    
    @staticmethod
    def calculate_bmi(weight_kg: float, height_cm: float) -> float:
        """Calculate Body Mass Index"""
        height_m = height_cm / 100
        return round(weight_kg / (height_m ** 2), 1)
    
    @staticmethod
    def calculate_bmr(weight_kg: float, height_cm: float, age: int, gender: str) -> float:
        """Calculate Basal Metabolic Rate using Mifflin-St Jeor Equation"""
        if gender.lower() == 'male':
            bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
        else:  # female or other
            bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161
        return round(bmr, 1)
    
    @staticmethod
    def calculate_tdee(bmr: float, activity_level: str) -> float:
        """Calculate Total Daily Energy Expenditure"""
        activity_multipliers = {
            'sedentary': 1.2,
            'lightly_active': 1.375,
            'moderately_active': 1.55,
            'very_active': 1.725,
            'extra_active': 1.9
        }
        multiplier = activity_multipliers.get(activity_level, 1.55)
        return round(bmr * multiplier, 1)
    
    @staticmethod
    def calculate_calorie_goal(tdee: float, goal: str) -> float:
        """Calculate daily calorie goal based on fitness goal"""
        if goal == 'weight_loss':
            return round(tdee - 500, 1)  # 500 calorie deficit for ~0.5kg/week loss
        elif goal == 'weight_gain':
            return round(tdee + 500, 1)  # 500 calorie surplus for ~0.5kg/week gain
        else:  # maintenance
            return round(tdee, 1)
    
    @staticmethod
    def get_bmi_category(bmi: float) -> str:
        """Get BMI category based on WHO standards"""
        if bmi < 18.5:
            return "Underweight"
        elif 18.5 <= bmi < 25:
            return "Normal weight"
        elif 25 <= bmi < 30:
            return "Overweight"
        else:
            return "Obese"

# Response models
class UserProfileResponse(UserProfile):
    """Response model for user profile with calculated fields"""
    bmi_category: Optional[str] = Field(None, description="BMI category")

class ApiResponse(BaseModel):
    """Standard API response wrapper"""
    success: bool
    message: str
    data: Optional[Any] = None
    error: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class PaginatedResponse(BaseModel):
    """Paginated response wrapper"""
    success: bool
    message: str
    data: List[Any]
    total: int
    page: int
    per_page: int
    total_pages: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# Additional models for nutrition logging and analysis
class NutritionData(BaseModel):
    """Nutrition data for a meal or day"""
    calories: float = Field(default=0, ge=0)
    protein: float = Field(default=0, ge=0)
    carbs: float = Field(default=0, ge=0)
    fat: float = Field(default=0, ge=0)
    fiber: Optional[float] = Field(default=0, ge=0)

class NutritionLog(BaseModel):
    """Nutrition log entry"""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: str = Field(..., description="User ID")
    date: str = Field(..., description="Date in YYYY-MM-DD format")
    meals: List[FoodItem] = Field(default=[], description="List of food items")
    total_nutrition: NutritionData = Field(..., description="Total nutrition for the day")
    meal_type: Optional[str] = Field(None, description="breakfast/lunch/dinner/snack")
    notes: Optional[str] = None
    analysis_method: Optional[str] = Field(None, description="Method used for analysis")
    image_url: Optional[str] = None
    text_input: Optional[str] = None
    ai_insights: List[str] = Field(default=[], description="AI-generated insights")
    confidence_score: Optional[float] = Field(None, ge=0, le=1)
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class NutritionLogCreate(BaseModel):
    """Model for creating nutrition log"""
    meals: List[FoodItem]
    meal_type: Optional[str] = None
    notes: Optional[str] = None
    analysis_method: Optional[str] = None
    image_url: Optional[str] = None
    text_input: Optional[str] = None
    ai_insights: Optional[List[str]] = None

class NutritionLogUpdate(BaseModel):
    """Model for updating nutrition log"""
    meals: Optional[List[FoodItem]] = None
    meal_type: Optional[str] = None
    notes: Optional[str] = None

class PaginatedNutritionLogs(BaseModel):
    """Paginated nutrition logs response"""
    logs: List[NutritionLog]
    total: int
    page: int
    per_page: int

class UserNutritionPreferences(BaseModel):
    """User nutrition preferences"""
    dietary_restrictions: Optional[List[str]] = Field(default=[])
    allergies: Optional[List[str]] = Field(default=[])
    favorite_foods: Optional[List[str]] = Field(default=[])
    disliked_foods: Optional[List[str]] = Field(default=[])

class FoodAnalysisRequest(BaseModel):
    """Request for food analysis"""
    image_url: Optional[str] = None
    text_description: Optional[str] = None
    meal_type: Optional[str] = None

class FoodAnalysisResponse(BaseModel):
    """Response from food analysis"""
    food_items: List[FoodItem]
    total_nutrition: NutritionData
    confidence_score: float
    ai_insights: List[str]
    analysis_method: str

class WeeklyReportRequest(BaseModel):
    """Request for weekly report"""
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class WeeklyReport(BaseModel):
    """Weekly nutrition report"""
    start_date: str
    end_date: str
    total_logs: int
    average_nutrition: NutritionData
    daily_summaries: List[Dict[str, Any]]
    insights: List[str]
    recommendations: List[str]

class NutritionCalculations:
    """Utility class for nutrition calculations"""
    
    @staticmethod
    def calculate_total_nutrition(meals: List[FoodItem]) -> NutritionData:
        """Calculate total nutrition from meals"""
        total = NutritionData()
        for meal in meals:
            total.calories += meal.calories
            total.protein += meal.protein
            total.carbs += meal.carbs
            total.fat += meal.fat
        return total
