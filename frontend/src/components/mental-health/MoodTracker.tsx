import React, { useState } from 'react';

interface MoodTrackerProps {
  onMoodTracked?: (data: any) => void;
}

export const MoodTracker: React.FC<MoodTrackerProps> = ({ onMoodTracked }) => {
  const [moodScore, setMoodScore] = useState<number>(5);
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleTrackMood = async () => {
    try {
      setIsLoading(true);
      
      // Make API call to mental health endpoint
      const response = await fetch('/api/mental-health/mood/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Assuming token is stored in localStorage
        },
        body: JSON.stringify({
          mood_score: moodScore,
          notes: notes
        })
      });

      if (!response.ok) {
        throw new Error('Failed to track mood');
      }

      const data = await response.json();
      setResult(data);
      
      if (onMoodTracked) {
        onMoodTracked(data);
      }
      
      // Reset form
      setNotes('');
      setMoodScore(5);
    } catch (error) {
      console.error('Error tracking mood:', error);
      setResult({ error: 'Failed to track mood' });
    } finally {
      setIsLoading(false);
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
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
