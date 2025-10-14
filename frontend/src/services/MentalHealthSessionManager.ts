/**
 * Mental Health Agent Session Management
 * Similar to Diet Agent session management for consistency
 * Features:
 * - Persistent login sessions (24 hours default)
 * - Auto-refresh tokens
 * - Offline mode support
 * - Session recovery after browser close
 */

export interface UserMentalHealthProfile {
  id?: string
  name: string
  email: string
  age: number
  stress_level: 'low' | 'moderate' | 'high'
  sleep_hours: number
  concerns: string[]
  preferred_activities: string[]
  mood_goals: string[]
  created_at?: string
  updated_at?: string
}

interface MentalHealthSessionData {
  user: UserMentalHealthProfile
  token?: string
  expiresAt: string
  lastActivity: string
  isOfflineMode: boolean
}

interface MentalHealthSessionConfig {
  sessionDuration: number
  refreshThreshold: number
  inactivityTimeout: number
  autoSave: boolean
}

export class MentalHealthSessionManager {
  private config: MentalHealthSessionConfig
  private sessionCheckInterval: ReturnType<typeof setInterval> | null = null
  private inactivityTimer: ReturnType<typeof setTimeout> | null = null
  private sessionWarningCallback?: () => void
  private sessionExpiredCallback?: () => void

