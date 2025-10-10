# Music Playlist Function - Mental Health Agent

## Overview
Added a custom music playlist management function to the Mental Health Agent that allows users to create, save, and load custom playlists.

## New Features Added

### 1. Custom Playlist Category
- Added `custom_playlist` category to `musicSuggestions`
- Default placeholder tracks for demonstration
- Supports all standard track properties (title, artist, duration, youtube_id, spotify_id)

### 2. Set Music Playlist Function
**Function**: `setMusicPlaylist(playlistName, tracks)`

**Parameters**:
- `playlistName` (string): Name of the playlist
- `tracks` (Array): Array of track objects with properties:
  - `title` (string): Song title
  - `artist` (string): Artist name  
  - `youtube_id` (string): YouTube video ID
  - `duration` (optional string): Song duration (default: "3:30")
  - `mood_type` (optional string): Mood category (default: "custom")
  - `spotify_id` (optional string): Spotify track ID (default: "N/A")

**Usage Example**:
```javascript
// Access the function globally (available in browser console)
window.setMusicPlaylist("My Relaxing Mix", [
  {
    title: "Peaceful Morning",
    artist: "Nature Sounds",
    youtube_id: "abc123def456",
    duration: "5:00",
    mood_type: "calm"
  },
  {
    title: "Ocean Waves",
    artist: "Relaxation Music",
    youtube_id: "xyz789uvw012",
    duration: "10:00",
    mood_type: "soothing"
  }
])
```

### 3. Playlist Persistence
- Playlists saved to `localStorage` under `mentalHealthCustomPlaylists`
- Automatic loading on component mount
- Tracks integrated into existing music recommendation system

### 4. User Feedback
- Success notifications when playlists are saved
- Visual feedback with track count
- Error handling and console logging

## How It Works

1. **Creating Playlists**: Call `setMusicPlaylist()` with playlist name and track array
2. **Saving**: Playlists stored in localStorage with metadata (creation date, last modified)
3. **Loading**: Saved playlists automatically loaded when Mental Health Agent starts
4. **Integration**: Custom tracks appear in mood intervention suggestions
5. **Normalization**: Tracks automatically formatted to match expected schema

## Storage Structure
```json
{
  "mentalHealthCustomPlaylists": {
    "My Relaxing Mix": {
      "name": "My Relaxing Mix",
      "tracks": [...],
      "created": "2025-09-24T...",
      "lastModified": "2025-09-24T..."
    }
  }
}
```

## Integration Points

### Mental Health Agent Features:
- ✅ Mood tracking interventions
- ✅ Music player functionality  
- ✅ YouTube integration
- ✅ Custom playlist support
- ✅ Persistent storage
- ✅ User notifications

### Usage Scenarios:
1. **Therapist Recommendations**: Healthcare providers can set therapeutic playlists
2. **Personal Curation**: Users can save their favorite mood-boosting songs
3. **Mood-Specific Collections**: Create playlists for specific emotional states
4. **External Integration**: Third-party apps can programmatically add playlists

## Function Location
- **File**: `frontend/src/components/MentalHealthAgent.tsx`
- **Scope**: Available globally as `window.setMusicPlaylist`
- **Lifecycle**: Active when Mental Health Agent is loaded
- **Cleanup**: Function removed when component unmounts

This enhancement allows for dynamic, personalized music therapy experiences within the Mental Health Agent while maintaining all existing functionality.