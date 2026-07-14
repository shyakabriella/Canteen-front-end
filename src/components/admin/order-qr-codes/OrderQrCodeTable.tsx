'use client'

import {
  Ban,
  CheckCircle2,
  Eye,
  Pencil,
  RefreshCw,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import {
  canCancelQr,
  canMarkQrUsed,
  canRegenerateQr,
  formatOrderQrDate,
  getOrderQrCodeStatus,
  getOrderQrImageUrl,
  getQrOrderReference,
  getQrOrderUserName,
  orderQrCodeStatusLabel,
} from '@/lib/order-qr-code'
import type { OrderQrCode } from '@/types/order-qr-code'

interface OrderQrCodeTableProps {
  qrCodes: OrderQrCode[]
  processingId: number | string | null
  onView: (qrCode: OrderQrCode) => void
  onEdit: (qrCode: OrderQrCode) => void
  onDelete: (qrCode: OrderQrCode) => void
  onRestore: (qrCode: OrderQrCode) => void
  onMarkUsed: (qrCode: OrderQrCode) => void
  onRegenerate: (qrCode: OrderQrCode) => void
  onCancel: (qrCode: OrderQrCode) => void
}

export default function OrderQrCodeTable({
  qrCodes,
  processingId,
  onView,
  onEdit,
  onDelete,
  onRestore,
  onMarkUsed,
  onRegenerate,
  onCancel,
}: OrderQrCodeTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1150px] text-left">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.14em] text-slate-400">
          <tr>
            <th className="px-6 py-4 font-extrabold">
              QR Code
            </th>

            <th className="px-4 py-4 font-extrabold">
              Order
            </th>

            <th className="px-4 py-4 font-extrabold">
              Customer
            </th>

            <th className="px-4 py-4 font-extrabold">
              Status
            </th>

            <th className="px-4 py-4 font-extrabold">
              Expires
            </th>

            <th className="px-4 py-4 font-extrabold">
              Used
            </th>

            <th className="px-6 py-4 text-right font-extrabold">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {qrCodes.map((qrCode) => {
            const status =
              getOrderQrCodeStatus(qrCode)

            const deleted = Boolean(
              qrCode.deleted_at,
            )

            const processing =
              String(processingId) ===
              String(qrCode.id)

            const imageUrl =
              getOrderQrImageUrl(qrCode)

            return (
              <tr
                key={qrCode.id}
                className={`text-sm hover:bg-slate-50 ${
                  deleted
                    ? 'bg-red-50/30'
                    : ''
                }`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-1">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt="Order QR code"
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span className="font-extrabold text-indigo-600">
                          QR
                        </span>
                      )}
                    </div>

                    <div>
                      <p className="font-extrabold text-slate-900">
                        QR #{qrCode.id}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Record ID
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-4">
                  <p className="font-bold text-slate-800">
                    {getQrOrderReference(
                      qrCode,
                    )}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Order ID:{' '}
                    {qrCode.order_id ?? '—'}
                  </p>
                </td>

                <td className="px-4 py-4">
                  <p className="max-w-[190px] truncate font-bold text-slate-800">
                    {getQrOrderUserName(qrCode)}
                  </p>
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${
                      deleted
                        ? 'bg-red-50 text-red-700 ring-red-200'
                        : status === 'used'
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                          : status === 'expired'
                            ? 'bg-amber-50 text-amber-700 ring-amber-200'
                            : status === 'cancelled'
                              ? 'bg-red-50 text-red-700 ring-red-200'
                              : 'bg-indigo-50 text-indigo-700 ring-indigo-200'
                    }`}
                  >
                    {deleted
                      ? 'Deleted'
                      : orderQrCodeStatusLabel(
                          qrCode,
                        )}
                  </span>
                </td>

                <td className="whitespace-nowrap px-4 py-4 text-slate-500">
                  {formatOrderQrDate(
                    qrCode.expires_at,
                    false,
                  )}
                </td>

                <td className="whitespace-nowrap px-4 py-4 text-slate-500">
                  {formatOrderQrDate(
                    qrCode.used_at,
                    false,
                  )}
                </td>

                <td className="px-6 py-4">
                  <div className="flex flex-wrap justify-end gap-2">
                    <ActionButton
                      title="View QR code"
                      icon={Eye}
                      onClick={() => onView(qrCode)}
                    />

                    {!deleted &&
                      status === 'active' && (
                        <ActionButton
                          title="Update QR code"
                          icon={Pencil}
                          onClick={() =>
                            onEdit(qrCode)
                          }
                        />
                      )}

                    {canMarkQrUsed(qrCode) && (
                      <ActionButton
                        title="Mark QR used"
                        icon={CheckCircle2}
                        onClick={() =>
                          onMarkUsed(qrCode)
                        }
                        className="border-emerald-200 bg-emerald-50 text-emerald-600"
                      />
                    )}

                    {canRegenerateQr(qrCode) && (
                      <ActionButton
                        title="Regenerate QR code"
                        icon={RefreshCw}
                        onClick={() =>
                          onRegenerate(qrCode)
                        }
                        className="border-indigo-200 bg-indigo-50 text-indigo-600"
                      />
                    )}

                    {canCancelQr(qrCode) && (
                      <ActionButton
                        title="Cancel QR code"
                        icon={Ban}
                        onClick={() =>
                          onCancel(qrCode)
                        }
                        className="border-amber-200 bg-amber-50 text-amber-600"
                      />
                    )}

                    {!deleted && (
                      <ActionButton
                        title="Delete QR code"
                        icon={Trash2}
                        onClick={() =>
                          onDelete(qrCode)
                        }
                        disabled={processing}
                        className="border-red-200 text-red-600"
                      />
                    )}

                    {deleted && (
                      <button
                        type="button"
                        onClick={() =>
                          onRestore(qrCode)
                        }
                        disabled={processing}
                        className="flex h-9 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 disabled:opacity-50"
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

function ActionButton({
  title,
  icon: Icon,
  onClick,
  className = 'border-slate-200 text-slate-500',
  disabled = false,
}: {
  title: string
  icon: typeof Eye
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
      className={`flex h-9 w-9 items-center justify-center rounded-xl border hover:opacity-80 disabled:opacity-40 ${className}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}
