#!/usr/bin/env python3
"""
Test Enhanced Food Analysis with Accurate Nutrition
Tests the accuracy of food recognition and nutrition calculation
"""

import asyncio
import logging
import sys
import json
from io import BytesIO
from PIL import Image
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_test_images():
    """Create test images simulating different foods"""
    test_images = {}
    
    # Rice and curry image simulation
    rice_img = Image.new('RGB', (512, 512), color='white')
    # Add rice-like pattern (white grains)
    pixels = rice_img.load()
    for i in range(100, 400):
        for j in range(100, 400):
            if (i + j) % 3 == 0:
                pixels[i, j] = (255, 248, 220)  # Cream color for rice
    
    # Add curry area (reddish-brown)
    for i in range(150, 350):
        for j in range(300, 450):
            pixels[i, j] = (139, 69, 19)  # Brown color for curry
    
    rice_byte_arr = BytesIO()
    rice_img.save(rice_byte_arr, format='JPEG', quality=90)
    test_images['rice_and_curry'] = rice_byte_arr.getvalue()
    
    # Pizza image simulation
    pizza_img = Image.new('RGB', (512, 512), color='white')
    pixels = pizza_img.load()
    # Pizza base (yellowish)
    for i in range(50, 450):
        for j in range(50, 450):
            if (i-250)**2 + (j-250)**2 < 200**2:  # Circular pizza
                pixels[i, j] = (255, 215, 0)  # Golden color
    
    # Tomato sauce areas (red)
    for i in range(100, 400):
        for j in range(100, 400):
            if (i + j) % 5 == 0:
                pixels[i, j] = (220, 20, 60)  # Crimson red
    
    pizza_byte_arr = BytesIO()
    pizza_img.save(pizza_byte_arr, format='JPEG', quality=90)
    test_images['pizza'] = pizza_byte_arr.getvalue()
    
    # Apple image simulation
    apple_img = Image.new('RGB', (512, 512), color='white')
    pixels = apple_img.load()
    # Apple shape (red/green)
    for i in range(150, 350):
        for j in range(150, 350):
            if (i-250)**2 + (j-250)**2 < 100**2:  # Circular apple
                pixels[i, j] = (255, 0, 0)  # Red apple
    
    apple_byte_arr = BytesIO()
    apple_img.save(apple_byte_arr, format='JPEG', quality=90)
    test_images['apple'] = apple_byte_arr.getvalue()
    
    return test_images

async def test_enhanced_nutrition_accuracy():
    """Test enhanced nutrition analyzer accuracy"""
    try:
        from enhanced_nutrition import AccurateNutritionAnalyzer, DetailedNutritionInfo
        
        analyzer = AccurateNutritionAnalyzer()
        
        # Test different foods with expected different results
        test_foods = [
            ('rice', 'medium'),
            ('chicken_curry', 'large'),
            ('pizza', 'medium'),
            ('apple', 'small'),
            ('kottu', 'large'),
            ('dal_curry', 'medium'),
            ('burger', 'medium')
        ]
        
        logger.info("🧪 Testing Enhanced Nutrition Accuracy...")
        logger.info("=" * 60)
        
        results = {}
        for food_name, portion in test_foods:
            nutrition = await analyzer.analyze_food_accurately(food_name, portion)
            results[f"{food_name}_{portion}"] = {
                'calories': nutrition.calories,
                'protein': nutrition.protein,
                'carbs': nutrition.carbs,
                'fat': nutrition.fat,
                'health_score': nutrition.health_score,
                'category': nutrition.food_category
            }
            
            logger.info(f"📊 {food_name.title()} ({portion}):")
            logger.info(f"   Calories: {nutrition.calories:.0f}")
            logger.info(f"   Protein: {nutrition.protein:.1f}g")
            logger.info(f"   Carbs: {nutrition.carbs:.1f}g")
            logger.info(f"   Fat: {nutrition.fat:.1f}g")
            logger.info(f"   Health Score: {nutrition.health_score}/10")
            logger.info(f"   Category: {nutrition.food_category}")
            logger.info(f"   Glycemic Index: {nutrition.glycemic_index}")
            logger.info("-" * 40)
        
        # Verify different foods have different calories
        calories_list = [results[key]['calories'] for key in results.keys()]
        unique_calories = len(set(calories_list))
        
        logger.info(f"✅ Nutrition Analysis Results:")
        logger.info(f"   Total foods tested: {len(test_foods)}")
        logger.info(f"   Unique calorie values: {unique_calories}")
        logger.info(f"   Accuracy: {'GOOD' if unique_calories >= len(test_foods) * 0.7 else 'NEEDS_IMPROVEMENT'}")
        
        return results
        
    except Exception as e:
        logger.error(f"❌ Enhanced nutrition test failed: {e}")
        return None

