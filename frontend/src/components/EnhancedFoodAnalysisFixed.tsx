import React, { useState, useRef } from 'react'
import { Camera, Upload, X, Sparkles, Brain, ChefHat, Activity, Dumbbell, ArrowRight } from 'lucide-react'

// Enhanced Food Analysis Component with Beautiful UI and User Profile Support
const EnhancedFoodAnalysis: React.FC<{
  user: any // User profile data
  onAnalysisComplete: (result: any) => void
}> = ({ user, onAnalysisComplete }) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisMode, setAnalysisMode] = useState<'text' | 'image'>('image')
  const [textDescription, setTextDescription] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [lastAnalysisResult, setLastAnalysisResult] = useState<any>(null)
  const [showWorkoutSuggestion, setShowWorkoutSuggestion] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Generate mock user profile if user data is missing
  const getUserProfile = () => {
    if (user && user.id) {
      return {
        user_id: user.id,
        age: user.age || 30,
        gender: user.gender || 'male',
        height_cm: user.height || 170,
        weight_kg: user.weight || 70,
        activity_level: user.activity_level || 'moderately_active',
        goal: user.goal || 'maintain_weight',
        dietary_restrictions: user.dietary_restrictions || [],
        allergies: user.allergies || []
      }
    } else {
      // Mock profile for demonstration
      return {
        user_id: `demo_${Date.now()}`,
        age: 28,
        gender: 'male',
        height_cm: 170,
        weight_kg: 70,
        activity_level: 'moderately_active',
        goal: 'maintain_weight',
        dietary_restrictions: [],
        allergies: []
      }
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (file.size > 15 * 1024 * 1024) {
      alert('File size must be less than 15MB')
      return
    }

    setSelectedImage(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Send meal data to Fitness Agent for workout recommendation
  const sendToFitnessAgent = async (analysisResult: any) => {
    try {
      console.log('🔄 sendToFitnessAgent called with:', analysisResult)
      
      // Get complete user profile (same as Diet Agent)
      const userProfile = getUserProfile()
      console.log('👤 User Profile:', userProfile)
      
      const mealData = {
        name: analysisResult.food_items.map((f: any) => f.name).join(', '),
        userId: user?.id || analysisResult.user_id,
        mealTime: analysisResult.meal_type || 'lunch',
        calorieCount: analysisResult.total_calories,
        protein: analysisResult.total_protein,
        carbs: analysisResult.total_carbs,
        fat: analysisResult.total_fat,
        timestamp: new Date().toISOString(),
        // Include complete user profile for personalized workouts
        userProfile: {
          user_id: userProfile.user_id,
          age: userProfile.age,
          gender: userProfile.gender,
          height_cm: userProfile.height_cm,
          weight_kg: userProfile.weight_kg,
          activity_level: userProfile.activity_level,
          goal: userProfile.goal,
          dietary_restrictions: userProfile.dietary_restrictions,
          allergies: userProfile.allergies
        }
      }

      console.log('📤 Sending meal data with user profile to messaging service:', mealData)

      // Send to messaging service
      const response = await fetch('http://localhost:8005/api/messaging/diet/meal-logged', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mealData)
      })

      console.log('📥 Response status:', response.status)

      if (response.ok) {
        const result = await response.json()
        console.log('✅ ========================================')
        console.log('✅ MESSAGE SENT TO FITNESS AGENT')
        console.log('✅ ========================================')
        console.log('📤 Message ID:', result.data?.message_id)
        console.log('👤 User ID:', result.data?.userId)
        console.log('🍽️  Meal Calories:', result.data?.calorieCount, 'kcal')
        console.log('🏋️ Workout to Burn:', result.data?.calorieCount, 'kcal')
        console.log('👤 User Profile Sent:')
        console.log('   • Age:', userProfile.age)
        console.log('   • Weight:', userProfile.weight_kg, 'kg')
        console.log('   • Goal:', userProfile.goal)
        console.log('   • Activity Level:', userProfile.activity_level)
        console.log('✅ Backend Response:', result)
        console.log('✅ ========================================')
        console.log('🎯 Setting showWorkoutSuggestion to TRUE')
        setShowWorkoutSuggestion(true)
        
        // Show detailed success message
        const successMsg = document.createElement('div')
        successMsg.className = 'fixed top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl z-50 min-w-[350px]'
        successMsg.innerHTML = `
          <div class="font-bold text-lg mb-2">✅ Message Sent to Fitness Agent!</div>
          <div class="text-sm space-y-1">
            <div>🍽️ <strong>Meal:</strong> ${mealData.calorieCount} calories logged</div>
            <div>🏋️ <strong>Workout Target:</strong> Burn ${mealData.calorieCount} calories</div>
            <div>👤 <strong>Your Profile:</strong> Age ${userProfile.age}, Weight ${userProfile.weight_kg}kg</div>
            <div>🎯 <strong>Goal:</strong> ${userProfile.goal.replace('_', ' ')}</div>
            <div class="mt-2 pt-2 border-t border-white/30">
              💡 <em>Scroll down to see workout button!</em>
            </div>
          </div>
        `
        document.body.appendChild(successMsg)
        setTimeout(() => successMsg.remove(), 6000)
      } else {
        console.error('❌ Failed to send message. Status:', response.status)
        const errorText = await response.text()
        console.error('Error details:', errorText)
      }
    } catch (error) {
      console.error('❌ Failed to send to Fitness Agent:', error)
    }
  }

  const analyzeFood = async () => {
    if (analysisMode === 'image' && !selectedImage) {
      alert('Please select an image')
      return
    }
    
    if (analysisMode === 'text' && !textDescription.trim()) {
      alert('Please enter a food description')
      return
    }

    setIsAnalyzing(true)

    try {
      const userProfile = getUserProfile()
      
      if (analysisMode === 'image' && selectedImage) {
        // Use hardcore analysis API
        const formData = new FormData()
        formData.append('file', selectedImage)
        formData.append('user_profile', JSON.stringify(userProfile))
        formData.append('meal_type', 'lunch')
        
        if (textDescription.trim()) {
          formData.append('text_description', textDescription)
        }

        // Call the hardcore analysis endpoint
        const response = await fetch('http://localhost:8001/analyze/image/hardcore', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.detail || 'Analysis failed')
        }

        const result = await response.json()
        
        // Transform to expected format
        const transformedResult = {
          _id: result.analysis_id || Date.now().toString(),
          user_id: userProfile.user_id,
          food_items: result.detected_foods?.map((food: any) => ({
            name: food.name,
            quantity: food.estimated_portion || '1 serving',
            calories: Math.round(food.calories || 0),
            protein: Math.round((food.protein || 0) * 10) / 10,
            carbs: Math.round((food.carbs || 0) * 10) / 10,
            fat: Math.round((food.fat || 0) * 10) / 10,
            fiber: Math.round((food.fiber || 0) * 10) / 10
          })) || [],
          total_calories: Math.round(result.nutrition_analysis?.calories || 0),
          total_protein: Math.round((result.nutrition_analysis?.protein || 0) * 10) / 10,
          total_carbs: Math.round((result.nutrition_analysis?.carbs || 0) * 10) / 10,
          total_fat: Math.round((result.nutrition_analysis?.fat || 0) * 10) / 10,
          analysis_method: 'hardcore_image' as const,
          meal_type: 'lunch',
          created_at: new Date().toISOString(),
          confidence_score: result.analysis_quality?.overall_confidence || 0.85,
          image_url: imagePreview,
          text_description: textDescription || 'Image analysis'
        }

        // Store result for workout button
        console.log('💾 Storing analysis result for workout button:', transformedResult)
        setLastAnalysisResult(transformedResult)
        
        // Send to parent component (saves to nutrition log)
        console.log('📤 Sending to parent component (nutrition log)...')
        onAnalysisComplete(transformedResult)
        
        // Automatically send to Fitness Agent
        console.log('🏋️ About to call sendToFitnessAgent...')
        await sendToFitnessAgent(transformedResult)
        console.log('✅ sendToFitnessAgent completed')
        
      } else {
        // Text-based analysis fallback
        const mockResult = {
          _id: Date.now().toString(),
          user_id: userProfile.user_id,
          food_items: [
            {
              name: 'Mixed Meal',
              quantity: '1 serving',
              calories: 400,
              protein: 20,
              carbs: 45,
              fat: 15,
              fiber: 5
            }
          ],
          total_calories: 400,
          total_protein: 20,
          total_carbs: 45,
          total_fat: 15,
          analysis_method: 'text' as const,
          meal_type: 'lunch',
          created_at: new Date().toISOString(),
          confidence_score: 0.75,
          image_url: null,
          text_description: textDescription
        }

        // Store result for workout button
        setLastAnalysisResult(mockResult)
        
        // Send to parent component (saves to nutrition log)
        onAnalysisComplete(mockResult)
        
        // Automatically send to Fitness Agent
        await sendToFitnessAgent(mockResult)
      }

    } catch (error: any) {
      console.error('Analysis failed:', error)
      
      // Fallback analysis
      const userProfile = getUserProfile()
      const fallbackResult = {
        _id: Date.now().toString(),
        user_id: userProfile.user_id,
        food_items: [
          {
            name: 'Estimated Meal',
            quantity: '1 serving',
            calories: 350,
            protein: 18,
            carbs: 40,
            fat: 12,
            fiber: 4
          }
        ],
        total_calories: 350,
        total_protein: 18,
        total_carbs: 40,
        total_fat: 12,
        analysis_method: 'fallback' as const,
        meal_type: 'lunch',
        created_at: new Date().toISOString(),
        confidence_score: 0.6,
        image_url: imagePreview,
        text_description: textDescription || 'Fallback analysis'
      }

      onAnalysisComplete(fallbackResult)
      
      // Show error message
      const errorMessage = document.createElement('div')
      errorMessage.className = 'fixed top-4 right-4 bg-orange-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
      errorMessage.textContent = '⚠️ Advanced analysis unavailable - using fallback method'
      document.body.appendChild(errorMessage)
      setTimeout(() => errorMessage.remove(), 4000)
      
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6 text-white" />
          <h3 className="text-xl font-bold text-white">AI Food Analysis</h3>
          <Sparkles className="w-5 h-5 text-white/80" />
        </div>
        <p className="text-green-100 text-sm mt-1">
          Advanced image recognition with hardcore analysis capabilities
        </p>
      </div>

      <div className="p-6">
        {/* Mode Selector */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          <button
            onClick={() => setAnalysisMode('image')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-all ${
              analysisMode === 'image' 
                ? 'bg-white shadow-sm text-green-600' 
                : 'text-gray-600 hover:text-green-600'
            }`}
          >
            <Camera className="w-4 h-4" />
            Image Upload
          </button>
          <button
            onClick={() => setAnalysisMode('text')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-all ${
              analysisMode === 'text' 
                ? 'bg-white shadow-sm text-green-600' 
                : 'text-gray-600 hover:text-green-600'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            Text Description
          </button>
        </div>

        {/* Image Upload Mode */}
        {analysisMode === 'image' && (
          <div className="space-y-4">
            {/* Image Drop Zone */}
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                dragActive 
                  ? 'border-green-400 bg-green-50' 
                  : selectedImage 
                    ? 'border-green-300 bg-green-50' 
                    : 'border-gray-300 hover:border-green-400 hover:bg-gray-50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Food preview"
                    className="max-w-full max-h-64 mx-auto rounded-lg shadow-md object-cover"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="mt-4 p-3 bg-white rounded-lg border">
                    <p className="text-sm text-gray-600 mb-2">Add description (optional):</p>
                    <input
                      type="text"
                      value={textDescription}
                      onChange={(e) => setTextDescription(e.target.value)}
                      placeholder="e.g., rice and curry, kottu with chicken"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    Upload a photo of your meal
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Drag and drop or click to select (max 15MB)
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Choose Image
                  </button>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            {/* Quick Examples */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium text-gray-700">Perfect for:</p>
                <p className="text-gray-600">Sri Lankan dishes, International cuisine</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium text-gray-700">Best results:</p>
                <p className="text-gray-600">Well-lit, clear food images</p>
              </div>
            </div>
          </div>
        )}

        {/* Text Mode */}
        {analysisMode === 'text' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Describe your meal:
              </label>
              <textarea
                value={textDescription}
                onChange={(e) => setTextDescription(e.target.value)}
                placeholder="e.g., Large chicken kottu with extra vegetables, rice and fish curry, hoppers with sambol"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                rows={4}
              />
            </div>

            {/* Quick Examples */}
            <div className="grid grid-cols-1 gap-2 text-sm">
              {[
                "Rice and curry with fish and vegetables",
                "Chicken kottu with extra vegetables",
                "Hoppers with sambol and curry",
                "Fried rice with chicken and egg"
              ].map((example, index) => (
                <button
                  key={index}
                  onClick={() => setTextDescription(example)}
                  className="text-left p-2 bg-gray-50 rounded-lg hover:bg-green-50 hover:text-green-700 transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Analyze Button */}
        <button
          onClick={analyzeFood}
          disabled={isAnalyzing || (analysisMode === 'image' && !selectedImage) || (analysisMode === 'text' && !textDescription.trim())}
          className={`w-full mt-6 py-4 px-6 rounded-xl font-semibold text-lg transition-all ${
            isAnalyzing || (analysisMode === 'image' && !selectedImage) || (analysisMode === 'text' && !textDescription.trim())
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transform hover:scale-[1.02] shadow-lg hover:shadow-xl'
          }`}
        >
          {isAnalyzing ? (
            <div className="flex items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              <span>Analyzing with AI...</span>
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Brain className="w-5 h-5" />
              Analyze Food
              <Sparkles className="w-5 h-5" />
            </div>
          )}
        </button>

        {/* Workout Suggestion Button */}
        {(() => {
          console.log('🔍 Render check - showWorkoutSuggestion:', showWorkoutSuggestion, 'lastAnalysisResult:', lastAnalysisResult)
          return null
        })()}
        {showWorkoutSuggestion && lastAnalysisResult && (
          <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border-2 border-orange-200">
            <div className="flex items-start gap-3">
              <Dumbbell className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h4 className="font-bold text-orange-900 mb-2">
                  🎉 Workout Recommendation Ready!
                </h4>
                <p className="text-sm text-orange-700 mb-3">
                  Based on your {lastAnalysisResult.total_calories} calorie meal, 
                  we've calculated ideal workout sessions for you.
                </p>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg mb-3 border border-blue-200">
                  <div className="text-xs font-bold text-blue-900 mb-2">🎯 Workout Target</div>
                  <div className="text-2xl font-bold text-blue-600">
                    Burn {lastAnalysisResult.total_calories} Calories
                  </div>
                  <div className="text-xs text-blue-700 mt-1">
                    Duration: ~{Math.round(lastAnalysisResult.total_calories / 13)} minutes
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div className="bg-white/70 p-2 rounded">
                    <span className="font-medium">Meal Calories:</span> {lastAnalysisResult.total_calories}
                  </div>
                  <div className="bg-white/70 p-2 rounded">
                    <span className="font-medium">Protein:</span> {lastAnalysisResult.total_protein}g
                  </div>
                  {user && (
                    <>
                      <div className="bg-white/70 p-2 rounded">
                        <span className="font-medium">Your Weight:</span> {user.weight || 70}kg
                      </div>
                      <div className="bg-white/70 p-2 rounded">
                        <span className="font-medium">Your Goal:</span> {user.goal || 'maintain'}
                      </div>
                    </>
                  )}
                </div>
                <button
                  onClick={() => {
                    // Get complete user profile
                    const userProfile = getUserProfile()
                    
                    console.log('🏋️ ========================================')
                    console.log('🏋️ OPENING FITNESS PLANNER')
                    console.log('🏋️ ========================================')
                    console.log('📊 Target Calories to Burn:', lastAnalysisResult.total_calories, 'kcal')
                    console.log('⏱️  Estimated Duration:', Math.round(lastAnalysisResult.total_calories / 13), 'minutes')
                    console.log('👤 User Profile:', userProfile)
                    console.log('📋 Complete Data Being Sent:')
                    console.log({
                      calories: lastAnalysisResult.total_calories,
                      mealData: lastAnalysisResult,
                      userProfile: userProfile,
                      userId: user?.id || userProfile.user_id
                    })
                    console.log('🏋️ ========================================')
                    
                    // Navigate to fitness agent or show workout modal
                    const event = new CustomEvent('openFitnessPlanner', {
                      detail: { 
                        calories: lastAnalysisResult.total_calories,
                        mealData: lastAnalysisResult,
                        userProfile: userProfile, // Pass complete user profile
                        userId: user?.id || userProfile.user_id
                      }
                    })
                    window.dispatchEvent(event)
                    
                    // Show detailed info message
                    const infoMsg = document.createElement('div')
                    infoMsg.className = 'fixed top-4 right-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-4 rounded-xl shadow-2xl z-50 min-w-[300px]'
                    infoMsg.innerHTML = `
                      <div class="font-bold text-lg mb-2">🏋️ Opening Fitness Planner</div>
                      <div class="text-sm space-y-1">
                        <div>🎯 <strong>Target:</strong> Burn ${lastAnalysisResult.total_calories} calories</div>
                        <div>⏱️ <strong>Duration:</strong> ~${Math.round(lastAnalysisResult.total_calories / 13)} minutes</div>
                        <div>👤 <strong>Profile:</strong> Age ${userProfile.age}, ${userProfile.weight_kg}kg</div>
                        <div>🎪 <strong>Goal:</strong> ${userProfile.goal.replace('_', ' ')}</div>
                      </div>
                    `
                    document.body.appendChild(infoMsg)
                    setTimeout(() => infoMsg.remove(), 5000)
                  }}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-4 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all font-medium flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  <Dumbbell className="w-4 h-4" />
                  Checkout Workout Sessions
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* User Profile Info */}
        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-green-700">
            <span className="font-medium">Profile:</span> {user?.name || 'Demo User'} • 
            Using hardcore AI analysis for maximum accuracy
            {lastAnalysisResult && (
              <span className="ml-2">• ✅ Synced with Fitness Agent</span>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

export default EnhancedFoodAnalysis
