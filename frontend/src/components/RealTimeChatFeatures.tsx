import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import EnhancedDietChatbot from './EnhancedDietChatbot'
import { 
  HiSparkles, 
  HiLightBulb, 
  HiClock,
  HiArrowTrendingUp,
  HiBookmark
} from 'react-icons/hi2'

// ==================== Extended Features Component ====================
export const RealTimeChatFeatures = () => {
  const [autoSuggestions, setAutoSuggestions] = useState<string[]>([])
  const [userGoal, setUserGoal] = useState<string>('general')
  const [quickTips, setQuickTips] = useState<string[]>([])
  
  // ==================== Smart Auto-Suggestions Based on Context ====================
  const generateAutoSuggestions = useCallback((inputText: string) => {
    const lowerInput = inputText.toLowerCase()
    const suggestions: string[] = []
    
    // Protein-related suggestions
    if (lowerInput.includes('protein')) {
      suggestions.push(
        'What are the best high-protein foods for building muscle?',
        'How much protein do I need daily for my fitness goals?',
        'Which plant-based proteins are complete proteins?'
      )
    }
    
    // Weight loss suggestions
    else if (lowerInput.includes('weight') || lowerInput.includes('lose') || lowerInput.includes('diet')) {
      suggestions.push(
        'What is a healthy calorie deficit for weight loss?',
        'Which foods keep me full longer while dieting?',
        'How can I lose weight without losing muscle mass?'
      )
    }
    
    // Meal planning suggestions
    else if (lowerInput.includes('meal') || lowerInput.includes('plan') || lowerInput.includes('eat')) {
      suggestions.push(
        'Create a balanced meal plan for the week',
        'What are good pre and post-workout meals?',
        'How to meal prep for busy weekdays?'
      )
    }
    
    // Nutrition general suggestions
    else if (lowerInput.includes('healthy') || lowerInput.includes('nutrition')) {
      suggestions.push(
        'What vitamins and minerals should I take daily?',
        'How to create a balanced plate for every meal?',
        'What are the healthiest cooking methods?'
      )
    }
    
    // Energy and performance
    else if (lowerInput.includes('energy') || lowerInput.includes('tired') || lowerInput.includes('fatigue')) {
      suggestions.push(
        'What foods boost energy levels naturally?',
        'How does hydration affect my energy?',
        'Best snacks for sustained energy throughout the day?'
      )
    }
    
    // Default suggestions
    else if (inputText.length > 3) {
      suggestions.push(
        'Tell me about macronutrient ratios',
        'What should I eat before a workout?',
        'How to track my nutrition effectively?'
      )
    }
    
    setAutoSuggestions(suggestions.slice(0, 3))
  }, [])

  // ==================== Contextual Quick Tips ====================
  const contextualTips = useMemo(() => {
    const tips: Record<string, string[]> = {
      'weight_loss': [
        '💡 Tip: Aim for 0.5-1kg per week for sustainable weight loss',
        '💡 Protein helps preserve muscle during weight loss',
        '💡 Drink water before meals to reduce calorie intake'
      ],
      'muscle_gain': [
        '💡 Tip: Consume 1.6-2.2g protein per kg body weight',
        '💡 Eat in a slight calorie surplus (200-300 calories)',
        '💡 Time protein intake around your workouts'
      ],
      'general': [
        '💡 Tip: Fill half your plate with vegetables',
        '💡 Stay hydrated: 8-10 glasses of water daily',
        '💡 Include all three macronutrients in every meal'
      ],
      'maintenance': [
        '💡 Tip: Balance is key - enjoy food without guilt',
        '💡 Listen to your hunger and fullness cues',
        '💡 Focus on whole, minimally processed foods'
      ]
    }
    
    return tips[userGoal] || tips['general']
  }, [userGoal])

  useEffect(() => {
    setQuickTips(contextualTips)
  }, [contextualTips])

  return (
    <div className="space-y-4">
      {/* ==================== Goal Selector ==================== */}
      <div className="bg-white rounded-xl p-4 shadow-md border-2 border-emerald-100">
        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          <HiArrowTrendingUp className="text-emerald-500" />
          Your Current Goal
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {['weight_loss', 'muscle_gain', 'maintenance', 'general'].map((goal) => (
            <button
              key={goal}
              onClick={() => setUserGoal(goal)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                userGoal === goal
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {goal.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </button>
          ))}
        </div>
      </div>

      {/* ==================== Quick Tips ==================== */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 shadow-md border-2 border-amber-200">
        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          <HiLightBulb className="text-amber-500" />
          Quick Tips for Your Goal
        </h3>
        <div className="space-y-2">
          {quickTips.map((tip, idx) => (
            <div key={idx} className="text-xs text-gray-700 bg-white/60 rounded-lg p-2">
              {tip}
            </div>
          ))}
        </div>
      </div>

      {/* ==================== Recently Asked ==================== */}
      <div className="bg-white rounded-xl p-4 shadow-md border-2 border-purple-100">
        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          <HiClock className="text-purple-500" />
          Trending Nutrition Questions
        </h3>
        <div className="space-y-2">
          <div className="text-xs text-gray-600 bg-purple-50 rounded-lg p-2 flex items-center gap-2">
            <HiSparkles className="text-purple-500 flex-shrink-0" />
            <span>How to increase protein on a vegetarian diet?</span>
          </div>
          <div className="text-xs text-gray-600 bg-purple-50 rounded-lg p-2 flex items-center gap-2">
            <HiSparkles className="text-purple-500 flex-shrink-0" />
            <span>Best foods for post-workout recovery?</span>
          </div>
          <div className="text-xs text-gray-600 bg-purple-50 rounded-lg p-2 flex items-center gap-2">
            <HiSparkles className="text-purple-500 flex-shrink-0" />
            <span>How many calories should I eat to build muscle?</span>
          </div>
        </div>
      </div>

      {/* ==================== Saved Queries ==================== */}
      <div className="bg-white rounded-xl p-4 shadow-md border-2 border-blue-100">
        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          <HiBookmark className="text-blue-500" />
          Bookmarked Questions
        </h3>
        <div className="space-y-2">
          <button className="w-full text-left text-xs text-gray-600 bg-blue-50 rounded-lg p-2 hover:bg-blue-100 transition-colors flex items-center gap-2">
            <HiBookmark className="text-blue-500 flex-shrink-0" />
            <span>My personalized meal plan for muscle gain</span>
          </button>
          <button className="w-full text-left text-xs text-gray-600 bg-blue-50 rounded-lg p-2 hover:bg-blue-100 transition-colors flex items-center gap-2">
            <HiBookmark className="text-blue-500 flex-shrink-0" />
            <span>Calorie and macro targets for my goals</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ==================== Main Export with Features ====================
export { EnhancedDietChatbot as default }
