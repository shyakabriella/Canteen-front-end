'use client'

import {
  Eye,
  PackageOpen,
  Pencil,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import type { FoodCategory } from '@/types/food-category'

interface CategoryTableProps {
  categories: FoodCategory[]
  processingId: number | string | null
  onView: (category: FoodCategory) => void
  onEdit: (category: FoodCategory) => void
  onDelete: (category: FoodCategory) => void
  onRestore: (category: FoodCategory) => void
}

function categoryIsActive(
  category: FoodCategory,
): boolean {
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

function formatDate(value?: string | null): string {
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

export default function CategoryTable({
  categories,
  processingId,
  onView,
  onEdit,
  onDelete,
  onRestore,
}: CategoryTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[850px] text-left">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.14em] text-slate-400">
          <tr>
            <th className="px-6 py-4 font-extrabold">
              Category
            </th>

            <th className="px-4 py-4 font-extrabold">
              Description
            </th>

            <th className="px-4 py-4 font-extrabold">
              Food Items
            </th>

            <th className="px-4 py-4 font-extrabold">
              Status
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
          {categories.map((category) => {
            const deleted = Boolean(category.deleted_at)
            const active = categoryIsActive(category)
            const processing =
              String(processingId) === String(category.id)

            return (
              <tr
                key={category.id}
                className={`text-sm transition hover:bg-slate-50 ${
                  deleted ? 'bg-red-50/30' : ''
                }`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 font-extrabold text-indigo-600">
                      {category.name
                        .trim()
                        .charAt(0)
                        .toUpperCase()}
                    </span>

                    <div className="min-w-0">
                      <p className="max-w-[180px] truncate font-extrabold text-slate-900">
                        {category.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        ID: {category.id}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="max-w-[300px] px-4 py-4">
                  <p className="line-clamp-2 text-sm leading-6 text-slate-500">
                    {category.description ||
                      'No description provided.'}
                  </p>
                </td>

                <td className="px-4 py-4">
                  <span className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">
                    <PackageOpen className="h-4 w-4" />
                    {category.food_items_count ?? 0}
                  </span>
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${
                      deleted
                        ? 'bg-red-50 text-red-700 ring-red-200'
                        : active
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                          : 'bg-amber-50 text-amber-700 ring-amber-200'
                    }`}
                  >
                    {deleted
                      ? 'Deleted'
                      : active
                        ? 'Active'
                        : 'Inactive'}
                  </span>
                </td>

                <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-500">
                  {formatDate(category.created_at)}
                </td>

                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onView(category)}
                      title="View category"
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {!deleted && (
                      <>
                        <button
                          type="button"
                          onClick={() => onEdit(category)}
                          title="Edit category"
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onDelete(category)
                          }
                          disabled={processing}
                          title="Delete category"
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}

                    {deleted && (
                      <button
                        type="button"
                        onClick={() =>
                          onRestore(category)
                        }
                        disabled={processing}
                        title="Restore category"
                        className="flex h-9 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
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
