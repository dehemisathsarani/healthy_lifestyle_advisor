#!/bin/bash

echo "========================================"
echo "Starting Fitness Agent Services"
echo "========================================"
echo ""

# Get the directory where this script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Start Fitness Backend
echo "[1/2] Starting Fitness Backend on port 8002..."
cd "$DIR/fitnessbackend"
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8002 &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start Fitness Frontend
echo "[2/2] Starting Fitness Frontend on port 5174..."
cd "$DIR/fitnessagentfrontend"
npm run dev &
FRONTEND_PID=$!

# Wait a bit for frontend to start
sleep 3

echo ""
echo "========================================"
echo "Fitness Services Started!"
echo "========================================"
echo ""
echo "Fitness Backend:  http://localhost:8002 (PID: $BACKEND_PID)"
echo "Fitness Frontend: http://localhost:5174 (PID: $FRONTEND_PID)"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user interrupt
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
