'use client'

import {
  Eye,
  PackageMinus,
  PackagePlus,
  Pencil,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import {
  formatStockQuantity,
  getCurrentStock,
  getInventoryFoodItem,
  getInventoryFoodName,
  getMinimumStock,
  getStockUnit,
  isLowStock,
  isOutOfStock,
  stockPercentage,
} from '@/lib/inventory-stock'
import {
  getFoodItemImageUrl,
} from '@/lib/food-item'
import type { InventoryStock } from '@/types/inventory-stock'

interface InventoryStockTableProps {
  stocks: InventoryStock[]
  processingId: number | string | null
  onView: (stock: InventoryStock) => void
  onEdit: (stock: InventoryStock) => void
  onDelete: (stock: InventoryStock) => void
  onRestore: (stock: InventoryStock) => void
  onAddStock: (stock: InventoryStock) => void
  onReduceStock: (stock: InventoryStock) => void
}

function formatDate(
  value?: string | null,
): string {
  if (!value) {
    return '—'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
  }).format(date)
}

export default function InventoryStockTable({
  stocks,
  processingId,
  onView,
  onEdit,
  onDelete,
  onRestore,
  onAddStock,
  onReduceStock,
}: InventoryStockTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1100px] text-left">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.14em] text-slate-400">
          <tr>
            <th className="px-6 py-4 font-extrabold">
              Food Item
            </th>

            <th className="px-4 py-4 font-extrabold">
              Current Stock
            </th>

            <th className="px-4 py-4 font-extrabold">
              Minimum
            </th>

            <th className="px-4 py-4 font-extrabold">
              Stock Level
            </th>

            <th className="px-4 py-4 font-extrabold">
              Status
            </th>

            <th className="px-4 py-4 font-extrabold">
              Updated
            </th>

            <th className="px-6 py-4 text-right font-extrabold">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {stocks.map((stock) => {
            const foodItem =
              getInventoryFoodItem(stock)

            const imageUrl = foodItem
              ? getFoodItemImageUrl(foodItem)
              : null

            const deleted = Boolean(
              stock.deleted_at,
            )

            const low = isLowStock(stock)
            const out = isOutOfStock(stock)
            const percentage =
              stockPercentage(stock)

            const processing =
              String(processingId) ===
              String(stock.id)

            return (
              <tr
                key={stock.id}
                className={`text-sm transition hover:bg-slate-50 ${
                  deleted ? 'bg-red-50/30' : ''
                }`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-indigo-50 font-extrabold text-indigo-600">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={getInventoryFoodName(
                            stock,
                          )}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        getInventoryFoodName(stock)
                          .charAt(0)
                          .toUpperCase()
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="max-w-[220px] truncate font-extrabold text-slate-900">
                        {getInventoryFoodName(stock)}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Stock ID: {stock.id}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="whitespace-nowrap px-4 py-4 font-extrabold text-slate-900">
                  {formatStockQuantity(
                    getCurrentStock(stock),
                    getStockUnit(stock),
                  )}
                </td>

                <td className="whitespace-nowrap px-4 py-4 text-slate-500">
                  {formatStockQuantity(
                    getMinimumStock(stock),
                    getStockUnit(stock),
                  )}
                </td>

                <td className="px-4 py-4">
                  <div className="w-36">
                    <div className="mb-2 flex justify-between text-[10px] font-bold text-slate-400">
                      <span>0%</span>
                      <span>
                        {Math.round(percentage)}%
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${
                          out
                            ? 'bg-red-500'
                            : low
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                        }`}
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${
                      deleted
                        ? 'bg-red-50 text-red-700 ring-red-200'
                        : out
                          ? 'bg-red-50 text-red-700 ring-red-200'
                          : low
                            ? 'bg-amber-50 text-amber-700 ring-amber-200'
                            : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                    }`}
                  >
                    {deleted
                      ? 'Deleted'
                      : out
                        ? 'Out of Stock'
                        : low
                          ? 'Low Stock'
                          : 'In Stock'}
                  </span>
                </td>

                <td className="whitespace-nowrap px-4 py-4 text-slate-500">
                  {formatDate(stock.updated_at)}
                </td>

                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onView(stock)}
                      title="View stock"
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {!deleted && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            onAddStock(stock)
                          }
                          title="Add stock"
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        >
                          <PackagePlus className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onReduceStock(stock)
                          }
                          disabled={
                            getCurrentStock(stock) <= 0
                          }
                          title="Reduce stock"
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <PackageMinus className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onEdit(stock)
                          }
                          title="Edit stock"
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onDelete(stock)
                          }
                          disabled={processing}
                          title="Delete stock"
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
                          onRestore(stock)
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
