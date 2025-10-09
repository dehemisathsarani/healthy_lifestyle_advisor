import React, { useState, useCallback } from 'react'
import { Brain, Heart, Flower2, ArrowLeft, Clock, User, Leaf } from 'lucide-react'
import { EnhancedMoodTrackerAPI } from '../services/enhancedMoodTrackerAPI.ts';
import type { 
  MoodLog, 
  MoodFormData,
  JokeResponse,
  UnsplashImage,
  YouTubeVideo,
  GameRecommendation,
  MoodActivity
} from '../types/enhancedMoodTracker.ts';
import MoodForm from './MoodForm.tsx';
import MoodRecommendations from './MoodRecommendations.tsx';

// Types and interfaces remain the same
type MoodRating = 1 | 2 | 3 | 4 | 5
type MoodType = 'happy' | 'sad' | 'anxious' | 'angry' | 'neutral' | 'excited' | 'stressed' | 'calm' | 'overwhelmed' | 'content'

interface MoodEntry {
  id: string
  type: MoodType
  rating: MoodRating
  notes: string
  timestamp: Date
  aiResponse?: string
}

interface EnhancedMentalHealthAgentProps {
  user: any
  isAuthenticated: boolean
  onBackToServices: () => void
}

// Meditation types and content
type MeditationType = 'breathing' | 'mindfulness' | 'guided' | 'body-scan' | 'visualization' | 'nature-sounds'

interface MeditationContent {
  id: string
  type: MeditationType
  title: string
  description: string
  duration: number
  instructions: string[]
  completed: boolean
  progress: number
}

// Tab type updated to use lowercase values to match existing state
type ActiveTab = 'dashboard' | 'mood' | 'meditation' | 'history' | 'profile'

