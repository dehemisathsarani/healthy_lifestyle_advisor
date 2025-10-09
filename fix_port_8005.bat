@echo off
echo 🔧 Port 8005 Binding Error Fix
echo ==============================

echo 📊 Checking what's using port 8005...
netstat -ano | findstr :8005

echo.
echo 💡 Quick Solutions:
echo.
echo 1. Kill the process using port 8005:
echo    For /f "tokens=5" %%i in ('netstat -ano ^| findstr :8005') do taskkill /PID %%i /F

echo.
echo 2. Or manually kill the process:
for /f "tokens=5" %%i in ('netstat -ano ^| findstr :8005 2^>nul') do (
    echo    Process ID: %%i
    echo    Command: taskkill /PID %%i /F
)

echo.
echo 3. Check if backend is already running:
echo    If you see python.exe using port 8005, your backend might already be running!
echo.

set /p choice="Would you like me to kill the process using port 8005? (y/n): "
if /i "%choice%"=="y" (
    echo 🔄 Killing process on port 8005...
    for /f "tokens=5" %%i in ('netstat -ano ^| findstr :8005 2^>nul') do (
        taskkill /PID %%i /F
        echo ✅ Killed process %%i
    )
    echo.
    echo ✅ Port 8005 should now be free!
    echo You can now start your backend with: python backend/main.py
) else (
    echo ℹ️ No changes made. Port 8005 is still in use.
)

echo.
echo 🎉 Port binding fix complete!
pause