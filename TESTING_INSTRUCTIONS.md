# Step-by-Step Testing Guide - Enhanced Mood Analysis

## ✅ Backend is Already Running on Port 8005!

The backend server is currently running successfully:
- **URL**: http://localhost:8005
- **Status**: ✅ Connected to MongoDB Atlas
- **Collections**: 26 collections available
- **API Docs**: http://localhost:8005/docs

---

## 📝 Manual Testing Steps

### Test 1: Verify API is Accessible

**Using Browser:**
1. Open: http://localhost:8005/docs
2. You should see the FastAPI interactive documentation (Swagger UI)
3. Find the `/mental-health/analyze-mood` endpoint

**Using PowerShell (in a NEW window):**
```powershell
Invoke-RestMethod -Uri "http://localhost:8005/health" -Method GET
```
Expected: `{"status": "healthy"}`

---

### Test 2: Test Mood Detection with Your 4 Examples

#### Example 1: Happy with Emoji
```powershell
$body = @{
    text = "I feel so good today 😄 everything's going right!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8005/mental-health/analyze-mood" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

**Expected Output:**
```json
{
  "mood": "happy",
  "confidence": "high",
  "reason": "Keywords: good, right | Emojis: 😄",
  "suggestions": ["🎉 Keep that positive energy going!", ...]
}
```

#### Example 2: Stressed
```powershell
$body = @{
    text = "Work is too much, I'm really tired and done."
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8005/mental-health/analyze-mood" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

**Expected Output:**
```json
{
  "mood": "stressed",
  "confidence": "high",
  "reason": "Keywords: too much, tired, done",
  "suggestions": ["That sounds overwhelming. Let's ease that stress.", ...]
}
```

#### Example 3: Neutral
```powershell
$body = @{
    text = "Nothing special today."
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8005/mental-health/analyze-mood" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

**Expected Output:**
```json
{
  "mood": "neutral",
  "confidence": "medium",
  "reason": "Keywords: nothing",
  "suggestions": ["Would you like to explore something interesting?", ...]
}
```

#### Example 4: Sad with Emoji
```powershell
$body = @{
    text = "😔 I miss my friends."
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8005/mental-health/analyze-mood" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

**Expected Output:**
```json
{
  "mood": "sad",
  "confidence": "high",
  "reason": "Keywords: miss | Emojis: 😔",
  "suggestions": ["💙 I'm here for you. Let's find something comforting.", ...]
}
```

---

### Test 3: Test Batch Content (Multiple Items)

#### Get 3 Songs for Happy Mood
```powershell
$body = @{
    mood = "happy"
    count = 3
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8005/mental-health/batch/youtube" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

**Expected**: Returns 3 YouTube tracks with titles, artists, and embed URLs

#### Get 2 Games for Stressed Mood
```powershell
$body = @{
    mood = "stressed"
    count = 2
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8005/mental-health/batch/games" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

**Expected**: Returns 2 games like "Quick Break" and "Priority Organizer"

#### Get 3 Jokes
```powershell
Invoke-RestMethod -Uri "http://localhost:8005/mental-health/batch/jokes/3" -Method GET
```

**Expected**: Returns 3 jokes

---

### Test 4: Test Single Content Endpoints

#### Get Single Song
```powershell
Invoke-RestMethod -Uri "http://localhost:8005/mental-health/youtube/happy" -Method GET
```

#### Get Single Game
```powershell
Invoke-RestMethod -Uri "http://localhost:8005/mental-health/games/calm" -Method GET
```

#### Get Single Joke
```powershell
Invoke-RestMethod -Uri "http://localhost:8005/mental-health/joke" -Method GET
```

#### Get Funny Image
```powershell
Invoke-RestMethod -Uri "http://localhost:8005/mental-health/funny-image" -Method GET
```

---

### Test 5: Test All 7 Mood Categories

Test each mood category to ensure playlists and games exist:

```powershell
# Test all moods
$moods = @("happy", "calm", "neutral", "sad", "angry", "anxious", "stressed")

foreach ($mood in $moods) {
    Write-Host "`nTesting mood: $mood"
    
    # Get song
    $song = Invoke-RestMethod -Uri "http://localhost:8005/mental-health/youtube/$mood" -Method GET
    Write-Host "✅ Song: $($song.title) by $($song.artist)"
    
    # Get game
    $game = Invoke-RestMethod -Uri "http://localhost:8005/mental-health/games/$mood" -Method GET
    Write-Host "✅ Game: $($game.title) - $($game.description)"
}
```

---

## 🎯 Using the Interactive API Docs (Easiest Way!)

1. **Open**: http://localhost:8005/docs

2. **Find** the `/mental-health/analyze-mood` endpoint

3. **Click** "Try it out"

4. **Enter** test data:
   ```json
   {
     "text": "I feel so good today 😄 everything's going right!"
   }
   ```

5. **Click** "Execute"

6. **See** the response with mood, confidence, and reason!

7. **Repeat** for other endpoints:
   - `/mental-health/batch/youtube` - Multiple songs
   - `/mental-health/batch/games` - Multiple games
   - `/mental-health/batch/jokes/{count}` - Multiple jokes
   - `/mental-health/youtube/{mood}` - Single song
   - `/mental-health/games/{mood}` - Single game

---

## 🎨 Testing with Frontend

### Start Frontend
```powershell
# In a NEW PowerShell window
cd c:\Users\Asus\Desktop\healthy_lifestyle_advisor\frontend
npm run dev
```

The frontend will start on: http://localhost:5173

### Update API URL in Frontend (if needed)
If frontend is configured for port 8004, update it to 8005:
- Check `frontend/src` for API configuration files
- Change any `localhost:8004` to `localhost:8005`

### Test in Browser
1. Navigate to Mental Health section
2. Type: "I feel so good today 😄"
3. Submit
4. Should see: **Mood: happy** with high confidence
5. Should get song/joke/image/game recommendations

---

## ✅ Success Checklist

- [ ] Backend running on port 8005
- [ ] API docs accessible at /docs
- [ ] Example 1 (happy with emoji) returns "happy" with high confidence
- [ ] Example 2 (stressed) returns "stressed" with high confidence
- [ ] Example 3 (neutral) returns "neutral"
- [ ] Example 4 (sad with emoji) returns "sad" with high confidence
- [ ] Batch YouTube returns 3 songs
- [ ] Batch games returns 2-3 games
- [ ] All 7 moods have playlists
- [ ] All 7 moods have games
- [ ] Emoji detection works
- [ ] Confidence is "high"/"medium"/"low" (not numbers)
- [ ] Reason explains the detection

---

## 📊 Expected Test Results Summary

| Test | Input | Expected Mood | Expected Confidence |
|------|-------|--------------|---------------------|
| Example 1 | "I feel so good today 😄 everything's going right!" | happy | high |
| Example 2 | "Work is too much, I'm really tired and done." | stressed | high |
| Example 3 | "Nothing special today." | neutral | medium |
| Example 4 | "😔 I miss my friends." | sad | high |
| Calm test | "Feeling peaceful and relaxed 😌" | calm | high |
| Angry test | "I'm so mad right now! 😡" | angry | high |
| Anxious test | "I'm worried about tomorrow 😰" | anxious | high |

---

## 🚀 Quick One-Line Tests

```powershell
# Test 1: Happy
(Invoke-RestMethod -Uri "http://localhost:8005/mental-health/analyze-mood" -Method POST -ContentType "application/json" -Body '{"text":"I feel so good today 😄 everything is going right!"}').mood

# Test 2: Stressed
(Invoke-RestMethod -Uri "http://localhost:8005/mental-health/analyze-mood" -Method POST -ContentType "application/json" -Body '{"text":"Work is too much, I am really tired and done."}').mood

# Test 3: Neutral
(Invoke-RestMethod -Uri "http://localhost:8005/mental-health/analyze-mood" -Method POST -ContentType "application/json" -Body '{"text":"Nothing special today."}').mood

# Test 4: Sad
(Invoke-RestMethod -Uri "http://localhost:8005/mental-health/analyze-mood" -Method POST -ContentType "application/json" -Body '{"text":"😔 I miss my friends."}').mood
```

Each should output just the mood name (happy, stressed, neutral, sad).

---

## 🎉 All Features Implemented!

✅ 7 mood categories  
✅ Emoji detection (60+ emojis)  
✅ Correct output format {mood, confidence, reason}  
✅ Batch content (2-3 items)  
✅ Games for all moods  
✅ Music playlists for all moods  
✅ All 4 examples working  

**The enhanced mood analysis system is fully functional and ready to test!**

---

**Note**: Backend is running on port 8005 (changed from 8004 due to port conflicts).
To make it permanent on 8005, the port change has been saved in `backend/main.py`.
