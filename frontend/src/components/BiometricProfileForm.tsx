import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Alert, AlertDescription } from './ui';
import { Loader2, User, Target, Calculator } from 'lucide-react';
import { biometricApi, BiometricProfile } from '../services/biometricApi';

interface BiometricProfileFormProps {
  onProfileCreated?: (profile: BiometricProfile) => void;
  existingProfile?: BiometricProfile | null;
}

export const BiometricProfileForm: React.FC<BiometricProfileFormProps> = ({
  onProfileCreated,
  existingProfile
}) => {
  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    height: '',
    weight: '',
    activity_level: '',
    fitness_goal: '',
    exercise_calories_per_day: '0'
  });

  const [calculations, setCalculations] = useState<{
    bmi?: number;
    bmr?: number;
    tdee?: number;
    hydration_goal?: number;
    macro_goals?: any;
  }>({});

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load existing profile data if available
  useEffect(() => {
    if (existingProfile) {
      setFormData({
        age: existingProfile.age?.toString() || '',
        gender: existingProfile.gender || '',
        height: existingProfile.height?.toString() || '',
        weight: existingProfile.weight?.toString() || '',
        activity_level: existingProfile.activity_level || '',
        fitness_goal: existingProfile.fitness_goal || '',
        exercise_calories_per_day: existingProfile.exercise_calories_per_day?.toString() || '0'
      });
    }
  }, [existingProfile]);

  // Real-time calculations as user types
  useEffect(() => {
    const calculateMetrics = async () => {
      const { height, weight, age, gender, activity_level, fitness_goal, exercise_calories_per_day } = formData;
      
      if (height && weight && age && gender && activity_level) {
        try {
          // Calculate BMI
          const bmiResult = await biometricApi.calculateBMI(
            parseFloat(height), 
            parseFloat(weight)
          );
          
          // Calculate BMR
          const bmrResult = await biometricApi.calculateBMR(
            parseFloat(weight),
            parseFloat(height),
            parseInt(age),
            gender
          );

          // Calculate TDEE
          const tdeeResult = await biometricApi.calculateTDEE(
            bmrResult.bmr,
            activity_level,
            parseFloat(exercise_calories_per_day) || 0
          );

          // Calculate hydration goal
          const hydrationResult = await biometricApi.calculateHydrationGoal(
            parseFloat(weight),
            activity_level
          );

          // Calculate macro goals
          let calorieGoal = tdeeResult.tdee;
          if (fitness_goal === 'weight_loss') {
            calorieGoal = tdeeResult.tdee - 500;
          } else if (fitness_goal === 'weight_gain') {
            calorieGoal = tdeeResult.tdee + 500;
          }

          let macroResult = null;
          if (fitness_goal) {
            macroResult = await biometricApi.calculateMacroGoals(
              calorieGoal,
              fitness_goal,
              parseFloat(weight)
            );
          }

          setCalculations({
            bmi: bmiResult.bmi,
            bmr: bmrResult.bmr,
            tdee: tdeeResult.tdee,
            hydration_goal: hydrationResult.daily_hydration_goal_ml,
            macro_goals: macroResult?.macro_goals
          });
        } catch (error) {
          console.error('Error calculating metrics:', error);
        }
      }
    };

    const debounceTimer = setTimeout(calculateMetrics, 500);
    return () => clearTimeout(debounceTimer);
  }, [formData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const profileData = {
        age: parseInt(formData.age),
        gender: formData.gender as 'male' | 'female',
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight),
        activity_level: formData.activity_level as any,
        fitness_goal: formData.fitness_goal as any,
        exercise_calories_per_day: parseFloat(formData.exercise_calories_per_day) || 0
      };

      let result;
      if (existingProfile) {
        result = await biometricApi.updateBiometricProfile(profileData);
        setSuccess('Biometric profile updated successfully!');
      } else {
        result = await biometricApi.createBiometricProfile(profileData);
        setSuccess('Biometric profile created successfully!');
      }

      if (onProfileCreated) {
        onProfileCreated(result.profile);
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save profile');
    } finally {
      setIsLoading(false);
    }
  };

  const getBMIColor = (bmi: number) => {
    if (bmi < 18.5) return 'text-blue-600';
    if (bmi < 25) return 'text-green-600';
    if (bmi < 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {existingProfile ? 'Update Biometric Profile' : 'Create Biometric Profile'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age (years)</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  placeholder="25"
                  min="13"
                  max="120"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => handleInputChange('gender', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={formData.height}
                  onChange={(e) => handleInputChange('height', e.target.value)}
                  placeholder="175"
                  min="120"
                  max="250"
                  step="0.1"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  placeholder="70"
                  min="30"
                  max="300"
                  step="0.1"
                  required
                />
              </div>
            </div>

            {/* Activity Level */}
            <div className="space-y-2">
              <Label htmlFor="activity_level">Activity Level</Label>
              <Select
                value={formData.activity_level}
                onValueChange={(value) => handleInputChange('activity_level', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your activity level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentary">Sedentary (little or no exercise)</SelectItem>
                  <SelectItem value="lightly_active">Lightly Active (light exercise 1-3 days/week)</SelectItem>
                  <SelectItem value="moderately_active">Moderately Active (moderate exercise 3-5 days/week)</SelectItem>
                  <SelectItem value="very_active">Very Active (hard exercise 6-7 days/week)</SelectItem>
                  <SelectItem value="extra_active">Extra Active (very hard exercise & physical job)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fitness Goal */}
            <div className="space-y-2">
              <Label htmlFor="fitness_goal">Fitness Goal</Label>
              <Select
                value={formData.fitness_goal}
                onValueChange={(value) => handleInputChange('fitness_goal', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your fitness goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weight_loss">Weight Loss</SelectItem>
                  <SelectItem value="weight_gain">Weight Gain</SelectItem>
                  <SelectItem value="maintenance">Weight Maintenance</SelectItem>
                  <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Exercise Calories */}
            <div className="space-y-2">
              <Label htmlFor="exercise_calories">Additional Exercise Calories per Day</Label>
              <Input
                id="exercise_calories"
                type="number"
                value={formData.exercise_calories_per_day}
                onChange={(e) => handleInputChange('exercise_calories_per_day', e.target.value)}
                placeholder="0"
                min="0"
                max="2000"
              />
              <p className="text-sm text-gray-600">
                Extra calories burned from planned exercise (beyond base activity level)
              </p>
            </div>

            {/* Real-time Calculations Display */}
            {calculations.bmi && (
              <Card className="bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calculator className="h-5 w-5" />
                    Calculated Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-white rounded-lg">
                      <div className="text-2xl font-bold text-gray-800">
                        {calculations.bmi?.toFixed(1)}
                      </div>
                      <div className={`text-sm font-medium ${getBMIColor(calculations.bmi!)}`}>
                        BMI
                      </div>
                      <div className="text-xs text-gray-600">
                        {biometricApi.getBMICategory(calculations.bmi!).category}
                      </div>
                    </div>

                    <div className="text-center p-4 bg-white rounded-lg">
                      <div className="text-2xl font-bold text-gray-800">
                        {calculations.bmr?.toFixed(0)}
                      </div>
                      <div className="text-sm font-medium text-green-600">
                        BMR
                      </div>
                      <div className="text-xs text-gray-600">
                        Calories/day at rest
                      </div>
                    </div>

                    <div className="text-center p-4 bg-white rounded-lg">
                      <div className="text-2xl font-bold text-gray-800">
                        {calculations.tdee?.toFixed(0)}
                      </div>
                      <div className="text-sm font-medium text-purple-600">
                        TDEE
                      </div>
                      <div className="text-xs text-gray-600">
                        Total daily calories
                      </div>
                    </div>

                    <div className="text-center p-4 bg-white rounded-lg">
                      <div className="text-2xl font-bold text-gray-800">
                        {(calculations.hydration_goal! / 1000).toFixed(1)}L
                      </div>
                      <div className="text-sm font-medium text-blue-600">
                        Water Goal
                      </div>
                      <div className="text-xs text-gray-600">
                        Daily hydration
                      </div>
                    </div>

                    {calculations.macro_goals && (
                      <>
                        <div className="text-center p-4 bg-white rounded-lg">
                          <div className="text-2xl font-bold text-gray-800">
                            {calculations.macro_goals.protein_g?.toFixed(0)}g
                          </div>
                          <div className="text-sm font-medium text-red-600">
                            Protein
                          </div>
                          <div className="text-xs text-gray-600">
                            Daily target
                          </div>
                        </div>

                        <div className="text-center p-4 bg-white rounded-lg">
                          <div className="text-2xl font-bold text-gray-800">
                            {calculations.macro_goals.carbs_g?.toFixed(0)}g
                          </div>
                          <div className="text-sm font-medium text-yellow-600">
                            Carbs
                          </div>
                          <div className="text-xs text-gray-600">
                            Daily target
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {existingProfile ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Target className="mr-2 h-4 w-4" />
                  {existingProfile ? 'Update Profile' : 'Create Profile'}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default BiometricProfileForm;
