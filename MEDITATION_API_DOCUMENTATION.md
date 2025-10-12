# 🧘 Meditation Feature - API Documentation

## Overview

The Meditation Feature provides comprehensive guided meditation techniques with step-by-step instructions, progress tracking, and personalized recommendations. This feature helps users manage stress, anxiety, and improve overall mental well-being.

## Features

- ✅ 6 Different meditation techniques (Mindfulness Breathing, Walking Meditation, Body Scan, Loving-Kindness, Box Breathing, Guided Visualization)
- ✅ Detailed step-by-step instructions for each technique
- ✅ Difficulty levels (Beginner, Intermediate, Advanced)
- ✅ Session tracking with duration and completion status
- ✅ Mood tracking (before/after meditation)
- ✅ History and statistics (streak, total minutes, completion rate)
- ✅ Personalized recommendations based on mood and practice history
- ✅ Automatic saving to unified mental health history

---

## API Endpoints

### 1. Get All Meditation Techniques

**Endpoint:** `GET /mental-health/meditation/techniques`

**Description:** Retrieve all available meditation techniques with optional filtering.

**Query Parameters:**
- `category` (optional): Filter by category
  - Values: `breathing`, `movement`, `relaxation`, `compassion`, `visualization`
- `difficulty` (optional): Filter by difficulty level
  - Values: `beginner`, `intermediate`, `advanced`

**Request Example:**
```http
GET http://localhost:8004/mental-health/meditation/techniques
GET http://localhost:8004/mental-health/meditation/techniques?category=breathing
GET http://localhost:8004/mental-health/meditation/techniques?difficulty=beginner
```

**Response (200 OK):**
```json
[
  {
    "id": "mindfulness_breathing",
    "name": "Mindfulness Breathing",
    "duration_minutes": 5,
    "difficulty": "beginner",
    "description": "A simple yet powerful technique to anchor yourself in the present moment through conscious breathing.",
    "benefits": [
      "Reduces stress and anxiety",
      "Improves focus and concentration",
      "Lowers blood pressure",
      "Enhances emotional regulation",
      "Clears negative thoughts"
    ],
    "steps": [
      "Find a quiet, comfortable place to sit with your back straight and feet flat on the floor.",
      "Close your eyes gently or keep them half-open with a soft gaze downward.",
      "Begin by taking a few deep breaths, inhaling through your nose and exhaling through your mouth.",
      "Now breathe naturally. Don't try to control your breath – just observe it.",
      "Notice the sensation of air moving in and out of your nostrils.",
      "Feel your chest and belly rising and falling with each breath.",
      "When your mind wanders (and it will), acknowledge the thought without judgment.",
      "Gently bring your attention back to your breathing.",
      "Continue for 1-10 minutes. Even 60 seconds can help clear negative thoughts.",
      "When ready, slowly open your eyes and take a moment before moving."
    ],
    "tips": [
      "Start with just 1-2 minutes if you're new to meditation",
      "Set a gentle timer so you don't worry about time",
      "It's normal for your mind to wander – that's part of the practice",
      "Practice at the same time each day to build a habit",
      "Don't judge yourself for 'doing it wrong' – there's no wrong way"
    ],
    "category": "breathing"
  },
  {
    "id": "walking_meditation",
    "name": "Walking Meditation",
    "duration_minutes": 10,
    "difficulty": "beginner",
    "description": "Transform ordinary walking into a mindful practice by bringing full awareness to the movement of your body.",
    "benefits": [
      "Combines physical activity with mindfulness",
      "Grounds you in the present moment",
      "Reduces racing thoughts",
      "Improves body awareness",
      "Can be done anywhere"
    ],
    "steps": [
      "Select a quiet path that is approximately 10 to 30 steps long (can be indoors or outdoors).",
      "Stand at one end of your path with feet hip-width apart, hands resting comfortably.",
      "Take a moment to feel your body standing – notice your posture and balance.",
      "Begin walking at a slower pace than usual, about half your normal speed.",
      "Pay attention to the sensation in your feet and legs as you walk.",
      "Notice each foot lifting off the ground – feel the weight shift.",
      "Feel the foot moving through the air.",
      "Notice the foot touching back down – heel, then toe.",
      "Be aware of the weight transferring to that foot.",
      "When you reach the end of your path, pause, turn slowly, and walk back.",
      "If your mind wanders to thoughts or sounds, acknowledge them and return focus to walking.",
      "Continue for 10-20 minutes, maintaining slow, deliberate steps."
    ],
    "tips": [
      "You can walk in a straight line back and forth, or in a circle",
      "Keep your gaze soft, looking a few feet ahead",
      "Let your arms swing naturally or hold hands in front/behind",
      "If you feel dizzy, you're walking too slowly – speed up slightly",
      "Try walking barefoot to enhance sensory awareness"
    ],
    "category": "movement"
  }
  // ... more techniques
]
```

