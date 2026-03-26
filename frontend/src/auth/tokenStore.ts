const ACCESS_KEY = 'access_token'
const REFRESH_KEY = 'refresh_token'

let inMemoryAccessToken: string | null = null
let inMemoryRefreshToken: string | null = null

export function getAccessToken(): string | null {
  if (inMemoryAccessToken) return inMemoryAccessToken
  const stored = sessionStorage.getItem(ACCESS_KEY)
  if (stored) inMemoryAccessToken = stored
  return inMemoryAccessToken
}

export function getRefreshToken(): string | null {
  if (inMemoryRefreshToken) return inMemoryRefreshToken
  const stored = sessionStorage.getItem(REFRESH_KEY)
  if (stored) inMemoryRefreshToken = stored
  return inMemoryRefreshToken
}

export function setTokens(tokens: { accessToken: string; refreshToken?: string | null }) {
  inMemoryAccessToken = tokens.accessToken
  sessionStorage.setItem(ACCESS_KEY, tokens.accessToken)
  if (tokens.refreshToken !== undefined) {
    inMemoryRefreshToken = tokens.refreshToken ?? null
    if (tokens.refreshToken) sessionStorage.setItem(REFRESH_KEY, tokens.refreshToken)
    else sessionStorage.removeItem(REFRESH_KEY)
  }
}

export function clearTokens() {
  inMemoryAccessToken = null
  inMemoryRefreshToken = null
  sessionStorage.removeItem(ACCESS_KEY)
  sessionStorage.removeItem(REFRESH_KEY)
}


