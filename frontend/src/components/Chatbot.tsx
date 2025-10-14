import { useState, useRef, useEffect } from 'react'
import { HiCpuChip, HiPaperAirplane, HiXMark } from 'react-icons/hi2'

type Message = {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

type QuickQuestion = {
  text: string
  category: 'health' | 'fitness' | 'mental'
}

export const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm VitaCoach AI, your health and fitness assistant. How can I help you today?",
      isUser: false,
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const quickQuestions: QuickQuestion[] = [
    { text: "How many calories should I eat?", category: 'health' },
    { text: "What's a good workout routine?", category: 'fitness' },
    { text: "How to reduce stress?", category: 'mental' },
    { text: "Best foods for energy?", category: 'health' },
    { text: "How to improve sleep?", category: 'mental' },
    { text: "Cardio vs strength training?", category: 'fitness' },
  ]

  const healthResponses: Record<string, string> = {
    'calories': "Daily calorie needs depend on age, weight, height, and activity level. Generally:\n• Sedentary: 1,800-2,200 calories\n• Moderately active: 2,200-2,600 calories\n• Very active: 2,600-3,000 calories\n\nUse our calculator for personalized recommendations!",
    'food': "For sustained energy, focus on:\n• Complex carbs: oats, quinoa, sweet potatoes\n• Lean proteins: chicken, fish, eggs\n• Healthy fats: avocados, nuts, olive oil\n• Fiber-rich foods: fruits, vegetables, whole grains\n\nEat every 3-4 hours to maintain stable blood sugar.",
    'nutrition': "A balanced diet includes:\n• 45-65% carbohydrates\n• 10-35% protein\n• 20-35% healthy fats\n• Plenty of fruits and vegetables\n• Adequate hydration (8-10 glasses daily)",
    'water': "Stay hydrated with:\n• 8-10 glasses of water daily\n• More if exercising or in hot weather\n• Monitor urine color (should be light yellow)\n• Include water-rich foods like fruits and vegetables",
  }

  const fitnessResponses: Record<string, string> = {
    'workout': "A balanced workout routine includes:\n• 3-4 strength training sessions/week\n• 2-3 cardio sessions/week\n• 2-3 flexibility/mobility sessions\n• 1-2 rest days\n\nStart with 30-45 minutes and gradually increase intensity.",
    'cardio': "Cardio vs Strength Training:\n\nCardio (running, cycling, swimming):\n• Burns calories during exercise\n• Improves heart health\n• Builds endurance\n\nStrength Training (weights, bodyweight):\n• Burns calories after exercise\n• Builds muscle and strength\n• Improves metabolism\n\nBest approach: Combine both!",
    'exercise': "Start with these beginner-friendly exercises:\n• Walking: 30 minutes daily\n• Bodyweight squats: 3 sets of 10\n• Push-ups (modified if needed): 3 sets of 5-10\n• Planks: 3 sets of 30 seconds\n• Stretching: 10 minutes daily\n\nGradually increase intensity and duration.",
    'routine': "Weekly workout schedule:\n\nMonday: Upper body strength\nTuesday: Cardio (30 min)\nWednesday: Lower body strength\nThursday: Active recovery (walking/yoga)\nFriday: Full body circuit\nSaturday: Cardio (45 min)\nSunday: Rest or light stretching",
  }

  const mentalResponses: Record<string, string> = {
    'stress': "Reduce stress with these techniques:\n• Deep breathing: 4-7-8 technique\n• Meditation: 10-15 minutes daily\n• Regular exercise: natural stress reliever\n• Adequate sleep: 7-9 hours nightly\n• Time management: prioritize tasks\n• Social connections: talk to friends/family\n• Limit caffeine and alcohol",
    'sleep': "Improve sleep quality:\n• Stick to a consistent sleep schedule\n• Create a relaxing bedtime routine\n• Keep bedroom cool, dark, and quiet\n• Avoid screens 1 hour before bed\n• Exercise regularly (but not close to bedtime)\n• Avoid large meals and caffeine before bed\n• Consider meditation or reading",
    'anxiety': "Manage anxiety with:\n• Deep breathing exercises\n• Progressive muscle relaxation\n• Regular physical activity\n• Adequate sleep and nutrition\n• Limit caffeine and alcohol\n• Practice mindfulness\n• Seek professional help if needed\n• Stay connected with supportive people",
    'mental': "Mental health tips:\n• Practice self-care daily\n• Maintain social connections\n• Exercise regularly\n• Get adequate sleep\n• Eat a balanced diet\n• Practice gratitude\n• Set realistic goals\n• Seek professional help when needed\n• Remember: it's okay to not be okay",
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const getBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase()
    
    // Health responses
    if (lowerMessage.includes('calorie') || lowerMessage.includes('calories')) {
      return healthResponses.calories
    }
    if (lowerMessage.includes('food') || lowerMessage.includes('eat') || lowerMessage.includes('nutrition')) {
      return healthResponses.food
    }
    if (lowerMessage.includes('water') || lowerMessage.includes('hydrate')) {
      return healthResponses.water
    }
    
    // Fitness responses
    if (lowerMessage.includes('workout') || lowerMessage.includes('exercise') || lowerMessage.includes('routine')) {
      return fitnessResponses.workout
    }
    if (lowerMessage.includes('cardio') || lowerMessage.includes('strength')) {
      return fitnessResponses.cardio
    }
    
    // Mental health responses
    if (lowerMessage.includes('stress') || lowerMessage.includes('stressed')) {
      return mentalResponses.stress
    }
    if (lowerMessage.includes('sleep') || lowerMessage.includes('tired')) {
      return mentalResponses.sleep
    }
    if (lowerMessage.includes('anxiety') || lowerMessage.includes('anxious')) {
      return mentalResponses.anxiety
    }
    if (lowerMessage.includes('mental') || lowerMessage.includes('mind')) {
      return mentalResponses.mental
    }
    
    // Default response
    return "I'm here to help with health, fitness, and mental wellness questions! Try asking about:\n• Nutrition and calories\n• Workout routines\n• Stress management\n• Sleep improvement\n• Exercise tips\n\nOr use the quick questions below for instant answers!"
  }

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    // Simulate typing delay
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(text),
        isUser: false,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botResponse])
      setIsTyping(false)
    }, 1000)
  }

  const handleQuickQuestion = (question: QuickQuestion) => {
    handleSendMessage(question.text)
  }

  return (
    <>
      {/* Chatbot Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-brand to-emerald-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
      >
        {isOpen ? <HiXMark className="text-xl" /> : <HiCpuChip className="text-xl" />}
      </button>

      {/* Chatbot Interface */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-96 max-h-[500px] rounded-2xl border bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-brand to-emerald-500 text-white rounded-t-2xl">
            <div className="flex items-center gap-3">
              <HiCpuChip className="text-xl" />
              <div>
                <h3 className="font-semibold">VitaCoach AI</h3>
                <p className="text-xs text-emerald-50">Health & Fitness Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-emerald-50 hover:text-white transition-colors"
            >
              <HiXMark />
            </button>
          </div>

          {/* Messages */}
          <div className="h-80 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.isUser
                      ? 'bg-brand text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{message.text}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 rounded-2xl px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          <div className="p-4 border-t bg-gray-50">
            <p className="text-xs text-gray-600 mb-2">Quick questions:</p>
            <div className="grid grid-cols-2 gap-2">
              {quickQuestions.slice(0, 4).map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickQuestion(question)}
                  className="text-xs bg-white border rounded-lg px-2 py-1 text-left hover:bg-gray-50 transition-colors"
                >
                  {question.text}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
                placeholder="Ask about health, fitness, or mental wellness..."
                className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
              <button
                onClick={() => handleSendMessage(inputValue)}
                disabled={!inputValue.trim()}
                className="rounded-lg bg-brand px-3 py-2 text-white hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <HiPaperAirplane className="text-sm" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

