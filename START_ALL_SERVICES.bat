@echo off
echo ========================================
echo Starting ALL Health Lifestyle Advisor Services
echo ========================================
echo.

REM Start Main Backend (Mental Health, Auth, etc.)
echo [1/4] Starting Main Backend on port 8000...
start "Main Backend" cmd /k "cd /d %~dp0backend && python main.py"
timeout /t 3 /nobreak >nul

REM Start Main Frontend
echo [2/4] Starting Main Frontend on port 3002...
start "Main Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 3 /nobreak >nul

REM Start Fitness Backend
echo [3/4] Starting Fitness Backend on port 8002...
start "Fitness Backend" cmd /k "cd /d %~dp0aiservices\fitnessbackend && python main.py"
timeout /t 3 /nobreak >nul

REM Start Fitness Frontend
echo [4/4] Starting Fitness Frontend on port 5174...
start "Fitness Frontend" cmd /k "cd /d %~dp0aiservices\fitnessagentfrontend && npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo ALL SERVICES STARTED!
echo ========================================
echo.
echo Main Backend:      http://localhost:8000
echo Main Frontend:     http://localhost:3002
echo Fitness Backend:   http://localhost:8002
echo Fitness Frontend:  http://localhost:5174
echo.
echo All services are running in separate windows.
echo Close those windows to stop the services.
echo.
echo Press any key to close this launcher...
pause >nul
