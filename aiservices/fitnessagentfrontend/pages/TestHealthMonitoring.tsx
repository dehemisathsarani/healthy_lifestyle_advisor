import React, { useState, useEffect } from 'react';
import RecoveryAdvice from '../components/RecoveryAdvice';
import HeartRateMonitor from '../components/HeartRateMonitor';
import SleepQualityMonitor from '../components/SleepQualityMonitor';
import ActivityTracker from '../components/ActivityTracker';
import { getHealthSummary } from '../healthApi';
import { demoMode } from '../api';

const TestHealthMonitoring: React.FC = () => {
  // Using userId directly without setter since it's not changed in this component
  const userId = 'test_user_id';
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeComponent, setActiveComponent] = useState<string>('summary');

  useEffect(() => {
    fetchHealthSummary();
  }, [date]);

  const fetchHealthSummary = async () => {
    try {
      setLoading(true);
      
      // Use demo data instead of calling the actual API
      if (demoMode.isDemoMode()) {
        console.log('Using demo health summary data for date:', date);
        const data = demoMode.getDemoHealthSummary(date);
        setSummary(data);
        setError(null);
      } else {
        const data = await getHealthSummary(date);
        setSummary(data);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching health summary:', err);
      setError('Failed to load health summary data');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
  };

  const renderComponent = () => {
    switch (activeComponent) {
      case 'recovery':
        return <RecoveryAdvice userId={userId} date={date} />;
      case 'heart-rate':
        return <HeartRateMonitor userId={userId} />;
      case 'sleep':
        return <SleepQualityMonitor userId={userId} />;
      case 'activity':
        return <ActivityTracker userId={userId} />;
      case 'summary':
      default:
        return renderSummary();
    }
  };

  const renderSummary = () => {
    if (loading) {
      return (
        <div className="p-6 bg-white rounded-lg shadow-md">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-6 bg-white rounded-lg shadow-md">
          <div className="text-red-500">{error}</div>
          <button
            onClick={fetchHealthSummary}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (!summary) {
      return (
        <div className="p-6 bg-white rounded-lg shadow-md">
          <div className="text-gray-500">No health data available for the selected date.</div>
        </div>
      );
    }

    return (
      <div className="p-6 bg-white rounded-lg shadow-md space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Steps</h3>
          <div className="flex items-center">
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-blue-600 h-4 rounded-full"
                style={{ width: `${summary.steps.goal_progress * 100}%` }}
              ></div>
            </div>
            <span className="ml-2 font-medium">{summary.steps.total} / 10,000</span>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Sleep</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-indigo-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Duration</p>
              <p className="text-xl font-semibold">
                {summary.sleep.duration_hours ? `${summary.sleep.duration_hours.toFixed(1)} hrs` : 'N/A'}
              </p>
            </div>
            <div className="bg-indigo-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Quality</p>
              <p className="text-xl font-semibold">
                {summary.sleep.quality_score ? `${summary.sleep.quality_score}/100` : 'N/A'}
              </p>
            </div>
            <div className="bg-indigo-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Deep Sleep</p>
              <p className="text-xl font-semibold">
                {summary.sleep.deep_sleep_hours ? `${summary.sleep.deep_sleep_hours.toFixed(1)} hrs` : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Heart Rate</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Average</p>
              <p className="text-xl font-semibold">
                {summary.heart_rate.average ? `${summary.heart_rate.average} bpm` : 'N/A'}
              </p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Min</p>
              <p className="text-xl font-semibold">
                {summary.heart_rate.min ? `${summary.heart_rate.min} bpm` : 'N/A'}
              </p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Max</p>
              <p className="text-xl font-semibold">
                {summary.heart_rate.max ? `${summary.heart_rate.max} bpm` : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Recovery</h3>
          <div className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-6 rounded-full">
            <div
              className="bg-white h-full w-1 rounded-full"
              style={{
                marginLeft: `${summary.recovery.score}%`,
                transform: 'translateX(-50%)',
              }}
            ></div>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs">0</span>
            <span className="text-xs font-medium">{summary.recovery.status}</span>
            <span className="text-xs">100</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Health Monitoring Test</h1>
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setActiveComponent('summary')}
            className={`px-3 py-1 rounded-md ${
              activeComponent === 'summary'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800'
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => setActiveComponent('recovery')}
            className={`px-3 py-1 rounded-md ${
              activeComponent === 'recovery'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800'
            }`}
          >
            Recovery Advice
          </button>
          <button
            onClick={() => setActiveComponent('heart-rate')}
            className={`px-3 py-1 rounded-md ${
              activeComponent === 'heart-rate'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800'
            }`}
          >
            Heart Rate
          </button>
          <button
            onClick={() => setActiveComponent('sleep')}
            className={`px-3 py-1 rounded-md ${
              activeComponent === 'sleep'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800'
            }`}
          >
            Sleep Quality
          </button>
          <button
            onClick={() => setActiveComponent('activity')}
            className={`px-3 py-1 rounded-md ${
              activeComponent === 'activity'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800'
            }`}
          >
            Activity Tracking
          </button>
        </div>
        <div className="flex items-center">
          <label htmlFor="date-select" className="mr-2 font-medium">
            Date:
          </label>
          <input
            id="date-select"
            type="date"
            value={date}
            onChange={handleDateChange}
            className="border border-gray-300 rounded px-2 py-1"
          />
        </div>
      </div>

      {renderComponent()}
    </div>
  );
};

export default TestHealthMonitoring;
