import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Activity, 
  Droplets, 
  Target, 
  TrendingUp, 
  Calendar,
  Heart,
  Scale,
  Zap,
  Plus,
  RefreshCw
} from 'lucide-react';
import { biometricApi, ComprehensiveDashboard, BiometricProfile } from '@/services/biometricApi';
import { nutritionApi } from '@/services/nutritionApi';
import BiometricProfileForm from './BiometricProfileForm';

interface HealthDashboardProps {
  onNavigateToProfile?: () => void;
}

export const HealthDashboard: React.FC<HealthDashboardProps> = ({
  onNavigateToProfile
}) => {
  const [dashboardData, setDashboardData] = useState<ComprehensiveDashboard | null>(null);
  const [nutritionOverview, setNutritionOverview] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProfileForm, setShowProfileForm] = useState(false);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Try to load comprehensive dashboard
      const dashboardResponse = await biometricApi.getComprehensiveDashboard();
      setDashboardData(dashboardResponse.dashboard);
      
      // Try to load nutrition overview
      try {
        const nutritionResponse = await nutritionApi.getNutritionStats();
        setNutritionOverview(nutritionResponse.data);
      } catch (nutritionError) {
        console.log('Nutrition data not available:', nutritionError);
      }
      
    } catch (error) {
      console.error('Dashboard error:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        setShowProfileForm(true);
      } else {
        setError('Failed to load dashboard data');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleQuickHydration = async (amount: number) => {
    try {
      await biometricApi.logHydration({
        amount_ml: amount,
        beverage_type: 'water',
        date: new Date().toISOString()
      });
      
      // Refresh dashboard data
      await loadDashboardData();
    } catch (error) {
      console.error('Failed to log hydration:', error);
    }
  };

  const handleProfileCreated = (_profile: BiometricProfile) => {
    setShowProfileForm(false);
    loadDashboardData();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading health dashboard...</span>
      </div>
    );
  }

  if (showProfileForm || !dashboardData) {
    return (
      <div className="space-y-4">
        <Alert className="border-blue-200 bg-blue-50">
          <Heart className="h-4 w-4" />
          <AlertDescription className="text-blue-800">
            Welcome! Let's set up your biometric profile to get personalized health insights.
          </AlertDescription>
        </Alert>
        <BiometricProfileForm onProfileCreated={handleProfileCreated} />
      </div>
    );
  }

  const { profile, today_hydration, weekly_exercise, recent_progress, health_score, dashboard_insights } = dashboardData;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Health Dashboard</h1>
          <p className="text-gray-600">Your comprehensive health overview</p>
        </div>
        <Button onClick={() => loadDashboardData()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Health Score */}
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Health Score</h2>
              <p className="opacity-90">
                {biometricApi.getHealthScoreDescription(health_score)}
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{health_score}</div>
              <div className="text-sm opacity-90">out of 100</div>
            </div>
          </div>
          <div className="mt-4">
            <Progress 
              value={health_score} 
              className="bg-white/20"
            />
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* BMI Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">BMI</p>
                <p className="text-2xl font-bold text-gray-900">
                  {profile.current_bmi?.toFixed(1)}
                </p>
                <p className={`text-sm ${biometricApi.getBMICategory(profile.current_bmi!).color}`}>
                  {biometricApi.getBMICategory(profile.current_bmi!).category}
                </p>
              </div>
              <Scale className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        {/* Daily Calories */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Daily Calories</p>
                <p className="text-2xl font-bold text-gray-900">
                  {profile.daily_calorie_goal?.toFixed(0)}
                </p>
                <p className="text-sm text-gray-500">
                  TDEE: {profile.tdee?.toFixed(0)}
                </p>
              </div>
              <Zap className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        {/* Hydration Today */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Hydration Today</p>
                <p className="text-2xl font-bold text-gray-900">
                  {((today_hydration?.total_intake || 0) / 1000).toFixed(1)}L
                </p>
                <p className="text-sm text-gray-500">
                  Goal: {((today_hydration?.goal || 0) / 1000).toFixed(1)}L
                </p>
              </div>
              <Droplets className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-4">
              <Progress 
                value={today_hydration?.percentage || 0}
                className="h-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                {(today_hydration?.percentage || 0).toFixed(0)}% of goal
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Exercise */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Weekly Exercise</p>
                <p className="text-2xl font-bold text-gray-900">
                  {weekly_exercise?.total_calories_burned?.toFixed(0) || 0}
                </p>
                <p className="text-sm text-gray-500">
                  {weekly_exercise?.total_sessions || 0} sessions
                </p>
              </div>
              <Activity className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              onClick={() => handleQuickHydration(250)}
              variant="outline"
              className="h-12"
            >
              <Droplets className="h-4 w-4 mr-2" />
              +250ml Water
            </Button>
            <Button 
              onClick={() => handleQuickHydration(500)}
              variant="outline"
              className="h-12"
            >
              <Droplets className="h-4 w-4 mr-2" />
              +500ml Water
            </Button>
            <Button 
              onClick={onNavigateToProfile}
              variant="outline"
              className="h-12"
            >
              <Target className="h-4 w-4 mr-2" />
              Log Exercise
            </Button>
            <Button 
              onClick={onNavigateToProfile}
              variant="outline"
              className="h-12"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Weekly Progress
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      {dashboard_insights && dashboard_insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Personalized Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboard_insights.map((insight, index) => (
                <Alert key={index} className="border-blue-200 bg-blue-50">
                  <AlertDescription className="text-blue-800">
                    {insight}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hydration Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5" />
              Today's Hydration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Total Intake</span>
                <span className="font-semibold">
                  {today_hydration?.total_intake || 0}ml
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Goal</span>
                <span className="font-semibold">
                  {today_hydration?.goal || 0}ml
                </span>
              </div>
              <Progress value={today_hydration?.percentage || 0} />
              <div className="text-sm text-gray-600">
                {today_hydration?.entries?.length || 0} drinks logged today
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exercise Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Weekly Exercise Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Total Sessions</span>
                <span className="font-semibold">
                  {weekly_exercise?.total_sessions || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Total Duration</span>
                <span className="font-semibold">
                  {weekly_exercise?.total_duration_minutes || 0} min
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Calories Burned</span>
                <span className="font-semibold">
                  {weekly_exercise?.total_calories_burned?.toFixed(0) || 0}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Avg: {weekly_exercise?.avg_calories_per_day?.toFixed(0) || 0} cal/day
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Nutrition Integration */}
      {nutritionOverview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Nutrition Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-800">
                  {nutritionOverview.total_logs || 0}
                </div>
                <div className="text-sm text-green-600">
                  Meals Logged
                </div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-800">
                  {nutritionOverview.avg_daily_calories?.toFixed(0) || 0}
                </div>
                <div className="text-sm text-blue-600">
                  Avg Daily Calories
                </div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-800">
                  {nutritionOverview.weekly_reports || 0}
                </div>
                <div className="text-sm text-purple-600">
                  Weekly Reports
                </div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-800">
                  {nutritionOverview.health_score || 'N/A'}
                </div>
                <div className="text-sm text-yellow-600">
                  Nutrition Score
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Progress */}
      {recent_progress && recent_progress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recent_progress.slice(0, 3).map((progress, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">
                      Week of {new Date(progress.week_start_date).toLocaleDateString()}
                    </div>
                    {progress.weight && (
                      <div className="text-sm text-gray-600">
                        Weight: {progress.weight}kg
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {progress.notes && progress.notes.length > 50 
                      ? `${progress.notes.substring(0, 50)}...`
                      : progress.notes
                    }
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default HealthDashboard;
