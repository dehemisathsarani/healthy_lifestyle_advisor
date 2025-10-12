# PowerShell script to install RabbitMQ
Write-Host "Installing RabbitMQ locally using PowerShell..." -ForegroundColor Green

# Create temp directory
$tempDir = "$env:TEMP\rabbitmq_install"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
Set-Location $tempDir

Write-Host "Step 1: Downloading Erlang..." -ForegroundColor Yellow
$erlangUrl = "https://github.com/erlang/otp/releases/download/OTP-26.2.5/otp_win64_26.2.5.exe"
$erlangFile = "erlang_installer.exe"
Invoke-WebRequest -Uri $erlangUrl -OutFile $erlangFile -UseBasicParsing

Write-Host "Step 2: Installing Erlang..." -ForegroundColor Yellow
Start-Process -FilePath $erlangFile -ArgumentList "/S" -Wait

Write-Host "Step 3: Downloading RabbitMQ..." -ForegroundColor Yellow
$rabbitUrl = "https://github.com/rabbitmq/rabbitmq-server/releases/download/v3.12.10/rabbitmq-server-3.12.10.exe"
$rabbitFile = "rabbitmq_installer.exe"
Invoke-WebRequest -Uri $rabbitUrl -OutFile $rabbitFile -UseBasicParsing

Write-Host "Step 4: Installing RabbitMQ..." -ForegroundColor Yellow
Start-Process -FilePath $rabbitFile -ArgumentList "/S" -Wait

Write-Host "Step 5: Setting up environment..." -ForegroundColor Yellow
$rabbitPath = "C:\Program Files\RabbitMQ Server"
if (Test-Path $rabbitPath) {
    $rabbitVersion = Get-ChildItem $rabbitPath | Where-Object {$_.Name -like "rabbitmq_server-*"} | Select-Object -First 1
    $sbinPath = Join-Path $rabbitVersion.FullName "sbin"
    
    Write-Host "Step 6: Enabling management plugin..." -ForegroundColor Yellow
    & "$sbinPath\rabbitmq-plugins.bat" enable rabbitmq_management
    
    Write-Host "Step 7: Starting RabbitMQ service..." -ForegroundColor Yellow
    Start-Service -Name "RabbitMQ"
    
    Write-Host "Installation complete!" -ForegroundColor Green
    Write-Host "RabbitMQ Management UI: http://localhost:15672" -ForegroundColor Cyan
    Write-Host "Default credentials: guest/guest" -ForegroundColor Cyan
} else {
    Write-Host "Installation may have failed. Please check manually." -ForegroundColor Red
}

# Clean up
Set-Location $env:USERPROFILE
Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue