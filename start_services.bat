@echo off
echo Starting Healthy Lifestyle Advisor services...

echo 1. Building and starting main services
cd aiservices
docker-compose up -d rabbitmq mongo redis
timeout /t 10

echo 2. Starting Diet AI services
docker-compose up -d backend ai_service ai_worker frontend
timeout /t 5

echo 3. Starting Mental Health services
docker-compose up -d mental_health_service mental_health_frontend
timeout /t 5

echo Services started! Access the applications at:
echo - Main application: http://localhost:5173
echo - Diet Agent: http://localhost:5173/diet
echo - Mental Health Service: http://localhost:5175

echo To stop all services, run stop_services.bat
