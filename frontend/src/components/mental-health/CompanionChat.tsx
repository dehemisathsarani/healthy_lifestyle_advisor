import React, { useState } from 'react';

interface CompanionChatProps {
  onMessageSent?: (data: any) => void;
}

export const CompanionChat: React.FC<CompanionChatProps> = ({ onMessageSent }) => {
  const [message, setMessage] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<Array<{type: 'user' | 'companion', content: string, timestamp: string}>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = {
      type: 'user' as const,
      content: message,
      timestamp: new Date().toLocaleTimeString()
    };

    setChatHistory(prev => [...prev, userMessage]);
    const currentMessage = message;
    setMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/mental-health/companion/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: currentMessage
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      const companionMessage = {
        type: 'companion' as const,
        content: data.response || 'I\'m here to listen and support you.',
        timestamp: new Date().toLocaleTimeString()
      };

      setChatHistory(prev => [...prev, companionMessage]);
      
      if (onMessageSent) {
        onMessageSent(data);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        type: 'companion' as const,
        content: 'I\'m sorry, I\'m having trouble responding right now. Please try again.',
        timestamp: new Date().toLocaleTimeString()
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="w-full max-w-lg bg-white shadow-lg rounded-lg border border-gray-200">
      <div className="bg-blue-600 text-white p-4 rounded-t-lg">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          🤗 AI Companion Chat
        </h3>
        <p className="text-sm text-blue-100">I'm here to listen and support you</p>
      </div>
      
      <div className="h-80 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {chatHistory.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-8">
            <p>👋 Hi there! I'm your AI companion.</p>
            <p>Feel free to share what's on your mind.</p>
          </div>
        )}
        
        {chatHistory.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                msg.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-800 border border-gray-200'
              }`}
            >
              <p className="text-sm">{msg.content}</p>
              <p className={`text-xs mt-1 ${
                msg.type === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {msg.timestamp}
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 border border-gray-200 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here... (Press Enter to send)"
            rows={2}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !message.trim()}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              isLoading || !message.trim()
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300'
            } text-white`}
          >
            Send
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          💡 Tip: Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};
