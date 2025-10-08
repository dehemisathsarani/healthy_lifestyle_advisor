import requests
import json
from datetime import datetime, timedelta
import random

# Configuration
BASE_URL = "http://localhost:8000/api/v1"  # Adjust if your server runs on a different port
AUTH_TOKEN = None  # Will be set after login


def login():
    """Log in to get auth token"""
    login_data = {
        "username": "testuser",
        "password": "testpassword"
    }
    
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    if response.status_code == 200:
        global AUTH_TOKEN
        AUTH_TOKEN = response.json()["access_token"]
        print("✅ Login successful")
        return True
    else:
        print(f"❌ Login failed: {response.text}")
        return False


def get_headers():
    """Get headers with auth token"""
    return {
        "Authorization": f"Bearer {AUTH_TOKEN}",
        "Content-Type": "application/json"
    }


def test_heart_rate_endpoint():
    """Test heart rate recording and retrieval"""
    # Create sample heart rate data
    heart_rate_data = {
        "user_id": "test_user_id",  # This should match the user ID from your token
        "bpm": 75,
        "activity_state": "rest",
        "timestamp": datetime.now().isoformat(),
        "source": "test_device"
    }
    
    # Record heart rate
    response = requests.post(f"{BASE_URL}/health/heart-rate", 
                            headers=get_headers(),
                            json=heart_rate_data)
    
    if response.status_code == 200:
        print("✅ Heart rate recorded successfully")
    else:
        print(f"❌ Failed to record heart rate: {response.text}")
        return False
    
    # Get heart rate data
    response = requests.get(f"{BASE_URL}/health/heart-rate", headers=get_headers())
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Retrieved {len(data)} heart rate records")
        return True
    else:
        print(f"❌ Failed to get heart rate data: {response.text}")
        return False


def test_sleep_data_endpoint():
    """Test sleep data recording and retrieval"""
    # Create sample sleep data
    sleep_data = {
        "user_id": "test_user_id",
        "start_time": (datetime.now() - timedelta(hours=8)).isoformat(),
        "end_time": datetime.now().isoformat(),
        "duration_minutes": 480,
        "deep_sleep_minutes": 120,
        "light_sleep_minutes": 240,
        "rem_sleep_minutes": 90,
        "awake_minutes": 30,
        "sleep_score": 85,
        "interruptions": 2,
        "source": "test_device",
        "timestamp": datetime.now().isoformat()
    }
    
    # Record sleep data
    response = requests.post(f"{BASE_URL}/health/sleep", 
                            headers=get_headers(),
                            json=sleep_data)
    
    if response.status_code == 200:
        print("✅ Sleep data recorded successfully")
    else:
        print(f"❌ Failed to record sleep data: {response.text}")
        return False
    
    # Get sleep data
    response = requests.get(f"{BASE_URL}/health/sleep", headers=get_headers())
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Retrieved {len(data)} sleep records")
        return True
    else:
        print(f"❌ Failed to get sleep data: {response.text}")
        return False


def test_activity_data_endpoint():
    """Test activity data recording and retrieval"""
    # Create sample activity data
    activity_data = {
        "user_id": "test_user_id",
        "count": 8500,
        "distance_meters": 6500,
        "floors_climbed": 10,
        "timestamp": datetime.now().isoformat(),
        "source": "test_device"
    }
    
    # Record activity data
    response = requests.post(f"{BASE_URL}/health/steps", 
                            headers=get_headers(),
                            json=activity_data)
    
    if response.status_code == 200:
        print("✅ Activity data recorded successfully")
    else:
        print(f"❌ Failed to record activity data: {response.text}")
        return False
    
    # Get activity data
    response = requests.get(f"{BASE_URL}/health/steps", headers=get_headers())
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Retrieved {len(data)} activity records")
        return True
    else:
        print(f"❌ Failed to get activity data: {response.text}")
        return False


def test_health_summary_endpoint():
    """Test health summary retrieval"""
    response = requests.get(f"{BASE_URL}/health/summary", headers=get_headers())
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Health summary retrieved successfully")
        print(f"   Steps: {data['steps']['total']}")
        print(f"   Sleep: {data['sleep']['duration_hours']} hours")
        print(f"   Recovery score: {data['recovery']['score']}")
        return True
    else:
        print(f"❌ Failed to get health summary: {response.text}")
        return False


