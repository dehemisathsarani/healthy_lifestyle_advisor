import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { jwtDecode } from 'jwt-decode'
import { getAccessToken, setTokens, clearTokens } from './tokenStore'
import { login as apiLogin, register as apiRegister, getMe } from '../lib/api'

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
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)

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
    } catch {
      // ignore invalid token
    }
  }

  const logout = () => {
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
    }
  }

  const value = useMemo<AuthContextValue>(
    () => ({ userName, profile, isAuthenticated: Boolean(token), loginWithJwt, login, register, logout }),
    [token, userName, profile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}


