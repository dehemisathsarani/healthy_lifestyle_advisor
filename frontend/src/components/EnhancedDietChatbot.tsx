import { useState, useRef, useEffect, useCallback } from 'react'
import { 
  HiCpuChip, 
  HiPaperAirplane, 
  HiXMark, 
  HiSparkles,
  HiCheckCircle,
  HiInformationCircle,
  HiClock,
  HiBookOpen
} from 'react-icons/hi2'

// ==================== Types ====================
interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
  confidenceScore?: number
  sources?: string[]
  contextType?: string
}

interface SuggestedQuestion {
  text: string
  category: 'nutrition' | 'meal_plan' | 'health_goal' | 'general'
  icon: React.ReactNode
}

interface ChatResponse {
  message_id: string
  user_id: string
  message: string
  response: string
  timestamp: string
  context_type: string
  confidence_score?: number
  sources_used?: string[]
}

// ==================== Component ====================
export const EnhancedDietChatbot = () => {
  // State Management
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm your AI Nutrition Expert powered by advanced RAG technology. I can help you with personalized diet advice, meal planning, and nutrition questions. How can I assist you today?",
      isUser: false,
      timestamp: new Date(),
      confidenceScore: 0.95,
      contextType: 'general'
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showSources, setShowSources] = useState<string | null>(null)
  const [conversationHistory, setConversationHistory] = useState<Message[]>([])
  const [userId] = useState(() => `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // ==================== Suggested Questions ====================
  const suggestedQuestions: SuggestedQuestion[] = [
    { 
      text: "What are the best protein sources for muscle building?", 
      category: 'nutrition',
      icon: <HiSparkles className="text-yellow-500" />
    },
    { 
      text: "How many calories should I eat to lose weight?", 
      category: 'health_goal',
      icon: <HiInformationCircle className="text-blue-500" />
    },
    { 
      text: "Create a balanced meal plan for today", 
      category: 'meal_plan',
      icon: <HiClock className="text-green-500" />
    },
    { 
      text: "What foods are high in fiber?", 
      category: 'nutrition',
      icon: <HiBookOpen className="text-purple-500" />
    },
    { 
      text: "How to increase protein intake on a vegetarian diet?", 
      category: 'nutrition',
      icon: <HiSparkles className="text-emerald-500" />
    },
    { 
      text: "Best post-workout meal recommendations?", 
      category: 'meal_plan',
      icon: <HiCheckCircle className="text-orange-500" />
    }
  ]

  // ==================== Scroll to Bottom ====================
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // ==================== API Integration ====================
  const sendMessageToAPI = async (message: string, contextType: string = 'general'): Promise<ChatResponse> => {
    try {
      const response = await fetch('http://localhost:8001/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          message: message,
          context_type: contextType
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data: ChatResponse = await response.json()
      return data
    } catch (error) {
      console.error('Error calling diet agent API:', error)
      // Fallback response
      return {
        message_id: Date.now().toString(),
        user_id: userId,
        message: message,
        response: "I'm having trouble connecting to the nutrition service. Please try again in a moment. In the meantime, make sure you're maintaining a balanced diet with adequate protein, carbs, and healthy fats!",
        timestamp: new Date().toISOString(),
        context_type: contextType,
        confidence_score: 0.5,
        sources_used: ['fallback']
      }
    }
  }

  // ==================== Load Conversation History ====================
  const loadConversationHistory = async () => {
    try {
      const response = await fetch(`http://localhost:8001/chat/history/${userId}?limit=20`)
      if (response.ok) {
        const data = await response.json()
        const history: Message[] = data.conversations.map((conv: any) => ([
          {
            id: `${conv.message_id}_user`,
            text: conv.message,
            isUser: true,
            timestamp: new Date(conv.timestamp),
            contextType: conv.context_type
          },
          {
            id: conv.message_id,
            text: conv.response,
            isUser: false,
            timestamp: new Date(conv.timestamp),
            confidenceScore: conv.confidence_score,
            sources: conv.sources_used,
            contextType: conv.context_type
          }
        ])).flat()
        
        setConversationHistory(history)
      }
    } catch (error) {
      console.error('Error loading conversation history:', error)
    }
  }

  // ==================== Handle Send Message ====================
  const handleSendMessage = async (text: string, contextType: string = 'general') => {
    if (!text.trim()) return

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      text: text.trim(),
      isUser: true,
      timestamp: new Date(),
      contextType
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    // Call the diet agent API
    const apiResponse = await sendMessageToAPI(text.trim(), contextType)

    // Create bot response from API
    const botResponse: Message = {
      id: apiResponse.message_id,
      text: apiResponse.response,
      isUser: false,
      timestamp: new Date(apiResponse.timestamp),
      confidenceScore: apiResponse.confidence_score,
      sources: apiResponse.sources_used,
      contextType: apiResponse.context_type
    }

    setMessages(prev => [...prev, botResponse])
    setIsTyping(false)
  }

  // ==================== Handle Quick Question ====================
  const handleQuickQuestion = (question: SuggestedQuestion) => {
    handleSendMessage(question.text, question.category)
  }

  // ==================== Confidence Score Display ====================
  const getConfidenceColor = (score?: number): string => {
    if (!score) return 'bg-gray-200'
    if (score >= 0.8) return 'bg-green-500'
    if (score >= 0.6) return 'bg-yellow-500'
    return 'bg-orange-500'
  }

  const getConfidenceLabel = (score?: number): string => {
    if (!score) return 'N/A'
    if (score >= 0.8) return 'High Confidence'
    if (score >= 0.6) return 'Medium Confidence'
    return 'Low Confidence'
  }

  // ==================== Format Context Type ====================
  const formatContextType = (contextType?: string): string => {
    if (!contextType) return 'General'
    return contextType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  // ==================== Focus Input on Open ====================
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
      // Load conversation history when opened
      loadConversationHistory()
    }
  }, [isOpen])

  return (
    <>
      {/* ==================== Toggle Button ==================== */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-2xl hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-110 animate-pulse-slow"
        aria-label="Toggle Diet Chatbot"
      >
        {isOpen ? (
          <HiXMark className="text-2xl" />
        ) : (
          <HiCpuChip className="text-2xl animate-spin-slow" />
        )}
      </button>

      {/* ==================== Chatbot Interface ==================== */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-[420px] max-h-[600px] rounded-3xl border-2 border-emerald-200 bg-white shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl">
          
          {/* ==================== Header ==================== */}
          <div className="flex items-center justify-between p-5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white">
            <div className="flex items-center gap-3">
              <div className="relative">
                <HiCpuChip className="text-2xl animate-pulse" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-300 rounded-full animate-ping"></span>
              </div>
              <div>
                <h3 className="font-bold text-lg">AI Nutrition Expert</h3>
                <p className="text-xs text-emerald-50 flex items-center gap-1">
                  <HiSparkles className="text-xs" />
                  Enhanced RAG • Real-time Insights
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-emerald-50 hover:text-white transition-colors p-2 hover:bg-white/20 rounded-full"
              aria-label="Close chatbot"
            >
              <HiXMark className="text-xl" />
            </button>
          </div>

          {/* ==================== Messages Container ==================== */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-gray-50 to-white">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-md ${
                    message.isUser
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white'
                      : 'bg-white border-2 border-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-line">{message.text}</p>
                  
                  {/* ==================== Bot Message Metadata ==================== */}
                  {!message.isUser && (
                    <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                      {/* Confidence Score */}
                      {message.confidenceScore !== undefined && (
                        <div className="flex items-center gap-2 text-xs">
                          <div className={`w-2 h-2 rounded-full ${getConfidenceColor(message.confidenceScore)}`}></div>
                          <span className="text-gray-600 font-medium">
                            {getConfidenceLabel(message.confidenceScore)} ({(message.confidenceScore * 100).toFixed(0)}%)
                          </span>
                        </div>
                      )}
                      
                      {/* Context Type */}
                      {message.contextType && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <HiInformationCircle />
                          <span>Context: {formatContextType(message.contextType)}</span>
                        </div>
                      )}
                      
                      {/* Sources */}
                      {message.sources && message.sources.length > 0 && (
                        <div>
                          <button
                            onClick={() => setShowSources(showSources === message.id ? null : message.id)}
                            className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                          >
                            <HiBookOpen />
                            <span>
                              {showSources === message.id ? 'Hide' : 'Show'} Sources ({message.sources.length})
                            </span>
                          </button>
                          
                          {showSources === message.id && (
                            <div className="mt-2 p-2 bg-emerald-50 rounded-lg text-xs space-y-1">
                              {message.sources.map((source, idx) => (
                                <div key={idx} className="flex items-start gap-1">
                                  <span className="text-emerald-600">•</span>
                                  <span className="text-gray-700">{source}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* ==================== Timestamp ==================== */}
                  <p className={`text-xs mt-2 ${message.isUser ? 'text-emerald-100' : 'text-gray-400'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {/* ==================== Typing Indicator ==================== */}
            {isTyping && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-white border-2 border-gray-100 rounded-2xl px-4 py-3 shadow-md">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-gray-500">Analyzing nutrition data...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* ==================== Quick Questions ==================== */}
          {messages.length <= 2 && (
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                <HiSparkles className="text-emerald-500" />
                Quick Questions
              </p>
              <div className="space-y-2">
                {suggestedQuestions.slice(0, 3).map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickQuestion(question)}
                    className="w-full text-left px-3 py-2 text-xs bg-white hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 rounded-lg transition-all duration-200 flex items-center gap-2 group"
                  >
                    <span className="group-hover:scale-110 transition-transform">{question.icon}</span>
                    <span className="text-gray-700 group-hover:text-emerald-700 font-medium">{question.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ==================== Input Area ==================== */}
          <div className="p-4 bg-white border-t-2 border-gray-100">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage(inputValue)
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about nutrition, meals, or diet..."
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 transition-all text-sm"
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-emerald-500/50"
                aria-label="Send message"
              >
                <HiPaperAirplane className="text-xl" />
              </button>
            </form>
            
            {/* ==================== Powered By ==================== */}
            <div className="mt-2 text-center">
              <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                <HiSparkles className="text-emerald-500 text-xs" />
                Powered by Enhanced RAG Technology
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ==================== Custom Animations ==================== */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </>
  )
}

export default EnhancedDietChatbot
