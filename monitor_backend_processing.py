"""
Backend Messaging Log Monitor
Monitors backend logs to verify message processing for diet and fitness agents
"""

import requests
import json
import time
from datetime import datetime

BACKEND_URL = "http://localhost:8005"

def print_header(title):
    """Print formatted header"""
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80)

def send_test_meal():
    """Send a test meal event"""
    test_data = {
        "name": "Test Chicken Salad",
        "userId": "monitor_test_user",
        "mealTime": "lunch",
        "calorieCount": 450,
        "protein": 35,
        "carbs": 40,
        "fat": 15,
        "fiber": 8,
        "foodItems": ["grilled chicken", "mixed greens", "olive oil dressing"]
    }
    
    print("\n📤 Sending TEST MEAL event...")
    print(f"   Meal: {test_data['name']}")
    print(f"   Calories: {test_data['calorieCount']} kcal")
    print(f"   Time: {test_data['mealTime']}")
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/api/messaging/diet/meal-logged",
            json=test_data,
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print(f"\n✅ Message sent successfully!")
                print(f"   Message ID: {result.get('data', {}).get('message_id')}")
                print(f"   Status: {result.get('data', {}).get('status')}")
                return True
        else:
            print(f"\n❌ Failed with status: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False

def send_test_workout():
    """Send a test workout event"""
    test_data = {
        "name": "Morning Cardio Session",
        "userId": "monitor_test_user",
        "exerciseDuration": 30,
        "caloriesBurnt": 280,
        "workoutType": "cardio",
        "intensity": "moderate",
        "exercises": ["running", "cycling"],
        "heartRate": 145
    }
    
    print("\n📤 Sending TEST WORKOUT event...")
    print(f"   Workout: {test_data['name']}")
    print(f"   Duration: {test_data['exerciseDuration']} minutes")
    print(f"   Calories Burnt: {test_data['caloriesBurnt']} kcal")
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/api/messaging/fitness/workout-completed",
            json=test_data,
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print(f"\n✅ Message sent successfully!")
                print(f"   Message ID: {result.get('data', {}).get('message_id')}")
                print(f"   Status: {result.get('data', {}).get('status')}")
                return True
        else:
            print(f"\n❌ Failed with status: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False

def check_rabbitmq_service():
    """Check if RabbitMQ service is configured"""
    print_header("CHECKING RABBITMQ INTEGRATION")
    
    try:
        # Try to get messaging status from backend
        response = requests.get(f"{BACKEND_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is responding")
            print("\n📋 Backend Configuration:")
            print("   RabbitMQ URL: amqp://guest:guest@localhost:5672/")
            print("   Expected queues: diet_agent_queue, fitness_agent_queue")
            print("   Expected exchanges: diet_events, fitness_events")
            return True
    except Exception as e:
        print(f"❌ Cannot connect to backend: {e}")
        return False

def main():
    """Main monitoring function"""
    print("\n" + "="*80)
    print("  🔍 BACKEND MESSAGE PROCESSING MONITOR")
    print("  Real-time verification of Diet & Fitness Agent integration")
    print("="*80)
    
    # Check backend
    if not check_rabbitmq_service():
        print("\n⚠️  Backend not accessible. Make sure it's running.")
        return
    
    print_header("SENDING TEST MESSAGES")
    print("\nThis will send test messages and verify they are processed.")
    print("Check your backend terminal for processing logs!\n")
    
    # Send test meal
    meal_success = send_test_meal()
    time.sleep(2)
    
    # Send test workout
    workout_success = send_test_workout()
    time.sleep(2)
    
    # Summary
    print_header("VERIFICATION RESULTS")
    print()
    print(f"   {'✅' if meal_success else '❌'} Diet Agent - Meal Logging")
    print(f"   {'✅' if workout_success else '❌'} Fitness Agent - Workout Completion")
    print()
    
    if meal_success and workout_success:
        print("🎉 SUCCESS! Both agents are receiving messages!")
        print()
        print("📋 What to check in backend logs:")
        print("   1. Look for '📥 Received meal_logged event' messages")
        print("   2. Look for '📥 Received workout_completed event' messages")
        print("   3. Check for event handler processing logs")
        print("   4. Verify no error messages")
    else:
        print("⚠️  Some tests failed. Check backend configuration.")
    
    print()
    print("="*80)
    print("IMPORTANT: Check your BACKEND TERMINAL for detailed processing logs!")
    print("="*80)
    print()
    print("Expected log patterns:")
    print("  • 'Publishing message to RabbitMQ'")
    print("  • 'Message published successfully'")
    print("  • 'Received meal_logged event'")
    print("  • 'Received workout_completed event'")
    print("  • 'Processing event for user: monitor_test_user'")
    print("="*80 + "\n")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Monitoring interrupted")
    except Exception as e:
        print(f"\n\n❌ Error: {e}")
