'use client'

import {
  CheckCircle2,
  EyeOff,
  LoaderCircle,
  X,
} from 'lucide-react'
import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'
import {
  getAlertFoodName,
  getAlertReference,
} from '@/lib/low-stock-alert'
import type {
  DismissLowStockAlertPayload,
  LowStockAlert,
  ResolveLowStockAlertPayload,
} from '@/types/low-stock-alert'

export type LowStockAlertActionType =
  | 'resolve'
  | 'dismiss'

type ActionPayload =
  | ResolveLowStockAlertPayload
  | DismissLowStockAlertPayload

interface LowStockAlertActionModalProps {
  isOpen: boolean
  type: LowStockAlertActionType
  alert: LowStockAlert | null
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (
    payload: ActionPayload,
  ) => Promise<void>
}

export default function LowStockAlertActionModal({
  isOpen,
  type,
  alert,
  isSubmitting,
  onClose,
  onSubmit,
}: LowStockAlertActionModalProps) {
  const [reason, setReason] =
    useState('')

  const [notes, setNotes] =
    useState('')

  const [formError, setFormError] =
    useState('')

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setReason('')
    setNotes('')
    setFormError('')
  }, [isOpen, type, alert])

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setFormError('')

    if (
      type === 'dismiss' &&
      !reason.trim()
    ) {
      setFormError(
        'A dismissal reason is required.',
      )
      return
    }

    try {
      if (type === 'resolve') {
        await onSubmit({
          notes: notes.trim(),
        })

        return
      }

      await onSubmit({
        reason: reason.trim(),
        notes: notes.trim(),
      })
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Unable to process the alert.',
      )
    }
  }

  if (!isOpen || !alert) {
    return null
  }

  const resolving = type === 'resolve'
  const Icon = resolving
    ? CheckCircle2
    : EyeOff

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close alert action"
        onClick={onClose}
        disabled={isSubmitting}
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                resolving
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Icon className="h-5 w-5" />
            </span>

            <div>
              <h2 className="font-extrabold text-slate-950">
                {resolving
                  ? 'Resolve Low-Stock Alert'
                  : 'Dismiss Low-Stock Alert'}
              </h2>

              <p className="text-xs text-slate-500">
                {getAlertReference(alert)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
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
            <p className="font-extrabold text-slate-900">
              {getAlertFoodName(alert)}
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              {resolving
                ? 'Resolve this alert after stock has been replenished or the inventory issue has been corrected.'
                : 'Dismiss this alert when it does not require inventory action.'}
            </p>
          </div>

          {!resolving && (
            <div>
              <label
                htmlFor="alert-dismiss-reason"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                Dismissal reason
              </label>

              <input
                id="alert-dismiss-reason"
                value={reason}
                onChange={(event) =>
                  setReason(event.target.value)
                }
                required
                disabled={isSubmitting}
                placeholder="Example: Alert generated during stock count"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="alert-action-notes"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              {resolving
                ? 'Resolution notes'
                : 'Additional notes'}
            </label>

            <textarea
              id="alert-action-notes"
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              rows={4}
              disabled={isSubmitting}
              placeholder={
                resolving
                  ? 'Example: Added 50 units from supplier delivery'
                  : 'Optional administrative notes'
              }
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-600"
            >
              Close
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-white disabled:opacity-50 ${
                resolving
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-slate-700 hover:bg-slate-800'
              }`}
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Icon className="h-4 w-4" />

                  {resolving
                    ? 'Resolve Alert'
                    : 'Dismiss Alert'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
