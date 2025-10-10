# 🚀 Quick Start Guide - Healthy Lifestyle Advisor

## ✅ Project is Running!

```
========================================
  SERVICES STATUS
========================================
✅ Backend:   http://127.0.0.1:8004
✅ Frontend:  http://localhost:5173
⚠️  AI:       Port 8001 (Not Running)
========================================
```

## 🌐 Access Your Application

**Main App:** http://localhost:5173

Your default browser should have opened automatically!

## 🎯 What You Can Do Now

1. **Register a New Account**
   - Click "Register" or go to http://localhost:5173/register
   - Fill in your details
   - Create your profile

2. **Login**
   - Use your credentials at http://localhost:5173/login
   - Access your personalized dashboard

3. **Explore Features**
   - 📊 Dashboard - View health stats
   - 📅 Calendar - Track appointments
   - 🥗 Diet Agent - Nutrition tracking
   - 🧠 Mental Health - Wellness resources

## 🔧 Backend API

**API Documentation:** http://127.0.0.1:8004/docs

Try these endpoints:
- `/health` - Check system status
- `/auth/register` - Create account
- `/auth/login` - User login
- `/diet/*` - Diet management
- `/mental-health/*` - Mental health resources

## 📝 Quick Test

### Test Backend (PowerShell)
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8004/health"
```

### Test Frontend
Just open: http://localhost:5173

## 🛑 Stop Services

Press `Ctrl+C` in each terminal window running the services.

## ⚠️ Important Notes

1. **AI Services** - Currently not running due to dependency issues
   - Basic features work fine
   - Advanced AI features unavailable
   
2. **Node.js Warning** - Cosmetic only, doesn't affect functionality
   - Upgrade to v22.12+ to remove warning
   - Installer available in temp folder

3. **Database** - Using MongoDB Atlas (cloud)
   - No local MongoDB needed
   - Automatically connected

## 🔍 Troubleshooting

**Frontend won't load?**
- Check if it's running: `netstat -ano | findstr :5173`
- Restart: Run `start_frontend.bat` again

**Backend errors?**
- Check MongoDB Atlas connection
- Verify .env file in backend folder

**Can't register?**
- Check backend is running on port 8004
- Check API docs at http://127.0.0.1:8004/docs

## 📂 Terminal Windows

You should see 2 command windows:
1. **Backend** - Shows FastAPI logs
2. **Frontend** - Shows Vite dev server

Keep these windows open while using the app!

## 🎉 Enjoy!

Your Healthy Lifestyle Advisor is ready to use!

---
**Next:** Try registering an account and exploring the dashboard!
