import { useState, useEffect } from 'react'
import { ArrowLeft, Activity, Target, Calendar, TrendingUp, Dumbbell, Heart, Clock } from 'lucide-react'

// Types
interface UserFitnessProfile {
  id?: string
  name: string
  email: string
  age: number
  weight: number
  height: number
  gender: 'male' | 'female' | 'other'
  fitness_level: 'beginner' | 'intermediate' | 'advanced'
  goals: string[]
  preferred_activities: string[]
  available_time: number // minutes per day
  equipment_access: string[]
}

interface WorkoutPlan {
  id: string
  name: string
  type: 'strength' | 'cardio' | 'flexibility' | 'mixed'
  duration: number
  difficulty: 'easy' | 'medium' | 'hard'
  exercises: Exercise[]
  estimated_calories: number
}

interface Exercise {
  name: string
  type: string
  sets?: number
  reps?: number
  duration?: number
  rest_time?: number
  instructions: string[]
}

interface FitnessAgentProps {
  onBackToServices: () => void
}

export const FitnessAgent: React.FC<FitnessAgentProps> = ({ onBackToServices }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<UserFitnessProfile | null>(null)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'workout' | 'progress' | 'profile'>('dashboard')
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  // Mock workout plans
  const sampleWorkouts: WorkoutPlan[] = [
    {
      id: '1',
      name: 'Quick HIIT Cardio',
      type: 'cardio',
      duration: 20,
      difficulty: 'medium',
      estimated_calories: 200,
      exercises: [
        {
          name: 'Jumping Jacks',
          type: 'cardio',
          duration: 60,
          rest_time: 30,
          instructions: ['Stand upright with legs together', 'Jump while spreading legs and raising arms', 'Return to starting position']
        },
        {
          name: 'Burpees',
          type: 'cardio',
          sets: 3,
          reps: 10,
          rest_time: 60,
          instructions: ['Start in standing position', 'Drop to squat, place hands on floor', 'Jump back to plank, do push-up', 'Jump feet forward, stand and jump up']
        }
      ]
    },
    {
      id: '2',
      name: 'Upper Body Strength',
      type: 'strength',
      duration: 45,
      difficulty: 'medium',
      estimated_calories: 250,
      exercises: [
        {
          name: 'Push-ups',
          type: 'strength',
          sets: 3,
          reps: 12,
          rest_time: 60,
          instructions: ['Start in plank position', 'Lower body to floor', 'Push back up to starting position']
        },
        {
          name: 'Pull-ups',
          type: 'strength',
          sets: 3,
          reps: 8,
          rest_time: 90,
          instructions: ['Hang from bar with arms extended', 'Pull body up until chin clears bar', 'Lower back to starting position']
        }
      ]
    }
  ]

  // Check for existing user data on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('fitnessAgentUser')
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        setUser(userData)
        setIsAuthenticated(true)
        loadWorkoutHistory()
      } catch (error) {
        console.error('Error parsing saved user data:', error)
        localStorage.removeItem('fitnessAgentUser')
      }
    }
  }, [])

  const loadWorkoutHistory = () => {
    const savedWorkouts = localStorage.getItem('fitnessAgentWorkouts')
    if (savedWorkouts) {
      try {
        setWorkoutPlans(JSON.parse(savedWorkouts))
      } catch (error) {
        console.warn('Failed to load workout history:', error)
      }
    }
  }

  const handleCreateProfile = (data: UserFitnessProfile) => {
    const profileWithId = {
      ...data,
      id: Date.now().toString()
    }
    
    setUser(profileWithId)
    setIsAuthenticated(true)
    localStorage.setItem('fitnessAgentUser', JSON.stringify(profileWithId))
    setActiveTab('dashboard')
    
    alert('Fitness profile created successfully!')
  }

  const generateWorkoutPlan = async () => {
    if (!user) return
    
    setIsGenerating(true)
    
    // Simulate API call
    setTimeout(() => {
      const personalizedPlan = {
        ...sampleWorkouts[Math.floor(Math.random() * sampleWorkouts.length)],
        id: Date.now().toString(),
        name: `Personalized ${user.fitness_level} Workout`
      }
      
      const updatedPlans = [personalizedPlan, ...workoutPlans]
      setWorkoutPlans(updatedPlans)
      localStorage.setItem('fitnessAgentWorkouts', JSON.stringify(updatedPlans))
      setIsGenerating(false)
      
      alert('New workout plan generated!')
    }, 2000)
  }

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBackToServices}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-brand transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Services
            </button>
            <div className="h-6 w-px bg-gray-300" />
            <h1 className="text-xl font-semibold text-gray-900">Fitness Planner</h1>
          </div>
        </div>

        {/* Profile Creation Form */}
        <ProfileForm onSubmit={handleCreateProfile} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBackToServices}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-brand transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Services
          </button>
          <div className="h-6 w-px bg-gray-300" />
          <h1 className="text-xl font-semibold text-gray-900">Fitness Planner</h1>
        </div>
        <div className="text-sm text-gray-500">
          Welcome back, {user?.name}!
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Activity },
            { id: 'workout', label: 'Workouts', icon: Dumbbell },
            { id: 'progress', label: 'Progress', icon: TrendingUp },
            { id: 'profile', label: 'Profile', icon: Target }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as 'dashboard' | 'workout' | 'progress' | 'profile')}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === id
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'dashboard' && user && (
          <Dashboard user={user} onGenerateWorkout={generateWorkoutPlan} isGenerating={isGenerating} />
        )}
        
        {activeTab === 'workout' && (
          <WorkoutPlans workoutPlans={workoutPlans} onGenerateNew={generateWorkoutPlan} isGenerating={isGenerating} />
        )}
        
        {activeTab === 'progress' && user && (
          <ProgressTracking user={user} />
        )}
        
        {activeTab === 'profile' && user && (
          <ProfileSettings user={user} onUpdate={setUser} />
        )}
      </div>
    </div>
  )
}

// Profile Form Component
const ProfileForm: React.FC<{ onSubmit: (data: UserFitnessProfile) => void }> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<UserFitnessProfile>({
    name: '',
    email: '',
    age: 25,
    weight: 70,
    height: 170,
    gender: 'male',
    fitness_level: 'beginner',
    goals: [],
    preferred_activities: [],
    available_time: 30,
    equipment_access: []
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const fitnessGoals = [
    'Weight Loss', 'Muscle Gain', 'Strength Building', 'Endurance', 'Flexibility', 'General Health'
  ]

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Your Fitness Profile</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
              min="13"
              max="100"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
            <input
              type="number"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
              min="30"
              max="300"
              step="0.1"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Height (cm)</label>
            <input
              type="number"
              value={formData.height}
              onChange={(e) => setFormData({ ...formData, height: parseFloat(e.target.value) })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
              min="100"
              max="250"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' | 'other' })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fitness Level</label>
            <select
              value={formData.fitness_level}
              onChange={(e) => setFormData({ ...formData, fitness_level: e.target.value as 'beginner' | 'intermediate' | 'advanced' })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Available Time (minutes per day)</label>
          <input
            type="number"
            value={formData.available_time}
            onChange={(e) => setFormData({ ...formData, available_time: parseInt(e.target.value) })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
            min="10"
            max="180"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Fitness Goals</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {fitnessGoals.map(goal => (
              <label key={goal} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.goals.includes(goal)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({ ...formData, goals: [...formData.goals, goal] })
                    } else {
                      setFormData({ ...formData, goals: formData.goals.filter(g => g !== goal) })
                    }
                  }}
                  className="mr-2"
                />
                <span className="text-sm">{goal}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-brand hover:bg-brand-dark text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          Create Fitness Profile
        </button>
      </form>
    </div>
  )
}

// Dashboard Component
const Dashboard: React.FC<{ 
  user: UserFitnessProfile
  onGenerateWorkout: () => void
  isGenerating: boolean
}> = ({ user, onGenerateWorkout, isGenerating }) => {
  const bmi = user.weight / ((user.height / 100) ** 2)

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Heart className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">BMI</p>
              <p className="text-2xl font-bold text-gray-900">{bmi.toFixed(1)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Goals</p>
              <p className="text-2xl font-bold text-gray-900">{user.goals.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Daily Time</p>
              <p className="text-2xl font-bold text-gray-900">{user.available_time}m</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Activity className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Level</p>
              <p className="text-lg font-bold text-gray-900 capitalize">{user.fitness_level}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={onGenerateWorkout}
            disabled={isGenerating}
            className="flex items-center justify-center px-4 py-3 bg-brand hover:bg-brand-dark text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Dumbbell className="w-5 h-5 mr-2" />
            {isGenerating ? 'Generating...' : 'Generate Workout Plan'}
          </button>
          
          <button
            className="flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Calendar className="w-5 h-5 mr-2" />
            Schedule Workout
          </button>
        </div>
      </div>

      {/* Today's Goals */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Fitness Goals</h3>
        <div className="space-y-3">
          {user.goals.map((goal, index) => (
            <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
              <Target className="w-5 h-5 text-brand mr-3" />
              <span className="text-gray-800">{goal}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Workout Plans Component
const WorkoutPlans: React.FC<{
  workoutPlans: WorkoutPlan[]
  onGenerateNew: () => void
  isGenerating: boolean
}> = ({ workoutPlans, onGenerateNew, isGenerating }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Workout Plans</h2>
        <button
          onClick={onGenerateNew}
          disabled={isGenerating}
          className="px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg transition-colors disabled:opacity-50"
        >
          {isGenerating ? 'Generating...' : 'Generate New Plan'}
        </button>
      </div>

      {workoutPlans.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Dumbbell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No workout plans yet</h3>
          <p className="text-gray-600 mb-4">Generate your first personalized workout plan!</p>
          <button
            onClick={onGenerateNew}
            disabled={isGenerating}
            className="px-6 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {isGenerating ? 'Generating...' : 'Generate Workout Plan'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {workoutPlans.map((plan) => (
            <div key={plan.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  plan.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                  plan.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {plan.difficulty}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Clock className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                  <p className="text-sm font-medium text-gray-900">{plan.duration} min</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Activity className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                  <p className="text-sm font-medium text-gray-900">{plan.estimated_calories} cal</p>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <h4 className="font-medium text-gray-900">Exercises:</h4>
                {plan.exercises.slice(0, 3).map((exercise, idx) => (
                  <div key={idx} className="text-sm text-gray-600">
                    • {exercise.name}
                    {exercise.sets && exercise.reps && ` (${exercise.sets}x${exercise.reps})`}
                    {exercise.duration && ` (${exercise.duration}s)`}
                  </div>
                ))}
                {plan.exercises.length > 3 && (
                  <div className="text-sm text-gray-500">+ {plan.exercises.length - 3} more exercises</div>
                )}
              </div>
              
              <button className="w-full px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg transition-colors">
                Start Workout
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Progress Tracking Component
const ProgressTracking: React.FC<{ user: UserFitnessProfile }> = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Progress Tracking</h2>
      
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-12">
          <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Track Your Progress</h3>
          <p className="text-gray-600 mb-4">Start working out to see your progress metrics here.</p>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-600">Workouts Completed</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-600">Total Time</p>
                <p className="text-2xl font-bold text-gray-900">0h</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-600">Calories Burned</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Profile Settings Component
const ProfileSettings: React.FC<{
  user: UserFitnessProfile
  onUpdate: (user: UserFitnessProfile) => void
}> = ({ user }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Profile Settings</h2>
      
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <p className="text-gray-900">{user.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="text-gray-900">{user.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fitness Level</label>
              <p className="text-gray-900 capitalize">{user.fitness_level}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Available Time</label>
              <p className="text-gray-900">{user.available_time} minutes/day</p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Goals</label>
            <div className="flex flex-wrap gap-2">
              {user.goals.map((goal, index) => (
                <span key={index} className="px-3 py-1 bg-brand text-white text-sm rounded-full">
                  {goal}
                </span>
              ))}
            </div>
          </div>
          
          <button className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors">
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  )
}
