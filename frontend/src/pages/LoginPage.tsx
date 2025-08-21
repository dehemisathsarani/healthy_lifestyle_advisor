import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export const LoginPage = () => {
  const { loginWithJwt } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      // TODO: replace with real API call
      const fakeJwt =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
        btoa(JSON.stringify({ sub: email, name: email.split('@')[0], exp: Math.floor(Date.now() / 1000) + 60 * 60 })) +
        '.signature'
      loginWithJwt(fakeJwt)
      navigate('/dashboard')
    } catch (err) {
      setError('Invalid credentials')
    }
  }

  const handleOAuth = (provider: 'google' | 'github') => {
    // TODO: wire up OAuth redirect to backend
    alert(`OAuth with ${provider} not yet configured`)
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold">Login</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="mt-1 w-full rounded-md border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Password</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="mt-1 w-full rounded-md border px-3 py-2" />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="w-full rounded-md bg-brand px-4 py-2 text-white hover:bg-brand-dark">Sign in</button>
      </form>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button onClick={() => handleOAuth('google')} className="rounded-md border px-4 py-2 hover:bg-gray-50">Google</button>
        <button onClick={() => handleOAuth('github')} className="rounded-md border px-4 py-2 hover:bg-gray-50">GitHub</button>
      </div>
    </div>
  )
}


