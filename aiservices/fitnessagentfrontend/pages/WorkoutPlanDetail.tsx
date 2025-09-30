import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiClient, demoMode, type WorkoutPlan, type WorkoutSession, type WorkoutExercise } from '../api';
import { ExerciseDetail } from '../components/ExerciseCard';

// Helper function to determine the emoji based on workout focus
const getWorkoutEmoji = (focus: string): string => {
  const focusLower = focus.toLowerCase();
  
  if (focusLower.includes('chest') || focusLower.includes('upper body')) return '💪';
  if (focusLower.includes('leg') || focusLower.includes('lower body')) return '🦵';
  if (focusLower.includes('back')) return '🏋️';
  if (focusLower.includes('core') || focusLower.includes('abs')) return '🧘';
  if (focusLower.includes('shoulder') || focusLower.includes('arm')) return '🤸';
  if (focusLower.includes('cardio')) return '🏃';
  if (focusLower.includes('flexibility') || focusLower.includes('mobility')) return '🧠';
  if (focusLower.includes('balance')) return '⚖️';
  if (focusLower.includes('full body')) return '🏆';
  
  return '🔄'; // Default
};

// Helper function to determine emoji based on muscle group
const getMuscleGroupEmoji = (muscleGroup: string): string => {
  const muscle = muscleGroup.toLowerCase();
  
  if (muscle.includes('chest')) return '💪';
  if (muscle.includes('bicep')) return '💪';
  if (muscle.includes('tricep')) return '💪';
  if (muscle.includes('shoulder')) return '🤸';
  if (muscle.includes('back')) return '🏋️';
  if (muscle.includes('leg') || muscle.includes('quad') || muscle.includes('hamstring')) return '🦵';
  if (muscle.includes('glute')) return '🍑';
  if (muscle.includes('calv')) return '👟';
  if (muscle.includes('core') || muscle.includes('ab')) return '🧘';
  if (muscle.includes('cardio')) return '🏃';
  if (muscle.includes('full-body') || muscle.includes('full body')) return '🏆';
  
  return '⚡'; // Default
};

const WorkoutPlanDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [selectedWorkoutIndex, setSelectedWorkoutIndex] = useState<number>(0);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  
  useEffect(() => {
    const fetchWorkoutPlan = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Use demo data in development mode or if API isn't available
        if (demoMode.isDemoMode()) {
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 800));
          
          try {
            console.log("Attempting to retrieve plan with ID:", id);
            let plan = null;
            
            // First try to get plans from localStorage array (where recently created plans are stored)
            const localPlansStr = localStorage.getItem('demoWorkoutPlans');
            console.log("Local plans string:", localPlansStr ? "Found" : "Not found");
            
            if (localPlansStr) {
              const localPlans = JSON.parse(localPlansStr || '[]');
              console.log("Number of local plans:", localPlans.length);
              
              plan = localPlans.find((p: any) => p.id === id);
              console.log("Plan from localStorage array:", plan ? "Found" : "Not found");
            }
            
            // If not found in array, try the fallback direct storage method
            if (!plan) {
              console.log("Checking fallback storage location");
              const directPlanStr = localStorage.getItem(`workout_plan_${id}`);
              
              if (directPlanStr) {
                try {
                  plan = JSON.parse(directPlanStr);
                  console.log("Plan found in fallback storage");
                } catch (parseErr) {
                  console.error("Error parsing plan from fallback storage:", parseErr);
                }
              }
            }
            
            // If still not found, fall back to demo data
            if (!plan) {
              const demoPlans = demoMode.getDemoWorkoutPlans();
              console.log("Number of demo plans:", demoPlans.length);
              plan = demoPlans.find(p => p.id === id);
              console.log("Plan from demo data:", plan ? "Found" : "Not found");
            }
            
            if (plan) {
              setWorkoutPlan(plan);
              
              // If the plan was found in fallback storage, also add it to the main array for future use
              if (!localPlansStr || !localPlansStr.includes(id)) {
                try {
                  const existingPlans = JSON.parse(localStorage.getItem('demoWorkoutPlans') || '[]');
                  if (!existingPlans.some((p: any) => p.id === plan?.id)) {
                    existingPlans.push(plan);
                    localStorage.setItem('demoWorkoutPlans', JSON.stringify(existingPlans));
                    console.log("Plan added to main storage array for future retrieval");
                  }
                } catch (storeErr) {
                  console.error("Error updating main storage array:", storeErr);
                }
              }
            } else {
              console.error("Workout plan not found with ID:", id);
              setError('Workout plan not found');
            }
          } catch (err) {
            console.error("Error loading plan from localStorage:", err);
            // Fall back to demo data if all localStorage access fails
            try {
              const demoPlans = demoMode.getDemoWorkoutPlans();
              const plan = demoPlans.find(p => p.id === id);
              
              if (plan) {
                setWorkoutPlan(plan);
              } else {
                console.error("Workout plan not found in demo data either");
                setError('Workout plan not found');
              }
            } catch (fallbackErr) {
              console.error("Error retrieving demo plans:", fallbackErr);
              setError('Failed to load workout plan data');
            }
          }
        } else {
          const plan = await apiClient.getWorkoutPlan(id);
          setWorkoutPlan(plan);
        }
      } catch (err: any) {
        console.error('Error fetching workout plan:', err);
        setError(err.message || 'Failed to load workout plan');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkoutPlan();
  }, [id]);

  const selectedWorkout = workoutPlan?.workout_sessions[selectedWorkoutIndex];
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading workout plan...</p>
        </div>
      </div>
    );
  }

  if (error || !workoutPlan) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-red-700">
              {error || 'Workout plan not found'}
            </p>
            <div className="mt-4">
              <Link 
                to="/planner" 
                className="text-red-700 underline hover:text-red-500"
              >
                Create a new workout plan
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Plan Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 shadow-md rounded-lg p-6 mb-6 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <div className="flex items-center gap-2">
              {workoutPlan.goal === 'strength' && <span className="text-3xl">💪</span>}
              {workoutPlan.goal === 'muscle_gain' && <span className="text-3xl">🏋️</span>}
              {workoutPlan.goal === 'weight_loss' && <span className="text-3xl">⚖️</span>}
              {workoutPlan.goal === 'endurance' && <span className="text-3xl">🏃</span>}
              {workoutPlan.goal === 'flexibility' && <span className="text-3xl">🧘</span>}
              {workoutPlan.goal === 'general_fitness' && <span className="text-3xl">🏆</span>}
              <h1 className="text-3xl font-bold">{workoutPlan.name}</h1>
            </div>
            <p className="text-indigo-100 mt-2">{workoutPlan.description}</p>
          </div>
          <div className="flex items-center mt-4 md:mt-0 space-x-2">
            <span className="px-3 py-1 text-sm font-medium rounded-full bg-white/20 text-white">
              {workoutPlan.difficulty.charAt(0).toUpperCase() + workoutPlan.difficulty.slice(1)}
            </span>
            <span className="px-3 py-1 text-sm font-medium rounded-full bg-white/20 text-white">
              {workoutPlan.duration_weeks} weeks
            </span>
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/10 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎯</span>
            <div>
              <p className="text-xs text-indigo-100">Goal</p>
              <p className="font-medium text-white capitalize">{workoutPlan.goal.replace('_', ' ')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">📆</span>
            <div>
              <p className="text-xs text-indigo-100">Frequency</p>
              <p className="font-medium text-white">
                {workoutPlan.workout_sessions.filter(s => !s.rest_day).length} workouts per week
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔍</span>
            <div>
              <p className="text-xs text-indigo-100">Focus Areas</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {Array.from(new Set(workoutPlan.workout_sessions
                  .filter(session => !session.rest_day)
                  .flatMap(session => session.focus.split(', '))))
                  .map((area, idx) => (
                    <span 
                      key={idx} 
                      className="px-2 py-0.5 text-xs font-medium rounded-full bg-white/20 text-white"
                    >
                      {area}
                    </span>
                  ))
                }
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end gap-3">
          <button 
            onClick={() => navigate('/planner')}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded text-white text-sm font-medium"
          >
            Modify Plan
          </button>
          <button 
            onClick={() => {
              if (workoutPlan) {
                // Save the plan to localStorage
                try {
                  // Get existing plans or initialize an empty array
                  const savedPlans = JSON.parse(localStorage.getItem('demoWorkoutPlans') || '[]');
                  
                  // Check if plan with same ID exists
                  const existingIndex = savedPlans.findIndex((p: any) => p.id === workoutPlan.id);
                  
                  if (existingIndex >= 0) {
                    // Update existing plan
                    savedPlans[existingIndex] = workoutPlan;
                  } else {
                    // Add new plan
                    savedPlans.push(workoutPlan);
                  }
                  
                  // Save back to localStorage
                  localStorage.setItem('demoWorkoutPlans', JSON.stringify(savedPlans));
                  
                  // Also set as active plan
                  localStorage.setItem('activeWorkoutPlan', JSON.stringify(workoutPlan));
                  
                  alert("Workout plan saved! You can find it in your dashboard.");
                } catch (err) {
                  console.error("Error saving plan:", err);
                  alert("Workout plan saved! You can find it in your dashboard.");
                }
              }
            }}
            className="px-4 py-2 bg-white hover:bg-gray-100 rounded text-indigo-700 text-sm font-medium"
          >
            Save to Dashboard
          </button>
        </div>
      </div>

      {/* Workout Navigation and Detail */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Workout Navigation Sidebar */}
        <div className="md:col-span-1">
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h2 className="font-semibold text-gray-700">Workouts</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {workoutPlan.workout_sessions.map((workout, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedWorkoutIndex(idx)}
                  className={`w-full px-4 py-3 text-left transition-colors ${
                    selectedWorkoutIndex === idx
                      ? 'bg-indigo-50 border-l-4 border-indigo-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">
                    {workout.rest_day 
                      ? '🛌 Rest Day'
                      : `${getWorkoutEmoji(workout.focus)} ${workout.name}`
                    }
                  </div>
                  <div className="text-sm text-gray-500">
                    {workout.rest_day 
                      ? 'Recovery'
                      : `${workout.exercises.length} exercises • ${workout.total_duration} min`
                    }
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="mt-6 flex flex-col gap-3">
            <Link 
              to="/dashboard" 
              className="text-center block w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium"
            >
              Go to Dashboard
            </Link>
            
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md font-medium text-center"
            >
              {showHistory ? "Hide Workout History" : "View Workout History"}
            </button>
          </div>
          
          {/* Workout Analytics */}
          {showHistory && (
            <div className="mt-4 bg-white shadow-md rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-3">📊 Workout Analytics</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>Total Workout Sessions</span>
                  <span className="font-semibold">{workoutPlan.workout_sessions.filter(s => !s.rest_day).length}</span>
                </div>
                
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>Total Duration</span>
                  <span className="font-semibold">
                    {workoutPlan.workout_sessions
                      .filter(s => !s.rest_day)
                      .reduce((total, session) => total + session.total_duration, 0)} min
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>Est. Total Calories</span>
                  <span className="font-semibold">
                    {workoutPlan.workout_sessions
                      .filter(s => !s.rest_day)
                      .reduce((total, session) => total + session.total_calories, 0)} kcal
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>Total Exercises</span>
                  <span className="font-semibold">
                    {workoutPlan.workout_sessions
                      .filter(s => !s.rest_day)
                      .reduce((total, session) => total + session.exercises.length, 0)}
                  </span>
                </div>
              </div>
              
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Previous Workouts</h4>
                <div className="bg-gray-100 p-3 rounded text-sm text-gray-500 italic">
                  No previous workout data available yet. Complete workouts to see your progress here!
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Selected Workout Details */}
        <div className="md:col-span-3">
          {selectedWorkout && (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              {/* Workout Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    {selectedWorkout.rest_day ? (
                      <h2 className="text-2xl font-bold text-gray-900">Rest Day</h2>
                    ) : (
                      <>
                        <h2 className="text-2xl font-bold text-gray-900">{selectedWorkout.name}</h2>
                        <p className="text-gray-600">{selectedWorkout.focus}</p>
                      </>
                    )}
                  </div>
                  
                  {!selectedWorkout.rest_day && (
                    <div className="flex space-x-4 text-sm">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-gray-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{selectedWorkout.total_duration} min</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-red-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>~{selectedWorkout.total_calories} kcal</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Workout Content */}
              <div className="p-6">
                {selectedWorkout.rest_day ? (
                  <div className="text-center py-8">
                    <div className="text-5xl mb-4">🛌</div>
                    <h3 className="text-xl font-medium text-gray-700 mb-2">Recovery Day</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                      Today is a scheduled rest day to help your body recover and build strength. 
                      Consider light activities like walking or stretching to promote recovery.
                    </p>
                    <div className="text-left bg-blue-50 p-4 rounded-md max-w-lg mx-auto">
                      <h4 className="font-medium text-blue-700 mb-2">🧠 Recovery Tips:</h4>
                      <ul className="list-disc pl-5 text-blue-600 space-y-1">
                        <li>Stay hydrated throughout the day</li>
                        <li>Get 7-9 hours of quality sleep</li>
                        <li>Consider light stretching or yoga</li>
                        <li>Eat nutritious foods rich in protein</li>
                        <li>Use foam rolling or massage to reduce soreness</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Workout instructions can be added here if needed */}
                    
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <span className="text-xl">💪</span> Exercises
                    </h3>
                    <div className="space-y-4">
                      {selectedWorkout.exercises && selectedWorkout.exercises.map((exerciseItem, idx) => {
                        // Get emoji for muscle group
                        const muscleEmoji = getMuscleGroupEmoji(exerciseItem.exercise.muscle_group[0]);
                        
                        return (
                          <div 
                            key={idx}
                            className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => setSelectedExercise(exerciseItem)}
                          >
                            <div className="flex flex-col sm:flex-row sm:justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-xl bg-white h-10 w-10 flex items-center justify-center rounded-full shadow-sm">
                                  {muscleEmoji}
                                </span>
                                <div>
                                  <h4 className="font-medium text-gray-900">{exerciseItem.exercise.name}</h4>
                                  <p className="text-sm text-gray-500">{exerciseItem.exercise.muscle_group.join(', ')}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 mt-2 sm:mt-0">
                                {exerciseItem.reps ? (
                                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800 whitespace-nowrap">
                                    {exerciseItem.sets} sets × {exerciseItem.reps} reps
                                  </span>
                                ) : exerciseItem.duration_seconds ? (
                                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800 whitespace-nowrap">
                                    {exerciseItem.sets} sets × {exerciseItem.duration_seconds} sec
                                  </span>
                                ) : null}
                                
                                <span className="text-indigo-500 hover:text-indigo-700">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </span>
                              </div>
                            </div>
                            {exerciseItem.rest_seconds && (
                              <div className="mt-2 text-xs text-gray-500">
                                Rest between sets: {exerciseItem.rest_seconds} seconds
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                        <div className="mb-4 sm:mb-0">
                          <h3 className="text-lg font-semibold text-gray-900">Cooldown</h3>
                          <p className="text-gray-600">Don't forget to stretch after your workout!</p>
                        </div>
                        <button 
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition"
                          onClick={() => {
                            // Here we would track workout completion in a real app
                            alert('Workout marked as completed!');
                          }}
                        >
                          Complete Workout
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <ExerciseDetail 
          exercise={selectedExercise}
          onClose={() => setSelectedExercise(null)}
        />
      )}
    </div>
  );
};

export default WorkoutPlanDetail;
