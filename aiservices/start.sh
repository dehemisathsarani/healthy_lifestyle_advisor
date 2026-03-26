#!/bin/bash

# 🚀 Diet Agent Quick Start Script
# This script sets up and runs the complete AI Diet Agent system

set -e  # Exit on error

echo "🥗 AI Diet Agent - Quick Start Setup"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker is running
    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    print_success "Prerequisites check passed ✅"
}

# Setup environment
setup_environment() {
    print_status "Setting up environment..."
    
    # Copy .env file if it doesn't exist
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            print_warning "Created .env from .env.example"
            print_warning "Please edit .env file with your API keys before continuing!"
            print_warning "Required: OPENAI_API_KEY"
            read -p "Press Enter after updating .env file, or Ctrl+C to exit..."
        else
            print_error ".env.example file not found"
            exit 1
        fi
    fi
    
    # Check for required environment variables
    source .env
    if [ -z "$OPENAI_API_KEY" ] || [ "$OPENAI_API_KEY" = "your_openai_api_key_here" ]; then
        print_error "OpenAI API key not set in .env file"
        print_error "Please add your OpenAI API key to the .env file"
        exit 1
    fi
    
    print_success "Environment setup complete ✅"
}

# Build and start services
start_services() {
    print_status "Building and starting services..."
    print_status "This may take a few minutes on first run..."
    
    # Pull base images first
    print_status "Pulling base images..."
    docker compose pull rabbitmq mongo redis || true
    
    # Build and start services
    if docker compose up --build -d; then
        print_success "Services started successfully ✅"
    else
        print_error "Failed to start services"
        exit 1
    fi
}

# Wait for services to be ready
wait_for_services() {
    print_status "Waiting for services to be ready..."
    
    # Wait for MongoDB
    print_status "Waiting for MongoDB..."
    for i in {1..30}; do
        if docker compose exec -T mongo mongosh --eval "db.adminCommand('ping')" &> /dev/null; then
            break
        fi
        if [ $i -eq 30 ]; then
            print_error "MongoDB failed to start"
            exit 1
        fi
        sleep 2
    done
    
    # Wait for RabbitMQ
    print_status "Waiting for RabbitMQ..."
    for i in {1..30}; do
        if curl -s http://localhost:15672/api/overview &> /dev/null; then
            break
        fi
        if [ $i -eq 30 ]; then
            print_error "RabbitMQ failed to start"
            exit 1
        fi
        sleep 2
    done
    
    # Wait for Backend API
    print_status "Waiting for Backend API..."
    for i in {1..60}; do
        if curl -s http://localhost:8000/health &> /dev/null; then
            break
        fi
        if [ $i -eq 60 ]; then
            print_error "Backend API failed to start"
            exit 1
        fi
        sleep 2
    done
    
    # Wait for AI Service
    print_status "Waiting for AI Service..."
    for i in {1..60}; do
        if curl -s http://localhost:8001/health &> /dev/null; then
            break
        fi
        if [ $i -eq 60 ]; then
            print_error "AI Service failed to start"
            exit 1
        fi
        sleep 2
    done
    
    # Wait for Frontend
    print_status "Waiting for Frontend..."
    for i in {1..30}; do
        if curl -s http://localhost:5173 &> /dev/null; then
            break
        fi
        if [ $i -eq 30 ]; then
            print_warning "Frontend may still be starting..."
            break
        fi
        sleep 2
    done
    
    print_success "All services are ready! ✅"
}

# Display service status
show_status() {
    print_status "Service Status:"
    echo "=================="
    
    # Check each service
    services=("frontend:5173" "backend:8000" "ai_service:8001" "rabbitmq:15672" "mongo:27017")
    
    for service in "${services[@]}"; do
        name=$(echo $service | cut -d: -f1)
        port=$(echo $service | cut -d: -f2)
        
        if [ "$name" = "mongo" ]; then
            # Special check for MongoDB
            if docker compose exec -T mongo mongosh --eval "db.adminCommand('ping')" &> /dev/null; then
                print_success "$name: ✅ Running (port $port)"
            else
                print_error "$name: ❌ Not responding"
            fi
        else
            # HTTP check for other services
            if curl -s "http://localhost:$port" &> /dev/null || curl -s "http://localhost:$port/health" &> /dev/null; then
                print_success "$name: ✅ Running (http://localhost:$port)"
            else
                print_error "$name: ❌ Not responding"
            fi
        fi
    done
}

# Show URLs and next steps
show_urls() {
    echo ""
    print_success "🎉 AI Diet Agent is now running!"
    echo "=================================="
    echo ""
    echo "📱 Access your application:"
    echo "   Frontend:          http://localhost:5173"
    echo "   Backend API:       http://localhost:8000"
    echo "   AI Service:        http://localhost:8001"
    echo "   API Documentation: http://localhost:8000/docs"
    echo "   AI API Docs:       http://localhost:8001/docs"
    echo ""
    echo "🔧 Management interfaces:"
    echo "   RabbitMQ:          http://localhost:15672 (guest/guest)"
    echo "   MongoDB:           localhost:27017"
    echo ""
    echo "📖 Next steps:"
    echo "   1. Open http://localhost:5173 in your browser"
    echo "   2. Register a new account"
    echo "   3. Take a photo of your food or describe a meal"
    echo "   4. Get AI-powered nutrition analysis!"
    echo ""
    echo "🔍 Monitoring:"
    echo "   View logs:         docker compose logs -f"
    echo "   Check status:      ./status.sh"
    echo "   Stop services:     ./stop.sh"
    echo ""
}

# Main execution
main() {
    check_prerequisites
    setup_environment
    start_services
    wait_for_services
    show_status
    show_urls
    
    print_success "Setup complete! 🚀"
    print_status "Press Ctrl+C to stop all services when you're done."
    
    # Follow logs
    if [ "${1:-}" = "--logs" ]; then
        print_status "Following logs (Ctrl+C to stop)..."
        docker compose logs -f
    fi
}

# Run main function
main "$@"