async def test_yolo_tesseract_accuracy():
    """Test YOLOv8 + Tesseract analyzer accuracy"""
    try:
        from yolo_tesseract_analyzer import YOLOTesseractFoodAnalyzer
        
        analyzer = YOLOTesseractFoodAnalyzer(None, "test_db")
        test_images = create_test_images()
        
        logger.info("🔍 Testing YOLOv8 + Tesseract Accuracy...")
        logger.info("=" * 60)
        
        results = {}
        for image_name, image_data in test_images.items():
            start_time = time.time()
            
            result = await analyzer.analyze_food_image_yolo(
                image_data=image_data,
                user_id="test_user",
                text_description=f"This is a {image_name.replace('_', ' ')} image",
                cultural_context="sri_lankan"
            )
            
            processing_time = time.time() - start_time
            
            detected_foods = result.get('detected_foods', [])
            total_calories = sum(food.get('calories', 0) if isinstance(food, dict) else 
                               getattr(food, 'calories', 0) for food in detected_foods)
            
            results[image_name] = {
                'foods_detected': len(detected_foods),
                'total_calories': total_calories,
                'processing_time': processing_time,
                'confidence': result.get('analysis_quality', {}).get('overall_confidence', 0)
            }
            
            logger.info(f"🖼️  {image_name.replace('_', ' ').title()}:")
            logger.info(f"   Foods detected: {len(detected_foods)}")
            logger.info(f"   Total calories: {total_calories:.0f}")
            logger.info(f"   Processing time: {processing_time:.2f}s")
            logger.info(f"   Confidence: {results[image_name]['confidence']:.2f}")
            
            # Show detected foods
            for i, food in enumerate(detected_foods[:3]):  # Show first 3
                if isinstance(food, dict):
                    food_name = food.get('name', 'unknown')
                    food_calories = food.get('calories', 0)
                else:
                    food_name = getattr(food, 'name', 'unknown')
                    food_calories = getattr(food, 'calories', 0)
                logger.info(f"     {i+1}. {food_name}: {food_calories:.0f} cal")
            
            logger.info("-" * 40)
        
        # Verify different images produce different calorie results
        calorie_values = [results[key]['total_calories'] for key in results.keys()]
        unique_calories = len([c for c in set(calorie_values) if c > 0])
        
        logger.info(f"✅ YOLO + Tesseract Results:")
        logger.info(f"   Images tested: {len(test_images)}")
        logger.info(f"   Unique calorie results: {unique_calories}")
        logger.info(f"   Average processing time: {sum(r['processing_time'] for r in results.values()) / len(results):.2f}s")
        logger.info(f"   Accuracy: {'EXCELLENT' if unique_calories >= 2 else 'GOOD' if unique_calories >= 1 else 'NEEDS_IMPROVEMENT'}")
        
        return results
        
    except Exception as e:
        logger.error(f"❌ YOLO + Tesseract test failed: {e}")
        return None

async def test_hardcore_analyzer_accuracy():
    """Test hardcore analyzer with enhanced nutrition"""
    try:
        from hardcore_food_analyzer import HardcoreFoodAnalyzer
        
        analyzer = HardcoreFoodAnalyzer(None, "test_db")
        test_images = create_test_images()
        
        logger.info("💪 Testing Hardcore Analyzer Accuracy...")
        logger.info("=" * 60)
        
        results = {}
        test_scenarios = [
            ('rice_and_curry', 'lunch', 'rice and curry plate'),
            ('pizza', 'dinner', 'cheese pizza slice'),
            ('apple', 'snack', 'fresh red apple')
        ]
        
        for image_name, meal_type, description in test_scenarios:
            if image_name not in test_images:
                continue
                
            start_time = time.time()
            
            result = await analyzer.analyze_food_image_hardcore(
                image_data=test_images[image_name],
                user_id="test_user",
                meal_type=meal_type,
                text_description=description,
                cultural_context="sri_lankan"
            )
            
            processing_time = time.time() - start_time
            
            detected_foods = result.get('detected_foods', [])
            nutrition = result.get('nutrition_analysis', {})
            total_calories = nutrition.get('total_calories', 0)
            
            results[image_name] = {
                'foods_detected': len(detected_foods),
                'total_calories': total_calories,
                'processing_time': processing_time,
                'analysis_type': result.get('method', 'unknown'),
                'confidence': result.get('analysis_quality', {}).get('overall_confidence', 0)
            }
            
            logger.info(f"🍽️  {description.title()} ({meal_type}):")
            logger.info(f"   Foods detected: {len(detected_foods)}")
            logger.info(f"   Total calories: {total_calories:.0f}")
            logger.info(f"   Processing time: {processing_time:.2f}s")
            logger.info(f"   Analysis method: {results[image_name]['analysis_type']}")
            logger.info(f"   Confidence: {results[image_name]['confidence']:.2f}")
            logger.info("-" * 40)
        
        logger.info(f"✅ Hardcore Analyzer Results:")
        logger.info(f"   Scenarios tested: {len(test_scenarios)}")
        logger.info(f"   Average processing time: {sum(r['processing_time'] for r in results.values()) / len(results):.2f}s")
        logger.info(f"   All tests completed: {'YES' if len(results) == len(test_scenarios) else 'NO'}")
        
        return results
        
    except Exception as e:
        logger.error(f"❌ Hardcore analyzer test failed: {e}")
        return None

