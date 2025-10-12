"""
FastAPI Router for ETL Management and Monitoring
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Query, status
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
import logging
import asyncio

from ..auth.dependencies import get_current_user
from .azure_efs_etl_pipeline import DietAgentETLPipeline
from .scheduler import ETLScheduler, ETLHealthChecker, ETLScheduleConfig
from .config import AzureETLConfig, ETLEnvironment
# from .integrated_food_vision_router import router as integrated_router  # Import the new integrated router

logger = logging.getLogger(__name__)

# Global ETL system instances
etl_scheduler: Optional[ETLScheduler] = None
health_checker: Optional[ETLHealthChecker] = None

# Request/Response Models
class ETLJobRequest(BaseModel):
    """Request to run manual ETL job"""
    data_types: List[str] = Field(..., description="Types of data to process")
    start_date: Optional[str] = Field(None, description="Start date (YYYY-MM-DD)")
    end_date: Optional[str] = Field(None, description="End date (YYYY-MM-DD)")
    user_ids: Optional[List[str]] = Field(None, description="Specific user IDs to process")

class ETLJobResponse(BaseModel):
    """Response for ETL job execution"""
    job_id: str
    status: str
    message: str
    records_processed: int = 0
    execution_time_seconds: float = 0
    errors: List[str] = []

class ETLScheduleRequest(BaseModel):
    """Request to create/update ETL schedule"""
    job_name: str
    schedule_type: str = Field(..., pattern="^(daily|hourly|weekly|manual)$")
    schedule_time: str = Field(..., description="Schedule time (HH:MM for daily, MM for hourly, 'day HH:MM' for weekly)")
    data_types: List[str]
    lookback_days: int = Field(1, ge=0, le=30)
    enabled: bool = True
    retry_on_failure: bool = True
    max_retries: int = Field(3, ge=0, le=10)
    timeout_minutes: int = Field(60, ge=5, le=300)

class DataRetrievalRequest(BaseModel):
    """Request to retrieve data from Azure EFS"""
    data_type: str = Field(..., pattern="^(nutrition_logs|food_analyses|user_profiles|meal_entries)$")
    start_date: Optional[str] = Field(None, description="Start date (YYYY-MM-DD)")
    end_date: Optional[str] = Field(None, description="End date (YYYY-MM-DD)")
    user_ids: Optional[List[str]] = Field(None, description="Specific user IDs to retrieve")
    limit: int = Field(1000, ge=1, le=10000)

class NutritionInsightsRequest(BaseModel):
    """Request for nutrition insights"""
    user_id: str
    days: int = Field(30, ge=1, le=365)

# Create router
router = APIRouter(
    prefix="/etl",
    tags=["ETL Management"],
    responses={404: {"description": "Not found"}}
)

async def get_etl_scheduler() -> ETLScheduler:
    """Get ETL scheduler instance"""
    global etl_scheduler
    
    if not etl_scheduler:
        config = ETLEnvironment.from_environment()
        etl_scheduler = ETLScheduler(config)
        # Note: In production, you'd want to start this during app startup
        etl_scheduler.start_scheduler()
    
    return etl_scheduler

async def get_health_checker() -> ETLHealthChecker:
    """Get health checker instance"""
    global health_checker
    
    if not health_checker:
        scheduler = await get_etl_scheduler()
        health_checker = ETLHealthChecker(scheduler)
    
    return health_checker

# ETL Job Management Endpoints

@router.post("/jobs/run", response_model=ETLJobResponse)
async def run_manual_etl_job(
    request: ETLJobRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """
    Run a manual ETL job
    """
    try:
        scheduler = await get_etl_scheduler()
        
        # Parse dates
        start_date = None
        end_date = None
        
        if request.start_date:
            start_date = datetime.strptime(request.start_date, '%Y-%m-%d')
        if request.end_date:
            end_date = datetime.strptime(request.end_date, '%Y-%m-%d')
        
        # Run ETL job
        result = await scheduler.run_manual_job(
            data_types=request.data_types,
            start_date=start_date,
            end_date=end_date
        )
        
        return ETLJobResponse(
            job_id=result.job_id,
            status=result.status,
            message=f"ETL job completed with status: {result.status}",
            records_processed=result.records_processed,
            execution_time_seconds=result.execution_time_seconds,
            errors=result.errors
        )
        
    except Exception as e:
        logger.error(f"Failed to run manual ETL job: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to run ETL job: {str(e)}"
        )

@router.get("/jobs/{job_id}/status")
async def get_job_status(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get status of a specific ETL job
    """
    try:
        scheduler = await get_etl_scheduler()
        job_status = scheduler.monitor.get_job_status(job_id)
        
        if job_status is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job {job_id} not found"
            )
        
        return {
            "job_id": job_id,
            "status": job_status,
            "checked_at": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get job status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get job status: {str(e)}"
        )

