import React, { useState, useEffect } from 'react';
import { apiClient, type MealEntry } from '../api';
import ProgressBar from '../components/Progressbar';

interface HistoryEntry {
  date: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_water_ml: number;
  meal_count: number;
  meals: MealEntry[];
}

const History: React.FC = () => {
  const [historyData, setHistoryData] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');

  useEffect(() => {
    loadHistoryData();
  }, [selectedPeriod]);

  const loadHistoryData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock history data - in real app this would come from backend
      const mockData: HistoryEntry[] = [];
      const days = selectedPeriod === 'week' ? 7 : 30;
      
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        mockData.push({
          date: date.toISOString().split('T')[0],
          total_calories: 1400 + Math.random() * 800, // Random calories between 1400-2200
          total_protein: 60 + Math.random() * 80,
          total_carbs: 150 + Math.random() * 100,
          total_fat: 50 + Math.random() * 60,
          total_water_ml: 1500 + Math.random() * 1000,
          meal_count: Math.floor(2 + Math.random() * 4), // 2-5 meals per day
          meals: [
            {
              meal_type: 'breakfast',
              timestamp: new Date(date.getTime() + 8 * 60 * 60 * 1000).toISOString(),
              detected_foods: [
                { name: 'Oatmeal', confidence: 0.95, estimated_portion: '1 cup' },
                { name: 'Banana', confidence: 0.98, estimated_portion: '1 medium' }
              ],
              total_nutrition: { calories: 350, protein: 12, carbs: 65, fat: 6 }
            },
            {
              meal_type: 'lunch',
              timestamp: new Date(date.getTime() + 12 * 60 * 60 * 1000).toISOString(),
              detected_foods: [
                { name: 'Grilled Chicken', confidence: 0.92, estimated_portion: '150g' },
                { name: 'Rice', confidence: 0.88, estimated_portion: '1 cup' }
              ],
              total_nutrition: { calories: 450, protein: 35, carbs: 45, fat: 8 }
            }
          ]
        });
      }
      
      setHistoryData(mockData);
    } catch (err: any) {
      setError(err.message || 'Failed to load history data');
      console.error('History loading failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDateDetails = async (date: string) => {
    try {
      // In real app, this would fetch detailed data for the specific date
      await apiClient.getDashboardData(date);
      // Handle the detailed view here
    } catch (err) {
      console.error('Failed to load date details:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your nutrition history...</p>
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
            onClick={loadHistoryData}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Calculate averages
  const avgCalories = historyData.reduce((sum, day) => sum + day.total_calories, 0) / historyData.length;
  const avgProtein = historyData.reduce((sum, day) => sum + day.total_protein, 0) / historyData.length;
  const avgWater = historyData.reduce((sum, day) => sum + day.total_water_ml, 0) / historyData.length;
  const avgMeals = historyData.reduce((sum, day) => sum + day.meal_count, 0) / historyData.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            📊 Nutrition History
          </h1>
          <p className="text-lg text-gray-600">
            Track your progress and analyze your eating patterns over time.
          </p>
        </div>

        {/* Period Toggle */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setSelectedPeriod('week')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              selectedPeriod === 'week'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            📅 Last 7 Days
          </button>
          <button
            onClick={() => setSelectedPeriod('month')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              selectedPeriod === 'month'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            🗓️ Last 30 Days
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl mb-2">🔥</div>
            <div className="text-2xl font-bold text-blue-600">
              {avgCalories.toFixed(0)}
            </div>
            <div className="text-sm text-gray-600">Avg Daily Calories</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl mb-2">🥩</div>
            <div className="text-2xl font-bold text-green-600">
              {avgProtein.toFixed(1)}g
            </div>
            <div className="text-sm text-gray-600">Avg Daily Protein</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl mb-2">💧</div>
            <div className="text-2xl font-bold text-cyan-600">
              {(avgWater / 1000).toFixed(1)}L
            </div>
            <div className="text-sm text-gray-600">Avg Daily Water</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl mb-2">🍽️</div>
            <div className="text-2xl font-bold text-purple-600">
              {avgMeals.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">Avg Daily Meals</div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">📈 Average Progress vs Goals</h2>
          <div className="space-y-4">
            <ProgressBar
              current={avgCalories}
              target={2000}
              label="Daily Calories"
              color="blue"
              unit="kcal"
              size="lg"
            />
            <ProgressBar
              current={avgProtein}
              target={140}
              label="Protein Intake"
              color="green"
              unit="g"
            />
            <ProgressBar
              current={avgWater}
              target={2000}
              label="Water Intake"
              color="cyan"
              unit="ml"
            />
          </div>
        </div>

        {/* Daily History */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">📋 Daily History</h2>
          <div className="space-y-4">
            {historyData.map((day) => (
              <div 
                key={day.date}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => getDateDetails(day.date)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {new Date(day.date).toLocaleDateString('en-US', { 
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </h3>
                    <p className="text-sm text-gray-600">{day.meal_count} meals logged</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-800">
                      {day.total_calories.toFixed(0)} cal
                    </div>
                    <div className="text-sm text-gray-600">
                      {(day.total_water_ml / 1000).toFixed(1)}L water
                    </div>
                  </div>
                </div>
                
                {/* Mini Progress Bars */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Calories</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${Math.min((day.total_calories / 2000) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Protein</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${Math.min((day.total_protein / 140) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Water</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-cyan-500 h-2 rounded-full"
                        style={{ width: `${Math.min((day.total_water_ml / 2000) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Recent Meals Preview */}
                {day.meals.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-500 mb-2">Recent meals:</div>
                    <div className="flex space-x-2 text-xs">
                      {day.meals.slice(0, 3).map((meal, mealIndex) => (
                        <span key={mealIndex} className="px-2 py-1 bg-gray-100 rounded">
                          {meal.meal_type === 'breakfast' ? '🌅' : 
                           meal.meal_type === 'lunch' ? '☀️' : 
                           meal.meal_type === 'dinner' ? '🌙' : '🍪'}
                          {meal.detected_foods[0]?.name || 'Meal'}
                        </span>
                      ))}
                      {day.meals.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 rounded text-gray-500">
                          +{day.meals.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex space-x-4">
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="flex-1 bg-blue-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            📊 Back to Dashboard
          </button>
          <button
            onClick={() => window.location.href = '/analyze'}
            className="flex-1 bg-green-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-600 transition-colors"
          >
            📸 Log New Meal
          </button>
        </div>
      </div>
    </div>
  );
};

export default History;
