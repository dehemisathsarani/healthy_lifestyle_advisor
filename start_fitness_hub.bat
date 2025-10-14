@echo off
echo ========================================
echo   Starting Fitness Hub Services
echo ========================================
echo.
echo Backend: http://localhost:8002
echo Frontend: http://localhost:5174
echo.
echo ========================================

REM Start Fitness Backend (Port 8002)
echo Starting Fitness Backend on port 8002...
start cmd /k "cd /d aiservices\fitnessbackend && python main.py"

REM Wait a bit for backend to start
timeout /t 3 /nobreak >nul

REM Start Fitness Frontend (Port 5174)
echo Starting Fitness Frontend on port 5174...
start cmd /k "cd /d aiservices\fitnessagentfrontend && npm run dev"

echo.
echo ========================================
echo   Both services are starting...
echo ========================================
echo Backend API will be available at: http://localhost:8002
echo Frontend UI will be available at: http://localhost:5174
echo.
echo Press any key to exit this window...
pause >nul
