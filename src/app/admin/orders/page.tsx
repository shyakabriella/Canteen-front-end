'use client'

import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ChefHat,
  Clock3,
  Eye,
  LoaderCircle,
  PackageCheck,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShoppingCart,
  Trash2,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import OrderActionModal, {
  type OrderActionType,
} from '@/components/admin/orders/OrderActionModal'
import OrderDetailsModal from '@/components/admin/orders/OrderDetailsModal'
import OrderFormModal from '@/components/admin/orders/OrderFormModal'
import {
  formatOrderAmount,
  getOrderReference,
  getOrderTotal,
  getOrderUserName,
} from '@/lib/order'
import { getFoodItems } from '@/services/food-item.service'
import {
  cancelOrder,
  completeOrder,
  createOrder,
  deleteOrder,
  getOrder,
  getOrders,
  getOrderSummary,
  markOrderPreparing,
  markOrderReady,
  restoreOrder,
  updateOrder,
} from '@/services/order.service'
import { getUsers } from '@/services/user.service'
import type { AppUser } from '@/types/app-user'
import type { FoodItem } from '@/types/food-item'
import type {
  Order,
  OrderActionPayload,
  OrderPayload,
  OrderSummary,
  OrderUpdatePayload,
} from '@/types/order'

const emptySummary: OrderSummary = {
  total_orders: 0,
  pending_orders: 0,
  preparing_orders: 0,
  ready_orders: 0,
  completed_orders: 0,
  cancelled_orders: 0,
  total_sales: 0,
  completed_sales: 0,
  refunded_amount: 0,
}


function getCurrentOrderStatus(
  order: Order,
): string {
  const record = order as Order & {
    order_status?: unknown
    status?: unknown
  }

  return String(
    record.order_status ??
      record.status ??
      '',
  )
    .trim()
    .toLowerCase()
}

function isOrderPlacedStatus(
  status: string,
): boolean {
  return [
    'pending',
    'confirmed',
    'placed',
    'order_placed',
  ].includes(status)
}

function canRunOrderAction(
  order: Order,
  type: OrderActionType,
): {
  allowed: boolean
  message: string
} {
  const status = getCurrentOrderStatus(order)

  if (type === 'preparing') {
    if (isOrderPlacedStatus(status)) {
      return {
        allowed: true,
        message: '',
      }
    }

    return {
      allowed: false,
      message:
        status === 'preparing'
          ? 'This order is already preparing. Use Mark Ready next.'
          : `This order cannot start preparation from status: ${
              status || 'unknown'
            }.`,
    }
  }

  if (type === 'ready') {
    if (status === 'preparing') {
      return {
        allowed: true,
        message: '',
      }
    }

    return {
      allowed: false,
      message:
        status === 'ready'
          ? 'This order is already ready for pickup. Use Complete Pickup next.'
          : `Only preparing orders can be marked ready. Current status: ${
              status || 'unknown'
            }.`,
    }
  }

  if (type === 'complete') {
    if (status === 'ready') {
      return {
        allowed: true,
        message: '',
      }
    }

    return {
      allowed: false,
      message:
        status === 'completed'
          ? 'This order is already completed.'
          : `Only ready orders can be completed. Current status: ${
              status || 'unknown'
            }.`,
    }
  }

  if (
    [
      'completed',
      'cancelled',
      'canceled',
    ].includes(status)
  ) {
    return {
      allowed: false,
      message: `This order cannot be cancelled because it is ${
        status || 'unknown'
      }.`,
    }
  }

  return {
    allowed: true,
    message: '',
  }
}

