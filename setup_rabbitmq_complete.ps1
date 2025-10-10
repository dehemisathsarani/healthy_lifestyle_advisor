# RabbitMQ Complete Setup Script
# Run this in PowerShell as Administrator

Write-Host "🐰 RabbitMQ Complete Setup for AI Services" -ForegroundColor Green
Write-Host "=" * 50

# Step 1: Install Chocolatey if not already installed
if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Chocolatey..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
}

# Step 2: Install Erlang (Required for RabbitMQ)
Write-Host "Installing Erlang..." -ForegroundColor Yellow
choco install erlang -y

# Step 3: Install RabbitMQ
Write-Host "Installing RabbitMQ..." -ForegroundColor Yellow
choco install rabbitmq -y

# Step 4: Start RabbitMQ Service
Write-Host "Starting RabbitMQ Service..." -ForegroundColor Yellow
Start-Service -Name "RabbitMQ"

# Step 5: Enable Management Plugin
Write-Host "Enabling RabbitMQ Management Plugin..." -ForegroundColor Yellow
& "C:\Program Files\RabbitMQ Server\rabbitmq_server-*\sbin\rabbitmq-plugins.bat" enable rabbitmq_management

# Step 6: Check Service Status
Write-Host "Checking RabbitMQ Status..." -ForegroundColor Yellow
Get-Service -Name "RabbitMQ"

# Step 7: Test Connection
Write-Host "Testing Connection..." -ForegroundColor Yellow
$testScript = @"
import aio_pika
import asyncio

async def test_connection():
    try:
        connection = await aio_pika.connect_robust('amqp://guest:guest@localhost:5672/')
        print('✅ RabbitMQ Connection: SUCCESS')
        await connection.close()
    except Exception as e:
        print(f'❌ RabbitMQ Connection: FAILED - {e}')

asyncio.run(test_connection())
"@

$testScript | Out-File -FilePath "test_rabbitmq.py" -Encoding UTF8
python test_rabbitmq.py

Write-Host "🎉 RabbitMQ Setup Complete!" -ForegroundColor Green
Write-Host "RabbitMQ URL: amqp://guest:guest@localhost:5672/" -ForegroundColor Cyan
Write-Host "Management UI: http://localhost:15672 (guest/guest)" -ForegroundColor Cyan

# Clean up
Remove-Item "test_rabbitmq.py" -ErrorAction SilentlyContinue