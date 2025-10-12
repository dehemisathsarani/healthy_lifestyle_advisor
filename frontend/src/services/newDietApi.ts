// Temporary stub for Diet Agent API to fix TypeScript compilation issues

// Simple interfaces for basic functionality
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

// Simple stub service with basic methods
class DietAgentApiService {
  async checkConnection(): Promise<boolean> {
    console.log('🔄 Diet Agent API stub - checkConnection')
    return true
  }

  async createProfile(profileData: Omit<UserDietProfile, 'id' | 'bmi' | 'bmr' | 'tdee' | 'daily_calorie_goal' | 'bmi_category'>): Promise<UserDietProfile> {
    console.log('🔄 Diet Agent API stub - createProfile', profileData)
    return {
      ...profileData,
      id: `stub_${Date.now()}`,
      bmi: 22,
      bmr: 1500,
      tdee: 2000,
      daily_calorie_goal: 2000,
      bmi_category: 'Normal'
    }
  }

  async getProfile(email: string): Promise<UserDietProfile | null> {
    console.log('🔄 Diet Agent API stub - getProfile', email)
    return null
  }

  async getProfileByEmail(email: string): Promise<UserDietProfile | null> {
    console.log('🔄 Diet Agent API stub - getProfileByEmail', email)
    return null
  }

  async addNutritionEntry(userId: string, entry: Omit<NutritionEntry, 'id'>): Promise<NutritionEntry> {
    console.log('🔄 Diet Agent API stub - addNutritionEntry', userId, entry)
    return {
      ...entry,
      id: `entry_${Date.now()}`
    }
  }

  async analyzeNutrition(userId: string, description?: string, image?: File): Promise<FoodAnalysisResult> {
    console.log('🔄 Diet Agent API stub - analyzeNutrition', userId, description, image?.name)
    return {
      _id: `analysis_${Date.now()}`,
      user_id: userId,
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
      meal_type: 'lunch',
      created_at: new Date().toISOString(),
      confidence_score: 0.8,
      image_url: null,
      text_description: description || 'Sample analysis'
    }
  }
}

export const dietAgentApi = new DietAgentApiService()
