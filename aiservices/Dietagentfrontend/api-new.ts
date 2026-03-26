// API client for the Diet Agent system
import axios, { AxiosInstance, AxiosResponse } from 'axios';

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

export interface TextMealRequest {
  user_profile: UserProfile;
  meal_description: string;
  response_queue?: string;
}

export interface NutritionEntryRequest {
  user_id: string;
  nutrition_data: Record<string, number>;
}

export interface HydrationRequest {
  user_id: string;
  water_amount_ml: number;
}

export interface DailySummary {
  date: string;
  user_id: string;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  hydration: {
    total_intake_ml: number;
    goal_ml: number;
  };
  meal_count: number;
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
  async checkBackendHealth(): Promise<AxiosResponse<any>> {
    return this.backendAPI.get('/health');
  }

  async checkAIHealth(): Promise<AxiosResponse<any>> {
    return this.aiAPI.get('/health');
  }

  // BMI calculation
  async calculateBMI(data: BMIRequest): Promise<AxiosResponse<BMIResponse>> {
    return this.aiAPI.post('/calculate/bmi', data);
  }

  // TDEE calculation
  async calculateTDEE(data: TDEERequest): Promise<AxiosResponse<TDEEResponse>> {
    return this.aiAPI.post('/calculate/tdee', data);
  }

  // Text meal analysis
  async analyzeTextMeal(data: TextMealRequest): Promise<AxiosResponse<AnalysisResponse>> {
    return this.aiAPI.post('/analyze/text-meal', data);
  }

  // Image meal analysis
  async analyzeImageMeal(userProfile: UserProfile, file: File): Promise<AxiosResponse<AnalysisResponse>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('request', JSON.stringify({ user_profile: userProfile }));

    return this.aiAPI.post('/analyze/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Get analysis result
  async getAnalysisResult(requestId: string): Promise<AxiosResponse<any>> {
    return this.aiAPI.get(`/analysis/${requestId}`);
  }

  // Nutrition entry
  async addNutritionEntry(data: NutritionEntryRequest): Promise<AxiosResponse<any>> {
    return this.aiAPI.post('/nutrition/entry', data);
  }

  // Hydration tracking
  async updateHydration(data: HydrationRequest): Promise<AxiosResponse<any>> {
    return this.aiAPI.post('/hydration', data);
  }

  // Daily summary
  async getDailySummary(userId: string, date?: string): Promise<AxiosResponse<DailySummary>> {
    const params = date ? { date } : {};
    return this.aiAPI.get(`/user/${userId}/daily-summary`, { params });
  }

  // Meal plan generation
  async getMealPlan(userProfile: UserProfile, currentIntake: any[] = []): Promise<AxiosResponse<AnalysisResponse>> {
    return this.aiAPI.post('/meal-plan', {
      user_profile: userProfile,
      current_intake: currentIntake
    });
  }

  // Backend database operations
  async testDatabase(): Promise<AxiosResponse<any>> {
    return this.backendAPI.get('/test-db');
  }

  async testDatabaseWrite(): Promise<AxiosResponse<any>> {
    return this.backendAPI.post('/test-db/write');
  }

  async getCollections(): Promise<AxiosResponse<any>> {
    return this.backendAPI.get('/collections');
  }
}

// Export singleton instance
export const apiClient = new APIClient();

// Export default
export default apiClient;
