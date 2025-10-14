/**
 * Enhanced Session Management for Diet Agent
 * Features:
 * - Persistent login sessions (24 hours default)
 * - Auto-refresh tokens
 * - Offline mode support
 * - Session recovery after browser close
 */

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

interface SessionData {
  user: UserDietProfile
  token?: string
  expiresAt: string
  lastActivity: string
  isOfflineMode: boolean
}

interface SessionConfig {
  sessionDuration: number // milliseconds
  refreshThreshold: number // milliseconds before expiry to refresh
  inactivityTimeout: number // milliseconds of inactivity before warning
  autoSave: boolean
}

export class DietAgentSessionManager {
  private config: SessionConfig
  private sessionCheckInterval: ReturnType<typeof setInterval> | null = null
  private inactivityTimer: ReturnType<typeof setTimeout> | null = null
  private sessionWarningCallback?: () => void
  private sessionExpiredCallback?: () => void

  constructor(config?: Partial<SessionConfig>) {
    this.config = {
      sessionDuration: 24 * 60 * 60 * 1000, // 24 hours
      refreshThreshold: 30 * 60 * 1000, // 30 minutes
      inactivityTimeout: 30 * 60 * 1000, // 30 minutes
      autoSave: true,
      ...config
    }
  }

  /**
   * Initialize session management
   */
  init(onSessionWarning?: () => void, onSessionExpired?: () => void) {
    this.sessionWarningCallback = onSessionWarning
    this.sessionExpiredCallback = onSessionExpired
    
    // Start session monitoring
    this.startSessionMonitoring()
    
    // Listen for user activity
    this.setupActivityListeners()
    
    // Handle browser close/refresh
    this.setupBeforeUnload()
  }

  /**
   * Create new session
   */
  async createSession(user: UserDietProfile, token?: string): Promise<boolean> {
    try {
      const sessionData: SessionData = {
        user,
        token,
        expiresAt: new Date(Date.now() + this.config.sessionDuration).toISOString(),
        lastActivity: new Date().toISOString(),
        isOfflineMode: !token
      }

      // Save to localStorage
      localStorage.setItem('dietAgentSession', JSON.stringify(sessionData))
      
      // Save backup to sessionStorage (survives tab close)
      sessionStorage.setItem('dietAgentSessionBackup', JSON.stringify(sessionData))
      
      // Reset inactivity timer
      this.resetInactivityTimer()
      
      console.log('✅ Diet Agent session created successfully')
      return true
    } catch (error) {
      console.error('❌ Failed to create session:', error)
      return false
    }
  }

  /**
   * Restore existing session
   */
  async restoreSession(): Promise<{ user: UserDietProfile; isValid: boolean } | null> {
    try {
      // First try localStorage
      let sessionDataStr = localStorage.getItem('dietAgentSession')
      
      // Fallback to sessionStorage
      if (!sessionDataStr) {
        sessionDataStr = sessionStorage.getItem('dietAgentSessionBackup')
        if (sessionDataStr) {
          // Restore to localStorage
          localStorage.setItem('dietAgentSession', sessionDataStr)
        }
      }

      if (!sessionDataStr) {
        return null
      }

      const sessionData: SessionData = JSON.parse(sessionDataStr)
      
      // Check if session is expired
      const now = new Date()
      const expiresAt = new Date(sessionData.expiresAt)
      
      if (now > expiresAt) {
        console.log('⚠️ Session expired, attempting renewal...')
        
        // Try to renew session if user wants to continue
        const shouldRenew = await this.promptSessionRenewal()
        if (shouldRenew) {
          return this.renewSession(sessionData)
        }
        
        this.clearSession()
        return null
      }

      // Update last activity
      sessionData.lastActivity = now.toISOString()
      localStorage.setItem('dietAgentSession', JSON.stringify(sessionData))
      
      // Reset inactivity timer
      this.resetInactivityTimer()
      
      console.log('✅ Diet Agent session restored successfully')
      return {
        user: sessionData.user,
        isValid: true
      }
    } catch (error) {
      console.error('❌ Failed to restore session:', error)
      this.clearSession()
      return null
    }
  }

  /**
   * Update session with new user data
   */
  async updateSession(user: UserDietProfile): Promise<boolean> {
    try {
      const sessionDataStr = localStorage.getItem('dietAgentSession')
      if (!sessionDataStr) {
        return false
      }

      const sessionData: SessionData = JSON.parse(sessionDataStr)
      sessionData.user = user
      sessionData.lastActivity = new Date().toISOString()
      
      localStorage.setItem('dietAgentSession', JSON.stringify(sessionData))
      sessionStorage.setItem('dietAgentSessionBackup', JSON.stringify(sessionData))
      
      return true
    } catch (error) {
      console.error('❌ Failed to update session:', error)
      return false
    }
  }

