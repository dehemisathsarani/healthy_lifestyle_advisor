import { useEffect, useState, useRef } from 'react'

interface FitnessAgentProps {
  onBackToServices: () => void
  onNavigateToDietAgent?: (data: any) => void
}

export const FitnessAgent: React.FC<FitnessAgentProps> = ({ onBackToServices, onNavigateToDietAgent }) => {
  const [workoutCompleted, setWorkoutCompleted] = useState(false)
  const [workoutData, setWorkoutData] = useState<any>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Listen for messages from the Fitness Frontend iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security check - only accept messages from localhost:5174
      if (event.origin !== 'http://localhost:5174') return
      
      console.log('📨 Message received from Fitness Agent:', event.data)
      
      // Handle navigation back to services
      if (event.data === 'NAVIGATE_TO_SERVICES' || event.data.action === 'NAVIGATE_TO_SERVICES') {
        onBackToServices()
      }
      
      // Handle workout completion
      if (event.data.action === 'WORKOUT_COMPLETED') {
        console.log('✅ Workout completed:', event.data.data)
        setWorkoutCompleted(true)
        setWorkoutData(event.data.data)
        
        // Send workout completion to backend
        sendWorkoutCompletion(event.data.data)
      }
      
      // Handle navigation to diet agent
      if (event.data.action === 'NAVIGATE_TO_DIET_AGENT') {
        console.log('🥗 Navigating to Diet Agent with data:', event.data.data)
        if (onNavigateToDietAgent) {
          onNavigateToDietAgent(event.data.data)
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onBackToServices, onNavigateToDietAgent])

  // Listen for meal data from food analysis component
  useEffect(() => {
    const handleOpenFitnessPlanner = (event: any) => {
      const { calories, mealData, userProfile, userId } = event.detail
      
      console.log('🏋️ ========================================')
      console.log('🏋️ FITNESS PLANNER OPENED WITH DATA')
      console.log('🏋️ ========================================')
      console.log('📊 Target Calories:', calories)
      console.log('🍽️ Meal Data:', mealData)
      console.log('👤 User Profile:', userProfile)
      console.log('🏋️ ========================================')
      
      // Send meal data to fitness iframe
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          action: 'MEAL_DATA_RECEIVED',
          data: {
            targetCalories: calories,
            mealData: mealData,
            userProfile: userProfile,
            userId: userId
          }
        }, 'http://localhost:5174')
        
        console.log('✅ Meal data sent to Fitness iframe')
      }
    }
    
    window.addEventListener('openFitnessPlanner', handleOpenFitnessPlanner)
    return () => window.removeEventListener('openFitnessPlanner', handleOpenFitnessPlanner)
  }, [])

  // Send workout completion to backend
  const sendWorkoutCompletion = async (data: any) => {
    try {
      console.log('📤 Sending workout completion to backend:', data)
      
      const response = await fetch('http://localhost:8005/api/integration/fitness/workout-completed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.workoutName || data.workoutType || 'Mixed Workout',
          userId: data.userId,
          workoutType: data.workoutType || 'Mixed Workout',
          exerciseDuration: data.duration || 45,
          duration: data.duration || 45,  // Keep for compatibility
          caloriesBurnt: data.caloriesBurned,
          caloriesBurned: data.caloriesBurned,  // Keep for compatibility
          date: new Date().toISOString().split('T')[0],
          timestamp: new Date().toISOString(),
          relatedMealId: data.mealId || null
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Workout completion sent successfully:', result)
        
        // Show success notification
        const notification = document.createElement('div')
        notification.className = 'fixed top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl z-50 min-w-[350px]'
        notification.innerHTML = `
          <div class="font-bold text-lg mb-2">✅ Workout Logged!</div>
          <div class="text-sm space-y-1">
            <div>💪 <strong>Type:</strong> ${data.workoutType || 'Mixed Workout'}</div>
            <div>🔥 <strong>Calories Burned:</strong> ${data.caloriesBurned} kcal</div>
            <div>⏱️ <strong>Duration:</strong> ${data.duration || 45} minutes</div>
            <div class="mt-2 pt-2 border-t border-white/30">
              📊 <em>Ready to update your diet plan!</em>
            </div>
          </div>
        `
        document.body.appendChild(notification)
        setTimeout(() => notification.remove(), 5000)
      } else {
        console.error('❌ Failed to send workout completion')
      }
    } catch (error) {
      console.error('❌ Error sending workout completion:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-white z-50">
      {/* Embedded Fitness Frontend - Full Screen */}
      <iframe
        ref={iframeRef}
        src="http://localhost:5174"
        className="w-full h-screen border-0"
        title="Fitness Hub Interface"
        allow="fullscreen"
      />
      
      {/* Workout Completion Overlay */}
      {workoutCompleted && workoutData && (
        <div className="fixed bottom-4 right-4 bg-white rounded-xl shadow-2xl p-6 max-w-md z-50 border-2 border-green-500">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-2xl">
              ✅
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Workout Completed!
              </h3>
              <p className="text-gray-600 mb-4">
                Great job! You burned <strong>{workoutData.caloriesBurned} calories</strong>.
              </p>
              <button
                onClick={() => {
                  if (onNavigateToDietAgent) {
                    onNavigateToDietAgent(workoutData)
                  }
                  setWorkoutCompleted(false)
                }}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all font-medium flex items-center justify-center gap-2"
              >
                <span>📊</span>
                <span>See Diet Plan & Update Calories</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
