import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import jwtDecode from 'jwt-decode'

type DecodedToken = { sub?: string; name?: string; email?: string; exp?: number }

type AuthContextValue = {
  userName: string | null
  isAuthenticated: boolean
  loginWithJwt: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)

  useEffect(() => {
    const saved = sessionStorage.getItem('auth_token')
    if (saved) {
      try {
        const decoded = jwtDecode<DecodedToken>(saved)
        if (!decoded.exp || decoded.exp * 1000 > Date.now()) {
          setToken(saved)
          setUserName(decoded.name || decoded.email || decoded.sub || 'User')
        } else {
          sessionStorage.removeItem('auth_token')
        }
      } catch {
        sessionStorage.removeItem('auth_token')
      }
    }
  }, [])

  const loginWithJwt = (newToken: string) => {
    try {
      const decoded = jwtDecode<DecodedToken>(newToken)
      setToken(newToken)
      setUserName(decoded.name || decoded.email || decoded.sub || 'User')
      sessionStorage.setItem('auth_token', newToken)
    } catch {
      // ignore invalid token
    }
  }

  const logout = () => {
    setToken(null)
    setUserName(null)
    sessionStorage.removeItem('auth_token')
  }

  const value = useMemo<AuthContextValue>(
    () => ({ userName, isAuthenticated: Boolean(token), loginWithJwt, logout }),
    [token, userName],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}


