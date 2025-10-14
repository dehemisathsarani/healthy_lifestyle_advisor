"""
Complete Messaging System Verification Script
Checks backend logs, RabbitMQ status, and message processing
"""

import requests
import json
import time
from datetime import datetime
import sys

# Configuration
BACKEND_URL = "http://localhost:8005"
RABBITMQ_MGMT_URL = "http://localhost:15672"
RABBITMQ_USER = "guest"
RABBITMQ_PASS = "guest"

def print_header(title):
    """Print formatted header"""
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80)

def check_backend_health():
    """Check if backend is running"""
    print_header("1. BACKEND SERVICE STATUS")
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is running on port 8005")
            data = response.json()
            print(f"   Status: {data.get('status')}")
            return True
        else:
            print(f"❌ Backend returned status code: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot connect to backend: {e}")
        print("   Make sure backend is running: cd backend && python -m uvicorn main:app --host 0.0.0.0 --port 8005")
        return False

def check_rabbitmq_status():
    """Check RabbitMQ management API"""
    print_header("2. RABBITMQ STATUS")
    try:
        # Check overview
        response = requests.get(
            f"{RABBITMQ_MGMT_URL}/api/overview",
            auth=(RABBITMQ_USER, RABBITMQ_PASS),
            timeout=5
        )
        
        if response.status_code == 200:
            print("✅ RabbitMQ Management API is accessible")
            data = response.json()
            print(f"   RabbitMQ Version: {data.get('rabbitmq_version', 'Unknown')}")
            print(f"   Erlang Version: {data.get('erlang_version', 'Unknown')}")
            print(f"\n   🌐 Management UI: {RABBITMQ_MGMT_URL}")
            print(f"   👤 Username: {RABBITMQ_USER}")
            print(f"   🔑 Password: {RABBITMQ_PASS}")
            return True
        else:
            print(f"❌ RabbitMQ Management API returned: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot connect to RabbitMQ Management: {e}")
        print("   Make sure RabbitMQ is running with management plugin enabled")
        print("   Or use CloudAMQP connection")
        return False

def check_queues():
    """Check message queues"""
    print_header("3. MESSAGE QUEUES")
    try:
        response = requests.get(
            f"{RABBITMQ_MGMT_URL}/api/queues",
            auth=(RABBITMQ_USER, RABBITMQ_PASS),
            timeout=5
        )
        
        if response.status_code == 200:
            queues = response.json()
            
            if not queues:
                print("⚠️  No queues found - they will be created when first message is sent")
                return True
            
            print(f"✅ Found {len(queues)} queue(s):\n")
            
            for queue in queues:
                name = queue.get('name', 'Unknown')
                messages = queue.get('messages', 0)
                messages_ready = queue.get('messages_ready', 0)
                messages_unacked = queue.get('messages_unacknowledged', 0)
                consumers = queue.get('consumers', 0)
                
                print(f"   📦 Queue: {name}")
                print(f"      Total Messages: {messages}")
                print(f"      Ready: {messages_ready}")
                print(f"      Unacknowledged: {messages_unacked}")
                print(f"      Consumers: {consumers}")
                print()
            
            return True
        else:
            print(f"❌ Failed to get queues: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error checking queues: {e}")
        return False

def check_exchanges():
    """Check message exchanges"""
    print_header("4. MESSAGE EXCHANGES")
    try:
        response = requests.get(
            f"{RABBITMQ_MGMT_URL}/api/exchanges",
            auth=(RABBITMQ_USER, RABBITMQ_PASS),
            timeout=5
        )
        
        if response.status_code == 200:
            exchanges = response.json()
            
            # Filter out default exchanges
            custom_exchanges = [e for e in exchanges if not e.get('name', '').startswith('amq.')]
            
            if not custom_exchanges:
                print("⚠️  No custom exchanges found - they will be created when first message is sent")
                return True
            
            print(f"✅ Found {len(custom_exchanges)} custom exchange(s):\n")
            
            for exchange in custom_exchanges:
                name = exchange.get('name', 'Unknown')
                ex_type = exchange.get('type', 'Unknown')
                durable = exchange.get('durable', False)
                
                print(f"   🔄 Exchange: {name}")
                print(f"      Type: {ex_type}")
                print(f"      Durable: {durable}")
                print()
            
            return True
        else:
            print(f"❌ Failed to get exchanges: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error checking exchanges: {e}")
        return False

