"""
Integrated Food Vision ETL Router
================================

FastAPI router that provides endpoints for the integrated Food Vision + ETL pipeline system.
This combines food image analysis with automatic data storage and comprehensive analytics.
"""

from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, Form, BackgroundTasks, Query, status
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any, Union
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
import logging
import asyncio
import json

from ..auth.dependencies import get_current_user
from .food_vision_etl_integration import FoodVisionETLIntegration, create_integrated_food_vision_etl
from .config import AzureETLConfig
from .scheduler import ETLScheduler

logger = logging.getLogger(__name__)

# Global integrated system instance
integrated_system: Optional[FoodVisionETLIntegration] = None

# Request/Response Models
class FoodAnalysisRequest(BaseModel):
    """Request for food image analysis with ETL integration"""
    meal_type: str = Field(default="lunch", pattern="^(breakfast|lunch|dinner|snack)$")
    text_description: Optional[str] = Field(None, max_length=500)
    dietary_restrictions: Optional[List[str]] = Field(default_factory=list)
    use_complete_pipeline: bool = Field(default=True)
    enable_etl_storage: bool = Field(default=True)

class FoodAnalysisResponse(BaseModel):
    """Response for integrated food analysis"""
    analysis_id: str
    user_id: str
    status: str
    processing_time_seconds: float
    
    # Food Vision Results
    detected_foods: List[Dict[str, Any]]
    detected_foods_count: int  # <-- Added for accurate count
    nutrition_summary: Dict[str, Any]
    confidence_metrics: Dict[str, Any]
    
    # ETL Integration Results
    etl_processing: Dict[str, Any]
    azure_storage_location: Optional[str]
    
    # Enhanced Insights
    nutrition_insights: Dict[str, Any]
    personalized_recommendations: List[str]
    meal_quality_assessment: Dict[str, Any]

class NutritionAnalyticsRequest(BaseModel):
    """Request for nutrition analytics"""
    start_date: Optional[str] = Field(None, description="Start date (YYYY-MM-DD)")
    end_date: Optional[str] = Field(None, description="End date (YYYY-MM-DD)")
    include_predictions: bool = Field(default=True)
    include_recommendations: bool = Field(default=True)
    analytics_depth: str = Field(default="comprehensive", pattern="^(basic|detailed|comprehensive)$")

class UserNutritionReport(BaseModel):
    """Comprehensive user nutrition report"""
    user_id: str
    date_range: Dict[str, str]
    summary_statistics: Dict[str, Any]
    nutrition_trends: Dict[str, Any]
    meal_patterns: Dict[str, Any]
    health_indicators: Dict[str, Any]
    recommendations: List[str]
    predictions: Optional[Dict[str, Any]] = None

# Router setup
router = APIRouter(prefix="/etl/food-vision", tags=["Food Vision ETL"])

async def get_integrated_system() -> FoodVisionETLIntegration:
    """Get or initialize the integrated system"""
    global integrated_system
    
    if integrated_system is None:
        # Initialize with environment variables or default config
        # In production, these would come from proper configuration
        azure_connection_string = "your_azure_connection_string_here"
        azure_share_name = "diet-agent-data"
        
        # This would typically be injected via dependency injection
        mongodb_client = None  # Get from your existing MongoDB setup
        
        integrated_system = await create_integrated_food_vision_etl(
            azure_connection_string=azure_connection_string,
            azure_share_name=azure_share_name,
            mongodb_client=mongodb_client,
            enable_real_time=True
        )
    
    return integrated_system

@router.post("/analyze", 
             response_model=FoodAnalysisResponse,
             summary="Analyze food image with integrated ETL processing",
             description="Upload a food image for analysis using the complete Food Vision Pipeline with automatic ETL storage and comprehensive nutrition insights.")
