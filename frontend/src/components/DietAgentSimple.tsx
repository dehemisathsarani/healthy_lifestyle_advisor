import React, { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, User, Target, Camera, Apple, Calculator, Heart, Activity } from 'lucide-react'
import { FaRobot } from 'react-icons/fa'
import SimpleProfessionalCalendar from './SimpleProfessionalCalendar'
import NLPNutritionInsights from './NLPNutritionInsights'
import SessionStatus from './SessionStatus'
import QuickLogin from './QuickLogin'
import NutritionChatbot from './NutritionChatbotEnhanced'
import { dietAgentSessionManager } from '../services/SessionManager'
import { dietAgentEmailService } from '../services/EmailService'
import { enhancedFoodAnalysisService, type FoodItem as EnhancedFoodItem } from '../services/enhancedFoodAnalysis'
// Import the service and types separately
import { dietAgentApi } from '../services/dietAgentApi'
import type { UserDietProfile, NutritionEntry, FoodAnalysisResult } from '../services/dietAgentApi'

interface FoodItem {
  name: string
  quantity: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
}

interface DietAgentProps {
  onBackToServices: () => void
  authenticatedUser?: {
    name: string
    email: string
    age?: number
    country?: string
    mobile?: string
  } | null
}

export const DietAgentSimple: React.FC<DietAgentProps> = ({ onBackToServices, authenticatedUser }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<UserDietProfile | null>(null)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile' | 'nutrition' | 'analysis' | 'goals' | 'insights'>('dashboard')
  const [nutritionEntries, setNutritionEntries] = useState<NutritionEntry[]>([])
  const [isOnline, setIsOnline] = useState(true)
  const [sessionInitialized, setSessionInitialized] = useState(false)
  const [showQuickLogin, setShowQuickLogin] = useState(false)
  const [lastUserEmail, setLastUserEmail] = useState('')
  const [isChatbotOpen, setIsChatbotOpen] = useState(false)

  // Initialize session manager and user
  const initializeUser = useCallback(async () => {
    try {
      const isConnected = await dietAgentApi.checkConnection()
      setIsOnline(isConnected)
      
      // Initialize session manager
      if (!sessionInitialized) {
        dietAgentSessionManager.init(
          () => {
            // Session warning callback
            const warningDiv = document.createElement('div')
            warningDiv.className = 'fixed top-4 right-4 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg z-50'
            warningDiv.innerHTML = '⚠️ Session expiring soon. <button onclick="this.parentElement.remove()" class="ml-2 underline">Dismiss</button>'
            document.body.appendChild(warningDiv)
            setTimeout(() => warningDiv.remove(), 10000)
          },
          () => {
            // Session expired callback
            console.log('Session expired, but keeping user logged in with saved data')
            // Don't force logout, just show warning
            const expiredDiv = document.createElement('div')
            expiredDiv.className = 'fixed top-4 right-4 bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg z-50'
            expiredDiv.innerHTML = '📱 Session expired - now working offline. <button onclick="this.parentElement.remove()" class="ml-2 underline">OK</button>'
            document.body.appendChild(expiredDiv)
            setTimeout(() => expiredDiv.remove(), 8000)
          }
        )
        setSessionInitialized(true)
      }
      
      // Try to restore existing session
      const sessionData = await dietAgentSessionManager.restoreSession()
      if (sessionData?.isValid && sessionData.user) {
        setUser(sessionData.user)
        setIsAuthenticated(true)
        setLastUserEmail(sessionData.user.email)
        console.log('✅ Session restored for user:', sessionData.user.name)
        
        // Load nutrition history
        loadNutritionHistoryLocal()
        
        // If online, try to sync with database
        if (isConnected && sessionData.user.email) {
          try {
            const dbProfile = await dietAgentApi.getProfileByEmail(sessionData.user.email)
            if (dbProfile) {
              // Update session with latest data
              await dietAgentSessionManager.updateSession(dbProfile)
              setUser(dbProfile)
            }
          } catch (error) {
            console.warn('Could not sync user with database:', error)
          }
        }
      } else {
        // Check for authenticated user from main app
        if (authenticatedUser && authenticatedUser.email) {
          console.log('🔐 Authenticated user detected:', authenticatedUser.name)
          
          // Try to find existing Diet Agent profile for this user
          try {
            const existingProfile = await dietAgentApi.getProfileByEmail(authenticatedUser.email)
            if (existingProfile) {
              // User already has a Diet Agent profile, use it
              await dietAgentSessionManager.createSession(existingProfile)
              setUser(existingProfile)
              setIsAuthenticated(true)
              setLastUserEmail(existingProfile.email)
              loadNutritionHistoryLocal()
              
              const welcomeDiv = document.createElement('div')
              welcomeDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
              welcomeDiv.innerHTML = `
                <div>🎉 Welcome back, ${existingProfile.name}!</div>
                <div class="text-xs mt-1">Your Diet Agent profile has been restored</div>
              `
              document.body.appendChild(welcomeDiv)
              setTimeout(() => welcomeDiv.remove(), 4000)
              
              console.log('✅ Existing Diet Agent profile loaded for authenticated user')
              return
            }
          } catch (error) {
            console.warn('Could not check for existing profile:', error)
          }
          
          // No existing Diet Agent profile, but we have authenticated user data
          // We'll auto-populate the profile creation form
          setLastUserEmail(authenticatedUser.email)
          
          const authDiv = document.createElement('div')
          authDiv.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
          authDiv.innerHTML = `
            <div>🔐 Welcome, ${authenticatedUser.name}!</div>
            <div class="text-xs mt-1">Please complete your Diet Agent profile setup</div>
          `
          document.body.appendChild(authDiv)
          setTimeout(() => authDiv.remove(), 5000)
          
          return
        }
        
        // Check if we have a last used email for quick login
        const savedEmail = localStorage.getItem('dietAgentLastEmail')
        if (savedEmail) {
          setLastUserEmail(savedEmail)
          setShowQuickLogin(true)
        } else {
          // No valid session found and no previous email
          console.log('No valid session found, user needs to create profile')
        }
      }
    } catch (error) {
      console.error('Error initializing user:', error)
      setIsOnline(false)
    }
  }, [sessionInitialized, setLastUserEmail, authenticatedUser])

  useEffect(() => {
    initializeUser()
  }, [initializeUser])

  // Load nutrition history from localStorage
  const loadNutritionHistoryLocal = () => {
    const savedNutrition = localStorage.getItem('dietAgentNutrition')
    if (savedNutrition) {
      try {
        setNutritionEntries(JSON.parse(savedNutrition))
      } catch (error) {
        console.warn('Failed to load local nutrition history:', error)
      }
    }
  }

  const calculateMetrics = (profile: Omit<UserDietProfile, 'bmi' | 'bmr' | 'tdee' | 'daily_calorie_goal'>) => {
    // Calculate BMI
    const heightInM = profile.height / 100
    const bmi = profile.weight / (heightInM * heightInM)

    // Calculate BMR using Mifflin-St Jeor Equation
    let bmr: number
    if (profile.gender === 'male') {
      bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5
    } else {
      bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161
    }

    // Calculate TDEE based on activity level
    const activityMultipliers = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725,
      extremely_active: 1.9
    }

    const tdee = bmr * activityMultipliers[profile.activity_level as keyof typeof activityMultipliers]

    // Calculate daily calorie goal based on goal
    let calorieAdjustment = 0
    switch (profile.goal) {
      case 'weight_loss':
        calorieAdjustment = -500 // 500 calorie deficit
        break
      case 'weight_gain':
        calorieAdjustment = 500 // 500 calorie surplus
        break
      case 'muscle_gain':
        calorieAdjustment = 300 // Moderate surplus for muscle gain
        break
      default:
        calorieAdjustment = 0 // Maintenance
    }

    const daily_calorie_goal = tdee + calorieAdjustment

    return {
      bmi: Math.round(bmi * 10) / 10,
      bmr: Math.round(bmr),
      tdee: Math.round(tdee * 10) / 10,
      daily_calorie_goal: Math.round(daily_calorie_goal * 10) / 10
    }
  }

  const handleCreateProfile = async (data: Omit<UserDietProfile, 'id' | 'bmi' | 'bmr' | 'tdee' | 'daily_calorie_goal'>) => {
    console.log('🚀 Starting profile creation process...')
    console.log('📊 Profile data:', data)
    console.log('🌐 Online status:', isOnline)
    
    try {
      let newProfile: UserDietProfile
      
      if (isOnline) {
        console.log('🔄 Creating profile in database...')
        // Create profile in database
        newProfile = await dietAgentApi.createProfile(data)
        console.log('✅ Profile created in database:', newProfile)
      } else {
        console.log('📱 Creating profile in offline mode...')
        // Offline mode - create locally
        const metrics = calculateMetrics(data)
        newProfile = {
          ...data,
          ...metrics,
          id: Date.now().toString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        console.log('✅ Profile created locally:', newProfile)
      }
      
      // Create session for the new profile
      const sessionCreated = await dietAgentSessionManager.createSession(newProfile, isOnline ? 'temp_token' : undefined)
      
      if (sessionCreated) {
        // Save user backup for quick login
        const savedUsers: UserDietProfile[] = JSON.parse(localStorage.getItem('dietAgentUserBackups') || '[]')
        const existingUserIndex = savedUsers.findIndex((u: UserDietProfile) => u.email === newProfile.email)
        
        if (existingUserIndex >= 0) {
          savedUsers[existingUserIndex] = newProfile
        } else {
          savedUsers.push(newProfile)
        }
        
        // Keep only the last 3 users
        if (savedUsers.length > 3) {
          savedUsers.splice(0, savedUsers.length - 3)
        }
        
        localStorage.setItem('dietAgentUserBackups', JSON.stringify(savedUsers))
        localStorage.setItem('dietAgentLastEmail', newProfile.email)
        
        setUser(newProfile)
        setIsAuthenticated(true)
        setLastUserEmail(newProfile.email)
        setActiveTab('dashboard')
        
        // Show success message
        const successMessage = document.createElement('div')
        successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
        successMessage.innerHTML = `
          <div>✅ Diet profile created successfully!</div>
          <div class="text-xs mt-1">Session will last 24 hours • ${isOnline ? 'Online' : 'Offline'} mode</div>
          <div class="text-xs mt-1">📧 Welcome email sent to ${newProfile.email}</div>
        `
        document.body.appendChild(successMessage)
        setTimeout(() => successMessage.remove(), 5000)

        // Send welcome email
        try {
          const emailSent = await dietAgentEmailService.sendWelcomeEmail(newProfile)
          if (emailSent) {
            console.log('✅ Welcome email sent successfully to:', newProfile.email)
          } else {
            console.warn('⚠️ Welcome email failed to send to:', newProfile.email)
          }
        } catch (error) {
          console.error('❌ Error sending welcome email:', error)
        }
      } else {
        throw new Error('Failed to create session')
      }
      
    } catch (error) {
      console.error('❌ Error creating profile:', error)
      console.log('🔄 Falling back to local profile creation...')
      
      // Fallback to local creation with session
      const metrics = calculateMetrics(data)
      const profileWithId: UserDietProfile = {
        ...data,
        ...metrics,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      console.log('📱 Created fallback profile:', profileWithId)
      
      // Create fallback session
      await dietAgentSessionManager.createSession(profileWithId)
      
      setUser(profileWithId)
      setIsAuthenticated(true)
      setActiveTab('dashboard')
      
      // Show fallback message
      const errorMessage = document.createElement('div')
      errorMessage.className = 'fixed top-4 right-4 bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
      errorMessage.textContent = '⚠️ Profile created locally (database unavailable)'
      document.body.appendChild(errorMessage)
      setTimeout(() => errorMessage.remove(), 3000)
    }
  }

  // Add logout function
  const handleLogout = () => {
    // Clear session
    dietAgentSessionManager.clearSession()
    
    // Clear local state
    setUser(null)
    setIsAuthenticated(false)
    setNutritionEntries([])
    setActiveTab('dashboard')
    
    // Show logout message
    const logoutMessage = document.createElement('div')
    logoutMessage.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
    logoutMessage.textContent = '👋 Logged out successfully. See you next time!'
    document.body.appendChild(logoutMessage)
    setTimeout(() => logoutMessage.remove(), 3000)
    
    console.log('✅ User logged out successfully')
  }

  // Add session refresh handler
  const handleSessionRefresh = async () => {
    try {
      const success = await dietAgentSessionManager.refreshSession()
      if (success) {
        const sessionData = dietAgentSessionManager.getSessionData()
        if (sessionData?.user) {
          setUser(sessionData.user)
        }
      }
    } catch (error) {
      console.error('Failed to refresh session:', error)
    }
  }

  // Handle quick login
  const handleQuickLogin = async (user: UserDietProfile) => {
    setUser(user)
    setIsAuthenticated(true)
    setLastUserEmail(user.email)
    setShowQuickLogin(false)
    
    // Load nutrition history
    loadNutritionHistoryLocal()
    
    // Save as last used email
    localStorage.setItem('dietAgentLastEmail', user.email)
    
    console.log('✅ Quick login successful for:', user.name)
  }

  // Handle quick login cancel
  const handleQuickLoginCancel = () => {
    setShowQuickLogin(false)
    setLastUserEmail('')
    localStorage.removeItem('dietAgentLastEmail')
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
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
                <Apple className="w-8 h-8 text-brand" />
                <h1 className="text-2xl font-bold text-gray-900">Nutrition & Diet Planner</h1>
              </div>
            </div>
          </div>

          {/* Welcome Banner */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 p-8 text-center shadow-xl">
            <Apple className="w-16 h-16 text-brand mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Your Nutrition Journey</h2>
            <p className="text-lg text-gray-600 mb-6">Create your personalized nutrition profile to get customized meal plans and track your dietary goals.</p>
            
            {/* Quick Login Option */}
            {lastUserEmail && !showQuickLogin && (
              <div className="mb-6">
                <button
                  onClick={() => setShowQuickLogin(true)}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <User className="w-4 h-4 mr-2" />
                  Continue as {lastUserEmail}
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  Or create a new profile below
                </p>
              </div>
            )}
          </div>

          {/* Quick Login Modal */}
          {showQuickLogin && (
            <QuickLogin
              onLogin={handleQuickLogin}
              onCancel={handleQuickLoginCancel}
              savedUserEmail={lastUserEmail}
            />
          )}

          {/* Profile Creation Form */}
          <ProfileForm onSubmit={handleCreateProfile} authenticatedUser={authenticatedUser} />
        </div>

        {/* RAG Nutrition Chatbot - Always Available */}
        {/* Floating Chatbot Toggle Button */}
        {!isChatbotOpen && (
          <button
            onClick={() => setIsChatbotOpen(true)}
            className="fixed bottom-6 right-6 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
            title="Open AI Nutrition Assistant"
          >
            <FaRobot className="text-2xl" />
          </button>
        )}
        
        <NutritionChatbot 
          user={{
            id: 'guest',
            email: authenticatedUser?.email || 'guest@example.com',
            name: authenticatedUser?.name || 'Guest',
            goal: 'general_health'
          }}
          isOpen={isChatbotOpen}
          onToggle={() => setIsChatbotOpen(!isChatbotOpen)}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
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
              <Apple className="w-8 h-8 text-brand" />
              <h1 className="text-2xl font-bold text-gray-900">Nutrition & Diet Planner</h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-white/50">
              <span className="text-sm text-gray-600">Welcome back, </span>
              <span className="font-semibold text-brand">{user?.name}!</span>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Session Status */}
        <SessionStatus 
          user={user}
          isOnline={isOnline}
          onSessionExpired={() => {
            console.log('Session expired - working in offline mode')
          }}
          onSessionRefresh={handleSessionRefresh}
        />

        {/* Navigation Tabs */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 p-2">
          <nav className="flex space-x-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Activity, color: 'text-blue-600' },
              { id: 'profile', label: 'Profile', icon: User, color: 'text-green-600' },
              { id: 'nutrition', label: 'Nutrition Log', icon: Apple, color: 'text-red-500' },
              { id: 'analysis', label: 'Food Analysis', icon: Camera, color: 'text-purple-600' },
              { id: 'insights', label: 'AI Insights', icon: Calculator, color: 'text-indigo-600' },
              { id: 'goals', label: 'Goals & Progress', icon: Target, color: 'text-orange-600' }
            ].map(({ id, label, icon: Icon, color }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as 'dashboard' | 'profile' | 'nutrition' | 'analysis' | 'goals' | 'insights')}
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
            <Dashboard user={user} nutritionEntries={nutritionEntries} />
          )}
          
          {activeTab === 'profile' && user && (
            <ProfileSettings user={user} onUpdate={setUser} />
          )}
          
          {activeTab === 'nutrition' && (
            <NutritionLog 
              nutritionEntries={nutritionEntries} 
              onAddEntry={setNutritionEntries}
              user={user}
              isOnline={isOnline}
            />
          )}
          
          {activeTab === 'analysis' && (
            <FoodAnalysis user={user} isOnline={isOnline} />
          )}
          
          {activeTab === 'insights' && user && (
            <NLPNutritionInsights 
              nutritionData={{
                date: new Date().toISOString().split('T')[0],
                calories: nutritionEntries.filter(entry => {
                  const today = new Date().toDateString()
                  const entryDate = new Date(entry.date).toDateString()
                  return today === entryDate
                }).reduce((sum, entry) => sum + entry.calories, 0),
                protein: nutritionEntries.filter(entry => {
                  const today = new Date().toDateString()
                  const entryDate = new Date(entry.date).toDateString()
                  return today === entryDate
                }).reduce((sum, entry) => sum + entry.protein, 0),
                carbs: nutritionEntries.filter(entry => {
                  const today = new Date().toDateString()
                  const entryDate = new Date(entry.date).toDateString()
                  return today === entryDate
                }).reduce((sum, entry) => sum + entry.carbs, 0),
                fat: nutritionEntries.filter(entry => {
                  const today = new Date().toDateString()
                  const entryDate = new Date(entry.date).toDateString()
                  return today === entryDate
                }).reduce((sum, entry) => sum + entry.fat, 0),
                fiber: nutritionEntries.filter(entry => {
                  const today = new Date().toDateString()
                  const entryDate = new Date(entry.date).toDateString()
                  return today === entryDate
                }).reduce((sum, entry) => sum + (entry.fiber || 0), 0),
                sodium: 2000, // Mock data - could be enhanced
                sugar: 50, // Mock data - could be enhanced
                water_intake: 2000, // Mock data - could be enhanced
                meals_count: nutritionEntries.filter(entry => {
                  const today = new Date().toDateString()
                  const entryDate = new Date(entry.date).toDateString()
                  return today === entryDate
                }).length,
                calorie_target: user.daily_calorie_goal || 2000,
                activity_level: user.activity_level
              }}
              userId={user.id || 'demo-user'}
            />
          )}
          
          {activeTab === 'goals' && user && (
            <GoalsProgress user={user} nutritionEntries={nutritionEntries} />
          )}
        </div>
      </div>

      {/* RAG Nutrition Chatbot */}
      {/* Floating Chatbot Toggle Button */}
      {!isChatbotOpen && (
        <button
          onClick={() => setIsChatbotOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
          title="Open AI Nutrition Assistant"
        >
          <FaRobot className="text-2xl" />
        </button>
      )}
      
      <NutritionChatbot 
        user={{
          id: user?.id || lastUserEmail || 'anonymous',
          email: user?.email || lastUserEmail || authenticatedUser?.email || '',
          name: user?.name || authenticatedUser?.name || 'Guest',
          goal: user?.goal || 'general_health',
          dietary_restrictions: user?.dietary_restrictions || [],
          current_weight: user?.weight,
          target_weight: undefined // This will need to be added to the user profile later if needed
        }}
        isOpen={isChatbotOpen}
        onToggle={() => setIsChatbotOpen(!isChatbotOpen)}
      />
    </div>
  )
}

