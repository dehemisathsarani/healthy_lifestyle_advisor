import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Dashboard from '../pages/Dashboard'
import WorkoutPlanner from '../pages/WorkoutPlanner'
import ExerciseLibrary from '../pages/ExerciseLibrary'
import WorkoutPlanDetail from '../pages/WorkoutPlanDetail'
import WorkoutHistory from '../pages/WorkoutHistory'
import UserHealthData from '../pages/UserHealthData'
import FitnessGoals from '../pages/FitnessGoals'
import { demoMode } from '../api'

// Initialize the demo mode for development
demoMode.isDemoMode = () => true;

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto py-6 px-4 max-w-7xl">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/planner" element={<WorkoutPlanner />} />
          <Route path="/exercises" element={<ExerciseLibrary />} />
          <Route path="/history" element={<WorkoutHistory />} />
          <Route path="/workout/:id" element={<WorkoutPlanDetail />} />
          <Route path="/health-data" element={<UserHealthData />} />
          <Route path="/goals" element={<FitnessGoals />} />
        </Routes>
      </main>
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="container mx-auto px-4 text-center text-gray-500">
          <p>© {new Date().getFullYear()} Fitness Agent - Healthy Lifestyle Advisor</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
