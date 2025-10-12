import { useState } from 'react'
import { ArrowLeft, Shield, Mail, CheckCircle, AlertCircle, ArrowRight, FileText, Lock } from 'lucide-react'
import axios from 'axios'
import SecureReportForm from './security/SecureReportForm'
import DecryptReportForm from './security/DecryptReportForm'

interface SecurityAgentProps {
  onBackToServices: () => void
}

type Step = 'email_verification' | 'report_generation' | 'decryption'

export const SecurityAgent: React.FC<SecurityAgentProps> = ({ onBackToServices }) => {
  const [currentStep, setCurrentStep] = useState<Step>('email_verification')
  const [userEmail, setUserEmail] = useState('')
  const [reportData, setReportData] = useState<any>(null)

  const handleEmailVerified = (email: string) => {
    setUserEmail(email)
    setCurrentStep('report_generation')
  }

  const handleReportDownloaded = (data: any) => {
    setReportData(data)
    setCurrentStep('decryption')
  }

  const handleBackToEmailVerification = () => {
    setCurrentStep('email_verification')
    setUserEmail('')
    setReportData(null)
  }

  const handleBackToReportGeneration = () => {
    setCurrentStep('report_generation')
    setReportData(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBackToServices}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-all duration-200 shadow-sm hover:shadow"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Services
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-gray-700" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Data & Security Agent</h1>
              <p className="text-sm text-gray-600">Secure Health Report Access System</p>
            </div>
          </div>
        </div>

        {/* Three-Step Workflow */}
        <div className="space-y-6">
          {currentStep === 'email_verification' && (
            <EmailVerificationPage onEmailVerified={handleEmailVerified} />
          )}
          
          {currentStep === 'report_generation' && (
            <SecureReportForm 
              identifier={userEmail}
              onReportReceived={handleReportDownloaded}
              onBack={handleBackToEmailVerification}
            />
          )}
          
          {currentStep === 'decryption' && reportData && (
            <DecryptReportForm 
              encryptedReport={reportData.encrypted_report || ''}
              decryptionToken={reportData.decryption_token || ''}
              userId={reportData.user_id || ''}
              userEmail={userEmail}
              onBack={handleBackToReportGeneration}
            />
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600 space-y-1">
          <p>🔐 All data is encrypted using Fernet symmetric encryption</p>
          <p>Your privacy and security are our top priorities</p>
        </div>
      </div>
    </div>
  )
}

// Email Verification Component
const EmailVerificationPage: React.FC<{ onEmailVerified: (email: string) => void }> = ({ onEmailVerified }) => {
  const [email, setEmail] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [enteredOtp, setEnteredOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Please enter a valid email address')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address format')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')
    
    try {
      const response = await axios.post('/api/security/three-step/request-email-verification', {
        identifier: email.trim()
      })

      if (response.data.success) {
        setOtpSent(true)
        setSuccess(`📧 Step 1: Email verification OTP sent to ${email.trim()}! Check your inbox and enter the code below.`)
      } else {
        setError(response.data.message || 'Failed to send OTP. Please try again.')
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Failed to send OTP. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!enteredOtp.trim()) {
      setError('Please enter the OTP code')
      return
    }

    if (!/^\d{6}$/.test(enteredOtp.trim())) {
      setError('OTP must be a 6-digit number')
      return
    }

    setVerifying(true)
    setError('')
    setSuccess('')
    
    try {
      const response = await axios.post('/api/security/three-step/verify-email-verification', {
        identifier: email.trim(),
        otp_code: enteredOtp.trim()
      })

      if (response.data.success) {
        setSuccess('✅ Email verified successfully! Proceeding to Step 2: Report Generation...')
        setTimeout(() => {
          onEmailVerified(email.trim())
        }, 2000)
      } else {
        setError(response.data.message || 'Invalid OTP code. Please try again.')
      }
    } catch (err: any) {
      if (err.response?.data?.action === 'new_otp_sent') {
        setError('🔄 New OTP has been sent to your email. Please check and enter the new code.')
        setEnteredOtp('')
      } else {
        setError(err.response?.data?.message || err.response?.data?.detail || 'Invalid OTP code. Please try again.')
      }
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
      <div className="flex items-center space-x-3 mb-6">
        <Mail size={32} className="text-blue-600" />
        <div>
          <h2 className="text-xl font-bold text-gray-900">Email Verification</h2>
          <p className="text-sm text-gray-600">Step 1 of 3: Verify your email address to access the health report system</p>
        </div>
      </div>

      {/* Steps Indicator */}
      <div className="flex items-center justify-between mb-8 px-4">
        <div className="flex flex-col items-center flex-1">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold mb-2">1</div>
          <div className="text-xs font-medium text-blue-600">Email Verification</div>
        </div>
        <div className="flex-1 h-px bg-gray-300 mx-4"></div>
        <div className="flex flex-col items-center flex-1">
          <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-bold mb-2">2</div>
          <div className="text-xs text-gray-500">Report Generation</div>
        </div>
        <div className="flex-1 h-px bg-gray-300 mx-4"></div>
        <div className="flex flex-col items-center flex-1">
          <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-bold mb-2">3</div>
          <div className="text-xs text-gray-500">Report Decryption</div>
        </div>
      </div>

      {!otpSent ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={loading}
            />
            <small className="text-gray-500 text-xs mt-1 block">
              🔐 We'll send a verification code to this email address
            </small>
          </div>

          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              <AlertCircle size={16} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
              <CheckCircle size={16} />
              <span className="text-sm">{success}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <><span className="animate-spin">⏳</span><span>Sending OTP...</span></>
            ) : (
              <><Mail size={18} /><span>Send Verification Code</span></>
            )}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Enter OTP Code</label>
            <input
              type="text"
              value={enteredOtp}
              onChange={(e) => setEnteredOtp(e.target.value)}
              placeholder="Enter 6-digit code"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest font-mono"
              maxLength={6}
              disabled={verifying}
            />
          </div>

          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              <AlertCircle size={16} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
              <CheckCircle size={16} />
              <span className="text-sm">{success}</span>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={() => {
                setOtpSent(false)
                setEnteredOtp('')
                setError('')
                setSuccess('')
              }}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
            >
              Resend Code
            </button>
            <button
              onClick={handleVerifyOtp}
              disabled={verifying}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {verifying ? (
                <><span className="animate-spin">⏳</span><span>Verifying...</span></>
              ) : (
                <><CheckCircle size={18} /><span>Verify & Continue</span></>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}