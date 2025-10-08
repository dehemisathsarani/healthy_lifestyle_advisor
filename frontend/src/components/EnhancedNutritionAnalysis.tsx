// Enhanced Nutrition Analysis Component with Advanced Food Recognition
import React, { useState, useCallback } from 'react'
import { Camera, FileText, Brain, TrendingUp } from 'lucide-react'
import EnhancedAdvancedFoodAnalysisService from '../services/enhancedAdvancedFoodAnalysis'
import type { EnhancedNutritionAnalysis, EnhancedFoodItem } from '../services/enhancedAdvancedFoodAnalysis'

interface EnhancedNutritionAnalysisProps {
  onAnalysisComplete?: (analysis: EnhancedNutritionAnalysis) => void
  userProfile?: any
}

export const EnhancedNutritionAnalysisComponent: React.FC<EnhancedNutritionAnalysisProps> = ({ 
  onAnalysisComplete, 
  userProfile 
}) => {
  const [analysisMode, setAnalysisMode] = useState<'text' | 'image'>('text')
  const [textInput, setTextInput] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<EnhancedNutritionAnalysis | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Initialize enhanced food analysis service with user-specified-only foods
  const enhancedFoodAnalysis = EnhancedAdvancedFoodAnalysisService.getInstance({
    showOnlyUserSpecifiedFoods: true,
    enableFallbackEstimation: false
  })

  // Handle file selection
  const handleImageSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  // Enhanced food analysis
  const handleAnalysis = useCallback(async () => {
    if (!textInput.trim() && !imageFile) return

    setIsAnalyzing(true)
    try {
      const analysisInput = {
        text: analysisMode === 'text' ? textInput : undefined,
        imageFile: analysisMode === 'image' && imageFile ? imageFile : undefined,
        userContext: {
          profile: userProfile,
          preferences: userProfile?.dietaryRestrictions || [],
          allergies: userProfile?.allergies || []
        },
        realTimeMode: true
      }

      console.log('🔍 Starting enhanced food analysis...')
      const result = await enhancedFoodAnalysis.analyzeFood(analysisInput)
      
      console.log('✅ Enhanced analysis complete:', {
        foodsDetected: result.foodItems.length,
        confidence: result.confidence,
        method: result.analysisMethod,
        healthScore: result.healthScore,
        balanceScore: result.balanceScore
      })

      setAnalysisResult(result)
      onAnalysisComplete?.(result)

    } catch (error) {
      console.error('❌ Enhanced analysis failed:', error)
      // You could add error state here
    } finally {
      setIsAnalyzing(false)
    }
  }, [analysisMode, textInput, imageFile, userProfile, enhancedFoodAnalysis, onAnalysisComplete])

  // Calculate total nutrition
  const calculateTotalNutrition = (foods: EnhancedFoodItem[]) => {
    const totals = foods.reduce((total, food) => ({
      calories: total.calories + food.calories,
      protein: total.protein + food.protein,
      carbs: total.carbs + food.carbs,
      fat: total.fat + food.fat,
      fiber: total.fiber + food.fiber,
      sodium: total.sodium + food.sodium,
      sugar: total.sugar + food.sugar
    }), {
      calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0, sugar: 0
    })

    // Calculate total vitamins and minerals
    const totalVitamins: {[key: string]: number} = {}
    const totalMinerals: {[key: string]: number} = {}

    foods.forEach(food => {
      if (food.vitamins) {
        Object.entries(food.vitamins).forEach(([vitamin, value]) => {
          totalVitamins[vitamin] = (totalVitamins[vitamin] || 0) + Number(value)
        })
      }
      if (food.minerals) {
        Object.entries(food.minerals).forEach(([mineral, value]) => {
          totalMinerals[mineral] = (totalMinerals[mineral] || 0) + Number(value)
        })
      }
    })

    return { ...totals, vitamins: totalVitamins, minerals: totalMinerals }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
          <Brain className="mr-3 text-blue-600" />
          Enhanced Food Analysis
        </h2>
        
        {/* Analysis Mode Selector */}
        <div className="flex space-x-4 mb-4">
          <button
            onClick={() => setAnalysisMode('text')}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
              analysisMode === 'text'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FileText className="mr-2 h-4 w-4" />
            Text Description
          </button>
          <button
            onClick={() => setAnalysisMode('image')}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
              analysisMode === 'image'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Camera className="mr-2 h-4 w-4" />
            Image Analysis
          </button>
        </div>

        {/* Input Area */}
        {analysisMode === 'text' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe your food (supports 2000+ foods worldwide)
            </label>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="E.g., rice and chicken curry, large portion pizza with mushrooms, kottu roti with vegetables..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
            />
            <p className="text-sm text-gray-500 mt-2">
              💡 Include portion sizes, cooking methods, and ingredients for best results
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload food image
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              {imagePreview ? (
                <div className="space-y-4">
                  <img
                    src={imagePreview}
                    alt="Food preview"
                    className="max-w-full h-48 object-cover mx-auto rounded-lg"
                  />
                  <button
                    onClick={() => {
                      setImageFile(null)
                      setImagePreview(null)
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove image
                  </button>
                </div>
              ) : (
                <div>
                  <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Choose Image
                  </label>
                  <p className="text-sm text-gray-500 mt-2">
                    Supports JPG, PNG, WebP (max 10MB)
                  </p>
                </div>
              )}
            </div>
            {imageFile && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Optional: Add description to improve accuracy
                </label>
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="E.g., traditional Sri Lankan meal, breakfast, lunch..."
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
        )}

        {/* Analyze Button */}
        <button
          onClick={handleAnalysis}
          disabled={isAnalyzing || (!textInput.trim() && !imageFile)}
          className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-700 hover:to-purple-700 transition-all"
        >
          {isAnalyzing ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Analyzing with AI...
            </div>
          ) : (
            'Analyze Food'
          )}
        </button>
      </div>

      {/* Results */}
      {analysisResult && (
        <div className="space-y-6">
          {/* No Foods Detected Message */}
          {analysisResult.foodItems.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
              <div className="flex items-center mb-4">
                <div className="bg-yellow-100 p-2 rounded-full mr-3">
                  <Brain className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold text-yellow-800">No Specific Foods Detected</h3>
              </div>
              <p className="text-yellow-700 mb-4">
                We couldn't identify specific foods from your input. This could happen when:
              </p>
              <ul className="list-disc list-inside text-yellow-700 space-y-1 mb-4">
                <li>The description is too general (e.g., "I ate lunch")</li>
                <li>The image is unclear or doesn't show recognizable foods</li>
                <li>The foods mentioned aren't in our database</li>
              </ul>
              {analysisResult.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium text-yellow-800 mb-2">💡 Suggestions:</h4>
                  <ul className="list-disc list-inside text-yellow-700 space-y-1">
                    {analysisResult.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Analysis Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">Analysis Summary</h3>
                  <span className="text-sm text-gray-600">
                    {(analysisResult.confidence * 100).toFixed(1)}% confidence
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {analysisResult.totalNutrition.calories}
                    </div>
                    <div className="text-sm text-gray-600">Calories</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {analysisResult.totalNutrition.protein.toFixed(1)}g
                    </div>
                    <div className="text-sm text-gray-600">Protein</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {analysisResult.totalNutrition.carbs.toFixed(1)}g
                    </div>
                    <div className="text-sm text-gray-600">Carbs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {analysisResult.totalNutrition.fat.toFixed(1)}g
                    </div>
                    <div className="text-sm text-gray-600">Fat</div>
                  </div>
                </div>
              </div>

              {/* Total Micronutrients */}
              {(() => {
                const totalNutrition = calculateTotalNutrition(analysisResult.foodItems)
                const hasVitamins = totalNutrition.vitamins && Object.keys(totalNutrition.vitamins).length > 0
                const hasMinerals = totalNutrition.minerals && Object.keys(totalNutrition.minerals).length > 0
                
                if (!hasVitamins && !hasMinerals) return null
                
                return (
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">🧬 Total Micronutrients</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Total Vitamins */}
                      {hasVitamins && (
                        <div>
                          <h4 className="text-md font-medium text-green-700 mb-2">🍃 Vitamins</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {Object.entries(totalNutrition.vitamins).map(([vitamin, value]) => (
                              <div key={vitamin} className="flex justify-between">
                                <span className="text-green-600">Vitamin {vitamin}:</span>
                                <span className="font-medium">
                                  {vitamin === 'omega3' ? `${Number(value).toFixed(1)}g` : 
                                  vitamin === 'C' || vitamin === 'K' || vitamin === 'folate' || vitamin === 'A' ? `${Number(value).toFixed(1)}μg` :
                                  `${Number(value).toFixed(1)}mg`}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Total Minerals */}
                      {hasMinerals && (
                        <div>
                          <h4 className="text-md font-medium text-blue-700 mb-2">⚡ Minerals</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {Object.entries(totalNutrition.minerals).map(([mineral, value]) => (
                              <div key={mineral} className="flex justify-between">
                                <span className="text-blue-600 capitalize">{mineral}:</span>
                                <span className="font-medium">{Number(value).toFixed(1)}mg</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })()}

              {/* Health Scores */}
              {(analysisResult.healthScore !== undefined || analysisResult.balanceScore !== undefined) && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Health Metrics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {analysisResult.healthScore !== undefined && (
                      <div className="text-center">
                        <div className="text-xl font-bold text-green-600">
                          {analysisResult.healthScore.toFixed(1)}/10
                        </div>
                        <div className="text-sm text-gray-600">Health Score</div>
                      </div>
                    )}
                    {analysisResult.balanceScore !== undefined && (
                      <div className="text-center">
                        <div className="text-xl font-bold text-blue-600">
                          {analysisResult.balanceScore.toFixed(1)}/10
                        </div>
                        <div className="text-sm text-gray-600">Balance Score</div>
                      </div>
                    )}
                    {analysisResult.sustainabilityScore !== undefined && (
                      <div className="text-center">
                        <div className="text-xl font-bold text-emerald-600">
                          {analysisResult.sustainabilityScore.toFixed(1)}/10
                        </div>
                        <div className="text-sm text-gray-600">Sustainability</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Detected Foods */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Detected Foods</h3>
                <div className="space-y-3">
                  {analysisResult.foodItems.map((food, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-gray-800">{food.name}</h4>
                          <p className="text-sm text-gray-600">
                            {food.portion} ({food.portionWeight}g) • {food.cuisine} cuisine
                          </p>
                          {food.culturalOrigin && (
                            <p className="text-xs text-gray-500">Origin: {food.culturalOrigin}</p>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">
                          {(food.confidence * 100).toFixed(0)}% match
                        </span>
                      </div>
                      {/* Macronutrients */}
                      <div className="mb-3">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Macronutrients</h5>
                        <div className="grid grid-cols-4 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Calories:</span>
                            <div className="font-medium">{food.calories}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Protein:</span>
                            <div className="font-medium">{food.protein.toFixed(1)}g</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Carbs:</span>
                            <div className="font-medium">{food.carbs.toFixed(1)}g</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Fat:</span>
                            <div className="font-medium">{food.fat.toFixed(1)}g</div>
                          </div>
                        </div>
                      </div>

                      {/* Micronutrients - Vitamins */}
                      {food.vitamins && Object.keys(food.vitamins).length > 0 && (
                        <div className="mb-3">
                          <h5 className="text-sm font-medium text-green-700 mb-2">🍃 Vitamins</h5>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {Object.entries(food.vitamins).map(([vitamin, value]) => (
                              <div key={vitamin} className="flex justify-between">
                                <span className="text-green-600">Vitamin {vitamin}:</span>
                                <span className="font-medium">
                                  {vitamin === 'omega3' ? `${Number(value).toFixed(1)}g` : 
                                  vitamin === 'C' || vitamin === 'K' || vitamin === 'folate' || vitamin === 'A' ? `${Number(value).toFixed(1)}μg` :
                                  `${Number(value).toFixed(1)}mg`}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Micronutrients - Minerals */}
                      {food.minerals && Object.keys(food.minerals).length > 0 && (
                        <div className="mb-3">
                          <h5 className="text-sm font-medium text-blue-700 mb-2">⚡ Minerals</h5>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {Object.entries(food.minerals).map(([mineral, value]) => (
                              <div key={mineral} className="flex justify-between">
                                <span className="text-blue-600 capitalize">{mineral}:</span>
                                <span className="font-medium">{Number(value).toFixed(1)}mg</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {food.allergens && food.allergens.length > 0 && (
                        <div className="mt-2">
                          <span className="text-sm text-red-600">
                            ⚠️ Contains: {food.allergens.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              {analysisResult.recommendations.length > 0 && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <TrendingUp className="mr-2 text-yellow-600" />
                    Recommendations
                  </h3>
                  <ul className="space-y-2">
                    {analysisResult.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start">
                        <span className="text-yellow-600 mr-2">💡</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Unknown Foods */}
              {analysisResult.unknownFoods.length > 0 && (
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    🔍 Unknown Foods (Estimated)
                  </h3>
                  <div className="space-y-2">
                    {analysisResult.unknownFoods.map((unknown, index) => (
                      <div key={index} className="text-sm">
                        <div className="font-medium text-gray-800">{unknown.description}</div>
                        <div className="text-gray-600">
                          Confidence: {(unknown.confidence * 100).toFixed(0)}% • 
                          Similar to: {unknown.similarFoods.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Analysis Method */}
              <div className="text-center text-sm text-gray-500">
                Analysis method: {analysisResult.analysisMethod} • 
                Detection methods: {analysisResult.detectionMethods.join(', ')}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default EnhancedNutritionAnalysisComponent
