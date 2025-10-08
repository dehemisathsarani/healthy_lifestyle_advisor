import { ArrowLeft } from 'lucide-react'

interface FitnessAgentProps {
  onBackToServices: () => void
}

export const FitnessAgent: React.FC<FitnessAgentProps> = ({ onBackToServices }) => {
  const FITNESS_FRONTEND_URL = 'http://localhost:5174'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBackToServices}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Services
            </button>
            <h1 className="text-xl font-bold text-gray-900">💪 Fitness Planner</h1>
          </div>
        </div>
      </div>

      {/* Embedded Fitness Agent */}
      <div className="flex-1 w-full">
        <iframe
          src={FITNESS_FRONTEND_URL}
          className="w-full h-full border-0"
          style={{ minHeight: 'calc(100vh - 73px)' }}
          title="Fitness Agent"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>
    </div>
  )
}
