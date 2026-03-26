import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'

// Components
import Navbar from '../components/Navbar'
import Dashboard from '../pages/dashboard'
import SubmealPage from '../pages/submeal'
import UserProfile from '../components/UserProfile'
import MealPlan from '../pages/MealPlan'
import History from '../pages/History'

// Types
import type { UserProfile as UserProfileType } from '../api'

function App() {
  const [user, setUser] = useState<UserProfileType | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check for existing user data on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('dietAgentUser')
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        setUser(userData)
        setIsAuthenticated(true)
      } catch (error) {
        console.error('Error parsing saved user data:', error)
        localStorage.removeItem('dietAgentUser')
      }
    }
  }, [])

  const handleUserUpdate = (userData: UserProfileType) => {
    setUser(userData)
    setIsAuthenticated(true)
    localStorage.setItem('dietAgentUser', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('dietAgentUser')
  }

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <Navbar 
          user={user} 
          isAuthenticated={isAuthenticated} 
          onLogout={handleLogout} 
        />
        
        <main className="pt-16">
          <Routes>
            <Route 
              path="/" 
              element={
                isAuthenticated && user ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <UserProfile onUserUpdate={handleUserUpdate} />
                )
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                isAuthenticated && user ? (
                  <Dashboard />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            <Route 
              path="/analyze" 
              element={
                isAuthenticated && user ? (
                  <SubmealPage />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            <Route 
              path="/meal-plan" 
              element={
                isAuthenticated && user ? (
                  <MealPlan />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            <Route 
              path="/history" 
              element={
                isAuthenticated && user ? (
                  <History />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            <Route 
              path="/profile" 
              element={
                isAuthenticated && user ? (
                  <UserProfile user={user} onUserUpdate={handleUserUpdate} />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
