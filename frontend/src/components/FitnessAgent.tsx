import { useState, useEffect } from 'react'
import { ArrowLeft, Dumbbell, Target, TrendingUp, Calendar, Award, Activity, Heart, Clock, Zap } from 'lucide-react'

interface FitnessAgentProps {
  onBackToServices: () => void
}

// Demo Mode configuration (matches the fitness frontend)
const demoMode = {
  isDemoMode: () => true,
  getDemoDashboardData: () => ({
    active_plan: {
      id: 'demo-plan-1',
      name: 'Full Body Strength Training',
      description: 'A comprehensive workout plan for building overall strength',
      difficulty_level: 'intermediate',
      duration_weeks: 8,
      sessions_per_week: 4,
      workout_sessions: [
        {
          id: 'session-1',
          name: 'Upper Body Focus',
          day_of_week: 1,
          duration_minutes: 45,
          exercises: []
        }
      ]
    },
    upcoming_workout: {
      id: 'session-1',
      name: 'Upper Body Focus',
      day_of_week: 1,
      duration_minutes: 45,
      exercises: []
    },
    stats: {
      total_workouts: 24,
      total_minutes: 1080,
      calories_burned: 8640,
      current_streak: 5
    },
    recent_activities: [
      { date: '2025-10-10', type: 'Strength Training', duration: 45, calories: 360 },
      { date: '2025-10-09', type: 'Cardio', duration: 30, calories: 300 },
      { date: '2025-10-08', type: 'Full Body', duration: 50, calories: 400 }
    ]
  })
}

export const FitnessAgent: React.FC<FitnessAgentProps> = ({ onBackToServices }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'planner' | 'exercises' | 'goals' | 'health'>('dashboard')
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load dashboard data (using demo mode for now)
    const fetchData = async () => {
      try {
        setLoading(true)
        const data = demoMode.getDemoDashboardData()
        setDashboardData(data)
      } catch (err) {
        console.error('Error loading fitness data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBackToServices}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Services
            </button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              💪 Fitness Planner
            </h1>
            <div className="w-24"></div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Activity },
              { id: 'planner', label: 'Workout Planner', icon: Dumbbell },
              { id: 'exercises', label: 'Exercise Library', icon: Target },
              { id: 'health', label: 'Health Data', icon: Heart },
              { id: 'goals', label: 'Fitness Goals', icon: Award },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-orange-600 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && <FitnessDashboard data={dashboardData} />}
            {activeTab === 'planner' && <WorkoutPlannerTab />}
            {activeTab === 'exercises' && <ExerciseLibraryTab />}
            {activeTab === 'health' && <HealthDataTab />}
            {activeTab === 'goals' && <FitnessGoalsTab />}
          </>
        )}
      </div>
    </div>
  )
}

