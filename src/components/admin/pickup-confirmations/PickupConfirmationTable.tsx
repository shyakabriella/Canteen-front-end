'use client'

import {
  Ban,
  Eye,
  MapPin,
  PackageCheck,
  QrCode,
  RotateCcw,
  Trash2,
  UserRound,
} from 'lucide-react'
import {
  canCancelPickup,
  formatPickupAmount,
  formatPickupDate,
  getPickupConfirmerName,
  getPickupCustomerName,
  getPickupDate,
  getPickupMethod,
  getPickupOrderAmount,
  getPickupOrderReference,
  getPickupStatus,
  pickupMethodLabel,
  pickupStatusLabel,
} from '@/lib/pickup-confirmation'
import type { PickupConfirmation } from '@/types/pickup-confirmation'

interface PickupConfirmationTableProps {
  confirmations: PickupConfirmation[]
  processingId: number | string | null
  onView: (
    confirmation: PickupConfirmation,
  ) => void
  onCancel: (
    confirmation: PickupConfirmation,
  ) => void
  onDelete: (
    confirmation: PickupConfirmation,
  ) => void
  onRestore: (
    confirmation: PickupConfirmation,
  ) => void
}

export default function PickupConfirmationTable({
  confirmations,
  processingId,
  onView,
  onCancel,
  onDelete,
  onRestore,
}: PickupConfirmationTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1180px] text-left">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.14em] text-slate-400">
          <tr>
            <th className="px-6 py-4 font-extrabold">
              Order
            </th>

            <th className="px-4 py-4 font-extrabold">
              Customer
            </th>

            <th className="px-4 py-4 font-extrabold">
              Amount
            </th>

            <th className="px-4 py-4 font-extrabold">
              Method
            </th>

            <th className="px-4 py-4 font-extrabold">
              Location
            </th>

            <th className="px-4 py-4 font-extrabold">
              Confirmed By
            </th>

            <th className="px-4 py-4 font-extrabold">
              Status
            </th>

            <th className="px-4 py-4 font-extrabold">
              Date
            </th>

            <th className="px-6 py-4 text-right font-extrabold">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {confirmations.map(
            (confirmation) => {
              const status =
                getPickupStatus(confirmation)

              const method =
                getPickupMethod(confirmation)

              const deleted = Boolean(
                confirmation.deleted_at,
              )

              const processing =
                String(processingId) ===
                String(confirmation.id)

              return (
                <tr
                  key={confirmation.id}
                  className={`text-sm transition hover:bg-slate-50 ${
                    deleted
                      ? 'bg-red-50/30'
                      : ''
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                          status === 'cancelled'
                            ? 'bg-red-50 text-red-600'
                            : 'bg-emerald-50 text-emerald-600'
                        }`}
                      >
                        <PackageCheck className="h-5 w-5" />
                      </span>

                      <div>
                        <p className="max-w-[180px] truncate font-extrabold text-slate-900">
                          {getPickupOrderReference(
                            confirmation,
                          )}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Confirmation #
                          {confirmation.id}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <p className="max-w-[170px] truncate font-bold text-slate-800">
                      {getPickupCustomerName(
                        confirmation,
                      )}
                    </p>
                  </td>

                  <td className="whitespace-nowrap px-4 py-4 font-extrabold text-slate-900">
                    {formatPickupAmount(
                      getPickupOrderAmount(
                        confirmation,
                      ),
                    )}
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${
                        method === 'qr'
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {method === 'qr' ? (
                        <QrCode className="h-3.5 w-3.5" />
                      ) : (
                        <UserRound className="h-3.5 w-3.5" />
                      )}

                      {pickupMethodLabel(
                        confirmation,
                      )}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex max-w-[170px] items-center gap-2 text-xs font-semibold text-slate-600">
                      <MapPin className="h-4 w-4 shrink-0 text-slate-400" />

                      <span className="truncate">
                        {confirmation.location ??
                          'Not available'}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <p className="max-w-[160px] truncate text-xs font-bold text-slate-700">
                      {getPickupConfirmerName(
                        confirmation,
                      )}
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${
                        deleted
                          ? 'bg-red-50 text-red-700 ring-red-200'
                          : status === 'cancelled'
                            ? 'bg-red-50 text-red-700 ring-red-200'
                            : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                      }`}
                    >
                      {deleted
                        ? 'Deleted'
                        : pickupStatusLabel(
                            confirmation,
                          )}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-4 py-4 text-xs font-semibold text-slate-600">
                    {formatPickupDate(
                      getPickupDate(confirmation),
                      false,
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onView(confirmation)
                        }
                        title="View confirmation"
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {canCancelPickup(
                        confirmation,
                      ) && (
                        <button
                          type="button"
                          onClick={() =>
                            onCancel(confirmation)
                          }
                          title="Cancel confirmation"
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100"
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                      )}

                      {!deleted && (
                        <button
                          type="button"
                          onClick={() =>
                            onDelete(confirmation)
                          }
                          disabled={processing}
                          title="Delete confirmation"
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}

                      {deleted && (
                        <button
                          type="button"
                          onClick={() =>
                            onRestore(confirmation)
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
            },
          )}
        </tbody>
      </table>
    </div>
  )
}
