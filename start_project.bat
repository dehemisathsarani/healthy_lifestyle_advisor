@echo off
echo 🚀 Starting Healthy Lifestyle Advisor Project...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed!
    echo Please download and install Node.js from: https://nodejs.org/
    echo Then run this script again.
    pause
    exit /b 1
)

echo ✅ Node.js is available
echo.

REM Start backend (if not already running)
echo 🔧 Checking backend status...
curl -s http://localhost:8000/docs >nul 2>&1
if %errorlevel% neq 0 (
    echo 🚀 Starting Backend API...
    start "Backend API" cmd /k "cd /d %~dp0backend && C:/Users/Asus/Desktop/healthy_lifestyle_advisor/.venv/Scripts/python.exe -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
    echo ⏳ Waiting for backend to start...
    timeout /t 10 /nobreak >nul
) else (
    echo ✅ Backend API is already running
)

REM Install frontend dependencies and start frontend
echo 🎨 Setting up Frontend...
cd /d %~dp0frontend

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing frontend dependencies...
    npm install
)

echo 🚀 Starting Frontend Development Server...
start "Frontend Dev Server" cmd /k "npm run dev"

echo.
echo ✅ Project startup initiated!
echo.
echo 🌐 Access points:
echo   • Frontend: http://localhost:5173
echo   • Backend API: http://localhost:8000
echo   • API Docs: http://localhost:8000/docs
echo.
echo 📝 Note: It may take a moment for services to fully start
echo 🔐 Remember: Services require login to access
echo.
pause
