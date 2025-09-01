from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Optional
from datetime import datetime
from .langchain_agent import SecurityAgent, HealthData, PrivacyPreferences, SecurityReport, HealthReport
from ..auth.dependencies import get_current_user

router = APIRouter(prefix="/security/ai", tags=["Security AI"])

# Initialize the Security Agent
security_agent = SecurityAgent()

@router.post("/analyze/health", response_model=HealthReport)
async def analyze_health_data(
    data: HealthData,
    current_user: Dict = Depends(get_current_user)
):
    """
    Analyze health data using LangChain agent and generate insights
    """
    try:
        return await security_agent.analyze_health_data(data.dict())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze/security", response_model=SecurityReport)
async def analyze_security(
    data: Dict,
    current_user: Dict = Depends(get_current_user)
):
    """
    Perform security analysis using LangChain agent
    """
    try:
        return await security_agent.analyze_security(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/privacy/preferences", response_model=PrivacyPreferences)
async def update_privacy_preferences(
    preferences: Dict,
    current_user: Dict = Depends(get_current_user)
):
    """
    Update privacy preferences using LangChain agent
    """
    try:
        return await security_agent.manage_privacy_preferences(preferences)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/backup")
async def create_backup(
    current_user: Dict = Depends(get_current_user)
):
    """
    Generate secure backup using LangChain agent
    """
    try:
        return await security_agent.generate_secure_backup({
            "user_id": current_user["_id"],
            "timestamp": datetime.utcnow().isoformat()
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/process")
async def process_request(
    request: str,
    context: Optional[Dict] = None,
    current_user: Dict = Depends(get_current_user)
):
    """
    Process general requests using the LangChain agent
    """
    try:
        return await security_agent.process_request(request, context)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
