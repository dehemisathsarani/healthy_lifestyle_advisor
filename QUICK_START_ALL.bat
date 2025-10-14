@echo off
title Healthy Lifestyle Advisor - Complete System Startup
color 0A
echo ========================================
echo   🏥 HEALTHY LIFESTYLE ADVISOR
echo   Complete System Startup
echo ========================================
echo.
echo This script will start ALL required services:
echo.
echo 1. Main Backend (Port 8000)
echo 2. Main Frontend (Port 3000 or 5173)
echo 3. Fitness Backend (Port 8002)
echo 4. Fitness Frontend (Port 5174)
echo.
echo ========================================
echo.
echo ⏳ Starting in 3 seconds...
echo    Press Ctrl+C to cancel
timeout /t 3 >nul
echo.

REM Check if directories exist
echo 🔍 Verifying directories...
if not exist "backend" (
    echo ❌ ERROR: backend directory not found!
    pause
    exit /b 1
)
if not exist "frontend" (
    echo ❌ ERROR: frontend directory not found!
    pause
    exit /b 1
)
if not exist "aiservices\fitnessbackend" (
    echo ❌ ERROR: aiservices\fitnessbackend not found!
    pause
    exit /b 1
)
if not exist "aiservices\fitnessagentfrontend" (
    echo ❌ ERROR: aiservices\fitnessagentfrontend not found!
    pause
    exit /b 1
)
echo ✅ All directories verified
echo.

echo ========================================
echo   🚀 Starting Services...
echo ========================================
echo.

REM 1. Start Main Backend (Port 8000)
echo [1/4] 🔧 Starting Main Backend (Port 8000)...
start "Main Backend (8000)" cmd /k "cd /d %~dp0backend && echo 🔧 Main Backend Starting... && python main.py"
timeout /t 3 /nobreak >nul

REM 2. Start Main Frontend (Port 3000 or 5173)
echo [2/4] 🌐 Starting Main Frontend (Port 3000/5173)...
start "Main Frontend" cmd /k "cd /d %~dp0frontend && echo 🌐 Main Frontend Starting... && npm run dev"
timeout /t 3 /nobreak >nul

REM 3. Start Fitness Backend (Port 8002)
echo [3/4] 💪 Starting Fitness Backend (Port 8002)...
start "Fitness Backend (8002)" cmd /k "cd /d %~dp0aiservices\fitnessbackend && echo 💪 Fitness Backend Starting... && python main.py"
timeout /t 3 /nobreak >nul

REM 4. Start Fitness Frontend (Port 5174)
echo [4/4] 🏋️ Starting Fitness Frontend (Port 5174)...
start "Fitness Frontend (5174)" cmd /k "cd /d %~dp0aiservices\fitnessagentfrontend && echo 🏋️ Fitness Frontend Starting... && npm run dev"

echo.
echo ========================================
echo   ✅ All Services Starting!
echo ========================================
echo.
echo 📍 Four new terminal windows have opened:
echo    1. Main Backend (Port 8000)
echo    2. Main Frontend (Port 3000 or 5173)
echo    3. Fitness Backend (Port 8002)
echo    4. Fitness Frontend (Port 5174)
echo.
echo ⏳ Please wait 15-20 seconds for all services to fully start
echo.
echo ========================================
echo   🌐 Access URLs
echo ========================================
echo.
echo 🎯 MAIN APPLICATION:
echo    http://localhost:3000  (or http://localhost:5173)
echo.
echo 🔧 BACKENDS:
echo    http://localhost:8000  - Main API
echo    http://localhost:8002  - Fitness API
echo.
echo 🎨 FRONTENDS:
echo    http://localhost:3000 or 5173  - Main UI
echo    http://localhost:5174  - Fitness Hub UI
echo.
echo ========================================
echo   🎯 How to Use
echo ========================================
echo.
echo 1. Wait for all services to start (15-20 seconds)
echo 2. Open browser to: http://localhost:3000 (or 5173)
echo 3. Navigate to Services page
echo 4. Click "Launch Fitness Hub" button
echo 5. Enjoy! 🎉
echo.
echo ========================================
echo.
echo Press any key to close this window...
echo (Services will keep running)
pause >nul
