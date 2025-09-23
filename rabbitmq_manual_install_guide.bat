@echo off
echo ================================================
echo        RabbitMQ Quick Installation Guide
echo ================================================
echo.

echo Step 1: Download and Install Erlang
echo ------------------------------------
echo 1. Go to: https://erlang.org/download/otp_versions_tree.html
echo 2. Download: OTP 26.2.5 Windows 64-bit Binary File
echo 3. Run installer with default settings
echo.

echo Step 2: Download and Install RabbitMQ
echo --------------------------------------
echo 1. Go to: https://www.rabbitmq.com/download.html
echo 2. Download: RabbitMQ Server for Windows
echo 3. Run installer with default settings
echo.

echo Step 3: Start RabbitMQ Service
echo -------------------------------
echo Run as Administrator:
echo   rabbitmq-service start
echo.

echo Step 4: Enable Management Plugin (Optional)
echo -------------------------------------------
echo Run as Administrator:
echo   rabbitmq-plugins enable rabbitmq_management
echo.

echo Step 5: Test Connection
echo -----------------------
echo Your RabbitMQ will be available at:
echo   amqp://guest:guest@localhost:5672/
echo.
echo Management UI (if enabled):
echo   http://localhost:15672 (guest/guest)
echo.

pause