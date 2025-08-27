import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { Chatbot } from '../components/Chatbot'

const HomePage = () => {
  const navigate = useNavigate()
  
  const handleGetStarted = () => {
    navigate('/services')
  }

  const handleLearnMore = () => {
    navigate('/about')
  }

  return (
    <>
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-emerald-500 via-cyan-600 to-blue-700 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse"></div>
          <div className="absolute top-32 right-20 w-16 h-16 bg-white/5 rounded-full animate-bounce"></div>
          <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-white/10 rounded-full animate-pulse delay-300"></div>
          <div className="absolute bottom-32 right-1/3 w-24 h-24 bg-white/5 rounded-full animate-bounce delay-500"></div>
        </div>
        
        <div className="relative px-6 lg:px-8">
          <div className="mx-auto max-w-4xl py-24 sm:py-32 lg:py-40">
            <div className="hidden sm:mb-8 sm:flex sm:justify-center">
              <div className="relative rounded-full px-4 py-2 text-sm leading-6 text-white ring-1 ring-white/20 hover:ring-white/30 backdrop-blur-sm bg-white/10 transition-all duration-300 hover:scale-105">
                <span className="animate-pulse text-yellow-300">✨</span> Meet your advisor: VitaCoach AI{' '}
                <a href="#" className="font-semibold text-white">
                  <span className="absolute inset-0" aria-hidden="true" />
                  Read more <span aria-hidden="true">→</span>
                </a>
              </div>
            </div>
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="flex space-x-2 text-6xl animate-bounce">
                  <span className="animate-pulse delay-100">💪</span>
                  <span className="animate-pulse delay-200">🥗</span>
                  <span className="animate-pulse delay-300">🧘</span>
                </div>
              </div>
              <h1 className="text-5xl font-bold tracking-tight text-white sm:text-7xl mb-6 animate-fade-in">
                <span className="bg-gradient-to-r from-white to-emerald-100 bg-clip-text text-transparent">
                  Health, Fitness, and Food
                </span>
                <br />
                <span className="text-3xl sm:text-5xl text-emerald-100">
                  — Tailored for You
                </span>
              </h1>
              <p className="mt-6 text-xl leading-8 text-emerald-100 max-w-3xl mx-auto">
                🤖 VitaCoach AI crafts personalized daily plans across training, nutrition, and wellness, 
                perfectly aligned with your goals and busy schedule.
              </p>
              
              {/* Stats Preview */}
              <div className="mt-8 flex justify-center space-x-8 text-white/90">
                <div className="text-center">
                  <div className="text-2xl font-bold">10k+</div>
                  <div className="text-sm text-emerald-200">Happy Users</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">1M+</div>
                  <div className="text-sm text-emerald-200">Meals Tracked</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">500k+</div>
                  <div className="text-sm text-emerald-200">Workouts Completed</div>
                </div>
              </div>

              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={handleGetStarted}
                  className="group relative rounded-xl bg-white px-8 py-4 text-lg font-semibold text-emerald-600 shadow-lg hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-all duration-200 hover:scale-105 hover:shadow-xl"
                >
                  <span className="flex items-center">
                    🚀 Start Your Journey Free
                    <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                </button>
                <button
                  onClick={handleLearnMore}
                  className="group flex items-center text-lg font-semibold leading-6 text-white hover:text-emerald-100 border-2 border-white/30 px-8 py-4 rounded-xl hover:bg-white/10 backdrop-blur-sm transition-all duration-200 hover:scale-105"
                >
                  <span className="mr-2">📹</span>
                  Watch Demo
                  <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="mt-12 flex flex-col items-center">
                <p className="text-emerald-200 text-sm mb-4">Trusted by health enthusiasts worldwide</p>
                <div className="flex items-center space-x-6 text-white/70">
                  <div className="flex items-center space-x-1">
                    <span className="text-yellow-400">⭐⭐⭐⭐⭐</span>
                    <span className="text-sm">4.9/5</span>
                  </div>
                  <div className="text-sm">📱 Available on all devices</div>
                  <div className="text-sm">🔒 100% Secure & Private</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 sm:py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-100 to-cyan-100 rounded-full mb-6">
              <span className="text-2xl mr-2">🎯</span>
              <span className="text-sm font-semibold text-emerald-700">Everything you need in one place</span>
            </div>
            <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-6">
              Comprehensive Health Services
            </h2>
            <p className="text-xl leading-8 text-gray-600">
              From AI-powered nutrition analysis to personalized mental wellness programs, 
              our platform provides intelligent recommendations for every aspect of your health journey.
            </p>
          </div>
          
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="group flex flex-col items-center text-center bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 mb-4">
                  <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-100 to-red-100 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                    <span className="text-3xl animate-pulse">💖</span>
                  </div>
                </dt>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Wellness Insights</h3>
                <dd className="flex flex-auto flex-col text-base leading-7 text-gray-600 mb-4">
                  <p className="flex-auto">AI-powered daily tips and personalized recommendations to keep you energized and motivated on your wellness journey.</p>
                </dd>
                <div className="text-sm text-emerald-600 font-medium">
                  ✨ Real-time health monitoring • 📊 Progress analytics • 🎯 Goal tracking
                </div>
              </div>
              
              <div className="group flex flex-col items-center text-center bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 mb-4">
                  <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                    <span className="text-3xl animate-bounce">🍎</span>
                  </div>
                </dt>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Smart Nutrition</h3>
                <dd className="flex flex-auto flex-col text-base leading-7 text-gray-600 mb-4">
                  <p className="flex-auto">Personalized meal plans with macro tracking, food scanning, and nutritionist-approved recipes tailored to your dietary preferences.</p>
                </dd>
                <div className="text-sm text-emerald-600 font-medium">
                  📸 Food photo analysis • 🥗 Custom meal plans • 📱 Barcode scanning
                </div>
              </div>
              
              <div className="group flex flex-col items-center text-center bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 mb-4">
                  <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                    <span className="text-3xl animate-pulse">🏃</span>
                  </div>
                </dt>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Fitness Coaching</h3>
                <dd className="flex flex-auto flex-col text-base leading-7 text-gray-600 mb-4">
                  <p className="flex-auto">AI-designed workout routines that adapt to your fitness level, schedule, and equipment availability for maximum results.</p>
                </dd>
                <div className="text-sm text-emerald-600 font-medium">
                  🎥 Video workouts • ⏱️ Flexible scheduling • 🏆 Achievement system
                </div>
              </div>
            </dl>
          </div>

          {/* Interactive Demo Section */}
          <div className="mt-20 bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-3xl p-8 lg:p-12">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">See VitaCoach AI in Action</h3>
              <p className="text-gray-600">Experience the power of AI-driven health coaching</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-center">
                  <div className="text-4xl mb-3">📸</div>
                  <h4 className="font-semibold text-gray-900 mb-2">Snap & Analyze</h4>
                  <p className="text-sm text-gray-600">Take a photo of your meal and get instant nutritional insights</p>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-center">
                  <div className="text-4xl mb-3">🤖</div>
                  <h4 className="font-semibold text-gray-900 mb-2">AI Recommendations</h4>
                  <p className="text-sm text-gray-600">Get personalized suggestions based on your health goals</p>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-center">
                  <div className="text-4xl mb-3">📈</div>
                  <h4 className="font-semibold text-gray-900 mb-2">Track Progress</h4>
                  <p className="text-sm text-gray-600">Monitor your journey with detailed analytics and insights</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Section */}
      <div className="py-20 sm:py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Calendar Content */}
            <div>
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full mb-6">
                <span className="text-2xl mr-2">📅</span>
                <span className="text-sm font-semibold text-blue-700">Smart Scheduling</span>
              </div>
              
              <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-6">
                Intelligent Health Calendar
              </h2>
              <p className="text-xl leading-8 text-gray-600 mb-8">
                Plan and schedule your entire wellness journey with our AI-powered calendar. 
                From workouts to meal prep, wellness sessions to health checkups - organize everything in one place.
              </p>
              
              {/* Features List */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-700">🤖 AI-suggested optimal workout times</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-700">📱 Smart reminders and notifications</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-700">📊 Progress tracking and analytics</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-700">🔄 Automatic schedule optimization</span>
                </div>
              </div>
              
              {/* Enhanced Calendar Stats */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-emerald-600">24</div>
                      <div className="text-sm text-gray-600">Workouts This Month</div>
                    </div>
                    <div className="text-2xl">💪</div>
                  </div>
                  <div className="mt-2 flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{width: '80%'}}></div>
                    </div>
                    <span className="ml-2 text-xs text-emerald-600 font-medium">80%</span>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-blue-600">89</div>
                      <div className="text-sm text-gray-600">Meals Tracked</div>
                    </div>
                    <div className="text-2xl">🍎</div>
                  </div>
                  <div className="mt-2 flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{width: '95%'}}></div>
                    </div>
                    <span className="ml-2 text-xs text-blue-600 font-medium">95%</span>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => navigate('/calendar')}
                className="group bg-gradient-to-r from-emerald-600 to-cyan-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-emerald-700 hover:to-cyan-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center"
              >
                <span className="mr-2">📅</span>
                Open Smart Calendar
                <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>
            
            {/* Enhanced Calendar Widget */}
            <div className="flex justify-center">
              <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">August 2025</h3>
                    <p className="text-gray-500 text-sm">Your health journey</p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">‹</button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">›</button>
                  </div>
                </div>
                
                <div className="grid grid-cols-7 gap-1 text-center text-sm mb-3">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                    <div key={day} className="font-semibold text-gray-500 py-2">{day}</div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-1 text-center text-sm">
                  {[...Array(31)].map((_, i) => {
                    const day = i + 1
                    const isToday = day === 25
                    const hasEvents = [15, 18, 22, 26, 28].includes(day)
                    
                    return (
                      <div key={i} className={`py-3 cursor-pointer transition-all duration-200 relative ${
                        isToday 
                          ? 'bg-emerald-500 text-white rounded-lg font-semibold shadow-lg scale-110' 
                          : hasEvents
                          ? 'bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100'
                          : 'text-gray-700 hover:bg-gray-100 rounded-lg'
                      }`}>
                        {day}
                        {hasEvents && !isToday && (
                          <div className="absolute bottom-0.5 right-0.5 w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                        {day === 26 && (
                          <div className="absolute -top-1 -right-1 text-xs bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                            3
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                
                {/* Today's Schedule Preview */}
                <div className="mt-6 bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="text-emerald-500 mr-2">📍</span>
                    Today's Schedule
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm bg-white rounded-lg p-2">
                      <div className="flex items-center">
                        <span className="mr-2">💪</span>
                        <span>Morning Workout</span>
                      </div>
                      <span className="text-gray-500">7:00 AM</span>
                    </div>
                    <div className="flex items-center justify-between text-sm bg-white rounded-lg p-2">
                      <div className="flex items-center">
                        <span className="mr-2">🥗</span>
                        <span>Healthy Lunch</span>
                      </div>
                      <span className="text-gray-500">12:30 PM</span>
                    </div>
                    <div className="flex items-center justify-between text-sm bg-white rounded-lg p-2">
                      <div className="flex items-center">
                        <span className="mr-2">🧘</span>
                        <span>Meditation</span>
                      </div>
                      <span className="text-gray-500">7:00 PM</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 space-y-2">
                  <div className="flex items-center text-sm">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></div>
                    <span className="text-gray-600">Today</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-gray-600">Scheduled Events</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-gray-600">Multiple Events</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Programs */}
      <div className="py-20 sm:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Featured Programs Content */}
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-6">
                Featured Programs
              </h2>
              <p className="text-lg leading-8 text-gray-600 mb-8">
                Start your journey with our most popular health and fitness programs designed by experts and powered by AI.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white hover:shadow-lg transition-all duration-300">
                  <div className="text-3xl mb-3">💪</div>
                  <h3 className="text-lg font-semibold mb-2">Lean & Strong</h3>
                  <p className="text-purple-100 text-sm">Build muscle and burn fat with our strength training program.</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white hover:shadow-lg transition-all duration-300">
                  <div className="text-3xl mb-3">🧘</div>
                  <h3 className="text-lg font-semibold mb-2">Mindful Mobility</h3>
                  <p className="text-blue-100 text-sm">Improve flexibility and mental wellness through yoga and meditation.</p>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white hover:shadow-lg transition-all duration-300">
                  <div className="text-3xl mb-3">⚡</div>
                  <h3 className="text-lg font-semibold mb-2">Cardio Boost</h3>
                  <p className="text-orange-100 text-sm">High-intensity workouts to improve cardiovascular health.</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white hover:shadow-lg transition-all duration-300">
                  <div className="text-3xl mb-3">🥗</div>
                  <h3 className="text-lg font-semibold mb-2">Slow Eating</h3>
                  <p className="text-emerald-100 text-sm">Develop mindful eating habits for better digestion and nutrition.</p>
                </div>
              </div>
            </div>
            
            {/* Additional Features */}
            <div className="bg-gray-50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Why Choose VitaCoach AI?</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center mr-3 mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Personalized AI Coaching</h4>
                    <p className="text-gray-600 text-sm">Custom plans adapted to your lifestyle and goals</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center mr-3 mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Real-time Progress Tracking</h4>
                    <p className="text-gray-600 text-sm">Monitor your health journey with detailed analytics</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center mr-3 mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Expert-Designed Programs</h4>
                    <p className="text-gray-600 text-sm">Created by certified trainers and nutritionists</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center mr-3 mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">24/7 AI Support</h4>
                    <p className="text-gray-600 text-sm">Get instant answers and motivation anytime</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <button 
                  onClick={handleGetStarted}
                  className="w-full bg-emerald-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-emerald-700 transition-colors duration-200"
                >
                  Start Your Journey Today
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Chatbot />
    </>
  )
}

export { HomePage }
