import React, { useState, useEffect } from 'react';
import { apiClient, DailyNutrition, NutritionInsights } from '../api';

interface NutritionSummaryProps {
  date?: string;
  refreshTrigger?: number;
}

function NutritionSummary({ date, refreshTrigger = 0 }: NutritionSummaryProps) {
  const [nutritionData, setNutritionData] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(date || new Date().toISOString().split('T')[0]);

  // Fetch nutrition data when component mounts or date/refreshTrigger changes
  useEffect(() => {
    fetchNutritionData();
  }, [selectedDate, refreshTrigger]);

  const fetchNutritionData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get daily nutrition data
      const dailyData = await apiClient.getDailyNutritionSummary(selectedDate);
      setNutritionData(dailyData);
      
      // Get insights for the last 7 days (including selected date)
      const endDate = selectedDate;
      const startDate = new Date(new Date(selectedDate).getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const insightsData = await apiClient.getNutritionInsights(startDate, endDate);
      setInsights(insightsData);
    } catch (err) {
      setError("Failed to load nutrition data. Please try again.");
      console.error("Nutrition data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle date change
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  // Calculate macro percentages
  const calculateMacroPercentages = (nutrition) => {
    if (!nutrition) return { protein: 0, carbs: 0, fat: 0 };
    
    const totalCalories = nutrition.total_calories || 0;
    if (totalCalories === 0) return { protein: 0, carbs: 0, fat: 0 };
    
    const proteinCals = (nutrition.total_protein || 0) * 4;
    const carbCals = (nutrition.total_carbs || 0) * 4;
    const fatCals = (nutrition.total_fat || 0) * 9;
    
    return {
      protein: Math.round((proteinCals / totalCalories) * 100),
      carbs: Math.round((carbCals / totalCalories) * 100),
      fat: Math.round((fatCals / totalCalories) * 100)
    };
  };

  const macros = calculateMacroPercentages(nutritionData);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Nutrition Summary</h2>
        <input
          type="date"
          value={selectedDate}
          onChange={handleDateChange}
          className="border border-gray-300 rounded px-3 py-2 text-sm"
        />
      </div>
      
      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      
      {nutritionData && (
        <div>
          {/* Calories Summary */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-600">Calories</span>
              <span className="font-medium">{nutritionData.total_calories} kcal</span>
            </div>
            {/* Goals status */}
            <div className="text-sm text-gray-500 mb-4">
              {nutritionData.goals_met?.calories 
                ? <span className="text-green-600">✓ On track with your calorie goal</span>
                : <span className="text-yellow-600">! Adjust your intake to meet your goals</span>
              }
            </div>
          </div>
          
          {/* Macronutrient Distribution */}
          <h3 className="text-md font-medium text-gray-700 mb-3">Macronutrient Distribution</h3>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Protein</span>
                <span className="text-sm font-medium">{macros.protein}%</span>
              </div>
              <p className="text-lg font-medium mt-1">{nutritionData.total_protein}g</p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Carbs</span>
                <span className="text-sm font-medium">{macros.carbs}%</span>
              </div>
              <p className="text-lg font-medium mt-1">{nutritionData.total_carbs}g</p>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Fat</span>
                <span className="text-sm font-medium">{macros.fat}%</span>
              </div>
              <p className="text-lg font-medium mt-1">{nutritionData.total_fat}g</p>
            </div>
          </div>
          
          {/* Meal Count */}
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Meals Today</span>
              <span className="font-medium">{nutritionData.meal_count}</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Insights Section */}
      {insights && (
        <div className="mt-8 border-t pt-6">
          <h3 className="text-md font-medium text-gray-700 mb-3">Weekly Insights</h3>
          
          <div className="mb-4">
            <div className="flex justify-between items-center text-sm mb-1">
              <span className="text-gray-600">Average Daily Calories</span>
              <span className="font-medium">{insights.average_calories} kcal</span>
            </div>
          </div>
          
          {insights.recommendations && insights.recommendations.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Recommendations</h4>
              <ul className="text-sm text-gray-600 space-y-1 pl-5 list-disc">
                {insights.recommendations.map((recommendation, index) => (
                  <li key={index}>{recommendation}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="mt-4 text-sm text-gray-500">
            Goal completion rate: {Math.round(insights.goal_completion_rate * 100)}% this week
          </div>
        </div>
      )}
      
      {/* Import from MyFitnessPal Button */}
      <div className="mt-8 border-t pt-4">
        <button
          onClick={() => {
            // This would open a modal for MyFitnessPal credentials input
            alert("MyFitnessPal import feature would open here");
          }}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Import data from MyFitnessPal
        </button>
      </div>
    </div>
  );
}

export default NutritionSummary;
