import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { Chatbot } from '../components/Chatbot'

export const HomePage = () => {
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
      <div className="bg-gradient-to-br from-emerald-500 to-cyan-600">
        <div className="relative px-6 lg:px-8">
          <div className="mx-auto max-w-2xl py-24 sm:py-32 lg:py-40">
            <div className="hidden sm:mb-8 sm:flex sm:justify-center">
              <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-white ring-1 ring-white/20 hover:ring-white/30">
                Meet your advisor: VitaCoach AI{' '}
                <a href="#" className="font-semibold text-white">
                  <span className="absolute inset-0" aria-hidden="true" />
                  Read more <span aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
                Health, Fitness, and Food — Tailored for You
              </h1>
              <p className="mt-6 text-lg leading-8 text-emerald-100">
                VitaCoach AI crafts daily plans across training and nutrition, aligning with your goals and schedule.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <button
                  onClick={handleGetStarted}
                  className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-emerald-600 shadow-sm hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-all duration-200"
                >
                  Start Free
                </button>
                <button
                  onClick={handleLearnMore}
                  className="text-sm font-semibold leading-6 text-white hover:text-emerald-100 border border-white/30 px-6 py-3 rounded-md hover:bg-white/10 transition-all duration-200"
                >
                  See How It Works <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 sm:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center mb-16">
            <h2 className="text-base font-semibold leading-7 text-emerald-600">Everything you need</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Comprehensive Health Services
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              From nutrition analysis to mental wellness, our AI-powered platform provides 
              personalized recommendations for every aspect of your health journey.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col items-center text-center bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-all duration-300">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 mb-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-xl">
                    <span className="text-2xl">💖</span>
                  </div>
                </dt>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Wellness Insights</h3>
                <dd className="flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">Daily tips to keep you energized.</p>
                </dd>
              </div>
              <div className="flex flex-col items-center text-center bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-all duration-300">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 mb-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-xl">
                    <span className="text-2xl">🍎</span>
                  </div>
                </dt>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Nutrition Plans</h3>
                <dd className="flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">Balanced meals for your goals.</p>
                </dd>
              </div>
              <div className="flex flex-col items-center text-center bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-all duration-300">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 mb-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-xl">
                    <span className="text-2xl">🏃</span>
                  </div>
                </dt>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Workout Routines</h3>
                <dd className="flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">Smart training tailored to you.</p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Calendar Section */}
      <div className="py-20 sm:py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Calendar Content */}
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-6">
                Planner Calendar
              </h2>
              <p className="text-lg leading-8 text-gray-600 mb-8">
                Schedule workouts, meal prep, and wellness activities with our integrated calendar. 
                Stay organized and track your progress with smart planning tools.
              </p>
              
              {/* Calendar Stats */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-2xl font-bold text-emerald-600">24</div>
                  <div className="text-sm text-gray-600">Workouts This Month</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-2xl font-bold text-blue-600">89</div>
                  <div className="text-sm text-gray-600">Meals Tracked</div>
                </div>
              </div>
              
              <button 
                onClick={() => navigate('/calendar')}
                className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors duration-200"
              >
                View Full Calendar →
              </button>
            </div>
            
            {/* Calendar Widget */}
            <div className="flex justify-center">
              <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">August 2025</h3>
                  <div className="flex space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">‹</button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">›</button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-sm mb-2">
                  <div className="font-medium text-gray-500 py-2">S</div>
                  <div className="font-medium text-gray-500 py-2">M</div>
                  <div className="font-medium text-gray-500 py-2">T</div>
                  <div className="font-medium text-gray-500 py-2">W</div>
                  <div className="font-medium text-gray-500 py-2">T</div>
                  <div className="font-medium text-gray-500 py-2">F</div>
                  <div className="font-medium text-gray-500 py-2">S</div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-sm">
                  {/* Calendar Days */}
                  {[...Array(31)].map((_, i) => (
                    <div key={i} className={`py-3 cursor-pointer transition-all duration-200 ${
                      i + 1 === 25 
                        ? 'bg-emerald-500 text-white rounded-lg font-semibold shadow-sm' 
                        : i + 1 === 15 || i + 1 === 18 || i + 1 === 22
                        ? 'bg-blue-100 text-blue-700 rounded-lg font-medium'
                        : 'text-gray-700 hover:bg-gray-100 rounded-lg'
                    }`}>
                      {i + 1}
                    </div>
                  ))}
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
