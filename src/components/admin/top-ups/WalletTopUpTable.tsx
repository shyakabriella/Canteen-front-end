'use client'

import {
  Ban,
  CheckCircle2,
  Eye,
  Pencil,
  RotateCcw,
  Trash2,
  XCircle,
} from 'lucide-react'
import {
  canApproveTopUp,
  canCancelTopUp,
  canUpdateTopUp,
  formatTopUpAmount,
  formatTopUpDate,
  getTopUpReference,
  getTopUpStatus,
  getTopUpUserEmail,
  getTopUpUserName,
  topUpStatusLabel,
} from '@/lib/wallet-top-up'
import type { WalletTopUp } from '@/types/wallet-top-up'

interface WalletTopUpTableProps {
  topUps: WalletTopUp[]
  processingId: number | string | null
  onView: (topUp: WalletTopUp) => void
  onEdit: (topUp: WalletTopUp) => void
  onDelete: (topUp: WalletTopUp) => void
  onRestore: (topUp: WalletTopUp) => void
  onApprove: (topUp: WalletTopUp) => void
  onReject: (topUp: WalletTopUp) => void
  onCancel: (topUp: WalletTopUp) => void
}

export default function WalletTopUpTable({
  topUps,
  processingId,
  onView,
  onEdit,
  onDelete,
  onRestore,
  onApprove,
  onReject,
  onCancel,
}: WalletTopUpTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1150px] text-left">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.14em] text-slate-400">
          <tr>
            <th className="px-6 py-4 font-extrabold">
              User
            </th>

            <th className="px-4 py-4 font-extrabold">
              Amount
            </th>

            <th className="px-4 py-4 font-extrabold">
              Payment
            </th>

            <th className="px-4 py-4 font-extrabold">
              Status
            </th>

            <th className="px-4 py-4 font-extrabold">
              Requested
            </th>

            <th className="px-6 py-4 text-right font-extrabold">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {topUps.map((topUp) => {
            const status = getTopUpStatus(topUp)
            const deleted = Boolean(
              topUp.deleted_at,
            )

            const processing =
              String(processingId) ===
              String(topUp.id)

            return (
              <tr
                key={topUp.id}
                className={`text-sm transition hover:bg-slate-50 ${
                  deleted ? 'bg-red-50/30' : ''
                }`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-extrabold text-indigo-700">
                      {getTopUpUserName(topUp)
                        .charAt(0)
                        .toUpperCase()}
                    </span>

                    <div className="min-w-0">
                      <p className="max-w-[200px] truncate font-extrabold text-slate-900">
                        {getTopUpUserName(topUp)}
                      </p>

                      <p className="mt-1 max-w-[220px] truncate text-xs text-slate-400">
                        {getTopUpUserEmail(topUp)}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="whitespace-nowrap px-4 py-4 font-extrabold text-slate-900">
                  {formatTopUpAmount(topUp.amount)}
                </td>

                <td className="px-4 py-4">
                  <p className="text-sm font-bold capitalize text-slate-700">
                    {topUp.payment_method
                      ?.replaceAll('_', ' ') ??
                      'Not provided'}
                  </p>

                  <p className="mt-1 max-w-[190px] truncate text-xs text-slate-400">
                    {getTopUpReference(topUp)}
                  </p>
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${
                      deleted
                        ? 'bg-red-50 text-red-700 ring-red-200'
                        : status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                          : status === 'rejected'
                            ? 'bg-red-50 text-red-700 ring-red-200'
                            : status === 'cancelled'
                              ? 'bg-amber-50 text-amber-700 ring-amber-200'
                              : 'bg-indigo-50 text-indigo-700 ring-indigo-200'
                    }`}
                  >
                    {deleted
                      ? 'Deleted'
                      : topUpStatusLabel(topUp)}
                  </span>
                </td>

                <td className="whitespace-nowrap px-4 py-4">
                  <p className="text-sm font-semibold text-slate-600">
                    {formatTopUpDate(
                      topUp.created_at,
                      false,
                    )}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Request #{topUp.id}
                  </p>
                </td>

                <td className="px-6 py-4">
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onView(topUp)}
                      title="View top-up"
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {!deleted &&
                      canUpdateTopUp(topUp) && (
                        <button
                          type="button"
                          onClick={() => onEdit(topUp)}
                          title="Update top-up"
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}

                    {!deleted &&
                      canApproveTopUp(topUp) && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              onApprove(topUp)
                            }
                            title="Approve top-up"
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              onReject(topUp)
                            }
                            title="Reject top-up"
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </>
                      )}

                    {!deleted &&
                      canCancelTopUp(topUp) && (
                        <button
                          type="button"
                          onClick={() =>
                            onCancel(topUp)
                          }
                          title="Cancel top-up"
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100"
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                      )}

                    {!deleted &&
                      canUpdateTopUp(topUp) && (
                        <button
                          type="button"
                          onClick={() =>
                            onDelete(topUp)
                          }
                          disabled={processing}
                          title="Delete top-up"
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}

                    {deleted && (
                      <button
                        type="button"
                        onClick={() =>
                          onRestore(topUp)
                        }
                        disabled={processing}
                        className="flex h-9 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
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
