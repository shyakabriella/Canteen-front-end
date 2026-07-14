'use client'

import {
  Ban,
  CheckCircle2,
  LoaderCircle,
  X,
  XCircle,
} from 'lucide-react'
import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'
import {
  formatTopUpAmount,
  getTopUpUserName,
} from '@/lib/wallet-top-up'
import type {
  WalletTopUp,
  WalletTopUpActionPayload,
} from '@/types/wallet-top-up'

export type TopUpActionType =
  | 'approve'
  | 'reject'
  | 'cancel'

interface WalletTopUpActionModalProps {
  isOpen: boolean
  type: TopUpActionType
  topUp: WalletTopUp | null
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (
    payload: WalletTopUpActionPayload,
  ) => Promise<void>
}

export default function WalletTopUpActionModal({
  isOpen,
  type,
  topUp,
  isSubmitting,
  onClose,
  onSubmit,
}: WalletTopUpActionModalProps) {
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setReason('')
    setNotes('')
    setFormError('')
  }, [isOpen, type, topUp])

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setFormError('')

    if (
      type !== 'approve' &&
      !reason.trim()
    ) {
      setFormError(
        type === 'reject'
          ? 'A rejection reason is required.'
          : 'A cancellation reason is required.',
      )
      return
    }

    try {
      await onSubmit({
        reason: reason.trim(),
        notes: notes.trim(),
      })
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : `Unable to ${type} the top-up.`,
      )
    }
  }

  if (!isOpen || !topUp) {
    return null
  }

  const approving = type === 'approve'
  const rejecting = type === 'reject'

  const Icon = approving
    ? CheckCircle2
    : rejecting
      ? XCircle
      : Ban

  const title = approving
    ? 'Approve Top-Up'
    : rejecting
      ? 'Reject Top-Up'
      : 'Cancel Top-Up'

  const buttonClass = approving
    ? 'bg-emerald-600 hover:bg-emerald-700'
    : rejecting
      ? 'bg-red-600 hover:bg-red-700'
      : 'bg-amber-600 hover:bg-amber-700'

  const iconClass = approving
    ? 'bg-emerald-50 text-emerald-600'
    : rejecting
      ? 'bg-red-50 text-red-600'
      : 'bg-amber-50 text-amber-600'

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close action form"
        onClick={onClose}
        disabled={isSubmitting}
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconClass}`}
            >
              <Icon className="h-5 w-5" />
            </span>

            <div>
              <h2 className="font-extrabold text-slate-950">
                {title}
              </h2>

              <p className="text-xs text-slate-500">
                Request #{topUp.id}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-6"
        >
          {formError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Top-up request
            </p>

            <p className="mt-2 font-extrabold text-slate-950">
              {getTopUpUserName(topUp)}
            </p>

            <p className="mt-1 text-xl font-extrabold text-indigo-600">
              {formatTopUpAmount(topUp.amount)}
            </p>
          </div>

          <div>
            <label
              htmlFor="top-up-action-reason"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              {approving
                ? 'Reason or comment'
                : rejecting
                  ? 'Rejection reason'
                  : 'Cancellation reason'}
            </label>

            <input
              id="top-up-action-reason"
              type="text"
              value={reason}
              onChange={(event) =>
                setReason(event.target.value)
              }
              required={!approving}
              disabled={isSubmitting}
              placeholder={
                approving
                  ? 'Example: Payment verified'
                  : rejecting
                    ? 'Explain why the request is rejected'
                    : 'Explain why the request is cancelled'
              }
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label
              htmlFor="top-up-action-notes"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Additional notes
            </label>

            <textarea
              id="top-up-action-notes"
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              rows={3}
              disabled={isSubmitting}
              placeholder="Optional administrative notes..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 hover:bg-slate-50"
            >
              Close
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60 ${buttonClass}`}
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Icon className="h-4 w-4" />
                  {title}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
