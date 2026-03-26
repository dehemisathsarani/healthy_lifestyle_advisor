import React, { useState } from 'react';
import FoodAnalyzer from '../components/FoodAnalyzer';
import AnalysisResults from '../components/AnalysisResults';
import type { AnalysisResponse } from '../api';

const SubmitMeal: React.FC = () => {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalysisStart = () => {
    setAnalyzing(true);
    setAnalysisResult(null);
  };

  const handleAnalysisComplete = (result: AnalysisResponse) => {
    setAnalyzing(false);
    setAnalysisResult(result);
  };

  const handleSaveMeal = async () => {
    // The meal is already saved in the backend when analysis completes
    alert('Meal saved to your food log! 📝');
    handleNewAnalysis();
  };

  const handleNewAnalysis = () => {
    setAnalysisResult(null);
    setAnalyzing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🍽️ Analyze Your Meal
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Take a photo of your food or describe what you're eating, and get instant 
            AI-powered nutrition analysis with personalized recommendations.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {analyzing && (
            <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-blue-800 mb-2">
                🤖 AI Analysis in Progress
              </h3>
              <p className="text-blue-600">
                Our AI is analyzing your meal using computer vision and nutrition databases...
              </p>
              <div className="mt-4 text-sm text-blue-500">
                This usually takes 10-30 seconds
              </div>
            </div>
          )}

          {!analysisResult && !analyzing && (
            <FoodAnalyzer
              onAnalysisStart={handleAnalysisStart}
              onAnalysisComplete={handleAnalysisComplete}
            />
          )}

          {analysisResult && analysisResult.detected_foods && (
            <AnalysisResults
              detectedFoods={analysisResult.detected_foods}
              totalNutrition={analysisResult.total_nutrition!}
              advice={analysisResult.advice!}
              onSaveMeal={handleSaveMeal}
              onNewAnalysis={handleNewAnalysis}
            />
          )}

          {/* Tips Section */}
          {!analysisResult && !analyzing && (
            <div className="mt-8 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                💡 How It Works
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl mb-2">📸</div>
                  <h4 className="font-medium text-gray-800 mb-2">1. Capture</h4>
                  <p className="text-sm text-gray-600">
                    Take a clear photo of your food or describe your meal in detail
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">🤖</div>
                  <h4 className="font-medium text-gray-800 mb-2">2. Analyze</h4>
                  <p className="text-sm text-gray-600">
                    AI identifies foods, calculates nutrition, and compares to your goals
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">📊</div>
                  <h4 className="font-medium text-gray-800 mb-2">3. Learn</h4>
                  <p className="text-sm text-gray-600">
                    Get personalized recommendations and track your progress
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Features */}
          {!analysisResult && !analyzing && (
            <div className="mt-8 grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  🎯 What You Get
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Automatic food identification
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Detailed nutrition breakdown
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Macro tracking (protein, carbs, fat)
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Personalized recommendations
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Healthier alternatives
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Progress towards daily goals
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  🚀 Pro Tips
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2 mt-0.5">•</span>
                    <span>Take photos in good lighting for better accuracy</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2 mt-0.5">•</span>
                    <span>Include all components of your meal in the frame</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2 mt-0.5">•</span>
                    <span>Be specific in text descriptions (cooking methods, portions)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2 mt-0.5">•</span>
                    <span>Log meals regularly for better progress tracking</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2 mt-0.5">•</span>
                    <span>Use the correct meal type for accurate daily tracking</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmitMeal;