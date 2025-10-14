"""
Live Message Parsing Demonstration
This script shows how messages are parsed between Diet and Fitness agents
"""

import requests
import json
from datetime import datetime
import time

print("="*70)
print("🔄 DIET ↔️ FITNESS MESSAGE PARSING DEMONSTRATION")
print("="*70)
print()

# Configuration
DIET_API = "http://localhost:8000"
MESSAGING_API = "http://localhost:8005"

print("📡 Checking Services...")
print("-"*70)

# Check services
services_ok = True
try:
    response = requests.get(f"{MESSAGING_API}/health", timeout=5)
    if response.status_code == 200:
        print("✅ Messaging Service (8005): RUNNING")
    else:
        print("❌ Messaging Service (8005): ERROR")
        services_ok = False
except Exception as e:
    print(f"❌ Messaging Service (8005): NOT RUNNING - {e}")
    services_ok = False

try:
    response = requests.get(f"{DIET_API}/health", timeout=5)
    if response.status_code == 200:
        print("✅ Diet Agent (8000): RUNNING")
    else:
        print("❌ Diet Agent (8000): ERROR")
        services_ok = False
except Exception as e:
    print(f"❌ Diet Agent (8000): NOT RUNNING - {e}")
    services_ok = False

if not services_ok:
    print("\n❌ Some services are not running. Please start all services first.")
    exit(1)

print()
print("="*70)
print("📤 PART 1: DIET → FITNESS MESSAGE (Meal Logged)")
print("="*70)
print()

# Prepare meal data with user profile
meal_data = {
    "id": f"meal-{int(time.time())}",
    "name": "Chicken Rice Bowl",
    "time": datetime.now().strftime("%H:%M"),
    "date": datetime.now().strftime("%Y-%m-%d"),
    "userId": "user-demo-123",
    "mealTime": "lunch",
    "calorieCount": 550,
    "protein": 35,
    "carbs": 65,
    "fat": 15,
    "userProfile": {
        "user_id": "user-demo-123",
        "age": 28,
        "gender": "male",
        "height_cm": 175,
        "weight_kg": 72,
        "activity_level": "moderately_active",
        "goal": "maintain_weight",
        "dietary_restrictions": [],
        "allergies": []
    }
}

print("📋 Meal Data Being Sent:")
print(json.dumps(meal_data, indent=2))
print()

print("🚀 Sending meal to Fitness Agent...")
try:
    response = requests.post(
        f"{MESSAGING_API}/api/diet-fitness/meal-logged",
        json=meal_data,
        timeout=10
    )
    
    if response.status_code == 200:
        result = response.json()
        print("✅ Message Sent Successfully!")
        print()
        print("📨 Message Details:")
        print(f"   Message ID: {result.get('message_id')}")
        print(f"   Queue: {result.get('queue')}")
        print(f"   Status: {result.get('status')}")
        print()
        print("🔍 What Fitness Agent Receives:")
        print(f"   🍽️  Meal: {meal_data['name']}")
        print(f"   📊 Calories: {meal_data['calorieCount']} kcal")
        print(f"   💪 Protein: {meal_data['protein']}g")
        print(f"   👤 User Age: {meal_data['userProfile']['age']}")
        print(f"   ⚖️  User Weight: {meal_data['userProfile']['weight_kg']}kg")
        print(f"   🎯 User Goal: {meal_data['userProfile']['goal']}")
        print()
        print("✨ Fitness Agent will calculate:")
        print(f"   🏋️ Recommended workout to burn: {meal_data['calorieCount']} calories")
        print(f"   ⏱️  Estimated duration: ~{meal_data['calorieCount'] // 13} minutes")
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.text)
except Exception as e:
    print(f"❌ Error sending message: {e}")

print()
print("="*70)
print("📥 PART 2: FITNESS → DIET MESSAGE (Workout Completed)")
print("="*70)
print()

# Prepare workout completion data
workout_data = {
    "id": f"workout-{int(time.time())}",
    "name": "Cardio Session",
    "date": datetime.now().strftime("%Y-%m-%d"),
    "userId": "user-demo-123",
    "exerciseDuration": 45,
    "caloriesBurnt": 550,
    "workoutType": "cardio",
    "intensity": "moderate"
}

print("📋 Workout Data Being Sent:")
print(json.dumps(workout_data, indent=2))
print()

print("🚀 Sending workout completion to Diet Agent...")
try:
    response = requests.post(
        f"{MESSAGING_API}/api/diet-fitness/workout-completed",
        json=workout_data,
        timeout=10
    )
    
    if response.status_code == 200:
        result = response.json()
        print("✅ Message Sent Successfully!")
        print()
        print("📨 Message Details:")
        print(f"   Message ID: {result.get('message_id')}")
        print(f"   Queue: {result.get('queue')}")
        print(f"   Status: {result.get('status')}")
        print()
        print("🔍 What Diet Agent Receives:")
        print(f"   🏋️ Workout: {workout_data['name']}")
        print(f"   🔥 Calories Burnt: {workout_data['caloriesBurnt']} kcal")
        print(f"   ⏱️  Duration: {workout_data['exerciseDuration']} minutes")
        print(f"   💪 Intensity: {workout_data['intensity']}")
        print()
        print("✨ Diet Agent will calculate:")
        recovery_calories = int(workout_data['caloriesBurnt'] * 0.8)
        protein_boost = 5
        print(f"   🍽️  Recovery calories needed: {recovery_calories} kcal")
        print(f"   💪 Protein boost recommendation: +{protein_boost}g")
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.text)
except Exception as e:
    print(f"❌ Error sending message: {e}")

