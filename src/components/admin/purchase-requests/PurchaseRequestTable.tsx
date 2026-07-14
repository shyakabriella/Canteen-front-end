'use client'

import {
  Ban,
  CheckCircle2,
  Eye,
  PackageCheck,
  Pencil,
  RotateCcw,
  ShoppingCart,
  Trash2,
  XCircle,
} from 'lucide-react'
import {
  canApprovePurchaseRequest,
  canCancelPurchaseRequest,
  canEditPurchaseRequest,
  canMarkPurchaseRequestOrdered,
  canReceivePurchaseRequest,
  canRejectPurchaseRequest,
  formatPurchaseRequestAmount,
  formatPurchaseRequestDate,
  formatPurchaseRequestQuantity,
  getPurchaseRequestDate,
  getPurchaseRequestEstimatedTotal,
  getPurchaseRequestFoodName,
  getPurchaseRequestPriority,
  getPurchaseRequestQuantity,
  getPurchaseRequestReference,
  getPurchaseRequestStatus,
  getPurchaseRequestSupplierName,
  getPurchaseRequestUnit,
  purchaseRequestPriorityLabel,
  purchaseRequestStatusLabel,
} from '@/lib/purchase-request'
import type { PurchaseRequest } from '@/types/purchase-request'

interface Props {
  requests: PurchaseRequest[]
  processingId: number | string | null
  onView: (request: PurchaseRequest) => void
  onEdit: (request: PurchaseRequest) => void
  onApprove: (request: PurchaseRequest) => void
  onReject: (request: PurchaseRequest) => void
  onMarkOrdered: (
    request: PurchaseRequest,
  ) => void
  onReceive: (request: PurchaseRequest) => void
  onCancel: (request: PurchaseRequest) => void
  onDelete: (request: PurchaseRequest) => void
  onRestore: (request: PurchaseRequest) => void
}

