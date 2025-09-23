import io
import base64
from typing import List, Dict, Optional
from google.cloud import vision
from PIL import Image
import numpy as np
from pydantic import BaseModel
import logging
from settings import settings

logger = logging.getLogger(__name__)

class DetectedFood(BaseModel):
    name: str
    confidence: float
    estimated_portion: str
    bounding_box: Optional[Dict[str, float]] = None

class FoodVisionAnalyzer:
    def __init__(self):
        if settings.DISABLE_GOOGLE_VISION:
            logger.info("Google Vision API disabled for local development")
            self.client = None
            self.vision_available = False
        elif settings.USE_MOCK_GOOGLE_VISION:
            logger.info("Using mock Google Vision API for local development")
            self.client = None
            self.vision_available = True  # We'll use fallback methods
        else:
            try:
                self.client = vision.ImageAnnotatorClient()
                self.vision_available = True
                logger.info("Google Vision API initialized successfully")
            except Exception as e:
                logger.warning(f"Google Vision API not available, using mock service: {e}")
                self.client = None
                self.vision_available = True  # Use fallback
        
        self.food_keywords = {
            'fruits': ['apple', 'banana', 'orange', 'grape', 'strawberry', 'mango', 'pineapple'],
            'vegetables': ['carrot', 'broccoli', 'spinach', 'tomato', 'lettuce', 'cucumber'],
            'proteins': ['chicken', 'beef', 'fish', 'egg', 'tofu', 'beans', 'salmon'],
            'grains': ['rice', 'bread', 'pasta', 'quinoa', 'oatmeal', 'cereal'],
            'dairy': ['milk', 'cheese', 'yogurt', 'butter'],
            'snacks': ['chips', 'cookie', 'cake', 'chocolate', 'nuts']
        }
    
    async def analyze_food_image(self, image_data: bytes) -> List[DetectedFood]:
        """Analyze food image and detect food items."""
        if not self.client or not self.vision_available:
            return await self._fallback_analysis(image_data)
        
        try:
            image = vision.Image(content=image_data)
            
            # Perform label detection
            response = self.client.label_detection(image=image)
            labels = response.label_annotations
            
            # Perform object localization
            objects = self.client.object_localization(image=image).localized_object_annotations
            
            detected_foods = []
            
            # Process labels to find food items
            for label in labels:
                if self._is_food_label(label.description.lower()):
                    food_item = DetectedFood(
                        name=label.description,
                        confidence=label.score,
                        estimated_portion=self._estimate_portion(label.description)
                    )
                    detected_foods.append(food_item)
            
            # Process localized objects
            for obj in objects:
                if self._is_food_label(obj.name.lower()):
                    # Extract bounding box
                    vertices = obj.bounding_poly.normalized_vertices
                    bounding_box = {
                        'x1': vertices[0].x,
                        'y1': vertices[0].y,
                        'x2': vertices[2].x,
                        'y2': vertices[2].y
                    }
                    
                    food_item = DetectedFood(
                        name=obj.name,
                        confidence=obj.score,
                        estimated_portion=self._estimate_portion_from_bbox(bounding_box),
                        bounding_box=bounding_box
                    )
                    detected_foods.append(food_item)
            
            # Remove duplicates and sort by confidence
            detected_foods = self._deduplicate_foods(detected_foods)
            detected_foods.sort(key=lambda x: x.confidence, reverse=True)
            
            return detected_foods[:5]  # Return top 5 detections
            
        except Exception as e:
            logger.error(f"Error in Google Vision analysis: {e}")
            return await self._fallback_analysis(image_data)
    
    def _is_food_label(self, label: str) -> bool:
        """Check if a label represents food."""
        food_terms = []
        for category, items in self.food_keywords.items():
            food_terms.extend(items)
        
        # Add more general food terms
        food_terms.extend(['food', 'meal', 'dish', 'cuisine', 'snack', 'dessert', 'beverage'])
        
        return any(term in label for term in food_terms)
    
    def _estimate_portion(self, food_name: str) -> str:
        """Estimate portion size based on food type."""
        portion_mapping = {
            'apple': '1 medium apple',
            'banana': '1 medium banana',
            'chicken': '100g serving',
            'rice': '1 cup cooked',
            'bread': '1 slice',
            'egg': '1 large egg',
            'cheese': '30g serving'
        }
        
        food_lower = food_name.lower()
        for food, portion in portion_mapping.items():
            if food in food_lower:
                return portion
        
        return '1 serving'
    
    def _estimate_portion_from_bbox(self, bbox: Dict[str, float]) -> str:
        """Estimate portion size from bounding box dimensions."""
        width = bbox['x2'] - bbox['x1']
        height = bbox['y2'] - bbox['y1']
        area = width * height
        
        if area > 0.3:
            return 'Large portion'
        elif area > 0.15:
            return 'Medium portion'
        else:
            return 'Small portion'
    
    def _deduplicate_foods(self, foods: List[DetectedFood]) -> List[DetectedFood]:
        """Remove duplicate food detections."""
        seen = set()
        unique_foods = []
        
        for food in foods:
            # Create a simplified name for comparison
            simple_name = food.name.lower().strip()
            if simple_name not in seen:
                seen.add(simple_name)
                unique_foods.append(food)
        
        return unique_foods
    
    async def _fallback_analysis(self, image_data: bytes) -> List[DetectedFood]:
        """Fallback analysis when Google Vision is not available."""
        logger.warning("Using fallback food detection")
        
        # Simple fallback - return generic food detection
        return [
            DetectedFood(
                name="Food item",
                confidence=0.5,
                estimated_portion="1 serving"
            )
        ]

class ImagePreprocessor:
    @staticmethod
    def resize_image(image_data: bytes, max_size: int = 1024) -> bytes:
        """Resize image while maintaining aspect ratio."""
        try:
            image = Image.open(io.BytesIO(image_data))
            
            # Calculate new dimensions
            width, height = image.size
            if width > height:
                new_width = min(width, max_size)
                new_height = int((height * new_width) / width)
            else:
                new_height = min(height, max_size)
                new_width = int((width * new_height) / height)
            
            # Resize image
            resized_image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            # Convert back to bytes
            output_buffer = io.BytesIO()
            resized_image.save(output_buffer, format='JPEG', quality=85)
            return output_buffer.getvalue()
            
        except Exception as e:
            logger.error(f"Error resizing image: {e}")
            return image_data
    
    @staticmethod
    def enhance_food_image(image_data: bytes) -> bytes:
        """Enhance image for better food detection."""
        try:
            image = Image.open(io.BytesIO(image_data))
            
            # Convert to RGB if needed
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Apply basic enhancements
            # You can add more sophisticated image enhancement here
            
            # Convert back to bytes
            output_buffer = io.BytesIO()
            image.save(output_buffer, format='JPEG', quality=90)
            return output_buffer.getvalue()
            
        except Exception as e:
            logger.error(f"Error enhancing image: {e}")
            return image_data
    
    @staticmethod
    def validate_image(image_data: bytes) -> bool:
        """Validate if the uploaded data is a valid image."""
        try:
            image = Image.open(io.BytesIO(image_data))
            image.verify()
            return True
        except Exception:
            return False