async def analyze_food_image_integrated(
    file: UploadFile = File(..., description="Food image file"),
    request: FoodAnalysisRequest = Depends(),
    current_user = Depends(get_current_user),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """
    Comprehensive food image analysis with integrated ETL processing
    
    This endpoint combines:
    1. Advanced food image analysis (6-step computer vision pipeline)
    2. Automatic Azure EFS storage via ETL pipeline
    3. Real-time nutrition insights and recommendations
    4. Historical data integration and trend analysis
    """
    
    if not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image (JPEG, PNG, etc.)"
        )
    
    try:
        # Get integrated system
        system = await get_integrated_system()
        
        # Read image data
        image_data = await file.read()
        
        if len(image_data) > 10 * 1024 * 1024:  # 10MB limit
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Image file too large. Maximum size is 10MB."
            )
        
        user_id = current_user.get('user_id', 'unknown_user')
        
        # Perform integrated analysis
        result = await system.analyze_and_store_food_image(
            image_data=image_data,
            user_id=user_id,
            meal_type=request.meal_type,
            text_description=request.text_description,
            dietary_restrictions=request.dietary_restrictions,
            use_complete_pipeline=request.use_complete_pipeline
        )
        
        if result.get('status') == 'failed':
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Analysis failed: {result.get('error', 'Unknown error')}"
            )
        
        # Extract response data
        food_analysis = result.get('food_analysis', {})
        etl_processing = result.get('etl_processing', {})
        insights = result.get('nutrition_insights', {})
        performance = result.get('performance_metrics', {})
        
        # Schedule background analytics update if ETL processing was successful
        if etl_processing.get('status') == 'success':
            background_tasks.add_task(
                update_user_analytics_cache,
                user_id,
                result.get('analysis_id')
            )
        
        response = FoodAnalysisResponse(
            analysis_id=result.get('analysis_id', ''),
            user_id=user_id,
            status='success',
            processing_time_seconds=performance.get('total_processing_time_seconds', 0),
            
            detected_foods=food_analysis.get('detected_foods', []),
            detected_foods_count=len(food_analysis.get('detected_foods', [])),  # <-- Accurate count
            nutrition_summary=food_analysis.get('nutrition_summary', {}),
            confidence_metrics=food_analysis.get('confidence_metrics', {}),
            
            etl_processing=etl_processing,
            azure_storage_location=etl_processing.get('storage_location'),
            
            nutrition_insights=insights,
            personalized_recommendations=insights.get('personalized_recommendations', []),
            meal_quality_assessment=insights.get('meal_quality', {})
        )
        
        logger.info(f"✅ Integrated food analysis completed for user {user_id}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Integrated food analysis failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/analytics/{user_id}",
            response_model=UserNutritionReport,
            summary="Get comprehensive nutrition analytics",
            description="Retrieve detailed nutrition analytics, trends, and insights for a specific user.")
async def get_user_nutrition_analytics(
    user_id: str,
    request: NutritionAnalyticsRequest = Depends(),
    current_user = Depends(get_current_user)
):
    """
    Get comprehensive nutrition analytics for a user
    
    Provides:
    - Summary statistics (calories, macronutrients, etc.)
    - Nutrition trends over time
    - Meal patterns and frequency analysis
    - Health indicators and assessments
    - Personalized recommendations
    - Predictive insights (optional)
    """
    
    # Check if user can access this data (basic authorization)
    requesting_user_id = current_user.get('user_id')
    if requesting_user_id != user_id and not current_user.get('is_admin', False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You can only view your own analytics."
        )
    
    try:
        system = await get_integrated_system()
        
        # Parse date range
        start_date = None
        end_date = None
        
        if request.start_date:
            start_date = datetime.fromisoformat(request.start_date)
        if request.end_date:
            end_date = datetime.fromisoformat(request.end_date)
        
        # Get analytics
        analytics = await system.get_user_nutrition_analytics(
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
            include_predictions=request.include_predictions
        )
        
        if analytics.get('status') == 'error':
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Analytics generation failed: {analytics.get('error')}"
            )
        
        if analytics.get('status') == 'no_data':
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No nutrition data found for the specified user and date range"
            )
        
        # Add detected_foods_count statistics to summary_statistics
        records = analytics.get('records', [])
        detected_counts = [len(r.get('detected_foods', [])) for r in records] if records else []
        summary_statistics = analytics.get('summary_statistics', {})
        summary_statistics['detected_foods'] = {
            'average': sum(detected_counts) / len(detected_counts) if detected_counts else 0,
            'min': min(detected_counts) if detected_counts else 0,
            'max': max(detected_counts) if detected_counts else 0,
            'total': sum(detected_counts)
        }
        
        # Convert to response model
        report = UserNutritionReport(
            user_id=analytics.get('user_id'),
            date_range=analytics.get('date_range', {}),
            summary_statistics=summary_statistics,
            nutrition_trends=analytics.get('nutrition_trends', {}),
            meal_patterns=analytics.get('meal_patterns', {}),
            health_indicators=analytics.get('health_indicators', {}),
            recommendations=analytics.get('recommendations', []),
            predictions=analytics.get('predictions') if request.include_predictions else None
        )
        
        logger.info(f"✅ Nutrition analytics generated for user {user_id}")
        return report
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to generate nutrition analytics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate analytics: {str(e)}"
        )

