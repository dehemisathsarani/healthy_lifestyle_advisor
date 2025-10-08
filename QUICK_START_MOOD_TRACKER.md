# 🚀 Mental Health Agent - Quick Start Guide

## 📋 Prerequisites
- Python 3.8+ installed
- Node.js 16+ installed
- MongoDB running (optional, can use localStorage)
- Code editor (VS Code recommended)

---

## ⚡ Quick Start (5 Minutes)

### Step 1: Start Backend (Port 8005)
```bash
# Open Terminal 1
cd backend
python -m uvicorn main:app --reload --port 8005
```

**Expected Output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8005 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Application startup complete.
```

### Step 2: Start Frontend (Port 5173)
```bash
# Open Terminal 2
cd frontend
npm install  # Only first time
npm run dev
```

**Expected Output:**
```
  VITE v4.x.x  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 3: Open Browser
```
http://localhost:5173
```

### Step 4: Navigate to Mental Health Agent
1. Click on "Mental Health" service
2. You'll see the agent dashboard
3. Click on "Mood Tracker" tab

---

## 🎯 Testing the Mood Tracker Feature

### Test 1: Sad Mood
```
1. Type: "I'm feeling really sad today"
2. Click "Share My Feelings"
3. Expected Response:
   ✅ Mood detected: sad
   ✅ Shows calming music (YouTube embed)
   ✅ Shows funny joke
   ✅ Shows cute animal image
   ✅ Suggests games (Smile Challenge)
```

### Test 2: Happy Mood
```
1. Type: "I'm feeling great and happy!"
2. Click "Share My Feelings"
3. Expected Response:
   ✅ Mood detected: happy
   ✅ Shows upbeat music
   ✅ Shows motivational quotes
   ✅ Shows inspiring images
   ✅ Suggests achievement games
```

### Test 3: Anxious Mood
```
1. Type: "I'm really anxious about work"
2. Click "Share My Feelings"
3. Expected Response:
   ✅ Mood detected: anxious
   ✅ Shows meditation music
   ✅ Shows calming content
   ✅ Offers breathing exercises
```

---

## 🔍 System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERACTION                          │
│                                                               │
│  "I'm feeling sad" → [Submit Button] → API Call             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              BACKEND (FastAPI - Port 8005)                   │
│                                                               │
│  POST /mental-health/analyze-mood                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 1. Receive text: "I'm feeling sad"                  │   │
│  │ 2. Check keywords: ["sad", "lonely", "depressed"]   │   │
│  │ 3. Calculate confidence: 0.85                        │   │
│  │ 4. Return: {mood: "sad", confidence: 0.85}          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│           CONTENT DELIVERY SYSTEM                            │
│                                                               │
│  GET /mental-health/youtube/sad                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Returns: "Weightless" by Marconi Union              │   │
│  │ YouTube ID: UfcAVejslrU                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  GET /mental-health/joke                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Calls: JokeAPI                                       │   │
│  │ Returns: Random safe joke                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  GET /mental-health/funny-image                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Calls: Dog/Cat API                                   │   │
│  │ Returns: Cute animal image URL                       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│           FRONTEND DISPLAY (React Component)                 │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  🎵 MUSIC SECTION                                    │   │
│  │  [YouTube Embed Player]                              │   │
│  │  "Weightless" by Marconi Union                       │   │
│  │  [🎵 Play Another Song]                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  😂 JOKE SECTION                                     │   │
│  │  "Why don't scientists trust atoms?..."             │   │
│  │  [🎭 Want Another Joke?]                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  🖼️ IMAGE SECTION                                    │   │
│  │  [Cute Dog Image]                                    │   │
│  │  "Look at this adorable pup! 🐶"                    │   │
│  │  [🖼️ Show Another Image]                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  🎮 GAMES SECTION                                    │   │
│  │  [😊 Smile Challenge] [🎮 More Games]              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow Diagram

```
USER INPUT
   ↓
┌──────────────────────┐
│ "I'm feeling sad"    │
└──────────────────────┘
   ↓
┌──────────────────────────────────────┐
│ MOOD ANALYSIS (NLP)                  │
│ • Check keywords                     │
│ • Calculate confidence               │
│ • Determine mood type                │
└──────────────────────────────────────┘
   ↓
┌──────────────────────────────────────┐
│ MOOD CLASSIFICATION                  │
│                                       │
│ IF sad/angry/anxious:                │
│   • Calming music                    │
│   • Funny jokes                      │
│   • Cute images                      │
│   • Relaxing games                   │
│                                       │
│ IF happy:                             │
│   • Upbeat music                     │
│   • Motivational quotes              │
│   • Inspiring images                 │
│   • Achievement games                │
└──────────────────────────────────────┘
   ↓
┌──────────────────────────────────────┐
│ CONTENT DELIVERY                     │
│ • Fetch YouTube track                │
│ • Fetch joke from JokeAPI            │
│ • Fetch image from Dog/Cat API       │
│ • Show game suggestions              │
└──────────────────────────────────────┘
   ↓
┌──────────────────────────────────────┐
│ INTERACTIVE MODAL                    │
│ • Display all content                │
│ • Show "Want more?" buttons          │
│ • Allow content cycling              │
│ • Track user interactions            │
└──────────────────────────────────────┘
   ↓
┌──────────────────────────────────────┐
│ HISTORY STORAGE                      │
│ • Save mood entry                    │
│ • Save intervention details          │
│ • Track effectiveness                │
└──────────────────────────────────────┘
```

