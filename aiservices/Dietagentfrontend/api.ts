// API client for the Diet Agent system
import axios, { type AxiosInstance } from 'axios';

// Environment configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const AI_API_BASE_URL = import.meta.env.VITE_AI_API_URL || 'http://localhost:8001';

// Create axios instances
const backendAPI = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const aiAPI = axios.create({
  baseURL: AI_API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface UserProfile {
  user_id: string;
  name?: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height_cm: number;
  weight_kg: number;
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'lose_weight' | 'gain_weight' | 'maintain';
  dietary_restrictions?: string[];
  allergies?: string[];
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  vitamins?: Record<string, number>;
  minerals?: Record<string, number>;
}

export interface DetectedFood {
  name: string;
  confidence: number;
  estimated_portion: string;
  nutrition?: NutritionInfo;
}

export interface DietAdvice {
  recommendation: string;
  reasoning: string;
  healthier_alternatives: string[];
  warnings: string[];
  macro_suggestions: Record<string, string>;
  hydration_reminder?: string;
}

export interface AnalysisResponse {
  request_id: string;
  status: string;
  message: string;
  estimated_processing_time?: number;
  detected_foods?: DetectedFood[];
  total_nutrition?: NutritionInfo;
  advice?: DietAdvice;
  error?: string;
}

export interface BMIRequest {
  weight_kg: number;
  height_cm: number;
}

export interface BMIResponse {
  bmi: number;
  category: string;
  interpretation: string;
}

export interface TDEERequest {
  weight_kg: number;
  height_cm: number;
  age: number;
  gender: string;
  activity_level: string;
}

export interface TDEEResponse {
  bmr: number;
  tdee: number;
  calorie_goals: {
    maintain: number;
    lose_weight: number;
    gain_weight: number;
  };
  activity_level: string;
}

export interface MealEntry {
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  timestamp: string;
  detected_foods: DetectedFood[];
  total_nutrition?: NutritionInfo;
  meal_description?: string;
  image_url?: string;
}

export interface DailySummary {
  date: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_water_ml: number;
  meal_count: number;
}

export interface DashboardData {
  daily_summary: DailySummary;
  recent_meals: MealEntry[];
  bmi_data: BMIResponse;
  tdee_data: TDEEResponse;
  user_profile: UserProfile;
}

export interface DailyNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water_ml: number;
}

// API Client Class
class APIClient {
  private backendAPI: AxiosInstance;
  private aiAPI: AxiosInstance;

  constructor() {
    this.backendAPI = backendAPI;
    this.aiAPI = aiAPI;
  }

  // Health checks
  async checkBackendHealth(): Promise<any> {
    const response = await this.backendAPI.get('/health');
    return response.data;
  }

  async checkAIHealth(): Promise<any> {
    const response = await this.aiAPI.get('/health');
    return response.data;
  }

  // BMI calculation
  async calculateBMI(data: BMIRequest): Promise<BMIResponse> {
    const response = await this.aiAPI.post('/calculate/bmi', data);
    return response.data;
  }

  // TDEE calculation
  async calculateTDEE(data: TDEERequest): Promise<TDEEResponse> {
    const response = await this.aiAPI.post('/calculate/tdee', data);
    return response.data;
  }

  // Text meal analysis
  async analyzeTextMeal(userProfile: UserProfile, mealDescription: string): Promise<AnalysisResponse> {
    const response = await this.aiAPI.post('/analyze/text-meal', {
      user_profile: userProfile,
      meal_description: mealDescription,
    });
    return response.data;
  }

  // Image meal analysis
  async analyzeImageMeal(userProfile: UserProfile, file: File): Promise<AnalysisResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('request', JSON.stringify({ user_profile: userProfile }));

    const response = await this.aiAPI.post('/analyze/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Get analysis result (for async processing)
  async getAnalysisResult(requestId: string): Promise<AnalysisResponse> {
    const response = await this.aiAPI.get(`/analysis/${requestId}`);
    return response.data;
  }

  // Nutrition entry
  async addNutritionEntry(userId: string, nutritionData: NutritionInfo): Promise<any> {
    const response = await this.aiAPI.post('/nutrition/entry', {
      user_id: userId,
      nutrition_data: nutritionData,
    });
    return response.data;
  }

  // Hydration tracking
  async updateHydration(waterAmountMl: number, userId: string = 'user-001'): Promise<any> {
    const response = await this.aiAPI.post('/hydration', {
      user_id: userId,
      water_amount_ml: waterAmountMl,
    });
    return response.data;
  }

  // Get dashboard data
  async getDashboardData(date?: string, userId: string = 'user-001'): Promise<DashboardData> {
    // Mock dashboard data for now - in real implementation this would aggregate from multiple endpoints
    const [bmiData, tdeeData] = await Promise.all([
      this.calculateBMI({ weight_kg: 70, height_cm: 175 }),
      this.calculateTDEE({ 
        weight_kg: 70, 
        height_cm: 175, 
        age: 30, 
        gender: 'male', 
        activity_level: 'moderate' 
      })
    ]);

    // Mock data for dashboard - in real app this would come from backend
    return {
      daily_summary: {
        date: date || new Date().toISOString().split('T')[0],
        total_calories: 1650,
        total_protein: 85,
        total_carbs: 180,
        total_fat: 65,
        total_water_ml: 1500,
        meal_count: 3,
      },
      recent_meals: [
        {
          meal_type: 'breakfast',
          timestamp: new Date().toISOString(),
          detected_foods: [
            { name: 'Oatmeal', confidence: 0.95, estimated_portion: '1 cup' },
            { name: 'Banana', confidence: 0.98, estimated_portion: '1 medium' }
          ],
          total_nutrition: { calories: 350, protein: 12, carbs: 65, fat: 6 }
        },
        {
          meal_type: 'lunch',
          timestamp: new Date().toISOString(),
          detected_foods: [
            { name: 'Grilled Chicken', confidence: 0.92, estimated_portion: '150g' },
            { name: 'Rice', confidence: 0.88, estimated_portion: '1 cup' }
          ],
          total_nutrition: { calories: 450, protein: 35, carbs: 45, fat: 8 }
        }
      ],
      bmi_data: bmiData,
      tdee_data: tdeeData,
      user_profile: {
        user_id: userId,
        name: 'User',
        age: 30,
        gender: 'male',
        height_cm: 175,
        weight_kg: 70,
        activity_level: 'moderate',
        goal: 'maintain'
      }
    };
  }

  // Meal plan generation
  async getMealPlan(userProfile: UserProfile, currentIntake: any[] = []): Promise<AnalysisResponse> {
    const response = await this.aiAPI.post('/meal-plan', {
      user_profile: userProfile,
      current_intake: currentIntake
    });
    return response.data;
  }

  // Backend database operations
  async testDatabase(): Promise<any> {
    const response = await this.backendAPI.get('/test-db');
    return response.data;
  }

  async testDatabaseWrite(): Promise<any> {
    const response = await this.backendAPI.post('/test-db/write');
    return response.data;
  }

  async getCollections(): Promise<any> {
    const response = await this.backendAPI.get('/collections');
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new APIClient();

// Export default
export default apiClient;