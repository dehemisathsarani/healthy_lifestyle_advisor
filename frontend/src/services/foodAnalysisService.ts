// Food Analysis API Service
interface FoodItem {
  name: string
  quantity: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
}

interface FoodAnalysisResult {
  _id?: string
  user_id?: string
  food_items: FoodItem[]
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
  analysis_method: 'image' | 'manual' | 'text'
  meal_type: string
  created_at: string
  confidence_score: number
  image_url: string | null
  text_description: string
}

interface StoredFoodItem {
  name: string
  calories_per_100g: number
  protein_per_100g: number
  carbs_per_100g: number
  fat_per_100g: number
  fiber_per_100g: number
  common_serving_size: string
  category: string
  keywords: string[]
}

class FoodAnalysisService {
  private baseUrl = 'http://localhost:8004/api' // Backend URL
  
  // Mock database of Sri Lankan foods
  private foodDatabase: StoredFoodItem[] = [
    {
      name: "Kottu Roti",
      calories_per_100g: 173,
      protein_per_100g: 8.3,
      carbs_per_100g: 15,
      fat_per_100g: 9.3,
      fiber_per_100g: 1.3,
      common_serving_size: "300g",
      category: "main_dish",
      keywords: ["kottu", "roti", "chopped", "stir-fry"]
    },
    {
      name: "White Rice",
      calories_per_100g: 130,
      protein_per_100g: 2.7,
      carbs_per_100g: 28,
      fat_per_100g: 0.3,
      fiber_per_100g: 0.4,
      common_serving_size: "150g",
      category: "grain",
      keywords: ["rice", "white rice", "steamed rice"]
    },
    {
      name: "Fish Curry",
      calories_per_100g: 120,
      protein_per_100g: 18,
      carbs_per_100g: 3,
      fat_per_100g: 4,
      fiber_per_100g: 1,
      common_serving_size: "200g",
      category: "curry",
      keywords: ["fish", "curry", "gravy", "spiced"]
    },
    {
      name: "Chicken Curry",
      calories_per_100g: 165,
      protein_per_100g: 25,
      carbs_per_100g: 2,
      fat_per_100g: 6,
      fiber_per_100g: 0.5,
      common_serving_size: "200g",
      category: "curry",
      keywords: ["chicken", "curry", "meat", "spiced"]
    },
    {
      name: "Dhal Curry",
      calories_per_100g: 116,
      protein_per_100g: 9,
      carbs_per_100g: 20,
      fat_per_100g: 0.4,
      fiber_per_100g: 8,
      common_serving_size: "150g",
      category: "curry",
      keywords: ["dhal", "lentil", "dal", "pulse"]
    },
    {
      name: "Pol Sambol",
      calories_per_100g: 180,
      protein_per_100g: 2,
      carbs_per_100g: 8,
      fat_per_100g: 17,
      fiber_per_100g: 5,
      common_serving_size: "50g",
      category: "condiment",
      keywords: ["sambol", "coconut", "pol", "spicy"]
    },
    {
      name: "Hoppers",
      calories_per_100g: 200,
      protein_per_100g: 4,
      carbs_per_100g: 35,
      fat_per_100g: 5,
      fiber_per_100g: 2,
      common_serving_size: "100g",
      category: "bread",
      keywords: ["hopper", "appa", "bowl", "fermented"]
    }
  ]

  // Identify foods from text description
  identifyFoodsFromText(description: string): FoodItem[] {
    const lowerDescription = description.toLowerCase()
    const identifiedFoods: FoodItem[] = []

    this.foodDatabase.forEach(food => {
      const isMatch = food.keywords.some(keyword => 
        lowerDescription.includes(keyword.toLowerCase())
      )

      if (isMatch) {
        const servingSize = this.parseServingSize(food.common_serving_size)
        const multiplier = servingSize / 100

        identifiedFoods.push({
          name: food.name,
          quantity: food.common_serving_size,
          calories: Math.round(food.calories_per_100g * multiplier),
          protein: Math.round(food.protein_per_100g * multiplier * 10) / 10,
          carbs: Math.round(food.carbs_per_100g * multiplier * 10) / 10,
          fat: Math.round(food.fat_per_100g * multiplier * 10) / 10,
          fiber: Math.round(food.fiber_per_100g * multiplier * 10) / 10
        })
      }
    })

    return identifiedFoods
  }

  // Simulate image analysis (in real implementation, this would call AI service)
  async analyzeImage(_imageFile: File): Promise<FoodItem[]> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Mock AI recognition - in real app, this would be actual image processing
    const mockDetectedFoods = ["kottu", "rice"]
    const identifiedFoods: FoodItem[] = []

    mockDetectedFoods.forEach(foodName => {
      const food = this.foodDatabase.find(item => 
        item.keywords.some(keyword => keyword.toLowerCase() === foodName.toLowerCase())
      )

      if (food) {
        const servingSize = this.parseServingSize(food.common_serving_size)
        const multiplier = servingSize / 100

        identifiedFoods.push({
          name: food.name,
          quantity: food.common_serving_size,
          calories: Math.round(food.calories_per_100g * multiplier),
          protein: Math.round(food.protein_per_100g * multiplier * 10) / 10,
          carbs: Math.round(food.carbs_per_100g * multiplier * 10) / 10,
          fat: Math.round(food.fat_per_100g * multiplier * 10) / 10,
          fiber: Math.round(food.fiber_per_100g * multiplier * 10) / 10
        })
      }
    })

    return identifiedFoods
  }

  // Save analysis result to backend
  async saveAnalysisResult(analysisResult: FoodAnalysisResult): Promise<FoodAnalysisResult> {
    try {
      const response = await fetch(`${this.baseUrl}/food-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisResult)
      })

      if (!response.ok) {
        throw new Error('Failed to save analysis result')
      }

      return await response.json()
    } catch (error) {
      console.error('Error saving analysis result:', error)
      // Fallback to local storage
      const localResults = JSON.parse(localStorage.getItem('foodAnalysisHistory') || '[]')
      localResults.push(analysisResult)
      localStorage.setItem('foodAnalysisHistory', JSON.stringify(localResults))
      return analysisResult
    }
  }

  // Get analysis history
  async getAnalysisHistory(userId: string): Promise<FoodAnalysisResult[]> {
    try {
      const response = await fetch(`${this.baseUrl}/food-analysis/user/${userId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch analysis history')
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching analysis history:', error)
      // Fallback to local storage
      return JSON.parse(localStorage.getItem('foodAnalysisHistory') || '[]')
    }
  }

  // Helper method to parse serving size
  private parseServingSize(servingSizeStr: string): number {
    const match = servingSizeStr.match(/(\d+)g/)
    return match ? parseInt(match[1]) : 100
  }

  // Get food suggestions based on partial input
  getFoodSuggestions(partialInput: string): StoredFoodItem[] {
    const lowerInput = partialInput.toLowerCase()
    return this.foodDatabase.filter(food => 
      food.name.toLowerCase().includes(lowerInput) ||
      food.keywords.some(keyword => keyword.toLowerCase().includes(lowerInput))
    ).slice(0, 5) // Limit to 5 suggestions
  }

  // Calculate total nutrition for multiple food items
  calculateTotalNutrition(foodItems: FoodItem[]): {
    total_calories: number
    total_protein: number
    total_carbs: number
    total_fat: number
    total_fiber: number
  } {
    return {
      total_calories: foodItems.reduce((sum, item) => sum + item.calories, 0),
      total_protein: Math.round(foodItems.reduce((sum, item) => sum + item.protein, 0) * 10) / 10,
      total_carbs: Math.round(foodItems.reduce((sum, item) => sum + item.carbs, 0) * 10) / 10,
      total_fat: Math.round(foodItems.reduce((sum, item) => sum + item.fat, 0) * 10) / 10,
      total_fiber: Math.round(foodItems.reduce((sum, item) => sum + (item.fiber || 0), 0) * 10) / 10
    }
  }
}

export const foodAnalysisService = new FoodAnalysisService()
export type { FoodAnalysisResult, FoodItem, StoredFoodItem }
