import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface User {
  id: string
  username: string
  email?: string
  name?: string
}

export interface AuthContextType {
  user: User | null
  profile: any
  userName?: string
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithJwt: (token: string) => Promise<void>
  register: (name: string, email: string, password: string, additionalData?: any) => Promise<void>
  logout: () => void
  setProfile: (profile: any) => void
  extendSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true)
      
      // Mock login - in real app, make API call
      const mockUser: User = {
        id: '1',
        username: email.split('@')[0],
        email: email,
        name: 'Demo User'
      }
      
      localStorage.setItem('authToken', 'mock-token-123')
      setUser(mockUser)
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (name: string, email: string, password: string, additionalData?: any): Promise<void> => {
    try {
      setIsLoading(true)
      
      // Mock registration - in real app, make API call
      const mockUser: User = {
        id: '1',
        username: email.split('@')[0],
        email: email,
        name: name
      }
      
      localStorage.setItem('authToken', 'mock-token-123')
      setUser(mockUser)
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const loginWithJwt = async (token: string): Promise<void> => {
    try {
      setIsLoading(true)
      localStorage.setItem('authToken', token)
      
      // In a real app, decode and validate the JWT
      const mockUser: User = {
        id: '1',
        username: 'jwt_user',
        email: 'jwt@example.com',
        name: 'JWT User'
      }
      
      setUser(mockUser)
    } catch (error) {
      console.error('JWT login failed:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const extendSession = async (): Promise<void> => {
    try {
      // In a real app, refresh the token with the backend
      const token = localStorage.getItem('authToken')
      if (token) {
        localStorage.setItem('authToken', token + '-extended')
      }
    } catch (error) {
      console.error('Session extension failed:', error)
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('authToken')
    setUser(null)
    setProfile(null)
  }

  const checkAuth = async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        setIsLoading(false)
        return false
      }

      // For demo purposes, we'll use a simple token check
      const mockUser: User = {
        id: '1',
        username: 'demo_user',
        email: 'demo@example.com',
        name: 'Demo User'
      }
      
      setUser(mockUser)
      setIsLoading(false)
      return true
    } catch (error) {
      console.error('Auth check failed:', error)
      setUser(null)
      setIsLoading(false)
      return false
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const value: AuthContextType = {
    user,
    profile,
    userName: user?.name || user?.username,
    isAuthenticated: !!user,
    isLoading,
    login,
    loginWithJwt,
    register,
    logout,
    setProfile,
    extendSession
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}