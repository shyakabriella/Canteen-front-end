'use client'

import {
  AlertTriangle,
  ArchiveRestore,
  CheckCircle2,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  UtensilsCrossed,
  XCircle,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useState,
} from 'react'
import FoodItemDetailsModal from '@/components/admin/food-items/FoodItemDetailsModal'
import FoodItemFormModal from '@/components/admin/food-items/FoodItemFormModal'
import FoodItemTable from '@/components/admin/food-items/FoodItemTable'
import { isFoodItemAvailable } from '@/lib/food-item'
import {
  getFoodCategories,
} from '@/services/food-category.service'
import {
  createFoodItem,
  deleteFoodItem,
  getFoodItem,
  getFoodItems,
  restoreFoodItem,
  updateFoodItem,
  updateFoodItemAvailability,
} from '@/services/food-item.service'
import type { FoodCategory } from '@/types/food-category'
import type {
  FoodItem,
  FoodItemPayload,
} from '@/types/food-item'

type AvailabilityFilter =
  | ''
  | 'available'
  | 'unavailable'

export default function FoodItemsPage() {
  const [foodItems, setFoodItems] = useState<
    FoodItem[]
  >([])
  const [categories, setCategories] = useState<
    FoodCategory[]
  >([])

  const [searchInput, setSearchInput] =
    useState('')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] =
    useState('')
  const [
    availabilityFilter,
    setAvailabilityFilter,
  ] = useState<AvailabilityFilter>('')
  const [includeDeleted, setIncludeDeleted] =
    useState(false)

  const [isLoading, setIsLoading] =
    useState(true)
  const [isRefreshing, setIsRefreshing] =
    useState(false)
  const [isSubmitting, setIsSubmitting] =
    useState(false)

  const [processingId, setProcessingId] =
    useState<number | string | null>(null)
  const [availabilityId, setAvailabilityId] =
    useState<number | string | null>(null)

  const [formOpen, setFormOpen] =
    useState(false)
  const [editingFoodItem, setEditingFoodItem] =
    useState<FoodItem | null>(null)

  const [detailsOpen, setDetailsOpen] =
    useState(false)
  const [detailsFoodItem, setDetailsFoodItem] =
    useState<FoodItem | null>(null)
  const [detailsLoading, setDetailsLoading] =
    useState(false)
  const [detailsError, setDetailsError] =
    useState('')

  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] =
    useState('')

  const loadCategories = useCallback(async () => {
    try {
      const result = await getFoodCategories({
        perPage: 200,
      })

      setCategories(
        result.categories.filter(
          (category) => !category.deleted_at,
        ),
      )
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to load food categories.',
      )
    }
  }, [])

  const loadFoodItems = useCallback(
    async (showRefresh = false) => {
      setErrorMessage('')

      if (showRefresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      try {
        const result = await getFoodItems({
          search,
          categoryId: categoryFilter,
          availability: availabilityFilter,
          includeDeleted,
          perPage: 200,
        })

        setFoodItems(result.foodItems)
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to load food items.',
        )
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [
      search,
      categoryFilter,
      availabilityFilter,
      includeDeleted,
    ],
  )

  useEffect(() => {
    void loadCategories()
  }, [loadCategories])

  useEffect(() => {
    void loadFoodItems()
  }, [loadFoodItems])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim())
    }, 400)

    return () => window.clearTimeout(timer)
  }, [searchInput])

  function openCreateModal() {
    setEditingFoodItem(null)
    setFormOpen(true)
  }

  function openEditModal(foodItem: FoodItem) {
    setEditingFoodItem(foodItem)
    setFormOpen(true)
  }

  async function handleFormSubmit(
    payload: FoodItemPayload,
  ) {
    setIsSubmitting(true)
    setMessage('')
    setErrorMessage('')

    try {
      const result = editingFoodItem
        ? await updateFoodItem(
            editingFoodItem.id,
            payload,
          )
        : await createFoodItem(payload)

      setMessage(result.message)
      setFormOpen(false)
      setEditingFoodItem(null)

      await loadFoodItems(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to save the food item.',
      )

      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleView(
    foodItem: FoodItem,
  ) {
    setDetailsOpen(true)
    setDetailsLoading(true)
    setDetailsFoodItem(null)
    setDetailsError('')

    try {
      const result = await getFoodItem(foodItem.id)
      setDetailsFoodItem(result)
    } catch (error) {
      setDetailsError(
        error instanceof Error
          ? error.message
          : 'Unable to load food item details.',
      )
    } finally {
      setDetailsLoading(false)
    }
  }

  async function handleDelete(
    foodItem: FoodItem,
  ) {
    const confirmed = window.confirm(
      `Delete "${foodItem.name}"?\n\nThe item can be restored later when soft deletion is enabled.`,
    )

    if (!confirmed) {
      return
    }

    setProcessingId(foodItem.id)
    setMessage('')
    setErrorMessage('')

    try {
      const responseMessage =
        await deleteFoodItem(foodItem.id)

      setMessage(responseMessage)
      await loadFoodItems(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to delete the food item.',
      )
    } finally {
      setProcessingId(null)
    }
  }

  async function handleRestore(
    foodItem: FoodItem,
  ) {
    const confirmed = window.confirm(
      `Restore "${foodItem.name}"?`,
    )

    if (!confirmed) {
      return
    }

    setProcessingId(foodItem.id)
    setMessage('')
    setErrorMessage('')

    try {
      const responseMessage =
        await restoreFoodItem(foodItem.id)

      setMessage(responseMessage)
      await loadFoodItems(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to restore the food item.',
      )
    } finally {
      setProcessingId(null)
    }
  }

  async function handleAvailabilityChange(
    foodItem: FoodItem,
    available: boolean,
  ) {
    setAvailabilityId(foodItem.id)
    setMessage('')
    setErrorMessage('')

    try {
      const result =
        await updateFoodItemAvailability(
          foodItem.id,
          available,
        )

      setMessage(result.message)

      setFoodItems((currentItems) =>
        currentItems.map((currentItem) =>
          String(currentItem.id) ===
          String(foodItem.id)
            ? {
                ...currentItem,
                ...result.foodItem,
                is_available: available,
              }
            : currentItem,
        ),
      )
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to update availability.',
      )
    } finally {
      setAvailabilityId(null)
    }
  }

  const activeItems = foodItems.filter(
    (foodItem) => !foodItem.deleted_at,
  )

  const availableCount = activeItems.filter(
    isFoodItemAvailable,
  ).length

  const unavailableCount =
    activeItems.length - availableCount

  const deletedCount = foodItems.filter(
    (foodItem) => Boolean(foodItem.deleted_at),
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
              Food Items
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage food items, prices, images and
              availability.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void loadFoodItems(true)}
              disabled={isRefreshing}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
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
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Add Food Item
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

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Displayed Items"
            value={String(foodItems.length)}
            icon={UtensilsCrossed}
            iconClass="bg-indigo-50 text-indigo-600"
          />

          <SummaryCard
            title="Available"
            value={String(availableCount)}
            icon={CheckCircle2}
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <SummaryCard
            title="Unavailable"
            value={String(unavailableCount)}
            icon={XCircle}
            iconClass="bg-amber-50 text-amber-600"
          />

          <SummaryCard
            title="Deleted"
            value={String(deletedCount)}
            icon={ArchiveRestore}
            iconClass="bg-red-50 text-red-600"
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-3 border-b border-slate-200 p-5 md:grid-cols-2 xl:grid-cols-[1fr_220px_190px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(event.target.value)
                }
                placeholder="Search food items..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value)
              }
              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            >
              <option value="">All categories</option>

              {categories.map((category) => (
                <option
                  key={category.id}
                  value={String(category.id)}
                >
                  {category.name}
                </option>
              ))}
            </select>

            <select
              value={availabilityFilter}
              onChange={(event) =>
                setAvailabilityFilter(
                  event.target.value as AvailabilityFilter,
                )
              }
              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            >
              <option value="">
                All availability
              </option>
              <option value="available">
                Available
              </option>
              <option value="unavailable">
                Unavailable
              </option>
            </select>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-600">
              <input
                type="checkbox"
                checked={includeDeleted}
                onChange={(event) =>
                  setIncludeDeleted(
                    event.target.checked,
                  )
                }
                className="h-4 w-4 accent-indigo-600"
              />

              Include deleted
            </label>
          </div>

          {isLoading ? (
            <div className="flex min-h-[380px] items-center justify-center">
              <div className="text-center">
                <LoaderCircle className="mx-auto h-9 w-9 animate-spin text-indigo-600" />

                <p className="mt-3 text-sm font-semibold text-slate-500">
                  Loading food items...
                </p>
              </div>
            </div>
          ) : foodItems.length === 0 ? (
            <div className="flex min-h-[380px] items-center justify-center px-6 text-center">
              <div>
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600">
                  <UtensilsCrossed className="h-8 w-8" />
                </span>

                <h2 className="mt-5 text-lg font-extrabold text-slate-900">
                  No food items found
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Add meals, drinks, snacks or other
                  canteen products.
                </p>

                <button
                  type="button"
                  onClick={openCreateModal}
                  className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white"
                >
                  <Plus className="h-4 w-4" />
                  Create First Food Item
                </button>
              </div>
            </div>
          ) : (
            <FoodItemTable
              foodItems={foodItems}
              processingId={processingId}
              availabilityId={availabilityId}
              onView={(foodItem) =>
                void handleView(foodItem)
              }
              onEdit={openEditModal}
              onDelete={(foodItem) =>
                void handleDelete(foodItem)
              }
              onRestore={(foodItem) =>
                void handleRestore(foodItem)
              }
              onAvailabilityChange={(
                foodItem,
                available,
              ) =>
                void handleAvailabilityChange(
                  foodItem,
                  available,
                )
              }
            />
          )}
        </section>
      </div>

      <FoodItemFormModal
        isOpen={formOpen}
        foodItem={editingFoodItem}
        categories={categories}
        isSubmitting={isSubmitting}
        onClose={() => {
          if (!isSubmitting) {
            setFormOpen(false)
            setEditingFoodItem(null)
          }
        }}
        onSubmit={handleFormSubmit}
      />

      <FoodItemDetailsModal
        isOpen={detailsOpen}
        foodItem={detailsFoodItem}
        isLoading={detailsLoading}
        errorMessage={detailsError}
        onClose={() => {
          setDetailsOpen(false)
          setDetailsFoodItem(null)
          setDetailsError('')
        }}
      />
    </>
  )
}

interface SummaryCardProps {
  title: string
  value: string
  icon: typeof UtensilsCrossed
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
