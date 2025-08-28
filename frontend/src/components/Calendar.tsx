import React, { useState } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { 
  FaCalendarAlt, 
  FaPlus, 
  FaAppleAlt, 
  FaDumbbell, 
  FaBrain, 
  FaCheckCircle
} from 'react-icons/fa'

type EventType = 'meal' | 'workout' | 'wellness' | 'health'

interface CalendarEvent {
  id: string
  date: Date
  title: string
  type: EventType
  description?: string
  time?: string
}

interface CalendarProps {
  onDateSelect?: (date: Date) => void
  events?: CalendarEvent[]
  compact?: boolean
}

export const Calendar: React.FC<CalendarProps> = ({ 
  onDateSelect, 
  events = [], 
  compact = false 
}) => {
  const [selected, setSelected] = useState<Date>()
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [selectedDateEvents, setSelectedDateEvents] = useState<CalendarEvent[]>([])

  // Sample events for demonstration
  const sampleEvents: CalendarEvent[] = [
    {
      id: '1',
      date: new Date(),
      title: 'Morning Workout',
      type: 'workout',
      description: 'Upper body strength training',
      time: '07:00'
    },
    {
      id: '2',
      date: new Date(),
      title: 'Healthy Lunch',
      type: 'meal',
      description: 'Grilled chicken with quinoa',
      time: '12:30'
    },
    {
      id: '3',
      date: new Date(Date.now() + 86400000), // Tomorrow
      title: 'Meditation Session',
      type: 'wellness',
      description: '15 minutes mindfulness',
      time: '19:00'
    },
    {
      id: '4',
      date: new Date(Date.now() + 2 * 86400000), // Day after tomorrow
      title: 'Health Checkup',
      type: 'health',
      description: 'Regular health monitoring',
      time: '10:00'
    }
  ]

  const allEvents = [...events, ...sampleEvents]

  const handleDayClick = (date: Date) => {
    setSelected(date)
    onDateSelect?.(date)
    
    // Filter events for selected date
    const dayEvents = allEvents.filter(event => 
      event.date.toDateString() === date.toDateString()
    )
    setSelectedDateEvents(dayEvents)
  }

  const getEventTypeIcon = (type: EventType) => {
    switch (type) {
      case 'meal': return <FaAppleAlt className="text-green-500" />
      case 'workout': return <FaDumbbell className="text-purple-500" />
      case 'wellness': return <FaBrain className="text-blue-500" />
      case 'health': return <FaCheckCircle className="text-red-500" />
      default: return <FaCalendarAlt className="text-gray-500" />
    }
  }

  const getEventTypeColor = (type: EventType) => {
    switch (type) {
      case 'meal': return 'bg-green-100 text-green-800 border-green-200'
      case 'workout': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'wellness': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'health': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Check if a date has events (for future use)
  // const hasEvents = (date: Date) => {
  //   return allEvents.some(event => 
  //     event.date.toDateString() === date.toDateString()
  //   )
  // }

  // Custom day content renderer to show event indicators
  const renderDay = ({ day }: { day: { date: Date } }) => {
    const dayEvents = allEvents.filter(event => 
      event.date.toDateString() === day.date.toDateString()
    )
    
    return (
      <div className="relative">
        <span>{day.date.getDate()}</span>
        {dayEvents.length > 0 && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex space-x-0.5">
            {dayEvents.slice(0, 3).map((event, idx) => (
              <div 
                key={idx}
                className={`w-1.5 h-1.5 rounded-full ${
                  event.type === 'meal' ? 'bg-green-500' :
                  event.type === 'workout' ? 'bg-purple-500' :
                  event.type === 'wellness' ? 'bg-blue-500' : 'bg-red-500'
                }`}
              />
            ))}
            {dayEvents.length > 3 && (
              <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            )}
          </div>
        )}
      </div>
    )
  }

  if (compact) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <FaCalendarAlt className="mr-2 text-brand" />
            Health Calendar
          </h3>
          <button
            onClick={() => setShowAddEvent(!showAddEvent)}
            className="text-brand hover:text-brand-dark transition-colors"
          >
            <FaPlus />
          </button>
        </div>
        
        <div className="calendar-container">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={(date: Date | undefined) => date && handleDayClick(date)}
            showOutsideDays
            className="rdp-compact"
            components={{
              Day: renderDay,
            }}
          />
        </div>

        {selectedDateEvents.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium text-gray-700">
              Events for {selected?.toLocaleDateString()}:
            </h4>
            {selectedDateEvents.map(event => (
              <div 
                key={event.id}
                className={`flex items-center p-2 rounded-lg border ${getEventTypeColor(event.type)}`}
              >
                {getEventTypeIcon(event.type)}
                <div className="ml-2 flex-1">
                  <div className="text-sm font-medium">{event.title}</div>
                  {event.time && (
                    <div className="text-xs opacity-75">{event.time}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <FaCalendarAlt className="mr-3 text-brand" />
          Health & Wellness Calendar
        </h2>
        <button
          onClick={() => setShowAddEvent(!showAddEvent)}
          className="bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand-dark transition-colors flex items-center space-x-2"
        >
          <FaPlus />
          <span>Add Event</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="calendar-container">
            <DayPicker
              mode="single"
              selected={selected}
              onSelect={(date: Date | undefined) => date && handleDayClick(date)}
              showOutsideDays
              className="rdp-full"
              components={{
                Day: renderDay,
              }}
            />
          </div>
        </div>

        {/* Events Panel */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Upcoming Events
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {allEvents
                .filter(event => event.date >= new Date())
                .sort((a, b) => a.date.getTime() - b.date.getTime())
                .slice(0, 10)
                .map(event => (
                  <div 
                    key={event.id}
                    className={`p-3 rounded-lg border ${getEventTypeColor(event.type)} hover:shadow-md transition-shadow cursor-pointer`}
                    onClick={() => handleDayClick(event.date)}
                  >
                    <div className="flex items-start space-x-3">
                      {getEventTypeIcon(event.type)}
                      <div className="flex-1">
                        <div className="font-medium text-sm">{event.title}</div>
                        <div className="text-xs opacity-75 mt-1">
                          {event.date.toLocaleDateString()} 
                          {event.time && ` at ${event.time}`}
                        </div>
                        {event.description && (
                          <div className="text-xs opacity-75 mt-1">
                            {event.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {selected && selectedDateEvents.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {selected.toLocaleDateString()} Events
              </h3>
              <div className="space-y-2">
                {selectedDateEvents.map(event => (
                  <div 
                    key={event.id}
                    className={`p-3 rounded-lg border ${getEventTypeColor(event.type)}`}
                  >
                    <div className="flex items-center space-x-3">
                      {getEventTypeIcon(event.type)}
                      <div className="flex-1">
                        <div className="font-medium text-sm">{event.title}</div>
                        {event.time && (
                          <div className="text-xs opacity-75">{event.time}</div>
                        )}
                        {event.description && (
                          <div className="text-xs opacity-75 mt-1">
                            {event.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Event Form */}
      {showAddEvent && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Add New Event</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Event title"
              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
            />
            <select className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent">
              <option value="">Select type</option>
              <option value="meal">Meal</option>
              <option value="workout">Workout</option>
              <option value="wellness">Wellness</option>
              <option value="health">Health</option>
            </select>
            <input
              type="date"
              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
            />
            <input
              type="time"
              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
            />
            <textarea
              placeholder="Description (optional)"
              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent md:col-span-2"
              rows={2}
            />
          </div>
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={() => setShowAddEvent(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setShowAddEvent(false)
                // Here you would handle saving the event
              }}
              className="bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand-dark transition-colors"
            >
              Add Event
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Calendar
