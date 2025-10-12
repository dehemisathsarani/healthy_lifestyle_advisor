from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
import json
import uuid
import base64
import logging
from typing import Optional, List, Dict, Any
import aio_pika
from datetime import datetime, timedelta
import motor.motor_asyncio
from bson import ObjectId
import numpy as np

from settings import settings
from simple_mq import simple_mq
from worker import DietWorker
from chain import UserProfile, DietAdvice
from nutrition import BMICalculator, TDEECalculator
from nlp_insights import (
    NLPEnhancedDietAgent, 
    DayNutritionData, 
    HeuristicInsightGenerator,
    AbstractiveSummarizer,
    ReportBlockGenerator
)
from enhanced_image_processor import EnhancedFoodVisionAnalyzer, ImageAnalysisResult
from advanced_food_analyzer import AdvancedFoodAnalyzer
from enhanced_rag_chatbot import enhanced_diet_rag_chatbot, ChatMessage
from enhanced_image_processor import EnhancedFoodVisionAnalyzer, ImageAnalysisResult
from advanced_food_analyzer import AdvancedFoodAnalyzer

# Setup logging
logging.basicConfig(level=getattr(logging, settings.LOG_LEVEL))
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Diet AI Agent API",
    description="AI-powered diet analysis and recommendation service using LangChain and RabbitMQ",
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

# Global connections
rabbitmq_connection = None
rabbitmq_channel = None
db_client = None
db = None

# Initialize NLP-enhanced Diet Agent and Advanced Food Analyzer
nlp_diet_agent = NLPEnhancedDietAgent()
image_processor = None  # Will be initialized in startup
advanced_food_analyzer = None  # Will be initialized in startup

# Request/Response Models
class ImageAnalysisRequest(BaseModel):
    user_profile: UserProfile
    response_queue: Optional[str] = None

class TextMealRequest(BaseModel):
    user_profile: UserProfile
    meal_description: str
    response_queue: Optional[str] = None

class MealPlanRequest(BaseModel):
    user_profile: UserProfile
    current_intake: List[Dict[str, Any]] = []
    response_queue: Optional[str] = None

class HydrationRequest(BaseModel):
    user_id: str
    water_amount_ml: int

class NutritionEntryRequest(BaseModel):
    user_id: str
    nutrition_data: Dict[str, float]

class AnalysisResponse(BaseModel):
    request_id: str
    status: str
    message: str
    estimated_processing_time: Optional[int] = None

class BMIRequest(BaseModel):
    weight_kg: float
    height_cm: float

class TDEERequest(BaseModel):
    weight_kg: float
    height_cm: float
    age: int
    gender: str
    activity_level: str

# RAG Chatbot Models
class ChatRequest(BaseModel):
    user_id: str
    message: str
    context_type: str = "general"  # 'nutrition', 'meal_plan', 'health_goal', 'general'

class ChatResponse(BaseModel):
    message_id: str
    user_id: str
    message: str
    response: str
    timestamp: datetime
    context_type: str
    confidence_score: Optional[float] = None
    sources_used: Optional[List[str]] = None

class ConversationHistoryRequest(BaseModel):
    user_id: str
    limit: int = 10

