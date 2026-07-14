'use client'

import {
  CalendarDays,
  CreditCard,
  FileText,
  LoaderCircle,
  UserRound,
  WalletCards,
  X,
} from 'lucide-react'
import {
  formatTopUpAmount,
  formatTopUpDate,
  getTopUpReason,
  getTopUpReference,
  getTopUpStatus,
  getTopUpUserEmail,
  getTopUpUserName,
  topUpStatusLabel,
} from '@/lib/wallet-top-up'
import type { WalletTopUp } from '@/types/wallet-top-up'

interface WalletTopUpDetailsModalProps {
  isOpen: boolean
  topUp: WalletTopUp | null
  isLoading: boolean
  errorMessage: string
  onClose: () => void
}

export default function WalletTopUpDetailsModal({
  isOpen,
  topUp,
  isLoading,
  errorMessage,
  onClose,
}: WalletTopUpDetailsModalProps) {
  if (!isOpen) {
    return null
  }

  const status = topUp
    ? getTopUpStatus(topUp)
    : 'pending'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4">
      <button
        type="button"
        aria-label="Close top-up details"
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="relative z-10 my-auto w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="font-extrabold text-slate-950">
              Wallet Top-Up Details
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Complete request information.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(100vh-130px)] overflow-y-auto p-6">
          {isLoading && (
            <div className="flex min-h-72 items-center justify-center">
              <div className="text-center">
                <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-indigo-600" />

                <p className="mt-3 text-sm font-semibold text-slate-500">
                  Loading top-up details...
                </p>
              </div>
            </div>
          )}

          {!isLoading && errorMessage && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {!isLoading && topUp && (
            <div className="space-y-5">
              <div
                className={`rounded-3xl p-6 text-white ${
                  status === 'approved'
                    ? 'bg-gradient-to-br from-emerald-600 to-teal-700'
                    : status === 'rejected'
                      ? 'bg-gradient-to-br from-red-600 to-rose-700'
                      : status === 'cancelled'
                        ? 'bg-gradient-to-br from-amber-600 to-orange-700'
                        : 'bg-gradient-to-br from-indigo-600 to-blue-700'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                      Wallet Top-Up
                    </p>

                    <h3 className="mt-2 text-3xl font-extrabold">
                      {formatTopUpAmount(topUp.amount)}
                    </h3>

                    <p className="mt-3 text-sm text-white/80">
                      {getTopUpUserName(topUp)}
                    </p>
                  </div>

                  <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">
                    {topUpStatusLabel(topUp)}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  icon={UserRound}
                  label="Requested By"
                  value={getTopUpUserName(topUp)}
                />

                <DetailItem
                  icon={UserRound}
                  label="Email"
                  value={getTopUpUserEmail(topUp)}
                />

                <DetailItem
                  icon={CreditCard}
                  label="Payment Method"
                  value={
                    topUp.payment_method
                      ?.replaceAll('_', ' ') ??
                    'Not provided'
                  }
                  capitalize
                />

                <DetailItem
                  icon={FileText}
                  label="Reference"
                  value={getTopUpReference(topUp)}
                />

                <DetailItem
                  icon={CalendarDays}
                  label="Requested At"
                  value={formatTopUpDate(
                    topUp.created_at,
                  )}
                />

                <DetailItem
                  icon={WalletCards}
                  label="Request ID"
                  value={String(topUp.id)}
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Notes
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {topUp.notes ||
                    'No notes were provided.'}
                </p>
              </div>

              {status !== 'pending' && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Processing reason
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {getTopUpReason(topUp)}
                  </p>
                </div>
              )}

              {topUp.approved_at && (
                <StatusDate
                  label="Approved At"
                  value={topUp.approved_at}
                  className="border-emerald-200 bg-emerald-50 text-emerald-700"
                />
              )}

              {topUp.rejected_at && (
                <StatusDate
                  label="Rejected At"
                  value={topUp.rejected_at}
                  className="border-red-200 bg-red-50 text-red-700"
                />
              )}

              {topUp.cancelled_at && (
                <StatusDate
                  label="Cancelled At"
                  value={topUp.cancelled_at}
                  className="border-amber-200 bg-amber-50 text-amber-700"
                />
              )}

              {topUp.deleted_at && (
                <StatusDate
                  label="Deleted At"
                  value={topUp.deleted_at}
                  className="border-red-200 bg-red-50 text-red-700"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface DetailItemProps {
  icon: typeof UserRound
  label: string
  value: string
  capitalize?: boolean
}

function DetailItem({
  icon: Icon,
  label,
  value,
  capitalize = false,
}: DetailItemProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
          <Icon className="h-5 w-5" />
        </span>

        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {label}
          </p>

          <p
            className={`mt-1 break-words text-sm font-extrabold text-slate-800 ${
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

function StatusDate({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className: string
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${className}`}
    >
      <p className="text-xs font-bold uppercase tracking-wider opacity-70">
        {label}
      </p>

      <p className="mt-1 text-sm font-extrabold">
        {formatTopUpDate(value)}
      </p>
    </div>
  )
}
