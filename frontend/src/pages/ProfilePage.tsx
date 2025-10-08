import { useAuth } from '../auth/AuthContext'
import { HiCpuChip, HiPlay, HiCake, HiStop, HiHome, HiEyeDropper, HiCalendar, HiClock } from 'react-icons/hi2'

export const ProfilePage = () => {
  const { profile, userName } = useAuth()
  const name = profile?.name || userName || 'User'
  const email = profile?.email || '—'
  
  // Debug: Log profile data to see what's available
  console.log('Profile data:', profile)

  // Nutrition tracking data
  const nutritionData = [
    { label: 'Calories', value: '2,150', unit: 'kcal', color: 'bg-emerald-500', progress: 85 },
    { label: 'Protein', value: '120', unit: 'g', color: 'bg-indigo-500', progress: 90 },
    { label: 'Carbs', value: '230', unit: 'g', color: 'bg-orange-500', progress: 75 },
    { label: 'Fats', value: '65', unit: 'g', color: 'bg-pink-500', progress: 60 },
  ]

  // Weekly meal plan
  const weeklyMeals = [
    {
      day: 'Monday',
      meals: [
        { type: 'Breakfast', food: 'Oats + berries + almonds', calories: 320 },
        { type: 'Lunch', food: 'Chicken + quinoa + greens', calories: 450 },
        { type: 'Dinner', food: 'Salmon + sweet potato + broccoli', calories: 520 },
      ]
    },
    {
      day: 'Tuesday',
      meals: [
        { type: 'Breakfast', food: 'Greek yogurt + honey + granola', calories: 280 },
        { type: 'Lunch', food: 'Turkey wrap + avocado', calories: 380 },
        { type: 'Dinner', food: 'Lean beef + brown rice + vegetables', calories: 480 },
      ]
    },
    {
      day: 'Wednesday',
      meals: [
        { type: 'Breakfast', food: 'Smoothie bowl + chia seeds', calories: 290 },
        { type: 'Lunch', food: 'Tuna salad + whole grain bread', calories: 420 },
        { type: 'Dinner', food: 'Grilled chicken + sweet potato + asparagus', calories: 460 },
      ]
    }
  ]

  // Fitness tracking
  const fitnessData = [
    { type: 'Strength Training', hours: 4.5, sessions: 3, icon: HiCpuChip, color: 'bg-purple-500' },
    { type: 'Cardio', hours: 3.2, sessions: 4, icon: HiPlay, color: 'bg-red-500' },
    { type: 'Flexibility', hours: 2.1, sessions: 5, icon: HiStop, color: 'bg-blue-500' },
  ]

  // Weekly workout schedule
  const workoutSchedule = [
    { day: 'Mon', workout: 'Upper Body Strength', duration: '45 min', intensity: 'High', color: 'bg-purple-100 text-purple-800' },
    { day: 'Tue', workout: 'HIIT Cardio', duration: '30 min', intensity: 'High', color: 'bg-red-100 text-red-800' },
    { day: 'Wed', workout: 'Lower Body Strength', duration: '50 min', intensity: 'High', color: 'bg-purple-100 text-purple-800' },
    { day: 'Thu', workout: 'Yoga Flow', duration: '40 min', intensity: 'Low', color: 'bg-blue-100 text-blue-800' },
    { day: 'Fri', workout: 'Full Body Circuit', duration: '35 min', intensity: 'Medium', color: 'bg-orange-100 text-orange-800' },
    { day: 'Sat', workout: 'Active Recovery', duration: '20 min', intensity: 'Low', color: 'bg-green-100 text-green-800' },
    { day: 'Sun', workout: 'Rest Day', duration: '—', intensity: 'Rest', color: 'bg-gray-100 text-gray-800' },
  ]

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand via-emerald-500 to-sky-500 p-8 text-white shadow-xl">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-72 w-72 rounded-full bg-black/10 blur-3xl" />
        <div className="relative">
          <h1 className="text-4xl font-bold">{name}</h1>
          <p className="text-emerald-50">{email}</p>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl bg-white/15 p-4 text-center backdrop-blur">
              <div className="text-2xl font-semibold">{profile?.age ? `${profile.age} years` : 'Not set'}</div>
              <div className="text-xs uppercase tracking-wide text-emerald-50">Age</div>
            </div>
            <div className="rounded-xl bg-white/15 p-4 text-center backdrop-blur">
              <div className="text-lg font-semibold">{profile?.country || 'Not set'}</div>
              <div className="text-xs uppercase tracking-wide text-emerald-50">Country</div>
            </div>
            <div className="rounded-xl bg-white/15 p-4 text-center backdrop-blur">
              <div className="text-lg font-semibold">{profile?.mobile || 'Not set'}</div>
              <div className="text-xs uppercase tracking-wide text-emerald-50">Mobile</div>
            </div>
            <div className="rounded-xl bg-white/15 p-4 text-center backdrop-blur">
              <div className="text-lg font-semibold">Balanced</div>
              <div className="text-xs uppercase tracking-wide text-emerald-50">Diet Type</div>
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
          <h2 className="text-2xl font-bold">Weekly Meal Plan</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {weeklyMeals.map((day) => (
            <div key={day.day} className="rounded-xl border p-4">
              <h3 className="text-lg font-semibold text-center mb-4 text-brand">{day.day}</h3>
              <div className="space-y-3">
                {day.meals.map((meal) => (
                  <div key={meal.type} className="rounded-lg bg-gray-50 p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-sm">{meal.type}</div>
                        <div className="text-sm text-gray-600">{meal.food}</div>
                      </div>
                      <div className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded">
                        {meal.calories} cal
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
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
            <h3 className="text-xl font-bold">Sleep & Recovery</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Sleep Quality</span>
              <span className="font-semibold">8.2/10</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Hours Slept</span>
              <span className="font-semibold">7.5h</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Recovery Score</span>
              <span className="font-semibold">85%</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <HiEyeDropper className="text-2xl text-blue-500" />
            <h3 className="text-xl font-bold">Hydration & Wellness</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Water Intake</span>
              <span className="font-semibold">2.3L / 3L</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Steps Today</span>
              <span className="font-semibold">8,450</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Mindfulness</span>
              <span className="font-semibold">15 min</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}


