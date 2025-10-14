import React, { useState } from 'react';
import AgentConnectionIndicator, { AgentType } from './AgentConnectionIndicator';
import { motion, AnimatePresence } from 'framer-motion';

interface AgentMessage {
  from: string;
  to: string;
  message: string;
  timestamp: string;
}

interface AnalysisResponse {
  success: boolean;
  analysis: {
    emotionalState: {
      detected: string[];
      moodScore: number;
      stressLevel: string;
    };
    nutritionalNeeds: {
      issues: string[];
      recommendations: string[];
    };
    fitnessLevel: {
      assessment: string;
      concerns: string[];
    };
    mentalHealthNeeds: {
      priority: string;
      concerns: string[];
    };
  };
  recommendations: {
    mentalHealth: Array<{
      type: string;
      title: string;
      description: string;
      duration?: string;
    }>;
    meditations: Array<{
      title: string;
      type: string;
      duration: string;
      description: string;
    }>;
    workouts: Array<{
      name: string;
      duration: number;
      intensity: string;
      description: string;
      benefits: string[];
    }>;
    dietPlan: {
      mealPlan: Array<{
        meal: string;
        foods: string[];
        benefits: string;
      }>;
      guidelines: string[];
      hydration: string;
    };
    instructions: Array<{
      category: string;
      steps: string[];
      tip: string;
    }>;
  };
  agentMessages?: AgentMessage[];  // NEW: Shows inter-agent communication
  timestamp: string;
}

