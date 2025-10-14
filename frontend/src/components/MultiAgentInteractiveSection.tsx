import React, { useState } from 'react';
import AgentConnectionIndicator, { AgentType } from './AgentConnectionIndicator';
import { motion, AnimatePresence } from 'framer-motion';

interface MealAnalysisResponse {
  success: boolean;
  agent: string;
  message: string;
  data: {
    nutritionalLog: any;
    insights: any;
    caloriesConsumed: number;
    recommendedCalorieBurn: number;
  };
  nextAgent: string;
  actions: Array<{
    type: string;
    label: string;
    route: string;
    section: string;
    autoFill: boolean;
    data: any;
  }>;
  timestamp: string;
}

export const MultiAgentInteractiveSection: React.FC = () => {
  const [currentAgent, setCurrentAgent] = useState<AgentType>(null);
  const [agentMessage, setAgentMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<MealAnalysisResponse | null>(null);
  const [formData, setFormData] = useState({
    mealName: '',
    mealDescription: '',
    foodCycleText: ''
  });

  // Helper function to estimate calories from meal description
  const estimateCaloriesFromDescription = (description: string): number => {
    const lowerDesc = description.toLowerCase();
    
    // Simple keyword-based estimation
    if (lowerDesc.includes('salad') || lowerDesc.includes('vegetable')) return 200;
    if (lowerDesc.includes('sandwich') || lowerDesc.includes('wrap')) return 400;
    if (lowerDesc.includes('burger') || lowerDesc.includes('pizza')) return 700;
    if (lowerDesc.includes('pasta') || lowerDesc.includes('rice')) return 500;
    if (lowerDesc.includes('chicken') || lowerDesc.includes('fish')) return 450;
    if (lowerDesc.includes('steak') || lowerDesc.includes('beef')) return 600;
    if (lowerDesc.includes('smoothie') || lowerDesc.includes('juice')) return 250;
    if (lowerDesc.includes('snack') || lowerDesc.includes('fruit')) return 150;
    
    // Check portion size keywords
    if (lowerDesc.includes('large') || lowerDesc.includes('big')) return 650;
    if (lowerDesc.includes('small') || lowerDesc.includes('light')) return 300;
    
    // Default medium meal
    return 450;
  };

  const handleMealAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.mealName || !formData.mealDescription || !formData.foodCycleText) {
      alert('Please fill in all fields');
      return;
    }

    try {
      // Show Diet Agent connection
      setCurrentAgent('diet');
      setAgentMessage('Analyzing your meal and eating patterns...');
      setIsProcessing(true);
      setAnalysisResult(null);

      // Estimate calories from meal description (simple heuristic)
      const estimatedCalories = estimateCaloriesFromDescription(formData.mealDescription);

      // Call Diet Agent API
      const response = await fetch('http://localhost:8005/api/agents/diet/analyze-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user123', // Replace with actual user ID from auth
          mealName: formData.mealName,
          calories: estimatedCalories,
          protein: 0,
          carbs: 0,
          fats: 0,
          foodCycleText: `${formData.mealDescription}. ${formData.foodCycleText}`,
          mealTime: 'lunch',
          timestamp: new Date().toISOString()
        })
      });

      const result: MealAnalysisResponse = await response.json();
      
      setIsProcessing(false);
      setAgentMessage(result.message);
      setAnalysisResult(result);

    } catch (error) {
      console.error('Error analyzing meal:', error);
      setIsProcessing(false);
      setAgentMessage('Error connecting to Diet Agent. Please try again.');
    }
  };

  const handleNavigateToWorkouts = () => {
    if (analysisResult?.actions && analysisResult.actions.length > 0) {
      const action = analysisResult.actions[0];
      
      // Show transition to Fitness
      setCurrentAgent('fitness');
      setAgentMessage('Loading your personalized workout plan...');
      
      // Navigate after short delay
      setTimeout(() => {
        window.location.href = action.route;
      }, 1500);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="py-20 sm:py-24 bg-gradient-to-br from-emerald-50 via-cyan-50 to-blue-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl lg:text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full mb-6">
            <span className="text-2xl mr-2">✨</span>
            <span className="text-sm font-semibold text-purple-700">Smart Health Insights</span>
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-6">
            Get Personalized Health Recommendations
          </h2>
          <p className="text-xl leading-8 text-gray-600">
            Tell us about your meals and lifestyle. We'll analyze your nutrition, suggest workouts, 
            and provide wellness tips tailored just for you.
          </p>
        </div>

        {/* Agent Connection Indicator */}
        <AnimatePresence>
          {currentAgent && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 max-w-2xl mx-auto"
            >
              <AgentConnectionIndicator
                currentAgent={currentAgent}
                message={agentMessage}
                isProcessing={isProcessing}
                onClose={() => {
                  if (!isProcessing) {
                    setCurrentAgent(null);
                    setAgentMessage('');
                  }
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-2 gap-8 mt-12">
          {/* Nutrition Analysis Card */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl shadow-xl p-8 border-2 border-green-100 hover:border-green-300 transition-all"
          >
            <div className="flex items-center mb-6">
              <div className="text-5xl mr-4">🥗</div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Meal Analyzer</h3>
                <p className="text-sm text-green-600 font-medium">Get instant nutrition insights & workout plans</p>
              </div>
            </div>

            <p className="text-gray-600 mb-6">
              Tell us what you ate! We'll analyze your meal and eating patterns, then recommend 
              the perfect workout plan to match your nutrition goals.
            </p>

            <form onSubmit={handleMealAnalysis} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🍽️ What did you eat?
                </label>
                <input
                  type="text"
                  name="mealName"
                  value={formData.mealName}
                  onChange={handleInputChange}
                  placeholder="e.g., Breakfast, Lunch, Dinner"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={isProcessing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📝 Describe your meal
                </label>
                <textarea
                  name="mealDescription"
                  value={formData.mealDescription}
                  onChange={handleInputChange}
                  placeholder="e.g., Grilled chicken with rice and vegetables, large portion"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  disabled={isProcessing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🔄 Your usual eating pattern
                </label>
                <textarea
                  name="foodCycleText"
                  value={formData.foodCycleText}
                  onChange={handleInputChange}
                  placeholder="e.g., I usually eat 3 meals a day, heavy lunch and light dinner..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  disabled={isProcessing}
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className={`w-full py-4 rounded-lg font-bold text-white transition-all transform hover:scale-105 ${
                  isProcessing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Analyzing your meal...
                  </span>
                ) : (
                  '🥗 Get Nutrition Insights & Workout Plan'
                )}
              </button>
            </form>

            {/* Results Display */}
            {analysisResult && !isProcessing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-6 bg-green-50 border-2 border-green-200 rounded-xl"
              >
                <h4 className="font-bold text-green-800 mb-3 flex items-center">
                  <span className="text-xl mr-2">✅</span>
                  Analysis Complete!
                </h4>
                <div className="space-y-2 text-sm text-green-900">
                  <p><strong>Calories Consumed:</strong> {analysisResult.data.caloriesConsumed} kcal</p>
                  <p><strong>Recommended Burn:</strong> {analysisResult.data.recommendedCalorieBurn.toFixed(0)} kcal</p>
                </div>

                {analysisResult.actions && analysisResult.actions.length > 0 && (
                  <button
                    onClick={handleNavigateToWorkouts}
                    className="w-full mt-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold rounded-lg hover:from-blue-600 hover:to-cyan-700 transition-all transform hover:scale-105 shadow-lg"
                  >
                    {analysisResult.actions[0].label}
                  </button>
                )}
              </motion.div>
            )}
          </motion.div>

          {/* Wellness Support Card */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl shadow-xl p-8 border-2 border-purple-100 hover:border-purple-300 transition-all"
          >
            <div className="flex items-center mb-6">
              <div className="text-5xl mr-4">🧠</div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Wellness Coach</h3>
                <p className="text-sm text-purple-600 font-medium">Your emotional & mental health support</p>
              </div>
            </div>

            <p className="text-gray-600 mb-6">
              Feeling stressed or need motivation? Share how you're feeling and get personalized 
              meditations, mood boosters, and wellness tips tailored to you.
            </p>

            <div className="space-y-4">
              <div className="p-6 bg-purple-50 rounded-xl border border-purple-200">
                <h4 className="font-bold text-purple-900 mb-3 flex items-center">
                  <span className="text-xl mr-2">🎯</span>
                  What You'll Get:
                </h4>
                <ul className="space-y-2 text-sm text-purple-800">
                  <li className="flex items-start">
                    <span className="mr-2">🧘</span>
                    <span><strong>Meditations:</strong> Guided relaxation exercises</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">💪</span>
                    <span><strong>Stress Relief:</strong> Connects to Fitness Agent for workouts</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">🥗</span>
                    <span><strong>Mood Foods:</strong> Diet suggestions from Diet Agent</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">💬</span>
                    <span><strong>Motivations:</strong> Personalized encouragement</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => {
                  window.location.href = '/services#mental-health';
                }}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg"
              >
                🧠 Get Wellness Support
              </button>
            </div>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
              <p className="text-sm text-purple-900">
                <strong className="block mb-1">💡 How it works:</strong>
                Our AI wellness system understands your emotional state and combines insights from 
                nutrition and fitness to give you complete, personalized wellness support.
              </p>
            </div>
          </motion.div>
        </div>

        {/* How It Works Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mt-16 p-8 bg-white rounded-2xl shadow-xl"
        >
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            How Your AI Health Team Works Together
          </h3>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-4xl shadow-lg">
                🥗
              </div>
              <p className="mt-2 font-bold text-green-700">Nutrition</p>
              <p className="text-xs text-gray-600">Analyzes your meals</p>
            </div>

            <div className="text-3xl text-gray-400 rotate-90 md:rotate-0">→</div>

            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center text-4xl shadow-lg">
                💪
              </div>
              <p className="mt-2 font-bold text-blue-700">Fitness</p>
              <p className="text-xs text-gray-600">Plans your workouts</p>
            </div>

            <div className="text-3xl text-gray-400 rotate-90 md:rotate-0">→</div>

            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-4xl shadow-lg">
                🧠
              </div>
              <p className="mt-2 font-bold text-purple-700">Wellness</p>
              <p className="text-xs text-gray-600">Supports your mood</p>
            </div>
          </div>

          <p className="text-center text-gray-600 mt-8 max-w-2xl mx-auto">
            Everything works together automatically! Track your meals, get workout suggestions, 
            and receive wellness support—all personalized to help you reach your health goals.
          </p>
        </motion.div>
      </div>
    </div>
  );
};
