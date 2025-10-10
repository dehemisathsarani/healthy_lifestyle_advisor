interface FitnessAgentProps {
  onBackToServices: () => void
}

export const FitnessAgent: React.FC<FitnessAgentProps> = ({ onBackToServices }) => {
  return (
    <div className="fixed inset-0 bg-white z-50">
      {/* Embedded Fitness Frontend - Full Screen */}
      <iframe
        src="http://localhost:5174"
        className="w-full h-screen border-0"
        title="Fitness Hub Interface"
      />
    </div>
  )
}
