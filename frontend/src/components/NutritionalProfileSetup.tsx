import React, { useState } from 'react';
import { User, Scale, Heart, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';

export interface NutritionalProfileData {
  // Basic Info (Step 1)
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number; // cm
  weight: number; // kg
  
  // Health & Goals (Step 2)
  allergies: string[];
  dietaryRestrictions: string[];
  fitnessGoal: 'weight_loss' | 'weight_gain' | 'maintenance' | 'muscle_gain';
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';
}

interface NutritionalProfileSetupProps {
  onProfileComplete: (profileData: NutritionalProfileData) => void;
  onBack: () => void;
}

export const NutritionalProfileSetup: React.FC<NutritionalProfileSetupProps> = ({
  onProfileComplete,
  onBack
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<string[]>([]);
  const [profileData, setProfileData] = useState<NutritionalProfileData>({
    name: '',
    age: 25,
    gender: 'other',
    height: 170,
    weight: 70,
    allergies: [],
    dietaryRestrictions: [],
    fitnessGoal: 'maintenance',
    activityLevel: 'moderately_active'
  });

  // Validation limits
  const VALIDATION_LIMITS = {
    name: { min: 2, max: 50 },
    age: { min: 13, max: 120 },
    height: { min: 100, max: 250 },
    weight: { min: 30, max: 300 },
    allergies: { max: 5 },
    dietaryRestrictions: { max: 3 }
  };

  // Options
  const commonAllergies = [
    'Peanuts', 'Tree nuts', 'Shellfish', 'Fish', 'Eggs', 'Milk', 'Soy', 'Wheat/Gluten'
  ];

  const dietaryOptions = [
    'Vegetarian', 'Vegan', 'Pescatarian', 'Keto', 'Low Carb', 'Gluten Free', 'Dairy Free', 'Halal'
  ];

  const validateStep = (step: number): boolean => {
    const newErrors: string[] = [];

    if (step === 1) {
      // Name validation
      if (!profileData.name.trim()) {
        newErrors.push('Name is required');
      } else if (profileData.name.length < VALIDATION_LIMITS.name.min) {
        newErrors.push(`Name must be at least ${VALIDATION_LIMITS.name.min} characters`);
      } else if (profileData.name.length > VALIDATION_LIMITS.name.max) {
        newErrors.push(`Name must not exceed ${VALIDATION_LIMITS.name.max} characters`);
      }

      // Age validation
      if (profileData.age < VALIDATION_LIMITS.age.min || profileData.age > VALIDATION_LIMITS.age.max) {
        newErrors.push(`Age must be between ${VALIDATION_LIMITS.age.min} and ${VALIDATION_LIMITS.age.max}`);
      }

      // Height validation
      if (profileData.height < VALIDATION_LIMITS.height.min || profileData.height > VALIDATION_LIMITS.height.max) {
        newErrors.push(`Height must be between ${VALIDATION_LIMITS.height.min}cm and ${VALIDATION_LIMITS.height.max}cm`);
      }

      // Weight validation
      if (profileData.weight < VALIDATION_LIMITS.weight.min || profileData.weight > VALIDATION_LIMITS.weight.max) {
        newErrors.push(`Weight must be between ${VALIDATION_LIMITS.weight.min}kg and ${VALIDATION_LIMITS.weight.max}kg`);
      }
    }

    if (step === 2) {
      // Allergies validation
      if (profileData.allergies.length > VALIDATION_LIMITS.allergies.max) {
        newErrors.push(`Please select no more than ${VALIDATION_LIMITS.allergies.max} allergies`);
      }

      // Dietary restrictions validation
      if (profileData.dietaryRestrictions.length > VALIDATION_LIMITS.dietaryRestrictions.max) {
        newErrors.push(`Please select no more than ${VALIDATION_LIMITS.dietaryRestrictions.max} dietary restrictions`);
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const updateField = (field: keyof NutritionalProfileData, value: string | number | string[]) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    setErrors([]); // Clear errors when user starts typing
  };

  const updateArrayField = (field: keyof NutritionalProfileData, item: string, add: boolean) => {
    const currentArray = profileData[field] as string[];
    const limit = field === 'allergies' ? VALIDATION_LIMITS.allergies.max : VALIDATION_LIMITS.dietaryRestrictions.max;
    
    if (add && currentArray.length >= limit) {
      setErrors([`Maximum ${limit} ${field} allowed`]);
      return;
    }

    setProfileData(prev => ({
      ...prev,
      [field]: add 
        ? [...currentArray, item]
        : currentArray.filter(i => i !== item)
    }));
    setErrors([]);
  };

  const calculateBMI = () => {
    const heightInM = profileData.height / 100;
    return (profileData.weight / (heightInM * heightInM)).toFixed(1);
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { category: 'Underweight', color: 'text-blue-600' };
    if (bmi < 25) return { category: 'Normal', color: 'text-green-600' };
    if (bmi < 30) return { category: 'Overweight', color: 'text-yellow-600' };
    return { category: 'Obese', color: 'text-red-600' };
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 2) {
        setCurrentStep(currentStep + 1);
      } else {
        onProfileComplete(profileData);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  const renderErrors = () => {
    if (errors.length === 0) return null;
    
    return (
      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center mb-2">
          <div className="h-5 w-5 text-red-500 mr-2">⚠️</div>
          <h4 className="text-red-800 font-medium">Please fix the following issues:</h4>
        </div>
        <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
          {errors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      </div>
    );
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
          <User className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Basic Information</h2>
        <p className="text-gray-600">Tell us about yourself to get personalized nutrition advice</p>
      </div>

      {renderErrors()}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            value={profileData.name}
            onChange={(e) => updateField('name', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="Enter your full name"
            maxLength={VALIDATION_LIMITS.name.max}
          />
          <p className="text-xs text-gray-500 mt-1">
            {profileData.name.length}/{VALIDATION_LIMITS.name.max} characters
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Age *
          </label>
          <input
            type="number"
            value={profileData.age}
            onChange={(e) => updateField('age', parseInt(e.target.value) || 0)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            min={VALIDATION_LIMITS.age.min}
            max={VALIDATION_LIMITS.age.max}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gender
          </label>
          <select
            value={profileData.gender}
            onChange={(e) => updateField('gender', e.target.value as 'male' | 'female' | 'other')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other/Prefer not to say</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Height (cm) *
          </label>
          <input
            type="number"
            value={profileData.height}
            onChange={(e) => updateField('height', parseInt(e.target.value) || 0)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            min={VALIDATION_LIMITS.height.min}
            max={VALIDATION_LIMITS.height.max}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Weight (kg) *
          </label>
          <input
            type="number"
            value={profileData.weight}
            onChange={(e) => updateField('weight', parseInt(e.target.value) || 0)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            min={VALIDATION_LIMITS.weight.min}
            max={VALIDATION_LIMITS.weight.max}
            step="0.1"
          />
        </div>

        <div className="md:col-span-2 bg-emerald-50 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <Scale className="h-5 w-5 text-emerald-600 mr-2" />
            <span className="font-medium text-gray-900">BMI Calculation</span>
          </div>
          {profileData.height > 0 && profileData.weight > 0 && (
            <div className="flex items-center space-x-4">
              <span className="text-2xl font-bold text-emerald-600">
                {calculateBMI()}
              </span>
              <span className={`font-medium ${getBMICategory(parseFloat(calculateBMI())).color}`}>
                {getBMICategory(parseFloat(calculateBMI())).category}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
          <Heart className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Health & Goals</h2>
        <p className="text-gray-600">Help us customize your nutrition recommendations</p>
      </div>

      {renderErrors()}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Food Allergies (max {VALIDATION_LIMITS.allergies.max})
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {commonAllergies.map((allergy) => (
              <label key={allergy} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profileData.allergies.includes(allergy)}
                  onChange={(e) => updateArrayField('allergies', allergy, e.target.checked)}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  disabled={!profileData.allergies.includes(allergy) && profileData.allergies.length >= VALIDATION_LIMITS.allergies.max}
                />
                <span className="text-sm text-gray-700">{allergy}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Selected: {profileData.allergies.length}/{VALIDATION_LIMITS.allergies.max}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Dietary Preferences (max {VALIDATION_LIMITS.dietaryRestrictions.max})
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {dietaryOptions.map((diet) => (
              <label key={diet} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profileData.dietaryRestrictions.includes(diet)}
                  onChange={(e) => updateArrayField('dietaryRestrictions', diet, e.target.checked)}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  disabled={!profileData.dietaryRestrictions.includes(diet) && profileData.dietaryRestrictions.length >= VALIDATION_LIMITS.dietaryRestrictions.max}
                />
                <span className="text-sm text-gray-700">{diet}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Selected: {profileData.dietaryRestrictions.length}/{VALIDATION_LIMITS.dietaryRestrictions.max}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fitness Goal
            </label>
            <select
              value={profileData.fitnessGoal}
              onChange={(e) => updateField('fitnessGoal', e.target.value as 'weight_loss' | 'weight_gain' | 'maintenance' | 'muscle_gain')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="weight_loss">Weight Loss</option>
              <option value="weight_gain">Weight Gain</option>
              <option value="maintenance">Maintain Weight</option>
              <option value="muscle_gain">Build Muscle</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Activity Level
            </label>
            <select
              value={profileData.activityLevel}
              onChange={(e) => updateField('activityLevel', e.target.value as 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="sedentary">Sedentary (Little/no exercise)</option>
              <option value="lightly_active">Lightly Active (Light exercise 1-3 days/week)</option>
              <option value="moderately_active">Moderately Active (Moderate exercise 3-5 days/week)</option>
              <option value="very_active">Very Active (Hard exercise 6-7 days/week)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Progress bar */}
          <div className="bg-emerald-600 px-8 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-white">Nutritional Profile Setup</h1>
              <div className="text-white text-sm">
                Step {currentStep} of 2
              </div>
            </div>
            <div className="mt-4 bg-emerald-500 rounded-full h-2">
              <div
                className="bg-white rounded-full h-2 transition-all duration-300"
                style={{ width: `${(currentStep / 2) * 100}%` }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
          </div>

          {/* Actions */}
          <div className="bg-gray-50 px-8 py-6 flex justify-between">
            <button
              onClick={handleBack}
              className="flex items-center px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              {currentStep === 1 ? 'Cancel' : 'Back'}
            </button>

            <button
              onClick={handleNext}
              className="flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors duration-200 font-medium"
            >
              {currentStep === 2 ? (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Complete Profile
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NutritionalProfileSetup;
