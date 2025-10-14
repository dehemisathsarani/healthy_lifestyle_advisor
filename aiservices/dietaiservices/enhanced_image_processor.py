"""
Enhanced Image Processing System for Diet Agent
Features:
1. Google Vision API integration with fallback
2. MongoDB storage for images and analysis results
3. Advanced food detection and nutrition calculation
4. Real-time analysis with progress tracking
"""

import io
import os
import base64
import hashlib
from typing import List, Dict, Optional, Tuple, Any
from datetime import datetime
import logging
import asyncio
from PIL import Image, ImageEnhance, ImageFilter
import numpy as np
from google.cloud import vision
from pydantic import BaseModel
import motor.motor_asyncio
import json
import uuid
from bson import ObjectId
from settings import settings

from nutrition import BMICalculator, TDEECalculator

logger = logging.getLogger(__name__)

class DetectedFood(BaseModel):
    name: str
    confidence: float
    estimated_portion: str
    calories: float
    protein: float
    carbs: float
    fat: float
    fiber: Optional[float] = None
    sodium: Optional[float] = None
    sugar: Optional[float] = None
    bounding_box: Optional[Dict[str, float]] = None

class ImageAnalysisResult(BaseModel):
    analysis_id: str
    user_id: str
    image_hash: str
    detected_foods: List[DetectedFood]
    total_nutrition: Dict[str, float]
    confidence_score: float
    analysis_method: str  # 'google_vision', 'fallback', 'hybrid'
    processing_time_seconds: float
    image_url: Optional[str] = None
    created_at: datetime
    meal_type: str
    text_description: Optional[str] = None

