// API utilities for OAuth and authentication

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export interface OAuthUrlResponse {
  url: string
}

export interface OAuthTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
}

/**
 * Get OAuth authorization URL
 */
export async function getOAuthUrl(provider: string = 'google', redirectUri?: string): Promise<string> {
  try {
    const url = new URL(`${API_BASE_URL}/auth/oauth/${provider}/login`)
    if (redirectUri) {
      url.searchParams.set('redirect_uri', redirectUri)
    }
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Failed to get OAuth URL: ${response.statusText}`)
    }
    
    const data: OAuthUrlResponse = await response.json()
    return data.url
  } catch (error) {
    console.error('Error getting OAuth URL:', error)
    throw error
  }
}

/**
 * Exchange OAuth authorization code for access token
 */
export async function exchangeOAuthCode(
  code: string, 
  provider: string = 'google'
): Promise<OAuthTokenResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/oauth/${provider}/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    })
    
    if (!response.ok) {
      throw new Error(`Failed to exchange OAuth code: ${response.statusText}`)
    }
    
    const data: OAuthTokenResponse = await response.json()
    return data
  } catch (error) {
    console.error('Error exchanging OAuth code:', error)
    throw error
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<OAuthTokenResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    
    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.statusText}`)
    }
    
    const data: OAuthTokenResponse = await response.json()
    return data
  } catch (error) {
    console.error('Error refreshing token:', error)
    throw error
  }
}
