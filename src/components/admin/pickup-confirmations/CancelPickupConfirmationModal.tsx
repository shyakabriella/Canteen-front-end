'use client'

import {
  Ban,
  LoaderCircle,
  X,
} from 'lucide-react'
import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'
import {
  getPickupCustomerName,
  getPickupOrderReference,
} from '@/lib/pickup-confirmation'
import type {
  CancelPickupConfirmationPayload,
  PickupConfirmation,
} from '@/types/pickup-confirmation'

interface CancelPickupConfirmationModalProps {
  isOpen: boolean
  confirmation: PickupConfirmation | null
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (
    payload: CancelPickupConfirmationPayload,
  ) => Promise<void>
}

export default function CancelPickupConfirmationModal({
  isOpen,
  confirmation,
  isSubmitting,
  onClose,
  onSubmit,
}: CancelPickupConfirmationModalProps) {
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] =
    useState('')

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setReason('')
    setNotes('')
    setFormError('')
  }, [isOpen, confirmation])

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setFormError('')

    if (!reason.trim()) {
      setFormError(
        'A cancellation reason is required.',
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
          : 'Unable to cancel the confirmation.',
      )
    }
  }

  if (!isOpen || !confirmation) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close cancellation form"
        onClick={onClose}
        disabled={isSubmitting}
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <Ban className="h-5 w-5" />
            </span>

            <div>
              <h2 className="font-extrabold text-slate-950">
                Cancel Pickup Confirmation
              </h2>

              <p className="text-xs text-slate-500">
                {getPickupOrderReference(
                  confirmation,
                )}
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
              {getPickupCustomerName(
                confirmation,
              )}
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Cancelling this record should not
              automatically refund or reopen the order
              unless your Laravel controller explicitly
              performs those operations.
            </p>
          </div>

          <div>
            <label
              htmlFor="pickup-cancel-reason"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Cancellation reason
            </label>

            <input
              id="pickup-cancel-reason"
              value={reason}
              onChange={(event) =>
                setReason(event.target.value)
              }
              required
              disabled={isSubmitting}
              placeholder="Example: Pickup recorded by mistake"
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-100"
            />
          </div>

          <div>
            <label
              htmlFor="pickup-cancel-notes"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Additional notes
            </label>

            <textarea
              id="pickup-cancel-notes"
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              rows={3}
              disabled={isSubmitting}
              placeholder="Optional administrative notes..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-100"
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
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <Ban className="h-4 w-4" />
                  Cancel Confirmation
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
