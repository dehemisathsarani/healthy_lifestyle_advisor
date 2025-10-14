# Google Vision API Setup Guide

## Step 1: Create Google Cloud Project
1. Go to: https://console.cloud.google.com/
2. Click "Create Project" or select existing project
3. Name your project (e.g., "healthy-lifestyle-advisor")
4. Note your Project ID

## Step 2: Enable Vision API
1. In Google Cloud Console, go to APIs & Services > Library
2. Search for "Vision API"
3. Click "Cloud Vision API"
4. Click "Enable"

## Step 3: Create Service Account
1. Go to IAM & Admin > Service Accounts
2. Click "Create Service Account"
3. Name: "vision-api-service"
4. Description: "Service account for Vision API"
5. Click "Create and Continue"
6. Role: Select "Cloud Vision API Service Agent"
7. Click "Continue" and "Done"

## Step 4: Generate Key File
1. Click on your newly created service account
2. Go to "Keys" tab
3. Click "Add Key" > "Create new key"
4. Select "JSON" format
5. Click "Create"
6. Download the JSON file

## Step 5: Replace Credentials File
1. Rename downloaded file to "google-credentials.json"
2. Replace the existing file at:
   `C:\Users\Asus\Desktop\healthy_lifestyle_advisor\aiservices\google-credentials.json`

## Step 6: Test Connection
```bash
cd C:\Users\Asus\Desktop\healthy_lifestyle_advisor\aiservices\dietaiservices
python test_real_services.py
```

You should see: ✅ Google Vision API: Client initialized

## Alternative: Use Mock Vision API
If you don't want to set up Google Cloud right now, I can configure the system to use mock Vision API for development.