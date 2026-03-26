import React, { useState, useEffect } from 'react';
import { apiClient, type DashboardData } from '../api';
import MacroCard from '../components/MacroCard';
import ProgressBar from '../components/Progressbar';

const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [hydrationAmount, setHydrationAmount] = useState(250);

  useEffect(() => {
    loadDashboardData();
  }, [selectedDate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getDashboardData(selectedDate);
      setDashboardData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleHydrationUpdate = async () => {
    try {
      await apiClient.updateHydration(hydrationAmount);
      // Reload dashboard to reflect changes
      await loadDashboardData();
      alert(`Added ${hydrationAmount}ml of water! 💧`);
    } catch (err: any) {
      alert('Failed to update hydration: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌ Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  const { daily_summary, recent_meals, bmi_data, tdee_data, user_profile } = dashboardData;

  // Calculate daily progress percentages  
  const proteinGoal = user_profile.weight_kg * 2; // 2g per kg body weight

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                🏠 Diet Dashboard
              </h1>
              <p className="text-gray-600">
                Track your nutrition goals and stay healthy!
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl mb-2">📊</div>
            <div className="text-2xl font-bold text-blue-600">
              {daily_summary.total_calories.toFixed(0)}
            </div>
            <div className="text-sm text-gray-600">Calories Today</div>
            <div className="text-xs text-gray-500 mt-1">
              Goal: {tdee_data.calorie_goals.maintain}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl mb-2">🍽️</div>
            <div className="text-2xl font-bold text-green-600">
              {daily_summary.meal_count}
            </div>
            <div className="text-sm text-gray-600">Meals Logged</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl mb-2">💧</div>
            <div className="text-2xl font-bold text-cyan-600">
              {(daily_summary.total_water_ml / 1000).toFixed(1)}L
            </div>
            <div className="text-sm text-gray-600">Water Intake</div>
            <div className="text-xs text-gray-500 mt-1">Goal: 2.0L</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl mb-2">⚖️</div>
            <div className="text-2xl font-bold text-purple-600">
              {bmi_data.bmi}
            </div>
            <div className="text-sm text-gray-600">BMI</div>
            <div className="text-xs text-gray-500 mt-1">{bmi_data.category}</div>
          </div>
        </div>

        {/* Macro Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MacroCard
            name="Calories"
            current={daily_summary.total_calories}
            target={tdee_data.calorie_goals.maintain}
            unit="kcal"
            color="blue"
            icon="🔥"
          />
          <MacroCard
            name="Protein"
            current={daily_summary.total_protein}
            target={proteinGoal}
            unit="g"
            color="green"
            icon="🥩"
          />
          <MacroCard
            name="Water"
            current={daily_summary.total_water_ml}
            target={2000}
            unit="ml"
            color="cyan"
            icon="💧"
          />
        </div>

        {/* Progress Bars */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">📈 Daily Progress</h2>
          <div className="space-y-6">
            <ProgressBar
              current={daily_summary.total_calories}
              target={tdee_data.calorie_goals.maintain}
              label="Daily Calories"
              color="blue"
              unit="kcal"
              size="lg"
            />
            <ProgressBar
              current={daily_summary.total_protein}
              target={proteinGoal}
              label="Protein Intake"
              color="green"
              unit="g"
            />
            <ProgressBar
              current={daily_summary.total_carbs}
              target={tdee_data.calorie_goals.maintain * 0.45 / 4}
              label="Carbohydrates"
              color="yellow"
              unit="g"
            />
            <ProgressBar
              current={daily_summary.total_fat}
              target={tdee_data.calorie_goals.maintain * 0.25 / 9}
              label="Fats"
              color="purple"
              unit="g"
            />
          </div>
        </div>

        {/* Hydration Tracker */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">💧 Hydration Tracker</h2>
          <div className="flex items-center space-x-4 mb-4">
            <input
              type="number"
              value={hydrationAmount}
              onChange={(e) => setHydrationAmount(Number(e.target.value))}
              min="50"
              max="1000"
              step="50"
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-600">ml</span>
            <button
              onClick={handleHydrationUpdate}
              className="bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-600 transition-colors"
            >
              Add Water
            </button>
          </div>
          <ProgressBar
            current={daily_summary.total_water_ml}
            target={2000}
            label="Daily Water Goal"
            color="cyan"
            unit="ml"
            size="lg"
          />
        </div>

        {/* Recent Meals */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">🍽️ Recent Meals</h2>
          {recent_meals.length > 0 ? (
            <div className="space-y-4">
              {recent_meals.slice(0, 5).map((meal, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg">
                        {meal.meal_type === 'breakfast' ? '🌅' : 
                         meal.meal_type === 'lunch' ? '☀️' : 
                         meal.meal_type === 'dinner' ? '🌙' : '🍪'}
                      </span>
                      <span className="font-medium text-gray-800 capitalize">
                        {meal.meal_type}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(meal.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {meal.meal_description && (
                      <p className="text-sm text-gray-600">{meal.meal_description}</p>
                    )}
                    {meal.detected_foods.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Foods: {meal.detected_foods.map(f => f.name).join(', ')}
                      </p>
                    )}
                  </div>
                  {meal.total_nutrition && (
                    <div className="text-right text-sm">
                      <div className="font-medium text-gray-800">
                        {meal.total_nutrition.calories.toFixed(0)} cal
                      </div>
                      <div className="text-xs text-gray-500">
                        P: {meal.total_nutrition.protein.toFixed(1)}g |
                        C: {meal.total_nutrition.carbs.toFixed(1)}g |
                        F: {meal.total_nutrition.fat.toFixed(1)}g
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">🍽️</div>
              <p>No meals logged today</p>
              <p className="text-sm mt-2">Start by analyzing your first meal!</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => window.location.href = '/analyze'}
            className="bg-blue-500 text-white p-6 rounded-lg hover:bg-blue-600 transition-colors text-center"
          >
            <div className="text-3xl mb-2">📸</div>
            <div className="font-medium">Analyze Food</div>
            <div className="text-sm opacity-90">Take a photo or describe your meal</div>
          </button>
          
          <button
            onClick={() => window.location.href = '/meal-plan'}
            className="bg-green-500 text-white p-6 rounded-lg hover:bg-green-600 transition-colors text-center"
          >
            <div className="text-3xl mb-2">📋</div>
            <div className="font-medium">Meal Plan</div>
            <div className="text-sm opacity-90">Get AI-generated meal suggestions</div>
          </button>
          
          <button
            onClick={() => window.location.href = '/history'}
            className="bg-purple-500 text-white p-6 rounded-lg hover:bg-purple-600 transition-colors text-center"
          >
            <div className="text-3xl mb-2">📊</div>
            <div className="font-medium">View History</div>
            <div className="text-sm opacity-90">Track your progress over time</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;