---

### 2. Get Specific Meditation Technique

**Endpoint:** `GET /mental-health/meditation/techniques/{technique_id}`

**Description:** Get detailed information about a specific meditation technique.

**Path Parameters:**
- `technique_id` (required): ID of the meditation technique
  - Available IDs: `mindfulness_breathing`, `walking_meditation`, `body_scan`, `loving_kindness`, `box_breathing`, `guided_visualization`

**Request Example:**
```http
GET http://localhost:8004/mental-health/meditation/techniques/mindfulness_breathing
```

**Response (200 OK):**
```json
{
  "id": "mindfulness_breathing",
  "name": "Mindfulness Breathing",
  "duration_minutes": 5,
  "difficulty": "beginner",
  "description": "A simple yet powerful technique to anchor yourself in the present moment through conscious breathing.",
  "benefits": [
    "Reduces stress and anxiety",
    "Improves focus and concentration",
    "Lowers blood pressure",
    "Enhances emotional regulation",
    "Clears negative thoughts"
  ],
  "steps": [
    "Find a quiet, comfortable place to sit...",
    "Close your eyes gently...",
    // ... all 10 steps
  ],
  "tips": [
    "Start with just 1-2 minutes if you're new to meditation",
    "Set a gentle timer so you don't worry about time",
    // ... all tips
  ],
  "category": "breathing"
}
```

**Error Response (404 Not Found):**
```json
{
  "detail": "Meditation technique 'invalid_id' not found"
}
```

---

### 3. Save Meditation Session

**Endpoint:** `POST /mental-health/meditation/session`

**Description:** Save a completed or in-progress meditation session to the user's history.

**Request Body:**
```json
{
  "user_id": "dehemibasnayake201@gmail.com",
  "technique_id": "mindfulness_breathing",
  "duration_seconds": 300,
  "completed": true,
  "notes": "Felt more relaxed after this session",
  "mood_before": "anxious",
  "mood_after": "calm"
}
```

**Request Body Parameters:**
- `user_id` (required, string): User's email or ID
- `technique_id` (required, string): ID of the meditation technique used
- `duration_seconds` (required, integer): Duration of the session in seconds
- `completed` (required, boolean): Whether the session was completed
- `notes` (optional, string): User's notes about the session
- `mood_before` (optional, string): User's mood before meditation
- `mood_after` (optional, string): User's mood after meditation

**Response (200 OK):**
```json
{
  "success": true,
  "session_id": "507f1f77bcf86cd799439011",
  "message": "Meditation session 'Mindfulness Breathing' saved successfully",
  "duration_minutes": 5.0
}
```

**Notes:**
- Session is saved to both `meditation_sessions` collection and `mental_health_history` collection
- Automatically calculates duration in minutes
- Tracks session date for streak calculation

---

### 4. Get Meditation History

**Endpoint:** `GET /mental-health/meditation/history/{user_id}`

**Description:** Get user's meditation history with statistics and session details.

**Path Parameters:**
- `user_id` (required): User's email or ID

**Query Parameters:**
- `days` (optional, default=30): Number of days to look back
- `technique_id` (optional): Filter by specific technique

