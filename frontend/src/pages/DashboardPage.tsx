import { useAuth } from '../auth/AuthContext'
import { useNavigate } from 'react-router-dom'
import { FaSignOutAlt, FaUser } from 'react-icons/fa'

export const DashboardPage = () => {
  const { userName, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const foodSummary = [
    { label: 'Calories', value: '2,150 kcal', color: 'bg-emerald-500' },
    { label: 'Protein', value: '120 g', color: 'bg-indigo-500' },
    { label: 'Carbs', value: '230 g', color: 'bg-orange-500' },
    { label: 'Fats', value: '65 g', color: 'bg-pink-500' },
  ]

  return (
    <div className="space-y-6">
      {/* Header with user info and logout */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center">
            <FaUser className="text-white" />
          </div>
          <h1 className="text-3xl font-bold">Welcome, {userName}</h1>
        </div>
        
        <button
          onClick={handleLogout}
          className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
        >
          <FaSignOutAlt className="w-4 h-4 mr-2" />
          Logout
        </button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {foodSummary.map((m, i) => (
          <div key={i} className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="text-sm text-gray-600">{m.label}</div>
            <div className="mt-2 text-2xl font-semibold">{m.value}</div>
            <div className={`mt-3 h-2 rounded-full ${m.color}`}></div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Today</h2>
        <ul className="mt-4 space-y-2 text-sm text-gray-700">
          <li>• Breakfast: Oats, berries, almonds</li>
          <li>• Lunch: Grilled chicken, quinoa, greens</li>
          <li>• Workout: 45 min upper-body strength</li>
        </ul>
      </div>
    </div>
  )
}


