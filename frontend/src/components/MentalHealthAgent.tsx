import React from 'react'
import type { UserMentalHealthProfile as SessionUserProfile } from '../services/MentalHealthSessionManager'
import EnhancedMentalHealthAgent from './EnhancedMentalHealthAgent'

interface MentalHealthAgentProps {
  onBackToServices: () => void
  authenticatedUser?: SessionUserProfile | null
}

export const MentalHealthAgent: React.FC<MentalHealthAgentProps> = ({ onBackToServices, authenticatedUser }) => {
  return (
    <EnhancedMentalHealthAgent 
      onBackToServices={onBackToServices}
      authenticatedUser={authenticatedUser}
    />
  )
}

export default MentalHealthAgent