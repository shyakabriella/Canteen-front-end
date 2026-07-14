'use client'

import {
  CalendarDays,
  LoaderCircle,
  PackageOpen,
  Tags,
  X,
} from 'lucide-react'
import type { FoodCategory } from '@/types/food-category'

interface CategoryDetailsModalProps {
  isOpen: boolean
  category: FoodCategory | null
  isLoading: boolean
  errorMessage: string
  onClose: () => void
}

function formatDate(value?: string | null): string {
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

function categoryIsActive(
  category: FoodCategory,
): boolean {
  if (category.deleted_at) {
    return false
  }

  if (category.is_active !== undefined) {
    return ![
      false,
      0,
      '0',
      'false',
      'inactive',
    ].includes(category.is_active)
  }

  return category.status?.toLowerCase() !== 'inactive'
}

export default function CategoryDetailsModal({
  isOpen,
  category,
  isLoading,
  errorMessage,
  onClose,
}: CategoryDetailsModalProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close category details"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Tags className="h-5 w-5" />
            </span>

            <div>
              <h2 className="font-extrabold text-slate-950">
                Category Details
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

        <div className="p-6">
          {isLoading && (
            <div className="flex min-h-64 items-center justify-center">
              <div className="text-center">
                <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-indigo-600" />

                <p className="mt-3 text-sm font-semibold text-slate-500">
                  Loading category...
                </p>
              </div>
            </div>
          )}

          {!isLoading && errorMessage && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {!isLoading && category && (
            <div className="space-y-5">
              <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 p-6 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-100">
                      Food Category
                    </p>

                    <h3 className="mt-2 text-2xl font-extrabold">
                      {category.name}
                    </h3>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      category.deleted_at
                        ? 'bg-red-100 text-red-700'
                        : categoryIsActive(category)
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {category.deleted_at
                      ? 'Deleted'
                      : categoryIsActive(category)
                        ? 'Active'
                        : 'Inactive'}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-6 text-indigo-100">
                  {category.description ||
                    'No description was provided for this category.'}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  icon={PackageOpen}
                  label="Food items"
                  value={String(
                    category.food_items_count ?? 0,
                  )}
                />

                <DetailItem
                  icon={Tags}
                  label="Category ID"
                  value={String(category.id)}
                />

                <DetailItem
                  icon={CalendarDays}
                  label="Created"
                  value={formatDate(category.created_at)}
                />

                <DetailItem
                  icon={CalendarDays}
                  label="Last updated"
                  value={formatDate(category.updated_at)}
                />
              </div>

              {category.deleted_at && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-red-500">
                    Deleted at
                  </p>

                  <p className="mt-1 text-sm font-bold text-red-700">
                    {formatDate(category.deleted_at)}
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
  icon: typeof Tags
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
