'use client'

import {
  Ban,
  CheckCircle2,
  ChefHat,
  LoaderCircle,
  PackageCheck,
  X,
} from 'lucide-react'
import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'
import {
  formatOrderAmount,
  getOrderReference,
  getOrderTotal,
  getOrderUserName,
} from '@/lib/order'
import type {
  Order,
  OrderActionPayload,
} from '@/types/order'

export type OrderActionType =
  | 'preparing'
  | 'ready'
  | 'complete'
  | 'cancel'

interface OrderActionModalProps {
  isOpen: boolean
  type: OrderActionType
  order: Order | null
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (
    payload: OrderActionPayload,
  ) => Promise<void>
}

export default function OrderActionModal({
  isOpen,
  type,
  order,
  isSubmitting,
  onClose,
  onSubmit,
}: OrderActionModalProps) {
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
  }, [isOpen, type, order])

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setFormError('')

    if (
      type === 'cancel' &&
      !reason.trim()
    ) {
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
          : 'Unable to process the order.',
      )
    }
  }

  if (!isOpen || !order) {
    return null
  }

  const config = {
    preparing: {
      title: 'Mark Order Preparing',
      description:
        'The kitchen has started preparing this order.',
      button: 'Start Preparing',
      icon: ChefHat,
      className:
        'bg-indigo-600 hover:bg-indigo-700',
      iconClass:
        'bg-indigo-50 text-indigo-600',
    },

    ready: {
      title: 'Mark Order Ready',
      description:
        'The food is ready for user pickup.',
      button: 'Mark Ready',
      icon: PackageCheck,
      className:
        'bg-amber-600 hover:bg-amber-700',
      iconClass:
        'bg-amber-50 text-amber-600',
    },

    complete: {
      title: 'Complete Order',
      description:
        'Confirm that the user received the food.',
      button: 'Complete Order',
      icon: CheckCircle2,
      className:
        'bg-emerald-600 hover:bg-emerald-700',
      iconClass:
        'bg-emerald-50 text-emerald-600',
    },

    cancel: {
      title: 'Cancel Order',
      description:
        'Cancel the order and allow the backend to process any wallet refund.',
      button: 'Cancel and Refund',
      icon: Ban,
      className:
        'bg-red-600 hover:bg-red-700',
      iconClass:
        'bg-red-50 text-red-600',
    },
  }[type]

  const Icon = config.icon

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close order action"
        onClick={onClose}
        disabled={isSubmitting}
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-2xl ${config.iconClass}`}
            >
              <Icon className="h-5 w-5" />
            </span>

            <div>
              <h2 className="font-extrabold text-slate-950">
                {config.title}
              </h2>

              <p className="text-xs text-slate-500">
                {getOrderReference(order)}
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
              {getOrderUserName(order)}
            </p>

            <p className="mt-1 text-lg font-extrabold text-indigo-600">
              {formatOrderAmount(
                getOrderTotal(order),
              )}
            </p>

            <p className="mt-3 text-xs leading-5 text-slate-500">
              {config.description}
            </p>
          </div>

          {type === 'cancel' && (
            <div>
              <label
                htmlFor="order-action-reason"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                Cancellation reason
              </label>

              <input
                id="order-action-reason"
                type="text"
                value={reason}
                onChange={(event) =>
                  setReason(event.target.value)
                }
                required
                disabled={isSubmitting}
                placeholder="Explain why the order is cancelled"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="order-action-notes"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Administrative notes
            </label>

            <textarea
              id="order-action-notes"
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              rows={3}
              disabled={isSubmitting}
              placeholder="Optional notes..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
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
              className={`flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-white disabled:opacity-50 ${config.className}`}
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Icon className="h-4 w-4" />
                  {config.button}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