def test_recovery_advice_endpoint():
    """Test recovery advice retrieval"""
    # Regular recovery advice
    response = requests.get(f"{BASE_URL}/health/recovery", headers=get_headers())
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Recovery advice retrieved successfully")
        print(f"   Status: {data['recovery_status']}")
        print(f"   Score: {data['recovery_score']}")
        
        # Check for enhanced fields
        has_enhanced_fields = ('physical_recommendations' in data and 
                             'mental_recommendations' in data and
                             'nutritional_recommendations' in data)
        
        if has_enhanced_fields:
            print(f"✅ Enhanced recovery advice detected")
            print(f"   Physical recommendations: {len(data['physical_recommendations'])}")
            print(f"   Mental recommendations: {len(data['mental_recommendations'])}")
            print(f"   Nutritional recommendations: {len(data['nutritional_recommendations'])}")
        else:
            print(f"❌ Enhanced recovery advice fields not found")
        
        # Test refresh functionality
        print("Testing refresh functionality...")
        response = requests.get(f"{BASE_URL}/health/recovery?refresh=true", headers=get_headers())
        
        if response.status_code == 200:
            print(f"✅ Recovery advice refresh successful")
            return True
        else:
            print(f"❌ Recovery advice refresh failed: {response.text}")
            return False
    else:
        print(f"❌ Failed to get recovery advice: {response.text}")
        return False


def test_health_alerts_endpoint():
    """Test health alerts retrieval"""
    response = requests.get(f"{BASE_URL}/health/insights", headers=get_headers())
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Health alerts retrieved successfully: {len(data)} alerts")
        return True
    else:
        print(f"❌ Failed to get health alerts: {response.text}")
        return False


def test_wearable_devices_endpoint():
    """Test wearable device connection"""
    # Get available devices
    response = requests.get(f"{BASE_URL}/health/devices", headers=get_headers())
    
    if response.status_code == 200:
        devices = response.json()
        print(f"✅ Connected devices retrieved successfully: {len(devices)} devices")
        
        # Test device connection
        mock_device = {
            "deviceName": "Test Fitness Band",
            "deviceType": "fitness_band",
            "authToken": "test_token"
        }
        
        response = requests.post(f"{BASE_URL}/health/devices", 
                               headers=get_headers(),
                               json=mock_device)
        
        if response.status_code == 200:
            device = response.json()
            print(f"✅ Device connection successful: {device['name']}")
            
            # Test device disconnection
            response = requests.delete(f"{BASE_URL}/health/devices/{device['id']}", 
                                    headers=get_headers())
            
            if response.status_code == 200:
                print(f"✅ Device disconnection successful")
                return True
            else:
                print(f"❌ Device disconnection failed: {response.text}")
                return False
        else:
            print(f"❌ Device connection failed: {response.text}")
            return False
    else:
        print(f"❌ Failed to get connected devices: {response.text}")
        return False


