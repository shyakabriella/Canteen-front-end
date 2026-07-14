'use client'

import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useState,
} from 'react'
import StockMovementDetailsModal from '@/components/admin/stock-movements/StockMovementDetailsModal'
import StockMovementFormModal from '@/components/admin/stock-movements/StockMovementFormModal'
import StockMovementTable from '@/components/admin/stock-movements/StockMovementTable'
import { getInventoryStocks } from '@/services/inventory-stock.service'
import {
  createStockMovement,
  deleteStockMovement,
  getStockMovement,
  getStockMovements,
  getStockMovementSummary,
  restoreStockMovement,
  updateStockMovement,
} from '@/services/stock-movement.service'
import type { InventoryStock } from '@/types/inventory-stock'
import type {
  StockMovement,
  StockMovementPayload,
  StockMovementSummary,
  StockMovementUpdatePayload,
} from '@/types/stock-movement'

const emptySummary: StockMovementSummary = {
  total_movements: 0,
  total_stock_in: 0,
  total_stock_out: 0,
  total_adjustments: 0,
  stock_in_quantity: 0,
  stock_out_quantity: 0,
  net_quantity: 0,
}

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<
    StockMovement[]
  >([])

  const [
    inventoryStocks,
    setInventoryStocks,
  ] = useState<InventoryStock[]>([])

  const [summary, setSummary] =
    useState<StockMovementSummary>(emptySummary)

  const [searchInput, setSearchInput] =
    useState('')
  const [search, setSearch] = useState('')
  const [movementType, setMovementType] =
    useState('')
  const [inventoryStockId, setInventoryStockId] =
    useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
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
  const [editingMovement, setEditingMovement] =
    useState<StockMovement | null>(null)

  const [detailsOpen, setDetailsOpen] =
    useState(false)
  const [
    detailsMovement,
    setDetailsMovement,
  ] = useState<StockMovement | null>(null)
  const [detailsLoading, setDetailsLoading] =
    useState(false)
  const [detailsError, setDetailsError] =
    useState('')

  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] =
    useState('')

  const filters = {
    search,
    movementType,
    inventoryStockId,
    dateFrom,
    dateTo,
    includeDeleted,
    perPage: 200,
  }

  const loadInventoryStocks =
    useCallback(async () => {
      try {
        const result = await getInventoryStocks({
          perPage: 200,
        })

        setInventoryStocks(result.stocks)
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to load inventory stocks.',
        )
      }
    }, [])

  const loadMovements = useCallback(
    async (refresh = false) => {
      setErrorMessage('')

      if (refresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      try {
        const [movementResult, summaryResult] =
          await Promise.all([
            getStockMovements(filters),
            getStockMovementSummary(filters),
          ])

        setMovements(movementResult.movements)
        setSummary(summaryResult)
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to load stock movements.',
        )
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [
      search,
      movementType,
      inventoryStockId,
      dateFrom,
      dateTo,
      includeDeleted,
    ],
  )

  useEffect(() => {
    void loadInventoryStocks()
  }, [loadInventoryStocks])

  useEffect(() => {
    void loadMovements()
  }, [loadMovements])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim())
    }, 400)

    return () => window.clearTimeout(timer)
  }, [searchInput])

  function openCreateModal() {
    setEditingMovement(null)
    setFormOpen(true)
  }

  function openEditModal(
    movement: StockMovement,
  ) {
    setEditingMovement(movement)
    setFormOpen(true)
  }

  async function handleCreate(
    payload: StockMovementPayload,
  ) {
    setIsSubmitting(true)
    setMessage('')
    setErrorMessage('')

    try {
      const result =
        await createStockMovement(payload)

      setMessage(result.message)
      setFormOpen(false)

      await loadMovements(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to create stock movement.',
      )

      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleUpdate(
    payload: StockMovementUpdatePayload,
  ) {
    if (!editingMovement) {
      return
    }

    setIsSubmitting(true)
    setMessage('')
    setErrorMessage('')

    try {
      const result = await updateStockMovement(
        editingMovement.id,
        payload,
      )

      setMessage(result.message)
      setFormOpen(false)
      setEditingMovement(null)

      await loadMovements(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to update stock movement.',
      )

      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleView(
    movement: StockMovement,
  ) {
    setDetailsOpen(true)
    setDetailsLoading(true)
    setDetailsMovement(null)
    setDetailsError('')

    try {
      const result =
        await getStockMovement(movement.id)

      setDetailsMovement(result)
    } catch (error) {
      setDetailsError(
        error instanceof Error
          ? error.message
          : 'Unable to load movement details.',
      )
    } finally {
      setDetailsLoading(false)
    }
  }

  async function handleDelete(
    movement: StockMovement,
  ) {
    const confirmed = window.confirm(
      `Delete stock movement #${movement.id}?\n\nDeleting the movement record may not automatically reverse the stock quantity.`,
    )

    if (!confirmed) {
      return
    }

    setProcessingId(movement.id)
    setMessage('')
    setErrorMessage('')

    try {
      const responseMessage =
        await deleteStockMovement(movement.id)

      setMessage(responseMessage)
      await loadMovements(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to delete stock movement.',
      )
    } finally {
      setProcessingId(null)
    }
  }

  async function handleRestore(
    movement: StockMovement,
  ) {
    const confirmed = window.confirm(
      `Restore stock movement #${movement.id}?`,
    )

    if (!confirmed) {
      return
    }

    setProcessingId(movement.id)
    setMessage('')
    setErrorMessage('')

    try {
      const responseMessage =
        await restoreStockMovement(movement.id)

      setMessage(responseMessage)
      await loadMovements(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to restore stock movement.',
      )
    } finally {
      setProcessingId(null)
    }
  }

  function resetFilters() {
    setSearchInput('')
    setSearch('')
    setMovementType('')
    setInventoryStockId('')
    setDateFrom('')
    setDateTo('')
    setIncludeDeleted(false)
  }

  return (
    <>
      <div className="space-y-6">
        <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-600">
              Inventory Management
            </p>

            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
              Stock Movements
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Track every stock addition, reduction and
              adjustment.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                void loadMovements(true)
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
              Create Movement
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
            title="Total Movements"
            value={summary.total_movements}
            subtitle={`${summary.total_adjustments} adjustments`}
            icon={Boxes}
            className="bg-indigo-50 text-indigo-600"
          />

          <SummaryCard
            title="Stock In"
            value={summary.stock_in_quantity}
            subtitle={`${summary.total_stock_in} records`}
            icon={ArrowDownToLine}
            className="bg-emerald-50 text-emerald-600"
          />

          <SummaryCard
            title="Stock Out"
            value={summary.stock_out_quantity}
            subtitle={`${summary.total_stock_out} records`}
            icon={ArrowUpFromLine}
            className="bg-amber-50 text-amber-600"
          />

          <SummaryCard
            title="Net Quantity"
            value={summary.net_quantity}
            subtitle="Stock in minus stock out"
            icon={RefreshCw}
            className={
              summary.net_quantity >= 0
                ? 'bg-blue-50 text-blue-600'
                : 'bg-red-50 text-red-600'
            }
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="space-y-3 border-b border-slate-200 p-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_190px_240px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="search"
                  value={searchInput}
                  onChange={(event) =>
                    setSearchInput(
                      event.target.value,
                    )
                  }
                  placeholder="Search reason, notes or food item..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                />
              </div>

              <select
                value={movementType}
                onChange={(event) =>
                  setMovementType(
                    event.target.value,
                  )
                }
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              >
                <option value="">
                  All movement types
                </option>
                <option value="in">
                  Stock In
                </option>
                <option value="out">
                  Stock Out
                </option>
                <option value="adjustment">
                  Adjustment
                </option>
              </select>

              <select
                value={inventoryStockId}
                onChange={(event) =>
                  setInventoryStockId(
                    event.target.value,
                  )
                }
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              >
                <option value="">
                  All inventory stocks
                </option>

                {inventoryStocks.map((stock) => (
                  <option
                    key={stock.id}
                    value={String(stock.id)}
                  >
                    {stock.food_item?.name ??
                      stock.foodItem?.name ??
                      `Stock #${stock.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[190px_190px_auto_auto]">
              <input
                type="date"
                value={dateFrom}
                onChange={(event) =>
                  setDateFrom(event.target.value)
                }
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />

              <input
                type="date"
                value={dateTo}
                onChange={(event) =>
                  setDateTo(event.target.value)
                }
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />

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

              <button
                type="button"
                onClick={resetFilters}
                className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex min-h-[390px] items-center justify-center">
              <div className="text-center">
                <LoaderCircle className="mx-auto h-9 w-9 animate-spin text-indigo-600" />

                <p className="mt-3 text-sm font-semibold text-slate-500">
                  Loading stock movements...
                </p>
              </div>
            </div>
          ) : movements.length === 0 ? (
            <div className="flex min-h-[390px] items-center justify-center px-6 text-center">
              <div>
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600">
                  <RefreshCw className="h-8 w-8" />
                </span>

                <h2 className="mt-5 text-lg font-extrabold text-slate-900">
                  No stock movements found
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Create a stock movement or adjust
                  inventory from the inventory page.
                </p>

                <button
                  type="button"
                  onClick={openCreateModal}
                  className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white"
                >
                  <Plus className="h-4 w-4" />
                  Create First Movement
                </button>
              </div>
            </div>
          ) : (
            <StockMovementTable
              movements={movements}
              processingId={processingId}
              onView={(movement) =>
                void handleView(movement)
              }
              onEdit={openEditModal}
              onDelete={(movement) =>
                void handleDelete(movement)
              }
              onRestore={(movement) =>
                void handleRestore(movement)
              }
            />
          )}
        </section>
      </div>

      <StockMovementFormModal
        isOpen={formOpen}
        movement={editingMovement}
        inventoryStocks={inventoryStocks}
        isSubmitting={isSubmitting}
        onClose={() => {
          if (!isSubmitting) {
            setFormOpen(false)
            setEditingMovement(null)
          }
        }}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />

      <StockMovementDetailsModal
        isOpen={detailsOpen}
        movement={detailsMovement}
        isLoading={detailsLoading}
        errorMessage={detailsError}
        onClose={() => {
          setDetailsOpen(false)
          setDetailsMovement(null)
          setDetailsError('')
        }}
      />
    </>
  )
}

interface SummaryCardProps {
  title: string
  value: number
  subtitle: string
  icon: typeof Boxes
  className: string
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  className,
}: SummaryCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-extrabold text-slate-950">
            {new Intl.NumberFormat('en-US', {
              maximumFractionDigits: 2,
            }).format(value)}
          </p>

          <p className="mt-1 truncate text-xs text-slate-400">
            {subtitle}
          </p>
        </div>

        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${className}`}
        >
          <Icon className="h-6 w-6" />
        </span>
      </div>
    </article>
  )
}
