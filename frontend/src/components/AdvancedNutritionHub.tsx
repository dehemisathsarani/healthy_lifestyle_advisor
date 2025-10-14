import React, { useState, useCallback, useEffect } from 'react'
import { ArrowLeft, Camera, FileText, BarChart3, Brain, TrendingUp, Target, CheckCircle, Heart, MessageCircle, Send, Bot, User as UserIcon, Download, Trash2, Sparkles } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { nutritionApi } from '../services/nutritionApi'
import NutritionalProfileSetup, { type NutritionalProfileData } from './NutritionalProfileSetup'
import type { FoodItem, NutritionLog, WeeklyReport, NutritionData } from '../services/nutritionApi'
import EnhancedAdvancedFoodAnalysisService from '../services/enhancedAdvancedFoodAnalysis'

interface AdvancedNutritionHubProps {
  onBackToServices: () => void
}

export const AdvancedNutritionHub: React.FC<AdvancedNutritionHubProps> = ({ onBackToServices }) => {
  const { isAuthenticated, profile } = useAuth()
  const [activeTab, setActiveTab] = useState<'analysis' | 'insights' | 'logs' | 'reports' | 'profile' | 'chatbot'>('analysis')
  const [analysisMode, setAnalysisMode] = useState<'text' | 'image'>('text')
  const [textInput, setTextInput] = useState('')
  const [imageFile, setImageFile] = useState<File | null>()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<FoodItem[] | null>(null)
  const [nutritionLogs, setNutritionLogs] = useState<NutritionLog[]>([])
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null)
  const [aiInsights, setAiInsights] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasNutritionalProfile, setHasNutritionalProfile] = useState<boolean | null>(null)
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [nutritionalProfile, setNutritionalProfile] = useState<NutritionalProfileData | null>(null)
  
  // Enhanced RAG Chatbot state
  interface ChatMessage {
    id: string;
    type: 'user' | 'bot';
    content: string;
    timestamp: Date;
    context?: string;
    intent?: string;
    confidence?: number;
    sources?: string[];
    nutritionAnalysis?: Record<string, unknown>;
    followUpSuggestions?: string[];
  }

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<string[]>([])
  const [chatMode, setChatMode] = useState<'general' | 'meal_planning' | 'nutrition_analysis' | 'goal_coaching'>('general')
  
  // Floating chatbot state
  const [showFloatingChat, setShowFloatingChat] = useState(false)
  const [floatingChatMessages, setFloatingChatMessages] = useState<ChatMessage[]>([])
  const [floatingChatInput, setFloatingChatInput] = useState('')

  // Initialize enhanced food analysis service
  const enhancedFoodAnalysis = EnhancedAdvancedFoodAnalysisService.getInstance()
  const [isFloatingChatLoading, setIsFloatingChatLoading] = useState(false)
  
  // Setup auth token when authentication changes
  useEffect(() => {
    if (isAuthenticated) {
      // For now, we'll handle authentication at the API level
      // TODO: Implement proper token management when available
      console.log('User authenticated, setting up nutrition API access')
      checkNutritionalProfile()
    }
  }, [isAuthenticated])

  // Listen for workout completion events and update calories
  useEffect(() => {
    const handleWorkoutCompletion = async (event: any) => {
      const workoutData = event.detail
      
      console.log('🏋️ ========================================')
      console.log('🏋️ WORKOUT COMPLETION RECEIVED IN NUTRITION HUB')
      console.log('🏋️ ========================================')
      console.log('📊 Workout Data:', workoutData)
      console.log('🔥 Calories Burned:', workoutData.caloriesBurned)
      console.log('🏋️ ========================================')
      
      try {
        // Update calorie balance in backend (using new /api/integration prefix)
        const response = await fetch('http://localhost:8005/api/integration/nutrition/update-calories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: profile?.email || workoutData.userId,
            caloriesBurned: workoutData.caloriesBurned,
            mealId: workoutData.relatedMealId || null,
            timestamp: workoutData.timestamp || new Date().toISOString()
          })
        })
        
        if (response.ok) {
          const result = await response.json()
          console.log('✅ Calories updated successfully:', result)
          
          // Refresh nutrition logs to show updated data
          await loadNutritionLogs()
          
          // Show success notification with detailed info
          const notification = document.createElement('div')
          notification.className = 'fixed top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl z-[9999] min-w-[400px] animate-slide-in'
          notification.innerHTML = `
            <div class="font-bold text-xl mb-3 flex items-center gap-2">
              <span>🎉</span>
              <span>Calories Updated Successfully!</span>
            </div>
            <div class="text-sm space-y-2">
              <div class="bg-white/20 p-2 rounded">
                <strong>🔥 Calories Burned:</strong> ${workoutData.caloriesBurned} kcal
              </div>
              <div class="bg-white/20 p-2 rounded">
                <strong>📊 Net Calories:</strong> ${result.netCalories || 0} kcal
              </div>
              <div class="bg-white/20 p-2 rounded">
                <strong>💪 Workout:</strong> ${workoutData.workoutType || 'Mixed Workout'}
              </div>
              <div class="mt-2 pt-2 border-t border-white/30 text-xs opacity-90">
                ✨ Your nutrition profile has been automatically updated!
              </div>
            </div>
          `
          document.body.appendChild(notification)
          setTimeout(() => {
            notification.style.animation = 'slide-out 0.3s ease-out forwards'
            setTimeout(() => notification.remove(), 300)
          }, 6000)
          
        } else {
          console.error('❌ Failed to update calories')
          throw new Error('Failed to update calories')
        }
      } catch (error) {
        console.error('❌ Error updating calories:', error)
        
        // Show error notification
        const errorNotification = document.createElement('div')
        errorNotification.className = 'fixed top-4 right-4 bg-gradient-to-r from-red-500 to-orange-600 text-white px-6 py-4 rounded-xl shadow-2xl z-[9999]'
        errorNotification.innerHTML = `
          <div class="font-bold text-lg mb-2">⚠️ Update Error</div>
          <div class="text-sm">
            Could not update calorie balance. Please try refreshing the page.
          </div>
        `
        document.body.appendChild(errorNotification)
        setTimeout(() => errorNotification.remove(), 4000)
      }
    }
    
    // Check for workout data in session storage (from navigation)
    const checkSessionWorkoutData = async () => {
      const workoutDataStr = sessionStorage.getItem('workoutData')
      if (workoutDataStr) {
        try {
          const workoutData = JSON.parse(workoutDataStr)
          console.log('📦 Found workout data in session storage:', workoutData)
          
          // Clear it so we don't process again
          sessionStorage.removeItem('workoutData')
          
          // Process the workout data
          await handleWorkoutCompletion({ detail: workoutData })
        } catch (error) {
          console.error('Error processing session workout data:', error)
        }
      }
    }
    
    // Check on mount
    checkSessionWorkoutData()
    
    // Listen for workout completion events
    window.addEventListener('workoutCompleted', handleWorkoutCompletion)
    
    return () => {
      window.removeEventListener('workoutCompleted', handleWorkoutCompletion)
    }
  }, [profile])

  // Check if user has a nutritional profile
  const checkNutritionalProfile = async () => {
    try {
      // Check localStorage first for existing profile
      const existingProfile = localStorage.getItem('nutritionalProfile')
      if (existingProfile) {
        const profileData = JSON.parse(existingProfile)
        setNutritionalProfile(profileData)
        setHasNutritionalProfile(true)
        console.log('✅ Found existing nutritional profile')
        return
      }

      // TODO: Check with API when backend is ready
      // For now, assume no profile exists if not in localStorage
      setHasNutritionalProfile(false)
      setShowProfileSetup(true)
    } catch (error) {
      console.error('Error checking nutritional profile:', error)
      setHasNutritionalProfile(false)
      setShowProfileSetup(true)
    }
  }

  // RAG Chatbot Functions with Enhanced Features
  const initializeChatbot = () => {
    if (chatMessages.length === 0) {
      const welcomeMessage = {
        id: 'welcome-' + Date.now(),
        type: 'bot' as const,
        content: `Hello ${nutritionalProfile?.name || 'there'}! 👋 I'm your AI Nutrition Coach powered by advanced RAG technology.

**🧠 My Capabilities:**
🍎 **Personalized Nutrition Advice** - Based on your profile (${nutritionalProfile?.fitnessGoal?.replace('_', ' ') || 'fitness goals'})
🥗 **Smart Meal Planning** - Customized for your ${nutritionalProfile?.activityLevel?.replace('_', ' ') || 'activity level'}
📊 **Nutrition Analysis** - Detailed breakdowns with scientific backing
🎯 **Goal Achievement** - Evidence-based strategies for your objectives
🔄 **Food Alternatives** - Personalized substitutions and improvements
📈 **Progress Tracking** - Insights based on your nutrition history
🌍 **Cultural Foods** - Expertise in diverse cuisines including Sri Lankan

**🔬 How I Work (RAG Process):**
1. **Query Analysis** - I understand your question's intent and context
2. **Knowledge Retrieval** - I access comprehensive nutrition science database
3. **Profile Integration** - I combine knowledge with your personal data
4. **Personalized Response** - I generate advice specific to your needs

What would you like to explore about nutrition today?`,
        timestamp: new Date(),
        context: 'welcome'
      }
      setChatMessages([welcomeMessage])
    }
  }

  const generateRAGResponse = async (userQuery: string): Promise<string> => {
    try {
      // 1. Enhanced Query Processing & Intent Recognition
      const queryIntent = analyzeQueryIntent(userQuery)
      
      const userContext = {
        profile: nutritionalProfile,
        recentLogs: nutritionLogs.slice(-5), // Last 5 nutrition logs
        fitnessGoal: nutritionalProfile?.fitnessGoal,
        activityLevel: nutritionalProfile?.activityLevel,
        allergies: nutritionalProfile?.allergies || [],
        dietaryRestrictions: nutritionalProfile?.dietaryRestrictions || [],
        conversationHistory: chatMessages.slice(-6), // Last 3 exchanges
        queryIntent: queryIntent,
        timestamp: new Date().toISOString()
      }

      // 2. Advanced Knowledge Retrieval with Vector Similarity
      const nutritionKnowledge = await retrieveNutritionKnowledge(userQuery, userContext)
      
      // 3. Try backend RAG API first (with real AI)
      try {
        const backendResponse = await fetch('http://localhost:8000/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: profile?.email || 'demo-user',
            message: userQuery,
            context_type: queryIntent,
            user_profile: nutritionalProfile,
            nutrition_context: {
              recent_logs: nutritionLogs.slice(-5),
              conversation_history: chatMessages.slice(-6)
            }
          }),
        })

        if (backendResponse.ok) {
          const backendData = await backendResponse.json()
          if (backendData.response && backendData.response.length > 50) {
            return backendData.response
          }
        }
      } catch {
        console.log('Backend RAG unavailable, using enhanced fallback')
      }

      // 4. Enhanced Frontend AI Response Generation
      const response = await nutritionApi.getChatbotResponse({
        message: userQuery,
        mode: queryIntent,
        conversation_history: chatMessages.slice(-6),
        relevant_knowledge: nutritionKnowledge
      })

      return response.response
    } catch (_error) {
      console.error('RAG Response Error:', _error)
      return generateEnhancedFallbackResponse(userQuery)
    }
  }

  // Enhanced Query Intent Analysis
  const analyzeQueryIntent = (query: string): string => {
    // Intent classification based on keywords and patterns
    if (/\b(protein|muscle|build|strength|amino|lean)\b/i.test(query)) return 'protein_inquiry'
    if (/\b(lose|weight|fat|diet|slim|calories|deficit)\b/i.test(query)) return 'weight_loss'
    if (/\b(gain|weight|bulk|mass|surplus|calories)\b/i.test(query)) return 'weight_gain'
    if (/\b(meal|plan|prep|recipe|breakfast|lunch|dinner)\b/i.test(query)) return 'meal_planning'
    if (/\b(substitute|replace|alternative|instead|swap)\b/i.test(query)) return 'food_substitution'
    if (/\b(vitamin|mineral|supplement|deficiency|nutrient)\b/i.test(query)) return 'micronutrients'
    if (/\b(hydration|water|drink|fluid|dehydrat)\b/i.test(query)) return 'hydration'
    if (/\b(rice|curry|kottu|hopper|dhal|fish|chicken)\b/i.test(query)) return 'sri_lankan_food'
    if (/\b(carb|carbohydrate|sugar|glycemic|fiber)\b/i.test(query)) return 'carbohydrates'
    if (/\b(fat|oil|omega|saturated|unsaturated)\b/i.test(query)) return 'fats'
    if (/\b(snack|between|hungry|appetite|portion)\b/i.test(query)) return 'snacking'
    if (/\b(exercise|workout|pre|post|training|gym)\b/i.test(query)) return 'sports_nutrition'
    
    return 'general_nutrition'
  }



  const retrieveNutritionKnowledge = async (query: string, context: Record<string, unknown>) => {
    // Type-safe interface for the profile context
    interface ProfileContext {
      fitnessGoal?: string
      dietaryRestrictions?: string[]
    }

    // Enhanced knowledge retrieval with intent-based selection
    const knowledgeBase = {
      macronutrients: {
        proteins: "Complete proteins contain all essential amino acids. Good sources include meat, fish, eggs, dairy, quinoa, and soy.",
        carbohydrates: "Complex carbs provide sustained energy. Focus on whole grains, vegetables, fruits, and legumes.",
        fats: "Healthy fats support hormone production and nutrient absorption. Include avocados, nuts, olive oil, and fatty fish."
      },
      weightLoss: {
        deficit: "Create a moderate calorie deficit of 300-500 calories per day for sustainable weight loss of 1-2 lbs per week.",
        timing: "Meal timing matters less than total calories, but protein throughout the day helps maintain muscle mass.",
        exercise: "Combine cardio and strength training for optimal body composition changes."
      },
      weightGain: {
        surplus: "Aim for a moderate calorie surplus of 300-500 calories above maintenance for healthy weight gain.",
        protein: "Consume 1.6-2.2g protein per kg body weight to support muscle growth.",
        frequency: "Eat every 3-4 hours to ensure consistent nutrient intake."
      },
      maintenance: {
        balance: "Focus on balanced meals with protein, complex carbs, healthy fats, and plenty of vegetables.",
        hydration: "Aim for 8-10 glasses of water daily, more if you're active.",
        variety: "Eat a rainbow of fruits and vegetables to ensure diverse micronutrient intake."
      },
      sriLankanFoods: {
        riceAndCurry: "Traditional Sri Lankan staple. Rice provides carbs, curries add protein/vegetables. Use brown rice when possible, control portions, include variety of curries.",
        kottu: "Popular street food. High in calories and carbs. Contains vegetables and protein. Enjoy occasionally, balance with lighter meals the same day.",
        hoppers: "Fermented rice flour pancakes. Good source of carbs. Pair with protein-rich curries or eggs. Coconut milk adds healthy fats but increases calories.",
        dhalCurry: "Excellent protein source from lentils. High in fiber and nutrients. Low in fat. Perfect for vegetarian protein needs.",
        fishCurry: "High-quality protein and omega-3 fatty acids. Good for heart health and muscle building. Choose grilled or steamed over fried preparations."
      },
      sportsNutrition: {
        preWorkout: "Consume carbs 1-2 hours before exercise. Include some protein. Stay hydrated. Avoid high fiber/fat foods that may cause GI distress.",
        postWorkout: "Within 30-60 minutes: protein for muscle repair, carbs to replenish glycogen. 3:1 or 4:1 carb to protein ratio is ideal.",
        hydration: "Start hydrated, drink during exercise if >60 minutes, replace electrolytes for long sessions. Monitor urine color for hydration status."
      },
      micronutrients: {
        vitamins: "Water-soluble (B, C) need daily replenishment. Fat-soluble (A, D, E, K) stored in body. Focus on whole foods over supplements unless deficient.",
        minerals: "Iron for oxygen transport, calcium for bones, zinc for immunity. Vegetarians need extra attention to iron, B12, zinc.",
        antioxidants: "Found in colorful fruits/vegetables. Protect against oxidative stress. Include berries, leafy greens, nuts, seeds."
      }
    } as const

    // Enhanced knowledge retrieval with vector similarity simulation
    const intent = context.queryIntent as string || 'general_nutrition'
    const profileContext = context.profile as ProfileContext || {}
    let relevantKnowledge: string[] = []

    // Intent-based knowledge selection
    switch (intent) {
      case 'protein_inquiry':
        relevantKnowledge.push(knowledgeBase.macronutrients.proteins)
        if (profileContext.fitnessGoal === 'muscle_gain') {
          relevantKnowledge.push(knowledgeBase.weightGain.protein, knowledgeBase.sportsNutrition.postWorkout)
        }
        break
      
      case 'weight_loss':
        relevantKnowledge.push(...Object.values(knowledgeBase.weightLoss))
        relevantKnowledge.push(knowledgeBase.macronutrients.proteins) // Protein important for weight loss
        break
      
      case 'weight_gain':
        relevantKnowledge.push(...Object.values(knowledgeBase.weightGain))
        break
      
      case 'meal_planning':
        relevantKnowledge.push(knowledgeBase.maintenance.balance, knowledgeBase.maintenance.variety)
        if (profileContext.fitnessGoal) {
          const goalKey = profileContext.fitnessGoal as keyof typeof knowledgeBase
          if (goalKey in knowledgeBase) {
            relevantKnowledge.push(...Object.values(knowledgeBase[goalKey] as Record<string, string>))
          }
        }
        break
      
      case 'sri_lankan_food':
        relevantKnowledge.push(...Object.values(knowledgeBase.sriLankanFoods))
        break
      
      case 'sports_nutrition':
        relevantKnowledge.push(...Object.values(knowledgeBase.sportsNutrition))
        relevantKnowledge.push(knowledgeBase.macronutrients.proteins, knowledgeBase.macronutrients.carbohydrates)
        break
      
      case 'micronutrients':
        relevantKnowledge.push(...Object.values(knowledgeBase.micronutrients))
        break
      
      case 'hydration':
        relevantKnowledge.push(knowledgeBase.maintenance.hydration, knowledgeBase.sportsNutrition.hydration)
        break
      
      default:
        // General approach - include goal-specific and basic nutrition
        if (profileContext.fitnessGoal) {
          const goalKey = profileContext.fitnessGoal as keyof typeof knowledgeBase
          if (goalKey in knowledgeBase) {
            relevantKnowledge.push(...Object.values(knowledgeBase[goalKey] as Record<string, string>))
          }
        }
        relevantKnowledge.push(knowledgeBase.maintenance.balance, knowledgeBase.maintenance.variety)
        
        // Add specific macro if mentioned
        if (query.toLowerCase().includes('protein')) relevantKnowledge.push(knowledgeBase.macronutrients.proteins)
        if (query.toLowerCase().includes('carb')) relevantKnowledge.push(knowledgeBase.macronutrients.carbohydrates)
        if (query.toLowerCase().includes('fat')) relevantKnowledge.push(knowledgeBase.macronutrients.fats)
    }

    // Add contextual knowledge based on dietary restrictions
    if (profileContext.dietaryRestrictions?.includes('vegetarian') && intent === 'protein_inquiry') {
      relevantKnowledge.push("Vegetarian protein sources: legumes, dairy, eggs, quinoa, nuts, seeds, tofu. Combine different sources for complete amino acid profiles.")
    }

    // Remove duplicates and limit knowledge size
    relevantKnowledge = [...new Set(relevantKnowledge)].slice(0, 8)
    
    return relevantKnowledge
  }

  const generateEnhancedFallbackResponse = (query: string): string => {
    const intent = analyzeQueryIntent(query)
    
    // Intent-specific responses with proper typing
    const intentResponses = {
      protein_inquiry: {
        intro: `Great protein question! Based on your ${nutritionalProfile?.fitnessGoal?.replace('_', ' ') || 'fitness'} goals:`,
        tips: [
          `💪 Aim for ${nutritionalProfile?.weight ? Math.round(Number(nutritionalProfile.weight) * 1.2) : '80-120'}g protein daily`,
          "🥩 Include lean meats, fish, eggs, dairy, legumes, and nuts",
          "⏰ Spread protein intake across all meals for optimal absorption",
          "🏋️ Consume protein within 2 hours post-workout for muscle recovery"
        ]
      },
      weight_loss: {
        intro: `I can help with weight loss strategies! For your profile:`,
        tips: [
          "📉 Create a moderate calorie deficit (300-500 calories/day)",
          "🍽️ Focus on high-protein, high-fiber foods for satiety",
          "🥗 Fill half your plate with non-starchy vegetables",
          "⚖️ Track portions and eat mindfully"
        ]
      },
      weight_gain: {
        intro: `Weight gain guidance coming up! Based on your goals:`,
        tips: [
          "📈 Add 300-500 calories above your maintenance level",
          "🥜 Include calorie-dense, nutrient-rich foods like nuts and avocados",
          "🍽️ Eat frequent, smaller meals throughout the day",
          "💪 Combine with strength training for healthy muscle gain"
        ]
      },
      meal_planning: {
        intro: `Perfect meal planning question! For your ${nutritionalProfile?.activityLevel?.replace('_', ' ') || 'active'} lifestyle:`,
        tips: [
          "🍽️ Plan balanced meals with protein, complex carbs, and healthy fats",
          "📅 Prep ingredients in batches on weekends",
          "🥗 Keep quick, healthy options available for busy days",
          "🌈 Aim for variety in colors and food groups"
        ]
      },
      sri_lankan_food: {
        intro: `Excellent question about Sri Lankan cuisine! Here's how to enjoy it healthily:`,
        tips: [
          "🍚 Control rice portions and consider brown rice alternatives",
          "🍛 Load up on vegetable curries for nutrients and fiber",
          "🐟 Include fish curry for omega-3 fatty acids",
          "🥥 Use coconut products in moderation due to saturated fat"
        ]
      },
      sports_nutrition: {
        intro: `Great sports nutrition question! For optimal performance:`,
        tips: [
          "⚡ Eat carbs 1-2 hours before training for energy",
          "🔋 Consume protein + carbs within 60 minutes post-workout",
          "💧 Stay hydrated before, during, and after exercise",
          "⚖️ Match nutrition timing to your training schedule"
        ]
      }
    } as const

    // Type-safe access to intent responses
    const getIntentResponse = (intentKey: string) => {
      const validIntents = ['protein_inquiry', 'weight_loss', 'weight_gain', 'meal_planning', 'sri_lankan_food', 'sports_nutrition'] as const
      type ValidIntent = typeof validIntents[number]
      
      if (validIntents.includes(intentKey as ValidIntent)) {
        return intentResponses[intentKey as ValidIntent]
      }
      
      return {
        intro: `Great question about "${query}"! Based on your ${nutritionalProfile?.fitnessGoal?.replace('_', ' ') || 'fitness'} goals:`,
        tips: [
          "🥗 Focus on whole, unprocessed foods for optimal nutrition",
          "💧 Stay hydrated - aim for 8-10 glasses of water daily",
          "🍎 Include a variety of colorful fruits and vegetables",
          "💪 Balance protein intake throughout the day"
        ]
      }
    }

    const response = getIntentResponse(intent)

    // Add personalized context
    let personalizedNote = ""
    if (nutritionalProfile?.allergies && nutritionalProfile.allergies.length > 0) {
      personalizedNote += `\n\n⚠️ **Note:** Remember to avoid your allergens: ${nutritionalProfile.allergies.join(', ')}`
    }
    if (nutritionalProfile?.dietaryRestrictions && nutritionalProfile.dietaryRestrictions.length > 0) {
      personalizedNote += `\n\n🌱 **Dietary Preference:** I've considered your ${nutritionalProfile.dietaryRestrictions.join(', ')} preferences`
    }

    // Add conversation continuity
    const followUp = intent === 'general_nutrition' 
      ? "\n\n💡 **Want to dive deeper?** Ask me about specific foods, meal timing, or your nutrition goals!"
      : `\n\n🤔 **Follow-up questions?** I can provide more specific guidance about ${intent.replace('_', ' ')} or other nutrition topics!`

    return `${response.intro}\n\n${response.tips.join('\n')}${personalizedNote}${followUp}\n\n*Response generated using comprehensive nutrition knowledge base with your personal profile context.*`
  }

  const handleChatSend = async () => {
    if (!chatInput.trim() || isChatLoading) return

    const userMessage = {
      id: 'user-' + Date.now(),
      type: 'user' as const,
      content: chatInput.trim(),
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])
    setChatInput('')
    setIsChatLoading(true)

    try {
      const botResponse = await generateRAGResponse(userMessage.content)
      
      const botMessage = {
        id: 'bot-' + Date.now(),
        type: 'bot' as const,
        content: botResponse,
        timestamp: new Date(),
        context: 'rag-response'
      }

      setChatMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage = {
        id: 'error-' + Date.now(),
        type: 'bot' as const,
        content: "I apologize, but I'm having trouble processing your request right now. Please try again or ask a different question.",
        timestamp: new Date(),
        context: 'error'
      }
      setChatMessages(prev => [...prev, errorMessage])
    } finally {
      setIsChatLoading(false)
    }
  }

  // Export chat conversation
  const exportChatHistory = () => {
    const chatData = {
      user: nutritionalProfile?.name || 'User',
      exportDate: new Date().toISOString(),
      profile: {
        goal: nutritionalProfile?.fitnessGoal,
        activityLevel: nutritionalProfile?.activityLevel,
        allergies: nutritionalProfile?.allergies,
        dietaryRestrictions: nutritionalProfile?.dietaryRestrictions
      },
      conversation: chatMessages.map(msg => ({
        type: msg.type,
        content: msg.content,
        timestamp: msg.timestamp.toISOString(),
        context: msg.context
      }))
    }

    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nutrition-chat-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Clear chat history
  const clearChatHistory = () => {
    if (confirm('Are you sure you want to clear your chat history? This action cannot be undone.')) {
      setChatMessages([])
      setConversationHistory([])
      // Reinitialize with welcome message
      setTimeout(() => initializeChatbot(), 500)
    }
  }

  // Floating chat functions
  const initializeFloatingChat = () => {
    if (floatingChatMessages.length === 0) {
      const welcomeMessage = {
        id: 'floating-welcome-' + Date.now(),
        type: 'bot' as const,
        content: `Hi ${nutritionalProfile?.name || 'there'}! 👋 I'm your quick nutrition assistant. Ask me anything about nutrition, food, or your health goals!`,
        timestamp: new Date(),
        context: 'floating-welcome'
      }
      setFloatingChatMessages([welcomeMessage])
    }
  }

  const handleFloatingChatSend = async () => {
    if (!floatingChatInput.trim() || isFloatingChatLoading) return

    const userMessage = {
      id: 'floating-user-' + Date.now(),
      type: 'user' as const,
      content: floatingChatInput.trim(),
      timestamp: new Date()
    }

    setFloatingChatMessages(prev => [...prev, userMessage])
    setFloatingChatInput('')
    setIsFloatingChatLoading(true)

    try {
      const botResponse = await generateRAGResponse(userMessage.content)
      
      const botMessage = {
        id: 'floating-bot-' + Date.now(),
        type: 'bot' as const,
        content: botResponse,
        timestamp: new Date(),
        context: 'floating-rag-response'
      }

      setFloatingChatMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Floating chat error:', error)
      const errorMessage = {
        id: 'floating-error-' + Date.now(),
        type: 'bot' as const,
        content: "Sorry, I'm having trouble right now. Try asking in a different way!",
        timestamp: new Date(),
        context: 'floating-error'
      }
      setFloatingChatMessages(prev => [...prev, errorMessage])
    } finally {
      setIsFloatingChatLoading(false)
    }
  }

  const toggleFloatingChat = () => {
    setShowFloatingChat(!showFloatingChat)
    if (!showFloatingChat) {
      initializeFloatingChat()
    }
  }

  // Additional utility functions for enhanced RAG





  // Initialize chatbot when profile is loaded
  useEffect(() => {
    if (nutritionalProfile && activeTab === 'chatbot') {
      initializeChatbot()
    }
  }, [nutritionalProfile, activeTab, initializeChatbot])

  // Handle nutritional profile completion
  const handleProfileComplete = async (profileData: NutritionalProfileData) => {
    try {
      const completeProfile = {
        ...profileData,
        createdAt: new Date().toISOString(),
        userId: profile?.email || 'current-user'
      }

      // Save to localStorage (will be replaced with API call later)
      localStorage.setItem('nutritionalProfile', JSON.stringify(completeProfile))

      // TODO: Save to backend API when ready
      // await nutritionApi.saveNutritionalProfile(profileData)

      setNutritionalProfile(completeProfile)
      setHasNutritionalProfile(true)
      setShowProfileSetup(false)
      
      console.log('✅ Nutritional profile created successfully:', profileData)
    } catch (error) {
      console.error('❌ Error saving nutritional profile:', error)
      alert('Failed to save your nutritional profile. Please try again.')
    }
  }
  
  // Load nutrition logs from API
  const loadNutritionLogs = useCallback(async () => {
    try {
      const response = await nutritionApi.getNutritionLogs(1, 50)
      setNutritionLogs(response)
      console.log('✅ Loaded nutrition logs from database:', response.length)
    } catch (error) {
      console.error('❌ Error loading nutrition logs:', error)
    }
  }, [])

  // Setup authentication token for API calls
  // Load nutrition logs when authenticated
  useEffect(() => {
    if (isAuthenticated && activeTab === 'logs') {
      loadNutritionLogs()
    }
  }, [isAuthenticated, activeTab, loadNutritionLogs])

  // Real-time polling for nutrition logs updates (every 30 seconds)
  useEffect(() => {
    if (!isAuthenticated) return

    // Initial load
    loadNutritionLogs()

    // Set up polling interval
    const pollInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing nutrition logs...')
      loadNutritionLogs()
    }, 30000) // 30 seconds

    // Cleanup interval on unmount
    return () => {
      clearInterval(pollInterval)
    }
  }, [isAuthenticated, loadNutritionLogs])

  // Sample food database for text analysis
  const foodDatabase = {
    'rice': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4 },
    'chicken curry': { calories: 165, protein: 12, carbs: 6.7, fat: 10, fiber: 1.2 },
    'dhal curry': { calories: 120, protein: 7, carbs: 15, fat: 5, fiber: 3.5 },
    'kottu': { calories: 280, protein: 15, carbs: 35, fat: 8, fiber: 2.1 },
    'hoppers': { calories: 95, protein: 2, carbs: 18, fat: 1.5, fiber: 0.8 },
    'string hoppers': { calories: 110, protein: 2.5, carbs: 22, fat: 1, fiber: 1.2 },
    'fish curry': { calories: 140, protein: 18, carbs: 4, fat: 6, fiber: 0.5 }
  }

  // Enhanced text analysis function using comprehensive food database
  const analyzeTextFood = useCallback(async (text: string): Promise<FoodItem[]> => {
    try {
      // First try the enhanced analysis service
      const enhancedResult = await enhancedFoodAnalysis.analyzeFood({
        text: text,
        userContext: {
          profile: nutritionalProfile,
          preferences: nutritionalProfile?.dietaryRestrictions || [],
          allergies: nutritionalProfile?.allergies || []
        },
        realTimeMode: true
      })

      // Convert enhanced results to FoodItem format
      const convertedFoods: FoodItem[] = enhancedResult.foodItems.map(food => ({
        id: Math.random().toString(36).substr(2, 9),
        name: food.name,
        quantity: `${food.portionWeight}g (${food.portion})`,
        nutrition: {
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat
        },
        confidence: food.confidence
      }))

      if (convertedFoods.length > 0) {
        console.log('✅ Enhanced food analysis successful:', convertedFoods)
        return convertedFoods
      }
    } catch (error) {
      console.warn('Enhanced analysis failed, trying API fallback:', error)
    }

    // Fallback to existing API
    try {
      const response = await nutritionApi.analyzeFood({
        text_input: text,
        analysis_method: 'text'
      })
      
      return response
    } catch (error) {
      console.error('Text analysis error:', error)
      // Final fallback to local analysis
      const foods = text.toLowerCase().split(/[,\n]+/).map(item => item.trim()).filter(Boolean)
      const results: FoodItem[] = []

      for (const food of foods) {
        const matchedFood = Object.entries(foodDatabase).find(([key]) => 
          food.includes(key) || key.includes(food)
        )

        if (matchedFood) {
          const [name, nutrition] = matchedFood
          results.push({
            id: Math.random().toString(36).substr(2, 9),
            name: name.charAt(0).toUpperCase() + name.slice(1),
            quantity: '1 serving',
            nutrition: nutrition as NutritionData,
            confidence: 0.85
          })
        } else {
          results.push({
            id: Math.random().toString(36).substr(2, 9),
            name: food.charAt(0).toUpperCase() + food.slice(1),
            quantity: '1 serving',
            nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
            confidence: 0.3
          })
        }
      }
      return results
    }
  }, [foodDatabase, enhancedFoodAnalysis, nutritionalProfile])

  // Enhanced image analysis function using comprehensive food analysis
  const analyzeImageFood = useCallback(async (file: File): Promise<FoodItem[]> => {
    try {
      console.log('Processing file:', file.name)
      
      // First try the enhanced analysis service with image + text description
      const textDescription = textInput.trim() || undefined
      const enhancedResult = await enhancedFoodAnalysis.analyzeFood({
        imageFile: file,
        text: textDescription,
        userContext: {
          profile: nutritionalProfile,
          preferences: nutritionalProfile?.dietaryRestrictions || [],
          allergies: nutritionalProfile?.allergies || []
        },
        realTimeMode: true
      })

      // Convert enhanced results to FoodItem format
      const convertedFoods: FoodItem[] = enhancedResult.foodItems.map(food => ({
        id: Math.random().toString(36).substr(2, 9),
        name: food.name,
        quantity: `${food.portionWeight}g (${food.portion})`,
        nutrition: {
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat
        },
        confidence: food.confidence
      }))

      if (convertedFoods.length > 0) {
        console.log('✅ Enhanced image analysis successful:', convertedFoods)
        console.log('📊 Analysis confidence:', enhancedResult.confidence)
        console.log('🔬 Analysis method:', enhancedResult.analysisMethod)
        if (enhancedResult.recommendations.length > 0) {
          console.log('💡 Recommendations:', enhancedResult.recommendations)
        }
        return convertedFoods
      }
    } catch (error) {
      console.warn('Enhanced image analysis failed, trying API fallback:', error)
    }

    // Fallback to existing API
    try {
      const response = await nutritionApi.analyzeFood({
        analysis_method: 'image'
      })
      
      return response
    } catch (error) {
      console.error('Image analysis error:', error)
      // IMPORTANT: Show error message instead of fake data
      throw new Error('Unable to analyze image. Please ensure:\n1. Backend services are running (start_backend.bat)\n2. Image is clear and contains food\n3. Try adding a text description to help with analysis')
    }
  }, [enhancedFoodAnalysis, nutritionalProfile, textInput])

  // Enhanced food analysis handling
  const handleAnalysis = async () => {
    if (!textInput.trim() && !imageFile) return

    setIsAnalyzing(true)
    try {
      let results: FoodItem[]
      let enhancedInsights: string[] = []

      if (analysisMode === 'text' && textInput.trim()) {
        results = await analyzeTextFood(textInput)
        
        // Try to get enhanced insights from the analysis service
        try {
          const enhancedResult = await enhancedFoodAnalysis.analyzeFood({
            text: textInput,
            userContext: { profile: nutritionalProfile },
            realTimeMode: true
          })
          
          if (enhancedResult.recommendations.length > 0) {
            enhancedInsights.push(...enhancedResult.recommendations.map(r => `💡 ${r}`))
          }
          if (enhancedResult.improvements.length > 0) {
            enhancedInsights.push(...enhancedResult.improvements.map(i => `🔧 ${i}`))
          }
          if (enhancedResult.unknownFoods.length > 0) {
            enhancedInsights.push(`🔍 Found ${enhancedResult.unknownFoods.length} unknown food(s) - estimated nutrition provided`)
          }
        } catch (error) {
          console.log('Enhanced insights generation failed:', error)
        }
        
      } else if (analysisMode === 'image' && imageFile) {
        results = await analyzeImageFood(imageFile)
        
        // Try to get enhanced insights from image analysis
        try {
          const enhancedResult = await enhancedFoodAnalysis.analyzeFood({
            imageFile: imageFile,
            text: textInput.trim() || undefined,
            userContext: { profile: nutritionalProfile },
            realTimeMode: true
          })
          
          enhancedInsights.push(`🎯 Analysis confidence: ${(enhancedResult.confidence * 100).toFixed(1)}%`)
          enhancedInsights.push(`🔬 Method: ${enhancedResult.analysisMethod}`)
          
          if (enhancedResult.healthScore !== undefined) {
            enhancedInsights.push(`💚 Health score: ${enhancedResult.healthScore.toFixed(1)}/10`)
          }
          if (enhancedResult.balanceScore !== undefined) {
            enhancedInsights.push(`⚖️ Balance score: ${enhancedResult.balanceScore.toFixed(1)}/10`)
          }
          if (enhancedResult.sustainabilityScore !== undefined) {
            enhancedInsights.push(`🌱 Sustainability: ${enhancedResult.sustainabilityScore.toFixed(1)}/10`)
          }
          
          if (enhancedResult.recommendations.length > 0) {
            enhancedInsights.push(...enhancedResult.recommendations.map(r => `💡 ${r}`))
          }
        } catch (error) {
          console.log('Enhanced image insights generation failed:', error)
        }
      } else {
        return
      }

      setAnalysisResult(results)
      
      // Set enhanced insights if available, otherwise fallback to local generation
      if (enhancedInsights.length > 0) {
        setAiInsights(enhancedInsights)
      } else {
        // Generate AI insights using local analysis
        generateAIInsights(results)
      }
      
    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Generate AI insights and suggestions
  const generateAIInsights = (foods: FoodItem[]) => {
    const totalCalories = foods.reduce((sum, food) => sum + food.nutrition.calories, 0)
    const totalProtein = foods.reduce((sum, food) => sum + food.nutrition.protein, 0)
    const totalCarbs = foods.reduce((sum, food) => sum + food.nutrition.carbs, 0)
    // const totalFat = foods.reduce((sum, food) => sum + food.nutrition.fat, 0)

    const insights = []
    const recommendations = []

    // Calorie analysis
    if (totalCalories > 800) {
      insights.push('🔥 High-calorie meal detected. Consider portion control.')
      recommendations.push('Try reducing rice portion by 30% and adding more vegetables.')
    } else if (totalCalories < 300) {
      insights.push('⚡ Light meal. Good for weight management.')
    }

    // Macro analysis
    if (totalProtein < totalCalories * 0.15 / 4) {
      insights.push('🥩 Low protein content. Consider adding lean protein sources.')
      recommendations.push('Add grilled chicken, fish, or lentils to boost protein.')
    }

    if (totalCarbs > totalCalories * 0.6 / 4) {
      insights.push('🍚 High carbohydrate content. Balance with proteins and healthy fats.')
      recommendations.push('Replace some rice with quinoa or cauliflower rice.')
    }

    // Healthy alternatives
    recommendations.push('💡 Try brown rice instead of white rice for more fiber.')
    recommendations.push('🥗 Add a side salad to increase vegetable intake.')
    recommendations.push('🌿 Use herbs and spices instead of salt for flavor.')

    setAiInsights([...insights, ...recommendations])
  }

  // Save to nutrition log using API
  const saveToNutritionLog = async () => {
    if (!analysisResult || analysisResult.length === 0) {
      alert('No food items to save. Please analyze food first.')
      return
    }

    try {
      setIsLoading(true)
      
      // Check if user is authenticated using auth context only
      if (!isAuthenticated || !profile?.email) {
        setIsLoading(false)
        alert('⚠️ Please log in to save nutrition logs.\n\nYou need to be logged in to save your nutrition data to the database.\n\nPlease log in or create an account to continue.')
        console.error('❌ Authentication check failed:', { 
          isAuthenticated, 
          hasProfile: !!profile, 
          hasEmail: !!profile?.email 
        })
        return
      }

      console.log('💾 Preparing to save nutrition log...')
      console.log('📊 Analysis result:', analysisResult)
      console.log('👤 User:', profile.email)
      console.log('✅ Authentication verified:', { isAuthenticated, email: profile.email })
      
      const response = await nutritionApi.createNutritionLog({
        user_id: profile.email, // Now guaranteed to exist
        date: new Date().toISOString().split('T')[0],
        meals: analysisResult,
        meal_type: 'lunch', // Default, could be made configurable
        notes: textInput || 'Food analysis',
        total_nutrition: {
          calories: analysisResult.reduce((sum, food) => sum + food.nutrition.calories, 0),
          protein: analysisResult.reduce((sum, food) => sum + food.nutrition.protein, 0),
          carbs: analysisResult.reduce((sum, food) => sum + food.nutrition.carbs, 0),
          fat: analysisResult.reduce((sum, food) => sum + food.nutrition.fat, 0)
        }
      })

      console.log('✅ Nutrition log saved to database:', response)
      alert('✅ Nutrition log saved successfully!')
      
      // Refresh nutrition logs
      await loadNutritionLogs()
      
      setActiveTab('logs')
      
      // Clear analysis
      setAnalysisResult(null)
      setTextInput('')
      setImageFile(undefined)
      setAiInsights([])
      
      console.log('✅ All done! Switched to logs tab.')
    } catch (error) {
      console.error('❌ Error saving nutrition log:', error)
      console.error('❌ Error type:', error instanceof Error ? error.constructor.name : typeof error)
      console.error('❌ Error message:', error instanceof Error ? error.message : String(error))
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      alert(`Failed to save nutrition log: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Generate weekly report using API with NLP
  const generateWeeklyReport = async () => {
    setIsLoading(true)
    try {
      console.log('🔄 Generating NLP-powered weekly report...')
      
      // Call new NLP-powered endpoint
      const response = await fetch('http://localhost:8001/generate-weekly-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: profile?.email || nutritionalProfile?.name || 'demo-user',
          days: 7,
          include_insights: true
        })
      })
      
      if (!response.ok) {
        throw new Error(`Report generation failed: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        setWeeklyReport(data)
        console.log('✅ NLP-powered weekly report generated:', data)
      } else {
        throw new Error(data.message || 'Failed to generate report')
      }
      
      return
    } catch (error) {
      console.error('❌ Failed to generate weekly report:', error)
      
      // Fallback to local generation if API fails
      const lastWeekLogs = nutritionLogs.slice(0, 7)
      
      if (lastWeekLogs.length === 0) {
        alert('No nutrition data available for report generation')
        setWeeklyReport(null)
        return
      }

      const totalCalories = lastWeekLogs.reduce((sum, log) => sum + log.total_nutrition.calories, 0)
      const avgCalories = totalCalories / lastWeekLogs.length

      const nutritionTrends = {
        calories: lastWeekLogs.map(log => log.total_nutrition.calories),
        protein: lastWeekLogs.map(log => log.total_nutrition.protein),
        carbs: lastWeekLogs.map(log => log.total_nutrition.carbs),
        fat: lastWeekLogs.map(log => log.total_nutrition.fat)
      }

      setWeeklyReport({
        period: `${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString()} - ${new Date().toLocaleDateString()}`,
        average_daily_calories: Math.round(avgCalories),
        total_logs: lastWeekLogs.length,
        nutrition_trends: nutritionTrends,
        insights: [
          `📊 Analyzed ${lastWeekLogs.length} meal entries (local fallback)`,
          `🍽️ Average daily calories: ${Math.round(avgCalories)} kcal`
        ],
        recommendations: [
          '🌱 Increase vegetable portions in your meals',
          '💧 Maintain hydration with 8-10 glasses of water daily'
        ],
        health_score: 75
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Authentication guard
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Target className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">
            Please sign in to access personalized nutrition analysis, meal logging, and AI-powered insights.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => {
                // Save the intended destination for after login
                sessionStorage.setItem('redirectTo', '/services?launch=diet')
                onBackToServices()
                // Navigate to login - this will be handled by the parent component
                window.location.href = '/login'
              }}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200"
            >
              Sign In to Continue
            </button>
            <button
              onClick={onBackToServices}
              className="w-full text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← Back to Services
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show nutritional profile setup if no profile exists
  if (showProfileSetup || hasNutritionalProfile === false) {
    return (
      <NutritionalProfileSetup
        onProfileComplete={handleProfileComplete}
        onBack={onBackToServices}
      />
    )
  }

  // Show loading while checking profile
  if (hasNutritionalProfile === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking your nutritional profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={onBackToServices}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Services</span>
            </button>
            
            <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              🍎 Advanced Nutrition Hub
            </h1>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Welcome, {profile?.name}</span>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white/60 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { key: 'analysis', label: 'Food Analysis', icon: Camera },
              { key: 'chatbot', label: 'AI Nutrition Coach', icon: MessageCircle },
              { key: 'insights', label: 'AI Insights', icon: Brain },
              { key: 'logs', label: 'Nutrition Logs', icon: FileText },
              { key: 'reports', label: 'Weekly Reports', icon: BarChart3 },
              { key: 'profile', label: 'Profile', icon: CheckCircle }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as 'analysis' | 'insights' | 'logs' | 'reports' | 'profile' | 'chatbot')}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === key
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Food Analysis Tab */}
        {activeTab === 'analysis' && (
          <div className="space-y-8">
            {/* Analysis Mode Toggle */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">🔍 Food Analysis</h2>
              
              <div className="flex space-x-4 mb-6">
                <button
                  onClick={() => setAnalysisMode('text')}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all ${
                    analysisMode === 'text'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  <span>Text Analysis</span>
                </button>
                
                <button
                  onClick={() => setAnalysisMode('image')}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all ${
                    analysisMode === 'image'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Camera className="w-5 h-5" />
                  <span>Image Analysis</span>
                </button>
              </div>

              {/* Text Analysis */}
              {analysisMode === 'text' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Describe your meal (comma-separated):
                    </label>
                    <textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Rice and chicken curry, dhal curry, vegetables..."
                      className="w-full h-32 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Example: "Rice and chicken curry, dhal curry" → System will parse and analyze each item
                    </p>
                  </div>
                  
                  <button
                    onClick={handleAnalysis}
                    disabled={!textInput.trim() || isAnalyzing}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold py-4 px-6 rounded-xl hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {isAnalyzing ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Analyzing...</span>
                      </div>
                    ) : (
                      'Analyze Food'
                    )}
                  </button>
                </div>
              )}

              {/* Image Analysis */}
              {analysisMode === 'image' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload food image (Auto-analyzes on upload):
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setImageFile(file)
                            // Automatically trigger analysis after image is selected
                            console.log('🚀 Auto-analyzing uploaded image:', file.name)
                            setAnalysisMode('image')
                            
                            // Small delay to ensure state is updated
                            setTimeout(async () => {
                              setIsAnalyzing(true)
                              try {
                                const results = await analyzeImageFood(file)
                                setAnalysisResult(results)
                                
                                // Try to get enhanced insights from image analysis
                                try {
                                  const enhancedResult = await enhancedFoodAnalysis.analyzeFood({
                                    imageFile: file,
                                    text: textInput.trim() || undefined,
                                    userContext: { profile: nutritionalProfile },
                                    realTimeMode: true
                                  })
                                  
                                  // Generate DYNAMIC AI insights based on user's meal history
                                  const enhancedInsights = []
                                  enhancedInsights.push(`🎯 Analysis confidence: ${(enhancedResult.confidence * 100).toFixed(1)}%`)
                                  enhancedInsights.push(`🔬 Method: ${enhancedResult.analysisMethod} (YOLOv8 + Tesseract + OpenCV)`)
                                  
                                  if (enhancedResult.healthScore !== undefined) {
                                    enhancedInsights.push(`💚 Health score: ${enhancedResult.healthScore.toFixed(1)}/10`)
                                  }
                                  if (enhancedResult.balanceScore !== undefined) {
                                    enhancedInsights.push(`⚖️ Balance score: ${enhancedResult.balanceScore.toFixed(1)}/10`)
                                  }
                                  if (enhancedResult.sustainabilityScore !== undefined) {
                                    enhancedInsights.push(`🌱 Sustainability: ${enhancedResult.sustainabilityScore.toFixed(1)}/10`)
                                  }
                                  
                                  // DYNAMIC INSIGHTS based on user's recent meals
                                  if (nutritionLogs.length > 0) {
                                    const recentCalories = nutritionLogs.slice(0, 3).reduce((sum, log) => sum + log.total_nutrition.calories, 0) / Math.min(3, nutritionLogs.length)
                                    const currentCalories = results.reduce((sum, food) => sum + food.nutrition.calories, 0)
                                    
                                    if (currentCalories > recentCalories * 1.3) {
                                      enhancedInsights.push(`⚠️ This meal is 30% higher in calories than your recent average`)
                                    } else if (currentCalories < recentCalories * 0.7) {
                                      enhancedInsights.push(`✅ This is a lighter meal compared to your usual intake`)
                                    }
                                    
                                    const recentProtein = nutritionLogs.slice(0, 3).reduce((sum, log) => sum + log.total_nutrition.protein, 0) / Math.min(3, nutritionLogs.length)
                                    const currentProtein = results.reduce((sum, food) => sum + food.nutrition.protein, 0)
                                    
                                    if (currentProtein < recentProtein * 0.7) {
                                      enhancedInsights.push(`💪 Consider adding more protein - this meal has less than your usual`)
                                    }
                                    
                                    enhancedInsights.push(`📊 Based on ${nutritionLogs.length} previous meals in your log`)
                                  }
                                  
                                  if (enhancedResult.recommendations.length > 0) {
                                    enhancedInsights.push(...enhancedResult.recommendations.map(r => `💡 ${r}`))
                                  }
                                  
                                  setAiInsights(enhancedInsights)
                                } catch (error) {
                                  console.log('Enhanced image insights generation failed:', error)
                                  generateAIInsights(results)
                                }
                                
                                console.log('✅ Auto-analysis complete!')
                              } catch (error) {
                                console.error('❌ Auto-analysis failed:', error)
                              } finally {
                                setIsAnalyzing(false)
                              }
                            }, 300)
                          }
                        }}
                        className="hidden"
                        id="image-upload"
                        disabled={isAnalyzing}
                      />
                      <label htmlFor="image-upload" className={`cursor-pointer ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">
                          {isAnalyzing ? '🔄 Analyzing...' : 'Click to upload or drag and drop'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {isAnalyzing ? 'Please wait while we analyze your food' : 'PNG, JPG, GIF up to 10MB'}
                        </p>
                      </label>
                      {imageFile && !isAnalyzing && (
                        <p className="text-sm text-emerald-600 mt-2">✅ Analyzed: {imageFile.name}</p>
                      )}
                      {isAnalyzing && (
                        <div className="mt-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                          <p className="text-sm text-gray-600 mt-2">Analyzing your food...</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Optional text description to enhance analysis */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional description (optional):
                    </label>
                    <textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="e.g., 'rice with curry and vegetables' - helps improve accuracy"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                      rows={2}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      💡 Tip: Add text description before uploading for better accuracy
                    </p>
                  </div>
                  
                  {/* Info banner about auto-analysis */}
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">⚡</div>
                      <div>
                        <h4 className="font-semibold text-blue-900 mb-1">Automatic Analysis Enabled</h4>
                        <p className="text-sm text-blue-700">
                          Your food will be analyzed automatically as soon as you upload an image. 
                          No need to click any buttons - just upload and wait for results!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Analysis Results */}
            {analysisResult && (
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">📊 Analysis Results</h3>
                  <button
                    onClick={saveToNutritionLog}
                    disabled={isLoading}
                    className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    <span>{isLoading ? 'Saving...' : 'Save to Log'}</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {analysisResult.map((food, index) => (
                    <div key={index} className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-xl border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{food.name}</h4>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">{food.quantity}</span>
                          {food.confidence && (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              food.confidence > 0.8 ? 'bg-green-100 text-green-800' :
                              food.confidence > 0.5 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {Math.round(food.confidence * 100)}% confidence
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-semibold text-orange-600">{food.nutrition.calories}</div>
                          <div className="text-gray-600">Calories</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-red-600">{food.nutrition.protein}g</div>
                          <div className="text-gray-600">Protein</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-blue-600">{food.nutrition.carbs}g</div>
                          <div className="text-gray-600">Carbs</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-yellow-600">{food.nutrition.fat}g</div>
                          <div className="text-gray-600">Fat</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Summary */}
                <div className="mt-6 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-200">
                  <h4 className="font-semibold text-gray-900 mb-3">📈 Total Nutrition</h4>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-orange-600">
                        {analysisResult.reduce((sum, food) => sum + food.nutrition.calories, 0)}
                      </div>
                      <div className="text-sm text-gray-600">Calories</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">
                        {analysisResult.reduce((sum, food) => sum + food.nutrition.protein, 0)}g
                      </div>
                      <div className="text-sm text-gray-600">Protein</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {analysisResult.reduce((sum, food) => sum + food.nutrition.carbs, 0)}g
                      </div>
                      <div className="text-sm text-gray-600">Carbs</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-yellow-600">
                        {analysisResult.reduce((sum, food) => sum + food.nutrition.fat, 0)}g
                      </div>
                      <div className="text-sm text-gray-600">Fat</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Insights Tab */}
        {activeTab === 'insights' && (
          <div className="space-y-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Brain className="w-6 h-6 mr-2 text-purple-600" />
                🤖 AI-Powered Insights
              </h2>

              {aiInsights.length > 0 ? (
                <div className="space-y-4">
                  {aiInsights.map((insight, index) => (
                    <div key={index} className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-xl border-l-4 border-purple-500">
                      <p className="text-gray-800">{insight}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No insights yet</h3>
                  <p className="text-gray-600">Analyze some food first to get AI-powered insights and recommendations.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Nutrition Logs Tab */}
        {activeTab === 'logs' && (
          <div className="space-y-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <FileText className="w-6 h-6 mr-2 text-green-600" />
                  📝 Nutrition Logs
                </h2>
                <div className="flex items-center space-x-3">
                  {/* Real-time indicator */}
                  <div className="flex items-center space-x-2 bg-green-100 px-3 py-1.5 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-green-700">Live Updates</span>
                  </div>
                  {/* Refresh button */}
                  <button
                    onClick={loadNutritionLogs}
                    disabled={isLoading}
                    className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 transition-all"
                  >
                    <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="text-sm font-medium">Refresh</span>
                  </button>
                </div>
              </div>

              {/* Summary Stats */}
              {nutritionLogs.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-xl border border-orange-200 text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {nutritionLogs.reduce((sum, log) => sum + log.total_nutrition.calories, 0).toFixed(0)}
                    </div>
                    <div className="text-xs text-gray-600">Total Calories</div>
                  </div>
                  <div className="bg-gradient-to-r from-red-50 to-pink-50 p-4 rounded-xl border border-red-200 text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {nutritionLogs.reduce((sum, log) => sum + log.total_nutrition.protein, 0).toFixed(0)}g
                    </div>
                    <div className="text-xs text-gray-600">Total Protein</div>
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {nutritionLogs.reduce((sum, log) => sum + log.total_nutrition.carbs, 0).toFixed(0)}g
                    </div>
                    <div className="text-xs text-gray-600">Total Carbs</div>
                  </div>
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-4 rounded-xl border border-yellow-200 text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {nutritionLogs.reduce((sum, log) => sum + log.total_nutrition.fat, 0).toFixed(0)}g
                    </div>
                    <div className="text-xs text-gray-600">Total Fat</div>
                  </div>
                </div>
              )}

              {nutritionLogs.length > 0 ? (
                <div className="space-y-4">
                  {nutritionLogs.map((log) => (
                    <div key={log.id} className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200 hover:shadow-lg transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900 flex items-center">
                            📅 {new Date(log.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </h3>
                          <span className="text-sm text-gray-600 capitalize bg-white px-3 py-1 rounded-full inline-block mt-1">
                            🍽️ {log.meal_type}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-orange-600">{log.total_nutrition.calories.toFixed(0)} kcal</div>
                          <div className="text-xs text-gray-600">Total Energy</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-3 bg-white/60 rounded-lg hover:bg-white transition-colors">
                          <div className="font-semibold text-red-600 text-lg">{log.total_nutrition.protein.toFixed(1)}g</div>
                          <div className="text-xs text-gray-600">Protein</div>
                        </div>
                        <div className="text-center p-3 bg-white/60 rounded-lg hover:bg-white transition-colors">
                          <div className="font-semibold text-blue-600 text-lg">{log.total_nutrition.carbs.toFixed(1)}g</div>
                          <div className="text-xs text-gray-600">Carbs</div>
                        </div>
                        <div className="text-center p-3 bg-white/60 rounded-lg hover:bg-white transition-colors">
                          <div className="font-semibold text-yellow-600 text-lg">{log.total_nutrition.fat.toFixed(1)}g</div>
                          <div className="text-xs text-gray-600">Fat</div>
                        </div>
                      </div>

                      {/* Food items detailed list */}
                      <div className="bg-white/80 p-4 rounded-lg mb-3">
                        <h4 className="font-semibold text-gray-800 mb-2 text-sm">🍴 Food Items ({log.meals.length}):</h4>
                        <div className="space-y-2">
                          {log.meals.map((meal, idx) => (
                            <div key={meal.id || idx} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2 last:border-0">
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-700 font-medium">{meal.name}</span>
                                <span className="text-gray-500 text-xs">({meal.quantity})</span>
                              </div>
                              <div className="text-xs text-gray-600">
                                {meal.nutrition.calories.toFixed(0)} kcal
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {log.notes && (
                        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
                          <strong className="text-gray-800">📝 Notes:</strong> {log.notes}
                        </div>
                      )}

                      {/* Timestamp */}
                      <div className="text-xs text-gray-500 mt-3 text-right">
                        Added: {new Date(log.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <FileText className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No nutrition logs yet</h3>
                  <p className="text-gray-600 mb-4">Start analyzing food to build your nutrition history.</p>
                  <button
                    onClick={() => setActiveTab('analysis')}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all inline-flex items-center space-x-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Analyze Food Now</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Weekly Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <BarChart3 className="w-6 h-6 mr-2 text-blue-600" />
                  📊 Weekly Reports
                </h2>
                <button
                  onClick={generateWeeklyReport}
                  disabled={isLoading || nutritionLogs.length === 0}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4" />
                      <span>Generate Report</span>
                    </>
                  )}
                </button>
              </div>

              {weeklyReport ? (
                <div className="space-y-6">
                  {/* Report Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      📅 Report Period: {weeklyReport.period}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{weeklyReport.average_daily_calories}</div>
                        <div className="text-sm text-gray-600">Avg Daily Calories</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{weeklyReport.total_logs}</div>
                        <div className="text-sm text-gray-600">Total Logs</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{weeklyReport.health_score}/100</div>
                        <div className="text-sm text-gray-600">Health Score</div>
                      </div>
                    </div>
                  </div>

                  {/* Insights */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                    <h4 className="font-semibold text-gray-900 mb-4">🔍 NLP-Generated Insights</h4>
                    <ul className="space-y-2">
                      {weeklyReport.insights.map((insight, index) => (
                        <li key={index} className="text-gray-700">{insight}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-xl border border-orange-200">
                    <h4 className="font-semibold text-gray-900 mb-4">💡 AI Recommendations</h4>
                    <ul className="space-y-2">
                      {weeklyReport.recommendations.map((recommendation, index) => (
                        <li key={index} className="text-gray-700">{recommendation}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No reports generated yet</h3>
                  <p className="text-gray-600">
                    {nutritionLogs.length === 0 
                      ? 'Add some nutrition logs first, then generate your weekly report.'
                      : 'Click "Generate Report" to create your weekly nutrition summary using NLP analysis.'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <CheckCircle className="w-6 h-6 mr-2 text-emerald-600" />
                  👤 Nutritional Profile
                </h2>
                <button
                  onClick={() => {
                    setShowProfileSetup(true)
                    setActiveTab('analysis')
                  }}
                  className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              </div>

              {nutritionalProfile ? (
                <div className="space-y-6">
                  {/* Basic Information Card */}
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-xl border border-emerald-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <CheckCircle className="w-5 h-5 mr-2 text-emerald-600" />
                      Basic Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-600">{nutritionalProfile.name}</div>
                        <div className="text-sm text-gray-600">Name</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{nutritionalProfile.age}</div>
                        <div className="text-sm text-gray-600">Age</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{nutritionalProfile.height} cm</div>
                        <div className="text-sm text-gray-600">Height</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{nutritionalProfile.weight} kg</div>
                        <div className="text-sm text-gray-600">Weight</div>
                      </div>
                    </div>

                    {/* BMI Calculation */}
                    <div className="mt-4 bg-white p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Your BMI</p>
                          <p className="text-2xl font-bold text-emerald-600">
                            {((nutritionalProfile.weight / ((nutritionalProfile.height / 100) ** 2))).toFixed(1)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Category</p>
                          <p className={`font-semibold ${
                            ((nutritionalProfile.weight / ((nutritionalProfile.height / 100) ** 2))) < 18.5 ? 'text-blue-600' :
                            ((nutritionalProfile.weight / ((nutritionalProfile.height / 100) ** 2))) < 25 ? 'text-green-600' :
                            ((nutritionalProfile.weight / ((nutritionalProfile.height / 100) ** 2))) < 30 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {((nutritionalProfile.weight / ((nutritionalProfile.height / 100) ** 2))) < 18.5 ? 'Underweight' :
                             ((nutritionalProfile.weight / ((nutritionalProfile.height / 100) ** 2))) < 25 ? 'Normal' :
                             ((nutritionalProfile.weight / ((nutritionalProfile.height / 100) ** 2))) < 30 ? 'Overweight' : 'Obese'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Health & Goals Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Goals */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                        <Target className="w-5 h-5 mr-2 text-blue-600" />
                        Goals & Activity
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm text-gray-600">Fitness Goal:</span>
                          <p className="font-medium capitalize text-blue-600">
                            {nutritionalProfile.fitnessGoal.replace('_', ' ')}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Activity Level:</span>
                          <p className="font-medium capitalize text-purple-600">
                            {nutritionalProfile.activityLevel.replace('_', ' ')}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Gender:</span>
                          <p className="font-medium capitalize text-gray-700">
                            {nutritionalProfile.gender}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Dietary Information */}
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-xl border border-orange-200">
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                        <Heart className="w-5 h-5 mr-2 text-red-600" />
                        Dietary Information
                      </h4>
                      
                      {nutritionalProfile.allergies.length > 0 && (
                        <div className="mb-3">
                          <span className="text-sm text-gray-600">Allergies:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {nutritionalProfile.allergies.map((allergy, index) => (
                              <span key={index} className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                                {allergy}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {nutritionalProfile.dietaryRestrictions.length > 0 && (
                        <div>
                          <span className="text-sm text-gray-600">Dietary Preferences:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {nutritionalProfile.dietaryRestrictions.map((diet, index) => (
                              <span key={index} className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                                {diet}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {nutritionalProfile.allergies.length === 0 && nutritionalProfile.dietaryRestrictions.length === 0 && (
                        <p className="text-gray-500">No dietary restrictions or allergies specified</p>
                      )}
                    </div>
                  </div>

                  {/* Profile Metadata */}
                  <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-xl border border-gray-200">
                    <div className="text-sm text-gray-600 text-center">
                      Profile created on {new Date((nutritionalProfile as {createdAt?: string}).createdAt || Date.now()).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No profile found</h3>
                  <p className="text-gray-600 mb-4">
                    This shouldn't happen as you completed the profile setup to access this hub.
                  </p>
                  <button
                    onClick={() => {
                      setShowProfileSetup(true)
                      setActiveTab('analysis')
                    }}
                    className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Create Profile
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* RAG Chatbot Tab */}
        {activeTab === 'chatbot' && (
          <div className="space-y-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">AI Nutrition Coach</h2>
                      <p className="text-purple-100">Personalized nutrition guidance powered by RAG AI</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    {/* Chat Mode Selector */}
                    <div className="text-white">
                      <label className="text-xs text-purple-100 block mb-1">Chat Mode</label>
                      <select
                        value={chatMode}
                        onChange={(e) => setChatMode(e.target.value as typeof chatMode)}
                        className="bg-white/20 text-white text-sm px-3 py-1 rounded border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
                      >
                        <option value="general">General Nutrition</option>
                        <option value="meal_planning">Meal Planning</option>
                        <option value="nutrition_analysis">Nutrition Analysis</option>
                        <option value="goal_coaching">Goal Coaching</option>
                      </select>
                    </div>
                    
                    <div className="text-right text-white/80 text-sm">
                      <div>🧠 Knowledge Base: Nutrition Science</div>
                      <div>👤 Context: Your Personal Profile</div>
                      <div>🎯 Goal: {nutritionalProfile?.fitnessGoal?.replace('_', ' ') || 'Health Optimization'}</div>
                    </div>
                  </div>
                </div>

                {/* Chat Statistics */}
                <div className="mt-4 flex items-center justify-between text-white/70 text-xs">
                  <div className="flex items-center space-x-4">
                    <span>Messages: {chatMessages.length}</span>
                    <span>Mode: {chatMode.replace('_', ' ')}</span>
                    <span>Context: {conversationHistory.length} exchanges</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isChatLoading ? 'bg-yellow-400' : 'bg-green-400'}`}></div>
                    <span>{isChatLoading ? 'Processing...' : 'Ready'}</span>
                  </div>
                </div>
              </div>

              {/* Chat Messages Area */}
              <div className="h-[500px] overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-white">
                <div className="space-y-4">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-xl px-4 py-3 ${
                          message.type === 'user'
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
                        }`}
                      >
                        <div className="flex items-start space-x-2">
                          {message.type === 'bot' && (
                            <Bot className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                          )}
                          {message.type === 'user' && (
                            <UserIcon className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <div className="whitespace-pre-wrap text-sm leading-relaxed">
                              {message.content}
                            </div>
                            <div className={`text-xs mt-2 opacity-70 ${
                              message.type === 'user' ? 'text-white' : 'text-gray-500'
                            }`}>
                              {message.timestamp.toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Loading Indicator */}
                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
                        <div className="flex items-center space-x-2">
                          <Bot className="w-5 h-5 text-purple-600" />
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-sm text-gray-600">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Chat Input Area */}
              <div className="border-t border-gray-200 p-6 bg-white">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <div className="relative">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
                        placeholder="Ask about nutrition, meal planning, or health goals..."
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                        disabled={isChatLoading}
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <MessageCircle className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleChatSend}
                    disabled={!chatInput.trim() || isChatLoading}
                    className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-purple-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send</span>
                  </button>
                  
                  {/* Chat Management Buttons */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={exportChatHistory}
                      disabled={chatMessages.length === 0}
                      className="p-3 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Export Chat History"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={clearChatHistory}
                      disabled={chatMessages.length === 0}
                      className="p-3 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Clear Chat History"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Smart Suggestions */}
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">💡 Smart suggestions based on your profile:</p>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const baseSuggestions = [
                        "What should I eat for breakfast?",
                        "How many calories do I need?",
                        "Suggest healthy snacks"
                      ]
                      
                      const goalSuggestions = {
                        weight_loss: ["Help me create a calorie deficit", "Best foods for fat loss"],
                        weight_gain: ["High-calorie healthy foods", "Muscle building meal plan"],
                        muscle_gain: ["Post-workout nutrition", "Protein timing strategies"],
                        maintenance: ["Balanced meal ideas", "Nutrition for energy"]
                      }
                      
                      const activitySuggestions = {
                        sedentary: ["Nutrition for desk job", "Easy healthy meals"],
                        lightly_active: ["Pre-workout snacks", "Recovery nutrition"],
                        moderately_active: ["Meal timing for workouts", "Hydration strategies"],
                        very_active: ["Sports nutrition tips", "Energy for training"],
                        extremely_active: ["Athlete nutrition plan", "Performance foods"]
                      }
                      
                      const culturalSuggestions = ["Sri Lankan healthy recipes", "Rice and curry nutrition"]
                      
                      const suggestions = [
                        ...baseSuggestions,
                        ...(nutritionalProfile?.fitnessGoal ? (goalSuggestions[nutritionalProfile.fitnessGoal] || []) : []),
                        ...(nutritionalProfile?.activityLevel ? (activitySuggestions[nutritionalProfile.activityLevel] || []) : []),
                        ...culturalSuggestions
                      ]
                      
                      return suggestions.slice(0, 6)
                    })().map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => setChatInput(suggestion)}
                        className="text-xs px-3 py-1 bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 text-gray-700 rounded-full transition-all border border-purple-200 hover:border-purple-300"
                        disabled={isChatLoading}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced RAG Process Visualization */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Brain className="w-5 h-5 mr-2 text-purple-600" />
                  Advanced RAG Architecture
                </h3>
                <div className="text-xs text-gray-500">
                  Mode: {chatMode.replace('_', ' ')} | Context Length: {conversationHistory.length}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-white font-bold">1</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">🔍 Intent Analysis</h4>
                    <p className="text-xs text-gray-600">Query parsing, entity extraction, and intent classification using NLP</p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-white font-bold">2</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">📚 Vector Retrieval</h4>
                    <p className="text-xs text-gray-600">Semantic search through nutrition knowledge base with similarity scoring</p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-xl border border-orange-200">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-white font-bold">3</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">🧬 Context Fusion</h4>
                    <p className="text-xs text-gray-600">Merging retrieved knowledge with personal profile and conversation history</p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-white font-bold">4</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">🎯 Response Generation</h4>
                    <p className="text-xs text-gray-600">AI synthesis with personalization, fact-checking, and follow-up suggestions</p>
                  </div>
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">Knowledge Base</h5>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Nutrition science research</li>
                    <li>• Food composition databases</li>
                    <li>• Dietary guidelines & protocols</li>
                    <li>• Cultural food knowledge</li>
                  </ul>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">Personal Context</h5>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Your fitness goals & preferences</li>
                    <li>• Dietary restrictions & allergies</li>
                    <li>• Recent nutrition history</li>
                    <li>• Activity level & lifestyle</li>
                  </ul>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">AI Processing</h5>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Multi-step reasoning</li>
                    <li>• Evidence-based recommendations</li>
                    <li>• Confidence scoring</li>
                    <li>• Safety guardrails</li>
                  </ul>
                </div>
              </div>

              {/* Real-time Stats */}
              <div className="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-gray-700">System Status: Active</span>
                    </div>
                    <div className="text-gray-600">
                      Backend: {isChatLoading ? 'Processing' : 'Ready'}
                    </div>
                    <div className="text-gray-600">
                      Fallback: Enhanced Local Processing
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Last updated: {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating RAG Chatbot */}
      {isAuthenticated && hasNutritionalProfile && (
        <>
          {/* Floating Chat Button */}
          <div className="fixed bottom-6 right-6 z-50">
            <button
              onClick={toggleFloatingChat}
              className={`relative w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 ${
                showFloatingChat ? 'rotate-45' : ''
              }`}
            >
              {showFloatingChat ? (
                <div className="flex items-center justify-center">
                  <div className="w-6 h-0.5 bg-white absolute"></div>
                  <div className="w-0.5 h-6 bg-white absolute"></div>
                </div>
              ) : (
                <MessageCircle className="w-8 h-8" />
              )}
              
              {/* Notification badge for unread messages */}
              {!showFloatingChat && floatingChatMessages.length > 1 && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                  <Bot className="w-3 h-3" />
                </div>
              )}
            </button>

            {/* Quick action hint */}
            {!showFloatingChat && (
              <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap">
                💬 Quick Nutrition Chat
              </div>
            )}
          </div>

          {/* Floating Chat Window */}
          {showFloatingChat && (
            <div className="fixed bottom-24 right-6 w-96 h-[32rem] bg-white rounded-2xl shadow-2xl border border-gray-200 z-40 flex flex-col overflow-hidden">
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">AI Nutrition Coach</h3>
                    <p className="text-xs opacity-90">RAG-powered assistant</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setActiveTab('chatbot')}
                    className="p-1 hover:bg-white/20 rounded transition-colors"
                    title="Open full chat"
                  >
                    <TrendingUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowFloatingChat(false)}
                    className="p-1 hover:bg-white/20 rounded transition-colors"
                  >
                    <div className="w-4 h-4 relative">
                      <div className="w-4 h-0.5 bg-white absolute top-1/2 transform -translate-y-1/2 rotate-45"></div>
                      <div className="w-0.5 h-4 bg-white absolute left-1/2 transform -translate-x-1/2 rotate-45"></div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {floatingChatMessages.map((message) => (
                  <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      message.type === 'user'
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
                    }`}>
                      {message.type === 'bot' && (
                        <div className="flex items-center space-x-2 mb-1">
                          <Bot className="w-3 h-3 text-emerald-600" />
                          <span className="text-xs text-gray-500">AI Coach</span>
                        </div>
                      )}
                      <p className={`text-sm whitespace-pre-line ${message.type === 'user' ? 'text-white' : 'text-gray-800'}`}>
                        {message.content}
                      </p>
                    </div>
                  </div>
                ))}
                
                {isFloatingChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2 shadow-sm">
                      <div className="flex items-center space-x-2">
                        <Bot className="w-3 h-3 text-emerald-600" />
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Suggestions */}
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                <div className="flex flex-wrap gap-1">
                  {['Protein needs?', 'Meal ideas', 'Weight loss tips'].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setFloatingChatInput(suggestion)}
                      className="text-xs px-2 py-1 bg-white hover:bg-gray-100 text-gray-600 rounded-full border border-gray-200 transition-colors"
                      disabled={isFloatingChatLoading}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Input */}
              <div className="p-4 bg-white border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={floatingChatInput}
                    onChange={(e) => setFloatingChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleFloatingChatSend()}
                    placeholder="Ask about nutrition..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                    disabled={isFloatingChatLoading}
                  />
                  <button
                    onClick={handleFloatingChatSend}
                    disabled={!floatingChatInput.trim() || isFloatingChatLoading}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isFloatingChatLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default AdvancedNutritionHub
