import React, { useState, useCallback, useEffect } from 'react'
import { Brain, Heart, Flower2, ArrowLeft, Clock, User, Leaf } from 'lucide-react'
import { EnhancedMoodTrackerAPI } from '../services/enhancedMoodTrackerAPI';
import { MoodLogsAPI } from '../services/moodLogsAPI';
import type { 
  MoodLog, 
  MoodFormData,
  JokeResponse,
  UnsplashImage,
  YouTubeVideo,
  GameRecommendation,
  MoodActivity
} from '../types/enhancedMoodTracker';
import MoodForm from './MoodForm';
import MoodRecommendations from './MoodRecommendations';

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
type MeditationType = 'breathing' | 'mindfulness' | 'guided' | 'body-scan' | 'visualization' | 'nature-sounds' | 'morning-focus' | 'sleep-winddown' | 'loving-kindness'

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
  const [meditationHistory, setMeditationHistory] = useState<any[]>([]) // Store meditation sessions for history
  const [isLoading, setIsLoading] = useState(false)

  // Enhanced Mood Tracker State
  const [currentMoodStep, setCurrentMoodStep] = useState<'form' | 'recommendations' | 'complete'>('form')
  const [currentMoodLog, setCurrentMoodLog] = useState<MoodLog | null>(null)

  // Load mood logs from MongoDB on component mount and when user changes
  useEffect(() => {
    const loadMoodLogs = async () => {
      if (!user?.id) {
        console.log('No user ID available, skipping mood logs load');
        return;
      }
      
      try {
        console.log('Loading mood logs for user:', user.id);
        const logs = await MoodLogsAPI.getMoodLogs(user.id);
        console.log('Loaded mood logs from MongoDB:', logs.length);
        setMoodLogs(logs);
      } catch (error) {
        console.error('Failed to load mood logs from MongoDB:', error);
      }
    }
    
    loadMoodLogs();
  }, [user?.id])

  // Load meditation history from MongoDB
  useEffect(() => {
    const loadMeditationHistory = async () => {
      if (!user?.id) {
        console.log('No user ID available, skipping meditation history load');
        return;
      }
      
      try {
        console.log('Loading meditation history for user:', user.id);
        const response = await fetch(`http://localhost:8000/api/mental-health/meditation/history/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('access_token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Loaded meditation history from MongoDB:', data.sessions?.length || 0);
          setMeditationHistory(data.sessions || []);
        } else {
          console.error('Failed to load meditation history');
        }
      } catch (error) {
        console.error('Error loading meditation history:', error);
      }
    }
    
    loadMeditationHistory();
  }, [user?.id])
  const [currentRecommendations, setCurrentRecommendations] = useState<{
    jokes: JokeResponse[]
    images: UnsplashImage[]
    music: YouTubeVideo[]
    games: GameRecommendation[]
    quotes: { text: string; author: string }[]
  }>({
    jokes: [],
    images: [],
    music: [],
    games: [],
    quotes: []
  })
  const [showMoreOptions, setShowMoreOptions] = useState(false)

  // Meditation state
  const [meditationView, setMeditationView] = useState<'catalog' | 'session' | 'complete'>('catalog')
  const [activeMeditation, setActiveMeditation] = useState<MeditationContent | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [postMeditationFeeling, setPostMeditationFeeling] = useState<'calm' | 'same' | 'stressed' | null>(null)
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
    },
    {
      id: '7',
      type: 'morning-focus',
      title: 'Morning Focus',
      description: 'Start your day with clarity and intention',
      duration: 7,
      instructions: [
        'Sit upright with your feet flat on the floor',
        'Take three deep breaths to center yourself',
        'Set an intention for your day ahead',
        'Visualize yourself moving through the day with ease',
        'Notice any areas that need extra attention',
        'Affirm your capability to handle whatever comes',
        'Carry this focused energy into your morning'
      ],
      completed: false,
      progress: 0
    },
    {
      id: '8',
      type: 'sleep-winddown',
      title: 'Sleep Wind-down',
      description: 'Gentle transition to peaceful sleep',
      duration: 10,
      instructions: [
        'Lie down in your bed and get comfortable',
        'Let your body sink into the mattress',
        'Release the events and thoughts of the day',
        'Breathe slowly and naturally',
        'Scan your body and release any remaining tension',
        'Allow your mind to become quiet and still',
        'Let sleep come naturally when you\'re ready'
      ],
      completed: false,
      progress: 0
    },
    {
      id: '9',
      type: 'loving-kindness',
      title: 'Loving-Kindness',
      description: 'Cultivate compassion for yourself and others',
      duration: 12,
      instructions: [
        'Sit comfortably and close your eyes',
        'Begin by sending love and kindness to yourself',
        'Repeat: "May I be happy, may I be healthy, may I be at peace"',
        'Extend these wishes to someone you love',
        'Include someone neutral in your life',
        'Send loving-kindness to someone difficult',
        'Expand to include all beings everywhere'
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
      // Get the current mood type from the mood log for personalized content
      const moodType = currentMoodLog?.moodType || 'neutral'
      
      const [jokes, images, music, games, quotes] = await Promise.all([
        EnhancedMoodTrackerAPI.getJokes(3, moodType),
        EnhancedMoodTrackerAPI.getMotivationalImages(mood === 'positive' ? 'motivation' : 'calm', 3),
        EnhancedMoodTrackerAPI.getYouTubeMusic(mood, 3),
        EnhancedMoodTrackerAPI.getFunnyGames(3),
        EnhancedMoodTrackerAPI.getMotivationalQuotes(moodType, 3)
      ])

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
  }, [currentMoodLog])

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

  const saveMoodLog = useCallback(async () => {
    if (!currentMoodLog || !user?.id) {
      console.error('Cannot save mood log: missing mood log or user ID');
      return;
    }

    try {
      console.log('Saving mood log to MongoDB...', currentMoodLog);
      
      // Save to MongoDB via API
      const savedLog = await MoodLogsAPI.saveMoodLog(currentMoodLog, user.id);
      console.log('✓ Mood log successfully saved to MongoDB:', savedLog);
      
      // Add the saved mood log to local state (for immediate UI update)
      setMoodLogs(prevLogs => [savedLog, ...prevLogs]);

      // Show success message
      setCurrentMoodStep('complete');
      
      // Reset for next mood entry
      setTimeout(() => {
        setCurrentMoodStep('form');
        setCurrentMoodLog(null);
        setCurrentRecommendations({
          jokes: [],
          images: [],
          music: [],
          games: [],
          quotes: []
        });
        setShowMoreOptions(false);
      }, 3000);
      
    } catch (error) {
      console.error('Failed to save mood log to MongoDB:', error);
      alert('Failed to save mood log to database. Please try again.');
    }
  }, [currentMoodLog, user?.id])

  // Meditation Session Functions
  const startMeditationSession = useCallback((meditation: MeditationContent) => {
    setActiveMeditation(meditation)
    setCurrentStep(0)
    setTimeRemaining(meditation.duration * 60) // Convert minutes to seconds
    setMeditationView('session')
    setIsTimerRunning(true)
    
    // Speak the first instruction if available
    if (meditation.instructions[0]) {
      speakText(meditation.instructions[0])
    }
  }, [])

  const nextStep = useCallback(() => {
    if (!activeMeditation) return
    
    if (currentStep < activeMeditation.instructions.length - 1) {
      const newStep = currentStep + 1
      setCurrentStep(newStep)
      speakText(activeMeditation.instructions[newStep])
    }
  }, [activeMeditation, currentStep])

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      const newStep = currentStep - 1
      setCurrentStep(newStep)
      if (activeMeditation) {
        speakText(activeMeditation.instructions[newStep])
      }
    }
  }, [currentStep, activeMeditation])

  const speakText = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.8 // Slower, calmer pace
      utterance.pitch = 1
      utterance.volume = 1
      
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)
      
      window.speechSynthesis.speak(utterance)
    }
  }, [])

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }, [])

  const toggleTimer = useCallback(() => {
    setIsTimerRunning(prev => !prev)
  }, [])

  const completeMeditationSession = useCallback(() => {
    setIsTimerRunning(false)
    stopSpeaking()
    setMeditationView('complete')
  }, [stopSpeaking])

  const saveMeditationLog = useCallback(async (feeling: 'calm' | 'same' | 'stressed') => {
    if (!activeMeditation || !user?.id) {
      console.error('Cannot save meditation session: missing meditation or user ID');
      return;
    }

    try {
      const meditationSession = {
        user_id: user.id, // Use user ID as identifier (same as mood logs)
        technique_id: activeMeditation.id,
        technique_name: activeMeditation.title, // Add technique name for display
        duration_seconds: activeMeditation.duration * 60, // Convert minutes to seconds
        duration_minutes: activeMeditation.duration, // Also store minutes
        completed: true,
        notes: `Completed all ${activeMeditation.instructions.length} steps`,
        mood_before: null,
        mood_after: feeling // calm/same/stressed
      }

      console.log('Saving meditation session to MongoDB...', meditationSession)
      
      // Save to MongoDB via API endpoint (same pattern as mood logs)
      const response = await fetch('http://localhost:8000/api/mental-health/meditation/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('access_token')}`
        },
        body: JSON.stringify(meditationSession)
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✓ Meditation session successfully saved to MongoDB:', result)
        
        // Reload meditation history to show in History tab (same as mood logs reload)
        const historyResponse = await fetch(`http://localhost:8000/api/mental-health/meditation/history/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('access_token')}`
          }
        });
        
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          setMeditationHistory(historyData.sessions || []);
          console.log('✓ Meditation history reloaded from MongoDB');
        }
        
        // Reset meditation state and return to catalog after 10 seconds
        setTimeout(() => {
          setMeditationView('catalog')
          setActiveMeditation(null)
          setCurrentStep(0)
          setTimeRemaining(0)
          setPostMeditationFeeling(null)
        }, 10000)
      } else {
        const errorData = await response.json()
        console.error('Failed to save meditation session:', errorData)
        alert('Failed to save meditation session to database. Please try again.');
      }
    } catch (error) {
      console.error('Error saving meditation session to MongoDB:', error)
      alert('Failed to save meditation session to database. Please try again.');
    }
  }, [activeMeditation, user?.id])

  // Timer effect
  useEffect(() => {
    if (!isTimerRunning || timeRemaining <= 0) return

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setIsTimerRunning(false)
          // Auto-complete when timer ends
          if (currentStep === (activeMeditation?.instructions.length || 0) - 1) {
            completeMeditationSession()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isTimerRunning, timeRemaining, currentStep, activeMeditation, completeMeditationSession])

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

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
                <h3 className="text-lg font-semibold text-purple-900 mb-2">Total Mood Logs</h3>
                <p className="text-purple-700">{moodLogs.length} mood logs saved in database</p>
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
        // Meditation Catalog View
        if (meditationView === 'catalog') {
          return (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Meditation & Mindfulness</h2>
                <p className="text-gray-600">Choose a meditation practice to begin your journey to inner peace</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {meditationSessions.map((session) => (
                  <div 
                    key={session.id} 
                    className="bg-gradient-to-br from-white to-purple-50 border-2 border-purple-200 rounded-xl p-6 hover:border-purple-400 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{session.title}</h3>
                        <p className="text-sm text-gray-600 mb-3">{session.description}</p>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="flex items-center gap-1 text-purple-600 font-medium">
                            <Clock className="w-4 h-4" />
                            {session.duration} min
                          </span>
                          <span className="text-gray-500">
                            {session.instructions.length} steps
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                      onClick={() => startMeditationSession(session)}
                    >
                      <Leaf className="w-5 h-5" />
                      Start Session
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        }

        // Meditation Session View
        if (meditationView === 'session' && activeMeditation) {
          return (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Header */}
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{activeMeditation.title}</h2>
                <p className="text-gray-600">Follow each step mindfully and take your time</p>
              </div>

              {/* Progress Bar */}
              <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-full transition-all duration-500 ease-out"
                  style={{ width: `${((currentStep + 1) / activeMeditation.instructions.length) * 100}%` }}
                />
              </div>

              {/* Step Counter */}
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Step <span className="font-bold text-purple-600">{currentStep + 1}</span> of {activeMeditation.instructions.length}
                </p>
              </div>

              {/* Timer Display */}
              <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl p-8 text-center">
                <div className="text-6xl font-bold text-purple-900 mb-4 animate-pulse">
                  {formatTime(timeRemaining)}
                </div>
                <button
                  onClick={toggleTimer}
                  className="px-6 py-2 bg-white text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition-colors"
                >
                  {isTimerRunning ? '⏸️ Pause Timer' : '▶️ Resume Timer'}
                </button>
              </div>

              {/* Current Instruction Card */}
              <div className="bg-white border-2 border-purple-200 rounded-2xl p-8 shadow-lg animate-fade-in">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {currentStep + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-lg text-gray-800 leading-relaxed">
                      {activeMeditation.instructions[currentStep]}
                    </p>
                  </div>
                </div>
              </div>

              {/* Audio Guide Button */}
              <div className="text-center">
                <button
                  onClick={() => isSpeaking ? stopSpeaking() : speakText(activeMeditation.instructions[currentStep])}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    isSpeaking
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {isSpeaking ? '🔇 Stop Audio Guide' : '🔊 Play Audio Guide'}
                </button>
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={previousStep}
                  disabled={currentStep === 0}
                  className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  ← Previous Step
                </button>
                
                {currentStep < activeMeditation.instructions.length - 1 ? (
                  <button
                    onClick={nextStep}
                    className="flex-1 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Next Step →
                  </button>
                ) : (
                  <button
                    onClick={completeMeditationSession}
                    className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Complete Session ✓
                  </button>
                )}
              </div>

              {/* Exit Button */}
              <div className="text-center">
                <button
                  onClick={() => {
                    stopSpeaking()
                    setMeditationView('catalog')
                    setActiveMeditation(null)
                    setIsTimerRunning(false)
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Exit Session
                </button>
              </div>
            </div>
          )
        }

        // Completion View
        if (meditationView === 'complete' && activeMeditation) {
          return (
            <div className="max-w-2xl mx-auto space-y-8 text-center">
              {/* Congratulations */}
              <div className="animate-bounce-in">
                <div className="text-8xl mb-4">🎉</div>
                <h2 className="text-4xl font-bold text-gray-900 mb-3">Wonderful!</h2>
                <p className="text-xl text-gray-600">
                  You've completed the {activeMeditation.title} session
                </p>
              </div>

              {/* Completion Stats */}
              <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl p-6">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-3xl font-bold text-purple-900">{activeMeditation.duration}</div>
                    <div className="text-sm text-gray-600">Minutes</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-purple-900">{activeMeditation.instructions.length}</div>
                    <div className="text-sm text-gray-600">Steps</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-purple-900">100%</div>
                    <div className="text-sm text-gray-600">Complete</div>
                  </div>
                </div>
              </div>

              {/* Post-Meditation Feeling */}
              <div className="bg-white border-2 border-purple-200 rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">How do you feel now?</h3>
                <p className="text-gray-600 mb-6">Your feedback helps us understand your meditation journey</p>
                
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => {
                      setPostMeditationFeeling('calm')
                      saveMeditationLog('calm')
                    }}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      postMeditationFeeling === 'calm'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <div className="text-4xl mb-2">😌</div>
                    <div className="font-semibold text-gray-900">Calm</div>
                    <div className="text-xs text-gray-600">Feeling peaceful</div>
                  </button>

                  <button
                    onClick={() => {
                      setPostMeditationFeeling('same')
                      saveMeditationLog('same')
                    }}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      postMeditationFeeling === 'same'
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-gray-200 hover:border-yellow-300'
                    }`}
                  >
                    <div className="text-4xl mb-2">😐</div>
                    <div className="font-semibold text-gray-900">Same</div>
                    <div className="text-xs text-gray-600">No change yet</div>
                  </button>

                  <button
                    onClick={() => {
                      setPostMeditationFeeling('stressed')
                      saveMeditationLog('stressed')
                    }}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      postMeditationFeeling === 'stressed'
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-red-300'
                    }`}
                  >
                    <div className="text-4xl mb-2">😰</div>
                    <div className="font-semibold text-gray-900">Stressed</div>
                    <div className="text-xs text-gray-600">Still anxious</div>
                  </button>
                </div>

                {postMeditationFeeling && (
                  <div className="mt-6 p-8 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-2xl animate-fade-in shadow-lg">
                    <div className="text-center space-y-4">
                      <div className="text-5xl mb-2">🙏</div>
                      <h3 className="text-2xl font-bold text-green-800">Thank You!</h3>
                      <p className="text-green-700 text-lg">
                        Your feedback has been saved successfully
                      </p>
                      <p className="text-green-600 text-sm">
                        Returning to meditation catalog in a moment...
                      </p>
                      <button
                        onClick={() => {
                          setMeditationView('catalog')
                          setActiveMeditation(null)
                          setCurrentStep(0)
                          setTimeRemaining(0)
                          setPostMeditationFeeling(null)
                        }}
                        className="mt-4 px-8 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                      >
                        Back to Meditation
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        }

        return null

      case 'history':
        const allEntries = [
          ...moodLogs.map(log => ({ type: 'enhanced' as const, data: log, timestamp: log.timestamp })),
          ...moodEntries.map(entry => ({ type: 'legacy' as const, data: entry, timestamp: entry.timestamp })),
          ...meditationHistory.map(session => ({ type: 'meditation' as const, data: session, timestamp: new Date(session.timestamp) }))
        ].sort((a, b) => {
          const timeA = a.timestamp.getTime()
          const timeB = b.timestamp.getTime()
          return timeB - timeA // Most recent first
        })

        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Activity History</h2>
            <p className="text-gray-600">Track your emotional journey and meditation practice over time.</p>
            
            {allEntries.length === 0 ? (
              <div className="text-center py-8">
                <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No activities yet. Start tracking your mood or practice meditation!</p>
                <div className="flex gap-4 justify-center mt-4">
                  <button
                    onClick={() => setActiveTab('mood')}
                    className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                  >
                    Track Your Mood
                  </button>
                  <button
                    onClick={() => setActiveTab('meditation')}
                    className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                  >
                    Start Meditation
                  </button>
                </div>
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
                    ) : entry.type === 'meditation' ? (
                      // Meditation session display
                      <div>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Leaf className="w-6 h-6 text-green-600" />
                              <span className="text-xl font-bold text-green-900">
                                {entry.data.technique_name}
                              </span>
                              <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                Meditation
                              </span>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                entry.data.mood_after === 'calm' 
                                  ? 'bg-green-100 text-green-800'
                                  : entry.data.mood_after === 'same'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {entry.data.mood_after === 'calm' ? '😌 Calm' : entry.data.mood_after === 'same' ? '😐 Same' : '😰 Stressed'}
                              </span>
                            </div>
                            
                            <div className="mt-3 space-y-2">
                              <div className="flex items-center gap-4 text-sm text-gray-700">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4 text-purple-600" />
                                  <span className="font-medium">{entry.data.duration_minutes} minutes</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-green-600">✓</span>
                                  <span className="font-medium">Completed</span>
                                </div>
                              </div>
                              
                              {entry.data.notes && (
                                <p className="text-sm text-gray-600 bg-green-50 rounded-lg p-3">
                                  {entry.data.notes}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                            {new Date(entry.data.timestamp).toLocaleDateString()} {new Date(entry.data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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