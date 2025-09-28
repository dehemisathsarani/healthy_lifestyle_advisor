"""
"""
YOLOv8 + Tesseract Food Analysis System
Advanced local food recognition without external APIs
"""

import os
import sys
import cv2
import numpy as np
import logging
import asyncio
import json
import time
from typing import List, Dict, Optional, Tuple, Any, Union
from datetime import datetime
from PIL import Image, ImageEnhance, ImageFilter
import pytesseract
from dataclasses import dataclass, asdict
import motor.motor_asyncio
from concurrent.futures import ThreadPoolExecutor
import io
import base64

# Enhanced nutrition system import
from enhanced_nutrition import AccurateNutritionAnalyzer, DetailedNutritionInfo

# Install required packages if not available
try:
    from ultralytics import YOLO
except ImportError:
    print("Installing YOLOv8...")
    os.system("pip install ultralytics")
    from ultralytics import YOLO

try:
    import pytesseract
except ImportError:
    print("Installing pytesseract...")
    os.system("pip install pytesseract")
    import pytesseract

logger = logging.getLogger(__name__)

@dataclass
class YOLODetectedFood:
    """Food item detected by YOLO + Tesseract"""
    name: str
    confidence: float
    bounding_box: Dict[str, float]  # x, y, width, height
    estimated_portion: str
    calories: float = 0
    protein: float = 0
    carbs: float = 0
    fat: float = 0
    fiber: float = 0
    sodium: float = 0
    food_category: str = "unknown"
    detection_method: str = "yolo_tesseract"
    ocr_text: Optional[str] = None

class YOLOTesseractFoodAnalyzer:
    """
    Advanced food analysis using YOLOv8 for object detection and Tesseract for text recognition
    """
    
    def __init__(self, mongodb_client: motor.motor_asyncio.AsyncIOMotorClient, db_name: str):
        """Initialize the YOLO + Tesseract food analyzer."""
        self.db = mongodb_client[db_name] if mongodb_client else None
        
        # Initialize YOLO model
        self.yolo_model = None
        self.load_yolo_model()
        
        # Configure Tesseract
        self.setup_tesseract()
        
        # Initialize enhanced nutrition analyzer
        self.nutrition_analyzer = AccurateNutritionAnalyzer()
        
        # Load food database (using enhanced version)
        self.food_database = self.nutrition_analyzer.food_database
        
        # Food category mappings for YOLO detection
        self.food_categories = {
            'fruits': ['apple', 'banana', 'orange', 'mango', 'papaya', 'pineapple'],
            'vegetables': ['carrot', 'broccoli', 'tomato', 'onion', 'potato', 'cabbage'],
            'grains': ['rice', 'bread', 'pasta', 'noodles', 'wheat'],
            'proteins': ['chicken', 'fish', 'beef', 'egg', 'tofu'],
            'dairy': ['milk', 'cheese', 'yogurt', 'butter'],
            'beverages': ['coffee', 'tea', 'juice', 'water', 'soda'],
            'snacks': ['chips', 'cookies', 'crackers', 'nuts'],
            'sri_lankan': ['kottu', 'hoppers', 'roti', 'curry', 'sambol']
        }
        
        # Enhanced YOLO class mappings to accurate food items
        self.yolo_food_mapping = {
            # COCO dataset food classes - mapped to our comprehensive database
            'apple': 'apple',
            'banana': 'banana', 
            'orange': 'orange',
            'broccoli': 'broccoli',
            'carrot': 'carrot',
            'pizza': 'pizza',
            'donut': 'donut',
            'cake': 'cake',
            'sandwich': 'sandwich',
            'hot dog': 'hot_dog',
            
            # Container-based intelligent mapping
            'bowl': None,  # Analyze contents instead of assuming
            'cup': None,   # Don't assume beverage - analyze contents
            'bottle': None, # Don't assume - analyze label via OCR
            'plate': None,  # Analyze foods on plate instead
            
            # Additional mappings for better accuracy
            'person': None,  # Ignore people
            'dining table': None,  # Ignore furniture
            'fork': None,    # Ignore utensils
            'knife': None,   # Ignore utensils
            'spoon': None,   # Ignore utensils
        }
        
        logger.info("YOLOv8 + Tesseract food analyzer initialized")

    def load_yolo_model(self):
        """Load YOLOv8 model for object detection."""
        try:
            # Use YOLOv8 nano for speed, or yolov8s/yolov8m for better accuracy
            model_path = "yolov8n.pt"  # Will download automatically if not present
            self.yolo_model = YOLO(model_path)
            logger.info(f"YOLOv8 model loaded: {model_path}")
        except Exception as e:
            logger.error(f"Failed to load YOLO model: {e}")
            self.yolo_model = None

    def setup_tesseract(self):
        """Setup Tesseract OCR configuration."""
        try:
            # Try to detect Tesseract path automatically
            pytesseract.get_tesseract_version()
            logger.info("Tesseract OCR configured successfully")
        except Exception as e:
            logger.warning(f"Tesseract setup issue: {e}")
            # Try common macOS paths
            possible_paths = [
                '/usr/local/bin/tesseract',
                '/opt/homebrew/bin/tesseract',
                '/usr/bin/tesseract'
            ]
            for path in possible_paths:
                if os.path.exists(path):
                    pytesseract.pytesseract.tesseract_cmd = path
                    logger.info(f"Tesseract path set to: {path}")
                    break

    async def analyze_food_image_yolo(self, 
                                     image_data: bytes,
                                     user_id: str,
                                     text_description: Optional[str] = None,
                                     meal_type: str = 'lunch',
                                     dietary_restrictions: List[str] = None,
                                     cultural_context: str = 'sri_lankan') -> Dict[str, Any]:
        """
        Main food analysis function using YOLOv8 + Tesseract
        """
        start_time = time.time()
        analysis_id = f"yolo_{user_id}_{int(time.time())}"
        
        try:
            logger.info(f"Starting YOLO+Tesseract analysis for user {user_id}")
            
            # Step 1: Convert image data to OpenCV format
            image = self._bytes_to_opencv(image_data)
            if image is None:
                raise ValueError("Invalid image data")
            
            # Step 2: YOLO object detection
            yolo_detections = await self._yolo_object_detection(image)
            
            # Step 3: Tesseract OCR text extraction
            ocr_text = await self._extract_text_tesseract(image)
            
            # Step 4: Combine YOLO + OCR + text description
            detected_foods = await self._combine_detections(
                yolo_detections, ocr_text, text_description, cultural_context
            )
            
            # Step 5: Nutrition analysis
            nutrition_analysis = await self._calculate_nutrition(detected_foods)
            
            # Step 6: Quality assessment
            quality_assessment = self._assess_analysis_quality(detected_foods, image)
            
            processing_time = time.time() - start_time
            
            result = {
                'analysis_id': analysis_id,
                'user_id': user_id,
                'timestamp': datetime.now().isoformat(),
                'detected_foods': [food.dict() if hasattr(food, 'dict') else asdict(food) for food in detected_foods],
                'nutrition_analysis': nutrition_analysis,
                'ocr_text': ocr_text,
                'analysis_quality': quality_assessment,
                'processing_time_seconds': processing_time,
                'method': 'yolo_tesseract',
                'cultural_context': cultural_context
            }
            
            # Store result in MongoDB
            await self._store_analysis_result(result)
            
            logger.info(f"YOLO+Tesseract analysis completed in {processing_time:.2f}s")
            return result
            
        except Exception as e:
            logger.error(f"YOLO+Tesseract analysis failed: {e}")
            return await self._generate_fallback_result(analysis_id, user_id, str(e))

    def _bytes_to_opencv(self, image_data: bytes) -> Optional[np.ndarray]:
        """Convert bytes to OpenCV image format."""
        try:
            nparr = np.frombuffer(image_data, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            return image
        except Exception as e:
            logger.error(f"Failed to convert bytes to OpenCV image: {e}")
            return None

    async def _yolo_object_detection(self, image: np.ndarray) -> List[Dict]:
        """Perform YOLO object detection on the image."""
        detections = []
        
        if self.yolo_model is None:
            logger.warning("YOLO model not available, skipping object detection")
            return detections
        
        try:
            # Run YOLO inference
            results = self.yolo_model(image, conf=0.25, iou=0.45)
            
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        # Get detection info
                        conf = float(box.conf[0])
                        cls = int(box.cls[0])
                        class_name = self.yolo_model.names[cls]
                        
                        # Get bounding box coordinates
                        x1, y1, x2, y2 = box.xyxy[0].tolist()
                        bbox = {
                            'x': x1,
                            'y': y1,
                            'width': x2 - x1,
                            'height': y2 - y1
                        }
                        
                        # Map YOLO class to food item
                        food_name = self._map_yolo_class_to_food(class_name)
                        
                        if food_name:
                            detections.append({
                                'name': food_name,
                                'confidence': conf,
                                'bounding_box': bbox,
                                'yolo_class': class_name,
                                'detection_method': 'yolo'
                            })
            
            logger.info(f"YOLO detected {len(detections)} food items")
            
        except Exception as e:
            logger.error(f"YOLO detection failed: {e}")
        
        return detections

    async def _extract_text_tesseract(self, image: np.ndarray) -> str:
        """Extract text from image using enhanced Tesseract OCR with multiple configurations."""
        try:
            # Convert BGR to RGB for PIL
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            pil_image = Image.fromarray(image_rgb)
            
            # Enhance image for better OCR
            enhanced_image = self._enhance_image_for_ocr(pil_image)
            
            # Try multiple OCR configurations for better accuracy
            ocr_configs = [
                '--oem 3 --psm 6',  # Default config - uniform block
                '--oem 3 --psm 8',  # Single word
                '--oem 3 --psm 7',  # Single text line  
                '--oem 3 --psm 11', # Sparse text
                '--oem 3 --psm 13', # Raw line - no formatting
                '--oem 3 --psm 3',  # Fully automatic page segmentation
            ]
            
            all_text = []
            
            for config in ocr_configs:
                try:
                    text = pytesseract.image_to_string(enhanced_image, lang='eng', config=config)
                    if text and len(text.strip()) > 0:
                        all_text.append(text)
                        logger.debug(f"📝 OCR CONFIG {config}: extracted {len(text.strip())} characters")
                except Exception as e:
                    logger.debug(f"⚠️ OCR CONFIG {config} failed: {e}")
                    continue
            
            # Combine and deduplicate text from all configurations
            combined_text = ' '.join(all_text)
            
            # Clean extracted text
            cleaned_text = self._clean_ocr_text(combined_text)
            
            if cleaned_text:
                logger.info(f"✅ TESSERACT SUCCESS: Extracted text: '{cleaned_text[:100]}...'")
            else:
                logger.warning("⚠️ TESSERACT: No readable text found in image")
            
            return cleaned_text
            
        except Exception as e:
            logger.error(f"❌ TESSERACT FAILED: {e}")
            return ""

    def _enhance_image_for_ocr(self, image: Image.Image) -> Image.Image:
        """Enhanced image processing for maximum OCR accuracy."""
        try:
            # Convert to grayscale for better text recognition
            image = image.convert('L')
            
            # Significantly enhance contrast for menu text
            enhancer = ImageEnhance.Contrast(image)
            image = enhancer.enhance(2.5)  # Increased contrast
            
            # Enhance sharpness for clearer text
            enhancer = ImageEnhance.Sharpness(image)
            image = enhancer.enhance(2.5)  # Increased sharpness
            
            # Resize for optimal OCR - Tesseract works better with larger text
            width, height = image.size
            if width < 600 or height < 600:
                scale = max(600/width, 600/height)
                new_size = (int(width * scale), int(height * scale))
                image = image.resize(new_size, Image.LANCZOS)
                logger.info(f"📏 IMAGE RESIZED: {width}x{height} → {new_size[0]}x{new_size[1]} for better OCR")
            
            # Apply noise reduction for cleaner text
            image = image.filter(ImageFilter.MedianFilter(size=3))
            
            # Optional: Apply morphological operations for text cleanup
            import numpy as np
            img_array = np.array(image)
            
            # Threshold the image for better text contrast
            threshold = 128
            img_array = np.where(img_array > threshold, 255, 0)
            
            image = Image.fromarray(img_array.astype('uint8'))
            
            logger.info("🔧 IMAGE ENHANCED: Applied advanced preprocessing for OCR accuracy")
            return image
            
        except Exception as e:
            logger.error(f"❌ IMAGE ENHANCEMENT FAILED: {e}")
            return image

    def _clean_ocr_text(self, text: str) -> str:
        """Enhanced OCR text cleaning and processing for better food extraction."""
        if not text:
            return ""
        
        # Remove extra whitespace and newlines
        text = ' '.join(text.split())
        
        # Remove common OCR artifacts and noise
        import re
        
        # Remove excessive punctuation
        text = re.sub(r'[^\w\s\-\.\,\&\'\(\)]', ' ', text)
        
        # Remove standalone numbers (prices, quantities without units)
        text = re.sub(r'\b\d+\b', ' ', text)
        
        # Remove common menu artifacts
        artifacts = ['menu', 'price', 'rs', 'lkr', 'usd', '$', '₹', 'රු']
        for artifact in artifacts:
            text = re.sub(rf'\b{artifact}\b', ' ', text, flags=re.IGNORECASE)
        
        # Clean multiple spaces
        text = re.sub(r'\s+', ' ', text)
        
        # Filter out very short words (likely OCR errors)
        words = text.split()
        filtered_words = [word for word in words if len(word) >= 3]
        
        cleaned_text = ' '.join(filtered_words).lower().strip()
        
        logger.debug(f"🧹 TEXT CLEANED: '{text[:50]}...' → '{cleaned_text[:50]}...'")
        return cleaned_text

    async def _combine_detections(self, 
                                 yolo_detections: List[Dict],
                                 ocr_text: str,
                                 text_description: Optional[str],
                                 cultural_context: str) -> List[YOLODetectedFood]:
        """Combine YOLO detections, OCR text, and user description with REAL accurate nutrition - NO DUMMY DATA."""
        detected_foods = []
        
        # Process YOLO detections with REAL nutrition data
        for detection in yolo_detections:
            food_name = detection['name']
            portion = self._estimate_portion_from_bbox(detection['bounding_box'])
            
            # Get REAL nutrition data - no fallbacks to dummy data
            nutrition_info = await self.nutrition_analyzer.analyze_food_accurately(food_name, portion)
            
            # Only add if we have real data (not estimated)
            if self._validate_real_nutrition_data(nutrition_info, food_name):
                detected_food = YOLODetectedFood(
                    name=food_name,
                    confidence=detection['confidence'],
                    bounding_box=detection['bounding_box'],
                    estimated_portion=portion,
                    detection_method='yolo',
                    calories=nutrition_info.calories,
                    protein=nutrition_info.protein,
                    carbs=nutrition_info.carbs,
                    fat=nutrition_info.fat,
                    fiber=nutrition_info.fiber,
                    sodium=nutrition_info.sodium,
                    food_category=nutrition_info.food_category
                )
                detected_foods.append(detected_food)
                logger.info(f"✅ REAL DATA: Added {food_name} with accurate nutrition")
        
        # Process OCR text for additional food items with STRICT validation
        ocr_foods = self._extract_foods_from_text(ocr_text)
        for food_name in ocr_foods:
            if not any(f.name.lower() == food_name.lower() for f in detected_foods):
                nutrition_info = await self.nutrition_analyzer.analyze_food_accurately(food_name, 'medium')
                
                # Only add if we have real database match - no estimates
                if self._validate_real_nutrition_data(nutrition_info, food_name):
                    detected_food = YOLODetectedFood(
                        name=food_name,
                        confidence=0.7,  # High confidence for OCR matches with real data
                        bounding_box={'x': 0, 'y': 0, 'width': 100, 'height': 100},
                        estimated_portion='medium',
                        detection_method='ocr',
                        ocr_text=ocr_text,
                        calories=nutrition_info.calories,
                        protein=nutrition_info.protein,
                        carbs=nutrition_info.carbs,
                        fat=nutrition_info.fat,
                        fiber=nutrition_info.fiber,
                        sodium=nutrition_info.sodium,
                        food_category=nutrition_info.food_category
                    )
                    detected_foods.append(detected_food)
                    logger.info(f"✅ REAL DATA: OCR detected {food_name} with accurate nutrition")
        
        # Process text description with STRICT validation
        if text_description:
            text_foods = self._extract_foods_from_text(text_description)
            for food_name in text_foods:
                if not any(f.name.lower() == food_name.lower() for f in detected_foods):
                    nutrition_info = await self.nutrition_analyzer.analyze_food_accurately(food_name, 'medium')
                    
                    # Only add if we have real database match
                    if self._validate_real_nutrition_data(nutrition_info, food_name):
                        detected_food = YOLODetectedFood(
                            name=food_name,
                            confidence=0.8,  # High confidence for text description with real data
                            bounding_box={'x': 0, 'y': 0, 'width': 100, 'height': 100},
                            estimated_portion='medium',
                            detection_method='text_description',
                            calories=nutrition_info.calories,
                            protein=nutrition_info.protein,
                            carbs=nutrition_info.carbs,
                            fat=nutrition_info.fat,
                            fiber=nutrition_info.fiber,
                            sodium=nutrition_info.sodium,
                            food_category=nutrition_info.food_category
                        )
                        detected_foods.append(detected_food)
                        logger.info(f"✅ REAL DATA: Text detected {food_name} with accurate nutrition")
        
        # REMOVED: No fallback dummy data - only return real detected foods
        if not detected_foods:
            logger.warning("⚠️ NO REAL FOOD DATA DETECTED - Refusing to return dummy data")
            logger.info("🎯 Improve detection by: 1) Better image quality 2) Clear text description 3) Recognized food items")
        
        return detected_foods

    def _map_yolo_class_to_food(self, yolo_class: str) -> Optional[str]:
        """Map YOLO class names to food items with intelligent filtering."""
        mapped_food = self.yolo_food_mapping.get(yolo_class.lower())
        
        # If mapping returns None, it means we should ignore this detection
        # (e.g., utensils, furniture, people)
        if mapped_food is None:
            logger.debug(f"🚫 IGNORED: {yolo_class} - not a food item")
            return None
        
        # Verify the mapped food exists in our nutrition database
        if mapped_food in self.nutrition_analyzer.food_database:
            logger.info(f"✅ YOLO MAPPED: {yolo_class} → {mapped_food}")
            return mapped_food
        
        logger.warning(f"⚠️ YOLO UNMAPPED: {yolo_class} not in nutrition database")
        return None

    def _extract_foods_from_text(self, text: str) -> List[str]:
        """Enhanced food extraction from text using intelligent keyword matching and NLP techniques."""
        if not text:
            return []
        
        text = text.lower()
        found_foods = []
        
        # Check against comprehensive enhanced nutrition database
        for food_name, food_data in self.nutrition_analyzer.food_database.items():
            aliases = food_data.get('aliases', [])
            
            # Check main food name (with underscore replacement)
            food_display_name = food_name.replace('_', ' ')
            if food_display_name in text:
                found_foods.append(food_name)
                logger.info(f"🎯 EXACT MATCH: Found '{food_display_name}' in text")
                continue
                
            # Check all aliases with fuzzy matching
            for alias in aliases:
                if alias.lower() in text:
                    found_foods.append(food_name)
                    logger.info(f"🎯 ALIAS MATCH: Found '{alias}' → '{food_name}' in text")
                    break
        
        # Enhanced Sri Lankan food keyword detection
        sinhala_keywords = {
            'kottu': 'kottu',
            'hopper': 'hoppers',
            'appa': 'hoppers',
            'roti': 'roti',
            'bath': 'rice',
            'kari': 'chicken_curry',
            'curry': 'chicken_curry',
            'dhal': 'dal_curry',
            'parippu': 'dal_curry',
            'mallung': 'vegetable_curry',
            'pol': 'coconut',
            'wambatu': 'brinjal',
            'kakulu': 'jackfruit',
            'ambul': 'fish_curry',
            'mas': 'fish',
            'kukul': 'chicken',
            'elu': 'vegetable',
            'kola': 'green',
            'sambol': 'sambol'
        }
        
        for keyword, food_mapping in sinhala_keywords.items():
            if keyword in text and food_mapping not in found_foods:
                # Verify the mapping exists in our database
                if food_mapping in self.nutrition_analyzer.food_database:
                    found_foods.append(food_mapping)
                    logger.info(f"🇱🇰 SINHALA MATCH: Found '{keyword}' → '{food_mapping}'")
        
        # Smart combination detection (e.g., "rice and curry")
        combo_patterns = [
            (r'rice.*curry|curry.*rice', ['rice', 'chicken_curry']),
            (r'kottu.*chicken|chicken.*kottu', ['chicken_kottu']),
            (r'fish.*curry|curry.*fish', ['fish_curry']),
            (r'dal.*curry|curry.*dal', ['dal_curry']),
            (r'vegetable.*curry|curry.*vegetable', ['vegetable_curry']),
        ]
        
        import re
        for pattern, food_items in combo_patterns:
            if re.search(pattern, text):
                for item in food_items:
                    if item not in found_foods and item in self.nutrition_analyzer.food_database:
                        found_foods.append(item)
                        logger.info(f"🔗 COMBO MATCH: Pattern '{pattern}' → '{item}'")
        
        # Remove duplicates while preserving order
        unique_foods = []
        for food in found_foods:
            if food not in unique_foods:
                unique_foods.append(food)
        
        logger.info(f"📋 EXTRACTED FOODS: {unique_foods}")
        return unique_foods

    def _validate_real_nutrition_data(self, nutrition_info, food_name: str) -> bool:
        """
        Validate that nutrition info comes from real database - NO DUMMY DATA ALLOWED
        Returns True only if the data comes from the comprehensive food database
        """
        # Check if food exists in enhanced nutrition analyzer's database
        clean_food_name = food_name.lower().replace(' ', '_')
        
        # Verify the food is in our comprehensive database
        if clean_food_name in self.nutrition_analyzer.food_database:
            logger.info(f"✅ REAL DATA VALIDATED: {food_name} found in comprehensive database")
            return True
        
        # Check aliases
        for db_food_name, food_data in self.nutrition_analyzer.food_database.items():
            aliases = food_data.get('aliases', [])
            if any(alias.lower() == food_name.lower() for alias in aliases):
                logger.info(f"✅ REAL DATA VALIDATED: {food_name} matched via alias to {db_food_name}")
                return True
        
        # If nutrition info has default/estimated values, reject it
        if (nutrition_info.calories == 200 and nutrition_info.protein == 8 and 
            nutrition_info.carbs == 25 and nutrition_info.fat == 8):
            logger.warning(f"❌ DUMMY DATA REJECTED: {food_name} has default estimated values")
            return False
        
        # Check for other common dummy patterns
        if nutrition_info.food_category == "unknown":
            logger.warning(f"❌ DUMMY DATA REJECTED: {food_name} has unknown category")
            return False
        
        logger.warning(f"⚠️ DATA UNCERTAIN: {food_name} not found in comprehensive database")
        return False
                logger.info(f"✅ REAL DATA VALIDATED: {food_name} matched via alias to {db_food_name}")
                return True
        
        # If nutrition info has default/estimated values, reject it
        if (nutrition_info.calories == 200 and nutrition_info.protein == 8 and 
            nutrition_info.carbs == 25 and nutrition_info.fat == 8):
            logger.warning(f"❌ DUMMY DATA REJECTED: {food_name} has default estimated values")
            return False
        
        # Check for other common dummy patterns
        if nutrition_info.food_category == "unknown":
            logger.warning(f"❌ DUMMY DATA REJECTED: {food_name} has unknown category")
            return False
        
        logger.warning(f"⚠️ DATA UNCERTAIN: {food_name} not found in comprehensive database")
        return False

    def _estimate_portion_from_bbox(self, bbox: Dict[str, float]) -> str:
        """Estimate portion size from bounding box dimensions."""
        area = bbox['width'] * bbox['height']
        
        # More accurate portion estimation based on image area
        if area > 80000:  # Very large area
            return 'large'
        elif area > 40000:  # Medium-large area
            return 'medium'
        elif area > 15000:  # Small-medium area
            return 'small'
        else:  # Very small area
            return 'small'

    async def _calculate_nutrition(self, detected_foods: List[YOLODetectedFood]) -> Dict[str, Any]:
        """Calculate total nutrition from detected foods."""
        total_nutrition = {
            'calories': 0,
            'protein': 0,
            'carbs': 0,
            'fat': 0,
            'fiber': 0,
            'sodium': 0
        }
        
        for food in detected_foods:
            # Apply portion multiplier
            multiplier = {'small': 0.7, 'medium': 1.0, 'large': 1.4}.get(food.estimated_portion, 1.0)
            
            total_nutrition['calories'] += food.calories * multiplier
            total_nutrition['protein'] += food.protein * multiplier
            total_nutrition['carbs'] += food.carbs * multiplier
            total_nutrition['fat'] += food.fat * multiplier
            total_nutrition['fiber'] += food.fiber * multiplier
            total_nutrition['sodium'] += food.sodium * multiplier
        
        return {
            'total_nutrition': total_nutrition,
            'detailed_breakdown': [
                {
                    'name': food.name,
                    'calories': food.calories,
                    'protein': food.protein,
                    'carbs': food.carbs,
                    'fat': food.fat,
                    'portion': food.estimated_portion,
                    'confidence': food.confidence
                }
                for food in detected_foods
            ]
        }

    def _assess_analysis_quality(self, detected_foods: List[YOLODetectedFood], image: np.ndarray) -> Dict[str, Any]:
        """Assess the quality of the analysis."""
        if not detected_foods:
            return {
                'overall_confidence': 0.1,
                'warnings': ['No foods detected'],
                'recommendations': ['Provide text description or retake photo']
            }
        
        # Calculate average confidence
        avg_confidence = sum(food.confidence for food in detected_foods) / len(detected_foods)
        
        # Check image quality
        image_quality = self._assess_image_quality(image)
        
        warnings = []
        recommendations = []
        
        if avg_confidence < 0.5:
            warnings.append('Low detection confidence')
            recommendations.append('Provide more descriptive text')
        
        if image_quality < 0.6:
            warnings.append('Low image quality')
            recommendations.append('Take photo in better lighting')
        
        overall_confidence = (avg_confidence + image_quality) / 2
        
        return {
            'overall_confidence': overall_confidence,
            'average_food_confidence': avg_confidence,
            'image_quality_score': image_quality,
            'warnings': warnings,
            'recommendations': recommendations,
            'detected_foods_count': len(detected_foods)
        }

    def _assess_image_quality(self, image: np.ndarray) -> float:
        """Assess image quality for food analysis."""
        try:
            # Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Calculate sharpness using Laplacian variance
            sharpness = cv2.Laplacian(gray, cv2.CV_64F).var()
            
            # Calculate brightness
            brightness = np.mean(gray)
            
            # Calculate contrast
            contrast = gray.std()
            
            # Normalize scores
            sharpness_score = min(sharpness / 1000, 1.0)
            brightness_score = 1.0 - abs(brightness - 128) / 128
            contrast_score = min(contrast / 64, 1.0)
            
            # Combined quality score
            quality = (sharpness_score + brightness_score + contrast_score) / 3
            
            return max(0.1, min(1.0, quality))
            
        except Exception as e:
            logger.error(f"Image quality assessment failed: {e}")
            return 0.5

    async def _store_analysis_result(self, result: Dict[str, Any]):
        """Store analysis result in MongoDB."""
        try:
            await self.db.yolo_food_analyses.insert_one(result)
            logger.info(f"Stored YOLO analysis result {result['analysis_id']}")
        except Exception as e:
            logger.error(f"Failed to store analysis result: {e}")

    async def _generate_fallback_result(self, analysis_id: str, user_id: str, error_message: str) -> Dict[str, Any]:
        """Generate NO DUMMY DATA fallback result - returns empty analysis instead of fake data."""
        logger.warning(f"🚫 NO FALLBACK DUMMY DATA: Analysis failed for user {user_id}: {error_message}")
        
        return {
            'analysis_id': analysis_id,
            'user_id': user_id,
            'timestamp': datetime.now().isoformat(),
            'detected_foods': [],  # Empty - no dummy data
            'nutrition_analysis': {
                'total_nutrition': {
                    'calories': 0,
                    'protein': 0,
                    'carbs': 0,
                    'fat': 0,
                    'fiber': 0,
                    'sodium': 0
                },
                'detailed_breakdown': []
            },
            'analysis_quality': {
                'overall_confidence': 0.0,
                'warnings': [
                    f'Analysis failed: {error_message}',
                    'No real food data could be extracted',
                    'Refusing to provide dummy/estimated data'
                ],
                'recommendations': [
                    '1. Provide clear text description of foods',
                    '2. Take higher quality image with better lighting',
                    '3. Ensure foods are from supported database',
                    '4. Include recognizable food names in description'
                ]
            },
            'processing_time_seconds': 0.1,
            'method': 'no_dummy_data_policy',
            'error': error_message,
            'message': '🎯 ACCURACY FIRST: No dummy data provided. Please improve input for real analysis.'
        }


