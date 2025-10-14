import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Navbar } from '../components/Navbar'

export const CheckoutPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Get plan and billing info from URL
  const planParam = searchParams.get('plan') || 'premium'
  const billingParam = searchParams.get('billing') || 'monthly'
  
  // Plan details
  const planDetails = {
    premium: {
      name: 'Premium',
      monthlyPrice: 9.99,
      annualPrice: 99,
      icon: '💎',
      color: 'emerald',
      features: [
        'Unlimited meal analyses',
        'AI-powered meal planning',
        'Advanced nutrition insights',
        'Unlimited workout plans',
        'Progress tracking & analytics',
        'Unlimited AI chat',
        'Food scanning with YOLO AI',
        'Export PDF reports',
        'Priority support'
      ]
    },
    pro: {
      name: 'Pro',
      monthlyPrice: 19.99,
      annualPrice: 199,
      icon: '🏆',
      color: 'purple',
      features: [
        'Everything in Premium',
        'Advanced AI health coaching',
        'Custom meal plan templates',
        'Fitness coach mode',
        'Advanced biometric tracking',
        'Wearables integration',
        'White-label reports',
        'API access',
        'Team collaboration (5 members)',
        'Priority video support'
      ]
    }
  }

  const selectedPlan = planDetails[planParam as keyof typeof planDetails] || planDetails.premium
  const isAnnual = billingParam === 'annual'
  const price = isAnnual ? selectedPlan.annualPrice : selectedPlan.monthlyPrice
  const savings = isAnnual ? Math.round(((selectedPlan.monthlyPrice * 12 - selectedPlan.annualPrice) / (selectedPlan.monthlyPrice * 12)) * 100) : 0

  // Payment form state
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    
    // Billing Address
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    
    // Payment Information (In production, use Stripe Elements)
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
    
    // Agreement
    acceptTerms: false
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email) {
      setError('Please fill in all required fields')
      return
    }
    
    if (!formData.cardNumber || !formData.expiryDate || !formData.cvv) {
      setError('Please enter valid payment information')
      return
    }
    
    if (!formData.acceptTerms) {
      setError('Please accept the terms and conditions')
      return
    }
    
    setLoading(true)
    
    try {
      // In production, this would call your backend API to create a Stripe checkout session
      // For now, simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // TODO: Integrate with backend API
      // const response = await fetch('http://localhost:8005/api/subscriptions/create-checkout-session', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     plan: planParam,
      //     billing: billingParam,
      //     ...formData
      //   })
      // })
      
      // Simulate success
      navigate('/payment-success?plan=' + planParam)
      
    } catch (err) {
      setError('Payment processing failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Complete Your Subscription
            </h1>
            <p className="text-xl text-gray-600">
              Join thousands of users transforming their health journey
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Payment Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-xl p-8">
                
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                  </div>
                )}
                
                <form onSubmit={handleSubmit}>
                  
                  {/* Personal Information */}
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                      <span className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mr-3 text-sm font-bold">1</span>
                      Personal Information
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          First Name *
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Billing Address */}
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                      <span className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mr-3 text-sm font-bold">2</span>
                      Billing Address
                    </h2>
                    
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Street Address *
                        </label>
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            City *
                          </label>
                          <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            State *
                          </label>
                          <input
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            ZIP Code *
                          </label>
                          <input
                            type="text"
                            name="zipCode"
                            value={formData.zipCode}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Country *
                        </label>
                        <select
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          required
                        >
                          <option value="United States">United States</option>
                          <option value="Canada">Canada</option>
                          <option value="United Kingdom">United Kingdom</option>
                          <option value="Australia">Australia</option>
                          <option value="Germany">Germany</option>
                          <option value="France">France</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                      <span className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mr-3 text-sm font-bold">3</span>
                      Payment Information
                    </h2>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <div className="flex items-start">
                        <span className="text-2xl mr-3">🔒</span>
                        <div>
                          <p className="text-sm font-semibold text-blue-900 mb-1">Secure Payment</p>
                          <p className="text-xs text-blue-700">Your payment information is encrypted and secure. We use industry-standard SSL encryption.</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Card Number *
                        </label>
                        <input
                          type="text"
                          name="cardNumber"
                          value={formData.cardNumber}
                          onChange={handleInputChange}
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          required
                        />
                        <div className="flex items-center mt-2 space-x-2">
                          <img src="https://img.icons8.com/color/48/visa.png" alt="Visa" className="h-6" />
                          <img src="https://img.icons8.com/color/48/mastercard.png" alt="Mastercard" className="h-6" />
                          <img src="https://img.icons8.com/color/48/amex.png" alt="Amex" className="h-6" />
                          <img src="https://img.icons8.com/color/48/discover.png" alt="Discover" className="h-6" />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Cardholder Name *
                        </label>
                        <input
                          type="text"
                          name="cardName"
                          value={formData.cardName}
                          onChange={handleInputChange}
                          placeholder="John Doe"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Expiry Date *
                          </label>
                          <input
                            type="text"
                            name="expiryDate"
                            value={formData.expiryDate}
                            onChange={handleInputChange}
                            placeholder="MM/YY"
                            maxLength={5}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            CVV *
                          </label>
                          <input
                            type="text"
                            name="cvv"
                            value={formData.cvv}
                            onChange={handleInputChange}
                            placeholder="123"
                            maxLength={4}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Terms and Conditions */}
                  <div className="mb-8">
                    <label className="flex items-start cursor-pointer">
                      <input
                        type="checkbox"
                        name="acceptTerms"
                        checked={formData.acceptTerms}
                        onChange={handleInputChange}
                        className="mt-1 w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                        required
                      />
                      <span className="ml-3 text-sm text-gray-700">
                        I agree to the{' '}
                        <a href="/terms" className="text-emerald-600 hover:text-emerald-700 font-semibold">
                          Terms of Service
                        </a>{' '}
                        and{' '}
                        <a href="/privacy" className="text-emerald-600 hover:text-emerald-700 font-semibold">
                          Privacy Policy
                        </a>
                        . I understand that my subscription will automatically renew unless I cancel before the next billing date.
                      </span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-4 px-6 rounded-xl font-bold text-lg text-white transition-all ${
                      loading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Processing Payment...
                      </span>
                    ) : (
                      `Complete Payment - $${price.toFixed(2)}`
                    )}
                  </button>
                  
                  <p className="text-center text-sm text-gray-500 mt-4">
                    🔒 Secure checkout powered by Stripe
                  </p>
                  
                </form>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl p-8 sticky top-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>
                
                {/* Plan Details */}
                <div className={`bg-gradient-to-r from-${selectedPlan.color}-500 to-${selectedPlan.color}-600 rounded-xl p-6 mb-6 text-white`}>
                  <div className="text-4xl mb-3">{selectedPlan.icon}</div>
                  <h3 className="text-2xl font-bold mb-2">{selectedPlan.name} Plan</h3>
                  <p className="text-sm opacity-90 mb-4">
                    {isAnnual ? 'Annual Billing' : 'Monthly Billing'}
                  </p>
                  <div className="text-4xl font-bold">
                    ${price.toFixed(2)}
                    <span className="text-sm font-normal opacity-90">
                      /{isAnnual ? 'year' : 'month'}
                    </span>
                  </div>
                  {isAnnual && savings > 0 && (
                    <div className="mt-3 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 text-sm font-semibold">
                      Save {savings}% with annual billing
                    </div>
                  )}
                </div>

                {/* Features */}
                <div className="mb-6">
                  <h4 className="font-bold text-gray-900 mb-3">What's Included:</h4>
                  <ul className="space-y-2">
                    {selectedPlan.features.slice(0, 5).map((feature, index) => (
                      <li key={index} className="flex items-start text-sm text-gray-700">
                        <svg className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                    {selectedPlan.features.length > 5 && (
                      <li className="text-sm text-emerald-600 font-semibold ml-7">
                        + {selectedPlan.features.length - 5} more features
                      </li>
                    )}
                  </ul>
                </div>

                {/* Price Breakdown */}
                <div className="border-t border-gray-200 pt-6 mb-6">
                  <div className="flex justify-between text-gray-700 mb-3">
                    <span>Subtotal</span>
                    <span className="font-semibold">${price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700 mb-3">
                    <span>Tax</span>
                    <span className="font-semibold">$0.00</span>
                  </div>
                  {isAnnual && savings > 0 && (
                    <div className="flex justify-between text-emerald-600 mb-3">
                      <span>Annual Discount</span>
                      <span className="font-semibold">-${(selectedPlan.monthlyPrice * 12 - selectedPlan.annualPrice).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-gray-900 pt-3 border-t border-gray-200">
                    <span>Total</span>
                    <span>${price.toFixed(2)}</span>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-center">
                    <span className="text-lg mr-2">✅</span>
                    14-day money-back guarantee
                  </div>
                  <div className="flex items-center">
                    <span className="text-lg mr-2">🔒</span>
                    Secure SSL encrypted payment
                  </div>
                  <div className="flex items-center">
                    <span className="text-lg mr-2">❌</span>
                    Cancel anytime, no questions asked
                  </div>
                  <div className="flex items-center">
                    <span className="text-lg mr-2">📧</span>
                    Instant email confirmation
                  </div>
                </div>

                {/* Need Help */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-600 text-center mb-2">
                    Need help?
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/contact')}
                    className="w-full py-2 px-4 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Contact Support
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Security Footer */}
          <div className="mt-12 text-center">
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-emerald-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                PCI DSS Compliant
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-emerald-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                256-bit SSL Encryption
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-emerald-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                GDPR Compliant
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
