'use client'

import {
  LoaderCircle,
  PackageMinus,
  PackagePlus,
  X,
} from 'lucide-react'
import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'
import {
  getCurrentStock,
  getInventoryFoodName,
  getStockUnit,
} from '@/lib/inventory-stock'
import type {
  InventoryStock,
  StockAdjustmentPayload,
} from '@/types/inventory-stock'

export type AdjustmentType =
  | 'add'
  | 'reduce'

interface StockAdjustmentModalProps {
  isOpen: boolean
  type: AdjustmentType
  stock: InventoryStock | null
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (
    payload: StockAdjustmentPayload,
  ) => Promise<void>
}

export default function StockAdjustmentModal({
  isOpen,
  type,
  stock,
  isSubmitting,
  onClose,
  onSubmit,
}: StockAdjustmentModalProps) {
  const [quantity, setQuantity] =
    useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] =
    useState('')

  const adding = type === 'add'

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setQuantity('')
    setReason(
      adding
        ? 'Inventory restock'
        : 'Inventory reduction',
    )
    setNotes('')
    setFormError('')
  }, [isOpen, adding, stock])

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setFormError('')

    const numberQuantity = Number(quantity)

    if (
      !quantity ||
      !Number.isFinite(numberQuantity) ||
      numberQuantity <= 0
    ) {
      setFormError(
        'Enter a quantity greater than zero.',
      )
      return
    }

    if (
      !adding &&
      stock &&
      numberQuantity > getCurrentStock(stock)
    ) {
      setFormError(
        'You cannot reduce more than the available stock.',
      )
      return
    }

    try {
      await onSubmit({
        quantity,
        reason: reason.trim(),
        notes: notes.trim(),
      })
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Unable to update stock.',
      )
    }
  }

  if (!isOpen || !stock) {
    return null
  }

  const Icon = adding
    ? PackagePlus
    : PackageMinus

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close stock adjustment"
        onClick={onClose}
        disabled={isSubmitting}
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                adding
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-amber-50 text-amber-600'
              }`}
            >
              <Icon className="h-5 w-5" />
            </span>

            <div>
              <h2 className="font-extrabold text-slate-950">
                {adding
                  ? 'Add Stock'
                  : 'Reduce Stock'}
              </h2>

              <p className="text-xs text-slate-500">
                {getInventoryFoodName(stock)}
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
              Current stock
            </p>

            <p className="mt-1 text-xl font-extrabold text-slate-950">
              {getCurrentStock(stock)}{' '}
              {getStockUnit(stock)}
            </p>
          </div>

          <div>
            <label
              htmlFor="adjustment-quantity"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Quantity to {adding ? 'add' : 'reduce'}
            </label>

            <div className="relative">
              <input
                id="adjustment-quantity"
                type="number"
                min="0.01"
                step="0.01"
                value={quantity}
                onChange={(event) =>
                  setQuantity(event.target.value)
                }
                required
                disabled={isSubmitting}
                placeholder="Enter quantity"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pr-24 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />

              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                {getStockUnit(stock)}
              </span>
            </div>
          </div>

          <div>
            <label
              htmlFor="adjustment-reason"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Reason
            </label>

            <input
              id="adjustment-reason"
              type="text"
              value={reason}
              onChange={(event) =>
                setReason(event.target.value)
              }
              disabled={isSubmitting}
              placeholder="Reason for adjustment"
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label
              htmlFor="adjustment-notes"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Notes
            </label>

            <textarea
              id="adjustment-notes"
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              rows={3}
              disabled={isSubmitting}
              placeholder="Optional notes..."
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
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60 ${
                adding
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Icon className="h-4 w-4" />
                  {adding
                    ? 'Add Stock'
                    : 'Reduce Stock'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
