import os
from fastapi import FastAPI, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Dict, Any
from dotenv import load_dotenv
from app.security.integration import SecurityIntegrationService
from app.auth.dependencies import get_current_user

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="Health Data Security Agent")

# MongoDB connection
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGODB_URL)
db = client.health_data_db

# Initialize security service
security_service = SecurityIntegrationService(db)

@app.post("/security/process-data/{agent_type}")
async def process_agent_data(
    agent_type: str,
    data: Dict[str, Any],
    current_user: Dict = Depends(get_current_user)
):
    """Process data from various health agents"""
    try:
        result = await security_service.process_agent_data(
            user_id=current_user["_id"],
            data=data,
            agent_type=agent_type
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/security/health-report")
async def generate_health_report(
    report_type: str = "weekly",
    current_user: Dict = Depends(get_current_user)
):
    """Generate health report"""
    try:
        report = await security_service.generate_health_report(
            user_id=current_user["_id"],
            report_type=report_type
        )
        return report
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/security/gdpr/{request_type}")
async def handle_gdpr_request(
    request_type: str,
    current_user: Dict = Depends(get_current_user)
):
    """Handle GDPR requests (export/delete)"""
    try:
        result = await security_service.process_gdpr_request(
            user_id=current_user["_id"],
            request_type=request_type
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