class NutritionRecommendationsRequest(BaseModel):
    user_id: str

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Initialize connections on startup."""
    global rabbitmq_connection, rabbitmq_channel, db_client, db, image_processor, advanced_food_analyzer, yolo_analyzer
    
    try:
        # Connect to MongoDB
        db_client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URL)
        db = db_client[settings.DATABASE_NAME]
        
        # ✅ Initialize YOLOv8 + Tesseract analyzer (Primary - No Google Vision)
        logger.info("🚀 Initializing YOLOv8 + Tesseract food analyzer...")
        try:
            from yolo_tesseract_analyzer import YOLOTesseractFoodAnalyzer
            yolo_analyzer = YOLOTesseractFoodAnalyzer(
                mongodb_client=db_client,
                db_name=settings.DATABASE_NAME
            )
            logger.info("✅ YOLOv8 + Tesseract analyzer initialized successfully")
        except Exception as e:
            logger.error(f"❌ Failed to initialize YOLO analyzer: {e}")
            yolo_analyzer = None
        
        # Initialize enhanced image processor (Google Vision DISABLED via settings)
        image_processor = EnhancedFoodVisionAnalyzer(db_client, settings.DATABASE_NAME)
        
        # Initialize advanced food analyzer
        advanced_food_analyzer = AdvancedFoodAnalyzer(db_client, settings.DATABASE_NAME)
        
        # Connect to RabbitMQ if configured and enabled
        if settings.DISABLE_RABBITMQ:
            logger.info("RabbitMQ disabled for local development")
            rabbitmq_connection = None
            rabbitmq_channel = None
        elif hasattr(settings, 'USE_SIMPLE_MQ') and settings.USE_SIMPLE_MQ:
            logger.info("Using simple in-memory message queue for local development")
            # Initialize simple message queue
            from simple_mq import simple_mq
            await simple_mq.declare_queue(settings.DIET_QUEUE)
            await simple_mq.declare_queue(settings.NUTRITION_QUEUE)
            await simple_mq.declare_queue(settings.IMAGE_QUEUE)
            logger.info("Simple message queue initialized successfully")
            rabbitmq_connection = "simple_mq"
            rabbitmq_channel = "simple_mq"
        elif hasattr(settings, 'RABBITMQ_URL') and settings.RABBITMQ_URL:
            try:
                rabbitmq_connection = await aio_pika.connect_robust(settings.RABBITMQ_URL)
                rabbitmq_channel = await rabbitmq_connection.channel()
                logger.info("RabbitMQ connection established successfully")
            except Exception as e:
                logger.warning(f"RabbitMQ connection failed, using simple message queue: {e}")
                # Fallback to simple MQ
                from simple_mq import simple_mq
                await simple_mq.declare_queue(settings.DIET_QUEUE)
                await simple_mq.declare_queue(settings.NUTRITION_QUEUE)
                await simple_mq.declare_queue(settings.IMAGE_QUEUE)
                logger.info("Fallback to simple message queue")
                rabbitmq_connection = "simple_mq"
                rabbitmq_channel = "simple_mq"
        else:
            logger.info("RabbitMQ not configured, using simple message queue")
            from simple_mq import simple_mq
            await simple_mq.declare_queue(settings.DIET_QUEUE)
            await simple_mq.declare_queue(settings.NUTRITION_QUEUE)
            await simple_mq.declare_queue(settings.IMAGE_QUEUE)
            rabbitmq_connection = "simple_mq"
            rabbitmq_channel = "simple_mq"
        
        logger.info("API connections and analyzers established successfully")
        
    except Exception as e:
        logger.error(f"Failed to establish connections: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Close connections on shutdown."""
    global rabbitmq_connection, db_client
    
    if rabbitmq_connection and rabbitmq_connection != "simple_mq":
        await rabbitmq_connection.close()
    elif rabbitmq_connection == "simple_mq":
        from simple_mq import simple_mq
        await simple_mq.stop_consuming()
    
    if db_client:
        db_client.close()

# Helper functions
async def send_to_queue(queue_name: str, message_data: Dict[str, Any]) -> str:
    """Send message to queue and return request ID."""
    request_id = str(uuid.uuid4())
    message_data['request_id'] = request_id
    message_data['timestamp'] = datetime.now().isoformat()
    
    if rabbitmq_connection == "simple_mq":
        # Use simple message queue
        from simple_mq import simple_mq
        await simple_mq.publish(queue_name, message_data)
    else:
        # Use RabbitMQ
        queue = await rabbitmq_channel.declare_queue(queue_name, durable=True)
        
        message = aio_pika.Message(
            json.dumps(message_data).encode(),
            delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
        )
        
        await rabbitmq_channel.default_exchange.publish(
            message,
            routing_key=queue_name
        )
    
    return request_id

