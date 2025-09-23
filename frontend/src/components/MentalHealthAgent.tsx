import React, { useState, useEffect } from 'react'
import { ArrowLeft, Brain, Heart, MessageCircle, Calendar, TrendingUp, Play, Target, Smile } from 'lucide-react'

// Declare the global type for mood modal
declare global {
  interface Window {
    moodModal?: {
      nextJoke: () => void
      showCartoon: () => void
      stopJokes: () => void
      nextImage: () => void
      nextGame: () => void
      playMusic: (title: string, artist: string) => void
      stopMusic: () => void
      askMusicPreference: () => void
      startGame: (gameName: string) => void
      startBreathing: () => void
      close: () => void
    }
  }
}

// Unique ID generator to prevent duplicate React keys
let idCounter = 0
const generateUniqueId = () => {
  idCounter++
  return `${Date.now()}-${idCounter}-${Math.random().toString(36).substr(2, 9)}`
}

// Enhanced 1-5 mood scale with emojis - defined globally
const moodOptions = [
  { rating: 1, emoji: '😢', label: 'Very Sad', color: 'text-red-600', bgColor: 'bg-red-100', borderColor: 'border-red-300' },
  { rating: 2, emoji: '☹️', label: 'Sad', color: 'text-orange-600', bgColor: 'bg-orange-100', borderColor: 'border-orange-300' },
  { rating: 3, emoji: '😐', label: 'Neutral', color: 'text-gray-600', bgColor: 'bg-gray-100', borderColor: 'border-gray-300' },
  { rating: 4, emoji: '🙂', label: 'Happy', color: 'text-green-600', bgColor: 'bg-green-100', borderColor: 'border-green-300' },
  { rating: 5, emoji: '😄', label: 'Very Happy', color: 'text-emerald-600', bgColor: 'bg-emerald-100', borderColor: 'border-emerald-300' }
]

// Types
interface UserMentalHealthProfile {
  id?: string
  name: string
  email: string
  age: number
  stress_level: 'low' | 'moderate' | 'high'
  sleep_hours: number
  concerns: string[]
  preferred_activities: string[]
  mood_goals: string[]
}

interface MoodEntry {
  id: string
  date: string
  mood_rating: number // 1-5 scale (1=😢, 2=☹️, 3=😐, 4=🙂, 5=😄)
  mood_emoji: string // emoji representation
  energy_level: number // 1-10
  stress_level: number // 1-10
  notes?: string
  why_feeling?: string // "Why do you feel this way?"
  activities: string[]
  preferred_music_type?: string // User's music preference
  current_feeling?: 'sad' | 'anxious' | 'angry' | 'stressed' | 'happy' | 'neutral'
  suggested_interventions?: {
    jokes?: string[]
    activities?: string[]
    mindfulness?: string[]
    funny_images?: Array<{
      url?: string
      type: string
      caption: string
      emoji?: string
      isLocal?: boolean
    }>
    gifs?: Array<{
      url: string
      type: string
      caption: string
    }>
    music_tracks?: Array<{
      title: string
      artist: string
      mood_type: string
      spotify_id?: string
      youtube_id?: string
      duration?: string
      preview_url?: string
    }>
    games?: Array<{
      name: string
      description: string
      type: 'simple' | 'interactive'
      instructions: string
    }>
  }
}

// New interface for intervention history
interface InterventionHistory {
  id: string
  date: string
  mood_entry_id: string
  user_response: 'helped' | 'neutral' | 'not_helpful'
  intervention_type: 'joke' | 'music' | 'game' | 'image' | 'breathing' | 'activity'
  content: any
  user_feedback?: string
}

interface MentalHealthAgentProps {
  onBackToServices: () => void
}

