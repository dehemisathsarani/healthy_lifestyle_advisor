import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Navbar } from '../components/Navbar'
import { Chatbot } from '../components/Chatbot'
import { DietAgentSimple as DietAgent } from '../components/DietAgentSimple'
import { AdvancedNutritionHub } from '../components/AdvancedNutritionHub'
import { MentalHealthAgent } from '../components/MentalHealthAgent'
import { SecurityAgent } from '../components/SecurityAgent'
import { FitnessAgent } from '../components/FitnessAgent'
import type { UserMentalHealthProfile } from '../services/MentalHealthSessionManager'

export const ServicesPage = () => {
  const [activeAgent, setActiveAgent] = useState<'diet' | 'nutrition' | 'fitness' | 'mental' | 'security' | null>(null)
  const { isAuthenticated, profile } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Handle auto-launch from URL params
  useEffect(() => {
    const launch = searchParams.get('launch')
    if (launch === 'diet' && isAuthenticated) {
      setActiveAgent('nutrition')
    }
  }, [searchParams, isAuthenticated])

  // Function to handle Nutrition Hub launch with authentication check
  const handleNutritionHubLaunch = () => {
    if (!isAuthenticated) {
      // Save the intended destination for after login
      sessionStorage.setItem('redirectTo', '/services?launch=diet')
      navigate('/login')
    } else {
      setActiveAgent('nutrition')
    }
  }

  // Function to launch Fitness Hub (integrated fitness frontend)
  const handleFitnessHubLaunch = () => {
    // Launch the integrated fitness agent component
    // Backend: aiservices/fitnessbackend (runs on port 8002)
    setActiveAgent('fitness')
  }

  const services = [
    { 
      title: 'Advanced Nutrition Hub', 
      desc: 'Comprehensive food analysis, AI insights, nutrition logging, and weekly reports. Features text/image food analysis with Sri Lankan database integration.',
      action: handleNutritionHubLaunch,
      buttonText: isAuthenticated ? 'Launch Nutrition Hub' : 'Sign In & Start',
      available: true,
      category: 'nutrition',
      requiresAuth: true,
      icon: '🍎',
      gradient: 'from-emerald-500 to-teal-600'
    },
    { 
      title: 'Fitness Planner', 
      desc: 'Personalized workout routines, progress tracking, and fitness goal management with AI-powered recommendations.',
      action: handleFitnessHubLaunch,
      buttonText: 'Launch Fitness Hub',
      available: true,
      category: 'fitness',
      requiresAuth: false,
      icon: '💪',
      gradient: 'from-orange-500 to-red-600'
    },
    { 
      title: 'Mental Health Assistant', 
      desc: 'Comprehensive mood tracking, meditation guidance, and mental wellness activities for a balanced lifestyle.',
      action: () => setActiveAgent('mental'),
      buttonText: 'Launch Wellness Hub',
      available: true,
      category: 'mental',
      requiresAuth: false,
      icon: '🧠',
      gradient: 'from-purple-500 to-pink-600'
    },
    { 
      title: 'Security & Data Privacy', 
      desc: 'Advanced privacy controls, secure data management, and comprehensive security settings for peace of mind.',
      action: () => setActiveAgent('security'),
      buttonText: 'Manage Security',
      available: true,
      category: 'security',
      requiresAuth: false,
      icon: '🔒',
      gradient: 'from-gray-600 to-gray-800'
    },
  ]

  // Render the appropriate agent component
  if (activeAgent === 'nutrition') {
    return <AdvancedNutritionHub onBackToServices={() => setActiveAgent(null)} />
  }
  
  if (activeAgent === 'diet') {
    return <DietAgent onBackToServices={() => setActiveAgent(null)} authenticatedUser={profile} />
  }
  
  if (activeAgent === 'fitness') {
    return <FitnessAgent onBackToServices={() => setActiveAgent(null)} />
  }
  
  if (activeAgent === 'mental') {
    // Convert UserProfile to UserMentalHealthProfile
    const mentalHealthProfile: UserMentalHealthProfile | null = profile ? {
      ...profile,
      id: profile.email, // Use email as ID if no ID exists
      age: profile.age || 25, // Default age if not provided
      stress_level: 'moderate' as const,
      sleep_hours: 7,
      concerns: ['general wellbeing'],
      preferred_activities: ['games', 'music'],
      mood_goals: ['improve mood', 'reduce stress']
    } : null
    
    return <MentalHealthAgent onBackToServices={() => setActiveAgent(null)} authenticatedUser={mentalHealthProfile} />
  }
  
  if (activeAgent === 'security') {
    return <SecurityAgent onBackToServices={() => setActiveAgent(null)} />
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center">
              <div className="animate-fade-in-up">
                <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent mb-6">
                  Health & Wellness Hub
                </h1>
                <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-8 leading-relaxed">
                  {isAuthenticated 
                    ? `Welcome back, ${profile?.name || 'User'}! 🌟 Your personalized wellness journey continues here.`
                    : 'Transform your wellness journey with AI-powered health solutions designed for modern life'
                  }
                </p>
                {isAuthenticated && (
                  <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 font-medium">
                    <span className="animate-pulse mr-2">✨</span>
                    Premium features unlocked! Enjoy personalized insights.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4">
              Your Wellness Journey
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose from our comprehensive suite of AI-powered health and wellness tools
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {services.map((service, index) => (
              <div 
                key={index} 
                className="group relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  animation: 'fadeInUp 0.6s ease-out forwards'
                }}
              >
                <div 
                  className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                ></div>
                
                <div className="relative p-8 md:p-10">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-white to-gray-50 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                        <span className="text-4xl">{service.icon}</span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">
                          {service.title}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {service.requiresAuth && !isAuthenticated ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                              <span className="mr-1">🔐</span> Login Required
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <span className="mr-1">✅</span> Ready to Use
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-8 leading-relaxed text-lg">
                    {service.desc}
                    {service.requiresAuth && !isAuthenticated && (
                      <span className="block mt-3 text-sm text-blue-600 font-medium bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <span className="mr-1">🔐</span> Sign in to unlock personalized features, data sync, and advanced insights
                      </span>
                    )}
                  </p>
                  
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      
                      // Add visual click feedback
                      const button = e.currentTarget
                      button.style.transform = 'scale(0.95)'
                      setTimeout(() => {
                        button.style.transform = ''
                      }, 150)
                      
                      service.action()
                    }}
                    className={`w-full bg-gradient-to-r ${service.gradient} text-white font-bold py-4 px-8 rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 text-lg focus:outline-none focus:ring-4 focus:ring-blue-300/50`}
                  >
                    <span className="flex items-center justify-center space-x-2">
                      <span>{service.buttonText}</span>
                      <span className="transform group-hover:translate-x-1 transition-transform duration-200">→</span>
                    </span>
                  </button>
                </div>
                
                <div className="absolute inset-0 rounded-3xl border-2 border-transparent bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-teal-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Features Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-teal-600/10 rounded-3xl"></div>
            <div className="relative bg-white/60 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-white/20 shadow-2xl">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                  Premium Experience
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Unlock advanced insights and personalized recommendations with our intelligent health ecosystem
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="group text-center p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 border border-blue-100">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-2xl text-white shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                    📊
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Smart Analytics</h3>
                  <p className="text-gray-600 leading-relaxed">AI-powered insights with predictive health trends and personalized progress tracking</p>
                </div>
                
                <div className="group text-center p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-all duration-300 border border-purple-100">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center text-2xl text-white shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                    🤖
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">AI Health Coach</h3>
                  <p className="text-gray-600 leading-relaxed">24/7 intelligent guidance with personalized recommendations and adaptive wellness plans</p>
                </div>
                
                <div className="group text-center p-6 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 hover:from-teal-100 hover:to-emerald-100 transition-all duration-300 border border-teal-100">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center text-2xl text-white shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                    🌐
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Universal Sync</h3>
                  <p className="text-gray-600 leading-relaxed">Seamless cross-platform experience with real-time data synchronization and cloud backup</p>
                </div>
              </div>
              
              {!isAuthenticated && (
                <div className="text-center mt-12">
                  <button 
                    onClick={() => navigate('/login')}
                    className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-2xl hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl text-lg"
                  >
                    <span className="mr-2">✨</span>
                    Get Started Today
                    <span className="ml-2">→</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Chatbot />
    </>
  )
}


