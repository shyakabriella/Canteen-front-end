'use client'

import {
  Ban,
  CheckCircle2,
  LoaderCircle,
  PackageCheck,
  ShoppingCart,
  X,
  XCircle,
} from 'lucide-react'
import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'
import {
  getPurchaseRequestFoodName,
  getPurchaseRequestQuantity,
  getPurchaseRequestReference,
  getPurchaseRequestUnitCost,
} from '@/lib/purchase-request'
import type {
  ApprovePurchaseRequestPayload,
  CancelPurchaseRequestPayload,
  MarkPurchaseRequestOrderedPayload,
  PurchaseRequest,
  ReceivePurchaseRequestPayload,
  RejectPurchaseRequestPayload,
} from '@/types/purchase-request'

export type PurchaseRequestAction =
  | 'approve'
  | 'reject'
  | 'mark-ordered'
  | 'receive'
  | 'cancel'

type ActionPayload =
  | ApprovePurchaseRequestPayload
  | RejectPurchaseRequestPayload
  | MarkPurchaseRequestOrderedPayload
  | ReceivePurchaseRequestPayload
  | CancelPurchaseRequestPayload

interface Props {
  isOpen: boolean
  type: PurchaseRequestAction
  request: PurchaseRequest | null
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (
    payload: ActionPayload,
  ) => Promise<void>
}