@router.get("/jobs/history")
async def get_job_history(
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = Query(None, pattern="^(success|failed|partial|running)$"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get ETL job execution history
    """
    try:
        scheduler = await get_etl_scheduler()
        job_history = scheduler.monitor.job_history
        
        # Filter by status if provided
        if status:
            job_history = [job for job in job_history if job.status == status]
        
        # Limit results
        job_history = job_history[-limit:]
        
        return {
            "jobs": [job.to_dict() for job in job_history],
            "total_count": len(job_history),
            "retrieved_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to get job history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get job history: {str(e)}"
        )

# ETL Scheduling Endpoints

@router.post("/schedules")
async def create_etl_schedule(
    request: ETLScheduleRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new ETL schedule
    """
    try:
        scheduler = await get_etl_scheduler()
        
        schedule_config = ETLScheduleConfig(
            job_name=request.job_name,
            schedule_type=request.schedule_type,
            schedule_time=request.schedule_time,
            data_types=request.data_types,
            lookback_days=request.lookback_days,
            enabled=request.enabled,
            retry_on_failure=request.retry_on_failure,
            max_retries=request.max_retries,
            timeout_minutes=request.timeout_minutes
        )
        
        scheduler.add_schedule(schedule_config)
        
        return {
            "message": f"ETL schedule '{request.job_name}' created successfully",
            "schedule": {
                "job_name": request.job_name,
                "schedule_type": request.schedule_type,
                "schedule_time": request.schedule_time,
                "enabled": request.enabled
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to create ETL schedule: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create ETL schedule: {str(e)}"
        )

@router.get("/schedules")
async def list_etl_schedules(
    current_user: dict = Depends(get_current_user)
):
    """
    List all ETL schedules
    """
    try:
        scheduler = await get_etl_scheduler()
        
        schedules = []
        for schedule in scheduler.schedules:
            schedules.append({
                "job_name": schedule.job_name,
                "schedule_type": schedule.schedule_type,
                "schedule_time": schedule.schedule_time,
                "data_types": schedule.data_types,
                "lookback_days": schedule.lookback_days,
                "enabled": schedule.enabled,
                "retry_on_failure": schedule.retry_on_failure,
                "max_retries": schedule.max_retries,
                "timeout_minutes": schedule.timeout_minutes
            })
        
        return {
            "schedules": schedules,
            "total_count": len(schedules),
            "retrieved_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to list ETL schedules: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list ETL schedules: {str(e)}"
        )

@router.delete("/schedules/{job_name}")
async def delete_etl_schedule(
    job_name: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete an ETL schedule
    """
    try:
        scheduler = await get_etl_scheduler()
        
        # Check if schedule exists
        existing_schedule = next((s for s in scheduler.schedules if s.job_name == job_name), None)
        if not existing_schedule:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"ETL schedule '{job_name}' not found"
            )
        
        scheduler.remove_schedule(job_name)
        
        return {
            "message": f"ETL schedule '{job_name}' deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete ETL schedule: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete ETL schedule: {str(e)}"
        )

# Data Retrieval Endpoints

@router.post("/data/retrieve")
async def retrieve_data_from_azure(
    request: DataRetrievalRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Retrieve data from Azure EFS
    """
    try:
        scheduler = await get_etl_scheduler()
        
        # Parse dates
        start_date = request.start_date
        end_date = request.end_date
        
        if not end_date:
            end_date = datetime.now().strftime('%Y-%m-%d')
        if not start_date:
            start_date = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
        
        # Retrieve data
        data = await scheduler.pipeline.retriever.retrieve_data(
            data_type=request.data_type,
            start_date=start_date,
            end_date=end_date,
            user_ids=request.user_ids
        )
        
        # Apply limit
        if len(data) > request.limit:
            data = data[:request.limit]
        
        return {
            "data_type": request.data_type,
            "date_range": {"start": start_date, "end": end_date},
            "records": data,
            "total_count": len(data),
            "limited": len(data) == request.limit,
            "retrieved_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to retrieve data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve data: {str(e)}"
        )

@router.post("/insights/nutrition")
async def get_nutrition_insights(
    request: NutritionInsightsRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Get comprehensive nutrition insights for a user
    """
    try:
        scheduler = await get_etl_scheduler()
        
        insights = await scheduler.pipeline.get_nutrition_insights(
            user_id=request.user_id,
            days=request.days
        )
        
        if 'error' in insights:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=insights['error']
            )
        
        return insights
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get nutrition insights: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get nutrition insights: {str(e)}"
        )

# Monitoring and Health Check Endpoints

@router.get("/health")
async def etl_health_check():
    """
    Get ETL system health status
    """
    try:
        health_checker = await get_health_checker()
        health_status = await health_checker.run_health_check()
        
        return health_status
        
    except Exception as e:
        logger.error(f"Failed to run health check: {e}")
        return {
            "timestamp": datetime.now().isoformat(),
            "overall_status": "unhealthy",
            "error": str(e),
            "components": {}
        }

@router.get("/metrics")
async def get_etl_metrics(
    current_user: dict = Depends(get_current_user)
):
    """
    Get ETL system metrics
    """
    try:
        scheduler = await get_etl_scheduler()
        metrics = scheduler.monitor.get_metrics()
        
        # Add additional metrics
        recent_failures = scheduler.monitor.get_recent_failures(hours=24)
        
        enhanced_metrics = {
            **metrics,
            "recent_failures_24h": len(recent_failures),
            "system_status": "healthy" if len(recent_failures) == 0 else "degraded",
            "last_metrics_update": datetime.now().isoformat()
        }
        
        return enhanced_metrics
        
    except Exception as e:
        logger.error(f"Failed to get ETL metrics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get ETL metrics: {str(e)}"
        )

@router.get("/status")
async def get_etl_system_status():
    """
    Get overall ETL system status (public endpoint)
    """
    try:
        scheduler = await get_etl_scheduler()
        
        return {
            "system_status": "operational",
            "scheduler_running": scheduler.running,
            "active_schedules": len([s for s in scheduler.schedules if s.enabled]),
            "total_schedules": len(scheduler.schedules),
            "last_check": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to get system status: {e}")
        return {
            "system_status": "error",
            "error": str(e),
            "last_check": datetime.now().isoformat()
        }

# Administrative Endpoints

@router.post("/admin/cleanup")
async def cleanup_temporary_files(
    current_user: dict = Depends(get_current_user)
):
    """
    Cleanup temporary ETL files
    """
    try:
        from pathlib import Path
        import shutil
        
        temp_dir = Path("./temp_etl")
        if (temp_dir.exists()):
            # Calculate size before cleanup
            size_before = sum(f.stat().st_size for f in temp_dir.rglob('*') if f.is_file())
            
            # Remove all files
            shutil.rmtree(temp_dir)
            temp_dir.mkdir(exist_ok=True)
            
            return {
                "message": "Temporary files cleaned up successfully",
                "size_cleaned_mb": size_before / (1024 * 1024),
                "cleaned_at": datetime.now().isoformat()
            }
        else:
            return {
                "message": "No temporary files to clean up",
                "cleaned_at": datetime.now().isoformat()
            }
            
    except Exception as e:
        logger.error(f"Failed to cleanup temporary files: {e}")
        raise HTTPException(    
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cleanup temporary files: {str(e)}"
        )

@router.post("/admin/restart-scheduler")
async def restart_etl_scheduler(
    current_user: dict = Depends(get_current_user)
):
    """
    Restart the ETL scheduler
    """
    try:
        global etl_scheduler
        
        # Stop existing scheduler
        if etl_scheduler:
            etl_scheduler.stop_scheduler()
        
        # Create new scheduler
        config = ETLEnvironment.from_environment()
        etl_scheduler = ETLScheduler(config)
        etl_scheduler.start_scheduler()
        
        return {
            "message": "ETL scheduler restarted successfully",
            "restarted_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to restart ETL scheduler: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to restart ETL scheduler: {str(e)}"
        )
