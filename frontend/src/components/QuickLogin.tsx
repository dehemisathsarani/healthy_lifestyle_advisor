import React, { useState } from 'react'
import { User, Lock, Mail } from 'lucide-react'
import { dietAgentSessionManager } from '../services/SessionManager'
import { dietAgentEmailService } from '../services/EmailService'

type UserDietProfile = {
  id?: string
  name: string
  email: string
  age: number
  weight: number
  height: number
  gender: 'male' | 'female' | 'other'
  activity_level: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active'
  goal: 'weight_loss' | 'weight_gain' | 'maintain_weight' | 'muscle_gain' | 'general_health'
  dietary_restrictions?: string[]
  allergies?: string[]
  bmi?: number
  bmr?: number
  tdee?: number
  daily_calorie_goal?: number
  created_at?: string
  updated_at?: string
}

interface QuickLoginProps {
  onLogin: (user: UserDietProfile) => void
  onCancel: () => void
  savedUserEmail?: string
}

export const QuickLogin: React.FC<QuickLoginProps> = ({ onLogin, onCancel, savedUserEmail }) => {
  const [email, setEmail] = useState(savedUserEmail || '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleQuickLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Try to restore session first
      const sessionData = await dietAgentSessionManager.restoreSession()
      
      if (sessionData?.user && sessionData.user.email.toLowerCase() === email.toLowerCase()) {
        // Session restored successfully - send recovery email
        try {
          await dietAgentEmailService.sendSessionRecoveryEmail(sessionData.user)
          console.log('Session recovery email sent successfully')
        } catch (emailError) {
          console.warn('Failed to send session recovery email:', emailError)
        }
        
        onLogin(sessionData.user)
        return
      }

      // Try to find user in localStorage backup
      const savedUsers: UserDietProfile[] = JSON.parse(localStorage.getItem('dietAgentUserBackups') || '[]')
      const foundUser = savedUsers.find((user: UserDietProfile) => 
        user.email.toLowerCase() === email.toLowerCase()
      )

      if (foundUser) {
        // Create new session for found user
        const sessionCreated = await dietAgentSessionManager.createSession(foundUser)
        
        if (sessionCreated) {
          // Send profile restoration email
          try {
            await dietAgentEmailService.sendProfileRestorationEmail(foundUser, 'session')
            console.log('Profile restoration email sent successfully')
          } catch (emailError) {
            console.warn('Failed to send profile restoration email:', emailError)
          }
          
          onLogin(foundUser)
          return
        }
      }

      // If no user found, show error
      setError('No profile found for this email. Please create a new profile.')
      
    } catch (error) {
      console.error('Quick login failed:', error)
      setError('Login failed. Please try again or create a new profile.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleContinueOffline = async () => {
    // Check if we have any saved data for this email
    const savedUsers: UserDietProfile[] = JSON.parse(localStorage.getItem('dietAgentUserBackups') || '[]')
    const foundUser = savedUsers.find((user: UserDietProfile) => 
      user.email.toLowerCase() === email.toLowerCase()
    )

    if (foundUser) {
      // Create offline session
      await dietAgentSessionManager.createSession(foundUser)
      
      // Send profile restoration email for offline mode
      try {
        await dietAgentEmailService.sendProfileRestorationEmail(foundUser, 'offline')
        console.log('Offline profile restoration email sent successfully')
      } catch (emailError) {
        console.warn('Failed to send offline profile restoration email:', emailError)
      }
      
      onLogin(foundUser)
    } else {
      setError('No offline data found for this email.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Quick Login</h2>
          <p className="text-gray-600">Enter your email to restore your profile</p>
        </div>

        <form onSubmit={handleQuickLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Restore Profile
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleContinueOffline}
              disabled={isLoading || !email}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Continue Offline
            </button>

            <button
              type="button"
              onClick={onCancel}
              className="w-full text-gray-500 py-2 hover:text-gray-700 transition-colors"
            >
              Create New Profile Instead
            </button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">How this works:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Your profile data is saved locally and in our secure database</li>
            <li>• Sessions last 24 hours and auto-refresh when active</li>
            <li>• Works offline with saved data when needed</li>
            <li>• All data syncs when you're back online</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default QuickLogin
