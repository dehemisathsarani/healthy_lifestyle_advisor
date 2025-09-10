import { useState } from 'react'
import { Chatbot } from '../components/Chatbot'
import SimpleProfessionalCalendar from '../components/SimpleProfessionalCalendar'


const CalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const stats = [
    { label: 'Workouts This Month', value: '18', icon: '🏆', color: 'text-purple-600' },
    { label: 'Meals Tracked', value: '89', icon: '📅', color: 'text-green-600' },
    { label: 'Wellness Sessions', value: '12', icon: '📊', color: 'text-blue-600' },
    { label: 'Health Checkups', value: '3', icon: '⏰', color: 'text-red-600' }
  ]

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-100 to-cyan-100 rounded-full mb-4">
              <span className="text-2xl mr-2">📅</span>
              <span className="text-sm font-semibold text-gray-700">Health & Wellness Calendar</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Your Health Journey Calendar
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Plan, track, and optimize your health journey with our intelligent calendar system
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <span className={`text-2xl ${stat.color}`}>{stat.icon}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Selected Date</h2>
              <p className="text-gray-600">{selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <SimpleProfessionalCalendar onDateSelect={setSelectedDate} />
          </div>
        </div>
      </div>
      <Chatbot />
    </>
  )
}

export default CalendarPage