print()
print("="*70)
print("🔄 MESSAGE PARSING FLOW")
print("="*70)
print()

flow = """
┌─────────────────────────────────────────────────────────────────┐
│                     MESSAGE FLOW DIAGRAM                        │
└─────────────────────────────────────────────────────────────────┘

DIET AGENT → FITNESS AGENT (Meal Logged):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. User logs meal in Diet Agent
2. Frontend calls: POST /api/diet-fitness/meal-logged
3. Backend parses meal data:
   ✓ Calories: 550 kcal
   ✓ Protein: 35g
   ✓ User profile (age, weight, goal)
4. Message sent to RabbitMQ queue: diet_to_fitness_queue
5. Fitness Agent receives parsed message:
   {
     "meal": "Chicken Rice Bowl",
     "calories": 550,
     "userProfile": {
       "age": 28,
       "weight_kg": 72,
       "goal": "maintain_weight"
     }
   }
6. Fitness Agent calculates workout recommendation


FITNESS AGENT → DIET AGENT (Workout Completed):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. User completes workout in Fitness Agent
2. Frontend calls: POST /api/diet-fitness/workout-completed
3. Backend parses workout data:
   ✓ Calories burnt: 550 kcal
   ✓ Duration: 45 minutes
   ✓ Intensity: moderate
4. Message sent to RabbitMQ queue: fitness_to_diet_queue
5. Diet Agent receives parsed message:
   {
     "workout": "Cardio Session",
     "caloriesBurnt": 550,
     "duration": 45,
     "intensity": "moderate"
   }
6. Diet Agent calculates recovery nutrition needs
"""

print(flow)

print()
print("="*70)
print("🎯 HOW TO SEE MESSAGE PARSING IN FRONTEND")
print("="*70)
print()

instructions = """
STEP-BY-STEP VISUAL TEST:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Open Browser:
   http://localhost:3000 (or http://localhost:3004)

2. Press F12 to open Developer Console

3. Go to Console Tab

4. Navigate to Diet Agent → Food Analysis

5. Type a meal: "Chicken rice bowl"

6. Click "Analyze Food"

7. WATCH CONSOLE for message parsing:
   ✓ "MESSAGE SENT TO FITNESS AGENT"
   ✓ Meal data with calories
   ✓ User profile being sent
   ✓ Backend response

8. WATCH FOR GREEN NOTIFICATION (top right):
   ✓ "Message Sent to Fitness Agent!"
   ✓ Shows meal calories
   ✓ Shows workout target
   ✓ Shows your profile

9. Scroll down to see ORANGE WORKOUT CARD:
   ✓ "Burn 550 Calories" (big display)
   ✓ Duration calculation
   ✓ Your weight and goal

10. Click "Checkout Workout Sessions" button

11. WATCH CONSOLE for parsed data being sent:
    ✓ "OPENING FITNESS PLANNER"
    ✓ Complete user profile
    ✓ Calorie target
    ✓ Duration

12. WATCH FOR BLUE NOTIFICATION:
    ✓ "Opening Fitness Planner"
    ✓ Target calories
    ✓ Profile details

13. Fitness Planner opens with PARSED DATA:
    ✓ Receives calories: 550
    ✓ Receives profile (age, weight, goal)
    ✓ Shows personalized workout

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BACKEND LOGS (if you want to see server-side parsing):

Open a new PowerShell terminal and run:

cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8005 --reload

Then when you send messages, you'll see:
✓ Incoming message data
✓ Parsing meal/workout information
✓ Sending to RabbitMQ queue
✓ Message acknowledgments
"""

print(instructions)

print()
print("="*70)
print("✅ VERIFICATION SUMMARY")
print("="*70)
print()

summary = """
MESSAGE PARSING IS WORKING IF YOU SEE:

✅ Backend Test (this script):
   • Messaging Service: RUNNING
   • Diet Agent: RUNNING
   • Messages sent successfully
   • Response received with message IDs

✅ Frontend Console (F12):
   • "MESSAGE SENT TO FITNESS AGENT" with separators
   • Meal data displayed with calories
   • User profile shown (age, weight, goal)
   • Backend response received
   • "OPENING FITNESS PLANNER" on button click
   • Complete profile data visible

✅ Notifications:
   • Green notification: "Message Sent to Fitness Agent!"
   • Blue notification: "Opening Fitness Planner"
   • Shows meal calories and workout target
   • Shows user profile details

✅ Workout Card:
   • Orange card appears after analysis
   • "Burn X Calories" in big text
   • Duration calculated
   • User weight and goal displayed

✅ Data Flow:
   • Meal logged → Message sent → Fitness receives
   • Workout completed → Message sent → Diet receives
   • Same user profile used in both agents
   • Calculations based on parsed data

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IF MESSAGE PARSING NOT VISIBLE:
1. Check services running: netstat -ano | findstr "8000 8005 5672"
2. Open browser console (F12)
3. Make sure on Food Analysis tab (not Nutrition Logs)
4. Check for red errors in console
5. Restart messaging service if needed
"""

print(summary)

print()
print("="*70)
print("🎉 DEMONSTRATION COMPLETE!")
print("="*70)
print()
print("📖 Documentation: CLEAR_DISPLAY_GUIDE.md")
print("📖 Testing Guide: TESTING_GUIDE.md")
print("🧪 Quick Check: QUICK_CHECK.md")
print()
print("=" * 70)
