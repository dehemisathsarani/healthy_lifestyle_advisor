import { useAuth } from '../auth/AuthContext'
import { useNavigate } from 'react-router-dom'
import { HiArrowRightOnRectangle, HiUser, HiCake, HiStar, HiStop, HiCalendar, HiPresentationChartLine, HiCpuChip, HiAcademicCap } from 'react-icons/hi2'
import { useState, useEffect } from 'react'

export const DashboardPage = () => {
  const { userName, logout } = useAuth()
  const navigate = useNavigate()
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const nutritionData = [
    { 
      label: 'Calories', 
      value: '2,150', 
      unit: 'kcal', 
      target: '2,500',
      percentage: 86,
      color: 'from-orange-400 to-red-500',
      icon: HiStar,
      bgColor: 'bg-gradient-to-br from-orange-50 to-red-50'
    },
    { 
      label: 'Protein', 
      value: '120', 
      unit: 'g', 
      target: '150',
      percentage: 80,
      color: 'from-blue-400 to-indigo-500',
      icon: HiCpuChip,
      bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-50'
    },
    { 
      label: 'Carbs', 
      value: '230', 
      unit: 'g', 
      target: '300',
      percentage: 77,
      color: 'from-green-400 to-emerald-500',
      icon: HiCake,
      bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50'
    },
    { 
      label: 'Fats', 
      value: '65', 
      unit: 'g', 
      target: '80',
      percentage: 81,
      color: 'from-purple-400 to-pink-500',
      icon: HiStop,
      bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50'
    },
  ]

  const achievements = [
    { title: '7-Day Streak', icon: '🔥', count: 7 },
    { title: 'Meals Logged', icon: '🍽️', count: 42 },
    { title: 'Workouts', icon: '💪', count: 15 },
    { title: 'Goals Met', icon: '🎯', count: 23 },
  ]

  const todayActivities = [
    { time: '08:00', activity: 'Breakfast: Oats, berries, almonds', type: 'meal', icon: '🌅' },
    { time: '10:30', activity: '30-min morning walk', type: 'exercise', icon: '🚶' },
    { time: '12:30', activity: 'Lunch: Grilled chicken, quinoa, greens', type: 'meal', icon: '☀️' },
    { time: '15:00', activity: 'Hydration reminder - 2L goal', type: 'hydration', icon: '💧' },
    { time: '18:00', activity: '45-min upper body workout', type: 'exercise', icon: '💪' },
    { time: '19:30', activity: 'Dinner: Salmon, sweet potato, vegetables', type: 'meal', icon: '🌙' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="space-y-8 p-6 max-w-7xl mx-auto">
        {/* Modern Header with time and user info */}
        <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/50">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                <HiUser className="text-white text-xl" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Welcome back, {userName}
              </h1>
              <p className="text-gray-600 font-medium">
                {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
              <p className="text-sm text-gray-500">
                {currentTime.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/services')}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-2xl hover:from-emerald-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
            >
              <HiAcademicCap className="w-4 h-4 mr-2" />
              Health Services
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-2xl hover:from-red-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
            >
              <HiArrowRightOnRectangle className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </div>

        {/* Achievement Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {achievements.map((achievement, i) => (
            <div key={i} className="group relative bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="text-center">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  {achievement.icon}
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-2">
                  {achievement.count}
                </div>
                <div className="text-sm font-medium text-gray-600">{achievement.title}</div>
              </div>
              {/* Animated border */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500 to-blue-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </div>
          ))}
        </div>

        {/* Nutrition Progress Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {nutritionData.map((macro, i) => {
            const IconComponent = macro.icon
            return (
              <div key={i} className={`group relative ${macro.bgColor} rounded-3xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 hover:scale-105`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 bg-gradient-to-r ${macro.color} rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="text-white text-xl" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-800">{macro.value}</div>
                    <div className="text-sm text-gray-600">{macro.unit}</div>
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>{macro.label}</span>
                    <span>{macro.percentage}%</span>
                  </div>
                  <div className="w-full bg-white/70 rounded-full h-3 shadow-inner">
                    <div 
                      className={`h-3 bg-gradient-to-r ${macro.color} rounded-full transition-all duration-1000 ease-out relative overflow-hidden`}
                      style={{ width: `${macro.percentage}%` }}
                    >
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                    </div>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 text-center">
                  Target: {macro.target} {macro.unit}
                </div>
              </div>
            )
          })}
        </div>

        {/* Today's Activity Timeline */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/50">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl shadow-lg">
                <HiCalendar className="text-white text-xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Today's Schedule</h2>
                <p className="text-gray-600">Track your daily health activities</p>
              </div>
            </div>
            <button className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-2xl hover:from-emerald-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold">
              <HiPresentationChartLine className="w-4 h-4 mr-2 inline" />
              View Analytics
            </button>
          </div>
          
          <div className="space-y-4">
            {todayActivities.map((activity, index) => (
              <div key={index} className="group flex items-center p-4 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-100 hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-emerald-100 to-blue-100 rounded-xl mr-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-xl">{activity.icon}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-800 group-hover:text-emerald-600 transition-colors duration-300">
                      {activity.activity}
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        {activity.time}
                      </span>
                      <div className={`w-3 h-3 rounded-full ${
                        activity.type === 'meal' ? 'bg-green-400' :
                        activity.type === 'exercise' ? 'bg-purple-400' :
                        'bg-blue-400'
                      }`}></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button 
            onClick={() => navigate('/services')}
            className="group bg-gradient-to-br from-emerald-400 to-emerald-600 text-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <div className="text-center">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">🥗</div>
              <h3 className="text-xl font-bold mb-2">Nutrition Tracking</h3>
              <p className="text-emerald-100">Log meals and track nutrition</p>
            </div>
          </button>
          
          <button 
            onClick={() => navigate('/services')}
            className="group bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <div className="text-center">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">💪</div>
              <h3 className="text-xl font-bold mb-2">Fitness Plans</h3>
              <p className="text-blue-100">Custom workout routines</p>
            </div>
          </button>
          
          <button 
            onClick={() => navigate('/services')}
            className="group bg-gradient-to-br from-purple-400 to-purple-600 text-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <div className="text-center">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">🧠</div>
              <h3 className="text-xl font-bold mb-2">Mental Wellness</h3>
              <p className="text-purple-100">Mindfulness & mood tracking</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}


