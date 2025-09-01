from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

class SecurityAnalysisRequest(BaseModel):
    """Request model for security analysis"""
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    include_data_patterns: bool = True
    include_recommendations: bool = True

class PrivacyReport(BaseModel):
    """Response model for privacy reports"""
    timestamp: datetime
    security_analysis: Dict[str, Any]
    data_analysis: Dict[str, Any]
    privacy_score: int
    recommendations: List[str]
