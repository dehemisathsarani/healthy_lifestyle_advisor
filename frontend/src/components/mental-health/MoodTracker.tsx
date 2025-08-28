import React, { useState } from 'react';
import { apiFetch } from '../../lib/api';

interface MoodTrackerProps {
  onMoodTracked?: (data: any) => void;
}

export const MoodTracker: React.FC<MoodTrackerProps> = ({ onMoodTracked }) => {
  const [moodScore, setMoodScore] = useState<number>(5);
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showMoreUplift, setShowMoreUplift] = useState<boolean>(false);
  const [additionalUplift, setAdditionalUplift] = useState<any>(null);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  const handleTrackMood = async () => {
    try {
      setIsLoading(true);
      setResult(null); // Clear previous results
      setAdditionalUplift(null); // Clear any previous additional uplift
      setShowMoreUplift(false); // Reset the show more state
      
      // Use the apiFetch function which handles authentication and proper API base URL
      const response = await apiFetch('/api/mental-health/mood/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mood_score: moodScore,
          notes: notes
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data);
      
      // If mood is low and uplift content is returned, enable "more" button
      if (data.uplift && data.uplift.needed) {
        setShowMoreUplift(true);
      }
      
      if (onMoodTracked) {
        onMoodTracked(data);
      }
      
      // Reset form
      setNotes('');
      setMoodScore(5);
    } catch (error) {
      console.error('Error tracking mood:', error);
      setResult({ 
        error: error instanceof Error ? error.message : 'Failed to track mood. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const getMoreUplift = async () => {
    try {
      setLoadingMore(true);
      
      const response = await apiFetch('/api/mental-health/uplift/more', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setAdditionalUplift(data);
    } catch (error) {
      console.error('Error getting more uplift content:', error);
      setAdditionalUplift({ error: 'Failed to get more uplift content.' });
    } finally {
      setLoadingMore(false);
    }
  };

  const getMoodEmoji = (score: number) => {
    if (score >= 8) return '😄';
    if (score >= 6) return '😊';
    if (score >= 4) return '😐';
    if (score >= 2) return '😔';
    return '😢';
  };

  const getMoodLabel = (score: number) => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Neutral';
    if (score >= 2) return 'Low';
    return 'Very Low';
  };

  return (
    <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-6 border border-gray-200">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          🧠 Daily Mood Tracker
        </h3>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            How are you feeling today? {getMoodEmoji(moodScore)}
          </label>
          <div className="space-y-2">
            <input
              type="range"
              min={1}
              max={10}
              value={moodScore}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMoodScore(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>1 (Very Low)</span>
              <span className="font-medium text-gray-800">
                {moodScore} - {getMoodLabel(moodScore)}
              </span>
              <span>10 (Excellent)</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Notes (optional)
          </label>
          <textarea
            placeholder="How are you feeling? What's on your mind today?"
            value={notes}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <button 
          onClick={handleTrackMood} 
          disabled={isLoading}
          className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
            isLoading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300'
          } text-white`}
        >
          {isLoading ? 'Tracking...' : 'Track Mood'}
        </button>

        {result && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            {result.error ? (
              <p className="text-red-600 text-sm">{result.error}</p>
            ) : (
              <div className="space-y-2 text-sm">
                <p className="font-medium text-green-600">
                  ✅ Mood tracked successfully!
                </p>
                {result.weekly_average && (
                  <p className="text-gray-700">Weekly average: {result.weekly_average}/10</p>
                )}
                {result.trend && (
                  <p className="text-gray-700">Trend: {result.trend}</p>
                )}
                {result.encouragement && (
                  <p className="text-blue-600 italic">
                    "{result.encouragement}"
                  </p>
                )}
                
                {/* Uplift content when mood is low */}
                {result.uplift && result.uplift.needed && (
                  <div className="mt-4 space-y-4">
                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="font-medium text-yellow-700 mb-2">{result.uplift.message}</p>
                      
                      {/* Joke section */}
                      <div className="mb-3">
                        <h4 className="text-yellow-800 font-medium text-sm mb-1">😄 Here's a joke to brighten your day:</h4>
                        <p className="text-yellow-700 p-2 bg-yellow-100 rounded">{result.uplift.joke.joke}</p>
                      </div>
                      
                      {/* Activity suggestion */}
                      <div>
                        <h4 className="text-yellow-800 font-medium text-sm mb-1">🎯 Try this quick activity:</h4>
                        <p className="text-yellow-700 p-2 bg-yellow-100 rounded">{result.uplift.activity.activity}</p>
                      </div>
                      
                      {/* More button */}
                      <div className="mt-3">
                        <button
                          onClick={getMoreUplift}
                          disabled={loadingMore}
                          className="w-full py-2 px-3 bg-yellow-500 hover:bg-yellow-600 text-white text-sm rounded-md transition-colors"
                        >
                          {loadingMore ? 'Getting more...' : 'Want another one?'}
                        </button>
                      </div>
                    </div>
                    
                    {/* Additional uplift content */}
                    {additionalUplift && !additionalUplift.error && (
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="font-medium text-green-700 mb-2">{additionalUplift.message}</p>
                        
                        {/* Additional joke */}
                        <div className="mb-3">
                          <h4 className="text-green-800 font-medium text-sm mb-1">😄 Another joke:</h4>
                          <p className="text-green-700 p-2 bg-green-100 rounded">{additionalUplift.joke.joke}</p>
                        </div>
                        
                        {/* Additional activity */}
                        <div>
                          <h4 className="text-green-800 font-medium text-sm mb-1">🎯 Another activity to try:</h4>
                          <p className="text-green-700 p-2 bg-green-100 rounded">{additionalUplift.activity.activity}</p>
                        </div>
                        
                        {/* Breathing exercise suggestion */}
                        <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-100">
                          <p className="text-blue-700 text-xs">
                            <strong>Feeling better?</strong> Try a quick breathing exercise: Breathe in for 4 counts, hold for 4, and exhale for 6.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
