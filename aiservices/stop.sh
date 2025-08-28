#!/bin/bash

# 🛑 Diet Agent Stop Script

echo "🛑 Stopping AI Diet Agent services..."

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

# Stop services
print_status "Stopping all services..."
docker compose down

# Optional: Remove volumes (uncomment if you want to clear all data)
if [ "$1" = "--clean" ]; then
    print_warning "Removing volumes and cleaning up data..."
    docker compose down -v
    docker system prune -f
    print_success "Cleanup complete!"
else
    print_status "Data volumes preserved. Use '--clean' flag to remove all data."
fi

print_success "All services stopped! ✅"
echo ""
echo "💡 To restart:"
echo "   ./start.sh"
echo ""
echo "💡 To check status:"
echo "   ./status.sh"
