import React, { useState } from 'react';
import { apiFetch } from '../../lib/api';

export const DebugPanel: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testHealthEndpoint = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/mental-health/health');
      const data = await response.json();
      setTestResult(`Health Check: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setTestResult(`Health Check Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testWithApiFetch = async () => {
    setIsLoading(true);
    try {
      const response = await apiFetch('/api/mental-health/health');
      const data = await response.json();
      setTestResult(`ApiFetch Test: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setTestResult(`ApiFetch Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testMoodTrack = async () => {
    setIsLoading(true);
    try {
      const response = await apiFetch('/api/mental-health/mood/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mood_score: 7,
          notes: 'Debug test'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setTestResult(`Mood Track Success: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setTestResult(`Mood Track Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h3 className="font-bold text-yellow-800 mb-4">🔧 Debug Panel</h3>
      
      <div className="space-y-2 mb-4">
        <button
          onClick={testHealthEndpoint}
          disabled={isLoading}
          className="mr-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:bg-gray-300"
        >
          Test Health (Direct)
        </button>
        
        <button
          onClick={testWithApiFetch}
          disabled={isLoading}
          className="mr-2 px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:bg-gray-300"
        >
          Test Health (ApiFetch)
        </button>
        
        <button
          onClick={testMoodTrack}
          disabled={isLoading}
          className="mr-2 px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 disabled:bg-gray-300"
        >
          Test Mood Track
        </button>
      </div>
      
      {testResult && (
        <div className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-auto max-h-40 font-mono">
          <pre>{testResult}</pre>
        </div>
      )}
    </div>
  );
};
