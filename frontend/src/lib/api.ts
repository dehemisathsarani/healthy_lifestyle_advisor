import jwt_decode from 'jwt-decode'
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '../auth/tokenStore'
import { API_BASE, isDemoMode } from './env'

if (!API_BASE) {
  // eslint-disable-next-line no-console
  console.warn('VITE_API_BASE_URL is not set. Set it in .env for real API calls.')
}
 
export type UserProfile = {
  name: string
  email: string
  age?: number
  country?: string
  mobile?: string
}

type LoginResponse = { accessToken: string; refreshToken?: string; user?: UserProfile }
type RegisterResponse = { accessToken: string; refreshToken?: string; user?: UserProfile }

function isExpired(token: string): boolean {
  try {
    const { exp } = jwt_decode<{ exp?: number }>(token)
    if (!exp) return false
    return exp * 1000 < Date.now() + 10_000 // consider near-expiry
  } catch {
    return true
  }
}

async function refresh(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    if (!res.ok) return false
    const data = (await res.json()) as LoginResponse
    setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken ?? refreshToken })
    return true
  } catch {
    return false
  }
}

export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  if (isDemoMode()) {
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }
  const url = `${API_BASE}${input}`
  let token = getAccessToken()
  if (token && isExpired(token)) {
    const ok = await refresh()
    if (!ok) {
      clearTokens()
      token = null
    } else {
      token = getAccessToken()
    }
  }
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const res = await fetch(url, { ...init, headers })
  if (res.status === 401 && getRefreshToken()) {
    const ok = await refresh()
    if (ok) {
      const retryHeaders = new Headers(init.headers)
      retryHeaders.set('Content-Type', 'application/json')
      const newToken = getAccessToken()
      if (newToken) retryHeaders.set('Authorization', `Bearer ${newToken}`)
      return fetch(url, { ...init, headers: retryHeaders })
    }
  }
  return res
}

export async function login(email: string, password: string): Promise<void> {
  if (isDemoMode()) {
    const fakeExp = Math.floor(Date.now() / 1000) + 60 * 60
    const payload = btoa(JSON.stringify({ sub: email, name: email.split('@')[0], exp: fakeExp }))
    const fakeToken = `header.${payload}.sig`
    setTokens({ accessToken: fakeToken, refreshToken: 'demo-refresh-token' })
    return
  }
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error('Login failed')
  const data = (await res.json()) as LoginResponse
  setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken ?? null })
}

export async function register(name: string, email: string, password: string, extra?: { age?: number; country?: string; mobile?: string }): Promise<UserProfile | undefined> {
  if (isDemoMode()) {
    const fakeExp = Math.floor(Date.now() / 1000) + 60 * 60
    const payload = btoa(JSON.stringify({ sub: email, name, exp: fakeExp }))
    const fakeToken = `header.${payload}.sig`
    setTokens({ accessToken: fakeToken, refreshToken: 'demo-refresh-token' })
    return { name, email, age: extra?.age, country: extra?.country, mobile: extra?.mobile }
  }
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, ...extra }),
  })
  if (!res.ok) throw new Error('Registration failed')
  const data = (await res.json()) as RegisterResponse
  setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken ?? null })
  return data.user
}

export async function getMe(): Promise<UserProfile | null> {
  if (isDemoMode()) {
    const token = getAccessToken()
    if (!token) return null
    try {
      const { name, sub } = jwt_decode<{ name?: string; sub?: string }>(token)
      return { name: name || 'User', email: sub || 'user@example.com' }
    } catch {
      return { name: 'User', email: 'user@example.com' }
    }
  }
  try {
    const res = await apiFetch('/auth/me', { method: 'GET' })
    if (!res.ok) return null
    return (await res.json()) as UserProfile
  } catch {
    return null
  }
}

export async function getOAuthUrl(provider: 'google', redirectUri: string): Promise<string> {
  if (isDemoMode()) {
    const url = `${window.location.origin}/oauth/callback?provider=${provider}&code=demo-code`
    return url
  }
  try {
    const res = await fetch(
      `${API_BASE}/auth/oauth/${provider}/url?redirectUri=${encodeURIComponent(redirectUri)}`,
      { method: 'GET' },
    )
    if (res.ok) {
      const data = (await res.json()) as { url?: string }
      if (data?.url) return data.url
    }
  } catch {}
  // Fallback: backend handles building the URL
  return `${API_BASE}/auth/oauth/${provider}?redirectUri=${encodeURIComponent(redirectUri)}`
}

export async function exchangeOAuthCode(
  provider: 'google',
  code: string,
  redirectUri: string,
): Promise<UserProfile | undefined> {
  if (isDemoMode()) {
    const fakeExp = Math.floor(Date.now() / 1000) + 60 * 60
    const payload = btoa(JSON.stringify({ sub: 'demo@example.com', name: 'Demo User', exp: fakeExp }))
    const fakeToken = `header.${payload}.sig`
    setTokens({ accessToken: fakeToken, refreshToken: 'demo-refresh-token' })
    return { name: 'Demo User', email: 'demo@example.com' }
  }
  const res = await fetch(`${API_BASE}/auth/oauth/${provider}/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, redirectUri }),
  })
  if (!res.ok) throw new Error('OAuth exchange failed')
  const data = (await res.json()) as { accessToken: string; refreshToken?: string; user?: UserProfile }
  setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken ?? null })
  return data.user
}


