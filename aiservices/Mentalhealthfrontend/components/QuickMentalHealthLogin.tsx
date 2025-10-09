import React, { useState } from 'react'
import { User, Mail, Heart, ArrowRight } from 'lucide-react'
import type { UserMentalHealthProfile } from '../services/MentalHealthSessionManager'

interface QuickMentalHealthLoginProps {
  lastUserEmail: string
  onLogin: (user: UserMentalHealthProfile) => void
  onCancel: () => void
  onCreateNew: () => void
}

const QuickMentalHealthLogin: React.FC<QuickMentalHealthLoginProps> = ({
  lastUserEmail,
  onLogin,
  onCancel,
  onCreateNew
}) => {
  const [isLoading, setIsLoading] = useState(false)

  const handleQuickLogin = async () => {
    setIsLoading(true)
    
    try {
      // Look for saved user profiles
      const savedUsers: UserMentalHealthProfile[] = JSON.parse(
        localStorage.getItem('mentalHealthUserBackups') || '[]'
      )
      
      const user = savedUsers.find(u => u.email === lastUserEmail)
      
      if (user) {
        onLogin(user)
      } else {
        // If no saved user found, redirect to create new profile
        const errorMessage = document.createElement('div')
        errorMessage.className = 'fixed top-4 right-4 bg-orange-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
        errorMessage.textContent = '⚠️ User profile not found. Please create a new profile.'
        document.body.appendChild(errorMessage)
        setTimeout(() => {
          errorMessage.remove()
          onCreateNew()
        }, 3000)
      }
    } catch (error) {
      console.error('Quick login error:', error)
      const errorMessage = document.createElement('div')
      errorMessage.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
      errorMessage.textContent = '❌ Login failed. Please try again.'
      document.body.appendChild(errorMessage)
      setTimeout(() => errorMessage.remove(), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 p-8 shadow-xl">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-full">
            <Heart className="w-8 h-8 text-white" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back! 💙</h3>
        <p className="text-gray-600">Continue your mental health journey</p>
      </div>

      <div className="space-y-4">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-500 p-2 rounded-lg">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">Last used account:</p>
              <p className="text-lg font-bold text-blue-600">{lastUserEmail}</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleQuickLogin}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Logging in...</span>
            </>
          ) : (
            <>
              <User className="w-5 h-5" />
              <span>Continue as {lastUserEmail.split('@')[0]}</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        <div className="flex space-x-3">
          <button
            onClick={onCreateNew}
            className="flex-1 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-md"
          >
            Create New Profile
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-md"
          >
            Use Different Email
          </button>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          Your mental health data is securely stored locally and synchronized when available.
        </p>
      </div>
    </div>
  )
}

export default QuickMentalHealthLogin