  constructor(config?: Partial<MentalHealthSessionConfig>) {
    this.config = {
      sessionDuration: 24 * 60 * 60 * 1000, // 24 hours
      refreshThreshold: 60 * 60 * 1000, // 1 hour
      inactivityTimeout: 60 * 60 * 1000, // 1 hour
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
  async createSession(user: UserMentalHealthProfile, token?: string): Promise<boolean> {
    try {
      const sessionData: MentalHealthSessionData = {
        user,
        token,
        expiresAt: new Date(Date.now() + this.config.sessionDuration).toISOString(),
        lastActivity: new Date().toISOString(),
        isOfflineMode: !token
      }

      // Save to localStorage
      localStorage.setItem('mentalHealthAgentSession', JSON.stringify(sessionData))
      
      // Save backup to sessionStorage (survives tab close)
      sessionStorage.setItem('mentalHealthAgentSessionBackup', JSON.stringify(sessionData))
      
      // Reset inactivity timer
      this.resetInactivityTimer()
      
      console.log('✅ Mental Health Agent session created successfully')
      return true
    } catch (error) {
      console.error('❌ Failed to create Mental Health session:', error)
      return false
    }
  }

  /**
   * Restore existing session
   */
  async restoreSession(): Promise<{ user: UserMentalHealthProfile; isValid: boolean } | null> {
    try {
      // First try localStorage
      let sessionDataStr = localStorage.getItem('mentalHealthAgentSession')
      
      // Fallback to sessionStorage
      if (!sessionDataStr) {
        sessionDataStr = sessionStorage.getItem('mentalHealthAgentSessionBackup')
        if (sessionDataStr) {
          // Restore to localStorage
          localStorage.setItem('mentalHealthAgentSession', sessionDataStr)
        }
      }

      if (!sessionDataStr) {
        return null
      }

      const sessionData: MentalHealthSessionData = JSON.parse(sessionDataStr)
      
      // Check if session is expired
      const now = new Date()
      const expiresAt = new Date(sessionData.expiresAt)
      
      if (now > expiresAt) {
        console.log('⚠️ Mental Health session expired, attempting renewal...')
        
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
      localStorage.setItem('mentalHealthAgentSession', JSON.stringify(sessionData))
      
      // Reset inactivity timer
      this.resetInactivityTimer()
      
      console.log('✅ Mental Health Agent session restored successfully')
      return {
        user: sessionData.user,
        isValid: true
      }
    } catch (error) {
      console.error('❌ Failed to restore Mental Health session:', error)
      this.clearSession()
      return null
    }
  }

  /**
   * Update session with new user data
   */
  async updateSession(user: UserMentalHealthProfile): Promise<boolean> {
    try {
      const sessionDataStr = localStorage.getItem('mentalHealthAgentSession')
      if (!sessionDataStr) {
        return false
      }

      const sessionData: MentalHealthSessionData = JSON.parse(sessionDataStr)
      sessionData.user = user
      sessionData.lastActivity = new Date().toISOString()
      
      localStorage.setItem('mentalHealthAgentSession', JSON.stringify(sessionData))
      sessionStorage.setItem('mentalHealthAgentSessionBackup', JSON.stringify(sessionData))
      
      return true
    } catch (error) {
      console.error('❌ Failed to update Mental Health session:', error)
      return false
    }
  }

  /**
   * Refresh session token
   */
  async refreshSession(): Promise<boolean> {
    try {
      const sessionDataStr = localStorage.getItem('mentalHealthAgentSession')
      if (!sessionDataStr) {
        return false
      }

      const sessionData: MentalHealthSessionData = JSON.parse(sessionDataStr)
      
      // Try to refresh with backend if online
      if (sessionData.token && navigator.onLine) {
        try {
          const response = await fetch('/api/mental-health/auth/refresh', {
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
          console.warn('Mental Health token refresh failed, continuing with offline mode')
          sessionData.isOfflineMode = true
        }
      }

      // Extend session regardless
      sessionData.expiresAt = new Date(Date.now() + this.config.sessionDuration).toISOString()
      sessionData.lastActivity = new Date().toISOString()
      
      localStorage.setItem('mentalHealthAgentSession', JSON.stringify(sessionData))
      sessionStorage.setItem('mentalHealthAgentSessionBackup', JSON.stringify(sessionData))
      
      console.log('✅ Mental Health session refreshed successfully')
      return true
    } catch (error) {
      console.error('❌ Failed to refresh Mental Health session:', error)
      return false
    }
  }

  /**
   * Check if session is valid
   */
  isSessionValid(): boolean {
    try {
      const sessionDataStr = localStorage.getItem('mentalHealthAgentSession')
      if (!sessionDataStr) {
        return false
      }

      const sessionData: MentalHealthSessionData = JSON.parse(sessionDataStr)
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
  getSessionData(): MentalHealthSessionData | null {
    try {
      const sessionDataStr = localStorage.getItem('mentalHealthAgentSession')
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
    localStorage.removeItem('mentalHealthAgentSession')
    sessionStorage.removeItem('mentalHealthAgentSessionBackup')
    localStorage.removeItem('mentalHealthMoodEntries') // Clear cached mood data
    localStorage.removeItem('mentalHealthInterventionHistory') // Clear intervention history
    
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval)
    }
    
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer)
    }
    
    console.log('✅ Mental Health session cleared')
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
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    const resetTimer = () => {
      this.resetInactivityTimer()
      this.updateLastActivity()
    }

    events.forEach(event => {
      document.addEventListener(event, resetTimer, { passive: true })
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
      this.sessionExpiredCallback?.()
    }, this.config.inactivityTimeout)
  }

  /**
   * Update last activity timestamp
   */
  private updateLastActivity(): void {
    const sessionData = this.getSessionData()
    if (sessionData) {
      sessionData.lastActivity = new Date().toISOString()
      localStorage.setItem('mentalHealthAgentSession', JSON.stringify(sessionData))
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
        sessionStorage.setItem('mentalHealthAgentSessionBackup', JSON.stringify(sessionData))
      }
    })
  }

  /**
   * Prompt user for session renewal
   */
  private async promptSessionRenewal(): Promise<boolean> {
    return new Promise((resolve) => {
      const modal = document.createElement('div')
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
      modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-md mx-4">
          <h3 class="text-lg font-bold text-gray-900 mb-4">💙 Mental Health Session Expired</h3>
          <p class="text-gray-600 mb-6">Your session has expired. Would you like to continue where you left off?</p>
          <div class="flex gap-3 justify-end">
            <button id="renewNo" class="px-4 py-2 text-gray-600 hover:text-gray-800">Sign Out</button>
            <button id="renewYes" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Continue Session</button>
          </div>
        </div>
      `
      
      document.body.appendChild(modal)
      
      const yesButton = modal.querySelector('#renewYes')
      const noButton = modal.querySelector('#renewNo')
      
      yesButton?.addEventListener('click', () => {
        modal.remove()
        resolve(true)
      })
      
      noButton?.addEventListener('click', () => {
        modal.remove()
        resolve(false)
      })
    })
  }

  /**
   * Renew expired session
   */
  private async renewSession(sessionData: MentalHealthSessionData): Promise<{ user: UserMentalHealthProfile; isValid: boolean }> {
    // Create new session with extended time
    sessionData.expiresAt = new Date(Date.now() + this.config.sessionDuration).toISOString()
    sessionData.lastActivity = new Date().toISOString()
    sessionData.isOfflineMode = true // Force offline mode for renewed sessions
    
    localStorage.setItem('mentalHealthAgentSession', JSON.stringify(sessionData))
    sessionStorage.setItem('mentalHealthAgentSessionBackup', JSON.stringify(sessionData))
    
    console.log('✅ Mental Health session renewed in offline mode')
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
export const mentalHealthSessionManager = new MentalHealthSessionManager({
  sessionDuration: 24 * 60 * 60 * 1000, // 24 hours
  refreshThreshold: 60 * 60 * 1000, // 1 hour
  inactivityTimeout: 60 * 60 * 1000, // 1 hour
  autoSave: true
})