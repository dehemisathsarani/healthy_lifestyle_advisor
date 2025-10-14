"""
Quick test to see the detailed error from food analysis endpoint
"""
import requests
from io import BytesIO
from PIL import Image, ImageDraw

def create_test_image():
    """Create a simple test food image"""
    img = Image.new('RGB', (300, 300), color='white')
    draw = ImageDraw.Draw(img)
    
    # Draw a simple food shape (bread)
    draw.rectangle([50, 100, 250, 200], fill='#DEB887', outline='#8B7355', width=3)
    draw.text((100, 140), "BREAD", fill='black')
    
    img_bytes = BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)
    return img_bytes

try:
    test_image = create_test_image()
    
    files = {'image': ('test_bread.jpg', test_image, 'image/jpeg')}
    data = {
        'text_description': 'bread',
        'meal_type': 'breakfast',
        'user_id': 'test_debug'
    }
    
    print("🔍 Testing Food Analysis Endpoint...")
    
    response = requests.post(
        'http://localhost:8001/analyze-food-yolo',
        files=files,
        data=data,
        timeout=30
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response Text: {response.text}")
    
    if response.status_code != 200:
        print("\n❌ Error Details:")
        try:
            error_data = response.json()
            print(f"Detail: {error_data.get('detail', 'No detail provided')}")
        except:
            print("Could not parse JSON response")
    
except Exception as e:
    print(f"❌ Test failed: {str(e)}")