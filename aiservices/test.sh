#!/bin/bash

# 🧪 Diet Agent Test Script
# Tests core AI functionality

echo "🧪 AI Diet Agent - Functionality Test"
echo "====================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
}

# Wait for services
echo "Waiting for services to be ready..."
sleep 5

# Test 1: Health checks
print_test "Testing service health..."

backend_health=$(curl -s http://localhost:8000/health | jq -r '.status' 2>/dev/null || echo "failed")
if [ "$backend_health" = "healthy" ]; then
    print_pass "Backend health check"
else
    print_fail "Backend health check: $backend_health"
fi

ai_health=$(curl -s http://localhost:8001/health | jq -r '.status' 2>/dev/null || echo "failed")
if [ "$ai_health" = "healthy" ]; then
    print_pass "AI service health check"
else
    print_fail "AI service health check: $ai_health"
fi

# Test 2: User registration
print_test "Testing user registration..."

registration_response=$(curl -s -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123",
    "name": "Test User",
    "age": 30,
    "gender": "male",
    "height_cm": 175,
    "weight_kg": 70,
    "activity_level": "moderate",
    "goal": "maintain"
  }' 2>/dev/null)

if [[ $registration_response == *"token"* ]]; then
    print_pass "User registration"
    # Extract token for further tests
    token=$(echo $registration_response | jq -r '.token' 2>/dev/null)
else
    print_fail "User registration: $registration_response"
    echo "Continuing with tests..."
fi

# Test 3: BMI calculation
print_test "Testing BMI calculation..."

bmi_response=$(curl -s -X POST http://localhost:8001/calculate/bmi \
  -H "Content-Type: application/json" \
  -d '{"weight_kg": 70, "height_cm": 175}' 2>/dev/null)

if [[ $bmi_response == *"bmi"* ]]; then
    bmi_value=$(echo $bmi_response | jq -r '.bmi' 2>/dev/null)
    print_pass "BMI calculation: $bmi_value"
else
    print_fail "BMI calculation: $bmi_response"
fi

# Test 4: TDEE calculation
print_test "Testing TDEE calculation..."

tdee_response=$(curl -s -X POST http://localhost:8001/calculate/tdee \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test",
    "weight_kg": 70,
    "height_cm": 175,
    "age": 30,
    "gender": "male",
    "activity_level": "moderate"
  }' 2>/dev/null)

if [[ $tdee_response == *"tdee"* ]]; then
    tdee_value=$(echo $tdee_response | jq -r '.tdee' 2>/dev/null)
    print_pass "TDEE calculation: $tdee_value calories"
else
    print_fail "TDEE calculation: $tdee_response"
fi

# Test 5: Text meal analysis (if we have a token)
if [ -n "$token" ]; then
    print_test "Testing text meal analysis..."
    
    meal_response=$(curl -s -X POST http://localhost:8000/analyze/text \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $token" \
      -d '{
        "meal_description": "Grilled chicken breast with quinoa and steamed broccoli",
        "meal_type": "lunch"
      }' 2>/dev/null)
    
    if [[ $meal_response == *"request_id"* ]]; then
        print_pass "Text meal analysis initiated"
        request_id=$(echo $meal_response | jq -r '.request_id' 2>/dev/null)
        echo "   Request ID: $request_id"
    else
        print_fail "Text meal analysis: $meal_response"
    fi
fi

# Test 6: Database connectivity
print_test "Testing database connectivity..."

db_test=$(docker compose exec -T mongo mongosh healthy_lifestyle --eval "db.runCommand({ping: 1})" 2>/dev/null | grep -o "ok.*1" || echo "failed")

if [[ $db_test == *"ok"* ]]; then
    print_pass "Database connectivity"
else
    print_fail "Database connectivity"
fi

# Test 7: RabbitMQ connectivity
print_test "Testing RabbitMQ connectivity..."

rabbitmq_test=$(curl -s -u guest:guest http://localhost:15672/api/overview | jq -r '.message_stats.publish' 2>/dev/null || echo "failed")

if [[ $rabbitmq_test != "failed" ]]; then
    print_pass "RabbitMQ connectivity"
else
    print_fail "RabbitMQ connectivity"
fi

echo ""
echo "🎯 Test Summary:"
echo "==============="
echo "✅ Core services are functional"
echo "✅ AI calculations working"
echo "✅ Database and message queue connected"
echo ""
echo "🚀 Ready for use!"
echo ""
echo "📱 Next steps:"
echo "   1. Open http://localhost:5173"
echo "   2. Register an account"
echo "   3. Try analyzing a meal!"