export default function PurchaseRequestActionModal({
  isOpen,
  type,
  request,
  isSubmitting,
  onClose,
  onSubmit,
}: Props) {
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [poNumber, setPoNumber] = useState('')
  const [expectedDate, setExpectedDate] =
    useState('')
  const [receivedQuantity, setReceivedQuantity] =
    useState('')
  const [actualUnitCost, setActualUnitCost] =
    useState('')
  const [invoiceNumber, setInvoiceNumber] =
    useState('')
  const [formError, setFormError] =
    useState('')

  useEffect(() => {
    if (!isOpen || !request) {
      return
    }

    setReason('')
    setNotes('')
    setPoNumber('')
    setExpectedDate('')
    setReceivedQuantity(
      String(getPurchaseRequestQuantity(request)),
    )
    setActualUnitCost(
      String(getPurchaseRequestUnitCost(request)),
    )
    setInvoiceNumber('')
    setFormError('')
  }, [isOpen, request, type])

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setFormError('')

    try {
      if (type === 'approve') {
        await onSubmit({
          notes: notes.trim(),
        })
        return
      }

      if (type === 'reject') {
        if (!reason.trim()) {
          setFormError(
            'A rejection reason is required.',
          )
          return
        }

        await onSubmit({
          reason: reason.trim(),
          notes: notes.trim(),
        })
        return
      }

      if (type === 'mark-ordered') {
        await onSubmit({
          purchase_order_number:
            poNumber.trim(),
          expected_delivery_date:
            expectedDate,
          notes: notes.trim(),
        })
        return
      }

      if (type === 'receive') {
        const quantity = Number(
          receivedQuantity,
        )

        if (
          !Number.isFinite(quantity) ||
          quantity <= 0
        ) {
          setFormError(
            'Received quantity must be greater than zero.',
          )
          return
        }

        await onSubmit({
          received_quantity:
            receivedQuantity,
          actual_unit_cost:
            actualUnitCost,
          supplier_invoice_number:
            invoiceNumber.trim(),
          notes: notes.trim(),
        })
        return
      }

      if (!reason.trim()) {
        setFormError(
          'A cancellation reason is required.',
        )
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
          : 'Unable to process the request.',
      )
    }
  }

  if (!isOpen || !request) {
    return null
  }

  const configs = {
    approve: {
      title: 'Approve Purchase Request',
      description:
        'Authorize this inventory purchase.',
      icon: CheckCircle2,
      iconClass:
        'bg-emerald-50 text-emerald-600',
      buttonClass:
        'bg-emerald-600 hover:bg-emerald-700',
      button: 'Approve Request',
    },
    reject: {
      title: 'Reject Purchase Request',
      description:
        'Reject this pending purchase request.',
      icon: XCircle,
      iconClass: 'bg-red-50 text-red-600',
      buttonClass:
        'bg-red-600 hover:bg-red-700',
      button: 'Reject Request',
    },
    'mark-ordered': {
      title: 'Mark Request as Ordered',
      description:
        'Record that the order was submitted to the supplier.',
      icon: ShoppingCart,
      iconClass:
        'bg-indigo-50 text-indigo-600',
      buttonClass:
        'bg-indigo-600 hover:bg-indigo-700',
      button: 'Mark Ordered',
    },
    receive: {
      title: 'Receive Purchased Stock',
      description:
        'Confirm delivery and add the received quantity to inventory.',
      icon: PackageCheck,
      iconClass:
        'bg-blue-50 text-blue-600',
      buttonClass:
        'bg-blue-600 hover:bg-blue-700',
      button: 'Receive Stock',
    },
    cancel: {
      title: 'Cancel Purchase Request',
      description:
        'Cancel this request before it is received.',
      icon: Ban,
      iconClass:
        'bg-amber-50 text-amber-600',
      buttonClass:
        'bg-amber-600 hover:bg-amber-700',
      button: 'Cancel Request',
    },
  } as const

  const config = configs[type]
  const Icon = config.icon

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto p-4">
      <button
        type="button"
        aria-label="Close action form"
        onClick={onClose}
        disabled={isSubmitting}
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="relative z-10 my-auto w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
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
                {getPurchaseRequestReference(
                  request,
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
          className="max-h-[calc(100vh-130px)] space-y-5 overflow-y-auto p-6"
        >
          {formError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {formError}
            </div>
          )}

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="font-extrabold text-slate-900">
              {getPurchaseRequestFoodName(
                request,
              )}
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              {config.description}
            </p>
          </div>

          {(type === 'reject' ||
            type === 'cancel') && (
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                {type === 'reject'
                  ? 'Rejection reason'
                  : 'Cancellation reason'}
              </label>

              <input
                value={reason}
                onChange={(event) =>
                  setReason(event.target.value)
                }
                required
                disabled={isSubmitting}
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400"
              />
            </div>
          )}

          {type === 'mark-ordered' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Purchase order number"
                value={poNumber}
                onChange={setPoNumber}
                disabled={isSubmitting}
              />

              <Input
                label="Expected delivery date"
                type="date"
                value={expectedDate}
                onChange={setExpectedDate}
                disabled={isSubmitting}
              />
            </div>
          )}

          {type === 'receive' && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Received quantity"
                  type="number"
                  value={receivedQuantity}
                  onChange={setReceivedQuantity}
                  disabled={isSubmitting}
                  required
                />

                <Input
                  label="Actual unit cost"
                  type="number"
                  value={actualUnitCost}
                  onChange={setActualUnitCost}
                  disabled={isSubmitting}
                />
              </div>

              <Input
                label="Supplier invoice number"
                value={invoiceNumber}
                onChange={setInvoiceNumber}
                disabled={isSubmitting}
              />
            </>
          )}

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Notes
            </label>

            <textarea
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              rows={4}
              disabled={isSubmitting}
              placeholder="Optional administrative notes..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400"
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
              className={`flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-white disabled:opacity-50 ${config.buttonClass}`}
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

function Input({
  label,
  type = 'text',
  value,
  onChange,
  disabled,
  required = false,
}: {
  label: string
  type?: string
  value: string
  onChange: (value: string) => void
  disabled: boolean
  required?: boolean
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        disabled={disabled}
        required={required}
        min={
          type === 'number' ? '0' : undefined
        }
        step={
          type === 'number' ? '0.01' : undefined
        }
        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400"
      />
    </div>
  )
}
