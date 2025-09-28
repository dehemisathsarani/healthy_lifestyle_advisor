import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  FaMicrophone, 
  FaMicrophoneSlash, 
  FaVolumeUp, 
  FaVolumeMute, 
  FaPaperPlane, 
  FaTimes, 
  FaRobot, 
  FaCog,
  FaMoon,
  FaSun,
  FaChartBar,
  FaHistory,
  FaBrain,
  FaAppleAlt,
  FaCalendarAlt,
  FaBullseye
} from 'react-icons/fa';

interface NutritionChatbotProps {
  user: {
    id: string;
    name?: string;
    email?: string;
    goal?: string;
    dietary_restrictions?: string[];
    current_weight?: number;
    target_weight?: number;
  } | null;
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  context_type?: string;
}

interface ChatStats {
  totalMessages: number;
  questionsAsked: number;
  nutritionAdvice: number;
  mealPlanRequests: number;
}

type ChatMode = 'nutrition' | 'meal_plan' | 'health_goal' | 'general';

const NutritionChatbot: React.FC<NutritionChatbotProps> = ({
  user,
  isOpen,
  onToggle,
  className = ''
}) => {
  // Core state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: `Hello ${user?.name || 'there'}! I'm your AI Nutrition Assistant powered by advanced RAG technology. I can provide personalized nutrition advice based on your profile and recent meals. How can I help you today?`,
      isUser: false,
      timestamp: new Date(),
      context_type: 'general'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentMode, setCurrentMode] = useState<ChatMode>('nutrition');
  
  // Advanced features state
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Chat statistics
  const [chatStats, setChatStats] = useState<ChatStats>({
    totalMessages: 0,
    questionsAsked: 0,
    nutritionAdvice: 0,
    mealPlanRequests: 0
  });

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognition = useRef<SpeechRecognition | null>(null);
  const synthesis = useRef<SpeechSynthesis | null>(null);

  // Voice recognition setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognitionConstructor = (window as Window & {
        SpeechRecognition?: new() => SpeechRecognition;
        webkitSpeechRecognition?: new() => SpeechRecognition;
      }).SpeechRecognition || (window as Window & {
        SpeechRecognition?: new() => SpeechRecognition;
        webkitSpeechRecognition?: new() => SpeechRecognition;
      }).webkitSpeechRecognition;
      
      if (SpeechRecognitionConstructor) {
        recognition.current = new SpeechRecognitionConstructor();
        recognition.current.continuous = false;
        recognition.current.interimResults = false;
        recognition.current.lang = 'en-US';
        
        recognition.current.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          setInputValue(transcript);
          setIsListening(false);
        };
        
        recognition.current.onerror = () => {
          setIsListening(false);
        };
        
        recognition.current.onend = () => {
          setIsListening(false);
        };
      }
    }

    if ('speechSynthesis' in window) {
      synthesis.current = window.speechSynthesis;
    }

    return () => {
      if (recognition.current) {
        recognition.current.stop();
      }
    };
  }, []);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Voice synthesis
  const speak = useCallback((text: string) => {
    if (voiceEnabled && synthesis.current) {
      synthesis.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      synthesis.current.speak(utterance);
    }
  }, [voiceEnabled]);

  // Voice recognition
  const startListening = useCallback(() => {
    if (recognition.current && !isListening) {
      setIsListening(true);
      recognition.current.start();
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognition.current && isListening) {
      recognition.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  // API call to RAG backend
  const sendToRAGBackend = async (message: string, contextType: ChatMode): Promise<string> => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user?.id || 'demo-user',
          message: message,
          context_type: contextType
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('RAG API Error:', error);
      return "I apologize, but I'm having trouble connecting to my knowledge base right now. Please ensure the backend service is running on port 8000, or try again in a moment. Meanwhile, I can still provide basic nutrition guidance!";
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sending messages
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date(),
      context_type: currentMode
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Update stats
    setChatStats(prev => ({
      ...prev,
      totalMessages: prev.totalMessages + 1,
      questionsAsked: prev.questionsAsked + 1,
      nutritionAdvice: currentMode === 'nutrition' ? prev.nutritionAdvice + 1 : prev.nutritionAdvice,
      mealPlanRequests: currentMode === 'meal_plan' ? prev.mealPlanRequests + 1 : prev.mealPlanRequests
    }));

    try {
      // Get response from RAG backend
      const response = await sendToRAGBackend(text, currentMode);
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
        context_type: currentMode
      };

      setMessages(prev => [...prev, botMessage]);
      
      // Text-to-speech for bot response
      speak(response);
      
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "I apologize, but I encountered an error processing your request. Please try again.",
        isUser: false,
        timestamp: new Date(),
        context_type: 'general'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Quick questions based on mode
  const getQuickQuestions = () => {
    switch (currentMode) {
      case 'nutrition':
        return [
          'What are my recommended daily calories?',
          'How can I improve my protein intake?',
          'What vitamins am I missing?',
          'Best foods for my goals?'
        ];
      case 'meal_plan':
        return [
          'Create a weekly meal plan',
          'Suggest healthy breakfast ideas',
          'What should I eat post-workout?',
          'Plan meals for weight loss'
        ];
      case 'health_goal':
        return [
          'Help me reach my target weight',
          'Foods for muscle building',
          'How to boost metabolism?',
          'Nutrition for better energy'
        ];
      default:
        return [
          'Analyze my eating patterns',
          'Give me nutrition tips',
          'What should I eat today?',
          'Check my nutritional balance'
        ];
    }
  };

  // Chat mode configurations
  const chatModes = [
    { id: 'nutrition' as ChatMode, name: 'Nutrition', icon: FaAppleAlt, color: 'from-green-500 to-emerald-600' },
    { id: 'meal_plan' as ChatMode, name: 'Meal Plans', icon: FaCalendarAlt, color: 'from-blue-500 to-cyan-600' },
    { id: 'health_goal' as ChatMode, name: 'Health Goals', icon: FaBullseye, color: 'from-purple-500 to-pink-600' },
    { id: 'general' as ChatMode, name: 'General', icon: FaBrain, color: 'from-indigo-500 to-purple-600' }
  ];

  if (!isOpen) return null;

  const themeClasses = isDarkMode 
    ? 'bg-gray-900 text-white border-gray-700' 
    : 'bg-white text-gray-900 border-gray-200';

  const inputThemeClasses = isDarkMode 
    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500';

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <div className={`rounded-2xl shadow-2xl border-2 w-96 max-h-[600px] flex flex-col ${themeClasses}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <FaRobot className="text-xl animate-pulse" />
            <div>
              <h3 className="font-bold text-lg">AI Nutrition Assistant</h3>
              <p className="text-xs text-emerald-100">
                RAG-Powered • {currentMode.replace('_', ' ').toUpperCase()} Mode
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Settings"
            >
              <FaCog className={showSettings ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onToggle}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Close"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className={`p-4 border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Dark Mode</span>
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-yellow-600 text-white' : 'bg-gray-600 text-white'}`}
                >
                  {isDarkMode ? <FaSun /> : <FaMoon />}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Voice Responses</span>
                <button
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  className={`p-2 rounded-lg transition-colors ${voiceEnabled ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'}`}
                >
                  {voiceEnabled ? <FaVolumeUp /> : <FaVolumeMute />}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Statistics</span>
                <button
                  onClick={() => setShowStats(!showStats)}
                  className={`p-2 rounded-lg transition-colors ${showStats ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white'}`}
                >
                  <FaChartBar />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Panel */}
        {showStats && (
          <div className={`p-4 border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
            <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
              <FaHistory />
              Chat Statistics
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="text-center p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <div className="font-bold text-lg text-blue-600 dark:text-blue-300">{chatStats.totalMessages}</div>
                <div className="text-blue-800 dark:text-blue-200">Total Messages</div>
              </div>
              <div className="text-center p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <div className="font-bold text-lg text-green-600 dark:text-green-300">{chatStats.nutritionAdvice}</div>
                <div className="text-green-800 dark:text-green-200">Nutrition Advice</div>
              </div>
              <div className="text-center p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <div className="font-bold text-lg text-purple-600 dark:text-purple-300">{chatStats.mealPlanRequests}</div>
                <div className="text-purple-800 dark:text-purple-200">Meal Plans</div>
              </div>
              <div className="text-center p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <div className="font-bold text-lg text-orange-600 dark:text-orange-300">{chatStats.questionsAsked}</div>
                <div className="text-orange-800 dark:text-orange-200">Questions</div>
              </div>
            </div>
          </div>
        )}

        {/* Chat Mode Selector */}
        <div className={`p-3 border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <div className="grid grid-cols-4 gap-1">
            {chatModes.map((mode) => {
              const Icon = mode.icon;
              const isActive = currentMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => setCurrentMode(mode.id)}
                  className={`p-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                    isActive 
                      ? `bg-gradient-to-r ${mode.color} text-white shadow-lg scale-105` 
                      : `${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white text-gray-600 hover:bg-gray-100'}`
                  }`}
                >
                  <Icon className="mx-auto mb-1 text-sm" />
                  <div>{mode.name}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-72">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                  message.isUser
                    ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white'
                    : isDarkMode 
                      ? 'bg-gray-700 text-gray-100'
                      : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="text-sm whitespace-pre-line leading-relaxed">{message.text}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {message.context_type && (
                    <span className="text-xs opacity-60 uppercase tracking-wide">
                      {message.context_type.replace('_', ' ')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className={`rounded-2xl px-4 py-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          {isLoading && (
            <div className="flex justify-center">
              <div className="text-sm text-emerald-600 dark:text-emerald-400 animate-pulse">
                🧠 Processing with RAG knowledge base...
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        <div className={`p-3 border-t ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <p className="text-xs font-medium mb-2 opacity-70">Quick questions for {currentMode.replace('_', ' ')} mode:</p>
          <div className="grid grid-cols-2 gap-1">
            {getQuickQuestions().slice(0, 4).map((question, index) => (
              <button
                key={index}
                onClick={() => handleSendMessage(question)}
                className={`text-xs p-2 rounded-lg text-left transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                    : 'bg-white hover:bg-gray-100 text-gray-600'
                } border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className={`p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage(inputValue)}
                placeholder={`Ask about ${currentMode.replace('_', ' ')}...`}
                className={`w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 border-2 ${inputThemeClasses}`}
                disabled={isTyping || isLoading}
              />
              {recognition.current && (
                <button
                  onClick={isListening ? stopListening : startListening}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-lg transition-colors ${
                    isListening 
                      ? 'text-red-500 animate-pulse' 
                      : 'text-gray-400 hover:text-emerald-500'
                  }`}
                  title={isListening ? 'Stop listening' : 'Start voice input'}
                >
                  {isListening ? <FaMicrophoneSlash /> : <FaMicrophone />}
                </button>
              )}
            </div>
            <button
              onClick={() => handleSendMessage(inputValue)}
              disabled={!inputValue.trim() || isTyping || isLoading}
              className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-4 py-3 rounded-xl hover:from-emerald-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg"
              title="Send message"
            >
              <FaPaperPlane className="text-sm" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { NutritionChatbot };
export default NutritionChatbot;
