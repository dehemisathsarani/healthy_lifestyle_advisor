import React, { useState, useEffect, useCallback } from 'react'
import { Brain, Heart, MessageCircle, TrendingUp, Target, Smile } from 'lucide-react'
import type { UserMentalHealthProfile as SessionUserProfile } from '../services/MentalHealthSessionManager'
import { 
  mentalHealthAPI, 
  MoodAnalysisResponse, 
  YouTubeTrackResponse, 
  JokeResponse, 
  FunnyImageResponse,
  HistoryResponse,
  CrisisResources
} from '../services/mentalHealthAPI'

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
      suggestGameUVGames: (mood?: string) => void
      startGame: (gameName: string) => void
      startBreathing: () => void
      close: () => void
    }
    globalStopMusic?: () => void
    // GameUV functions
    handleGameUVSelection?: (gameName: string, category: string) => void
    playGameInPlatform?: (gameName: string, category: string) => void
    generateInPlatformGame?: (gameName: string, category: string) => string
    exploreGameUVCategory?: (category: string) => void
    visitGameUVPlatform?: () => void
    getPersonalizedGameUVSuggestions?: () => void
    // Smile Challenge functions
    smileGameActive?: boolean
    smileScore?: number
    startSmileChallenge?: () => void
    makeSmileFace?: (emoji: string) => void
  }
}

type MoodRating = 1 | 2 | 3 | 4 | 5
type MoodType = 'happy' | 'sad' | 'anxious' | 'angry' | 'neutral' | 'excited' | 'stressed' | 'calm' | 'overwhelmed' | 'content'

interface MoodEntry {
  id: string
  rating: MoodRating
  type: MoodType
  notes: string
  timestamp: Date
  interventions?: InterventionHistory[]
}

interface InterventionHistory {
  id: string
  moodEntryId: string
  type: 'music' | 'meditation' | 'exercise' | 'games' | 'breathing' | 'journaling' | 'visualization' | 'affirmations' | 'nature_sounds' | 'game_suggestions' | 'joke' | 'image' | 'youtube'
  details: any
  timestamp: Date
  effectiveness: 'helpful' | 'somewhat_helpful' | 'not_helpful' | 'helped'
}

export interface UserMentalHealthProfile extends SessionUserProfile {
  id: string
  name: string
  email: string
  phone?: string
  preferences: {
    interventions: string[]
    musicGenres: string[]
    exerciseTypes: string[]
  }
  goals: string[]
  emergencyContacts: Array<{
    name: string
    phone: string
    relationship: string
  }>
  riskLevel: 'low' | 'medium' | 'high'
}

interface MentalHealthAgentProps {
  onBackToServices: () => void
  authenticatedUser?: SessionUserProfile | null
}

interface ContentState {
  currentJoke?: JokeResponse
  currentImage?: FunnyImageResponse
  currentYouTube?: YouTubeTrackResponse
  jokes: JokeResponse[]
  images: FunnyImageResponse[]
  youtubeHistory: YouTubeTrackResponse[]
  mood?: string
  moodAnalysis?: MoodAnalysisResponse
  showingContent: boolean
  userStoppedContent: boolean
}