const EnhancedMentalHealthAgent: React.FC<EnhancedMentalHealthAgentProps> = ({
  user,
  isAuthenticated,
  onBackToServices
}) => {
  // State management
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard')
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([])
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]) // Store mood logs for history
  const [isLoading, setIsLoading] = useState(false)

  // Enhanced Mood Tracker State
  const [currentMoodStep, setCurrentMoodStep] = useState<'form' | 'recommendations' | 'complete'>('form')
  const [currentMoodLog, setCurrentMoodLog] = useState<MoodLog | null>(null)
  const [currentRecommendations, setCurrentRecommendations] = useState<{
    jokes: JokeResponse[]
    images: UnsplashImage[]
    music: YouTubeVideo[]
    games: GameRecommendation[]
    quotes: string[]
  }>({
    jokes: [],
    images: [],
    music: [],
    games: [],
    quotes: []
  })
  const [showMoreOptions, setShowMoreOptions] = useState(false)

  // Meditation state
  const [meditationSessions] = useState<MeditationContent[]>([
    {
      id: '1',
      type: 'breathing',
      title: 'Deep Breathing Exercise',
      description: 'Simple breathing techniques to reduce stress and anxiety',
      duration: 5,
      instructions: [
        'Find a comfortable seated position',
        'Close your eyes or soften your gaze',
        'Breathe in slowly through your nose for 4 counts',
        'Hold your breath for 4 counts',
        'Exhale slowly through your mouth for 6 counts',
        'Repeat this cycle for 5 minutes'
      ],
      completed: false,
      progress: 0
    },
    {
      id: '2',
      type: 'mindfulness',
      title: 'Mindfulness Meditation',
      description: 'Present moment awareness practice',
      duration: 10,
      instructions: [
        'Sit comfortably with your back straight',
        'Focus on your natural breathing',
        'Notice thoughts without judgment',
        'Gently return attention to your breath',
        'Observe sensations in your body',
        'Stay present for the full duration'
      ],
      completed: false,
      progress: 0
    },
    {
      id: '3',
      type: 'guided',
      title: 'Guided Relaxation',
      description: 'Follow along with gentle guidance',
      duration: 15,
      instructions: [
        'Listen to the guidance without forcing anything',
        'Allow yourself to follow the voice',
        'Let go of any expectations',
        'Trust the process and be patient',
        'Notice how you feel afterward'
      ],
      completed: false,
      progress: 0
    },
    {
      id: '4',
      type: 'body-scan',
      title: 'Body Scan Meditation',
      description: 'Progressive relaxation through body awareness',
      duration: 20,
      instructions: [
        'Lie down comfortably on your back',
        'Start by noticing your toes',
        'Slowly move attention up through each body part',
        'Notice tension and consciously relax',
        'Spend time with each area of your body',
        'Finish with full body awareness'
      ],
      completed: false,
      progress: 0
    },
    {
      id: '5',
      type: 'visualization',
      title: 'Peaceful Place Visualization',
      description: 'Mental imagery for relaxation and peace',
      duration: 12,
      instructions: [
        'Close your eyes and take deep breaths',
        'Imagine a place where you feel completely safe',
        'See the colors, shapes, and lighting',
        'Hear the sounds of this peaceful place',
        'Feel the temperature and textures',
        'Stay in this place as long as you need'
      ],
      completed: false,
      progress: 0
    },
    {
      id: '6',
      type: 'nature-sounds',
      title: 'Nature Sounds Meditation',
      description: 'Relax with soothing natural sounds',
      duration: 8,
      instructions: [
        'Choose comfortable headphones if available',
        'Let the natural sounds wash over you',
        'Don\'t try to focus on anything specific',
        'Allow your mind to wander naturally',
        'Return to the sounds when you notice thinking',
        'Enjoy this time of natural connection'
      ],
      completed: false,
      progress: 0
    }
  ])

  // Enhanced Mood Tracker Functions
  const handleMoodSubmit = useCallback(async (moodData: MoodFormData) => {
    setIsLoading(true)
    try {
      // Determine if mood is positive or negative based on rating and mood type
      const positiveTypes = ['happy', 'excited', 'content'];
      const isPositiveMood = positiveTypes.includes(moodData.moodType) && moodData.rating >= 6;
      const mood: 'positive' | 'negative' = isPositiveMood ? 'positive' : 'negative';

      // Create new mood log
      const newLog: MoodLog = {
        id: Date.now().toString(),
        timestamp: new Date(),
        mood,
        moodType: moodData.moodType,
        rating: moodData.rating,
        description: moodData.description,
        factors: moodData.factors,
        activities: []
      }

      setCurrentMoodLog(newLog)
      setCurrentMoodStep('recommendations')
      
      // Load recommendations based on mood
      await loadMoodRecommendations(mood)
      
    } catch (error) {
      console.error('Failed to process mood:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadMoodRecommendations = useCallback(async (mood: 'positive' | 'negative') => {
    try {
      const [jokes, images, music, games] = await Promise.all([
        EnhancedMoodTrackerAPI.getJokes(3),
        EnhancedMoodTrackerAPI.getMotivationalImages(mood === 'positive' ? 'motivation' : 'calm', 3),
        EnhancedMoodTrackerAPI.getYouTubeMusic(mood, 3),
        EnhancedMoodTrackerAPI.getFunnyGames(3)
      ])

      const quotes = EnhancedMoodTrackerAPI.getMotivationalQuotes()

      setCurrentRecommendations({
        jokes,
        images,
        music,
        games,
        quotes: quotes.slice(0, 3)
      })
    } catch (error) {
      console.error('Error loading recommendations:', error)
    }
  }, [])

  const handleActivityComplete = useCallback((activityType: string, activityData: any) => {
    if (!currentMoodLog) return

    const newActivity: MoodActivity = {
      id: Date.now().toString(),
      type: activityType as 'joke' | 'image' | 'sticker' | 'music' | 'game' | 'quote',
      data: activityData,
      completed: true,
      timestamp: new Date()
    }

    setCurrentMoodLog((prev: MoodLog | null) => prev ? {
      ...prev,
      activities: [...prev.activities, newActivity]
    } : null)
  }, [currentMoodLog])

  const saveMoodLog = useCallback(() => {
    if (!currentMoodLog) return

    // Add the completed mood log to history
    setMoodLogs(prevLogs => [currentMoodLog, ...prevLogs])
    
    // Convert to MoodEntry format for backward compatibility
    const moodEntry: MoodEntry = {
      id: currentMoodLog.id,
      type: currentMoodLog.moodType as MoodType,
      rating: currentMoodLog.rating as MoodRating,
      notes: currentMoodLog.description,
      timestamp: currentMoodLog.timestamp,
      aiResponse: `Completed ${currentMoodLog.activities.length} activities: ${currentMoodLog.activities.map(a => a.type).join(', ')}`
    }
    setMoodEntries(prevEntries => [moodEntry, ...prevEntries])

    console.log('Mood log saved:', currentMoodLog)
    setCurrentMoodStep('complete')
    
    // Reset for next mood entry
    setTimeout(() => {
      setCurrentMoodStep('form')
      setCurrentMoodLog(null)
      setCurrentRecommendations({
        jokes: [],
        images: [],
        music: [],
        games: [],
        quotes: []
      })
      setShowMoreOptions(false)
    }, 3000)
  }, [currentMoodLog])

  // Tab content renderer
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Mental Health Dashboard</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Recent Mood</h3>
                <p className="text-blue-700">
                  {moodLogs.length > 0 
                    ? `${moodLogs[0].moodType} (${moodLogs[0].rating}/10) - ${moodLogs[0].mood}`
                    : moodEntries.length > 0 
                      ? `${moodEntries[0].type} (${moodEntries[0].rating}/5)`
                      : 'No entries yet'
                  }
                </p>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-purple-900 mb-2">Total Entries</h3>
                <p className="text-purple-700">{moodLogs.length + moodEntries.length} mood entries</p>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-2">Meditation Sessions</h3>
                <p className="text-green-700">
                  {meditationSessions.filter(session => session.completed).length} completed
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-purple-900 mb-3">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setActiveTab('mood')}
                  className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border-2 border-purple-200 hover:border-purple-300"
                >
                  <Heart className="w-8 h-8 text-purple-500 mb-2" />
                  <div className="text-left">
                    <h4 className="font-semibold text-gray-900">Track Your Mood</h4>
                    <p className="text-sm text-gray-600">Share how you're feeling today</p>
                  </div>
                </button>
                
                <button
                  onClick={() => setActiveTab('meditation')}
                  className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border-2 border-purple-200 hover:border-purple-300"
                >
                  <Flower2 className="w-8 h-8 text-green-500 mb-2" />
                  <div className="text-left">
                    <h4 className="font-semibold text-gray-900">Start Meditation</h4>
                    <p className="text-sm text-gray-600">Find your inner peace</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )

      case 'mood':
        return (
          <div className="space-y-6">
            {/* Enhanced Mood Tracker */}
            {currentMoodStep === 'form' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">How are you feeling today?</h2>
                  <p className="text-gray-600">Let's identify your mood and find the best ways to support you</p>
                </div>

                <MoodForm onSubmit={handleMoodSubmit} isLoading={isLoading} />
              </div>
            )}

            {currentMoodStep === 'recommendations' && currentMoodLog && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {currentMoodLog.mood === 'positive' ? '🌟 Let\'s keep that positive energy flowing!' : '🤗 Here are some things to brighten your day'}
                  </h2>
                  <p className="text-gray-600">
                    You're feeling {currentMoodLog.mood === 'positive' ? 'great' : 'down'}. Let's find some activities to help you feel even better!
                  </p>
                </div>

                <MoodRecommendations 
                  mood={currentMoodLog.mood}
                  recommendations={currentRecommendations}
                  onActivityComplete={handleActivityComplete}
                  onMoreContent={() => setShowMoreOptions(true)}
                  onComplete={saveMoodLog}
                  showMoreOptions={showMoreOptions}
                />
              </div>
            )}

            {currentMoodStep === 'complete' && (
              <div className="text-center space-y-4">
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-8">
                  <div className="text-6xl mb-4">🎉</div>
                  <h2 className="text-2xl font-bold text-green-800 mb-2">Mood Log Saved!</h2>
                  <p className="text-green-700">Your mood and activities have been recorded in your history.</p>
                </div>
              </div>
            )}
          </div>
        )

      case 'meditation':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Meditation & Mindfulness</h2>
            <p className="text-gray-600">Take a moment to center yourself with these guided meditation exercises.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {meditationSessions.map((session) => (
                <div key={session.id} className="bg-white border-2 border-purple-200 rounded-xl p-6 hover:border-purple-300 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{session.title}</h3>
                      <p className="text-sm text-gray-600">{session.description}</p>
                      <p className="text-xs text-purple-600 mt-1">{session.duration} minutes</p>
                    </div>
                    {session.completed && (
                      <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                        ✓ Completed
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Instructions:</h4>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {session.instructions.slice(0, 3).map((instruction, index) => (
                          <li key={index}>• {instruction}</li>
                        ))}
                        {session.instructions.length > 3 && (
                          <li className="text-purple-600">• And {session.instructions.length - 3} more steps...</li>
                        )}
                      </ul>
                    </div>
                    
                    <button
                      className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors"
                      onClick={() => {
                        // Start meditation session
                        console.log(`Starting ${session.title}`)
                      }}
                    >
                      Start {session.duration}min Session
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'history':
        const allEntries = [
          ...moodLogs.map(log => ({ type: 'enhanced' as const, data: log })),
          ...moodEntries.map(entry => ({ type: 'legacy' as const, data: entry }))
        ].sort((a, b) => {
          const timeA = a.data.timestamp.getTime()
          const timeB = b.data.timestamp.getTime()
          return timeB - timeA // Most recent first
        })

        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Mood History</h2>
            <p className="text-gray-600">Track your emotional journey over time and see all activities you've completed.</p>
            
            {allEntries.length === 0 ? (
              <div className="text-center py-8">
                <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No mood entries yet. Start tracking your feelings!</p>
                <button
                  onClick={() => setActiveTab('mood')}
                  className="mt-4 px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                >
                  Track Your Mood
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {allEntries.map((entry, index) => (
                  <div key={`${entry.type}-${index}`} className="bg-white border-2 border-purple-200 rounded-xl p-6 shadow-sm">
                    {entry.type === 'enhanced' ? (
                      // Enhanced mood log display
                      <div>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-xl font-bold text-purple-900 capitalize">
                                {(entry.data as MoodLog).moodType}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                (entry.data as MoodLog).mood === 'positive' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {(entry.data as MoodLog).mood}
                              </span>
                              <span className="text-lg text-gray-600">
                                {(entry.data as MoodLog).rating}/10
                              </span>
                            </div>
                            <p className="text-gray-700 mb-3">{(entry.data as MoodLog).description}</p>
                            
                            {(entry.data as MoodLog).factors && (entry.data as MoodLog).factors.length > 0 && (
                              <div className="mb-3">
                                <p className="text-sm font-medium text-gray-600 mb-1">Contributing factors:</p>
                                <div className="flex flex-wrap gap-2">
                                  {(entry.data as MoodLog).factors.map((factor: string, idx: number) => (
                                    <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs">
                                      {factor}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {(entry.data as MoodLog).activities && (entry.data as MoodLog).activities.length > 0 && (
                              <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                                <h4 className="text-sm font-semibold text-purple-900 mb-2">
                                  Activities Completed ({(entry.data as MoodLog).activities.length})
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                  {(entry.data as MoodLog).activities.map((activity: MoodActivity, actIdx: number) => (
                                    <div key={actIdx} className="flex items-center gap-2 text-sm">
                                      <span className="text-green-500">✓</span>
                                      <span className="text-purple-700 capitalize">
                                        {activity.type}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {activity.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                      {activity.data && (
                                        <span className="text-xs text-gray-600 truncate">
                                          ({typeof activity.data === 'string' ? activity.data.slice(0, 15) + '...' : 'Done'})
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                            {entry.data.timestamp.toLocaleDateString()} {entry.data.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ) : (
                      // Legacy mood entry display
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-lg font-semibold text-purple-900 capitalize">{(entry.data as MoodEntry).type}</span>
                            <div className="flex">
                              {Array.from({ length: 5 }, (_, i) => (
                                <span key={i} className={`text-sm ${i < (entry.data as MoodEntry).rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                                  ⭐
                                </span>
                              ))}
                            </div>
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs">Legacy Entry</span>
                          </div>
                          <p className="text-gray-700 mb-2">{(entry.data as MoodEntry).notes}</p>
                          {(entry.data as MoodEntry).aiResponse && (
                            <p className="text-sm text-purple-600 bg-purple-50 rounded-lg p-2">{(entry.data as MoodEntry).aiResponse}</p>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {entry.data.timestamp.toLocaleDateString()} {entry.data.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )

      case 'profile':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Profile Settings</h2>
            <p className="text-gray-600">Manage your mental health preferences and account settings.</p>
            
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">User Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Name</label>
                  <p className="text-lg text-gray-900">{user.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <p className="text-lg text-gray-900">{user.email}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white border-2 border-purple-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Daily mood reminders</span>
                  <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                    Configure
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Privacy settings</span>
                  <button className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                    Manage
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-500">This section is coming soon!</p>
          </div>
        )
    }
  }

  // Authentication check
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-8 relative">
          <button
            onClick={onBackToServices}
            className="absolute left-0 top-8 flex items-center text-purple-600 hover:text-purple-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Services
          </button>
          
          <div className="flex justify-center items-center gap-3 mb-2">
            <Brain className="w-12 h-12 text-purple-500" />
            <h1 className="text-4xl font-bold text-gray-900">Mental Health Agent</h1>
          </div>
          <p className="text-lg text-gray-600">
            Your personalized AI companion for mental wellness and emotional support
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-white rounded-xl p-2 shadow-lg space-x-2">
            {([
              { id: 'dashboard', label: 'Dashboard', icon: Brain },
              { id: 'mood', label: 'Mood Tracker', icon: Heart },
              { id: 'meditation', label: 'Meditation', icon: Leaf },
              { id: 'history', label: 'History', icon: Clock },
              { id: 'profile', label: 'Profile', icon: User }
            ] as const).map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center ${
                    activeTab === tab.id
                      ? 'bg-purple-500 text-white shadow-md'
                      : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8 min-h-[600px]">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}

export default EnhancedMentalHealthAgent