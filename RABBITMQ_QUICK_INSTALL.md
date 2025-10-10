# Quick RabbitMQ Installation Guide

## Step 1: Download Erlang (Required)
1. Go to: https://github.com/erlang/otp/releases/download/OTP-26.2.5/otp_win64_26.2.5.exe
2. Download the file (about 145 MB)
3. Run the installer as Administrator
4. Click "Next" through all options (default settings are fine)

## Step 2: Download RabbitMQ
1. Go to: https://github.com/rabbitmq/rabbitmq-server/releases/download/v3.12.10/rabbitmq-server-3.12.10.exe
2. Download the file (about 15 MB)
3. Run the installer as Administrator
4. Click "Next" through all options (default settings are fine)

## Step 3: Start RabbitMQ
Open Command Prompt as Administrator and run:
```
rabbitmq-service start
```

## Step 4: Enable Management Plugin (Optional)
```
rabbitmq-plugins enable rabbitmq_management
```

## Step 5: Test Connection
- RabbitMQ will be available at: amqp://guest:guest@localhost:5672/
- Management UI (if enabled): http://localhost:15672 (guest/guest)

## Alternative: Use Chocolatey with Admin Rights
If you can run PowerShell as Administrator:
```
choco install erlang rabbitmq -y
```

Your AI services are already configured to use: amqp://guest:guest@localhost:5672/