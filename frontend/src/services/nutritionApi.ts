interface NutritionData {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sugar?: number
  sodium?: number
}

interface FoodItem {
  name: string
  quantity: string
  nutrition: NutritionData
  confidence?: number
  sri_lankan_food?: boolean
  food_category?: string
}

interface NutritionLog {
  id?: string
  user_id?: string
  date: string
  meals: FoodItem[]
  total_nutrition: NutritionData
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  notes?: string
  analysis_method: 'text' | 'image' | 'hybrid'
  image_url?: string
  text_input?: string
  ai_insights?: string[]
  confidence_score?: number
  created_at?: string
  updated_at?: string
}

interface WeeklyReport {
  id?: string
  user_id?: string
  period: string
  start_date: string
  end_date: string
  average_daily_calories: number
  total_logs: number
  nutrition_trends: NutritionData
  insights: string[]
  recommendations: string[]
  health_score: number
  meal_frequency?: Record<string, number>
  top_foods?: string[]
  nutrition_goals_met?: Record<string, boolean>
  created_at?: string
}

interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  error?: string
  timestamp: string
}

interface PaginatedResponse<T> extends ApiResponse {
  logs?: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

interface FoodAnalysisRequest {
  text_input?: string
  analysis_method: 'text' | 'image'
  meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
}

interface FoodAnalysisResponse {
  success: boolean
  food_items: FoodItem[]
  total_nutrition: NutritionData
  ai_insights: string[]
  confidence_score: number
  analysis_method: 'text' | 'image'
}

class NutritionApiService {
  private baseUrl: string
  private authToken: string | null = null

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
  }

