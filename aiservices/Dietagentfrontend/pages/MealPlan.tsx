import React, { useState, useEffect } from 'react';
import { apiClient, type AnalysisResponse, type UserProfile } from '../api';

const MealPlan: React.FC = () => {
  const [mealPlan, setMealPlan] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planType, setPlanType] = useState<'daily' | 'weekly'>('daily');

  // Mock user profile - in real app this would come from context
  const userProfile: UserProfile = {
    user_id: 'user-001',
    name: 'User',
    age: 30,
    gender: 'male',
    height_cm: 175,
    weight_kg: 70,
    activity_level: 'moderate',
    goal: 'maintain',
    dietary_restrictions: [],
    allergies: []
  };

  const generateMealPlan = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.getMealPlan(userProfile, []);
      setMealPlan(response);
    } catch (err: any) {
      setError(err.message || 'Failed to generate meal plan');
      console.error('Meal plan generation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateMealPlan();
  }, [planType]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating your personalized meal plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            📋 AI Meal Plan
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Get personalized meal recommendations based on your goals, preferences, and nutritional needs.
          </p>
        </div>

        {/* Plan Type Toggle */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setPlanType('daily')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              planType === 'daily'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            📅 Daily Plan
          </button>
          <button
            onClick={() => setPlanType('weekly')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              planType === 'weekly'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            🗓️ Weekly Plan
          </button>
        </div>

        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="text-red-800 font-medium mb-2">⚠️ Error Generating Meal Plan</div>
            <p className="text-red-600">{error}</p>
            <button
              onClick={generateMealPlan}
              className="mt-4 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
            >
              Try Again
            </button>
          </div>
        )}

        {mealPlan && (
          <div className="space-y-8">
            {/* Meal Plan Overview */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">🎯 Today's Meal Plan</h2>
              
              {mealPlan.advice && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-800 mb-2">💡 Personalized Recommendations</h3>
                  <p className="text-blue-700">{mealPlan.advice.recommendation}</p>
                  {mealPlan.advice.reasoning && (
                    <p className="text-sm text-blue-600 mt-2 italic">{mealPlan.advice.reasoning}</p>
                  )}
                </div>
              )}

              {/* Nutrition Targets */}
              {mealPlan.total_nutrition && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {mealPlan.total_nutrition.calories.toFixed(0)}
                    </div>
                    <div className="text-sm text-gray-600">Daily Calories</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {mealPlan.total_nutrition.protein.toFixed(1)}g
                    </div>
                    <div className="text-sm text-gray-600">Protein</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {mealPlan.total_nutrition.carbs.toFixed(1)}g
                    </div>
                    <div className="text-sm text-gray-600">Carbs</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {mealPlan.total_nutrition.fat.toFixed(1)}g
                    </div>
                    <div className="text-sm text-gray-600">Fat</div>
                  </div>
                </div>
              )}
            </div>

            {/* Meal Suggestions */}
            {mealPlan.detected_foods && mealPlan.detected_foods.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">🍽️ Suggested Meals</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {['Breakfast', 'Lunch', 'Dinner'].map((mealType, index) => (
                    <div key={mealType} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <span className="mr-2">
                          {mealType === 'Breakfast' ? '🌅' : mealType === 'Lunch' ? '☀️' : '🌙'}
                        </span>
                        {mealType}
                      </h3>
                      <div className="space-y-3">
                        {mealPlan.detected_foods && mealPlan.detected_foods.slice(index * 2, (index + 1) * 2).map((food, foodIndex) => (
                          <div key={foodIndex} className="p-3 bg-gray-50 rounded-lg">
                            <h4 className="font-medium text-gray-800">{food.name}</h4>
                            <p className="text-sm text-gray-600">Portion: {food.estimated_portion}</p>
                            {food.nutrition && (
                              <div className="text-xs text-gray-500 mt-1">
                                {food.nutrition.calories.toFixed(0)} cal | 
                                P: {food.nutrition.protein.toFixed(1)}g | 
                                C: {food.nutrition.carbs.toFixed(1)}g | 
                                F: {food.nutrition.fat.toFixed(1)}g
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Macro Suggestions */}
            {mealPlan.advice?.macro_suggestions && Object.keys(mealPlan.advice.macro_suggestions).length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">📈 Macro Guidelines</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {Object.entries(mealPlan.advice.macro_suggestions).map(([macro, suggestion]) => (
                    <div key={macro} className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <h3 className="font-semibold text-yellow-800 capitalize">{macro}</h3>
                      <p className="text-yellow-700 text-sm mt-1">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Healthier Alternatives */}
            {mealPlan.advice?.healthier_alternatives && mealPlan.advice.healthier_alternatives.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">🥗 Healthy Food Options</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {mealPlan.advice.healthier_alternatives.map((alternative, index) => (
                    <div key={index} className="p-4 bg-green-50 rounded-lg border border-green-200 flex items-start">
                      <span className="text-green-600 mr-2">✓</span>
                      <span className="text-green-800">{alternative}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hydration Reminder */}
            {mealPlan.advice?.hydration_reminder && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">💧 Hydration Tips</h2>
                <div className="p-4 bg-cyan-50 rounded-lg border border-cyan-200">
                  <p className="text-cyan-800">{mealPlan.advice.hydration_reminder}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={generateMealPlan}
                className="flex-1 bg-blue-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-600 transition-colors"
              >
                🔄 Generate New Plan
              </button>
              <button
                onClick={() => window.location.href = '/analyze'}
                className="flex-1 bg-green-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-600 transition-colors"
              >
                📸 Analyze Current Meal
              </button>
            </div>
          </div>
        )}

        {/* Tips Section */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">💡 Meal Planning Tips</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">🎯 For Best Results:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Follow portion recommendations</li>
                <li>• Include variety in your meals</li>
                <li>• Stay hydrated throughout the day</li>
                <li>• Track your actual intake</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2">🔄 Customize Your Plan:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Update your profile preferences</li>
                <li>• Add dietary restrictions</li>
                <li>• Adjust activity level</li>
                <li>• Set specific goals</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealPlan;
