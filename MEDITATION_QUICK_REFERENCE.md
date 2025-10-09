# 🧘 Meditation Feature - Quick Reference Guide

## 🎯 Quick Start

### Test the APIs Right Now!

1. **Backend is running:** http://localhost:8004
2. **API Docs:** http://localhost:8004/docs
3. **Frontend:** http://localhost:5173

---

## 📋 6 Meditation Techniques Available

| Technique | ID | Duration | Difficulty | Best For |
|-----------|-----|----------|------------|----------|
| **Mindfulness Breathing** 🌬️ | `mindfulness_breathing` | 5 min | Beginner | Anxiety, stress, focus |
| **Walking Meditation** 🚶 | `walking_meditation` | 10 min | Beginner | Restlessness, grounding |
| **Body Scan** 🧘 | `body_scan` | 15 min | Beginner | Tension, insomnia |
| **Loving-Kindness** 💝 | `loving_kindness` | 10 min | Intermediate | Self-compassion, sadness |
| **Box Breathing** 📦 | `box_breathing` | 5 min | Beginner | Panic, acute stress |
| **Guided Visualization** 🌅 | `guided_visualization` | 15 min | Intermediate | Stress relief, mood boost |

---

## 🔗 API Endpoints (5 Total)

### 1. Get All Techniques
```
GET http://localhost:8004/mental-health/meditation/techniques
GET http://localhost:8004/mental-health/meditation/techniques?category=breathing
GET http://localhost:8004/mental-health/meditation/techniques?difficulty=beginner
```

### 2. Get Specific Technique
```
GET http://localhost:8004/mental-health/meditation/techniques/mindfulness_breathing
```

### 3. Save Session
```
POST http://localhost:8004/mental-health/meditation/session
Content-Type: application/json

{
  "user_id": "dehemibasnayake201@gmail.com",
  "technique_id": "mindfulness_breathing",
  "duration_seconds": 300,
  "completed": true,
  "mood_before": "anxious",
  "mood_after": "calm",
  "notes": "Felt great!"
}
```

### 4. Get History
```
GET http://localhost:8004/mental-health/meditation/history/dehemibasnayake201@gmail.com
GET http://localhost:8004/mental-health/meditation/history/dehemibasnayake201@gmail.com?days=7
```

### 5. Get Recommendation
```
GET http://localhost:8004/mental-health/meditation/recommend/dehemibasnayake201@gmail.com
GET http://localhost:8004/mental-health/meditation/recommend/dehemibasnayake201@gmail.com?mood=anxious
```

---

## 🧪 Quick Test Commands

```bash
# Test 1: Get all techniques
curl http://localhost:8004/mental-health/meditation/techniques

# Test 2: Get breathing techniques
curl "http://localhost:8004/mental-health/meditation/techniques?category=breathing"

# Test 3: Get mindfulness breathing details
curl http://localhost:8004/mental-health/meditation/techniques/mindfulness_breathing

# Test 4: Save a session
curl -X POST http://localhost:8004/mental-health/meditation/session \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test@example.com","technique_id":"mindfulness_breathing","duration_seconds":300,"completed":true,"mood_before":"anxious","mood_after":"calm"}'

# Test 5: Get history
curl http://localhost:8004/mental-health/meditation/history/test@example.com

# Test 6: Get recommendation
curl "http://localhost:8004/mental-health/meditation/recommend/test@example.com?mood=anxious"
```

---

## 📊 What Each Endpoint Returns

### Get Techniques
Returns array of techniques with:
- id, name, duration, difficulty, description
- benefits list
- step-by-step instructions
- tips
- category

### Save Session
Returns:
- success status
- session_id (MongoDB ObjectId)
- confirmation message
- duration_minutes (calculated)

### Get History
Returns:
- date_range
- statistics (total sessions, completion rate, total minutes, streak)
- technique_breakdown (count and minutes per technique)
- sessions array (full session details)

### Get Recommendation
Returns:
- recommended_technique (full details + score)
- alternative_techniques (top 3 alternatives)
- reasoning (why this was recommended)

---

## 💾 Database Collections

### `meditation_sessions`
Stores meditation session records with:
- user_id, technique info, duration
- completion status, notes
- mood before/after
- timestamp and session_date

### `mental_health_history`
Also stores meditation sessions for unified history:
- type: "meditation"
- content: technique details, mood, notes
- timestamp, session_id

---

## 🎨 Frontend Integration

