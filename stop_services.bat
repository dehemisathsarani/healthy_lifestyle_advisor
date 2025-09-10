@echo off
echo Stopping Healthy Lifestyle Advisor services...

echo 1. Stopping all containers
cd aiservices
docker-compose down

echo All services stopped!
