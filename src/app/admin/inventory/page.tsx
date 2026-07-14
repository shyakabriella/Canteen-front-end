'use client'

import {
  AlertTriangle,
  ArchiveRestore,
  Boxes,
  LoaderCircle,
  PackageOpen,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useState,
} from 'react'
import InventoryStockDetailsModal from '@/components/admin/inventory/InventoryStockDetailsModal'
import InventoryStockFormModal from '@/components/admin/inventory/InventoryStockFormModal'
import InventoryStockTable from '@/components/admin/inventory/InventoryStockTable'
import StockAdjustmentModal, {
  type AdjustmentType,
} from '@/components/admin/inventory/StockAdjustmentModal'
import {
  getCurrentStock,
  isLowStock,
  isOutOfStock,
} from '@/lib/inventory-stock'
import { getFoodItems } from '@/services/food-item.service'
import {
  addInventoryStock,
  createInventoryStock,
  deleteInventoryStock,
  getInventoryStock,
  getInventoryStocks,
  reduceInventoryStock,
  restoreInventoryStock,
  updateInventoryStock,
} from '@/services/inventory-stock.service'
import type { FoodItem } from '@/types/food-item'
import type {
  InventoryStock,
  InventoryStockPayload,
  StockAdjustmentPayload,
} from '@/types/inventory-stock'

