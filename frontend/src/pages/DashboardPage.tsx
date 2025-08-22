import { useAuth } from '../auth/AuthContext'

export const DashboardPage = () => {
  const { userName } = useAuth()

  const foodSummary = [
    { label: 'Calories', value: '2,150 kcal', color: 'bg-emerald-500' },
    { label: 'Protein', value: '120 g', color: 'bg-indigo-500' },
    { label: 'Carbs', value: '230 g', color: 'bg-orange-500' },
    { label: 'Fats', value: '65 g', color: 'bg-pink-500' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Welcome, {userName}</h1>
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


