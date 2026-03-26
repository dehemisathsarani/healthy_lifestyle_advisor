import { RECAPTCHA_SITE_KEY } from './env'

let scriptLoaded = false
let scriptLoadingPromise: Promise<void> | null = null

function injectScript(): Promise<void> {
  if (scriptLoaded) return Promise.resolve()
  if (scriptLoadingPromise) return scriptLoadingPromise
  scriptLoadingPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(RECAPTCHA_SITE_KEY)}`
    script.async = true
    script.onload = () => {
      scriptLoaded = true
      resolve()
    }
    script.onerror = () => reject(new Error('reCAPTCHA failed to load'))
    document.head.appendChild(script)
  })
  return scriptLoadingPromise
}

export async function getRecaptchaToken(action: string): Promise<string | null> {
  if (!RECAPTCHA_SITE_KEY) return null
  await injectScript()
  // @ts-expect-error: grecaptcha is injected globally
  if (!window.grecaptcha) return null
  // @ts-expect-error: grecaptcha is injected globally
  return await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action })
}


