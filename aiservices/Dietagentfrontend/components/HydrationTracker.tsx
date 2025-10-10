import * as React from 'react';
import { apiClient } from '../api';
import type { HydrationSummary, HydrationUpdateRequest } from '../api';

interface HydrationTrackerProps {
  onUpdate?: () => void;
}

const HydrationTracker = ({ onUpdate }: HydrationTrackerProps): JSX.Element => {
  const [hydrationData, setHydrationData] = React.useState(null as HydrationSummary | null);
  const [waterAmount, setWaterAmount] = React.useState(250); // Default 250ml
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null as string | null);

  // Load initial hydration data
  React.useEffect(() => {
    fetchHydrationData();
  }, []);

  // Fetch hydration data from backend
  const fetchHydrationData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getHydrationReminder();
      setHydrationData(data);
    } catch (err) {
      setError("Failed to load hydration data. Please try again.");
      console.error("Hydration data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle water intake tracking
  const handleAddWater = async () => {
    try {
      setLoading(true);
      setError(null);

      const hydrationRequest: HydrationUpdateRequest = {
        amount_ml: waterAmount,
        timestamp: new Date().toISOString()
      };

      const result = await apiClient.updateHydration(hydrationRequest);
      setHydrationData(result.hydration_summary);
      
      // Call the parent's update callback if provided
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      setError("Failed to update water intake. Please try again.");
      console.error("Water intake update error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate progress width for the progress bar
  const getProgressWidth = () => {
    if (!hydrationData) return "0%";
    return `${Math.min(100, hydrationData.percent_complete)}%`;
  };

  // Format water amount to display
  const formatWaterAmount = (ml: number): string => {
    if (ml >= 1000) {
      return `${(ml / 1000).toFixed(1)}L`;
    }
    return `${ml}ml`;
  };

  // Determine the color based on progress
  const getProgressColor = () => {
    if (!hydrationData) return "bg-blue-300";
    const percent = hydrationData.percent_complete;
    if (percent < 30) return "bg-blue-300";
    if (percent < 60) return "bg-blue-400";
    if (percent < 90) return "bg-blue-500";
    return "bg-blue-600";
  };

  // Quick water amount options
  const waterAmountOptions = [100, 250, 500, 750];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Hydration Tracker</h2>
      
      {/* Loading and Error states */}
      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      
      {/* Hydration Progress */}
      {hydrationData && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Daily Goal: {formatWaterAmount(hydrationData.daily_target)}</span>
            <span className="text-sm font-medium text-blue-600">
              {formatWaterAmount(hydrationData.water_consumed)} / {formatWaterAmount(hydrationData.daily_target)}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full h-4 bg-gray-200 rounded-full">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${getProgressColor()}`} 
              style={{ width: getProgressWidth() }}
            ></div>
          </div>
          
          {/* Remaining Amount */}
          <p className="mt-2 text-sm text-gray-600">
            Remaining: {formatWaterAmount(hydrationData.remaining)}
          </p>
          
          {/* Reminder Message */}
          {hydrationData.reminder_message && (
            <p className="mt-4 text-sm text-blue-600 italic">
              {hydrationData.reminder_message}
            </p>
          )}
        </div>
      )}
      
      {/* Add Water Form */}
      <div className="mt-6">
        <h3 className="text-md font-medium text-gray-700 mb-3">Log Water Intake</h3>
        
        {/* Quick Select Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {waterAmountOptions.map(amount => (
            <button
              key={amount}
              onClick={() => setWaterAmount(amount)}
              className={`px-3 py-1 rounded text-sm ${
                waterAmount === amount 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {formatWaterAmount(amount)}
            </button>
          ))}
        </div>
        
        {/* Custom Amount Input */}
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="10"
            max="2000"
            value={waterAmount}
            onChange={(e) => setWaterAmount(Number(e.target.value))}
            className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-600 text-sm">ml</span>
          <button
            onClick={handleAddWater}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Water'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HydrationTracker;