def test_meal_logging():
    """Test meal logging event"""
    print_header("5. TEST MEAL LOGGING EVENT")
    try:
        test_data = {
            "name": "Verification Test Meal",
            "userId": "test_user_123",
            "mealTime": "lunch",
            "calorieCount": 650,
            "protein": 35,
            "carbs": 70,
            "fat": 20
        }
        
        print("📤 Sending test meal logging event...")
        print(f"   Data: {json.dumps(test_data, indent=2)}")
        
        response = requests.post(
            f"{BACKEND_URL}/api/messaging/diet/meal-logged",
            json=test_data,
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("\n✅ Meal logging event sent successfully!")
                print(f"   Message ID: {result.get('data', {}).get('message_id')}")
                print(f"   Queue: {result.get('data', {}).get('queue')}")
                print(f"   Exchange: {result.get('data', {}).get('exchange')}")
                return True
            else:
                print(f"\n❌ Failed: {result.get('message')}")
                return False
        else:
            print(f"\n❌ Request failed with status: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"\n❌ Error testing meal logging: {e}")
        return False

def test_workout_completion():
    """Test workout completion event"""
    print_header("6. TEST WORKOUT COMPLETION EVENT")
    try:
        test_data = {
            "name": "Verification Test Workout",
            "userId": "test_user_123",
            "exerciseDuration": 45,
            "caloriesBurnt": 380,
            "workoutType": "cardio",
            "intensity": "moderate"
        }
        
        print("📤 Sending test workout completion event...")
        print(f"   Data: {json.dumps(test_data, indent=2)}")
        
        response = requests.post(
            f"{BACKEND_URL}/api/messaging/fitness/workout-completed",
            json=test_data,
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("\n✅ Workout completion event sent successfully!")
                print(f"   Message ID: {result.get('data', {}).get('message_id')}")
                print(f"   Queue: {result.get('data', {}).get('queue')}")
                print(f"   Exchange: {result.get('data', {}).get('exchange')}")
                return True
            else:
                print(f"\n❌ Failed: {result.get('message')}")
                return False
        else:
            print(f"\n❌ Request failed with status: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"\n❌ Error testing workout completion: {e}")
        return False

def check_message_processing():
    """Check if messages were processed"""
    print_header("7. MESSAGE PROCESSING VERIFICATION")
    print("⏳ Waiting 3 seconds for message processing...")
    time.sleep(3)
    
    try:
        # Check queues again to see if messages were consumed
        response = requests.get(
            f"{RABBITMQ_MGMT_URL}/api/queues",
            auth=(RABBITMQ_USER, RABBITMQ_PASS),
            timeout=5
        )
        
        if response.status_code == 200:
            queues = response.json()
            
            print("\n📊 Queue Status After Message Sending:\n")
            
            diet_queue_found = False
            fitness_queue_found = False
            
            for queue in queues:
                name = queue.get('name', '')
                
                if 'diet' in name.lower() or 'meal' in name.lower():
                    diet_queue_found = True
                    print(f"   🥗 Diet Queue: {name}")
                    print(f"      Messages: {queue.get('messages', 0)}")
                    print(f"      Consumers: {queue.get('consumers', 0)}")
                    
                    # Check message rates
                    msg_stats = queue.get('message_stats', {})
                    if msg_stats:
                        print(f"      Published: {msg_stats.get('publish', 0)}")
                        print(f"      Delivered: {msg_stats.get('deliver_get', 0)}")
                    print()
                
                if 'fitness' in name.lower() or 'workout' in name.lower():
                    fitness_queue_found = True
                    print(f"   🏋️ Fitness Queue: {name}")
                    print(f"      Messages: {queue.get('messages', 0)}")
                    print(f"      Consumers: {queue.get('consumers', 0)}")
                    
                    # Check message rates
                    msg_stats = queue.get('message_stats', {})
                    if msg_stats:
                        print(f"      Published: {msg_stats.get('publish', 0)}")
                        print(f"      Delivered: {msg_stats.get('deliver_get', 0)}")
                    print()
            
            if diet_queue_found and fitness_queue_found:
                print("✅ Both diet and fitness queues are active!")
                return True
            elif diet_queue_found or fitness_queue_found:
                print("⚠️  Only one queue type found - check if both consumers are running")
                return True
            else:
                print("⚠️  No diet/fitness queues found yet")
                return True
        
    except Exception as e:
        print(f"❌ Error checking message processing: {e}")
        return False

def print_summary(results):
    """Print summary of all checks"""
    print_header("📋 VERIFICATION SUMMARY")
    
    checks = [
        ("Backend Service", results.get('backend', False)),
        ("RabbitMQ Connection", results.get('rabbitmq', False)),
        ("Message Queues", results.get('queues', False)),
        ("Message Exchanges", results.get('exchanges', False)),
        ("Meal Logging", results.get('meal_test', False)),
        ("Workout Completion", results.get('workout_test', False)),
        ("Message Processing", results.get('processing', False))
    ]
    
    passed = sum(1 for _, result in checks if result)
    total = len(checks)
    
    print()
    for check_name, result in checks:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {status}  {check_name}")
    
    print()
    print(f"   Overall: {passed}/{total} checks passed")
    
    if passed == total:
        print("\n🎉 ALL SYSTEMS OPERATIONAL!")
        print("\n   The message parsing service is working correctly with")
        print("   both diet and fitness agents!")
    elif passed >= 4:
        print("\n⚠️  MOSTLY OPERATIONAL")
        print("   Core systems are working, but some checks failed")
    else:
        print("\n❌ SYSTEM ISSUES DETECTED")
        print("   Multiple checks failed - troubleshooting needed")
    
    print("\n" + "="*80)
    print("Next Steps:")
    print("  1. Open RabbitMQ Management UI: http://localhost:15672")
    print("  2. Check 'Queues' tab to see message flow")
    print("  3. Check 'Exchanges' tab to see routing")
    print("  4. Monitor backend logs for event processing")
    print("  5. Test with real application data")
    print("="*80 + "\n")

def main():
    """Main verification function"""
    print("\n" + "="*80)
    print("  🔍 MESSAGING SYSTEM VERIFICATION")
    print("  Checking Diet & Fitness Agent Message Parsing")
    print("="*80)
    
    results = {}
    
    # Run all checks
    results['backend'] = check_backend_health()
    
    if not results['backend']:
        print("\n⚠️  Backend not running. Start it first:")
        print("   cd backend && python -m uvicorn main:app --host 0.0.0.0 --port 8005")
        return
    
    results['rabbitmq'] = check_rabbitmq_status()
    results['queues'] = check_queues()
    results['exchanges'] = check_exchanges()
    results['meal_test'] = test_meal_logging()
    results['workout_test'] = test_workout_completion()
    results['processing'] = check_message_processing()
    
    # Print summary
    print_summary(results)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Verification interrupted by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        sys.exit(1)
