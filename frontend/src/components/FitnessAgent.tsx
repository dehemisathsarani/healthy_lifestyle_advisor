import { useEffect } from 'react'

interface FitnessAgentProps {
  onBackToServices: () => void
}

export const FitnessAgent: React.FC<FitnessAgentProps> = ({ onBackToServices }) => {
  // Listen for messages from the Fitness Frontend iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security check - only accept messages from localhost:5174
      if (event.origin !== 'http://localhost:5174') return
      
      // Handle navigation back to services
      if (event.data === 'NAVIGATE_TO_SERVICES') {
        onBackToServices()
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onBackToServices])

  return (
    <div className="fixed inset-0 bg-white z-50">
      {/* Embedded Fitness Frontend - Full Screen */}
      <iframe
        src="http://localhost:5174"
        className="w-full h-screen border-0"
        title="Fitness Hub Interface"
        allow="fullscreen"
      />
    </div>
  )
}
