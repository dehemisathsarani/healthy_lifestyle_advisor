import { Navbar } from '../components/Navbar'
import { Chatbot } from '../components/Chatbot'
import { HolisticHealthAnalyzer } from '../components/HolisticHealthAnalyzer'

export const HealthJourneyPage = () => {
  return (
    <>
      <Navbar />
      
      {/* Page Header Section */}
      <div className="relative bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 overflow-hidden py-16">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse blur-sm"></div>
          <div className="absolute top-32 right-20 w-16 h-16 bg-white/5 rounded-full animate-bounce blur-sm"></div>
          <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-white/10 rounded-full animate-pulse delay-300 blur-sm"></div>
          <div className="absolute bottom-32 right-1/3 w-24 h-24 bg-white/5 rounded-full animate-bounce delay-500 blur-sm"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 via-transparent to-pink-500/20 animate-pulse"></div>
        </div>
        
        <div className="relative px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-md rounded-full mb-6 border border-white/30">
              <span className="text-3xl mr-3 animate-pulse">🌟</span>
              <span className="text-sm font-bold text-white">AI-Powered Complete Health Analysis</span>
            </div>
            
            {/* Title */}
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl mb-6">
              Your AI Health Journey
              <span className="block mt-2 bg-gradient-to-r from-yellow-200 via-pink-200 to-blue-200 bg-clip-text text-transparent">
                Starts Here
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl leading-8 text-white/90 max-w-2xl mx-auto mb-8">
              Tell us about your complete situation - feelings, eating habits, fitness routine, and mental state. 
              Our advanced AI system will analyze everything and provide personalized solutions across 
              <span className="font-bold text-yellow-200"> Mental Health</span>,
              <span className="font-bold text-green-200"> Diet</span>, and
              <span className="font-bold text-blue-200"> Fitness</span>.
            </p>
            
            {/* Features */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-white/90">
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                <span className="text-xl">🧠</span>
                <span className="text-sm font-semibold">Mental Health</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                <span className="text-xl">🥗</span>
                <span className="text-sm font-semibold">Personalized Diet</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                <span className="text-xl">💪</span>
                <span className="text-sm font-semibold">Fitness Plans</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                <span className="text-xl">🧘</span>
                <span className="text-sm font-semibold">Meditations</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                <span className="text-xl">📋</span>
                <span className="text-sm font-semibold">Instructions</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content - Holistic Health Analyzer */}
      <HolisticHealthAnalyzer />
      
      {/* Chatbot */}
      <Chatbot />
      
      {/* Footer Section */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Transform Your Health?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Join thousands of users who have improved their health with our AI-powered system
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 text-gray-600">
              <div className="flex items-center space-x-2">
                <span className="text-yellow-400">⭐⭐⭐⭐⭐</span>
                <span className="text-sm font-semibold">4.9/5 Rating</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xl">👥</span>
                <span className="text-sm font-semibold">50,000+ Users</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xl">🔒</span>
                <span className="text-sm font-semibold">100% Secure</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xl">🏆</span>
                <span className="text-sm font-semibold">Award Winning</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default HealthJourneyPage