  /**
   * Refresh session token
   */
  async refreshSession(): Promise<boolean> {
    try {
      const sessionDataStr = localStorage.getItem('dietAgentSession')
      if (!sessionDataStr) {
        return false
      }

      const sessionData: SessionData = JSON.parse(sessionDataStr)
      
      // Try to refresh with backend if online
      if (sessionData.token && navigator.onLine) {
        try {
          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${sessionData.token}`,
              'Content-Type': 'application/json'
            }
          })

          if (response.ok) {
            const { token, expires_at } = await response.json()
            sessionData.token = token
            sessionData.expiresAt = expires_at
          }
        } catch (error) {
          console.warn('Token refresh failed, continuing with offline mode')
          sessionData.isOfflineMode = true
        }
      }

      // Extend session regardless
      sessionData.expiresAt = new Date(Date.now() + this.config.sessionDuration).toISOString()
      sessionData.lastActivity = new Date().toISOString()
      
      localStorage.setItem('dietAgentSession', JSON.stringify(sessionData))
      sessionStorage.setItem('dietAgentSessionBackup', JSON.stringify(sessionData))
      
      console.log('✅ Session refreshed successfully')
      return true
    } catch (error) {
      console.error('❌ Failed to refresh session:', error)
      return false
    }
  }

  /**
   * Check if session is valid
   */
  isSessionValid(): boolean {
    try {
      const sessionDataStr = localStorage.getItem('dietAgentSession')
      if (!sessionDataStr) {
        return false
      }

      const sessionData: SessionData = JSON.parse(sessionDataStr)
      const now = new Date()
      const expiresAt = new Date(sessionData.expiresAt)
      
      return now < expiresAt
    } catch (error) {
      return false
    }
  }

  /**
   * Get current session data
   */
  getSessionData(): SessionData | null {
    try {
      const sessionDataStr = localStorage.getItem('dietAgentSession')
      if (!sessionDataStr) {
        return null
      }
      
      return JSON.parse(sessionDataStr)
    } catch (error) {
      return null
    }
  }

  /**
   * Clear session data
   */
  clearSession(): void {
    localStorage.removeItem('dietAgentSession')
    sessionStorage.removeItem('dietAgentSessionBackup')
    localStorage.removeItem('dietAgentNutrition') // Clear cached nutrition data
    
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval)
    }
    
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer)
    }
    
    console.log('✅ Session cleared')
  }

  /**
   * Set up session monitoring
   */
  private startSessionMonitoring(): void {
    this.sessionCheckInterval = setInterval(() => {
      if (!this.isSessionValid()) {
        this.sessionExpiredCallback?.()
        return
      }

      const sessionData = this.getSessionData()
      if (!sessionData) return

      const now = new Date()
      const expiresAt = new Date(sessionData.expiresAt)
      const timeUntilExpiry = expiresAt.getTime() - now.getTime()

      // Warn user if session is expiring soon
      if (timeUntilExpiry <= this.config.refreshThreshold && timeUntilExpiry > 0) {
        this.sessionWarningCallback?.()
      }
    }, 60000) // Check every minute
  }

  /**
   * Set up activity listeners
   */
  private setupActivityListeners(): void {
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    const updateActivity = () => {
      this.updateLastActivity()
      this.resetInactivityTimer()
    }

    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, true)
    })
  }

  /**
   * Reset inactivity timer
   */
  private resetInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer)
    }

    this.inactivityTimer = setTimeout(() => {
      console.log('⚠️ User inactive for extended period')
      // Could show inactivity warning here
    }, this.config.inactivityTimeout)
  }

  /**
   * Update last activity timestamp
   */
  private updateLastActivity(): void {
    const sessionData = this.getSessionData()
    if (sessionData) {
      sessionData.lastActivity = new Date().toISOString()
      localStorage.setItem('dietAgentSession', JSON.stringify(sessionData))
    }
  }

  /**
   * Set up beforeunload handler
   */
  private setupBeforeUnload(): void {
    window.addEventListener('beforeunload', () => {
      const sessionData = this.getSessionData()
      if (sessionData && this.config.autoSave) {
        // Ensure session is saved to sessionStorage
        sessionStorage.setItem('dietAgentSessionBackup', JSON.stringify(sessionData))
      }
    })
  }

  /**
   * Prompt user for session renewal
   */
  private async promptSessionRenewal(): Promise<boolean> {
    return new Promise((resolve) => {
      const shouldRenew = confirm(
        'Your Diet Agent session has expired. Would you like to continue with your saved profile?\n\n' +
        'Click OK to continue with offline mode, or Cancel to start fresh.'
      )
      resolve(shouldRenew)
    })
  }

  /**
   * Renew expired session
   */
  private async renewSession(sessionData: SessionData): Promise<{ user: UserDietProfile; isValid: boolean }> {
    // Create new session with extended time
    sessionData.expiresAt = new Date(Date.now() + this.config.sessionDuration).toISOString()
    sessionData.lastActivity = new Date().toISOString()
    sessionData.isOfflineMode = true // Force offline mode for renewed sessions
    
    localStorage.setItem('dietAgentSession', JSON.stringify(sessionData))
    sessionStorage.setItem('dietAgentSessionBackup', JSON.stringify(sessionData))
    
    console.log('✅ Session renewed in offline mode')
    return {
      user: sessionData.user,
      isValid: true
    }
  }

  /**
   * Get session status for UI
   */
  getSessionStatus(): {
    isValid: boolean
    timeRemaining: number
    isOfflineMode: boolean
    lastActivity: string
  } {
    const sessionData = this.getSessionData()
    
    if (!sessionData) {
      return {
        isValid: false,
        timeRemaining: 0,
        isOfflineMode: false,
        lastActivity: ''
      }
    }

    const now = new Date()
    const expiresAt = new Date(sessionData.expiresAt)
    const timeRemaining = Math.max(0, expiresAt.getTime() - now.getTime())

    return {
      isValid: timeRemaining > 0,
      timeRemaining,
      isOfflineMode: sessionData.isOfflineMode,
      lastActivity: sessionData.lastActivity
    }
  }
}

// Create singleton instance
export const dietAgentSessionManager = new DietAgentSessionManager({
  sessionDuration: 24 * 60 * 60 * 1000, // 24 hours
  refreshThreshold: 60 * 60 * 1000, // 1 hour
  inactivityTimeout: 60 * 60 * 1000, // 1 hour
  autoSave: true
})