**Request Example:**
```http
GET http://localhost:8004/mental-health/meditation/history/dehemibasnayake201@gmail.com
GET http://localhost:8004/mental-health/meditation/history/dehemibasnayake201@gmail.com?days=7
GET http://localhost:8004/mental-health/meditation/history/dehemibasnayake201@gmail.com?days=30&technique_id=mindfulness_breathing
```

**Response (200 OK):**
```json
{
  "success": true,
  "user_id": "dehemibasnayake201@gmail.com",
  "date_range": {
    "start": "2025-09-09T00:00:00",
    "end": "2025-10-09T00:00:00",
    "days": 30
  },
  "statistics": {
    "total_sessions": 15,
    "completed_sessions": 13,
    "completion_rate": 86.7,
    "total_minutes": 87.5,
    "average_minutes_per_session": 5.8,
    "current_streak": 3
  },
  "technique_breakdown": {
    "mindfulness_breathing": {
      "technique_name": "Mindfulness Breathing",
      "count": 8,
      "total_minutes": 40.0
    },
    "walking_meditation": {
      "technique_name": "Walking Meditation",
      "count": 5,
      "total_minutes": 37.5
    },
    "box_breathing": {
      "technique_name": "Box Breathing (4-4-4-4)",
      "count": 2,
      "total_minutes": 10.0
    }
  },
  "sessions": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "user_id": "dehemibasnayake201@gmail.com",
      "technique_id": "mindfulness_breathing",
      "technique_name": "Mindfulness Breathing",
      "technique_category": "breathing",
      "duration_seconds": 300,
      "duration_minutes": 5.0,
      "completed": true,
      "notes": "Felt more relaxed",
      "mood_before": "anxious",
      "mood_after": "calm",
      "timestamp": "2025-10-09T10:30:00",
      "session_date": "2025-10-09"
    }
    // ... more sessions
  ]
}
```

**Statistics Explained:**
- `total_sessions`: Total number of meditation sessions
- `completed_sessions`: Number of sessions marked as completed
- `completion_rate`: Percentage of completed sessions
- `total_minutes`: Total time spent meditating
- `average_minutes_per_session`: Average duration per session
- `current_streak`: Number of consecutive days with at least one session

---

### 5. Get Meditation Recommendation

**Endpoint:** `GET /mental-health/meditation/recommend/{user_id}`

**Description:** Get personalized meditation technique recommendation based on user's current mood and practice history.

**Path Parameters:**
- `user_id` (required): User's email or ID

**Query Parameters:**
- `mood` (optional): Current mood for recommendations
  - Values: `anxious`, `stressed`, `sad`, `angry`, `tired`, `restless`

**Request Example:**
```http
GET http://localhost:8004/mental-health/meditation/recommend/dehemibasnayake201@gmail.com
GET http://localhost:8004/mental-health/meditation/recommend/dehemibasnayake201@gmail.com?mood=anxious
```

**Response (200 OK):**
```json
{
  "success": true,
  "user_id": "dehemibasnayake201@gmail.com",
  "current_mood": "anxious",
  "recommended_technique": {
    "id": "box_breathing",
    "name": "Box Breathing (4-4-4-4)",
    "duration_minutes": 5,
    "difficulty": "beginner",
    "description": "A powerful breathing technique used by Navy SEALs to stay calm and focused under pressure.",
    "benefits": [
      "Quickly reduces stress and anxiety",
      "Improves focus and concentration",
      "Regulates the nervous system",
      "Can be done anywhere, anytime",
      "Enhances performance under pressure"
    ],
    "steps": [...],
    "tips": [...],
    "category": "breathing",
    "recommendation_score": 15,
    "times_practiced": 0
  },
  "alternative_techniques": [
    {
      "id": "body_scan",
      "name": "Body Scan Meditation",
      // ... full technique details
      "recommendation_score": 13,
      "times_practiced": 1
    },
    {
      "id": "mindfulness_breathing",
      "name": "Mindfulness Breathing",
      // ... full technique details
      "recommendation_score": 12,
      "times_practiced": 8
    },
    {
      "id": "guided_visualization",
      "name": "Guided Visualization",
      // ... full technique details
      "recommendation_score": 8,
      "times_practiced": 2
    }
  ],
  "reasoning": "Based on your anxious mood and meditation history"
}
```

