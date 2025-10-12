@echo off
REM Kill Backend Server on Port 8000
REM This script finds and terminates any process using port 8000

echo ========================================
echo   Kill Backend Server on Port 8000
echo ========================================
echo.

echo Checking for processes on port 8000...
echo.

REM Find processes using port 8000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    echo Found process ID: %%a
    echo Killing process %%a...
    taskkill /F /PID %%a
    echo.
)

echo.
echo ========================================
echo   Port 8000 is now free!
echo ========================================
echo.
echo You can now start your backend server:
echo   cd backend
echo   python main.py
echo.

pause
