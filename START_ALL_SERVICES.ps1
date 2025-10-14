# PowerShell script to start all Health Lifestyle Advisor services
# This script starts all required services in separate PowerShell windows

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting ALL Health Lifestyle Advisor Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start Main Backend (Mental Health, Auth, etc.)
Write-Host "[1/4] Starting Main Backend on port 8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptPath\backend'; python main.py"
Start-Sleep -Seconds 3

# Start Main Frontend
Write-Host "[2/4] Starting Main Frontend on port 3002..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptPath\frontend'; npm run dev"
Start-Sleep -Seconds 3

# Start Fitness Backend
Write-Host "[3/4] Starting Fitness Backend on port 8002..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptPath\aiservices\fitnessbackend'; python main.py"
Start-Sleep -Seconds 3

# Start Fitness Frontend
Write-Host "[4/4] Starting Fitness Frontend on port 5174..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptPath\aiservices\fitnessagentfrontend'; npm run dev"
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ALL SERVICES STARTED!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Main Backend:      http://localhost:8000" -ForegroundColor Yellow
Write-Host "Main Frontend:     http://localhost:3002" -ForegroundColor Yellow
Write-Host "Fitness Backend:   http://localhost:8002" -ForegroundColor Yellow
Write-Host "Fitness Frontend:  http://localhost:5174" -ForegroundColor Yellow
Write-Host ""
Write-Host "All services are running in separate windows." -ForegroundColor White
Write-Host "Close those windows to stop the services." -ForegroundColor White
Write-Host ""
Write-Host "Press any key to close this launcher..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
