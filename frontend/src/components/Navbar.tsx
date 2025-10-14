import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { HiCake, HiCpuChip, HiUser } from 'react-icons/hi2'
import { useEffect, useRef, useState } from 'react'

export const Navbar = () => {
  const { isAuthenticated, userName, profile, logout } = useAuth()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const searchRef = useRef<HTMLDivElement | null>(null)
  
  // Searchable content database
  const searchableContent = [
    {
      id: 1,
      title: "AI Health Journey",
      description: "Get personalized health analysis",
      category: "Features",
      icon: "🌟",
      action: () => navigate('/health-journey'),
      keywords: ["ai", "health", "journey", "analysis", "mental health", "diet", "fitness"]
    },
    {
      id: 2,
      title: "Wellness Insights",
      description: "AI-powered daily tips",
      category: "Features",
      icon: "💖",
      action: () => {},
      keywords: ["wellness", "insights", "ai", "tips", "health"]
    },
    {
      id: 3,
      title: "Smart Nutrition",
      description: "Personalized meal plans",
      category: "Features",
      icon: "🍎",
      action: () => navigate('/services'),
      keywords: ["nutrition", "meal plans", "food", "diet"]
    },
    {
      id: 4,
      title: "Fitness Coaching",
      description: "AI-designed workout routines",
      category: "Features",
      icon: "🏃",
      action: () => navigate('/services'),
      keywords: ["fitness", "workout", "exercise", "coaching"]
    },
    {
      id: 5,
      title: "BMI/TDEE Calculator",
      description: "Calculate body metrics",
      category: "Tools",
      icon: "🧠",
      action: () => navigate('/services'),
      keywords: ["bmi", "tdee", "calculator", "body mass index"]
    },
    {
      id: 6,
      title: "Meal Analyzer",
      description: "AI-powered food recognition",
      category: "Tools",
      icon: "🍽️",
      action: () => navigate('/services'),
      keywords: ["meal", "analyzer", "food", "scanning"]
    },
    {
      id: 7,
      title: "Meal Planner",
      description: "Create personalized meal plans",
      category: "Tools",
      icon: "📋",
      action: () => navigate('/services'),
      keywords: ["meal", "planner", "diet", "nutrition"]
    },
    {
      id: 8,
      title: "Health Calendar",
      description: "Schedule workouts and meals",
      category: "Tools",
      icon: "📅",
      action: () => navigate('/calendar'),
      keywords: ["calendar", "schedule", "planning"]
    },
    {
      id: 9,
      title: "Services",
      description: "All comprehensive services",
      category: "Pages",
      icon: "🎯",
      action: () => navigate('/services'),
      keywords: ["services", "features", "tools"]
    },
    {
      id: 10,
      title: "About Us",
      description: "Learn more about us",
      category: "Pages",
      icon: "ℹ️",
      action: () => navigate('/about'),
      keywords: ["about", "information", "company"]
    },
    {
      id: 11,
      title: "Dashboard",
      description: "View your analytics",
      category: "Account",
      icon: "📊",
      action: () => navigate('/dashboard'),
      keywords: ["dashboard", "analytics", "stats"]
    },
    {
      id: 12,
      title: "Login",
      description: "Sign in to your account",
      category: "Account",
      icon: "🔐",
      action: () => navigate('/login'),
      keywords: ["login", "sign in", "account"]
    },
    {
      id: 13,
      title: "Register",
      description: "Create new account",
      category: "Account",
      icon: "📝",
      action: () => navigate('/register'),
      keywords: ["register", "sign up", "create account"]
    }
  ]
  
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query.trim() === '') {
      setSearchResults([])
      setIsSearching(false)
      return
    }
    
    const lowerQuery = query.toLowerCase()
    const filtered = searchableContent.filter(item => {
      return (
        item.title.toLowerCase().includes(lowerQuery) ||
        item.description.toLowerCase().includes(lowerQuery) ||
        item.category.toLowerCase().includes(lowerQuery) ||
        item.keywords.some(keyword => keyword.includes(lowerQuery))
      )
    })
    
    setSearchResults(filtered)
    setIsSearching(true)
  }
  
  const handleSearchResultClick = (item: any) => {
    item.action()
    clearSearch()
  }
  
  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    setIsSearching(false)
  }
  
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
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearching(false)
      }
    }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [])

  return (
    <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold text-gray-900">
          <HiCake className="text-brand" />
          <span>HealthFit Advisor</span>
        </Link>
        <nav className="flex items-center gap-6">
          <NavLink to="/" className={({ isActive }) => isActive ? 'text-brand font-medium' : 'text-gray-600 hover:text-gray-900'}>Home</NavLink>
          <NavLink to="/services" className={({ isActive }) => isActive ? 'text-brand font-medium' : 'text-gray-600 hover:text-gray-900'}>Services</NavLink>
          <NavLink to="/calendar" className={({ isActive }) => isActive ? 'text-brand font-medium' : 'text-gray-600 hover:text-gray-900'}>Calendar</NavLink>
          <NavLink to="/about" className={({ isActive }) => isActive ? 'text-brand font-medium' : 'text-gray-600 hover:text-gray-900'}>About</NavLink>
          
          {/* Compact Search Bar */}
          <div className="relative ml-2" ref={searchRef}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search..."
                className="w-48 pl-8 pr-8 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-2 flex items-center hover:scale-110 transition-transform"
                >
                  <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {isSearching && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 max-h-96 overflow-y-auto z-50">
                {searchResults.length > 0 ? (
                  <div className="p-1">
                    <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-100">
                      {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                    </div>
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleSearchResultClick(result)}
                        className="w-full text-left px-3 py-2 hover:bg-emerald-50 rounded-md transition-colors group flex items-start space-x-2"
                      >
                        <div className="text-xl flex-shrink-0 group-hover:scale-110 transition-transform">
                          {result.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-1 mb-0.5">
                            <h3 className="text-sm font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                              {result.title}
                            </h3>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                              {result.category}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-1">
                            {result.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <div className="text-3xl mb-2">🔍</div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">No results</h3>
                    <p className="text-xs text-gray-600">
                      Try "meal", "fitness", or "BMI"
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </nav>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <div className="relative" ref={menuRef}>
                <button onClick={() => navigate('/profile')} className="inline-flex items-center gap-2 rounded-md bg-brand px-3 py-2 text-white shadow hover:bg-brand-dark">
                  <HiUser /> Profile
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
                <HiCpuChip /> Dashboard
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


