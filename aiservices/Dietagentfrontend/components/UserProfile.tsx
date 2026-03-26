import React, { useState, useEffect } from 'react'
import { apiClient, type UserProfile as UserProfileType } from '../api'

interface UserProfileProps {
  user?: UserProfileType | null
  onUserUpdate: (user: UserProfileType) => void
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onUserUpdate }) => {
  const [formData, setFormData] = useState<Partial<UserProfileType>>({
    user_id: '',
    age: 25,
    gender: 'male',
    height_cm: 170,
    weight_kg: 70,
    activity_level: 'moderate',
    goal: 'maintain',
    dietary_restrictions: [],
    allergies: []
  })

  const [bmiData, setBmiData] = useState<any>(null)
  const [tdeeData, setTdeeData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Populate form with existing user data
  useEffect(() => {
    if (user) {
      setFormData(user)
      calculateBMI()
      calculateTDEE()
    }
  }, [user])

  // Auto-calculate BMI and TDEE when relevant fields change
  useEffect(() => {
    if (formData.weight_kg && formData.height_cm) {
      calculateBMI()
    }
    if (formData.weight_kg && formData.height_cm && formData.age && formData.gender && formData.activity_level) {
      calculateTDEE()
    }
  }, [formData.weight_kg, formData.height_cm, formData.age, formData.gender, formData.activity_level])

  const calculateBMI = async () => {
    if (!formData.weight_kg || !formData.height_cm) return
    
    try {
      const response = await apiClient.calculateBMI({
        weight_kg: formData.weight_kg,
        height_cm: formData.height_cm
      })
      setBmiData(response)
    } catch (error) {
      console.error('Error calculating BMI:', error)
    }
  }

  const calculateTDEE = async () => {
    if (!formData.weight_kg || !formData.height_cm || !formData.age || !formData.gender || !formData.activity_level) return
    
    try {
      const response = await apiClient.calculateTDEE({
        weight_kg: formData.weight_kg,
        height_cm: formData.height_cm,
        age: formData.age,
        gender: formData.gender,
        activity_level: formData.activity_level
      })
      setTdeeData(response)
    } catch (error) {
      console.error('Error calculating TDEE:', error)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.user_id?.trim()) {
      newErrors.user_id = 'Name is required'
    }
    if (!formData.age || formData.age < 10 || formData.age > 120) {
      newErrors.age = 'Age must be between 10 and 120'
    }
    if (!formData.height_cm || formData.height_cm < 50 || formData.height_cm > 300) {
      newErrors.height_cm = 'Height must be between 50 and 300 cm'
    }
    if (!formData.weight_kg || formData.weight_kg < 20 || formData.weight_kg > 500) {
      newErrors.weight_kg = 'Weight must be between 20 and 500 kg'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      const userData = formData as UserProfileType
      onUserUpdate(userData)
    } catch (error) {
      console.error('Error saving user profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof UserProfileType, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleArrayInputChange = (field: 'dietary_restrictions' | 'allergies', value: string) => {
    if (!value.trim()) return
    
    const currentArray = formData[field] || []
    if (!currentArray.includes(value.trim())) {
      setFormData(prev => ({
        ...prev,
        [field]: [...currentArray, value.trim()]
      }))
    }
  }

  const removeArrayItem = (field: 'dietary_restrictions' | 'allergies', index: number) => {
    const currentArray = formData[field] || []
    setFormData(prev => ({
      ...prev,
      [field]: currentArray.filter((_, i) => i !== index)
    }))
  }

  const isEditing = !!user

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {isEditing ? '✏️ Update Your Profile' : '🌟 Welcome to Diet Agent'}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {isEditing 
              ? 'Update your information to get better personalized recommendations'
              : 'Tell us about yourself to get personalized nutrition analysis and recommendations'
            }
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">
                  👤 Basic Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      value={formData.user_id || ''}
                      onChange={(e) => handleInputChange('user_id', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.user_id ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your name"
                    />
                    {errors.user_id && <p className="text-red-500 text-sm mt-1">{errors.user_id}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Age *
                    </label>
                    <input
                      type="number"
                      value={formData.age || ''}
                      onChange={(e) => handleInputChange('age', parseInt(e.target.value))}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.age ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="25"
                      min="10"
                      max="120"
                    />
                    {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender *
                    </label>
                    <select
                      value={formData.gender || 'male'}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Height (cm) *
                    </label>
                    <input
                      type="number"
                      value={formData.height_cm || ''}
                      onChange={(e) => handleInputChange('height_cm', parseFloat(e.target.value))}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.height_cm ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="170"
                      min="50"
                      max="300"
                      step="0.1"
                    />
                    {errors.height_cm && <p className="text-red-500 text-sm mt-1">{errors.height_cm}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Weight (kg) *
                    </label>
                    <input
                      type="number"
                      value={formData.weight_kg || ''}
                      onChange={(e) => handleInputChange('weight_kg', parseFloat(e.target.value))}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.weight_kg ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="70"
                      min="20"
                      max="500"
                      step="0.1"
                    />
                    {errors.weight_kg && <p className="text-red-500 text-sm mt-1">{errors.weight_kg}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Activity Level *
                    </label>
                    <select
                      value={formData.activity_level || 'moderate'}
                      onChange={(e) => handleInputChange('activity_level', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="sedentary">Sedentary (office job)</option>
                      <option value="light">Light exercise (1-3 days/week)</option>
                      <option value="moderate">Moderate exercise (3-5 days/week)</option>
                      <option value="active">Very active (6-7 days/week)</option>
                      <option value="very_active">Extremely active (2x/day)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Goals */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">
                  🎯 Your Goals
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Goal *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { value: 'lose_weight', label: '📉 Lose Weight', color: 'bg-red-50 border-red-200 text-red-800' },
                      { value: 'maintain', label: '⚖️ Maintain Weight', color: 'bg-blue-50 border-blue-200 text-blue-800' },
                      { value: 'gain_weight', label: '📈 Gain Weight', color: 'bg-green-50 border-green-200 text-green-800' }
                    ].map((goal) => (
                      <label
                        key={goal.value}
                        className={`flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.goal === goal.value
                            ? goal.color
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <input
                          type="radio"
                          name="goal"
                          value={goal.value}
                          checked={formData.goal === goal.value}
                          onChange={(e) => handleInputChange('goal', e.target.value)}
                          className="sr-only"
                        />
                        <span className="text-sm font-medium">{goal.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dietary Preferences */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">
                  🥗 Dietary Preferences (Optional)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dietary Restrictions
                    </label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleArrayInputChange('dietary_restrictions', e.target.value)
                          e.target.value = ''
                        }
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select dietary restrictions</option>
                      <option value="vegetarian">Vegetarian</option>
                      <option value="vegan">Vegan</option>
                      <option value="gluten-free">Gluten-free</option>
                      <option value="dairy-free">Dairy-free</option>
                      <option value="keto">Keto</option>
                      <option value="paleo">Paleo</option>
                      <option value="low-carb">Low-carb</option>
                    </select>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(formData.dietary_restrictions || []).map((restriction, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full flex items-center gap-1"
                        >
                          {restriction}
                          <button
                            type="button"
                            onClick={() => removeArrayItem('dietary_restrictions', index)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Allergies
                    </label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleArrayInputChange('allergies', e.target.value)
                          e.target.value = ''
                        }
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select allergies</option>
                      <option value="nuts">Nuts</option>
                      <option value="dairy">Dairy</option>
                      <option value="eggs">Eggs</option>
                      <option value="soy">Soy</option>
                      <option value="shellfish">Shellfish</option>
                      <option value="fish">Fish</option>
                      <option value="wheat">Wheat</option>
                    </select>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(formData.allergies || []).map((allergy, index) => (
                        <span
                          key={index}
                          className="bg-red-100 text-red-800 text-sm px-3 py-1 rounded-full flex items-center gap-1"
                        >
                          {allergy}
                          <button
                            type="button"
                            onClick={() => removeArrayItem('allergies', index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    <span>{isEditing ? '✏️ Update Profile' : '🚀 Get Started'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Health Metrics Sidebar */}
          <div className="space-y-6">
            {/* BMI Card */}
            {bmiData && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 Your BMI</h3>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {bmiData.bmi.toFixed(1)}
                  </div>
                  <div className={`text-sm font-medium px-3 py-1 rounded-full inline-block ${
                    bmiData.category === 'Normal weight' ? 'bg-green-100 text-green-800' :
                    bmiData.category === 'Underweight' ? 'bg-blue-100 text-blue-800' :
                    bmiData.category === 'Overweight' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {bmiData.category}
                  </div>
                  <p className="text-gray-600 text-sm mt-3">
                    {bmiData.interpretation}
                  </p>
                </div>
              </div>
            )}

            {/* TDEE Card */}
            {tdeeData && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">🔥 Daily Calories</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">BMR (Base)</span>
                    <span className="font-semibold">{tdeeData.bmr.toFixed(0)} cal</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">TDEE (Total)</span>
                    <span className="font-semibold text-blue-600">{tdeeData.tdee.toFixed(0)} cal</span>
                  </div>
                  <hr className="my-3" />
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">To maintain</span>
                      <span className="text-sm">{tdeeData.calorie_goals.maintain.toFixed(0)} cal</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">To lose weight</span>
                      <span className="text-sm text-red-600">{tdeeData.calorie_goals.lose_weight.toFixed(0)} cal</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">To gain weight</span>
                      <span className="text-sm text-green-600">{tdeeData.calorie_goals.gain_weight.toFixed(0)} cal</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tips Card */}
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">💡 Quick Tips</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  Upload food images for instant nutrition analysis
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Track your daily water intake and meals
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  Get personalized meal recommendations
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2">•</span>
                  Monitor your progress over time
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserProfile
