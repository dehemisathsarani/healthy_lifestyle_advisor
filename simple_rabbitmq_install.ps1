# Simple RabbitMQ Installation Script
Write-Host "Installing RabbitMQ via Direct Download..." -ForegroundColor Green

# Create temp directory
$tempDir = "C:\temp\rabbitmq_install"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
Set-Location $tempDir

Write-Host "Downloading Erlang..." -ForegroundColor Yellow
$erlangUrl = "https://github.com/erlang/otp/releases/download/OTP-26.2.5/otp_win64_26.2.5.exe"
Invoke-WebRequest -Uri $erlangUrl -OutFile "erlang_installer.exe" -UseBasicParsing

Write-Host "Installing Erlang..." -ForegroundColor Yellow
Start-Process -FilePath "erlang_installer.exe" -ArgumentList "/S" -Wait

Write-Host "Downloading RabbitMQ..." -ForegroundColor Yellow
$rabbitUrl = "https://github.com/rabbitmq/rabbitmq-server/releases/download/v3.12.10/rabbitmq-server-3.12.10.exe"
Invoke-WebRequest -Uri $rabbitUrl -OutFile "rabbitmq_installer.exe" -UseBasicParsing

Write-Host "Installing RabbitMQ..." -ForegroundColor Yellow
Start-Process -FilePath "rabbitmq_installer.exe" -ArgumentList "/S" -Wait

Write-Host "Waiting for installation to complete..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host "Setting up RabbitMQ service..." -ForegroundColor Yellow
$rabbitPath = Get-ChildItem "C:\Program Files\RabbitMQ Server" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($rabbitPath) {
    $sbinPath = Join-Path $rabbitPath.FullName "sbin"
    & "$sbinPath\rabbitmq-service.bat" install
    & "$sbinPath\rabbitmq-service.bat" start
    & "$sbinPath\rabbitmq-plugins.bat" enable rabbitmq_management
    Write-Host "RabbitMQ installation completed!" -ForegroundColor Green
} else {
    Write-Host "RabbitMQ installation path not found" -ForegroundColor Red
}

# Clean up
Set-Location $env:USERPROFILE
Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue