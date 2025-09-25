export const API_BASE = import.meta.env.VITE_API_BASE_URL as string | undefined
export const DEMO_MODE = String(import.meta.env.VITE_DEMO_MODE ?? '').toLowerCase() === 'true'
export const RECAPTCHA_SITE_KEY = (import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined) || ''

export function isDemoMode(): boolean {
  return DEMO_MODE || !API_BASE
}


