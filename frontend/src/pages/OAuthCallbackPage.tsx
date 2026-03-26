import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { exchangeOAuthCode } from '../lib/api'
import { useAuth } from '../auth/AuthContext'

export const OAuthCallbackPage = () => {
  const { loginWithJwt } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const provider = (params.get('provider') || 'google') as 'google'
    const code = params.get('code')
    const isPopup = params.get('popup') === '1'
    const redirectUri = `${window.location.origin}/oauth/callback`
    if (!code) {
      setError('Missing authorization code')
      return
    }
    exchangeOAuthCode(provider, code, redirectUri + (isPopup ? '?popup=1' : ''))
      .then(() => {
        if (isPopup && window.opener) {
          window.opener.postMessage({ type: 'oauth-success' }, window.location.origin)
          window.close()
        } else {
          navigate('/dashboard', { replace: true })
        }
      })
      .catch(() => {
        if (isPopup && window.opener) {
          window.opener.postMessage({ type: 'oauth-error' }, window.location.origin)
          window.close()
        } else {
          setError('OAuth sign-in failed')
        }
      })
  }, [location.search, loginWithJwt, navigate])

  return (
    <div className="mx-auto max-w-md text-center">
      <h1 className="text-2xl font-semibold">Signing you in…</h1>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </div>
  )
}