# API Endpoints

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "message": "Diet AI Agent API is running",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """Detailed health check."""
    try:
        # Check message queue status
        if rabbitmq_connection == "simple_mq":
            from simple_mq import simple_mq
            mq_status = "simple_mq_connected"
            mq_info = simple_mq.get_queue_info()
        elif rabbitmq_connection and not rabbitmq_connection.is_closed:
            mq_status = "rabbitmq_connected"
            mq_info = {"type": "rabbitmq"}
        else:
            mq_status = "disconnected"
            mq_info = {}
        
        # Check MongoDB connection
        await db.command('ping')
        mongodb_status = "connected"
        
        # Check Google Vision API status
        vision_status = "mock_enabled" if settings.USE_MOCK_GOOGLE_VISION else (
            "disabled" if settings.DISABLE_GOOGLE_VISION else "available"
        )
        
        return {
            "status": "healthy",
            "services": {
                "message_queue": mq_status,
                "mongodb": mongodb_status,
                "google_vision": vision_status,
                "queue_info": mq_info
            },
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Health check failed: {str(e)}")

@app.post("/analyze/image", response_model=AnalysisResponse)
async def analyze_food_image(
    request: ImageAnalysisRequest,
    file: UploadFile = File(...)
):
    """Analyze food from uploaded image."""
    try:
        # Validate file
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read and encode image
        image_data = await file.read()
        if len(image_data) > 10 * 1024 * 1024:  # 10MB limit
            raise HTTPException(status_code=400, detail="Image file too large (max 10MB)")
        
        image_b64 = base64.b64encode(image_data).decode()
        
        # Send to image processing queue
        message_data = {
            "type": "image_analysis",
            "user_profile": request.user_profile.dict(),
            "image_data": image_b64,
            "response_queue": request.response_queue
        }
        
        request_id = await send_to_queue(settings.IMAGE_QUEUE, message_data)
        
        return AnalysisResponse(
            request_id=request_id,
            status="processing",
            message="Image analysis started. Results will be available shortly.",
            estimated_processing_time=30
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in image analysis: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# ===========================
# RAG CHATBOT ENDPOINTS
# ===========================

@app.post("/api/chat", response_model=ChatResponse)
async def chat_with_diet_assistant(request: ChatRequest):
    """
    Chat with the RAG-powered Diet Assistant for personalized nutrition advice
    """
    try:
        logger.info(f"Processing chat request for user: {request.user_id}")
        
        # Initialize chatbot if needed
        if not enhanced_diet_rag_chatbot.knowledge_base_initialized:
            await enhanced_diet_rag_chatbot.initialize()
        
        # Process chat message
        chat_message = await enhanced_diet_rag_chatbot.chat(
            user_id=request.user_id,
            message=request.message,
            context_type=request.context_type
        )
        
        return ChatResponse(
            message_id=chat_message.message_id,
            user_id=chat_message.user_id,
            message=chat_message.message,
            response=chat_message.response,
            timestamp=chat_message.timestamp,
            context_type=chat_message.context_type,
            confidence_score=chat_message.confidence_score,
            sources_used=chat_message.sources_used
        )
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")

@app.get("/api/chat/history/{user_id}")
async def get_chat_history(user_id: str, limit: int = 10):
    """
    Get conversation history for a user
    """
    try:
        logger.info(f"Getting chat history for user: {user_id}")
        
        # Initialize chatbot if needed
        if not enhanced_diet_rag_chatbot.knowledge_base_initialized:
            await enhanced_diet_rag_chatbot.initialize()
        
        # Get conversation history
        history = await enhanced_diet_rag_chatbot.get_conversation_history(user_id, limit)
        
        return {
            "user_id": user_id,
            "conversation_count": len(history),
            "conversations": [
                {
                    "message_id": msg.message_id,
                    "message": msg.message,
                    "response": msg.response,
                    "timestamp": msg.timestamp,
                    "context_type": msg.context_type
                }
                for msg in history
            ]
        }
        
    except Exception as e:
        logger.error(f"Error getting chat history: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get chat history: {str(e)}")

@app.post("/api/chat/recommendations")
async def get_personalized_recommendations(request: NutritionRecommendationsRequest):
    """
    Get personalized nutrition recommendations based on user profile and history
    """
    try:
        logger.info(f"Getting recommendations for user: {request.user_id}")
        
        # Initialize chatbot if needed
        if not enhanced_diet_rag_chatbot.knowledge_base_initialized:
            await enhanced_diet_rag_chatbot.initialize()
        
        # Get personalized recommendations
        recommendations = await enhanced_diet_rag_chatbot.get_nutrition_recommendations(request.user_id)
        
        return {
            "user_id": request.user_id,
            "recommendations": recommendations,
            "generated_at": datetime.now(),
            "type": "personalized_nutrition_advice"
        }
        
    except Exception as e:
        logger.error(f"Error getting recommendations: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get recommendations: {str(e)}")

@app.post("/api/chat/context-aware")
async def context_aware_chat(
    user_id: str,
    message: str,
    include_nutrition_data: bool = True,
    include_recent_meals: bool = True
):
    """
    Advanced chat endpoint that includes rich context from user's nutrition data
    """
    try:
        logger.info(f"Processing context-aware chat for user: {user_id}")
        
        # Initialize chatbot if needed
        if not enhanced_diet_rag_chatbot.knowledge_base_initialized:
            await enhanced_diet_rag_chatbot.initialize()
        
        # Determine context type based on message content
        context_type = "general"
        message_lower = message.lower()
        
        if any(word in message_lower for word in ["meal", "food", "eat", "calories", "nutrition"]):
            context_type = "nutrition"
        elif any(word in message_lower for word in ["plan", "schedule", "week", "today", "tomorrow"]):
            context_type = "meal_plan"
        elif any(word in message_lower for word in ["goal", "weight", "lose", "gain", "muscle", "health"]):
            context_type = "health_goal"
        
        # Process chat with enhanced context
        chat_message = await enhanced_diet_rag_chatbot.chat(
            user_id=user_id,
            message=message,
            context_type=context_type
        )
        
        return {
            "message_id": chat_message.message_id,
            "user_id": chat_message.user_id,
            "message": chat_message.message,
            "response": chat_message.response,
            "timestamp": chat_message.timestamp,
            "context_type": chat_message.context_type,
            "confidence_score": chat_message.confidence_score,
            "sources_used": chat_message.sources_used,
            "context_used": {
                "user_profile": bool(chat_message.user_profile),
                "nutrition_context": bool(chat_message.nutrition_context)
            }
        }
        
    except Exception as e:
        logger.error(f"Error in context-aware chat: {e}")
        raise HTTPException(status_code=500, detail=f"Context-aware chat failed: {str(e)}")

@app.get("/api/chat/suggested-questions/{user_id}")
async def get_suggested_questions(user_id: str):
    """
    Get suggested questions based on user's profile and recent activity
    """
    try:
        # Initialize chatbot if needed
        if not enhanced_diet_rag_chatbot.knowledge_base_initialized:
            await enhanced_diet_rag_chatbot.initialize()
        
        # Get user context
        user_profile, nutrition_context = await enhanced_diet_rag_chatbot.get_user_context(user_id)
        
        # Generate suggested questions based on user data
        suggestions = []
        
        if user_profile:
            goal = user_profile.get('goal', '')
            
            if goal == 'weight_loss':
                suggestions.extend([
                    "What are some healthy low-calorie meal ideas?",
                    "How can I reduce my calorie intake without feeling hungry?",
                    "What foods should I avoid for weight loss?"
                ])
            elif goal == 'muscle_gain':
                suggestions.extend([
                    "What are the best protein sources for muscle building?",
                    "How much protein should I eat daily?",
                    "What are good post-workout meals?"
                ])
            elif goal == 'weight_gain':
                suggestions.extend([
                    "What are healthy high-calorie foods?",
                    "How can I increase my appetite naturally?",
                    "What's a good meal plan for healthy weight gain?"
                ])
        
        # Add general nutrition questions
        suggestions.extend([
            "How can I improve my overall nutrition?",
            "What's a balanced daily meal plan?",
            "How much water should I drink daily?",
            "What are some healthy snack options?"
        ])
        
        # Add context-specific questions based on recent nutrition data
        if nutrition_context and nutrition_context.get('recent_foods'):
            suggestions.append("How can I make my recent meals healthier?")
            suggestions.append("Am I getting enough nutrients from my current diet?")
        
        return {
            "user_id": user_id,
            "suggested_questions": suggestions[:8],  # Limit to 8 suggestions
            "categories": {
                "goal_specific": suggestions[:3] if user_profile else [],
                "general_nutrition": suggestions[3:7],
                "personalized": suggestions[7:] if len(suggestions) > 7 else []
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting suggested questions: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get suggestions: {str(e)}")

@app.get("/api/chat/health")
async def get_chatbot_health():
    """
    Get health status of the RAG chatbot system
    """
    try:
        # Initialize chatbot if needed
        if not enhanced_diet_rag_chatbot.knowledge_base_initialized:
            await enhanced_diet_rag_chatbot.initialize()
        
        health_status = await enhanced_diet_rag_chatbot.get_health_status()
        
        return {
            "status": "healthy" if health_status.get("chatbot_initialized") else "degraded",
            "details": health_status,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting chatbot health: {e}")
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@app.get("/api/chat/recommendations/{user_id}")
async def get_nutrition_recommendations(user_id: str):
    """
    Get enhanced personalized nutrition recommendations
    """
    try:
        logger.info(f"Getting nutrition recommendations for user: {user_id}")
        
        # Initialize chatbot if needed
        if not enhanced_diet_rag_chatbot.knowledge_base_initialized:
            await enhanced_diet_rag_chatbot.initialize()
        
        recommendations = await enhanced_diet_rag_chatbot.get_enhanced_nutrition_recommendations(user_id)
        
        return {
            "user_id": user_id,
            "recommendations": recommendations,
            "timestamp": datetime.now().isoformat(),
            "type": "enhanced_personalized"
        }
        
    except Exception as e:
        logger.error(f"Error getting recommendations: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get recommendations: {str(e)}")


# ==================== YOLOv8 + Tesseract Food Analysis ====================

# Global YOLO analyzer instance
yolo_analyzer = None

@app.post("/analyze-food-yolo")
async def analyze_food_with_yolo(
    image: UploadFile = File(...),
    text_description: Optional[str] = None,
    meal_type: str = "lunch",
    user_id: Optional[str] = None
):
    """
    🎯 Analyze food with YOLOv8 object detection + Tesseract OCR
    
    This endpoint uses local AI models for accurate food recognition:
    - YOLOv8: Visual object detection (80+ food categories)
    - Tesseract OCR: Text extraction from labels/packaging
    - Hybrid Intelligence: Combines vision + OCR + user text
    
    Returns individual food items with accurate nutrition from 50+ food database
    """
    global yolo_analyzer
    
    try:
        # Initialize YOLO analyzer if not already done
        if yolo_analyzer is None:
            logger.info("🚀 Initializing YOLOv8 + Tesseract analyzer...")
            from yolo_tesseract_analyzer import YOLOTesseractFoodAnalyzer
            yolo_analyzer = YOLOTesseractFoodAnalyzer(
                mongodb_client=db_client,
                db_name=settings.DATABASE_NAME
            )
            logger.info("✅ YOLO analyzer initialized successfully")
        
        # Read image data
        image_data = await image.read()
        
        # Analyze with YOLO + Tesseract
        logger.info(f"🔍 Analyzing food image: {image.filename}")
        result = await yolo_analyzer.analyze_food_image_yolo(
            image_data=image_data,
            user_id=user_id or "anonymous",
            text_description=text_description,
            meal_type=meal_type
        )
        
        logger.info(f"✅ Analysis complete: Found {len(result.get('detected_foods', []))} food items")
        
        return {
            "success": True,
            "analysis": result,
            "method": "yolov8-tesseract-hybrid",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ YOLO analysis error: {e}", exc_info=True)
        
        # Provide helpful error message
        error_message = str(e)
        if "YOLO" in error_message or "model" in error_message.lower():
            error_message = "YOLOv8 model not found. Please run: pip install ultralytics"
        elif "tesseract" in error_message.lower():
            error_message = "Tesseract OCR not installed. Please install Tesseract from: https://github.com/UB-Mannheim/tesseract/wiki"
        
        raise HTTPException(
            status_code=500, 
            detail=f"Food analysis failed: {error_message}"
        )


@app.get("/yolo-status")
async def check_yolo_status():
    """Check if YOLOv8 + Tesseract analyzer is available"""
    global yolo_analyzer
    
    try:
        if yolo_analyzer is None:
            from yolo_tesseract_analyzer import YOLOTesseractFoodAnalyzer
            yolo_analyzer = YOLOTesseractFoodAnalyzer(
                mongodb_client=db_client,
                db_name=settings.DATABASE_NAME
            )
        
        return {
            "yolo_available": True,
            "tesseract_available": True,
            "status": "ready",
            "message": "YOLOv8 + Tesseract food analyzer is ready"
        }
    except Exception as e:
        return {
            "yolo_available": False,
            "tesseract_available": False,
            "status": "error",
            "message": str(e)
        }


# ==================== NLP Weekly Summary Generation ====================

@app.post("/generate-weekly-report")
async def generate_weekly_report_nlp(
    user_id: str,
    days: int = 7,
    include_insights: bool = True
):
    """
    📊 Generate NLP-powered weekly nutrition summary
    
    Uses NLP techniques to:
    - Analyze 7-10 days of nutrition logs from MongoDB
    - Extract patterns and trends
    - Generate natural language insights
    - Provide personalized recommendations
    """
    try:
        logger.info(f"🔍 Generating weekly report for user: {user_id}")
        
        # Get nutrition logs from MongoDB (last N days)
        nutrition_logs_collection = db["nutrition_logs"]
        
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # Query MongoDB
        cursor = nutrition_logs_collection.find({
            "user_id": user_id,
            "date": {
                "$gte": start_date.isoformat(),
                "$lte": end_date.isoformat()
            }
        }).sort("date", -1).limit(10)  # Get up to 10 logs
        
        logs = await cursor.to_list(length=10)
        
        if not logs:
            return {
                "success": False,
                "message": "No nutrition data found for the specified period",
                "logs_count": 0
            }
        
        logger.info(f"📋 Found {len(logs)} nutrition logs")
        
        # Prepare data for NLP analysis
        nutrition_data = []
        for log in logs:
            nutrition_data.append(DayNutritionData(
                date=log.get("date", ""),
                total_calories=log.get("total_nutrition", {}).get("calories", 0),
                protein=log.get("total_nutrition", {}).get("protein", 0),
                carbs=log.get("total_nutrition", {}).get("carbs", 0),
                fat=log.get("total_nutrition", {}).get("fat", 0),
                fiber=log.get("total_nutrition", {}).get("fiber", 0),
                meals=log.get("meals", [])
            ))
        
        # Generate NLP-powered weekly report
        logger.info("🤖 Generating NLP insights...")
        report = await nlp_diet_agent.generate_weekly_report(
            user_id=user_id,
            nutrition_data=nutrition_data,
            days=days
        )
        
        logger.info("✅ Weekly report generated successfully")
        
        # Calculate additional metrics
        total_calories = sum([log.get("total_nutrition", {}).get("calories", 0) for log in logs])
        avg_calories = total_calories / len(logs) if logs else 0
        
        total_protein = sum([log.get("total_nutrition", {}).get("protein", 0) for log in logs])
        avg_protein = total_protein / len(logs) if logs else 0
        
        # Build response
        return {
            "success": True,
            "period": f"{start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}",
            "logs_count": len(logs),
            "summary": report.get("summary", ""),
            "average_daily_calories": round(avg_calories, 1),
            "average_daily_protein": round(avg_protein, 1),
            "insights": report.get("insights", []),
            "recommendations": report.get("recommendations", []),
            "health_score": report.get("health_score", 75),
            "nutrition_trends": {
                "calories": [log.get("total_nutrition", {}).get("calories", 0) for log in logs],
                "protein": [log.get("total_nutrition", {}).get("protein", 0) for log in logs],
                "carbs": [log.get("total_nutrition", {}).get("carbs", 0) for log in logs],
                "fat": [log.get("total_nutrition", {}).get("fat", 0) for log in logs]
            },
            "generated_at": datetime.now().isoformat(),
            "analysis_method": "nlp_enhanced"
        }
        
    except Exception as e:
        logger.error(f"❌ Weekly report generation error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate weekly report: {str(e)}"
        )


@app.get("/nutrition-logs/{user_id}")
async def get_nutrition_logs(
    user_id: str,
    limit: int = 10,
    skip: int = 0
):
    """
    📋 Get nutrition logs from MongoDB
    
    Returns recent nutrition logs for analysis and display
    """
    try:
        nutrition_logs_collection = db["nutrition_logs"]
        
        cursor = nutrition_logs_collection.find({
            "user_id": user_id
        }).sort("date", -1).skip(skip).limit(limit)
        
        logs = await cursor.to_list(length=limit)
        
        # Convert ObjectId to string
        for log in logs:
            if "_id" in log:
                log["_id"] = str(log["_id"])
        
        return {
            "success": True,
            "logs": logs,
            "count": len(logs)
        }
        
    except Exception as e:
        logger.error(f"Error fetching nutrition logs: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8001, 
        reload=True,
        log_level="info"
    )
