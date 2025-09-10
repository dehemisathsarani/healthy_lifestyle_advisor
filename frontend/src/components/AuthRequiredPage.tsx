import { useNavigate } from 'react-router-dom'
import { Lock, User, ArrowRight, Shield } from 'lucide-react'

interface AuthRequiredPageProps {
  title?: string
  message?: string
  redirectPath?: string
  redirectText?: string
}

export const AuthRequiredPage: React.FC<AuthRequiredPageProps> = ({
  title = "Authentication Required",
  message = "Please log in to access this page and unlock all the powerful health and wellness features.",
  redirectPath = "/login",
  redirectText = "Go to Login"
}) => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Icon */}
          <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
            <Lock className="w-10 h-10 text-emerald-600" />
          </div>
          
          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {title}
          </h1>
          
          {/* Message */}
          <p className="text-gray-600 mb-8 leading-relaxed">
            {message}
          </p>
          
          {/* Features List */}
          <div className="space-y-3 mb-8 text-left">
            <div className="flex items-center text-sm text-gray-700">
              <Shield className="w-4 h-4 text-emerald-500 mr-3 flex-shrink-0" />
              <span>Secure access to personalized health services</span>
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <User className="w-4 h-4 text-emerald-500 mr-3 flex-shrink-0" />
              <span>Track your progress and health journey</span>
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <ArrowRight className="w-4 h-4 text-emerald-500 mr-3 flex-shrink-0" />
              <span>Access AI-powered diet and fitness plans</span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => navigate(redirectPath)}
              className="w-full bg-emerald-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-emerald-700 transition-colors duration-200 flex items-center justify-center"
            >
              <span>{redirectText}</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
            
            <button
              onClick={() => navigate('/register')}
              className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 transition-colors duration-200"
            >
              Create New Account
            </button>
            
            <button
              onClick={() => navigate('/')}
              className="w-full text-gray-500 py-2 px-6 rounded-lg hover:text-gray-700 transition-colors duration-200"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