---

## 🧪 Testing Checklist

### ✅ Backend Tests
```bash
# Run test script
python test_mood_tracker.py
```

Expected results:
- [ ] Mood analysis endpoint working
- [ ] YouTube track endpoint working
- [ ] Joke endpoint working
- [ ] Image endpoint working

### ✅ Frontend Tests
1. Open browser console (F12)
2. Enter mood text
3. Check for errors
4. Verify modal appears
5. Test "Want more?" buttons
6. Verify content changes

### ✅ Integration Tests
- [ ] User inputs "sad" → Calming content shown
- [ ] User inputs "happy" → Motivational content shown
- [ ] User clicks "Another joke" → New joke appears
- [ ] User clicks "Show image" → New image appears
- [ ] YouTube embed plays music
- [ ] Games suggestions work

---

## 🐛 Troubleshooting

### Backend not starting?
```bash
# Check if port 8005 is in use
netstat -ano | findstr :8005

# Kill process if needed
taskkill /PID <PID> /F

# Restart backend
cd backend
python -m uvicorn main:app --reload --port 8005
```

### Frontend not starting?
```bash
# Clear node_modules and reinstall
cd frontend
rd /s /q node_modules
npm install
npm run dev
```

### API calls failing?
```bash
# Check backend logs
# Look for errors in terminal running uvicorn

# Check frontend console
# Press F12 in browser, check Console tab

# Verify CORS settings
# In backend/main.py, check CORS configuration
```

### Mood not detected?
```python
# Check keywords in mental_health_routes.py
# Line 155-165: mood_keywords dictionary
# Add more keywords if needed
```

---

## 📁 Key Files to Understand

| File | Purpose | What to Look For |
|------|---------|------------------|
| `backend/app/routes/mental_health_routes.py` | Backend API | Mood keywords, YouTube playlists, endpoints |
| `frontend/src/components/EnhancedMentalHealthAgent.tsx` | Main component | User interface, modal, interactive buttons |
| `frontend/src/services/mentalHealthAPI.ts` | API calls | Axios requests, error handling |
| `backend/main.py` | Backend entry | CORS settings, route registration |

---

## 🎓 Learning Path

### Day 1: Understanding
- [ ] Read MENTAL_HEALTH_MOOD_TRACKER_GUIDE.md
- [ ] Understand system architecture
- [ ] Review data flow diagram
- [ ] Run test script

### Day 2: Backend
- [ ] Open `mental_health_routes.py`
- [ ] Understand mood detection function
- [ ] Review YouTube playlists
- [ ] Test API endpoints with Postman

### Day 3: Frontend
- [ ] Open `EnhancedMentalHealthAgent.tsx`
- [ ] Understand component structure
- [ ] Review state management
- [ ] Test user interactions

### Day 4: Integration
- [ ] Test complete user flow
- [ ] Debug any issues
- [ ] Add console.log statements
- [ ] Verify data storage

### Day 5: Customization
- [ ] Add new mood keywords
- [ ] Add new YouTube tracks
- [ ] Customize UI colors
- [ ] Add more jokes/images

---

## 🎨 Customization Ideas

### Add New Mood Type
```python
# In mental_health_routes.py (Line 155)
mood_keywords = {
    "excited": ["excited", "thrilled", "pumped", "energized"],  # Add this
    # ... existing moods
}

# Add corresponding YouTube playlist
YOUTUBE_PLAYLISTS = {
    "excited": [
        {"title": "Eye of the Tiger", "artist": "Survivor", ...},
    ],
    # ... existing playlists
}
```

### Add New Music Track
```python
# In mental_health_routes.py (Line 60)
"sad": [
    # Add new track
    {"title": "Fix You", "artist": "Coldplay", "youtube_id": "k4V3Mo61fJM", "duration": "4:54"},
    # ... existing tracks
]
```

### Customize UI Colors
```tsx
// In EnhancedMentalHealthAgent.tsx
// Change gradient colors
className="bg-gradient-to-br from-purple-50 to-pink-50"  // Change purple-50 to blue-50
```

---

## 📞 Support Resources

### Documentation
- FastAPI: https://fastapi.tiangolo.com/
- React: https://react.dev/
- Tailwind CSS: https://tailwindcss.com/

### APIs Used
- JokeAPI: https://jokeapi.dev/
- Dog API: https://dog.ceo/dog-api/
- Cat API: https://thecatapi.com/
- YouTube Embed: https://developers.google.com/youtube/player_parameters

---

## ✅ Success Checklist

- [ ] Backend running on port 8005
- [ ] Frontend running on port 5173
- [ ] Can enter mood text
- [ ] Mood is detected correctly
- [ ] Music plays in YouTube embed
- [ ] Jokes are displayed
- [ ] Images are shown
- [ ] "Want more?" buttons work
- [ ] Games suggestions appear
- [ ] No console errors

---

## 🎯 Next Steps

1. **Test thoroughly**: Try all mood types
2. **Customize**: Add your own content
3. **Document**: Take screenshots for your report
4. **Present**: Prepare demo for your class
5. **Enhance**: Add more features (graphs, statistics)

---

**Ready to Start? Follow the Quick Start section above! 🚀**

**Questions?** Check the main guide: `MENTAL_HEALTH_MOOD_TRACKER_GUIDE.md`