export const EnhancedMentalHealthAgent: React.FC<MentalHealthAgentProps> = ({ onBackToServices, authenticatedUser }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<UserMentalHealthProfile | null>(null)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'mood' | 'activities' | 'insights' | 'profile' | 'history'>('dashboard')
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([])
  const [interventionHistory, setInterventionHistory] = useState<InterventionHistory[]>([])
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)
  
  // Enhanced state for new functionality
  const [contentState, setContentState] = useState<ContentState>({
    jokes: [],
    images: [],
    youtubeHistory: [],
    showingContent: false,
    userStoppedContent: false
  })
  const [userHistory, setUserHistory] = useState<HistoryResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showCrisisModal, setShowCrisisModal] = useState(false)
  const [crisisResources, setCrisisResources] = useState<CrisisResources | null>(null)
  const [userInput, setUserInput] = useState('')

  // Load data when component mounts or user changes
  useEffect(() => {
    if (authenticatedUser?.id) {
      setIsAuthenticated(true)
      setUser(authenticatedUser as UserMentalHealthProfile)
      loadMoodEntries(authenticatedUser.id)
      loadInterventionHistory(authenticatedUser.id)
      loadUserHistory(authenticatedUser.id)
    }
  }, [authenticatedUser])

  const loadMoodEntries = (userId: string) => {
    const entries = localStorage.getItem(`moodEntries_${userId}`)
    if (entries) {
      const parsedEntries = JSON.parse(entries).map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp)
      }))
      setMoodEntries(parsedEntries)
    }
  }

  const loadInterventionHistory = (userId: string) => {
    const history = localStorage.getItem(`interventionHistory_${userId}`)
    if (history) {
      const parsedHistory = JSON.parse(history).map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      }))
      setInterventionHistory(parsedHistory)
    }
  }

  const loadUserHistory = async (userId: string) => {
    try {
      const history = await mentalHealthAPI.getHistory(userId, 100)
      setUserHistory(history)
    } catch (error) {
      console.error('Failed to load user history:', error)
    }
  }

  const saveMoodEntry = useCallback((entry: Omit<MoodEntry, 'id' | 'timestamp'>) => {
    if (!user) return

    const newEntry: MoodEntry = {
      ...entry,
      id: Date.now().toString(),
      timestamp: new Date()
    }

    const updatedEntries = [newEntry, ...moodEntries]
    setMoodEntries(updatedEntries)
    localStorage.setItem(`moodEntries_${user.id}`, JSON.stringify(updatedEntries))
    
    return newEntry.id
  }, [user, moodEntries])

  const saveInteractionHistory = useCallback((moodEntryId: string, type: InterventionHistory['type'], details: any, effectiveness: InterventionHistory['effectiveness']) => {
    if (!user) return

    const newIntervention: InterventionHistory = {
      id: Date.now().toString(),
      moodEntryId,
      type,
      details,
      timestamp: new Date(),
      effectiveness
    }

    const updatedHistory = [newIntervention, ...interventionHistory]
    setInterventionHistory(updatedHistory)
    localStorage.setItem(`interventionHistory_${user.id}`, JSON.stringify(updatedHistory))

    // Also save to backend
    mentalHealthAPI.saveToHistory(user.id, type, details).catch(console.error)
  }, [user, interventionHistory])

  const handleUserInput = async (inputText: string) => {
    if (!user || !inputText.trim()) return

    setIsLoading(true)
    setUserInput('')
    
    try {
      // Check for crisis language first
      if (mentalHealthAPI.detectCrisisLanguage(inputText)) {
        const resources = await mentalHealthAPI.getCrisisResources()
        setCrisisResources(resources)
        setShowCrisisModal(true)
        setIsLoading(false)
        return
      }

      // Analyze mood
      const moodAnalysis = await mentalHealthAPI.analyzeMood({
        text: inputText,
        user_id: user.id
      })

      if (moodAnalysis.detected_mood === 'crisis') {
        const resources = await mentalHealthAPI.getCrisisResources()
        setCrisisResources(resources)
        setShowCrisisModal(true)
        setIsLoading(false)
        return
      }

      // Update content state with mood analysis
      setContentState(prev => ({
        ...prev,
        mood: moodAnalysis.detected_mood,
        moodAnalysis,
        showingContent: true,
        userStoppedContent: false
      }))

      // Start providing content based on mood
      await startMoodBasedContent(moodAnalysis.detected_mood, moodAnalysis)

    } catch (error) {
      console.error('Error handling user input:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const startMoodBasedContent = async (mood: string, analysis: MoodAnalysisResponse) => {
    if (!user) return

    // Save mood entry
    const moodEntryId = saveMoodEntry({
      rating: 3,
      type: mood as MoodType,
      notes: analysis.message
    })

    if (!moodEntryId) return

    try {
      // Get YouTube track for mood
      const youtubeTrack = await mentalHealthAPI.getYouTubeTrack(mood)
      
      // Get initial joke
      const joke = await mentalHealthAPI.getJoke()
      
      // Get initial funny image
      const funnyImage = await mentalHealthAPI.getFunnyImage()

      // Update content state
      setContentState(prev => ({
        ...prev,
        currentYouTube: youtubeTrack,
        currentJoke: joke,
        currentImage: funnyImage,
        jokes: [joke, ...prev.jokes],
        images: [funnyImage, ...prev.images],
        youtubeHistory: [youtubeTrack, ...prev.youtubeHistory]
      }))

      // Save interactions to history
      saveInteractionHistory(moodEntryId, 'youtube', youtubeTrack, 'helped')
      saveInteractionHistory(moodEntryId, 'joke', joke, 'helped')
      saveInteractionHistory(moodEntryId, 'image', funnyImage, 'helped')

      // Show the mood support modal
      showMoodSupportModal(mood, analysis, youtubeTrack, joke, funnyImage, moodEntryId)

    } catch (error) {
      console.error('Error starting mood-based content:', error)
    }
  }

  const showMoodSupportModal = (
    mood: string, 
    analysis: MoodAnalysisResponse, 
    youtubeTrack: YouTubeTrackResponse, 
    joke: JokeResponse, 
    funnyImage: FunnyImageResponse,
    moodEntryId: string
  ) => {
    // Create modal for mood support
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4'
    modal.id = 'mood-support-modal'

    const updateModalContent = () => {
      modal.innerHTML = `
        <div class="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-purple-200">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-3xl font-bold text-purple-900">
              💙 Mental Health Support
            </h2>
            <button onclick="this.closest('#mood-support-modal').remove()" class="text-gray-500 hover:text-gray-700 text-2xl font-bold">
              &times;
            </button>
          </div>

          <div class="mb-6 p-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl border border-purple-200">
            <p class="text-lg text-purple-800 font-medium">${analysis.message}</p>
            ${analysis.suggestions.length > 0 ? `
              <div class="mt-3">
                <p class="text-sm text-purple-700 mb-2">💡 Suggestions:</p>
                <ul class="list-disc list-inside text-purple-700">
                  ${analysis.suggestions.map(suggestion => `<li class="text-sm">${suggestion}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>

          <!-- YouTube Music Section -->
          <div class="mb-6 p-6 bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl border border-red-200">
            <h3 class="text-xl font-bold text-red-900 mb-4 flex items-center">
              🎵 Music for Your ${mood.charAt(0).toUpperCase() + mood.slice(1)} Mood
            </h3>
            <div class="bg-white rounded-xl p-4 mb-4 border border-red-100">
              <div class="flex items-center justify-between mb-3">
                <div>
                  <h4 class="font-semibold text-red-800">${youtubeTrack.title}</h4>
                  <p class="text-red-600 text-sm">by ${youtubeTrack.artist} • ${youtubeTrack.duration}</p>
                </div>
                <div class="flex gap-2">
                  <button onclick="window.moodModal.playMusic && window.moodModal.playMusic('${youtubeTrack.title}', '${youtubeTrack.artist}')" 
                    class="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition-colors">
                    🔄 New Song
                  </button>
                  <button onclick="window.moodModal.stopMusic()" 
                    class="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors">
                    ⏹️ Stop
                  </button>
                </div>
              </div>
              <div class="relative rounded-lg overflow-hidden shadow-lg">
                <iframe 
                  width="100%" 
                  height="300" 
                  src="${youtubeTrack.embed_url}"
                  frameborder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                  allowfullscreen>
                </iframe>
              </div>
            </div>
          </div>

          <!-- Jokes Section -->
          <div class="mb-6 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200">
            <h3 class="text-xl font-bold text-yellow-900 mb-4 flex items-center">
              😄 Here's a Joke for You
            </h3>
            <div class="bg-white rounded-xl p-4 mb-4 border border-yellow-100">
              <p class="text-yellow-800 text-lg italic mb-4">"${joke.joke}"</p>
              <div class="flex gap-2 flex-wrap">
                <button onclick="window.moodModal.nextJoke()" 
                  class="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium transition-colors">
                  😂 Another Joke!
                </button>
                <button onclick="window.moodModal.showCartoon()" 
                  class="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors">
                  📸 Show Funny Image!
                </button>
                <button onclick="window.moodModal.stopJokes()" 
                  class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors">
                  I'm Good, Thanks 😊
                </button>
              </div>
            </div>
          </div>

          <!-- Funny Images Section -->
          ${contentState.currentImage ? `
            <div class="mb-6 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
              <h3 class="text-xl font-bold text-purple-900 mb-4 flex items-center">
                📸 Something to Make You Smile
              </h3>
              <div class="bg-white rounded-xl p-4 mb-4 border border-purple-100">
                ${funnyImage.url ? `
                  <div class="text-center mb-4">
                    <img src="${funnyImage.url}" alt="${funnyImage.description}" 
                      class="w-full max-w-xs mx-auto rounded-lg shadow-md" 
                      style="max-height: 300px; object-fit: cover;" 
                      onerror="this.style.display='none'">
                  </div>
                ` : ''}
                <div class="text-center ${funnyImage.type === 'emoji' ? 'text-4xl mb-3' : ''}">
                  ${funnyImage.type === 'emoji' ? funnyImage.caption : ''}
                </div>
                ${funnyImage.type !== 'emoji' ? `
                  <p class="text-purple-700 text-center font-medium">${funnyImage.caption}</p>
                ` : ''}
                <div class="flex gap-2 justify-center mt-4">
                  <button onclick="window.moodModal.nextImage()" 
                    class="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors">
                    🎨 Another Image!
                  </button>
                </div>
              </div>
            </div>
          ` : ''}

          <!-- Action Buttons -->
          <div class="flex gap-4 justify-center pt-4 border-t border-purple-200">
            <button onclick="window.moodModal.startBreathing && window.moodModal.startBreathing()" 
              class="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors">
              🧘 Breathing Exercise
            </button>
            <button onclick="window.moodModal.suggestGameUVGames && window.moodModal.suggestGameUVGames('${mood}')" 
              class="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors">
              🎮 Therapeutic Games
            </button>
            <button onclick="this.closest('#mood-support-modal').remove()" 
              class="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors">
              ✨ I Feel Better
            </button>
          </div>
        </div>
      `
    }

    // Initial content
    updateModalContent()

    // Add modal to DOM
    document.body.appendChild(modal)

    // Set up modal functions
    window.moodModal = {
      nextJoke: async () => {
        try {
          const newJoke = await mentalHealthAPI.getJoke()
          setContentState(prev => ({
            ...prev,
            currentJoke: newJoke,
            jokes: [newJoke, ...prev.jokes]
          }))
          saveInteractionHistory(moodEntryId, 'joke', newJoke, 'helped')
          
          // Update modal content
          const jokeSection = modal.querySelector('.bg-gradient-to-r.from-yellow-50')
          if (jokeSection) {
            const jokeText = jokeSection.querySelector('p.italic')
            if (jokeText) {
              jokeText.textContent = `"${newJoke.joke}"`
            }
          }
        } catch (error) {
          console.error('Error getting new joke:', error)
        }
      },

      showCartoon: async () => {
        try {
          const newImage = await mentalHealthAPI.getFunnyImage()
          setContentState(prev => ({
            ...prev,
            currentImage: newImage,
            images: [newImage, ...prev.images]
          }))
          saveInteractionHistory(moodEntryId, 'image', newImage, 'helped')
          updateModalContent()
        } catch (error) {
          console.error('Error getting funny image:', error)
        }
      },

      stopJokes: () => {
        setContentState(prev => ({ ...prev, userStoppedContent: true }))
      },

      nextImage: async () => {
        try {
          const newImage = await mentalHealthAPI.getFunnyImage()
          setContentState(prev => ({
            ...prev,
            currentImage: newImage,
            images: [newImage, ...prev.images]
          }))
          saveInteractionHistory(moodEntryId, 'image', newImage, 'helped')
          updateModalContent()
        } catch (error) {
          console.error('Error getting new image:', error)
        }
      },

      playMusic: async (title: string, artist: string) => {
        try {
          const newTrack = await mentalHealthAPI.getYouTubeTrack(mood)
          setContentState(prev => ({
            ...prev,
            currentYouTube: newTrack,
            youtubeHistory: [newTrack, ...prev.youtubeHistory]
          }))
          saveInteractionHistory(moodEntryId, 'youtube', newTrack, 'helped')
          updateModalContent()
        } catch (error) {
          console.error('Error getting new YouTube track:', error)
        }
      },

      stopMusic: () => {
        if (currentAudio) {
          currentAudio.pause()
          setCurrentAudio(null)
        }
      },

      startBreathing: () => {
        // Implement breathing exercise modal
        console.log('Starting breathing exercise')
      },

      suggestGameUVGames: (mood?: string) => {
        console.log('Suggesting GameUV games for mood:', mood)
      },

      close: () => {
        modal.remove()
      },
      
      // Placeholder functions for compatibility
      nextGame: () => console.log('Next game'),
      askMusicPreference: () => console.log('Ask music preference'),
      startGame: () => console.log('Start game')
    }
  }

  // Crisis Modal Component
  const CrisisModal = () => {
    if (!showCrisisModal || !crisisResources) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-red-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-red-900">
              🆘 Immediate Support Available
            </h2>
            <button 
              onClick={() => setShowCrisisModal(false)}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          <div className="mb-6 p-4 bg-gradient-to-r from-red-100 to-pink-100 rounded-xl border border-red-200">
            <p className="text-lg text-red-800 font-medium mb-4">
              I'm concerned about what you've shared. Your safety and wellbeing are important.
            </p>
            
            {crisisResources.immediate_support.map((message, index) => (
              <p key={index} className="text-red-700 mb-2">• {message}</p>
            ))}
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-bold text-red-900 mb-4">📞 Crisis Support Resources</h3>
            <div className="space-y-3">
              {crisisResources.emergency_numbers.map((resource, index) => (
                <div key={index} className="bg-white rounded-xl p-4 border border-red-100">
                  <h4 className="font-semibold text-red-800">{resource.name}</h4>
                  {resource.number && (
                    <p className="text-red-600 font-mono text-lg">{resource.number}</p>
                  )}
                  {resource.url && (
                    <a href={resource.url} target="_blank" rel="noopener noreferrer" 
                      className="text-blue-600 hover:text-blue-800 underline text-sm">
                      Visit Website
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4 justify-center pt-4 border-t border-red-200">
            <button 
              onClick={() => window.open('tel:988', '_self')}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
            >
              📞 Call 988 Now
            </button>
            <button 
              onClick={() => setShowCrisisModal(false)}
              className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              I'm Safe Now
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Main conversation interface
  const ConversationInterface = () => (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border-2 border-purple-200 shadow-lg">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-purple-900 mb-2">
          💙 How are you feeling today?
        </h3>
        <p className="text-purple-700">
          Share your thoughts with me, and I'll help with personalized support including music, jokes, and activities.
        </p>
      </div>

      <div className="mb-4">
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Tell me how you're feeling... (e.g., 'I'm feeling really sad today' or 'I'm anxious about work')"
          className="w-full p-4 rounded-xl border-2 border-purple-200 focus:border-purple-400 focus:outline-none resize-none"
          rows={3}
        />
      </div>

      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => handleUserInput(userInput)}
          disabled={!userInput.trim() || isLoading}
          className="px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
        >
          {isLoading ? '🔄 Analyzing...' : '💬 Share My Feelings'}
        </button>
        
        {/* Quick mood buttons */}
        <button
          onClick={() => handleUserInput("I'm feeling sad")}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
        >
          😢 Sad
        </button>
        <button
          onClick={() => handleUserInput("I'm feeling anxious")}
          disabled={isLoading}
          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm transition-colors"
        >
          😰 Anxious
        </button>
        <button
          onClick={() => handleUserInput("I'm feeling angry")}
          disabled={isLoading}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition-colors"
        >
          😠 Angry
        </button>
        <button
          onClick={() => handleUserInput("I'm feeling tired")}
          disabled={isLoading}
          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm transition-colors"
        >
          😴 Tired
        </button>
        <button
          onClick={() => handleUserInput("I'm feeling happy")}
          disabled={isLoading}
          className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg text-sm transition-colors"
        >
          😊 Happy
        </button>
      </div>

      {contentState.moodAnalysis && (
        <div className="mt-6 p-4 bg-white rounded-xl border-2 border-purple-200">
          <p className="text-purple-800 font-medium">{contentState.moodAnalysis.message}</p>
        </div>
      )}
    </div>
  )

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 p-4">
        <div className="max-w-md mx-auto mt-20">
          <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
            <Brain className="w-16 h-16 text-purple-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Mental Health Agent</h2>
            <p className="text-gray-600 mb-6">Please log in to access your personalized mental health support.</p>
            <button
              onClick={onBackToServices}
              className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
            >
              Back to Services
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={onBackToServices}
              className="mr-4 p-2 rounded-lg hover:bg-white hover:bg-opacity-50 transition-colors"
            >
              ←
            </button>
            <div>
              <h1 className="text-3xl font-bold text-purple-900 flex items-center">
                <Heart className="w-8 h-8 mr-3 text-purple-600" />
                Enhanced Mental Health Agent
              </h1>
              <p className="text-purple-700">AI-powered emotional support with music, humor, and personalized care</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-purple-600">Welcome back,</p>
              <p className="font-semibold text-purple-900">{user.name}</p>
            </div>
          </div>
        </div>

        {/* Main conversation interface */}
        <div className="mb-8">
          <ConversationInterface />
        </div>

        {/* Navigation tabs */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-200 overflow-hidden">
          <div className="flex border-b-2 border-purple-200">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
              { id: 'mood', label: 'Mood Tracker', icon: Heart },
              { id: 'activities', label: 'Activities', icon: Target },
              { id: 'insights', label: 'Insights', icon: Brain },
              { id: 'history', label: 'History', icon: MessageCircle },
              { id: 'profile', label: 'Profile', icon: Smile }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center px-4 py-3 font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-purple-500 text-white'
                      : 'text-purple-600 hover:bg-purple-50'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </div>

          <div className="p-6">
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Mental Health Dashboard</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">Recent Mood</h3>
                    <p className="text-blue-700">
                      {moodEntries.length > 0 
                        ? `${moodEntries[0].type} (${moodEntries[0].rating}/5)`
                        : 'No entries yet'
                      }
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-purple-900 mb-2">Support History</h3>
                    <p className="text-purple-700">
                      {userHistory ? `${userHistory.total_count} interactions` : 'Loading...'}
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-green-900 mb-2">Interventions</h3>
                    <p className="text-green-700">{interventionHistory.length} activities</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Support History</h2>
                
                {userHistory && userHistory.items.length > 0 ? (
                  <div className="space-y-4">
                    {userHistory.items.map((item) => (
                      <div key={item.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-purple-600 capitalize">
                            {item.type}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(item.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-gray-700">
                          {item.type === 'joke' && item.content.joke && (
                            <p className="italic">"{item.content.joke}"</p>
                          )}
                          {item.type === 'youtube' && item.content.title && (
                            <p>🎵 {item.content.title} by {item.content.artist}</p>
                          )}
                          {item.type === 'image' && item.content.caption && (
                            <p>📸 {item.content.caption}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No history available yet. Start a conversation to build your history!</p>
                  </div>
                )}
              </div>
            )}

            {/* Add other tab content here */}
            {activeTab !== 'dashboard' && activeTab !== 'history' && (
              <div className="text-center py-8">
                <p className="text-gray-500">This section is coming soon!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Crisis Modal */}
      <CrisisModal />
    </div>
  )
}

export default EnhancedMentalHealthAgent