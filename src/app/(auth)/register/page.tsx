'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Eye,
  EyeOff,
  LoaderCircle,
  Mail,
  Phone,
  UserRound,
  UtensilsCrossed,
} from 'lucide-react'
import {
  useState,
  type FormEvent,
} from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSystemSettings } from '@/contexts/SystemSettingsContext'

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const { settings } = useSystemSettings()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [
    passwordConfirmation,
    setPasswordConfirmation,
  ] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const appName = String(
    settings.app_name ?? 'Smart Canteen',
  )

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setErrorMessage('')

    if (password !== passwordConfirmation) {
      setErrorMessage(
        'Password confirmation does not match.',
      )
      return
    }

    setIsSubmitting(true)

    try {
      const result = await register(
        {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          password,
          password_confirmation: passwordConfirmation,
        },
        true,
      )

      if (result.token && result.user) {
        router.replace('/dashboard')
        router.refresh()
        return
      }

      router.replace('/login?registered=1')
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to create your account.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-dvh bg-slate-100 px-4 py-10">
      <div className="mx-auto w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-10">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <UtensilsCrossed className="h-6 w-6" />
          </span>

          <div>
            <p className="font-extrabold text-slate-950">
              {appName}
            </p>
            <p className="text-xs text-slate-500">
              Student and staff registration
            </p>
          </div>
        </div>

        <h1 className="mt-8 text-3xl font-extrabold text-slate-950">
          Create account
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Register to order food, use your wallet and receive
          collection QR codes.
        </p>

        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-7 space-y-5"
        >
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Full name
            </label>

            <div className="relative">
              <UserRound className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

              <input
                id="name"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                required
                placeholder="Enter your full name"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="register-email"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Email address
            </label>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

              <input
                id="register-email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                required
                placeholder="Enter your email"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="phone"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Phone number
            </label>

            <div className="relative">
              <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value)
                }
                placeholder="Example: 0788000000"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="register-password"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Password
            </label>

            <div className="relative">
              <input
                id="register-password"
                type={
                  showPassword ? 'text' : 'password'
                }
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                required
                minLength={8}
                placeholder="Minimum 8 characters"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-12 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword((current) => !current)
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="password-confirmation"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Confirm password
            </label>

            <input
              id="password-confirmation"
              type={
                showPassword ? 'text' : 'password'
              }
              value={passwordConfirmation}
              onChange={(event) =>
                setPasswordConfirmation(event.target.value)
              }
              required
              minLength={8}
              placeholder="Repeat your password"
              className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 font-bold text-white transition hover:bg-blue-700 disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle className="h-5 w-5 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-bold text-blue-600"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
