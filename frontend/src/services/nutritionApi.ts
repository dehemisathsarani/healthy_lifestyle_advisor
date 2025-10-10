/// <reference types="vite/client" />

// Types
export interface NutritionData {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sugar?: number
  sodium?: number
}

export interface FoodItem {
  id: string
  name: string
  quantity: string
  nutrition: NutritionData
  confidence: number
}

export interface NutritionLog {
  id: string
  user_id: string
  date: string
  meal_type: string
  meals: FoodItem[]
  total_nutrition: NutritionData
  notes?: string
  created_at: string
}

export interface WeeklyReport {
  period: string
  average_daily_calories: number
  total_logs: number
  health_score: number
  insights: string[]
  recommendations: string[]
  nutrition_trends: {
    calories: number[]
    protein: number[]
    carbs: number[]
    fat: number[]
  }
}

export interface ChatbotMessage {
  message: string
  mode: string
  conversation_history: any[]
  relevant_knowledge: string[]
}

export interface ChatbotResponse {
  response: string
  confidence: number
  sources: string[]
}

// Enhanced Nutrition API Service
export class NutritionApiService {
  private baseUrl: string

  constructor() {
    this.baseUrl = import.meta.env?.VITE_API_URL || 'http://localhost:8000'
  }

  // Text-based food analysis
  async analyzeFood(input: string | { text_input?: string; analysis_method: string }): Promise<FoodItem[]> {
    try {
      if (typeof input === 'string') {
        return this.mockAnalyzeText(input)
      } else {
        if (input.analysis_method === 'text' && input.text_input) {
          return this.mockAnalyzeText(input.text_input)
        } else if (input.analysis_method === 'image') {
          return this.mockAnalyzeImage()
        }
      }
      return []
    } catch (error) {
      console.error('Food analysis failed:', error)
      return []
    }
  }

  // Save nutrition log
  async saveNutritionLog(log: Omit<NutritionLog, 'id' | 'created_at'>): Promise<NutritionLog> {
    try {
      const savedLog: NutritionLog = {
        ...log,
        id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString()
      }
      return savedLog
    } catch (error) {
      console.error('Failed to save nutrition log:', error)
      throw error
    }
  }

  async createNutritionLog(log: Omit<NutritionLog, 'id' | 'created_at'>): Promise<NutritionLog> {
    return this.saveNutritionLog(log)
  }

  // Get nutrition logs
  async getNutritionLogs(): Promise<NutritionLog[]> {
    try {
      return [
        {
          id: '1',
          user_id: '1',
          date: new Date().toISOString().split('T')[0],
          meal_type: 'breakfast',
          meals: [
            {
              id: '1',
              name: 'Oatmeal',
              quantity: '1 cup',
              nutrition: { calories: 150, protein: 5, carbs: 27, fat: 3 },
              confidence: 0.9
            }
          ],
          total_nutrition: { calories: 150, protein: 5, carbs: 27, fat: 3 },
          created_at: new Date().toISOString()
        }
      ]
    } catch (error) {
      console.error('Failed to get nutrition logs:', error)
      return []
    }
  }

  // Get nutrition statistics
  async getNutritionStats(): Promise<any> {
    try {
      return {
        total_entries: 42,
        average_calories: 2150,
        average_protein: 85,
        average_carbs: 250,
        average_fat: 75,
        health_score: 85
      }
    } catch (error) {
      console.error('Failed to get nutrition stats:', error)
      return {
        total_entries: 0,
        average_calories: 0,
        average_protein: 0,
        average_carbs: 0,
        average_fat: 0,
        health_score: 0
      }
    }
  }

  // Generate weekly report
  async generateWeeklyReport(): Promise<WeeklyReport> {
    try {
      return {
        period: 'Last 7 days',
        average_daily_calories: 2150,
        total_logs: 21,
        health_score: 85,
        insights: [
          'Great protein intake this week!',
          'Consider adding more vegetables',
          'Hydration levels look good'
        ],
        recommendations: [
          'Try to include more fiber-rich foods',
          'Consider reducing processed foods',
          'Maintain your current exercise routine'
        ],
        nutrition_trends: {
          calories: [2100, 2200, 2050, 2300, 2150, 2000, 2200],
          protein: [120, 130, 115, 140, 125, 110, 135],
          carbs: [250, 270, 240, 280, 260, 230, 275],
          fat: [80, 85, 75, 90, 82, 70, 88]
        }
      }
    } catch (error) {
      console.error('Failed to generate weekly report:', error)
      throw error
    }
  }

  // Chatbot functionality
  async getChatbotResponse(message: ChatbotMessage): Promise<ChatbotResponse> {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return {
        response: this.getMockAIResponse(),
        confidence: 0.95,
        sources: ['Nutrition Database', 'Health Guidelines', 'User Profile']
      }
    } catch (error) {
      console.error('Chatbot request failed:', error)
      throw error
    }
  }

  // Mock implementations
  private mockAnalyzeText(text: string): FoodItem[] {
    const foods = text.toLowerCase().split(/,|\s+and\s+|\s+with\s+/)
    const results: FoodItem[] = []

    foods.forEach((food) => {
      const cleanFood = food.trim()
      if (cleanFood.length > 2) {
        results.push({
          id: Math.random().toString(36).substr(2, 9),
          name: cleanFood.charAt(0).toUpperCase() + cleanFood.slice(1),
          quantity: '1 serving',
          nutrition: this.getMockNutrition(cleanFood),
          confidence: 0.85
        })
      }
    })

    return results
  }

  private mockAnalyzeImage(): FoodItem[] {
    return [
      {
        id: '1',
        name: 'Rice',
        quantity: '1 cup',
        nutrition: { calories: 205, protein: 4, carbs: 45, fat: 0.5 },
        confidence: 0.92
      },
      {
        id: '2',
        name: 'Chicken Curry',
        quantity: '150g',
        nutrition: { calories: 250, protein: 25, carbs: 8, fat: 12 },
        confidence: 0.88
      }
    ]
  }

  private getMockNutrition(food: string): NutritionData {
    const nutritionMap: { [key: string]: NutritionData } = {
      'apple': { calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
      'banana': { calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
      'chicken': { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
      'rice': { calories: 205, protein: 4.3, carbs: 45, fat: 0.4 },
      'bread': { calories: 80, protein: 3, carbs: 15, fat: 1 },
      'egg': { calories: 70, protein: 6, carbs: 0.5, fat: 5 }
    }

    for (const [key, nutrition] of Object.entries(nutritionMap)) {
      if (food.includes(key)) {
        return nutrition
      }
    }

    return { calories: 100, protein: 5, carbs: 15, fat: 3 }
  }

  private getMockAIResponse(): string {
    const responses = [
      "Based on your nutritional profile, I'd recommend focusing on lean proteins and complex carbohydrates to support your fitness goals.",
      "Your recent meals show good variety! Consider adding more colorful vegetables to increase your micronutrient intake.",
      "I notice you're getting adequate protein. To optimize muscle recovery, try timing your protein intake around your workouts.",
      "Your calorie distribution looks balanced. Adding some healthy fats like avocado or nuts could help with nutrient absorption.",
      "Great job tracking your nutrition! Based on your activity level, you might benefit from slightly increasing your carbohydrate intake on workout days."
    ]
    
    return responses[Math.floor(Math.random() * responses.length)]
  }
}

export const nutritionApi = new NutritionApiService()