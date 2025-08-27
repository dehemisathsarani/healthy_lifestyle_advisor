import React, { useState } from 'react'

interface CalendarEvent {
  id: string
  date: Date
  title: string
  type: 'meal' | 'workout' | 'wellness' | 'health' | 'personal' | 'appointment' | 'reminder'
  description?: string
  time?: string
  duration?: string
  priority?: 'low' | 'medium' | 'high'
  completed?: boolean
  category?: string
  color?: string
}

interface SimpleProfessionalCalendarProps {
  onDateSelect?: (date: Date) => void
  events?: CalendarEvent[]
  compact?: boolean
  onAddEvent?: (event: CalendarEvent) => void
}

const SimpleProfessionalCalendar: React.FC<SimpleProfessionalCalendarProps> = ({ 
  onDateSelect, 
  events = [], 
  compact = false,
  onAddEvent
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [showEventModal, setShowEventModal] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '',
    type: 'personal' as CalendarEvent['type'],
    time: '',
    duration: '',
    description: '',
    priority: 'medium' as CalendarEvent['priority']
  })

  const sampleEvents: CalendarEvent[] = [
    {
      id: '1',
      date: new Date(),
      title: 'Morning Workout',
      type: 'workout',
      description: 'Upper body strength training',
      time: '07:00',
      duration: '45 min',
      priority: 'high',
      completed: true,
      color: 'bg-purple-100 text-purple-800'
    },
    {
      id: '2',
      date: new Date(),
      title: 'Protein Smoothie',
      type: 'meal',
      description: 'Post-workout nutrition',
      time: '08:30',
      duration: '10 min',
      priority: 'medium',
      completed: true,
      color: 'bg-green-100 text-green-800'
    },
    {
      id: '3',
      date: new Date(new Date().setDate(new Date().getDate() + 1)),
      title: 'Doctor Appointment',
      type: 'appointment',
      description: 'Annual health checkup',
      time: '14:00',
      duration: '60 min',
      priority: 'high',
      color: 'bg-red-100 text-red-800'
    },
    {
      id: '4',
      date: new Date(new Date().setDate(new Date().getDate() + 2)),
      title: 'Meditation Session',
      type: 'wellness',
      description: 'Mindfulness practice',
      time: '19:00',
      duration: '30 min',
      priority: 'medium',
      color: 'bg-blue-100 text-blue-800'
    }
  ]

  const allEvents = [...events, ...sampleEvents]

  const getEventIcon = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'meal': return '🍎'
      case 'workout': return '💪'
      case 'wellness': return '🧘'
      case 'health': return '❤️'
      case 'personal': return '👤'
      case 'appointment': return '🏥'
      case 'reminder': return '⏰'
      default: return '📅'
    }
  }

  const getEventColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'meal': return 'bg-green-100 text-green-800'
      case 'workout': return 'bg-purple-100 text-purple-800'
      case 'wellness': return 'bg-blue-100 text-blue-800'
      case 'health': return 'bg-red-100 text-red-800'
      case 'personal': return 'bg-yellow-100 text-yellow-800'
      case 'appointment': return 'bg-indigo-100 text-indigo-800'
      case 'reminder': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    if (onDateSelect) {
      onDateSelect(date)
    }
  }

  const handleAddEvent = () => {
    const event: CalendarEvent = {
      id: Date.now().toString(),
      date: selectedDate,
      title: newEvent.title,
      type: newEvent.type,
      time: newEvent.time,
      duration: newEvent.duration,
      description: newEvent.description,
      priority: newEvent.priority,
      completed: false,
      color: getEventColor(newEvent.type)
    }
    
    if (onAddEvent) {
      onAddEvent(event)
    }
    
    setShowEventModal(false)
    setNewEvent({
      title: '',
      type: 'personal',
      time: '',
      duration: '',
      description: '',
      priority: 'medium'
    })
  }

  const getTodaysEvents = () => {
    return allEvents.filter(event =>
      event.date.toDateString() === new Date().toDateString()
    ).sort((a, b) => (a.time || '').localeCompare(b.time || ''))
  }

  const getEventsForDate = (date: Date) => {
    return allEvents.filter(event =>
      event.date.toDateString() === date.toDateString()
    )
  }

  const getCurrentMonth = () => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    return months[new Date().getMonth()]
  }

  const getCurrentYear = () => {
    return new Date().getFullYear()
  }

  const getDaysInMonth = () => {
    const year = getCurrentYear()
    const month = new Date().getMonth()
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = () => {
    const year = getCurrentYear()
    const month = new Date().getMonth()
    return new Date(year, month, 1).getDay()
  }

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth()
    const firstDay = getFirstDayOfMonth()
    const days = []
    
    // Empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>)
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(getCurrentYear(), new Date().getMonth(), day)
      const eventsForDay = getEventsForDate(date)
      const isToday = date.toDateString() === new Date().toDateString()
      const isSelected = date.toDateString() === selectedDate.toDateString()
      
      days.push(
        <div
          key={day}
          onClick={() => handleDateClick(date)}
          className={`h-10 flex items-center justify-center cursor-pointer relative group transition-all duration-200 ${
            isToday 
              ? 'bg-emerald-500 text-white rounded-lg font-semibold shadow-sm' 
              : isSelected
              ? 'bg-emerald-100 text-emerald-800 rounded-lg font-medium'
              : eventsForDay.length > 0
              ? 'bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100'
              : 'text-gray-700 hover:bg-gray-100 rounded-lg'
          }`}
        >
          <span>{day}</span>
          {eventsForDay.length > 0 && !isToday && (
            <div className="absolute bottom-0.5 right-0.5 w-2 h-2 bg-blue-500 rounded-full"></div>
          )}
          {eventsForDay.length > 1 && (
            <div className="absolute top-0.5 right-0.5 text-xs bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
              {eventsForDay.length}
            </div>
          )}
        </div>
      )
    }
    
    return days
  }

  if (compact) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-8 h-8 bg-emerald-500 rounded-lg mr-3">
              <span className="text-white text-sm">📅</span>
            </div>
            <h3 className="font-semibold text-gray-900">Today's Schedule</h3>
          </div>
          <button
            onClick={() => setShowEventModal(true)}
            className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
          >
            + Add Event
          </button>
        </div>
        <div className="space-y-2">
          {getTodaysEvents().length > 0 ? (
            getTodaysEvents().map((event) => (
              <div key={event.id} className={`p-2 rounded-lg text-sm ${event.color || getEventColor(event.type)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="mr-2">{getEventIcon(event.type)}</span>
                    <span className="font-medium">{event.title}</span>
                  </div>
                  <span className="text-xs opacity-75">{event.time}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm">No events scheduled for today</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Full Calendar View */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{getCurrentMonth()} {getCurrentYear()}</h2>
            <p className="text-gray-600">Plan and track your health journey</p>
          </div>
          <button
            onClick={() => setShowEventModal(true)}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition-colors duration-200 flex items-center"
          >
            <span className="mr-2">+</span>
            Add Event
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {renderCalendarDays()}
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4">
          <div className="flex items-center text-sm">
            <div className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></div>
            <span className="text-gray-600">Today</span>
          </div>
          <div className="flex items-center text-sm">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-gray-600">Has Events</span>
          </div>
          <div className="flex items-center text-sm">
            <div className="w-3 h-3 bg-emerald-100 border border-emerald-300 rounded-full mr-2"></div>
            <span className="text-gray-600">Selected</span>
          </div>
        </div>
      </div>

      {/* Events for Selected Date */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Events for {selectedDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </h3>
        <div className="space-y-3">
          {getEventsForDate(selectedDate).length > 0 ? (
            getEventsForDate(selectedDate).map((event) => (
              <div key={event.id} className={`p-4 rounded-lg ${event.color || getEventColor(event.type)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    <span className="text-xl mr-3">{getEventIcon(event.type)}</span>
                    <div>
                      <h4 className="font-semibold">{event.title}</h4>
                      {event.description && (
                        <p className="text-sm opacity-75 mt-1">{event.description}</p>
                      )}
                      <div className="flex items-center text-sm opacity-75 mt-2">
                        {event.time && <span className="mr-4">⏰ {event.time}</span>}
                        {event.duration && <span>⏱️ {event.duration}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {event.priority === 'high' && <span className="text-red-500 text-sm">🔴</span>}
                    {event.priority === 'medium' && <span className="text-yellow-500 text-sm">🟡</span>}
                    {event.priority === 'low' && <span className="text-green-500 text-sm">🟢</span>}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <span className="text-4xl mb-4 block">📅</span>
              <p className="text-gray-500">No events scheduled for this date</p>
              <button
                onClick={() => setShowEventModal(true)}
                className="mt-2 text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Add an event
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Event</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Title</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Enter event title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({...newEvent, type: e.target.value as CalendarEvent['type']})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="personal">👤 Personal</option>
                  <option value="workout">💪 Workout</option>
                  <option value="meal">🍎 Meal</option>
                  <option value="wellness">🧘 Wellness</option>
                  <option value="health">❤️ Health</option>
                  <option value="appointment">🏥 Appointment</option>
                  <option value="reminder">⏰ Reminder</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                  <input
                    type="time"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                  <input
                    type="text"
                    value={newEvent.duration}
                    onChange={(e) => setNewEvent({...newEvent, duration: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="e.g., 30 min"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={newEvent.priority}
                  onChange={(e) => setNewEvent({...newEvent, priority: e.target.value as CalendarEvent['priority']})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="low">🟢 Low</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="high">🔴 High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  rows={3}
                  placeholder="Optional description"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEventModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEvent}
                disabled={!newEvent.title}
                className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SimpleProfessionalCalendar
