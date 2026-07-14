'use client'

import {
  AlertTriangle,
  CheckCircle2,
  ChefHat,
  Clock3,
  LoaderCircle,
  PackageCheck,
  RefreshCw,
  Search,
  ShoppingBag,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import OrderItemDetailsModal from '@/components/admin/order-items/OrderItemDetailsModal'
import OrderItemFormModal from '@/components/admin/order-items/OrderItemFormModal'
import OrderItemTable from '@/components/admin/order-items/OrderItemTable'
import {
  getOrderItemStatus,
  getOrderItemTotal,
} from '@/lib/order-item'
import {
  deleteOrderItem,
  getOrderItem,
  getOrderItems,
  restoreOrderItem,
  updateOrderItem,
} from '@/services/order-item.service'
import type {
  OrderItemRecord,
  OrderItemUpdatePayload,
} from '@/types/order-item'

export default function OrderItemsPage() {
  const [orderItems, setOrderItems] =
    useState<OrderItemRecord[]>([])

  const [searchInput, setSearchInput] =
    useState('')
  const [search, setSearch] = useState('')
  const [orderId, setOrderId] =
    useState('')
  const [foodItemId, setFoodItemId] =
    useState('')
  const [status, setStatus] =
    useState('')
  const [dateFrom, setDateFrom] =
    useState('')
  const [dateTo, setDateTo] =
    useState('')
  const [
    includeDeleted,
    setIncludeDeleted,
  ] = useState(false)

  const [isLoading, setIsLoading] =
    useState(true)
  const [isRefreshing, setIsRefreshing] =
    useState(false)
  const [isSubmitting, setIsSubmitting] =
    useState(false)

  const [processingId, setProcessingId] =
    useState<number | string | null>(null)

  const [editingItem, setEditingItem] =
    useState<OrderItemRecord | null>(null)
  const [formOpen, setFormOpen] =
    useState(false)

  const [detailsOpen, setDetailsOpen] =
    useState(false)
  const [detailsItem, setDetailsItem] =
    useState<OrderItemRecord | null>(null)
  const [detailsLoading, setDetailsLoading] =
    useState(false)
  const [detailsError, setDetailsError] =
    useState('')

  const [message, setMessage] =
    useState('')
  const [errorMessage, setErrorMessage] =
    useState('')

  const loadOrderItems = useCallback(
    async (refresh = false) => {
      setErrorMessage('')

      if (refresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      try {
        const result = await getOrderItems({
          search,
          orderId,
          foodItemId,
          status,
          dateFrom,
          dateTo,
          includeDeleted,
          perPage: 200,
        })

        setOrderItems(result.orderItems)
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to load order items.',
        )
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [
      search,
      orderId,
      foodItemId,
      status,
      dateFrom,
      dateTo,
      includeDeleted,
    ],
  )

  useEffect(() => {
    void loadOrderItems()
  }, [loadOrderItems])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim())
    }, 400)

    return () =>
      window.clearTimeout(timer)
  }, [searchInput])

  const activeItems = useMemo(
    () =>
      orderItems.filter(
        (item) => !item.deleted_at,
      ),
    [orderItems],
  )

  const summary = useMemo(() => {
    const pending = activeItems.filter(
      (item) =>
        getOrderItemStatus(item) ===
        'pending',
    ).length

    const preparing = activeItems.filter(
      (item) =>
        getOrderItemStatus(item) ===
        'preparing',
    ).length

    const ready = activeItems.filter(
      (item) =>
        getOrderItemStatus(item) ===
        'ready',
    ).length

    const completed = activeItems.filter(
      (item) =>
        getOrderItemStatus(item) ===
        'completed',
    ).length

    const totalValue = activeItems.reduce(
      (total, item) =>
        total + getOrderItemTotal(item),
      0,
    )

    return {
      pending,
      preparing,
      ready,
      completed,
      totalValue,
    }
  }, [activeItems])

  async function handleView(
    item: OrderItemRecord,
  ) {
    setDetailsOpen(true)
    setDetailsLoading(true)
    setDetailsItem(null)
    setDetailsError('')

    try {
      const result = await getOrderItem(
        item.id,
      )

      setDetailsItem(result)
    } catch (error) {
      setDetailsError(
        error instanceof Error
          ? error.message
          : 'Unable to load order item details.',
      )
    } finally {
      setDetailsLoading(false)
    }
  }

  function handleEdit(
    item: OrderItemRecord,
  ) {
    setEditingItem(item)
    setFormOpen(true)
  }

  async function handleUpdate(
    payload: OrderItemUpdatePayload,
  ) {
    if (!editingItem) {
      return
    }

    setIsSubmitting(true)
    setMessage('')
    setErrorMessage('')

    try {
      const result = await updateOrderItem(
        editingItem.id,
        payload,
      )

      setMessage(result.message)
      setFormOpen(false)
      setEditingItem(null)

      await loadOrderItems(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to update the order item.',
      )

      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(
    item: OrderItemRecord,
  ) {
    const confirmed = window.confirm(
      `Delete order item #${item.id}?\n\nThis removes the item record but may not automatically refund the order.`,
    )

    if (!confirmed) {
      return
    }

    setProcessingId(item.id)
    setMessage('')
    setErrorMessage('')

    try {
      const responseMessage =
        await deleteOrderItem(item.id)

      setMessage(responseMessage)
      await loadOrderItems(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to delete the order item.',
      )
    } finally {
      setProcessingId(null)
    }
  }

  async function handleRestore(
    item: OrderItemRecord,
  ) {
    const confirmed = window.confirm(
      `Restore order item #${item.id}?`,
    )

    if (!confirmed) {
      return
    }

    setProcessingId(item.id)
    setMessage('')
    setErrorMessage('')

    try {
      const responseMessage =
        await restoreOrderItem(item.id)

      setMessage(responseMessage)
      await loadOrderItems(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to restore the order item.',
      )
    } finally {
      setProcessingId(null)
    }
  }

  function clearFilters() {
    setSearchInput('')
    setSearch('')
    setOrderId('')
    setFoodItemId('')
    setStatus('')
    setDateFrom('')
    setDateTo('')
    setIncludeDeleted(false)
  }

  function formatValue(value: number) {
    return `${new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(value)} RWF`
  }

  return (
    <>
      <div className="space-y-6">
        <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-600">
              Canteen Operations
            </p>

            <h1 className="mt-2 text-2xl font-extrabold text-slate-950 sm:text-3xl">
              Order Items
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              View and manage individual food items
              attached to customer orders.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadOrderItems(true)
            }
            disabled={isRefreshing}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          >
            {isRefreshing ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}

            Refresh
          </button>
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

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            title="Total Items"
            value={activeItems.length}
            subtitle={formatValue(
              summary.totalValue,
            )}
            icon={ShoppingBag}
            iconClass="bg-indigo-50 text-indigo-600"
          />

          <SummaryCard
            title="Pending"
            value={summary.pending}
            icon={Clock3}
            iconClass="bg-blue-50 text-blue-600"
          />

          <SummaryCard
            title="Preparing"
            value={summary.preparing}
            icon={ChefHat}
            iconClass="bg-violet-50 text-violet-600"
          />

          <SummaryCard
            title="Ready"
            value={summary.ready}
            icon={PackageCheck}
            iconClass="bg-amber-50 text-amber-600"
          />

          <SummaryCard
            title="Completed"
            value={summary.completed}
            icon={CheckCircle2}
            iconClass="bg-emerald-50 text-emerald-600"
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="space-y-3 border-b border-slate-200 p-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_170px_180px_180px]">
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
                  placeholder="Search food item, order or customer..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                />
              </div>

              <input
                type="text"
                inputMode="numeric"
                value={orderId}
                onChange={(event) =>
                  setOrderId(event.target.value)
                }
                placeholder="Order ID"
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />

              <input
                type="text"
                inputMode="numeric"
                value={foodItemId}
                onChange={(event) =>
                  setFoodItemId(
                    event.target.value,
                  )
                }
                placeholder="Food item ID"
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />

              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value)
                }
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              >
                <option value="">
                  All statuses
                </option>

                <option value="pending">
                  Pending
                </option>

                <option value="preparing">
                  Preparing
                </option>

                <option value="ready">
                  Ready
                </option>

                <option value="completed">
                  Completed
                </option>

                <option value="cancelled">
                  Cancelled
                </option>
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[190px_190px_auto_auto]">
              <input
                type="date"
                value={dateFrom}
                onChange={(event) =>
                  setDateFrom(
                    event.target.value,
                  )
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
                onClick={clearFilters}
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
                  Loading order items...
                </p>
              </div>
            </div>
          ) : orderItems.length === 0 ? (
            <div className="flex min-h-[390px] items-center justify-center px-6 text-center">
              <div>
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600">
                  <ShoppingBag className="h-8 w-8" />
                </span>

                <h2 className="mt-5 text-lg font-extrabold text-slate-900">
                  No order items found
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Order items are created automatically
                  whenever a new order is submitted.
                </p>
              </div>
            </div>
          ) : (
            <OrderItemTable
              orderItems={orderItems}
              processingId={processingId}
              onView={(item) =>
                void handleView(item)
              }
              onEdit={handleEdit}
              onDelete={(item) =>
                void handleDelete(item)
              }
              onRestore={(item) =>
                void handleRestore(item)
              }
            />
          )}
        </section>
      </div>

      <OrderItemFormModal
        isOpen={formOpen}
        orderItem={editingItem}
        isSubmitting={isSubmitting}
        onClose={() => {
          if (!isSubmitting) {
            setFormOpen(false)
            setEditingItem(null)
          }
        }}
        onSubmit={handleUpdate}
      />

      <OrderItemDetailsModal
        isOpen={detailsOpen}
        orderItem={detailsItem}
        isLoading={detailsLoading}
        errorMessage={detailsError}
        onClose={() => {
          setDetailsOpen(false)
          setDetailsItem(null)
          setDetailsError('')
        }}
      />
    </>
  )
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClass,
}: {
  title: string
  value: number
  subtitle?: string
  icon: typeof ShoppingBag
  iconClass: string
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-extrabold text-slate-950">
            {value}
          </p>

          {subtitle && (
            <p className="mt-1 truncate text-xs font-semibold text-slate-400">
              {subtitle}
            </p>
          )}
        </div>

        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </article>
  )
}
