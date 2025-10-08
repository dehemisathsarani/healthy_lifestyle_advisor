import React, { useState, useEffect } from 'react';
import { getHeartRateData, HeartRateData } from '../healthApi';
import { Line } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { demoMode } from '../api';

// Register Chart.js components
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface HeartRateMonitorProps {
  userId: string;
}

const HeartRateMonitor: React.FC<HeartRateMonitorProps> = ({ userId }) => {
  const [heartRateData, setHeartRateData] = useState<HeartRateData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string>('24h');

  useEffect(() => {
    fetchHeartRateData();
  }, [userId, timeRange]);

  const fetchHeartRateData = async () => {
    try {
      setLoading(true);
      
      // Calculate start time based on selected range
      const endTime = new Date().toISOString();
      let startTime: string;
      
      switch (timeRange) {
        case '24h':
          startTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          break;
        case '7d':
          startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          break;
        case '30d':
          startTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
          break;
        default:
          startTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      }
      
      if (demoMode.isDemoMode()) {
        console.log('Using demo heart rate data');
        const data = demoMode.getHeartRateData(startTime, endTime);
        setHeartRateData(data);
        setError(null);
      } else {
        const data = await getHeartRateData(startTime, endTime);
        setHeartRateData(data);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching heart rate data:', err);
      setError('Failed to load heart rate data');
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const prepareChartData = () => {
    if (!heartRateData.length) return null;
    
    const sortedData = [...heartRateData].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    return {
      labels: sortedData.map(data => {
        const date = new Date(data.timestamp);
        return timeRange === '24h' 
          ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : date.toLocaleDateString();
      }),
      datasets: [
        {
          label: 'Heart Rate (BPM)',
          data: sortedData.map(data => data.bpm),
          fill: false,
          backgroundColor: 'rgba(220, 38, 38, 0.2)',
          borderColor: 'rgba(220, 38, 38, 1)',
          tension: 0.4
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
      title: {
        display: true,
        text: 'Heart Rate Over Time'
      }
    },
    scales: {
      y: {
        min: 40,
        max: 180,
        title: {
          display: true,
          text: 'BPM'
        }
      }
    }
  };

  const chartData = prepareChartData();
  
  // Calculate statistics
  const calculateStats = () => {
    if (!heartRateData.length) return { avg: 0, min: 0, max: 0, resting: 0 };
    
    const bpmValues = heartRateData.map(d => d.bpm);
    const avg = Math.round(bpmValues.reduce((sum, val) => sum + val, 0) / bpmValues.length);
    const min = Math.min(...bpmValues);
    const max = Math.max(...bpmValues);
    
    // Calculate resting heart rate (lowest 5% of readings)
    const restingValues = [...bpmValues].sort((a, b) => a - b);
    const restingCount = Math.max(1, Math.floor(restingValues.length * 0.05));
    const resting = Math.round(
      restingValues.slice(0, restingCount).reduce((sum, val) => sum + val, 0) / restingCount
    );
    
    return { avg, min, max, resting };
  };
  
  const stats = calculateStats();

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Heart Rate Monitor</h2>
        <div className="mt-3 md:mt-0">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => setTimeRange('24h')}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                timeRange === '24h' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border border-gray-200`}
            >
              24h
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('7d')}
              className={`px-4 py-2 text-sm font-medium ${
                timeRange === '7d' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border-t border-b border-r border-gray-200`}
            >
              7d
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('30d')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                timeRange === '30d' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border border-gray-200`}
            >
              30d
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse h-64 bg-gray-100 rounded"></div>
      ) : error ? (
        <div className="text-center p-4 text-red-600">{error}</div>
      ) : heartRateData.length === 0 ? (
        <div className="text-center p-4 text-gray-500">No heart rate data available</div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500">Resting</p>
              <p className="text-2xl font-bold text-gray-800">{stats.resting}<span className="text-xs ml-1">bpm</span></p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500">Average</p>
              <p className="text-2xl font-bold text-gray-800">{stats.avg}<span className="text-xs ml-1">bpm</span></p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500">Minimum</p>
              <p className="text-2xl font-bold text-gray-800">{stats.min}<span className="text-xs ml-1">bpm</span></p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500">Maximum</p>
              <p className="text-2xl font-bold text-gray-800">{stats.max}<span className="text-xs ml-1">bpm</span></p>
            </div>
          </div>

          <div className="h-64">
            {chartData && <Line options={chartOptions} data={chartData} />}
          </div>
        </>
      )}
    </div>
  );
};

export default HeartRateMonitor;