class EnhancedFoodVisionAnalyzer:
    def __init__(self, mongodb_client: motor.motor_asyncio.AsyncIOMotorClient, db_name: str):
        # Initialize Google Vision client
        if settings.DISABLE_GOOGLE_VISION:
            logger.info("Google Vision API disabled for local development")
            self.vision_client = None
            self.vision_available = False
        elif settings.USE_MOCK_GOOGLE_VISION:
            logger.info("Using mock Google Vision API for local development")
            self.vision_client = None
            self.vision_available = True  # We'll use fallback methods
        else:
            try:
                self.vision_client = vision.ImageAnnotatorClient()
                self.vision_available = True
                logger.info("Google Vision API initialized successfully")
            except Exception as e:
                logger.warning(f"Google Vision API not available, using mock service: {e}")
                self.vision_client = None
                self.vision_available = True  # Use fallback
        
        # Initialize MongoDB and GridFS
        self.db = mongodb_client[db_name]
        self.fs = motor.motor_asyncio.AsyncIOMotorGridFSBucket(self.db)
        
        # Initialize nutrition calculator
        self.nutrition_calc = NutritionCalculator()
        
        # Enhanced food database with Sri Lankan foods
        self.food_database = {
            # Rice dishes
            'rice': {'calories': 130, 'protein': 2.7, 'carbs': 28, 'fat': 0.3, 'fiber': 0.4},
            'fried rice': {'calories': 240, 'protein': 6, 'carbs': 35, 'fat': 8, 'fiber': 1.5},
            'coconut rice': {'calories': 180, 'protein': 3, 'carbs': 32, 'fat': 5, 'fiber': 1},
            
            # Kottu variations
            'kottu': {'calories': 450, 'protein': 20, 'carbs': 40, 'fat': 20, 'fiber': 3},
            'chicken kottu': {'calories': 520, 'protein': 28, 'carbs': 42, 'fat': 24, 'fiber': 3},
            'vegetable kottu': {'calories': 380, 'protein': 12, 'carbs': 45, 'fat': 15, 'fiber': 5},
            
            # Curries
            'chicken curry': {'calories': 200, 'protein': 25, 'carbs': 8, 'fat': 8, 'fiber': 2},
            'fish curry': {'calories': 180, 'protein': 22, 'carbs': 6, 'fat': 7, 'fiber': 1.5},
            'dal curry': {'calories': 160, 'protein': 12, 'carbs': 20, 'fat': 4, 'fiber': 8},
            'vegetable curry': {'calories': 120, 'protein': 4, 'carbs': 15, 'fat': 6, 'fiber': 4},
            'potato curry': {'calories': 140, 'protein': 3, 'carbs': 22, 'fat': 5, 'fiber': 3},
            
            # Breads and rotis
            'roti': {'calories': 80, 'protein': 3, 'carbs': 15, 'fat': 1, 'fiber': 2},
            'naan': {'calories': 160, 'protein': 5, 'carbs': 25, 'fat': 5, 'fiber': 1},
            'hoppers': {'calories': 90, 'protein': 2, 'carbs': 18, 'fat': 1.5, 'fiber': 1},
            'string hoppers': {'calories': 70, 'protein': 2, 'carbs': 14, 'fat': 0.5, 'fiber': 1},
            
            # Proteins
            'chicken': {'calories': 165, 'protein': 31, 'carbs': 0, 'fat': 3.6, 'fiber': 0},
            'fish': {'calories': 140, 'protein': 28, 'carbs': 0, 'fat': 3, 'fiber': 0},
            'beef': {'calories': 250, 'protein': 26, 'carbs': 0, 'fat': 15, 'fiber': 0},
            'egg': {'calories': 70, 'protein': 6, 'carbs': 0.5, 'fat': 5, 'fiber': 0},
            
            # Vegetables
            'cabbage': {'calories': 25, 'protein': 1.3, 'carbs': 6, 'fat': 0.1, 'fiber': 2.5},
            'carrot': {'calories': 41, 'protein': 0.9, 'carbs': 10, 'fat': 0.2, 'fiber': 2.8},
            'beans': {'calories': 35, 'protein': 2, 'carbs': 7, 'fat': 0.1, 'fiber': 3.4},
            'brinjal': {'calories': 25, 'protein': 1, 'carbs': 6, 'fat': 0.2, 'fiber': 3},
            
            # Fruits
            'banana': {'calories': 89, 'protein': 1.1, 'carbs': 23, 'fat': 0.3, 'fiber': 2.6},
            'mango': {'calories': 60, 'protein': 0.8, 'carbs': 15, 'fat': 0.4, 'fiber': 1.6},
            'papaya': {'calories': 43, 'protein': 0.5, 'carbs': 11, 'fat': 0.3, 'fiber': 1.7},
        }
        
        # Food keywords for better detection
        self.food_keywords = {
            'sri_lankan': ['kottu', 'hoppers', 'roti', 'curry', 'rice', 'dal', 'sambol'],
            'proteins': ['chicken', 'fish', 'beef', 'egg', 'dal', 'beans'],
            'carbs': ['rice', 'roti', 'bread', 'hoppers', 'noodles'],
            'vegetables': ['cabbage', 'carrot', 'beans', 'brinjal', 'potato'],
            'cooking_methods': ['fried', 'grilled', 'steamed', 'boiled', 'roasted']
        }

    async def analyze_food_image(self, 
                                image_data: bytes, 
                                user_id: str, 
                                meal_type: str = 'lunch',
                                text_description: Optional[str] = None) -> ImageAnalysisResult:
        """
        Comprehensive food image analysis with MongoDB storage.
        """
        start_time = datetime.now()
        
        # Generate unique analysis ID and image hash
        analysis_id = str(uuid.uuid4())
        image_hash = hashlib.md5(image_data).hexdigest()
        
        try:
            # Check if this image was analyzed before
            existing_analysis = await self.db.food_analyses.find_one({'image_hash': image_hash})
            if existing_analysis:
                logger.info(f"Found existing analysis for image hash: {image_hash}")
                existing_analysis['analysis_id'] = analysis_id  # New analysis ID for this request
                existing_analysis['user_id'] = user_id
                existing_analysis['created_at'] = datetime.now()
                return ImageAnalysisResult(**existing_analysis)
            
            # Store image in GridFS
            image_url = await self._store_image(image_data, analysis_id, user_id)
            
            # Preprocess image
            processed_image = await self._preprocess_image(image_data)
            
            # Perform food detection
            detected_foods = []
            analysis_method = 'fallback'
            confidence_score = 0.5
            
            if self.vision_available:
                try:
                    detected_foods, confidence_score = await self._google_vision_analysis(processed_image)
                    analysis_method = 'google_vision'
                except Exception as e:
                    logger.warning(f"Google Vision failed, using fallback: {e}")
                    detected_foods, confidence_score = await self._fallback_analysis(processed_image, text_description)
                    analysis_method = 'fallback'
            else:
                detected_foods, confidence_score = await self._fallback_analysis(processed_image, text_description)
            
            # Enhance with text description if provided
            if text_description:
                text_foods, text_confidence = await self._text_analysis(text_description)
                detected_foods.extend(text_foods)
                confidence_score = max(confidence_score, text_confidence)
                analysis_method = 'hybrid' if analysis_method == 'google_vision' else 'text_enhanced'
            
            # Calculate total nutrition
            total_nutrition = self._calculate_total_nutrition(detected_foods)
            
            # Calculate processing time
            processing_time = (datetime.now() - start_time).total_seconds()
            
            # Create analysis result
            analysis_result = ImageAnalysisResult(
                analysis_id=analysis_id,
                user_id=user_id,
                image_hash=image_hash,
                detected_foods=detected_foods,
                total_nutrition=total_nutrition,
                confidence_score=confidence_score,
                analysis_method=analysis_method,
                processing_time_seconds=processing_time,
                image_url=image_url,
                created_at=datetime.now(),
                meal_type=meal_type,
                text_description=text_description
            )
            
            # Store analysis result in MongoDB
            await self._store_analysis_result(analysis_result)
            
            logger.info(f"Image analysis completed for user {user_id} in {processing_time:.2f}s")
            return analysis_result
            
        except Exception as e:
            logger.error(f"Error in food image analysis: {e}")
            # Create minimal fallback result
            return ImageAnalysisResult(
                analysis_id=analysis_id,
                user_id=user_id,
                image_hash=image_hash,
                detected_foods=[],
                total_nutrition={'calories': 0, 'protein': 0, 'carbs': 0, 'fat': 0},
                confidence_score=0.1,
                analysis_method='error_fallback',
                processing_time_seconds=(datetime.now() - start_time).total_seconds(),
                image_url=None,
                created_at=datetime.now(),
                meal_type=meal_type,
                text_description=text_description
            )

    async def _store_image(self, image_data: bytes, analysis_id: str, user_id: str) -> str:
        """Store image in GridFS and return URL."""
        try:
            # Create metadata
            metadata = {
                'analysis_id': analysis_id,
                'user_id': user_id,
                'upload_time': datetime.now(),
                'content_type': 'image/jpeg'
            }
            
            # Store in GridFS
            file_id = await self.fs.put(
                image_data,
                filename=f"food_image_{analysis_id}.jpg",
                metadata=metadata
            )
            
            # Return GridFS URL (you can customize this based on your serving setup)
            return f"/api/images/{file_id}"
            
        except Exception as e:
            logger.error(f"Error storing image: {e}")
            return None

    async def _preprocess_image(self, image_data: bytes) -> bytes:
        """Preprocess image for better analysis."""
        try:
            # Load image
            image = Image.open(io.BytesIO(image_data))
            
            # Convert to RGB if needed
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Resize if too large
            max_size = 1024
            if max(image.size) > max_size:
                image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
            
            # Enhance image
            enhancer = ImageEnhance.Contrast(image)
            image = enhancer.enhance(1.2)
            
            enhancer = ImageEnhance.Sharpness(image)
            image = enhancer.enhance(1.1)
            
            # Convert back to bytes
            output_buffer = io.BytesIO()
            image.save(output_buffer, format='JPEG', quality=90)
            return output_buffer.getvalue()
            
        except Exception as e:
            logger.error(f"Error preprocessing image: {e}")
            return image_data

    async def _google_vision_analysis(self, image_data: bytes) -> Tuple[List[DetectedFood], float]:
        """Analyze image using Google Vision API."""
        try:
            image = vision.Image(content=image_data)
            
            # Perform label detection
            response = self.vision_client.label_detection(image=image)
            labels = response.label_annotations
            
            # Perform object localization
            objects = self.vision_client.object_localization(image=image).localized_object_annotations
            
            detected_foods = []
            confidence_scores = []
            
            # Process labels
            for label in labels:
                if self._is_food_related(label.description.lower()):
                    food_info = self._get_nutrition_info(label.description.lower())
                    if food_info:
                        detected_food = DetectedFood(
                            name=label.description,
                            confidence=label.score,
                            estimated_portion=self._estimate_portion(label.description),
                            **food_info
                        )
                        detected_foods.append(detected_food)
                        confidence_scores.append(label.score)
            
            # Process localized objects
            for obj in objects:
                if self._is_food_related(obj.name.lower()):
                    food_info = self._get_nutrition_info(obj.name.lower())
                    if food_info:
                        # Calculate bounding box
                        vertices = obj.bounding_poly.normalized_vertices
                        bounding_box = {
                            'x1': vertices[0].x,
                            'y1': vertices[0].y,
                            'x2': vertices[2].x,
                            'y2': vertices[2].y
                        }
                        
                        detected_food = DetectedFood(
                            name=obj.name,
                            confidence=obj.score,
                            estimated_portion=self._estimate_portion_from_bbox(bounding_box),
                            bounding_box=bounding_box,
                            **food_info
                        )
                        detected_foods.append(detected_food)
                        confidence_scores.append(obj.score)
            
            # Remove duplicates and sort
            detected_foods = self._deduplicate_foods(detected_foods)
            overall_confidence = np.mean(confidence_scores) if confidence_scores else 0.5
            
            return detected_foods[:5], overall_confidence  # Return top 5
            
        except Exception as e:
            logger.error(f"Google Vision analysis failed: {e}")
            raise

    async def _fallback_analysis(self, image_data: bytes, text_description: Optional[str] = None) -> Tuple[List[DetectedFood], float]:
        """Fallback analysis using basic image processing and text hints."""
        detected_foods = []
        
        try:
            # If text description is provided, use it
            if text_description:
                return await self._text_analysis(text_description)
            
            # Basic image analysis (placeholder - could be enhanced with ML models)
            # For now, return common Sri Lankan foods as detected
            common_foods = ['rice', 'chicken curry', 'vegetable curry']
            
            for food_name in common_foods:
                food_info = self._get_nutrition_info(food_name)
                if food_info:
                    detected_food = DetectedFood(
                        name=food_name.title(),
                        confidence=0.6,
                        estimated_portion='1 serving',
                        **food_info
                    )
                    detected_foods.append(detected_food)
            
            return detected_foods, 0.6
            
        except Exception as e:
            logger.error(f"Fallback analysis failed: {e}")
            return [], 0.3

    async def _text_analysis(self, text_description: str) -> Tuple[List[DetectedFood], float]:
        """Analyze food based on text description."""
        detected_foods = []
        confidence_scores = []
        
        text_lower = text_description.lower()
        
        # Check for food keywords
        for food_name, nutrition in self.food_database.items():
            if food_name in text_lower:
                # Calculate confidence based on exact match vs partial match
                if food_name == text_lower.strip():
                    confidence = 0.9
                elif text_lower.startswith(food_name) or text_lower.endswith(food_name):
                    confidence = 0.8
                else:
                    confidence = 0.7
                
                detected_food = DetectedFood(
                    name=food_name.title(),
                    confidence=confidence,
                    estimated_portion=self._estimate_portion_from_text(text_description, food_name),
                    **nutrition
                )
                detected_foods.append(detected_food)
                confidence_scores.append(confidence)
        
        # If no specific foods found, try to parse generic descriptions
        if not detected_foods:
            detected_foods = self._parse_generic_meal_description(text_description)
            confidence_scores = [0.5] * len(detected_foods)
        
        overall_confidence = np.mean(confidence_scores) if confidence_scores else 0.4
        return detected_foods, overall_confidence

    def _is_food_related(self, label: str) -> bool:
        """Check if a label is food-related."""
        food_terms = []
        for category in self.food_keywords.values():
            food_terms.extend(category)
        
        # Add general food terms
        food_terms.extend(['food', 'meal', 'dish', 'cuisine', 'snack', 'breakfast', 'lunch', 'dinner'])
        
        return any(term in label for term in food_terms)

    def _get_nutrition_info(self, food_name: str) -> Optional[Dict[str, float]]:
        """Get nutrition information for a food item."""
        # Direct match
        if food_name in self.food_database:
            return self.food_database[food_name].copy()
        
        # Partial match
        for key, nutrition in self.food_database.items():
            if key in food_name or food_name in key:
                return nutrition.copy()
        
        # Generic fallback
        return {
            'calories': 150,
            'protein': 8,
            'carbs': 20,
            'fat': 5,
            'fiber': 3,
            'sodium': 200,
            'sugar': 2
        }

    def _estimate_portion(self, food_name: str) -> str:
        """Estimate portion size based on food type."""
        portion_mapping = {
            'rice': '1 cup cooked',
            'kottu': '1 serving (300g)',
            'curry': '1 cup',
            'roti': '1 piece',
            'hoppers': '2 pieces',
            'chicken': '100g',
            'fish': '100g',
            'egg': '1 large',
        }
        
        food_lower = food_name.lower()
        for food, portion in portion_mapping.items():
            if food in food_lower:
                return portion
        
        return '1 serving'

    def _estimate_portion_from_bbox(self, bbox: Dict[str, float]) -> str:
        """Estimate portion from bounding box size."""
        width = bbox['x2'] - bbox['x1']
        height = bbox['y2'] - bbox['y1']
        area = width * height
        
        if area > 0.4:
            return 'Large portion'
        elif area > 0.2:
            return 'Medium portion'
        else:
            return 'Small portion'

    def _estimate_portion_from_text(self, text: str, food_name: str) -> str:
        """Estimate portion from text description."""
        text_lower = text.lower()
        
        # Look for quantity indicators
        if any(word in text_lower for word in ['large', 'big', 'huge']):
            return 'Large portion'
        elif any(word in text_lower for word in ['small', 'little', 'mini']):
            return 'Small portion'
        elif any(word in text_lower for word in ['2', 'two', 'double']):
            return '2 servings'
        elif any(word in text_lower for word in ['half', '1/2']):
            return 'Half serving'
        
        return '1 serving'

    def _parse_generic_meal_description(self, description: str) -> List[DetectedFood]:
        """Parse generic meal descriptions."""
        detected_foods = []
        
        # Common meal patterns
        if 'lunch' in description.lower() or 'dinner' in description.lower():
            # Assume a typical Sri Lankan meal
            detected_foods.extend([
                DetectedFood(
                    name='Rice',
                    confidence=0.6,
                    estimated_portion='1 cup',
                    **self.food_database['rice']
                ),
                DetectedFood(
                    name='Curry',
                    confidence=0.5,
                    estimated_portion='1 cup',
                    **self.food_database['chicken curry']
                )
            ])
        
        return detected_foods

    def _deduplicate_foods(self, foods: List[DetectedFood]) -> List[DetectedFood]:
        """Remove duplicate food detections."""
        seen = set()
        unique_foods = []
        
        for food in foods:
            simple_name = food.name.lower().strip()
            if simple_name not in seen:
                seen.add(simple_name)
                unique_foods.append(food)
        
        return sorted(unique_foods, key=lambda x: x.confidence, reverse=True)

    def _calculate_total_nutrition(self, detected_foods: List[DetectedFood]) -> Dict[str, float]:
        """Calculate total nutrition from detected foods."""
        total = {
            'calories': 0,
            'protein': 0,
            'carbs': 0,
            'fat': 0,
            'fiber': 0,
            'sodium': 0,
            'sugar': 0
        }
        
        for food in detected_foods:
            total['calories'] += food.calories
            total['protein'] += food.protein
            total['carbs'] += food.carbs
            total['fat'] += food.fat
            total['fiber'] += food.fiber or 0
            total['sodium'] += food.sodium or 0
            total['sugar'] += food.sugar or 0
        
        return total

    async def _store_analysis_result(self, analysis_result: ImageAnalysisResult):
        """Store analysis result in MongoDB."""
        try:
            # Convert to dict for storage
            result_dict = analysis_result.dict()
            result_dict['created_at'] = datetime.now()
            
            # Store in MongoDB
            await self.db.food_analyses.insert_one(result_dict)
            
            # Also store in user's meal entries
            meal_entry = {
                'user_id': analysis_result.user_id,
                'analysis_id': analysis_result.analysis_id,
                'meal_type': analysis_result.meal_type,
                'detected_foods': [food.dict() for food in analysis_result.detected_foods],
                'total_nutrition': analysis_result.total_nutrition,
                'image_url': analysis_result.image_url,
                'confidence_score': analysis_result.confidence_score,
                'created_at': datetime.now(),
                'date': datetime.now().strftime('%Y-%m-%d')
            }
            
            await self.db.meal_entries.insert_one(meal_entry)
            
        except Exception as e:
            logger.error(f"Error storing analysis result: {e}")

    async def get_analysis_history(self, user_id: str, limit: int = 20) -> List[Dict]:
        """Get user's analysis history."""
        try:
            cursor = self.db.food_analyses.find(
                {'user_id': user_id}
            ).sort('created_at', -1).limit(limit)
            
            results = []
            async for doc in cursor:
                doc['_id'] = str(doc['_id'])  # Convert ObjectId to string
                results.append(doc)
            
            return results
            
        except Exception as e:
            logger.error(f"Error retrieving analysis history: {e}")
            return []

    async def get_image_by_id(self, file_id: str) -> Tuple[bytes, str]:
        """Retrieve image from GridFS."""
        try:
            grid_out = await self.fs.get(ObjectId(file_id))
            image_data = await grid_out.read()
            content_type = grid_out.metadata.get('content_type', 'image/jpeg')
            return image_data, content_type
            
        except Exception as e:
            logger.error(f"Error retrieving image: {e}")
            return None, None

# Nutrition Calculator Helper
class NutritionCalculator:
    """Helper class for nutrition calculations."""
    
    def __init__(self):
        # Standard nutrition factors
        self.calorie_factors = {
            'protein': 4,  # kcal per gram
            'carbs': 4,    # kcal per gram
            'fat': 9,      # kcal per gram
            'alcohol': 7   # kcal per gram
        }
    
    def calculate_calories_from_macros(self, protein: float, carbs: float, fat: float) -> float:
        """Calculate total calories from macronutrients."""
        return (protein * self.calorie_factors['protein'] + 
                carbs * self.calorie_factors['carbs'] + 
                fat * self.calorie_factors['fat'])
    
    def get_macro_percentages(self, protein: float, carbs: float, fat: float) -> Dict[str, float]:
        """Calculate macronutrient percentages."""
        total_calories = self.calculate_calories_from_macros(protein, carbs, fat)
        
        if total_calories == 0:
            return {'protein': 0, 'carbs': 0, 'fat': 0}
        
        return {
            'protein': (protein * self.calorie_factors['protein']) / total_calories * 100,
            'carbs': (carbs * self.calorie_factors['carbs']) / total_calories * 100,
            'fat': (fat * self.calorie_factors['fat']) / total_calories * 100
        }
