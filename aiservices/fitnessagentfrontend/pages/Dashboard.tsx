import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient, demoMode, type FitnessDashboardData } from '../api';

const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<FitnessDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use demo data in development mode or if API isn't available
        if (demoMode.isDemoMode()) {
          // Get the default demo dashboard data
          const demoData = demoMode.getDemoDashboardData();
          
          try {
            // Check if we have a saved active plan in localStorage
            const activePlanJson = localStorage.getItem('activeWorkoutPlan');
            if (activePlanJson) {
              const savedPlan = JSON.parse(activePlanJson);
              // Update the active plan in the dashboard data
              demoData.active_plan = savedPlan;
              
              // Also update the upcoming workout based on the first workout session
              if (savedPlan.workout_sessions && savedPlan.workout_sessions.length > 0) {
                demoData.upcoming_workout = savedPlan.workout_sessions[0];
              }
            }
            
            setDashboardData(demoData);
          } catch (err) {
            console.error('Error retrieving saved workout plan:', err);
            setDashboardData(demoData);
          }
        } else {
          const data = await apiClient.getDashboardData();
          setDashboardData(data);
        }
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
        // Fallback to demo data on error
        setDashboardData(demoMode.getDemoDashboardData());
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your fitness dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-red-700">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fitness Dashboard</h1>
          <p className="text-gray-600">Track your progress and upcoming workouts</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link 
            to="/planner" 
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition"
          >
            Plan New Workout
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Workout Streak"
          value={dashboardData.workout_streak.toString()}
          icon={
            <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <StatCard
          title="Total Workouts"
          value={dashboardData.total_workouts_completed.toString()}
          icon={
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          }
        />
        <StatCard
          title="Total Calories"
          value={`${dashboardData.total_calories_burned.toLocaleString()}`}
          unit="kcal"
          icon={
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
        <StatCard
          title="Consistency"
          value={`${dashboardData.fitness_stats.workout_consistency}%`}
          icon={
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
      </div>

      {/* Active Workout Plan */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Active Workout Plan</h2>
        {dashboardData.active_plan ? (
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
              <div>
                <h3 className="text-lg font-medium text-indigo-700">{dashboardData.active_plan.name}</h3>
                <p className="text-gray-600">{dashboardData.active_plan.description}</p>
              </div>
              <div className="mt-2 md:mt-0 flex items-center">
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800 mr-2">
                  {dashboardData.active_plan.difficulty}
                </span>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  {dashboardData.active_plan.duration_weeks} weeks
                </span>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-4">
              <div className="flex flex-col md:flex-row justify-between">
                <div>
                  <p className="text-gray-700 font-medium">Goal: {dashboardData.active_plan.goal}</p>
                </div>
                <div className="mt-2 md:mt-0">
                  <Link 
                    to={`/workout/${dashboardData.active_plan.id}`} 
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    View Full Plan →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <h3 className="text-lg font-medium text-gray-700 mb-2">No Active Workout Plan</h3>
            <p className="text-gray-500 mb-4">Create a personalized workout plan to get started</p>
            <Link 
              to="/planner" 
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition"
            >
              Create Workout Plan
            </Link>
          </div>
        )}
      </div>

      {/* Upcoming Workout */}
      {dashboardData.upcoming_workout && !dashboardData.upcoming_workout.rest_day && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Upcoming Workout</h2>
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-indigo-700">{dashboardData.upcoming_workout.name}</h3>
                <p className="text-gray-600">Focus: {dashboardData.upcoming_workout.focus}</p>
              </div>
              <div className="flex items-center">
                <span className="mr-2">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <span className="text-gray-700">{dashboardData.upcoming_workout.total_duration} min</span>
                <span className="mx-2">•</span>
                <span className="flex items-center">
                  <svg className="w-5 h-5 text-red-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-gray-700">{dashboardData.upcoming_workout.total_calories} kcal</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Activity */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Weekly Activity</h2>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="grid grid-cols-7 gap-2">
            {dashboardData.weekly_activity_summary.map((day, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="text-sm text-gray-600 mb-1">
                  {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}
                </div>
                {day.workouts_completed > 0 ? (
                  <div 
                    className="w-full bg-indigo-500 rounded-md"
                    style={{ 
                      height: `${Math.min(20 + day.minutes_active / 2, 100)}px`
                    }}
                  >
                    <div className="h-full w-full flex items-center justify-center text-white text-xs font-bold">
                      {day.calories_burned}
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-20 bg-gray-200 rounded-md flex items-center justify-center text-gray-400 text-xs">
                    --
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  unit?: string;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, unit, icon }) => {
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <div className="flex items-center">
        <div className="mr-4">{icon}</div>
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-2xl font-bold text-gray-800">
            {value}
            {unit && <span className="text-base font-normal text-gray-500 ml-1">{unit}</span>}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
