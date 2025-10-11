@echo off
echo ========================================
echo  Backend Services Startup
echo ========================================
echo.

REM Set paths
set "PROJECT_ROOT=%~dp0"
set "VENV_PYTHON=%PROJECT_ROOT%.venv\Scripts\python.exe"

REM Check if virtual environment exists
if not exist "%VENV_PYTHON%" (
    echo [ERROR] Virtual environment not found
    echo Please run: python -m venv .venv
    pause
    exit /b 1
)

echo [1/2] Starting Main Backend (Port 8000)...
echo ----------------------------------------
start "Main Backend - Port 8000" cmd /k "cd /d "%PROJECT_ROOT%backend" && "%VENV_PYTHON%" main.py"
timeout /t 3 /nobreak >nul

echo.
echo [2/2] Starting Diet AI Services (Port 8001)...
echo ----------------------------------------
start "Diet AI Services - Port 8001" cmd /k "cd /d "%PROJECT_ROOT%aiservices\dietaiservices" && "%VENV_PYTHON%" main.py"
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo  Backend Services Started!
echo ========================================
echo.
echo ✓ Main Backend:      http://localhost:8000
echo ✓ Diet AI Services:  http://localhost:8001
echo.
echo API Documentation:
echo   Main Backend:  http://localhost:8000/docs
echo   Diet AI:       http://localhost:8001/docs
echo.
echo ========================================
pause