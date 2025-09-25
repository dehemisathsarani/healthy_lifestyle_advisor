import React, { useState, useRef } from 'react';
import { apiClient, type AnalysisResponse, type UserProfile } from '../api';

interface FoodAnalyzerProps {
  onAnalysisComplete: (result: AnalysisResponse) => void;
  onAnalysisStart: () => void;
}

const FoodAnalyzer: React.FC<FoodAnalyzerProps> = ({ 
  onAnalysisComplete, 
  onAnalysisStart 
}) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [mealType, setMealType] = useState<string>('meal');
  const [textMode, setTextMode] = useState(false);
  const [mealDescription, setMealDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    try {
      setAnalyzing(true);
      onAnalysisStart();
      
      // Mock user profile - in real app this would come from context
      const userProfile: UserProfile = {
        user_id: 'user-001',
        age: 30,
        gender: 'male',
        height_cm: 175,
        weight_kg: 70,
        activity_level: 'moderate',
        goal: 'maintain'
      };
      
      const result = await apiClient.analyzeImageMeal(userProfile, file);
      
      // Handle async processing
      if (result.status === 'processing' && result.request_id) {
        // Poll for result every 2 seconds
        let attempts = 0;
        const maxAttempts = 30; // 1 minute max wait
        
        const pollResult = async (): Promise<void> => {
          try {
            const pollResponse = await apiClient.getAnalysisResult(result.request_id);
            
            if (pollResponse.status === 'completed') {
              onAnalysisComplete(pollResponse);
            } else if (pollResponse.status === 'failed') {
              throw new Error(pollResponse.error || 'Analysis failed');
            } else if (attempts < maxAttempts) {
              attempts++;
              setTimeout(pollResult, 2000);
            } else {
              throw new Error('Analysis timeout');
            }
          } catch (error) {
            console.error('Polling error:', error);
            throw error;
          }
        };
        
        await pollResult();
      } else {
        onAnalysisComplete(result);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleTextAnalysis = async () => {
    if (!mealDescription.trim()) {
      alert('Please enter a meal description');
      return;
    }

    try {
      setAnalyzing(true);
      onAnalysisStart();
      
      // Mock user profile - in real app this would come from context
      const userProfile: UserProfile = {
        user_id: 'user-001',
        age: 30,
        gender: 'male',
        height_cm: 175,
        weight_kg: 70,
        activity_level: 'moderate',
        goal: 'maintain'
      };
      
      const result = await apiClient.analyzeTextMeal(userProfile, mealDescription);
      
      // Handle async processing
      if (result.status === 'processing' && result.request_id) {
        // Poll for result every 2 seconds
        let attempts = 0;
        const maxAttempts = 30; // 1 minute max wait
        
        const pollResult = async (): Promise<void> => {
          try {
            const pollResponse = await apiClient.getAnalysisResult(result.request_id);
            
            if (pollResponse.status === 'completed') {
              onAnalysisComplete(pollResponse);
            } else if (pollResponse.status === 'failed') {
              throw new Error(pollResponse.error || 'Analysis failed');
            } else if (attempts < maxAttempts) {
              attempts++;
              setTimeout(pollResult, 2000);
            } else {
              throw new Error('Analysis timeout');
            }
          } catch (error) {
            console.error('Polling error:', error);
            throw error;
          }
        };
        
        await pollResult();
      } else {
        onAnalysisComplete(result);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">🍽️ Analyze Your Meal</h2>
      
      {/* Mode Toggle */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setTextMode(false)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            !textMode 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          📸 Photo Analysis
        </button>
        <button
          onClick={() => setTextMode(true)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            textMode 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          ✍️ Text Description
        </button>
      </div>

      {/* Meal Type Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Meal Type
        </label>
        <select
          value={mealType}
          onChange={(e) => setMealType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="breakfast">🌅 Breakfast</option>
          <option value="lunch">☀️ Lunch</option>
          <option value="dinner">🌙 Dinner</option>
          <option value="snack">🍪 Snack</option>
          <option value="meal">🍽️ General Meal</option>
        </select>
      </div>

      {textMode ? (
        /* Text Input Mode */
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe your meal
            </label>
            <textarea
              value={mealDescription}
              onChange={(e) => setMealDescription(e.target.value)}
              placeholder="E.g., Grilled chicken breast with quinoa and steamed broccoli, olive oil dressing"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
            />
          </div>
          <button
            onClick={handleTextAnalysis}
            disabled={analyzing || !mealDescription.trim()}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              analyzing || !mealDescription.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {analyzing ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Analyzing...</span>
              </div>
            ) : (
              '🔍 Analyze Meal Description'
            )}
          </button>
        </div>
      ) : (
        /* Image Upload Mode */
        <div>
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files && handleFile(e.target.files[0])}
              className="hidden"
            />
            
            {analyzing ? (
              <div className="space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-600">Analyzing your food image...</p>
                <p className="text-sm text-gray-500">This may take up to 30 seconds</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-6xl">📸</div>
                <div>
                  <p className="text-xl font-medium text-gray-700 mb-2">
                    Drop your food image here
                  </p>
                  <p className="text-gray-500 mb-4">
                    or click to browse files
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Choose Image
                  </button>
                </div>
                <p className="text-xs text-gray-400">
                  Supported formats: JPG, PNG, WebP (max 10MB)
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h3 className="text-sm font-medium text-yellow-800 mb-2">💡 Tips for better analysis:</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Take clear photos with good lighting</li>
          <li>• Include the entire meal in the frame</li>
          <li>• Be specific in text descriptions (include cooking methods, portions)</li>
          <li>• Mention ingredients and seasonings when possible</li>
        </ul>
      </div>
    </div>
  );
};

export default FoodAnalyzer;
