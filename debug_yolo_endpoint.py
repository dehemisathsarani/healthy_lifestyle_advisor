"""
Debug the YOLO endpoint 500 error
This will show the actual error message from the backend
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

# Test the endpoint with verbose error reporting
print("Testing /analyze-food-yolo endpoint...")
print("URL: http://localhost:8001/analyze-food-yolo")
print()

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
    print(f"Response Headers: {dict(response.headers)}")
    print()
    print("Response Body:")
    print("="*70)
    
    # Try to parse as JSON first
    try:
        result = response.json()
        print(json.dumps(result, indent=2))
    except:
        # If not JSON, print raw text
        print(response.text)
    
    print("="*70)
    
    if response.status_code == 200:
        print("\n✅ SUCCESS!")
    else:
        print(f"\n❌ FAILED with status {response.status_code}")
        print("\nPossible causes:")
        print("1. Tesseract not in PATH or not installed")
        print("2. MongoDB connection issue")
        print("3. YOLO model loading error")
        print("4. Image processing error")
        print("\nCheck the backend console window for detailed error logs")
        
except requests.exceptions.Timeout:
    print("❌ Request timed out after 30 seconds")
    print("Backend may be processing but taking too long")
    
except requests.exceptions.ConnectionError as e:
    print(f"❌ Cannot connect to backend: {e}")
    print("Make sure backend is running on port 8001")
    
except Exception as e:
    print(f"❌ Unexpected error: {type(e).__name__}: {e}")
