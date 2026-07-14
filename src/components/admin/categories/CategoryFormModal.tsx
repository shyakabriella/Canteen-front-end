'use client'

import {
  CheckCircle2,
  LoaderCircle,
  Tags,
  X,
} from 'lucide-react'
import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'
import type {
  FoodCategory,
  FoodCategoryPayload,
} from '@/types/food-category'

interface CategoryFormModalProps {
  isOpen: boolean
  category?: FoodCategory | null
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (
    payload: FoodCategoryPayload,
  ) => Promise<void>
}

function categoryIsActive(
  category?: FoodCategory | null,
): boolean {
  if (!category) {
    return true
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

export default function CategoryFormModal({
  isOpen,
  category,
  isSubmitting,
  onClose,
  onSubmit,
}: CategoryFormModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] =
    useState('')
  const [isActive, setIsActive] = useState(true)
  const [formError, setFormError] = useState('')

  const editing = Boolean(category)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setName(category?.name ?? '')
    setDescription(category?.description ?? '')
    setIsActive(categoryIsActive(category))
    setFormError('')
  }, [isOpen, category])

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setFormError('')

    if (!name.trim()) {
      setFormError('Category name is required.')
      return
    }

    await onSubmit({
      name: name.trim(),
      description: description.trim(),
      is_active: isActive,
    })
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close category form"
        onClick={onClose}
        disabled={isSubmitting}
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
                {editing
                  ? 'Update Category'
                  : 'Create Category'}
              </h2>

              <p className="text-xs text-slate-500">
                {editing
                  ? 'Change the category information.'
                  : 'Add a new category to the food menu.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-6"
        >
          {formError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          <div>
            <label
              htmlFor="category-name"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Category name
            </label>

            <input
              id="category-name"
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Example: Main Meals"
              disabled={isSubmitting}
              required
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label
              htmlFor="category-description"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Description
            </label>

            <textarea
              id="category-description"
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="Describe the food category..."
              disabled={isSubmitting}
              rows={4}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <p className="text-sm font-bold text-slate-800">
                Active category
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Active categories can appear on the food menu.
              </p>
            </div>

            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) =>
                setIsActive(event.target.checked)
              }
              disabled={isSubmitting}
              className="h-5 w-5 accent-indigo-600"
            />
          </label>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  {editing
                    ? 'Update Category'
                    : 'Create Category'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
