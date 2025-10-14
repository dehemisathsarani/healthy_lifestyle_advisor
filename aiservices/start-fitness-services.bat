@echo off
echo ========================================
echo Starting Fitness Agent Services
echo ========================================
echo.

REM Start Fitness Backend
echo [1/2] Starting Fitness Backend on port 8002...
start cmd /k "cd /d %~dp0fitnessbackend && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8002"
timeout /t 3 /nobreak >nul

REM Start Fitness Frontend
echo [2/2] Starting Fitness Frontend on port 5174...
start cmd /k "cd /d %~dp0fitnessagentfrontend && npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo Fitness Services Started!
echo ========================================
echo.
echo Fitness Backend:  http://localhost:8002
echo Fitness Frontend: http://localhost:5174
echo.
echo Press any key to close this window...
pause >nul
