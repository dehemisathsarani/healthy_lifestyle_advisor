@echo off
echo.
echo ===================================
echo   Backend Server (Port 8005)
echo ===================================
echo.

cd /d "%~dp0\backend"
"..\. venv\Scripts\python.exe" main.py 8005
