import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Calendar,
  Weight,
  Ruler
} from 'lucide-react';
import { biometricApi } from '@/services/biometricApi';

interface ProgressEntry {
  id?: string;
  user_id?: string;
  week_start_date: string;
  date?: string;
  weight?: number;
  body_fat_percentage?: number;
  waist_circumference?: number;
  notes?: string;
}

interface ProgressVisualizationProps {
  onProgressRecorded?: () => void;
}

export const ProgressVisualization: React.FC<ProgressVisualizationProps> = ({
  onProgressRecorded
}) => {
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progressData, setProgressData] = useState({
    weight: '',
    body_fat_percentage: '',
    waist_circumference: '',
    notes: ''
  });

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    try {
      const response = await biometricApi.getWeeklyProgress('current-user');
      setProgressEntries(response || []);
    } catch (error) {
      console.error('Failed to load progress data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const progressPayload = {
        date: new Date().toISOString(),
        week_start_date: new Date().toISOString(),
        weight: progressData.weight ? parseFloat(progressData.weight) : undefined,
        body_fat_percentage: progressData.body_fat_percentage ? parseFloat(progressData.body_fat_percentage) : undefined,
        waist_circumference: progressData.waist_circumference ? parseFloat(progressData.waist_circumference) : undefined,
        notes: progressData.notes || undefined
      };

      await biometricApi.recordWeeklyProgress(progressPayload);
      
      // Reset form
      setProgressData({
        weight: '',
        body_fat_percentage: '',
        waist_circumference: '',
        notes: ''
      });
      
      // Reload data
      await loadProgressData();
      onProgressRecorded?.();
    } catch (error) {
      console.error('Failed to record progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTrend = (entries: ProgressEntry[], field: 'weight' | 'body_fat_percentage' | 'waist_circumference') => {
    if (entries.length < 2) return { trend: 'neutral', change: 0 };
    
    const sortedEntries = entries
      .filter(entry => entry[field] !== undefined)
      .sort((a, b) => new Date(a.date || a.week_start_date).getTime() - new Date(b.date || b.week_start_date).getTime());
    
    if (sortedEntries.length < 2) return { trend: 'neutral', change: 0 };
    
    const latest = sortedEntries[sortedEntries.length - 1][field]!;
    const previous = sortedEntries[sortedEntries.length - 2][field]!;
    const change = latest - previous;
    
    return {
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      change: Math.abs(change)
    };
  };

  const weightTrend = getTrend(progressEntries, 'weight');
  const bodyFatTrend = getTrend(progressEntries, 'body_fat_percentage');
  const waistTrend = getTrend(progressEntries, 'waist_circumference');

  return (
    <div className="space-y-6">
      {/* Progress Recording Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Record This Week's Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Weight className="h-4 w-4" />
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={progressData.weight}
                  onChange={(e) => setProgressData(prev => ({ ...prev, weight: e.target.value }))}
                  placeholder="70.5"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Body Fat %
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={progressData.body_fat_percentage}
                  onChange={(e) => setProgressData(prev => ({ ...prev, body_fat_percentage: e.target.value }))}
                  placeholder="15.0"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  Waist (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={progressData.waist_circumference}
                  onChange={(e) => setProgressData(prev => ({ ...prev, waist_circumference: e.target.value }))}
                  placeholder="80.0"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Notes</label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                value={progressData.notes}
                onChange={(e) => setProgressData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="How are you feeling? Any observations, workouts, or changes..."
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700" 
              disabled={isLoading}
            >
              {isLoading ? 'Recording...' : 'Record Progress'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Progress Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Weight Trend</p>
                <p className="text-2xl font-bold text-blue-900">
                  {progressEntries.length > 0 && progressEntries[progressEntries.length - 1].weight 
                    ? `${progressEntries[progressEntries.length - 1].weight} kg`
                    : 'No data'
                  }
                </p>
              </div>
              <div className="flex items-center gap-2">
                {weightTrend.trend === 'up' && <TrendingUp className="h-5 w-5 text-red-500" />}
                {weightTrend.trend === 'down' && <TrendingDown className="h-5 w-5 text-green-500" />}
                {weightTrend.change > 0 && (
                  <span className="text-sm font-medium text-gray-600">
                    ±{weightTrend.change.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Body Fat Trend</p>
                <p className="text-2xl font-bold text-green-900">
                  {progressEntries.length > 0 && progressEntries[progressEntries.length - 1].body_fat_percentage 
                    ? `${progressEntries[progressEntries.length - 1].body_fat_percentage}%`
                    : 'No data'
                  }
                </p>
              </div>
              <div className="flex items-center gap-2">
                {bodyFatTrend.trend === 'up' && <TrendingUp className="h-5 w-5 text-red-500" />}
                {bodyFatTrend.trend === 'down' && <TrendingDown className="h-5 w-5 text-green-500" />}
                {bodyFatTrend.change > 0 && (
                  <span className="text-sm font-medium text-gray-600">
                    ±{bodyFatTrend.change.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Waist Trend</p>
                <p className="text-2xl font-bold text-purple-900">
                  {progressEntries.length > 0 && progressEntries[progressEntries.length - 1].waist_circumference 
                    ? `${progressEntries[progressEntries.length - 1].waist_circumference} cm`
                    : 'No data'
                  }
                </p>
              </div>
              <div className="flex items-center gap-2">
                {waistTrend.trend === 'up' && <TrendingUp className="h-5 w-5 text-red-500" />}
                {waistTrend.trend === 'down' && <TrendingDown className="h-5 w-5 text-green-500" />}
                {waistTrend.change > 0 && (
                  <span className="text-sm font-medium text-gray-600">
                    ±{waistTrend.change.toFixed(1)} cm
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Progress History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {progressEntries.length > 0 ? (
            <div className="space-y-4">
              {progressEntries
                .sort((a, b) => new Date(b.date || b.week_start_date).getTime() - new Date(a.date || a.week_start_date).getTime())
                .map((entry, index) => (
                  <div 
                    key={index}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">
                        {new Date(entry.date || entry.week_start_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                      <span className="text-sm text-gray-500">
                        {index === 0 ? 'Latest' : `${index + 1} entries ago`}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      {entry.weight && (
                        <div className="flex items-center gap-2">
                          <Weight className="h-4 w-4 text-blue-500" />
                          <span className="text-sm text-gray-700">{entry.weight} kg</span>
                        </div>
                      )}
                      {entry.body_fat_percentage && (
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-gray-700">{entry.body_fat_percentage}% body fat</span>
                        </div>
                      )}
                      {entry.waist_circumference && (
                        <div className="flex items-center gap-2">
                          <Ruler className="h-4 w-4 text-purple-500" />
                          <span className="text-sm text-gray-700">{entry.waist_circumference} cm waist</span>
                        </div>
                      )}
                    </div>
                    
                    {entry.notes && (
                      <p className="text-sm text-gray-600 italic">
                        "{entry.notes}"
                      </p>
                    )}
                  </div>
                ))
              }
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <TrendingUp className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No Progress Data Yet</h3>
              <p className="text-gray-400 mb-4">Start tracking your journey by recording your first measurement!</p>
              <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Weight className="h-4 w-4" />
                  <span>Track Weight</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  <span>Monitor Body Fat</span>
                </div>
                <div className="flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  <span>Measure Waist</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressVisualization;