**Recommendation Logic:**
- Prioritizes techniques suitable for current mood
- Favors less-practiced techniques for variety
- Prefers beginner-friendly techniques for new users
- Provides alternatives for user choice

---

## Available Meditation Techniques

### 1. Mindfulness Breathing
- **ID:** `mindfulness_breathing`
- **Category:** Breathing
- **Duration:** 5 minutes
- **Difficulty:** Beginner
- **Best For:** Anxiety, stress, negative thoughts, focus
- **Key Feature:** Simple, can be done anywhere, even 60 seconds helps

### 2. Walking Meditation
- **ID:** `walking_meditation`
- **Category:** Movement
- **Duration:** 10 minutes
- **Difficulty:** Beginner
- **Best For:** Restlessness, racing thoughts, grounding
- **Key Feature:** Combines physical activity with mindfulness

### 3. Body Scan Meditation
- **ID:** `body_scan`
- **Category:** Relaxation
- **Duration:** 15 minutes
- **Difficulty:** Beginner
- **Best For:** Physical tension, insomnia, chronic pain
- **Key Feature:** Deep relaxation, good before sleep

### 4. Loving-Kindness Meditation (Metta)
- **ID:** `loving_kindness`
- **Category:** Compassion
- **Duration:** 10 minutes
- **Difficulty:** Intermediate
- **Best For:** Self-criticism, sadness, relationship issues
- **Key Feature:** Cultivates compassion and positive emotions

### 5. Box Breathing (4-4-4-4)
- **ID:** `box_breathing`
- **Category:** Breathing
- **Duration:** 5 minutes
- **Difficulty:** Beginner
- **Best For:** Acute stress, panic, performance anxiety
- **Key Feature:** Quick calming, used by Navy SEALs

### 6. Guided Visualization
- **ID:** `guided_visualization`
- **Category:** Visualization
- **Duration:** 15 minutes
- **Difficulty:** Intermediate
- **Best For:** Stress relief, mood boost, mental escape
- **Key Feature:** Creates peaceful mental sanctuary

---

## Frontend Integration Guide

### Example: Fetch All Techniques

