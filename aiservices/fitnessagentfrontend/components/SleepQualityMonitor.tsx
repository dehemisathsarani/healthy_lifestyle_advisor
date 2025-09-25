import React, { useState, useEffect } from 'react';
import { getSleepData, SleepData } from '../healthApi';
import { Bar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { demoMode } from '../api';

// Register Chart.js components
Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface SleepQualityMonitorProps {
  userId: string;
}

const SleepQualityMonitor: React.FC<SleepQualityMonitorProps> = ({ userId }) => {
  const [sleepData, setSleepData] = useState<SleepData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string>('7d');

  useEffect(() => {
    fetchSleepData();
  }, [userId, timeRange]);

  const fetchSleepData = async () => {
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
        console.log('Using demo sleep data');
        const data = demoMode.getSleepData(startDate, endDate);
        setSleepData(data);
        setError(null);
      } else {
        const data = await getSleepData(startDate, endDate);
        setSleepData(data);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching sleep data:', err);
      setError('Failed to load sleep data');
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data for sleep duration
  const prepareDurationChartData = () => {
    if (!sleepData.length) return null;
    
    const sortedData = [...sleepData].sort((a, b) => 
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
    
    return {
      labels: sortedData.map(data => {
        const date = new Date(data.start_time);
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }),
      datasets: [
        {
          label: 'Deep Sleep',
          data: sortedData.map(data => data.deep_sleep_minutes ? data.deep_sleep_minutes / 60 : 0),
          backgroundColor: 'rgba(54, 162, 235, 0.8)',
          stack: 'Stack 0',
        },
        {
          label: 'REM Sleep',
          data: sortedData.map(data => data.rem_sleep_minutes ? data.rem_sleep_minutes / 60 : 0),
          backgroundColor: 'rgba(153, 102, 255, 0.8)',
          stack: 'Stack 0',
        },
        {
          label: 'Light Sleep',
          data: sortedData.map(data => data.light_sleep_minutes ? data.light_sleep_minutes / 60 : 0),
          backgroundColor: 'rgba(75, 192, 192, 0.8)',
          stack: 'Stack 0',
        },
        {
          label: 'Awake',
          data: sortedData.map(data => data.awake_minutes ? data.awake_minutes / 60 : 0),
          backgroundColor: 'rgba(255, 99, 132, 0.8)',
          stack: 'Stack 0',
        }
      ]
    };
  };

  const durationChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Sleep Duration Breakdown'
      },
      tooltip: {
        callbacks: {
          footer: (tooltipItems: any) => {
            const dataIndex = tooltipItems[0].dataIndex;
            const datasetIndex = tooltipItems[0].datasetIndex;
            if (datasetIndex === 0) {
              const data = sleepData[dataIndex];
              if (data && data.sleep_score) {
                return `Sleep Quality: ${data.sleep_score}/100`;
              }
            }
            return '';
          },
        }
      }
    },
    scales: {
      x: {
        stacked: true,
        title: {
          display: true,
          text: 'Date'
        }
      },
      y: {
        stacked: true,
        title: {
          display: true,
          text: 'Hours'
        }
      }
    }
  };

  const durationChartData = prepareDurationChartData();
  
  // Calculate sleep statistics
  const calculateStats = () => {
    if (!sleepData.length) return { 
      avgDuration: 0, 
      avgQuality: 0, 
      avgDeepSleep: 0,
      consistency: 0 
    };
    
    // Calculate average duration in hours
    const avgDuration = sleepData.reduce((sum, data) => 
      sum + data.duration_minutes, 0) / (sleepData.length * 60);
    
    // Calculate average quality score
    const qualityScores = sleepData.filter(data => data.sleep_score !== undefined);
    const avgQuality = qualityScores.length > 0 
      ? qualityScores.reduce((sum, data) => sum + (data.sleep_score || 0), 0) / qualityScores.length
      : 0;
      
    // Calculate average deep sleep percentage
    const deepSleepPercentage = sleepData.reduce((sum, data) => 
      sum + (data.deep_sleep_minutes || 0) / (data.duration_minutes || 1), 0) / sleepData.length;
    
    // Calculate sleep consistency (standard deviation of start times converted to 0-100 scale)
    const startTimes = sleepData.map(data => {
      const date = new Date(data.start_time);
      return date.getHours() * 60 + date.getMinutes(); // Minutes since midnight
    });
    
    const avgStartTime = startTimes.reduce((sum, time) => sum + time, 0) / startTimes.length;
    const varianceSum = startTimes.reduce((sum, time) => {
      const diff = time - avgStartTime;
      return sum + diff * diff;
    }, 0);
    
    const stdDev = Math.sqrt(varianceSum / startTimes.length);
    // Convert stdDev to a 0-100 scale where lower stdDev means higher consistency
    const consistency = Math.max(0, Math.min(100, 100 - (stdDev / 2)));
    
    return { 
      avgDuration: parseFloat(avgDuration.toFixed(1)),
      avgQuality: Math.round(avgQuality), 
      avgDeepSleep: Math.round(deepSleepPercentage * 100),
      consistency: Math.round(consistency)
    };
  };
  
  const stats = calculateStats();

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Sleep Quality Monitor</h2>
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
      ) : sleepData.length === 0 ? (
        <div className="text-center p-4 text-gray-500">No sleep data available</div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-indigo-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500">Average Duration</p>
              <p className="text-2xl font-bold text-gray-800">{stats.avgDuration}<span className="text-xs ml-1">hrs</span></p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500">Sleep Quality</p>
              <p className="text-2xl font-bold text-gray-800">{stats.avgQuality}<span className="text-xs ml-1">/100</span></p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500">Deep Sleep</p>
              <p className="text-2xl font-bold text-gray-800">{stats.avgDeepSleep}<span className="text-xs ml-1">%</span></p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500">Consistency</p>
              <p className="text-2xl font-bold text-gray-800">{stats.consistency}<span className="text-xs ml-1">%</span></p>
            </div>
          </div>

          <div className="h-64">
            {durationChartData && <Bar options={durationChartOptions} data={durationChartData} />}
          </div>
          
          {/* Sleep quality tips */}
          <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
            <h3 className="font-medium text-gray-700 mb-2">Sleep Quality Tips</h3>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Maintain a consistent sleep schedule, even on weekends</li>
              <li>Avoid caffeine and electronics before bedtime</li>
              <li>Create a cool, dark, and quiet sleeping environment</li>
              <li>Exercise regularly, but not too close to bedtime</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default SleepQualityMonitor;
