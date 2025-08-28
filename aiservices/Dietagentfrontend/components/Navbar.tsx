import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import type { UserProfile } from '../api'

interface NavbarProps {
  user: UserProfile | null
  isAuthenticated: boolean
  onLogout: () => void
}

const Navbar: React.FC<NavbarProps> = ({ user, isAuthenticated, onLogout }) => {
  const location = useLocation()

  const isActive = (path: string) => {
    return location.pathname === path
  }

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">🥗</span>
            </div>
            <Link to="/" className="text-xl font-bold text-gray-800">
              Diet Agent
            </Link>
          </div>

          {/* Navigation Links */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/dashboard"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/dashboard')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                📊 Dashboard
              </Link>
              <Link
                to="/analyze"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/analyze')
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                📸 Analyze Food
              </Link>
              <Link
                to="/meal-plan"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/meal-plan')
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                📋 Meal Plan
              </Link>
              <Link
                to="/history"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/history')
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                📊 History
              </Link>
              <Link
                to="/profile"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/profile')
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                👤 Profile
              </Link>
            </div>
          )}

          {/* User Info and Actions */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <>
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-medium text-gray-900">
                    Hello, {user.user_id}
                  </span>
                  <span className="text-xs text-gray-500">
                    {user.goal.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="text-sm text-gray-600">
                Complete your profile to get started
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isAuthenticated && (
        <div className="md:hidden border-t border-gray-200 bg-white/90">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to="/dashboard"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/dashboard')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              📊 Dashboard
            </Link>
            <Link
              to="/analyze"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/analyze')
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              📸 Analyze Food
            </Link>
            <Link
              to="/meal-plan"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/meal-plan')
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              📋 Meal Plan
            </Link>
            <Link
              to="/history"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/history')
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              📊 History
            </Link>
            <Link
              to="/profile"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/profile')
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              👤 Profile
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