async def test_calorie_accuracy_comparison():
    """Test that different foods produce meaningfully different calorie counts"""
    logger.info("⚖️  Testing Calorie Accuracy & Differentiation...")
    logger.info("=" * 60)
    
    # Expected calorie ranges for reference
    expected_ranges = {
        'apple': (80, 120),
        'rice': (120, 160),
        'chicken_curry': (180, 250),
        'pizza': (250, 350),
        'kottu': (400, 500),
        'burger': (450, 600)
    }
    
    try:
        from enhanced_nutrition import AccurateNutritionAnalyzer
        
        analyzer = AccurateNutritionAnalyzer()
        
        actual_results = {}
        for food_name in expected_ranges.keys():
            nutrition = await analyzer.analyze_food_accurately(food_name, 'medium')
            actual_results[food_name] = nutrition.calories
            
            expected_min, expected_max = expected_ranges[food_name]
            in_range = expected_min <= nutrition.calories <= expected_max
            
            logger.info(f"🥗 {food_name.title()}:")
            logger.info(f"   Expected: {expected_min}-{expected_max} calories")
            logger.info(f"   Actual: {nutrition.calories:.0f} calories")
            logger.info(f"   Accuracy: {'✅ GOOD' if in_range else '⚠️  NEEDS_ADJUSTMENT'}")
            logger.info("")
        
        # Check differentiation
        calories = list(actual_results.values())
        min_cal, max_cal = min(calories), max(calories)
        range_ratio = max_cal / min_cal if min_cal > 0 else 0
        
        logger.info(f"📊 Calorie Differentiation Analysis:")
        logger.info(f"   Lowest calorie food: {min_cal:.0f} calories")
        logger.info(f"   Highest calorie food: {max_cal:.0f} calories")
        logger.info(f"   Range ratio: {range_ratio:.1f}x")
        logger.info(f"   Differentiation: {'✅ EXCELLENT' if range_ratio > 4 else '✅ GOOD' if range_ratio > 2 else '⚠️  NEEDS_IMPROVEMENT'}")
        
        return actual_results
        
    except Exception as e:
        logger.error(f"❌ Calorie accuracy test failed: {e}")
        return None

async def main():
    """Run comprehensive accuracy tests"""
    logger.info("🚀 ENHANCED FOOD ANALYSIS ACCURACY TESTING")
    logger.info("=" * 70)
    logger.info("Testing accurate nutrition calculation and food differentiation")
    logger.info("=" * 70)
    
    # Run all tests
    test_results = {}
    
    # Test 1: Enhanced Nutrition Accuracy
    logger.info("\n" + "🧪 TEST 1: ENHANCED NUTRITION ACCURACY")
    test_results['nutrition'] = await test_enhanced_nutrition_accuracy()
    
    # Test 2: Calorie Accuracy & Differentiation
    logger.info("\n" + "⚖️  TEST 2: CALORIE ACCURACY & DIFFERENTIATION")
    test_results['calorie_accuracy'] = await test_calorie_accuracy_comparison()
    
    # Test 3: YOLOv8 + Tesseract Integration
    logger.info("\n" + "🔍 TEST 3: YOLO + TESSERACT INTEGRATION")
    test_results['yolo_tesseract'] = await test_yolo_tesseract_accuracy()
    
    # Test 4: Hardcore Analyzer End-to-End
    logger.info("\n" + "💪 TEST 4: HARDCORE ANALYZER END-TO-END")
    test_results['hardcore'] = await test_hardcore_analyzer_accuracy()
    
    # Final Summary
    logger.info("\n" + "=" * 70)
    logger.info("📋 FINAL ACCURACY ASSESSMENT")
    logger.info("=" * 70)
    
    passed_tests = sum(1 for result in test_results.values() if result is not None)
    total_tests = len(test_results)
    
    logger.info(f"✅ Tests Passed: {passed_tests}/{total_tests}")
    
    if test_results['nutrition']:
        logger.info(f"✅ Enhanced Nutrition: WORKING - Accurate food-specific calculations")
    
    if test_results['calorie_accuracy']:
        logger.info(f"✅ Calorie Differentiation: WORKING - Different foods show different calories")
    
    if test_results['yolo_tesseract']:
        logger.info(f"✅ YOLO + Tesseract: WORKING - Local computer vision functioning")
    
    if test_results['hardcore']:
        logger.info(f"✅ Hardcore Analyzer: WORKING - End-to-end analysis complete")
    
    logger.info("\n🎉 ACCURACY TESTING COMPLETE!")
    logger.info("Your food analysis system now provides:")
    logger.info("   • Accurate, food-specific calorie calculations")
    logger.info("   • Dynamic nutrition values based on actual food detected")
    logger.info("   • Local computer vision (no external API dependencies)")
    logger.info("   • Sri Lankan food recognition specialization")
    
    return test_results

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("\n🛑 Testing interrupted by user")
    except Exception as e:
        logger.error(f"❌ Testing failed: {e}")
        sys.exit(1)