export default function PurchaseRequestTable({
  requests,
  processingId,
  onView,
  onEdit,
  onApprove,
  onReject,
  onMarkOrdered,
  onReceive,
  onCancel,
  onDelete,
  onRestore,
}: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1250px] text-left">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.14em] text-slate-400">
          <tr>
            <th className="px-6 py-4">Request</th>
            <th className="px-4 py-4">Supplier</th>
            <th className="px-4 py-4">Quantity</th>
            <th className="px-4 py-4">
              Estimated Total
            </th>
            <th className="px-4 py-4">Priority</th>
            <th className="px-4 py-4">Status</th>
            <th className="px-4 py-4">Requested</th>
            <th className="px-6 py-4 text-right">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {requests.map((request) => {
            const status =
              getPurchaseRequestStatus(request)

            const priority =
              getPurchaseRequestPriority(request)

            const deleted = Boolean(
              request.deleted_at,
            )

            const processing =
              String(processingId) ===
              String(request.id)

            return (
              <tr
                key={request.id}
                className={`text-sm hover:bg-slate-50 ${
                  deleted ? 'bg-red-50/30' : ''
                }`}
              >
                <td className="px-6 py-4">
                  <p className="max-w-[220px] truncate font-extrabold text-slate-900">
                    {getPurchaseRequestFoodName(
                      request,
                    )}
                  </p>

                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    {getPurchaseRequestReference(
                      request,
                    )}
                  </p>
                </td>

                <td className="px-4 py-4">
                  <p className="max-w-[190px] truncate font-bold text-slate-700">
                    {getPurchaseRequestSupplierName(
                      request,
                    )}
                  </p>
                </td>

                <td className="whitespace-nowrap px-4 py-4 font-bold text-slate-700">
                  {formatPurchaseRequestQuantity(
                    getPurchaseRequestQuantity(
                      request,
                    ),
                    getPurchaseRequestUnit(
                      request,
                    ),
                  )}
                </td>

                <td className="whitespace-nowrap px-4 py-4 font-extrabold text-slate-900">
                  {formatPurchaseRequestAmount(
                    getPurchaseRequestEstimatedTotal(
                      request,
                    ),
                  )}
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      priority === 'urgent'
                        ? 'bg-red-50 text-red-700'
                        : priority === 'high'
                          ? 'bg-amber-50 text-amber-700'
                          : priority === 'low'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {purchaseRequestPriorityLabel(
                      request,
                    )}
                  </span>
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      deleted
                        ? 'bg-red-50 text-red-700'
                        : status === 'received'
                          ? 'bg-emerald-50 text-emerald-700'
                          : status === 'approved'
                            ? 'bg-blue-50 text-blue-700'
                            : status === 'ordered'
                              ? 'bg-indigo-50 text-indigo-700'
                              : status === 'rejected' ||
                                  status === 'cancelled'
                                ? 'bg-red-50 text-red-700'
                                : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {deleted
                      ? 'Deleted'
                      : purchaseRequestStatusLabel(
                          request,
                        )}
                  </span>
                </td>

                <td className="whitespace-nowrap px-4 py-4 text-xs font-semibold text-slate-600">
                  {formatPurchaseRequestDate(
                    getPurchaseRequestDate(
                      request,
                    ),
                    false,
                  )}
                </td>

                <td className="px-6 py-4">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Action
                      icon={Eye}
                      title="View request"
                      onClick={() => onView(request)}
                    />

                    {canEditPurchaseRequest(
                      request,
                    ) && (
                      <Action
                        icon={Pencil}
                        title="Edit request"
                        onClick={() =>
                          onEdit(request)
                        }
                        className="border-blue-200 text-blue-600"
                      />
                    )}

                    {canApprovePurchaseRequest(
                      request,
                    ) && (
                      <Action
                        icon={CheckCircle2}
                        title="Approve request"
                        onClick={() =>
                          onApprove(request)
                        }
                        className="border-emerald-200 bg-emerald-50 text-emerald-600"
                      />
                    )}

                    {canRejectPurchaseRequest(
                      request,
                    ) && (
                      <Action
                        icon={XCircle}
                        title="Reject request"
                        onClick={() =>
                          onReject(request)
                        }
                        className="border-red-200 bg-red-50 text-red-600"
                      />
                    )}

                    {canMarkPurchaseRequestOrdered(
                      request,
                    ) && (
                      <Action
                        icon={ShoppingCart}
                        title="Mark ordered"
                        onClick={() =>
                          onMarkOrdered(request)
                        }
                        className="border-indigo-200 bg-indigo-50 text-indigo-600"
                      />
                    )}

                    {canReceivePurchaseRequest(
                      request,
                    ) && (
                      <Action
                        icon={PackageCheck}
                        title="Receive stock"
                        onClick={() =>
                          onReceive(request)
                        }
                        className="border-blue-200 bg-blue-50 text-blue-600"
                      />
                    )}

                    {canCancelPurchaseRequest(
                      request,
                    ) && (
                      <Action
                        icon={Ban}
                        title="Cancel request"
                        onClick={() =>
                          onCancel(request)
                        }
                        className="border-amber-200 bg-amber-50 text-amber-600"
                      />
                    )}

                    {!deleted && (
                      <Action
                        icon={Trash2}
                        title="Delete request"
                        onClick={() =>
                          onDelete(request)
                        }
                        disabled={processing}
                        className="border-red-200 text-red-600"
                      />
                    )}

                    {deleted && (
                      <button
                        type="button"
                        onClick={() =>
                          onRestore(request)
                        }
                        disabled={processing}
                        className="flex h-9 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Restore
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function Action({
  icon: Icon,
  title,
  onClick,
  className = 'border-slate-200 text-slate-500',
  disabled = false,
}: {
  icon: typeof Eye
  title: string
  onClick: () => void
  className?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-9 w-9 items-center justify-center rounded-xl border disabled:opacity-40 ${className}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}
