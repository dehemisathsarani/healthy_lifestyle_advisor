@echo off
echo Setting up Portable RabbitMQ...
echo.

REM Create directories
mkdir rabbitmq_portable
cd rabbitmq_portable

echo Downloading portable Erlang...
curl -L -o erlang_portable.zip "https://github.com/erlang/otp/releases/download/OTP-26.2.5/otp_win64_26.2.5.exe"

echo Downloading RabbitMQ...
curl -L -o rabbitmq.zip "https://github.com/rabbitmq/rabbitmq-server/releases/download/v3.12.10/rabbitmq-server-windows-3.12.10.zip"

echo Extracting RabbitMQ...
powershell -command "Expand-Archive -Path rabbitmq.zip -DestinationPath . -Force"

echo Setting up environment...
set RABBITMQ_BASE=%CD%\data
set RABBITMQ_CONFIG_FILE=%CD%\rabbitmq
set RABBITMQ_LOG_BASE=%CD%\logs

mkdir data
mkdir logs

echo Creating start script...
echo @echo off > start_rabbitmq.bat
echo set RABBITMQ_BASE=%CD%\data >> start_rabbitmq.bat
echo set RABBITMQ_CONFIG_FILE=%CD%\rabbitmq >> start_rabbitmq.bat
echo set RABBITMQ_LOG_BASE=%CD%\logs >> start_rabbitmq.bat
echo rabbitmq_server-3.12.10\sbin\rabbitmq-server.bat >> start_rabbitmq.bat

echo.
echo Portable RabbitMQ setup complete!
echo To start: cd rabbitmq_portable && start_rabbitmq.bat
echo.
pause