export default function OrdersPage() {
  const [orders, setOrders] =
    useState<Order[]>([])
  const [users, setUsers] =
    useState<AppUser[]>([])
  const [foodItems, setFoodItems] =
    useState<FoodItem[]>([])
  const [summary, setSummary] =
    useState<OrderSummary>(emptySummary)

  const [searchInput, setSearchInput] =
    useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [paymentStatus, setPaymentStatus] =
    useState('')
  const [userId, setUserId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [includeDeleted, setIncludeDeleted] =
    useState(false)

  const [isLoading, setIsLoading] =
    useState(true)
  const [isRefreshing, setIsRefreshing] =
    useState(false)
  const [
    isLoadingDependencies,
    setIsLoadingDependencies,
  ] = useState(true)
  const [isSubmitting, setIsSubmitting] =
    useState(false)

  const [processingId, setProcessingId] =
    useState<number | string | null>(null)

  const [formOpen, setFormOpen] =
    useState(false)
  const [editingOrder, setEditingOrder] =
    useState<Order | null>(null)

  const [detailsOpen, setDetailsOpen] =
    useState(false)
  const [detailsOrder, setDetailsOrder] =
    useState<Order | null>(null)
  const [detailsLoading, setDetailsLoading] =
    useState(false)
  const [detailsError, setDetailsError] =
    useState('')

  const [actionOpen, setActionOpen] =
    useState(false)
  const [actionType, setActionType] =
    useState<OrderActionType>('preparing')
  const [actionOrder, setActionOrder] =
    useState<Order | null>(null)

  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] =
    useState('')
  const [
    dependencyError,
    setDependencyError,
  ] = useState('')

  const loadDependencies =
    useCallback(async () => {
      setIsLoadingDependencies(true)
      setDependencyError('')

      try {
        const [usersResult, foodsResult] =
          await Promise.all([
            getUsers({ perPage: 200 }),
            getFoodItems({ perPage: 200 }),
          ])

        setUsers(usersResult.users)
        setFoodItems(foodsResult.foodItems)
      } catch (error) {
        setDependencyError(
          error instanceof Error
            ? error.message
            : 'Unable to load users and food items.',
        )
      } finally {
        setIsLoadingDependencies(false)
      }
    }, [])

  const loadOrders = useCallback(
    async (
      refresh = false,
      silent = false,
    ) => {
      if (!silent) {
        setErrorMessage('')
      }

      if (!silent) {
        if (refresh) {
          setIsRefreshing(true)
        } else {
          setIsLoading(true)
        }
      }

      try {
        const filters = {
          search,
          status,
          paymentStatus,
          userId,
          dateFrom,
          dateTo,
          includeDeleted,
          perPage: 200,
        }

        const [listResult, summaryResult] =
          await Promise.all([
            getOrders(filters),
            getOrderSummary(filters),
          ])

        setOrders(
          Array.isArray(listResult.orders)
            ? listResult.orders
            : [],
        )

        setSummary({
          ...emptySummary,
          ...(summaryResult ?? {}),
        })
      } catch (error) {
        if (!silent) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Unable to load orders.',
          )
        }
      } finally {
        if (!silent) {
          setIsLoading(false)
          setIsRefreshing(false)
        }
      }
    },
    [
      search,
      status,
      paymentStatus,
      userId,
      dateFrom,
      dateTo,
      includeDeleted,
    ],
  )

  useEffect(() => {
    void loadDependencies()
  }, [loadDependencies])

  useEffect(() => {
    void loadOrders()
  }, [loadOrders])

  /*
   * Keep this page synchronized with orders created from the mobile app
   * and with status updates made by other staff devices.
   */
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (
        document.visibilityState === 'visible' &&
        !isSubmitting &&
        !actionOpen
      ) {
        void loadOrders(false, true)
      }
    }, 5000)

    return () => {
      window.clearInterval(timer)
    }
  }, [
    actionOpen,
    isSubmitting,
    loadOrders,
  ])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim())
    }, 400)

    return () => window.clearTimeout(timer)
  }, [searchInput])

  function openCreateForm() {
    setEditingOrder(null)
    setFormOpen(true)
  }

  function openEditForm(order: Order) {
    setEditingOrder(order)
    setFormOpen(true)
  }

  async function handleCreate(
    payload: OrderPayload,
  ) {
    setIsSubmitting(true)
    setMessage('')
    setErrorMessage('')

    try {
      const result = await createOrder(payload)

      setMessage(result.message)
      setFormOpen(false)

      await Promise.all([
        loadOrders(true),
        loadDependencies(),
      ])
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to create the order.',
      )

      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleUpdate(
    payload: OrderUpdatePayload,
  ) {
    if (!editingOrder) {
      return
    }

    setIsSubmitting(true)
    setMessage('')
    setErrorMessage('')

    try {
      const result = await updateOrder(
        editingOrder.id,
        payload,
      )

      setMessage(result.message)
      setFormOpen(false)
      setEditingOrder(null)

      await loadOrders(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to update the order.',
      )

      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleView(order: Order) {
    setDetailsOpen(true)
    setDetailsLoading(true)
    setDetailsOrder(null)
    setDetailsError('')

    try {
      setDetailsOrder(
        await getOrder(order.id),
      )
    } catch (error) {
      setDetailsError(
        error instanceof Error
          ? error.message
          : 'Unable to load order details.',
      )
    } finally {
      setDetailsLoading(false)
    }
  }

  function openAction(
    order: Order,
    type: OrderActionType,
  ) {
    const validation =
      canRunOrderAction(order, type)

    if (!validation.allowed) {
      setMessage('')
      setErrorMessage(validation.message)
      return
    }

    setMessage('')
    setErrorMessage('')
    setActionOrder(order)
    setActionType(type)
    setActionOpen(true)
  }

  async function handleAction(
    payload: OrderActionPayload,
  ) {
    if (!actionOrder) {
      return
    }

    setIsSubmitting(true)
    setMessage('')
    setErrorMessage('')

    try {
      /*
       * Fetch the latest order before changing it. This prevents a stale
       * dashboard row from sending "preparing" again after another device
       * already moved the order to the next status.
       */
      const latestOrder = await getOrder(
        actionOrder.id,
      )

      const validation = canRunOrderAction(
        latestOrder,
        actionType,
      )

      if (!validation.allowed) {
        throw new Error(validation.message)
      }

      const result =
        actionType === 'preparing'
          ? await markOrderPreparing(
              latestOrder.id,
              payload,
            )
          : actionType === 'ready'
            ? await markOrderReady(
                latestOrder.id,
                payload,
              )
            : actionType === 'complete'
              ? await completeOrder(
                  latestOrder.id,
                  payload,
                )
              : await cancelOrder(
                  latestOrder.id,
                  payload,
                )

      setMessage(result.message)
      setActionOpen(false)
      setActionOrder(null)

      await Promise.all([
        loadOrders(true),
        loadDependencies(),
      ])
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to process the order.',
      )

      /*
       * Refresh the list after a rejected action because the order may
       * already have been changed by another staff member.
       */
      await loadOrders(false, true)

      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(order: Order) {
    if (
      !window.confirm(
        `Delete ${order.order_number ?? `order #${order.id}`}?`,
      )
    ) {
      return
    }

    setProcessingId(order.id)

    try {
      setMessage(await deleteOrder(order.id))
      await loadOrders(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to delete the order.',
      )
    } finally {
      setProcessingId(null)
    }
  }

  async function handleRestore(order: Order) {
    if (
      !window.confirm(
        `Restore order #${order.id}?`,
      )
    ) {
      return
    }

    setProcessingId(order.id)

    try {
      setMessage(await restoreOrder(order.id))
      await loadOrders(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to restore the order.',
      )
    } finally {
      setProcessingId(null)
    }
  }

  function clearFilters() {
    setSearchInput('')
    setSearch('')
    setStatus('')
    setPaymentStatus('')
    setUserId('')
    setDateFrom('')
    setDateTo('')
    setIncludeDeleted(false)
  }

  function formatAmount(value: number) {
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
              Orders Management
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Create orders and manage preparation,
              pickup, completion and refunds.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                void Promise.all([
                  loadOrders(true),
                  loadDependencies(),
                ])
              }
              disabled={isRefreshing}
              className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 disabled:opacity-50"
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
              onClick={openCreateForm}
              className="flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white"
            >
              <Plus className="h-4 w-4" />
              Create Order
            </button>
          </div>
        </section>

        {message && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {message}
          </div>
        )}

        {errorMessage && (
          <div className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            {errorMessage}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <SummaryCard
            title="Total Orders"
            value={summary.total_orders}
            subtitle={formatAmount(
              summary.total_sales,
            )}
            icon={ShoppingCart}
            className="bg-indigo-50 text-indigo-600"
          />

          <SummaryCard
            title="Order Placed"
            value={summary.pending_orders}
            icon={Clock3}
            className="bg-blue-50 text-blue-600"
          />

          <SummaryCard
            title="Preparing"
            value={summary.preparing_orders}
            icon={ChefHat}
            className="bg-violet-50 text-violet-600"
          />

          <SummaryCard
            title="Ready"
            value={summary.ready_orders}
            icon={PackageCheck}
            className="bg-amber-50 text-amber-600"
          />

          <SummaryCard
            title="Completed"
            value={summary.completed_orders}
            subtitle={formatAmount(
              summary.completed_sales,
            )}
            icon={CheckCircle2}
            className="bg-emerald-50 text-emerald-600"
          />

          <SummaryCard
            title="Cancelled"
            value={summary.cancelled_orders}
            subtitle={formatAmount(
              summary.refunded_amount,
            )}
            icon={Ban}
            className="bg-red-50 text-red-600"
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="space-y-3 border-b border-slate-200 p-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_180px_180px_250px]">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="search"
                  value={searchInput}
                  onChange={(event) =>
                    setSearchInput(
                      event.target.value,
                    )
                  }
                  placeholder="Search order, user or notes..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                />
              </div>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value)
                }
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm"
              >
                <option value="">
                  All statuses
                </option>
                <option value="pending">Order Placed</option>
                <option value="preparing">
                  Preparing
                </option>
                <option value="ready">Ready</option>
                <option value="completed">
                  Completed
                </option>
                <option value="cancelled">
                  Cancelled
                </option>
              </select>

              <select
                value={paymentStatus}
                onChange={(event) =>
                  setPaymentStatus(
                    event.target.value,
                  )
                }
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm"
              >
                <option value="">
                  All payments
                </option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="refunded">
                  Refunded
                </option>
                <option value="failed">Failed</option>
              </select>

              <select
                value={userId}
                onChange={(event) =>
                  setUserId(event.target.value)
                }
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm"
              >
                <option value="">All users</option>

                {users.map((user) => (
                  <option
                    key={user.id}
                    value={String(user.id)}
                  >
                    {user.name}
                    {user.email
                      ? ` — ${user.email}`
                      : ''}
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
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm"
              />

              <input
                type="date"
                value={dateTo}
                onChange={(event) =>
                  setDateTo(event.target.value)
                }
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm"
              />

              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-600">
                <input
                  type="checkbox"
                  checked={includeDeleted}
                  onChange={(event) =>
                    setIncludeDeleted(
                      event.target.checked,
                    )
                  }
                  className="accent-indigo-600"
                />
                Include deleted
              </label>

              <button
                type="button"
                onClick={clearFilters}
                className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex min-h-[390px] items-center justify-center">
              <LoaderCircle className="h-9 w-9 animate-spin text-indigo-600" />
            </div>
          ) : orders.length === 0 ? (
            <div className="flex min-h-[390px] items-center justify-center text-center">
              <div>
                <ShoppingCart className="mx-auto h-10 w-10 text-indigo-300" />

                <h2 className="mt-4 font-extrabold text-slate-900">
                  No orders found
                </h2>

                <button
                  type="button"
                  onClick={openCreateForm}
                  className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white"
                >
                  Create First Order
                </button>
              </div>
            </div>
          ) : (
            <OrderTable
              orders={orders}
              processingId={processingId}
              onView={(order) =>
                void handleView(order)
              }
              onEdit={openEditForm}
              onDelete={(order) =>
                void handleDelete(order)
              }
              onRestore={(order) =>
                void handleRestore(order)
              }
              onPreparing={(order) =>
                openAction(order, 'preparing')
              }
              onReady={(order) =>
                openAction(order, 'ready')
              }
              onComplete={(order) =>
                openAction(order, 'complete')
              }
              onCancel={(order) =>
                openAction(order, 'cancel')
              }
            />
          )}
        </section>
      </div>

      <OrderFormModal
        isOpen={formOpen}
        order={editingOrder}
        users={users}
        foodItems={foodItems}
        isLoadingDependencies={
          isLoadingDependencies
        }
        dependencyError={dependencyError}
        isSubmitting={isSubmitting}
        onRefreshDependencies={
          loadDependencies
        }
        onClose={() => {
          if (!isSubmitting) {
            setFormOpen(false)
            setEditingOrder(null)
          }
        }}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />

      <OrderActionModal
        isOpen={actionOpen}
        type={actionType}
        order={actionOrder}
        isSubmitting={isSubmitting}
        onClose={() => {
          if (!isSubmitting) {
            setActionOpen(false)
            setActionOrder(null)
          }
        }}
        onSubmit={handleAction}
      />

      <OrderDetailsModal
        isOpen={detailsOpen}
        order={detailsOrder}
        isLoading={detailsLoading}
        errorMessage={detailsError}
        onClose={() => {
          setDetailsOpen(false)
          setDetailsOrder(null)
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
  className,
}: {
  title: string
  value: number
  subtitle?: string
  icon: typeof ShoppingCart
  className: string
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-extrabold text-slate-950">
            {value}
          </p>

          {subtitle && (
            <p className="mt-1 truncate text-xs text-slate-400">
              {subtitle}
            </p>
          )}
        </div>

        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${className}`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </article>
  )
}

interface OrderTableProps {
  orders: Order[]
  processingId: number | string | null
  onView: (order: Order) => void
  onEdit: (order: Order) => void
  onDelete: (order: Order) => void
  onRestore: (order: Order) => void
  onPreparing: (order: Order) => void
  onReady: (order: Order) => void
  onComplete: (order: Order) => void
  onCancel: (order: Order) => void
}

type OrderRecord = Order & {
  order_status?: unknown
  status?: unknown
  payment_status?: unknown
  pickup_status?: unknown
  ordered_at?: unknown
  created_at?: unknown
  deleted_at?: unknown
  order_items?: unknown[]
  orderItems?: unknown[]
  user?: {
    email?: unknown
  } | null
}

function stringValue(
  ...values: unknown[]
): string {
  for (const value of values) {
    if (
      value !== undefined &&
      value !== null &&
      String(value).trim()
    ) {
      return String(value).trim()
    }
  }

  return ''
}

function getStatus(order: Order): string {
  const record = order as OrderRecord

  return stringValue(
    record.order_status,
    record.status,
  ).toLowerCase()
}

function isOrderPlaced(status: string): boolean {
  return [
    'pending',
    'confirmed',
    'placed',
    'order_placed',
  ].includes(status)
}

function statusLabel(status: string): string {
  if (isOrderPlaced(status)) {
    return 'Order Placed'
  }

  if (status === 'preparing') {
    return 'Preparing'
  }

  if (status === 'ready') {
    return 'Ready for Pickup'
  }

  if (status === 'completed') {
    return 'Completed'
  }

  if (
    status === 'cancelled' ||
    status === 'canceled'
  ) {
    return 'Cancelled'
  }

  return status
    ? status
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (letter) =>
          letter.toUpperCase(),
        )
    : 'Unknown'
}

function statusClassName(
  status: string,
): string {
  if (isOrderPlaced(status)) {
    return 'border-blue-200 bg-blue-50 text-blue-700'
  }

  if (status === 'preparing') {
    return 'border-violet-200 bg-violet-50 text-violet-700'
  }

  if (status === 'ready') {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }

  if (status === 'completed') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }

  if (
    status === 'cancelled' ||
    status === 'canceled'
  ) {
    return 'border-red-200 bg-red-50 text-red-700'
  }

  return 'border-slate-200 bg-slate-50 text-slate-700'
}

function paymentClassName(
  status: string,
): string {
  if (status === 'paid') {
    return 'bg-emerald-50 text-emerald-700'
  }

  if (status === 'refunded') {
    return 'bg-violet-50 text-violet-700'
  }

  if (status === 'failed') {
    return 'bg-red-50 text-red-700'
  }

  return 'bg-amber-50 text-amber-700'
}

function itemCount(order: Order): number {
  const record = order as OrderRecord

  const items = Array.isArray(
    record.order_items,
  )
    ? record.order_items
    : Array.isArray(record.orderItems)
      ? record.orderItems
      : []

  return items.length
}

function isDeleted(order: Order): boolean {
  return Boolean(
    (order as OrderRecord).deleted_at,
  )
}

function canCancel(status: string): boolean {
  return ![
    'completed',
    'cancelled',
    'canceled',
  ].includes(status)
}

function formatDate(value: unknown): string {
  const raw = stringValue(value)

  if (!raw) {
    return 'Not available'
  }

  const date = new Date(raw)

  if (Number.isNaN(date.getTime())) {
    return raw
  }

  return new Intl.DateTimeFormat(
    'en-US',
    {
      dateStyle: 'medium',
      timeStyle: 'short',
    },
  ).format(date)
}

function OrderTable({
  orders = [],
  processingId,
  onView,
  onEdit,
  onDelete,
  onRestore,
  onPreparing,
  onReady,
  onComplete,
  onCancel,
}: OrderTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1180px]">
        <thead className="bg-slate-50">
          <tr className="border-b border-slate-200">
            <HeaderCell>Order</HeaderCell>
            <HeaderCell>Customer</HeaderCell>
            <HeaderCell>Amount</HeaderCell>
            <HeaderCell>Payment</HeaderCell>
            <HeaderCell>Current Status</HeaderCell>
            <HeaderCell>Ordered At</HeaderCell>
            <HeaderCell>Change Status</HeaderCell>
            <HeaderCell>Manage</HeaderCell>
          </tr>
        </thead>

        <tbody>
          {orders.map((order) => {
            const record =
              order as OrderRecord

            const status = getStatus(order)

            const paymentStatus =
              stringValue(
                record.payment_status,
              ).toLowerCase()

            const deleted = isDeleted(order)

            const busy =
              processingId === order.id

            return (
              <tr
                key={String(order.id)}
                className={`border-b border-slate-100 align-top ${
                  deleted
                    ? 'bg-red-50/40 opacity-75'
                    : 'bg-white hover:bg-slate-50/70'
                }`}
              >
                <TableCell>
                  <button
                    type="button"
                    onClick={() => onView(order)}
                    className="text-left"
                  >
                    <p className="font-extrabold text-indigo-700 hover:underline">
                      {getOrderReference(order)}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {itemCount(order)} item
                      {itemCount(order) === 1
                        ? ''
                        : 's'}
                    </p>
                  </button>
                </TableCell>

                <TableCell>
                  <p className="font-bold text-slate-900">
                    {getOrderUserName(order)}
                  </p>

                  <p className="mt-1 max-w-[210px] truncate text-xs text-slate-400">
                    {stringValue(
                      record.user?.email,
                    ) || 'No email'}
                  </p>
                </TableCell>

                <TableCell>
                  <p className="font-extrabold text-slate-900">
                    {formatOrderAmount(
                      getOrderTotal(order),
                    )}
                  </p>
                </TableCell>

                <TableCell>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold capitalize ${paymentClassName(
                      paymentStatus,
                    )}`}
                  >
                    {paymentStatus ||
                      'unknown'}
                  </span>
                </TableCell>

                <TableCell>
                  <span
                    className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-extrabold ${statusClassName(
                      status,
                    )}`}
                  >
                    {statusLabel(status)}
                  </span>

                  {stringValue(
                    record.pickup_status,
                  ) && (
                    <p className="mt-2 text-xs font-semibold capitalize text-slate-400">
                      Pickup:{' '}
                      {stringValue(
                        record.pickup_status,
                      ).replaceAll('_', ' ')}
                    </p>
                  )}
                </TableCell>

                <TableCell>
                  <p className="text-sm font-semibold text-slate-600">
                    {formatDate(
                      record.ordered_at ??
                        record.created_at,
                    )}
                  </p>
                </TableCell>

                <TableCell>
                  {deleted ? (
                    <button
                      type="button"
                      onClick={() =>
                        onRestore(order)
                      }
                      disabled={busy}
                      className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-extrabold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {busy ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}

                      Restore
                    </button>
                  ) : isOrderPlaced(status) ? (
                    <StatusActionButton
                      icon={ChefHat}
                      label="Start Preparing"
                      className="bg-indigo-600 hover:bg-indigo-700"
                      onClick={() =>
                        onPreparing(order)
                      }
                    />
                  ) : status === 'preparing' ? (
                    <StatusActionButton
                      icon={PackageCheck}
                      label="Mark Ready"
                      className="bg-amber-600 hover:bg-amber-700"
                      onClick={() =>
                        onReady(order)
                      }
                    />
                  ) : status === 'ready' ? (
                    <StatusActionButton
                      icon={CheckCircle2}
                      label="Complete Pickup"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() =>
                        onComplete(order)
                      }
                    />
                  ) : status ===
                    'completed' ? (
                    <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-extrabold text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                      Finished
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-extrabold text-red-700">
                      <Ban className="h-4 w-4" />
                      Cancelled
                    </span>
                  )}
                </TableCell>

                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <IconButton
                      title="View order"
                      onClick={() =>
                        onView(order)
                      }
                    >
                      <Eye className="h-4 w-4" />
                    </IconButton>

                    {!deleted &&
                      ![
                        'completed',
                        'cancelled',
                        'canceled',
                      ].includes(status) && (
                        <IconButton
                          title="Edit order notes"
                          onClick={() =>
                            onEdit(order)
                          }
                        >
                          <Pencil className="h-4 w-4" />
                        </IconButton>
                      )}

                    {!deleted &&
                      canCancel(status) && (
                        <IconButton
                          title="Cancel order"
                          danger
                          onClick={() =>
                            onCancel(order)
                          }
                        >
                          <Ban className="h-4 w-4" />
                        </IconButton>
                      )}

                    {!deleted &&
                      [
                        'cancelled',
                        'canceled',
                      ].includes(status) && (
                        <IconButton
                          title="Delete cancelled order"
                          danger
                          disabled={busy}
                          onClick={() =>
                            onDelete(order)
                          }
                        >
                          {busy ? (
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </IconButton>
                      )}
                  </div>
                </TableCell>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function HeaderCell({
  children,
}: {
  children: ReactNode
}) {
  return (
    <th className="px-5 py-4 text-left text-xs font-extrabold uppercase tracking-wider text-slate-500">
      {children}
    </th>
  )
}

function TableCell({
  children,
}: {
  children: ReactNode
}) {
  return (
    <td className="px-5 py-5">
      {children}
    </td>
  )
}

function StatusActionButton({
  icon: Icon,
  label,
  className,
  onClick,
}: {
  icon: typeof ChefHat
  label: string
  className: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-extrabold text-white transition ${className}`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  )
}

function IconButton({
  title,
  children,
  onClick,
  danger = false,
  disabled = false,
}: {
  title: string
  children: ReactNode
  onClick: () => void
  danger?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-9 w-9 items-center justify-center rounded-lg border transition disabled:opacity-50 ${
        danger
          ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  )
}