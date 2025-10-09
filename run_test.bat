@echo off
echo.
echo ===================================
echo   Running Mood Analysis Tests
echo ===================================
echo.
echo NOTE: Make sure backend is running on port 8005!
echo.
timeout /t 2 /nobreak >nul
python quick_test.py
echo.
pause
