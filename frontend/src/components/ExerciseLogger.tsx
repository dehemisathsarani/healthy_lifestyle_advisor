import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Activity, 
  Plus,
  Target,
  TrendingUp,
  RefreshCw,
  Dumbbell,
  Timer
} from 'lucide-react';
import { biometricApi, ExerciseEntry, ExerciseSummary } from '@/services/biometricApi';

interface ExerciseLoggerProps {
  onExerciseLogged?: (entry: ExerciseEntry) => void;
}

export const ExerciseLogger: React.FC<ExerciseLoggerProps> = ({
  onExerciseLogged
}) => {
  const [exerciseSummary, setExerciseSummary] = useState<ExerciseSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLogging, setIsLogging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [exerciseForm, setExerciseForm] = useState({
    exercise_type: '',
    duration_minutes: '',
    intensity: '',
    calories_burned: '',
    notes: ''
  });

  // Quick exercise presets
  const quickExercises = [
    { type: 'Walking', duration: 30, intensity: 'moderate', calories: 150 },
    { type: 'Running', duration: 30, intensity: 'high', calories: 300 },
    { type: 'Cycling', duration: 45, intensity: 'moderate', calories: 250 },
    { type: 'Swimming', duration: 30, intensity: 'high', calories: 350 },
    { type: 'Weight Training', duration: 60, intensity: 'high', calories: 400 },
    { type: 'Yoga', duration: 60, intensity: 'low', calories: 180 }
  ];

  const loadExerciseData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await biometricApi.getWeeklyExerciseSummary();
      setExerciseSummary(response.exercise_summary);
      
    } catch (error) {
      console.error('Failed to load exercise data:', error);
      setError('Failed to load exercise data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExerciseData();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setExerciseForm(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleQuickExercise = async (exercise: typeof quickExercises[0]) => {
    try {
      setIsLogging(true);
      setError(null);
      setSuccess(null);
      
      const response = await biometricApi.logExercise({
        exercise_type: exercise.type,
        duration_minutes: exercise.duration,
        intensity: exercise.intensity as any,
        calories_burned: exercise.calories,
        date: new Date().toISOString(),
        notes: `Quick log: ${exercise.type}`
      });
      
      if (onExerciseLogged) {
        onExerciseLogged(response.exercise);
      }
      
      setSuccess(`Logged ${exercise.duration} minutes of ${exercise.type}!`);
      
      // Refresh data
      await loadExerciseData();
      
    } catch (error) {
      console.error('Failed to log exercise:', error);
      setError('Failed to log exercise');
    } finally {
      setIsLogging(false);
    }
  };

  const handleCustomExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!exerciseForm.exercise_type || !exerciseForm.duration_minutes || !exerciseForm.intensity) {
      setError('Please fill in all required fields');
      return;
    }
    
    try {
      setIsLogging(true);
      setError(null);
      setSuccess(null);
      
      const response = await biometricApi.logExercise({
        exercise_type: exerciseForm.exercise_type,
        duration_minutes: parseInt(exerciseForm.duration_minutes),
        intensity: exerciseForm.intensity as any,
        calories_burned: parseFloat(exerciseForm.calories_burned) || 0,
        date: new Date().toISOString(),
        notes: exerciseForm.notes || undefined
      });
      
      if (onExerciseLogged) {
        onExerciseLogged(response.exercise);
      }
      
      setSuccess(`Exercise logged successfully!`);
      
      // Reset form
      setExerciseForm({
        exercise_type: '',
        duration_minutes: '',
        intensity: '',
        calories_burned: '',
        notes: ''
      });
      
      // Refresh data
      await loadExerciseData();
      
    } catch (error) {
      console.error('Failed to log exercise:', error);
      setError('Failed to log exercise');
    } finally {
      setIsLogging(false);
    }
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'moderate': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'very_high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getExerciseIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('weight') || lowerType.includes('strength')) {
      return <Dumbbell className="h-4 w-4" />;
    }
    if (lowerType.includes('run') || lowerType.includes('cardio')) {
      return <Activity className="h-4 w-4" />;
    }
    return <Target className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading exercise data...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="h-8 w-8 text-red-600" />
            Exercise Logger
          </h1>
          <p className="text-gray-600">Track your workouts and fitness activities</p>
        </div>
        <Button onClick={loadExerciseData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Weekly Summary */}
      {exerciseSummary && (
        <Card className="bg-gradient-to-r from-red-500 to-pink-600 text-white">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold">{exerciseSummary.total_sessions}</div>
                <div className="text-sm opacity-90">Sessions This Week</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{Math.round(exerciseSummary.total_duration_minutes / 60 * 10) / 10}h</div>
                <div className="text-sm opacity-90">Total Duration</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{exerciseSummary.total_calories_burned.toFixed(0)}</div>
                <div className="text-sm opacity-90">Calories Burned</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{exerciseSummary.avg_calories_per_day.toFixed(0)}</div>
                <div className="text-sm opacity-90">Daily Average</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Exercise Log */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Quick Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              {quickExercises.map((exercise, index) => (
                <Button
                  key={index}
                  onClick={() => handleQuickExercise(exercise)}
                  disabled={isLogging}
                  variant="outline"
                  className="justify-between h-auto p-4"
                >
                  <div className="flex items-center gap-3">
                    {getExerciseIcon(exercise.type)}
                    <div className="text-left">
                      <div className="font-medium">{exercise.type}</div>
                      <div className="text-sm text-gray-500">
                        {exercise.duration} min • {exercise.calories} cal
                      </div>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs ${getIntensityColor(exercise.intensity)}`}>
                    {exercise.intensity}
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Custom Exercise Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Custom Exercise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCustomExercise} className="space-y-4">
              <div>
                <Label htmlFor="exercise_type">Exercise Type *</Label>
                <Input
                  id="exercise_type"
                  value={exerciseForm.exercise_type}
                  onChange={(e) => handleInputChange('exercise_type', e.target.value)}
                  placeholder="e.g., Running, Basketball, Dancing"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration_minutes">Duration (minutes) *</Label>
                  <Input
                    id="duration_minutes"
                    type="number"
                    value={exerciseForm.duration_minutes}
                    onChange={(e) => handleInputChange('duration_minutes', e.target.value)}
                    placeholder="30"
                    min="1"
                    max="480"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="intensity">Intensity *</Label>
                  <Select
                    value={exerciseForm.intensity}
                    onValueChange={(value) => handleInputChange('intensity', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select intensity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="very_high">Very High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="calories_burned">Calories Burned (optional)</Label>
                <Input
                  id="calories_burned"
                  type="number"
                  value={exerciseForm.calories_burned}
                  onChange={(e) => handleInputChange('calories_burned', e.target.value)}
                  placeholder="Auto-calculated if empty"
                  min="0"
                  max="2000"
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={exerciseForm.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="How did it feel? Any specific details..."
                  rows={3}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLogging}
              >
                {isLogging ? (
                  <>
                    <Timer className="mr-2 h-4 w-4 animate-spin" />
                    Logging Exercise...
                  </>
                ) : (
                  <>
                    <Activity className="mr-2 h-4 w-4" />
                    Log Exercise
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Exercise Breakdown */}
      {exerciseSummary && Object.keys(exerciseSummary.exercise_breakdown).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              This Week's Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(exerciseSummary.exercise_breakdown).map(([exerciseType, data]) => (
                <div key={exerciseType} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {getExerciseIcon(exerciseType)}
                    <h4 className="font-semibold">{exerciseType}</h4>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Sessions:</span>
                      <span className="font-medium">{data.sessions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="font-medium">{data.total_duration} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Calories:</span>
                      <span className="font-medium">{data.total_calories}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exercise Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Exercise Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-green-600">🎯 Weekly Goals</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• 150 minutes moderate aerobic activity</li>
                <li>• 75 minutes vigorous aerobic activity</li>
                <li>• 2 days of strength training</li>
                <li>• Include flexibility and balance</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-blue-600">💡 Best Practices</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Warm up before exercising</li>
                <li>• Cool down and stretch after</li>
                <li>• Stay hydrated during workouts</li>
                <li>• Listen to your body</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ExerciseLogger;
