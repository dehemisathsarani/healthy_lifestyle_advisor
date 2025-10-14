@echo off
echo ========================================
echo   🔍 FITNESS HUB STATUS CHECKER
echo ========================================
echo.
echo Checking if Fitness Hub services are running...
echo.

REM Check Fitness Backend (Port 8002)
echo 🔧 Checking Fitness Backend (Port 8002)...
netstat -ano | findstr ":8002" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Fitness Backend is RUNNING on port 8002
) else (
    echo ❌ Fitness Backend is NOT RUNNING on port 8002
    echo    Run: start_fitness_hub.bat
)
echo.

REM Check Fitness Frontend (Port 5174)
echo 🎨 Checking Fitness Frontend (Port 5174)...
netstat -ano | findstr ":5174" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Fitness Frontend is RUNNING on port 5174
) else (
    echo ❌ Fitness Frontend is NOT RUNNING on port 5174
    echo    Run: start_fitness_hub.bat
)
echo.

REM Check Main Backend (Port 8000)
echo 🖥️ Checking Main Backend (Port 8000)...
netstat -ano | findstr ":8000" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Main Backend is RUNNING on port 8000
) else (
    echo ⚠️ Main Backend is NOT RUNNING on port 8000
    echo    This should be running for the main app
)
echo.

REM Check Main Frontend (Port 3000 or 5173)
echo 🌐 Checking Main Frontend...
netstat -ano | findstr ":3000" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Main Frontend is RUNNING on port 3000
) else (
    netstat -ano | findstr ":5173" >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ Main Frontend is RUNNING on port 5173
    ) else (
        echo ⚠️ Main Frontend is NOT RUNNING
        echo    This should be running for the main app
    )
)
echo.

echo ========================================
echo   📊 SUMMARY
echo ========================================
echo.
echo For "Launch Fitness Hub" to work, you need:
echo.
echo REQUIRED:
echo   ✅ Fitness Frontend (Port 5174) - MUST BE RUNNING
echo   ✅ Fitness Backend (Port 8002) - MUST BE RUNNING
echo.
echo ALSO NEEDED:
echo   ✅ Main Frontend (Port 3000/5173) - For main app
echo   ✅ Main Backend (Port 8000) - For main app APIs
echo.
echo ========================================
echo.
echo 💡 Quick Fix Commands:
echo.
echo To start Fitness Hub:
echo    start_fitness_hub.bat
echo.
echo To start Main App Backend:
echo    cd backend ^&^& python main.py
echo.
echo To start Main App Frontend:
echo    cd frontend ^&^& npm run dev
echo.
echo ========================================
echo.
pause
