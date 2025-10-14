# CloudAMQP Setup Guide

## Step 1: Create a Free CloudAMQP Account

1. Go to https://www.cloudamqp.com/
2. Click "Sign Up" or "Get Started Free"
3. Create an account with your email
4. Verify your email address

## Step 2: Create a RabbitMQ Instance

1. After logging in, click "Create New Instance"
2. Choose the "Little Lemur" plan (Free tier)
3. Select a region close to you
4. Give your instance a name (e.g., "healthy-lifestyle-advisor")
5. Click "Create Instance"

## Step 3: Get Your Connection URL

1. Click on your newly created instance
2. In the instance details, you'll see the "AMQP URL"
3. It will look like: `amqps://username:password@hostname/vhost`
4. Copy this URL

## Step 4: Update Your .env File

1. Open `aiservices/.env`
2. Replace the RABBITMQ_URL line with your real CloudAMQP URL:
   ```
   RABBITMQ_URL=amqps://your-username:your-password@your-hostname/your-vhost
   ```

## Step 5: Test the Connection

Run the test script to verify everything is working:
```bash
cd aiservices/dietaiservices
python test_real_services.py
```

## Security Note

Make sure to:
- Never commit your .env file with real credentials to version control
- Add .env to your .gitignore file
- Keep your CloudAMQP credentials secure