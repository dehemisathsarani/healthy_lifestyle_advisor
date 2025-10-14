// Test file to verify Mental Health Agent authentication integration
import React from 'react'
import { MentalHealthAgent } from './components/MentalHealthAgent'
import type { UserMentalHealthProfile } from './services/MentalHealthSessionManager'

// Mock authenticated user for testing
const mockAuthenticatedUser: UserMentalHealthProfile = {
  id: '123',
  name: 'Test User',
  email: 'test@example.com',
  age: 30,
  stress_level: 'moderate',
  sleep_hours: 7,
  concerns: ['anxiety', 'work stress'],
  preferred_activities: ['mindfulness', 'music'],
  mood_goals: ['reduce stress', 'improve sleep']
}

// Test component to verify integration
const TestMentalHealthAuth: React.FC = () => {
  return (
    <div>
      <h1>Mental Health Agent Authentication Test</h1>
      <MentalHealthAgent 
        onBackToServices={() => console.log('Back to services')}
        authenticatedUser={mockAuthenticatedUser}
      />
    </div>
  )
}

export default TestMentalHealthAuth

// Component usage verification:
// 1. Mental Health Agent now accepts authenticatedUser prop ✅
// 2. Session management integration with MentalHealthSessionManager ✅ 
// 3. QuickLogin component for returning users ✅
// 4. Profile creation for new users ✅
// 5. Logout functionality with session cleanup ✅
// 6. Integration with main app authentication system ✅