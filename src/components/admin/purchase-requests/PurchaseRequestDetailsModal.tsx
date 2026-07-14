'use client'

import {
  Building2,
  CalendarDays,
  DollarSign,
  Hash,
  LoaderCircle,
  PackageCheck,
  ShoppingCart,
  UserRound,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  formatPurchaseRequestAmount,
  formatPurchaseRequestDate,
  formatPurchaseRequestQuantity,
  getExpectedDeliveryDate,
  getPurchaseOrderNumber,
  getPurchaseRequestActualTotal,
  getPurchaseRequestApproverName,
  getPurchaseRequestDate,
  getPurchaseRequestEstimatedTotal,
  getPurchaseRequestFoodName,
  getPurchaseRequestPriority,
  getPurchaseRequestQuantity,
  getPurchaseRequestReason,
  getPurchaseRequestReceiverName,
  getPurchaseRequestReceivedQuantity,
  getPurchaseRequestReference,
  getPurchaseRequestRequesterName,
  getPurchaseRequestStatus,
  getPurchaseRequestSupplierCode,
  getPurchaseRequestSupplierName,
  getPurchaseRequestUnit,
  getPurchaseRequestUnitCost,
  getSupplierInvoiceNumber,
  purchaseRequestPriorityLabel,
  purchaseRequestStatusLabel,
} from '@/lib/purchase-request'
import type { PurchaseRequest } from '@/types/purchase-request'

interface Props {
  isOpen: boolean
  request: PurchaseRequest | null
  isLoading: boolean
  errorMessage: string
  onClose: () => void
}