// Profile Form Component
const ProfileForm: React.FC<{ 
  onSubmit: (data: Omit<UserDietProfile, 'id' | 'bmi' | 'bmr' | 'tdee' | 'daily_calorie_goal'>) => void
  authenticatedUser?: {
    name: string
    email: string
    age?: number
    country?: string
    mobile?: string
  } | null
}> = ({ onSubmit, authenticatedUser }) => {
  const [formData, setFormData] = useState<Omit<UserDietProfile, 'id' | 'bmi' | 'bmr' | 'tdee' | 'daily_calorie_goal'>>({
    name: authenticatedUser?.name || '',
    email: authenticatedUser?.email || '',
    age: authenticatedUser?.age || 25,
    weight: 70,
    height: 170,
    gender: 'male',
    activity_level: 'moderately_active',
    goal: 'maintain_weight',
    dietary_restrictions: [],
    allergies: []
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const activityLevels = [
    { value: 'sedentary', label: 'Sedentary', description: 'Little or no exercise' },
    { value: 'lightly_active', label: 'Lightly Active', description: 'Light exercise 1-3 days/week' },
    { value: 'moderately_active', label: 'Moderately Active', description: 'Moderate exercise 3-5 days/week' },
    { value: 'very_active', label: 'Very Active', description: 'Hard exercise 6-7 days/week' },
    { value: 'extremely_active', label: 'Extremely Active', description: 'Very hard exercise, physical job' }
  ]

  const goals = [
    { value: 'weight_loss', label: 'Weight Loss', description: 'Lose weight safely and sustainably' },
    { value: 'weight_gain', label: 'Weight Gain', description: 'Gain weight and build mass' },
    { value: 'maintain_weight', label: 'Maintain Weight', description: 'Stay at current weight' },
    { value: 'muscle_gain', label: 'Muscle Gain', description: 'Build lean muscle mass' },
    { value: 'general_health', label: 'General Health', description: 'Improve overall nutrition' }
  ]

  const restrictions = [
    'Vegetarian', 'Vegan', 'Gluten-Free', 'Keto', 'Paleo', 'Low-Carb', 'Low-Fat', 'Dairy-Free'
  ]

  const commonAllergies = [
    'Nuts', 'Dairy', 'Eggs', 'Shellfish', 'Fish', 'Soy', 'Wheat', 'Sesame'
  ]

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 p-8 shadow-xl">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Nutrition Profile</h2>
        <p className="text-gray-600">Tell us about yourself to get personalized nutrition recommendations</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <User className="w-5 h-5 mr-2 text-brand" />
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

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
              <input
                type="number"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent transition-all duration-200"
                min="30"
                max="300"
                step="0.1"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Height (cm)</label>
              <input
                type="number"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: parseFloat(e.target.value) })}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent transition-all duration-200"
                min="100"
                max="250"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' | 'other' })}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent transition-all duration-200"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Activity Level */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-600" />
            Activity Level
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activityLevels.map(level => (
              <label key={level.value} className={`flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                formData.activity_level === level.value
                  ? 'border-brand bg-brand/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="activity_level"
                  value={level.value}
                  checked={formData.activity_level === level.value}
                  onChange={(e) => setFormData({ ...formData, activity_level: e.target.value as UserDietProfile['activity_level'] })}
                  className="sr-only"
                />
                <span className="font-medium text-gray-900">{level.label}</span>
                <span className="text-sm text-gray-600 mt-1">{level.description}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Goals */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Target className="w-5 h-5 mr-2 text-green-600" />
            Primary Goal
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map(goal => (
              <label key={goal.value} className={`flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                formData.goal === goal.value
                  ? 'border-brand bg-brand/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="goal"
                  value={goal.value}
                  checked={formData.goal === goal.value}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value as UserDietProfile['goal'] })}
                  className="sr-only"
                />
                <span className="font-medium text-gray-900">{goal.label}</span>
                <span className="text-sm text-gray-600 mt-1">{goal.description}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Dietary Restrictions */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Apple className="w-5 h-5 mr-2 text-red-500" />
            Dietary Restrictions (Optional)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {restrictions.map(restriction => (
              <label key={restriction} className="flex items-center p-3 border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all duration-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.dietary_restrictions?.includes(restriction) || false}
                  onChange={(e) => {
                    const current = formData.dietary_restrictions || []
                    if (e.target.checked) {
                      setFormData({ ...formData, dietary_restrictions: [...current, restriction] })
                    } else {
                      setFormData({ ...formData, dietary_restrictions: current.filter((r: string) => r !== restriction) })
                    }
                  }}
                  className="mr-3 w-4 h-4 text-brand"
                />
                <span className="text-sm font-medium">{restriction}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Allergies */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Heart className="w-5 h-5 mr-2 text-orange-600" />
            Allergies (Optional)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {commonAllergies.map(allergy => (
              <label key={allergy} className="flex items-center p-3 border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all duration-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.allergies?.includes(allergy) || false}
                  onChange={(e) => {
                    const current = formData.allergies || []
                    if (e.target.checked) {
                      setFormData({ ...formData, allergies: [...current, allergy] })
                    } else {
                      setFormData({ ...formData, allergies: current.filter((a: string) => a !== allergy) })
                    }
                  }}
                  className="mr-3 w-4 h-4 text-brand"
                />
                <span className="text-sm font-medium">{allergy}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-brand to-brand-dark hover:from-brand-dark hover:to-brand text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
        >
          Create Nutrition Profile
        </button>
      </form>
    </div>
  )
}

// Dashboard Component
const Dashboard: React.FC<{ 
  user: UserDietProfile
  nutritionEntries: NutritionEntry[]
}> = ({ user, nutritionEntries }) => {
  const todayEntries = nutritionEntries.filter(entry => {
    const today = new Date().toDateString()
    const entryDate = new Date(entry.date).toDateString()
    return today === entryDate
  })

  const todayCalories = todayEntries.reduce((sum, entry) => sum + entry.calories, 0)
  const todayProtein = todayEntries.reduce((sum, entry) => sum + entry.protein, 0)
  const todayCarbs = todayEntries.reduce((sum, entry) => sum + entry.carbs, 0)
  const todayFat = todayEntries.reduce((sum, entry) => sum + entry.fat, 0)

  const calorieProgress = user.daily_calorie_goal ? (todayCalories / user.daily_calorie_goal) * 100 : 0

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { category: 'Underweight', color: 'text-blue-600 bg-blue-100' }
    if (bmi < 25) return { category: 'Normal', color: 'text-green-600 bg-green-100' }
    if (bmi < 30) return { category: 'Overweight', color: 'text-yellow-600 bg-yellow-100' }
    return { category: 'Obese', color: 'text-red-600 bg-red-100' }
  }

  const bmiInfo = user.bmi ? getBMICategory(user.bmi) : null

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white/50 shadow-lg hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">BMI</p>
              <p className="text-2xl font-bold text-gray-900">{user.bmi}</p>
              {bmiInfo && (
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${bmiInfo.color}`}>
                  {bmiInfo.category}
                </span>
              )}
            </div>
            <Calculator className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white/50 shadow-lg hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">BMR</p>
              <p className="text-2xl font-bold text-gray-900">{user.bmr}</p>
              <p className="text-xs text-gray-500">calories/day</p>
            </div>
            <Heart className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white/50 shadow-lg hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">TDEE</p>
              <p className="text-2xl font-bold text-gray-900">{user.tdee}</p>
              <p className="text-xs text-gray-500">calories/day</p>
            </div>
            <Activity className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white/50 shadow-lg hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Daily Goal</p>
              <p className="text-2xl font-bold text-gray-900">{user.daily_calorie_goal}</p>
              <p className="text-xs text-gray-500">calories/day</p>
            </div>
            <Target className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Today's Progress */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 p-6 shadow-lg">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Today's Nutrition</h3>
        
        {/* Calorie Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Calories</span>
            <span className="text-sm text-gray-600">{todayCalories} / {user.daily_calorie_goal}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(calorieProgress, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {calorieProgress > 100 ? 'Over goal' : `${Math.round(100 - calorieProgress)}% remaining`}
          </p>
        </div>

        {/* Macronutrients */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl">
            <p className="text-2xl font-bold text-red-600">{todayProtein}g</p>
            <p className="text-sm text-red-700">Protein</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl">
            <p className="text-2xl font-bold text-yellow-600">{todayCarbs}g</p>
            <p className="text-sm text-yellow-700">Carbs</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
            <p className="text-2xl font-bold text-purple-600">{todayFat}g</p>
            <p className="text-sm text-purple-700">Fat</p>
          </div>
        </div>
      </div>

      {/* Recent Meals */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 p-6 shadow-lg">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Meals</h3>
        {todayEntries.length > 0 ? (
          <div className="space-y-4">
            {todayEntries.slice(-3).map((entry, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-900">{entry.food_description}</p>
                  <p className="text-sm text-gray-600 capitalize">{entry.meal_type}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{entry.calories} cal</p>
                  <p className="text-sm text-gray-600">
                    P:{entry.protein}g C:{entry.carbs}g F:{entry.fat}g
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Apple className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No meals logged today. Start tracking your nutrition!</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Profile Settings Component
const ProfileSettings: React.FC<{
  user: UserDietProfile
  onUpdate: (user: UserDietProfile) => void
}> = ({ user, onUpdate }) => {
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({ ...user })

  const handleSave = async () => {
    const updatedUser = { ...formData, updated_at: new Date().toISOString() }
    onUpdate(updatedUser)
    localStorage.setItem('dietAgentUser', JSON.stringify(updatedUser))
    setEditMode(false)
    
    // Show success message
    const successMessage = document.createElement('div')
    successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
    successMessage.innerHTML = `
      <div>✓ Profile updated successfully!</div>
      <div class="text-xs mt-1">📧 Update notification sent to ${updatedUser.email}</div>
    `
    document.body.appendChild(successMessage)
    setTimeout(() => successMessage.remove(), 3000)

    // Send profile update email
    try {
      const emailSent = await dietAgentEmailService.sendProfileUpdateEmail(updatedUser)
      if (emailSent) {
        console.log('✅ Profile update email sent successfully to:', updatedUser.email)
      } else {
        console.warn('⚠️ Profile update email failed to send to:', updatedUser.email)
      }
    } catch (error) {
      console.error('❌ Error sending profile update email:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Profile Information</h3>
          <button
            onClick={() => editMode ? handleSave() : setEditMode(true)}
            className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors"
          >
            {editMode ? 'Save Changes' : 'Edit Profile'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              value={editMode ? formData.name : user.name}
              onChange={(e) => editMode && setFormData({ ...formData, name: e.target.value })}
              disabled={!editMode}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={editMode ? formData.email : user.email}
              onChange={(e) => editMode && setFormData({ ...formData, email: e.target.value })}
              disabled={!editMode}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
            <input
              type="number"
              value={editMode ? formData.age : user.age}
              onChange={(e) => editMode && setFormData({ ...formData, age: parseInt(e.target.value) })}
              disabled={!editMode}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
            <input
              type="number"
              value={editMode ? formData.weight : user.weight}
              onChange={(e) => editMode && setFormData({ ...formData, weight: parseFloat(e.target.value) })}
              disabled={!editMode}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Height (cm)</label>
            <input
              type="number"
              value={editMode ? formData.height : user.height}
              onChange={(e) => editMode && setFormData({ ...formData, height: parseFloat(e.target.value) })}
              disabled={!editMode}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Goal</label>
            <select
              value={editMode ? formData.goal : user.goal}
              onChange={(e) => editMode && setFormData({ ...formData, goal: e.target.value as UserDietProfile['goal'] })}
              disabled={!editMode}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent disabled:bg-gray-100"
            >
              <option value="weight_loss">Weight Loss</option>
              <option value="weight_gain">Weight Gain</option>
              <option value="maintain_weight">Maintain Weight</option>
              <option value="muscle_gain">Muscle Gain</option>
              <option value="general_health">General Health</option>
            </select>
          </div>
        </div>

        {/* Dietary Restrictions */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Dietary Restrictions</label>
          <div className="flex flex-wrap gap-2">
            {user.dietary_restrictions?.map((restriction: string, index: number) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
              >
                {restriction}
              </span>
            )) || <span className="text-gray-500">None</span>}
          </div>
        </div>

        {/* Allergies */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
          <div className="flex flex-wrap gap-2">
            {user.allergies?.map((allergy: string, index: number) => (
              <span
                key={index}
                className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium"
              >
                {allergy}
              </span>
            )) || <span className="text-gray-500">None</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

// Nutrition Log Component
const NutritionLog: React.FC<{
  nutritionEntries: NutritionEntry[]
  onAddEntry: (entries: NutritionEntry[]) => void
  user: UserDietProfile | null
  isOnline: boolean
}> = ({ nutritionEntries, onAddEntry, user, isOnline }) => {
  const [showAddForm, setShowAddForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newEntry, setNewEntry] = useState<Omit<NutritionEntry, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    meal_type: 'breakfast',
    food_description: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  })

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || isSubmitting) return
    
    setIsSubmitting(true)
    
    try {
      let addedEntry: NutritionEntry
      
      if (isOnline && user.id) {
        // Add to database
        addedEntry = await dietAgentApi.addNutritionEntry(user.id, newEntry)
      } else {
        // Offline mode - add locally
        addedEntry = {
          ...newEntry,
          id: Date.now().toString(),
          date: new Date(newEntry.date).toISOString()
        }
        const updatedEntries = [...nutritionEntries, addedEntry]
        localStorage.setItem('dietAgentNutrition', JSON.stringify(updatedEntries))
      }
      
      const updatedEntries = [...nutritionEntries, addedEntry]
      onAddEntry(updatedEntries)
      
      // Reset form
      setNewEntry({
        date: new Date().toISOString().split('T')[0],
        meal_type: 'breakfast',
        food_description: '',
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      })
      setShowAddForm(false)
      
      // Show success message
      const successMessage = document.createElement('div')
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
      successMessage.textContent = isOnline ? '✓ Nutrition entry saved to database!' : '✓ Nutrition entry saved locally!'
      document.body.appendChild(successMessage)
      setTimeout(() => successMessage.remove(), 3000)
      
    } catch (error) {
      console.error('Error adding nutrition entry:', error)
      
      // Fallback to local storage
      const entryWithId = {
        ...newEntry,
        id: Date.now().toString(),
        date: new Date(newEntry.date).toISOString()
      }
      
      const updatedEntries = [...nutritionEntries, entryWithId]
      onAddEntry(updatedEntries)
      localStorage.setItem('dietAgentNutrition', JSON.stringify(updatedEntries))
      
      setNewEntry({
        date: new Date().toISOString().split('T')[0],
        meal_type: 'breakfast',
        food_description: '',
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      })
      setShowAddForm(false)
      
      // Show error message
      const errorMessage = document.createElement('div')
      errorMessage.className = 'fixed top-4 right-4 bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
      errorMessage.textContent = '⚠️ Entry saved locally (database unavailable)'
      document.body.appendChild(errorMessage)
      setTimeout(() => errorMessage.remove(), 3000)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Add Entry Button */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">Nutrition Log</h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors"
          >
            {showAddForm ? 'Cancel' : 'Add Entry'}
          </button>
        </div>

        {/* Add Entry Form */}
        {showAddForm && (
          <form onSubmit={handleAddEntry} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={newEntry.date}
                  onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Meal Type</label>
                <select
                  value={newEntry.meal_type}
                  onChange={(e) => setNewEntry({ ...newEntry, meal_type: e.target.value as NutritionEntry['meal_type'] })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Food Description</label>
              <input
                type="text"
                value={newEntry.food_description}
                onChange={(e) => setNewEntry({ ...newEntry, food_description: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand"
                placeholder="e.g., Grilled chicken breast with rice and vegetables"
                required
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Calories</label>
                <input
                  type="number"
                  value={newEntry.calories}
                  onChange={(e) => setNewEntry({ ...newEntry, calories: parseFloat(e.target.value) || 0 })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Protein (g)</label>
                <input
                  type="number"
                  value={newEntry.protein}
                  onChange={(e) => setNewEntry({ ...newEntry, protein: parseFloat(e.target.value) || 0 })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand"
                  min="0"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Carbs (g)</label>
                <input
                  type="number"
                  value={newEntry.carbs}
                  onChange={(e) => setNewEntry({ ...newEntry, carbs: parseFloat(e.target.value) || 0 })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand"
                  min="0"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fat (g)</label>
                <input
                  type="number"
                  value={newEntry.fat}
                  onChange={(e) => setNewEntry({ ...newEntry, fat: parseFloat(e.target.value) || 0 })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand"
                  min="0"
                  step="0.1"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-brand text-white py-3 rounded-lg hover:bg-brand-dark transition-colors"
            >
              Add Entry
            </button>
          </form>
        )}
      </div>

      {/* Entries List */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 p-6 shadow-lg">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Entries</h4>
        {nutritionEntries.length > 0 ? (
          <div className="space-y-4">
            {nutritionEntries
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 10)
              .map((entry) => (
                <div key={entry.id} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-medium text-gray-900">{entry.food_description}</h5>
                      <p className="text-sm text-gray-600">
                        {new Date(entry.date).toLocaleDateString()} • {entry.meal_type.charAt(0).toUpperCase() + entry.meal_type.slice(1)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{entry.calories} cal</p>
                      <p className="text-sm text-gray-600">
                        P: {entry.protein}g • C: {entry.carbs}g • F: {entry.fat}g
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Apple className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No nutrition entries yet. Start logging your meals!</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Food Analysis Component
const FoodAnalysis: React.FC<{
  user: UserDietProfile | null
  isOnline: boolean
}> = ({ user, isOnline }) => {
  const [analysisText, setAnalysisText] = useState('')
  const [analysisResult, setAnalysisResult] = useState<FoodAnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [analysisMode, setAnalysisMode] = useState<'text' | 'image'>('text')

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
  }

  const handleAnalysis = async () => {
    if (analysisMode === 'text' && !analysisText.trim()) return
    if (analysisMode === 'image' && !selectedImage) return
    if (!user?.id && isOnline) {
      alert('User profile required for analysis')
      return
    }
    
    setIsAnalyzing(true)
    
    try {
      let result: FoodAnalysisResult
      
      if (isOnline && user?.id) {
        // Use enhanced backend API
        if (analysisMode === 'image' && selectedImage) {
          result = await dietAgentApi.analyzeNutrition(user.id, analysisText || undefined, selectedImage)
        } else {
          result = await dietAgentApi.analyzeNutrition(user.id, analysisText)
        }
      } else {
        // Offline mode - use fallback analysis
        if (analysisMode === 'image' && selectedImage) {
          result = await simulateImageAnalysis(selectedImage)
        } else {
          result = await simulateTextAnalysis(analysisText)
        }
      }
      
      setAnalysisResult(result)
      
      // Show success message with enhanced info
      const successMessage = document.createElement('div')
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
      successMessage.innerHTML = `
        <div class="flex items-center gap-2">
          <span>✓ Analysis completed!</span>
          <span class="text-xs bg-green-400 px-2 py-1 rounded">
            ${Math.round(result.confidence_score * 100)}% confidence
          </span>
        </div>
        <div class="text-xs mt-1">
          Method: ${result.analysis_method} • Found: ${result.food_items.length} items
        </div>
      `
      document.body.appendChild(successMessage)
      setTimeout(() => successMessage.remove(), 4000)
      
    } catch (error) {
      console.error('Analysis failed:', error)
      
      // Fallback to local analysis
      try {
        let result: FoodAnalysisResult
        if (analysisMode === 'image' && selectedImage) {
          result = await simulateImageAnalysis(selectedImage)
        } else {
          result = await simulateTextAnalysis(analysisText)
        }
        setAnalysisResult(result)
        
        // Show fallback message
        const errorMessage = document.createElement('div')
        errorMessage.className = 'fixed top-4 right-4 bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
        errorMessage.textContent = '⚠️ Analysis completed locally (server unavailable)'
        document.body.appendChild(errorMessage)
        setTimeout(() => errorMessage.remove(), 3000)
      } catch (fallbackError) {
        console.error('Fallback analysis also failed:', fallbackError)
        const errorMessage = document.createElement('div')
        errorMessage.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
        errorMessage.textContent = '✗ Analysis failed. Please try again.'
        document.body.appendChild(errorMessage)
        setTimeout(() => errorMessage.remove(), 3000)
      }
    } finally {
      setIsAnalyzing(false)
    }
  }

  const simulateImageAnalysis = async (imageFile: File): Promise<FoodAnalysisResult> => {
    try {
      // Use enhanced food analysis service for better accuracy
      const analysisResult = await enhancedFoodAnalysisService.analyzeImage(imageFile, analysisText || undefined)
      
      if (analysisResult.success) {
        const analysis = analysisResult.analysis
        return {
          _id: Date.now().toString(),
          user_id: user?.id || "offline_user",
          food_items: analysis.foodItems.map((item: EnhancedFoodItem) => ({
            name: item.name,
            quantity: item.portion,
            calories: Math.round(item.calories),
            protein: Math.round(item.protein * 10) / 10,
            carbs: Math.round(item.carbs * 10) / 10,
            fat: Math.round(item.fat * 10) / 10,
            fiber: Math.round((item.fiber || 0) * 10) / 10
          })),
          total_calories: Math.round(analysis.totalNutrition.calories),
          total_protein: Math.round(analysis.totalNutrition.protein * 10) / 10,
          total_carbs: Math.round(analysis.totalNutrition.carbs * 10) / 10,
          total_fat: Math.round(analysis.totalNutrition.fat * 10) / 10,
          analysis_method: 'image',
          meal_type: 'lunch',
          created_at: new Date().toISOString(),
          confidence_score: analysis.confidence,
          image_url: URL.createObjectURL(imageFile),
          text_description: analysis.foodItems.map((f: EnhancedFoodItem) => f.name).join(', ')
        }
      } else {
        throw new Error(analysisResult.error || 'Enhanced analysis failed')
      }
    } catch (error) {
      console.error('Enhanced image analysis failed, using fallback:', error)
      
      // Fallback to simple analysis if enhanced service fails
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const mockFoods = [
        { name: "Rice and Curry", quantity: "1 plate", calories: 450, protein: 18, carbs: 70, fat: 12, fiber: 8 },
        { name: "Chicken Kottu", quantity: "1 serving", calories: 520, protein: 25, carbs: 45, fat: 22, fiber: 5 },
        { name: "Dhal Curry", quantity: "1 cup", calories: 180, protein: 12, carbs: 25, fat: 4, fiber: 10 }
      ]
      
      const selectedFoods = mockFoods.slice(0, Math.floor(Math.random() * 3) + 1)
      
      return {
        _id: Date.now().toString(),
        user_id: user?.id || "offline_user",
        food_items: selectedFoods,
        total_calories: selectedFoods.reduce((sum, food) => sum + food.calories, 0),
        total_protein: selectedFoods.reduce((sum, food) => sum + food.protein, 0),
        total_carbs: selectedFoods.reduce((sum, food) => sum + food.carbs, 0),
        total_fat: selectedFoods.reduce((sum, food) => sum + food.fat, 0),
        analysis_method: 'image',
        meal_type: 'lunch',
        created_at: new Date().toISOString(),
        confidence_score: 0.60,
        image_url: URL.createObjectURL(imageFile),
        text_description: `Fallback analysis: ${selectedFoods.map(f => f.name).join(', ')}`
      }
    }
  }

  const simulateTextAnalysis = async (description: string): Promise<FoodAnalysisResult> => {
    try {
      // Use enhanced food analysis service for better accuracy
      const analysisResult = await enhancedFoodAnalysisService.analyzeImage(
        new File(['dummy'], 'text-analysis.txt', { type: 'text/plain' }), 
        description
      )
      
      if (analysisResult.success) {
        const analysis = analysisResult.analysis
        return {
          _id: Date.now().toString(),
          user_id: user?.id || "offline_user",
          food_items: analysis.foodItems.map((item: EnhancedFoodItem) => ({
            name: item.name,
            quantity: item.portion,
            calories: Math.round(item.calories),
            protein: Math.round(item.protein * 10) / 10,
            carbs: Math.round(item.carbs * 10) / 10,
            fat: Math.round(item.fat * 10) / 10,
            fiber: Math.round((item.fiber || 0) * 10) / 10
          })),
          total_calories: Math.round(analysis.totalNutrition.calories),
          total_protein: Math.round(analysis.totalNutrition.protein * 10) / 10,
          total_carbs: Math.round(analysis.totalNutrition.carbs * 10) / 10,
          total_fat: Math.round(analysis.totalNutrition.fat * 10) / 10,
          analysis_method: 'text',
          meal_type: 'lunch',
          created_at: new Date().toISOString(),
          confidence_score: analysis.confidence,
          image_url: null,
          text_description: description
        }
      } else {
        throw new Error(analysisResult.error || 'Enhanced analysis failed')
      }
    } catch (error) {
      console.error('Enhanced text analysis failed, using fallback:', error)
      
      // Fallback to simple keyword-based analysis
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const foodKeywords = {
        'rice': { name: "Rice", quantity: "1 cup", calories: 200, protein: 4, carbs: 45, fat: 0.5, fiber: 1 },
        'chicken': { name: "Chicken", quantity: "100g", calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 },
        'kottu': { name: "Kottu Roti", quantity: "1 serving", calories: 450, protein: 20, carbs: 40, fat: 20, fiber: 3 },
        'curry': { name: "Vegetable Curry", quantity: "1 cup", calories: 120, protein: 5, carbs: 15, fat: 6, fiber: 4 },
        'dhal': { name: "Dhal", quantity: "1 cup", calories: 180, protein: 12, carbs: 25, fat: 4, fiber: 10 }
      }
      
      const identifiedFoods = []
      const lowerDescription = description.toLowerCase()
      
      for (const [keyword, food] of Object.entries(foodKeywords)) {
        if (lowerDescription.includes(keyword)) {
          identifiedFoods.push(food)
        }
      }
      
      // If no foods identified, add a generic meal
      if (identifiedFoods.length === 0) {
        identifiedFoods.push({
          name: "Mixed Meal",
          quantity: "1 serving",
          calories: 350,
          protein: 15,
          carbs: 40,
          fat: 12,
          fiber: 5
        })
      }
      
      return {
        _id: Date.now().toString(),
        user_id: user?.id || "offline_user",
        food_items: identifiedFoods,
        total_calories: identifiedFoods.reduce((sum, food) => sum + food.calories, 0),
        total_protein: identifiedFoods.reduce((sum, food) => sum + food.protein, 0),
        total_carbs: identifiedFoods.reduce((sum, food) => sum + food.carbs, 0),
        total_fat: identifiedFoods.reduce((sum, food) => sum + food.fat, 0),
        analysis_method: 'text',
        meal_type: 'lunch',
        created_at: new Date().toISOString(),
        confidence_score: 0.65,
        image_url: null,
        text_description: description
      }
    }
  }

  const addToNutritionLog = async () => {
    if (!analysisResult || !user?.id) return
    
    try {
      const nutritionEntry: Omit<NutritionEntry, 'id'> = {
        date: new Date().toISOString().split('T')[0],
        meal_type: analysisResult.meal_type as NutritionEntry['meal_type'],
        food_description: analysisResult.text_description,
        calories: analysisResult.total_calories,
        protein: analysisResult.total_protein,
        carbs: analysisResult.total_carbs,
        fat: analysisResult.total_fat,
        fiber: analysisResult.food_items.reduce((sum: number, item: FoodItem) => sum + (item.fiber || 0), 0)
      }

      if (isOnline && user.id) {
        // Add to database
        await dietAgentApi.addNutritionEntry(user.id, nutritionEntry)
        
        // Show success message
        const successMessage = document.createElement('div')
        successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
        successMessage.textContent = '✓ Added to nutrition log and saved to database!'
        document.body.appendChild(successMessage)
        setTimeout(() => successMessage.remove(), 3000)
      } else {
        // Offline mode - save locally
        const entryWithId = {
          ...nutritionEntry,
          id: Date.now().toString(),
          date: new Date().toISOString()
        }
        
        const existingEntries = JSON.parse(localStorage.getItem('dietAgentNutrition') || '[]')
        const updatedEntries = [...existingEntries, entryWithId]
        localStorage.setItem('dietAgentNutrition', JSON.stringify(updatedEntries))
        
        // Show success message
        const successMessage = document.createElement('div')
        successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
        successMessage.textContent = '✓ Added to nutrition log (offline mode)!'
        document.body.appendChild(successMessage)
        setTimeout(() => successMessage.remove(), 3000)
      }
    } catch (error) {
      console.error('Failed to add to nutrition log:', error)
      
      // Fallback to local storage
      const entryWithId = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        meal_type: analysisResult.meal_type as NutritionEntry['meal_type'],
        food_description: analysisResult.text_description,
        calories: analysisResult.total_calories,
        protein: analysisResult.total_protein,
        carbs: analysisResult.total_carbs,
        fat: analysisResult.total_fat,
        fiber: analysisResult.food_items.reduce((sum: number, item: FoodItem) => sum + (item.fiber || 0), 0)
      }
      
      const existingEntries = JSON.parse(localStorage.getItem('dietAgentNutrition') || '[]')
      const updatedEntries = [...existingEntries, entryWithId]
      localStorage.setItem('dietAgentNutrition', JSON.stringify(updatedEntries))
      
      // Show fallback message
      const errorMessage = document.createElement('div')
      errorMessage.className = 'fixed top-4 right-4 bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
      errorMessage.textContent = '⚠️ Added to nutrition log locally (database unavailable)'
      document.body.appendChild(errorMessage)
      setTimeout(() => errorMessage.remove(), 3000)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 p-6 shadow-lg">
        <h3 className="text-xl font-bold text-gray-900 mb-6">AI Food Analysis</h3>
        
        {/* Analysis Mode Selector */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setAnalysisMode('text')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              analysisMode === 'text'
                ? 'bg-brand text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Text Description
          </button>
          <button
            onClick={() => setAnalysisMode('image')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              analysisMode === 'image'
                ? 'bg-brand text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Image Upload
          </button>
        </div>

        <div className="space-y-4">
          {analysisMode === 'text' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Describe your food or meal
              </label>
              <textarea
                value={analysisText}
                onChange={(e) => setAnalysisText(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                rows={4}
                placeholder="e.g., Kottu roti with chicken, Rice and curry, Fish curry with rice..."
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload a photo of your meal
              </label>
              
              {!imagePreview ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-brand transition-colors">
                  <Camera className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-4">Click to upload or drag and drop</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="inline-flex items-center px-4 py-2 bg-brand text-white rounded-lg cursor-pointer hover:bg-brand-dark transition-colors"
                  >
                    Choose Image
                  </label>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Food preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleAnalysis}
            disabled={
              (analysisMode === 'text' && !analysisText.trim()) ||
              (analysisMode === 'image' && !selectedImage) ||
              isAnalyzing
            }
            className="w-full bg-brand text-white py-3 rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                {analysisMode === 'image' ? 'Analyzing Image...' : 'Analyzing Text...'}
              </>
            ) : (
              `Analyze ${analysisMode === 'image' ? 'Image' : 'Text'}`
            )}
          </button>
        </div>

        {/* Analysis Results */}
        {analysisResult && (
          <div className="mt-6 p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-xl border border-green-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-gray-900">Analysis Results</h4>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Confidence:</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  {Math.round(analysisResult.confidence_score * 100)}%
                </span>
              </div>
            </div>

            {/* Food Items Detected */}
            <div className="space-y-4 mb-6">
              <h5 className="font-semibold text-gray-900">Detected Food Items:</h5>
              {analysisResult.food_items.map((item: FoodItem, index: number) => (
                <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h6 className="font-medium text-gray-900">{item.name}</h6>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{item.calories} cal</p>
                      <p className="text-xs text-gray-600">
                        P: {item.protein}g • C: {item.carbs}g • F: {item.fat}g
                        {item.fiber && ` • Fiber: ${item.fiber}g`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Nutrition Summary */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
              <h5 className="font-semibold text-gray-900 mb-3">Total Nutrition Summary:</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{analysisResult.total_calories}</p>
                  <p className="text-sm text-red-700">Calories</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{analysisResult.total_protein}g</p>
                  <p className="text-sm text-blue-700">Protein</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{analysisResult.total_carbs}g</p>
                  <p className="text-sm text-yellow-700">Carbs</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{analysisResult.total_fat}g</p>
                  <p className="text-sm text-purple-700">Fat</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={addToNutritionLog}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Add to Nutrition Log
              </button>
              <button
                onClick={() => setAnalysisResult(null)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear
              </button>
            </div>

            {/* Analysis Details */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                Analysis Method: {analysisResult.analysis_method.toUpperCase()} • 
                Created: {new Date(analysisResult.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Analysis Examples */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 p-6 shadow-lg">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Examples</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            'Kottu roti with chicken and vegetables',
            'Rice and curry with fish',
            'Hoppers with sambol and curry',
            'Fried rice with chicken'
          ].map((example, index) => (
            <button
              key={index}
              onClick={() => {
                setAnalysisMode('text')
                setAnalysisText(example)
              }}
              className="p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <p className="text-sm text-gray-700">{example}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Goals Progress Component
const GoalsProgress: React.FC<{
  user: UserDietProfile
  nutritionEntries: NutritionEntry[]
}> = ({ user, nutritionEntries }) => {
  // Calculate weekly averages
  const lastWeek = new Date()
  lastWeek.setDate(lastWeek.getDate() - 7)
  
  const weeklyEntries = nutritionEntries.filter(entry => 
    new Date(entry.date) >= lastWeek
  )

  const averageCalories = weeklyEntries.length > 0 
    ? weeklyEntries.reduce((sum, entry) => sum + entry.calories, 0) / 7
    : 0

  const goalProgress = user.daily_calorie_goal 
    ? (averageCalories / user.daily_calorie_goal) * 100 
    : 0

  const getGoalDescription = (goal: string) => {
    switch (goal) {
      case 'weight_loss': return 'Lose weight safely and sustainably'
      case 'weight_gain': return 'Gain weight and build mass'
      case 'maintain_weight': return 'Maintain current weight'
      case 'muscle_gain': return 'Build lean muscle mass'
      case 'general_health': return 'Improve overall nutrition'
      default: return 'Improve nutrition'
    }
  }

  return (
    <div className="space-y-6">
      {/* Current Goal */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 p-6 shadow-lg">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Current Goal</h3>
        
        <div className="bg-gradient-to-r from-brand/10 to-brand-dark/10 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <Target className="w-8 h-8 text-brand mr-3" />
            <div>
              <h4 className="text-lg font-semibold text-gray-900">
                {user.goal.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
              </h4>
              <p className="text-gray-600">{getGoalDescription(user.goal)}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600">Daily Calorie Target</p>
              <p className="text-2xl font-bold text-brand">{user.daily_calorie_goal}</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600">Weekly Average</p>
              <p className="text-2xl font-bold text-gray-900">{Math.round(averageCalories)}</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600">Goal Progress</p>
              <p className="text-2xl font-bold text-green-600">{Math.round(goalProgress)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Chart */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 p-6 shadow-lg">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Weekly Progress</h4>
        
        <div className="space-y-4">
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Calorie Goal Achievement</span>
              <span className="text-sm text-gray-600">{Math.round(goalProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-gradient-to-r from-green-400 to-green-600 h-4 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(goalProgress, 100)}%` }}
              />
            </div>
          </div>

          {/* Weekly Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <p className="text-2xl font-bold text-blue-600">{weeklyEntries.length}</p>
              <p className="text-sm text-blue-700">Meals Logged</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <p className="text-2xl font-bold text-green-600">
                {weeklyEntries.reduce((sum, entry) => sum + entry.protein, 0)}g
              </p>
              <p className="text-sm text-green-700">Total Protein</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-xl">
              <p className="text-2xl font-bold text-yellow-600">
                {weeklyEntries.reduce((sum, entry) => sum + entry.carbs, 0)}g
              </p>
              <p className="text-sm text-yellow-700">Total Carbs</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <p className="text-2xl font-bold text-purple-600">
                {weeklyEntries.reduce((sum, entry) => sum + entry.fat, 0)}g
              </p>
              <p className="text-sm text-purple-700">Total Fat</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 p-6 shadow-lg">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Personalized Recommendations</h4>
        
        <div className="space-y-4">
          {goalProgress < 80 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <p className="text-yellow-800">
                <strong>Increase Intake:</strong> You're averaging {Math.round(averageCalories)} calories per day, 
                which is below your target. Consider adding healthy snacks or larger portions.
              </p>
            </div>
          )}
          
          {goalProgress > 120 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-800">
                <strong>Monitor Portions:</strong> You're exceeding your calorie target. 
                Consider smaller portions or more low-calorie foods.
              </p>
            </div>
          )}
          
          {goalProgress >= 80 && goalProgress <= 120 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-green-800">
                <strong>Great Job!</strong> You're staying within your target range. 
                Keep up the excellent work!
              </p>
            </div>
          )}

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-blue-800">
              <strong>Tip:</strong> Focus on getting adequate protein (0.8-1.2g per kg body weight) 
              and include plenty of vegetables for micronutrients and fiber.
            </p>
          </div>
        </div>
      </div>

      {/* Nutrition Planning Calendar */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 p-6 shadow-lg">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Meal Planning Calendar</h4>
        <div className="mb-4">
          <p className="text-gray-600 text-sm">
            Plan your meals and track your nutrition goals. Click on dates to schedule meals and monitor your progress.
          </p>
        </div>
        {/* Temporarily disabled Professional Calendar to fix import issues */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📅 Meal Calendar</h3>
          <p className="text-gray-600">
            Calendar view of your nutrition entries will be available here.
          </p>
          <div className="mt-4 grid grid-cols-7 gap-2 text-center text-sm">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="font-medium text-gray-500 p-2">{day}</div>
            ))}
            {Array.from({length: 28}, (_, i) => i + 1).map(day => (
              <div key={day} className="p-2 hover:bg-gray-100 rounded cursor-pointer">
                {day}
              </div>
            ))}
          </div>
        </div>
        
        <SimpleProfessionalCalendar 
          compact={true}
          events={nutritionEntries.map(entry => ({
            id: entry.id,
            date: new Date(entry.date),
            title: `${entry.meal_type}: ${entry.food_description}`,
            type: 'meal' as const,
            description: `${entry.calories} cal, ${entry.protein}g protein`,
            time: '12:00' // Default time, could be enhanced to store actual meal times
          }))}
        />
      </div>
    </div>
  )
}