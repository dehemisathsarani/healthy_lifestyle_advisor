import React, { createContext, useContext, useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { jwtDecode } from 'jwt-decode'
import { getAccessToken, setTokens, clearTokens } from './tokenStore'
import { login as apiLogin, register as apiRegister, getMe } from '../lib/api'
import SessionTimeoutAlert from '../components/SessionTimeoutModal'

type DecodedToken = { sub?: string; name?: string; email?: string; exp?: number }

type UserProfile = { name: string; email: string; age?: number; country?: string; mobile?: string }
type AuthContextValue = {
  userName: string | null
  profile: UserProfile | null
  isAuthenticated: boolean
  loginWithJwt: (token: string) => void
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, extra?: { age?: number; country?: string; mobile?: string }) => Promise<void>
  logout: () => void
  extendSession: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  
  // Session timeout functionality
  const [showTimeoutModal, setShowTimeoutModal] = useState(false)
  const [timeoutCountdown, setTimeoutCountdown] = useState(60) // Countdown in seconds before logout
  const inactivityTimeoutRef = useRef<number | null>(null)
  const countdownTimerRef = useRef<number | null>(null)
  
  const INACTIVITY_TIMEOUT = 2 * 60 * 1000 // 2 minutes in milliseconds

  // Reset the session timeout
  const resetInactivityTimeout = useCallback(() => {
    if (inactivityTimeoutRef.current) {
      window.clearTimeout(inactivityTimeoutRef.current)
    }
    
    // Only set the timeout if the user is authenticated
    if (token) {
      inactivityTimeoutRef.current = window.setTimeout(() => {
        setShowTimeoutModal(true)
        startCountdown()
      }, INACTIVITY_TIMEOUT)
    }
  }, [token])

  // Start the countdown before automatic logout
  const startCountdown = useCallback(() => {
    if (countdownTimerRef.current) {
      window.clearInterval(countdownTimerRef.current)
    }
    
    setTimeoutCountdown(60) // Reset to 60 seconds
    
    countdownTimerRef.current = window.setInterval(() => {
      setTimeoutCountdown(prev => {
        if (prev <= 1) {
          // Time's up, logout
          if (countdownTimerRef.current) {
            window.clearInterval(countdownTimerRef.current)
          }
          logout()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Extend the session when the user clicks the button
  const extendSession = useCallback(() => {
    if (countdownTimerRef.current) {
      window.clearInterval(countdownTimerRef.current)
    }
    setShowTimeoutModal(false)
    resetInactivityTimeout()
  }, [resetInactivityTimeout])

  // Track user activity
  useEffect(() => {
    if (!token) return
    
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    
    const handleUserActivity = () => {
      // Only reset the timeout if the modal is not showing
      if (!showTimeoutModal) {
        resetInactivityTimeout()
      }
    }
    
    // Add event listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, handleUserActivity)
    })
    
    // Initial setup
    resetInactivityTimeout()
    
    // Initial setup
    resetInactivityTimeout()
    
    // Cleanup
    return () => {
      if (inactivityTimeoutRef.current) {
        window.clearTimeout(inactivityTimeoutRef.current)
      }
      if (countdownTimerRef.current) {
        window.clearInterval(countdownTimerRef.current)
      }
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleUserActivity)
      })
    }
  }, [token, showTimeoutModal, resetInactivityTimeout, startCountdown])

  useEffect(() => {
    const saved = getAccessToken()
    if (saved) {
      try {
        const decoded = jwtDecode<DecodedToken>(saved)
        if (!decoded.exp || decoded.exp * 1000 > Date.now()) {
          setToken(saved)
          setUserName(decoded.name || decoded.email || decoded.sub || 'User')
          getMe().then((u) => setProfile(u))
        } else {
          clearTokens()
        }
      } catch {
        clearTokens()
      }
    }
  }, [])

  const loginWithJwt = (newToken: string) => {
    try {
      const decoded = jwtDecode<DecodedToken>(newToken)
      setToken(newToken)
      setUserName(decoded.name || decoded.email || decoded.sub || 'User')
      setTokens({ accessToken: newToken })
      // Reset inactivity timeout after JWT login
      resetInactivityTimeout()
    } catch {
      // ignore invalid token
    }
  }

  const logout = () => {
    // Clear timeout and countdown timers
    if (inactivityTimeoutRef.current) {
      window.clearTimeout(inactivityTimeoutRef.current)
      inactivityTimeoutRef.current = null
    }
    if (countdownTimerRef.current) {
      window.clearInterval(countdownTimerRef.current)
      countdownTimerRef.current = null
    }
    
    setShowTimeoutModal(false)
    setToken(null)
    setUserName(null)
    setProfile(null)
    clearTokens()
  }

  async function login(email: string, password: string) {
    await apiLogin(email, password)
    const saved = getAccessToken()
    if (saved) {
      const decoded = jwtDecode<DecodedToken>(saved)
      setToken(saved)
      setUserName(decoded.name || decoded.email || decoded.sub || 'User')
      const u = await getMe()
      setProfile(u)
      // Reset inactivity timeout after successful login
      resetInactivityTimeout()
    }
  }

  async function register(name: string, email: string, password: string, extra?: { age?: number; country?: string; mobile?: string }) {
    const directProfile = await apiRegister(name, email, password, extra)
    const saved = getAccessToken()
    if (saved) {
      const decoded = jwtDecode<DecodedToken>(saved)
      setToken(saved)
      setUserName(decoded.name || decoded.email || decoded.sub || 'User')
      if (directProfile) {
        setProfile(directProfile)
      } else {
        const u = await getMe()
        setProfile(u)
      }
      // Reset inactivity timeout after successful registration
      resetInactivityTimeout()
    }
  }

  const value = useMemo<AuthContextValue>(
    () => ({ 
      userName, 
      profile, 
      isAuthenticated: Boolean(token), 
      loginWithJwt, 
      login, 
      register, 
      logout,
      extendSession
    }),
    [token, userName, profile, extendSession],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
      <SessionTimeoutAlert 
        isOpen={showTimeoutModal} 
        onExtend={extendSession} 
        onLogout={logout} 
        remainingTime={timeoutCountdown} 
      />
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}


