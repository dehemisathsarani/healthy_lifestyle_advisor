import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Navbar } from '../components/Navbar'
import { Chatbot } from '../components/Chatbot'

const HomePage = () => {
  const navigate = useNavigate()
  const [scrollY, setScrollY] = useState(0)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Fitness Enthusiast",
      avatar: "👩‍💼",
      text: "VitaCoach AI helped me lose 20 pounds and build healthy habits that stick. The personalized meal plans are incredible!",
      rating: 5
    },
    {
      name: "Marcus Rodriguez",
      role: "Busy Professional",
      avatar: "👨‍💻",
      text: "Finally found a health app that adapts to my crazy schedule. The AI suggestions are spot-on every time.",
      rating: 5
    },
    {
      name: "Emma Thompson",
      role: "New Mom",
      avatar: "👩‍🍼",
      text: "The nutrition tracking made managing my post-pregnancy health journey so much easier. Love the intelligent insights!",
      rating: 5
    }
  ]
  
  // Handle scroll for parallax effects
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Auto-rotate testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [testimonials.length])
  
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
      <div className="relative bg-gradient-to-br from-emerald-500 via-cyan-600 to-blue-700 overflow-hidden min-h-screen flex items-center">
        {/* Enhanced Animated Background */}
        <div className="absolute inset-0">
          {/* Floating orbs with parallax */}
          <div 
            className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse blur-sm"
            style={{ transform: `translateY(${scrollY * 0.1}px)` }}
          ></div>
          <div 
            className="absolute top-32 right-20 w-16 h-16 bg-white/5 rounded-full animate-bounce blur-sm"
            style={{ transform: `translateY(${scrollY * 0.15}px)` }}
          ></div>
          <div 
            className="absolute bottom-20 left-1/4 w-12 h-12 bg-white/10 rounded-full animate-pulse delay-300 blur-sm"
            style={{ transform: `translateY(${scrollY * -0.1}px)` }}
          ></div>
          <div 
            className="absolute bottom-32 right-1/3 w-24 h-24 bg-white/5 rounded-full animate-bounce delay-500 blur-sm"
            style={{ transform: `translateY(${scrollY * -0.2}px)` }}
          ></div>
          
          {/* Gradient mesh overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 via-transparent to-pink-500/20 animate-pulse"></div>
          
          {/* Geometric patterns */}
          <div className="absolute top-1/4 left-1/4 w-32 h-32 border border-white/10 rotate-45 animate-spin-slow"></div>
          <div className="absolute bottom-1/4 right-1/4 w-24 h-24 border border-white/5 rotate-12 animate-reverse-spin"></div>
        </div>
        
        <div className="relative px-6 lg:px-8 w-full">
          <div className="mx-auto max-w-4xl py-24 sm:py-32 lg:py-40">
            {/* Enhanced announcement badge */}
            <div className="hidden sm:mb-8 sm:flex sm:justify-center">
              <div className="group relative rounded-full px-6 py-3 text-sm leading-6 text-white ring-1 ring-white/20 hover:ring-white/30 backdrop-blur-md bg-white/10 transition-all duration-300 hover:scale-105 hover:bg-white/15">
                <span className="flex items-center">
                  <span className="animate-pulse text-yellow-300 mr-2">✨</span> 
                  <span className="bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent font-semibold">
                    NEW: VitaCoach AI 2.0 with Enhanced RAG System
                  </span>
                  <a href="#" className="font-semibold text-white ml-2 group-hover:text-yellow-200 transition-colors">
                    <span className="absolute inset-0" aria-hidden="true" />
                    Learn more <span aria-hidden="true" className="group-hover:translate-x-1 inline-block transition-transform">→</span>
                  </a>
                </span>
              </div>
            </div>
            
            <div className="text-center">
              {/* Enhanced emoji animation */}
              <div className="mb-8 flex justify-center">
                <div className="flex space-x-4 text-7xl">
                  <span className="animate-bounce delay-100 hover:scale-125 transition-transform cursor-pointer">💪</span>
                  <span className="animate-bounce delay-200 hover:scale-125 transition-transform cursor-pointer">🥗</span>
                  <span className="animate-bounce delay-300 hover:scale-125 transition-transform cursor-pointer">🧘</span>
                  <span className="animate-bounce delay-400 hover:scale-125 transition-transform cursor-pointer">📱</span>
                </div>
              </div>
              
              {/* Enhanced title with gradient text and animations */}
              <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-7xl mb-6">
                <span className="block bg-gradient-to-r from-white via-emerald-100 to-cyan-100 bg-clip-text text-transparent animate-gradient-x">
                  Your Personal Health
                </span>
                <span className="block bg-gradient-to-r from-emerald-200 via-cyan-200 to-blue-200 bg-clip-text text-transparent text-4xl sm:text-6xl mt-2 animate-gradient-x-reverse">
                  Ecosystem Powered by AI
                </span>
              </h1>
              
              {/* Enhanced description */}
              <p className="mt-8 text-xl leading-8 text-emerald-100 max-w-3xl mx-auto backdrop-blur-sm bg-white/5 rounded-2xl p-6 border border-white/10">
                <span className="text-2xl mr-2">🤖</span>
                VitaCoach AI 2.0 combines advanced machine learning with personalized health insights 
                to create your perfect wellness blueprint. From AI-powered nutrition analysis to 
                intelligent workout scheduling — your health journey, optimized.
              </p>
              
              {/* Enhanced stats with animations */}
              <div className="mt-12 grid grid-cols-3 gap-8 text-white/90">
                <div className="group text-center transform hover:scale-110 transition-all duration-300 cursor-pointer">
                  <div className="text-3xl font-bold bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">50k+</div>
                  <div className="text-sm text-emerald-200 group-hover:text-white transition-colors">Transformed Lives</div>
                  <div className="w-16 h-1 bg-gradient-to-r from-yellow-400 to-orange-400 mx-auto mt-2 rounded-full"></div>
                </div>
                <div className="group text-center transform hover:scale-110 transition-all duration-300 cursor-pointer">
                  <div className="text-3xl font-bold bg-gradient-to-r from-green-300 to-emerald-300 bg-clip-text text-transparent">2M+</div>
                  <div className="text-sm text-emerald-200 group-hover:text-white transition-colors">Meals Analyzed</div>
                  <div className="w-16 h-1 bg-gradient-to-r from-green-400 to-emerald-400 mx-auto mt-2 rounded-full"></div>
                </div>
                <div className="group text-center transform hover:scale-110 transition-all duration-300 cursor-pointer">
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">1M+</div>
                  <div className="text-sm text-emerald-200 group-hover:text-white transition-colors">Workouts Completed</div>
                  <div className="w-16 h-1 bg-gradient-to-r from-blue-400 to-cyan-400 mx-auto mt-2 rounded-full"></div>
                </div>
              </div>

              {/* Enhanced CTA buttons */}
              <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6">
                <button
                  onClick={handleGetStarted}
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-white to-emerald-50 px-10 py-5 text-lg font-bold text-emerald-600 shadow-2xl hover:shadow-3xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-all duration-300 hover:scale-105 hover:-translate-y-1"
                >
                  <span className="relative flex items-center z-10">
                    <span className="text-2xl mr-3">🚀</span>
                    Start Your AI Health Journey
                    <span className="ml-3 group-hover:translate-x-2 transition-transform duration-200">→</span>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-cyan-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                </button>
                
                <button
                  onClick={handleLearnMore}
                  className="group flex items-center text-lg font-semibold leading-6 text-white hover:text-emerald-100 border-2 border-white/30 px-8 py-5 rounded-2xl hover:bg-white/15 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:border-white/50"
                >
                  <span className="text-2xl mr-3">🎬</span>
                  Watch AI Demo
                  <span className="ml-3 group-hover:translate-x-2 transition-transform duration-200">→</span>
                </button>
              </div>

              {/* Enhanced trust indicators */}
              <div className="mt-16 flex flex-col items-center">
                <p className="text-emerald-200 text-sm mb-6 font-medium">Trusted by health professionals worldwide</p>
                <div className="flex flex-wrap items-center justify-center gap-8 text-white/80">
                  <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 hover:bg-white/20 transition-colors">
                    <span className="text-yellow-400">⭐⭐⭐⭐⭐</span>
                    <span className="text-sm font-semibold">4.9/5 Rating</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 hover:bg-white/20 transition-colors">
                    <span className="text-xl">📱</span>
                    <span className="text-sm font-semibold">Cross-Platform</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 hover:bg-white/20 transition-colors">
                    <span className="text-xl">🔒</span>
                    <span className="text-sm font-semibold">100% Secure</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 hover:bg-white/20 transition-colors">
                    <span className="text-xl">🏆</span>
                    <span className="text-sm font-semibold">Award Winning</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Services Status Banner */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 py-4">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-6 text-white">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-300 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold">AI Services Online</span>
            </div>
            <div className="text-sm opacity-80">|</div>
            <div className="flex items-center space-x-2">
              <span className="text-sm">🧠 BMI/TDEE Calculator</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm">🍽️ Meal Analyzer</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm">📋 Meal Planner</span>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <span className="text-sm opacity-75">Ready to serve you 24/7</span>
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

      {/* Testimonials Section */}
      <div className="py-20 sm:py-24 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-purple-200/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-pink-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full mb-6">
              <span className="text-2xl mr-2">💬</span>
              <span className="text-sm font-semibold text-purple-700">What our users say</span>
            </div>
            <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-6">
              Real Stories, Real Results
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join thousands of people who've transformed their health with VitaCoach AI's personalized approach.
            </p>
          </div>

          {/* Enhanced Testimonials Carousel */}
          <div className="relative max-w-4xl mx-auto">
            <div className="overflow-hidden rounded-3xl">
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}
              >
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="w-full flex-shrink-0 px-4">
                    <div className="bg-white rounded-2xl p-8 lg:p-12 shadow-xl border border-gray-100 text-center">
                      <div className="mb-6">
                        <div className="flex justify-center mb-4">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <span key={i} className="text-2xl text-yellow-400">⭐</span>
                          ))}
                        </div>
                        <blockquote className="text-xl lg:text-2xl text-gray-700 font-medium leading-relaxed mb-8">
                          "{testimonial.text}"
                        </blockquote>
                      </div>
                      <div className="flex items-center justify-center">
                        <div className="text-6xl mr-4">{testimonial.avatar}</div>
                        <div className="text-left">
                          <div className="font-bold text-lg text-gray-900">{testimonial.name}</div>
                          <div className="text-purple-600 font-medium">{testimonial.role}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Testimonial Navigation */}
            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentTestimonial 
                      ? 'bg-purple-600 w-8' 
                      : 'bg-purple-200 hover:bg-purple-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Trust Metrics */}
          <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="text-3xl mb-2">💯</div>
                <div className="text-2xl font-bold text-gray-900">98%</div>
                <div className="text-sm text-gray-600">User Satisfaction</div>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="text-3xl mb-2">🎯</div>
                <div className="text-2xl font-bold text-gray-900">87%</div>
                <div className="text-sm text-gray-600">Goal Achievement</div>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="text-3xl mb-2">📈</div>
                <div className="text-2xl font-bold text-gray-900">156%</div>
                <div className="text-sm text-gray-600">Health Improvement</div>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="text-3xl mb-2">⚡</div>
                <div className="text-2xl font-bold text-gray-900">24/7</div>
                <div className="text-sm text-gray-600">AI Support</div>
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
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                    <div key={index} className="font-semibold text-gray-500 py-2">{day}</div>
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

      {/* Final CTA Section */}
      <div className="py-20 sm:py-24 bg-gradient-to-br from-emerald-600 via-cyan-600 to-blue-700 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/20 via-transparent to-pink-600/20"></div>
        </div>
        
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <div className="mx-auto max-w-4xl">
            <div className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-md rounded-full mb-8 border border-white/20">
              <span className="text-2xl mr-3">🚀</span>
              <span className="text-white font-semibold">Ready to transform your health?</span>
            </div>
            
            <h2 className="text-4xl sm:text-6xl font-bold text-white mb-6">
              <span className="block">Start Your AI-Powered</span>
              <span className="block bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">
                Health Transformation Today
              </span>
            </h2>
            
            <p className="text-xl text-emerald-100 mb-10 max-w-2xl mx-auto leading-relaxed">
              Join thousands of people who've already discovered the power of personalized AI health coaching. 
              Your journey to optimal wellness starts with a single click.
            </p>

            {/* Enhanced CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
              <button
                onClick={handleGetStarted}
                className="group relative overflow-hidden bg-white text-emerald-600 px-10 py-5 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 min-w-[280px]"
              >
                <span className="relative z-10 flex items-center justify-center">
                  <span className="text-2xl mr-3">💫</span>
                  Get Started Free
                  <span className="ml-3 group-hover:translate-x-2 transition-transform">→</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-cyan-500 opacity-0 group-hover:opacity-10 transition-opacity"></div>
              </button>
              
              <div className="text-center text-white/80">
                <div className="text-sm mb-2">✅ No credit card required</div>
                <div className="text-sm">🔒 Privacy protected</div>
              </div>
            </div>

            {/* Social Proof */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-white/90">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">50k+</div>
                <div className="text-emerald-200 text-sm">Lives Transformed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">98%</div>
                <div className="text-emerald-200 text-sm">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">4.9★</div>
                <div className="text-emerald-200 text-sm">App Store Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Footer */}
      <footer className="bg-gray-900 text-white relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"></div>
        
        <div className="relative">
          {/* Main footer content */}
          <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Brand section */}
              <div className="lg:col-span-2">
                <div className="flex items-center mb-6">
                  <div className="text-3xl mr-3">🌟</div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                    VitaCoach AI
                  </h3>
                </div>
                <p className="text-gray-300 mb-6 max-w-md leading-relaxed">
                  The world's most advanced AI-powered health ecosystem. Transforming lives through 
                  personalized nutrition, fitness, and wellness guidance.
                </p>
                <div className="flex space-x-4">
                  {['🐦', '📘', '📷', '🎵'].map((emoji, index) => (
                    <div key={index} className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-emerald-600 transition-colors cursor-pointer">
                      <span className="text-lg">{emoji}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="text-lg font-semibold mb-6 text-emerald-400">Features</h4>
                <ul className="space-y-3 text-gray-300">
                  <li><a href="#" className="hover:text-emerald-400 transition-colors">AI Nutrition Analysis</a></li>
                  <li><a href="#" className="hover:text-emerald-400 transition-colors">Smart Meal Planning</a></li>
                  <li><a href="#" className="hover:text-emerald-400 transition-colors">Fitness Coaching</a></li>
                  <li><a href="#" className="hover:text-emerald-400 transition-colors">Health Calendar</a></li>
                  <li><a href="#" className="hover:text-emerald-400 transition-colors">Progress Tracking</a></li>
                </ul>
              </div>

              {/* Support */}
              <div>
                <h4 className="text-lg font-semibold mb-6 text-emerald-400">Support</h4>
                <ul className="space-y-3 text-gray-300">
                  <li><a href="#" className="hover:text-emerald-400 transition-colors">Help Center</a></li>
                  <li><a href="#" className="hover:text-emerald-400 transition-colors">Contact Us</a></li>
                  <li><a href="#" className="hover:text-emerald-400 transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-emerald-400 transition-colors">Terms of Service</a></li>
                  <li><a href="#" className="hover:text-emerald-400 transition-colors">AI Ethics</a></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-gray-800">
            <div className="mx-auto max-w-7xl px-6 lg:px-8 py-6">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="text-gray-400 text-sm mb-4 md:mb-0">
                  © 2025 VitaCoach AI. Powered by advanced machine learning. All rights reserved.
                </div>
                <div className="flex items-center space-x-6 text-gray-400 text-sm">
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                    All systems operational
                  </span>
                  <span>🤖 Enhanced RAG System v2.0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <Chatbot />
    </>
  )
}

export { HomePage }
