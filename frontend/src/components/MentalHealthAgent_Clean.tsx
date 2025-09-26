import React, { useState, useEffect, useCallback } from 'react'
import { Brain, Heart, MessageCircle, TrendingUp, Play, Target, Smile } from 'lucide-react'
import type { UserMentalHealthProfile as SessionUserProfile } from '../services/MentalHealthSessionManager'

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
  type: 'music' | 'meditation' | 'exercise' | 'games' | 'breathing' | 'journaling' | 'visualization' | 'affirmations' | 'nature_sounds' | 'game_suggestions'
  details: any
  timestamp: Date
  effectiveness: 'helpful' | 'somewhat_helpful' | 'not_helpful' | 'helped'
}

interface UserMentalHealthProfile extends SessionUserProfile {
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

export const MentalHealthAgent: React.FC<MentalHealthAgentProps> = ({ onBackToServices, authenticatedUser }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<UserMentalHealthProfile | null>(null)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'mood' | 'activities' | 'insights' | 'profile' | 'history'>('dashboard')
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([])
  const [showMoodLogger, setShowMoodLogger] = useState(false)
  const [interventionHistory, setInterventionHistory] = useState<InterventionHistory[]>([])
  const [isVisible, setIsVisible] = useState(true)
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)

  // Load data when component mounts or user changes
  useEffect(() => {
    if (authenticatedUser?.id) {
      setIsAuthenticated(true)
      setUser(authenticatedUser as UserMentalHealthProfile)
      loadMoodEntries(authenticatedUser.id)
      loadInterventionHistory(authenticatedUser.id)
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
  }, [user, interventionHistory])

  const getGameUVSuggestions = (currentMood: string = 'default') => {
    // GameUV categories with Smile Challenge integration
    const gameUVCategories = {
      happy: [
        { category: 'Brain Training & Puzzles', mood: 'Keep your happy energy with fun challenges', games: ['2048', 'Ten (10)', 'Smile Challenge', 'Pipe Mania', 'Match-3'] },
        { category: 'Action & Adventure', mood: 'Channel your positive energy into exciting games', games: ['Checkers', 'Tower Defense', 'Smile Challenge', 'Crash It', 'Mad Dash'] },
        { category: 'Arcade Classics', mood: 'Celebrate your good mood with classic fun', games: ['Fruit Bounce', 'Space Cubes', 'Smile Challenge', 'Bubble Shooter', 'Pac-Style'] }
      ],
      sad: [
        { category: 'Mood Boosting Games', mood: 'Gentle games to lift your spirits', games: ['Smile Challenge', 'Color Therapy', 'Peaceful Puzzles', 'Happy Garden', 'Soothing Sounds'] },
        { category: 'Creative & Relaxing', mood: 'Express yourself and find calm', games: ['Art Therapy', 'Smile Challenge', 'Music Creation', 'Zen Drawing', 'Coloring Book'] },
        { category: 'Achievement & Progress', mood: 'Build confidence with rewarding challenges', games: ['Step by Step', 'Smile Challenge', 'Small Wins', 'Progress Quest', 'Achievement Hunter'] }
      ],
      anxious: [
        { category: 'Calming & Mindful', mood: 'Soothing games to ease anxiety', games: ['Breathing Helper', 'Smile Challenge', 'Meditation Garden', 'Calm Waters', 'Gentle Waves'] },
        { category: 'Focus & Concentration', mood: 'Channel anxious energy into focused activities', games: ['Concentration', 'Smile Challenge', 'Memory Match', 'Pattern Focus', 'Mind Clarity'] },
        { category: 'Stress Relief', mood: 'Games designed to reduce stress and worry', games: ['Stress Ball', 'Smile Challenge', 'Worry Stones', 'Tension Release', 'Calm Mind'] }
      ],
      angry: [
        { category: 'Energy Release', mood: 'Healthy ways to channel anger', games: ['Anger Ball', 'Smile Challenge', 'Power Punch', 'Energy Blast', 'Rage Release'] },
        { category: 'Cooling Down', mood: 'Games to help you cool off and relax', games: ['Cool Breeze', 'Smile Challenge', 'Ice Therapy', 'Chill Out', 'Calm Storm'] },
        { category: 'Problem Solving', mood: 'Turn anger into productive problem-solving', games: ['Logic Puzzles', 'Smile Challenge', 'Strategy Games', 'Solution Finder', 'Mind Solver'] }
      ],
      stressed: [
        { category: 'Stress Relief & Relaxation', mood: 'Unwind and decompress', games: ['Deep Breaths', 'Smile Challenge', 'Stress Away', 'Peaceful Mind', 'Relaxation Station'] },
        { category: 'Mindfulness & Meditation', mood: 'Present moment awareness games', games: ['Mindful Moments', 'Smile Challenge', 'Present Peace', 'Awareness Games', 'Here and Now'] },
        { category: 'Simple & Easy', mood: 'Low-pressure games for stressed minds', games: ['Easy Does It', 'Smile Challenge', 'Simple Simon', 'No Rush', 'Take It Slow'] }
      ],
      excited: [
        { category: 'High Energy Games', mood: 'Match your excitement with dynamic games', games: ['Energy Rush', 'Smile Challenge', 'Power Up', 'Excitement Peak', 'Thrill Games'] },
        { category: 'Celebration Games', mood: 'Celebrate your excitement!', games: ['Party Time', 'Smile Challenge', 'Celebration Central', 'Joy Games', 'Happy Dance'] },
        { category: 'Adventure & Exploration', mood: 'Channel excitement into adventure', games: ['Adventure Quest', 'Smile Challenge', 'Explorer Games', 'Discovery Zone', 'Quest Master'] }
      ]
    }

    return gameUVCategories[currentMood as keyof typeof gameUVCategories] || gameUVCategories.happy
  }

  const suggestGameUVGames2 = useCallback((moodEntryId: string, currentMood: string = 'default') => {
    const suggestions = getGameUVSuggestions(currentMood)
    
    // Create modal for GameUV suggestions
    const suggestionModal = document.createElement('div')
    suggestionModal.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4'
    suggestionModal.id = 'gameuv-suggestions-modal'

    suggestionModal.innerHTML = `
      <div class="bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 rounded-3xl p-8 max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            🎮 GameUV-Style Game Suggestions
          </h2>
          <button onclick="document.getElementById('gameuv-suggestions-modal').remove()" 
            class="text-gray-500 hover:text-gray-700 text-3xl font-bold transition-all transform hover:scale-110">&times;</button>
        </div>

        <div class="text-center mb-8">
          <div class="bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl p-6 mb-6">
            <h3 class="text-2xl font-bold text-purple-800 mb-2">
              ${currentMood === 'default' ? '🌟 Discover Amazing Games' : '🎯 Perfect Games for Your ' + currentMood.charAt(0).toUpperCase() + currentMood.slice(1) + ' Mood'}
            </h3>
            <p class="text-lg text-blue-700">
              ${currentMood === 'default' ? 'Explore our curated collection of therapeutic games!' : 'Handpicked games to help improve your mood'}
            </p>
          </div>
        </div>

        ${suggestions.map((category, _index) => 
          '<div class="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-200 hover:shadow-xl transition-all mb-6">' +
            '<div class="flex items-center mb-4">' +
              '<div class="w-12 h-12 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center mr-4">' +
                '<span class="text-2xl">🎯</span>' +
              '</div>' +
              '<div>' +
                '<h4 class="text-2xl font-bold text-gray-800">' + category.category + '</h4>' +
                '<p class="text-lg text-gray-600">' + category.mood + '</p>' +
              '</div>' +
            '</div>' +
            '<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">' +
              category.games.map(game => 
                '<div class="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-3 text-center hover:shadow-md transition-all cursor-pointer transform hover:scale-105" onclick="window.playGameInPlatform && window.playGameInPlatform(\'' + game + '\', \'' + category.category + '\')">' +
                  '<div class="text-lg font-semibold text-gray-700 mb-1">' + game + '</div>' +
                  '<div class="text-sm text-gray-500">Play Now</div>' +
                '</div>'
              ).join('') +
            '</div>' +
            '<div class="text-center">' +
              '<button onclick="window.exploreGameUVCategory && window.exploreGameUVCategory(\'' + category.category + '\')" class="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl font-bold shadow-lg transform transition-all hover:scale-105">' +
                '🚀 Explore ' + category.category +
              '</button>' +
            '</div>' +
          '</div>'
        ).join('')}

        <div class="mt-8 text-center">
          <div class="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl p-6 mb-4">
            <h3 class="text-xl font-bold text-orange-800 mb-2">✨ In-Platform Gaming Features</h3>
            <div class="grid md:grid-cols-3 gap-4 text-sm">
              <div class="flex items-center justify-center">
                <span class="text-green-600 mr-2">✅</span>
                <span>No External Sites</span>
              </div>
              <div class="flex items-center justify-center">
                <span class="text-green-600 mr-2">✅</span>
                <span>Therapeutic Gaming</span>
              </div>
              <div class="flex items-center justify-center">
                <span class="text-green-600 mr-2">✅</span>
                <span>Mood-Boosting Games</span>
              </div>
            </div>
          </div>
          
          <div class="flex justify-center gap-4">
            <button onclick="window.visitGameUVPlatform && window.visitGameUVPlatform()" 
              class="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-bold text-lg shadow-lg transform transition-all hover:scale-105">
              🏠 You're Already Here!
            </button>
            <button onclick="window.getPersonalizedGameUVSuggestions && window.getPersonalizedGameUVSuggestions()" 
              class="px-8 py-4 bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 text-white rounded-xl font-bold text-lg shadow-lg transform transition-all hover:scale-105">
              🎯 Personalize Games
            </button>
          </div>
        </div>
      </div>
    `
    
    document.body.appendChild(suggestionModal)

    // Set up GameUV game functions
    if (!window.playGameInPlatform) {
      window.playGameInPlatform = function(gameName: string, category: string) {
        const modal = document.getElementById('gameuv-suggestions-modal')
        if (modal) modal.remove()
        
        // Create game modal with Smile Challenge content
        const gameModal = document.createElement('div')
        gameModal.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-60 p-4'
        gameModal.id = 'in-platform-game-modal'
        
        let gameContent = ''
        
        // Special handling for Smile Challenge
        if (gameName.toLowerCase().includes('smile') || gameName.toLowerCase() === 'smile challenge') {
          gameContent = `
            <div class="bg-gradient-to-br from-yellow-50 to-pink-50 rounded-2xl p-8 max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
              <div class="flex justify-between items-center mb-6">
                <h3 class="text-3xl font-bold text-pink-900">😄 ${gameName} - Mood Booster Game</h3>
                <button onclick="document.getElementById('in-platform-game-modal').remove()" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
              </div>
              
              <div class="text-center mb-6">
                <p class="text-lg text-pink-700 mb-4">🎮 No login required • Instant play • Mood boosting fun!</p>
              </div>

              <div class="bg-white rounded-xl p-6 mb-6 border-2 border-pink-200">
                <div class="text-center">
                  <div class="w-64 h-64 mx-auto mb-6 bg-gradient-to-r from-yellow-200 to-pink-200 rounded-full flex items-center justify-center relative overflow-hidden border-4 border-pink-300" id="smile-mirror">
                    <div class="text-8xl animate-bounce">😊</div>
                    <div class="absolute bottom-4 text-pink-600 font-bold">Your Virtual Mirror!</div>
                  </div>
                  
                  <div class="mb-6">
                    <h4 class="text-2xl font-bold text-pink-800 mb-4">🎯 Challenge Progress</h4>
                    <div class="flex justify-center space-x-4">
                      <div class="bg-yellow-100 rounded-lg p-3 text-center">
                        <div class="text-2xl font-bold text-yellow-600" id="smile-score">0</div>
                        <div class="text-sm text-yellow-800">Smiles</div>
                      </div>
                      <div class="bg-pink-100 rounded-lg p-3 text-center">
                        <div class="text-2xl font-bold text-pink-600" id="time-left">30</div>
                        <div class="text-sm text-pink-800">Seconds</div>
                      </div>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <button onclick="window.makeSmileFace && window.makeSmileFace('😀')" class="bg-yellow-200 hover:bg-yellow-300 p-4 rounded-lg text-4xl transition-all transform hover:scale-110">😀</button>
                    <button onclick="window.makeSmileFace && window.makeSmileFace('😃')" class="bg-yellow-200 hover:bg-yellow-300 p-4 rounded-lg text-4xl transition-all transform hover:scale-110">😃</button>
                    <button onclick="window.makeSmileFace && window.makeSmileFace('😄')" class="bg-yellow-200 hover:bg-yellow-300 p-4 rounded-lg text-4xl transition-all transform hover:scale-110">😄</button>
                    <button onclick="window.makeSmileFace && window.makeSmileFace('🤣')" class="bg-yellow-200 hover:bg-yellow-300 p-4 rounded-lg text-4xl transition-all transform hover:scale-110">🤣</button>
                  </div>

                  <div class="flex gap-4 justify-center">
                    <button onclick="window.startSmileChallenge && window.startSmileChallenge()" class="px-8 py-4 bg-gradient-to-r from-pink-500 to-yellow-500 hover:from-pink-600 hover:to-yellow-600 text-white rounded-xl font-bold text-lg shadow-lg transform transition-all hover:scale-105">
                      🎮 Start Challenge!
                    </button>
                  </div>
                </div>
              </div>
            </div>
          `
        } else {
          // Default game placeholder
          gameContent = `
            <div class="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
              <div class="flex justify-between items-center mb-6">
                <h3 class="text-3xl font-bold text-blue-900">🎮 ${gameName}</h3>
                <button onclick="document.getElementById('in-platform-game-modal').remove()" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
              </div>
              
              <div class="text-center">
                <div class="text-6xl mb-4">🎮</div>
                <h4 class="text-2xl font-bold text-blue-800 mb-4">${gameName}</h4>
                <p class="text-lg text-blue-600 mb-6">A therapeutic game from ${category}</p>
                <p class="text-gray-600 mb-8">This game is designed to help improve your mood while having fun!</p>
                
                <button onclick="alert('🎮 Starting ${gameName}! This is a placeholder for the full game implementation.')" class="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg transform transition-all hover:scale-105">
                  🚀 Start Playing
                </button>
              </div>
            </div>
          `
        }
        
        gameModal.innerHTML = gameContent
        document.body.appendChild(gameModal)
        
        // Initialize Smile Challenge functions
        if (gameName.toLowerCase().includes('smile')) {
          initializeSmileChallenge()
        }
      }
    }

    // Initialize Smile Challenge functions
    function initializeSmileChallenge() {
      window.smileGameActive = false
      window.smileScore = 0
      
      window.startSmileChallenge = function() {
        if (window.smileGameActive) return
        
        window.smileGameActive = true
        window.smileScore = 0
        let timeLeft = 30
        
        const scoreElement = document.getElementById('smile-score')
        const timeElement = document.getElementById('time-left')
        
        if (scoreElement) scoreElement.textContent = '0'
        if (timeElement) timeElement.textContent = '30'
        
        const timer = setInterval(() => {
          timeLeft--
          if (timeElement) timeElement.textContent = timeLeft.toString()
          
          if (timeLeft <= 0) {
            clearInterval(timer)
            window.smileGameActive = false
            alert('🎉 Challenge Complete! You made ' + (window.smileScore || 0) + ' smile faces! Great job boosting your mood! 😄')
          }
        }, 1000)
      }
      
      window.makeSmileFace = function(emoji: string) {
        if (!window.smileGameActive) {
          alert('Click "Start Challenge!" first! 🎮')
          return
        }
        
        window.smileScore = (window.smileScore || 0) + 1
        const scoreElement = document.getElementById('smile-score')
        const mirrorElement = document.getElementById('smile-mirror')
        
        if (scoreElement) scoreElement.textContent = window.smileScore.toString()
        if (mirrorElement) {
          const emojiDiv = mirrorElement.querySelector('div')
          if (emojiDiv) emojiDiv.textContent = emoji
          
          // Add animation
          mirrorElement.classList.add('animate-pulse')
          setTimeout(() => mirrorElement.classList.remove('animate-pulse'), 500)
        }
      }
    }

    // Set up other GameUV functions
    if (!window.exploreGameUVCategory) {
      window.exploreGameUVCategory = function(category: string) {
        alert('🎮 Exploring ' + category + ' games!\n\nShowing you more therapeutic games in this category to play right here in your mental health platform!')
      }
    }

    if (!window.visitGameUVPlatform) {
      window.visitGameUVPlatform = function() {
        alert('🏠 You\'re already on the best platform!\n\nAll games are available right here in your Mental Health Platform - no need to visit external sites!\n\n✨ Enjoy therapeutic gaming designed specifically for your wellbeing!')
      }
    }

    if (!window.getPersonalizedGameUVSuggestions) {
      window.getPersonalizedGameUVSuggestions = function() {
        const preferences = prompt('🎯 What type of games help your mood most?\n\nOptions: relaxing, challenging, creative, social, active')
        if (preferences) {
          alert('🎨 Perfect! Based on your preference for "' + preferences + '" games:\n\n• All games are built into your mental health platform\n• Each game is designed with therapeutic benefits\n• Play anytime to boost your mood!\n\n🎮 Start exploring the games above!')
        }
      }
    }

    // Save interaction
    saveInteractionHistory(moodEntryId, 'game_suggestions', { 
      platform: 'GameUV', 
      mood: currentMood,
      categories: suggestions.map(s => s.category)
    }, 'helped')
    
    // Show success message
    const suggestionMessage = document.createElement('div')
    suggestionMessage.className = 'fixed top-4 right-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
    suggestionMessage.innerHTML = `🎮 GameUV suggestions ready! Perfect games for your ${currentMood} mood! ✨`
    document.body.appendChild(suggestionMessage)
    setTimeout(() => suggestionMessage.remove(), 4000)
  }, [saveInteractionHistory])

  // Set up mood modal functions
  useEffect(() => {
    if (isVisible) {
      window.moodModal = {
        nextJoke: () => console.log('Next joke'),
        showCartoon: () => console.log('Show cartoon'),
        stopJokes: () => console.log('Stop jokes'),
        nextImage: () => console.log('Next image'),
        nextGame: () => console.log('Next game'),
        playMusic: (title: string, artist: string) => console.log('Play music:', title, artist),
        stopMusic: () => {
          if (currentAudio) {
            currentAudio.pause()
            setCurrentAudio(null)
          }
        },
        askMusicPreference: () => console.log('Ask music preference'),
        suggestGameUVGames: (mood?: string) => {
          const moodEntryId = saveMoodEntry({ 
            rating: 3, 
            type: (mood as MoodType) || 'neutral', 
            notes: `GameUV games requested for ${mood || 'general'} mood` 
          })
          if (moodEntryId) {
            suggestGameUVGames2(moodEntryId, mood || 'default')
          }
        },
        startGame: (gameName: string) => console.log('Start game:', gameName),
        startBreathing: () => {
          // Create breathing exercise
          const breathingModal = document.createElement('div')
          breathingModal.className = 'fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-60'
          breathingModal.innerHTML = `
            <div class="bg-white rounded-2xl p-8 text-center max-w-md">
              <h3 class="text-2xl font-bold text-blue-900 mb-4">🌬️ Guided Breathing</h3>
              <div id="breathing-circle" class="w-32 h-32 mx-auto mb-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-900 font-bold text-lg">
                Breathe
              </div>
              <p id="breathing-instruction" class="text-blue-700 text-lg mb-4">Inhale slowly...</p>
              <button onclick="this.parentElement.parentElement.remove()" class="px-6 py-2 bg-blue-500 text-white rounded-lg">
                Finish
              </button>
            </div>
          `
          document.body.appendChild(breathingModal)
        },
        close: () => {
          setIsVisible(false)
        }
      }
    }

    return () => {
      if (window.moodModal) {
        window.moodModal = undefined
      }
    }
  }, [isVisible, currentAudio, saveMoodEntry, suggestGameUVGames2])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Mental Health Agent</h2>
            <p className="text-gray-600 mt-2">Your personal mental wellness companion</p>
          </div>
          
          <button
            onClick={() => {
              // Mock authentication for demo
              const mockUser: UserMentalHealthProfile = {
                id: 'demo-user',
                name: 'Demo User',
                email: 'demo@example.com',
                age: 25,
                stress_level: 'moderate',
                sleep_hours: 7,
                concerns: ['stress', 'mood'],
                preferred_activities: ['games', 'music'],
                mood_goals: ['Feel happier', 'Reduce stress'],
                preferences: {
                  interventions: ['music', 'games', 'breathing'],
                  musicGenres: ['relaxing', 'classical'],
                  exerciseTypes: ['yoga', 'walking']
                },
                goals: ['Reduce stress', 'Improve mood'],
                emergencyContacts: [],
                riskLevel: 'low'
              }
              setUser(mockUser)
              setIsAuthenticated(true)
            }}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all transform hover:scale-105"
          >
            Continue as Demo User
          </button>
          
          <button
            onClick={onBackToServices}
            className="w-full mt-3 text-gray-500 hover:text-gray-700 py-2"
          >
            Back to Services
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Brain className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Mental Health Agent</h1>
                  <p className="text-blue-100">Welcome back, {user?.name}</p>
                </div>
              </div>
              
              <button
                onClick={onBackToServices}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-all"
              >
                Back to Services
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex overflow-x-auto bg-gray-50 border-b">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
              { id: 'mood', label: 'Mood Tracker', icon: Smile },
              { id: 'activities', label: 'Activities', icon: Play },
              { id: 'insights', label: 'Insights', icon: Target },
              { id: 'history', label: 'History', icon: MessageCircle },
              { id: 'profile', label: 'Profile', icon: Heart }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-4 whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-500 text-blue-600 bg-white'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="p-6">
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Quick Mood Check</h3>
                    <p className="text-gray-600 mb-4">How are you feeling today?</p>
                    <button
                      onClick={() => setShowMoodLogger(true)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all"
                    >
                      Log Mood
                    </button>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">GameUV Games</h3>
                    <p className="text-gray-600 mb-4">Therapeutic games for your mood</p>
                    <button
                      onClick={() => {
                        const moodEntryId = saveMoodEntry({ 
                          rating: 3, 
                          type: 'neutral', 
                          notes: 'GameUV games accessed from dashboard' 
                        })
                        if (moodEntryId) {
                          suggestGameUVGames2(moodEntryId, 'default')
                        }
                      }}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-all"
                    >
                      🎮 Play Games
                    </button>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Breathing Exercise</h3>
                    <p className="text-gray-600 mb-4">Take a moment to breathe</p>
                    <button
                      onClick={() => window.moodModal?.startBreathing()}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-all"
                    >
                      Start Breathing
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Mood Entries</h3>
                    <div className="space-y-3">
                      {moodEntries.slice(0, 5).map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <span className="font-medium text-gray-800">{entry.type}</span>
                            <p className="text-sm text-gray-600">{entry.notes}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-blue-600">{entry.rating}/5</div>
                            <div className="text-xs text-gray-500">
                              {entry.timestamp.toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activities</h3>
                    <div className="space-y-3">
                      {interventionHistory.slice(0, 5).map((intervention) => (
                        <div key={intervention.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <span className="font-medium text-gray-800">{intervention.type}</span>
                            <div className="text-xs text-gray-500">
                              {intervention.timestamp.toLocaleDateString()}
                            </div>
                          </div>
                          <div className={`px-2 py-1 rounded text-xs ${
                            intervention.effectiveness === 'helpful' || intervention.effectiveness === 'helped'
                              ? 'bg-green-100 text-green-800'
                              : intervention.effectiveness === 'somewhat_helpful'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {intervention.effectiveness}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'mood' && (
              <div className="max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Mood Tracker</h2>
                
                {showMoodLogger ? (
                  <MoodLoggerForm
                    onSave={(entry) => {
                      const moodEntryId = saveMoodEntry(entry)
                      setShowMoodLogger(false)
                      // Suggest activities based on mood
                      if (moodEntryId && (entry.rating <= 2 || ['sad', 'anxious', 'angry', 'stressed'].includes(entry.type))) {
                        setTimeout(() => {
                          suggestGameUVGames2(moodEntryId, entry.type)
                        }, 1000)
                      }
                    }}
                    onCancel={() => setShowMoodLogger(false)}
                  />
                ) : (
                  <div className="text-center">
                    <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Smile className="h-12 w-12 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">How are you feeling?</h3>
                    <p className="text-gray-600 mb-6">Track your mood to get personalized support and insights.</p>
                    <button
                      onClick={() => setShowMoodLogger(true)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold transition-all transform hover:scale-105"
                    >
                      Log Your Mood
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'activities' && (
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Wellness Activities</h2>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Play className="h-8 w-8 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">GameUV Therapeutic Games</h3>
                    <p className="text-gray-600 mb-4">Mood-based games designed for mental wellness</p>
                    <button
                      onClick={() => {
                        const moodEntryId = saveMoodEntry({ 
                          rating: 3, 
                          type: 'neutral', 
                          notes: 'GameUV games accessed from activities' 
                        })
                        if (moodEntryId) {
                          suggestGameUVGames2(moodEntryId, 'default')
                        }
                      }}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg transition-all"
                    >
                      🎮 Play Games
                    </button>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Heart className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Breathing Exercises</h3>
                    <p className="text-gray-600 mb-4">Guided breathing for relaxation and focus</p>
                    <button
                      onClick={() => window.moodModal?.startBreathing()}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-all"
                    >
                      Start Breathing
                    </button>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Target className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Mindfulness</h3>
                    <p className="text-gray-600 mb-4">Meditation and mindfulness practices</p>
                    <button className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-all">
                      Start Session
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Other tab contents would go here */}
          </div>
        </div>
      </div>
    </div>
  )
}

// Mood Logger Form Component
const MoodLoggerForm: React.FC<{
  onSave: (entry: Omit<MoodEntry, 'id' | 'timestamp'>) => void
  onCancel: () => void
}> = ({ onSave, onCancel }) => {
  const [rating, setRating] = useState<MoodRating>(3)
  const [type, setType] = useState<MoodType>('neutral')
  const [notes, setNotes] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ rating, type, notes })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">Log Your Mood</h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How would you rate your mood? (1-5)
          </label>
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value as MoodRating)}
                className={`w-12 h-12 rounded-full text-lg font-bold transition-all ${
                  rating === value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What type of mood are you experiencing?
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as MoodType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="neutral">Neutral</option>
            <option value="happy">Happy</option>
            <option value="sad">Sad</option>
            <option value="anxious">Anxious</option>
            <option value="angry">Angry</option>
            <option value="excited">Excited</option>
            <option value="stressed">Stressed</option>
            <option value="calm">Calm</option>
            <option value="overwhelmed">Overwhelmed</option>
            <option value="content">Content</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="What's on your mind?"
          />
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-all"
          >
            Save Mood
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default MentalHealthAgent