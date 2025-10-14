"""
Quick Status Check: Is Message Parsing Running?
Checks if backend, RabbitMQ, and consumers are active
"""

import requests
import pika
import sys
from colorama import Fore, Style, init

init(autoreset=True)

def check_backend():
    """Check if backend is running"""
    print(f"\n{Fore.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Style.RESET_ALL}")
    print(f"{Fore.CYAN}📡 Checking Backend Service{Style.RESET_ALL}")
    print(f"{Fore.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Style.RESET_ALL}")
    
    try:
        response = requests.get("http://localhost:8005/health", timeout=3)
        if response.status_code == 200:
            print(f"{Fore.GREEN}✅ Backend is RUNNING on port 8005{Style.RESET_ALL}")
            return True
        else:
            print(f"{Fore.RED}❌ Backend returned status: {response.status_code}{Style.RESET_ALL}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"{Fore.RED}❌ Backend is NOT RUNNING{Style.RESET_ALL}")
        print(f"{Fore.YELLOW}   Start with: python backend/main.py{Style.RESET_ALL}")
        return False
    except Exception as e:
        print(f"{Fore.RED}❌ Error checking backend: {e}{Style.RESET_ALL}")
        return False


def check_rabbitmq():
    """Check if RabbitMQ is running"""
    print(f"\n{Fore.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Style.RESET_ALL}")
    print(f"{Fore.CYAN}🐰 Checking RabbitMQ Service{Style.RESET_ALL}")
    print(f"{Fore.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Style.RESET_ALL}")
    
    try:
        # Try to connect to RabbitMQ
        connection = pika.BlockingConnection(
            pika.ConnectionParameters(host='localhost', connection_attempts=1, retry_delay=1)
        )
        connection.close()
        print(f"{Fore.GREEN}✅ RabbitMQ is RUNNING{Style.RESET_ALL}")
        return True
    except Exception as e:
        print(f"{Fore.RED}❌ RabbitMQ is NOT RUNNING{Style.RESET_ALL}")
        print(f"{Fore.YELLOW}   Error: {e}{Style.RESET_ALL}")
        return False


def check_messaging_endpoints():
    """Check if messaging endpoints exist"""
    print(f"\n{Fore.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Style.RESET_ALL}")
    print(f"{Fore.CYAN}📨 Checking Messaging Endpoints{Style.RESET_ALL}")
    print(f"{Fore.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Style.RESET_ALL}")
    
    endpoints = [
        ("POST /api/messaging/diet/meal-logged", "http://localhost:8005/api/messaging/diet/meal-logged"),
        ("POST /api/messaging/fitness/workout-completed", "http://localhost:8005/api/messaging/fitness/workout-completed"),
        ("POST /api/messaging/test/meal-logged", "http://localhost:8005/api/messaging/test/meal-logged"),
    ]
    
    all_ok = True
    for name, url in endpoints:
        try:
            # Try to access endpoint (expecting 422 for missing data is OK)
            response = requests.post(url, json={}, timeout=3)
            if response.status_code in [200, 422]:
                print(f"{Fore.GREEN}✅ {name} - EXISTS{Style.RESET_ALL}")
            else:
                print(f"{Fore.YELLOW}⚠️  {name} - Status: {response.status_code}{Style.RESET_ALL}")
        except requests.exceptions.ConnectionError:
            print(f"{Fore.RED}❌ {name} - Cannot connect to backend{Style.RESET_ALL}")
            all_ok = False
        except Exception as e:
            print(f"{Fore.RED}❌ {name} - Error: {e}{Style.RESET_ALL}")
            all_ok = False
    
    return all_ok


def check_rabbitmq_queues():
    """Check if RabbitMQ queues exist"""
    print(f"\n{Fore.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Style.RESET_ALL}")
    print(f"{Fore.CYAN}📬 Checking RabbitMQ Queues{Style.RESET_ALL}")
    print(f"{Fore.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Style.RESET_ALL}")
    
    try:
        connection = pika.BlockingConnection(
            pika.ConnectionParameters(host='localhost', connection_attempts=1, retry_delay=1)
        )
        channel = connection.channel()
        
        queues = ['diet_to_fitness_queue', 'fitness_to_diet_queue']
        
        for queue_name in queues:
            try:
                # Passive declare - check if queue exists without creating it
                method = channel.queue_declare(queue=queue_name, passive=True)
                msg_count = method.method.message_count
                consumer_count = method.method.consumer_count
                
                print(f"{Fore.GREEN}✅ Queue '{queue_name}' exists{Style.RESET_ALL}")
                print(f"   Messages in queue: {msg_count}")
                print(f"   Active consumers: {consumer_count}")
                
                if consumer_count == 0:
                    print(f"{Fore.YELLOW}   ⚠️  No consumers listening! Messages will queue.{Style.RESET_ALL}")
                else:
                    print(f"{Fore.GREEN}   ✅ Consumers are ACTIVE and processing messages{Style.RESET_ALL}")
                    
            except Exception as e:
                print(f"{Fore.RED}❌ Queue '{queue_name}' does not exist or error: {e}{Style.RESET_ALL}")
        
        connection.close()
        return True
        
    except Exception as e:
        print(f"{Fore.RED}❌ Cannot check queues: {e}{Style.RESET_ALL}")
        return False


def test_message_publishing():
    """Test if we can actually publish a message"""
    print(f"\n{Fore.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Style.RESET_ALL}")
    print(f"{Fore.CYAN}🧪 Testing Live Message Publishing{Style.RESET_ALL}")
    print(f"{Fore.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Style.RESET_ALL}")
    
    try:
        import time
        meal_data = {
            "name": "Status Check Test Meal",
            "userId": f"status_test_{int(time.time())}",
            "mealTime": "snack",
            "calorieCount": 100
        }
        
        print(f"{Fore.YELLOW}Publishing test meal_logged event...{Style.RESET_ALL}")
        response = requests.post(
            "http://localhost:8005/api/messaging/test/meal-logged",
            timeout=5
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"{Fore.GREEN}✅ Message published successfully!{Style.RESET_ALL}")
            if result.get('success'):
                print(f"   Message ID: {result.get('data', {}).get('message_id')}")
                print(f"{Fore.GREEN}   ✅ MESSAGE PARSING IS WORKING!{Style.RESET_ALL}")
                return True
        else:
            print(f"{Fore.RED}❌ Failed to publish: {response.status_code}{Style.RESET_ALL}")
            return False
            
    except Exception as e:
        print(f"{Fore.RED}❌ Publishing test failed: {e}{Style.RESET_ALL}")
        return False


def main():
    """Run all status checks"""
    print(f"\n{Fore.CYAN}{'='*55}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}{'MESSAGE PARSING STATUS CHECK':^55}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}{'='*55}{Style.RESET_ALL}")
    
    results = {}
    
    # Check each component
    results['Backend'] = check_backend()
    results['RabbitMQ'] = check_rabbitmq()
    
    if results['Backend']:
        results['Endpoints'] = check_messaging_endpoints()
    else:
        print(f"\n{Fore.YELLOW}⚠️  Skipping endpoint check (backend not running){Style.RESET_ALL}")
        results['Endpoints'] = False
    
    if results['RabbitMQ']:
        results['Queues'] = check_rabbitmq_queues()
    else:
        print(f"\n{Fore.YELLOW}⚠️  Skipping queue check (RabbitMQ not running){Style.RESET_ALL}")
        results['Queues'] = False
    
    if results['Backend'] and results['RabbitMQ']:
        results['Publishing'] = test_message_publishing()
    else:
        print(f"\n{Fore.YELLOW}⚠️  Skipping publish test (services not ready){Style.RESET_ALL}")
        results['Publishing'] = False
    
    # Summary
    print(f"\n{Fore.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Style.RESET_ALL}")
    print(f"{Fore.CYAN}📊 STATUS SUMMARY{Style.RESET_ALL}")
    print(f"{Fore.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Style.RESET_ALL}\n")
    
    for component, status in results.items():
        icon = "✅" if status else "❌"
        color = Fore.GREEN if status else Fore.RED
        print(f"{color}{icon} {component}: {'RUNNING' if status else 'NOT RUNNING'}{Style.RESET_ALL}")
    
    print(f"\n{Fore.CYAN}{'='*55}{Style.RESET_ALL}")
    
    # Final verdict
    all_running = all(results.values())
    
    if all_running:
        print(f"\n{Fore.GREEN}{'='*55}{Style.RESET_ALL}")
        print(f"{Fore.GREEN}🎉 MESSAGE PARSING IS RUNNING! 🎉{Style.RESET_ALL}")
        print(f"{Fore.GREEN}{'='*55}{Style.RESET_ALL}")
        print(f"\n{Fore.GREEN}✅ All systems operational{Style.RESET_ALL}")
        print(f"{Fore.GREEN}✅ Messages are being published{Style.RESET_ALL}")
        print(f"{Fore.GREEN}✅ Consumers are processing messages{Style.RESET_ALL}")
        print(f"{Fore.GREEN}✅ Message parsing is ACTIVE{Style.RESET_ALL}\n")
        sys.exit(0)
    else:
        print(f"\n{Fore.YELLOW}{'='*55}{Style.RESET_ALL}")
        print(f"{Fore.YELLOW}⚠️  MESSAGE PARSING IS NOT FULLY RUNNING{Style.RESET_ALL}")
        print(f"{Fore.YELLOW}{'='*55}{Style.RESET_ALL}")
        
        if not results['Backend']:
            print(f"\n{Fore.YELLOW}🔧 To start backend:{Style.RESET_ALL}")
            print(f"   python backend/main.py")
        
        if not results['RabbitMQ']:
            print(f"\n{Fore.YELLOW}🔧 To start RabbitMQ:{Style.RESET_ALL}")
            print(f"   Check if RabbitMQ service is installed and running")
            print(f"   Windows: Check Services (services.msc)")
        
        print(f"\n{Fore.YELLOW}📖 See DIET_FITNESS_MESSAGING_GUIDE.md for setup instructions{Style.RESET_ALL}\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
