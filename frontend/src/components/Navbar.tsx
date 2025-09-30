import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { FaAppleAlt, FaDumbbell, FaUserCircle } from 'react-icons/fa'
import { useEffect, useRef, useState } from 'react'

export const Navbar = () => {
  const { isAuthenticated, userName, profile, logout } = useAuth()
  const navigate = useNavigate()
  const details = [
    { label: 'Name', value: profile?.name ?? userName ?? '-' },
    { label: 'Email', value: profile?.email ?? '-' },
    { label: 'Age', value: profile?.age ?? '-' },
    { label: 'Country', value: profile?.country ?? '-' },
    { label: 'Mobile', value: profile?.mobile ?? '-' },
  ]

  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!menuRef.current) return
      if (!menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [])

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
          <NavLink to="/calendar" className={({ isActive }) => isActive ? 'text-brand font-medium' : 'text-gray-600 hover:text-gray-900'}>Calendar</NavLink>
          <NavLink to="/about" className={({ isActive }) => isActive ? 'text-brand font-medium' : 'text-gray-600 hover:text-gray-900'}>About</NavLink>
        </nav>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <div className="relative" ref={menuRef}>
                <button onClick={() => navigate('/profile')} className="inline-flex items-center gap-2 rounded-md bg-brand px-3 py-2 text-white shadow hover:bg-brand-dark">
                  <FaUserCircle /> Profile
                </button>
                {open && (
                <div className="absolute right-0 mt-2 min-w-[240px] rounded-lg border bg-white p-4 text-sm shadow-lg">
                  <div className="mb-2 font-medium">Account</div>
                  <dl className="space-y-1">
                    {details.map((d) => (
                      <div key={d.label} className="flex justify-between gap-4">
                        <dt className="text-gray-500">{d.label}</dt>
                        <dd className="text-gray-800 text-right">{String(d.value)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                )}
              </div>
              <button onClick={() => navigate('/dashboard')} className="hidden sm:inline-flex items-center gap-2 rounded-md border px-3 py-2 text-gray-700 hover:bg-gray-50">
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


