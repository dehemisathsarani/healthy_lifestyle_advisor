import React, { useState, useEffect } from 'react';
import { getActivityData, ActivityData } from '../healthApi';
import { Line } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { demoMode } from '../api';

// Register Chart.js components
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface ActivityTrackerProps {
  userId: string;
}

const ActivityTracker: React.FC<ActivityTrackerProps> = ({ userId }) => {
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string>('7d');

  useEffect(() => {
    fetchActivityData();
  }, [userId, timeRange]);

  const fetchActivityData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range based on selected time range
      const endDate = new Date().toISOString().split('T')[0];
      let startDate: string;
      
      switch (timeRange) {
        case '7d':
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case '30d':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case '90d':
          startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        default:
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      }
      
      if (demoMode.isDemoMode()) {
        console.log('Using demo activity data');
        const data = demoMode.getActivityData(startDate, endDate);
        setActivityData(data);
        setError(null);
      } else {
        const data = await getActivityData(startDate, endDate);
        setActivityData(data);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching activity data:', err);
      setError('Failed to load activity data');
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data for steps
  const prepareStepsChartData = () => {
    if (!activityData.length) return null;
    
    const sortedData = [...activityData].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    return {
      labels: sortedData.map(data => {
        const date = new Date(data.timestamp);
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }),
      datasets: [
        {
          label: 'Steps',
          data: sortedData.map(data => data.count),
          fill: false,
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          borderColor: 'rgb(16, 185, 129)',
          tension: 0.1
        }
      ]
    };
  };

  // Prepare chart data for distance
  const prepareDistanceChartData = () => {
    if (!activityData.length) return null;
    
    const sortedData = [...activityData].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    return {
      labels: sortedData.map(data => {
        const date = new Date(data.timestamp);
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }),
      datasets: [
        {
          label: 'Distance (km)',
          data: sortedData.map(data => data.distance_meters ? data.distance_meters / 1000 : 0),
          fill: false,
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: 'rgb(59, 130, 246)',
          tension: 0.1
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          title: (context: any) => {
            return `Date: ${context[0].label}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Count'
        }
      }
    }
  };

  const distanceChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Distance (km)'
        }
      }
    }
  };

  const stepsChartData = prepareStepsChartData();
  const distanceChartData = prepareDistanceChartData();
  
  // Calculate activity statistics
  const calculateStats = () => {
    if (!activityData.length) return { 
      avgSteps: 0, 
      totalDistance: 0, 
      avgDistance: 0,
      goalCompletionRate: 0
    };
    
    const totalSteps = activityData.reduce((sum, data) => sum + data.count, 0);
    const avgSteps = Math.round(totalSteps / activityData.length);
    
    const totalDistance = activityData.reduce((sum, data) => 
      sum + (data.distance_meters || 0), 0) / 1000; // Convert to km
      
    const avgDistance = totalDistance / activityData.length;
    
    // Assuming daily goal of 10,000 steps
    const daysMetGoal = activityData.filter(data => data.count >= 10000).length;
    const goalCompletionRate = (daysMetGoal / activityData.length) * 100;
    
    return { 
      avgSteps, 
      totalDistance: parseFloat(totalDistance.toFixed(1)), 
      avgDistance: parseFloat(avgDistance.toFixed(1)),
      goalCompletionRate: Math.round(goalCompletionRate)
    };
  };
  
  const stats = calculateStats();
  
  // Get today's data
  const getTodayData = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayData = activityData.find(data => {
      const dataDate = new Date(data.timestamp).toISOString().split('T')[0];
      return dataDate === today;
    });
    
    return todayData || { count: 0, distance_meters: 0, floors_climbed: 0 };
  };
  
  const todayData = getTodayData();
  const goalProgress = Math.min(100, (todayData.count / 10000) * 100);

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Activity Tracker</h2>
        <div className="mt-3 md:mt-0">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => setTimeRange('7d')}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                timeRange === '7d' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border border-gray-200`}
            >
              7d
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('30d')}
              className={`px-4 py-2 text-sm font-medium ${
                timeRange === '30d' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border-t border-b border-gray-200`}
            >
              30d
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('90d')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                timeRange === '90d' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border border-gray-200`}
            >
              90d
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse h-64 bg-gray-100 rounded"></div>
      ) : error ? (
        <div className="text-center p-4 text-red-600">{error}</div>
      ) : activityData.length === 0 ? (
        <div className="text-center p-4 text-gray-500">No activity data available</div>
      ) : (
        <>
          {/* Today's progress */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium">Today's Steps</h3>
              <span className="text-lg font-semibold">{todayData.count.toLocaleString()} / 10,000</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-green-500 h-3 rounded-full"
                style={{ width: `${goalProgress}%` }}
              ></div>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500">Distance</p>
                <p className="font-medium">{todayData.distance_meters ? (todayData.distance_meters / 1000).toFixed(2) : 0} km</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Floors Climbed</p>
                <p className="font-medium">{todayData.floors_climbed || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Goal Progress</p>
                <p className="font-medium">{Math.round(goalProgress)}%</p>
              </div>
            </div>
          </div>

          {/* Activity stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500">Avg Steps</p>
              <p className="text-2xl font-bold text-gray-800">{stats.avgSteps.toLocaleString()}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500">Total Distance</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalDistance}<span className="text-xs ml-1">km</span></p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500">Avg Distance</p>
              <p className="text-2xl font-bold text-gray-800">{stats.avgDistance}<span className="text-xs ml-1">km</span></p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500">Goals Met</p>
              <p className="text-2xl font-bold text-gray-800">{stats.goalCompletionRate}<span className="text-xs ml-1">%</span></p>
            </div>
          </div>

          {/* Steps chart */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Steps History</h3>
            <div className="h-64">
              {stepsChartData && <Line options={chartOptions} data={stepsChartData} />}
            </div>
          </div>
          
          {/* Distance chart */}
          <div>
            <h3 className="text-lg font-medium mb-3">Distance History</h3>
            <div className="h-64">
              {distanceChartData && <Line options={distanceChartOptions} data={distanceChartData} />}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ActivityTracker;
