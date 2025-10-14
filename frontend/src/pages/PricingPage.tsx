import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { Chatbot } from '../components/Chatbot'

export const PricingPage = () => {
  const navigate = useNavigate()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')

  const plans = [
    {
      name: 'Free',
      price: { monthly: 0, annual: 0 },
      description: 'Perfect for getting started with your health journey',
      icon: '🌱',
      color: 'from-gray-500 to-gray-600',
      features: [
        { text: 'Basic BMI/TDEE Calculator', included: true },
        { text: '3 meal analyses per month', included: true },
        { text: '1 active workout plan', included: true },
        { text: 'Health calendar (basic)', included: true },
        { text: 'AI chat (10 messages/month)', included: true },
        { text: 'Community access', included: true },
        { text: 'Advanced nutrition insights', included: false },
        { text: 'Unlimited meal analyses', included: false },
        { text: 'Progress tracking', included: false },
        { text: 'PDF report export', included: false }
      ],
      cta: 'Get Started Free',
      popular: false
    },
    {
      name: 'Premium',
      price: { monthly: 9.99, annual: 99 },
      description: 'Most popular for serious health enthusiasts',
      icon: '💎',
      color: 'from-emerald-500 to-teal-600',
      features: [
        { text: 'Everything in Free', included: true },
        { text: 'Unlimited meal analyses', included: true },
        { text: 'AI-powered meal planning', included: true },
        { text: 'Advanced nutrition insights', included: true },
        { text: 'Unlimited workout plans', included: true },
        { text: 'Progress tracking & analytics', included: true },
        { text: 'Unlimited AI chat', included: true },
        { text: 'Food scanning with YOLO AI', included: true },
        { text: 'Macros & micronutrients tracking', included: true },
        { text: 'Export PDF reports', included: true },
        { text: 'Priority support', included: true },
        { text: 'Ad-free experience', included: true }
      ],
      cta: 'Upgrade',
      popular: true
    },
    {
      name: 'Pro',
      price: { monthly: 19.99, annual: 199 },
      description: 'For fitness professionals and power users',
      icon: '🏆',
      color: 'from-purple-500 to-indigo-600',
      features: [
        { text: 'Everything in Premium', included: true },
        { text: 'Advanced AI health coaching', included: true },
        { text: 'Custom meal plan templates', included: true },
        { text: 'Fitness coach mode', included: true },
        { text: 'Advanced biometric tracking', included: true },
        { text: 'Wearables integration', included: true },
        { text: 'White-label reports', included: true },
        { text: 'API access', included: true },
        { text: 'Team collaboration (5 members)', included: true },
        { text: 'Priority video support', included: true },
        { text: 'Early access to features', included: true }
      ],
      cta: 'Upgrade',
      popular: false
    },
    {
      name: 'Enterprise',
      price: { monthly: 499, annual: 4990 },
      description: 'Custom solutions for organizations',
      icon: '🏢',
      color: 'from-blue-500 to-cyan-600',
      features: [
        { text: 'Everything in Pro', included: true },
        { text: 'Unlimited team members', included: true },
        { text: 'Admin dashboard & analytics', included: true },
        { text: 'Custom branding (white-label)', included: true },
        { text: 'SSO & advanced security', included: true },
        { text: 'Dedicated account manager', included: true },
        { text: 'Custom integrations', included: true },
        { text: 'On-premise deployment', included: true },
        { text: '99.9% SLA guarantee', included: true },
        { text: 'Employee wellness programs', included: true },
        { text: 'Bulk user management', included: true }
      ],
      cta: 'Upgrade',
      popular: false
    }
  ]

  const handlePlanSelect = (planName: string) => {
    if (planName === 'Free') {
      navigate('/home')
    } else if (planName === 'Enterprise') {
      navigate('/contact')
    } else {
      // For Premium and Pro plans - redirect to checkout page
      navigate(`/checkout?plan=${planName.toLowerCase()}&billing=${billingCycle}`)
    }
  }

  const calculateSavings = (monthly: number, annual: number) => {
    if (annual === 0) return 0
    const monthlyCost = monthly * 12
    const savings = monthlyCost - annual
    return Math.round((savings / monthlyCost) * 100)
  }

  return (
    <>
      <Navbar />
      <Chatbot />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 py-20">
          <div className="absolute inset-0 bg-black/5"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Choose Your Health Plan
            </h1>
            <p className="text-xl md:text-2xl text-emerald-50 max-w-3xl mx-auto mb-8">
              Start free, upgrade when ready. All plans include 14-day money-back guarantee.
            </p>
            
            {/* Billing Cycle Toggle */}
            <div className="inline-flex items-center bg-white/20 backdrop-blur-md rounded-full p-1 mb-8">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-3 rounded-full font-semibold transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-emerald-600 shadow-lg'
                    : 'text-white hover:text-emerald-50'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-6 py-3 rounded-full font-semibold transition-all ${
                  billingCycle === 'annual'
                    ? 'bg-white text-emerald-600 shadow-lg'
                    : 'text-white hover:text-emerald-50'
                }`}
              >
                Annual
                <span className="ml-2 px-2 py-1 bg-yellow-400 text-yellow-900 text-xs rounded-full font-bold">
                  Save 17%
                </span>
              </button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-6 text-white/90">
              <div className="flex items-center gap-2">
                <span className="text-2xl">✓</span>
                <span className="text-sm font-medium">14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">✓</span>
                <span className="text-sm font-medium">No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">✓</span>
                <span className="text-sm font-medium">Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:scale-105 ${
                  plan.popular ? 'ring-4 ring-emerald-500 lg:scale-105' : ''
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-1 text-sm font-bold rounded-bl-lg">
                    MOST POPULAR
                  </div>
                )}

                {/* Card Header */}
                <div className={`bg-gradient-to-r ${plan.color} p-8 text-white`}>
                  <div className="text-5xl mb-4">{plan.icon}</div>
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-sm opacity-90 mb-6">{plan.description}</p>
                  
                  <div className="flex items-baseline mb-2">
                    <span className="text-5xl font-bold">
                      ${billingCycle === 'monthly' ? plan.price.monthly : Math.round(plan.price.annual / 12)}
                    </span>
                    <span className="text-xl ml-2 opacity-80">/mo</span>
                  </div>
                  
                  {billingCycle === 'annual' && plan.price.annual > 0 && (
                    <div className="text-sm opacity-90">
                      ${plan.price.annual}/year
                      {calculateSavings(plan.price.monthly, plan.price.annual) > 0 && (
                        <span className="ml-2 px-2 py-1 bg-white/20 rounded-full text-xs font-bold">
                          Save {calculateSavings(plan.price.monthly, plan.price.annual)}%
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-8">
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <span className={`mr-3 text-xl flex-shrink-0 ${
                          feature.included ? 'text-emerald-500' : 'text-gray-300'
                        }`}>
                          {feature.included ? '✓' : '—'}
                        </span>
                        <span className={`text-sm ${
                          feature.included ? 'text-gray-700' : 'text-gray-400'
                        }`}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handlePlanSelect(plan.name)}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                      plan.popular
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features Comparison Table */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Detailed Feature Comparison
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that fits your needs
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Feature</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-900">Free</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-emerald-600">Premium</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-purple-600">Pro</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-blue-600">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-700">Meal Analyses</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">3/month</td>
                    <td className="px-6 py-4 text-center text-sm text-emerald-600 font-semibold">Unlimited</td>
                    <td className="px-6 py-4 text-center text-sm text-purple-600 font-semibold">Unlimited</td>
                    <td className="px-6 py-4 text-center text-sm text-blue-600 font-semibold">Unlimited</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-700">AI Chat Messages</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">10/month</td>
                    <td className="px-6 py-4 text-center text-sm text-emerald-600 font-semibold">Unlimited</td>
                    <td className="px-6 py-4 text-center text-sm text-purple-600 font-semibold">Unlimited</td>
                    <td className="px-6 py-4 text-center text-sm text-blue-600 font-semibold">Unlimited</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-700">Active Workout Plans</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">1</td>
                    <td className="px-6 py-4 text-center text-sm text-emerald-600 font-semibold">Unlimited</td>
                    <td className="px-6 py-4 text-center text-sm text-purple-600 font-semibold">Unlimited</td>
                    <td className="px-6 py-4 text-center text-sm text-blue-600 font-semibold">Unlimited</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-700">Food Scanning (YOLO AI)</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-400">—</td>
                    <td className="px-6 py-4 text-center text-sm text-emerald-600">✓</td>
                    <td className="px-6 py-4 text-center text-sm text-purple-600">✓</td>
                    <td className="px-6 py-4 text-center text-sm text-blue-600">✓</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-700">PDF Report Export</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-400">—</td>
                    <td className="px-6 py-4 text-center text-sm text-emerald-600">✓</td>
                    <td className="px-6 py-4 text-center text-sm text-purple-600">✓</td>
                    <td className="px-6 py-4 text-center text-sm text-blue-600">✓</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-700">Wearables Integration</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-400">—</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-400">—</td>
                    <td className="px-6 py-4 text-center text-sm text-purple-600">✓</td>
                    <td className="px-6 py-4 text-center text-sm text-blue-600">✓</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-700">API Access</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-400">—</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-400">—</td>
                    <td className="px-6 py-4 text-center text-sm text-purple-600">✓</td>
                    <td className="px-6 py-4 text-center text-sm text-blue-600">✓</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-700">Team Members</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">1</td>
                    <td className="px-6 py-4 text-center text-sm text-emerald-600">1</td>
                    <td className="px-6 py-4 text-center text-sm text-purple-600">5</td>
                    <td className="px-6 py-4 text-center text-sm text-blue-600 font-semibold">Unlimited</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-700">Custom Branding</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-400">—</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-400">—</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-400">—</td>
                    <td className="px-6 py-4 text-center text-sm text-blue-600">✓</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-700">Support Level</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">Community</td>
                    <td className="px-6 py-4 text-center text-sm text-emerald-600">Priority Email</td>
                    <td className="px-6 py-4 text-center text-sm text-purple-600">Video Call</td>
                    <td className="px-6 py-4 text-center text-sm text-blue-600">Dedicated Manager</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-6">
            {[
              {
                q: 'Can I start with the free plan and upgrade later?',
                a: 'Absolutely! Start with the free plan and upgrade anytime. Your data and progress will be preserved.'
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit cards (Visa, Mastercard, Amex), PayPal, and bank transfers for enterprise plans.'
              },
              {
                q: 'Is there a free trial for paid plans?',
                a: 'Yes! Get a 14-day free trial on Premium and Pro plans. No credit card required to start.'
              },
              {
                q: 'Can I cancel my subscription anytime?',
                a: 'Yes, you can cancel anytime from your account settings. No questions asked, no cancellation fees.'
              },
              {
                q: 'Do you offer refunds?',
                a: 'Yes! We offer a 14-day money-back guarantee on all paid plans. Not satisfied? Get a full refund.'
              },
              {
                q: 'What happens to my data if I downgrade?',
                a: 'Your data is never deleted. You\'ll keep access to all historical data, but some premium features will be limited.'
              }
            ].map((faq, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Transform Your Health?
            </h2>
            <p className="text-xl text-emerald-50 mb-8">
              Join thousands of users already achieving their wellness goals
            </p>
            <button
              onClick={() => navigate('/register')}
              className="bg-white text-emerald-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-emerald-50 transition-colors shadow-xl"
            >
              Start Free Today →
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
