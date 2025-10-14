# Direct Download RabbitMQ Installation
Write-Host "🐰 Installing RabbitMQ via Direct Download" -ForegroundColor Green
Write-Host "=" * 50

# Create temp directory
$tempDir = "$env:TEMP\rabbitmq_install"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
Set-Location $tempDir

try {
    # Step 1: Download Erlang
    Write-Host "📥 Downloading Erlang..." -ForegroundColor Yellow
    $erlangUrl = "https://github.com/erlang/otp/releases/download/OTP-26.2.5/otp_win64_26.2.5.exe"
    $erlangFile = "erlang_installer.exe"
    Invoke-WebRequest -Uri $erlangUrl -OutFile $erlangFile -UseBasicParsing
    
    # Step 2: Install Erlang
    Write-Host "⚙️ Installing Erlang..." -ForegroundColor Yellow
    Start-Process -FilePath $erlangFile -ArgumentList "/S" -Wait -NoNewWindow
    
    # Step 3: Download RabbitMQ
    Write-Host "📥 Downloading RabbitMQ..." -ForegroundColor Yellow
    $rabbitUrl = "https://github.com/rabbitmq/rabbitmq-server/releases/download/v3.12.10/rabbitmq-server-3.12.10.exe"
    $rabbitFile = "rabbitmq_installer.exe"
    Invoke-WebRequest -Uri $rabbitUrl -OutFile $rabbitFile -UseBasicParsing
    
    # Step 4: Install RabbitMQ
    Write-Host "⚙️ Installing RabbitMQ..." -ForegroundColor Yellow
    Start-Process -FilePath $rabbitFile -ArgumentList "/S" -Wait -NoNewWindow
    
    # Step 5: Wait for installation to complete
    Start-Sleep -Seconds 10
    
    # Step 6: Find RabbitMQ installation path
    $rabbitPath = Get-ChildItem "C:\Program Files\RabbitMQ Server" -ErrorAction SilentlyContinue | Select-Object -First 1
    
    if ($rabbitPath) {
        $sbinPath = Join-Path $rabbitPath.FullName "sbin"
        
        # Step 7: Install and start service
        Write-Host "🚀 Installing RabbitMQ Service..." -ForegroundColor Yellow
        & "$sbinPath\rabbitmq-service.bat" install
        & "$sbinPath\rabbitmq-service.bat" start
        
        # Step 8: Enable management plugin
        Write-Host "🔧 Enabling Management Plugin..." -ForegroundColor Yellow
        & "$sbinPath\rabbitmq-plugins.bat" enable rabbitmq_management
        
        Write-Host "✅ RabbitMQ Installation Complete!" -ForegroundColor Green
        Write-Host "🌐 Management UI: http://localhost:15672" -ForegroundColor Cyan
        Write-Host "🔑 Default credentials: guest/guest" -ForegroundColor Cyan
        Write-Host "🔗 Connection URL: amqp://guest:guest@localhost:5672/" -ForegroundColor Cyan
        
    } else {
        Write-Host "❌ RabbitMQ installation path not found" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Error during installation: $_" -ForegroundColor Red
} finally {
    # Clean up
    Set-Location $env:USERPROFILE
    Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
}

# Test connection
Write-Host "`n🧪 Testing Connection..." -ForegroundColor Yellow
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

$testScript | Out-File -FilePath "test_rabbitmq_final.py" -Encoding UTF8
python test_rabbitmq_final.py
Remove-Item "test_rabbitmq_final.py" -ErrorAction SilentlyContinue