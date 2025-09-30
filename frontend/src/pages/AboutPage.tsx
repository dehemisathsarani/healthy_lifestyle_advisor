import { Navbar } from '../components/Navbar'
import { Chatbot } from '../components/Chatbot'

export const AboutPage = () => {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl mb-6">
              About VitaCoach AI
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Empowering your health journey with cutting-edge AI technology and personalized wellness solutions
            </p>
          </div>

          {/* Mission Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
                <p className="text-lg text-gray-600 mb-4">
                  We are a modern web-based agentic platform focused on healthy living. Our mission is to provide
                  actionable insights, personalized plans, and seamless tracking to help you thrive.
                </p>
                <p className="text-lg text-gray-600">
                  By combining artificial intelligence with evidence-based health practices, we make wellness 
                  accessible, enjoyable, and sustainable for everyone.
                </p>
              </div>
              <div className="text-center">
                <div className="text-8xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold text-gray-900">Personalized Health Journey</h3>
              </div>
            </div>
          </div>

          {/* What Makes Us Different */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">What Makes Us Different</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-xl p-6 text-center">
                <div className="text-4xl mb-4">🤖</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">AI-Powered Insights</h3>
                <p className="text-gray-600">
                  Agentic recommendations that adapt to your routine and evolve with your progress
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 text-center">
                <div className="text-4xl mb-4">📱</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Modern Experience</h3>
                <p className="text-gray-600">
                  Clean, delightful, mobile-first UI designed for seamless daily use
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 text-center">
                <div className="text-4xl mb-4">🔒</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Privacy First</h3>
                <p className="text-gray-600">
                  Privacy-first approach to your health data with full transparency and control
                </p>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Platform Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl mb-3">🍎</div>
                <h4 className="font-semibold text-gray-900 mb-2">Nutrition Analysis</h4>
                <p className="text-sm text-gray-600">AI-powered food recognition and nutritional insights</p>
              </div>
              
              <div className="text-center">
                <div className="text-3xl mb-3">💪</div>
                <h4 className="font-semibold text-gray-900 mb-2">Fitness Planning</h4>
                <p className="text-sm text-gray-600">Personalized workout routines and progress tracking</p>
              </div>
              
              <div className="text-center">
                <div className="text-3xl mb-3">🧠</div>
                <h4 className="font-semibold text-gray-900 mb-2">Mental Wellness</h4>
                <p className="text-sm text-gray-600">Mood tracking and mindfulness exercises</p>
              </div>
              
              <div className="text-center">
                <div className="text-3xl mb-3">📊</div>
                <h4 className="font-semibold text-gray-900 mb-2">Health Analytics</h4>
                <p className="text-sm text-gray-600">Comprehensive health insights and reports</p>
              </div>
            </div>
          </div>

          {/* Team Section */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Built with ❤️</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our platform is continuously evolving, powered by the latest advancements in AI and machine learning, 
              to provide you with the most accurate and helpful health guidance.
            </p>
          </div>
        </div>
      </div>
      <Chatbot />
    </>
  )
}


