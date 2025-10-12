"""
Real-Time RabbitMQ Message Monitor
Shows messages as they flow between Diet and Fitness agents
"""

import pika
import json
import sys
from datetime import datetime
from threading import Thread
import time

# RabbitMQ Configuration
RABBITMQ_URL = 'amqp://guest:guest@localhost:5672/'

# ANSI color codes
class Colors:
    GREEN = '\033[92m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    YELLOW = '\033[93m'
    MAGENTA = '\033[95m'
    RED = '\033[91m'
    BOLD = '\033[1m'
    END = '\033[0m'

def print_header():
    """Print monitoring header"""
    print(f"\n{Colors.BOLD}{Colors.CYAN}{'='*80}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.CYAN}{'RabbitMQ MESSAGE MONITOR - LIVE DATA FLOW':^80}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.CYAN}{'='*80}{Colors.END}")
    print(f"\n{Colors.YELLOW}Monitoring messages between Diet and Fitness agents...{Colors.END}")
    print(f"{Colors.YELLOW}Press CTRL+C to stop{Colors.END}\n")
    print(f"{Colors.CYAN}{'='*80}{Colors.END}\n")

def format_message(message_data, source):
    """Format message for display"""
    timestamp = datetime.now().strftime('%H:%M:%S')
    
    if source == "diet":
        color = Colors.GREEN
        direction = "Diet Agent → Fitness Agent"
        icon = "🍽️"
    else:
        color = Colors.BLUE
        direction = "Fitness Agent → Diet Agent"
        icon = "💪"
    
    output = []
    output.append(f"\n{color}{Colors.BOLD}{'─'*80}{Colors.END}")
    output.append(f"{color}{Colors.BOLD}[{timestamp}] {icon} {direction}{Colors.END}")
    output.append(f"{color}{Colors.BOLD}{'─'*80}{Colors.END}")
    
    # Parse message
    try:
        msg = json.loads(message_data) if isinstance(message_data, str) else message_data
        
        # Event info
        output.append(f"{Colors.YELLOW}Event:{Colors.END} {Colors.BOLD}{msg.get('event_name', 'N/A')}{Colors.END}")
        output.append(f"{Colors.YELLOW}User ID:{Colors.END} {msg.get('user_id', 'N/A')}")
        output.append(f"{Colors.YELLOW}Timestamp:{Colors.END} {msg.get('timestamp', 'N/A')}")
        
        # Summary card
        if 'summary_card' in msg:
            summary = msg['summary_card']
            output.append(f"\n{Colors.CYAN}📊 Summary Card:{Colors.END}")
            
            # Calories
            if 'total_calories' in summary:
                output.append(f"  {Colors.MAGENTA}Calories Consumed:{Colors.END} {summary['total_calories']} kcal")
            if 'calories_burned' in summary:
                output.append(f"  {Colors.MAGENTA}Calories Burned:{Colors.END} {summary['calories_burned']} kcal")
            
            # Macronutrients (for diet messages)
            if 'macronutrients' in summary:
                macros = summary['macronutrients']
                output.append(f"  {Colors.MAGENTA}Macros:{Colors.END}")
                output.append(f"    - Protein: {macros.get('protein', 0)}g")
                output.append(f"    - Carbs: {macros.get('carbs', 0)}g")
                output.append(f"    - Fat: {macros.get('fat', 0)}g")
                output.append(f"    - Fiber: {macros.get('fiber', 0)}g")
            
            # Workout details (for fitness messages)
            if 'workout_type' in summary:
                output.append(f"  {Colors.MAGENTA}Workout:{Colors.END} {summary['workout_type']}")
                output.append(f"  {Colors.MAGENTA}Duration:{Colors.END} {summary.get('duration_minutes', 0)} minutes")
                output.append(f"  {Colors.MAGENTA}Intensity:{Colors.END} {summary.get('intensity', 'N/A')}")
            
            # BMI and Goal
            if 'bmi' in summary and summary['bmi']:
                output.append(f"  {Colors.MAGENTA}BMI:{Colors.END} {summary['bmi']}")
            if 'goal' in summary:
                output.append(f"  {Colors.MAGENTA}Goal:{Colors.END} {summary['goal']}")
            
            # Sources (foods or exercises)
            if 'sources' in summary and summary['sources']:
                output.append(f"  {Colors.MAGENTA}Sources:{Colors.END}")
                for source in summary['sources']:
                    output.append(f"    - {source}")
            
            if 'exercises' in summary and summary['exercises']:
                output.append(f"  {Colors.MAGENTA}Exercises:{Colors.END}")
                for exercise in summary['exercises']:
                    output.append(f"    - {exercise}")
            
            # Additional metrics
            if 'heart_rate' in summary and summary['heart_rate']:
                output.append(f"  {Colors.MAGENTA}Heart Rate:{Colors.END} {summary['heart_rate']} bpm")
            if 'steps' in summary and summary['steps']:
                output.append(f"  {Colors.MAGENTA}Steps:{Colors.END} {summary['steps']}")
            if 'distance_km' in summary and summary['distance_km']:
                output.append(f"  {Colors.MAGENTA}Distance:{Colors.END} {summary['distance_km']} km")
            
            # Meal specific
            if 'meal_type' in summary:
                output.append(f"  {Colors.MAGENTA}Meal Type:{Colors.END} {summary['meal_type']}")
            if 'health_score' in summary and summary['health_score']:
                output.append(f"  {Colors.MAGENTA}Health Score:{Colors.END} {summary['health_score']}/10")
            if 'balance_score' in summary and summary['balance_score']:
                output.append(f"  {Colors.MAGENTA}Balance Score:{Colors.END} {summary['balance_score']}/10")
        
        output.append(f"{color}{'─'*80}{Colors.END}\n")
        
    except Exception as e:
        output.append(f"{Colors.RED}Error parsing message: {str(e)}{Colors.END}\n")
    
    return '\n'.join(output)

def monitor_diet_to_fitness():
    """Monitor messages from Diet to Fitness"""
    try:
        # Connect to RabbitMQ
        parameters = pika.URLParameters(RABBITMQ_URL)
        connection = pika.BlockingConnection(parameters)
        channel = connection.channel()
        
        # Declare queue (in case it doesn't exist)
        queue_name = 'diet_to_fitness_queue'
        channel.queue_declare(queue=queue_name, durable=True)
        
        def callback(ch, method, properties, body):
            """Handle incoming message"""
            try:
                message_data = body.decode('utf-8')
                print(format_message(message_data, "diet"))
                ch.basic_ack(delivery_tag=method.delivery_tag)
            except Exception as e:
                print(f"{Colors.RED}Error processing message: {str(e)}{Colors.END}")
        
        channel.basic_consume(queue=queue_name, on_message_callback=callback)
        print(f"{Colors.GREEN}✅ Monitoring Diet → Fitness messages...{Colors.END}")
        channel.start_consuming()
        
    except Exception as e:
        print(f"{Colors.RED}Error monitoring Diet→Fitness: {str(e)}{Colors.END}")

def monitor_fitness_to_diet():
    """Monitor messages from Fitness to Diet"""
    try:
        # Connect to RabbitMQ
        parameters = pika.URLParameters(RABBITMQ_URL)
        connection = pika.BlockingConnection(parameters)
        channel = connection.channel()
        
        # Declare queue (in case it doesn't exist)
        queue_name = 'fitness_to_diet_queue'
        channel.queue_declare(queue=queue_name, durable=True)
        
        def callback(ch, method, properties, body):
            """Handle incoming message"""
            try:
                message_data = body.decode('utf-8')
                print(format_message(message_data, "fitness"))
                ch.basic_ack(delivery_tag=method.delivery_tag)
            except Exception as e:
                print(f"{Colors.RED}Error processing message: {str(e)}{Colors.END}")
        
        channel.basic_consume(queue=queue_name, on_message_callback=callback)
        print(f"{Colors.BLUE}✅ Monitoring Fitness → Diet messages...{Colors.END}")
        channel.start_consuming()
        
    except Exception as e:
        print(f"{Colors.RED}Error monitoring Fitness→Diet: {str(e)}{Colors.END}")

def main():
    """Start monitoring both queues"""
    print_header()
    
    # Check RabbitMQ connection first
    try:
        parameters = pika.URLParameters(RABBITMQ_URL)
        connection = pika.BlockingConnection(parameters)
        connection.close()
        print(f"{Colors.GREEN}✅ Connected to RabbitMQ{Colors.END}\n")
    except Exception as e:
        print(f"{Colors.RED}❌ Cannot connect to RabbitMQ: {str(e)}{Colors.END}")
        print(f"{Colors.YELLOW}Make sure RabbitMQ is running on port 5672{Colors.END}")
        sys.exit(1)
    
    # Start monitoring threads
    print(f"{Colors.CYAN}Starting message monitors...{Colors.END}\n")
    
    # Thread 1: Monitor Diet→Fitness
    diet_thread = Thread(target=monitor_diet_to_fitness, daemon=True)
    diet_thread.start()
    
    time.sleep(1)  # Small delay between thread starts
    
    # Thread 2: Monitor Fitness→Diet
    fitness_thread = Thread(target=monitor_fitness_to_diet, daemon=True)
    fitness_thread.start()
    
    print(f"\n{Colors.YELLOW}💡 Now send messages from your agents and watch them appear here!{Colors.END}")
    print(f"{Colors.YELLOW}   Use the API endpoints or the web UI to trigger messages{Colors.END}\n")
    
    try:
        # Keep main thread alive
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print(f"\n\n{Colors.YELLOW}Stopping monitor...{Colors.END}")
        print(f"{Colors.GREEN}Monitor stopped.{Colors.END}\n")

if __name__ == "__main__":
    main()
