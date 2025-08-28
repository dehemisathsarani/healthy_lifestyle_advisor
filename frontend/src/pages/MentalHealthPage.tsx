import React, { useState } from 'react';
import { MoodTracker } from '../components/mental-health/MoodTracker';
import { MoodHistory } from '../components/mental-health/MoodHistory';
import { CompanionChat } from '../components/mental-health/CompanionChat';
import { WellnessToolkit } from '../components/mental-health/WellnessToolkit';
import { HealthEducation } from '../components/mental-health/HealthEducation';
import { apiFetch } from '../lib/api';

export const MentalHealthPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'mood' | 'chat' | 'meditation' | 'wellness' | 'education' | 'report'>('mood');
  const [meditationSuggestion, setMeditationSuggestion] = useState<any>(null);
  const [breathingExercise, setBreathingExercise] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [historyTimeRange, setHistoryTimeRange] = useState<'7' | '30' | '90'>('7');

  const getMeditationSuggestion = async () => {
    try {
      setIsLoading(true);
      const response = await apiFetch('/api/mental-health/meditation/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          duration: 10,
          focus: 'stress',
          experience: 'beginner'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMeditationSuggestion(data);
      }
    } catch (error) {
      console.error('Error getting meditation suggestion:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getBreathingExercise = async () => {
    try {
      setIsLoading(true);
      const response = await apiFetch('/api/mental-health/breathing/exercise?difficulty=beginner', {
        method: 'GET'
      });

      if (response.ok) {
        const data = await response.json();
        setBreathingExercise(data);
      }
    } catch (error) {
      console.error('Error getting breathing exercise:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧠 Mental Health Dashboard
          </h1>
          <p className="text-gray-600">
            Track your mood, chat with your AI companion, use wellness tools, and access health resources
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-md">
            {[
              { key: 'mood', label: '📊 Mood Tracker', icon: '📊' },
              { key: 'chat', label: '💬 AI Companion', icon: '💬' },
              { key: 'meditation', label: '🧘 Meditation', icon: '🧘' },
              { key: 'wellness', label: '🌿 Wellness Toolkit', icon: '🌿' },
              { key: 'education', label: '📚 Health Education', icon: '📚' },
              { key: 'report', label: '📈 Wellness Report', icon: '📈' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex justify-center">
          {activeTab === 'mood' && (
            <div className="w-full max-w-2xl">
              <MoodTracker onMoodTracked={(data) => console.log('Mood tracked:', data)} />
              
              {/* Mood history visualization */}
              <div className="mt-8 bg-white shadow-lg rounded-lg p-6 border border-gray-200">
                <div className="mb-4 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">📊 Mood History</h3>
                  
                  <div className="flex space-x-2">
                    {['7', '30', '90'].map((days) => (
                      <button
                        key={days}
                        onClick={() => setHistoryTimeRange(days as '7' | '30' | '90')}
                        className={`px-3 py-1 text-xs rounded-md ${
                          historyTimeRange === days
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {days} days
                      </button>
                    ))}
                  </div>
                </div>
                
                <MoodHistory timeRange={historyTimeRange} />
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="w-full max-w-2xl">
              <CompanionChat onMessageSent={(data) => console.log('Message sent:', data)} />
            </div>
          )}

          {activeTab === 'meditation' && (
            <div className="w-full max-w-2xl space-y-6">
              {/* Meditation Section */}
              <div className="bg-white shadow-lg rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  🧘 Meditation & Mindfulness
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <button
                      onClick={getMeditationSuggestion}
                      disabled={isLoading}
                      className="w-full py-3 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:bg-gray-400"
                    >
                      {isLoading ? 'Getting Suggestion...' : 'Get Meditation Suggestion'}
                    </button>
                    
                    {meditationSuggestion && (
                      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <h4 className="font-medium text-purple-800 mb-2">
                          {meditationSuggestion.meditation?.title}
                        </h4>
                        <p className="text-sm text-purple-700 mb-2">
                          Duration: {meditationSuggestion.meditation?.duration} minutes
                        </p>
                        <p className="text-sm text-purple-700 mb-3">
                          {meditationSuggestion.meditation?.description}
                        </p>
                        <div className="text-xs text-purple-600">
                          <strong>Instructions:</strong> {meditationSuggestion.meditation?.instructions}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <button
                      onClick={getBreathingExercise}
                      disabled={isLoading}
                      className="w-full py-3 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400"
                    >
                      {isLoading ? 'Getting Exercise...' : 'Get Breathing Exercise'}
                    </button>
                    
                    {breathingExercise && (
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <h4 className="font-medium text-green-800 mb-2">
                          {breathingExercise.exercise?.name}
                        </h4>
                        <p className="text-sm text-green-700 mb-2">
                          Pattern: {breathingExercise.exercise?.pattern}
                        </p>
                        <p className="text-sm text-green-700 mb-3">
                          Duration: {breathingExercise.exercise?.duration}
                        </p>
                        <div className="text-xs text-green-600">
                          <strong>Instructions:</strong>
                          <ul className="list-disc list-inside mt-1">
                            {breathingExercise.instructions?.map((instruction: string, index: number) => (
                              <li key={index}>{instruction}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'report' && (
            <div className="w-full max-w-4xl">
              <div className="bg-white shadow-lg rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  📈 Wellness Report
                </h3>
                <div className="text-center py-8 text-gray-500">
                  <p className="mb-4">🔄 Wellness report feature coming soon!</p>
                  <p className="text-sm">
                    This will show your mood trends, stress patterns, and personalized recommendations.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'wellness' && (
            <div className="w-full max-w-4xl">
              <WellnessToolkit />
            </div>
          )}

          {activeTab === 'education' && (
            <div className="w-full max-w-4xl">
              <HealthEducation />
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-12 text-center">
          <div className="bg-white shadow-lg rounded-lg p-6 border border-gray-200 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              🚀 Quick Mental Health Resources
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div 
                className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100"
                onClick={() => setActiveTab('meditation')}
              >
                <div className="text-2xl mb-2">🧘‍♀️</div>
                <p className="text-xs text-blue-700 font-medium">Meditation</p>
              </div>
              <div 
                className="text-center p-3 bg-green-50 rounded-lg border border-green-200 cursor-pointer hover:bg-green-100"
                onClick={() => setActiveTab('wellness')}
              >
                <div className="text-2xl mb-2">�</div>
                <p className="text-xs text-green-700 font-medium">Wellness Toolkit</p>
              </div>
              <div 
                className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200 cursor-pointer hover:bg-purple-100"
                onClick={() => setActiveTab('mood')}
              >
                <div className="text-2xl mb-2">📝</div>
                <p className="text-xs text-purple-700 font-medium">Mood Tracker</p>
              </div>
              <div 
                className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200 cursor-pointer hover:bg-orange-100"
                onClick={() => setActiveTab('education')}
              >
                <div className="text-2xl mb-2">📚</div>
                <p className="text-xs text-orange-700 font-medium">Health Resources</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
