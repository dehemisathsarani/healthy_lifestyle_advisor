import { useState } from 'react'
import { Chatbot } from '../components/Chatbot'
import { DietAgentSimple as DietAgent } from '../components/DietAgentSimple'
import { FitnessAgent } from '../components/FitnessAgent'
import { MentalHealthPage } from './MentalHealthPage'
import { SecurityAgent } from '../components/SecurityAgent'
import { useAuth } from '../auth/AuthContext'

export const ServicesPage = () => {
  const [activeAgent, setActiveAgent] = useState<'diet' | 'fitness' | 'mental' | 'security' | null>(null)
  const { userName, profile } = useAuth()

  const services = [
    { 
      title: 'Personalized Nutrition', 
      desc: 'AI-driven meal plans and calorie tracking with image analysis. Create profiles, analyze meals, track history.',
      action: () => setActiveAgent('diet'),
      buttonText: 'Launch Diet Agent',
      available: true,
      category: 'nutrition'
    },
    { 
      title: 'Meal Analysis', 
      desc: 'Upload food images or describe your meals for instant nutritional analysis.',
      action: () => setActiveAgent('diet'),
      buttonText: 'Analyze Meals',
      available: true,
      category: 'nutrition'
    },
    { 
      title: 'Nutrition Tracking', 
      desc: 'Track your daily nutrition intake with detailed macro and micro nutrient breakdowns.',
      action: () => setActiveAgent('diet'),
      buttonText: 'Track Nutrition',
      available: true,
      category: 'nutrition'
    },
    { 
      title: 'Fitness Planner', 
      desc: 'Personalized workout plans, progress tracking, and fitness goal management.',
      action: () => setActiveAgent('fitness'),
      buttonText: 'Launch Fitness Planner',
      available: true,
      category: 'fitness'
    },
    {
      title: 'Mental Health Assistant',
      desc: 'Mood tracking, meditation guidance, and mental wellness activities.',
      action: () => setActiveAgent('mental'),
      buttonText: 'Launch Mental Health',
      available: true,
      category: 'mental'
    },
    { 
      title: 'Security & Data Privacy', 
      desc: 'Manage your data privacy, security settings, and personal information.',
      action: () => setActiveAgent('security'),
      buttonText: 'Manage Privacy',
      available: true,
      category: 'security'
    },
  ]

  // Render the appropriate agent component
  if (activeAgent === 'diet') {
    return <DietAgent onBackToServices={() => setActiveAgent(null)} />
  }
  
  if (activeAgent === 'fitness') {
    return <FitnessAgent onBackToServices={() => setActiveAgent(null)} />
  }
  
  if (activeAgent === 'mental') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button 
            onClick={() => setActiveAgent(null)}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            ← Back to Services
          </button>
          <MentalHealthPage />
        </div>
      </div>
    )
  }
  
  if (activeAgent === 'security') {
    return <SecurityAgent onBackToServices={() => setActiveAgent(null)} />
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Welcome Message */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium mb-4">
              <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></span>
              Welcome back, {userName || profile?.name || 'User'}!
            </div>
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
              🏥 Health & Wellness Services
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive AI-powered health solutions designed to transform your wellness journey
            </p>
          </div>
          
          {/* Service Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl">
                      {service.category === 'nutrition' ? '🍎' : 
                       service.category === 'fitness' ? '💪' :
                       service.category === 'mental' ? '🧠' : '🔒'}
                    </span>
                    {service.available && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        ✅ Available
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {service.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {service.desc}
                  </p>
                  
                  <button
                    onClick={service.action}
                    className="w-full bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-emerald-600 hover:to-cyan-700 transition-all duration-200 transform hover:scale-105"
                  >
                    {service.buttonText}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Additional Features Section */}
          <div className="mt-16 bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-2xl p-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                🚀 Advanced Features
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Unlock the full potential of your health journey with our premium features
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-4xl mb-3">📊</div>
                  <h3 className="font-semibold text-gray-900 mb-2">Analytics Dashboard</h3>
                  <p className="text-sm text-gray-600">Comprehensive health insights and progress tracking</p>
                </div>
                
                <div className="text-center">
                  <div className="text-4xl mb-3">🤖</div>
                  <h3 className="font-semibold text-gray-900 mb-2">AI Health Coach</h3>
                  <p className="text-sm text-gray-600">Personalized recommendations and 24/7 support</p>
                </div>
                
                <div className="text-center">
                  <div className="text-4xl mb-3">📱</div>
                  <h3 className="font-semibold text-gray-900 mb-2">Mobile Sync</h3>
                  <p className="text-sm text-gray-600">Access your data anywhere, anytime</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Chatbot />
    </>
  )
}


