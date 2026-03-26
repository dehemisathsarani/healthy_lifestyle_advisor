import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient, demoMode, type WorkoutPlan, type FitnessGoal, type Equipment, type WorkoutSession } from '../api';

const WorkoutPlanner: React.FC = () => {
  const navigate = useNavigate();
  
  const [generatedPlan, setGeneratedPlan] = useState<WorkoutPlan | null>(null);
  const [showPlanCard, setShowPlanCard] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);
  
  const [formState, setFormState] = useState({
    goal: 'strength' as FitnessGoal,
    fitnessLevel: 'beginner',
    durationWeeks: 4,
    frequency: 3,
    availableEquipment: [] as string[],
    preferences: {
      focusAreas: [] as string[],
      preferredDuration: 30,
      injuries: '',
    },
    customNotes: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fitnessGoals = [
    { id: 'strength', name: 'Strength Training', icon: '💪' },
    { id: 'muscle_gain', name: 'Muscle Gain', icon: '🏋️' },
    { id: 'weight_loss', name: 'Weight Loss', icon: '⚖️' },
    { id: 'endurance', name: 'Endurance', icon: '🏃' },
    { id: 'flexibility', name: 'Flexibility', icon: '🧘' },
    { id: 'general_fitness', name: 'General Fitness', icon: '🏆' }
  ];
  
  const fitnessLevels = [
    { id: 'beginner', name: 'Beginner' },
    { id: 'intermediate', name: 'Intermediate' },
    { id: 'advanced', name: 'Advanced' }
  ];
  
  const equipmentOptions: Equipment[] = [
    { id: 'none', name: 'No Equipment (Bodyweight Only)' },
    { id: 'dumbbells', name: 'Dumbbells' },
    { id: 'barbell', name: 'Barbell & Weights' },
    { id: 'kettlebell', name: 'Kettlebells' },
    { id: 'resistance_bands', name: 'Resistance Bands' },
    { id: 'pull_up_bar', name: 'Pull-up Bar' },
    { id: 'bench', name: 'Bench' },
    { id: 'gym', name: 'Full Gym Access' }
  ];
  
  const focusAreaOptions = [
    { id: 'upper_body', name: 'Upper Body' },
    { id: 'lower_body', name: 'Lower Body' },
    { id: 'core', name: 'Core' },
    { id: 'back', name: 'Back' },
    { id: 'chest', name: 'Chest' },
    { id: 'arms', name: 'Arms' },
    { id: 'shoulders', name: 'Shoulders' },
    { id: 'glutes', name: 'Glutes' },
    { id: 'cardio', name: 'Cardio' }
  ];
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormState(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value
        }
      }));
    } else {
      setFormState(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, category: 'availableEquipment' | 'preferences.focusAreas') => {
    const { value, checked } = e.target;
    
    if (category === 'preferences.focusAreas') {
      setFormState(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          focusAreas: checked 
            ? [...prev.preferences.focusAreas, value]
            : prev.preferences.focusAreas.filter(area => area !== value)
        }
      }));
    } else {
      setFormState(prev => ({
        ...prev,
        [category]: checked
          ? [...prev[category], value]
          : prev[category].filter(item => item !== value)
      }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      let workoutPlan: WorkoutPlan;
      
      if (demoMode.isDemoMode()) {
        // Generate a demo workout plan
        workoutPlan = demoMode.generateDemoWorkoutPlan(formState);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));
      } else {
        // Call the actual API
        workoutPlan = await apiClient.getWorkoutPlan("demo"); // Changed from createWorkoutPlan
      }
      
      // Instead of redirecting, show the plan card
      setGeneratedPlan(workoutPlan);
      setShowPlanCard(true);
      setSelectedDay(0); // Select first day by default
      window.scrollTo(0, 0); // Scroll to top to show the workout plan
      
    } catch (err: any) {
      console.error('Error creating workout plan:', err);
      setError(err.message || 'Failed to create workout plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create Your Personalized Workout Plan</h1>
        <button 
          onClick={() => navigate('/dashboard')}
          className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 font-medium"
        >
          Dashboard
        </button>
      </div>
      
      {/* Workout Plan Card - shown after submission */}
      {showPlanCard && generatedPlan && (
        <div className="mb-10 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
            <h2 className="text-white text-2xl font-bold">{generatedPlan.name}</h2>
            <p className="text-indigo-100 mt-2">{generatedPlan.description}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="bg-indigo-200 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {generatedPlan.difficulty.charAt(0).toUpperCase() + generatedPlan.difficulty.slice(1)}
              </span>
              <span className="bg-indigo-200 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {generatedPlan.duration_weeks} weeks
              </span>
              <span className="bg-indigo-200 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {generatedPlan.goal.replace('_', ' ').charAt(0).toUpperCase() + generatedPlan.goal.replace('_', ' ').slice(1)}
              </span>
            </div>
          </div>
          
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Weekly Schedule</h3>
            
            {/* Day tabs */}
            <div className="flex overflow-x-auto mb-6 pb-1">
              {generatedPlan.workout_sessions.map((session, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedDay(index)}
                  className={`px-4 py-2 mr-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors ${
                    selectedDay === index
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Day {session.day} {session.rest_day ? '(Rest)' : ''}
                </button>
              ))}
            </div>
            
            {/* Selected day details */}
            {generatedPlan.workout_sessions[selectedDay] && (
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-lg font-medium text-gray-900">
                    {generatedPlan.workout_sessions[selectedDay].name}
                  </h4>
                  <div className="text-sm text-gray-500">
                    <span className="mr-3">
                      {generatedPlan.workout_sessions[selectedDay].total_duration} min
                    </span>
                    <span>
                      {generatedPlan.workout_sessions[selectedDay].total_calories} cal
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-4">Focus: {generatedPlan.workout_sessions[selectedDay].focus}</p>
                
                {generatedPlan.workout_sessions[selectedDay].rest_day ? (
                  <div className="bg-blue-50 p-4 rounded-md">
                    <p className="text-blue-700">
                      This is a rest day. Take time to recover, stay hydrated, and get enough sleep.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {generatedPlan.workout_sessions[selectedDay].exercises.map((exercise, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded-md">
                        <div className="flex justify-between items-center">
                          <div>
                            <h5 className="font-medium text-gray-900">{exercise.exercise.name}</h5>
                            <p className="text-xs text-gray-500">
                              {exercise.exercise.muscle_group.join(', ')}
                            </p>
                          </div>
                          <div className="text-sm">
                            {exercise.sets} sets × {exercise.reps || exercise.duration_seconds + 's'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <div className="mt-6 flex gap-3">
              <button 
                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 font-medium"
                onClick={() => {
                  // In real app, this would save the plan via API
                  // For demo, we'll just add it to local storage for persistence
                  if (generatedPlan) {
                    // Store the plan in localStorage for demo purposes
                    try {
                      // Get existing plans or initialize an empty array
                      const savedPlans = JSON.parse(localStorage.getItem('demoWorkoutPlans') || '[]');
                      
                      // Check if plan with same ID exists
                      const existingIndex = savedPlans.findIndex((p: any) => p.id === generatedPlan.id);
                      
                      if (existingIndex >= 0) {
                        // Update existing plan
                        savedPlans[existingIndex] = generatedPlan;
                      } else {
                        // Add new plan
                        savedPlans.push(generatedPlan);
                      }
                      
                      // Save back to localStorage
                      localStorage.setItem('demoWorkoutPlans', JSON.stringify(savedPlans));
                      
                      // Also set as active plan
                      localStorage.setItem('activeWorkoutPlan', JSON.stringify(generatedPlan));
                      
                      alert("Workout plan saved! You can find it in your dashboard.");
                    } catch (err) {
                      console.error("Error saving plan:", err);
                      alert("Workout plan saved! You can find it in your dashboard.");
                    }
                  }
                }}
              >
                Save This Plan
              </button>
              <button 
                className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 font-medium"
                onClick={() => setShowPlanCard(false)}
              >
                Modify Plan
              </button>
              <button 
                className="bg-indigo-100 text-indigo-700 py-2 px-4 rounded-md hover:bg-indigo-200 font-medium"
                onClick={() => {
                  if (generatedPlan) {
                    // Store the generated plan in local storage so it can be accessed in detail view
                    try {
                      // Ensure we have a valid plan before proceeding
                      if (!generatedPlan || !generatedPlan.id) {
                        console.error("Invalid workout plan data");
                        return;
                      }
                      
                      console.log("Storing plan in localStorage:", generatedPlan.id);
                      
                      // Get existing plans or initialize an empty array
                      const savedPlans = JSON.parse(localStorage.getItem('demoWorkoutPlans') || '[]');
                      
                      // Check if plan with same ID exists
                      const existingIndex = savedPlans.findIndex((p: any) => p.id === generatedPlan.id);
                      
                      if (existingIndex === -1) {
                        // Add new plan if it doesn't exist
                        savedPlans.push(generatedPlan);
                        console.log("Adding new plan to localStorage");
                      } else {
                        // Update existing plan
                        savedPlans[existingIndex] = generatedPlan;
                        console.log("Updating existing plan in localStorage");
                      }
                      
                      // Save back to localStorage
                      localStorage.setItem('demoWorkoutPlans', JSON.stringify(savedPlans));
                      console.log("Plan stored successfully with ID:", generatedPlan.id);
                      
                      // Short delay to ensure localStorage is updated before navigation
                      setTimeout(() => {
                        console.log("Navigating to workout detail page:", generatedPlan.id);
                        navigate(`/workout/${generatedPlan.id}`);
                      }, 100);
                    } catch (err) {
                      console.error("Error storing plan for detail view:", err);
                      // Try again with a simpler approach if the first attempt fails
                      try {
                        localStorage.setItem(`workout_plan_${generatedPlan.id}`, JSON.stringify(generatedPlan));
                        console.log("Plan stored using fallback method");
                        
                        setTimeout(() => {
                          navigate(`/workout/${generatedPlan.id}`);
                        }, 100);
                      } catch (fallbackErr) {
                        console.error("Fallback storage also failed:", fallbackErr);
                        alert("Unable to save workout plan data. The detail view may not work correctly.");
                        navigate(`/workout/${generatedPlan.id}`);
                      }
                    }
                  }
                }}
              >
                View Full Details
              </button>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        {/* Fitness Goal Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">What's your main fitness goal?</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {fitnessGoals.map(goal => (
              <label 
                key={goal.id}
                className={`
                  flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-colors
                  ${formState.goal === goal.id 
                    ? 'border-indigo-500 bg-indigo-50' 
                    : 'border-gray-200 hover:bg-gray-50'}
                `}
              >
                <input 
                  type="radio"
                  name="goal"
                  value={goal.id}
                  checked={formState.goal === goal.id}
                  onChange={handleInputChange}
                  className="sr-only"
                />
                <span className="text-3xl mb-2">{goal.icon}</span>
                <span className="font-medium text-center">{goal.name}</span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Fitness Level Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">What's your current fitness level?</h2>
          <div className="flex flex-wrap gap-4">
            {fitnessLevels.map(level => (
              <label 
                key={level.id}
                className={`
                  flex items-center justify-center px-6 py-3 rounded-lg border-2 cursor-pointer transition-colors
                  ${formState.fitnessLevel === level.id 
                    ? 'border-indigo-500 bg-indigo-50' 
                    : 'border-gray-200 hover:bg-gray-50'}
                `}
              >
                <input 
                  type="radio"
                  name="fitnessLevel"
                  value={level.id}
                  checked={formState.fitnessLevel === level.id}
                  onChange={handleInputChange}
                  className="sr-only"
                />
                <span className="font-medium">{level.name}</span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Plan Duration and Frequency */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Plan Duration</h2>
            <div className="flex flex-col">
              <label htmlFor="durationWeeks" className="text-gray-700 mb-1">Number of Weeks</label>
              <select
                id="durationWeeks"
                name="durationWeeks"
                value={formState.durationWeeks}
                onChange={handleInputChange}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value={1}>1 week</option>
                <option value={2}>2 weeks</option>
                <option value={4}>4 weeks</option>
                <option value={6}>6 weeks</option>
                <option value={8}>8 weeks</option>
                <option value={12}>12 weeks</option>
              </select>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Workout Frequency</h2>
            <div className="flex flex-col">
              <label htmlFor="frequency" className="text-gray-700 mb-1">Workouts per Week</label>
              <select
                id="frequency"
                name="frequency"
                value={formState.frequency}
                onChange={handleInputChange}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value={2}>2 days/week</option>
                <option value={3}>3 days/week</option>
                <option value={4}>4 days/week</option>
                <option value={5}>5 days/week</option>
                <option value={6}>6 days/week</option>
                <option value={7}>7 days/week</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Equipment Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">What equipment do you have access to?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {equipmentOptions.map(equipment => (
              <label key={equipment.id} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="availableEquipment"
                  value={equipment.id}
                  checked={formState.availableEquipment.includes(equipment.id)}
                  onChange={(e) => handleCheckboxChange(e, 'availableEquipment')}
                  className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-gray-700">{equipment.name}</span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Focus Areas Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Any specific areas you want to focus on?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {focusAreaOptions.map(area => (
              <label key={area.id} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="focusAreas"
                  value={area.id}
                  checked={formState.preferences.focusAreas.includes(area.id)}
                  onChange={(e) => handleCheckboxChange(e, 'preferences.focusAreas')}
                  className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-gray-700">{area.name}</span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Workout Duration */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Preferred workout duration</h2>
          <div className="flex flex-col">
            <label htmlFor="preferredDuration" className="text-gray-700 mb-1">Minutes per session</label>
            <select
              id="preferredDuration"
              name="preferences.preferredDuration"
              value={formState.preferences.preferredDuration}
              onChange={handleInputChange}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
            </select>
          </div>
        </div>
        
        {/* Injuries and Limitations */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Any injuries or limitations to consider?</h2>
          <textarea
            name="preferences.injuries"
            value={formState.preferences.injuries}
            onChange={handleInputChange}
            placeholder="Example: Lower back pain, knee injury, etc."
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            rows={3}
          />
        </div>
        
        {/* Custom Notes */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Any additional notes or preferences?</h2>
          <textarea
            name="customNotes"
            value={formState.customNotes}
            onChange={handleInputChange}
            placeholder="Example: I prefer circuit training, I want to include more stretching, etc."
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            rows={3}
          />
        </div>
        
        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={loading}
            className={`
              px-6 py-3 text-lg font-medium text-white rounded-lg transition-colors
              ${loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}
            `}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Your Plan...
              </span>
            ) : 'Create My Workout Plan'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WorkoutPlanner;
