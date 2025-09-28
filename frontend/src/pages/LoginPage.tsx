import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { FaEnvelope, FaLock, FaArrowRight, FaHome, FaUser } from 'react-icons/fa'

export const LoginPage = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [loginMethod, setLoginMethod] = useState<'email' | 'name'>('email')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [oauthInProgress, setOauthInProgress] = useState(false)

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return
      if (event.data?.type === 'oauth-success') {
        setOauthInProgress(false)
        // Check for redirect after successful OAuth login
        const redirectTo = sessionStorage.getItem('redirectTo')
        if (redirectTo) {
          sessionStorage.removeItem('redirectTo')
          navigate(redirectTo, { replace: true })
        } else {
          navigate('/dashboard', { replace: true })
        }
      } else if (event.data?.type === 'oauth-error') {
        setOauthInProgress(false)
        setError('OAuth sign-in failed')
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      // For name-based login, we'll need to find the user by name first
      // Since the backend expects email, we'll need to handle this differently
      if (loginMethod === 'name') {
        // Check localStorage for saved user profiles to find email by name
        const savedProfiles = JSON.parse(localStorage.getItem('userProfiles') || '[]')
        const foundProfile = savedProfiles.find((profile: { name: string; email: string }) => 
          profile.name.toLowerCase() === name.toLowerCase()
        )
        
        if (foundProfile) {
          await login(foundProfile.email, password)
        } else {
          setError('User not found. Please use email login or register first.')
          return
        }
      } else {
        await login(email, password)
      }
      
      // Check for redirect after successful login
      const redirectTo = sessionStorage.getItem('redirectTo')
      if (redirectTo) {
        sessionStorage.removeItem('redirectTo')
        navigate(redirectTo)
      } else {
        navigate('/dashboard')
      }
    } catch {
      setError('Invalid credentials')
    }
  }

  const handleOAuth = async (provider: 'google') => {
    const redirectUri = `${window.location.origin}/oauth/callback?popup=1`
    try {
      const { getOAuthUrl } = await import('../lib/api')
      const authUrl = await getOAuthUrl(provider, redirectUri)
      const width = 480
      const height = 640
      const left = window.screenX + (window.outerWidth - width) / 2
      const top = window.screenY + (window.outerHeight - height) / 2
      setOauthInProgress(true)
      window.open(authUrl, 'google-oauth', `width=${width},height=${height},left=${left},top=${top}`)
    } catch {
      setOauthInProgress(true)
      const demoUrl = `/oauth/callback?provider=${provider}&code=demo-code&popup=1`
      const width = 480
      const height = 640
      const left = window.screenX + (window.outerWidth - width) / 2
      const top = window.screenY + (window.outerHeight - height) / 2
      window.open(demoUrl, 'google-oauth', `width=${width},height=${height},left=${left},top=${top}`)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="relative overflow-hidden rounded-2xl border bg-white/70 p-6 shadow-lg backdrop-blur">
        <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-brand/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />
        
        {/* Home Button */}
        <div className="absolute top-4 right-4">
          <button
            onClick={() => navigate('/')}
            className="group flex items-center justify-center w-10 h-10 rounded-full bg-white/80 hover:bg-white border border-gray-200 hover:border-emerald-300 shadow-sm hover:shadow-md transition-all duration-200"
            title="Go to Homepage"
          >
            <FaHome className="text-gray-600 hover:text-emerald-600 transition-colors duration-200 group-hover:scale-110" />
          </button>
        </div>
        
        <div className="relative">
          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="mt-1 text-sm text-gray-600">Sign in to continue to your dashboard</p>

          {/* Login Method Selector */}
          <div className="mt-4 flex rounded-lg border p-1 bg-gray-50">
            <button
              type="button"
              onClick={() => setLoginMethod('email')}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                loginMethod === 'email'
                  ? 'bg-white text-brand shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FaEnvelope className="inline w-4 h-4 mr-2" />
              Email
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod('name')}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                loginMethod === 'name'
                  ? 'bg-white text-brand shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FaUser className="inline w-4 h-4 mr-2" />
              Name
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {loginMethod === 'email' ? (
              <div>
                <label className="block text-sm font-medium">Email</label>
                <div className="mt-1 flex items-center gap-2 rounded-md border px-3 py-2 focus-within:ring-2 focus-within:ring-brand">
                  <FaEnvelope className="text-gray-400" />
                  <input 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    type="email" 
                    required 
                    className="w-full bg-transparent outline-none" 
                    placeholder="you@example.com" 
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium">Name</label>
                <div className="mt-1 flex items-center gap-2 rounded-md border px-3 py-2 focus-within:ring-2 focus-within:ring-brand">
                  <FaUser className="text-gray-400" />
                  <input 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    type="text" 
                    required 
                    className="w-full bg-transparent outline-none" 
                    placeholder="Your full name" 
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Name-based login uses locally saved profiles
                </p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium">Password</label>
              <div className="mt-1 flex items-center gap-2 rounded-md border px-3 py-2 focus-within:ring-2 focus-within:ring-brand">
                <FaLock className="text-gray-400" />
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="w-full bg-transparent outline-none" placeholder="••••••••" />
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button disabled={oauthInProgress} className="group relative w-full overflow-hidden rounded-md bg-brand px-4 py-2 text-white shadow transition-transform active:scale-[.99] disabled:opacity-70 disabled:cursor-not-allowed">
              <span className="relative z-10 inline-flex items-center justify-center gap-2">
                Sign in <FaArrowRight className="transition-transform group-hover:translate-x-0.5" />
              </span>
              <span className="absolute inset-0 -z-0 bg-gradient-to-r from-emerald-400/0 via-white/20 to-emerald-400/0 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          </form>

          <div className="mt-6 grid grid-cols-1 gap-3">
            <button onClick={() => handleOAuth('google')} disabled={oauthInProgress} className="rounded-md border px-4 py-2 hover:bg-gray-50 disabled:opacity-70 disabled:cursor-not-allowed">Continue with Google</button>
          </div>

          {/* Additional Navigation */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <button
                onClick={() => navigate('/register')}
                className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors duration-200"
              >
                Don't have an account? Sign up
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 font-medium transition-colors duration-200 group"
              >
                <FaHome className="group-hover:scale-110 transition-transform duration-200" />
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


