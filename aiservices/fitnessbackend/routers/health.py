from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime, date, timedelta
import uuid
from fastapi.encoders import jsonable_encoder

from auth import get_current_user
from settings import settings
from database import get_database
from health_models import (
    HeartRateMetric, 
    StepMetric, 
    SleepMetric, 
    CalorieMetric,
    BloodPressureMetric,
    OxygenSaturationMetric,
    DeviceInfo,
    HealthInsight,
    RecoveryAdvice
)
from health_service import (
    analyze_heart_rate_anomalies,
    analyze_sleep_quality,
    generate_recovery_advice,
    calculate_recovery_score
)

router = APIRouter(
    prefix=f"{settings.API_PREFIX}/health",
    tags=["health"],
    responses={404: {"description": "Not found"}},
)

# Database collections
COLLECTIONS = {
    "heart_rate": "heart_rate_metrics",
    "steps": "step_metrics",
    "sleep": "sleep_metrics",
    "calories": "calorie_metrics",
    "blood_pressure": "blood_pressure_metrics",
    "oxygen": "oxygen_saturation_metrics",
    "devices": "connected_devices",
    "insights": "health_insights",
    "recovery": "recovery_advice"
}


# Heart rate endpoints
@router.post("/heart-rate", response_model=HeartRateMetric)
async def record_heart_rate(
    metric: HeartRateMetric,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Record heart rate data from a wearable device"""
    # Validate user_id matches current user
    if metric.user_id != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Cannot record data for another user")
    
    # Insert into database
    result = await db[COLLECTIONS["heart_rate"]].insert_one(jsonable_encoder(metric))
    
    # Analyze for anomalies
    await analyze_heart_rate_anomalies(db, metric)
    
    # Return the recorded metric
    return metric


@router.get("/heart-rate", response_model=List[HeartRateMetric])
async def get_heart_rate_data(
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    limit: int = 100,
    activity_state: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get heart rate data for the current user"""
    # Default to last 24 hours if no time range specified
    if not end_time:
        end_time = datetime.now()
    if not start_time:
        start_time = end_time - timedelta(days=1)
    
    # Build query
    query = {
        "user_id": current_user["user_id"],
        "timestamp": {"$gte": start_time, "$lte": end_time}
    }
    
    if activity_state:
        query["activity_state"] = activity_state
    
    # Get data from database
    cursor = db[COLLECTIONS["heart_rate"]].find(query).sort("timestamp", -1).limit(limit)
    heart_rate_data = await cursor.to_list(limit)
    
    return heart_rate_data


# Step count endpoints
@router.post("/steps", response_model=StepMetric)
async def record_steps(
    metric: StepMetric,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Record step count data from a wearable device"""
    # Validate user_id matches current user
    if metric.user_id != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Cannot record data for another user")
    
    # Insert into database
    result = await db[COLLECTIONS["steps"]].insert_one(jsonable_encoder(metric))
    
    # Return the recorded metric
    return metric


@router.get("/steps", response_model=List[StepMetric])
async def get_step_data(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = 30,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get step count data for the current user"""
    # Default to last 30 days if no date range specified
    if not end_date:
        end_date = datetime.now().date()
    if not start_date:
        start_date = end_date - timedelta(days=limit-1)
    
    # Build query
    start_datetime = datetime.combine(start_date, datetime.min.time())
    end_datetime = datetime.combine(end_date, datetime.max.time())
    
    query = {
        "user_id": current_user["user_id"],
        "timestamp": {"$gte": start_datetime, "$lte": end_datetime}
    }
    
    # Get data from database
    cursor = db[COLLECTIONS["steps"]].find(query).sort("timestamp", -1)
    step_data = await cursor.to_list(limit)
    
    return step_data


# Sleep data endpoints
@router.post("/sleep", response_model=SleepMetric)
async def record_sleep_data(
    metric: SleepMetric,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Record sleep data from a wearable device"""
    # Validate user_id matches current user
    if metric.user_id != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Cannot record data for another user")
    
    # Insert into database
    result = await db[COLLECTIONS["sleep"]].insert_one(jsonable_encoder(metric))
    
    # Analyze sleep quality
    await analyze_sleep_quality(db, metric)
    
    # Return the recorded metric
    return metric


@router.get("/sleep", response_model=List[SleepMetric])
async def get_sleep_data(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = 14,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get sleep data for the current user"""
    # Default to last 14 days if no date range specified
    if not end_date:
        end_date = datetime.now().date()
    if not start_date:
        start_date = end_date - timedelta(days=limit-1)
    
    # Build query
    start_datetime = datetime.combine(start_date, datetime.min.time())
    end_datetime = datetime.combine(end_date, datetime.max.time())
    
    query = {
        "user_id": current_user["user_id"],
        "start_time": {"$gte": start_datetime, "$lte": end_datetime}
    }
    
    # Get data from database
    cursor = db[COLLECTIONS["sleep"]].find(query).sort("start_time", -1)
    sleep_data = await cursor.to_list(limit)
    
    return sleep_data


# Calories burned endpoints
@router.post("/calories", response_model=CalorieMetric)
async def record_calorie_data(
    metric: CalorieMetric,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Record calorie burn data from a wearable device"""
    # Validate user_id matches current user
    if metric.user_id != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Cannot record data for another user")
    
    # Insert into database
    result = await db[COLLECTIONS["calories"]].insert_one(jsonable_encoder(metric))
    
    # Return the recorded metric
    return metric


@router.get("/calories", response_model=List[CalorieMetric])
async def get_calorie_data(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = 30,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get calorie burn data for the current user"""
    # Default to last 30 days if no date range specified
    if not end_date:
        end_date = datetime.now().date()
    if not start_date:
        start_date = end_date - timedelta(days=limit-1)
    
    # Build query
    start_datetime = datetime.combine(start_date, datetime.min.time())
    end_datetime = datetime.combine(end_date, datetime.max.time())
    
    query = {
        "user_id": current_user["user_id"],
        "timestamp": {"$gte": start_datetime, "$lte": end_datetime}
    }
    
    # Get data from database
    cursor = db[COLLECTIONS["calories"]].find(query).sort("timestamp", -1)
    calorie_data = await cursor.to_list(limit)
    
    return calorie_data


# Device management endpoints
@router.post("/devices", response_model=DeviceInfo)
async def register_device(
    device: DeviceInfo,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Register a wearable device for the current user"""
    # Add user_id to device info
    device_dict = device.dict()
    device_dict["user_id"] = current_user["user_id"]
    device_dict["registered_at"] = datetime.now()
    
    # Check if device already exists
    existing_device = await db[COLLECTIONS["devices"]].find_one({
        "id": device.id,
        "user_id": current_user["user_id"]
    })
    
    if existing_device:
        # Update existing device
        await db[COLLECTIONS["devices"]].update_one(
            {"id": device.id, "user_id": current_user["user_id"]},
            {"$set": {
                "name": device.name,
                "connected": device.connected,
                "last_sync": device.last_sync or datetime.now(),
                "battery_level": device.battery_level
            }}
        )
    else:
        # Insert new device
        await db[COLLECTIONS["devices"]].insert_one(device_dict)
    
    return DeviceInfo(**device_dict)


@router.get("/devices", response_model=List[DeviceInfo])
async def get_devices(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get all registered wearable devices for the current user"""
    cursor = db[COLLECTIONS["devices"]].find({"user_id": current_user["user_id"]})
    devices = await cursor.to_list(length=100)
    return devices


@router.delete("/devices/{device_id}")
async def remove_device(
    device_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Remove a registered wearable device"""
    result = await db[COLLECTIONS["devices"]].delete_one({
        "id": device_id,
        "user_id": current_user["user_id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Device not found")
    
    return {"message": "Device removed successfully"}


# Health insights endpoints
@router.get("/insights", response_model=List[HealthInsight])
async def get_health_insights(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    severity: Optional[str] = None,
    type: Optional[str] = None,
    dismissed: Optional[bool] = False,
    limit: int = 50,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get health insights for the current user"""
    # Default to last 30 days if no date range specified
    if not end_date:
        end_date = datetime.now().date()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    # Build query
    start_datetime = datetime.combine(start_date, datetime.min.time())
    end_datetime = datetime.combine(end_date, datetime.max.time())
    
    query = {
        "user_id": current_user["user_id"],
        "generated_at": {"$gte": start_datetime, "$lte": end_datetime},
        "dismissed": dismissed
    }
    
    if severity:
        query["severity"] = severity
    
    if type:
        query["type"] = type
    
    # Get data from database
    cursor = db[COLLECTIONS["insights"]].find(query).sort("generated_at", -1)
    insights = await cursor.to_list(limit)
    
    return insights


@router.put("/insights/{insight_id}/dismiss")
async def dismiss_insight(
    insight_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Mark a health insight as dismissed"""
    result = await db[COLLECTIONS["insights"]].update_one(
        {"id": insight_id, "user_id": current_user["user_id"]},
        {"$set": {"dismissed": True}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Insight not found")
    
    return {"message": "Insight dismissed successfully"}


# Recovery advice endpoints
@router.get("/recovery", response_model=RecoveryAdvice)
async def get_recovery_advice(
    date: Optional[date] = None,
    refresh: bool = False,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Get recovery advice for the current user
    
    - date: Optional date to get recovery advice for (default: today)
    - refresh: If true, regenerate advice even if it already exists
    """
    # Default to today if no date specified
    if not date:
        date = datetime.now().date()
    
    # Check if advice already exists for this day (unless refresh requested)
    if not refresh:
        existing_advice = await db[COLLECTIONS["recovery"]].find_one({
            "user_id": current_user["user_id"],
            "advice_date": date
        })
        
        if existing_advice:
            try:
                # Convert existing advice to enhanced model
                return RecoveryAdvice(**existing_advice)
            except Exception:
                # If conversion fails due to missing fields in older format, regenerate
                refresh = True
    
    # Generate new recovery advice
    recovery_advice = await generate_recovery_advice(db, current_user["user_id"], date)
    
    # Store in database (replace if exists)
    await db[COLLECTIONS["recovery"]].replace_one(
        {"user_id": current_user["user_id"], "advice_date": date},
        jsonable_encoder(recovery_advice),
        upsert=True
    )
    
    return recovery_advice


@router.get("/recovery/score", response_model=dict)
async def get_recovery_score(
    date: Optional[date] = None,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get recovery score for the current user"""
    # Default to today if no date specified
    if not date:
        date = datetime.now().date()
    
    # Calculate recovery score
    score, factors = await calculate_recovery_score(db, current_user["user_id"], date)
    
    # Determine status based on score
    status = "needs_recovery"
    if score >= 80:
        status = "optimal"
    elif score >= 60:
        status = "good"
    elif score >= 40:
        status = "moderate"
    
    return {
        "score": score,
        "status": status,
        "factors": factors,
        "date": date
    }


# Summary endpoint
@router.get("/summary")
async def get_health_summary(
    date: Optional[date] = None,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get a summary of all health data for a specific day"""
    # Default to today if no date specified
    if not date:
        date = datetime.now().date()
    
    start_datetime = datetime.combine(date, datetime.min.time())
    end_datetime = datetime.combine(date, datetime.max.time())
    
    # Get step data
    step_query = {
        "user_id": current_user["user_id"],
        "timestamp": {"$gte": start_datetime, "$lte": end_datetime}
    }
    step_cursor = db[COLLECTIONS["steps"]].find(step_query)
    step_data = await step_cursor.to_list(length=100)
    
    # Calculate total steps
    total_steps = sum(metric["count"] for metric in step_data) if step_data else 0
    
    # Get sleep data
    sleep_query = {
        "user_id": current_user["user_id"],
        "end_time": {"$gte": start_datetime, "$lte": end_datetime}
    }
    sleep_cursor = db[COLLECTIONS["sleep"]].find(sleep_query)
    sleep_data = await sleep_cursor.to_list(length=1)
    
    # Get calorie data
    calorie_query = {
        "user_id": current_user["user_id"],
        "timestamp": {"$gte": start_datetime, "$lte": end_datetime}
    }
    calorie_cursor = db[COLLECTIONS["calories"]].find(calorie_query)
    calorie_data = await calorie_cursor.to_list(length=100)
    
    # Calculate total calories
    total_calories = sum(metric["total"] for metric in calorie_data) if calorie_data else 0
    
    # Get heart rate data (average, min, max)
    heart_rate_query = {
        "user_id": current_user["user_id"],
        "timestamp": {"$gte": start_datetime, "$lte": end_datetime}
    }
    heart_rate_cursor = db[COLLECTIONS["heart_rate"]].find(heart_rate_query)
    heart_rate_data = await heart_rate_cursor.to_list(length=1000)
    
    # Calculate heart rate statistics
    if heart_rate_data:
        avg_heart_rate = sum(hr["bpm"] for hr in heart_rate_data) / len(heart_rate_data)
        min_heart_rate = min(hr["bpm"] for hr in heart_rate_data)
        max_heart_rate = max(hr["bpm"] for hr in heart_rate_data)
    else:
        avg_heart_rate = None
        min_heart_rate = None
        max_heart_rate = None
    
    # Get recovery score
    score_response = await get_recovery_score(date, current_user, db)
    
    # Build summary
    summary = {
        "date": date,
        "steps": {
            "total": total_steps,
            "goal_progress": min(1.0, total_steps / 10000) if total_steps else 0  # Assuming 10k step goal
        },
        "sleep": {
            "duration_hours": sleep_data[0]["duration_minutes"] / 60 if sleep_data else None,
            "quality_score": sleep_data[0]["sleep_score"] if sleep_data and "sleep_score" in sleep_data[0] else None,
            "deep_sleep_hours": sleep_data[0]["deep_sleep_minutes"] / 60 if sleep_data and "deep_sleep_minutes" in sleep_data[0] else None
        },
        "calories": {
            "total": total_calories,
        },
        "heart_rate": {
            "average": round(avg_heart_rate) if avg_heart_rate is not None else None,
            "min": min_heart_rate,
            "max": max_heart_rate
        },
        "recovery": score_response
    }
    
    return summary
