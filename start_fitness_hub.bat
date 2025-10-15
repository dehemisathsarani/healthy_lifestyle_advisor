@echo off
title Fitness Hub Services Starter
color 0A
echo ================================================
echo   FITNESS HUB SERVICES STARTER
echo ================================================
echo.
echo   Main Backend: http://localhost:8005
echo   Fitness UI:   http://localhost:5174
echo.
echo ================================================

REM Start Main Backend (Port 8005) - Required for Fitness Hub
echo [1/2] Starting Main Backend on port 8005...
start "Main Backend" cmd /k "cd /d backend && ..\\.venv\Scripts\python.exe -m uvicorn main:app --reload --host 0.0.0.0 --port 8005"

REM Wait for backend to initialize
echo Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

REM Start Fitness Frontend (Port 5174)
echo.
echo [2/2] Starting Fitness Frontend on port 5174...
start "Fitness Frontend" cmd /k "cd /d aiservices\fitnessagentfrontend && npm run dev"

echo.
echo ================================================
echo   ✅ ALL SERVICES STARTING!
echo ================================================
echo.
echo   Main Backend:      http://localhost:8005
echo   Fitness Frontend:  http://localhost:5174
echo.
echo   API Documentation: http://localhost:8005/docs
echo   Health Check:      http://localhost:8005/health
echo.
echo ================================================
echo.
echo ✅ You can now click "Launch Fitness Hub" button!
echo.
echo Press any key to close this window...
echo (Services will continue running in separate windows)
pause >nul
