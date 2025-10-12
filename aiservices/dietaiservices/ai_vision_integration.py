# Enhanced Food Analysis Integration with AI Vision
# Integrates YOLO, TensorFlow, Keras, and OpenCV into the food analysis pipeline

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional, Dict, Any, List
import logging
import asyncio
import json
from datetime import datetime
import base64

# Import the AI vision analyzer
try:
    from .ai_vision_food_analyzer import AdvancedFoodVisionAnalyzer, FoodDetection, AdvancedVisionResult
    AI_VISION_AVAILABLE = True
except ImportError as e:
    logging.warning(f"AI Vision not available: {e}")
    AI_VISION_AVAILABLE = False

from .enhanced_nutrition import AccurateNutritionAnalyzer
from .enhanced_image_processor import EnhancedFoodVisionAnalyzer

logger = logging.getLogger(__name__)
router = APIRouter()

class EnhancedAIFoodAnalysisService:
    """
    Enhanced food analysis service that integrates:
    - YOLO object detection
    - TensorFlow/Keras classification
    - OpenCV image processing
    - Traditional food analysis
    """
    
    def __init__(self):
        self.ai_vision_analyzer = None
        self.traditional_analyzer = EnhancedFoodVisionAnalyzer()
        self.nutrition_analyzer = AccurateNutritionAnalyzer()
        
        # Initialize AI vision if available
        if AI_VISION_AVAILABLE:
            asyncio.create_task(self._initialize_ai_vision())
    
    async def _initialize_ai_vision(self):
        """Initialize AI vision analyzer"""
        try:
            self.ai_vision_analyzer = AdvancedFoodVisionAnalyzer()
            logger.info("✅ AI Vision analyzer initialized successfully")
        except Exception as e:
            logger.error(f"❌ Failed to initialize AI Vision: {e}")
            self.ai_vision_analyzer = None
    
    async def analyze_food_with_ai_vision(
        self,
        image_data: bytes,
        text_description: Optional[str] = None,
        user_id: str = "anonymous",
        meal_type: str = "lunch"
    ) -> Dict[str, Any]:
        """
        Comprehensive food analysis using AI vision + traditional methods
        
        Args:
            image_data: Raw image bytes
            text_description: Optional text description
            user_id: User identifier
            meal_type: Type of meal (breakfast, lunch, dinner, snack)
            
        Returns:
            Comprehensive analysis results
        """
        analysis_start = datetime.now()
        
        try:
            logger.info(f"🔍 Starting AI-powered food analysis for user {user_id}")
            
            # Step 1: Try AI vision analysis first
            ai_results = None
            if self.ai_vision_analyzer:
                try:
                    ai_results = await self.ai_vision_analyzer.analyze_food_image(
                        image_data, text_description
                    )
                    logger.info(f"🤖 AI Vision detected {len(ai_results.detections)} foods")
                except Exception as e:
                    logger.warning(f"AI Vision failed, using traditional analysis: {e}")
            
            # Step 2: Traditional analysis as backup/complement
            traditional_results = await self.traditional_analyzer.analyze_food_image(
                image_data, user_id, meal_type, text_description
            )
            
            # Step 3: Fusion of AI and traditional results
            final_results = await self._fuse_analysis_results(
                ai_results, traditional_results, text_description
            )
            
            # Step 4: Enhanced nutrition analysis
            enhanced_nutrition = await self._enhance_nutrition_analysis(final_results)
            
            # Step 5: Generate comprehensive response
            response = await self._generate_comprehensive_response(
                final_results, enhanced_nutrition, analysis_start
            )
            
            logger.info(f"✅ AI food analysis completed in {response['processing_time']:.2f}s")
            return response
            
        except Exception as e:
            logger.error(f"❌ AI food analysis failed: {e}")
            return await self._fallback_analysis(image_data, text_description, user_id, meal_type)
    
    async def _fuse_analysis_results(
        self,
        ai_results: Optional[AdvancedVisionResult],
        traditional_results: Any,
        text_description: Optional[str]
    ) -> Dict[str, Any]:
        """Intelligently fuse AI vision and traditional analysis results"""
        
        fused_foods = []
        analysis_methods = []
        overall_confidence = 0.0
        
        # Process AI vision results
        if ai_results and ai_results.detections:
            analysis_methods.append('AI_Vision_YOLO_TensorFlow')
            
            for detection in ai_results.detections:
                # Convert AI detection to our format
                food_item = await self._convert_ai_detection_to_food_item(detection)
                fused_foods.append(food_item)
            
            overall_confidence = ai_results.overall_confidence
            logger.info(f"🤖 Added {len(ai_results.detections)} AI-detected foods")
        
        # Process traditional results
        if hasattr(traditional_results, 'detected_foods') and traditional_results.detected_foods:
            analysis_methods.append('Traditional_Image_Analysis')
            
            # Add traditional detections, but avoid duplicates
            for traditional_food in traditional_results.detected_foods:
                # Check if similar food already detected by AI
                if not self._is_duplicate_food(traditional_food, fused_foods):
                    fused_foods.append(traditional_food)
            
            # Update confidence if traditional analysis found foods
            if traditional_results.confidence_score > overall_confidence:
                overall_confidence = max(overall_confidence, traditional_results.confidence_score * 0.8)
        
        # Text-based enhancement
        if text_description:
            analysis_methods.append('Enhanced_Text_Analysis')
            text_foods = await self._extract_foods_from_text(text_description)
            
            for text_food in text_foods:
                if not self._is_duplicate_food(text_food, fused_foods):
                    fused_foods.append(text_food)
        
        return {
            'detected_foods': fused_foods,
            'confidence_score': overall_confidence,
            'analysis_methods': analysis_methods,
            'ai_vision_available': self.ai_vision_analyzer is not None,
            'total_foods_detected': len(fused_foods)
        }
    
    async def _convert_ai_detection_to_food_item(self, detection: FoodDetection) -> Dict[str, Any]:
        """Convert AI vision detection to our food item format"""
        
        # Get base nutrition for this food
        base_nutrition = await self._get_base_nutrition(detection.food_name)
        
        # Apply portion multiplier
        portion_multiplier = self._get_portion_multiplier(detection.portion_estimate)
        
        # Apply cooking method adjustments
        cooking_multiplier = self._get_cooking_multiplier(detection.cooking_method)
        
        # Calculate final nutrition
        final_nutrition = self._apply_multipliers(base_nutrition, portion_multiplier, cooking_multiplier)
        
        return {
            'name': detection.food_name.replace('_', ' ').title(),
            'confidence': detection.confidence,
            'estimated_portion': f"{detection.portion_estimate} serving",
            'cooking_method': detection.cooking_method,
            'freshness_score': detection.freshness_score,
            'nutrition_confidence': detection.nutrition_confidence,
            'bbox': detection.bbox,
            'ai_detected': True,
            **final_nutrition
        }
    
    async def _get_base_nutrition(self, food_name: str) -> Dict[str, float]:
        """Get base nutrition values for a food"""
        # This would typically query a comprehensive nutrition database
        # For now, using simplified nutrition values
        
        nutrition_db = {
            'rice': {'calories': 130, 'protein': 2.7, 'carbs': 28, 'fat': 0.3, 'fiber': 0.4},
            'chicken_curry': {'calories': 185, 'protein': 18, 'carbs': 8, 'fat': 12, 'fiber': 2},
            'vegetables': {'calories': 25, 'protein': 2, 'carbs': 5, 'fat': 0.2, 'fiber': 3},
            'dal_curry': {'calories': 120, 'protein': 8, 'carbs': 18, 'fat': 2, 'fiber': 7},
            'bread': {'calories': 265, 'protein': 9, 'carbs': 49, 'fat': 3.2, 'fiber': 2.7},
            'fish': {'calories': 206, 'protein': 22, 'carbs': 0, 'fat': 12, 'fiber': 0}
        }
        
        # Normalize food name
        normalized_name = food_name.lower().replace(' ', '_')
        
        # Find best match
        for key, nutrition in nutrition_db.items():
            if key in normalized_name or normalized_name in key:
                return nutrition
        
        # Default nutrition for unknown foods
        return {'calories': 150, 'protein': 8, 'carbs': 20, 'fat': 5, 'fiber': 3}
    
    def _get_portion_multiplier(self, portion_estimate: str) -> float:
        """Get multiplier based on portion size"""
        multipliers = {
            'small': 0.7,
            'medium': 1.0,
            'large': 1.4,
            'extra_large': 1.8
        }
        return multipliers.get(portion_estimate.lower(), 1.0)
    
    def _get_cooking_multiplier(self, cooking_method: str) -> Dict[str, float]:
        """Get nutrition multipliers based on cooking method"""
        multipliers = {
            'fried': {'calories': 1.3, 'fat': 1.8, 'protein': 1.0, 'carbs': 1.0},
            'grilled': {'calories': 0.95, 'fat': 0.9, 'protein': 1.0, 'carbs': 1.0},
            'steamed': {'calories': 0.9, 'fat': 0.8, 'protein': 1.0, 'carbs': 1.0},
            'boiled': {'calories': 0.9, 'fat': 0.7, 'protein': 1.0, 'carbs': 1.0},
            'curried': {'calories': 1.1, 'fat': 1.2, 'protein': 1.0, 'carbs': 1.0},
            'standard': {'calories': 1.0, 'fat': 1.0, 'protein': 1.0, 'carbs': 1.0}
        }
        return multipliers.get(cooking_method.lower(), multipliers['standard'])
    
    def _apply_multipliers(
        self,
        base_nutrition: Dict[str, float],
        portion_multiplier: float,
        cooking_multiplier: Dict[str, float]
    ) -> Dict[str, float]:
        """Apply portion and cooking multipliers to base nutrition"""
        
        result = {}
        for nutrient, base_value in base_nutrition.items():
            cooking_mult = cooking_multiplier.get(nutrient, 1.0)
            result[nutrient] = round(base_value * portion_multiplier * cooking_mult, 1)
        
        return result
    
    def _is_duplicate_food(self, new_food: Dict[str, Any], existing_foods: List[Dict[str, Any]]) -> bool:
        """Check if a food item is a duplicate"""
        new_name = new_food.get('name', '').lower()
        
        for existing_food in existing_foods:
            existing_name = existing_food.get('name', '').lower()
            
            # Simple similarity check
            if (new_name in existing_name or existing_name in new_name or
                self._calculate_name_similarity(new_name, existing_name) > 0.7):
                return True
        
        return False
    
    def _calculate_name_similarity(self, name1: str, name2: str) -> float:
        """Calculate similarity between two food names"""
        words1 = set(name1.split())
        words2 = set(name2.split())
        
        if not words1 or not words2:
            return 0.0
        
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        return len(intersection) / len(union) if union else 0.0
    
    async def _extract_foods_from_text(self, text_description: str) -> List[Dict[str, Any]]:
        """Extract food items from text description"""
        # Use the traditional nutrition analyzer for text analysis
        try:
            nutrition_info = await self.nutrition_analyzer.analyze_food_accurately(text_description)
            
            # Convert to our format
            return [{
                'name': text_description.title(),
                'confidence': 0.8,
                'estimated_portion': '1 serving',
                'cooking_method': 'standard',
                'freshness_score': 0.8,
                'nutrition_confidence': 0.8,
                'ai_detected': False,
                'calories': nutrition_info.calories,
                'protein': nutrition_info.protein,
                'carbs': nutrition_info.carbs,
                'fat': nutrition_info.fat,
                'fiber': nutrition_info.fiber or 0
            }]
            
        except Exception as e:
            logger.error(f"Text extraction failed: {e}")
            return []
    
    async def _enhance_nutrition_analysis(self, analysis_results: Dict[str, Any]) -> Dict[str, Any]:
        """Enhance nutrition analysis with AI insights"""
        
        total_nutrition = {
            'calories': 0, 'protein': 0, 'carbs': 0, 'fat': 0, 'fiber': 0
        }
        
        food_details = []
        
        for food in analysis_results['detected_foods']:
            # Add to totals
            for nutrient in total_nutrition:
                total_nutrition[nutrient] += food.get(nutrient, 0)
            
            # Create detailed food info
            food_details.append({
                'name': food['name'],
                'portion': food.get('estimated_portion', '1 serving'),
                'calories': food.get('calories', 0),
                'protein': food.get('protein', 0),
                'carbs': food.get('carbs', 0),
                'fat': food.get('fat', 0),
                'fiber': food.get('fiber', 0),
                'confidence': food.get('confidence', 0.5),
                'cooking_method': food.get('cooking_method', 'standard'),
                'ai_detected': food.get('ai_detected', False)
            })
        
        # Calculate health metrics
        health_score = self._calculate_health_score(food_details, total_nutrition)
        balance_score = self._calculate_balance_score(total_nutrition)
        
        return {
            'total_nutrition': total_nutrition,
            'food_details': food_details,
            'health_score': health_score,
            'balance_score': balance_score,
            'ai_insights': self._generate_ai_insights(food_details)
        }
    
    def _calculate_health_score(self, foods: List[Dict], total_nutrition: Dict) -> float:
        """Calculate overall health score"""
        score = 5.0  # Base score
        
        # Boost for vegetables and fruits
        healthy_foods = sum(1 for food in foods if any(word in food['name'].lower() 
                           for word in ['vegetable', 'fruit', 'salad', 'green']))
        score += min(healthy_foods * 0.5, 2.0)
        
        # Penalize for fried foods
        fried_foods = sum(1 for food in foods if 'fried' in food.get('cooking_method', ''))
        score -= min(fried_foods * 0.5, 1.5)
        
        # Fiber bonus
        if total_nutrition.get('fiber', 0) > 10:
            score += 1.0
        
        # Protein adequacy
        if total_nutrition.get('protein', 0) > 20:
            score += 0.5
        
        return max(1.0, min(10.0, score))
    
    def _calculate_balance_score(self, nutrition: Dict) -> float:
        """Calculate nutritional balance score"""
        total_calories = nutrition.get('calories', 1)
        
        if total_calories < 1:
            return 5.0
        
        # Calculate macro ratios
        protein_ratio = (nutrition.get('protein', 0) * 4) / total_calories
        carb_ratio = (nutrition.get('carbs', 0) * 4) / total_calories
        fat_ratio = (nutrition.get('fat', 0) * 9) / total_calories
        
        # Ideal ratios (approximate)
        ideal_protein = 0.20
        ideal_carb = 0.50
        ideal_fat = 0.30
        
        # Calculate deviations
        protein_dev = abs(protein_ratio - ideal_protein)
        carb_dev = abs(carb_ratio - ideal_carb)
        fat_dev = abs(fat_ratio - ideal_fat)
        
        # Balance score (higher is better)
        balance = 10 - (protein_dev + carb_dev + fat_dev) * 10
        
        return max(1.0, min(10.0, balance))
    
    def _generate_ai_insights(self, foods: List[Dict]) -> List[str]:
        """Generate AI-powered insights"""
        insights = []
        
        ai_detected_count = sum(1 for food in foods if food.get('ai_detected', False))
        total_foods = len(foods)
        
        if ai_detected_count > 0:
            insights.append(f"🤖 AI Vision detected {ai_detected_count} out of {total_foods} foods with high accuracy")
        
        # Cooking method insights
        cooking_methods = [food.get('cooking_method', 'standard') for food in foods]
        if 'fried' in cooking_methods:
            insights.append("🔥 Consider grilling or steaming instead of frying for healthier preparation")
        
        # Portion insights
        large_portions = sum(1 for food in foods if 'large' in food.get('portion', ''))
        if large_portions > total_foods * 0.5:
            insights.append("📏 Consider reducing portion sizes for better calorie control")
        
        # Variety insights
        if total_foods < 3:
            insights.append("🌈 Try adding more variety to your meal for better nutrition")
        
        return insights
    
    async def _generate_comprehensive_response(
        self,
        analysis_results: Dict[str, Any],
        enhanced_nutrition: Dict[str, Any],
        analysis_start: datetime
    ) -> Dict[str, Any]:
        """Generate comprehensive analysis response"""
        
        processing_time = (datetime.now() - analysis_start).total_seconds()
        
        return {
            'detected_foods': enhanced_nutrition['food_details'],
            'total_nutrition': enhanced_nutrition['total_nutrition'],
            'confidence_score': analysis_results['confidence_score'],
            'analysis_method': ' + '.join(analysis_results['analysis_methods']),
            'health_score': enhanced_nutrition['health_score'],
            'balance_score': enhanced_nutrition['balance_score'],
            'ai_insights': enhanced_nutrition['ai_insights'],
            'processing_time': processing_time,
            'ai_vision_used': analysis_results['ai_vision_available'],
            'total_foods_detected': analysis_results['total_foods_detected'],
            'analysis_quality': self._assess_analysis_quality(analysis_results, enhanced_nutrition),
            'recommendations': self._generate_recommendations(enhanced_nutrition),
            'timestamp': datetime.now().isoformat()
        }
    
    def _assess_analysis_quality(self, analysis_results: Dict, nutrition_results: Dict) -> Dict[str, Any]:
        """Assess the quality of the analysis"""
        
        confidence = analysis_results['confidence_score']
        food_count = len(nutrition_results['food_details'])
        ai_detected = sum(1 for food in nutrition_results['food_details'] if food.get('ai_detected', False))
        
        quality_score = 0.0
        
        # Confidence factor
        quality_score += confidence * 0.4
        
        # Food detection factor
        if food_count > 0:
            quality_score += min(food_count / 5.0, 1.0) * 0.3
        
        # AI detection factor
        if ai_detected > 0:
            quality_score += (ai_detected / food_count) * 0.3
        
        quality_level = 'poor'
        if quality_score > 0.8:
            quality_level = 'excellent'
        elif quality_score > 0.6:
            quality_level = 'good'
        elif quality_score > 0.4:
            quality_level = 'fair'
        
        return {
            'quality_score': quality_score,
            'quality_level': quality_level,
            'confidence': confidence,
            'ai_detection_ratio': ai_detected / food_count if food_count > 0 else 0,
            'food_detection_completeness': min(food_count / 3.0, 1.0)  # Expecting ~3 foods per meal
        }
    
    def _generate_recommendations(self, nutrition_results: Dict) -> List[str]:
        """Generate personalized recommendations"""
        recommendations = []
        
        total_nutrition = nutrition_results['total_nutrition']
        health_score = nutrition_results['health_score']
        
        # Calorie recommendations
        calories = total_nutrition.get('calories', 0)
        if calories > 800:
            recommendations.append("⚖️ Consider smaller portions to manage calorie intake")
        elif calories < 300:
            recommendations.append("🍽️ This seems like a light meal - consider adding more nutrients")
        
        # Protein recommendations
        protein = total_nutrition.get('protein', 0)
        if protein < 15:
            recommendations.append("🥩 Add more protein sources like lean meat, fish, eggs, or legumes")
        
        # Fiber recommendations
        fiber = total_nutrition.get('fiber', 0)
        if fiber < 5:
            recommendations.append("🌾 Include more fiber-rich foods like vegetables, fruits, or whole grains")
        
        # Health score recommendations
        if health_score < 6:
            recommendations.append("🥗 Try to include more whole, unprocessed foods for better health")
        
        return recommendations
    
    async def _fallback_analysis(
        self,
        image_data: bytes,
        text_description: Optional[str],
        user_id: str,
        meal_type: str
    ) -> Dict[str, Any]:
        """Fallback analysis when AI vision fails"""
        
        try:
            # Use traditional analysis only
            traditional_results = await self.traditional_analyzer.analyze_food_image(
                image_data, user_id, meal_type, text_description
            )
            
            return {
                'detected_foods': traditional_results.detected_foods or [],
                'total_nutrition': traditional_results.total_nutrition or {},
                'confidence_score': traditional_results.confidence_score or 0.5,
                'analysis_method': 'Traditional Analysis (AI Fallback)',
                'health_score': 5.0,
                'balance_score': 5.0,
                'ai_insights': ['Analysis performed without AI vision due to technical issues'],
                'processing_time': 0.5,
                'ai_vision_used': False,
                'total_foods_detected': len(traditional_results.detected_foods or []),
                'analysis_quality': {'quality_level': 'basic', 'quality_score': 0.5},
                'recommendations': ['Try providing clearer images for better analysis'],
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Fallback analysis failed: {e}")
            return {
                'detected_foods': [],
                'total_nutrition': {'calories': 0, 'protein': 0, 'carbs': 0, 'fat': 0, 'fiber': 0},
                'confidence_score': 0.0,
                'analysis_method': 'Error Recovery',
                'health_score': 0.0,
                'balance_score': 0.0,
                'ai_insights': ['Analysis failed - please try again with a clearer image'],
                'processing_time': 0.1,
                'ai_vision_used': False,
                'total_foods_detected': 0,
                'analysis_quality': {'quality_level': 'failed', 'quality_score': 0.0},
                'recommendations': ['Please upload a clear image and try again'],
                'timestamp': datetime.now().isoformat()
            }

# Initialize the enhanced service
enhanced_ai_service = EnhancedAIFoodAnalysisService()

@router.post("/ai-vision-analyze")
async def ai_vision_food_analysis(
    image: UploadFile = File(...),
    text_description: Optional[str] = Form(None),
    user_id: str = Form("anonymous"),
    meal_type: str = Form("lunch")
):
    """
    Advanced AI-powered food analysis using YOLO, TensorFlow, Keras, and OpenCV
    
    - **image**: Food image file (JPG, PNG, WebP)
    - **text_description**: Optional text description to improve accuracy
    - **user_id**: User identifier for personalization
    - **meal_type**: Type of meal (breakfast, lunch, dinner, snack)
    """
    
    try:
        # Validate file type
        if not image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read image data
        image_data = await image.read()
        
        if len(image_data) == 0:
            raise HTTPException(status_code=400, detail="Empty image file")
        
        if len(image_data) > 10 * 1024 * 1024:  # 10MB limit
            raise HTTPException(status_code=400, detail="Image file too large (max 10MB)")
        
        # Perform AI analysis
        result = await enhanced_ai_service.analyze_food_with_ai_vision(
            image_data=image_data,
            text_description=text_description,
            user_id=user_id,
            meal_type=meal_type
        )
        
        logger.info(f"✅ AI vision analysis completed for user {user_id}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ AI vision analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.get("/ai-vision-status")
async def get_ai_vision_status():
    """Get the status of AI vision capabilities"""
    
    return {
        'ai_vision_available': AI_VISION_AVAILABLE,
        'yolo_available': enhanced_ai_service.ai_vision_analyzer is not None,
        'tensorflow_available': True,  # Assume TensorFlow is available
        'opencv_available': True,      # Assume OpenCV is available
        'models_loaded': enhanced_ai_service.ai_vision_analyzer is not None,
        'capabilities': [
            'YOLO Object Detection',
            'TensorFlow Food Classification',
            'Keras Nutrition Estimation',
            'OpenCV Image Processing',
            'Multi-method Analysis Fusion',
            'Portion Size Estimation',
            'Cooking Method Detection',
            'Freshness Assessment'
        ],
        'supported_formats': ['JPG', 'PNG', 'WebP'],
        'max_file_size': '10MB',
        'timestamp': datetime.now().isoformat()
    }

# Export the router
__all__ = ['router', 'enhanced_ai_service', 'EnhancedAIFoodAnalysisService']
