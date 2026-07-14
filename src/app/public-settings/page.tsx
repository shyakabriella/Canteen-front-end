'use client'

import {
  AlertTriangle,
  Building2,
  Clock3,
  Coins,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Settings2,
  ShieldCheck,
  ShoppingCart,
  WalletCards,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { usePublicSystemSettings } from '@/hooks/use-public-system-settings'

export default function PublicSettingsPage() {
  const {
    settings,
    isLoading,
    errorMessage,
    reload,
  } = usePublicSystemSettings()

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            {settings?.logo_url ? (
              <img
                src={settings.logo_url}
                alt={settings.app_name}
                className="h-16 w-16 rounded-2xl border border-slate-200 object-contain p-2"
              />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <Settings2 className="h-8 w-8" />
              </span>
            )}

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
                Public Configuration
              </p>

              <h1 className="mt-1 text-2xl font-extrabold text-slate-950">
                {settings?.app_name ??
                  'Smart Canteen'}
              </h1>

              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                {settings?.app_description ??
                  'Loading public system configuration...'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void reload()}
            disabled={isLoading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                isLoading ? 'animate-spin' : ''
              }`}
            />
            Reload
          </button>
        </section>

        {errorMessage && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-80 items-center justify-center rounded-3xl border border-slate-200 bg-white">
            <LoaderCircle className="h-9 w-9 animate-spin text-indigo-600" />
          </div>
        ) : settings ? (
          <>
            {settings.maintenance_mode && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                The Smart Canteen system is currently
                under maintenance.
              </div>
            )}

            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SettingCard
                icon={Coins}
                label="Currency"
                value={`${settings.currency} (${settings.currency_symbol})`}
              />

              <SettingCard
                icon={ShoppingCart}
                label="Ordering"
                value={
                  settings.ordering_enabled
                    ? 'Enabled'
                    : 'Disabled'
                }
              />

              <SettingCard
                icon={WalletCards}
                label="Wallet Top-Up"
                value={
                  settings.wallet_top_up_enabled
                    ? 'Enabled'
                    : 'Disabled'
                }
              />

              <SettingCard
                icon={ShieldCheck}
                label="Registration"
                value={
                  settings.allow_registration
                    ? 'Enabled'
                    : 'Disabled'
                }
              />
            </section>

            <section className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="font-extrabold text-slate-950">
                  Canteen Information
                </h2>

                <div className="mt-5 space-y-3">
                  <InformationRow
                    icon={Building2}
                    label="System Name"
                    value={settings.app_name}
                  />

                  <InformationRow
                    icon={Mail}
                    label="Support Email"
                    value={
                      settings.support_email ??
                      'Not configured'
                    }
                  />

                  <InformationRow
                    icon={Phone}
                    label="Support Phone"
                    value={
                      settings.support_phone ??
                      'Not configured'
                    }
                  />

                  <InformationRow
                    icon={MapPin}
                    label="Address"
                    value={
                      settings.address ??
                      'Not configured'
                    }
                  />

                  <InformationRow
                    icon={Clock3}
                    label="Operating Hours"
                    value={
                      settings.opening_time ||
                      settings.closing_time
                        ? `${settings.opening_time ?? '--:--'} – ${settings.closing_time ?? '--:--'}`
                        : 'Not configured'
                    }
                  />
                </div>
              </div>

              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-700 bg-slate-800 px-5 py-4">
                  <h2 className="font-extrabold text-white">
                    Raw Public Settings
                  </h2>

                  <p className="mt-1 text-xs text-slate-300">
                    Response values received from Laravel.
                  </p>
                </div>

                <pre className="max-h-[440px] overflow-auto whitespace-pre-wrap bg-slate-950 p-5 text-xs leading-6 text-slate-100">
                  {JSON.stringify(
                    settings.raw,
                    null,
                    2,
                  )}
                </pre>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  )
}

function SettingCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
        <Icon className="h-5 w-5" />
      </span>

      <p className="mt-4 text-sm font-semibold text-slate-500">
        {label}
      </p>

      <p className="mt-1 font-extrabold text-slate-950">
        {value}
      </p>
    </article>
  )
}

function InformationRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
        <Icon className="h-5 w-5" />
      </span>

      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-extrabold text-slate-800">
          {value}
        </p>
      </div>
    </div>
  )
}
