import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';

interface MoodData {
  date: string;
  mood_score: number;
  notes?: string;
}

interface MoodHistoryProps {
  timeRange: '7' | '30' | '90';
}

export const MoodHistory: React.FC<MoodHistoryProps> = ({ timeRange }) => {
  const [moodHistory, setMoodHistory] = useState<MoodData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMoodHistory = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await apiFetch(`/api/mental-health/mood/history?days=${timeRange}`, {
          method: 'GET'
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch mood history: ${response.statusText}`);
        }

        const data = await response.json();
        setMoodHistory(data.history || []);
      } catch (err) {
        console.error('Error fetching mood history:', err);
        setError('Failed to load mood history. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMoodHistory();
  }, [timeRange]);

  const getBarHeight = (score: number) => {
    // Convert 1-10 score to percentage height (minimum 10% so it's always visible)
    return Math.max(10, score * 10);
  };

  const getBarColor = (score: number) => {
    if (score >= 8) return 'bg-green-500';
    if (score >= 6) return 'bg-green-300';
    if (score >= 4) return 'bg-yellow-300';
    if (score >= 2) return 'bg-orange-300';
    return 'bg-red-300';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-pulse text-gray-500">Loading mood history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
        {error}
      </div>
    );
  }

  if (moodHistory.length === 0) {
    return (
      <div className="bg-gray-50 p-4 rounded-md text-center text-gray-500">
        No mood data available for the selected time range.
        <p className="text-sm mt-2">Start tracking your mood daily to see trends!</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h3 className="text-md font-medium text-gray-700 mb-3">
        Your {timeRange}-Day Mood Trend
      </h3>
      
      <div className="relative h-48 flex items-end justify-between space-x-1 mt-6 mb-2">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 pr-2">
          <span>10</span>
          <span>5</span>
          <span>1</span>
        </div>
        
        {/* Bars */}
        <div className="ml-8 w-full flex items-end space-x-1">
          {moodHistory.map((entry, index) => (
            <div 
              key={index} 
              className="flex flex-col items-center flex-1"
              title={`${formatDate(entry.date)}: ${entry.mood_score}/10 - ${entry.notes || 'No notes'}`}
            >
              <div 
                className={`w-full rounded-t-sm ${getBarColor(entry.mood_score)}`} 
                style={{ height: `${getBarHeight(entry.mood_score)}%` }}
              />
              <div className="text-xs text-gray-500 mt-1 truncate w-full text-center">
                {formatDate(entry.date)}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Average score */}
      {moodHistory.length > 0 && (
        <div className="text-sm text-gray-600 mt-4">
          Average: 
          <span className="font-medium ml-1">
            {(moodHistory.reduce((sum, entry) => sum + entry.mood_score, 0) / moodHistory.length).toFixed(1)}
          </span>
        </div>
      )}
    </div>
  );
};
