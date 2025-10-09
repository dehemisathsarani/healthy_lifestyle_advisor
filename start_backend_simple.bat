@echo off
echo.
echo ===================================
echo   Starting Backend Server
echo ===================================
echo.

cd /d "%~dp0"

echo [1/2] Activating Python environment...
python --version
if %errorlevel% neq 0 (
    echo ERROR: Python not found!
    pause
    exit /b 1
)

echo.
echo [2/2] Starting FastAPI server on port 8004...
echo.
python -m uvicorn backend.main:app --port 8004
