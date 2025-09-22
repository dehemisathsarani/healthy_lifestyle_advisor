from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Optional
from datetime import datetime, timedelta
from .models import SecurityProfile
from .service import SecurityService, get_security_service
from .schemas import SecurityAnalysisRequest, PrivacyReport
from .ai_agent import SecurityRecommendation, DataAnalysisInsight
from ..auth.dependencies import get_current_user

router = APIRouter(prefix="/security/ai", tags=["Security AI"])

@router.post("/analyze", response_model=SecurityRecommendation)
async def analyze_security(
    analysis_request: SecurityAnalysisRequest,
    current_user: Dict = Depends(get_current_user),
    security_service: SecurityService = Depends(get_security_service)
):
    """
    Analyze security profile and provide AI-powered recommendations
    """
    try:
        # Get user's security profile
        profile = await security_service.get_security_profile(current_user["_id"])
        
        # Get usage patterns for analysis
        start_date = analysis_request.start_date or datetime.utcnow() - timedelta(days=30)
        end_date = analysis_request.end_date or datetime.utcnow()
        
        # Get user's activity data
        activity_data = await security_service.get_user_activity(
            current_user["_id"],
            start_date,
            end_date
        )
        
        # Use AI agent for analysis
        security_rec = await security_service.ai_agent.analyze_security_profile(
            profile.dict(),
            activity_data
        )
        
        return security_rec
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze/data-patterns", response_model=DataAnalysisInsight)
async def analyze_data_patterns(
    analysis_request: SecurityAnalysisRequest,
    current_user: Dict = Depends(get_current_user),
    security_service: SecurityService = Depends(get_security_service)
):
    """
    Analyze health data patterns for insights and privacy implications
    """
    try:
        # Get user's security profile and privacy settings
        profile = await security_service.get_security_profile(current_user["_id"])
        
        # Get health data for analysis
        start_date = analysis_request.start_date or datetime.utcnow() - timedelta(days=30)
        end_date = analysis_request.end_date or datetime.utcnow()
        
        health_data = await security_service.get_health_data(
            current_user["_id"],
            None,  # Get all data types
            start_date,
            end_date
        )
        
        # Use AI agent for analysis
        data_insight = await security_service.ai_agent.analyze_health_data(
            health_data,
            profile.dict().get("privacy_settings", {})
        )
        
        return data_insight
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/report/privacy", response_model=PrivacyReport)
async def get_privacy_report(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: Dict = Depends(get_current_user),
    security_service: SecurityService = Depends(get_security_service)
):
    """
    Generate a comprehensive privacy report using AI analysis
    """
    try:
        # Get user's data
        profile = await security_service.get_security_profile(current_user["_id"])
        start_date = start_date or datetime.utcnow() - timedelta(days=30)
        end_date = end_date or datetime.utcnow()
        
        # Get user activity and health data
        activity_data = await security_service.get_user_activity(
            current_user["_id"],
            start_date,
            end_date
        )
        
        health_data = await security_service.get_health_data(
            current_user["_id"],
            None,
            start_date,
            end_date
        )
        
        # Generate comprehensive report using AI agent
        report = await security_service.ai_agent.generate_privacy_report(
            activity_data,
            profile.dict(),
            health_data
        )
        
        return PrivacyReport(**report)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
