'use client'

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CalendarDays,
  LoaderCircle,
  RefreshCw,
  UserRound,
  X,
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

interface StockMovementDetailsModalProps {
  isOpen: boolean
  movement: StockMovement | null
  isLoading: boolean
  errorMessage: string
  onClose: () => void
}

export default function StockMovementDetailsModal({
  isOpen,
  movement,
  isLoading,
  errorMessage,
  onClose,
}: StockMovementDetailsModalProps) {
  if (!isOpen) {
    return null
  }

  const type = movement
    ? normalizeMovementType(
        movement.movement_type ?? movement.type,
      )
    : 'adjustment'

  const TypeIcon =
    type === 'in'
      ? ArrowDownToLine
      : type === 'out'
        ? ArrowUpFromLine
        : RefreshCw

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4">
      <button
        type="button"
        aria-label="Close movement details"
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="relative z-10 my-auto w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="font-extrabold text-slate-950">
              Stock Movement Details
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Complete movement information from the backend.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(100vh-130px)] overflow-y-auto p-6">
          {isLoading && (
            <div className="flex min-h-72 items-center justify-center">
              <div className="text-center">
                <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-indigo-600" />

                <p className="mt-3 text-sm font-semibold text-slate-500">
                  Loading movement...
                </p>
              </div>
            </div>
          )}

          {!isLoading && errorMessage && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {!isLoading && movement && (
            <div className="space-y-5">
              <div
                className={`rounded-3xl p-6 text-white ${
                  type === 'in'
                    ? 'bg-gradient-to-br from-emerald-600 to-teal-700'
                    : type === 'out'
                      ? 'bg-gradient-to-br from-amber-600 to-orange-700'
                      : 'bg-gradient-to-br from-indigo-600 to-blue-700'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                      {type === 'in'
                        ? 'Stock In'
                        : type === 'out'
                          ? 'Stock Out'
                          : 'Adjustment'}
                    </p>

                    <h3 className="mt-2 text-2xl font-extrabold">
                      {getMovementFoodName(movement)}
                    </h3>

                    <p className="mt-4 text-3xl font-extrabold">
                      {type === 'in'
                        ? '+'
                        : type === 'out'
                          ? '-'
                          : ''}
                      {formatMovementQuantity(
                        getMovementQuantity(movement),
                        getMovementUnit(movement),
                      )}
                    </p>
                  </div>

                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                    <TypeIcon className="h-6 w-6" />
                  </span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  label="Quantity Before"
                  value={
                    getQuantityBefore(movement) === null
                      ? 'Not available'
                      : formatMovementQuantity(
                          getQuantityBefore(movement) ?? 0,
                          getMovementUnit(movement),
                        )
                  }
                />

                <DetailItem
                  label="Quantity After"
                  value={
                    getQuantityAfter(movement) === null
                      ? 'Not available'
                      : formatMovementQuantity(
                          getQuantityAfter(movement) ?? 0,
                          getMovementUnit(movement),
                        )
                  }
                />

                <DetailItem
                  label="Movement ID"
                  value={String(movement.id)}
                />

                <DetailItem
                  label="Inventory Stock ID"
                  value={String(
                    movement.inventory_stock_id ??
                      'Not available',
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <CalendarDays className="mt-0.5 h-5 w-5 text-indigo-600" />

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Created
                      </p>

                      <p className="mt-1 text-sm font-extrabold text-slate-800">
                        {formatMovementDate(
                          movement.created_at,
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <UserRound className="mt-0.5 h-5 w-5 text-indigo-600" />

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Created By
                      </p>

                      <p className="mt-1 text-sm font-extrabold text-slate-800">
                        {getMovementUserName(movement)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Reason
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {movement.reason ||
                    'No reason was provided.'}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Notes
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {movement.notes ||
                    'No notes were provided.'}
                </p>
              </div>

              {movement.deleted_at && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                  Deleted on{' '}
                  {formatMovementDate(
                    movement.deleted_at,
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DetailItem({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-extrabold text-slate-800">
        {value}
      </p>
    </div>
  )
}
