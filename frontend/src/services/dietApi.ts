// Diet API Service - Connected to Operational AI Services
import { aiServicesAPI, UserProfile, BMIResponse, TDEEResponse } from './apiService'

export interface UserDietProfile {
  id?: string
  name: string
  email: string
  age: number
  gender: 'male' | 'female' | 'other'
  height_cm: number
  weight_kg: number
  activity_level: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active'
  goal: 'weight_loss' | 'weight_gain' | 'maintain_weight' | 'muscle_gain' | 'general_health'
  dietary_restrictions?: string[]
  allergies?: string[]
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

export interface MealAnalysisRequest {
  meal_description: string
  user_profile: UserDietProfile
  meal_type?: string
}

class DietAgentApiService {
  // Check connection to AI services
  async checkConnection(): Promise<boolean> {
    try {
      const status = await aiServicesAPI.checkServicesStatus()
      return status.backend && status.aiService
    } catch (error) {
      console.error('Connection check failed:', error)
      return false
    }
  }

  // Calculate BMI using AI service
  async calculateBMI(height_cm: number, weight_kg: number): Promise<BMIResponse> {
    return await aiServicesAPI.calculateBMI({ height_cm, weight_kg })
  }

  // Calculate TDEE using AI service
  async calculateTDEE(profile: UserDietProfile): Promise<TDEEResponse> {
    return await aiServicesAPI.calculateTDEE({
      age: profile.age,
      gender: profile.gender,
      height_cm: profile.height_cm,
      weight_kg: profile.weight_kg,
      activity_level: profile.activity_level
    })
  }

  // Analyze meal text using AI service
  async analyzeMealText(request: MealAnalysisRequest): Promise<{ request_id: string; status: string; message: string }> {
    const userProfile: UserProfile = {
      user_id: request.user_profile.id || `user_${Date.now()}`,
      age: request.user_profile.age,
      gender: request.user_profile.gender,
      height_cm: request.user_profile.height_cm,
      weight_kg: request.user_profile.weight_kg,
      activity_level: request.user_profile.activity_level,
      goal: request.user_profile.goal,
      dietary_restrictions: request.user_profile.dietary_restrictions || [],
      allergies: request.user_profile.allergies || []
    }

    const result = await aiServicesAPI.analyzeTextMeal({
      meal_description: request.meal_description,
      user_profile: userProfile
    })

    return {
      request_id: result.request_id!,
      status: result.status!,
      message: result.message!
    }
  }

  // Generate meal plan using AI service
  async generateMealPlan(profile: UserDietProfile, preferences: {
    cuisine_types: string[]
    cooking_time: string
    budget: string
  }): Promise<{ request_id: string; status: string; message: string }> {
    const userProfile: UserProfile = {
      user_id: profile.id || `user_${Date.now()}`,
      age: profile.age,
      gender: profile.gender,
      height_cm: profile.height_cm,
      weight_kg: profile.weight_kg,
      activity_level: profile.activity_level,
      goal: profile.goal,
      dietary_restrictions: profile.dietary_restrictions || [],
      allergies: profile.allergies || []
    }

    const result = await aiServicesAPI.generateMealPlan({
      user_profile: userProfile,
      preferences
    })

    return {
      request_id: result.request_id!,
      status: result.status!,
      message: result.message!
    }
  }

  // Get analysis result by request ID
  async getAnalysisResult(requestId: string): Promise<any> {
    return await aiServicesAPI.getAnalysisResult(requestId)
  }

  // Analyze food image using AI service
  async analyzeImage(imageFile: File, profile: UserDietProfile): Promise<{ request_id: string; status: string; message: string }> {
    const userProfile: UserProfile = {
      user_id: profile.id || `user_${Date.now()}`,
      age: profile.age,
      gender: profile.gender,
      height_cm: profile.height_cm,
      weight_kg: profile.weight_kg,
      activity_level: profile.activity_level,
      goal: profile.goal,
      dietary_restrictions: profile.dietary_restrictions || [],
      allergies: profile.allergies || []
    }

    const result = await aiServicesAPI.analyzeImage(imageFile, userProfile)
    
    return {
      request_id: result.request_id!,
      status: result.status!,
      message: result.message!
    }
  }

  // Enhanced profile creation with AI calculations
  async createEnhancedProfile(profileData: Omit<UserDietProfile, 'id' | 'bmi' | 'bmr' | 'tdee' | 'daily_calorie_goal' | 'bmi_category'>): Promise<UserDietProfile> {
    try {
      // Calculate BMI and TDEE using AI services
      const [bmiResult, tdeeResult] = await Promise.all([
        this.calculateBMI(profileData.height_cm, profileData.weight_kg),
        this.calculateTDEE(profileData as UserDietProfile)
      ])

      const enhancedProfile: UserDietProfile = {
        ...profileData,
        id: `profile_${Date.now()}`,
        bmi: bmiResult.bmi,
        bmi_category: bmiResult.category,
        bmr: tdeeResult.bmr,
        tdee: tdeeResult.tdee,
        daily_calorie_goal: tdeeResult.calorie_goals.maintain
      }

      return enhancedProfile
    } catch (error) {
      console.error('Enhanced profile creation failed:', error)
      // Fallback to basic profile
      return {
        ...profileData,
        id: `profile_${Date.now()}`,
        bmi: 0,
        bmi_category: 'Unknown',
        bmr: 0,
        tdee: 0,
        daily_calorie_goal: 2000
      }
    }
  }

  // Get service health status
  async getServiceHealth(): Promise<{ backend: boolean; aiService: boolean; message: string }> {
    try {
      const status = await aiServicesAPI.checkServicesStatus()
      return {
        ...status,
        message: status.backend && status.aiService 
          ? 'All AI services operational' 
          : 'Some services may be unavailable'
      }
    } catch (error) {
      return {
        backend: false,
        aiService: false,
        message: 'Unable to check service status'
      }
    }
  }
}

export const dietAgentApi = new DietAgentApiService()
