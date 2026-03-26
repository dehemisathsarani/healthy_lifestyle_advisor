# JWT Authentication System

This document describes how to run and test the JWT authentication system for the Healthy Lifestyle Advisor application.

## Backend Setup

1. Install dependencies:
   ```
   cd backend
   pip install -r requirements.txt
   ```

2. Run the backend server:
   ```
   cd backend
   uvicorn main:app --reload
   ```

   The server will start at http://127.0.0.1:8000

3. Access the API documentation:
   Open http://127.0.0.1:8000/docs in your browser to see the Swagger UI documentation.

## Frontend Setup

1. Install dependencies:
   ```
   cd frontend
   npm install
   ```

2. Start the development server:
   ```
   cd frontend
   npm run dev
   ```

   The frontend will start at http://localhost:5173 (or another port if 5173 is busy)

## Testing Authentication

### Registration
1. Visit http://localhost:5173/register
2. Fill in the registration form with:
   - Name
   - Email
   - Password
   - Optional: Age, Country, Mobile
3. Submit the form
4. If successful, you'll be redirected to the dashboard

### Login
1. Visit http://localhost:5173/login
2. Enter your email and password
3. Click "Sign in"
4. If successful, you'll be redirected to the dashboard

### API Testing
You can also test the authentication API directly using the Swagger UI:

1. Go to http://127.0.0.1:8000/docs
2. Try the following endpoints:
   - POST `/auth/register` - Register a new user
   - POST `/auth/login` - Login with email and password
   - GET `/auth/me` - Get the current user profile (requires authentication)
   - POST `/auth/refresh` - Refresh an access token
   - POST `/auth/logout` - Logout and invalidate tokens

## Verification

### Database Verification
To verify users are being stored in the MongoDB database:

1. Connect to your MongoDB instance:
   ```
   mongo mongodb+srv://Admin:X1bzjS2IGHrNHFgS@healthagent.ucnrbse.mongodb.net/HealthAgent
   ```

2. Check the users collection:
   ```
   use HealthAgent
   db.users.find()
   ```

   You should see the user records with hashed passwords and refresh tokens.

### Authentication Flow Verification
1. Register a new user
2. Check the browser's developer tools:
   - In the Network tab, you'll see the registration request
   - In the Application tab, under Session Storage, you'll see the JWT tokens stored
3. Try accessing a protected route like `/dashboard`
4. Logout and verify you can't access protected routes anymore

## Troubleshooting

### Backend Issues
- Check MongoDB connection (the server logs will show connection status)
- Verify the JWT secret keys are correctly set in `.env`
- Check for any errors in the server logs

### Frontend Issues
- Make sure the API base URL is correctly set
- Check browser console for any errors
- Verify the authentication context is working by checking the tokens in session storage

## Security Notes

- In production, change the JWT secret keys to strong random values
- Use HTTPS for all API communication
- Consider adding rate limiting for login attempts
- Implement CSRF protection for production use
