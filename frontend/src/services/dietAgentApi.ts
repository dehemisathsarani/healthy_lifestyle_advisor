// Diet Agent API Service for MongoDB integration

// Comprehensive interfaces for the Diet Agent
export interface UserDietProfile {
  id?: string
  name: string
  email: string
  age: number
  weight: number
  height: number
  gender: 'male' | 'female' | 'other'
  activity_level: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active'
  goal: 'weight_loss' | 'weight_gain' | 'maintain_weight' | 'muscle_gain' | 'general_health'
  dietary_restrictions?: string[]
  allergies?: string[]
  created_at?: string
  updated_at?: string
  bmi?: number
  bmr?: number
  tdee?: number
  daily_calorie_goal?: number
  bmi_category?: string
}

export interface NutritionEntry {
  id: string
  date: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  food_description: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sugar?: number
}

export interface FoodAnalysisResult {
  _id?: string
  user_id?: string
  food_items: Array<{
    name: string
    quantity: string
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber?: number
  }>
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
  analysis_method: 'image' | 'manual' | 'text' | 'hybrid' | 'enhanced_fallback' | 'fallback'
  meal_type: string
  created_at: string
  confidence_score: number
  image_url: string | null
  text_description: string
}

// Full-featured service with all methods needed by the component
class DietAgentApiService {
  private baseUrl = 'http://localhost:8000/api/diet'

  async checkConnection(): Promise<boolean> {
    try {
      console.log('🔄 Checking Diet Agent API connection...')
      const response = await fetch(`${this.baseUrl}/health`)
      const isConnected = response.ok
      console.log(`📡 Diet Agent API connection: ${isConnected ? '✅ Connected' : '❌ Failed'}`)
      return isConnected
    } catch (error) {
      console.error('❌ Backend connection failed:', error)
      return false
    }
  }

