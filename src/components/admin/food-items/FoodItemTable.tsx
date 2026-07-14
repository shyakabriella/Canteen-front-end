'use client'

import {
  Eye,
  LoaderCircle,
  Pencil,
  RotateCcw,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react'
import {
  formatFoodPrice,
  getFoodItemCategoryName,
  getFoodItemImageUrl,
  isFoodItemAvailable,
} from '@/lib/food-item'
import type { FoodItem } from '@/types/food-item'

interface FoodItemTableProps {
  foodItems: FoodItem[]
  processingId: number | string | null
  availabilityId: number | string | null
  onView: (foodItem: FoodItem) => void
  onEdit: (foodItem: FoodItem) => void
  onDelete: (foodItem: FoodItem) => void
  onRestore: (foodItem: FoodItem) => void
  onAvailabilityChange: (
    foodItem: FoodItem,
    available: boolean,
  ) => void
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

export default function FoodItemTable({
  foodItems,
  processingId,
  availabilityId,
  onView,
  onEdit,
  onDelete,
  onRestore,
  onAvailabilityChange,
}: FoodItemTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1050px] text-left">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.14em] text-slate-400">
          <tr>
            <th className="px-6 py-4 font-extrabold">
              Food Item
            </th>

            <th className="px-4 py-4 font-extrabold">
              Category
            </th>

            <th className="px-4 py-4 font-extrabold">
              Price
            </th>

            <th className="px-4 py-4 font-extrabold">
              Availability
            </th>

            <th className="px-4 py-4 font-extrabold">
              Created
            </th>

            <th className="px-6 py-4 text-right font-extrabold">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {foodItems.map((foodItem) => {
            const imageUrl =
              getFoodItemImageUrl(foodItem)
            const available =
              isFoodItemAvailable(foodItem)
            const deleted = Boolean(
              foodItem.deleted_at,
            )
            const processing =
              String(processingId) ===
              String(foodItem.id)
            const updatingAvailability =
              String(availabilityId) ===
              String(foodItem.id)

            return (
              <tr
                key={foodItem.id}
                className={`text-sm transition hover:bg-slate-50 ${
                  deleted ? 'bg-red-50/30' : ''
                }`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-indigo-50 text-indigo-400">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={foodItem.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UtensilsCrossed className="h-6 w-6" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="max-w-[220px] truncate font-extrabold text-slate-900">
                        {foodItem.name}
                      </p>

                      <p className="mt-1 max-w-[240px] truncate text-xs text-slate-400">
                        {foodItem.description ||
                          `Food item ID: ${foodItem.id}`}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-4">
                  <span className="inline-flex rounded-xl bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700">
                    {getFoodItemCategoryName(
                      foodItem,
                    )}
                  </span>
                </td>

                <td className="whitespace-nowrap px-4 py-4 font-extrabold text-slate-800">
                  {formatFoodPrice(foodItem.price)}
                </td>

                <td className="px-4 py-4">
                  {deleted ? (
                    <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700 ring-1 ring-inset ring-red-200">
                      Deleted
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        onAvailabilityChange(
                          foodItem,
                          !available,
                        )
                      }
                      disabled={updatingAvailability}
                      className={`inline-flex min-w-[120px] items-center justify-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        available
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100'
                          : 'bg-amber-50 text-amber-700 ring-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      {updatingAvailability ? (
                        <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <span
                          className={`h-2 w-2 rounded-full ${
                            available
                              ? 'bg-emerald-500'
                              : 'bg-amber-500'
                          }`}
                        />
                      )}

                      {available
                        ? 'Available'
                        : 'Unavailable'}
                    </button>
                  )}
                </td>

                <td className="whitespace-nowrap px-4 py-4 text-slate-500">
                  {formatDate(foodItem.created_at)}
                </td>

                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onView(foodItem)}
                      title="View food item"
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {!deleted && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            onEdit(foodItem)
                          }
                          title="Edit food item"
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onDelete(foodItem)
                          }
                          disabled={processing}
                          title="Delete food item"
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}

                    {deleted && (
                      <button
                        type="button"
                        onClick={() =>
                          onRestore(foodItem)
                        }
                        disabled={processing}
                        className="flex h-9 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
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
