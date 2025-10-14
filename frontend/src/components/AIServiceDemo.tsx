import { useState } from 'react'
import { dietAgentApi, UserDietProfile } from '../services/dietApi'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DemoResults = any

export const AIServiceDemo = () => {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<DemoResults | null>(null)
  const [activeDemo, setActiveDemo] = useState<'bmi' | 'meal' | 'plan' | null>(null)

  // Sample user profile for demonstrations
  const sampleProfile: UserDietProfile = {
    id: 'demo_user',
    name: 'Demo User',
    email: 'demo@example.com',
    age: 30,
    gender: 'male',
    height_cm: 175,
    weight_kg: 70,
    activity_level: 'moderately_active',
    goal: 'maintain_weight',
    dietary_restrictions: [],
    allergies: []
  }

  const demoBMI = async () => {
    setLoading(true)
    setActiveDemo('bmi')
    try {
      const bmiResult = await dietAgentApi.calculateBMI(175, 70)
      const tdeeResult = await dietAgentApi.calculateTDEE(sampleProfile)
      
      setResults({
        type: 'bmi_tdee',
        bmi: bmiResult,
        tdee: tdeeResult
      })
    } catch (error) {
      setResults({ type: 'error', message: 'BMI calculation failed', error })
    } finally {
      setLoading(false)
    }
  }

  const demoMealAnalysis = async () => {
    setLoading(true)
    setActiveDemo('meal')
    try {
      const result = await dietAgentApi.analyzeMealText({
        meal_description: 'grilled chicken breast with brown rice and steamed broccoli',
        user_profile: sampleProfile
      })
      
      setResults({
        type: 'meal_analysis',
        ...result
      })

      // Try to get result after a few seconds (for demo purposes)
      setTimeout(async () => {
        try {
          const analysisResult = await dietAgentApi.getAnalysisResult(result.request_id)
          setResults((prev: DemoResults | null) => prev ? ({
            ...prev,
            analysis_result: analysisResult
          }) : null)
        } catch {
          console.log('Analysis result not ready yet')
        }
      }, 5000)

    } catch (error) {
      setResults({ type: 'error', message: 'Meal analysis failed', error })
    } finally {
      setLoading(false)
    }
  }

  const demoMealPlan = async () => {
    setLoading(true)
    setActiveDemo('plan')
    try {
      const result = await dietAgentApi.generateMealPlan(sampleProfile, {
        cuisine_types: ['mediterranean', 'asian'],
        cooking_time: 'medium',
        budget: 'medium'
      })
      
      setResults({
        type: 'meal_plan',
        ...result
      })
    } catch (error) {
      setResults({ type: 'error', message: 'Meal plan generation failed', error })
    } finally {
      setLoading(false)
    }
  }

  const clearResults = () => {
    setResults(null)
    setActiveDemo(null)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
        🧪 AI Services Live Demo
      </h3>

      {/* Demo Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={demoBMI}
          disabled={loading}
          className={`p-4 rounded-lg border-2 transition-all ${
            activeDemo === 'bmi' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 hover:border-gray-300'
          } ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}
        >
          <div className="text-2xl mb-2">📊</div>
          <div className="font-semibold text-gray-800">BMI & TDEE</div>
          <div className="text-sm text-gray-600">Calculate health metrics</div>
        </button>

        <button
          onClick={demoMealAnalysis}
          disabled={loading}
          className={`p-4 rounded-lg border-2 transition-all ${
            activeDemo === 'meal' 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-200 hover:border-gray-300'
          } ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}
        >
          <div className="text-2xl mb-2">🍽️</div>
          <div className="font-semibold text-gray-800">Meal Analysis</div>
          <div className="text-sm text-gray-600">Analyze food description</div>
        </button>

        <button
          onClick={demoMealPlan}
          disabled={loading}
          className={`p-4 rounded-lg border-2 transition-all ${
            activeDemo === 'plan' 
              ? 'border-purple-500 bg-purple-50' 
              : 'border-gray-200 hover:border-gray-300'
          } ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}
        >
          <div className="text-2xl mb-2">📋</div>
          <div className="font-semibold text-gray-800">Meal Plan</div>
          <div className="text-sm text-gray-600">Generate custom plan</div>
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-3"></div>
            <span className="text-blue-800">
              {activeDemo === 'bmi' && 'Calculating BMI and TDEE...'}
              {activeDemo === 'meal' && 'Analyzing meal with AI...'}
              {activeDemo === 'plan' && 'Generating personalized meal plan...'}
            </span>
          </div>
        </div>
      )}

      {/* Results Display */}
      {results && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-800">Results:</h4>
            <button
              onClick={clearResults}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear ✕
            </button>
          </div>

          {results.type === 'bmi_tdee' && (
            <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
              <h5 className="font-semibold text-blue-800 mb-3">Health Metrics Calculated</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded p-3">
                  <div className="text-lg font-bold text-blue-600">{results.bmi.bmi}</div>
                  <div className="text-sm text-gray-600">BMI</div>
                  <div className="text-xs text-green-600">{results.bmi.category}</div>
                </div>
                <div className="bg-white rounded p-3">
                  <div className="text-lg font-bold text-green-600">{results.tdee.bmr}</div>
                  <div className="text-sm text-gray-600">BMR</div>
                  <div className="text-xs text-gray-500">cal/day</div>
                </div>
                <div className="bg-white rounded p-3">
                  <div className="text-lg font-bold text-purple-600">{results.tdee.tdee}</div>
                  <div className="text-sm text-gray-600">TDEE</div>
                  <div className="text-xs text-gray-500">cal/day</div>
                </div>
                <div className="bg-white rounded p-3">
                  <div className="text-lg font-bold text-orange-600">{results.tdee.calorie_goals.maintain}</div>
                  <div className="text-sm text-gray-600">Maintain</div>
                  <div className="text-xs text-gray-500">cal/day</div>
                </div>
              </div>
              <div className="mt-3 text-sm text-blue-700 bg-blue-100 rounded p-2">
                💡 {results.bmi.interpretation}
              </div>
            </div>
          )}

          {results.type === 'meal_analysis' && (
            <div className="bg-gradient-to-r from-green-50 to-yellow-50 border border-green-200 rounded-lg p-4">
              <h5 className="font-semibold text-green-800 mb-3">Meal Analysis Started</h5>
              <div className="space-y-2">
                <div><strong>Request ID:</strong> <code className="bg-gray-100 px-2 py-1 rounded text-sm">{results.request_id}</code></div>
                <div><strong>Status:</strong> <span className="text-green-600">{results.status}</span></div>
                <div><strong>Message:</strong> {results.message}</div>
                <div className="text-sm text-green-600 bg-green-100 rounded p-2">
                  🔄 Processing meal: "grilled chicken breast with brown rice and steamed broccoli"
                </div>
                {results.analysis_result && (
                  <div className="mt-3 bg-white border rounded p-3">
                    <strong>Analysis Result:</strong>
                    <pre className="text-xs mt-2 bg-gray-50 p-2 rounded overflow-auto">
                      {JSON.stringify(results.analysis_result, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {results.type === 'meal_plan' && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
              <h5 className="font-semibold text-purple-800 mb-3">Meal Plan Generation Started</h5>
              <div className="space-y-2">
                <div><strong>Request ID:</strong> <code className="bg-gray-100 px-2 py-1 rounded text-sm">{results.request_id}</code></div>
                <div><strong>Status:</strong> <span className="text-purple-600">{results.status}</span></div>
                <div><strong>Message:</strong> {results.message}</div>
                <div className="text-sm text-purple-600 bg-purple-100 rounded p-2">
                  🔄 Generating personalized meal plan with Mediterranean & Asian cuisine preferences
                </div>
              </div>
            </div>
          )}

          {results.type === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h5 className="font-semibold text-red-800 mb-2">Error</h5>
              <div className="text-red-700">{results.message}</div>
              {results.error && (
                <pre className="text-xs mt-2 bg-red-100 p-2 rounded overflow-auto text-red-600">
                  {JSON.stringify(results.error, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      )}

      {/* Demo Info */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h5 className="font-semibold text-gray-800 mb-2">Demo Information</h5>
        <div className="text-sm text-gray-600 space-y-1">
          <div>• <strong>Sample Profile:</strong> 30yr male, 175cm, 70kg, moderately active</div>
          <div>• <strong>BMI & TDEE:</strong> Real-time calculations using AI service</div>
          <div>• <strong>Meal Analysis:</strong> Asynchronous processing with request tracking</div>
          <div>• <strong>Meal Plans:</strong> Personalized generation based on preferences</div>
        </div>
      </div>
    </div>
  )
}
