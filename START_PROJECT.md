# 🚀 Quick Start Guide - Healthy Lifestyle Advisor

**Last Run**: October 8, 2025  
**Status**: ✅ All Services Running

---

## 🎯 Start the Project (3 Simple Steps)

### Step 1: Start Backend
```bash
.\start_backend.bat
```
**Wait for**: `✅ Application startup completed successfully`  
**URL**: http://127.0.0.1:8004

---

### Step 2: Start AI Services (Optional - Skip if not needed)
```bash
.\start_ai_services.bat
```
**Note**: Currently has Pydantic compatibility issue. Mental Health Agent works without it!

---

### Step 3: Start Frontend
```bash
.\start_frontend.bat
```
**Wait for**: `VITE ready`  
**URL**: http://localhost:5173

---

## ✅ You're Done!

Open your browser and go to:
### 🌐 http://localhost:5173

---

## 🎮 Using the Application

### Mental Health Agent:
1. Navigate to **Mental Health** section
2. Track your mood (1-5 stars)
3. Add notes about your feelings
4. Get personalized interventions:
   - 🎵 Music recommendations
   - 😂 Jokes to cheer you up
   - 🐶 Cute animal pictures
   - 🎮 Mini games
   - 🧘 Breathing exercises

### Data Storage:
- **All data is saved to MongoDB** ✅
- Your mood history is persistent
- Access from any device
- Automatic backups

---

## 🔧 Troubleshooting

### Backend Error?
```bash
# Check if virtual environment is activated
.venv\Scripts\activate

# Restart backend
taskkill /F /IM python.exe
.\start_backend.bat
```

### Frontend Error?
```bash
# Install dependencies
cd frontend
npm install

# Restart frontend
.\start_frontend.bat
```

### MongoDB Connection Error?
- Check your internet connection (MongoDB Atlas is cloud-based)
- Verify `.env` file has correct connection string

---

## 🛑 Stop All Services

```bash
# Stop Backend & AI Services
taskkill /F /IM python.exe

# Stop Frontend
# Press Ctrl+C in the frontend terminal
```

---

## 📊 Service Status Check

| Service | Port | Status |
|---------|------|--------|
| Backend | 8004 | 🟢 Running |
| Frontend | 5173 | 🟢 Running |
| MongoDB | Cloud | 🟢 Connected |

---

## 🎉 Features Working

✅ User Authentication  
✅ Mental Health Mood Tracker  
✅ Mood History (MongoDB)  
✅ Intervention Tracking  
✅ Analytics Dashboard  
✅ Diet Agent (when AI services running)  
✅ Fitness Tracking  

---

## 📝 Important URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://127.0.0.1:8004
- **API Docs**: http://127.0.0.1:8004/docs
- **Database**: MongoDB Atlas (Cloud)

---

## 💡 Tips

1. **First Time Setup**: Run `npm install` in frontend directory
2. **Python Packages**: Already installed in `.venv`
3. **MongoDB**: Already configured and connected
4. **Port Conflicts**: Change ports in batch files if needed

---

## 🆘 Need Help?

- Check `SERVICES_RUNNING.md` for detailed status
- Check `MONGODB_MENTAL_HEALTH_SETUP.md` for MongoDB details
- View logs in terminal windows

---

**Happy Tracking! 🎯**