  async createProfile(profileData: Omit<UserDietProfile, 'id' | 'bmi' | 'bmr' | 'tdee' | 'daily_calorie_goal' | 'bmi_category'>): Promise<UserDietProfile> {
    try {
      console.log('🔄 Creating Diet Agent profile...', profileData)
      const response = await fetch(`${this.baseUrl}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const result = await response.json()
      if (result.success && result.data) {
        return result.data
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error('❌ Profile creation error:', error)
      // Fallback for offline mode
      return {
        ...profileData,
        id: `offline_${Date.now()}`,
        bmi: 22,
        bmr: 1500,
        tdee: 2000,
        daily_calorie_goal: 2000,
        bmi_category: 'Normal'
      }
    }
  }

  async getProfile(email: string): Promise<UserDietProfile | null> {
    try {
      console.log('🔄 Getting Diet Agent profile for:', email)
      const response = await fetch(`${this.baseUrl}/profile/${encodeURIComponent(email)}`)
      
      if (response.status === 404) {
        return null
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const result = await response.json()
      if (result.success && result.data) {
        return result.data
      } else {
        return null
      }
    } catch (error) {
      console.error('❌ Profile fetch error:', error)
      return null
    }
  }

  async getProfileByEmail(email: string): Promise<UserDietProfile | null> {
    return this.getProfile(email)
  }

  async updateProfile(email: string, updates: Partial<UserDietProfile>): Promise<UserDietProfile> {
    try {
      console.log('🔄 Updating Diet Agent profile for:', email, updates)
      const response = await fetch(`${this.baseUrl}/profile/${encodeURIComponent(email)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const result = await response.json()
      if (result.success && result.data) {
        return result.data
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error('❌ Profile update error:', error)
      throw error
    }
  }

  async addNutritionEntry(userId: string, entry: Omit<NutritionEntry, 'id'>): Promise<NutritionEntry> {
    try {
      console.log('🔄 Adding nutrition entry...', entry)
      const response = await fetch(`${this.baseUrl}/nutrition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...entry, user_id: userId })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const result = await response.json()
      if (result.success && result.data) {
        return result.data
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error('❌ Nutrition entry error:', error)
      // Fallback for offline mode
      return {
        ...entry,
        id: `entry_${Date.now()}`
      }
    }
  }

  async getNutritionEntries(userId: string, date?: string): Promise<NutritionEntry[]> {
    try {
      let url = `${this.baseUrl}/nutrition?user_id=${userId}`
      if (date) {
        url += `&date=${encodeURIComponent(date)}`
      }
      
      console.log('🔄 Getting nutrition entries from:', url)
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const result = await response.json()
      if (result.success && Array.isArray(result.data)) {
        return result.data
      } else {
        return []
      }
    } catch (error) {
      console.error('❌ Nutrition entries fetch error:', error)
      return []
    }
  }

  async analyzeFoodImage(imageFile: File, mealType: string): Promise<FoodAnalysisResult> {
    try {
      console.log('🔄 Analyzing food image...', { fileName: imageFile.name, mealType })
      
      const formData = new FormData()
      formData.append('image', imageFile)
      formData.append('meal_type', mealType)
      
      const response = await fetch(`${this.baseUrl}/analyze/image`, {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const result = await response.json()
      if (result.success && result.data) {
        return result.data
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error('❌ Food analysis error:', error)
      // Fallback analysis
      return this.createFallbackAnalysis(imageFile.name, mealType)
    }
  }

  async analyzeFoodText(description: string, mealType: string): Promise<FoodAnalysisResult> {
    try {
      console.log('🔄 Analyzing food text...', { description, mealType })
      
      const response = await fetch(`${this.baseUrl}/analyze/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text_description: description,
          meal_type: mealType
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const result = await response.json()
      if (result.success && result.data) {
        return result.data
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error('❌ Food text analysis error:', error)
      // Fallback analysis
      return this.createFallbackAnalysis(description, mealType)
    }
  }

  async analyzeNutrition(_userId: string, description?: string, image?: File): Promise<FoodAnalysisResult> {
    if (image) {
      return this.analyzeFoodImage(image, 'lunch')
    } else if (description) {
      return this.analyzeFoodText(description, 'lunch')
    } else {
      throw new Error('Either description or image must be provided')
    }
  }

  async getDailyNutritionSummary(date: string): Promise<{
    total_calories: number
    total_protein: number
    total_carbs: number
    total_fat: number
    meal_breakdown: Record<string, any>
  }> {
    try {
      console.log('🔄 Getting daily nutrition summary for:', date)
      const response = await fetch(`${this.baseUrl}/nutrition/daily-summary?date=${encodeURIComponent(date)}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const result = await response.json()
      if (result.success && result.data) {
        return result.data
      } else {
        return {
          total_calories: 0,
          total_protein: 0,
          total_carbs: 0,
          total_fat: 0,
          meal_breakdown: {}
        }
      }
    } catch (error) {
      console.error('❌ Daily summary fetch error:', error)
      return {
        total_calories: 0,
        total_protein: 0,
        total_carbs: 0,
        total_fat: 0,
        meal_breakdown: {}
      }
    }
  }

  async searchFoods(query: string): Promise<Array<{
    name: string
    calories_per_100g: number
    protein_per_100g: number
    carbs_per_100g: number
    fat_per_100g: number
  }>> {
    try {
      console.log('🔄 Searching foods for:', query)
      const response = await fetch(`${this.baseUrl}/foods/search?q=${encodeURIComponent(query)}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const result = await response.json()
      if (result.success && Array.isArray(result.data)) {
        return result.data
      }
      
      return []
    } catch (error) {
      console.error('❌ Food search error:', error)
      return []
    }
  }

  private createFallbackAnalysis(description: string, mealType: string): FoodAnalysisResult {
    return {
      _id: `fallback_${Date.now()}`,
      user_id: 'offline_user',
      food_items: [
        {
          name: 'Sample Food',
          quantity: '1 serving',
          calories: 200,
          protein: 10,
          carbs: 30,
          fat: 5,
          fiber: 3
        }
      ],
      total_calories: 200,
      total_protein: 10,
      total_carbs: 30,
      total_fat: 5,
      analysis_method: 'fallback',
      meal_type: mealType,
      created_at: new Date().toISOString(),
      confidence_score: 0.6,
      image_url: null,
      text_description: description
    }
  }
}

export const dietAgentApi = new DietAgentApiService()