### Example TypeScript Code

```typescript
// Get all techniques
const techniques = await fetch(
  'http://localhost:8004/mental-health/meditation/techniques'
).then(res => res.json());

// Start a meditation session
const saveSession = async () => {
  const response = await fetch(
    'http://localhost:8004/mental-health/meditation/session',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'user@example.com',
        technique_id: 'mindfulness_breathing',
        duration_seconds: 300,
        completed: true,
        mood_before: 'anxious',
        mood_after: 'calm'
      })
    }
  );
  return response.json();
};

// Get recommendation
const recommendation = await fetch(
  'http://localhost:8004/mental-health/meditation/recommend/user@example.com?mood=anxious'
).then(res => res.json());
```

---

## 📖 Mindfulness Breathing - Full Example

### Benefits:
- Reduces stress and anxiety
- Improves focus and concentration
- Lowers blood pressure
- Enhances emotional regulation
- Clears negative thoughts (even in 60 seconds!)

### Steps:
1. Find a quiet, comfortable place to sit with your back straight and feet flat on the floor.
2. Close your eyes gently or keep them half-open with a soft gaze downward.
3. Begin by taking a few deep breaths, inhaling through your nose and exhaling through your mouth.
4. Now breathe naturally. Don't try to control your breath – just observe it.
5. Notice the sensation of air moving in and out of your nostrils.
6. Feel your chest and belly rising and falling with each breath.
7. When your mind wanders (and it will), acknowledge the thought without judgment.
8. Gently bring your attention back to your breathing.
9. Continue for 1-10 minutes. Even 60 seconds can help clear negative thoughts.
10. When ready, slowly open your eyes and take a moment before moving.

### Tips:
- Start with just 1-2 minutes if you're new to meditation
- Set a gentle timer so you don't worry about time
- It's normal for your mind to wander – that's part of the practice
- Practice at the same time each day to build a habit
- Don't judge yourself for 'doing it wrong' – there's no wrong way

---

## 🚶 Walking Meditation - Full Example

### Benefits:
- Combines physical activity with mindfulness
- Grounds you in the present moment
- Reduces racing thoughts
- Improves body awareness
- Can be done anywhere

### Steps:
1. Select a quiet path that is approximately 10 to 30 steps long (can be indoors or outdoors).
2. Stand at one end of your path with feet hip-width apart, hands resting comfortably.
3. Take a moment to feel your body standing – notice your posture and balance.
4. Begin walking at a slower pace than usual, about half your normal speed.
5. Pay attention to the sensation in your feet and legs as you walk.
6. Notice each foot lifting off the ground – feel the weight shift.
7. Feel the foot moving through the air.
8. Notice the foot touching back down – heel, then toe.
9. Be aware of the weight transferring to that foot.
10. When you reach the end of your path, pause, turn slowly, and walk back.
11. If your mind wanders to thoughts or sounds, acknowledge them and return focus to walking.
12. Continue for 10-20 minutes, maintaining slow, deliberate steps.

### Tips:
- You can walk in a straight line back and forth, or in a circle
- Keep your gaze soft, looking a few feet ahead
- Let your arms swing naturally or hold hands in front/behind
- If you feel dizzy, you're walking too slowly – speed up slightly
- Try walking barefoot to enhance sensory awareness

---

## ✅ Implementation Checklist

### Backend (COMPLETE ✅)
- [x] 6 meditation techniques with full details
- [x] 5 REST API endpoints
- [x] MongoDB integration
- [x] Session tracking
- [x] History and statistics
- [x] Personalized recommendations
- [x] Mood-based suggestions
- [x] Comprehensive documentation

### Frontend (TODO ⏳)
- [ ] Create meditation API service
- [ ] Build technique list component
- [ ] Implement technique detail view
- [ ] Add meditation timer
- [ ] Create session saving flow
- [ ] Build history/statistics dashboard
- [ ] Add recommendation widget
- [ ] Implement progress charts

---

## 📚 Full Documentation

1. **MEDITATION_API_DOCUMENTATION.md** - Complete API reference with examples
2. **MEDITATION_FEATURE_COMPLETE.md** - Implementation summary
3. **This file** - Quick reference guide

---

## 🎉 Ready to Use!

**Backend Server:** Running on http://localhost:8004  
**API Documentation:** http://localhost:8004/docs  
**Test with:** cURL, Postman, or Swagger UI  

All meditation APIs are live and ready for frontend integration! 🚀
