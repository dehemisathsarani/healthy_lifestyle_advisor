export const API_BASE = import.meta.env.VITE_API_BASE_URL as string | undefined
// Fitness agent backend may run on a different host/port; expose a separate env var
export const FITNESS_API_BASE = import.meta.env.VITE_FITNESS_API_URL as string | undefined
export const DEMO_MODE = String(import.meta.env.VITE_DEMO_MODE ?? '').toLowerCase() === 'true'
export const RECAPTCHA_SITE_KEY = (import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined) || ''

export function isDemoMode(): boolean {
  return DEMO_MODE || !API_BASE
}

// Helper: choose the fitness API base, falling back to the main API base if not set
export function getFitnessApiBase(): string | undefined {
  return FITNESS_API_BASE || API_BASE
}


