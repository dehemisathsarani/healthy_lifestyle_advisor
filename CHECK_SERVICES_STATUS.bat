@echo off
echo ========================================
echo Checking Service Status
echo ========================================
echo.
echo Scanning for Health Lifestyle Advisor services...
echo.

netstat -ano | findstr ":8000 :3002 :8002 :5174"

echo.
echo ========================================
echo Expected Services:
echo ========================================
echo.
echo Port 8000 - Main Backend (Mental Health, Auth)
echo Port 3002 - Main Frontend (UI)
echo Port 8002 - Fitness Backend (API)
echo Port 5174 - Fitness Frontend (UI)
echo.
echo If any port is missing, run START_ALL_SERVICES.bat
echo.
pause