export const MentalHealthAgent: React.FC<MentalHealthAgentProps> = ({ onBackToServices }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<UserMentalHealthProfile | null>(null)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'mood' | 'activities' | 'insights' | 'profile' | 'history'>('dashboard')
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([])
  const [showMoodLogger, setShowMoodLogger] = useState(false)
  const [interventionHistory, setInterventionHistory] = useState<InterventionHistory[]>([])
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState<any>(null)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [audioLoading, setAudioLoading] = useState(false)

  // Check for existing user data on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('mentalHealthAgentUser')
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        setUser(userData)
        setIsAuthenticated(true)
        loadMoodHistory()
      } catch (error) {
        console.error('Error parsing saved user data:', error)
        localStorage.removeItem('mentalHealthAgentUser')
      }
    }
  }, [])

  const loadMoodHistory = () => {
    const savedMoods = localStorage.getItem('mentalHealthMoodEntries')
    if (savedMoods) {
      try {
        setMoodEntries(JSON.parse(savedMoods))
      } catch (error) {
        console.warn('Failed to load mood history:', error)
      }
    }
    
    // Load intervention history
    const savedHistory = localStorage.getItem('mentalHealthInterventionHistory')
    if (savedHistory) {
      try {
        setInterventionHistory(JSON.parse(savedHistory))
      } catch (error) {
        console.warn('Failed to load intervention history:', error)
      }
    }
  }

  const handleCreateProfile = (data: UserMentalHealthProfile) => {
    const profileWithId = {
      ...data,
      id: generateUniqueId()
    }
    
    setUser(profileWithId)
    setIsAuthenticated(true)
    localStorage.setItem('mentalHealthAgentUser', JSON.stringify(profileWithId))
    setActiveTab('dashboard')
    
    // Show success message
    const successMessage = document.createElement('div')
    successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse'
    successMessage.textContent = '✓ Mental health profile created successfully!'
    document.body.appendChild(successMessage)
    setTimeout(() => successMessage.remove(), 3000)
  }

  const logMoodEntry = async (entry: Omit<MoodEntry, 'id' | 'date'>) => {
    const newEntry: MoodEntry = {
      ...entry,
      id: generateUniqueId(),
      date: new Date().toISOString()
    }
    
    // If mood is low (1-2), automatically get intervention suggestions
    if (newEntry.mood_rating <= 2) {
      // Show empathetic loading message
      const loadingMessage = document.createElement('div')
      loadingMessage.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse'
      loadingMessage.textContent = '💙 I\'m sorry you\'re feeling this way. Getting some mood support suggestions...'
      document.body.appendChild(loadingMessage)
      
      try {
        const interventions = await getLowMoodInterventions(
          newEntry.current_feeling, 
          newEntry.preferred_music_type
        )
        newEntry.suggested_interventions = interventions
        
        // Remove loading message
        loadingMessage.remove()
        
        // Show immediate intervention modal with enhanced features
        showEnhancedLowMoodIntervention(interventions, newEntry.id)
      } catch (error) {
        console.error('Failed to get mood interventions:', error)
        loadingMessage.remove()
        
        // Show fallback support message
        const fallbackMessage = document.createElement('div')
        fallbackMessage.className = 'fixed top-4 right-4 bg-orange-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
        fallbackMessage.textContent = '💙 We care about you! Consider talking to someone or trying deep breathing.'
        document.body.appendChild(fallbackMessage)
        setTimeout(() => fallbackMessage.remove(), 5000)
      }
    }
    
    const updatedEntries = [newEntry, ...moodEntries]
    setMoodEntries(updatedEntries)
    localStorage.setItem('mentalHealthMoodEntries', JSON.stringify(updatedEntries))
    setShowMoodLogger(false)
    
    // Show success message
    const successMessage = document.createElement('div')
    successMessage.className = 'fixed top-4 right-4 bg-brand text-white px-6 py-3 rounded-lg shadow-lg z-50'
    successMessage.textContent = '✓ Mood entry logged successfully!'
    document.body.appendChild(successMessage)
    setTimeout(() => successMessage.remove(), 3000)
  }

  // Enhanced function to get low mood interventions with music and games
  const getLowMoodInterventions = async (currentFeeling?: string, musicPreference?: string) => {
    const interventions = {
      jokes: [] as string[],
      activities: [] as string[],
      mindfulness: [
        "Take 5 deep breaths: Inhale for 4 counts, hold for 7, exhale for 8",
        "Try the 4-7-8 breathing technique to calm your nervous system",
        "Practice progressive muscle relaxation starting from your toes",
        "Do a quick body scan meditation for 2 minutes",
        "Close your eyes and visualize a peaceful place for 1 minute",
        "Practice gratitude by thinking of 3 things you're thankful for"
      ],
      funny_images: [] as Array<{
        url?: string
        type: string
        caption: string
        emoji?: string
        isLocal?: boolean
      }>,
      gifs: [] as Array<{
        url: string
        type: string
        caption: string
      }>,
      music_tracks: [] as Array<{
        title: string
        artist: string
        mood_type: string
        spotify_id?: string
        youtube_id?: string
        duration?: string
        preview_url?: string
      }>,
      games: [] as Array<{
        name: string
        description: string
        type: 'simple' | 'interactive'
        instructions: string
      }>
    }

    // Enhanced fallback activities based on mood type
    const activitySuggestions = {
      sad: [
        "🌱 Water a plant or tend to a small garden",
        "☀️ Step outside and feel sunlight on your face for 5 minutes",
        "📱 Call or text a friend who makes you smile",
        "🍊 Eat something healthy and colorful",
        "💌 Write yourself a kind note for later"
      ],
      anxious: [
        "🧘‍♀️ Try the 5-4-3-2-1 grounding technique: 5 things you see, 4 you hear, 3 you feel, 2 you smell, 1 you taste",
        "🚶‍♀️ Take a slow 5-minute walk while focusing on your breathing",
        "📱 Use a guided meditation app for 5-10 minutes",
        "🌬️ Practice deep breathing exercises",
        "📖 Read a few pages of a calming book"
      ],
      angry: [
        "🏃‍♀️ Do 20 jumping jacks or push-ups to release energy",
        "🥊 Punch a pillow or do some quick stretches",
        "🚶‍♀️ Take a brisk walk outside",
        "📝 Write down your feelings without judgment",
        "🧊 Hold an ice cube or splash cold water on your face"
      ],
      default: [
        "Take a 5-minute walk outside and breathe fresh air",
        "Listen to your favorite uplifting song and dance to it",
        "Call or text a friend who makes you smile",
        "Watch a funny video on YouTube or TikTok",
        "Do some gentle stretching or yoga poses"
      ]
    }

    // Enhanced fallback jokes categorized by mood
    const moodSpecificJokes = {
      sad: [
        "Why don't scientists trust atoms? Because they make up everything! 😄",
        "I told my wife she was drawing her eyebrows too high. She looked surprised! 😂",
        "What do you call a bear with no teeth? A gummy bear! 🐻",
        "Why did the scarecrow win an award? Because he was outstanding in his field! 🌾"
      ],
      general: [
        "Why don't eggs tell jokes? They'd crack each other up! 🥚",
        "What do you call a sleeping bull? A bulldozer! 😴",
        "Why don't skeletons fight each other? They don't have the guts! 💀",
        "What's the best thing about Switzerland? I don't know, but the flag is a big plus! 🇨🇭"
      ]
    }

    // Fun games for mood boosting
    const funGames = [
      {
        name: "Smile Challenge",
        description: "Look in the mirror and make silly faces for 30 seconds",
        type: 'simple' as const,
        instructions: "Find a mirror, make the silliest faces you can think of for 30 seconds. Try to make yourself laugh!"
      },
      {
        name: "Gratitude Alphabet",
        description: "Name something you're grateful for from A to Z",
        type: 'simple' as const,
        instructions: "Start with A and think of something you're grateful for. Then B, C, and so on. How far can you get?"
      },
      {
        name: "Color Hunt",
        description: "Find 5 objects of the same color around you",
        type: 'interactive' as const,
        instructions: "Pick a color and find 5 objects of that color in your current space. Take your time and really look around!"
      },
      {
        name: "Dance Break",
        description: "Dance to your favorite song for 2 minutes",
        type: 'interactive' as const,
        instructions: "Put on an upbeat song and dance like nobody's watching for 2 full minutes. Let yourself be silly!"
      }
    ]

    // Music recommendations based on mood and preference - Enhanced with real audio URLs
    const musicSuggestions = {
      uplifting: [
        { title: "Happy", artist: "Pharrell Williams", mood_type: "uplifting", duration: "3:53", youtube_id: "ZbZSe6N_BXs", spotify_id: "60nZcImufyMA1MKQY3dcCH", audio_url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav" },
        { title: "Can't Stop the Feeling", artist: "Justin Timberlake", mood_type: "uplifting", duration: "3:56", youtube_id: "ru0K8uYEZWw", spotify_id: "1WkMMavIMc4JZ8cfMmxHkI", audio_url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav" },
        { title: "Walking on Sunshine", artist: "Katrina and the Waves", mood_type: "uplifting", duration: "3:59", youtube_id: "iPUmE-tne5U", spotify_id: "05wIrZSwuaVWhcv5FfqeH0", audio_url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav" },
        { title: "Good as Hell", artist: "Lizzo", mood_type: "uplifting", duration: "2:39", youtube_id: "SmbmeOgWsqE", spotify_id: "1PckUlxKqWQs2dEXBEH297", audio_url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav" },
        { title: "Uptown Funk", artist: "Mark Ronson ft. Bruno Mars", mood_type: "uplifting", duration: "4:30", youtube_id: "OPf0YbXqDm0", spotify_id: "32OlwWuMpZ6b0aN2RZOeMS", audio_url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav" },
        { title: "I Will Survive", artist: "Gloria Gaynor", mood_type: "uplifting", duration: "3:18", youtube_id: "FHhZPp08s74", spotify_id: "7LZXuPBjvcwW3sQZPEp7mY", audio_url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav" }
      ],
      calm: [
        { title: "Weightless", artist: "Marconi Union", mood_type: "calm", duration: "8:08", youtube_id: "UfcAVejslrU", spotify_id: "2WZqITJT3HLl0NKpK7E9nQ", audio_url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav" },
        { title: "Clair de Lune", artist: "Claude Debussy", mood_type: "calm", duration: "5:20", youtube_id: "CvFH_6DNRCY", spotify_id: "4Iojp1NrJG0t5YJ0m6Rl1w", audio_url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav" },
        { title: "Aqueous Transmission", artist: "Incubus", mood_type: "calm", duration: "7:49", youtube_id: "eQK7KSTQfaw", spotify_id: "3b1P7eaP5XQKlWMSr8Z4I3", audio_url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav" },
        { title: "River", artist: "Joni Mitchell", mood_type: "calm", duration: "4:00", youtube_id: "3NH-ctddY9o", spotify_id: "7FTm2MLvlVRUr1AJsIz6ey", audio_url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav" },
        { title: "Mad World", artist: "Gary Jules", mood_type: "calm", duration: "3:07", youtube_id: "4N3N1MlvVc4", spotify_id: "3JOVTQ5xWe2bLUUx8BKML9", audio_url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav" },
        { title: "The Sound of Silence", artist: "Simon & Garfunkel", mood_type: "calm", duration: "3:05", youtube_id: "4fWyzwo1xg0", spotify_id: "5u1n1kITHCxxp8twBcZxWy", audio_url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav" }
      ],
      energetic: [
        { title: "Stronger", artist: "Kelly Clarkson", mood_type: "energetic", duration: "3:42", youtube_id: "Xn676-fLq7I", spotify_id: "0EkNatTYz2iqFUxqVkXB4N" },
        { title: "Roar", artist: "Katy Perry", mood_type: "energetic", duration: "3:43", youtube_id: "CevxZvSJLk8", spotify_id: "6YBo9dIgFWzgUBKw1t5EaO" },
        { title: "Fight Song", artist: "Rachel Platten", mood_type: "energetic", duration: "3:23", youtube_id: "xo1VInw-SKc", spotify_id: "0cqRj7pUJDkTCEsJkx8snD" },
        { title: "Confident", artist: "Demi Lovato", mood_type: "energetic", duration: "3:27", youtube_id: "cwjjSmwhmv0", spotify_id: "0v1XpVIgTKGnZY4OV9t3Nz" },
        { title: "Titanium", artist: "David Guetta ft. Sia", mood_type: "energetic", duration: "4:05", youtube_id: "JRfuAukYTKg", spotify_id: "0lYBSQXN6rCTvUZvg9S0lU" },
        { title: "High Hopes", artist: "Panic! At The Disco", mood_type: "energetic", duration: "3:08", youtube_id: "IPXIgEAGe4U", spotify_id: "1rqqCSm0Qe4I9rUvWncaom" }
      ],
      soothing: [
        { title: "Rivers and Roads", artist: "The Head and the Heart", mood_type: "soothing", duration: "4:36", youtube_id: "e2J-0EtsCpo", spotify_id: "40PYlzLzgqjpRJRGJONhpe" },
        { title: "The Night We Met", artist: "Lord Huron", mood_type: "soothing", duration: "3:28", youtube_id: "KtlgYxa6BMU", spotify_id: "0m5YxyFyOLbOn9LCln41lG" },
        { title: "Skinny Love", artist: "Bon Iver", mood_type: "soothing", duration: "3:58", youtube_id: "ssdgFoHLwnk", spotify_id: "0iANdNPGm4LHnqV0Zf6rDU" },
        { title: "Holocene", artist: "Bon Iver", mood_type: "soothing", duration: "5:36", youtube_id: "TWcyIpul8OE", spotify_id: "5R7BuJJhsEGCsSSQjfTK1u" },
        { title: "First Time Ever I Saw Your Face", artist: "Roberta Flack", mood_type: "soothing", duration: "5:22", youtube_id: "VV8CFKzaOJg", spotify_id: "7FLfwbRUdH9pPm3qeGHqKK" },
        { title: "Black", artist: "Pearl Jam", mood_type: "soothing", duration: "5:43", youtube_id: "5ChbxMVgGV4", spotify_id: "4qQdOjOWIl89oCLSz9waVo" }
      ],
      anxiety_relief: [
        { title: "Breathe Me", artist: "Sia", mood_type: "anxiety_relief", duration: "4:30", youtube_id: "hSH7fblcGWM", spotify_id: "7Lf4YNJYc5MrfA7DmZeFLf" },
        { title: "Mad World", artist: "Gary Jules", mood_type: "anxiety_relief", duration: "3:07", youtube_id: "4N3N1MlvVc4", spotify_id: "3JOVTQ5xWe2bLUUx8BKML9" },
        { title: "Hurt", artist: "Johnny Cash", mood_type: "anxiety_relief", duration: "3:38", youtube_id: "vt1Pwfnh5pc", spotify_id: "6p0p7z2O9bOKzsZQ4e2SXV" },
        { title: "The Sound of Silence", artist: "Disturbed", mood_type: "anxiety_relief", duration: "4:08", youtube_id: "u9Dg-g7t2l4", spotify_id: "6UelLqGlWMcVH1E5c4H7lY" },
        { title: "Everybody Hurts", artist: "R.E.M.", mood_type: "anxiety_relief", duration: "5:17", youtube_id: "5rOiW_xY-kc", spotify_id: "4KOYP8sD3hCJNwNrYJCZ4e" }
      ],
      anger_management: [
        { title: "Let It Out", artist: "The Foo Fighters", mood_type: "anger_management", duration: "4:01", youtube_id: "1VQ_3sBZEm0", spotify_id: "2IIDpHU67QcLzV4W1RMJwC" },
        { title: "Scream", artist: "Usher", mood_type: "anger_management", duration: "4:10", youtube_id: "YQHsXMglC9A", spotify_id: "2p8IUWQDrpjuFltbdgLOag" },
        { title: "Break Stuff", artist: "Limp Bizkit", mood_type: "anger_management", duration: "2:47", youtube_id: "ZpUYjpKg9KY", spotify_id: "1dKjlblB6wOwSO4zOWpSG4" },
        { title: "In the End", artist: "Linkin Park", mood_type: "anger_management", duration: "3:36", youtube_id: "eVTXPUF4Oz4", spotify_id: "60a0Rd6pjrkxjPbaKzXjfq" },
        { title: "Stressed Out", artist: "Twenty One Pilots", mood_type: "anger_management", duration: "3:22", youtube_id: "pXRviuL6vMY", spotify_id: "3CRDbSG3x5paQHKzJidYSa" }
      ]
    }

    // Add mood-specific content
    const moodType = currentFeeling || 'default'
    interventions.activities.push(...(activitySuggestions[moodType as keyof typeof activitySuggestions] || activitySuggestions.default).slice(0, 3))
    interventions.jokes.push(...(moodSpecificJokes[moodType as keyof typeof moodSpecificJokes] || moodSpecificJokes.general).slice(0, 2))
    interventions.games.push(...funGames.slice(0, 2))

    // Add music based on preference and current feeling
    if (musicPreference && musicSuggestions[musicPreference as keyof typeof musicSuggestions]) {
      interventions.music_tracks.push(...musicSuggestions[musicPreference as keyof typeof musicSuggestions])
    } else {
      // Smart mood-based music selection
      switch (currentFeeling) {
        case 'sad':
          interventions.music_tracks.push(
            ...musicSuggestions.soothing.slice(0, 2),
            ...musicSuggestions.uplifting.slice(0, 1)
          )
          break
        case 'anxious':
          interventions.music_tracks.push(
            ...musicSuggestions.anxiety_relief.slice(0, 2),
            ...musicSuggestions.calm.slice(0, 1)
          )
          break
        case 'angry':
          interventions.music_tracks.push(
            ...musicSuggestions.anger_management.slice(0, 2),
            ...musicSuggestions.calm.slice(0, 1)
          )
          break
        case 'stressed':
          interventions.music_tracks.push(
            ...musicSuggestions.calm.slice(0, 2),
            ...musicSuggestions.soothing.slice(0, 1)
          )
          break
        case 'happy':
          interventions.music_tracks.push(
            ...musicSuggestions.uplifting.slice(0, 3)
          )
          break
        default:
          // Default mix for neutral mood
          interventions.music_tracks.push(
            ...musicSuggestions.uplifting.slice(0, 1),
            ...musicSuggestions.calm.slice(0, 1),
            ...musicSuggestions.soothing.slice(0, 1)
          )
      }
    }

    // Try to get additional content from APIs (keeping existing API calls)
    const apiPromises = [
      // Primary Joke API
      fetch('https://icanhazdadjoke.com/', {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(3000)
      }).then(response => {
        if (response.ok) {
          return response.json().then(data => {
            if (data.joke) {
              interventions.jokes.unshift(data.joke)
            }
          })
        }
      }).catch(error => {
        console.log('Joke API unavailable:', error.message)
      }),

      // Cat API for cute images
      fetch('https://api.thecatapi.com/v1/images/search?limit=1', {
        signal: AbortSignal.timeout(3000)
      }).then(response => {
        if (response.ok) {
          return response.json().then(data => {
            if (data && data[0] && data[0].url) {
              interventions.funny_images.push({
                url: data[0].url,
                type: 'cute_cat',
                caption: 'Here\'s a cute cat to brighten your day! 🐱'
              })
            }
          })
        }
      }).catch(error => {
        console.log('Cat API unavailable:', error.message)
      }),

      // Dog API for cute images
      fetch('https://dog.ceo/api/breeds/image/random', {
        signal: AbortSignal.timeout(3000)
      }).then(response => {
        if (response.ok) {
          return response.json().then(data => {
            if (data && data.message && data.status === 'success') {
              interventions.funny_images.push({
                url: data.message,
                type: 'cute_dog',
                caption: 'Here\'s an adorable dog to make you smile! 🐶'
              })
            }
          })
        }
      }).catch(error => {
        console.log('Dog API unavailable:', error.message)
      })
    ]

    // Wait for API calls
    await Promise.allSettled(apiPromises)

    // Always add some local emoji content as fallback
    const encouragingStickers = [
      { emoji: '🌟', message: 'You are a star! Keep shining!' },
      { emoji: '🌈', message: 'Every storm brings a rainbow!' },
      { emoji: '🦋', message: 'Beautiful transformations take time!' },
      { emoji: '🌸', message: 'You bloom in your own time!' },
      { emoji: '☀️', message: 'You bring sunshine to the world!' }
    ]
    
    const randomSticker = encouragingStickers[Math.floor(Math.random() * encouragingStickers.length)]
    interventions.funny_images.push({
      type: 'emoji_sticker',
      emoji: randomSticker.emoji,
      caption: randomSticker.message,
      isLocal: true
    })

    return interventions
  }

  // Enhanced intervention modal with music player and interactive features
  const showEnhancedLowMoodIntervention = (interventions: any, moodEntryId: string) => {
    let currentJokeIndex = 0
    let currentImageIndex = 0
    let currentGameIndex = 0
    let userStoppedJokes = false
    
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto'
    
    const updateContent = () => {
      const content = `
        <div class="bg-white rounded-2xl p-8 m-4 max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
          <div class="text-center mb-6">
            <div class="text-4xl mb-2">💙</div>
            <h3 class="text-xl font-bold text-gray-900 mb-2">I'm sorry you're feeling this way 💙</h3>
            <p class="text-gray-600">Here are some suggestions that might help boost your mood:</p>
          </div>
          
          <div class="space-y-4">
            ${interventions.jokes.length > 0 ? `
              <div class="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                <h4 class="font-semibold text-yellow-800 mb-3 flex items-center">
                  😄 Here's a joke for you:
                </h4>
                <p class="text-yellow-700 italic text-lg mb-4">"${interventions.jokes[currentJokeIndex] || interventions.jokes[0]}"</p>
                ${!userStoppedJokes ? `
                  <div class="flex space-x-2">
                    <button onclick="window.moodModal.nextJoke()" class="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium transition-colors">
                      Another joke! 😂
                    </button>
                    <button onclick="window.moodModal.showCartoon()" class="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors">
                      Show funny image! �
                    </button>
                    <button onclick="window.moodModal.stopJokes()" class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors">
                      I'm good, thanks 😊
                    </button>
                  </div>
                ` : ''}
              </div>
            ` : ''}
            
            ${interventions.funny_images.length > 0 ? `
              <div class="bg-purple-50 p-4 rounded-xl border border-purple-200">
                <h4 class="font-semibold text-purple-800 mb-3">📸 Something to make you smile:</h4>
                ${interventions.funny_images.slice(currentImageIndex, currentImageIndex + 1).map((img: any) => {
                  if (img.isLocal && img.emoji) {
                    return `
                      <div class="text-center p-4 bg-white rounded-lg border border-purple-100">
                        <div class="text-6xl mb-2">${img.emoji}</div>
                        <p class="text-purple-700 font-medium">${img.caption}</p>
                      </div>
                    `
                  } else if (img.url) {
                    return `
                      <div class="text-center">
                        <img src="${img.url}" alt="${img.caption}" class="w-full max-w-xs mx-auto rounded-lg shadow-md mb-2" style="max-height: 200px; object-fit: cover;" onerror="this.style.display='none'">
                        <p class="text-purple-700 text-sm">${img.caption}</p>
                      </div>
                    `
                  }
                  return ''
                }).join('')}
                ${interventions.funny_images.length > 1 ? `
                  <button onclick="window.moodModal.nextImage()" class="mt-3 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors">
                    Show another! 🖼️
                  </button>
                ` : ''}
              </div>
            ` : ''}
            
            ${interventions.music_tracks && interventions.music_tracks.length > 0 ? `
              <div class="bg-green-50 p-4 rounded-xl border border-green-200">
                <h4 class="font-semibold text-green-800 mb-3">� Music to lift your spirits:</h4>
                <div class="space-y-2">
                  ${interventions.music_tracks.slice(0, 3).map((track: any) => `
                    <div class="flex items-center justify-between bg-white p-3 rounded-lg border border-green-100">
                      <div>
                        <p class="font-medium text-green-800">${track.title}</p>
                        <p class="text-sm text-green-600">by ${track.artist} • ${track.duration || 'Unknown'}</p>
                        <p class="text-xs text-green-500">${track.mood_type} music</p>
                      </div>
                      <div class="flex gap-2">
                        <button onclick="window.moodModal.playMusic('${track.title}', '${track.artist}')" class="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors">
                          ▶️ Play
                        </button>
                        <button onclick="window.moodModal.stopMusic()" class="px-2 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors">
                          ⏹️
                        </button>
                      </div>
                    </div>
                  `).join('')}
                </div>
                <div class="mt-4 flex gap-2 justify-center">
                  <button onclick="window.moodModal.askMusicPreference()" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
                    🎯 Change Music Type
                  </button>
                  <button onclick="window.moodModal.stopMusic()" class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors">
                    ⏹️ Stop All Music
                  </button>
                    🎯 What type of music do you want?
                  </button>
                </div>
              </div>
            ` : ''}
            
            ${interventions.games && interventions.games.length > 0 ? `
              <div class="bg-pink-50 p-4 rounded-xl border border-pink-200">
                <h4 class="font-semibold text-pink-800 mb-3">🎮 Fun games to try:</h4>
                ${interventions.games.slice(currentGameIndex, currentGameIndex + 1).map((game: any) => `
                  <div class="bg-white p-4 rounded-lg border border-pink-100">
                    <h5 class="font-bold text-pink-800 mb-2">${game.name}</h5>
                    <p class="text-pink-700 mb-3">${game.description}</p>
                    <p class="text-sm text-pink-600 mb-3"><strong>Instructions:</strong> ${game.instructions}</p>
                    <button onclick="window.moodModal.startGame('${game.name}')" class="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg text-sm font-medium transition-colors">
                      Start Game! 🎯
                    </button>
                  </div>
                `).join('')}
                ${interventions.games.length > 1 ? `
                  <button onclick="window.moodModal.nextGame()" class="mt-3 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg text-sm font-medium transition-colors">
                    Try a different game! 🎲
                  </button>
                ` : ''}
              </div>
            ` : ''}
            
            <div class="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <h4 class="font-semibold text-blue-800 mb-2">🧘 Mindfulness exercise:</h4>
              <p class="text-blue-700 mb-3">${interventions.mindfulness[Math.floor(Math.random() * interventions.mindfulness.length)]}</p>
              <button onclick="window.moodModal.startBreathing()" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
                🌬️ Start guided breathing
              </button>
            </div>
          </div>
          
          <div class="mt-6 text-center">
            <button onclick="window.moodModal.close()" class="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200">
              Thank you! 💙
            </button>
          </div>
        </div>
      `
      modal.innerHTML = content
    }
    
    // Create global functions for modal interactions
    window.moodModal = {
      nextJoke: () => {
        if (interventions.jokes.length > 1) {
          currentJokeIndex = (currentJokeIndex + 1) % interventions.jokes.length
          updateContent()
          // Save interaction to history
          saveInteractionHistory(moodEntryId, 'joke', interventions.jokes[currentJokeIndex], 'helped')
        }
      },
      
      showCartoon: () => {
        if (interventions.funny_images.length > 0) {
          currentImageIndex = (currentImageIndex + 1) % interventions.funny_images.length
          updateContent()
          saveInteractionHistory(moodEntryId, 'image', interventions.funny_images[currentImageIndex], 'helped')
        }
      },
      
      stopJokes: () => {
        userStoppedJokes = true
        updateContent()
      },
      
      nextImage: () => {
        if (interventions.funny_images.length > 1) {
          currentImageIndex = (currentImageIndex + 1) % interventions.funny_images.length
          updateContent()
        }
      },
      
      nextGame: () => {
        if (interventions.games.length > 1) {
          currentGameIndex = (currentGameIndex + 1) % interventions.games.length
          updateContent()
        }
      },
      
      playMusic: (title: string, artist: string) => {
        setAudioLoading(true)
        setAudioError(null)
        
        // Stop current audio if playing
        if (currentAudio) {
          currentAudio.pause()
          currentAudio.currentTime = 0
          setCurrentAudio(null)
          setIsPlaying(false)
        }

        try {
          // Create a Web Audio API context for generating demo tones
          const generateDemoTone = () => {
            try {
              const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
              
              // Create different tones based on mood type
              const oscillator = audioContext.createOscillator()
              const gainNode = audioContext.createGain()
              
              // Map track to different frequencies for mood simulation
              const trackLower = title.toLowerCase()
              let frequency = 440 // Default A note
              
              if (trackLower.includes('happy') || trackLower.includes('uptown') || trackLower.includes('good')) {
                frequency = 523.25 // C5 - bright, happy
              } else if (trackLower.includes('calm') || trackLower.includes('weightless') || trackLower.includes('peaceful')) {
                frequency = 329.63 // E4 - calm, soothing
              } else if (trackLower.includes('energy') || trackLower.includes('stronger') || trackLower.includes('confident')) {
                frequency = 659.25 // E5 - energetic
              } else if (trackLower.includes('soothing') || trackLower.includes('river') || trackLower.includes('meditation')) {
                frequency = 293.66 // D4 - gentle, soothing
              }
              
              oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
              oscillator.type = 'sine' // Smooth, pleasant tone
              
              // Create a gentle fade in/out
              gainNode.gain.setValueAtTime(0, audioContext.currentTime)
              gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.5)
              gainNode.gain.linearRampToValueAtTime(0.05, audioContext.currentTime + 2)
              gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 3)
              
              oscillator.connect(gainNode)
              gainNode.connect(audioContext.destination)
              
              oscillator.start(audioContext.currentTime)
              oscillator.stop(audioContext.currentTime + 3)
              
              return { oscillator, audioContext, duration: 3000 }
            } catch (error) {
              console.log('Web Audio API not available, using fallback')
              return null
            }
          }

          setAudioLoading(false)
          
          // Show loading indicator briefly
          const loadingMessage = document.createElement('div')
          loadingMessage.className = 'fixed top-4 left-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
          loadingMessage.innerHTML = `
            <div class="flex items-center gap-3">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <div>Preparing "${title}"...</div>
            </div>
          `
          document.body.appendChild(loadingMessage)
          
          // Generate demo tone
          const audioDemo = generateDemoTone()
          
          // Store audio context for cleanup
          if (audioDemo) {
            setCurrentAudio(audioDemo.audioContext as any)
          }
          
          setTimeout(() => {
            loadingMessage.remove()
            setIsPlaying(true)
            setCurrentTrack({ title, artist })
            
            // Show now playing notification
            const musicMessage = document.createElement('div')
            musicMessage.className = 'fixed top-4 left-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
            musicMessage.innerHTML = `
              <div class="flex items-center gap-3">
                <div class="animate-pulse">🎵</div>
                <div>
                  <div class="font-bold">${title}</div>
                  <div class="text-sm">by ${artist}</div>
                  <div class="text-xs opacity-80">Demo: Audio tone + Voice description</div>
                </div>
                <button onclick="window.moodModal.stopMusic(); this.parentElement.parentElement.remove();" class="ml-2 px-2 py-1 bg-green-600 rounded text-xs hover:bg-green-700">Stop</button>
              </div>
            `
            document.body.appendChild(musicMessage)
            
            // Use text-to-speech to describe the track
            if ('speechSynthesis' in window) {
              const utterance = new SpeechSynthesisUtterance(
                `Now playing ${title} by ${artist}. This track has been selected based on your current mood to help you feel better. You're hearing a demo tone representing the mood of this song.`
              )
              utterance.rate = 0.9
              utterance.pitch = 1
              utterance.volume = 0.8
              utterance.onend = () => {
                setIsPlaying(false)
                setCurrentTrack(null)
              }
              speechSynthesis.speak(utterance)
            }
            
            // Auto-remove notification after simulation
            setTimeout(() => {
              if (musicMessage.parentElement) musicMessage.remove()
              setIsPlaying(false)
              setCurrentTrack(null)
            }, 15000) // 15-second simulation
            
          }, 500) // Brief loading simulation

        } catch (error) {
          console.error('Error in playMusic:', error)
          const err = error as Error
          setAudioError(`Error: ${err.message}`)
          setAudioLoading(false)
          setIsPlaying(false)
          
          // Fallback to TTS only
          if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(`Playing ${title} by ${artist} in voice simulation mode.`)
            utterance.onend = () => {
              setIsPlaying(false)
              setCurrentTrack(null)
            }
            speechSynthesis.speak(utterance)
            setIsPlaying(true)
            setCurrentTrack({ title, artist })
          }
          
          const errorMessage = document.createElement('div')
          errorMessage.className = 'fixed top-4 left-4 bg-orange-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
          errorMessage.innerHTML = `🔊 Playing "${title}" with voice simulation`
          document.body.appendChild(errorMessage)
          setTimeout(() => errorMessage.remove(), 3000)
        }
        
        saveInteractionHistory(moodEntryId, 'music', { title, artist }, 'helped')
      },
      
      askMusicPreference: () => {
        const preference = prompt('What type of music would you like? (uplifting, calm, energetic, soothing)')
        if (preference) {
          const musicMessage = document.createElement('div')
          musicMessage.className = 'fixed top-4 left-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
          musicMessage.innerHTML = `🎯 Great choice! Suggesting ${preference} music for you...`
          document.body.appendChild(musicMessage)
          setTimeout(() => musicMessage.remove(), 3000)
        }
      },
      
      startGame: (gameName: string) => {
        const gameMessage = document.createElement('div')
        gameMessage.className = 'fixed top-4 left-4 bg-pink-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
        gameMessage.innerHTML = `🎮 Starting "${gameName}"! Have fun! 🎉`
        document.body.appendChild(gameMessage)
        setTimeout(() => gameMessage.remove(), 3000)
        
        saveInteractionHistory(moodEntryId, 'game', { name: gameName }, 'helped')
      },
      
      startBreathing: () => {
        // Create a simple breathing exercise
        const breathingModal = document.createElement('div')
        breathingModal.className = 'fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-60'
        breathingModal.innerHTML = `
          <div class="bg-white rounded-2xl p-8 text-center max-w-md">
            <h3 class="text-2xl font-bold text-blue-900 mb-4">🌬️ Guided Breathing</h3>
            <div id="breathing-circle" class="w-32 h-32 mx-auto mb-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-900 font-bold text-lg" style="transition: transform 4s ease-in-out;">
              Breathe
            </div>
            <p id="breathing-instruction" class="text-blue-700 text-lg mb-4">Inhale slowly...</p>
            <button onclick="this.parentElement.parentElement.remove()" class="px-6 py-2 bg-blue-500 text-white rounded-lg">
              Finish
            </button>
          </div>
        `
        document.body.appendChild(breathingModal)
        
        // Animate breathing
        let breathingIn = true
        const circle = breathingModal.querySelector('#breathing-circle') as HTMLElement
        const instruction = breathingModal.querySelector('#breathing-instruction') as HTMLElement
        
        if (circle && instruction) {
          setInterval(() => {
            if (breathingIn) {
              circle.style.transform = 'scale(1.5)'
              instruction.textContent = 'Inhale slowly for 4 counts...'
            } else {
              circle.style.transform = 'scale(1)'
              instruction.textContent = 'Exhale slowly for 4 counts...'
            }
            breathingIn = !breathingIn
          }, 4000)
        }
        
        setTimeout(() => {
          if (breathingModal.parentElement) {
            breathingModal.remove()
          }
        }, 60000) // Auto close after 1 minute
      },
      
      stopMusic: () => {
        if (currentAudio) {
          // Handle both HTML Audio and Web Audio API contexts
          if (typeof currentAudio.pause === 'function') {
            // HTML Audio element
            currentAudio.pause()
            currentAudio.currentTime = 0
          } else if (typeof (currentAudio as any).close === 'function') {
            // Web Audio API context
            try {
              (currentAudio as any).close()
            } catch (e) {
              console.log('Audio context already closed')
            }
          }
          setCurrentAudio(null)
        }
        
        setIsPlaying(false)
        setCurrentTrack(null)
        setAudioError(null)
        
        // Stop text-to-speech if running
        if ('speechSynthesis' in window) {
          speechSynthesis.cancel()
        }
        
        // Remove any music notifications
        const existingMessages = document.querySelectorAll('.fixed.top-4.left-4')
        existingMessages.forEach(msg => {
          if (msg.textContent?.includes('🎵') || msg.textContent?.includes('Loading') || msg.textContent?.includes('Playing') || msg.textContent?.includes('Preparing')) {
            msg.remove()
          }
        })
        
        const stopMessage = document.createElement('div')
        stopMessage.className = 'fixed top-4 left-4 bg-gray-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
        stopMessage.innerHTML = '⏹️ Music stopped'
        document.body.appendChild(stopMessage)
        setTimeout(() => stopMessage.remove(), 2000)
      },
      
      close: () => {
        modal.remove()
        delete window.moodModal
      }
    }
    
    updateContent()
    document.body.appendChild(modal)
    
    // Auto-remove modal after 5 minutes
    setTimeout(() => {
      if (modal.parentElement) {
        modal.remove()
        delete window.moodModal
      }
    }, 300000)
  }

  // Function to save intervention interactions to history
  const saveInteractionHistory = (moodEntryId: string, interventionType: string, content: any, userResponse: string) => {
    const historyEntry: InterventionHistory = {
      id: generateUniqueId(),
      date: new Date().toISOString(),
      mood_entry_id: moodEntryId,
      user_response: userResponse as 'helped' | 'neutral' | 'not_helpful',
      intervention_type: interventionType as 'joke' | 'music' | 'game' | 'image' | 'breathing' | 'activity',
      content: content
    }
    
    const updatedHistory = [historyEntry, ...interventionHistory]
    setInterventionHistory(updatedHistory)
    localStorage.setItem('mentalHealthInterventionHistory', JSON.stringify(updatedHistory))
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBackToServices}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-brand transition-all duration-200 hover:bg-white/50 rounded-lg"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Services
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center space-x-3">
                <Brain className="w-8 h-8 text-brand" />
                <h1 className="text-2xl font-bold text-gray-900">Mental Health Assistant</h1>
              </div>
            </div>
          </div>

          {/* Welcome Banner */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 p-8 text-center shadow-xl">
            <Brain className="w-16 h-16 text-brand mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Your Mental Wellness Journey</h2>
            <p className="text-lg text-gray-600 mb-6">Create your personalized profile to start tracking your mental health and access guided activities.</p>
          </div>

          {/* Profile Creation Form */}
          <ProfileForm onSubmit={handleCreateProfile} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBackToServices}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-brand transition-all duration-200 hover:bg-white/50 rounded-lg"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Services
            </button>
            <div className="h-6 w-px bg-gray-300" />
            <div className="flex items-center space-x-3">
              <Brain className="w-8 h-8 text-brand" />
              <h1 className="text-2xl font-bold text-gray-900">Mental Health Assistant</h1>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-white/50">
            <span className="text-sm text-gray-600">Welcome back, </span>
            <span className="font-semibold text-brand">{user?.name}!</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 p-2">
          <nav className="flex space-x-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Brain, color: 'text-blue-600' },
              { id: 'mood', label: 'Mood Tracking', icon: Heart, color: 'text-red-500' },
              { id: 'activities', label: 'Activities', icon: Play, color: 'text-green-600' },
              { id: 'insights', label: 'Insights', icon: TrendingUp, color: 'text-purple-600' },
              { id: 'history', label: 'History', icon: Calendar, color: 'text-orange-600' },
              { id: 'profile', label: 'Profile', icon: Target, color: 'text-gray-600' }
            ].map(({ id, label, icon: Icon, color }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as 'dashboard' | 'mood' | 'activities' | 'insights' | 'profile' | 'history')}
                className={`flex items-center px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                  activeTab === id
                    ? 'bg-brand text-white shadow-lg scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <Icon className={`w-4 h-4 mr-2 ${activeTab === id ? 'text-white' : color}`} />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'dashboard' && user && (
            <Dashboard user={user} moodEntries={moodEntries} onLogMood={() => setShowMoodLogger(true)} />
          )}
          
          {activeTab === 'mood' && (
            <MoodTracking 
              moodEntries={moodEntries} 
              onLogMood={() => setShowMoodLogger(true)}
              showLogger={showMoodLogger}
              onCloseLogger={() => setShowMoodLogger(false)}
              onSubmitMood={logMoodEntry}
            />
          )}
          
          {activeTab === 'activities' && user && (
            <MentalHealthActivities user={user} />
          )}
          
          {activeTab === 'insights' && user && (
            <MentalHealthInsights moodEntries={moodEntries} user={user} />
          )}
          
          {activeTab === 'history' && (
            <InterventionHistoryView history={interventionHistory} />
          )}
          
          {activeTab === 'profile' && user && (
            <ProfileSettings user={user} onUpdate={setUser} />
          )}
        </div>
      </div>
    </div>
  )
}

// Profile Form Component
const ProfileForm: React.FC<{ onSubmit: (data: UserMentalHealthProfile) => void }> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<UserMentalHealthProfile>({
    name: '',
    email: '',
    age: 25,
    stress_level: 'moderate',
    sleep_hours: 8,
    concerns: [],
    preferred_activities: [],
    mood_goals: []
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const concerns = [
    'Anxiety', 'Depression', 'Stress', 'Sleep Issues', 'Work-Life Balance', 'Relationships', 'Self-Esteem', 'Motivation'
  ]

  const activities = [
    'Meditation', 'Journaling', 'Exercise', 'Reading', 'Music', 'Nature Walks', 'Breathing Exercises', 'Yoga'
  ]

  const goals = [
    'Reduce Stress', 'Improve Mood', 'Better Sleep', 'Increase Motivation', 'Build Confidence', 'Manage Anxiety'
  ]

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 p-8 shadow-xl">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Mental Health Profile</h2>
        <p className="text-gray-600">Tell us about yourself to get personalized recommendations and support</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Target className="w-5 h-5 mr-2 text-brand" />
            Basic Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent transition-all duration-200"
                placeholder="Enter your name"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent transition-all duration-200"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent transition-all duration-200"
                min="13"
                max="100"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Stress Level</label>
              <select
                value={formData.stress_level}
                onChange={(e) => setFormData({ ...formData, stress_level: e.target.value as 'low' | 'moderate' | 'high' })}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent transition-all duration-200"
              >
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
                <option value="high">High</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sleep Hours per Night</label>
              <input
                type="number"
                value={formData.sleep_hours}
                onChange={(e) => setFormData({ ...formData, sleep_hours: parseFloat(e.target.value) })}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent transition-all duration-200"
                min="3"
                max="12"
                step="0.5"
              />
            </div>
          </div>
        </div>

        {/* Areas of Concern */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Heart className="w-5 h-5 mr-2 text-red-500" />
            Areas of Concern (Optional)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {concerns.map(concern => (
              <label key={concern} className="flex items-center p-3 border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all duration-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.concerns.includes(concern)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({ ...formData, concerns: [...formData.concerns, concern] })
                    } else {
                      setFormData({ ...formData, concerns: formData.concerns.filter(c => c !== concern) })
                    }
                  }}
                  className="mr-3 w-4 h-4 text-brand"
                />
                <span className="text-sm font-medium">{concern}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Preferred Activities */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Play className="w-5 h-5 mr-2 text-green-600" />
            Preferred Activities
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {activities.map(activity => (
              <label key={activity} className="flex items-center p-3 border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all duration-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.preferred_activities.includes(activity)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({ ...formData, preferred_activities: [...formData.preferred_activities, activity] })
                    } else {
                      setFormData({ ...formData, preferred_activities: formData.preferred_activities.filter(a => a !== activity) })
                    }
                  }}
                  className="mr-3 w-4 h-4 text-brand"
                />
                <span className="text-sm font-medium">{activity}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Mental Health Goals */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Target className="w-5 h-5 mr-2 text-purple-600" />
            Mental Health Goals
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {goals.map(goal => (
              <label key={goal} className="flex items-center p-3 border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all duration-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.mood_goals.includes(goal)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({ ...formData, mood_goals: [...formData.mood_goals, goal] })
                    } else {
                      setFormData({ ...formData, mood_goals: formData.mood_goals.filter(g => g !== goal) })
                    }
                  }}
                  className="mr-3 w-4 h-4 text-brand"
                />
                <span className="text-sm font-medium">{goal}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-brand to-brand-dark hover:from-brand-dark hover:to-brand text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
        >
          Create Mental Health Profile
        </button>
      </form>
    </div>
  )
}

// Dashboard Component
const Dashboard: React.FC<{ 
  user: UserMentalHealthProfile
  moodEntries: MoodEntry[]
  onLogMood: () => void
}> = ({ user, moodEntries, onLogMood }) => {
  const recentMood = moodEntries[0]
  const avgStress = moodEntries.length > 0 
    ? moodEntries.slice(0, 7).reduce((sum, entry) => sum + entry.stress_level, 0) / Math.min(7, moodEntries.length)
    : 0

  const getStressLevelColor = (level: number) => {
    if (level <= 3) return 'text-green-600 bg-green-100'
    if (level <= 6) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white/50 shadow-lg hover:shadow-xl transition-all duration-200">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl">
              {recentMood ? (
                <span className="text-2xl">{recentMood.mood_emoji}</span>
              ) : (
                <Heart className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Current Mood</p>
              <p className="text-lg font-bold text-gray-900 capitalize">
                {recentMood ? 
                  `${recentMood.mood_emoji} ${moodOptions.find(m => m.rating === recentMood.mood_rating)?.label}` : 
                  'Not logged yet'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white/50 shadow-lg hover:shadow-xl transition-all duration-200">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Stress (7 days)</p>
              <div className="flex items-center space-x-2">
                <p className="text-2xl font-bold text-gray-900">{avgStress.toFixed(1)}</p>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStressLevelColor(avgStress)}`}>
                  /10
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white/50 shadow-lg hover:shadow-xl transition-all duration-200">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Sleep Target</p>
              <p className="text-2xl font-bold text-gray-900">{user.sleep_hours}h</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white/50 shadow-lg hover:shadow-xl transition-all duration-200">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl">
              <Brain className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Mood Entries</p>
              <p className="text-2xl font-bold text-gray-900">{moodEntries.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 p-8 shadow-lg">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <Play className="w-6 h-6 mr-3 text-brand" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={onLogMood}
            className="flex items-center justify-center px-6 py-4 bg-gradient-to-r from-brand to-brand-dark hover:from-brand-dark hover:to-brand text-white rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <Heart className="w-5 h-5 mr-2" />
            Log Your Mood
          </button>
          
          <button className="flex items-center justify-center px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg">
            <Brain className="w-5 h-5 mr-2" />
            Start Meditation
          </button>
          
          <button className="flex items-center justify-center px-6 py-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg">
            <MessageCircle className="w-5 h-5 mr-2" />
            Journal Entry
          </button>
        </div>
      </div>

      {/* Mental Health Goals */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 p-8 shadow-lg">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <Target className="w-6 h-6 mr-3 text-brand" />
          Your Mental Health Goals
        </h3>
        {user.mood_goals.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {user.mood_goals.map((goal, index) => (
              <div key={index} className="flex items-center p-4 bg-gradient-to-r from-brand/10 to-brand/5 rounded-xl border border-brand/20">
                <Target className="w-5 h-5 text-brand mr-3" />
                <span className="text-gray-800 font-medium">{goal}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No goals set yet. Update your profile to add mental health goals.</p>
        )}
      </div>

      {/* Recent Mood */}
      {recentMood && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 p-8 shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Latest Mood Entry</h3>
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">{recentMood.mood_emoji}</span>
                <span className="text-lg font-semibold">
                  {moodOptions.find(m => m.rating === recentMood.mood_rating)?.label} ({recentMood.mood_rating}/5)
                </span>
              </div>
              <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full">
                {new Date(recentMood.date).toLocaleDateString()}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-white rounded-lg">
                <p className="text-sm text-gray-600">Energy Level</p>
                <p className="text-xl font-bold text-gray-900">{recentMood.energy_level}/10</p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <p className="text-sm text-gray-600">Stress Level</p>
                <p className="text-xl font-bold text-gray-900">{recentMood.stress_level}/10</p>
              </div>
            </div>
            {recentMood.notes && (
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Notes:</p>
                <p className="text-gray-600 italic">"{recentMood.notes}"</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Mood Tracking Component
const MoodTracking: React.FC<{
  moodEntries: MoodEntry[]
  onLogMood: () => void
  showLogger: boolean
  onCloseLogger: () => void
  onSubmitMood: (entry: Omit<MoodEntry, 'id' | 'date'>) => void
}> = ({ moodEntries, onLogMood, showLogger, onCloseLogger, onSubmitMood }) => {
  const [moodData, setMoodData] = useState({
    mood_rating: 3,
    mood_emoji: '😐',
    energy_level: 5,
    stress_level: 5,
    notes: '',
    why_feeling: '',
    activities: [] as string[],
    current_feeling: 'neutral' as 'sad' | 'anxious' | 'angry' | 'stressed' | 'happy' | 'neutral',
    preferred_music_type: '' as string
  })

  // Enhanced 1-5 mood scale with emojis
  const moodOptions = [
    { rating: 1, emoji: '😢', label: 'Very Sad', color: 'text-red-600', bgColor: 'bg-red-100', borderColor: 'border-red-300' },
    { rating: 2, emoji: '☹️', label: 'Sad', color: 'text-orange-600', bgColor: 'bg-orange-100', borderColor: 'border-orange-300' },
    { rating: 3, emoji: '😐', label: 'Neutral', color: 'text-gray-600', bgColor: 'bg-gray-100', borderColor: 'border-gray-300' },
    { rating: 4, emoji: '🙂', label: 'Happy', color: 'text-green-600', bgColor: 'bg-green-100', borderColor: 'border-green-300' },
    { rating: 5, emoji: '😄', label: 'Very Happy', color: 'text-emerald-600', bgColor: 'bg-emerald-100', borderColor: 'border-emerald-300' }
  ]

  const activities = [
    'Work', 'Exercise', 'Social', 'Rest', 'Hobby', 'Family', 'Study', 'Travel', 'Meditation', 'Reading'
  ]

  const feelingOptions = [
    { value: 'sad', label: 'Sad', emoji: '😢', color: 'text-blue-600' },
    { value: 'anxious', label: 'Anxious', emoji: '😰', color: 'text-yellow-600' },
    { value: 'angry', label: 'Angry', emoji: '😠', color: 'text-red-600' },
    { value: 'stressed', label: 'Stressed', emoji: '😤', color: 'text-orange-600' },
    { value: 'happy', label: 'Happy', emoji: '😊', color: 'text-green-600' },
    { value: 'neutral', label: 'Neutral', emoji: '😐', color: 'text-gray-600' }
  ]

  const musicTypes = [
    { value: 'uplifting', label: 'Uplifting & Energetic', emoji: '🎉' },
    { value: 'calm', label: 'Calm & Peaceful', emoji: '🧘‍♀️' },
    { value: 'soothing', label: 'Soothing & Comforting', emoji: '🤗' },
    { value: 'energetic', label: 'High Energy & Motivating', emoji: '⚡' }
  ]

  const handleMoodSelect = (rating: number, emoji: string) => {
    setMoodData({ ...moodData, mood_rating: rating, mood_emoji: emoji })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    onSubmitMood(moodData)
    
    setMoodData({
      mood_rating: 3,
      mood_emoji: '😐',
      energy_level: 5,
      stress_level: 5,
      notes: '',
      why_feeling: '',
      activities: [],
      current_feeling: 'neutral',
      preferred_music_type: ''
    })
  }

  if (showLogger) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Heart className="w-8 h-8 mr-3 text-brand" />
            Daily Mood Tracker
          </h2>
          <button
            onClick={onCloseLogger}
            className="px-4 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Enhanced Mood Rating with 1-5 Scale + Emojis */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-6">
                Rate your mood (1-5 scale)
              </label>
              <div className="grid grid-cols-5 gap-4">
                {moodOptions.map(({ rating, emoji, label, color, bgColor, borderColor }) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => handleMoodSelect(rating, emoji)}
                    className={`flex flex-col items-center p-6 rounded-2xl border-2 transition-all duration-200 transform hover:scale-105 ${
                      moodData.mood_rating === rating
                        ? `${borderColor} ${bgColor} shadow-lg scale-105`
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="text-4xl mb-2">{emoji}</div>
                    <span className="text-xs font-medium text-center">{rating}</span>
                    <span className={`text-xs font-semibold text-center ${
                      moodData.mood_rating === rating ? color : 'text-gray-600'
                    }`}>
                      {label}
                    </span>
                  </button>
                ))}
              </div>
              <div className="mt-4 text-center">
                <span className="text-2xl">{moodData.mood_emoji}</span>
                <span className="ml-2 text-lg font-semibold text-gray-700">
                  You selected: {moodOptions.find(m => m.rating === moodData.mood_rating)?.label}
                </span>
              </div>
            </div>

            {/* Why do you feel this way? */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Why do you feel this way? (Optional)
              </label>
              <textarea
                value={moodData.why_feeling}
                onChange={(e) => setMoodData({ ...moodData, why_feeling: e.target.value })}
                placeholder="Share what's contributing to your current mood..."
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent transition-all duration-200 resize-none"
                rows={3}
              />
            </div>

            {/* Current Feeling Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-4">
                How are you feeling right now? (This helps us provide better support)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {feelingOptions.map(({ value, label, emoji, color }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMoodData({ ...moodData, current_feeling: value as any })}
                    className={`flex items-center p-3 rounded-xl border-2 transition-all duration-200 ${
                      moodData.current_feeling === value
                        ? 'border-brand bg-brand/10 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <span className="text-2xl mr-2">{emoji}</span>
                    <span className={`font-medium ${
                      moodData.current_feeling === value ? 'text-brand' : color
                    }`}>
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Music Preference for Low Mood */}
            {moodData.mood_rating <= 2 && (
              <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                <label className="block text-sm font-semibold text-blue-800 mb-4">
                  🎵 What type of music would help you feel better?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {musicTypes.map(({ value, label, emoji }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setMoodData({ ...moodData, preferred_music_type: value })}
                      className={`flex items-center p-3 rounded-lg border transition-all duration-200 ${
                        moodData.preferred_music_type === value
                          ? 'border-blue-500 bg-blue-100 shadow-md'
                          : 'border-blue-200 bg-white hover:border-blue-300'
                      }`}
                    >
                      <span className="text-xl mr-2">{emoji}</span>
                      <span className={`text-sm font-medium ${
                        moodData.preferred_music_type === value ? 'text-blue-800' : 'text-blue-700'
                      }`}>
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4">
                  Energy Level: <span className="text-brand text-lg">{moodData.energy_level}/10</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={moodData.energy_level}
                  onChange={(e) => setMoodData({ ...moodData, energy_level: parseInt(e.target.value) })}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4">
                  Stress Level: <span className="text-red-500 text-lg">{moodData.stress_level}/10</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={moodData.stress_level}
                  onChange={(e) => setMoodData({ ...moodData, stress_level: parseInt(e.target.value) })}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-4">What have you been doing? (Optional)</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {activities.map(activity => (
                  <label key={activity} className="flex items-center p-3 border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all duration-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={moodData.activities.includes(activity)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setMoodData({ ...moodData, activities: [...moodData.activities, activity] })
                        } else {
                          setMoodData({ ...moodData, activities: moodData.activities.filter(a => a !== activity) })
                        }
                      }}
                      className="mr-3 w-4 h-4 text-brand"
                    />
                    <span className="text-sm font-medium">{activity}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-4">Additional Notes (Optional)</label>
              <textarea
                value={moodData.notes}
                onChange={(e) => setMoodData({ ...moodData, notes: e.target.value })}
                rows={4}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent transition-all duration-200"
                placeholder="Any additional thoughts about your day or mood..."
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-brand to-brand-dark hover:from-brand-dark hover:to-brand text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Save Daily Mood Entry
            </button>
          </form>
        </div>

        {/* Show intervention suggestions for low mood */}
        {moodData.mood_rating <= 2 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-yellow-800 mb-4">
              💙 We're here to help boost your mood!
            </h3>
            <p className="text-yellow-700 mb-4">
              Since you're feeling down, here are some suggestions that might help:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-yellow-200">
                <h4 className="font-semibold text-gray-800 mb-2">😄 Fun Boost</h4>
                <p className="text-sm text-gray-600">We'll suggest jokes and fun activities</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-yellow-200">
                <h4 className="font-semibold text-gray-800 mb-2">🧘 Mindfulness</h4>
                <p className="text-sm text-gray-600">Breathing exercises and meditation</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-yellow-200">
                <h4 className="font-semibold text-gray-800 mb-2">🎭 Entertainment</h4>
                <p className="text-sm text-gray-600">Funny images and uplifting content</p>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <Heart className="w-8 h-8 mr-3 text-brand" />
          Mood Tracking
        </h2>
        <button
          onClick={onLogMood}
          className="px-6 py-3 bg-gradient-to-r from-brand to-brand-dark hover:from-brand-dark hover:to-brand text-white rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
        >
          Log New Mood
        </button>
      </div>

      {moodEntries.length === 0 ? (
        <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg">
          <Heart className="w-16 h-16 text-gray-400 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Start Your Mood Journey</h3>
          <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">Begin tracking your emotions to better understand your mental health patterns and progress.</p>
          <button
            onClick={onLogMood}
            className="px-8 py-4 bg-gradient-to-r from-brand to-brand-dark hover:from-brand-dark hover:to-brand text-white rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg font-semibold"
          >
            Log Your First Mood
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {moodEntries.map((entry) => (
            <div key={entry.id} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 p-6 shadow-lg hover:shadow-xl transition-all duration-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-4xl">{entry.mood_emoji}</span>
                    <div>
                      <span className="text-xl font-bold">{moodOptions.find(m => m.rating === entry.mood_rating)?.label || 'Unknown'}</span>
                      <p className="text-sm text-gray-600">Rating: {entry.mood_rating}/5</p>
                    </div>
                  </div>
                </div>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {new Date(entry.date).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                  <p className="text-sm font-medium text-gray-600 mb-1">Energy Level</p>
                  <p className="text-2xl font-bold text-blue-600">{entry.energy_level}/10</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl">
                  <p className="text-sm font-medium text-gray-600 mb-1">Stress Level</p>
                  <p className="text-2xl font-bold text-red-600">{entry.stress_level}/10</p>
                </div>
              </div>
              
              {entry.why_feeling && (
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 mb-4">
                  <p className="text-sm font-semibold text-purple-700 mb-2">Why you felt this way:</p>
                  <p className="text-purple-800 italic">"{entry.why_feeling}"</p>
                </div>
              )}
              
              {entry.activities.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Activities:</p>
                  <div className="flex flex-wrap gap-2">
                    {entry.activities.map((activity, idx) => (
                      <span key={idx} className="px-3 py-1 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 text-sm rounded-full font-medium">
                        {activity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {entry.notes && (
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Notes:</p>
                  <p className="text-gray-700 italic">"{entry.notes}"</p>
                </div>
              )}
              
              {/* Show intervention suggestions for low mood entries */}
              {entry.suggested_interventions && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
                  <p className="text-sm font-semibold text-orange-700 mb-3 flex items-center">
                    💙 Mood Support Suggestions:
                  </p>
                  <div className="space-y-3">
                    {entry.suggested_interventions.jokes && entry.suggested_interventions.jokes.length > 0 && (
                      <div className="bg-white rounded-lg p-3 border border-yellow-200">
                        <p className="text-xs font-semibold text-yellow-700 mb-1">😄 Joke:</p>
                        <p className="text-sm text-gray-700 italic">"{entry.suggested_interventions.jokes[0]}"</p>
                      </div>
                    )}
                    {entry.suggested_interventions.activities && entry.suggested_interventions.activities.length > 0 && (
                      <div className="bg-white rounded-lg p-3 border border-green-200">
                        <p className="text-xs font-semibold text-green-700 mb-1">🎯 Activity:</p>
                        <p className="text-sm text-gray-700">{entry.suggested_interventions.activities[0]}</p>
                      </div>
                    )}
                    {entry.suggested_interventions.funny_images && entry.suggested_interventions.funny_images.length > 0 && (
                      <div className="bg-white rounded-lg p-3 border border-purple-200">
                        <p className="text-xs font-semibold text-purple-700 mb-2">📸 Mood Booster:</p>
                        {entry.suggested_interventions.funny_images.slice(0, 1).map((img: any, idx: number) => (
                          <div key={idx} className="text-center">
                            {img.isLocal && img.emoji ? (
                              <div className="bg-purple-50 rounded-lg p-3">
                                <div className="text-3xl mb-1">{img.emoji}</div>
                                <p className="text-xs text-purple-700">{img.caption}</p>
                              </div>
                            ) : img.url ? (
                              <div>
                                <img 
                                  src={img.url} 
                                  alt={img.caption} 
                                  className="w-full max-w-32 mx-auto rounded-lg shadow-sm mb-1" 
                                  style={{maxHeight: '80px', objectFit: 'cover'}}
                                  onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                                />
                                <p className="text-xs text-purple-700">{img.caption}</p>
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    )}
                    {entry.suggested_interventions.gifs && entry.suggested_interventions.gifs.length > 0 && (
                      <div className="bg-white rounded-lg p-3 border border-pink-200">
                        <p className="text-xs font-semibold text-pink-700 mb-2">🎬 Animation:</p>
                        {entry.suggested_interventions.gifs.slice(0, 1).map((gif: any, idx: number) => (
                          <div key={idx} className="text-center">
                            <img 
                              src={gif.url} 
                              alt={gif.caption} 
                              className="w-full max-w-32 mx-auto rounded-lg shadow-sm mb-1" 
                              style={{maxHeight: '80px', objectFit: 'cover'}}
                              onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                            />
                            <p className="text-xs text-pink-700">{gif.caption}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {entry.suggested_interventions.mindfulness && entry.suggested_interventions.mindfulness.length > 0 && (
                      <div className="bg-white rounded-lg p-3 border border-blue-200">
                        <p className="text-xs font-semibold text-blue-700 mb-1">🧘 Mindfulness:</p>
                        <p className="text-sm text-gray-700">{entry.suggested_interventions.mindfulness[0]}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Mental Health Activities Component
const MentalHealthActivities: React.FC<{ user: UserMentalHealthProfile }> = () => {
  const activities = [
    {
      name: 'Guided Meditation',
      description: '10-minute mindfulness meditation for stress relief and mental clarity',
      duration: '10 min',
      category: 'Meditation',
      icon: Brain,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'from-purple-100 to-purple-200'
    },
    {
      name: 'Breathing Exercise',
      description: '4-7-8 breathing technique to reduce anxiety and promote calmness',
      duration: '5 min',
      category: 'Breathing',
      icon: Heart,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'from-blue-100 to-blue-200'
    },
    {
      name: 'Gratitude Journal',
      description: 'Write down three things you\'re grateful for to boost positivity',
      duration: '15 min',
      category: 'Journaling',
      icon: MessageCircle,
      color: 'from-green-500 to-green-600',
      bgColor: 'from-green-100 to-green-200'
    },
    {
      name: 'Progressive Muscle Relaxation',
      description: 'Full-body relaxation technique to release physical tension',
      duration: '20 min',
      category: 'Relaxation',
      icon: Calendar,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'from-orange-100 to-orange-200'
    },
    {
      name: 'Mindful Walking',
      description: 'Connect with nature while practicing mindfulness outdoors',
      duration: '25 min',
      category: 'Movement',
      icon: Target,
      color: 'from-teal-500 to-teal-600',
      bgColor: 'from-teal-100 to-teal-200'
    },
    {
      name: 'Positive Affirmations',
      description: 'Boost self-confidence with personalized positive statements',
      duration: '10 min',
      category: 'Self-Care',
      icon: Smile,
      color: 'from-pink-500 to-pink-600',
      bgColor: 'from-pink-100 to-pink-200'
    }
  ]

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center">
          <Play className="w-8 h-8 mr-3 text-brand" />
          Mental Health Activities
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Choose from our curated selection of evidence-based activities designed to support your mental wellness journey.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activities.map((activity, index) => (
          <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 p-6 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
            <div className="flex items-center mb-6">
              <div className={`p-3 bg-gradient-to-br ${activity.bgColor} rounded-xl`}>
                <activity.icon className="w-6 h-6 text-gray-700" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-bold text-gray-900">{activity.name}</h3>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>{activity.duration}</span>
                  <span>•</span>
                  <span>{activity.category}</span>
                </div>
              </div>
            </div>
            
            <p className="text-gray-600 mb-6 leading-relaxed">{activity.description}</p>
            
            <button className={`w-full px-4 py-3 bg-gradient-to-r ${activity.color} hover:opacity-90 text-white rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg font-semibold`}>
              Start Activity
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// Insights Component
const MentalHealthInsights: React.FC<{
  moodEntries: MoodEntry[]
  user: UserMentalHealthProfile
}> = ({ moodEntries, user }) => {
  const avgMoodScore = moodEntries.length > 0 
    ? moodEntries.reduce((sum, entry) => {
        return sum + entry.mood_rating // Use new mood_rating (1-5 scale)
      }, 0) / moodEntries.length
    : 0

  const weeklyData = moodEntries.slice(0, 7)
  const avgWeeklyStress = weeklyData.length > 0 
    ? weeklyData.reduce((sum, entry) => sum + entry.stress_level, 0) / weeklyData.length
    : 0

  const avgWeeklyEnergy = weeklyData.length > 0 
    ? weeklyData.reduce((sum, entry) => sum + entry.energy_level, 0) / weeklyData.length
    : 0

  // Prepare data for mood trends chart (last 7 days)
  const chartData = weeklyData.reverse().map((entry, index) => ({
    day: new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short' }),
    mood: entry.mood_rating,
    energy: entry.energy_level,
    stress: entry.stress_level,
    emoji: entry.mood_emoji,
    uniqueKey: `${entry.id}-${index}` // Ensure unique keys for React
  }))

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center">
          <TrendingUp className="w-8 h-8 mr-3 text-brand" />
          Mental Health Insights & Trends
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Track your mental health journey with personalized insights and progress analytics.
        </p>
      </div>
      
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 p-8 shadow-lg">
        {moodEntries.length === 0 ? (
          <div className="text-center py-16">
            <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No Data Yet</h3>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
              Start logging your mood entries to see personalized insights and track your mental health patterns.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Mood Trends Chart */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-brand" />
                Weekly Mood Trends
              </h3>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
                <div className="space-y-6">
                  {/* Chart Container */}
                  <div className="relative h-64 bg-white rounded-lg p-4 border border-gray-200">
                    <svg className="w-full h-full" viewBox="0 0 400 200">
                      {/* Grid lines */}
                      {[1, 2, 3, 4, 5].map(line => (
                        <line 
                          key={line}
                          x1="50" 
                          y1={40 * line} 
                          x2="380" 
                          y2={40 * line}
                          stroke="#e5e7eb"
                          strokeWidth="1"
                        />
                      ))}
                      
                      {/* Y-axis labels */}
                      {[5, 4, 3, 2, 1].map((value, index) => (
                        <text 
                          key={value}
                          x="30" 
                          y={40 * (index + 1) + 5}
                          className="text-xs fill-gray-600"
                        >
                          {value}
                        </text>
                      ))}
                      
                      {/* Mood trend line */}
                      {chartData.length > 1 && (
                        <polyline
                          points={chartData.map((data, index) => 
                            `${70 + (index * 45)},${200 - (data.mood * 35)}`
                          ).join(' ')}
                          fill="none"
                          stroke="#667eea"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                      )}
                      
                      {/* Mood data points */}
                      {chartData.map((data, index) => (
                        <g key={data.uniqueKey}>
                          <circle
                            cx={70 + (index * 45)}
                            cy={200 - (data.mood * 35)}
                            r="6"
                            fill="#667eea"
                            className="hover:r-8 transition-all cursor-pointer"
                          />
                          <text
                            x={70 + (index * 45)}
                            y={200 - (data.mood * 35) - 15}
                            className="text-lg"
                            textAnchor="middle"
                          >
                            {data.emoji}
                          </text>
                        </g>
                      ))}
                      
                      {/* X-axis labels */}
                      {chartData.map((data, index) => (
                        <text
                          key={`${data.uniqueKey}-label`}
                          x={70 + (index * 45)}
                          y={190}
                          className="text-xs fill-gray-600"
                          textAnchor="middle"
                        >
                          {data.day}
                        </text>
                      ))}
                    </svg>
                  </div>
                  
                  {/* Chart Legend */}
                  <div className="flex items-center justify-center space-x-6 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-brand rounded-full"></div>
                      <span className="text-gray-600">Mood Rating (1-5)</span>
                    </div>
                    <div className="text-gray-500">
                      Last {chartData.length} days
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Overview Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                <p className="text-sm font-semibold text-gray-600 mb-2">Total Entries</p>
                <p className="text-3xl font-bold text-blue-600">{moodEntries.length}</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                <p className="text-sm font-semibold text-gray-600 mb-2">Avg Mood Score</p>
                <p className="text-3xl font-bold text-green-600">{avgMoodScore.toFixed(1)}/5</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
                <p className="text-sm font-semibold text-gray-600 mb-2">Avg Stress (7d)</p>
                <p className="text-3xl font-bold text-orange-600">{avgWeeklyStress.toFixed(1)}/10</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                <p className="text-sm font-semibold text-gray-600 mb-2">Avg Energy (7d)</p>
                <p className="text-3xl font-bold text-purple-600">{avgWeeklyEnergy.toFixed(1)}/10</p>
              </div>
            </div>

            {/* Goals Progress */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-brand" />
                Your Goals Progress
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {user.mood_goals.map((goal, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{goal}</span>
                      <span className="text-xs text-green-600 font-semibold">In Progress</span>
                    </div>
                    <div className="mt-2 bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-brand to-brand-dark h-2 rounded-full" style={{width: `${Math.random() * 60 + 20}%`}}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-gradient-to-r from-brand/5 to-brand/10 rounded-xl p-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4">Personalized Recommendations</h4>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-brand rounded-full mt-2"></div>
                  <p className="text-gray-700">Based on your recent entries, consider trying meditation to help reduce stress levels.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-brand rounded-full mt-2"></div>
                  <p className="text-gray-700">Your energy levels show improvement! Keep up your current wellness routine.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-brand rounded-full mt-2"></div>
                  <p className="text-gray-700">Try journaling when you feel anxious - it can help process emotions better.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Profile Settings Component  
const ProfileSettings: React.FC<{
  user: UserMentalHealthProfile
  onUpdate: (user: UserMentalHealthProfile) => void
}> = ({ user }) => {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center">
          <Target className="w-8 h-8 mr-3 text-brand" />
          Profile Settings
        </h2>
        <p className="text-lg text-gray-600">Manage your mental health profile and preferences</p>
      </div>
      
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 p-8 shadow-lg">
        <div className="space-y-8">
          {/* Basic Information */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Target className="w-5 h-5 mr-2 text-brand" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                <p className="text-lg text-gray-900">{user.name}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <p className="text-lg text-gray-900">{user.email}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Stress Level</label>
                <p className="text-lg text-gray-900 capitalize">{user.stress_level}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Sleep Target</label>
                <p className="text-lg text-gray-900">{user.sleep_hours} hours</p>
              </div>
            </div>
          </div>
          
          {/* Areas of Concern */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Heart className="w-5 h-5 mr-2 text-red-500" />
              Areas of Concern
            </h3>
            <div className="flex flex-wrap gap-3">
              {user.concerns.length > 0 ? (
                user.concerns.map((concern, index) => (
                  <span key={index} className="px-4 py-2 bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 text-sm rounded-full font-medium">
                    {concern}
                  </span>
                ))
              ) : (
                <p className="text-gray-500 italic">No areas of concern specified</p>
              )}
            </div>
          </div>
          
          {/* Preferred Activities */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Play className="w-5 h-5 mr-2 text-green-600" />
              Preferred Activities
            </h3>
            <div className="flex flex-wrap gap-3">
              {user.preferred_activities.length > 0 ? (
                user.preferred_activities.map((activity, index) => (
                  <span key={index} className="px-4 py-2 bg-gradient-to-r from-green-100 to-green-200 text-green-800 text-sm rounded-full font-medium">
                    {activity}
                  </span>
                ))
              ) : (
                <p className="text-gray-500 italic">No preferred activities specified</p>
              )}
            </div>
          </div>
          
          {/* Mental Health Goals */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2 text-purple-600" />
              Mental Health Goals
            </h3>
            <div className="flex flex-wrap gap-3">
              {user.mood_goals.length > 0 ? (
                user.mood_goals.map((goal, index) => (
                  <span key={index} className="px-4 py-2 bg-gradient-to-r from-brand to-brand-dark text-white text-sm rounded-full font-medium">
                    {goal}
                  </span>
                ))
              ) : (
                <p className="text-gray-500 italic">No mental health goals set</p>
              )}
            </div>
          </div>
          
          <div className="pt-6 border-t border-gray-200">
            <button className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg font-semibold">
              Edit Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Intervention History Component
const InterventionHistoryView: React.FC<{ history: InterventionHistory[] }> = ({ history }) => {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center">
          <Calendar className="w-8 h-8 mr-3 text-brand" />
          Intervention History
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          View all the jokes, music, games, and other mood boosters that have helped you feel better.
        </p>
      </div>
      
      {history.length === 0 ? (
        <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-gray-900 mb-4">No History Yet</h3>
          <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
            Start logging mood entries with low ratings to see your intervention history here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((entry) => (
            <div key={entry.id} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 p-6 shadow-lg hover:shadow-xl transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">
                    {entry.intervention_type === 'joke' && '😂'}
                    {entry.intervention_type === 'music' && '🎵'}
                    {entry.intervention_type === 'game' && '🎮'}
                    {entry.intervention_type === 'image' && '📸'}
                    {entry.intervention_type === 'breathing' && '🧘‍♀️'}
                    {entry.intervention_type === 'activity' && '🎯'}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 capitalize">{entry.intervention_type}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(entry.date).toLocaleDateString('en-US', { 
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  entry.user_response === 'helped' ? 'bg-green-100 text-green-800' :
                  entry.user_response === 'neutral' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {entry.user_response === 'helped' ? '👍 Helped' :
                   entry.user_response === 'neutral' ? '😐 Neutral' :
                   '👎 Not helpful'}
                </span>
              </div>
              
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4">
                {entry.intervention_type === 'joke' && (
                  <p className="text-gray-700 italic">"{entry.content}"</p>
                )}
                
                {entry.intervention_type === 'music' && entry.content.title && (
                  <div>
                    <p className="font-medium text-gray-800">🎵 {entry.content.title}</p>
                    <p className="text-sm text-gray-600">by {entry.content.artist}</p>
                  </div>
                )}
                
                {entry.intervention_type === 'game' && entry.content.name && (
                  <div>
                    <p className="font-medium text-gray-800">🎮 {entry.content.name}</p>
                  </div>
                )}
                
                {entry.intervention_type === 'image' && (
                  <div>
                    <p className="text-gray-700">{entry.content.caption || 'Funny image'}</p>
                    {entry.content.emoji && (
                      <span className="text-2xl">{entry.content.emoji}</span>
                    )}
                  </div>
                )}
                
                {['breathing', 'activity'].includes(entry.intervention_type) && (
                  <p className="text-gray-700">{entry.content}</p>
                )}
              </div>
              
              {entry.user_feedback && (
                <div className="mt-4 bg-blue-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-blue-800 mb-1">Your feedback:</p>
                  <p className="text-blue-700 italic">"{entry.user_feedback}"</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
