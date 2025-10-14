# Stop all Python processes
Write-Host "Stopping all Python processes..." -ForegroundColor Yellow
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Verify ports are free
Write-Host "Checking if ports are free..." -ForegroundColor Cyan
$port8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
$port8001 = Get-NetTCPConnection -LocalPort 8001 -ErrorAction SilentlyContinue

if ($port8000) {
    Write-Host "Port 8000 still in use, killing process..." -ForegroundColor Red
    Stop-Process -Id $port8000.OwningProcess -Force
}

if ($port8001) {
    Write-Host "Port 8001 still in use, killing process..." -ForegroundColor Red
    Stop-Process -Id $port8001.OwningProcess -Force
}

Start-Sleep -Seconds 1

Write-Host "All ports cleared!" -ForegroundColor Green
Write-Host ""
Write-Host "Starting backend service..." -ForegroundColor Cyan

# Start backend
Set-Location "C:\Users\Asus\Desktop\healthy_lifestyle_advisor\backend"
Start-Process python -ArgumentList "main.py" -NoNewWindow
