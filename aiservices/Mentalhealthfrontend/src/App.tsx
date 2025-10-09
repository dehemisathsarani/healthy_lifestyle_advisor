import { useState } from 'react'
import './App.css'
import EnhancedMentalHealthAgent from './components/EnhancedMentalHealthAgent'
import type { UserMentalHealthProfile } from './services/MentalHealthSessionManager'

// Mock user profile for development
const mockUser: UserMentalHealthProfile = {
  id: 'mock-user-id',
  name: 'Demo User',
  email: 'demo@example.com',
  age: 25,
  stress_level: 'moderate',
  sleep_hours: 7,
  concerns: ['stress', 'anxiety'],
  preferred_activities: ['meditation', 'breathing_exercises'],
  mood_goals: ['reduce_stress', 'improve_sleep']
}

function App() {
  const [user] = useState<UserMentalHealthProfile>(mockUser)

  return (
    <div className="App">
      <EnhancedMentalHealthAgent 
        user={user}
        isAuthenticated={true}
        onBackToServices={() => console.log('Back to services')}
      />
    </div>
  )
}

export default App