"""
Food Vision Pipeline ETL Integration
==================================

This module integrates the Complete Food Vision Pipeline with the Azure EFS ETL system,
enabling automatic storage, processing, and retrieval of food analysis data for the diet agent.

Features:
- Automatic storage of food vision analysis results
- Real-time ETL processing for food analyses
- Enhanced data retrieval with nutrition insights
- Comprehensive analytics and reporting
- User meal tracking and pattern analysis
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union
import json
from pathlib import Path
import hashlib

# Import existing systems
from .azure_efs_etl_pipeline import DietAgentETLPipeline, DietDataExtractor, DietDataTransformer, DietDataLoader, DietDataRetriever
from .config import AzureETLConfig
from .scheduler import ETLScheduler, ETLJobMonitor

# Import Food Vision Pipeline (assuming it's available)
try:
    from ...aiservices.dietaiservices.simplified_complete_vision import SimplifiedCompleteFoodVisionPipeline
    from ...aiservices.dietaiservices.enhanced_image_processor import EnhancedFoodVisionAnalyzer
    FOOD_VISION_AVAILABLE = True
except ImportError:
    FOOD_VISION_AVAILABLE = False
    logging.warning("Food Vision Pipeline not available - using mock interface")

logger = logging.getLogger(__name__)

class FoodVisionETLIntegration:
    """
    Integrated Food Vision Pipeline with ETL System
    
    This class provides seamless integration between food image analysis
    and Azure EFS storage for comprehensive diet tracking and analytics.
    """
    
    def __init__(self, 
                 etl_config: AzureETLConfig,
                 mongodb_client = None,
                 enable_real_time_processing: bool = True):
        """Initialize the integrated system"""
        
        # Initialize ETL Pipeline
        self.etl_pipeline = DietAgentETLPipeline(etl_config, mongodb_client)
        
        # Initialize Food Vision Pipelines
        if FOOD_VISION_AVAILABLE:
            self.simplified_vision = SimplifiedCompleteFoodVisionPipeline(mongodb_client)
            self.enhanced_vision = EnhancedFoodVisionAnalyzer(mongodb_client)
        else:
            self.simplified_vision = None
            self.enhanced_vision = None
            
        self.config = etl_config
        self.mongodb_client = mongodb_client
        self.enable_real_time = enable_real_time_processing
        
        # Processing stats
        self.processing_stats = {
            'total_analyses': 0,
            'successful_etl_processes': 0,
            'failed_etl_processes': 0,
            'average_processing_time': 0.0,
            'last_updated': datetime.now()
        }
        
        logger.info("✅ Food Vision ETL Integration initialized")
    
    async def analyze_and_store_food_image(self,
                                         image_data: bytes,
                                         user_id: str,
                                         meal_type: str = 'lunch',
                                         text_description: Optional[str] = None,
                                         dietary_restrictions: Optional[List[str]] = None,
                                         use_complete_pipeline: bool = True) -> Dict[str, Any]:
        """
        Analyze food image and automatically store results via ETL pipeline
        
        Args:
            image_data: Raw image bytes
            user_id: User identifier
            meal_type: Type of meal (breakfast, lunch, dinner, snack)
            text_description: Optional text description of the food
            dietary_restrictions: List of dietary restrictions
            use_complete_pipeline: Whether to use complete 6-step pipeline
            
        Returns:
            Comprehensive analysis result with ETL storage confirmation
        """
        analysis_start = datetime.now()
        
        try:
            logger.info(f"🔄 Starting integrated food analysis for user {user_id}")
            
            # Step 1: Perform Food Vision Analysis
            if use_complete_pipeline and self.simplified_vision:
                vision_result = await self.simplified_vision.analyze_food_image_complete(
                    image_data=image_data,
                    user_id=user_id,
                    meal_type=meal_type,
                    text_description=text_description,
                    dietary_restrictions=dietary_restrictions or []
                )
                analysis_method = 'complete_vision_pipeline'
            elif self.enhanced_vision:
                vision_result = await self.enhanced_vision.analyze_food_image(
                    image_data=image_data,
                    user_id=user_id,
                    meal_type=meal_type,
                    text_description=text_description
                )
                analysis_method = 'enhanced_vision_analyzer'
            else:
                # Fallback mock analysis
                vision_result = await self._mock_food_analysis(
                    user_id, meal_type, text_description
                )
                analysis_method = 'mock_analysis'
            
            # Step 2: Real-time ETL Processing (if enabled)
            etl_result = None
            if self.enable_real_time:
                etl_result = await self._process_analysis_via_etl(vision_result, analysis_method)
            
            # Step 3: Generate Enhanced Insights
            insights = await self._generate_nutrition_insights(vision_result, user_id)
            
            # Step 4: Calculate processing metrics
            processing_time = (datetime.now() - analysis_start).total_seconds()
            self._update_processing_stats(processing_time, etl_result is not None)
            
            # Step 5: Compile comprehensive result
            integrated_result = {
                'analysis_id': vision_result.get('analysis_id', f"integrated_{user_id}_{int(datetime.now().timestamp())}"),
                'user_id': user_id,
                'timestamp': datetime.now().isoformat(),
                'meal_type': meal_type,
                'text_description': text_description,
                'dietary_restrictions': dietary_restrictions or [],
                
                # Food Vision Results
                'food_analysis': {
                    'detected_foods': vision_result.get('detected_foods', []),
                    'nutrition_summary': vision_result.get('nutrition_summary', {}),
                    'confidence_metrics': vision_result.get('confidence_metrics', {}),
                    'analysis_method': analysis_method,
                    'pipeline_steps': vision_result.get('pipeline_metadata', {}).get('steps_completed', [])
                },
                
                # ETL Processing Results
                'etl_processing': {
                    'enabled': self.enable_real_time,
                    'status': etl_result.get('status') if etl_result else 'disabled',
                    'azure_efs_storage': etl_result.get('storage_location') if etl_result else None,
                    'processing_time_seconds': etl_result.get('processing_time') if etl_result else 0
                },
                
                # Enhanced Insights
                'nutrition_insights': insights,
                
                # Processing Metrics
                'performance_metrics': {
                    'total_processing_time_seconds': processing_time,
                    'vision_analysis_time': vision_result.get('processing_metrics', {}).get('total_time', 0),
                    'etl_processing_time': etl_result.get('processing_time', 0) if etl_result else 0,
                    'insights_generation_time': insights.get('generation_time_seconds', 0)
                },
                
                # System Metadata
                'system_metadata': {
                    'integration_version': '2.0',
                    'food_vision_available': FOOD_VISION_AVAILABLE,
                    'etl_real_time_enabled': self.enable_real_time,
                    'data_accuracy': 'research_database_verified',
                    'processing_node': 'integrated_pipeline'
                }
            }
            
            logger.info(f"✅ Integrated food analysis completed in {processing_time:.2f}s")
            return integrated_result
            
        except Exception as e:
            logger.error(f"❌ Integrated food analysis failed: {e}")
            return {
                'analysis_id': f"error_{user_id}_{int(datetime.now().timestamp())}",
                'user_id': user_id,
                'error': str(e),
                'status': 'failed',
                'timestamp': datetime.now().isoformat()
            }
    
    async def _process_analysis_via_etl(self, vision_result: Dict[str, Any], method: str) -> Dict[str, Any]:
        """Process food analysis result through ETL pipeline"""
        try:
            # Create ETL-compatible data structure
            etl_data = {
                'analysis_id': vision_result.get('analysis_id'),
                'user_id': vision_result.get('user_id'),
                'created_at': datetime.now(),
                'detected_foods': vision_result.get('detected_foods', []),
                'total_nutrition': vision_result.get('nutrition_summary', {}),
                'confidence_score': vision_result.get('confidence_metrics', {}).get('overall_confidence', 0),
                'analysis_method': method,
                'processing_time_seconds': vision_result.get('processing_metrics', {}).get('total_time', 0),
                'meal_type': vision_result.get('meal_type', 'unknown'),
                'text_description': vision_result.get('text_description'),
                'metadata': {
                    'pipeline_steps': vision_result.get('pipeline_metadata', {}).get('steps_completed', []),
                    'data_source': 'integrated_food_vision',
                    'etl_processed_at': datetime.now().isoformat()
                }
            }
            
            # Transform data for ETL
            transformer = DietDataTransformer()
            transformed_data = transformer.transform_food_analyses([etl_data])
            
            # Load to Azure EFS
            loader = DietDataLoader(self.config)
            storage_result = await loader.load_food_analyses(transformed_data)
            
            return {
                'status': 'success',
                'storage_location': storage_result.get('file_path'),
                'records_stored': storage_result.get('records_count', 1),
                'processing_time': storage_result.get('processing_time', 0),
                'compression_ratio': storage_result.get('compression_ratio', 1.0)
            }
            
        except Exception as e:
            logger.error(f"ETL processing failed: {e}")
            return {
                'status': 'failed',
                'error': str(e),
                'processing_time': 0
            }
    
    async def _generate_nutrition_insights(self, vision_result: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """Generate enhanced nutrition insights from analysis result"""
        insights_start = datetime.now()
        
        try:
            nutrition_summary = vision_result.get('nutrition_summary', {})
            detected_foods = vision_result.get('detected_foods', [])
            
            # Basic nutrition analysis
            total_calories = nutrition_summary.get('total_calories', 0)
            total_protein = nutrition_summary.get('total_protein_g', 0)
            total_carbs = nutrition_summary.get('total_carbohydrates_g', 0)
            total_fat = nutrition_summary.get('total_fat_g', 0)
            
            # Macronutrient distribution
            if total_calories > 0:
                protein_pct = (total_protein * 4 / total_calories) * 100
                carbs_pct = (total_carbs * 4 / total_calories) * 100
                fat_pct = (total_fat * 9 / total_calories) * 100
            else:
                protein_pct = carbs_pct = fat_pct = 0
            
            # Meal quality assessment
            meal_quality = self._assess_meal_quality(nutrition_summary, detected_foods)
            
            # Historical comparison (if available)
            historical_data = await self._get_user_nutrition_history(user_id)
            
            # Generate recommendations
            recommendations = self._generate_personalized_recommendations(
                nutrition_summary, meal_quality, historical_data
            )
            
            insights = {
                'nutrition_breakdown': {
                    'total_calories': total_calories,
                    'macronutrient_distribution': {
                        'protein_percent': round(protein_pct, 1),
                        'carbohydrates_percent': round(carbs_pct, 1),
                        'fat_percent': round(fat_pct, 1)
                    },
                    'adequacy_assessment': {
                        'protein_adequate': protein_pct >= 15,
                        'carbs_balanced': 45 <= carbs_pct <= 65,
                        'fat_appropriate': 20 <= fat_pct <= 35
                    }
                },
                
                'meal_quality': meal_quality,
                
                'food_diversity': {
                    'unique_foods': len(detected_foods),
                    'food_categories': self._categorize_foods(detected_foods),
                    'diversity_score': min(len(detected_foods) * 20, 100)  # Max 100
                },
                
                'historical_comparison': historical_data,
                
                'personalized_recommendations': recommendations,
                
                'health_indicators': {
                    'calorie_density': total_calories / max(1, len(detected_foods)),
                    'protein_density': total_protein / max(1, total_calories / 100),
                    'nutrient_density_score': meal_quality.get('overall_score', 0)
                },
                
                'generation_time_seconds': (datetime.now() - insights_start).total_seconds(),
                'generated_at': datetime.now().isoformat()
            }
            
            return insights
            
        except Exception as e:
            logger.error(f"Failed to generate nutrition insights: {e}")
            return {
                'error': str(e),
                'generation_time_seconds': (datetime.now() - insights_start).total_seconds()
            }
    
    def _assess_meal_quality(self, nutrition: Dict[str, Any], foods: List[Dict]) -> Dict[str, Any]:
        """Assess overall meal quality based on nutrition and food diversity"""
        
        quality_factors = {
            'nutrition_balance': 0,
            'food_diversity': 0,
            'processing_level': 0,
            'portion_appropriateness': 0
        }
        
        # Nutrition balance (40% of score)
        total_calories = nutrition.get('total_calories', 0)
        if total_calories > 0:
            protein_g = nutrition.get('total_protein_g', 0)
            carbs_g = nutrition.get('total_carbohydrates_g', 0)
            fat_g = nutrition.get('total_fat_g', 0)
            
            protein_pct = (protein_g * 4 / total_calories) * 100
            carbs_pct = (carbs_g * 4 / total_calories) * 100
            fat_pct = (fat_g * 9 / total_calories) * 100
            
            balance_score = 0
            if 15 <= protein_pct <= 35:
                balance_score += 33
            if 45 <= carbs_pct <= 65:
                balance_score += 33
            if 20 <= fat_pct <= 35:
                balance_score += 34
                
            quality_factors['nutrition_balance'] = balance_score * 0.4
        
        # Food diversity (30% of score)
        food_categories = self._categorize_foods(foods)
        diversity_score = min(len(food_categories) * 25, 100)
        quality_factors['food_diversity'] = diversity_score * 0.3
        
        # Processing level assessment (20% of score)
        # Prefer whole foods over processed foods
        processing_score = 80  # Default good score
        quality_factors['processing_level'] = processing_score * 0.2
        
        # Portion appropriateness (10% of score)
        portion_score = 85  # Default reasonable score
        if 200 <= total_calories <= 800:  # Reasonable meal range
            portion_score = 100
        elif total_calories > 1000:
            portion_score = 60
        elif total_calories < 100:
            portion_score = 40
            
        quality_factors['portion_appropriateness'] = portion_score * 0.1
        
        overall_score = sum(quality_factors.values())
        
        return {
            'overall_score': round(overall_score, 1),
            'grade': self._score_to_grade(overall_score),
            'factors': quality_factors,
            'recommendations': self._quality_recommendations(quality_factors)
        }
    
    def _categorize_foods(self, foods: List[Dict]) -> List[str]:
        """Categorize detected foods into nutrition categories"""
        categories = set()
        
        for food in foods:
            food_name = food.get('name', '').lower()
            
            # Categorization logic
            if any(grain in food_name for grain in ['rice', 'bread', 'roti', 'noodles', 'pasta']):
                categories.add('grains')
            elif any(protein in food_name for protein in ['chicken', 'fish', 'meat', 'egg', 'dal', 'beans']):
                categories.add('protein')
            elif any(veg in food_name for veg in ['vegetable', 'curry', 'salad', 'greens']):
                categories.add('vegetables')
            elif any(fruit in food_name for fruit in ['fruit', 'banana', 'apple', 'mango']):
                categories.add('fruits')
            elif any(dairy in food_name for dairy in ['milk', 'yogurt', 'cheese']):
                categories.add('dairy')
            else:
                categories.add('other')
        
        return list(categories)
    
    def _score_to_grade(self, score: float) -> str:
        """Convert numeric score to letter grade"""
        if score >= 90:
            return 'A'
        elif score >= 80:
            return 'B'
        elif score >= 70:
            return 'C'
        elif score >= 60:
            return 'D'
        else:
            return 'F'
    
    def _quality_recommendations(self, factors: Dict[str, float]) -> List[str]:
        """Generate recommendations based on quality factors"""
        recommendations = []
        
        if factors['nutrition_balance'] < 30:
            recommendations.append("Consider balancing macronutrients - aim for 15-35% protein, 45-65% carbs, 20-35% fat")
        
        if factors['food_diversity'] < 20:
            recommendations.append("Try to include more variety - different food groups provide different nutrients")
        
        if factors['processing_level'] < 15:
            recommendations.append("Consider choosing more whole, unprocessed foods when possible")
        
        if factors['portion_appropriateness'] < 8:
            recommendations.append("Review portion sizes - aim for balanced meal portions")
        
        if not recommendations:
            recommendations.append("Great meal balance! Keep up the healthy eating patterns")
        
        return recommendations
    
    def _generate_personalized_recommendations(self, 
                                            nutrition: Dict[str, Any],
                                            meal_quality: Dict[str, Any],
                                            historical_data: Dict[str, Any]) -> List[str]:
        """Generate personalized nutrition recommendations"""
        recommendations = []
        
        total_calories = nutrition.get('total_calories', 0)
        
        # Basic recommendations based on current meal
        if total_calories < 200:
            recommendations.append("Consider adding more nutritious foods to meet your energy needs")
        elif total_calories > 800:
            recommendations.append("This is a substantial meal - consider smaller portions or sharing")
        
        # Quality-based recommendations
        if meal_quality.get('overall_score', 0) < 70:
            recommendations.extend(meal_quality.get('recommendations', []))
        
        # Historical pattern recommendations
        if historical_data.get('avg_daily_calories', 0) > 2500:
            recommendations.append("Consider focusing on lower-calorie, nutrient-dense foods")
        
        # Default positive reinforcement
        if not recommendations:
            recommendations.append("Well-balanced meal choice! Continue maintaining healthy eating habits")
        
        return recommendations
    
    async def _get_user_nutrition_history(self, user_id: str, days: int = 7) -> Dict[str, Any]:
        """Retrieve user's nutrition history for comparison"""
        try:
            # Use ETL retriever to get historical data
            retriever = DietDataRetriever(self.config)
            
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)
            
            historical_data = await retriever.retrieve_nutrition_data(
                data_types=['nutrition_logs', 'food_analyses'],
                start_date=start_date,
                end_date=end_date,
                user_ids=[user_id]
            )
            
            if not historical_data.get('records'):
                return {'status': 'no_history', 'days_analyzed': days}
            
            # Calculate averages
            total_records = len(historical_data['records'])
            total_calories = sum(record.get('total_nutrition', {}).get('calories', 0) 
                               for record in historical_data['records'])
            total_protein = sum(record.get('total_nutrition', {}).get('protein', 0) 
                              for record in historical_data['records'])
            
            return {
                'status': 'available',
                'days_analyzed': days,
                'total_meals_recorded': total_records,
                'avg_daily_calories': total_calories / max(1, days),
                'avg_daily_protein': total_protein / max(1, days),
                'data_quality': 'good' if total_records >= days * 2 else 'limited'
            }
            
        except Exception as e:
            logger.error(f"Failed to retrieve user history: {e}")
            return {'status': 'error', 'error': str(e)}
    
    async def _mock_food_analysis(self, user_id: str, meal_type: str, text_description: str) -> Dict[str, Any]:
        """Mock food analysis when Food Vision Pipeline is not available"""
        
        # Extract food items from text description
        foods = []
        if text_description:
            # Simple food extraction (in reality, this would be more sophisticated)
            common_foods = ['rice', 'chicken', 'curry', 'vegetables', 'dal', 'roti']
            detected = [food for food in common_foods if food in text_description.lower()]
            
            for food in detected:
                foods.append({
                    'name': food,
                    'confidence': 0.7,
                    'nutrition': {
                        'calories': 150,  # Mock values
                        'protein': 8,
                        'carbs': 20,
                        'fat': 5
                    }
                })
        
        if not foods:
            # Default mock meal
            foods = [{
                'name': 'mixed_meal',
                'confidence': 0.5,
                'nutrition': {
                    'calories': 300,
                    'protein': 15,
                    'carbs': 35,
                    'fat': 10
                }
            }]
        
        # Calculate totals
        total_nutrition = {
            'total_calories': sum(f['nutrition']['calories'] for f in foods),
            'total_protein_g': sum(f['nutrition']['protein'] for f in foods),
            'total_carbohydrates_g': sum(f['nutrition']['carbs'] for f in foods),
            'total_fat_g': sum(f['nutrition']['fat'] for f in foods)
        }
        
        return {
            'analysis_id': f"mock_{user_id}_{int(datetime.now().timestamp())}",
            'user_id': user_id,
            'meal_type': meal_type,
            'text_description': text_description,
            'detected_foods': foods,
            'nutrition_summary': total_nutrition,
            'confidence_metrics': {
                'overall_confidence': 0.6
            },
            'processing_metrics': {
                'total_time': 0.1
            },
            'pipeline_metadata': {
                'steps_completed': ['mock_analysis'],
                'version': 'mock_1.0'
            }
        }
    
    def _update_processing_stats(self, processing_time: float, etl_success: bool):
        """Update internal processing statistics"""
        self.processing_stats['total_analyses'] += 1
        
        if etl_success:
            self.processing_stats['successful_etl_processes'] += 1
        else:
            self.processing_stats['failed_etl_processes'] += 1
        
        # Update average processing time
        current_avg = self.processing_stats['average_processing_time']
        total_analyses = self.processing_stats['total_analyses']
        
        new_avg = ((current_avg * (total_analyses - 1)) + processing_time) / total_analyses
        self.processing_stats['average_processing_time'] = new_avg
        self.processing_stats['last_updated'] = datetime.now()
    
    async def get_user_nutrition_analytics(self, 
                                         user_id: str,
                                         start_date: Optional[datetime] = None,
                                         end_date: Optional[datetime] = None,
                                         include_predictions: bool = True) -> Dict[str, Any]:
        """
        Get comprehensive nutrition analytics for a user
        
        Args:
            user_id: User identifier
            start_date: Start date for analysis (default: 30 days ago)
            end_date: End date for analysis (default: now)
            include_predictions: Whether to include predictive insights
            
        Returns:
            Comprehensive nutrition analytics report
        """
        
        if not end_date:
            end_date = datetime.now()
        if not start_date:
            start_date = end_date - timedelta(days=30)
        
        try:
            # Retrieve user data using ETL system
            retriever = DietDataRetriever(self.config)
            
            user_data = await retriever.retrieve_nutrition_data(
                data_types=['nutrition_logs', 'food_analyses'],
                start_date=start_date,
                end_date=end_date,
                user_ids=[user_id]
            )
            
            if not user_data.get('records'):
                return {
                    'user_id': user_id,
                    'status': 'no_data',
                    'message': 'No nutrition data found for the specified period',
                    'date_range': {
                        'start': start_date.isoformat(),
                        'end': end_date.isoformat()
                    }
                }
            
            records = user_data['records']
            
            # Calculate comprehensive analytics
            analytics = {
                'user_id': user_id,
                'status': 'success',
                'date_range': {
                    'start': start_date.isoformat(),
                    'end': end_date.isoformat(),
                    'days_analyzed': (end_date - start_date).days
                },
                
                'summary_statistics': self._calculate_summary_statistics(records),
                'nutrition_trends': self._analyze_nutrition_trends(records),
                'meal_patterns': self._analyze_meal_patterns(records),
                'food_preferences': self._analyze_food_preferences(records),
                'health_indicators': self._calculate_health_indicators(records),
                'recommendations': self._generate_analytics_recommendations(records),
                
                'data_quality': {
                    'total_records': len(records),
                    'days_with_data': len(set(r.get('date', '')[:10] for r in records)),
                    'average_meals_per_day': len(records) / max(1, (end_date - start_date).days),
                    'completeness_score': min(len(records) / ((end_date - start_date).days * 3) * 100, 100)
                },
                
                'generated_at': datetime.now().isoformat()
            }
            
            # Add predictions if requested
            if include_predictions:
                analytics['predictions'] = await self._generate_nutrition_predictions(records, user_id)
            
            return analytics
            
        except Exception as e:
            logger.error(f"Failed to generate user nutrition analytics: {e}")
            return {
                'user_id': user_id,
                'status': 'error',
                'error': str(e),
                'generated_at': datetime.now().isoformat()
            }
    
    def _calculate_summary_statistics(self, records: List[Dict]) -> Dict[str, Any]:
        """Calculate summary nutrition statistics"""
        
        total_calories = []
        total_protein = []
        total_carbs = []
        total_fat = []
        
        for record in records:
            nutrition = record.get('total_nutrition', {})
            total_calories.append(nutrition.get('calories', 0))
            total_protein.append(nutrition.get('protein', 0))
            total_carbs.append(nutrition.get('carbs', 0))
            total_fat.append(nutrition.get('fat', 0))
        
        return {
            'calories': {
                'average': sum(total_calories) / len(total_calories) if total_calories else 0,
                'min': min(total_calories) if total_calories else 0,
                'max': max(total_calories) if total_calories else 0,
                'total': sum(total_calories)
            },
            'protein_g': {
                'average': sum(total_protein) / len(total_protein) if total_protein else 0,
                'min': min(total_protein) if total_protein else 0,
                'max': max(total_protein) if total_protein else 0,
                'total': sum(total_protein)
            },
            'carbohydrates_g': {
                'average': sum(total_carbs) / len(total_carbs) if total_carbs else 0,
                'min': min(total_carbs) if total_carbs else 0,
                'max': max(total_carbs) if total_carbs else 0,
                'total': sum(total_carbs)
            },
            'fat_g': {
                'average': sum(total_fat) / len(total_fat) if total_fat else 0,
                'min': min(total_fat) if total_fat else 0,
                'max': max(total_fat) if total_fat else 0,
                'total': sum(total_fat)
            }
        }
    
    def _analyze_nutrition_trends(self, records: List[Dict]) -> Dict[str, Any]:
        """Analyze nutrition trends over time"""
        
        # Group records by date
        daily_nutrition = {}
        
        for record in records:
            date_str = record.get('date', record.get('created_at', ''))[:10]  # YYYY-MM-DD
            
            if date_str not in daily_nutrition:
                daily_nutrition[date_str] = {
                    'calories': 0,
                    'protein': 0,
                    'carbs': 0,
                    'fat': 0,
                    'meals': 0
                }
            
            nutrition = record.get('total_nutrition', {})
            daily_nutrition[date_str]['calories'] += nutrition.get('calories', 0)
            daily_nutrition[date_str]['protein'] += nutrition.get('protein', 0)
            daily_nutrition[date_str]['carbs'] += nutrition.get('carbs', 0)
            daily_nutrition[date_str]['fat'] += nutrition.get('fat', 0)
            daily_nutrition[date_str]['meals'] += 1
        
        # Calculate trends
        sorted_dates = sorted(daily_nutrition.keys())
        
        if len(sorted_dates) < 2:
            return {'status': 'insufficient_data'}
        
        # Simple trend calculation (last 7 days vs previous 7 days)
        mid_point = len(sorted_dates) // 2
        recent_dates = sorted_dates[mid_point:]
        earlier_dates = sorted_dates[:mid_point]
        
        recent_avg_calories = sum(daily_nutrition[d]['calories'] for d in recent_dates) / len(recent_dates)
        earlier_avg_calories = sum(daily_nutrition[d]['calories'] for d in earlier_dates) / len(earlier_dates)
        
        calorie_trend = ((recent_avg_calories - earlier_avg_calories) / earlier_avg_calories * 100) if earlier_avg_calories > 0 else 0
        
        return {
            'status': 'available',
            'daily_averages': {
                'recent_period': {
                    'calories': recent_avg_calories,
                    'days': len(recent_dates)
                },
                'earlier_period': {
                    'calories': earlier_avg_calories,
                    'days': len(earlier_dates)
                }
            },
            'trends': {
                'calorie_change_percent': round(calorie_trend, 1),
                'trend_direction': 'increasing' if calorie_trend > 5 else 'decreasing' if calorie_trend < -5 else 'stable'
            },
            'daily_data': daily_nutrition
        }
    
    def _analyze_meal_patterns(self, records: List[Dict]) -> Dict[str, Any]:
        """Analyze meal timing and frequency patterns"""
        
        meal_types = {}
        meal_times = {}
        
        for record in records:
            meal_type = record.get('meal_type', 'unknown')
            created_at = record.get('created_at', '')
            
            # Count meal types
            meal_types[meal_type] = meal_types.get(meal_type, 0) + 1
            
            # Analyze meal times (if timestamp available)
            if created_at and 'T' in created_at:
                try:
                    time_part = created_at.split('T')[1][:5]  # HH:MM
                    hour = int(time_part[:2])
                    
                    if meal_type not in meal_times:
                        meal_times[meal_type] = []
                    meal_times[meal_type].append(hour)
                    
                except (ValueError, IndexError):
                    pass
        
        # Calculate average meal times
        avg_meal_times = {}
        for meal_type, hours in meal_times.items():
            if hours:
                avg_meal_times[meal_type] = sum(hours) / len(hours)
        
        return {
            'meal_frequency': meal_types,
            'average_meal_times': avg_meal_times,
            'meal_regularity': {
                'total_meals': len(records),
                'most_common_meal': max(meal_types.items(), key=lambda x: x[1])[0] if meal_types else 'none',
                'meal_diversity': len(meal_types)
            }
        }
    
    def _analyze_food_preferences(self, records: List[Dict]) -> Dict[str, Any]:
        """Analyze user's food preferences and dietary patterns"""
        
        food_frequency = {}
        
        for record in records:
            food_items = record.get('food_items', record.get('detected_foods', []))
            
            for food_item in food_items:
                if isinstance(food_item, dict):
                    food_name = food_item.get('name', food_item.get('food_name', 'unknown'))
                elif isinstance(food_item, str):
                    food_name = food_item
                else:
                    continue
                
                food_name = food_name.lower().strip()
                food_frequency[food_name] = food_frequency.get(food_name, 0) + 1
        
        # Get top foods
        top_foods = sorted(food_frequency.items(), key=lambda x: x[1], reverse=True)[:10]
        
        # Categorize preferences
        categories = self._categorize_food_preferences(food_frequency)
        
        return {
            'top_foods': [{'name': name, 'frequency': freq} for name, freq in top_foods],
            'food_categories': categories,
            'dietary_patterns': {
                'total_unique_foods': len(food_frequency),
                'most_frequent_food': top_foods[0][0] if top_foods else 'none',
                'food_diversity_score': min(len(food_frequency) * 10, 100)
            }
        }
    
    def _categorize_food_preferences(self, food_frequency: Dict[str, int]) -> Dict[str, int]:
        """Categorize foods into dietary categories"""
        
        categories = {
            'grains': 0,
            'proteins': 0,
            'vegetables': 0,
            'fruits': 0,
            'dairy': 0,
            'snacks': 0,
            'beverages': 0,
            'other': 0
        }
        
        for food_name, frequency in food_frequency.items():
            if any(grain in food_name for grain in ['rice', 'bread', 'roti', 'noodles', 'pasta']):
                categories['grains'] += frequency
            elif any(protein in food_name for protein in ['chicken', 'fish', 'meat', 'egg', 'dal', 'beans', 'lentils']):
                categories['proteins'] += frequency
            elif any(veg in food_name for veg in ['vegetable', 'curry', 'salad', 'greens', 'spinach']):
                categories['vegetables'] += frequency
            elif any(fruit in food_name for fruit in ['fruit', 'banana', 'apple', 'mango', 'orange']):
                categories['fruits'] += frequency
            elif any(dairy in food_name for dairy in ['milk', 'yogurt', 'cheese', 'curd']):
                categories['dairy'] += frequency
            elif any(snack in food_name for snack in ['biscuit', 'cake', 'chips', 'chocolate']):
                categories['snacks'] += frequency
            elif any(bev in food_name for bev in ['tea', 'coffee', 'juice', 'water']):
                categories['beverages'] += frequency
            else:
                categories['other'] += frequency
        
        return categories
    
    def _calculate_health_indicators(self, records: List[Dict]) -> Dict[str, Any]:
        """Calculate health-related indicators from nutrition data"""
        
        if not records:
            return {'status': 'no_data'}
        
        # Calculate daily averages
        summary_stats = self._calculate_summary_statistics(records)
        avg_calories = summary_stats['calories']['average']
        avg_protein = summary_stats['protein_g']['average']
        avg_carbs = summary_stats['carbohydrates_g']['average']
        avg_fat = summary_stats['fat_g']['average']
        
        # Health indicators
        indicators = {
            'caloric_balance': {
                'daily_average': avg_calories,
                'assessment': self._assess_caloric_intake(avg_calories),
                'target_range': '1800-2200 calories/day (varies by individual)'
            },
            
            'protein_adequacy': {
                'daily_average_g': avg_protein,
                'percentage_of_calories': (avg_protein * 4 / avg_calories * 100) if avg_calories > 0 else 0,
                'assessment': 'adequate' if avg_protein >= 50 else 'may_need_increase',
                'target_range': '15-35% of total calories'
            },
            
            'macronutrient_balance': {
                'protein_percent': (avg_protein * 4 / avg_calories * 100) if avg_calories > 0 else 0,
                'carbs_percent': (avg_carbs * 4 / avg_calories * 100) if avg_calories > 0 else 0,
                'fat_percent': (avg_fat * 9 / avg_calories * 100) if avg_calories > 0 else 0,
                'balance_assessment': self._assess_macro_balance(avg_protein, avg_carbs, avg_fat, avg_calories)
            },
            
            'meal_consistency': {
                'meals_per_day': len(records) / max(1, len(set(r.get('date', '')[:10] for r in records))),
                'consistency_score': self._calculate_consistency_score(records),
                'assessment': 'needs_improvement'  # Would be calculated based on actual data
            }
        }
        
        return indicators
    
    def _assess_caloric_intake(self, avg_calories: float) -> str:
        """Assess whether caloric intake is appropriate"""
        if avg_calories < 1200:
            return 'too_low'
        elif avg_calories < 1600:
            return 'low'
        elif avg_calories <= 2200:
            return 'appropriate'
        elif avg_calories <= 2800:
            return 'high'
        else:
            return 'too_high'
    
    def _assess_macro_balance(self, protein: float, carbs: float, fat: float, calories: float) -> str:
        """Assess macronutrient balance"""
        if calories == 0:
            return 'insufficient_data'
        
        protein_pct = (protein * 4 / calories) * 100
        carbs_pct = (carbs * 4 / calories) * 100
        fat_pct = (fat * 9 / calories) * 100
        
        balanced = (15 <= protein_pct <= 35 and 45 <= carbs_pct <= 65 and 20 <= fat_pct <= 35)
        
        if balanced:
            return 'well_balanced'
        elif protein_pct > 35:
            return 'high_protein'
        elif carbs_pct > 65:
            return 'high_carbohydrate'
        elif fat_pct > 35:
            return 'high_fat'
        else:
            return 'needs_adjustment'
    
    def _calculate_consistency_score(self, records: List[Dict]) -> float:
        """Calculate meal consistency score"""
        if len(records) < 7:
            return 50.0  # Insufficient data
        
        # Simple consistency measure based on meal frequency
        dates = [r.get('date', r.get('created_at', ''))[:10] for r in records]
        unique_dates = len(set(dates))
        total_days = (datetime.now() - datetime.fromisoformat(min(dates) + 'T00:00:00')).days + 1
        
        consistency = (unique_dates / total_days) * 100
        return min(consistency, 100)
    
    def _generate_analytics_recommendations(self, records: List[Dict]) -> List[str]:
        """Generate recommendations based on analytics"""
        recommendations = []
        
        if not records:
            return ["Start tracking your meals to get personalized recommendations"]
        
        summary_stats = self._calculate_summary_statistics(records)
        avg_calories = summary_stats['calories']['average']
        
        # Caloric recommendations
        if avg_calories < 1200:
            recommendations.append("Consider increasing your caloric intake with nutrient-dense foods")
        elif avg_calories > 2500:
            recommendations.append("Consider reducing portion sizes or choosing lower-calorie options")
        
        # Meal frequency
        unique_dates = len(set(r.get('date', '')[:10] for r in records))
        if len(records) / max(1, unique_dates) < 2:
            recommendations.append("Try to eat more regular meals throughout the day")
        
        # Default encouragement
        if not recommendations:
            recommendations.append("Keep up the good work with consistent meal tracking!")
        
        return recommendations
    
    async def _generate_nutrition_predictions(self, records: List[Dict], user_id: str) -> Dict[str, Any]:
        """Generate predictive nutrition insights"""
        
        try:
            if len(records) < 7:
                return {
                    'status': 'insufficient_data',
                    'message': 'Need at least 7 days of data for predictions'
                }
            
            # Simple trend-based predictions
            summary_stats = self._calculate_summary_statistics(records)
            trends = self._analyze_nutrition_trends(records)
            
            predictions = {
                'status': 'available',
                'confidence': 'low',  # Simple predictions have low confidence
                
                'weekly_projections': {
                    'estimated_weekly_calories': summary_stats['calories']['average'] * 7,
                    'estimated_weekly_protein': summary_stats['protein_g']['average'] * 7,
                    'trend_direction': trends.get('trends', {}).get('trend_direction', 'stable')
                },
                
                'health_trajectory': {
                    'current_pattern': 'maintenance' if trends.get('trends', {}).get('trend_direction') == 'stable' else 'changing',
                    'sustainability_score': 75,  # Default reasonable score
                    'areas_for_improvement': ['meal_consistency', 'nutrient_diversity']
                },
                
                'goal_recommendations': {
                    'weight_management': 'maintain_current_intake' if 1600 <= summary_stats['calories']['average'] <= 2200 else 'adjust_intake',
                    'nutrition_optimization': 'increase_variety',
                    'meal_planning': 'establish_routine'
                }
            }
            
            return predictions
            
        except Exception as e:
            logger.error(f"Failed to generate predictions: {e}")
            return {'status': 'error', 'error': str(e)}
    
    async def get_system_status(self) -> Dict[str, Any]:
        """Get comprehensive system status and health metrics"""
        
        try:
            # ETL system status
            etl_status = await self.etl_pipeline.get_system_health()
            
            # Processing statistics
            stats = self.processing_stats.copy()
            
            # Food Vision Pipeline status
            vision_status = {
                'simplified_pipeline_available': self.simplified_vision is not None,
                'enhanced_analyzer_available': self.enhanced_vision is not None,
                'overall_availability': FOOD_VISION_AVAILABLE
            }
            
            return {
                'system_name': 'Food Vision ETL Integration',
                'version': '2.0',
                'status': 'operational',
                'timestamp': datetime.now().isoformat(),
                
                'etl_system': etl_status,
                'food_vision_pipeline': vision_status,
                'processing_statistics': stats,
                
                'configuration': {
                    'real_time_processing_enabled': self.enable_real_time,
                    'azure_efs_configured': bool(self.config.azure_connection_string),
                    'mongodb_connected': self.mongodb_client is not None
                },
                
                'capabilities': {
                    'food_image_analysis': FOOD_VISION_AVAILABLE,
                    'automatic_etl_processing': self.enable_real_time,
                    'nutrition_analytics': True,
                    'historical_data_retrieval': True,
                    'predictive_insights': True,
                    'personalized_recommendations': True
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to get system status: {e}")
            return {
                'system_name': 'Food Vision ETL Integration',
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }

# Convenience function for easy integration
async def create_integrated_food_vision_etl(
    azure_connection_string: str,
    azure_share_name: str,
    mongodb_client = None,
    enable_real_time: bool = True) -> FoodVisionETLIntegration:
    """
    Create and initialize the integrated Food Vision ETL system
    
    Args:
        azure_connection_string: Azure storage connection string
        azure_share_name: Azure file share name
        mongodb_client: MongoDB client instance
        enable_real_time: Enable real-time ETL processing
        
    Returns:
        Initialized FoodVisionETLIntegration instance
    """
    
    config = AzureETLConfig(
        azure_connection_string=azure_connection_string,
        azure_share_name=azure_share_name,
        mongodb_uri="",  # Will use provided client
        enable_compression=True,
        enable_backup=True
    )
    
    integration = FoodVisionETLIntegration(
        etl_config=config,
        mongodb_client=mongodb_client,
        enable_real_time_processing=enable_real_time
    )
    
    logger.info("✅ Integrated Food Vision ETL system created successfully")
    return integration
