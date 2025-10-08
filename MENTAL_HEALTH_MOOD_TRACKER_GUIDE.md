# Mental Health Agent - Mood Tracker Feature Implementation Guide 🎯

## 📚 Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Step-by-Step Implementation](#step-by-step-implementation)
4. [Testing Guide](#testing-guide)
5. [How It Works](#how-it-works)

---

## Overview

**Your Role**: Mental Health Agent Developer  
**Feature**: Mood Tracker with Intelligent Response System  
**Goal**: Create a system that:
1. Collects user mood data through a simple form
2. Identifies/classifies the user's mood
3. Suggests appropriate mood-fixing methods based on mood type
4. Provides interactive content (jokes, images, music, games)

**Technology Stack**:
- **Backend**: Python + FastAPI (Port 8005)
- **Frontend**: React + TypeScript + Tailwind CSS
- **Database**: MongoDB (for storing mood history)
- **APIs**: JokeAPI, YouTube Embed, Image APIs

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERFACE (React)                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  1. Mood Input Form                                  │   │
│  │     - Text input: "Tell me how you're feeling..."   │   │
│  │     - Quick buttons: "Sad", "Happy", "Anxious"      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              MENTAL HEALTH API (FastAPI)                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  2. Mood Analysis Endpoint                           │   │
│  │     POST /mental-health/analyze-mood                 │   │
│  │     - Analyzes text using NLP keywords               │   │
│  │     - Returns: mood type + confidence score          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│           MOOD-BASED RESPONSE SYSTEM                         │
│                                                               │
│  IF MOOD = SAD/ANGRY/ANXIOUS (Negative):                    │
│    1. Show funny jokes (JokeAPI) ──► Ask "Want more?"       │
│    2. Show funny images/stickers ──► Ask "Want more?"       │
│    3. Suggest calm/motivating music (YouTube)               │
│    4. Suggest funny online games (GameUV)                   │
│                                                               │
│  IF MOOD = HAPPY (Positive):                                 │
│    1. Show motivational images/quotes ──► Ask "Want more?"  │
│    2. Suggest happy/motivating music (YouTube)              │
│    3. Suggest fun online games (GameUV)                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Implementation

### ✅ STEP 1: Understanding the Current Code Structure

**What Already Exists**:
1. ✅ Backend API with mood analysis (`mental_health_routes.py`)
2. ✅ Frontend component (`EnhancedMentalHealthAgent.tsx`)
3. ✅ API service layer (`mentalHealthAPI.ts`)
4. ✅ YouTube integration for music
5. ✅ Joke and image fetching
6. ✅ Game suggestions (GameUV platform)

**Key Files You Need to Know**:
```
backend/
  └── app/
      └── routes/
          └── mental_health_routes.py    # Backend API endpoints

frontend/
  └── src/
      ├── components/
      │   └── EnhancedMentalHealthAgent.tsx   # Main React component
      └── services/
          └── mentalHealthAPI.ts          # API service functions
```

---

### ✅ STEP 2: Backend - Mood Analysis System

**File**: `backend/app/routes/mental_health_routes.py`

The backend already has a **mood analysis endpoint** that works like this:

```python
@router.post("/analyze-mood", response_model=MoodAnalysisResponse)
async def analyze_mood_from_text(request: MoodAnalysisRequest):
    """
    Analyzes user input text to detect mood
    Example input: "I'm feeling really sad today"
    Example output: {
        "detected_mood": "sad",
        "confidence": 0.85,
        "message": "I understand you're feeling sad...",
        "suggestions": ["Try some calming music", "Look at funny images"]
    }
    """
```

**How Mood Detection Works**:
1. User types: "I'm feeling sad and lonely"
2. Backend checks for keywords:
   - Sad keywords: ["sad", "depressed", "down", "unhappy", "lonely"]
   - Anxious keywords: ["anxious", "worried", "nervous", "stressed"]
   - Angry keywords: ["angry", "frustrated", "mad", "irritated"]
   - Happy keywords: ["happy", "great", "wonderful", "excited", "joyful"]
3. Returns the detected mood with confidence score

**Location in code** (Line 132-230 in `mental_health_routes.py`):
```python
def detect_mood_from_text(text: str) -> tuple[str, float]:
    text_lower = text.lower()
    
    # Keyword dictionaries
    mood_keywords = {
        "sad": ["sad", "depressed", "down", "unhappy", "lonely", "blue", "gloomy"],
        "anxious": ["anxious", "worried", "nervous", "stressed", "panic", "fear"],
        "angry": ["angry", "mad", "frustrated", "irritated", "furious"],
        "tired": ["tired", "exhausted", "sleepy", "fatigued", "weary"],
        "happy": ["happy", "joyful", "excited", "great", "wonderful", "fantastic"]
    }
    
    # Count matches and calculate confidence
    for mood, keywords in mood_keywords.items():
        if any(keyword in text_lower for keyword in keywords):
            return mood, 0.85  # High confidence
    
    return "unclear", 0.0  # No clear mood detected
```

---

### ✅ STEP 3: Frontend - User Interface for Mood Input

**File**: `frontend/src/components/EnhancedMentalHealthAgent.tsx`

**The Mood Input Form** (Lines 615-660):

```tsx
{/* Mood Input Section */}
<div className="mb-6">
  <label className="block text-purple-700 font-medium mb-2">
    💭 How are you feeling today?
  </label>
  <textarea
    value={userInput}
    onChange={(e) => setUserInput(e.target.value)}
    placeholder="Tell me how you're feeling... (e.g., 'I'm feeling really sad today' or 'I'm anxious about work')"
    className="w-full p-4 rounded-xl border-2 border-purple-200 focus:border-purple-400"
    rows={3}
  />
</div>

{/* Quick Mood Buttons */}
<div className="flex gap-3 flex-wrap">
  <button onClick={() => handleUserInput("I'm feeling sad")}>
    😢 Sad
  </button>
  <button onClick={() => handleUserInput("I'm feeling anxious")}>
    😰 Anxious
  </button>
  <button onClick={() => handleUserInput("I'm feeling happy")}>
    😊 Happy
  </button>
  <button onClick={() => handleUserInput("I'm feeling angry")}>
    😠 Angry
  </button>
</div>
```

**What This Does**:
1. User types their feelings in the textarea
2. Or clicks a quick button (e.g., "Sad")
3. Calls `handleUserInput()` function
4. Sends text to backend for mood analysis

---

### ✅ STEP 4: Mood Analysis & Response Flow

**File**: `frontend/src/components/EnhancedMentalHealthAgent.tsx` (Lines 200-290)

```tsx
const handleUserInput = async (input: string) => {
  if (!user) return
  
  setIsLoading(true)
  setUserInput('')

  try {
    // Step 1: Analyze mood from user input
    const moodAnalysis = await mentalHealthAPI.analyzeMood({
      text: input,
      user_id: user.id
    })

    // Step 2: Store mood entry
    const moodEntryId = saveMoodEntry({
      rating: 3,
      type: moodAnalysis.detected_mood as MoodType,
      notes: moodAnalysis.message
    })

    // Step 3: Start providing mood-based content
    await startMoodBasedContent(moodAnalysis.detected_mood, moodAnalysis)

  } catch (error) {
    console.error('Error handling user input:', error)
  } finally {
    setIsLoading(false)
  }
}
```

---

### ✅ STEP 5: Mood-Based Content Delivery System

**File**: `frontend/src/components/EnhancedMentalHealthAgent.tsx` (Lines 255-295)

This is the **CORE LOGIC** that decides what content to show based on mood:

```tsx
const startMoodBasedContent = async (mood: string, analysis: MoodAnalysisResponse) => {
  if (!user) return

  try {
    // Fetch content for user's mood
    const youtubeTrack = await mentalHealthAPI.getYouTubeTrack(mood)  // Music
    const joke = await mentalHealthAPI.getJoke()                       // Joke
    const funnyImage = await mentalHealthAPI.getFunnyImage()           // Image

    // Show interactive modal with all content
    showMoodSupportModal(mood, analysis, youtubeTrack, joke, funnyImage, moodEntryId)
    
  } catch (error) {
    console.error('Error starting mood-based content:', error)
  }
}
```

---

### ✅ STEP 6: Interactive Modal - The Response Interface

**File**: `frontend/src/components/EnhancedMentalHealthAgent.tsx` (Lines 298-550)

This creates a **beautiful modal** that shows:

**For SAD/ANGRY/ANXIOUS (Negative Moods)**:
1. 😂 **Jokes Section**
   - Shows a random joke
   - Button: "🎭 Want another joke?"
   - When clicked: Fetches new joke from JokeAPI

2. 🖼️ **Funny Images Section**
   - Shows cute animal images
   - Button: "🖼️ Show another image"
   - When clicked: Fetches new funny image

3. 🎵 **Music Section**
   - Embeds YouTube video with calming/motivating music
   - Shows: Artist name, song title
   - Auto-plays calming tracks (e.g., "Weightless" by Marconi Union)

4. 🎮 **Games Section**
   - Button: "🎮 Play Fun Games"
   - Opens GameUV platform with fun games
   - Games: Smile Challenge, Bubble Pop, Stress Ball, etc.

**For HAPPY (Positive Mood)**:
1. 💭 **Motivational Quotes & Images**
   - Shows inspiring quotes
   - Shows motivational images
   - Button: "✨ Show more inspiration"

2. 🎵 **Happy Music**
   - Upbeat songs (e.g., "Happy" by Pharrell Williams)
   - Button: "🎵 Play another song"

3. 🎮 **Fun Games**
   - Same game platform but suggests achievement-based games

---

### ✅ STEP 7: API Service Layer

**File**: `frontend/src/services/mentalHealthAPI.ts`

This file contains helper functions to call backend APIs:

```typescript
// 1. Analyze mood
async analyzeMood(request: MoodAnalysisRequest): Promise<MoodAnalysisResponse> {
  const response = await axios.post(`${this.baseURL}/analyze-mood`, request)
  return response.data
}

// 2. Get YouTube track for mood
async getYouTubeTrack(mood: string): Promise<YouTubeTrackResponse> {
  const response = await axios.get(`${this.baseURL}/youtube/${mood}`)
  return response.data
}

// 3. Get random joke
async getJoke(): Promise<JokeResponse> {
  const response = await axios.get(`${this.baseURL}/joke`)
  return response.data
}

// 4. Get funny image
async getFunnyImage(): Promise<FunnyImageResponse> {
  const response = await axios.get(`${this.baseURL}/funny-image`)
  return response.data
}
```

---

### ✅ STEP 8: YouTube Music Integration

**File**: `backend/app/routes/mental_health_routes.py` (Lines 54-100)

The backend has **curated playlists** for each mood:

```python
YOUTUBE_PLAYLISTS = {
    "sad": [
        {"title": "Weightless", "artist": "Marconi Union", "youtube_id": "UfcAVejslrU"},
        {"title": "Claire de Lune", "artist": "Claude Debussy", "youtube_id": "CvFH_6DNRCY"},
        {"title": "Gymnopédie No. 1", "artist": "Erik Satie", "youtube_id": "S-Xm7s9eGM8"}
    ],
    "anxious": [
        {"title": "Breathe Me", "artist": "Sia", "youtube_id": "hSH7fblcGWM"},
        {"title": "River", "artist": "Leon Bridges", "youtube_id": "0Hegd4xNfRo"}
    ],
    "angry": [
        {"title": "Happy", "artist": "Pharrell Williams", "youtube_id": "ZbZSe6N_BXs"},
        {"title": "Shake It Off", "artist": "Taylor Swift", "youtube_id": "nfWlot6h_JM"}
    ],
    "happy": [
        {"title": "Walking on Sunshine", "artist": "Katrina and the Waves"},
        {"title": "Good Vibrations", "artist": "The Beach Boys"}
    ]
}
```

**The YouTube Embed**:
```tsx
<iframe 
  width="100%" 
  height="315" 
  src={`https://www.youtube.com/embed/${youtubeTrack.youtube_id}`}
  title={youtubeTrack.title}
  frameBorder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
/>
```

---

### ✅ STEP 9: Joke Delivery System

**Backend Endpoint** (`mental_health_routes.py`, Lines 260-295):

```python
@router.get("/joke", response_model=JokeResponse)
async def get_joke():
    """Fetch a random joke from JokeAPI"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Call JokeAPI
            response = await client.get(
                "https://v2.jokeapi.dev/joke/Any",
                params={
                    "safe-mode": True,
                    "type": "single,twopart",
                    "blacklistFlags": "nsfw,religious,political,racist,sexist,explicit"
                }
            )
            
            data = response.json()
            
            # Format joke
            if data["type"] == "single":
                joke_text = data["joke"]
            else:
                joke_text = f"{data['setup']} ... {data['delivery']}"
            
            return JokeResponse(
                joke=joke_text,
                type=data["type"],
                safe=data.get("safe", True),
                source="JokeAPI"
            )
    except Exception as e:
        # Fallback jokes if API fails
        fallback_jokes = [
            "Why don't scientists trust atoms? Because they make up everything! 😄",
            "What do you call a bear with no teeth? A gummy bear! 🐻"
        ]
        return JokeResponse(
            joke=random.choice(fallback_jokes),
            type="single",
            safe=True,
            source="local"
        )
```

---

### ✅ STEP 10: Image Delivery System

**Backend Endpoint** (`mental_health_routes.py`, Lines 297-350):

```python
@router.get("/funny-image", response_model=FunnyImageResponse)
async def get_funny_image():
    """Fetch a funny/cute animal image"""
    try:
        # Try Dog API first
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get("https://dog.ceo/api/breeds/image/random")
            data = response.json()
            
            return FunnyImageResponse(
                url=data["message"],
                description="Cute dog picture to brighten your day! 🐕",
                type="dog",
                caption="Look at this adorable pup! 🐶❤️"
            )
    except:
        # Fallback to Cat API
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get("https://api.thecatapi.com/v1/images/search")
                data = response.json()
                
                return FunnyImageResponse(
                    url=data[0]["url"],
                    description="Cute cat picture to brighten your day! 🐱",
                    type="cat",
                    caption="Meow! Look at this cutie! 😺💕"
                )
        except:
            # Final fallback
            return FunnyImageResponse(
                url="https://placekitten.com/400/300",
                description="Here's a cute kitten! 🐱",
                type="cat",
                caption="Adorable kitten placeholder 😸"
            )
```

---

### ✅ STEP 11: Game Integration (GameUV Platform)

**The Modal shows game suggestions** (Lines 450-520):

```tsx
{/* Games Section */}
<div className="bg-gradient-to-r from-pink-50 to-pink-100 rounded-2xl p-6">
  <h3 className="text-2xl font-bold text-pink-900 mb-4">
    🎮 Fun Games to Brighten Your Mood
  </h3>
  
  <p className="text-pink-700 mb-4">
    Try these fun games to lift your spirits:
  </p>
  
  <div className="grid grid-cols-2 gap-3">
    <button 
      onClick={() => window.startSmileChallenge?.()}
      className="p-4 bg-white rounded-lg hover:shadow-lg transition-all"
    >
      😊 Smile Challenge
    </button>
    
    <button 
      onClick={() => openGameUVPlatform()}
      className="p-4 bg-white rounded-lg hover:shadow-lg transition-all"
    >
      🎮 More Games
    </button>
  </div>
  
  {/* Ask for more games */}
  <button 
    onClick={nextGame}
    className="mt-4 px-6 py-3 bg-pink-500 text-white rounded-lg"
  >
    🎮 Suggest More Games
  </button>
</div>
```

---

## How It Works - Complete User Flow

### **Scenario 1: User is SAD** 😢

1. **User Input**:
   ```
   User types: "I'm feeling really sad and lonely today"
   ```

2. **Backend Analysis**:
   ```json
   {
     "detected_mood": "sad",
     "confidence": 0.85,
     "message": "I understand you're feeling sad. Let me help cheer you up!",
     "suggestions": ["Try some calming music", "Look at funny images"]
   }
   ```

3. **Frontend Response**:
   - 🎵 Shows YouTube embed with "Weightless" by Marconi Union (calming music)
   - 😂 Shows random joke: "Why did the scarecrow win an award? He was outstanding in his field!"
   - 🖼️ Shows cute dog image with caption
   - 🎮 Suggests "Smile Challenge" game
   
4. **Interactive Loop**:
   ```
   User clicks: "🎭 Want another joke?"
   → System fetches new joke
   → Shows: "What do you call a fake noodle? An impasta! 🍝"
   
   User clicks: "🖼️ Show another image"
   → System fetches new image
   → Shows: Cute cat playing with yarn
   
   User clicks: "🎵 Suggest more music"
   → System shows next track: "Claire de Lune" by Debussy
   ```

---

### **Scenario 2: User is HAPPY** 😊

1. **User Input**:
   ```
   User types: "I'm feeling great today!"
   ```

2. **Backend Analysis**:
   ```json
   {
     "detected_mood": "happy",
     "confidence": 0.90,
     "message": "That's wonderful! Let's keep that positive energy going!",
     "suggestions": ["Listen to upbeat music", "Try achievement games"]
   }
   ```

3. **Frontend Response**:
   - 🎵 Shows "Happy" by Pharrell Williams
   - 💭 Shows motivational quote: "You're amazing! Keep shining! ✨"
   - 🖼️ Shows inspiring image
   - 🎮 Suggests achievement-based games

4. **Interactive Loop**:
   ```
   User clicks: "✨ Show more inspiration"
   → System shows: "Every day is a fresh start! 🌅"
   
   User clicks: "🎵 Play another song"
   → System shows: "Walking on Sunshine" by Katrina and the Waves
   ```

---

## Testing Guide

### 🧪 How to Test Your Implementation

**Step 1: Start Backend**
```bash
cd backend
python -m uvicorn main:app --reload --port 8005
```

**Step 2: Start Frontend**
```bash
cd frontend
npm run dev
```

**Step 3: Open Browser**
```
http://localhost:5173
```

**Step 4: Test Scenarios**

| Test Case | Input | Expected Mood | Expected Content |
|-----------|-------|---------------|------------------|
| Test 1 | "I'm sad" | sad | Calming music + Jokes + Images |
| Test 2 | "I'm anxious" | anxious | Meditation music + Calming content |
| Test 3 | "I'm angry" | angry | Upbeat music + Funny jokes |
| Test 4 | "I'm happy" | happy | Motivational quotes + Happy music |
| Test 5 | "I feel great!" | happy | Inspiring images + Achievement games |

---

## Key Features Explanation

### 🎯 **1. Mood Detection (NLP)**
- Uses keyword matching to identify emotions
- Confidence scoring (0.0 to 1.0)
- Handles multiple keywords in one sentence

### 🎵 **2. Music Therapy**
- YouTube embed integration
- Curated playlists for each mood
- Auto-play with controls

### 😂 **3. Humor Therapy**
- JokeAPI integration (safe jokes only)
- Interactive "Want another?" button
- Fallback jokes if API fails

### 🖼️ **4. Visual Therapy**
- Dog API & Cat API integration
- Cute animal images
- Cycling through multiple images

### 🎮 **5. Game Therapy**
- GameUV platform integration
- Smile Challenge mini-game
- Mood-appropriate game suggestions

### 💾 **6. Data Storage**
- Mood entries saved to localStorage
- Intervention history tracking
- User preference learning

---

## Summary - What You Need to Understand

### **Your Mental Health Agent Flow**:

```
USER → Types Feelings
  ↓
MOOD ANALYSIS → Detects emotion (sad/happy/anxious/angry)
  ↓
CONTENT SELECTION → Chooses appropriate response
  ↓
MODAL DISPLAY → Shows jokes, images, music, games
  ↓
INTERACTIVE LOOP → "Want more?" buttons
  ↓
HISTORY STORAGE → Saves all interactions
```

### **Technologies Used**:
1. **React** - User interface
2. **FastAPI** - Backend API
3. **MongoDB** - Data storage (optional, using localStorage for now)
4. **JokeAPI** - Joke delivery
5. **Dog/Cat APIs** - Funny images
6. **YouTube API** - Music therapy
7. **GameUV** - Game platform

---

## Next Steps for You

1. ✅ **Understand the Code**: Read through the files mentioned above
2. ✅ **Test the System**: Run backend and frontend, try different moods
3. ✅ **Customize Content**: Add your own jokes, music, or games
4. ✅ **Enhance UI**: Modify colors, layouts, animations
5. ✅ **Add Features**: Implement mood tracking graphs, history analysis

---

## Important Files Reference

| File | Purpose | Location |
|------|---------|----------|
| `mental_health_routes.py` | Backend API endpoints | `backend/app/routes/` |
| `EnhancedMentalHealthAgent.tsx` | Main React component | `frontend/src/components/` |
| `mentalHealthAPI.ts` | API service layer | `frontend/src/services/` |
| `main.py` | Backend entry point | `backend/` |

---

## Questions to Help You Learn

1. **Q: How does the system detect mood?**
   - A: By checking keywords in user input (e.g., "sad", "happy")

2. **Q: Where are mood entries stored?**
   - A: In browser localStorage (key: `moodEntries_{userId}`)

3. **Q: How does "Want another joke?" work?**
   - A: Calls `mentalHealthAPI.getJoke()` again to fetch new joke

4. **Q: Can I add more moods?**
   - A: Yes! Add keywords to `mood_keywords` dict in backend

5. **Q: How to add more songs?**
   - A: Add to `YOUTUBE_PLAYLISTS` dict in `mental_health_routes.py`

---

## 🎓 Learning Resources

- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **React Docs**: https://react.dev/
- **JokeAPI**: https://jokeapi.dev/
- **YouTube Embed**: https://developers.google.com/youtube/iframe_api_reference

---

**Status**: ✅ Feature is already implemented and working!  
**Your Task**: Understand how it works, test it, and customize it!

Good luck with your university project! 🎓🚀
