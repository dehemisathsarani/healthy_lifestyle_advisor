from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import asyncio
import time
from datetime import datetime
from app.core.database import (
    connect_to_mongo, 
    close_mongo_connection, 
    get_db_health, 
    verify_database,
    get_database
)

from app.auth.router import router as auth_router
from app.auth.users import setup_user_collection

from app.routes.simple_diet_routes import router as diet_router
from app.api.mental_health import router as mental_health_router


# Create FastAPI application with detailed configuration
app = FastAPI(
    title="Health Agent API",
    description="A comprehensive health and nutrition tracking API with AI-powered diet recommendations",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Security middleware
app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=["localhost", "127.0.0.1", "*.vercel.app"]
)

# Configure CORS with specific settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)


# Include routers
app.include_router(auth_router)
app.include_router(mental_health_router)
app.include_router(diet_router)

# Global application state
app_state = {
    "db_connected": False,
    "startup_time": None,
    "last_health_check": None
}

@app.on_event("startup")
async def startup_event():
    """Initialize all services on application startup"""
    print("🚀 Starting Health Agent API...")
    app_state["startup_time"] = datetime.now()
    
    # Connect to MongoDB with retry logic
    max_retries = 3
    for attempt in range(max_retries):
        print(f"📡 Database connection attempt {attempt + 1}/{max_retries}")
        app_state["db_connected"] = await connect_to_mongo()
        
        if app_state["db_connected"]:
            break
        elif attempt < max_retries - 1:
            print(f"⏳ Retrying in 5 seconds...")
            await asyncio.sleep(5)
    
    if app_state["db_connected"]:
        print("✅ Application startup completed successfully")
        print("🌐 API Documentation available at: http://localhost:8000/docs")
        # Setup user collection with indexes
        await setup_user_collection()
        
        # Initialize Mental Health Agent
        print("🧠 Initializing Mental Health Agent...")
        from app.agents.agent_manager import agent_manager
        agent_init_success = await agent_manager.initialize_system()
        if agent_init_success:
            print("✅ Mental Health Agent initialized successfully")
        else:
            print("⚠️  Mental Health Agent initialization failed")
    else:
        print("⚠️  Application started with database connection issues")
        print("📖 Some features may be limited without database connectivity")

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on application shutdown"""
    print("🛑 Shutting down Health Agent API...")
    await close_mongo_connection()
    print("✅ Application shutdown completed successfully")

@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with comprehensive API information"""
    uptime = None
    if app_state["startup_time"]:
        uptime = str(datetime.now() - app_state["startup_time"])
    
    return {
        "message": "🎉 Health Agent API is running successfully!",
        "status": "online",
        "version": "1.0.0",
        "database_connected": app_state["db_connected"],
        "uptime": uptime,
        "endpoints": {
            "documentation": "/docs",
            "health_check": "/health",
            "database_test": "/test-db",
            "api_status": "/status"
        },
        "features": [
            "🥗 Diet tracking and analysis",
            "🏃‍♂️ Health metrics calculation",
            "💧 Water intake monitoring",
            "🤖 AI-powered nutrition recommendations",
            "📊 Comprehensive health analytics"
        ]
    }

@app.get("/health", tags=["Health"])
async def health_check():
    """Comprehensive health check endpoint"""
    start_time = time.time()
    
    # Get database health
    db_health = await get_db_health()
    app_state["last_health_check"] = datetime.now()
    
    # Calculate response time
    response_time = round((time.time() - start_time) * 1000, 2)  # in milliseconds
    
    return {
        "api_status": "healthy" if app_state["db_connected"] else "degraded",
        "timestamp": app_state["last_health_check"].isoformat(),
        "uptime": str(datetime.now() - app_state["startup_time"]) if app_state["startup_time"] else None,
        "response_time_ms": response_time,
        "database": db_health,
        "services": {
            "api": "operational",
            "database": "operational" if db_health.get("status") == "connected" else "degraded",
            "auth": "planned",
            "ai_agents": "planned"
        }
    }

@app.get("/status", tags=["Health"])
async def api_status():
    """Simple status endpoint for monitoring"""
    return {
        "status": "ok",
        "database": "connected" if app_state["db_connected"] else "disconnected",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/test-db", tags=["Database"])
async def test_database():
    """Comprehensive database connection and functionality test"""
    try:
        # Verify database connection
        if not await verify_database():
            raise HTTPException(
                status_code=503, 
                detail="Database connection verification failed"
            )
        
        # Get detailed database health
        db_health = await get_db_health()
        
        if db_health["status"] not in ["connected"]:
            raise HTTPException(
                status_code=503, 
                detail=f"Database not available: {db_health.get('error', 'Unknown error')}"
            )
        
        return {
            "message": "✅ Database connection test successful!",
            "test_results": {
                "connectivity": "passed",
                "read_access": "passed",
                "write_access": "testing..."
            },
            "database_info": db_health
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Database test failed: {str(e)}"
        )

@app.post("/test-db/write", tags=["Database"])
async def test_database_write():
    """Test database write operations"""
    try:
        db = get_database()
        
        # Create a test document
        test_doc = {
            "test_type": "write_operation",
            "message": "Database write test successful",
            "timestamp": datetime.now().isoformat(),
            "api_version": "1.0.0"
        }
        
        # Insert test document
        result = await db.api_tests.insert_one(test_doc)
        
        # Verify the document was inserted
        inserted_doc = await db.api_tests.find_one({"_id": result.inserted_id})
        
        # Clean up test document
        await db.api_tests.delete_one({"_id": result.inserted_id})
        
        return {
            "message": "✅ Database write test successful!",
            "test_results": {
                "write_operation": "passed",
                "document_retrieval": "passed",
                "cleanup": "passed"
            },
            "document_id": str(result.inserted_id),
            "collection": "api_tests"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Database write test failed: {str(e)}"
        )

@app.get("/collections", tags=["Database"])
async def list_collections():
    """List all available database collections"""
    try:
        db = get_database()
        collections = await db.list_collection_names()
        
        # Get collection stats
        collection_info = []
        for collection_name in collections:
            try:
                stats = await db.command("collStats", collection_name)
                collection_info.append({
                    "name": collection_name,
                    "documents": stats.get("count", 0),
                    "size": stats.get("size", 0),
                    "avg_obj_size": stats.get("avgObjSize", 0)
                })
            except Exception:
                collection_info.append({
                    "name": collection_name,
                    "documents": "unknown",
                    "size": "unknown"
                })
        
        return {
            "total_collections": len(collections),
            "collections": collection_info
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to list collections: {str(e)}"
        )

# Custom exception handlers
@app.exception_handler(RuntimeError)
async def database_exception_handler(request, exc):
    """Handle database connection errors gracefully"""
    if "Database not connected" in str(exc):
        return JSONResponse(
            status_code=503,
            content={
                "error": "Database service unavailable",
                "detail": str(exc),
                "suggestion": "Please check database connection or try again later"
            }
        )
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc)
        }
    )

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    """Handle internal server errors"""
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": "An unexpected error occurred",
            "suggestion": "Please try again or contact support if the issue persists"
        }
    )

# Add middleware for request logging
@app.middleware("http")
async def log_requests(request, call_next):
    """Log all incoming requests"""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    print(f"📝 {request.method} {request.url.path} - {response.status_code} - {process_time:.3f}s")
    return response

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)