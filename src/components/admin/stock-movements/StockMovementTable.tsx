'use client'

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Eye,
  Pencil,
  RefreshCw,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import {
  formatMovementDate,
  formatMovementQuantity,
  getMovementFoodName,
  getMovementQuantity,
  getMovementUnit,
  getMovementUserName,
  getQuantityAfter,
  getQuantityBefore,
  normalizeMovementType,
} from '@/lib/stock-movement'
import type { StockMovement } from '@/types/stock-movement'

interface StockMovementTableProps {
  movements: StockMovement[]
  processingId: number | string | null
  onView: (movement: StockMovement) => void
  onEdit: (movement: StockMovement) => void
  onDelete: (movement: StockMovement) => void
  onRestore: (movement: StockMovement) => void
}

export default function StockMovementTable({
  movements,
  processingId,
  onView,
  onEdit,
  onDelete,
  onRestore,
}: StockMovementTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1100px] text-left">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.14em] text-slate-400">
          <tr>
            <th className="px-6 py-4 font-extrabold">
              Food Item
            </th>

            <th className="px-4 py-4 font-extrabold">
              Movement
            </th>

            <th className="px-4 py-4 font-extrabold">
              Quantity
            </th>

            <th className="px-4 py-4 font-extrabold">
              Before / After
            </th>

            <th className="px-4 py-4 font-extrabold">
              Reason
            </th>

            <th className="px-4 py-4 font-extrabold">
              User / Date
            </th>

            <th className="px-6 py-4 text-right font-extrabold">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {movements.map((movement) => {
            const type = normalizeMovementType(
              movement.movement_type ??
                movement.type,
            )

            const deleted = Boolean(
              movement.deleted_at,
            )

            const processing =
              String(processingId) ===
              String(movement.id)

            const Icon =
              type === 'in'
                ? ArrowDownToLine
                : type === 'out'
                  ? ArrowUpFromLine
                  : RefreshCw

            const before =
              getQuantityBefore(movement)
            const after =
              getQuantityAfter(movement)

            return (
              <tr
                key={movement.id}
                className={`text-sm transition hover:bg-slate-50 ${
                  deleted ? 'bg-red-50/30' : ''
                }`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                        type === 'in'
                          ? 'bg-emerald-50 text-emerald-600'
                          : type === 'out'
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-indigo-50 text-indigo-600'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>

                    <div className="min-w-0">
                      <p className="max-w-[200px] truncate font-extrabold text-slate-900">
                        {getMovementFoodName(movement)}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Movement #{movement.id}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${
                      deleted
                        ? 'bg-red-50 text-red-700 ring-red-200'
                        : type === 'in'
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                          : type === 'out'
                            ? 'bg-amber-50 text-amber-700 ring-amber-200'
                            : 'bg-indigo-50 text-indigo-700 ring-indigo-200'
                    }`}
                  >
                    {deleted
                      ? 'Deleted'
                      : type === 'in'
                        ? 'Stock In'
                        : type === 'out'
                          ? 'Stock Out'
                          : 'Adjustment'}
                  </span>
                </td>

                <td className="whitespace-nowrap px-4 py-4 font-extrabold text-slate-900">
                  <span
                    className={
                      type === 'in'
                        ? 'text-emerald-700'
                        : type === 'out'
                          ? 'text-amber-700'
                          : 'text-indigo-700'
                    }
                  >
                    {type === 'in'
                      ? '+'
                      : type === 'out'
                        ? '-'
                        : ''}
                    {formatMovementQuantity(
                      getMovementQuantity(movement),
                      getMovementUnit(movement),
                    )}
                  </span>
                </td>

                <td className="px-4 py-4">
                  <p className="text-xs font-semibold text-slate-500">
                    {before === null
                      ? '—'
                      : before}{' '}
                    →{' '}
                    {after === null ? '—' : after}
                  </p>

                  <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-400">
                    {getMovementUnit(movement)}
                  </p>
                </td>

                <td className="max-w-[230px] px-4 py-4">
                  <p className="line-clamp-2 text-sm leading-5 text-slate-500">
                    {movement.reason ||
                      movement.notes ||
                      'No reason provided.'}
                  </p>
                </td>

                <td className="px-4 py-4">
                  <p className="max-w-[160px] truncate text-xs font-bold text-slate-700">
                    {getMovementUserName(movement)}
                  </p>

                  <p className="mt-1 whitespace-nowrap text-xs text-slate-400">
                    {formatMovementDate(
                      movement.created_at,
                      false,
                    )}
                  </p>
                </td>

                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onView(movement)}
                      title="View movement"
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {!deleted && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            onEdit(movement)
                          }
                          title="Update notes"
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onDelete(movement)
                          }
                          disabled={processing}
                          title="Delete movement"
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}

                    {deleted && (
                      <button
                        type="button"
                        onClick={() =>
                          onRestore(movement)
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
