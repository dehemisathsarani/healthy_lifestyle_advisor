@echo off
echo ================================
echo Testing RabbitMQ Messaging
echo ================================
echo.
echo Checking services...
netstat -ano | findstr ":8000 :8002 :5672"
echo.
echo Running RabbitMQ test...
python quick_rabbitmq_test.py
echo.
pause
