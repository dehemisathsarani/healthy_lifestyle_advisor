import React, { useState, useEffect } from 'react';
import { getRecoveryAdvice, RecoveryAdvice as RecoveryAdviceType, RecoveryRecommendation } from '../healthApi';
import { format } from 'date-fns';
import { demoMode } from '../api';

interface RecoveryAdviceProps {
  userId: string;
  date?: string;
}

const RecoveryAdvice: React.FC<RecoveryAdviceProps> = ({ userId, date }) => {
  const [advice, setAdvice] = useState<RecoveryAdviceType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'physical' | 'mental' | 'nutrition' | 'sleep'>('physical');
  const [completedItems, setCompletedItems] = useState<string[]>([]);

  useEffect(() => {
    fetchRecoveryAdvice();
  }, [userId, date]);

  const fetchRecoveryAdvice = async (refresh = false) => {
    try {
      setLoading(true);
      setError(null);
      if (refresh) setRefreshing(true);
      
      if (demoMode.isDemoMode()) {
        console.log('Using demo recovery advice data');
        // Use a small timeout to simulate API call
        setTimeout(() => {
          const adviceData = demoMode.getRecoveryAdvice(date);
          setAdvice(adviceData);
          setLoading(false);
          setRefreshing(false);
        }, 800);
      } else {
        const adviceData = await getRecoveryAdvice(date, refresh);
        setAdvice(adviceData);
        setLoading(false);
        setRefreshing(false);
      }
    } catch (err) {
      setError('Failed to load recovery advice. Please try again.');
      console.error('Error fetching recovery advice:', err);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchRecoveryAdvice(true);
  };

  const handleMarkComplete = (itemId: string) => {
    if (completedItems.includes(itemId)) {
      setCompletedItems(completedItems.filter(id => id !== itemId));
    } else {
      setCompletedItems([...completedItems, itemId]);
    }
  };

  const renderScoreGauge = () => {
    const score = advice?.recovery_score || 0;
    const colorClass = 
      score >= 80 ? 'bg-green-500' : 
      score >= 60 ? 'bg-blue-500' : 
      score >= 40 ? 'bg-yellow-500' : 
      'bg-red-500';
    
    return (
      <div className="flex flex-col items-center mb-6">
        <div className="relative h-32 w-32">
          <div className="absolute inset-0 rounded-full bg-gray-200"></div>
          <div 
            className={`absolute inset-0 rounded-full ${colorClass} shadow-lg`}
            style={{ 
              clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.sin(Math.PI * 2 * score / 100)}% ${50 - 50 * Math.cos(Math.PI * 2 * score / 100)}%, 50% 50%)` 
            }}
          ></div>
          <div className="absolute inset-3 rounded-full bg-white flex items-center justify-center shadow-inner">
            <span className="text-3xl font-bold">{score}</span>
          </div>
        </div>
        <div className="mt-3 text-xl font-semibold">
          {advice?.recovery_status === 'optimal' && 'Optimal Recovery'}
          {advice?.recovery_status === 'good' && 'Good Recovery'}
          {advice?.recovery_status === 'moderate' && 'Moderate Recovery'}
          {advice?.recovery_status === 'needs_recovery' && 'Needs Recovery'}
        </div>
        <div className="text-sm text-gray-600">{advice?.expected_recovery_time}</div>
      </div>
    );
  };

  const renderFactorBars = () => {
    if (!advice?.factors) return null;
    
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium mb-3">Recovery Factors</h3>
        <div className="space-y-3">
          {Object.entries(advice.factors).map(([factor, value]) => (
            <div key={factor} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="capitalize">{factor.replace(/_/g, ' ')}</span>
                <span>{Math.round(value * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${value >= 0.8 ? 'bg-green-500' : value >= 0.6 ? 'bg-blue-500' : value >= 0.4 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${value * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderWorkoutHistory = () => {
    if (!advice?.workout_intensity_history || Object.keys(advice.workout_intensity_history).length === 0) return null;
    
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium mb-3">Recent Training Load</h3>
        <div className="flex space-x-1">
          {Object.entries(advice.workout_intensity_history)
            .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
            .map(([date, intensity]) => {
              const formattedDate = format(new Date(date), 'dd');
              const height = `${Math.max(10, intensity * 8)}px`;
              
              return (
                <div key={date} className="flex flex-col items-center flex-1">
                  <div className="w-full flex justify-center items-end h-20">
                    <div 
                      className={`w-4 rounded-t ${intensity >= 8 ? 'bg-red-500' : intensity >= 6 ? 'bg-orange-400' : intensity >= 4 ? 'bg-yellow-400' : 'bg-green-400'}`}
                      style={{ height }}
                    ></div>
                  </div>
                  <div className="text-xs mt-1">{formattedDate}</div>
                </div>
              );
            })
          }
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Light</span>
          <span>Moderate</span>
          <span>Intense</span>
        </div>
      </div>
    );
  };

  const renderRecommendation = (rec: RecoveryRecommendation, index: number) => {
    const itemId = `${activeTab}-${index}`;
    const isCompleted = completedItems.includes(itemId);
    
    return (
      <div 
        key={index} 
        className={`p-4 rounded-lg mb-3 ${isCompleted ? 'bg-green-50 border border-green-100' : 'bg-white shadow-sm'}`}
      >
        <div className="flex justify-between items-start">
          <h4 className={`text-lg font-medium ${isCompleted ? 'line-through text-gray-500' : ''}`}>
            {rec.title}
          </h4>
          <span className={`px-2 py-1 text-xs rounded-full ${rec.priority === 'high' ? 'bg-red-100 text-red-800' : rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
            {rec.priority === 'high' ? 'High Priority' : rec.priority === 'medium' ? 'Medium Priority' : 'Optional'}
          </span>
        </div>
        
        <p className={`mt-2 text-gray-700 ${isCompleted ? 'line-through text-gray-400' : ''}`}>
          {rec.description}
        </p>
        
        {rec.duration_minutes && (
          <div className="mt-2 text-sm">
            <span className="font-medium">Duration:</span> {rec.duration_minutes} minutes
          </div>
        )}
        
        {rec.benefits && rec.benefits.length > 0 && (
          <div className="mt-3">
            <span className="text-sm font-medium">Benefits:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {rec.benefits.map((benefit, i) => (
                <span key={i} className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full">
                  {benefit}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {rec.specific_foods && rec.specific_foods.length > 0 && (
          <div className="mt-3">
            <span className="text-sm font-medium">Suggested Foods:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {rec.specific_foods.map((food, i) => (
                <span key={i} className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full">
                  {food}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {rec.equipment_needed && rec.equipment_needed.length > 0 && rec.equipment_needed[0] !== 'none' && (
          <div className="mt-3">
            <span className="text-sm font-medium">Equipment Needed:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {rec.equipment_needed.map((equipment, i) => (
                <span key={i} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                  {equipment.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-4 flex items-center justify-between">
          {rec.video_link && (
            <a 
              href={rec.video_link}
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-sm px-3 py-1 bg-blue-600 text-white rounded-md"
            >
              Watch Demo
            </a>
          )}
          
          {rec.audio_link && (
            <a 
              href={rec.audio_link}
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-sm px-3 py-1 bg-indigo-600 text-white rounded-md"
            >
              Listen
            </a>
          )}
          
          <button
            onClick={() => handleMarkComplete(itemId)}
            className={`text-sm px-3 py-1 rounded-md ${
              isCompleted 
                ? 'bg-gray-200 text-gray-800' 
                : 'bg-green-600 text-white'
            }`}
          >
            {isCompleted ? 'Completed ✓' : 'Mark Complete'}
          </button>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    if (!advice) return null;
    
    switch (activeTab) {
      case 'physical':
        return advice.physical_recommendations.map((rec, i) => renderRecommendation(rec, i));
      case 'mental':
        return advice.mental_recommendations.map((rec, i) => renderRecommendation(rec, i));
      case 'nutrition':
        return advice.nutritional_recommendations.map((rec, i) => renderRecommendation(rec, i));
      case 'sleep':
        return advice.sleep_recommendations.map((rec, i) => renderRecommendation(rec, i));
      default:
        return null;
    }
  };

  const renderRecoveryWindows = () => {
    if (!advice?.recommended_recovery_windows || advice.recommended_recovery_windows.length === 0) return null;
    
    return (
      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-3">Suggested Recovery Schedule</h3>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {advice.recommended_recovery_windows.map((window, i) => (
            <div key={i} className="flex items-center p-3 border-b last:border-b-0">
              <div className="w-24 text-sm font-medium">
                {window.start_time} - {window.end_time}
              </div>
              <div className="flex-1">
                <div>{window.activities.join(', ')}</div>
              </div>
              <div className="w-20 text-right">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  window.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {window.priority === 'high' ? 'Priority' : 'Optional'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderNextWorkout = () => {
    if (!advice?.next_workout_recommendation) return null;
    
    const nextWorkout = advice.next_workout_recommendation;
    
    return (
      <div className="mt-6 p-4 bg-white rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-2">Next Workout Recommendation</h3>
        <div className="space-y-2">
          <div>
            <span className="font-medium">Type:</span> {nextWorkout.recommended_type}
          </div>
          <div>
            <span className="font-medium">Earliest Date:</span> {format(new Date(nextWorkout.earliest_date), 'MMM d, yyyy')}
          </div>
          <div>
            <span className="font-medium">Intensity:</span> {nextWorkout.intensity}
          </div>
          <div>
            <span className="font-medium">Notes:</span> {nextWorkout.notes}
          </div>
        </div>
      </div>
    );
  };

  if (loading && !advice) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="animate-pulse">
          <div className="flex justify-center">
            <div className="h-32 w-32 bg-gray-200 rounded-full"></div>
          </div>
          <div className="h-6 bg-gray-200 rounded mt-6 w-3/4 mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded mt-2 w-1/2 mx-auto"></div>
          <div className="mt-8 space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow text-center">
        <div className="text-red-500 mb-4">{error}</div>
        <button 
          onClick={() => fetchRecoveryAdvice()} 
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Recovery Insights</h2>
        <button 
          onClick={handleRefresh}
          disabled={refreshing}
          className={`px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {refreshing ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Updating...
            </>
          ) : 'Refresh Advice'}
        </button>
      </div>

      {renderScoreGauge()}
      
      <p className="text-gray-700 mb-6">
        {advice?.description || 'No description available.'}
      </p>

      {renderFactorBars()}
      {renderWorkoutHistory()}

      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-4">Personalized Recommendations</h3>
        
        <div className="flex space-x-1 border-b">
          <button
            onClick={() => setActiveTab('physical')}
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'physical' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          >
            Physical ({advice?.physical_recommendations.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('mental')}
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'mental' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          >
            Mental ({advice?.mental_recommendations.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('nutrition')}
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'nutrition' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          >
            Nutrition ({advice?.nutritional_recommendations.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('sleep')}
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'sleep' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          >
            Sleep ({advice?.sleep_recommendations.length || 0})
          </button>
        </div>
        
        <div className="mt-4">
          {renderTabContent()}
        </div>
      </div>

      {renderRecoveryWindows()}
      {renderNextWorkout()}
    </div>
  );
};

export default RecoveryAdvice;
