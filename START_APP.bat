@echo off
echo ========================================
echo   Starting Healthy Lifestyle Advisor
echo   Full Application Startup
echo ========================================
echo.

REM Check if MongoDB is running
echo [1/4] Checking MongoDB...
sc query MongoDB | find "RUNNING" >nul
if errorlevel 1 (
    echo [!] MongoDB is not running. Starting MongoDB...
    net start MongoDB
    if errorlevel 1 (
        echo [WARNING] Could not start MongoDB. Application may have limited functionality.
        echo Please start MongoDB manually if needed.
        timeout /t 3 /nobreak >nul
    ) else (
        echo [OK] MongoDB started successfully
    )
) else (
    echo [OK] MongoDB is already running
)

echo.
echo [2/4] Starting Backend API (Port 8005)...
echo Backend will be available at: http://localhost:8005
start "Backend API" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --host 0.0.0.0 --port 8005 --reload"

REM Wait for backend to start
echo Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

echo.
echo [3/4] Starting Frontend (Port 5173)...
echo Frontend will be available at: http://localhost:5173
start "Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo [4/4] Application Starting...
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo   Application Started Successfully!
echo ========================================
echo.
echo Backend API:  http://localhost:8005
echo API Docs:     http://localhost:8005/docs
echo Frontend UI:  http://localhost:5173
echo.
echo Two terminal windows have been opened:
echo   1. Backend (Python/FastAPI)
echo   2. Frontend (React/Vite)
echo.
echo Press any key to open the application in your browser...
pause >nul

REM Open browser
start http://localhost:5173

echo.
echo Application is running!
echo Close the terminal windows to stop the services.
echo.
