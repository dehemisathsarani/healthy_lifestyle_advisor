@echo off
echo.
echo ===================================
echo   Starting Backend Server (No Pause)
echo ===================================
echo.

cd /d "%~dp0"

echo [1/2] Activating Python environment...
python --version
if %errorlevel% neq 0 (
    echo ERROR: Python not found!
    exit /b 1
)

echo.
echo [2/2] Starting FastAPI server on port 8005...
echo.

cd backend
python -m uvicorn main:app --port 8005 --reload