```typescript
async function getMeditationTechniques(category?: string) {
  const url = category 
    ? `http://localhost:8004/mental-health/meditation/techniques?category=${category}`
    : `http://localhost:8004/mental-health/meditation/techniques`;
  
  const response = await fetch(url);
  const techniques = await response.json();
  return techniques;
}
```

### Example: Start Meditation Session

```typescript
async function saveMeditationSession(sessionData: {
  user_id: string;
  technique_id: string;
  duration_seconds: number;
  completed: boolean;
  notes?: string;
  mood_before?: string;
  mood_after?: string;
}) {
  const response = await fetch('http://localhost:8004/mental-health/meditation/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sessionData)
  });
  
  const result = await response.json();
  return result;
}
```

### Example: Get Recommendation

```typescript
async function getRecommendation(userId: string, mood?: string) {
  const url = mood
    ? `http://localhost:8004/mental-health/meditation/recommend/${userId}?mood=${mood}`
    : `http://localhost:8004/mental-health/meditation/recommend/${userId}`;
  
  const response = await fetch(url);
  const recommendation = await response.json();
  return recommendation;
}
```

---

## UI Implementation Suggestions

### 1. Technique List Page
- Display all techniques as cards with:
  - Name, duration, difficulty badge
  - Category icon
  - Key benefits (show first 2-3)
  - "Start Session" button
- Filter by category and difficulty
- Search functionality

### 2. Technique Detail Page
- Full description
- Step-by-step instructions (numbered)
- Tips section
- Benefits list
- Timer component
- "Start Meditation" button
- Option to save notes after completion

### 3. Meditation Timer
- Count-up or count-down timer
- Pause/Resume functionality
- Background music/sounds option
- Visual breathing guide (for breathing techniques)
- End session modal with:
  - Mood rating (before/after)
  - Notes input
  - "Save Session" button

### 4. History & Statistics Dashboard
- Current streak display
- Total sessions this week/month
- Total minutes meditated
- Favorite techniques chart
- Session calendar heatmap
- Progress charts

### 5. Recommendation Widget
- Display personalized recommendation
- Show reasoning
- One-click "Start Now" button
- Alternative techniques carousel

---

## Database Collections

### meditation_sessions
Stores individual meditation session records.

```json
{
  "_id": "ObjectId",
  "user_id": "string",
  "technique_id": "string",
  "technique_name": "string",
  "technique_category": "string",
  "duration_seconds": "number",
  "duration_minutes": "number",
  "completed": "boolean",
  "notes": "string",
  "mood_before": "string",
  "mood_after": "string",
  "timestamp": "datetime",
  "session_date": "string (ISO date)"
}
```

### mental_health_history
Also stores meditation sessions for unified history tracking.

```json
{
  "_id": "ObjectId",
  "user_id": "string",
  "type": "meditation",
  "content": {
    "technique_id": "string",
    "technique_name": "string",
    "category": "string",
    "duration_minutes": "number",
    "completed": "boolean",
    "mood_before": "string",
    "mood_after": "string",
    "notes": "string"
  },
  "timestamp": "datetime",
  "session_id": "string"
}
```

---

## Testing the APIs

### Using cURL

```bash
# Get all techniques
curl http://localhost:8004/mental-health/meditation/techniques

# Get breathing techniques
curl "http://localhost:8004/mental-health/meditation/techniques?category=breathing"

# Get specific technique
curl http://localhost:8004/mental-health/meditation/techniques/mindfulness_breathing

# Save session
curl -X POST http://localhost:8004/mental-health/meditation/session \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test@example.com",
    "technique_id": "mindfulness_breathing",
    "duration_seconds": 300,
    "completed": true,
    "mood_before": "anxious",
    "mood_after": "calm"
  }'

# Get history
curl "http://localhost:8004/mental-health/meditation/history/test@example.com?days=30"

# Get recommendation
curl "http://localhost:8004/mental-health/meditation/recommend/test@example.com?mood=anxious"
```

### Using Python

```python
import requests

BASE_URL = "http://localhost:8004/mental-health"

# Get all techniques
response = requests.get(f"{BASE_URL}/meditation/techniques")
techniques = response.json()

# Save session
session_data = {
    "user_id": "test@example.com",
    "technique_id": "mindfulness_breathing",
    "duration_seconds": 300,
    "completed": True,
    "mood_before": "anxious",
    "mood_after": "calm"
}
response = requests.post(f"{BASE_URL}/meditation/session", json=session_data)
result = response.json()

# Get history
response = requests.get(f"{BASE_URL}/meditation/history/test@example.com?days=30")
history = response.json()
```

---

## Error Handling

All endpoints return standard HTTP status codes:

- `200 OK`: Successful request
- `404 Not Found`: Technique not found
- `422 Unprocessable Entity`: Invalid request body
- `500 Internal Server Error`: Server error

Error responses include a `detail` field:

```json
{
  "detail": "Error description here"
}
```

---

## Next Steps

1. ✅ Backend APIs implemented
2. ⏳ Create frontend components
3. ⏳ Add meditation timer UI
4. ⏳ Implement session tracking
5. ⏳ Add visualization charts
6. ⏳ Create recommendation widget
7. ⏳ Add background music/sounds
8. ⏳ Implement streak tracking UI

---

## Support

For questions or issues, check:
- Backend code: `backend/app/routes/mental_health_routes.py`
- MongoDB collections: `meditation_sessions`, `mental_health_history`
- API docs: http://localhost:8004/docs (FastAPI Swagger UI)
