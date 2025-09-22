import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { FaUser, FaAt, FaLock, FaGlobe, FaPhone, FaHashtag, FaCheckCircle, FaTimesCircle, FaEye, FaEyeSlash, FaLinkedin, FaTwitter, FaInstagram, FaFacebook, FaYoutube, FaGithub, FaHome } from 'react-icons/fa'
import { SORTED_COUNTRIES } from '../data/countries'
// import { getRecaptchaToken } from '../lib/recaptcha'

export const RegisterPage = () => {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [age, setAge] = useState<number | ''>('')
  const [country, setCountry] = useState('')
  const [dialCode, setDialCode] = useState('')
  const [mobile, setMobile] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Inline validation helpers
  const isNonEmpty = (v: string) => v.trim().length > 0
  const isName = (v: string) => /^([\p{L}][\p{L}\s.'-]{1,58}[\p{L}]?)$/u.test(v.trim())
  const isEmail = (v: string) => /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,24}$/i.test(v)
  const mobileDigits = (v: string) => v.replace(/\D/g, '')
  const isMobile = (v: string) => {
    if (v === '') return true
    const d = mobileDigits(v)
    return d.length >= 6 && d.length <= 15
  }

  // Live sanitizers: prevent unsuitable characters while typing
  const sanitizeName = (v: string) =>
    v
      .normalize('NFKC')
      .replace(/[^\p{L}\s.'-]/gu, '') // only letters, spaces, dot, apostrophe, hyphen
      .replace(/\s{2,}/g, ' ') // collapse multiple spaces
      .slice(0, 60)

  const sanitizeAge = (v: string) => v.replace(/\D/g, '').slice(0, 3)
  const sanitizeMobile = (v: string) => v.replace(/\D/g, '').slice(0, 15)
  const sanitizeEmail = (v: string) => v.replace(/\s+/g, '').slice(0, 254)

  function getPasswordChecks(v: string) {
    return {
      length: v.length >= 8,
      lower: /[a-z]/.test(v),
      upper: /[A-Z]/.test(v),
      number: /[0-9]/.test(v),
      special: /[^A-Za-z0-9]/.test(v),
    }
  }

  const passwordChecks = useMemo(() => getPasswordChecks(password), [password])
  const passwordScore = useMemo(() => Object.values(passwordChecks).filter(Boolean).length, [passwordChecks])
  const passwordLabel = useMemo(() => {
    const map = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong']
    return map[passwordScore] || 'Very weak'
  }, [passwordScore])

  const ageValid = age === '' || (typeof age === 'number' && age >= 13 && age <= 120)
  const countryValid = isNonEmpty(country)
  const dialCodeValid = mobile === '' ? true : isNonEmpty(dialCode)
  const passwordRequiredOk = passwordChecks.length && passwordChecks.lower && passwordChecks.upper && passwordChecks.number && passwordScore >= 4
  const confirmOk = password === confirmPassword && password.length > 0

  const formValid =
    isName(name) &&
    isEmail(email) &&
    passwordRequiredOk &&
    ageValid &&
    countryValid &&
    dialCodeValid &&
    isMobile(mobile) &&
    confirmOk

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      // const captchaToken = await getRecaptchaToken('register')
      const fullMobile = dialCode && mobile ? `${dialCode} ${mobile}` : mobile
      // captchaToken can be added to your backend payload when you wire the API
      await register(name, email, password, { age: typeof age === 'number' ? age : undefined, country, mobile: fullMobile })
      setSuccess('Successfully registered!')
      
      // Check for redirect after successful registration
      const redirectTo = sessionStorage.getItem('redirectTo')
      if (redirectTo) {
        sessionStorage.removeItem('redirectTo')
        setTimeout(() => navigate(redirectTo), 800)
      } else {
        setTimeout(() => navigate('/dashboard'), 800)
      }
    } catch {
      setError('Registration failed')
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="relative overflow-hidden rounded-2xl border bg-white/70 p-6 shadow-lg backdrop-blur">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
        
        {/* Floating Home Button */}
        <button
          onClick={() => navigate('/')}
          className="absolute top-4 right-4 z-20 group flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition-all duration-300 hover:bg-emerald-600 hover:scale-110 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          title="Back to Home"
        >
          <FaHome className="text-lg transition-transform duration-300 group-hover:scale-110" />
        </button>
        
        <div className="relative">
          <h1 className="text-3xl font-bold">Create your account</h1>
          <p className="mt-1 text-sm text-gray-600">Join and get your personalized fitness and nutrition guidance</p>
          
          {/* Login redirect */}
          <p className="mt-2 text-sm text-center text-gray-600">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-emerald-600 hover:text-emerald-700 font-medium underline transition-colors duration-200"
            >
              Sign in
            </button>
          </p>
          
          {/* Social Media Links */}
          <div className="mt-4 flex items-center justify-center gap-4">
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white transition-all hover:scale-110 hover:shadow-lg">
              <FaLinkedin className="text-lg" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500 text-white transition-all hover:scale-110 hover:shadow-lg">
              <FaTwitter className="text-lg" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white transition-all hover:scale-110 hover:shadow-lg">
              <FaInstagram className="text-lg" />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-700 text-white transition-all hover:scale-110 hover:shadow-lg">
              <FaFacebook className="text-lg" />
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white transition-all hover:scale-110 hover:shadow-lg">
              <FaYoutube className="text-lg" />
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 text-white transition-all hover:scale-110 hover:shadow-lg">
              <FaGithub className="text-lg" />
            </a>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium">Name</label>
              <div className="mt-1 flex items-center gap-2 rounded-md border px-3 py-2 focus-within:ring-2 focus-within:ring-brand">
                <FaUser className="text-gray-400" />
                <input value={name} onChange={(e) => setName(sanitizeName(e.target.value))} type="text" required aria-invalid={!isName(name)} className="w-full bg-transparent outline-none" placeholder="John Doe" maxLength={60} />
              </div>
              {!isName(name) && <p className="mt-1 text-xs text-red-600">Enter a valid name (letters, spaces, . ' - ).</p>}
            </div>

            <div>
              <label className="block text-sm font-medium">Age</label>
              <div className="mt-1 flex items-center gap-2 rounded-md border px-3 py-2 focus-within:ring-2 focus-within:ring-brand">
                <FaHashtag className="text-gray-400" />
                <input value={age} onChange={(e) => {
                  const s = sanitizeAge(e.target.value)
                  setAge(s === '' ? '' : Number(s))
                }} type="text" inputMode="numeric" pattern="[0-9]*" minLength={2} maxLength={3} aria-invalid={!ageValid} className="w-full bg-transparent outline-none" placeholder="25" />
              </div>
              {!ageValid && <p className="mt-1 text-xs text-red-600">Age must be between 13 and 120, or leave empty.</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">Country</label>
              <div className="mt-1 flex items-center gap-2 rounded-md border px-2 py-2 focus-within:ring-2 focus-within:ring-brand">
                <FaGlobe className="ml-1 text-gray-400" />
                <select value={country ? SORTED_COUNTRIES.find(c=>c.name===country)?.code ?? '' : ''} onChange={(e) => {
                  const selected = SORTED_COUNTRIES.find(c => c.code === e.target.value)
                  setCountry(selected?.name || '')
                  setDialCode(selected?.dialCode || '')
                }} className="w-full bg-transparent outline-none">
                  <option value="">Select country…</option>
                  {SORTED_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
              {!countryValid && <p className="mt-1 text-xs text-red-600">Country is required.</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">Mobile</label>
              <div className="mt-1 grid grid-cols-[auto_1fr] items-center gap-2">
                <div className="rounded-md border px-2 py-2 text-sm text-gray-700 min-w-20">
                  <select value={dialCode} onChange={(e) => setDialCode(e.target.value)} className="bg-transparent outline-none">
                    <option value="">Code</option>
                    {SORTED_COUNTRIES.map((c) => (
                      <option key={c.code} value={c.dialCode}>{c.dialCode}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 rounded-md border px-3 py-2 focus-within:ring-2 focus-within:ring-brand">
                  <FaPhone className="text-gray-400" />
                  <input value={mobile} onChange={(e) => setMobile(sanitizeMobile(e.target.value))} type="tel" inputMode="numeric" pattern="[0-9]*" aria-invalid={!isMobile(mobile)} className="w-full bg-transparent outline-none" placeholder="712345678" maxLength={15} />
                </div>
              </div>
              {!isMobile(mobile) && mobile !== '' && <p className="mt-1 text-xs text-red-600">Enter a valid phone number.</p>}
              {!dialCodeValid && <p className="mt-1 text-xs text-red-600">Select a dial code for the phone number.</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium">Email</label>
              <div className="mt-1 flex items-center gap-2 rounded-md border px-3 py-2 focus-within:ring-2 focus-within:ring-brand">
                <FaAt className="text-gray-400" />
                <input value={email} onChange={(e) => setEmail(sanitizeEmail(e.target.value))} type="email" inputMode="email" autoComplete="email" required aria-invalid={!isEmail(email)} className="w-full bg-transparent outline-none" placeholder="you@example.com" maxLength={254} />
              </div>
              {!isEmail(email) && <p className="mt-1 text-xs text-red-600">Enter a valid email address.</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium">Password</label>
              <div className="mt-1 flex items-center gap-2 rounded-md border px-3 py-2 focus-within:ring-2 focus-within:ring-brand">
                <FaLock className="text-gray-400" />
                <input value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} required aria-invalid={!passwordRequiredOk} className="w-full bg-transparent outline-none" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-gray-500 hover:text-gray-700">
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>Password strength: {passwordLabel}</span>
                  <span>{password.length} chars</span>
                </div>
                <div className="mt-1 grid grid-cols-5 gap-1">
                  {[0,1,2,3,4].map((i) => (
                    <div key={i} className={`h-1.5 rounded ${i < passwordScore ? 'bg-emerald-500' : 'bg-gray-200'}`}></div>
                  ))}
                </div>
                <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  {[
                    { ok: passwordChecks.length, label: '8+ chars' },
                    { ok: passwordChecks.lower, label: 'lowercase' },
                    { ok: passwordChecks.upper, label: 'uppercase' },
                    { ok: passwordChecks.number, label: 'number' },
                    { ok: passwordChecks.special, label: 'symbol (optional)' },
                  ].map((c) => (
                    <li key={c.label} className={`inline-flex items-center gap-1 ${c.ok ? 'text-emerald-600' : 'text-gray-500'}`}>
                      {c.ok ? <FaCheckCircle /> : <FaTimesCircle />} {c.label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium">Confirm Password</label>
              <div className="mt-1 flex items-center gap-2 rounded-md border px-3 py-2 focus-within:ring-2 focus-within:ring-brand">
                <FaLock className="text-gray-400" />
                <input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type={showConfirm ? 'text' : 'password'} required aria-invalid={!confirmOk} className="w-full bg-transparent outline-none" placeholder="••••••••" />
                <button type="button" onClick={() => setShowConfirm((v) => !v)} className="text-gray-500 hover:text-gray-700">
                  {showConfirm ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {!confirmOk && <p className="mt-1 text-xs text-red-600">Passwords do not match.</p>}
            </div>

            {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
            {success && <p className="sm:col-span-2 text-sm text-emerald-600">{success}</p>}

            <div className="sm:col-span-2">
              <button disabled={!formValid} className="group relative w-full overflow-hidden rounded-md bg-brand px-4 py-2 text-white shadow transition-transform active:scale-[.99] disabled:opacity-60 disabled:cursor-not-allowed">
                <span className="relative z-10 inline-flex items-center justify-center gap-2">
                  Create account
                </span>
                <span className="absolute inset-0 -z-0 bg-gradient-to-r from-emerald-400/0 via-white/20 to-emerald-400/0 opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
              {!formValid && (
                <p className="mt-2 text-xs text-gray-500 text-center">
                  Please fill all required fields correctly to enable the button.
                </p>
              )}
            </div>
          </form>
          
          {/* Footer with additional links */}
          <div className="mt-8 border-t pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <p className="text-sm text-gray-600">
                By creating an account, you agree to our{' '}
                <a href="#" className="text-brand hover:underline">Terms of Service</a> and{' '}
                <a href="#" className="text-brand hover:underline">Privacy Policy</a>
              </p>
              <div className="flex items-center gap-6 text-sm">
                <a href="#" className="text-gray-500 hover:text-brand transition-colors">Help Center</a>
                <a href="#" className="text-gray-500 hover:text-brand transition-colors">Contact Support</a>
                <a href="#" className="text-gray-500 hover:text-brand transition-colors">About Us</a>
                <button
                  onClick={() => navigate('/')}
                  className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors duration-200 font-medium"
                >
                  <FaHome className="text-sm" />
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

