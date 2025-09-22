from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from .models import SecurityProfile, HealthDataExport, DataDeletionRequest
from .service import SecurityService
from .schemas import SecurityAnalysisRequest, PrivacyReport
from ..auth.dependencies import get_current_user
from motor.motor_asyncio import AsyncIOMotorClient
from ..core.database import get_database

router = APIRouter(prefix="/security", tags=["Security"])

# Dependency to get the SecurityService instance
async def get_security_service(db: AsyncIOMotorClient = Depends(get_database)) -> SecurityService:
    return SecurityService(db)

@router.post("/profile", response_model=SecurityProfile)
async def create_security_profile(
    profile_data: Dict[str, Any],
    current_user: Dict = Depends(get_current_user),
    security_service: SecurityService = Depends(get_security_service)
):
    """Create a new security profile for the current user"""
    return await security_service.create_security_profile(current_user["_id"], profile_data)

@router.get("/profile", response_model=SecurityProfile)
async def get_security_profile(
    current_user: Dict = Depends(get_current_user),
    security_service: SecurityService = Depends(get_security_service)
):
    """Get the current user's security profile"""
    return await security_service.get_security_profile(current_user["_id"])

@router.put("/profile", response_model=SecurityProfile)
async def update_security_profile(
    updates: Dict[str, Any],
    current_user: Dict = Depends(get_current_user),
    security_service: SecurityService = Depends(get_security_service)
):
    """Update the current user's security profile"""
    return await security_service.update_security_profile(current_user["_id"], updates)

@router.post("/data/store/{data_type}")
async def store_health_data(
    data_type: str,
    content: Dict[str, Any],
    current_user: Dict = Depends(get_current_user),
    security_service: SecurityService = Depends(get_security_service)
):
    """Store encrypted health data"""
    return await security_service.store_health_data(current_user["_id"], data_type, content)

@router.get("/data/{data_type}")
async def get_health_data(
    data_type: str,
    current_user: Dict = Depends(get_current_user),
    security_service: SecurityService = Depends(get_security_service)
):
    """Retrieve decrypted health data"""
    return await security_service.get_health_data(current_user["_id"], data_type)

@router.post("/data/export")
async def export_health_data(
    export_request: HealthDataExport,
    current_user: Dict = Depends(get_current_user),
    security_service: SecurityService = Depends(get_security_service)
):
    """Export health data in encrypted format"""
    if not export_request.from_date:
        export_request.from_date = datetime.utcnow() - timedelta(days=30)  # Default to last 30 days
    if not export_request.to_date:
        export_request.to_date = datetime.utcnow()

    data = await security_service.get_health_data(current_user["_id"])
    return {
        "data": data,
        "export_date": datetime.utcnow(),
        "period": {
            "from": export_request.from_date,
            "to": export_request.to_date
        }
    }

@router.post("/data/backup")
async def create_backup(
    current_user: Dict = Depends(get_current_user),
    security_service: SecurityService = Depends(get_security_service)
):
    """Create an encrypted backup of user's health data"""
    return await security_service.create_data_backup(current_user["_id"])

@router.delete("/data")
async def delete_user_data(
    deletion_request: DataDeletionRequest,
    current_user: Dict = Depends(get_current_user),
    security_service: SecurityService = Depends(get_security_service)
):
    """Delete user's health data (GDPR right to be forgotten)"""
    if deletion_request.user_id != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only delete your own data"
        )
    
    success = await security_service.delete_user_data(
        deletion_request.user_id,
        deletion_request.data_types if not deletion_request.delete_all else None
    )
    
    if success:
        return {"message": "Data deleted successfully"}
    raise HTTPException(status_code=500, detail="Failed to delete data")

@router.get("/report")
async def generate_health_report(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: Dict = Depends(get_current_user),
    security_service: SecurityService = Depends(get_security_service)
):
    """Generate a comprehensive health report"""
    if not start_date:
        start_date = datetime.utcnow() - timedelta(days=7)  # Default to last 7 days
    if not end_date:
        end_date = datetime.utcnow()

    return await security_service.generate_health_report(current_user["_id"], start_date, end_date)
