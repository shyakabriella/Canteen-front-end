'use client'

import {
  BadgeCheck,
  CalendarDays,
  LoaderCircle,
  Mail,
  Phone,
  RefreshCw,
  UserCircle,
  WalletCards,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { formatRoleName } from '@/lib/auth'

function formatWalletBalance(
  balance?: number | string,
): string {
  const numericBalance = Number(balance ?? 0)

  if (Number.isNaN(numericBalance)) {
    return `${balance ?? 0} RWF`
  }

  return `${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(numericBalance)} RWF`
}

function formatDate(value?: string): string {
  if (!value) {
    return 'Not available'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
  }).format(date)
}

export default function ProfilePage() {
  const {
    user,
    refreshProfile,
    isRefreshingProfile,
  } = useAuth()

  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleRefresh() {
    setMessage('')
    setErrorMessage('')

    try {
      await refreshProfile()
      setMessage('Profile refreshed successfully.')
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to refresh your profile.',
      )
    }
  }

  if (!user) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  const roleName = formatRoleName(user.role)
  const initial =
    user.name?.trim().charAt(0).toUpperCase() || 'U'

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-600">
            Account
          </p>

          <h1 className="mt-2 text-2xl font-extrabold text-slate-950 sm:text-3xl">
            My Profile
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Your account information loaded from the backend.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshingProfile}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 text-sm font-bold text-indigo-600 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRefreshingProfile ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}

          Refresh Profile
        </button>
      </section>

      {message && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {message}
        </div>
      )}

      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorMessage}
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-3xl font-extrabold text-white shadow-lg shadow-indigo-600/20">
            {initial}
          </div>

          <h2 className="mt-5 text-xl font-extrabold text-slate-950">
            {user.name}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {user.email}
          </p>

          <span className="mt-4 inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold capitalize text-indigo-700">
            {roleName}
          </span>

          <div className="mt-6 rounded-2xl bg-slate-50 p-4">
            <WalletCards className="mx-auto h-6 w-6 text-indigo-600" />

            <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Wallet Balance
            </p>

            <p className="mt-1 text-xl font-extrabold text-slate-950">
              {formatWalletBalance(user.wallet_balance)}
            </p>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <UserCircle className="h-6 w-6" />
            </span>

            <div>
              <h2 className="font-extrabold text-slate-950">
                Profile Information
              </h2>

              <p className="text-xs text-slate-500">
                Information returned by GET /api/profile
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <ProfileField
              icon={UserCircle}
              label="Full Name"
              value={user.name}
            />

            <ProfileField
              icon={Mail}
              label="Email Address"
              value={user.email}
            />

            <ProfileField
              icon={Phone}
              label="Phone Number"
              value={user.phone || 'Not provided'}
            />

            <ProfileField
              icon={BadgeCheck}
              label="Account Role"
              value={roleName}
              capitalize
            />

            <ProfileField
              icon={BadgeCheck}
              label="Account Status"
              value={user.status || 'Active'}
              capitalize
            />

            <ProfileField
              icon={CalendarDays}
              label="Member Since"
              value={formatDate(user.created_at)}
            />
          </div>
        </article>
      </section>
    </div>
  )
}

interface ProfileFieldProps {
  icon: typeof UserCircle
  label: string
  value: string
  capitalize?: boolean
}

function ProfileField({
  icon: Icon,
  label,
  value,
  capitalize = false,
}: ProfileFieldProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
          <Icon className="h-5 w-5" />
        </span>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {label}
          </p>

          <p
            className={`mt-1 break-words text-sm font-bold text-slate-800 ${
              capitalize ? 'capitalize' : ''
            }`}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  )
}
