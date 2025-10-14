# Simple RabbitMQ Setup Steps

## Option A: Use the automated script (Recommended)
1. Right-click PowerShell and "Run as Administrator"
2. Navigate to your project folder:
   ```
   cd "C:\Users\Asus\Desktop\healthy_lifestyle_advisor"
   ```
3. Run the setup script:
   ```
   .\setup_rabbitmq_complete.ps1
   ```

## Option B: Manual Installation
1. **Download Erlang**: https://github.com/erlang/otp/releases/download/OTP-26.2.5/otp_win64_26.2.5.exe
2. **Download RabbitMQ**: https://github.com/rabbitmq/rabbitmq-server/releases/download/v3.12.10/rabbitmq-server-3.12.10.exe
3. **Install both** with default settings
4. **Start service**: `rabbitmq-service start`
5. **Enable management**: `rabbitmq-plugins enable rabbitmq_management`

## After Installation - Test Your AI Services
```bash
cd "C:\Users\Asus\Desktop\healthy_lifestyle_advisor\aiservices\dietaiservices"
python test_real_services.py
```

You should see:
✅ RabbitMQ: Connected successfully

## Then Start Your AI Services
```bash
python main.py
```

Your AI services will now use real RabbitMQ instead of the simple message queue!