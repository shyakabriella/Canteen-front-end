'use client'

import {
  CheckCircle2,
  LoaderCircle,
  ShoppingBag,
  X,
} from 'lucide-react'
import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'
import {
  formatOrderItemAmount,
  getOrderItemFoodName,
  getOrderItemNotes,
  getOrderItemOrderReference,
  getOrderItemStatus,
  getOrderItemTotal,
} from '@/lib/order-item'
import type {
  OrderItemRecord,
  OrderItemUpdatePayload,
} from '@/types/order-item'

interface OrderItemFormModalProps {
  isOpen: boolean
  orderItem: OrderItemRecord | null
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (
    payload: OrderItemUpdatePayload,
  ) => Promise<void>
}

export default function OrderItemFormModal({
  isOpen,
  orderItem,
  isSubmitting,
  onClose,
  onSubmit,
}: OrderItemFormModalProps) {
  const [status, setStatus] =
    useState('pending')
  const [notes, setNotes] =
    useState('')
  const [formError, setFormError] =
    useState('')

  useEffect(() => {
    if (!isOpen || !orderItem) {
      return
    }

    setStatus(getOrderItemStatus(orderItem))
    setNotes(getOrderItemNotes(orderItem))
    setFormError('')
  }, [isOpen, orderItem])

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setFormError('')

    if (!status) {
      setFormError(
        'Please select an item status.',
      )
      return
    }

    try {
      await onSubmit({
        status,
        notes: notes.trim(),
      })
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Unable to update the order item.',
      )
    }
  }

  if (!isOpen || !orderItem) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close order item form"
        onClick={onClose}
        disabled={isSubmitting}
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <ShoppingBag className="h-5 w-5" />
            </span>

            <div>
              <h2 className="font-extrabold text-slate-950">
                Update Order Item
              </h2>

              <p className="text-xs text-slate-500">
                {getOrderItemOrderReference(
                  orderItem,
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
              {getOrderItemFoodName(orderItem)}
            </p>

            <p className="mt-1 text-lg font-extrabold text-indigo-600">
              {formatOrderItemAmount(
                getOrderItemTotal(orderItem),
              )}
            </p>
          </div>

          <div>
            <label
              htmlFor="order-item-status"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Item status
            </label>

            <select
              id="order-item-status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value)
              }
              required
              disabled={isSubmitting}
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            >
              <option value="pending">
                Pending
              </option>

              <option value="preparing">
                Preparing
              </option>

              <option value="ready">
                Ready
              </option>

              <option value="completed">
                Completed
              </option>

              <option value="cancelled">
                Cancelled
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="order-item-notes"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Notes
            </label>

            <textarea
              id="order-item-notes"
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              rows={4}
              disabled={isSubmitting}
              placeholder="Preparation or administrative notes..."
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
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Update Item
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