export default function InventoryPage() {
  const [stocks, setStocks] = useState<
    InventoryStock[]
  >([])

  const [foodItems, setFoodItems] = useState<
    FoodItem[]
  >([])

  const [searchInput, setSearchInput] =
    useState('')
  const [search, setSearch] = useState('')
  const [foodItemFilter, setFoodItemFilter] =
    useState('')
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

  const [formOpen, setFormOpen] =
    useState(false)
  const [editingStock, setEditingStock] =
    useState<InventoryStock | null>(null)

  const [
    adjustmentOpen,
    setAdjustmentOpen,
  ] = useState(false)

  const [
    adjustmentType,
    setAdjustmentType,
  ] = useState<AdjustmentType>('add')

  const [
    adjustmentStock,
    setAdjustmentStock,
  ] = useState<InventoryStock | null>(null)

  const [detailsOpen, setDetailsOpen] =
    useState(false)
  const [detailsStock, setDetailsStock] =
    useState<InventoryStock | null>(null)
  const [detailsLoading, setDetailsLoading] =
    useState(false)
  const [detailsError, setDetailsError] =
    useState('')

  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] =
    useState('')

  const loadFoodItems =
    useCallback(async () => {
      try {
        const result = await getFoodItems({
          perPage: 200,
        })

        setFoodItems(result.foodItems)
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to load food items.',
        )
      }
    }, [])

  const loadStocks = useCallback(
    async (showRefresh = false) => {
      setErrorMessage('')

      if (showRefresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      try {
        const result =
          await getInventoryStocks({
            search,
            foodItemId: foodItemFilter,
            includeDeleted,
            perPage: 200,
          })

        setStocks(result.stocks)
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to load inventory records.',
        )
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [
      search,
      foodItemFilter,
      includeDeleted,
    ],
  )

  useEffect(() => {
    void loadFoodItems()
  }, [loadFoodItems])

  useEffect(() => {
    void loadStocks()
  }, [loadStocks])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim())
    }, 400)

    return () => window.clearTimeout(timer)
  }, [searchInput])

  function openCreateModal() {
    setEditingStock(null)
    setFormOpen(true)
  }

  function openEditModal(
    stock: InventoryStock,
  ) {
    setEditingStock(stock)
    setFormOpen(true)
  }

  async function handleFormSubmit(
    payload: InventoryStockPayload,
  ) {
    setIsSubmitting(true)
    setMessage('')
    setErrorMessage('')

    try {
      const result = editingStock
        ? await updateInventoryStock(
            editingStock.id,
            payload,
          )
        : await createInventoryStock(payload)

      setMessage(result.message)
      setFormOpen(false)
      setEditingStock(null)

      await loadStocks(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to save inventory stock.',
      )

      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleView(
    stock: InventoryStock,
  ) {
    setDetailsOpen(true)
    setDetailsLoading(true)
    setDetailsStock(null)
    setDetailsError('')

    try {
      const result =
        await getInventoryStock(stock.id)

      setDetailsStock(result)
    } catch (error) {
      setDetailsError(
        error instanceof Error
          ? error.message
          : 'Unable to load stock details.',
      )
    } finally {
      setDetailsLoading(false)
    }
  }

  function openAdjustment(
    stock: InventoryStock,
    type: AdjustmentType,
  ) {
    setAdjustmentStock(stock)
    setAdjustmentType(type)
    setAdjustmentOpen(true)
  }

  async function handleAdjustment(
    payload: StockAdjustmentPayload,
  ) {
    if (!adjustmentStock) {
      return
    }

    setIsSubmitting(true)
    setMessage('')
    setErrorMessage('')

    try {
      const result =
        adjustmentType === 'add'
          ? await addInventoryStock(
              adjustmentStock.id,
              payload,
            )
          : await reduceInventoryStock(
              adjustmentStock.id,
              payload,
            )

      setMessage(result.message)
      setAdjustmentOpen(false)
      setAdjustmentStock(null)

      await loadStocks(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to update stock quantity.',
      )

      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(
    stock: InventoryStock,
  ) {
    const confirmed = window.confirm(
      'Delete this inventory stock record?',
    )

    if (!confirmed) {
      return
    }

    setProcessingId(stock.id)
    setMessage('')
    setErrorMessage('')

    try {
      const responseMessage =
        await deleteInventoryStock(stock.id)

      setMessage(responseMessage)
      await loadStocks(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to delete stock record.',
      )
    } finally {
      setProcessingId(null)
    }
  }

  async function handleRestore(
    stock: InventoryStock,
  ) {
    const confirmed = window.confirm(
      'Restore this inventory stock record?',
    )

    if (!confirmed) {
      return
    }

    setProcessingId(stock.id)
    setMessage('')
    setErrorMessage('')

    try {
      const responseMessage =
        await restoreInventoryStock(stock.id)

      setMessage(responseMessage)
      await loadStocks(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to restore stock record.',
      )
    } finally {
      setProcessingId(null)
    }
  }

  const activeStocks = stocks.filter(
    (stock) => !stock.deleted_at,
  )

  const lowStockCount = activeStocks.filter(
    isLowStock,
  ).length

  const outOfStockCount =
    activeStocks.filter(isOutOfStock).length

  const totalQuantity = activeStocks.reduce(
    (total, stock) =>
      total + getCurrentStock(stock),
    0,
  )

  return (
    <>
      <div className="space-y-6">
        <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-600">
              Inventory Management
            </p>

            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
              Inventory Stocks
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage current quantities, stock limits
              and adjustments.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                void loadStocks(true)
              }
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
              Create Stock
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
            title="Stock Records"
            value={String(stocks.length)}
            icon={Boxes}
            iconClass="bg-indigo-50 text-indigo-600"
          />

          <SummaryCard
            title="Total Quantity"
            value={new Intl.NumberFormat(
              'en-US',
            ).format(totalQuantity)}
            icon={PackageOpen}
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <SummaryCard
            title="Low Stock"
            value={String(lowStockCount)}
            icon={AlertTriangle}
            iconClass="bg-amber-50 text-amber-600"
          />

          <SummaryCard
            title="Out of Stock"
            value={String(outOfStockCount)}
            icon={ArchiveRestore}
            iconClass="bg-red-50 text-red-600"
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-3 border-b border-slate-200 p-5 md:grid-cols-2 xl:grid-cols-[1fr_260px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(event.target.value)
                }
                placeholder="Search inventory..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            <select
              value={foodItemFilter}
              onChange={(event) =>
                setFoodItemFilter(
                  event.target.value,
                )
              }
              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            >
              <option value="">
                All food items
              </option>

              {foodItems.map((foodItem) => (
                <option
                  key={foodItem.id}
                  value={String(foodItem.id)}
                >
                  {foodItem.name}
                </option>
              ))}
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
                  Loading inventory...
                </p>
              </div>
            </div>
          ) : stocks.length === 0 ? (
            <div className="flex min-h-[380px] items-center justify-center px-6 text-center">
              <div>
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600">
                  <Boxes className="h-8 w-8" />
                </span>

                <h2 className="mt-5 text-lg font-extrabold text-slate-900">
                  No inventory records found
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Create a stock record for each food
                  item that requires inventory tracking.
                </p>

                <button
                  type="button"
                  onClick={openCreateModal}
                  className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white"
                >
                  <Plus className="h-4 w-4" />
                  Create First Stock
                </button>
              </div>
            </div>
          ) : (
            <InventoryStockTable
              stocks={stocks}
              processingId={processingId}
              onView={(stock) =>
                void handleView(stock)
              }
              onEdit={openEditModal}
              onDelete={(stock) =>
                void handleDelete(stock)
              }
              onRestore={(stock) =>
                void handleRestore(stock)
              }
              onAddStock={(stock) =>
                openAdjustment(stock, 'add')
              }
              onReduceStock={(stock) =>
                openAdjustment(stock, 'reduce')
              }
            />
          )}
        </section>
      </div>

      <InventoryStockFormModal
        isOpen={formOpen}
        stock={editingStock}
        foodItems={foodItems}
        isSubmitting={isSubmitting}
        onClose={() => {
          if (!isSubmitting) {
            setFormOpen(false)
            setEditingStock(null)
          }
        }}
        onSubmit={handleFormSubmit}
      />

      <StockAdjustmentModal
        isOpen={adjustmentOpen}
        type={adjustmentType}
        stock={adjustmentStock}
        isSubmitting={isSubmitting}
        onClose={() => {
          if (!isSubmitting) {
            setAdjustmentOpen(false)
            setAdjustmentStock(null)
          }
        }}
        onSubmit={handleAdjustment}
      />

      <InventoryStockDetailsModal
        isOpen={detailsOpen}
        stock={detailsStock}
        isLoading={detailsLoading}
        errorMessage={detailsError}
        onClose={() => {
          setDetailsOpen(false)
          setDetailsStock(null)
          setDetailsError('')
        }}
      />
    </>
  )
}

interface SummaryCardProps {
  title: string
  value: string
  icon: typeof Boxes
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
