import { getOAuthUrl } from './api'

export async function startGoogleOAuthPopup(): Promise<void> {
  const redirectUri = `${window.location.origin}/oauth/callback?popup=1`
  const width = 480
  const height = 640
  const left = window.screenX + (window.outerWidth - width) / 2
  const top = window.screenY + (window.outerHeight - height) / 2

  const authUrl = await getOAuthUrl('google', redirectUri)

  return new Promise<void>((resolve, reject) => {
    const popup = window.open(
      authUrl,
      'google-oauth',
      `width=${width},height=${height},left=${left},top=${top}`,
    )
    if (!popup) {
      reject(new Error('Popup blocked'))
      return
    }

    const timeout = window.setTimeout(() => {
      window.removeEventListener('message', onMessage)
      try { popup.close() } catch {}
      reject(new Error('OAuth timed out'))
    }, 2 * 60 * 1000)

    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return
      if (event.data?.type === 'oauth-success') {
        window.clearTimeout(timeout)
        window.removeEventListener('message', onMessage)
        try { popup.close() } catch {}
        resolve()
      } else if (event.data?.type === 'oauth-error') {
        window.clearTimeout(timeout)
        window.removeEventListener('message', onMessage)
        try { popup.close() } catch {}
        reject(new Error('OAuth failed'))
      }
    }

    window.addEventListener('message', onMessage)
  })
}


