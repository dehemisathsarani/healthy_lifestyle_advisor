"""
Quick test to check the food analysis endpoint error
"""
import requests
import json
from io import BytesIO
from PIL import Image

# Create a simple test image
print("Creating test image...")
img = Image.new('RGB', (200, 200), color='white')
img_bytes = BytesIO()
img.save(img_bytes, format='JPEG')
img_bytes.seek(0)

# Test the endpoint
print("Testing /analyze-food-yolo endpoint...")
try:
    response = requests.post(
        "http://localhost:8001/analyze-food-yolo",
        files={'image': ('test.jpg', img_bytes, 'image/jpeg')},
        data={
            'text_description': 'bread',
            'meal_type': 'breakfast',
            'user_id': 'test_user'
        },
        timeout=30
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text[:500]}")
    
    if response.status_code == 200:
        result = response.json()
        print("\n✅ SUCCESS!")
        print(json.dumps(result, indent=2))
    else:
        print("\n❌ FAILED!")
        
except Exception as e:
    print(f"❌ Error: {e}")
