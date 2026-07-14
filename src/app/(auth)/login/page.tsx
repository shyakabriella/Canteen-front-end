'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  QrCode,
  ShoppingBag,
  UtensilsCrossed,
  WalletCards,
} from 'lucide-react'
import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSystemSettings } from '@/contexts/SystemSettingsContext'

function settingIsEnabled(
  value: unknown,
  defaultValue = true,
): boolean {
  if (value === undefined || value === null) {
    return defaultValue
  }

  if (
    value === false ||
    value === 0 ||
    value === '0' ||
    value === 'false'
  ) {
    return false
  }

  return true
}

export default function LoginPage() {
  const router = useRouter()

  const {
    login,
    isAuthenticated,
    isLoading: authLoading,
  } = useAuth()

  const { settings } = useSystemSettings()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const appName = String(
    settings.app_name ?? 'Smart Canteen',
  )

  const registrationEnabled = settingIsEnabled(
    settings.registration_enabled,
  )

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace('/dashboard')
    }
  }, [authLoading, isAuthenticated, router])

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setErrorMessage('')
    setIsSubmitting(true)

    try {
      await login(
        {
          email: email.trim(),
          password,
        },
        rememberMe,
      )

      router.replace('/dashboard')
      router.refresh()
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to sign in.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#07559d] px-4 py-8 sm:px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(78,169,255,0.65),_transparent_44%),linear-gradient(180deg,#287dc8_0%,#07559d_52%,#033f78_100%)]" />

      <div className="relative z-10 grid w-full max-w-6xl overflow-hidden rounded-[30px] bg-white shadow-[0_35px_100px_rgba(0,31,73,0.45)] lg:min-h-[650px] lg:grid-cols-[1.05fr_0.95fr]">
        {/* Left information section */}
        <section className="relative flex min-h-[310px] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0876c9] via-[#0063ad] to-[#00518f] p-8 text-white sm:p-10 lg:min-h-full lg:p-14">
          <div className="absolute -left-28 top-10 h-72 w-72 rounded-full bg-[#0c8bdd]/60" />
          <div className="absolute -right-24 top-28 h-72 w-72 rounded-full bg-white" />
          <div className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-[#0874c5]" />

          <div className="absolute bottom-16 right-20 h-36 w-36 rounded-full bg-gradient-to-br from-[#1c91e2] to-[#0060aa] shadow-2xl sm:h-44 sm:w-44" />

          <div className="relative z-10 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-lg">
              <UtensilsCrossed className="h-7 w-7" />
            </span>

            <div>
              <p className="text-xs font-semibold tracking-[0.25em] text-blue-100">
                SMART
              </p>

              <p className="text-lg font-bold uppercase">
                {appName}
              </p>
            </div>
          </div>

          <div className="relative z-10 max-w-md py-10 lg:py-0">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-100">
              Welcome
            </p>

            <h1 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
              Order food without waiting in a long queue.
            </h1>

            <p className="mt-5 max-w-sm text-sm leading-7 text-blue-100 sm:text-base">
              Pay using your wallet and collect your order
              securely using a unique QR code.
            </p>
          </div>

          <div className="relative z-10 hidden grid-cols-3 gap-3 sm:grid">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <WalletCards className="mb-3 h-6 w-6" />

              <p className="text-sm font-semibold">
                Wallet payment
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <ShoppingBag className="mb-3 h-6 w-6" />

              <p className="text-sm font-semibold">
                Easy ordering
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <QrCode className="mb-3 h-6 w-6" />

              <p className="text-sm font-semibold">
                QR collection
              </p>
            </div>
          </div>
        </section>

        {/* Login form section */}
        <section className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-14">
          <div className="w-full max-w-md">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
              Secure access
            </p>

            <h2 className="mt-2 text-3xl font-extrabold text-slate-950">
              Sign in
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Enter your account information to access the
              dashboard.
            </p>

            {errorMessage && (
              <div
                role="alert"
                className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
              >
                {errorMessage}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="mt-7 space-y-5"
            >
              {/* Email input */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-900"
                >
                  Email address
                </label>

                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="Enter your email"
                    autoComplete="email"
                    required
                    disabled={isSubmitting}
                    className="h-14 w-full rounded-2xl border border-slate-300 bg-slate-50 pl-12 pr-4 text-sm font-medium text-slate-950 caret-blue-600 outline-none transition placeholder:font-normal placeholder:text-slate-500 focus:border-blue-500 focus:bg-white focus:text-black focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:text-slate-950 disabled:opacity-70"
                  />
                </div>
              </div>

              {/* Password input */}
              <div>
                <div className="mb-2 flex justify-between gap-4">
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold text-slate-900"
                  >
                    Password
                  </label>

                  <Link
                    href="/forgot-password"
                    className="text-sm font-semibold text-blue-600 transition hover:text-blue-800 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                  <input
                    id="password"
                    type={
                      showPassword ? 'text' : 'password'
                    }
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    disabled={isSubmitting}
                    className="h-14 w-full rounded-2xl border border-slate-300 bg-slate-50 pl-12 pr-12 text-sm font-medium text-slate-950 caret-blue-600 outline-none transition placeholder:font-normal placeholder:text-slate-500 focus:border-blue-500 focus:bg-white focus:text-black focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:text-slate-950 disabled:opacity-70"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((current) => !current)
                    }
                    disabled={isSubmitting}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-900 disabled:cursor-not-allowed"
                    aria-label={
                      showPassword
                        ? 'Hide password'
                        : 'Show password'
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) =>
                    setRememberMe(event.target.checked)
                  }
                  disabled={isSubmitting}
                  className="h-4 w-4 cursor-pointer accent-blue-600 disabled:cursor-not-allowed"
                />

                Remember me on this device
              </label>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-800 font-bold text-white shadow-lg shadow-blue-900/20 transition hover:-translate-y-0.5 hover:from-blue-700 hover:to-blue-900 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            {registrationEnabled && (
              <p className="mt-8 text-center text-sm text-slate-600">
                Do not have an account?{' '}
                <Link
                  href="/register"
                  className="font-bold text-blue-600 transition hover:text-blue-800 hover:underline"
                >
                  Create account
                </Link>
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}