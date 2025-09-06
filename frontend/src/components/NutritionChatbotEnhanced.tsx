import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FaPaperPlane, FaTimes, FaRobot, FaCog, FaMoon, FaSun, FaVolumeUp, FaVolumeMute, FaMicrophone, FaMicrophoneSlash, FaLightbulb, FaUtensils, FaDumbbell, FaTint, FaWeight } from 'react-icons/fa';

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
}

const NutritionChatbot: React.FC<NutritionChatbotProps> = ({
  user,
  isOpen,
  onToggle,
  className = ''
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: `Hello ${user?.name || 'there'}! 🥗 I'm your AI Nutrition Assistant powered by advanced RAG technology.\n\n✅ **Enhanced Features:** Personalized advice with fallback knowledge\n🧠 **Context Aware:** Based on your ${user?.goal?.replace('_', ' ').toUpperCase() || 'GENERAL HEALTH'} goal\n👤 **Profile:** ${user?.current_weight ? `${user.current_weight}kg` : 'Complete your profile for better advice'}\n\nI can help with meal planning, nutrition analysis, dietary guidance, and healthy lifestyle tips. What would you like to know?`,
      isUser: false,
      timestamp: new Date()
    }
  ]);

  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [chatMode, setChatMode] = useState<'nutrition' | 'meal_plan' | 'health_goal' | 'general'>('nutrition');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'fallback' | 'offline'>('connected');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognition = useRef<any>(null);

  // Quick action buttons
  const quickActions = [
    { id: 'recommendations', label: 'Get Recommendations', icon: FaLightbulb },
    { id: 'meal_plan', label: 'Meal Plan', icon: FaUtensils },
    { id: 'protein_needs', label: 'Protein Needs', icon: FaDumbbell },
    { id: 'hydration', label: 'Hydration', icon: FaTint },
    { id: 'weight_tips', label: 'Weight Tips', icon: FaWeight },
  ];

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setSpeechSupported(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = 'en-US';

      recognition.current.onstart = () => setIsListening(true);
      recognition.current.onend = () => setIsListening(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
      };
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Speech synthesis
  const speak = useCallback((text: string) => {
    if (voiceEnabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  }, [voiceEnabled]);

  // Speech recognition controls
  const startListening = useCallback(() => {
    if (recognition.current && speechSupported && !isListening) {
      try {
        recognition.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
      }
    }
  }, [speechSupported, isListening]);

  const stopListening = useCallback(() => {
    if (recognition.current && isListening) {
      recognition.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  // Enhanced API call with fallback
  const sendToRAGBackend = async (message: string): Promise<string> => {
    try {
      setIsLoading(true);
      setConnectionStatus('connected');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      try {
        const response = await fetch('http://localhost:8000/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user?.id || 'demo-user',
            message: message,
            context_type: chatMode
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.response && data.response.trim().length > 10) {
          const isFallback = data.response.includes('*Note: This response was generated using our comprehensive nutrition knowledge base.*');
          setConnectionStatus(isFallback ? 'fallback' : 'connected');
          return data.response;
        } else {
          throw new Error('Invalid response format');
        }
        
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }

    } catch (error: unknown) {
      console.error('RAG Backend Error:', error);
      setConnectionStatus('offline');
      
      // Enhanced fallback responses
      const messageLower = message.toLowerCase();
      
      if (messageLower.includes('protein') || messageLower.includes('muscle')) {
        return `🥩 **Protein Information**

**Daily Needs:** Generally 0.8-2.0g per kg body weight (higher for active individuals)

**Best Sources:**
• Lean meats (chicken, fish, turkey)
• Eggs and dairy products
• Legumes and beans
• Nuts and seeds
• Quinoa and tofu

**Tips:**
• Spread protein throughout the day
• Include protein with each meal
• Post-workout protein helps recovery

*Note: Offline nutrition guidance. For personalized advice, please try again when connected.*`;
      } else if (messageLower.includes('weight') || messageLower.includes('lose') || messageLower.includes('gain')) {
        return `⚖️ **Weight Management**

**For Weight Loss:**
• Create moderate caloric deficit (500-750 cal/day)
• Focus on whole, unprocessed foods
• Include protein to maintain muscle mass
• Stay hydrated and get adequate sleep

**For Weight Gain:**
• Caloric surplus of 300-500 calories/day
• Include nutrient-dense, high-calorie foods
• Focus on strength training
• Eat frequent meals

*Note: General guidance. Individual needs may vary.*`;
      } else if (messageLower.includes('water') || messageLower.includes('hydrat')) {
        return `💧 **Hydration Guidelines**

**Daily Intake:** 8-10 glasses (2-2.5 liters) per day

**Increase for:**
• Exercise and physical activity
• Hot weather conditions
• Illness or fever

**Signs of Good Hydration:**
• Pale yellow urine
• Good energy levels
• Moist lips and mouth

*Note: Offline hydration advice.*`;
      } else {
        return `🌱 **Nutrition Guidance**

**Fundamental Principles:**
• Focus on whole, unprocessed foods
• Include variety of colorful fruits and vegetables
• Choose lean proteins and healthy fats
• Stay adequately hydrated
• Practice portion control

**Building Balanced Meals:**
• 50% vegetables and fruits
• 25% lean protein
• 25% whole grains
• Small amount of healthy fats

*Note: I'm currently offline. For personalized advice, please try again when connected.*`;
      }
      
    } finally {
      setIsLoading(false);
    }
  };

  // Get enhanced recommendations
  const getEnhancedRecommendations = async (): Promise<string> => {
    try {
      const response = await fetch(`http://localhost:8000/api/chat/recommendations/${user?.id || 'demo-user'}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        return data.recommendations;
      } else {
        throw new Error('Failed to get recommendations');
      }
    } catch (error) {
      console.error('Recommendations API Error:', error);
      
      let recommendations = `🎯 **Personalized Nutrition Recommendations**\n\n`;
      
      if (user?.goal) {
        const goal = user.goal.replace('_', ' ').toLowerCase();
        recommendations += `**For your ${goal} goal:**\n`;
        
        if (goal.includes('weight_loss')) {
          recommendations += `• Create a moderate caloric deficit (500-750 cal/day)
• Focus on high-protein foods to maintain muscle
• Include plenty of vegetables for volume and nutrients
• Stay hydrated and prioritize sleep\n\n`;
        } else if (goal.includes('muscle_gain')) {
          recommendations += `• Consume 1.6-2.2g protein per kg body weight
• Include post-workout protein within 2 hours
• Focus on complex carbs for energy
• Stay consistent with training and nutrition\n\n`;
        } else {
          recommendations += `• Follow a balanced, varied diet
• Include all food groups in appropriate portions
• Focus on whole, minimally processed foods
• Stay consistent with healthy habits\n\n`;
        }
      }
      
      if (user?.dietary_restrictions?.length) {
        recommendations += `**Considering your dietary preferences:**\n`;
        recommendations += `• Following ${user.dietary_restrictions.join(', ')} diet
• Ensure adequate nutrient intake
• Consider supplementation if needed
• Focus on variety within your preferences\n\n`;
      }
      
      recommendations += `**General Tips:**
• Plan your meals in advance
• Stay hydrated throughout the day
• Include physical activity regularly
• Get adequate sleep for recovery

*Note: General recommendations. For personalized advice, complete your profile.*`;
      
      return recommendations;
    }
  };

  // Quick action handler
  const handleQuickAction = async (action: string) => {
    let message = '';
    
    switch (action) {
      case 'recommendations':
        setIsTyping(true);
        try {
          const recommendations = await getEnhancedRecommendations();
          const botMessage: ChatMessage = {
            id: Date.now().toString(),
            text: recommendations,
            isUser: false,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botMessage]);
          speak(recommendations);
        } catch (error) {
          console.error('Error getting recommendations:', error);
        } finally {
          setIsTyping(false);
        }
        return;
        
      case 'meal_plan':
        message = 'Can you create a personalized meal plan for today based on my goals?';
        break;
        
      case 'protein_needs':
        message = 'How much protein do I need daily for my goals?';
        break;
        
      case 'hydration':
        message = 'How much water should I drink daily?';
        break;
        
      case 'weight_tips':
        message = user?.goal?.includes('weight_loss') 
          ? 'Give me weight loss nutrition tips'
          : user?.goal?.includes('muscle_gain')
          ? 'Give me muscle building nutrition advice'
          : 'Give me healthy weight management tips';
        break;
        
      default:
        return;
    }
    
    if (message) {
      await handleSendMessage(message);
    }
  };

  // Handle sending messages
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await sendToRAGBackend(text);
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      speak(response);

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "I'm experiencing technical difficulties. Please try again or check your connection.",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  if (!isOpen) return null;

  const themeClasses = isDarkMode
    ? 'bg-gray-900 border-gray-700 text-white'
    : 'bg-white border-gray-300 text-gray-900';

  const inputThemeClasses = isDarkMode
    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500';

  return (
    <div className={`fixed bottom-4 right-4 w-96 h-[600px] border-2 rounded-xl shadow-2xl z-50 flex flex-col ${themeClasses} ${className}`}>
      {/* Header */}
      <div className={`p-4 border-b flex justify-between items-center ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-emerald-50'}`}>
        <div className="flex items-center space-x-2">
          <FaRobot className="text-emerald-600 text-xl" />
          <div>
            <h3 className="font-bold text-lg">AI Nutrition Assistant</h3>
            <p className="text-xs opacity-70 flex items-center space-x-2">
              <span>Enhanced RAG System</span>
              <span className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' :
                connectionStatus === 'fallback' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></span>
              {isListening && <FaMicrophone className="text-red-500 animate-pulse" />}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <FaCog className="text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={onToggle}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <FaTimes className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className={`p-3 border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`flex items-center justify-center space-x-1 p-2 rounded-lg text-sm ${
                isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-700 border'
              }`}
            >
              {isDarkMode ? <FaSun /> : <FaMoon />}
              <span>{isDarkMode ? 'Light' : 'Dark'}</span>
            </button>
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`flex items-center justify-center space-x-1 p-2 rounded-lg text-sm ${
                voiceEnabled 
                  ? 'bg-emerald-600 text-white' 
                  : isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-700 border'
              }`}
            >
              {voiceEnabled ? <FaVolumeUp /> : <FaVolumeMute />}
              <span>Voice</span>
            </button>
          </div>
          
          {/* Chat Mode Selector */}
          <div className="mt-2">
            <p className="text-xs font-medium mb-1 opacity-70">Chat Mode:</p>
            <select
              value={chatMode}
              onChange={(e) => setChatMode(e.target.value as 'nutrition' | 'meal_plan' | 'health_goal' | 'general')}
              className={`w-full p-1 rounded text-xs ${inputThemeClasses}`}
            >
              <option value="nutrition">Nutrition Focus</option>
              <option value="meal_plan">Meal Planning</option>
              <option value="health_goal">Health Goals</option>
              <option value="general">General Chat</option>
            </select>
          </div>

          {speechSupported && (
            <p className="text-xs mt-2 opacity-50">
              🎤 Speech recognition available
            </p>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-xl ${
                message.isUser
                  ? 'bg-emerald-600 text-white'
                  : isDarkMode
                  ? 'bg-gray-700 text-gray-100'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {message.text}
              </div>
              <div className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        {isLoading && (
          <div className="flex justify-center">
            <div className="text-sm text-emerald-600 dark:text-emerald-400 animate-pulse">
              🧠 {connectionStatus === 'connected' ? 'Processing with RAG system...' : 
                  connectionStatus === 'fallback' ? 'Using enhanced fallback...' : 
                  'Using offline knowledge...'}
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className={`p-3 border-t ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
        <p className="text-xs font-medium mb-2 opacity-70">Quick Actions:</p>
        <div className="grid grid-cols-3 gap-1">
          {quickActions.slice(0, 6).map((action) => (
            <button
              key={action.id}
              onClick={() => handleQuickAction(action.id)}
              className={`flex items-center justify-center space-x-1 text-xs p-2 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                  : 'bg-white hover:bg-gray-100 text-gray-600'
              } border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}
            >
              <action.icon className="text-emerald-600" />
              <span className="hidden sm:inline">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className={`p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about nutrition, meals, calories..."
              className={`w-full p-3 pr-12 rounded-xl border resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 ${inputThemeClasses}`}
              rows={1}
              style={{ minHeight: '44px', maxHeight: '100px' }}
            />
            {speechSupported && (
              <button
                onClick={isListening ? stopListening : startListening}
                className={`absolute right-2 top-2 p-2 rounded-lg ${
                  isListening 
                    ? 'text-red-500 bg-red-50 dark:bg-red-900/20' 
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {isListening ? <FaMicrophoneSlash /> : <FaMicrophone />}
              </button>
            )}
          </div>
          <button
            onClick={() => handleSendMessage(inputValue)}
            disabled={!inputValue.trim() || isTyping}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FaPaperPlane />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NutritionChatbot;
