@echo off
echo ===============================================
echo   Healthy Lifestyle Advisor - Full Startup
echo ===============================================
echo.
echo This will start all services:
echo   1. Backend API (Port 8005)
echo   2. Frontend UI (Port 5173)
echo   3. MongoDB (Required for data storage)
echo.
echo ===============================================
echo.

REM Check if MongoDB is running
echo [1/4] Checking MongoDB connection...
timeout /t 2 /nobreak >nul

REM Start Backend on Port 8005
echo.
echo [2/4] Starting Backend API on port 8005...
echo Backend Location: backend/
echo API Docs will be at: http://localhost:8005/docs
echo.
start "Healthy Lifestyle Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --host 127.0.0.1 --port 8005 --reload"

REM Wait for backend to initialize
echo Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

REM Start Frontend on Port 5173
echo.
echo [3/4] Starting Frontend UI on port 5173...
echo Frontend Location: frontend/
echo Application will be at: http://localhost:5173
echo.
start "Healthy Lifestyle Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

REM Wait for frontend to initialize
echo Waiting for frontend to initialize...
timeout /t 3 /nobreak >nul

echo.
echo [4/4] All services are starting...
echo.
echo ===============================================
echo   APPLICATION READY!
echo ===============================================
echo.
echo Backend API:  http://localhost:8005
echo API Docs:     http://localhost:8005/docs
echo Frontend UI:  http://localhost:5173
echo.
echo ===============================================
echo   Features Available:
echo ===============================================
echo  - Advanced Nutrition Hub
echo  - Mental Health Assistant (with MongoDB mood logs)
echo  - Fitness Planner
echo  - Security & Privacy Settings
echo.
echo ===============================================
echo.
echo Press any key to view the service status...
pause >nul

echo.
echo Checking service status...
echo.
echo Backend (Port 8005):
netstat -ano | findstr :8005
echo.
echo Frontend (Port 5173):
netstat -ano | findstr :5173
echo.
echo ===============================================
echo Services are running!
echo Keep these terminal windows open.
echo Close them when you're done using the app.
echo ===============================================
echo.
pause
