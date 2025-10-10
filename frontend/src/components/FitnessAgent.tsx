import { ArrowLeft } from 'lucide-react'

interface FitnessAgentProps {
  onBackToServices: () => void
}

export const FitnessAgent: React.FC<FitnessAgentProps> = ({ onBackToServices }) => {
  return (
    <div className="fixed inset-0 bg-white z-50">
      {/* Header with Back Button */}
      <div className="h-16 bg-gradient-to-r from-orange-600 to-red-600 flex items-center px-6 shadow-lg">
        <button
          onClick={onBackToServices}
          className="flex items-center text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span className="font-medium">Back to Services</span>
        </button>
        <h1 className="ml-6 text-xl font-bold text-white">
          💪 Fitness Hub
        </h1>
      </div>

      {/* Embedded Fitness Frontend */}
      <iframe
        src="http://localhost:5174"
        className="w-full h-[calc(100vh-4rem)] border-0"
        title="Fitness Hub Interface"
      />
    </div>
  )
}
