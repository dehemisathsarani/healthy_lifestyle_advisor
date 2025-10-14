// AI Services API - Connected to Operational Backend
// Backend: http://localhost:8000 | AI Service: http://localhost:8001

export interface UserProfile {
  user_id: string
  age: number
  gender: string
  height_cm: number
  weight_kg: number
  activity_level: string
  goal: string
  dietary_restrictions?: string[]
  allergies?: string[]
}

export interface BMIRequest {
  height_cm: number
  weight_kg: number
}

export interface BMIResponse {
  bmi: number
  category: string
  interpretation: string
}

export interface TDEERequest {
  age: number
  gender: string
  height_cm: number
  weight_kg: number
  activity_level: string
}

export interface TDEEResponse {
  bmr: number
  tdee: number
  calorie_goals: {
    maintain: number
    lose_weight: number
    gain_weight: number
  }
  activity_level: string
}

export interface TextMealRequest {
  meal_description: string
  user_profile: UserProfile
  response_queue?: string
}

export interface MealPlanRequest {
  user_profile: UserProfile
  preferences: {
    cuisine_types: string[]
    cooking_time: string
    budget: string
  }
}

export interface ApiResponse<T> {
  request_id?: string
  status?: string
  message?: string
  estimated_processing_time?: number
  data?: T
}

export interface HealthStatus {
  api_status: string
  timestamp: string
  uptime: string
  response_time_ms: number
  database: {
    status: string
    database: string
    collections_count: number
    collections: string[]
  }
  services: {
    api: string
    database: string
    auth: string
    ai_agents: string
  }
}

class AIServicesAPI {
  private readonly BACKEND_URL = 'http://localhost:8000'
  private readonly AI_SERVICE_URL = 'http://localhost:8001'

  // Health check endpoints
  async checkBackendHealth(): Promise<HealthStatus> {
    try {
      const response = await fetch(`${this.BACKEND_URL}/health`)
      if (!response.ok) {
        throw new Error(`Backend health check failed: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Backend health check failed:', error)
      throw error
    }
  }

  async checkAIServiceHealth(): Promise<any> {
    try {
      const response = await fetch(`${this.AI_SERVICE_URL}/health`)
      if (!response.ok) {
        throw new Error(`AI service health check failed: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('AI service health check failed:', error)
      throw error
    }
  }

  // BMI calculation
  async calculateBMI(request: BMIRequest): Promise<BMIResponse> {
    try {
      const response = await fetch(`${this.AI_SERVICE_URL}/calculate/bmi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error(`BMI calculation failed: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('BMI calculation failed:', error)
      throw error
    }
  }

  // TDEE calculation
  async calculateTDEE(request: TDEERequest): Promise<TDEEResponse> {
    try {
      const response = await fetch(`${this.AI_SERVICE_URL}/calculate/tdee`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error(`TDEE calculation failed: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('TDEE calculation failed:', error)
      throw error
    }
  }

  // Text meal analysis
  async analyzeTextMeal(request: TextMealRequest): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${this.AI_SERVICE_URL}/analyze/text-meal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error(`Meal analysis failed: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Meal analysis failed:', error)
      throw error
    }
  }

  // Meal plan generation
  async generateMealPlan(request: MealPlanRequest): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${this.AI_SERVICE_URL}/meal-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error(`Meal plan generation failed: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Meal plan generation failed:', error)
      throw error
    }
  }

  // Get analysis result by request ID
  async getAnalysisResult(requestId: string): Promise<any> {
    try {
      const response = await fetch(`${this.AI_SERVICE_URL}/analysis/${requestId}`)
      
      if (response.status === 404) {
        return { status: 'not_found', message: 'Analysis result not found or still processing' }
      }

      if (!response.ok) {
        throw new Error(`Failed to get analysis result: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to get analysis result:', error)
      throw error
    }
  }

  // Image analysis (for future implementation)
  async analyzeImage(imageFile: File, userProfile: UserProfile): Promise<ApiResponse<any>> {
    try {
      const formData = new FormData()
      formData.append('image', imageFile)
      formData.append('user_profile', JSON.stringify(userProfile))

      const response = await fetch(`${this.AI_SERVICE_URL}/analyze/image`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Image analysis failed: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Image analysis failed:', error)
      throw error
    }
  }

  // Utility method to check if services are operational
  async checkServicesStatus(): Promise<{ backend: boolean; aiService: boolean }> {
    try {
      const [backendHealth, aiHealth] = await Promise.allSettled([
        this.checkBackendHealth(),
        this.checkAIServiceHealth()
      ])

      return {
        backend: backendHealth.status === 'fulfilled',
        aiService: aiHealth.status === 'fulfilled'
      }
    } catch (error) {
      console.error('Services status check failed:', error)
      return { backend: false, aiService: false }
    }
  }
}

// Export singleton instance
export const aiServicesAPI = new AIServicesAPI()
export default aiServicesAPI