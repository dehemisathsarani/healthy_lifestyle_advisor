import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Navbar } from '../components/Navbar'

export const PaymentSuccessPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const plan = searchParams.get('plan') || 'premium'

  useEffect(() => {
    // Confetti animation
    const duration = 3 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min
    }

    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)
      
      // Since confetti is not installed, we'll skip the actual confetti
      // In production, install: npm install canvas-confetti
      // import confetti from 'canvas-confetti'
      // confetti(Object.assign({}, defaults, {
      //   particleCount,
      //   origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      // }))
      // confetti(Object.assign({}, defaults, {
      //   particleCount,
      //   origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      // }))
    }, 250)

    return () => clearInterval(interval)
  }, [])

  const planDetails: any = {
    premium: { name: 'Premium', icon: '💎', color: 'emerald' },
    pro: { name: 'Pro', icon: '🏆', color: 'purple' }
  }

  const selectedPlan = planDetails[plan] || planDetails.premium

  return (
    <>
      <Navbar />
      
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-2xl w-full">
          
          {/* Success Card */}
          <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">
            
            {/* Animated Checkmark */}
            <div className="mb-8">
              <div className="mx-auto w-24 h-24 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center animate-bounce">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* Success Message */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Payment Successful! 🎉
            </h1>
            
            <p className="text-xl text-gray-600 mb-8">
              Welcome to {selectedPlan.name}! Your subscription is now active.
            </p>

            {/* Plan Badge */}
            <div className={`inline-flex items-center bg-gradient-to-r from-${selectedPlan.color}-500 to-${selectedPlan.color}-600 text-white px-6 py-3 rounded-full font-bold text-lg mb-8`}>
              <span className="text-2xl mr-2">{selectedPlan.icon}</span>
              {selectedPlan.name} Plan Activated
            </div>

            {/* What's Next */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-8 mb-8 text-left">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                What's Next?
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold mr-4">
                    1
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Check Your Email</h3>
                    <p className="text-gray-600 text-sm">
                      We've sent a confirmation email with your receipt and subscription details.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold mr-4">
                    2
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Complete Your Profile</h3>
                    <p className="text-gray-600 text-sm">
                      Set up your health goals, dietary preferences, and fitness targets.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold mr-4">
                    3
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Start Your Health Journey</h3>
                    <p className="text-gray-600 text-sm">
                      Access unlimited meal analyses, AI coaching, and personalized workout plans.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium Features Unlocked */}
            <div className="bg-white border-2 border-emerald-200 rounded-2xl p-6 mb-8 text-left">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                <span className="text-2xl mr-2">🎁</span>
                Premium Features Unlocked
              </h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Unlimited meal analyses
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  AI-powered meal planning
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Unlimited AI chat
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Food scanning AI
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Progress tracking
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  PDF report exports
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl"
              >
                Go to Dashboard
              </button>
              
              <button
                onClick={() => navigate('/profile')}
                className="px-8 py-4 bg-white border-2 border-emerald-500 text-emerald-600 font-bold rounded-xl hover:bg-emerald-50 transition-all"
              >
                Complete Profile
              </button>
            </div>

            {/* Support */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3">
                Questions about your subscription?
              </p>
              <button
                onClick={() => navigate('/contact')}
                className="text-emerald-600 hover:text-emerald-700 font-semibold text-sm"
              >
                Contact Support →
              </button>
            </div>

            {/* Money-back Guarantee */}
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-center text-sm text-yellow-800">
                <span className="text-xl mr-2">✨</span>
                <span>
                  <strong>14-Day Money-Back Guarantee:</strong> Not satisfied? Get a full refund, no questions asked.
                </span>
              </div>
            </div>

          </div>

          {/* Additional Info */}
          <div className="mt-8 text-center text-sm text-gray-600">
            <p>
              Need help getting started?{' '}
              <a href="/help" className="text-emerald-600 hover:text-emerald-700 font-semibold">
                View our getting started guide
              </a>
            </p>
          </div>

        </div>
      </div>
    </>
  )
}
