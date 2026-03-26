import React, { useState, useEffect } from 'react'
import { ArrowLeft, Brain, Heart, MessageCircle, Calendar, TrendingUp, Smile, Frown, Meh, Play, Target } from 'lucide-react'

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
  mood: 'happy' | 'neutral' | 'sad' | 'anxious' | 'stressed' | 'calm'
  energy_level: number // 1-10
  stress_level: number // 1-10
  notes?: string
  activities: string[]
}

interface MentalHealthAgentProps {
  onBackToServices: () => void
}

export const MentalHealthAgent: React.FC<MentalHealthAgentProps> = ({ onBackToServices }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<UserMentalHealthProfile | null>(null)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'mood' | 'activities' | 'insights' | 'profile'>('dashboard')
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([])
  const [showMoodLogger, setShowMoodLogger] = useState(false)

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
  }

  const handleCreateProfile = (data: UserMentalHealthProfile) => {
    const profileWithId = {
      ...data,
      id: Date.now().toString()
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

  const logMoodEntry = (entry: Omit<MoodEntry, 'id' | 'date'>) => {
    const newEntry: MoodEntry = {
      ...entry,
      id: Date.now().toString(),
      date: new Date().toISOString()
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
              { id: 'profile', label: 'Profile', icon: Target, color: 'text-orange-600' }
            ].map(({ id, label, icon: Icon, color }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as 'dashboard' | 'mood' | 'activities' | 'insights' | 'profile')}
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

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case 'happy': return <Smile className="w-6 h-6 text-green-600" />
      case 'neutral': return <Meh className="w-6 h-6 text-gray-600" />
      case 'sad': return <Frown className="w-6 h-6 text-blue-600" />
      case 'anxious': return <Heart className="w-6 h-6 text-orange-600" />
      case 'stressed': return <Brain className="w-6 h-6 text-red-600" />
      case 'calm': return <Heart className="w-6 h-6 text-purple-600" />
      default: return <Meh className="w-6 h-6 text-gray-400" />
    }
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white/50 shadow-lg hover:shadow-xl transition-all duration-200">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl">
              {recentMood ? getMoodIcon(recentMood.mood) : <Heart className="w-6 h-6 text-gray-400" />}
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Current Mood</p>
              <p className="text-lg font-bold text-gray-900 capitalize">
                {recentMood?.mood || 'Not logged yet'}
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
                {getMoodIcon(recentMood.mood)}
                <span className="text-lg font-semibold capitalize">{recentMood.mood}</span>
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
    mood: 'neutral' as MoodEntry['mood'],
    energy_level: 5,
    stress_level: 5,
    notes: '',
    activities: [] as string[]
  })

  const moodOptions = [
    { value: 'happy', label: 'Happy', icon: Smile, color: 'text-green-600', bgColor: 'bg-green-100' },
    { value: 'neutral', label: 'Neutral', icon: Meh, color: 'text-gray-600', bgColor: 'bg-gray-100' },
    { value: 'sad', label: 'Sad', icon: Frown, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { value: 'anxious', label: 'Anxious', icon: Heart, color: 'text-orange-600', bgColor: 'bg-orange-100' },
    { value: 'stressed', label: 'Stressed', icon: Brain, color: 'text-red-600', bgColor: 'bg-red-100' },
    { value: 'calm', label: 'Calm', icon: Heart, color: 'text-purple-600', bgColor: 'bg-purple-100' }
  ]

  const activities = [
    'Work', 'Exercise', 'Social', 'Rest', 'Hobby', 'Family', 'Study', 'Travel'
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmitMood(moodData)
    setMoodData({
      mood: 'neutral',
      energy_level: 5,
      stress_level: 5,
      notes: '',
      activities: []
    })
  }

  if (showLogger) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Heart className="w-8 h-8 mr-3 text-brand" />
            Log Your Mood
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
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-6">How are you feeling right now?</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {moodOptions.map(({ value, label, icon: Icon, color, bgColor }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMoodData({ ...moodData, mood: value as MoodEntry['mood'] })}
                    className={`flex flex-col items-center p-6 rounded-2xl border-2 transition-all duration-200 transform hover:scale-105 ${
                      moodData.mood === value
                        ? 'border-brand bg-brand/10 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className={`p-3 rounded-xl mb-3 ${bgColor}`}>
                      <Icon className={`w-8 h-8 ${color}`} />
                    </div>
                    <span className={`text-sm font-semibold ${
                      moodData.mood === value ? 'text-brand' : 'text-gray-700'
                    }`}>
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

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
              <label className="block text-sm font-semibold text-gray-700 mb-4">How was your day? (Optional)</label>
              <textarea
                value={moodData.notes}
                onChange={(e) => setMoodData({ ...moodData, notes: e.target.value })}
                rows={4}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent transition-all duration-200"
                placeholder="Share what affected your mood today..."
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-brand to-brand-dark hover:from-brand-dark hover:to-brand text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Save Mood Entry
            </button>
          </form>
        </div>
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
                    {moodOptions.find(m => m.value === entry.mood) && React.createElement(
                      moodOptions.find(m => m.value === entry.mood)!.icon, 
                      { className: `w-8 h-8 ${moodOptions.find(m => m.value === entry.mood)!.color}` }
                    )}
                    <span className="text-xl font-bold capitalize">{entry.mood}</span>
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
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Notes:</p>
                  <p className="text-gray-700 italic">"{entry.notes}"</p>
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
        const moodScores = { happy: 5, calm: 4, neutral: 3, anxious: 2, stressed: 1, sad: 1 }
        return sum + moodScores[entry.mood]
      }, 0) / moodEntries.length
    : 0

  const weeklyData = moodEntries.slice(0, 7)
  const avgWeeklyStress = weeklyData.length > 0 
    ? weeklyData.reduce((sum, entry) => sum + entry.stress_level, 0) / weeklyData.length
    : 0

  const avgWeeklyEnergy = weeklyData.length > 0 
    ? weeklyData.reduce((sum, entry) => sum + entry.energy_level, 0) / weeklyData.length
    : 0

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center">
          <TrendingUp className="w-8 h-8 mr-3 text-brand" />
          Mental Health Insights
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
