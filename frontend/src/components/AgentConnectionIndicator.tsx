import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type AgentType = 'diet' | 'fitness' | 'mental-health' | null;

interface AgentConnectionIndicatorProps {
  currentAgent: AgentType;
  message?: string;
  isProcessing?: boolean;
  onClose?: () => void;
}

const agentConfig = {
  diet: {
    icon: '🥗',
    name: 'Diet Agent',
    color: 'from-green-500 to-emerald-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
    textColor: 'text-green-800',
  },
  fitness: {
    icon: '💪',
    name: 'Fitness Agent',
    color: 'from-blue-500 to-cyan-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    textColor: 'text-blue-800',
  },
  'mental-health': {
    icon: '🧠',
    name: 'Mental Health Agent',
    color: 'from-purple-500 to-pink-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-300',
    textColor: 'text-purple-800',
  },
};

export const AgentConnectionIndicator: React.FC<AgentConnectionIndicatorProps> = ({
  currentAgent,
  message,
  isProcessing = false,
  onClose,
}) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (isProcessing) {
      const interval = setInterval(() => {
        setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isProcessing]);

  if (!currentAgent) return null;

  const config = agentConfig[currentAgent];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.9 }}
        transition={{ duration: 0.3, type: 'spring' }}
        className="relative"
      >
        {/* Main Connection Card */}
        <div
          className={`
            ${config.bgColor} ${config.borderColor} 
            border-2 rounded-lg shadow-lg p-4 
            backdrop-blur-sm bg-opacity-95
          `}
        >
          <div className="flex items-center gap-3">
            {/* Agent Icon with Pulse Animation */}
            <motion.div
              animate={isProcessing ? {
                scale: [1, 1.2, 1],
                rotate: [0, 5, -5, 0],
              } : {}}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="text-4xl"
            >
              {config.icon}
            </motion.div>

            {/* Connection Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${config.textColor}`}>
                  You are now connected with
                </span>
                
                {/* Pulsing Dot Indicator */}
                {isProcessing && (
                  <motion.div
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="w-2 h-2 bg-green-500 rounded-full"
                  />
                )}
              </div>

              {/* Agent Name Badge */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: 'auto' }}
                className={`
                  inline-block px-3 py-1 mt-1 rounded-full 
                  bg-gradient-to-r ${config.color} 
                  text-white font-bold text-sm shadow-md
                `}
              >
                {config.name}
              </motion.div>

              {/* Status Message */}
              {message && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className={`mt-2 text-sm ${config.textColor} font-medium`}
                >
                  {message}
                  {isProcessing && <span className="inline-block w-8">{dots}</span>}
                </motion.p>
              )}
            </div>

            {/* Close Button */}
            {onClose && !isProcessing && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className={`
                  ${config.textColor} hover:bg-white 
                  rounded-full p-1 transition-colors
                `}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </motion.button>
            )}
          </div>

          {/* Processing Bar */}
          {isProcessing && (
            <motion.div
              className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden"
            >
              <motion.div
                className={`h-full bg-gradient-to-r ${config.color}`}
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            </motion.div>
          )}
        </div>

        {/* Decorative Glow Effect */}
        <div
          className={`
            absolute -inset-1 bg-gradient-to-r ${config.color} 
            rounded-lg blur opacity-20 -z-10
          `}
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default AgentConnectionIndicator;
