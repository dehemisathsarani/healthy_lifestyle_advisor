"""
Check what settings the backend is using
"""
import requests

BASE_URL = "http://localhost:8001"

print("="*70)
print("Checking Backend Configuration")
print("="*70)
print()

# Test health endpoint to see MongoDB status
try:
    response = requests.get(f"{BASE_URL}/health")
    if response.status_code == 200:
        health = response.json()
        print("✅ Backend Health:")
        print(f"   Status: {health.get('status')}")
        print(f"   MongoDB: {health.get('services', {}).get('mongodb')}")
        print(f"   Message Queue: {health.get('services', {}).get('message_queue')}")
        print()
except Exception as e:
    print(f"❌ Error checking health: {e}")

# Try to get some logs directly
print("Testing direct MongoDB query from backend...")
try:
    # This will test if backend can query MongoDB
    response = requests.post(
        f"{BASE_URL}/generate-weekly-report",
        params={'user_id': 'test_user_diet_001'},
        timeout=30
    )
    
    result = response.json()
    print(f"Status: {response.status_code}")
    print(f"Logs found: {result.get('logs_count', 0)}")
    print(f"Success: {result.get('success', False)}")
    print(f"Message: {result.get('message', 'N/A')}")
    
    if result.get('logs_count', 0) > 0:
        print("\n✅ Backend CAN access MongoDB Atlas data!")
    else:
        print("\n❌ Backend CANNOT find data in MongoDB")
        print("\nPossible issues:")
        print("1. Backend using wrong MongoDB URL (localhost instead of Atlas)")
        print("2. Backend using wrong database name")
        print("3. Backend settings not loaded from .env file")
        
except Exception as e:
    print(f"❌ Error: {e}")

print("\n" + "="*70)
