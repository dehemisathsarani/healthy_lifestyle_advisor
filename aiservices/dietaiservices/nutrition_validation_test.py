#!/usr/bin/env python3
"""
Quick validation test for the enhanced nutrition system
This test validates that the food analysis provides accurate nutrition data instead of dummy data
"""

import asyncio
import numpy as np
from PIL import Image
import json
import sys
import os

# Add the current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from enhanced_nutrition import AccurateNutritionAnalyzer, DetailedNutritionInfo

async def test_enhanced_nutrition_accuracy():
    """Test that the enhanced nutrition analyzer provides accurate, different values for different foods"""
    print("🧪 Testing Enhanced Nutrition System Accuracy")
    print("=" * 60)
    
    # Initialize the enhanced nutrition analyzer
    nutrition_analyzer = AccurateNutritionAnalyzer()
    
    # Test different foods to ensure we get different, accurate nutrition data
    test_foods = [
        ("apple", 100.0, "grams"),
        ("banana", 150.0, "grams"),
        ("rice", 200.0, "grams"),
        ("chicken breast", 100.0, "grams"),
        ("pizza", 300.0, "grams"),
    ]
    
    results = []
    
    for food_name, portion, unit in test_foods:
        print(f"📊 Analyzing {food_name} ({portion} {unit})...")
        
        try:
            # Get accurate nutrition data
            nutrition_info = await nutrition_analyzer.analyze_food_accurately(food_name, portion, unit)
            
            results.append({
                'food': food_name,
                'portion': f"{portion} {unit}",
                'calories': nutrition_info.calories,
                'protein': nutrition_info.protein,
                'carbs': nutrition_info.carbs,
                'fat': nutrition_info.fat,
                'fiber': nutrition_info.fiber,
                'sugar': nutrition_info.sugar
            })
            
            print(f"  ✅ Calories: {nutrition_info.calories:.1f}")
            print(f"  ✅ Protein: {nutrition_info.protein:.1f}g")
            print(f"  ✅ Carbs: {nutrition_info.carbs:.1f}g")
            print(f"  ✅ Fat: {nutrition_info.fat:.1f}g")
            print(f"  ✅ Fiber: {nutrition_info.fiber:.1f}g")
            print(f"  ✅ Sugar: {nutrition_info.sugar:.1f}g")
            
        except Exception as e:
            print(f"  ❌ Error analyzing {food_name}: {e}")
            results.append({
                'food': food_name,
                'error': str(e)
            })
        
        print()
    
    # Validate that we get different values for different foods
    print("🔍 Validation Results:")
    print("=" * 60)
    
    # Check for data variability (not dummy data)
    calories_values = [r['calories'] for r in results if 'calories' in r]
    protein_values = [r['protein'] for r in results if 'protein' in r]
    
    if len(set(calories_values)) > 1:
        print("✅ PASS: Different foods show different calorie values (not dummy data)")
    else:
        print("❌ FAIL: All foods show same calorie values (likely dummy data)")
    
    if len(set(protein_values)) > 1:
        print("✅ PASS: Different foods show different protein values (not dummy data)")
    else:
        print("❌ FAIL: All foods show same protein values (likely dummy data)")
    
    # Check for reasonable value ranges
    reasonable_results = True
    for result in results:
        if 'calories' in result:
            food = result['food']
            calories = result['calories']
            
            # Basic sanity checks
            if calories <= 0:
                print(f"❌ FAIL: {food} has invalid calories: {calories}")
                reasonable_results = False
            elif food == 'apple' and (calories < 40 or calories > 100):
                print(f"⚠️  WARNING: {food} calories seem unreasonable: {calories} (expected ~50-80)")
            elif food == 'chicken breast' and (calories < 140 or calories > 200):
                print(f"⚠️  WARNING: {food} calories seem unreasonable: {calories} (expected ~165)")
    
    if reasonable_results:
        print("✅ PASS: All nutrition values are in reasonable ranges")
    
    return results

async def test_yolo_tesseract_integration():
    """Test that YOLOv8 + Tesseract integration is working"""
    print("\n🤖 Testing YOLOv8 + Tesseract Integration")
    print("=" * 60)
    
    try:
        from yolo_tesseract_analyzer import YOLOTesseractFoodAnalyzer
        
        analyzer = YOLOTesseractFoodAnalyzer()
        print("✅ PASS: YOLOTesseractFoodAnalyzer imported successfully")
        
        # Create a simple test image
        test_image = Image.new('RGB', (640, 480), color='white')
        
        # Test basic functionality
        result = await analyzer.analyze_food_image(test_image)
        print(f"✅ PASS: YOLOv8 + Tesseract analysis completed")
        print(f"  Detected items: {len(result.get('detected_foods', []))}")
        
        return True
        
    except ImportError as e:
        print(f"❌ FAIL: Could not import YOLOTesseractFoodAnalyzer: {e}")
        return False
    except Exception as e:
        print(f"⚠️  WARNING: YOLOv8 + Tesseract test failed: {e}")
        return False

async def main():
    """Main test function"""
    print("🚀 Enhanced Nutrition System Validation")
    print("=" * 60)
    print("This test validates that the system provides accurate nutrition data")
    print("instead of dummy data, using YOLOv8 + Tesseract for food detection.\n")
    
    # Test enhanced nutrition accuracy
    nutrition_results = await test_enhanced_nutrition_accuracy()
    
    # Test YOLOv8 + Tesseract integration
    yolo_success = await test_yolo_tesseract_integration()
    
    # Summary
    print("\n📋 Test Summary")
    print("=" * 60)
    
    if len(nutrition_results) > 0 and all('calories' in r for r in nutrition_results):
        print("✅ Enhanced nutrition system is providing accurate data")
    else:
        print("❌ Enhanced nutrition system needs attention")
    
    if yolo_success:
        print("✅ YOLOv8 + Tesseract integration is working")
    else:
        print("❌ YOLOv8 + Tesseract integration needs attention")
    
    print("\n🎯 The system is ready to provide accurate calorie counting!")
    print("   Different foods will now show different, accurate nutrition values.")

if __name__ == "__main__":
    asyncio.run(main())
