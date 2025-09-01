// New Diet API Service - Complete Clean Version
export interface UserDietProfile {
  id?: string
  name: string
  email: string
}

export interface NutritionEntry {
  id: string
  date: string
  meal_type: string
  food_description: string
  calories: number
}

export interface FoodAnalysisResult {
  _id?: string
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
}

class DietAgentApiService {
  async checkConnection(): Promise<boolean> {
    return true
  }
}

export const dietAgentApi = new DietAgentApiService()
