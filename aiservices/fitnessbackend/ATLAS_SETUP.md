# MongoDB Atlas Setup Instructions

## Quick Cloud Database Setup (5 minutes)

### Step 1: Create Free MongoDB Atlas Account
1. Go to https://www.mongodb.com/atlas
2. Click "Try Free"
3. Sign up with your email
4. Choose "Build a database" → "Shared" (Free tier)
5. Select your preferred region (choose closest to your location)
6. Create cluster (takes 2-3 minutes)

### Step 2: Configure Database Access
1. In Atlas dashboard, go to "Database Access"
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Username: `fitnessuser`
5. Password: Generate a secure password (save it!)
6. Database User Privileges: Select "Built-in role" → "Read and write to any database"
7. Click "Add User"

### Step 3: Configure Network Access
1. Go to "Network Access"
2. Click "Add IP Address"
3. Click "Allow access from anywhere" (for development)
4. Confirm

### Step 4: Get Connection String
1. Go to "Database" → Click "Connect" on your cluster
2. Choose "Connect your application"
3. Select "Python" and version "3.12 or later"
4. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### Step 5: Update Fitness Agent Configuration
Replace the placeholders in your connection string and update settings.

Example connection string:
```
mongodb+srv://fitnessuser:your_password@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority
```