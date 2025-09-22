// Security API service for the SecurityAgent component
// This file provides types and API functions for security and privacy management

// Type definitions
export interface UserSecurityProfile {
  id: string
  user_id: string
  privacy_level: 'basic' | 'standard' | 'strict'
  data_sharing: {
    analytics: boolean
    marketing: boolean
    research: boolean
    third_party: boolean
  }
  backup_preferences: {
    frequency: 'daily' | 'weekly' | 'monthly'
    location: 'cloud' | 'local' | 'both'
    encryption: boolean
  }
  notification_preferences: {
    security_alerts: boolean
    privacy_updates: boolean
    data_reports: boolean
  }
  created_at: string
  updated_at: string
}

export interface DataEntry {
  id: string
  user_id: string
  data_type: 'profile' | 'meal' | 'workout' | 'mood' | 'health'
  size: string
  encrypted: boolean
  created_at: string
  updated_at: string
}

export interface ApiError {
  message: string
  status?: number
  details?: any
}

// API Base URL - adjust as needed
const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8000/api'

// Helper function to handle API errors
export const handleApiError = (error: any): ApiError => {
  if (error.response) {
    return {
      message: error.response.data?.message || 'An error occurred',
      status: error.response.status,
      details: error.response.data
    }
  } else if (error.request) {
    return {
      message: 'Network error - please check your connection',
      details: error.request
    }
  } else {
    return {
      message: error.message || 'An unexpected error occurred',
      details: error
    }
  }
}

// Security API class
class SecurityApi {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  // Get user security profile
  async getProfile(): Promise<UserSecurityProfile> {
    try {
      const response = await fetch(`${this.baseUrl}/security/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      throw handleApiError(error)
    }
  }

  // Create user security profile
  async createProfile(profileData: Omit<UserSecurityProfile, 'id' | 'created_at' | 'updated_at'>): Promise<UserSecurityProfile> {
    try {
      const response = await fetch(`${this.baseUrl}/security/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(profileData)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      throw handleApiError(error)
    }
  }

  // Update user security profile
  async updateProfile(profileData: Partial<UserSecurityProfile>): Promise<UserSecurityProfile> {
    try {
      const response = await fetch(`${this.baseUrl}/security/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(profileData)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      throw handleApiError(error)
    }
  }

  // Get user data entries
  async getDataEntries(): Promise<DataEntry[]> {
    try {
      const response = await fetch(`${this.baseUrl}/security/data-entries`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      throw handleApiError(error)
    }
  }

  // Export all user data
  async exportAllData(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/security/export`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `security-data-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      throw handleApiError(error)
    }
  }

  // Delete all user data
  async deleteAllData(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/security/data`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      throw handleApiError(error)
    }
  }
}

// Create and export singleton instance
export const securityApi = new SecurityApi()
