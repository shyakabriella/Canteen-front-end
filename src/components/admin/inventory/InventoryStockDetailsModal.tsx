'use client'

import {
  AlertTriangle,
  Boxes,
  CalendarDays,
  LoaderCircle,
  PackageOpen,
  X,
} from 'lucide-react'
import {
  formatStockQuantity,
  getCurrentStock,
  getInventoryFoodName,
  getMaximumStock,
  getMinimumStock,
  getStockUnit,
  isLowStock,
  isOutOfStock,
} from '@/lib/inventory-stock'
import type { InventoryStock } from '@/types/inventory-stock'

interface InventoryStockDetailsModalProps {
  isOpen: boolean
  stock: InventoryStock | null
  isLoading: boolean
  errorMessage: string
  onClose: () => void
}

function formatDate(
  value?: string | null,
): string {
  if (!value) {
    return 'Not available'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export default function InventoryStockDetailsModal({
  isOpen,
  stock,
  isLoading,
  errorMessage,
  onClose,
}: InventoryStockDetailsModalProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close stock details"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Boxes className="h-5 w-5" />
            </span>

            <div>
              <h2 className="font-extrabold text-slate-950">
                Inventory Details
              </h2>

              <p className="text-xs text-slate-500">
                Stock record information.
              </p>
            </div>
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
                  Loading stock details...
                </p>
              </div>
            </div>
          )}

          {!isLoading && errorMessage && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {!isLoading && stock && (
            <div className="space-y-5">
              <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-blue-700 p-6 text-white">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-100">
                      Food Item
                    </p>

                    <h3 className="mt-2 text-2xl font-extrabold">
                      {getInventoryFoodName(stock)}
                    </h3>

                    <p className="mt-4 text-3xl font-extrabold">
                      {formatStockQuantity(
                        getCurrentStock(stock),
                        getStockUnit(stock),
                      )}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                      stock.deleted_at
                        ? 'bg-red-100 text-red-700'
                        : isOutOfStock(stock)
                          ? 'bg-red-100 text-red-700'
                          : isLowStock(stock)
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {stock.deleted_at
                      ? 'Deleted'
                      : isOutOfStock(stock)
                        ? 'Out of Stock'
                        : isLowStock(stock)
                          ? 'Low Stock'
                          : 'In Stock'}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  icon={PackageOpen}
                  label="Current Quantity"
                  value={formatStockQuantity(
                    getCurrentStock(stock),
                    getStockUnit(stock),
                  )}
                />

                <DetailItem
                  icon={AlertTriangle}
                  label="Minimum Quantity"
                  value={formatStockQuantity(
                    getMinimumStock(stock),
                    getStockUnit(stock),
                  )}
                />

                <DetailItem
                  icon={Boxes}
                  label="Maximum Quantity"
                  value={
                    getMaximumStock(stock) === null
                      ? 'Not set'
                      : formatStockQuantity(
                          getMaximumStock(stock) ?? 0,
                          getStockUnit(stock),
                        )
                  }
                />

                <DetailItem
                  icon={PackageOpen}
                  label="Unit"
                  value={getStockUnit(stock)}
                />

                <DetailItem
                  icon={CalendarDays}
                  label="Created"
                  value={formatDate(stock.created_at)}
                />

                <DetailItem
                  icon={CalendarDays}
                  label="Updated"
                  value={formatDate(stock.updated_at)}
                />
              </div>

              {stock.notes && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Notes
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {stock.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface DetailItemProps {
  icon: typeof Boxes
  label: string
  value: string
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: DetailItemProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
          <Icon className="h-5 w-5" />
        </span>

        <div className="min-w-0">
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