export const HolisticHealthAnalyzer: React.FC = () => {
  const [situationText, setSituationText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<AgentType>(null);
  const [agentMessage, setAgentMessage] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'mental' | 'meditation' | 'fitness' | 'diet' | 'instructions'>('mental');
  const [messagingAlerts, setMessagingAlerts] = useState<AgentMessage[]>([]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!situationText.trim()) {
      alert('Please describe your situation first');
      return;
    }

    try {
      setIsAnalyzing(true);
      setAnalysisResult(null);
      
      // Step 1: Mental Health Agent analyzes
      setCurrentAgent('mental-health');
      setAgentMessage('Analyzing your emotional state and mental health needs...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 2: Diet Agent analyzes
      setCurrentAgent('diet');
      setAgentMessage('Analyzing your food cycle and nutritional needs...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 3: Fitness Agent analyzes
      setCurrentAgent('fitness');
      setAgentMessage('Assessing your fitness situation and creating workout plans...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 4: Call comprehensive analysis API
      setAgentMessage('Generating personalized recommendations...');
      
      const response = await fetch('http://localhost:8005/api/agents/holistic-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user123', // Replace with actual user ID
          situationText: situationText,
          timestamp: new Date().toISOString()
        })
      });

      const result: AnalysisResponse = await response.json();
      
      // Display agent messaging alerts if available
      if (result.agentMessages && result.agentMessages.length > 0) {
        setMessagingAlerts(result.agentMessages);
        console.log('🔔 Agent Communication Log:', result.agentMessages);
      }
      
      setIsAnalyzing(false);
      setCurrentAgent(null);
      setAnalysisResult(result);
      
    } catch (error) {
      console.error('Error analyzing situation:', error);
      setIsAnalyzing(false);
      setCurrentAgent(null);
      alert('Error analyzing your situation. Please try again.');
    }
  };

  const exampleTexts = [
    "I've been feeling stressed lately, eating junk food at night, and haven't exercised in weeks. I struggle with anxiety and have trouble sleeping.",
    "I'm feeling unmotivated and depressed. I skip breakfast, eat heavy dinners, and feel tired all the time. I want to get healthier but don't know where to start.",
    "I have a lot of work pressure and stress. I eat irregularly, mostly fast food. I used to go to the gym but stopped 3 months ago. Feeling overwhelmed."
  ];

  return (
    <div className="py-20 sm:py-24 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-12">
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full mb-6">
            <span className="text-3xl mr-3">🌟</span>
            <span className="text-sm font-bold text-purple-700">Complete Health Analysis System</span>
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-6">
            Tell Us Your Complete Situation
          </h2>
          <p className="text-xl leading-8 text-gray-600">
            Share everything about your feelings, eating habits, fitness routine, and mental state. 
            Our AI will analyze it all and give you personalized solutions.
          </p>
        </div>

        {/* Agent Connection Indicator */}
        <AnimatePresence>
          {currentAgent && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 max-w-3xl mx-auto"
            >
              <AgentConnectionIndicator
                currentAgent={currentAgent}
                message={agentMessage}
                isProcessing={isAnalyzing}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Section */}
        {!analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border-2 border-purple-100">
              <form onSubmit={handleAnalyze}>
                <div className="mb-6">
                  <label className="block text-lg font-bold text-gray-900 mb-4">
                    📝 Describe Your Situation
                  </label>
                  <p className="text-sm text-gray-600 mb-4">
                    Tell us about your feelings, food habits, exercise routine, sleep, stress, and any mental health concerns.
                    The more details you share, the better recommendations you'll get.
                  </p>
                  
                  <textarea
                    value={situationText}
                    onChange={(e) => setSituationText(e.target.value)}
                    placeholder="Example: I've been feeling stressed and anxious lately. I eat a lot of junk food, especially at night. I skip breakfast often and have heavy dinners around 9 PM. I used to exercise but stopped 2 months ago. I have trouble sleeping and feel tired all the time. I feel unmotivated and sometimes depressed..."
                    rows={8}
                    className="w-full px-6 py-4 border-2 border-gray-300 rounded-2xl focus:ring-4 focus:ring-purple-500 focus:border-transparent text-lg resize-none"
                    disabled={isAnalyzing}
                  />
                  
                  <div className="mt-4 text-sm text-gray-500">
                    💡 <strong>Tip:</strong> Include details about emotions, eating patterns, physical activity, sleep quality, stress levels, and any health concerns.
                  </div>
                </div>

                {/* Example Buttons */}
                <div className="mb-6">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Quick Examples (click to use):</p>
                  <div className="grid gap-3">
                    {exampleTexts.map((text, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setSituationText(text)}
                        className="text-left p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl hover:from-purple-100 hover:to-pink-100 transition-all text-sm text-gray-700 border border-purple-200"
                        disabled={isAnalyzing}
                      >
                        <strong className="text-purple-700">Example {index + 1}:</strong> {text.substring(0, 100)}...
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAnalyzing || !situationText.trim()}
                  className={`w-full py-5 rounded-2xl font-bold text-lg text-white transition-all transform hover:scale-105 shadow-xl ${
                    isAnalyzing || !situationText.trim()
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700'
                  }`}
                >
                  {isAnalyzing ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-6 w-6 mr-3" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Analyzing Your Situation...
                    </span>
                  ) : (
                    '🌟 Analyze & Get Complete Solutions'
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {/* Results Section */}
        {analysisResult && !isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto"
          >
            {/* Success Message */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 mb-8 text-center">
              <div className="text-5xl mb-3">✅</div>
              <h3 className="text-2xl font-bold text-green-800 mb-2">Analysis Complete!</h3>
              <p className="text-green-700">We've analyzed your situation and created personalized recommendations for you.</p>
            </div>

            {/* Agent Messaging Alerts */}
            {messagingAlerts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 mb-8"
              >
                <div className="flex items-center mb-4">
                  <span className="text-3xl mr-3">📡</span>
                  <h3 className="text-xl font-bold text-blue-800">Agent Communication Log</h3>
                </div>
                <div className="space-y-3">
                  {messagingAlerts.map((msg, index) => {
                    // Determine emoji based on agent type
                    const getAgentEmoji = (agentName: string) => {
                      if (agentName.toLowerCase().includes('mental')) return '🧠';
                      if (agentName.toLowerCase().includes('diet')) return '🥗';
                      if (agentName.toLowerCase().includes('fitness')) return '💪';
                      return '🤖';
                    };

                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.2 }}
                        className="bg-white rounded-xl p-4 shadow-md border border-blue-100"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-xl">{getAgentEmoji(msg.from)}</span>
                            <span className="font-bold text-gray-800">{msg.from}</span>
                            <span className="text-gray-400">→</span>
                            <span className="text-xl">{getAgentEmoji(msg.to)}</span>
                            <span className="font-bold text-gray-800">{msg.to}</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm ml-7">{msg.message}</p>
                      </motion.div>
                    );
                  })}
                </div>
                <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                  <p className="text-sm text-blue-800 text-center">
                    ✅ <strong>{messagingAlerts.length}</strong> inter-agent messages processed via RabbitMQ
                  </p>
                </div>
              </motion.div>
            )}

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-xl p-2 mb-8">
              <div className="grid grid-cols-5 gap-2">
                <button
                  onClick={() => setActiveTab('mental')}
                  className={`py-4 px-6 rounded-xl font-bold text-sm transition-all ${
                    activeTab === 'mental'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🧠 Mental Health
                </button>
                <button
                  onClick={() => setActiveTab('meditation')}
                  className={`py-4 px-6 rounded-xl font-bold text-sm transition-all ${
                    activeTab === 'meditation'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🧘 Meditations
                </button>
                <button
                  onClick={() => setActiveTab('fitness')}
                  className={`py-4 px-6 rounded-xl font-bold text-sm transition-all ${
                    activeTab === 'fitness'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  💪 Workouts
                </button>
                <button
                  onClick={() => setActiveTab('diet')}
                  className={`py-4 px-6 rounded-xl font-bold text-sm transition-all ${
                    activeTab === 'diet'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🥗 Diet Plan
                </button>
                <button
                  onClick={() => setActiveTab('instructions')}
                  className={`py-4 px-6 rounded-xl font-bold text-sm transition-all ${
                    activeTab === 'instructions'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📋 Instructions
                </button>
              </div>
            </div>

            {/* Content Panels */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <AnimatePresence mode="wait">
                {/* Mental Health Solutions */}
                {activeTab === 'mental' && (
                  <motion.div
                    key="mental"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <h3 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                      <span className="text-4xl mr-3">🧠</span>
                      Mental Health Solutions
                    </h3>
                    <div className="grid gap-6">
                      {analysisResult.recommendations.mentalHealth.map((solution, index) => (
                        <div key={index} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                          <div className="flex items-start">
                            <div className="text-3xl mr-4">
                              {solution.type === 'therapy' && '💭'}
                              {solution.type === 'exercise' && '🏃'}
                              {solution.type === 'relaxation' && '😌'}
                              {solution.type === 'social' && '👥'}
                            </div>
                            <div className="flex-1">
                              <h4 className="text-xl font-bold text-purple-900 mb-2">{solution.title}</h4>
                              <p className="text-gray-700 mb-3">{solution.description}</p>
                              {solution.duration && (
                                <span className="inline-block px-4 py-2 bg-purple-200 text-purple-800 rounded-full text-sm font-semibold">
                                  ⏱️ {solution.duration}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Meditations */}
                {activeTab === 'meditation' && (
                  <motion.div
                    key="meditation"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <h3 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                      <span className="text-4xl mr-3">🧘</span>
                      Personalized Meditations
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      {analysisResult.recommendations.meditations.map((meditation, index) => (
                        <div key={index} className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border-2 border-indigo-200">
                          <div className="text-3xl mb-3">🧘‍♀️</div>
                          <h4 className="text-xl font-bold text-indigo-900 mb-2">{meditation.title}</h4>
                          <div className="flex gap-2 mb-3">
                            <span className="px-3 py-1 bg-indigo-200 text-indigo-800 rounded-full text-xs font-semibold">
                              {meditation.type}
                            </span>
                            <span className="px-3 py-1 bg-purple-200 text-purple-800 rounded-full text-xs font-semibold">
                              ⏱️ {meditation.duration}
                            </span>
                          </div>
                          <p className="text-gray-700">{meditation.description}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Fitness Workouts */}
                {activeTab === 'fitness' && (
                  <motion.div
                    key="fitness"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <h3 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                      <span className="text-4xl mr-3">💪</span>
                      Your Workout Plans
                    </h3>
                    <div className="grid gap-6">
                      {analysisResult.recommendations.workouts.map((workout, index) => (
                        <div key={index} className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-200">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="text-2xl font-bold text-blue-900 mb-2">{workout.name}</h4>
                              <div className="flex gap-2">
                                <span className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-sm font-semibold">
                                  ⏱️ {workout.duration} min
                                </span>
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                  workout.intensity === 'high' ? 'bg-red-200 text-red-800' :
                                  workout.intensity === 'moderate' ? 'bg-orange-200 text-orange-800' :
                                  'bg-green-200 text-green-800'
                                }`}>
                                  {workout.intensity.toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="text-5xl">💪</div>
                          </div>
                          <p className="text-gray-700 mb-4">{workout.description}</p>
                          <div className="bg-white rounded-lg p-4">
                            <p className="font-semibold text-blue-900 mb-2">Benefits:</p>
                            <ul className="list-disc list-inside space-y-1">
                              {workout.benefits.map((benefit, idx) => (
                                <li key={idx} className="text-gray-700">{benefit}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Diet Plan */}
                {activeTab === 'diet' && (
                  <motion.div
                    key="diet"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <h3 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                      <span className="text-4xl mr-3">🥗</span>
                      Your Personalized Diet Plan
                    </h3>
                    
                    {/* Meal Plan */}
                    <div className="mb-8">
                      <h4 className="text-2xl font-bold text-green-900 mb-4">Daily Meal Plan</h4>
                      <div className="grid gap-4">
                        {analysisResult.recommendations.dietPlan.mealPlan.map((meal, index) => (
                          <div key={index} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                            <h5 className="text-xl font-bold text-green-900 mb-3">{meal.meal}</h5>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {meal.foods.map((food, idx) => (
                                <span key={idx} className="px-4 py-2 bg-white rounded-full text-sm font-semibold text-green-800 border border-green-300">
                                  {food}
                                </span>
                              ))}
                            </div>
                            <p className="text-green-700"><strong>Benefits:</strong> {meal.benefits}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Guidelines */}
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border-2 border-yellow-200 mb-6">
                      <h4 className="text-xl font-bold text-orange-900 mb-4">💡 Important Guidelines</h4>
                      <ul className="space-y-2">
                        {analysisResult.recommendations.dietPlan.guidelines.map((guideline, index) => (
                          <li key={index} className="flex items-start text-gray-700">
                            <span className="text-orange-500 mr-2">✓</span>
                            {guideline}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Hydration */}
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-200">
                      <h4 className="text-xl font-bold text-blue-900 mb-2">💧 Hydration</h4>
                      <p className="text-gray-700">{analysisResult.recommendations.dietPlan.hydration}</p>
                    </div>
                  </motion.div>
                )}

                {/* Instructions */}
                {activeTab === 'instructions' && (
                  <motion.div
                    key="instructions"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <h3 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                      <span className="text-4xl mr-3">📋</span>
                      Step-by-Step Instructions
                    </h3>
                    <div className="grid gap-6">
                      {analysisResult.recommendations.instructions.map((instruction, index) => (
                        <div key={index} className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-6 border-2 border-teal-200">
                          <h4 className="text-2xl font-bold text-teal-900 mb-4">{instruction.category}</h4>
                          <ol className="list-decimal list-inside space-y-3 mb-4">
                            {instruction.steps.map((step, idx) => (
                              <li key={idx} className="text-gray-700 pl-2">{step}</li>
                            ))}
                          </ol>
                          <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded">
                            <p className="text-sm"><strong className="text-yellow-800">💡 Pro Tip:</strong> <span className="text-gray-700">{instruction.tip}</span></p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex gap-4 justify-center">
              <button
                onClick={() => {
                  setAnalysisResult(null);
                  setSituationText('');
                  setActiveTab('mental');
                  setMessagingAlerts([]); // Clear agent messaging alerts
                  // Scroll to top of the section smoothly
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
              >
                🔄 Analyze New Situation
              </button>
              <button
                onClick={() => {
                  // Generate PDF-friendly view
                  const printWindow = window.open('', '_blank');
                  if (printWindow && analysisResult) {
                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>Health Analysis Report</title>
                          <style>
                            body { font-family: Arial, sans-serif; padding: 20px; }
                            h1 { color: #7c3aed; }
                            h2 { color: #8b5cf6; margin-top: 30px; }
                            h3 { color: #a78bfa; }
                            .section { margin-bottom: 30px; page-break-inside: avoid; }
                            .card { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 8px; }
                            ul { line-height: 1.8; }
                            .emoji { font-size: 24px; }
                          </style>
                        </head>
                        <body>
                          <h1>🌟 Complete Health Analysis Report</h1>
                          <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                          <p><strong>Situation Analyzed:</strong> ${situationText.substring(0, 200)}...</p>
                          
                          <div class="section">
                            <h2>🧠 Mental Health Solutions</h2>
                            ${analysisResult.recommendations.mentalHealth.map(s => `
                              <div class="card">
                                <h3>${s.title}</h3>
                                <p>${s.description}</p>
                                <p><strong>Duration:</strong> ${s.duration || 'As needed'}</p>
                              </div>
                            `).join('')}
                          </div>
                          
                          <div class="section">
                            <h2>🧘 Recommended Meditations</h2>
                            ${analysisResult.recommendations.meditations.map(m => `
                              <div class="card">
                                <h3>${m.title}</h3>
                                <p><strong>Type:</strong> ${m.type} | <strong>Duration:</strong> ${m.duration}</p>
                                <p>${m.description}</p>
                              </div>
                            `).join('')}
                          </div>
                          
                          <div class="section">
                            <h2>💪 Workout Plans</h2>
                            ${analysisResult.recommendations.workouts.map(w => `
                              <div class="card">
                                <h3>${w.name}</h3>
                                <p><strong>Duration:</strong> ${w.duration} min | <strong>Intensity:</strong> ${w.intensity}</p>
                                <p>${w.description}</p>
                                <p><strong>Benefits:</strong></p>
                                <ul>${w.benefits.map(b => `<li>${b}</li>`).join('')}</ul>
                              </div>
                            `).join('')}
                          </div>
                          
                          <div class="section">
                            <h2>🥗 Diet Plan</h2>
                            ${analysisResult.recommendations.dietPlan.mealPlan.map(meal => `
                              <div class="card">
                                <h3>${meal.meal}</h3>
                                <p><strong>Foods:</strong> ${meal.foods.join(', ')}</p>
                                <p><strong>Benefits:</strong> ${meal.benefits}</p>
                              </div>
                            `).join('')}
                            <h3>Guidelines:</h3>
                            <ul>${analysisResult.recommendations.dietPlan.guidelines.map(g => `<li>${g}</li>`).join('')}</ul>
                            <p><strong>Hydration:</strong> ${analysisResult.recommendations.dietPlan.hydration}</p>
                          </div>
                          
                          <div class="section">
                            <h2>📋 Instructions</h2>
                            ${analysisResult.recommendations.instructions.map(inst => `
                              <div class="card">
                                <h3>${inst.category}</h3>
                                <ol>${inst.steps.map(s => `<li>${s}</li>`).join('')}</ol>
                                <p><strong>💡 Tip:</strong> ${inst.tip}</p>
                              </div>
                            `).join('')}
                          </div>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                    setTimeout(() => printWindow.print(), 500);
                  }
                }}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg"
              >
                📥 Download PDF
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
