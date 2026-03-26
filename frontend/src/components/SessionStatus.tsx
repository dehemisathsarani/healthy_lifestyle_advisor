import React, { useState, useEffect } from 'react'
import { Clock, Wifi, WifiOff, User, Shield, RefreshCw } from 'lucide-react'
import { dietAgentSessionManager } from '../services/SessionManager'

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

interface SessionStatusProps {
  user: UserDietProfile | null
  isOnline: boolean
  onSessionExpired?: () => void
  onSessionRefresh?: () => void
}

export const SessionStatus: React.FC<SessionStatusProps> = ({
  user,
  isOnline,
  onSessionExpired,
  onSessionRefresh
}) => {
  const [sessionStatus, setSessionStatus] = useState({
    isValid: false,
    timeRemaining: 0,
    isOfflineMode: false,
    lastActivity: ''
  })
  const [showDetails, setShowDetails] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    const updateStatus = () => {
      const status = dietAgentSessionManager.getSessionStatus()
      setSessionStatus(status)
      
      // Check if session expired
      if (!status.isValid && user) {
        onSessionExpired?.()
      }
    }

    // Update immediately
    updateStatus()
    
    // Update every 30 seconds
    const interval = setInterval(updateStatus, 30000)
    
    return () => clearInterval(interval)
  }, [user, onSessionExpired])

  const handleRefreshSession = async () => {
    setIsRefreshing(true)
    try {
      const success = await dietAgentSessionManager.refreshSession()
      if (success) {
        onSessionRefresh?.()
        // Show success message
        const message = document.createElement('div')
        message.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50'
        message.textContent = '✅ Session refreshed successfully!'
        document.body.appendChild(message)
        setTimeout(() => message.remove(), 3000)
      }
    } catch (error) {
      console.error('Failed to refresh session:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const formatTimeRemaining = (milliseconds: number): string => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60))
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `${minutes}m`
    } else {
      return 'Expiring soon'
    }
  }

  const formatLastActivity = (timestamp: string): string => {
    if (!timestamp) return 'Unknown'
    
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    return date.toLocaleDateString()
  }

  if (!user) {
    return null
  }

  const getStatusColor = () => {
    if (!sessionStatus.isValid) return 'text-red-500'
    if (sessionStatus.timeRemaining < 30 * 60 * 1000) return 'text-yellow-500' // < 30 min
    return 'text-green-500'
  }

  const getConnectionIcon = () => {
    if (sessionStatus.isOfflineMode || !isOnline) {
      return <WifiOff className="w-4 h-4 text-gray-500" />
    }
    return <Wifi className="w-4 h-4 text-green-500" />
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-white/50 p-4 shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <User className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-gray-900">{user.name}</span>
        </div>
        
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          {showDetails ? 'Hide' : 'Details'}
        </button>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Connection Status */}
          <div className="flex items-center space-x-1">
            {getConnectionIcon()}
            <span className="text-xs text-gray-600">
              {sessionStatus.isOfflineMode || !isOnline ? 'Offline' : 'Online'}
            </span>
          </div>

          {/* Session Status */}
          <div className="flex items-center space-x-1">
            <Shield className={`w-4 h-4 ${getStatusColor()}`} />
            <span className={`text-xs font-medium ${getStatusColor()}`}>
              {sessionStatus.isValid ? 'Active' : 'Expired'}
            </span>
          </div>

          {/* Time Remaining */}
          {sessionStatus.isValid && (
            <div className="flex items-center space-x-1">
              <Clock className={`w-4 h-4 ${getStatusColor()}`} />
              <span className={`text-xs ${getStatusColor()}`}>
                {formatTimeRemaining(sessionStatus.timeRemaining)}
              </span>
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <button
          onClick={handleRefreshSession}
          disabled={isRefreshing}
          className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Detailed Information */}
      {showDetails && (
        <div className="mt-4 pt-3 border-t border-gray-200 space-y-2">
          <div className="text-xs text-gray-600">
            <strong>Email:</strong> {user.email}
          </div>
          
          <div className="text-xs text-gray-600">
            <strong>Last Activity:</strong> {formatLastActivity(sessionStatus.lastActivity)}
          </div>
          
          <div className="text-xs text-gray-600">
            <strong>Profile Created:</strong> {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
          </div>
          
          {sessionStatus.isValid && (
            <div className="text-xs text-gray-600">
              <strong>Session Expires:</strong> {
                new Date(Date.now() + sessionStatus.timeRemaining).toLocaleString()
              }
            </div>
          )}

          {/* Session Warnings */}
          {sessionStatus.timeRemaining < 30 * 60 * 1000 && sessionStatus.isValid && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
              ⚠️ Your session will expire soon. Click refresh to extend.
            </div>
          )}

          {!sessionStatus.isValid && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
              ❌ Session expired. Your data is saved locally. Click refresh to continue.
            </div>
          )}

          {sessionStatus.isOfflineMode && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
              📱 Working in offline mode. Data will sync when online.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SessionStatus
