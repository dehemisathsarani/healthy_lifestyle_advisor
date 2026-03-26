#!/bin/bash

# 🔍 Diet Agent Status Check Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🥗 AI Diet Agent - Status Check"
echo "==============================="

# Check Docker containers
print_status "Docker Container Status:"
echo "=========================="
docker compose ps

echo ""

# Check service health
print_status "Service Health Checks:"
echo "======================"

# Frontend
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    print_success "Frontend: ✅ Healthy (http://localhost:5173)"
else
    print_error "Frontend: ❌ Not responding"
fi

# Backend API
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    backend_health=$(curl -s http://localhost:8000/health | jq -r '.status' 2>/dev/null || echo "unknown")
    if [ "$backend_health" = "healthy" ]; then
        print_success "Backend API: ✅ Healthy (http://localhost:8000)"
    else
        print_warning "Backend API: ⚠️ Responding but status: $backend_health"
    fi
else
    print_error "Backend API: ❌ Not responding"
fi

# AI Service
if curl -s http://localhost:8001/health > /dev/null 2>&1; then
    ai_health=$(curl -s http://localhost:8001/health | jq -r '.status' 2>/dev/null || echo "unknown")
    if [ "$ai_health" = "healthy" ]; then
        print_success "AI Service: ✅ Healthy (http://localhost:8001)"
    else
        print_warning "AI Service: ⚠️ Responding but status: $ai_health"
    fi
else
    print_error "AI Service: ❌ Not responding"
fi

# RabbitMQ
if curl -s http://localhost:15672/api/overview > /dev/null 2>&1; then
    print_success "RabbitMQ: ✅ Healthy (http://localhost:15672)"
    
    # Check queue status
    print_status "RabbitMQ Queue Status:"
    if command -v jq &> /dev/null; then
        queues=$(curl -s -u guest:guest http://localhost:15672/api/queues | jq -r '.[] | "\(.name): \(.messages) messages"' 2>/dev/null || echo "Could not parse queue data")
        echo "$queues"
    else
        echo "Install 'jq' for detailed queue information"
    fi
else
    print_error "RabbitMQ: ❌ Not responding"
fi

# MongoDB
if docker compose exec -T mongo mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    print_success "MongoDB: ✅ Healthy (localhost:27017)"
    
    # Check database stats
    print_status "MongoDB Database Status:"
    db_stats=$(docker compose exec -T mongo mongosh healthy_lifestyle --eval "
        print('Collections: ' + db.getCollectionNames().length);
        print('Users: ' + db.users.countDocuments({}));
        print('Meal Entries: ' + db.meal_entries.countDocuments({}));
        print('Analysis Results: ' + db.analysis_results.countDocuments({}));
    " 2>/dev/null | tail -n +3 || echo "Could not get database stats")
    echo "$db_stats"
else
    print_error "MongoDB: ❌ Not responding"
fi

# Redis
if docker compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    print_success "Redis: ✅ Healthy (localhost:6379)"
else
    print_error "Redis: ❌ Not responding"
fi

echo ""

# Resource usage
print_status "Resource Usage:"
echo "==============="
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

echo ""

# Recent logs (last 10 lines from each service)
print_status "Recent Activity (last 10 log lines):"
echo "====================================="

services=("frontend" "backend" "ai_service" "ai_worker" "rabbitmq" "mongo")
for service in "${services[@]}"; do
    echo ""
    print_status "$service logs:"
    docker compose logs --tail=3 "$service" 2>/dev/null | tail -n 3 || echo "No logs available"
done

echo ""

# Quick test
print_status "Quick Functionality Test:"
echo "=========================="

# Test backend health endpoint
backend_response=$(curl -s http://localhost:8000/health 2>/dev/null || echo "failed")
if [[ $backend_response == *"healthy"* ]]; then
    print_success "Backend health check: ✅ Passed"
else
    print_error "Backend health check: ❌ Failed"
fi

# Test AI service health endpoint  
ai_response=$(curl -s http://localhost:8001/health 2>/dev/null || echo "failed")
if [[ $ai_response == *"healthy"* ]]; then
    print_success "AI service health check: ✅ Passed"
else
    print_error "AI service health check: ❌ Failed"
fi

echo ""
print_status "Status check complete!"
echo ""
echo "💡 Commands:"
echo "   Restart all:       docker compose restart"
echo "   View live logs:    docker compose logs -f"
echo "   Stop all:          docker compose down"
echo "   Full restart:      docker compose down && docker compose up -d"
