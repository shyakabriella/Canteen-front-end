'use client'

import {
  CheckCircle2,
  CreditCard,
  LoaderCircle,
  X,
} from 'lucide-react'
import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'
import {
  getTopUpReference,
} from '@/lib/wallet-top-up'
import type {
  WalletTopUp,
  WalletTopUpPayload,
} from '@/types/wallet-top-up'

interface WalletTopUpFormModalProps {
  isOpen: boolean
  topUp?: WalletTopUp | null
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (
    payload: WalletTopUpPayload,
  ) => Promise<void>
}

export default function WalletTopUpFormModal({
  isOpen,
  topUp,
  isSubmitting,
  onClose,
  onSubmit,
}: WalletTopUpFormModalProps) {
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] =
    useState('mobile_money')
  const [
    transactionReference,
    setTransactionReference,
  ] = useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState('')

  const editing = Boolean(topUp)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setAmount(
      topUp?.amount === undefined
        ? ''
        : String(topUp.amount),
    )

    setPaymentMethod(
      topUp?.payment_method ??
        'mobile_money',
    )

    const existingReference = topUp
      ? getTopUpReference(topUp)
      : ''

    setTransactionReference(
      existingReference === 'Not provided'
        ? ''
        : existingReference,
    )

    setNotes(topUp?.notes ?? '')
    setFormError('')
  }, [isOpen, topUp])

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setFormError('')

    const numericAmount = Number(amount)

    if (
      !amount ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      setFormError(
        'Top-up amount must be greater than zero.',
      )
      return
    }

    if (!paymentMethod) {
      setFormError(
        'Please select a payment method.',
      )
      return
    }

    try {
      await onSubmit({
        amount,
        payment_method: paymentMethod,
        transaction_reference:
          transactionReference.trim(),
        notes: notes.trim(),
      })
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Unable to save the top-up request.',
      )
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4">
      <button
        type="button"
        aria-label="Close top-up form"
        onClick={onClose}
        disabled={isSubmitting}
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="relative z-10 my-auto w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <CreditCard className="h-5 w-5" />
            </span>

            <div>
              <h2 className="font-extrabold text-slate-950">
                {editing
                  ? 'Update Top-Up Request'
                  : 'Request Wallet Top-Up'}
              </h2>

              <p className="text-xs text-slate-500">
                {editing
                  ? 'Pending requests can be updated.'
                  : 'Submit a wallet funding request.'}
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

          <div>
            <label
              htmlFor="top-up-amount"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Amount in RWF
            </label>

            <div className="relative">
              <input
                id="top-up-amount"
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(event) =>
                  setAmount(event.target.value)
                }
                required
                disabled={isSubmitting}
                placeholder="Example: 10000"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pr-20 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />

              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                RWF
              </span>
            </div>
          </div>

          <div>
            <label
              htmlFor="payment-method"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Payment method
            </label>

            <select
              id="payment-method"
              value={paymentMethod}
              onChange={(event) =>
                setPaymentMethod(
                  event.target.value,
                )
              }
              disabled={isSubmitting}
              required
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            >
              <option value="mobile_money">
                Mobile Money
              </option>

              <option value="cash">
                Cash
              </option>

              <option value="bank_transfer">
                Bank Transfer
              </option>

              <option value="card">
                Bank Card
              </option>

              <option value="other">
                Other
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="transaction-reference"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Transaction reference
            </label>

            <input
              id="transaction-reference"
              type="text"
              value={transactionReference}
              onChange={(event) =>
                setTransactionReference(
                  event.target.value,
                )
              }
              disabled={isSubmitting}
              placeholder="Example: TXN-2026-000123"
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            />

            <p className="mt-2 text-xs text-slate-400">
              Enter the Mobile Money, bank or payment
              transaction reference when available.
            </p>
          </div>

          <div>
            <label
              htmlFor="top-up-notes"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Notes
            </label>

            <textarea
              id="top-up-notes"
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              rows={4}
              disabled={isSubmitting}
              placeholder="Optional information about the payment..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />

                  {editing
                    ? 'Update Request'
                    : 'Submit Request'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
