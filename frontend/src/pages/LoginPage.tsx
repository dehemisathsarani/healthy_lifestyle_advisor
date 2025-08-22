import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { FaEnvelope, FaLock, FaArrowRight } from 'react-icons/fa'

export const LoginPage = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [oauthInProgress, setOauthInProgress] = useState(false)

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return
      if (event.data?.type === 'oauth-success') {
        setOauthInProgress(false)
        navigate('/dashboard', { replace: true })
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
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
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
        <div className="relative">
          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="mt-1 text-sm text-gray-600">Sign in to continue to your dashboard</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium">Email</label>
              <div className="mt-1 flex items-center gap-2 rounded-md border px-3 py-2 focus-within:ring-2 focus-within:ring-brand">
                <FaEnvelope className="text-gray-400" />
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="w-full bg-transparent outline-none" placeholder="you@example.com" />
              </div>
            </div>
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
        </div>
      </div>
    </div>
  )
}


