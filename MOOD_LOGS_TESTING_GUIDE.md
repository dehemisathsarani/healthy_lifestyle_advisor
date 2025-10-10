# Quick Testing Guide - Mood Logs MongoDB Integration

## Prerequisites
- MongoDB running and accessible
- Backend running on port 8005
- Frontend running on port 5176
- User account created and logged in

## Test Steps

### Test 1: Create and Save a Mood Log
1. Navigate to Mental Health Agent
2. Click on "Track Your Mood" or go to Mood tab
3. Fill in the mood form:
   - Select a mood type (e.g., "Happy")
   - Rate your mood (1-10)
   - Add a description
4. Complete at least one activity (joke, quote, image, music, or game)
5. Click "Complete"
6. ✅ **Expected**: See "Mood Log Saved!" success message

### Test 2: Verify MongoDB Storage
Open MongoDB Compass or use MongoDB shell:
```javascript
// View the mood_logs collection
db.mood_logs.find().pretty()

// You should see your mood log with:
// - user_id
// - mood_type
// - mood (positive/negative)
// - rating
// - description
// - timestamp
// - activities array
```

### Test 3: Check Dashboard Count
1. Go to Dashboard tab
2. Look at the "Total Mood Logs" card
3. ✅ **Expected**: Shows correct count (e.g., "1 mood logs saved")
4. Create another mood log
5. ✅ **Expected**: Count increases to "2 mood logs saved"

### Test 4: View in History Section
1. Go to History tab
2. ✅ **Expected**: See all your saved mood logs
3. Each log should display:
   - Mood type and rating
   - Description
   - Activities completed with count
   - Timestamp
4. Logs should be sorted by most recent first

### Test 5: Persistence After Page Refresh
1. Create a mood log (if you haven't already)
2. Note the count in Dashboard: X mood logs
3. Refresh the page (F5 or Ctrl+R)
4. Wait for page to load
5. Check Dashboard count again
6. ✅ **Expected**: Same count as before refresh
7. Go to History tab
8. ✅ **Expected**: All mood logs still visible

### Test 6: Persistence After Logout/Login
1. Create a mood log
2. Note the count in Dashboard: X mood logs
3. Log out of the application
4. Log back in with the same user account
5. Navigate to Mental Health Agent
6. Check Dashboard count
7. ✅ **Expected**: Same count as before logout
8. Go to History tab
9. ✅ **Expected**: All mood logs still visible

### Test 7: Counting Logic - Only Mood Logs, Not Activities
1. Create a mood log with 3 activities (joke, quote, image)
2. Dashboard should show: "1 mood logs saved" (NOT 3)
3. Create another mood log with 5 activities
4. Dashboard should show: "2 mood logs saved" (NOT 8)
5. ✅ **Expected**: Count increases by 1 for each mood log, regardless of activities

### Test 8: Multiple Activities in One Log
1. Create a new mood log
2. Complete a joke → verify it's added
3. Complete a quote → verify it's added
4. Complete an image → verify it's added
5. Complete music → verify it's added
6. Complete a game → verify it's added
7. Click "Complete"
8. Go to History tab
9. Find the mood log you just created
10. ✅ **Expected**: Shows "Activities Completed (5)" with all activities listed

### Test 9: Recent Mood Display
1. Create a mood log with:
   - Mood type: "Excited"
   - Rating: 9
   - Mood: "positive"
2. Go to Dashboard
3. Look at "Recent Mood" card
4. ✅ **Expected**: Shows "Excited (9/10) - positive"

### Test 10: Error Handling
1. Stop the backend server
2. Try to create a mood log and click "Complete"
3. ✅ **Expected**: See error alert "Failed to save mood log. Please try again."
4. Restart backend server
5. Try again
6. ✅ **Expected**: Should save successfully

## Backend API Testing (Optional)

### Test POST Endpoint
```bash
# Save a mood log
curl -X POST http://localhost:8005/mental-health/mood-logs \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "mood_type": "happy",
    "mood": "positive",
    "rating": 8,
    "description": "Test mood log",
    "timestamp": "2024-01-15T10:30:00Z",
    "activities": []
  }'
```

### Test GET Endpoint
```bash
# Get all mood logs for a user
curl http://localhost:8005/mental-health/mood-logs?user_id=test_user
```

### Test PUT Endpoint
```bash
# Update a mood log (replace {log_id} with actual ID)
curl -X PUT http://localhost:8005/mental-health/mood-logs/{log_id} \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "mood_type": "content",
    "mood": "positive",
    "rating": 7,
    "description": "Updated description",
    "timestamp": "2024-01-15T10:30:00Z",
    "activities": []
  }'
```

### Test DELETE Endpoint
```bash
# Delete a mood log (replace {log_id} with actual ID)
curl -X DELETE http://localhost:8005/mental-health/mood-logs/{log_id}
```

## Verification Checklist

- [ ] Mood logs save to MongoDB successfully
- [ ] Dashboard shows correct count (mood logs, not activities)
- [ ] History section displays all saved logs
- [ ] Mood logs persist after page refresh
- [ ] Mood logs persist after logout/login
- [ ] Activities within logs are saved and displayed
- [ ] Recent mood shows latest mood log details
- [ ] Error handling works when backend is down
- [ ] No console errors during normal operation
- [ ] All existing features (jokes, quotes, images, music, games) still work

## Common Issues and Solutions

### Issue: Count shows 0 after refresh
**Solution**: Check if user.id is available in useEffect. Verify MongoDB connection.

### Issue: "Failed to save mood log" error
**Solution**: 
1. Check if backend is running on port 8005
2. Verify MongoDB is running and accessible
3. Check browser console for detailed error messages

### Issue: Mood logs not loading
**Solution**:
1. Open browser DevTools → Network tab
2. Look for GET request to /mental-health/mood-logs
3. Check the response - should return mood_logs array
4. Verify user_id is being sent correctly

### Issue: Activities not showing in history
**Solution**:
1. Check MongoDB document structure - activities should be an array
2. Verify activity timestamps are valid
3. Check browser console for any parsing errors

## Success Criteria
✅ All 10 tests pass without errors
✅ Mood logs persist across sessions
✅ Dashboard counts only mood logs (not activities)
✅ All existing features continue to work
✅ No breaking changes to other components

## Notes
- The first time you test, you may see "No mood entries yet" in History - this is expected
- Creating a mood log may take a few seconds due to API calls for recommendations
- MongoDB connection string should be properly configured in backend/.env
- User authentication must be working for user_id to be available