// Dashboard Component (Integrated from fitness frontend)
const FitnessDashboard = ({ data }: { data: any }) => {
  const stats = [
    { 
      label: 'Total Workouts', 
      value: data?.stats?.total_workouts || 0, 
      icon: Dumbbell, 
      color: 'from-orange-500 to-red-500',
      subtext: 'completed'
    },
    { 
      label: 'Total Minutes', 
      value: data?.stats?.total_minutes || 0, 
      icon: Clock, 
      color: 'from-red-500 to-pink-500',
      subtext: 'of training'
    },
    { 
      label: 'Calories Burned', 
      value: data?.stats?.calories_burned?.toLocaleString() || 0, 
      icon: Zap, 
      color: 'from-pink-500 to-purple-500',
      subtext: 'total'
    },
    { 
      label: 'Current Streak', 
      value: data?.stats?.current_streak || 0, 
      icon: Award, 
      color: 'from-purple-500 to-indigo-500',
      subtext: 'days'
    },
  ]

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.label}</h3>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.subtext}</p>
            </div>
          )
        })}
      </div>

      {/* Active Plan */}
      {data?.active_plan && (
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Active Workout Plan</h2>
            <span className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full text-sm font-medium">
              Active
            </span>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{data.active_plan.name}</h3>
              <p className="text-gray-600 mt-2">{data.active_plan.description}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                <p className="text-sm text-gray-600">Duration</p>
                <p className="text-xl font-bold text-gray-900">{data.active_plan.duration_weeks} weeks</p>
              </div>
              <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                <p className="text-sm text-gray-600">Sessions/Week</p>
                <p className="text-xl font-bold text-gray-900">{data.active_plan.sessions_per_week}</p>
              </div>
              <div className="p-4 bg-pink-50 rounded-xl border border-pink-200">
                <p className="text-sm text-gray-600">Difficulty</p>
                <p className="text-xl font-bold text-gray-900 capitalize">{data.active_plan.difficulty_level}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activities */}
      {data?.recent_activities && data.recent_activities.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activities</h2>
          <div className="space-y-4">
            {data.recent_activities.map((activity: any, index: number) => (
              <div key={`activity-${index}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{activity.type}</h3>
                    <p className="text-sm text-gray-600">{activity.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{activity.duration} min</p>
                  <p className="text-sm text-gray-600">{activity.calories} cal</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Workout Planner Component (Simplified version - will connect to backend)
const WorkoutPlannerTab = () => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Workout Planner</h2>
      <div className="space-y-6">
        <div className="p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
          <h3 className="font-bold text-gray-900 mb-4">Create Your Custom Workout Plan</h3>
          <p className="text-gray-600 mb-6">
            Design personalized workout routines based on your fitness level, available equipment, and goals.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <input
              type="text"
              placeholder="Plan Name"
              className="px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <select className="px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent">
              <option>Select Difficulty</option>
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>
          <button className="px-8 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 hover:scale-105">
            Generate Workout Plan
          </button>
        </div>
      </div>
    </div>
  )
}

// Exercise Library Component
const ExerciseLibraryTab = () => {
  const exercises = [
    { name: 'Push-ups', category: 'Chest', difficulty: 'Beginner', equipment: 'None' },
    { name: 'Squats', category: 'Legs', difficulty: 'Beginner', equipment: 'None' },
    { name: 'Plank', category: 'Core', difficulty: 'Intermediate', equipment: 'None' },
    { name: 'Deadlifts', category: 'Back', difficulty: 'Advanced', equipment: 'Barbell' },
    { name: 'Bench Press', category: 'Chest', difficulty: 'Intermediate', equipment: 'Barbell' },
    { name: 'Pull-ups', category: 'Back', difficulty: 'Advanced', equipment: 'Pull-up Bar' },
  ]

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Exercise Library</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exercises.map((exercise) => (
          <div key={exercise.name} className="p-6 border-2 border-gray-200 rounded-xl hover:shadow-md hover:border-orange-300 transition-all duration-300">
            <h3 className="font-bold text-gray-900 mb-3 text-lg">{exercise.name}</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Category:</span>
                <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">{exercise.category}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Difficulty:</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">{exercise.difficulty}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Equipment:</span>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">{exercise.equipment}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Health Data Tab
const HealthDataTab = () => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Health Data</h2>
      <div className="space-y-6">
        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
          <h3 className="font-bold text-gray-900 mb-4">Track Your Health Metrics</h3>
          <p className="text-gray-600 mb-6">
            Monitor your vital health data including weight, heart rate, sleep quality, and more.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-lg">
              <Heart className="w-6 h-6 text-red-500 mb-2" />
              <p className="text-sm text-gray-600">Heart Rate</p>
              <p className="text-2xl font-bold text-gray-900">72 <span className="text-sm text-gray-500">bpm</span></p>
            </div>
            <div className="p-4 bg-white rounded-lg">
              <Activity className="w-6 h-6 text-green-500 mb-2" />
              <p className="text-sm text-gray-600">Weight</p>
              <p className="text-2xl font-bold text-gray-900">75 <span className="text-sm text-gray-500">kg</span></p>
            </div>
            <div className="p-4 bg-white rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-500 mb-2" />
              <p className="text-sm text-gray-600">Progress</p>
              <p className="text-2xl font-bold text-gray-900">+5 <span className="text-sm text-gray-500">%</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Fitness Goals Component
const FitnessGoalsTab = () => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Fitness Goals</h2>
      <div className="space-y-6">
        <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
          <h3 className="font-bold text-gray-900 mb-4">Set Your Fitness Objectives</h3>
          <p className="text-gray-600 mb-6">
            Define clear, achievable goals to stay motivated on your fitness journey.
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-white rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3">
                <Award className="w-6 h-6 text-purple-600" />
                <div>
                  <p className="font-medium text-gray-900">Weight Loss Target</p>
                  <p className="text-sm text-gray-600">Lose 5 kg in 8 weeks</p>
                </div>
              </div>
              <span className="text-sm font-medium text-purple-600">60%</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-white rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3">
                <Target className="w-6 h-6 text-pink-600" />
                <div>
                  <p className="font-medium text-gray-900">Strength Building</p>
                  <p className="text-sm text-gray-600">Increase bench press by 20%</p>
                </div>
              </div>
              <span className="text-sm font-medium text-pink-600">45%</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-white rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
                <div>
                  <p className="font-medium text-gray-900">Endurance Improvement</p>
                  <p className="text-sm text-gray-600">Run 5K in under 25 minutes</p>
                </div>
              </div>
              <span className="text-sm font-medium text-indigo-600">75%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
