import { useAuth } from '../auth/AuthContext'
import { HiCpuChip, HiPlay, HiCake, HiStop, HiHome, HiEyeDropper, HiCalendar, HiClock } from 'react-icons/hi2'
import { useEffect, useState } from 'react'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:8005'

interface NutritionData {
  label: string
  value: string
  unit: string
  color: string
  progress: number
}

interface MealData {
  type: string
  food: string
  calories: number
}

interface DayMeals {
  day: string
  meals: MealData[]
}

interface FitnessData {
  type: string
  hours: number
  sessions: number
  icon: any
  color: string
}

interface WorkoutSchedule {
  day: string
  workout: string
  duration: string
  intensity: string
  color: string
}

interface UserProfileData {
  name?: string
  email?: string
  age?: number
  weight?: number
  height?: number
  bmi?: number
  bmr?: number
  tdee?: number
  goal?: string
  activity_level?: string
}

export const ProfilePage = () => {
  const { profile, userName } = useAuth()
  const name = profile?.name || userName || 'User'
  const email = profile?.email || '—'
  
  // State for fetched data
  const [userProfileData, setUserProfileData] = useState<UserProfileData | null>(null)
  const [nutritionData, setNutritionData] = useState<NutritionData[]>([
    { label: 'Calories', value: '0', unit: 'kcal', color: 'bg-emerald-500', progress: 0 },
    { label: 'Protein', value: '0', unit: 'g', color: 'bg-indigo-500', progress: 0 },
    { label: 'Carbs', value: '0', unit: 'g', color: 'bg-orange-500', progress: 0 },
    { label: 'Fats', value: '0', unit: 'g', color: 'bg-pink-500', progress: 0 },
  ])
  const [weeklyMeals, setWeeklyMeals] = useState<DayMeals[]>([])
  const [fitnessData, setFitnessData] = useState<FitnessData[]>([
    { type: 'Strength Training', hours: 0, sessions: 0, icon: HiCpuChip, color: 'bg-purple-500' },
    { type: 'Cardio', hours: 0, sessions: 0, icon: HiPlay, color: 'bg-red-500' },
    { type: 'Flexibility', hours: 0, sessions: 0, icon: HiStop, color: 'bg-blue-500' },
  ])
  const [workoutSchedule, setWorkoutSchedule] = useState<WorkoutSchedule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfileData()
  }, [profile, userName])

  const fetchProfileData = async () => {
    try {
      setLoading(true)
      const userId = (profile as any)?.sub || userName || 'pasindu' // Use actual user ID or fallback

      // Fetch user profile from diet agent
      try {
        const profileResponse = await axios.get(`${API_BASE_URL}/api/diet/profile/${userId}`)
        if (profileResponse.data.success) {
          setUserProfileData(profileResponse.data.data)
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      }

      // Fetch daily nutrition summary
      try {
        const today = new Date().toISOString().split('T')[0]
        const nutritionResponse = await axios.get(`${API_BASE_URL}/api/diet/daily-summary/${userId}?date=${today}`)
        if (nutritionResponse.data.success) {
          const summary = nutritionResponse.data.data
          setNutritionData([
            { 
              label: 'Calories', 
              value: Math.round(summary.total_calories || 0).toLocaleString(), 
              unit: 'kcal', 
              color: 'bg-emerald-500', 
              progress: Math.min(100, (summary.total_calories / (userProfileData?.tdee || 2000)) * 100) 
            },
            { 
              label: 'Protein', 
              value: Math.round(summary.total_protein || 0).toString(), 
              unit: 'g', 
              color: 'bg-indigo-500', 
              progress: Math.min(100, (summary.total_protein / 150) * 100) 
            },
            { 
              label: 'Carbs', 
              value: Math.round(summary.total_carbs || 0).toString(), 
              unit: 'g', 
              color: 'bg-orange-500', 
              progress: Math.min(100, (summary.total_carbs / 250) * 100) 
            },
            { 
              label: 'Fats', 
              value: Math.round(summary.total_fat || 0).toString(), 
              unit: 'g', 
              color: 'bg-pink-500', 
              progress: Math.min(100, (summary.total_fat / 70) * 100) 
            },
          ])
        }
      } catch (error) {
        console.error('Error fetching nutrition data:', error)
      }

      // Fetch meal history for weekly meal plan
      try {
        const mealHistoryResponse = await axios.get(`${API_BASE_URL}/api/diet/meal-history/${userId}?limit=21`)
        if (mealHistoryResponse.data.success) {
          const meals = mealHistoryResponse.data.data
          // Group meals by day
          const groupedMeals = groupMealsByDay(meals)
          setWeeklyMeals(groupedMeals)
        }
      } catch (error) {
        console.error('Error fetching meal history:', error)
      }

      // Set default workout schedule if no data available
      setWorkoutSchedule([
        { day: 'Mon', workout: 'Upper Body Strength', duration: '45 min', intensity: 'High', color: 'bg-purple-100 text-purple-800' },
        { day: 'Tue', workout: 'HIIT Cardio', duration: '30 min', intensity: 'High', color: 'bg-red-100 text-red-800' },
        { day: 'Wed', workout: 'Lower Body Strength', duration: '50 min', intensity: 'High', color: 'bg-purple-100 text-purple-800' },
        { day: 'Thu', workout: 'Yoga Flow', duration: '40 min', intensity: 'Low', color: 'bg-blue-100 text-blue-800' },
        { day: 'Fri', workout: 'Full Body Circuit', duration: '35 min', intensity: 'Medium', color: 'bg-orange-100 text-orange-800' },
        { day: 'Sat', workout: 'Active Recovery', duration: '20 min', intensity: 'Low', color: 'bg-green-100 text-green-800' },
        { day: 'Sun', workout: 'Rest Day', duration: '—', intensity: 'Rest', color: 'bg-gray-100 text-gray-800' },
      ])

    } catch (error) {
      console.error('Error fetching profile data:', error)
    } finally {
      setLoading(false)
    }
  }

  const groupMealsByDay = (meals: any[]): DayMeals[] => {
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const grouped: DayMeals[] = []

    // Get last 7 days of meals
    const mealsByDate: { [key: string]: any[] } = {}
    meals.forEach(meal => {
      const date = meal.created_at ? new Date(meal.created_at).toLocaleDateString() : new Date().toLocaleDateString()
      if (!mealsByDate[date]) {
        mealsByDate[date] = []
      }
      mealsByDate[date].push(meal)
    })

    // Convert to day-based structure (show last 3 days)
    const dates = Object.keys(mealsByDate).slice(0, 3)
    dates.forEach((date, index) => {
      const dayMeals = mealsByDate[date]
      const dayData: DayMeals = {
        day: daysOfWeek[new Date(date).getDay()] || daysOfWeek[index],
        meals: dayMeals.slice(0, 3).map(meal => ({
          type: meal.meal_type || 'Meal',
          food: meal.food_items?.map((item: any) => item.name).join(', ') || meal.food_description || 'Food',
          calories: Math.round(meal.total_calories || 0)
        }))
      }
      grouped.push(dayData)
    })

    return grouped
  }

  const getBMIStatus = (bmi?: number): string => {
    if (!bmi) return 'Not set'
    if (bmi < 18.5) return 'Underweight'
    if (bmi < 25) return 'Normal'
    if (bmi < 30) return 'Overweight'
    return 'Obese'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand via-emerald-500 to-sky-500 p-8 text-white shadow-xl">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-72 w-72 rounded-full bg-black/10 blur-3xl" />
        <div className="relative">
          <h1 className="text-4xl font-bold">{userProfileData?.name || name}</h1>
          <p className="text-emerald-50">{userProfileData?.email || email}</p>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl bg-white/15 p-4 text-center backdrop-blur">
              <div className="text-2xl font-semibold">{userProfileData?.age ? `${userProfileData.age} years` : (profile?.age ? `${profile.age} years` : 'Not set')}</div>
              <div className="text-xs uppercase tracking-wide text-emerald-50">Age</div>
            </div>
            <div className="rounded-xl bg-white/15 p-4 text-center backdrop-blur">
              <div className="text-lg font-semibold">{userProfileData?.bmi ? userProfileData.bmi.toFixed(1) : 'Not set'}</div>
              <div className="text-xs uppercase tracking-wide text-emerald-50">BMI</div>
            </div>
            <div className="rounded-xl bg-white/15 p-4 text-center backdrop-blur">
              <div className="text-lg font-semibold">{userProfileData?.weight ? `${userProfileData.weight} kg` : 'Not set'}</div>
              <div className="text-xs uppercase tracking-wide text-emerald-50">Weight</div>
            </div>
            <div className="rounded-xl bg-white/15 p-4 text-center backdrop-blur">
              <div className="text-lg font-semibold">{userProfileData?.goal || 'Balanced'}</div>
              <div className="text-xs uppercase tracking-wide text-emerald-50">Goal</div>
            </div>
          </div>
        </div>
      </section>

      {/* Nutrition Tracking */}
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <HiCake className="text-2xl text-emerald-500" />
          <h2 className="text-2xl font-bold">Nutrition Tracking</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {nutritionData.map((item) => (
            <div key={item.label} className="rounded-xl border p-4 text-center">
              <div className="text-sm text-gray-600">{item.label}</div>
              <div className="mt-1 text-2xl font-bold">{item.value}</div>
              <div className="text-sm text-gray-500">{item.unit}</div>
              <div className="mt-2 h-2 rounded-full bg-gray-200">
                <div 
                  className={`h-2 rounded-full ${item.color} transition-all duration-500`}
                  style={{ width: `${item.progress}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Weekly Meal Plan */}
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <HiCalendar className="text-2xl text-orange-500" />
          <h2 className="text-2xl font-bold">Recent Meal History</h2>
        </div>
        {weeklyMeals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {weeklyMeals.map((day, index) => (
              <div key={`${day.day}-${index}`} className="rounded-xl border p-4">
                <h3 className="text-lg font-semibold text-center mb-4 text-brand">{day.day}</h3>
                <div className="space-y-3">
                  {day.meals.map((meal, mealIndex) => (
                    <div key={`${meal.type}-${mealIndex}`} className="rounded-lg bg-gray-50 p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{meal.type}</div>
                          <div className="text-sm text-gray-600 truncate" title={meal.food}>{meal.food}</div>
                        </div>
                        <div className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded ml-2 whitespace-nowrap">
                          {meal.calories} cal
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <HiCake className="text-4xl text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">No meal data available yet</p>
            <p className="text-sm text-gray-500">Start logging your meals to see them here!</p>
          </div>
        )}
      </section>

      {/* Fitness Overview */}
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <HiCpuChip className="text-2xl text-purple-500" />
          <h2 className="text-2xl font-bold">Fitness Overview</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {fitnessData.map((item) => (
            <div key={item.type} className="rounded-xl border p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${item.color} text-white`}>
                  <item.icon className="text-lg" />
                </div>
                <div>
                  <div className="font-semibold">{item.type}</div>
                  <div className="text-sm text-gray-600">{item.sessions} sessions</div>
                </div>
              </div>
              <div className="text-2xl font-bold">{item.hours}h</div>
              <div className="text-sm text-gray-500">This week</div>
            </div>
          ))}
        </div>
      </section>

      {/* Weekly Workout Schedule */}
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <HiClock className="text-2xl text-blue-500" />
          <h2 className="text-2xl font-bold">Weekly Schedule</h2>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {workoutSchedule.map((day) => (
            <div key={day.day} className="text-center">
              <div className="text-sm font-medium text-gray-600 mb-2">{day.day}</div>
              <div className={`rounded-lg p-3 ${day.color}`}>
                <div className="text-xs font-medium mb-1">{day.workout}</div>
                <div className="text-xs text-gray-600">{day.duration}</div>
                <div className="text-xs mt-1">{day.intensity}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Health Metrics */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <HiHome className="text-2xl text-indigo-500" />
            <h3 className="text-xl font-bold">Metabolic Information</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">BMR (Basal Metabolic Rate)</span>
              <span className="font-semibold">{userProfileData?.bmr ? `${Math.round(userProfileData.bmr)} kcal` : 'Not set'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">TDEE (Daily Energy)</span>
              <span className="font-semibold">{userProfileData?.tdee ? `${Math.round(userProfileData.tdee)} kcal` : 'Not set'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Activity Level</span>
              <span className="font-semibold capitalize">{userProfileData?.activity_level?.replace('_', ' ') || 'Not set'}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <HiEyeDropper className="text-2xl text-blue-500" />
            <h3 className="text-xl font-bold">Body Metrics</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Height</span>
              <span className="font-semibold">{userProfileData?.height ? `${userProfileData.height} cm` : 'Not set'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Weight</span>
              <span className="font-semibold">{userProfileData?.weight ? `${userProfileData.weight} kg` : 'Not set'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">BMI Status</span>
              <span className="font-semibold">{getBMIStatus(userProfileData?.bmi)}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}