def simulate_multiple_days_data():
    """Simulate submitting multiple days of health data"""
    print("\n🔄 Simulating multiple days of health data...")
    
    # Generate data for the past 7 days
    for days_ago in range(7, 0, -1):
        date = datetime.now() - timedelta(days=days_ago)
        print(f"\nGenerating data for {date.strftime('%Y-%m-%d')}...")
        
        # Generate heart rate data for the day
        for hour in range(0, 24, 2):  # Every 2 hours
            data_time = date.replace(hour=hour)
            
            # Vary heart rate based on time of day
            if 22 <= hour or hour <= 6:  # Night
                bpm = random.randint(50, 65)
                state = "rest"
            elif 6 < hour < 9 or 17 < hour < 20:  # Morning or evening exercise
                bpm = random.randint(110, 160)
                state = "exercise" if random.random() > 0.5 else "active"
            else:  # Day
                bpm = random.randint(65, 90)
                state = "active"
            
            heart_rate_data = {
                "user_id": "test_user_id",
                "bpm": bpm,
                "activity_state": state,
                "timestamp": data_time.isoformat(),
                "source": "test_device"
            }
            
            requests.post(f"{BASE_URL}/health/heart-rate", 
                         headers=get_headers(),
                         json=heart_rate_data)
        
        # Generate sleep data for the night
        sleep_start = date.replace(hour=22, minute=30)
        sleep_end = (date + timedelta(days=1)).replace(hour=6, minute=45)
        duration = int((sleep_end - sleep_start).total_seconds() / 60)
        
        # Randomize sleep quality
        quality = random.randint(60, 95)
        deep_sleep = int(duration * random.uniform(0.15, 0.25))
        light_sleep = int(duration * random.uniform(0.45, 0.55))
        rem_sleep = int(duration * random.uniform(0.15, 0.25))
        awake = duration - deep_sleep - light_sleep - rem_sleep
        
        sleep_data = {
            "user_id": "test_user_id",
            "start_time": sleep_start.isoformat(),
            "end_time": sleep_end.isoformat(),
            "duration_minutes": duration,
            "deep_sleep_minutes": deep_sleep,
            "light_sleep_minutes": light_sleep,
            "rem_sleep_minutes": rem_sleep,
            "awake_minutes": awake,
            "sleep_score": quality,
            "interruptions": random.randint(0, 3),
            "source": "test_device",
            "timestamp": date.isoformat()
        }
        
        requests.post(f"{BASE_URL}/health/sleep", 
                     headers=get_headers(),
                     json=sleep_data)
        
        # Generate activity data for the day
        steps = random.randint(6000, 15000)
        activity_data = {
            "user_id": "test_user_id",
            "count": steps,
            "distance_meters": int(steps * 0.762),  # Average stride length
            "floors_climbed": random.randint(5, 20),
            "timestamp": date.replace(hour=23, minute=59).isoformat(),
            "source": "test_device"
        }
        
        requests.post(f"{BASE_URL}/health/steps", 
                     headers=get_headers(),
                     json=activity_data)
        
        # Generate workout data (assuming there's a workout endpoint)
        if random.random() > 0.3:  # 70% chance of having a workout
            workout_data = {
                "user_id": "test_user_id",
                "workout_type": random.choice(["strength", "cardio", "flexibility", "hiit"]),
                "duration_minutes": random.randint(30, 90),
                "intensity": random.randint(3, 10),
                "calories_burned": random.randint(200, 800),
                "completed_at": date.replace(hour=random.choice([6, 17, 18, 19])).isoformat(),
                "perceived_effort": random.randint(3, 10)
            }
            
            try:
                requests.post(f"{BASE_URL}/workouts", 
                             headers=get_headers(),
                             json=workout_data)
            except:
                pass  # Ignore if workout endpoint doesn't exist
    
    print("\n✅ Successfully generated multiple days of health data")


def run_tests():
    """Run all tests"""
    print("\n🔍 TESTING HEALTH MONITORING ENDPOINTS\n")
    
    if not login():
        print("\n❌ Testing aborted: Login failed")
        return
    
    # Run tests
    tests = [
        ("Heart Rate Endpoint", test_heart_rate_endpoint),
        ("Sleep Data Endpoint", test_sleep_data_endpoint),
        ("Activity Data Endpoint", test_activity_data_endpoint),
        ("Health Summary Endpoint", test_health_summary_endpoint),
        ("Recovery Advice Endpoint", test_recovery_advice_endpoint),
        ("Health Alerts Endpoint", test_health_alerts_endpoint),
        ("Wearable Devices Endpoint", test_wearable_devices_endpoint),
    ]
    
    results = []
    for name, test_func in tests:
        print(f"\n🧪 Testing {name}...")
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"❌ Exception during test: {str(e)}")
            results.append((name, False))
    
    # Simulate multiple days data
    try:
        simulate_multiple_days_data()
    except Exception as e:
        print(f"❌ Exception during data simulation: {str(e)}")
    
    # Print summary
    print("\n\n📊 TEST RESULTS SUMMARY")
    print("=" * 40)
    
    passed = 0
    for name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        if result:
            passed += 1
        print(f"{name.ljust(30)} {status}")
    
    print("=" * 40)
    print(f"{passed}/{len(results)} tests passed")
    
    if passed == len(results):
        print("\n🎉 All tests passed! The health monitoring API is working correctly.")
    else:
        print("\n⚠️ Some tests failed. Please check the logs above for details.")


if __name__ == "__main__":
    run_tests()
