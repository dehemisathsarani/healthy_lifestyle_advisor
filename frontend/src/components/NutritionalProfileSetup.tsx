import React, { useState } from 'react'
import { ArrowLeft, Save, User, Target, Activity, Heart } from 'lucide-react'

export interface NutritionalProfileData {
  name: string
  age: number
  gender: 'male' | 'female' | 'other'
  height: number // cm
  weight: number // kg
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active'
  fitnessGoal: 'weight_loss' | 'weight_gain' | 'muscle_gain' | 'maintenance'
  allergies: string[]
  dietaryRestrictions: string[]
  medicalConditions?: string[]
  targetCalories?: number
  targetProtein?: number
  targetCarbs?: number
  targetFat?: number
}

interface NutritionalProfileSetupProps {
  onProfileComplete: (profile: NutritionalProfileData) => void
  onBack: () => void
  initialData?: Partial<NutritionalProfileData>
}

const NutritionalProfileSetup: React.FC<NutritionalProfileSetupProps> = ({
  onProfileComplete,
  onBack,
  initialData
}) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<NutritionalProfileData>({
    name: initialData?.name || '',
    age: initialData?.age || 25,
    gender: initialData?.gender || 'male',
    height: initialData?.height || 170,
    weight: initialData?.weight || 70,
    activityLevel: initialData?.activityLevel || 'moderately_active',
    fitnessGoal: initialData?.fitnessGoal || 'maintenance',
    allergies: initialData?.allergies || [],
    dietaryRestrictions: initialData?.dietaryRestrictions || [],
    medicalConditions: initialData?.medicalConditions || []
  })

  const [newAllergy, setNewAllergy] = useState('')
  const [newDietaryRestriction, setNewDietaryRestriction] = useState('')

  const handleInputChange = (field: keyof NutritionalProfileData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addAllergy = () => {
    if (newAllergy.trim()) {
      setFormData(prev => ({
        ...prev,
        allergies: [...prev.allergies, newAllergy.trim()]
      }))
      setNewAllergy('')
    }
  }

  const removeAllergy = (index: number) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index)
    }))
  }

  const addDietaryRestriction = () => {
    if (newDietaryRestriction.trim()) {
      setFormData(prev => ({
        ...prev,
        dietaryRestrictions: [...prev.dietaryRestrictions, newDietaryRestriction.trim()]
      }))
      setNewDietaryRestriction('')
    }
  }

  const removeDietaryRestriction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.filter((_, i) => i !== index)
    }))
  }

  const calculateTargetNutrition = () => {
    const { weight, height, age, gender, activityLevel, fitnessGoal } = formData
    
    // Calculate BMR using Harris-Benedict equation
    let bmr: number
    if (gender === 'male') {
      bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age)
    } else {
      bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age)
    }

    // Activity multipliers
    const activityMultipliers = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725,
      extremely_active: 1.9
    }

    let targetCalories = bmr * activityMultipliers[activityLevel]

    // Adjust for fitness goals
    switch (fitnessGoal) {
      case 'weight_loss':
        targetCalories -= 500 // 1 lb per week deficit
        break
      case 'weight_gain':
        targetCalories += 500 // 1 lb per week surplus
        break
      case 'muscle_gain':
        targetCalories += 300 // Moderate surplus
        break
      // maintenance: no change
    }

    // Calculate macro targets (example ratios)
    const targetProtein = weight * (fitnessGoal === 'muscle_gain' ? 2.2 : 1.6) // g per kg body weight
    const targetFat = targetCalories * 0.25 / 9 // 25% of calories from fat
    const targetCarbs = (targetCalories - (targetProtein * 4) - (targetFat * 9)) / 4

    return {
      targetCalories: Math.round(targetCalories),
      targetProtein: Math.round(targetProtein),
      targetCarbs: Math.round(targetCarbs),
      targetFat: Math.round(targetFat)
    }
  }

  const handleSubmit = () => {
    const targets = calculateTargetNutrition()
    const completeProfile = { ...formData, ...targets }
    onProfileComplete(completeProfile)
  }

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4))
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1))

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <User className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Basic Information</h2>
        <p className="text-gray-600">Let's start with your basic details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="Enter your name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Age
          </label>
          <input
            type="number"
            value={formData.age}
            onChange={(e) => handleInputChange('age', parseInt(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            min="1"
            max="120"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gender
          </label>
          <select
            value={formData.gender}
            onChange={(e) => handleInputChange('gender', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Height (cm)
          </label>
          <input
            type="number"
            value={formData.height}
            onChange={(e) => handleInputChange('height', parseInt(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            min="100"
            max="250"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Weight (kg)
          </label>
          <input
            type="number"
            value={formData.weight}
            onChange={(e) => handleInputChange('weight', parseInt(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            min="30"
            max="300"
          />
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Activity className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Activity & Goals</h2>
        <p className="text-gray-600">Tell us about your lifestyle and fitness goals</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Activity Level
          </label>
          <div className="grid grid-cols-1 gap-3">
            {[
              { value: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise' },
              { value: 'lightly_active', label: 'Lightly Active', desc: 'Light exercise 1-3 days/week' },
              { value: 'moderately_active', label: 'Moderately Active', desc: 'Moderate exercise 3-5 days/week' },
              { value: 'very_active', label: 'Very Active', desc: 'Hard exercise 6-7 days/week' },
              { value: 'extremely_active', label: 'Extremely Active', desc: 'Very hard exercise, 2x/day' }
            ].map((option) => (
              <label key={option.value} className="flex items-center p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="activityLevel"
                  value={option.value}
                  checked={formData.activityLevel === option.value}
                  onChange={(e) => handleInputChange('activityLevel', e.target.value)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium text-gray-900">{option.label}</div>
                  <div className="text-sm text-gray-600">{option.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Fitness Goal
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { value: 'weight_loss', label: 'Weight Loss', desc: 'Lose body fat', icon: '📉' },
              { value: 'weight_gain', label: 'Weight Gain', desc: 'Gain healthy weight', icon: '📈' },
              { value: 'muscle_gain', label: 'Muscle Gain', desc: 'Build muscle mass', icon: '💪' },
              { value: 'maintenance', label: 'Maintenance', desc: 'Maintain current weight', icon: '⚖️' }
            ].map((option) => (
              <label key={option.value} className="flex items-center p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="fitnessGoal"
                  value={option.value}
                  checked={formData.fitnessGoal === option.value}
                  onChange={(e) => handleInputChange('fitnessGoal', e.target.value)}
                  className="mr-3"
                />
                <div className="mr-3 text-2xl">{option.icon}</div>
                <div>
                  <div className="font-medium text-gray-900">{option.label}</div>
                  <div className="text-sm text-gray-600">{option.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => {
    // Common allergies options
    const commonAllergies = [
      'Peanuts', 'Tree Nuts', 'Dairy', 'Eggs', 'Soy', 'Wheat/Gluten', 
      'Fish', 'Shellfish', 'Sesame', 'None'
    ]
    
    // Common dietary restrictions
    const commonRestrictions = [
      'Vegetarian', 'Vegan', 'Pescatarian', 'Halal', 'Kosher',
      'Gluten-Free', 'Dairy-Free', 'Low Carb', 'Keto', 'None'
    ]

    const toggleAllergy = (allergy: string) => {
      if (allergy === 'None') {
        setFormData({ ...formData, allergies: [] })
        return
      }
      
      if (formData.allergies.includes(allergy)) {
        setFormData({
          ...formData,
          allergies: formData.allergies.filter(a => a !== allergy)
        })
      } else {
        setFormData({
          ...formData,
          allergies: [...formData.allergies, allergy]
        })
      }
    }

    const toggleRestriction = (restriction: string) => {
      if (restriction === 'None') {
        setFormData({ ...formData, dietaryRestrictions: [] })
        return
      }
      
      if (formData.dietaryRestrictions.includes(restriction)) {
        setFormData({
          ...formData,
          dietaryRestrictions: formData.dietaryRestrictions.filter(r => r !== restriction)
        })
      } else {
        setFormData({
          ...formData,
          dietaryRestrictions: [...formData.dietaryRestrictions, restriction]
        })
      }
    }

    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <Heart className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Health & Preferences</h2>
          <p className="text-gray-600">Help us personalize your nutrition recommendations</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Food Allergies
            </label>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {commonAllergies.map((allergy) => (
                <label
                  key={allergy}
                  className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.allergies.includes(allergy)
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-red-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.allergies.includes(allergy)}
                    onChange={() => toggleAllergy(allergy)}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    {allergy}
                  </span>
                </label>
              ))}
            </div>
            
            {/* Custom allergy input */}
            <div className="flex space-x-2 mt-4">
              <input
                type="text"
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addAllergy()}
                placeholder="Add custom allergy"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={addAllergy}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Add
              </button>
            </div>
            
            {/* Display selected allergies */}
            {formData.allergies.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.allergies.map((allergy, index) => (
                  <span
                    key={index}
                    className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm flex items-center"
                  >
                    {allergy}
                    <button
                      onClick={() => removeAllergy(index)}
                      className="ml-2 text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Dietary Restrictions
            </label>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {commonRestrictions.map((restriction) => (
                <label
                  key={restriction}
                  className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.dietaryRestrictions.includes(restriction)
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.dietaryRestrictions.includes(restriction)}
                    onChange={() => toggleRestriction(restriction)}
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    {restriction}
                  </span>
                </label>
              ))}
            </div>
            
            {/* Custom restriction input */}
            <div className="flex space-x-2 mt-4">
              <input
                type="text"
                value={newDietaryRestriction}
                onChange={(e) => setNewDietaryRestriction(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addDietaryRestriction()}
                placeholder="Add custom dietary restriction"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={addDietaryRestriction}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Add
              </button>
            </div>
            
            {/* Display selected restrictions */}
            {formData.dietaryRestrictions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.dietaryRestrictions.map((restriction, index) => (
                  <span
                    key={index}
                    className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm flex items-center"
                  >
                    {restriction}
                    <button
                      onClick={() => removeDietaryRestriction(index)}
                      className="ml-2 text-emerald-600 hover:text-emerald-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderStep4 = () => {
    const targets = calculateTargetNutrition()
    const bmi = formData.weight / ((formData.height / 100) ** 2)
    
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <Target className="w-16 h-16 text-purple-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Review & Confirm</h2>
          <p className="text-gray-600">Review your profile and calculated targets</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-6 rounded-xl">
            <h3 className="font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="space-y-2 text-sm">
              <div><strong>Name:</strong> {formData.name}</div>
              <div><strong>Age:</strong> {formData.age} years</div>
              <div><strong>Gender:</strong> {formData.gender}</div>
              <div><strong>Height:</strong> {formData.height} cm</div>
              <div><strong>Weight:</strong> {formData.weight} kg</div>
              <div><strong>BMI:</strong> {bmi.toFixed(1)}</div>
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-xl">
            <h3 className="font-semibold text-gray-900 mb-4">Calculated Targets</h3>
            <div className="space-y-2 text-sm">
              <div><strong>Daily Calories:</strong> {targets.targetCalories}</div>
              <div><strong>Protein:</strong> {targets.targetProtein}g</div>
              <div><strong>Carbohydrates:</strong> {targets.targetCarbs}g</div>
              <div><strong>Fat:</strong> {targets.targetFat}g</div>
              <div><strong>Activity:</strong> {formData.activityLevel.replace('_', ' ')}</div>
              <div><strong>Goal:</strong> {formData.fitnessGoal.replace('_', ' ')}</div>
            </div>
          </div>
        </div>

        {(formData.allergies.length > 0 || formData.dietaryRestrictions.length > 0) && (
          <div className="bg-yellow-50 p-6 rounded-xl">
            <h3 className="font-semibold text-gray-900 mb-4">Dietary Considerations</h3>
            {formData.allergies.length > 0 && (
              <div className="mb-3">
                <strong className="text-sm">Allergies:</strong>
                <div className="flex flex-wrap gap-1 mt-1">
                  {formData.allergies.map((allergy, index) => (
                    <span key={index} className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                      {allergy}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {formData.dietaryRestrictions.length > 0 && (
              <div>
                <strong className="text-sm">Dietary Restrictions:</strong>
                <div className="flex flex-wrap gap-1 mt-1">
                  {formData.dietaryRestrictions.map((restriction, index) => (
                    <span key={index} className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">
                      {restriction}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-4xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          
          <div className="flex space-x-2">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`w-3 h-3 rounded-full ${
                  step === currentStep
                    ? 'bg-emerald-600'
                    : step < currentStep
                    ? 'bg-emerald-400'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="min-h-[400px]">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-6 py-3 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {currentStep < 4 ? (
            <button
              onClick={nextStep}
              disabled={!formData.name || !formData.age}
              className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <span>Next</span>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Complete Setup</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default NutritionalProfileSetup