export default function PurchaseRequestDetailsModal({
  isOpen,
  request,
  isLoading,
  errorMessage,
  onClose,
}: Props) {
  if (!isOpen) {
    return null
  }

  const status = request
    ? getPurchaseRequestStatus(request)
    : 'pending'

  const priority = request
    ? getPurchaseRequestPriority(request)
    : 'normal'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4">
      <button
        type="button"
        aria-label="Close details"
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="relative z-10 my-auto w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="font-extrabold text-slate-950">
              Purchase Request Details
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Request, approval, supplier and stock
              information.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(100vh-130px)] overflow-y-auto p-6">
          {isLoading && (
            <div className="flex min-h-72 items-center justify-center">
              <LoaderCircle className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          )}

          {!isLoading && errorMessage && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {!isLoading && request && (
            <div className="space-y-5">
              <div
                className={`rounded-3xl p-6 text-white ${
                  status === 'received'
                    ? 'bg-gradient-to-br from-emerald-600 to-teal-700'
                    : status === 'rejected' ||
                        status === 'cancelled'
                      ? 'bg-gradient-to-br from-red-600 to-rose-700'
                      : status === 'ordered'
                        ? 'bg-gradient-to-br from-blue-600 to-indigo-700'
                        : 'bg-gradient-to-br from-indigo-600 to-violet-700'
                }`}
              >
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                  {getPurchaseRequestReference(
                    request,
                  )}
                </p>

                <h3 className="mt-2 text-3xl font-extrabold">
                  {getPurchaseRequestFoodName(
                    request,
                  )}
                </h3>

                <p className="mt-3 text-sm text-white/80">
                  {getPurchaseRequestSupplierName(
                    request,
                  )}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">
                    {purchaseRequestStatusLabel(
                      request,
                    )}
                  </span>

                  <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">
                    {purchaseRequestPriorityLabel(
                      request,
                    )}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Stat
                  label="Requested"
                  value={formatPurchaseRequestQuantity(
                    getPurchaseRequestQuantity(
                      request,
                    ),
                    getPurchaseRequestUnit(
                      request,
                    ),
                  )}
                />

                <Stat
                  label="Estimated Total"
                  value={formatPurchaseRequestAmount(
                    getPurchaseRequestEstimatedTotal(
                      request,
                    ),
                  )}
                />

                <Stat
                  label="Received"
                  value={formatPurchaseRequestQuantity(
                    getPurchaseRequestReceivedQuantity(
                      request,
                    ),
                    getPurchaseRequestUnit(
                      request,
                    ),
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Detail
                  icon={Hash}
                  label="Request ID"
                  value={String(request.id)}
                />

                <Detail
                  icon={Building2}
                  label="Supplier"
                  value={`${getPurchaseRequestSupplierName(
                    request,
                  )} — ${getPurchaseRequestSupplierCode(
                    request,
                  )}`}
                />

                <Detail
                  icon={DollarSign}
                  label="Estimated Unit Cost"
                  value={formatPurchaseRequestAmount(
                    getPurchaseRequestUnitCost(
                      request,
                    ),
                  )}
                />

                <Detail
                  icon={ShoppingCart}
                  label="Purchase Order Number"
                  value={getPurchaseOrderNumber(
                    request,
                  )}
                />

                <Detail
                  icon={PackageCheck}
                  label="Supplier Invoice"
                  value={getSupplierInvoiceNumber(
                    request,
                  )}
                />

                <Detail
                  icon={DollarSign}
                  label="Actual Total"
                  value={formatPurchaseRequestAmount(
                    getPurchaseRequestActualTotal(
                      request,
                    ),
                  )}
                />

                <Detail
                  icon={UserRound}
                  label="Requested By"
                  value={getPurchaseRequestRequesterName(
                    request,
                  )}
                />

                <Detail
                  icon={UserRound}
                  label="Approved By"
                  value={getPurchaseRequestApproverName(
                    request,
                  )}
                />

                <Detail
                  icon={UserRound}
                  label="Received By"
                  value={getPurchaseRequestReceiverName(
                    request,
                  )}
                />

                <Detail
                  icon={CalendarDays}
                  label="Requested At"
                  value={formatPurchaseRequestDate(
                    getPurchaseRequestDate(
                      request,
                    ),
                  )}
                />

                <Detail
                  icon={CalendarDays}
                  label="Expected Delivery"
                  value={formatPurchaseRequestDate(
                    getExpectedDeliveryDate(
                      request,
                    ),
                    false,
                  )}
                />

                <Detail
                  icon={CalendarDays}
                  label="Received At"
                  value={formatPurchaseRequestDate(
                    request.received_at,
                  )}
                />
              </div>

              <TextBlock
                label="Purchase Reason"
                value={getPurchaseRequestReason(
                  request,
                )}
              />

              <TextBlock
                label="Notes"
                value={
                  request.notes ||
                  'No notes were provided.'
                }
              />

              {request.rejection_reason && (
                <TextBlock
                  label="Rejection Reason"
                  value={request.rejection_reason}
                  danger
                />
              )}

              {request.cancellation_reason && (
                <TextBlock
                  label="Cancellation Reason"
                  value={
                    request.cancellation_reason
                  }
                  danger
                />
              )}

              {request.deleted_at && (
                <TextBlock
                  label="Deleted Record"
                  value={`Deleted on ${formatPurchaseRequestDate(
                    request.deleted_at,
                  )}`}
                  danger
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
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
    </div>
  )
}

function Stat({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-indigo-500">
        {label}
      </p>

      <p className="mt-2 text-xl font-extrabold text-indigo-800">
        {value}
      </p>
    </div>
  )
}

function TextBlock({
  label,
  value,
  danger = false,
}: {
  label: string
  value: string
  danger?: boolean
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        danger
          ? 'border-red-200 bg-red-50'
          : 'border-slate-200 bg-slate-50'
      }`}
    >
      <p
        className={`text-xs font-bold uppercase tracking-wider ${
          danger
            ? 'text-red-500'
            : 'text-slate-400'
        }`}
      >
        {label}
      </p>

      <p
        className={`mt-2 text-sm leading-6 ${
          danger
            ? 'text-red-700'
            : 'text-slate-700'
        }`}
      >
        {value}
      </p>
    </div>
  )
}
