@echo off
echo ========================================
echo Starting ALL Healthy Lifestyle Advisor Services
echo ========================================
echo.

REM Start Main Backend
echo [1/5] Starting Main Backend on port 8000...
start cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
timeout /t 3 /nobreak >nul

REM Start Diet AI Service
echo [2/5] Starting Diet AI Service on port 8001...
start cmd /k "cd /d %~dp0aiservices\dietaiservices && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8001"
timeout /t 3 /nobreak >nul

REM Start Fitness Backend
echo [3/5] Starting Fitness Backend on port 8002...
start cmd /k "cd /d %~dp0aiservices\fitnessbackend && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8002"
timeout /t 3 /nobreak >nul

REM Start Fitness Frontend
echo [4/5] Starting Fitness Frontend on port 5174...
start cmd /k "cd /d %~dp0aiservices\fitnessagentfrontend && npm run dev"
timeout /t 3 /nobreak >nul

REM Start Main Frontend
echo [5/5] Starting Main Frontend on port 3000...
start cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo ALL Services Started Successfully!
echo ========================================
echo.
echo Main Backend:     http://localhost:8000
echo Diet AI Service:  http://localhost:8001
echo Fitness Backend:  http://localhost:8002
echo Fitness Frontend: http://localhost:5174
echo Main Frontend:    http://localhost:3000
echo.
echo Press any key to close this window...
pause >nul
