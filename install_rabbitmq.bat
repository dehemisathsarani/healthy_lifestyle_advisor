@echo off
echo Installing RabbitMQ locally...
echo.

echo Step 1: Downloading Erlang...
curl -L -o erlang_installer.exe "https://github.com/erlang/otp/releases/download/OTP-26.2.5/otp_win64_26.2.5.exe"

echo Step 2: Installing Erlang (silent installation)...
erlang_installer.exe /S

echo Step 3: Downloading RabbitMQ...
curl -L -o rabbitmq_installer.exe "https://github.com/rabbitmq/rabbitmq-server/releases/download/v3.12.10/rabbitmq-server-3.12.10.exe"

echo Step 4: Installing RabbitMQ (silent installation)...
rabbitmq_installer.exe /S

echo Step 5: Enable RabbitMQ Management Plugin...
"C:\Program Files\RabbitMQ Server\rabbitmq_server-3.12.10\sbin\rabbitmq-plugins.bat" enable rabbitmq_management

echo Step 6: Start RabbitMQ Service...
"C:\Program Files\RabbitMQ Server\rabbitmq_server-3.12.10\sbin\rabbitmq-server.bat"

echo.
echo RabbitMQ installation complete!
echo Management UI will be available at: http://localhost:15672
echo Default credentials: guest/guest
echo.
pause