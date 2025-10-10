import React, { useState, useCallback, useRef } from 'react'
import { Brain, Heart, Flower2, ArrowLeft, Clock, User, Leaf } from 'lucide-react'
import { 
  mentalHealthAPI, 
  MoodAnalysisResponse
} from '../services/mentalHealthAPI'

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

interface ContentState {
  moodAnalysis: MoodAnalysisResponse | null
  isLoading: boolean
  error: string | null
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
  const [userInput, setUserInput] = useState('')
  const [contentState, setContentState] = useState<ContentState>({
    moodAnalysis: null,
    isLoading: false,
    error: null
  })
  const [isLoading, setIsLoading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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

  // User input handler
  const handleUserInput = useCallback(async (inputText: string) => {
    if (!inputText.trim()) return

    setIsLoading(true)
    setContentState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await mentalHealthAPI.analyzeMood({ text: inputText })
      
      // Create mood entry
      const newEntry: MoodEntry = {
        id: Date.now().toString(),
        type: response.mood as MoodType,
        rating: 3 as MoodRating, // Default rating since confidence is now a string
        notes: inputText,
        timestamp: new Date(),
        aiResponse: response.reason || response.message
      }

      setMoodEntries(prev => [newEntry, ...prev])
      setContentState(prev => ({ 
        ...prev, 
        moodAnalysis: response,
        isLoading: false 
      }))
      setUserInput('')

    } catch (error) {
      setContentState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Failed to analyze mood. Please try again.' 
      }))
    } finally {
      setIsLoading(false)
    }
  }, [])

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
                  {moodEntries.length > 0 
                    ? `${moodEntries[0].type} (${moodEntries[0].rating}/5)`
                    : 'No entries yet'
                  }
                </p>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-purple-900 mb-2">Total Entries</h3>
                <p className="text-purple-700">{moodEntries.length} mood entries</p>
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
            <h2 className="text-2xl font-bold text-gray-900">How are you feeling today?</h2>
            <p className="text-gray-600">Share your thoughts and emotions. I'm here to listen and provide support.</p>
            
            {/* Mood Input Section */}
            <div className="space-y-4">
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Tell me how you're feeling today (e.g., 'I'm feeling really happy' or 'I feel anxious about work')"
                  className="w-full min-h-[100px] p-4 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:outline-none resize-none transition-all duration-200 hover:border-purple-300 focus:ring-4 focus:ring-purple-100 bg-white text-gray-900"
                  rows={4}
                  disabled={isLoading}
                />
                {isLoading && (
                  <div className="absolute inset-0 bg-gray-100 bg-opacity-70 rounded-xl flex items-center justify-center">
                    <div className="bg-white px-6 py-3 rounded-lg shadow-lg">
                      <p className="text-purple-600 font-medium">🔄 Processing your feelings...</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-center">
                <p className="text-xs text-purple-600">
                  💡 Tip: Be honest about your feelings. I'm here to help!
                </p>
                <p className="text-xs text-gray-500">
                  {userInput.length > 0 ? `${userInput.length} characters` : 'Start typing...'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 flex-wrap items-center">
              <button
                onClick={() => handleUserInput(userInput)}
                disabled={!userInput.trim() || isLoading}
                className="px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
              >
                {isLoading ? '🔄 Analyzing...' : '💬 Share My Feelings'}
              </button>
              
              {userInput.trim() && !isLoading && (
                <button
                  onClick={() => setUserInput('')}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition-colors"
                >
                  🗑️ Clear
                </button>
              )}
              
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

            {/* Mood Analysis Result */}
            {contentState.moodAnalysis && (
              <div className="mt-6 p-4 bg-white rounded-xl border-2 border-purple-200">
                <p className="text-purple-800 font-medium">{contentState.moodAnalysis.message}</p>
              </div>
            )}

            {/* Error Display */}
            {contentState.error && (
              <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                <p className="text-red-800">{contentState.error}</p>
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
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Mood History</h2>
            <p className="text-gray-600">Track your emotional journey over time.</p>
            
            {moodEntries.length === 0 ? (
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
              <div className="space-y-4">
                {moodEntries.map((entry) => (
                  <div key={entry.id} className="bg-white border-2 border-purple-200 rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-lg font-semibold text-purple-900 capitalize">{entry.type}</span>
                          <div className="flex">
                            {Array.from({ length: 5 }, (_, i) => (
                              <span key={i} className={`text-sm ${i < entry.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                                ⭐
                              </span>
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-700 mb-2">{entry.notes}</p>
                        {entry.aiResponse && (
                          <p className="text-sm text-purple-600 bg-purple-50 rounded-lg p-2">{entry.aiResponse}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {entry.timestamp.toLocaleDateString()} {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
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