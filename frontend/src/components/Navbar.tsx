import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { FaAppleAlt, FaDumbbell } from 'react-icons/fa'

export const Navbar = () => {
  const { isAuthenticated, userName, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold text-gray-900">
          <FaAppleAlt className="text-brand" />
          <span>HealthFit Advisor</span>
        </Link>
        <nav className="flex items-center gap-6">
          <NavLink to="/" className={({ isActive }) => isActive ? 'text-brand font-medium' : 'text-gray-600 hover:text-gray-900'}>Home</NavLink>
          <NavLink to="/services" className={({ isActive }) => isActive ? 'text-brand font-medium' : 'text-gray-600 hover:text-gray-900'}>Services</NavLink>
          <NavLink to="/about" className={({ isActive }) => isActive ? 'text-brand font-medium' : 'text-gray-600 hover:text-gray-900'}>About</NavLink>
        </nav>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="hidden sm:inline text-sm text-gray-700">Hi, {userName}</span>
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-2 rounded-md bg-brand px-3 py-2 text-white shadow hover:bg-brand-dark"
              >
                <FaDumbbell /> Dashboard
              </button>
              <button
                onClick={logout}
                className="rounded-md border px-3 py-2 text-gray-700 hover:bg-gray-50"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/login')} className="rounded-md border px-3 py-2 text-gray-700 hover:bg-gray-50">Login</button>
              <button onClick={() => navigate('/register')} className="rounded-md bg-gray-900 px-3 py-2 text-white hover:bg-black">Sign up</button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}


