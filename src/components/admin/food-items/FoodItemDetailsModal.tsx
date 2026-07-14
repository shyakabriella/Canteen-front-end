'use client'

import {
  CalendarDays,
  CircleDollarSign,
  FolderOpen,
  LoaderCircle,
  UtensilsCrossed,
  X,
} from 'lucide-react'
import {
  formatFoodPrice,
  getFoodItemCategoryName,
  getFoodItemImageUrl,
  isFoodItemAvailable,
} from '@/lib/food-item'
import type { FoodItem } from '@/types/food-item'

interface FoodItemDetailsModalProps {
  isOpen: boolean
  foodItem: FoodItem | null
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

export default function FoodItemDetailsModal({
  isOpen,
  foodItem,
  isLoading,
  errorMessage,
  onClose,
}: FoodItemDetailsModalProps) {
  if (!isOpen) {
    return null
  }

  const imageUrl = foodItem
    ? getFoodItemImageUrl(foodItem)
    : null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4">
      <button
        type="button"
        aria-label="Close food item details"
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="relative z-10 my-auto w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <UtensilsCrossed className="h-5 w-5" />
            </span>

            <div>
              <h2 className="font-extrabold text-slate-950">
                Food Item Details
              </h2>

              <p className="text-xs text-slate-500">
                Information loaded from the backend.
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
                  Loading food item...
                </p>
              </div>
            </div>
          )}

          {!isLoading && errorMessage && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {!isLoading && foodItem && (
            <div className="space-y-5">
              <div className="overflow-hidden rounded-3xl bg-slate-100">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={foodItem.name}
                    className="h-64 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-64 items-center justify-center bg-gradient-to-br from-indigo-100 to-blue-100">
                    <UtensilsCrossed className="h-16 w-16 text-indigo-300" />
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
                    Food Item
                  </p>

                  <h3 className="mt-2 text-2xl font-extrabold text-slate-950">
                    {foodItem.name}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {foodItem.description ||
                      'No description was provided.'}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${
                    foodItem.deleted_at
                      ? 'bg-red-50 text-red-700'
                      : isFoodItemAvailable(foodItem)
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {foodItem.deleted_at
                    ? 'Deleted'
                    : isFoodItemAvailable(foodItem)
                      ? 'Available'
                      : 'Unavailable'}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  icon={FolderOpen}
                  label="Category"
                  value={getFoodItemCategoryName(
                    foodItem,
                  )}
                />

                <DetailItem
                  icon={CircleDollarSign}
                  label="Price"
                  value={formatFoodPrice(foodItem.price)}
                />

                <DetailItem
                  icon={CalendarDays}
                  label="Created"
                  value={formatDate(foodItem.created_at)}
                />

                <DetailItem
                  icon={CalendarDays}
                  label="Last Updated"
                  value={formatDate(foodItem.updated_at)}
                />
              </div>

              {foodItem.deleted_at && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-red-500">
                    Deleted at
                  </p>

                  <p className="mt-1 text-sm font-bold text-red-700">
                    {formatDate(foodItem.deleted_at)}
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
  icon: typeof FolderOpen
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