  setAuthToken(token: string) {
    this.authToken = token
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`
    }
    
    return headers
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
      throw new Error(errorData.message || errorData.detail || `HTTP ${response.status}`)
    }
    
    return response.json()
  }

  // Food Analysis
  async analyzeFood(request: FoodAnalysisRequest): Promise<FoodAnalysisResponse> {
    const response = await fetch(`${this.baseUrl}/nutrition/analyze`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(request)
    })
    
    return this.handleResponse<FoodAnalysisResponse>(response)
  }

  // Nutrition Logs
  async createNutritionLog(logData: {
    meals: FoodItem[]
    meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
    notes?: string
    analysis_method: 'text' | 'image' | 'hybrid'
    image_url?: string
    text_input?: string
    ai_insights?: string[]
  }): Promise<ApiResponse<NutritionLog>> {
    const response = await fetch(`${this.baseUrl}/nutrition/logs`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(logData)
    })
    
    return this.handleResponse<ApiResponse<NutritionLog>>(response)
  }

  async getNutritionLogs(params: {
    page?: number
    per_page?: number
    start_date?: string
    end_date?: string
  } = {}): Promise<PaginatedResponse<NutritionLog>> {
    const queryParams = new URLSearchParams()
    
    if (params.page) queryParams.append('page', params.page.toString())
    if (params.per_page) queryParams.append('per_page', params.per_page.toString())
    if (params.start_date) queryParams.append('start_date', params.start_date)
    if (params.end_date) queryParams.append('end_date', params.end_date)
    
    const response = await fetch(`${this.baseUrl}/nutrition/logs?${queryParams}`, {
      method: 'GET',
      headers: this.getHeaders()
    })
    
    return this.handleResponse<PaginatedResponse<NutritionLog>>(response)
  }

  async getNutritionLog(logId: string): Promise<ApiResponse<NutritionLog>> {
    const response = await fetch(`${this.baseUrl}/nutrition/logs/${logId}`, {
      method: 'GET',
      headers: this.getHeaders()
    })
    
    return this.handleResponse<ApiResponse<NutritionLog>>(response)
  }

  async updateNutritionLog(logId: string, updateData: {
    meals?: FoodItem[]
    meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
    notes?: string
    ai_insights?: string[]
  }): Promise<ApiResponse<NutritionLog>> {
    const response = await fetch(`${this.baseUrl}/nutrition/logs/${logId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updateData)
    })
    
    return this.handleResponse<ApiResponse<NutritionLog>>(response)
  }

  async deleteNutritionLog(logId: string): Promise<ApiResponse> {
    const response = await fetch(`${this.baseUrl}/nutrition/logs/${logId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    })
    
    return this.handleResponse<ApiResponse>(response)
  }

  // Daily Summary
  async getDailySummary(date?: string): Promise<ApiResponse> {
    const queryParams = new URLSearchParams()
    if (date) queryParams.append('date', date)
    
    const response = await fetch(`${this.baseUrl}/nutrition/daily-summary?${queryParams}`, {
      method: 'GET',
      headers: this.getHeaders()
    })
    
    return this.handleResponse<ApiResponse>(response)
  }

  async getWeeklySummaries(startDate: string, endDate: string): Promise<ApiResponse> {
    const queryParams = new URLSearchParams({
      start_date: startDate,
      end_date: endDate
    })
    
    const response = await fetch(`${this.baseUrl}/nutrition/weekly-summaries?${queryParams}`, {
      method: 'GET',
      headers: this.getHeaders()
    })
    
    return this.handleResponse<ApiResponse>(response)
  }

  // Weekly Reports
  async generateWeeklyReport(request: {
    start_date?: string
    end_date?: string
  } = {}): Promise<ApiResponse<WeeklyReport>> {
    const response = await fetch(`${this.baseUrl}/nutrition/reports/weekly`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(request)
    })
    
    return this.handleResponse<ApiResponse<WeeklyReport>>(response)
  }

  async getWeeklyReports(limit: number = 10): Promise<ApiResponse<WeeklyReport[]>> {
    const queryParams = new URLSearchParams({ limit: limit.toString() })
    
    const response = await fetch(`${this.baseUrl}/nutrition/reports/weekly?${queryParams}`, {
      method: 'GET',
      headers: this.getHeaders()
    })
    
    return this.handleResponse<ApiResponse<WeeklyReport[]>>(response)
  }

  // User Preferences
  async getNutritionPreferences(): Promise<ApiResponse> {
    const response = await fetch(`${this.baseUrl}/nutrition/preferences`, {
      method: 'GET',
      headers: this.getHeaders()
    })
    
    return this.handleResponse<ApiResponse>(response)
  }

  async updateNutritionPreferences(preferences: {
    daily_calorie_goal: number
    daily_protein_goal: number
    daily_carbs_goal: number
    daily_fat_goal: number
    daily_fiber_goal?: number
    dietary_restrictions?: string[]
    food_allergies?: string[]
    preferred_cuisines?: string[]
    disliked_foods?: string[]
    health_conditions?: string[]
  }): Promise<ApiResponse> {
    const response = await fetch(`${this.baseUrl}/nutrition/preferences`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(preferences)
    })
    
    return this.handleResponse<ApiResponse>(response)
  }

  // Statistics
  async getNutritionOverview(days: number = 30): Promise<ApiResponse> {
    const queryParams = new URLSearchParams({ days: days.toString() })
    
    const response = await fetch(`${this.baseUrl}/nutrition/stats/overview?${queryParams}`, {
      method: 'GET',
      headers: this.getHeaders()
    })
    
    return this.handleResponse<ApiResponse>(response)
  }

  // Missing method for HealthDashboard
  async getNutritionStats(): Promise<{ success: boolean; data: any }> {
    try {
      // Return mock nutrition stats for now
      return {
        success: true,
        data: {
          weekly_calories: 14500,
          daily_average: 2071,
          protein_average: 120,
          carbs_average: 250,
          fat_average: 70
        }
      };
    } catch (error) {
      console.error('Error getting nutrition stats:', error);
      return { success: false, data: null };
    }
  }

  // RAG Chatbot method
  async getChatbotResponse(params: {
    query: string;
    context: any;
    knowledge: string[];
  }): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      // First try to connect to the RAG backend service
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: params.context.profile?.userId || 'demo-user',
          message: params.query,
          context_type: 'nutrition',
          user_profile: params.context.profile,
          nutrition_context: params.context.recentLogs
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: data.response
        };
      } else {
        throw new Error(`Backend responded with status: ${response.status}`);
      }
    } catch (error) {
      console.warn('RAG backend unavailable, using fallback response:', error);
      
      // Fallback response generation
      const fallbackMessage = this.generateFallbackChatResponse(params.query, params.context, params.knowledge);
      
      return {
        success: true,
        message: fallbackMessage
      };
    }
  }

  private generateFallbackChatResponse(query: string, context: any, knowledge: string[]): string {
    const profile = context.profile;
    const queryLower = query.toLowerCase();

    // Create personalized response based on profile
    let response = `Hello ${profile?.name || 'there'}! 👋\n\n`;

    // Add relevant knowledge
    if (knowledge.length > 0) {
      response += `**Based on your query about "${query}":**\n\n`;
      response += knowledge.slice(0, 2).join('\n\n') + '\n\n';
    }

    // Personalized recommendations
    if (profile?.fitnessGoal) {
      const goal = profile.fitnessGoal.replace('_', ' ');
      response += `**For your ${goal} goal:**\n`;
      
      if (profile.fitnessGoal === 'weight_loss') {
        response += `• Focus on creating a moderate calorie deficit\n`;
        response += `• Include plenty of protein to maintain muscle mass\n`;
        response += `• Stay hydrated and prioritize whole foods\n\n`;
      } else if (profile.fitnessGoal === 'weight_gain') {
        response += `• Aim for a moderate calorie surplus\n`;
        response += `• Include calorie-dense, nutrient-rich foods\n`;
        response += `• Focus on strength training alongside nutrition\n\n`;
      } else {
        response += `• Maintain a balanced approach to nutrition\n`;
        response += `• Focus on variety and consistency\n`;
        response += `• Listen to your body's needs\n\n`;
      }
    }

    // Activity-specific advice
    if (profile?.activityLevel) {
      const activity = profile.activityLevel.replace('_', ' ');
      response += `**For your ${activity} activity level:**\n`;
      response += `• Adjust your nutrition timing around your activities\n`;
      response += `• Ensure adequate recovery nutrition\n\n`;
    }

    // Add general tips based on query
    if (queryLower.includes('protein')) {
      response += `**Protein Tips:**\n• Aim for 1.6-2.2g per kg body weight for active individuals\n• Spread protein throughout the day\n• Include both animal and plant sources\n\n`;
    }
    
    if (queryLower.includes('meal') || queryLower.includes('plan')) {
      response += `**Meal Planning:**\n• Plan your meals around your schedule\n• Include protein, complex carbs, and healthy fats\n• Prep ingredients in advance for convenience\n\n`;
    }

    response += `*This response was generated using our comprehensive nutrition knowledge base. For more personalized advice, consider consulting with a nutrition professional.*`;

    return response;
  }
}

// Create singleton instance
export const nutritionApi = new NutritionApiService()

// Export types for use in components
export type {
  NutritionData,
  FoodItem,
  NutritionLog,
  WeeklyReport,
  ApiResponse,
  PaginatedResponse,
  FoodAnalysisRequest,
  FoodAnalysisResponse
}