@router.get("/history/{user_id}",
            summary="Get user's food analysis history",
            description="Retrieve paginated history of food analyses with filtering options.")
async def get_user_food_history(
    user_id: str,
    limit: int = Query(default=20, ge=1, le=100, description="Number of records to return"),
    offset: int = Query(default=0, ge=0, description="Number of records to skip"),
    meal_type: Optional[str] = Query(default=None, pattern="^(breakfast|lunch|dinner|snack)$"),
    start_date: Optional[str] = Query(default=None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(default=None, description="End date (YYYY-MM-DD)"),
    current_user = Depends(get_current_user)
):
    """Get paginated food analysis history for a user"""
    
    # Authorization check
    requesting_user_id = current_user.get('user_id')
    if requesting_user_id != user_id and not current_user.get('is_admin', False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You can only view your own history."
        )
    
    try:
        system = await get_integrated_system()
        
        # Parse date filters
        date_start = datetime.fromisoformat(start_date) if start_date else None
        date_end = datetime.fromisoformat(end_date) if end_date else None
        
        # Get data using ETL retriever
        retriever = system.etl_pipeline.retriever
        
        history_data = await retriever.retrieve_nutrition_data(
            data_types=['food_analyses'],
            start_date=date_start,
            end_date=date_end,
            user_ids=[user_id]
        )
        
        records = history_data.get('records', [])
        
        # Apply meal type filter
        if meal_type:
            records = [r for r in records if r.get('meal_type') == meal_type]
        
        # Add detected_foods_count to each record
        for r in records:
            r['detected_foods_count'] = len(r.get('detected_foods', []))
        
        # Apply pagination
        total_records = len(records)
        paginated_records = records[offset:offset + limit]
        
        # Format response
        history_response = {
            'user_id': user_id,
            'total_records': total_records,
            'returned_records': len(paginated_records),
            'offset': offset,
            'limit': limit,
            'has_more': offset + limit < total_records,
            
            'filters_applied': {
                'meal_type': meal_type,
                'start_date': start_date,
                'end_date': end_date
            },
            
            'records': paginated_records,
            
            'summary': {
                'date_range': {
                    'earliest': min(r.get('created_at', '') for r in records) if records else None,
                    'latest': max(r.get('created_at', '') for r in records) if records else None
                },
                'meal_type_distribution': _calculate_meal_distribution(records),
                'total_foods_analyzed': sum(r.get('detected_foods_count', 0) for r in records),
                'average_confidence': sum(r.get('confidence_score', 0) for r in records) / len(records) if records else 0,
                'average_detected_foods': sum(r.get('detected_foods_count', 0) for r in records) / len(records) if records else 0,
                'max_detected_foods': max((r.get('detected_foods_count', 0) for r in records), default=0),
                'min_detected_foods': min((r.get('detected_foods_count', 0) for r in records), default=0)
            }
        }
        
        return history_response
        
    except Exception as e:
        logger.error(f"❌ Failed to retrieve user history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve history: {str(e)}"
        )

@router.get("/insights/nutrition/{user_id}",
            summary="Get real-time nutrition insights",
            description="Get real-time nutrition insights and recommendations based on recent food analyses.")
async def get_nutrition_insights(
    user_id: str,
    days: int = Query(default=7, ge=1, le=30, description="Number of days to analyze"),
    current_user = Depends(get_current_user)
):
    """Get real-time nutrition insights for a user"""
    
    # Authorization check
    requesting_user_id = current_user.get('user_id')
    if requesting_user_id != user_id and not current_user.get('is_admin', False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    try:
        system = await get_integrated_system()
        
        # Get recent data
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        analytics = await system.get_user_nutrition_analytics(
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
            include_predictions=True
        )
        
        if analytics.get('status') != 'success':
            return {
                'user_id': user_id,
                'status': analytics.get('status', 'no_data'),
                'message': analytics.get('message', 'No recent nutrition data available'),
                'days_analyzed': days
            }
        
        # Extract key insights
        insights = {
            'user_id': user_id,
            'status': 'success',
            'analysis_period': {
                'days': days,
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat()
            },
            
            'quick_summary': {
                'avg_daily_calories': analytics.get('summary_statistics', {}).get('calories', {}).get('average', 0),
                'avg_daily_protein': analytics.get('summary_statistics', {}).get('protein_g', {}).get('average', 0),
                'meals_tracked': analytics.get('data_quality', {}).get('total_records', 0),
                'tracking_consistency': analytics.get('data_quality', {}).get('completeness_score', 0)
            },
            
            'current_trends': analytics.get('nutrition_trends', {}),
            'health_status': analytics.get('health_indicators', {}),
            'immediate_recommendations': analytics.get('recommendations', [])[:3],  # Top 3
            
            'meal_insights': {
                'most_common_meal': analytics.get('meal_patterns', {}).get('meal_regularity', {}).get('most_common_meal'),
                'meal_frequency': analytics.get('meal_patterns', {}).get('meal_frequency', {}),
                'food_diversity': analytics.get('food_preferences', {}).get('dietary_patterns', {}).get('food_diversity_score', 0)
            }
        }
        
        # Add predictions if available
        predictions = analytics.get('predictions', {})
        if predictions.get('status') == 'available':
            insights['predictions'] = {
                'weekly_calorie_projection': predictions.get('weekly_projections', {}).get('estimated_weekly_calories', 0),
                'trend_direction': predictions.get('weekly_projections', {}).get('trend_direction', 'stable'),
                'sustainability_score': predictions.get('health_trajectory', {}).get('sustainability_score', 0)
            }
        
        return insights
        
    except Exception as e:
        logger.error(f"❌ Failed to get nutrition insights: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get insights: {str(e)}"
        )

@router.post("/batch-analyze",
             summary="Batch analyze multiple food images",
             description="Upload and analyze multiple food images in a single request.")
async def batch_analyze_food_images(
    files: List[UploadFile] = File(..., description="List of food image files"),
    meal_types: str = Form(..., description="Comma-separated meal types corresponding to each image"),
    text_descriptions: Optional[str] = Form(None, description="Comma-separated text descriptions (optional)"),
    dietary_restrictions: Optional[str] = Form(None, description="Comma-separated dietary restrictions"),
    current_user = Depends(get_current_user),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """Batch analyze multiple food images with integrated ETL processing"""
    
    if len(files) > 10:  # Limit batch size
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 10 images allowed per batch"
        )
    
    # Parse parameters
    meal_type_list = [mt.strip() for mt in meal_types.split(',')]
    description_list = [desc.strip() for desc in text_descriptions.split(',')] if text_descriptions else []
    restriction_list = dietary_restrictions.split(',') if dietary_restrictions else []
    
    if len(meal_type_list) != len(files):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Number of meal types must match number of images"
        )
    
    try:
        system = await get_integrated_system()
        user_id = current_user.get('user_id', 'unknown_user')
        
        batch_results = []
        
        for i, file in enumerate(files):
            if not file.content_type.startswith('image/'):
                batch_results.append({
                    'file_index': i,
                    'filename': file.filename,
                    'status': 'error',
                    'error': 'File is not an image'
                })
                continue
            
            try:
                image_data = await file.read()
                meal_type = meal_type_list[i]
                text_desc = description_list[i] if i < len(description_list) else None
                
                # Analyze image
                result = await system.analyze_and_store_food_image(
                    image_data=image_data,
                    user_id=user_id,
                    meal_type=meal_type,
                    text_description=text_desc,
                    dietary_restrictions=restriction_list,
                    use_complete_pipeline=True
                )
                
                batch_results.append({
                    'file_index': i,
                    'filename': file.filename,
                    'analysis_id': result.get('analysis_id'),
                    'status': result.get('status', 'unknown'),
                    'detected_foods_count': len(result.get('food_analysis', {}).get('detected_foods', [])),
                    'total_calories': result.get('food_analysis', {}).get('nutrition_summary', {}).get('total_calories', 0),
                    'confidence_score': result.get('food_analysis', {}).get('confidence_metrics', {}).get('overall_confidence', 0),
                    'etl_stored': result.get('etl_processing', {}).get('status') == 'success'
                })
                
            except Exception as e:
                batch_results.append({
                    'file_index': i,
                    'filename': file.filename,
                    'status': 'error',
                    'error': str(e)
                })
        
        # Calculate batch summary
        successful_analyses = [r for r in batch_results if r['status'] == 'success']
        total_calories = sum(r.get('total_calories', 0) for r in successful_analyses)
        
        batch_summary = {
            'batch_id': f"batch_{user_id}_{int(datetime.now().timestamp())}",
            'user_id': user_id,
            'total_images': len(files),
            'successful_analyses': len(successful_analyses),
            'failed_analyses': len(files) - len(successful_analyses),
            'total_calories_detected': total_calories,
            'processing_completed_at': datetime.now().isoformat(),
            
            'results': batch_results
        }
        
        # Schedule background analytics update
        background_tasks.add_task(
            update_user_analytics_cache,
            user_id,
            batch_summary['batch_id']
        )
        
        logger.info(f"✅ Batch analysis completed: {len(successful_analyses)}/{len(files)} successful")
        return batch_summary
        
    except Exception as e:
        logger.error(f"❌ Batch analysis failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch analysis failed: {str(e)}"
        )

@router.get("/system/status",
            summary="Get integrated system status",
            description="Get comprehensive status of the integrated Food Vision + ETL system.")
async def get_system_status():
    """Get comprehensive system status and health metrics"""
    
    try:
        system = await get_integrated_system()
        status_info = await system.get_system_status()
        
        return {
            'timestamp': datetime.now().isoformat(),
            'overall_status': 'operational' if status_info.get('status') == 'operational' else 'degraded',
            'system_info': status_info,
            'api_version': '2.0',
            'features_available': [
                'food_image_analysis',
                'automatic_etl_storage',
                'nutrition_analytics',
                'batch_processing',
                'real_time_insights',
                'historical_data_retrieval'
            ]
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to get system status: {e}")
        return {
            'timestamp': datetime.now().isoformat(),
            'overall_status': 'error',
            'error': str(e),
            'api_version': '2.0'
        }

@router.get("/system/metrics",
            summary="Get system performance metrics",
            description="Get detailed performance metrics and usage statistics.")
async def get_system_metrics(
    current_user = Depends(get_current_user)
):
    """Get system performance metrics (admin only)"""
    
    if not current_user.get('is_admin', False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        system = await get_integrated_system()
        
        # Get processing stats
        stats = system.processing_stats
        
        # Additional system metrics
        metrics = {
            'processing_statistics': stats,
            'system_performance': {
                'average_analysis_time': stats.get('average_processing_time', 0),
                'success_rate': (stats.get('successful_etl_processes', 0) / 
                               max(1, stats.get('total_analyses', 1)) * 100),
                'total_analyses_completed': stats.get('total_analyses', 0),
                'etl_processing_rate': (stats.get('successful_etl_processes', 0) / 
                                      max(1, stats.get('total_analyses', 1)) * 100)
            },
            'system_health': {
                'food_vision_available': system.simplified_vision is not None,
                'etl_pipeline_active': system.etl_pipeline is not None,
                'real_time_processing': system.enable_real_time,
                'mongodb_connected': system.mongodb_client is not None
            },
            'generated_at': datetime.now().isoformat()
        }
        
        return metrics
        
    except Exception as e:
        logger.error(f"❌ Failed to get system metrics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get metrics: {str(e)}"
        )

# Helper functions
async def update_user_analytics_cache(user_id: str, analysis_id: str):
    """Background task to update user analytics cache"""
    try:
        # This would update cached analytics for faster retrieval
        logger.info(f"🔄 Updating analytics cache for user {user_id} after analysis {analysis_id}")
        
        # Implementation would depend on your caching strategy
        # For now, this is a placeholder
        await asyncio.sleep(1)  # Simulate cache update
        
        logger.info(f"✅ Analytics cache updated for user {user_id}")
        
    except Exception as e:
        logger.error(f"❌ Failed to update analytics cache: {e}")

def _calculate_meal_distribution(records: List[Dict]) -> Dict[str, int]:
    """Calculate meal type distribution from records"""
    distribution = {}
    
    for record in records:
        meal_type = record.get('meal_type', 'unknown')
        distribution[meal_type] = distribution.get(meal_type, 0) + 1
    
    return distribution

# Add router to your main FastAPI app
# app.include_router(router)
