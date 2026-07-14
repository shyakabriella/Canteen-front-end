'use client'

import {
  AlertTriangle,
  ArchiveRestore,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  Tags,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useState,
} from 'react'
import CategoryDetailsModal from '@/components/admin/categories/CategoryDetailsModal'
import CategoryFormModal from '@/components/admin/categories/CategoryFormModal'
import CategoryTable from '@/components/admin/categories/CategoryTable'
import {
  createFoodCategory,
  deleteFoodCategory,
  getFoodCategories,
  getFoodCategory,
  restoreFoodCategory,
  updateFoodCategory,
} from '@/services/food-category.service'
import type {
  FoodCategory,
  FoodCategoryPayload,
} from '@/types/food-category'

export default function FoodCategoriesPage() {
  const [categories, setCategories] = useState<
    FoodCategory[]
  >([])
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [includeDeleted, setIncludeDeleted] =
    useState(false)

  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] =
    useState(false)
  const [isSubmitting, setIsSubmitting] =
    useState(false)

  const [processingId, setProcessingId] = useState<
    number | string | null
  >(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] =
    useState<FoodCategory | null>(null)

  const [detailsOpen, setDetailsOpen] =
    useState(false)
  const [detailsCategory, setDetailsCategory] =
    useState<FoodCategory | null>(null)
  const [detailsLoading, setDetailsLoading] =
    useState(false)
  const [detailsError, setDetailsError] =
    useState('')

  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] =
    useState('')

  const loadCategories = useCallback(
    async (showRefresh = false) => {
      setErrorMessage('')

      if (showRefresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      try {
        const result = await getFoodCategories({
          search,
          includeDeleted,
          perPage: 100,
        })

        setCategories(result.categories)
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to load food categories.',
        )
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [search, includeDeleted],
  )

  useEffect(() => {
    void loadCategories()
  }, [loadCategories])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim())
    }, 400)

    return () => window.clearTimeout(timer)
  }, [searchInput])

  function openCreateModal() {
    setEditingCategory(null)
    setFormOpen(true)
  }

  function openEditModal(category: FoodCategory) {
    setEditingCategory(category)
    setFormOpen(true)
  }

  async function handleFormSubmit(
    payload: FoodCategoryPayload,
  ) {
    setIsSubmitting(true)
    setErrorMessage('')
    setMessage('')

    try {
      const result = editingCategory
        ? await updateFoodCategory(
            editingCategory.id,
            payload,
          )
        : await createFoodCategory(payload)

      setMessage(result.message)
      setFormOpen(false)
      setEditingCategory(null)

      await loadCategories(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to save the category.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleView(
    category: FoodCategory,
  ) {
    setDetailsOpen(true)
    setDetailsLoading(true)
    setDetailsCategory(null)
    setDetailsError('')

    try {
      const result = await getFoodCategory(category.id)
      setDetailsCategory(result)
    } catch (error) {
      setDetailsError(
        error instanceof Error
          ? error.message
          : 'Unable to load category details.',
      )
    } finally {
      setDetailsLoading(false)
    }
  }

  async function handleDelete(
    category: FoodCategory,
  ) {
    const confirmed = window.confirm(
      `Delete the category "${category.name}"?\n\nYou can restore it later when soft deletes are enabled.`,
    )

    if (!confirmed) {
      return
    }

    setProcessingId(category.id)
    setMessage('')
    setErrorMessage('')

    try {
      const responseMessage =
        await deleteFoodCategory(category.id)

      setMessage(responseMessage)
      await loadCategories(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to delete the category.',
      )
    } finally {
      setProcessingId(null)
    }
  }

  async function handleRestore(
    category: FoodCategory,
  ) {
    const confirmed = window.confirm(
      `Restore the category "${category.name}"?`,
    )

    if (!confirmed) {
      return
    }

    setProcessingId(category.id)
    setMessage('')
    setErrorMessage('')

    try {
      const responseMessage =
        await restoreFoodCategory(category.id)

      setMessage(responseMessage)
      await loadCategories(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to restore the category.',
      )
    } finally {
      setProcessingId(null)
    }
  }

  const activeCount = categories.filter(
    (category) => !category.deleted_at,
  ).length

  const deletedCount = categories.filter(
    (category) => Boolean(category.deleted_at),
  ).length

  return (
    <>
      <div className="space-y-6">
        <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-600">
              Canteen Management
            </p>

            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
              Food Categories
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Create, update, delete and restore food
              categories.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void loadCategories(true)}
              disabled={isRefreshing}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
            >
              {isRefreshing ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}

              Refresh
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Add Category
            </button>
          </div>
        </section>

        {message && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {message}
          </div>
        )}

        {errorMessage && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-3">
          <SummaryCard
            title="Displayed Categories"
            value={String(categories.length)}
            icon={Tags}
            iconClass="bg-indigo-50 text-indigo-600"
          />

          <SummaryCard
            title="Active Records"
            value={String(activeCount)}
            icon={Tags}
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <SummaryCard
            title="Deleted Records"
            value={String(deletedCount)}
            icon={ArchiveRestore}
            iconClass="bg-red-50 text-red-600"
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(event.target.value)
                }
                placeholder="Search categories..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-600">
              <input
                type="checkbox"
                checked={includeDeleted}
                onChange={(event) =>
                  setIncludeDeleted(event.target.checked)
                }
                className="h-4 w-4 accent-indigo-600"
              />

              Include deleted categories
            </label>
          </div>

          {isLoading ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <div className="text-center">
                <LoaderCircle className="mx-auto h-9 w-9 animate-spin text-indigo-600" />

                <p className="mt-3 text-sm font-semibold text-slate-500">
                  Loading food categories...
                </p>
              </div>
            </div>
          ) : categories.length === 0 ? (
            <div className="flex min-h-[360px] items-center justify-center px-6 text-center">
              <div>
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600">
                  <Tags className="h-8 w-8" />
                </span>

                <h2 className="mt-5 text-lg font-extrabold text-slate-900">
                  No food categories found
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Create a category such as Main Meals,
                  Drinks, Snacks or Desserts.
                </p>

                <button
                  type="button"
                  onClick={openCreateModal}
                  className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white"
                >
                  <Plus className="h-4 w-4" />
                  Create First Category
                </button>
              </div>
            </div>
          ) : (
            <CategoryTable
              categories={categories}
              processingId={processingId}
              onView={(category) =>
                void handleView(category)
              }
              onEdit={openEditModal}
              onDelete={(category) =>
                void handleDelete(category)
              }
              onRestore={(category) =>
                void handleRestore(category)
              }
            />
          )}
        </section>
      </div>

      <CategoryFormModal
        isOpen={formOpen}
        category={editingCategory}
        isSubmitting={isSubmitting}
        onClose={() => {
          if (!isSubmitting) {
            setFormOpen(false)
            setEditingCategory(null)
          }
        }}
        onSubmit={handleFormSubmit}
      />

      <CategoryDetailsModal
        isOpen={detailsOpen}
        category={detailsCategory}
        isLoading={detailsLoading}
        errorMessage={detailsError}
        onClose={() => {
          setDetailsOpen(false)
          setDetailsCategory(null)
          setDetailsError('')
        }}
      />
    </>
  )
}

interface SummaryCardProps {
  title: string
  value: string
  icon: typeof Tags
  iconClass: string
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  iconClass,
}: SummaryCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-extrabold text-slate-950">
            {value}
          </p>
        </div>

        <span
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconClass}`}
        >
          <Icon className="h-6 w-6" />
        </span>
      </div>
    </article>
  )
}
