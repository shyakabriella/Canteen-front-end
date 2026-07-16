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
  Mail,
  MapPin,
  Phone,
  Send,
  Truck,
  UserRound,
  X,
  type LucideIcon,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useState,
  useMemo,
  type FormEvent,
  type ReactNode,
} from 'react'
import OrderActionModal, {
  type OrderActionType,
} from '@/components/admin/orders/OrderActionModal'
import OrderDetailsModal from '@/components/admin/orders/OrderDetailsModal'
import OrderFormModal from '@/components/admin/orders/OrderFormModal'
import { API_BASE_URL } from '@/lib/api'
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
              Manage wallet pickup orders and guest
              pay-on-delivery orders from one screen.
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

        <GuestOrdersPanel />

        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-indigo-600">
            Mobile and Dashboard Orders
          </p>

          <h2 className="mt-1 text-xl font-extrabold text-slate-950">
            Wallet / Pickup Orders
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Registered users pay from Smart Wallet and collect their order using the pickup QR code.
          </p>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <SummaryCard
            title="Total Wallet Orders"
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
                  placeholder="Search wallet order, user or notes..."
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
                  No wallet orders found
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

/* -------------------------------------------------------------------------- */
/*                 Guest delivery orders: single-file support                  */
/* -------------------------------------------------------------------------- */

type GuestOrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled'
  | 'canceled'
  | string

interface GuestOrderItem {
  id: number | string
  guest_order_id?: number | string
  food_item_id?: number | string
  food_name?: string | null
  food_sku?: string | null
  unit?: string | null
  quantity?: number | string
  unit_price?: number | string
  subtotal_amount?: number | string
  total_amount?: number | string
  notes?: string | null
  food_item?: {
    id?: number | string
    name?: string | null
    sku?: string | null
    unit?: string | null
  } | null
}

interface GuestOrder {
  id: number | string
  order_number?: string | null
  public_token?: string | null
  customer_name?: string | null
  customer_email?: string | null
  customer_phone?: string | null
  delivery_location?: string | null
  preferred_delivery_time?: string | null
  subtotal_amount?: number | string
  discount_amount?: number | string
  tax_amount?: number | string
  total_amount?: number | string
  paid_amount?: number | string
  amount_due?: number | string
  payment_method?: string | null
  payment_status?: string | null
  order_status?: GuestOrderStatus | null
  delivery_status?: string | null
  customer_notes?: string | null
  staff_notes?: string | null
  cancellation_reason?: string | null
  confirmed_at?: string | null
  ready_at?: string | null
  completed_at?: string | null
  cancelled_at?: string | null
  created_at?: string | null
  updated_at?: string | null
  items?: GuestOrderItem[]
  guest_order_items?: GuestOrderItem[]
  guestOrderItems?: GuestOrderItem[]
}

interface GuestOrderActionPayload {
  notes?: string
  cancellation_reason?: string
}

interface GuestOrderActionResult {
  order: GuestOrder
  message: string
}

type JsonRecord = Record<string, unknown>

function asRecord(value: unknown): JsonRecord | null {
  if (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  ) {
    return value as JsonRecord
  }

  return null
}

function getStoredToken(): string {
  if (typeof window === 'undefined') {
    return ''
  }

  return (
    window.localStorage.getItem('token') ||
    window.localStorage.getItem('auth_token') ||
    window.localStorage.getItem('authToken') ||
    window.localStorage.getItem('access_token') ||
    window.sessionStorage.getItem('token') ||
    window.sessionStorage.getItem('auth_token') ||
    ''
  )
}

function firstErrorMessage(payload: unknown): string {
  const root = asRecord(payload)

  if (!root) {
    return ''
  }

  const errors = asRecord(root.errors)
  const data = asRecord(root.data)

  for (const source of [errors, data]) {
    if (!source) {
      continue
    }

    for (const value of Object.values(source)) {
      if (Array.isArray(value) && value.length > 0) {
        return String(value[0])
      }

      if (typeof value === 'string' && value.trim()) {
        return value.trim()
      }
    }
  }

  if (
    typeof root.message === 'string' &&
    root.message.trim()
  ) {
    return root.message.trim()
  }

  if (
    typeof root.error === 'string' &&
    root.error.trim()
  ) {
    return root.error.trim()
  }

  return ''
}

function unwrapData(payload: unknown): unknown {
  const root = asRecord(payload)

  if (
    root &&
    Object.prototype.hasOwnProperty.call(root, 'data')
  ) {
    return root.data
  }

  return payload
}

function normalizeGuestOrder(payload: unknown): GuestOrder {
  const source = asRecord(unwrapData(payload))

  if (!source) {
    throw new Error('The guest-order API returned invalid data.')
  }

  const id = source.id

  if (
    typeof id !== 'number' &&
    typeof id !== 'string'
  ) {
    throw new Error('The guest-order API did not return an order ID.')
  }

  return source as unknown as GuestOrder
}

async function guestOrderRequest(
  path: string,
  options: RequestInit = {},
): Promise<unknown> {
  const token = getStoredToken()

  if (!token) {
    throw new Error(
      'Login token not found. Please login again.',
    )
  }

  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      ...options,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.body
          ? {
              'Content-Type':
                'application/json',
            }
          : {}),
        ...(options.headers ?? {}),
      },
      cache: 'no-store',
    },
  )

  const text = await response.text()
  let payload: unknown = null

  if (text.trim()) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = text
    }
  }

  if (!response.ok) {
    throw new Error(
      firstErrorMessage(payload) ||
        `Guest-order request failed. HTTP ${response.status}.`,
    )
  }

  return payload
}

function actionMessage(
  payload: unknown,
  fallback: string,
): string {
  const root = asRecord(payload)

  return typeof root?.message === 'string' &&
    root.message.trim()
    ? root.message.trim()
    : fallback
}

function actionBody(
  payload: GuestOrderActionPayload = {},
): string {
  return JSON.stringify({
    notes: payload.notes?.trim() || null,
    staff_notes:
      payload.notes?.trim() || null,
    cancellation_reason:
      payload.cancellation_reason?.trim() ||
      null,
  })
}

function extractList(payload: unknown): GuestOrder[] {
  const first = unwrapData(payload)

  if (Array.isArray(first)) {
    return first as GuestOrder[]
  }

  const paginator = asRecord(first)

  if (Array.isArray(paginator?.data)) {
    return paginator.data as GuestOrder[]
  }

  const nested = asRecord(paginator?.data)

  if (Array.isArray(nested?.data)) {
    return nested.data as GuestOrder[]
  }

  return []
}

async function getGuestOrders(
  perPage = 200,
): Promise<GuestOrder[]> {
  const safePerPage = Math.min(
    Math.max(Math.trunc(perPage), 1),
    200,
  )

  const payload = await guestOrderRequest(
    `/guest-orders?per_page=${safePerPage}`,
    {
      method: 'GET',
    },
  )

  return extractList(payload)
}

async function getGuestOrder(
  id: number | string,
): Promise<GuestOrder> {
  const payload = await guestOrderRequest(
    `/guest-orders/${encodeURIComponent(String(id))}`,
    {
      method: 'GET',
    },
  )

  return normalizeGuestOrder(payload)
}

async function runGuestOrderAction(
  id: number | string,
  suffix: string,
  payload: GuestOrderActionPayload,
  fallback: string,
): Promise<GuestOrderActionResult> {
  const response = await guestOrderRequest(
    `/guest-orders/${encodeURIComponent(String(id))}/${suffix}`,
    {
      method: 'POST',
      body: actionBody(payload),
    },
  )

  return {
    order: normalizeGuestOrder(response),
    message: actionMessage(response, fallback),
  }
}

function confirmGuestOrder(
  id: number | string,
  payload: GuestOrderActionPayload = {},
): Promise<GuestOrderActionResult> {
  return runGuestOrderAction(
    id,
    'confirm',
    payload,
    'Guest delivery order confirmed successfully.',
  )
}

function markGuestOrderPreparing(
  id: number | string,
  payload: GuestOrderActionPayload = {},
): Promise<GuestOrderActionResult> {
  return runGuestOrderAction(
    id,
    'preparing',
    payload,
    'Guest delivery order marked as preparing.',
  )
}

function markGuestOrderReady(
  id: number | string,
  payload: GuestOrderActionPayload = {},
): Promise<GuestOrderActionResult> {
  return runGuestOrderAction(
    id,
    'ready',
    payload,
    'Guest delivery order marked as ready.',
  )
}

function completeGuestOrderDelivery(
  id: number | string,
  payload: GuestOrderActionPayload = {},
): Promise<GuestOrderActionResult> {
  return runGuestOrderAction(
    id,
    'complete-delivery',
    payload,
    'Guest delivery completed successfully.',
  )
}

function cancelGuestOrder(
  id: number | string,
  payload: GuestOrderActionPayload = {},
): Promise<GuestOrderActionResult> {
  return runGuestOrderAction(
    id,
    'cancel',
    payload,
    'Guest delivery order cancelled successfully.',
  )
}

type GuestActionType =
  | 'confirm'
  | 'preparing'
  | 'ready'
  | 'complete'
  | 'cancel'

function guestStringValue(
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

function guestNumberValue(
  ...values: unknown[]
): number {
  for (const value of values) {
    const parsed = Number(value)

    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return 0
}

function guestOrderStatus(
  order: GuestOrder,
): string {
  return guestStringValue(
    order.order_status,
  ).toLowerCase()
}

function guestPaymentStatus(
  order: GuestOrder,
): string {
  return guestStringValue(
    order.payment_status,
  ).toLowerCase()
}

function guestDeliveryStatus(
  order: GuestOrder,
): string {
  return guestStringValue(
    order.delivery_status,
  ).toLowerCase()
}

function guestIsFinishedStatus(
  status: string,
): boolean {
  return [
    'completed',
    'delivered',
  ].includes(status)
}

function guestIsCancelledStatus(
  status: string,
): boolean {
  return [
    'cancelled',
    'canceled',
  ].includes(status)
}

function guestStatusLabel(
  status: string,
): string {
  if (status === 'pending') {
    return 'Awaiting Confirmation'
  }

  if (status === 'confirmed') {
    return 'Confirmed'
  }

  if (status === 'preparing') {
    return 'Preparing'
  }

  if (status === 'ready') {
    return 'Ready for Delivery'
  }

  if (guestIsFinishedStatus(status)) {
    return 'Delivered'
  }

  if (guestIsCancelledStatus(status)) {
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

function guestStatusClasses(
  status: string,
): string {
  if (status === 'pending') {
    return 'border-blue-200 bg-blue-50 text-blue-700'
  }

  if (status === 'confirmed') {
    return 'border-cyan-200 bg-cyan-50 text-cyan-700'
  }

  if (status === 'preparing') {
    return 'border-violet-200 bg-violet-50 text-violet-700'
  }

  if (status === 'ready') {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }

  if (guestIsFinishedStatus(status)) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }

  if (guestIsCancelledStatus(status)) {
    return 'border-red-200 bg-red-50 text-red-700'
  }

  return 'border-slate-200 bg-slate-50 text-slate-700'
}

function guestPaymentLabel(
  status: string,
): string {
  if (status === 'paid') {
    return 'Paid on Delivery'
  }

  if (status === 'refunded') {
    return 'Refunded'
  }

  if (status === 'failed') {
    return 'Failed'
  }

  return 'Due on Delivery'
}

function guestPaymentClasses(
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

function guestDeliveryLabel(
  status: string,
): string {
  if (!status || status === 'pending') {
    return 'Delivery Pending'
  }

  if (status === 'ready') {
    return 'Ready to Dispatch'
  }

  if (
    status === 'in_transit' ||
    status === 'out_for_delivery'
  ) {
    return 'Out for Delivery'
  }

  if (
    status === 'delivered' ||
    status === 'completed'
  ) {
    return 'Delivered'
  }

  if (guestIsCancelledStatus(status)) {
    return 'Delivery Cancelled'
  }

  return status
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    )
}

function guestFormatMoney(
  ...values: unknown[]
): string {
  return `${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(guestNumberValue(...values))} RWF`
}

function guestFormatDate(
  value: unknown,
): string {
  const raw = guestStringValue(value)

  if (!raw) {
    return 'Not available'
  }

  const date = new Date(raw)

  if (Number.isNaN(date.getTime())) {
    return raw
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function guestFormatPreferredTime(
  value: unknown,
): string {
  const raw = guestStringValue(value)

  if (!raw) {
    return 'Not specified'
  }

  if (/^\d{2}:\d{2}(:\d{2})?$/.test(raw)) {
    return raw.slice(0, 5)
  }

  return guestFormatDate(raw)
}

function guestOrderItems(
  order: GuestOrder,
): GuestOrderItem[] {
  if (Array.isArray(order.items)) {
    return order.items
  }

  if (
    Array.isArray(
      order.guest_order_items,
    )
  ) {
    return order.guest_order_items
  }

  if (
    Array.isArray(
      order.guestOrderItems,
    )
  ) {
    return order.guestOrderItems
  }

  return []
}

function guestItemName(
  item: GuestOrderItem,
): string {
  return (
    guestStringValue(
      item.food_name,
      item.food_item?.name,
    ) || `Food item #${item.food_item_id ?? item.id}`
  )
}

function guestActionValidation(
  order: GuestOrder,
  type: GuestActionType,
): {
  allowed: boolean
  message: string
} {
  const status = guestOrderStatus(order)

  if (type === 'confirm') {
    return status === 'pending'
      ? { allowed: true, message: '' }
      : {
          allowed: false,
          message:
            status === 'confirmed'
              ? 'This delivery order is already confirmed. Start preparation next.'
              : `Only pending guest orders can be confirmed. Current status: ${
                  status || 'unknown'
                }.`,
        }
  }

  if (type === 'preparing') {
    return status === 'confirmed'
      ? { allowed: true, message: '' }
      : {
          allowed: false,
          message:
            status === 'pending'
              ? 'Confirm this guest order before starting preparation.'
              : status === 'preparing'
                ? 'This guest order is already preparing. Mark it ready next.'
                : `Only confirmed guest orders can start preparation. Current status: ${
                    status || 'unknown'
                  }.`,
        }
  }

  if (type === 'ready') {
    return status === 'preparing'
      ? { allowed: true, message: '' }
      : {
          allowed: false,
          message:
            status === 'ready'
              ? 'This guest order is already ready. Complete delivery next.'
              : `Only preparing guest orders can be marked ready. Current status: ${
                  status || 'unknown'
                }.`,
        }
  }

  if (type === 'complete') {
    return status === 'ready'
      ? { allowed: true, message: '' }
      : {
          allowed: false,
          message:
            guestIsFinishedStatus(status)
              ? 'This guest delivery is already completed.'
              : `Only ready guest orders can complete delivery. Current status: ${
                  status || 'unknown'
                }.`,
        }
  }

  if (
    guestIsFinishedStatus(status) ||
    guestIsCancelledStatus(status)
  ) {
    return {
      allowed: false,
      message: `This guest order cannot be cancelled because it is ${guestStatusLabel(
        status,
      ).toLowerCase()}.`,
    }
  }

  return { allowed: true, message: '' }
}

function guestNextAction(
  order: GuestOrder,
): GuestActionType | null {
  const status = guestOrderStatus(order)

  if (status === 'pending') {
    return 'confirm'
  }

  if (status === 'confirmed') {
    return 'preparing'
  }

  if (status === 'preparing') {
    return 'ready'
  }

  if (status === 'ready') {
    return 'complete'
  }

  return null
}

function guestActionLabel(
  type: GuestActionType,
): string {
  if (type === 'confirm') {
    return 'Confirm Order'
  }

  if (type === 'preparing') {
    return 'Start Preparing'
  }

  if (type === 'ready') {
    return 'Mark Ready'
  }

  if (type === 'complete') {
    return 'Complete Delivery'
  }

  return 'Cancel Order'
}

function guestActionDescription(
  type: GuestActionType,
): string {
  if (type === 'confirm') {
    return 'Confirm that the canteen accepted this guest delivery order.'
  }

  if (type === 'preparing') {
    return 'Move this confirmed guest order into kitchen preparation.'
  }

  if (type === 'ready') {
    return 'Mark the food as ready for delivery handling.'
  }

  if (type === 'complete') {
    return 'Mark the order delivered and record pay-on-delivery completion.'
  }

  return 'Cancel the order. Add a clear cancellation reason for the customer and staff record.'
}

function guestActionIcon(
  type: GuestActionType,
): LucideIcon {
  if (type === 'confirm') {
    return CheckCircle2
  }

  if (type === 'preparing') {
    return ChefHat
  }

  if (type === 'ready') {
    return PackageCheck
  }

  if (type === 'complete') {
    return Truck
  }

  return Ban
}

function guestActionButtonClasses(
  type: GuestActionType,
): string {
  if (type === 'confirm') {
    return 'bg-cyan-600 hover:bg-cyan-700'
  }

  if (type === 'preparing') {
    return 'bg-violet-600 hover:bg-violet-700'
  }

  if (type === 'ready') {
    return 'bg-amber-500 hover:bg-amber-600'
  }

  if (type === 'complete') {
    return 'bg-emerald-600 hover:bg-emerald-700'
  }

  return 'bg-red-600 hover:bg-red-700'
}

function GuestOrdersPanel() {
  const [orders, setOrders] =
    useState<GuestOrder[]>([])
  const [loading, setLoading] =
    useState(true)
  const [refreshing, setRefreshing] =
    useState(false)
  const [submitting, setSubmitting] =
    useState(false)
  const [message, setMessage] =
    useState('')
  const [errorMessage, setErrorMessage] =
    useState('')

  const [searchInput, setSearchInput] =
    useState('')
  const [search, setSearch] =
    useState('')
  const [status, setStatus] =
    useState('')
  const [payment, setPayment] =
    useState('')
  const [dateFrom, setDateFrom] =
    useState('')
  const [dateTo, setDateTo] =
    useState('')

  const [detailsOpen, setDetailsOpen] =
    useState(false)
  const [detailsLoading, setDetailsLoading] =
    useState(false)
  const [detailsError, setDetailsError] =
    useState('')
  const [detailsOrder, setDetailsOrder] =
    useState<GuestOrder | null>(null)

  const [actionOpen, setActionOpen] =
    useState(false)
  const [actionType, setActionType] =
    useState<GuestActionType>('confirm')
  const [actionOrder, setActionOrder] =
    useState<GuestOrder | null>(null)

  const loadOrders = useCallback(
    async (
      refresh = false,
      silent = false,
    ) => {
      if (!silent) {
        setErrorMessage('')

        if (refresh) {
          setRefreshing(true)
        } else {
          setLoading(true)
        }
      }

      try {
        const result = await getGuestOrders(200)
        setOrders(
          Array.isArray(result)
            ? result
            : [],
        )
      } catch (error) {
        if (!silent) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Unable to load guest delivery orders.',
          )
        }
      } finally {
        if (!silent) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    },
    [],
  )

  useEffect(() => {
    void loadOrders()
  }, [loadOrders])

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (
        document.visibilityState ===
          'visible' &&
        !submitting &&
        !actionOpen &&
        !detailsOpen
      ) {
        void loadOrders(false, true)
      }
    }, 5000)

    return () => {
      window.clearInterval(timer)
    }
  }, [
    actionOpen,
    detailsOpen,
    loadOrders,
    submitting,
  ])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim())
    }, 350)

    return () => {
      window.clearTimeout(timer)
    }
  }, [searchInput])

  const summary = useMemo(() => {
    const totalValue = orders
      .filter(
        (order) =>
          !guestIsCancelledStatus(
            guestOrderStatus(order),
          ),
      )
      .reduce(
        (sum, order) =>
          sum +
          guestNumberValue(order.total_amount),
        0,
      )

    return {
      total: orders.length,
      awaiting: orders.filter(
        (order) =>
          guestOrderStatus(order) ===
          'pending',
      ).length,
      active: orders.filter((order) =>
        [
          'confirmed',
          'preparing',
          'ready',
        ].includes(guestOrderStatus(order)),
      ).length,
      delivered: orders.filter((order) =>
        guestIsFinishedStatus(
          guestOrderStatus(order),
        ),
      ).length,
      cancelled: orders.filter((order) =>
        guestIsCancelledStatus(
          guestOrderStatus(order),
        ),
      ).length,
      totalValue,
    }
  }, [orders])

  const filteredOrders = useMemo(() => {
    const term = search.toLowerCase()

    return orders.filter((order) => {
      const currentStatus =
        guestOrderStatus(order)
      const currentPayment =
        guestPaymentStatus(order)

      if (
        status &&
        currentStatus !== status
      ) {
        return false
      }

      if (
        payment &&
        currentPayment !== payment
      ) {
        return false
      }

      const rawDate = guestStringValue(
        order.created_at,
      )
      const createdDate = rawDate
        ? new Date(rawDate)
        : null

      if (
        dateFrom &&
        createdDate &&
        !Number.isNaN(
          createdDate.getTime(),
        )
      ) {
        const from = new Date(
          `${dateFrom}T00:00:00`,
        )

        if (createdDate < from) {
          return false
        }
      }

      if (
        dateTo &&
        createdDate &&
        !Number.isNaN(
          createdDate.getTime(),
        )
      ) {
        const to = new Date(
          `${dateTo}T23:59:59.999`,
        )

        if (createdDate > to) {
          return false
        }
      }

      if (!term) {
        return true
      }

      return [
        order.order_number,
        order.customer_name,
        order.customer_email,
        order.customer_phone,
        order.delivery_location,
        order.customer_notes,
        order.staff_notes,
      ].some((value) =>
        guestStringValue(value)
          .toLowerCase()
          .includes(term),
      )
    })
  }, [
    dateFrom,
    dateTo,
    orders,
    payment,
    search,
    status,
  ])

  async function openDetails(
    order: GuestOrder,
  ) {
    setDetailsOpen(true)
    setDetailsLoading(true)
    setDetailsError('')
    setDetailsOrder(null)

    try {
      setDetailsOrder(
        await getGuestOrder(order.id),
      )
    } catch (error) {
      setDetailsError(
        error instanceof Error
          ? error.message
          : 'Unable to load guest-order details.',
      )
    } finally {
      setDetailsLoading(false)
    }
  }

  function openAction(
    order: GuestOrder,
    type: GuestActionType,
  ) {
    const validation =
      guestActionValidation(order, type)

    if (!validation.allowed) {
      setMessage('')
      setErrorMessage(
        validation.message,
      )
      return
    }

    setMessage('')
    setErrorMessage('')
    setActionOrder(order)
    setActionType(type)
    setActionOpen(true)
  }

  async function handleAction(
    payload: GuestOrderActionPayload,
  ) {
    if (!actionOrder) {
      return
    }

    setSubmitting(true)
    setMessage('')
    setErrorMessage('')

    try {
      const latest = await getGuestOrder(
        actionOrder.id,
      )

      const validation =
        guestActionValidation(
          latest,
          actionType,
        )

      if (!validation.allowed) {
        throw new Error(
          validation.message,
        )
      }

      const result =
        actionType === 'confirm'
          ? await confirmGuestOrder(
              latest.id,
              payload,
            )
          : actionType === 'preparing'
            ? await markGuestOrderPreparing(
                latest.id,
                payload,
              )
            : actionType === 'ready'
              ? await markGuestOrderReady(
                  latest.id,
                  payload,
                )
              : actionType === 'complete'
                ? await completeGuestOrderDelivery(
                    latest.id,
                    payload,
                  )
                : await cancelGuestOrder(
                    latest.id,
                    payload,
                  )

      setMessage(result.message)
      setActionOpen(false)
      setActionOrder(null)
      await loadOrders(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to process the guest delivery order.',
      )

      await loadOrders(false, true)
      throw error
    } finally {
      setSubmitting(false)
    }
  }

  function clearFilters() {
    setSearchInput('')
    setSearch('')
    setStatus('')
    setPayment('')
    setDateFrom('')
    setDateTo('')
  }

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-orange-200 bg-white shadow-sm">
        <div className="border-b border-orange-100 bg-gradient-to-r from-orange-50 via-white to-white p-5">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
                  <Truck className="h-5 w-5" />
                </span>

                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-orange-600">
                    Website Orders
                  </p>

                  <h2 className="text-xl font-extrabold text-slate-950">
                    Guest Delivery Orders
                  </h2>
                </div>
              </div>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
                Orders submitted without login. These customers pay when the food is delivered, so they use a separate confirmation and delivery workflow.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void loadOrders(true)
              }
              disabled={refreshing}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-orange-200 bg-white px-4 text-sm font-bold text-orange-700 disabled:opacity-50"
            >
              {refreshing ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh Guest Orders
            </button>
          </div>
        </div>

        <div className="space-y-5 p-5">
          {message && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              {message}
            </div>
          )}

          {errorMessage && (
            <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <GuestSummaryCard
              title="All Guest Orders"
              value={summary.total}
              subtitle={guestFormatMoney(
                summary.totalValue,
              )}
              icon={Truck}
              className="bg-orange-50 text-orange-700"
            />

            <GuestSummaryCard
              title="Awaiting Confirmation"
              value={summary.awaiting}
              icon={Clock3}
              className="bg-blue-50 text-blue-700"
            />

            <GuestSummaryCard
              title="Active"
              value={summary.active}
              icon={ChefHat}
              className="bg-violet-50 text-violet-700"
            />

            <GuestSummaryCard
              title="Delivered"
              value={summary.delivered}
              icon={CheckCircle2}
              className="bg-emerald-50 text-emerald-700"
            />

            <GuestSummaryCard
              title="Cancelled"
              value={summary.cancelled}
              icon={Ban}
              className="bg-red-50 text-red-700"
            />
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_190px_190px]">
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
                  placeholder="Search guest order, customer, phone or location..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-950 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                />
              </div>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value,
                  )
                }
                className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950"
              >
                <option value="">
                  All statuses
                </option>
                <option value="pending">
                  Awaiting Confirmation
                </option>
                <option value="confirmed">
                  Confirmed
                </option>
                <option value="preparing">
                  Preparing
                </option>
                <option value="ready">
                  Ready for Delivery
                </option>
                <option value="completed">
                  Delivered
                </option>
                <option value="cancelled">
                  Cancelled
                </option>
              </select>

              <select
                value={payment}
                onChange={(event) =>
                  setPayment(
                    event.target.value,
                  )
                }
                className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950"
              >
                <option value="">
                  All payments
                </option>
                <option value="pending">
                  Due on Delivery
                </option>
                <option value="paid">
                  Paid on Delivery
                </option>
                <option value="failed">
                  Failed
                </option>
                <option value="refunded">
                  Refunded
                </option>
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[190px_190px_auto]">
              <input
                type="date"
                value={dateFrom}
                onChange={(event) =>
                  setDateFrom(
                    event.target.value,
                  )
                }
                className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950"
              />

              <input
                type="date"
                value={dateTo}
                onChange={(event) =>
                  setDateTo(
                    event.target.value,
                  )
                }
                className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950"
              />

              <button
                type="button"
                onClick={clearFilters}
                className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600"
              >
                Clear Guest Filters
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center border-t border-slate-100">
            <LoaderCircle className="h-9 w-9 animate-spin text-orange-600" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex min-h-[300px] items-center justify-center border-t border-slate-100 text-center">
            <div>
              <Truck className="mx-auto h-11 w-11 text-orange-300" />

              <h3 className="mt-4 font-extrabold text-slate-900">
                No guest delivery orders found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                New website orders will appear here automatically.
              </p>
            </div>
          </div>
        ) : (
          <GuestOrdersTable
            orders={filteredOrders}
            onView={(order) =>
              void openDetails(order)
            }
            onAction={openAction}
          />
        )}
      </section>

      <GuestOrderActionModal
        isOpen={actionOpen}
        order={actionOrder}
        type={actionType}
        isSubmitting={submitting}
        onClose={() => {
          if (!submitting) {
            setActionOpen(false)
            setActionOrder(null)
          }
        }}
        onSubmit={handleAction}
      />

      <GuestOrderDetailsModal
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

function GuestOrdersTable({
  orders,
  onView,
  onAction,
}: {
  orders: GuestOrder[]
  onView: (order: GuestOrder) => void
  onAction: (
    order: GuestOrder,
    type: GuestActionType,
  ) => void
}) {
  return (
    <div className="overflow-x-auto border-t border-slate-100">
      <table className="w-full min-w-[1320px]">
        <thead className="bg-slate-50">
          <tr className="border-b border-slate-200">
            <GuestHeaderCell>Order</GuestHeaderCell>
            <GuestHeaderCell>Customer</GuestHeaderCell>
            <GuestHeaderCell>Delivery</GuestHeaderCell>
            <GuestHeaderCell>Amount</GuestHeaderCell>
            <GuestHeaderCell>Payment</GuestHeaderCell>
            <GuestHeaderCell>Current Status</GuestHeaderCell>
            <GuestHeaderCell>Submitted</GuestHeaderCell>
            <GuestHeaderCell>Next Action</GuestHeaderCell>
            <GuestHeaderCell>Manage</GuestHeaderCell>
          </tr>
        </thead>

        <tbody>
          {orders.map((order) => {
            const status =
              guestOrderStatus(order)
            const payStatus =
              guestPaymentStatus(order)
            const delivery =
              guestDeliveryStatus(order)
            const action =
              guestNextAction(order)

            return (
              <tr
                key={`guest-${order.id}`}
                className="border-b border-slate-100 align-top last:border-b-0 hover:bg-orange-50/30"
              >
                <GuestTableCell>
                  <div className="min-w-[170px]">
                    <p className="font-extrabold text-slate-950">
                      {guestStringValue(
                        order.order_number,
                      ) ||
                        `Guest order #${order.id}`}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-extrabold text-orange-700">
                        Guest Delivery
                      </span>

                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                        {guestOrderItems(order).length}{' '}
                        item(s)
                      </span>
                    </div>
                  </div>
                </GuestTableCell>

                <GuestTableCell>
                  <div className="min-w-[210px]">
                    <p className="font-bold text-slate-900">
                      {guestStringValue(
                        order.customer_name,
                      ) || 'Guest Customer'}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {guestStringValue(
                        order.customer_phone,
                      ) || 'No phone'}
                    </p>

                    <p className="mt-1 max-w-[230px] truncate text-xs text-slate-400">
                      {guestStringValue(
                        order.customer_email,
                      ) || 'No email'}
                    </p>
                  </div>
                </GuestTableCell>

                <GuestTableCell>
                  <div className="min-w-[230px]">
                    <p className="line-clamp-2 text-sm font-semibold text-slate-800">
                      {guestStringValue(
                        order.delivery_location,
                      ) || 'No delivery location'}
                    </p>

                    <p className="mt-2 text-xs font-semibold text-orange-700">
                      Preferred:{' '}
                      {guestFormatPreferredTime(
                        order.preferred_delivery_time,
                      )}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {guestDeliveryLabel(delivery)}
                    </p>
                  </div>
                </GuestTableCell>

                <GuestTableCell>
                  <div className="min-w-[115px]">
                    <p className="font-extrabold text-slate-950">
                      {guestFormatMoney(
                        order.total_amount,
                      )}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Paid:{' '}
                      {guestFormatMoney(
                        order.paid_amount,
                      )}
                    </p>
                  </div>
                </GuestTableCell>

                <GuestTableCell>
                  <span
                    className={`inline-flex rounded-full px-3 py-1.5 text-xs font-extrabold ${guestPaymentClasses(
                      payStatus,
                    )}`}
                  >
                    {guestPaymentLabel(
                      payStatus,
                    )}
                  </span>
                </GuestTableCell>

                <GuestTableCell>
                  <span
                    className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-extrabold ${guestStatusClasses(
                      status,
                    )}`}
                  >
                    {guestStatusLabel(status)}
                  </span>
                </GuestTableCell>

                <GuestTableCell>
                  <p className="min-w-[150px] text-xs font-semibold leading-5 text-slate-600">
                    {guestFormatDate(
                      order.created_at,
                    )}
                  </p>
                </GuestTableCell>

                <GuestTableCell>
                  <div className="min-w-[165px]">
                    {action ? (
                      <GuestStatusButton
                        type={action}
                        onClick={() =>
                          onAction(
                            order,
                            action,
                          )
                        }
                      />
                    ) : guestIsFinishedStatus(
                        status,
                      ) ? (
                      <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-extrabold text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                        Delivered
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-extrabold text-red-700">
                        <Ban className="h-4 w-4" />
                        Cancelled
                      </span>
                    )}
                  </div>
                </GuestTableCell>

                <GuestTableCell>
                  <div className="flex min-w-[105px] gap-2">
                    <GuestIconButton
                      title="View guest order"
                      onClick={() =>
                        onView(order)
                      }
                    >
                      <Eye className="h-4 w-4" />
                    </GuestIconButton>

                    {!guestIsFinishedStatus(
                      status,
                    ) &&
                      !guestIsCancelledStatus(
                        status,
                      ) && (
                        <GuestIconButton
                          title="Cancel guest order"
                          danger
                          onClick={() =>
                            onAction(
                              order,
                              'cancel',
                            )
                          }
                        >
                          <Ban className="h-4 w-4" />
                        </GuestIconButton>
                      )}
                  </div>
                </GuestTableCell>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function GuestStatusButton({
  type,
  onClick,
}: {
  type: GuestActionType
  onClick: () => void
}) {
  const Icon = guestActionIcon(type)

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-extrabold text-white transition ${guestActionButtonClasses(
        type,
      )}`}
    >
      <Icon className="h-4 w-4" />
      {guestActionLabel(type)}
    </button>
  )
}

function GuestOrderActionModal({
  isOpen,
  order,
  type,
  isSubmitting,
  onClose,
  onSubmit,
}: {
  isOpen: boolean
  order: GuestOrder | null
  type: GuestActionType
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (
    payload: GuestOrderActionPayload,
  ) => Promise<void>
}) {
  const [notes, setNotes] =
    useState('')
  const [localError, setLocalError] =
    useState('')

  useEffect(() => {
    if (isOpen) {
      setNotes('')
      setLocalError('')
    }
  }, [isOpen, order?.id, type])

  if (!isOpen || !order) {
    return null
  }

  const Icon = guestActionIcon(type)

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (
      type === 'cancel' &&
      !notes.trim()
    ) {
      setLocalError(
        'Enter a cancellation reason.',
      )
      return
    }

    setLocalError('')

    try {
      await onSubmit({
        notes: notes.trim(),
        cancellation_reason:
          type === 'cancel'
            ? notes.trim()
            : undefined,
      })
    } catch (error) {
      setLocalError(
        error instanceof Error
          ? error.message
          : 'Unable to process this guest order.',
      )
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">
          <div className="flex gap-3">
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white ${guestActionButtonClasses(
                type,
              ).split(' ')[0]}`}
            >
              <Icon className="h-5 w-5" />
            </span>

            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-orange-600">
                Guest Delivery Order
              </p>

              <h3 className="mt-1 text-xl font-extrabold text-slate-950">
                {guestActionLabel(type)}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {guestStringValue(
                  order.order_number,
                ) || `Order #${order.id}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={submit}
          className="space-y-5 p-6"
        >
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-900">
              {guestActionDescription(type)}
            </p>

            <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
              <p>
                Customer:{' '}
                <strong>
                  {guestStringValue(
                    order.customer_name,
                  ) || 'Guest Customer'}
                </strong>
              </p>

              <p>
                Amount:{' '}
                <strong>
                  {guestFormatMoney(
                    order.total_amount,
                  )}
                </strong>
              </p>
            </div>
          </div>

          {localError && (
            <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              {localError}
            </div>
          )}

          <div>
            <label
              htmlFor="guest-action-notes"
              className="text-sm font-extrabold text-slate-900"
            >
              {type === 'cancel'
                ? 'Cancellation reason'
                : 'Staff notes (optional)'}
            </label>

            <textarea
              id="guest-action-notes"
              value={notes}
              onChange={(event) =>
                setNotes(
                  event.target.value,
                )
              }
              required={type === 'cancel'}
              rows={4}
              maxLength={2000}
              placeholder={
                type === 'cancel'
                  ? 'Explain why this guest delivery order is being cancelled...'
                  : 'Add a kitchen, delivery or customer-service note...'
              }
              className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            />
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-600 disabled:opacity-50"
            >
              Close
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-extrabold text-white disabled:opacity-50 ${guestActionButtonClasses(
                type,
              )}`}
            >
              {isSubmitting ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
              {isSubmitting
                ? 'Processing...'
                : guestActionLabel(type)}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function GuestOrderDetailsModal({
  isOpen,
  order,
  isLoading,
  errorMessage,
  onClose,
}: {
  isOpen: boolean
  order: GuestOrder | null
  isLoading: boolean
  errorMessage: string
  onClose: () => void
}) {
  if (!isOpen) {
    return null
  }

  const items = order
    ? guestOrderItems(order)
    : []

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-orange-600">
              Guest Delivery Details
            </p>

            <h3 className="mt-1 text-2xl font-extrabold text-slate-950">
              {order
                ? guestStringValue(
                    order.order_number,
                  ) || `Order #${order.id}`
                : 'Loading order...'}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(92vh-100px)] overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex min-h-[380px] items-center justify-center">
              <LoaderCircle className="h-9 w-9 animate-spin text-orange-600" />
            </div>
          ) : errorMessage ? (
            <div className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              {errorMessage}
            </div>
          ) : order ? (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <GuestDetailCard
                  label="Order Status"
                  value={guestStatusLabel(
                    guestOrderStatus(order),
                  )}
                />

                <GuestDetailCard
                  label="Payment"
                  value={guestPaymentLabel(
                    guestPaymentStatus(order),
                  )}
                />

                <GuestDetailCard
                  label="Delivery"
                  value={guestDeliveryLabel(
                    guestDeliveryStatus(order),
                  )}
                />

                <GuestDetailCard
                  label="Total Amount"
                  value={guestFormatMoney(
                    order.total_amount,
                  )}
                />
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <section className="rounded-2xl border border-slate-200 p-5">
                  <h4 className="font-extrabold text-slate-950">
                    Customer Information
                  </h4>

                  <div className="mt-4 space-y-4">
                    <GuestDetailLine
                      icon={UserRound}
                      label="Name"
                      value={guestStringValue(
                        order.customer_name,
                      ) || 'Not provided'}
                    />

                    <GuestDetailLine
                      icon={Phone}
                      label="Phone"
                      value={guestStringValue(
                        order.customer_phone,
                      ) || 'Not provided'}
                    />

                    <GuestDetailLine
                      icon={Mail}
                      label="Email"
                      value={guestStringValue(
                        order.customer_email,
                      ) || 'Not provided'}
                    />
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 p-5">
                  <h4 className="font-extrabold text-slate-950">
                    Delivery Information
                  </h4>

                  <div className="mt-4 space-y-4">
                    <GuestDetailLine
                      icon={MapPin}
                      label="Location"
                      value={guestStringValue(
                        order.delivery_location,
                      ) || 'Not provided'}
                    />

                    <GuestDetailLine
                      icon={Clock3}
                      label="Preferred Time"
                      value={guestFormatPreferredTime(
                        order.preferred_delivery_time,
                      )}
                    />

                    <GuestDetailLine
                      icon={Send}
                      label="Submitted"
                      value={guestFormatDate(
                        order.created_at,
                      )}
                    />
                  </div>
                </section>
              </div>

              <section className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                  <h4 className="font-extrabold text-slate-950">
                    Ordered Items
                  </h4>
                </div>

                {items.length === 0 ? (
                  <div className="p-6 text-sm text-slate-500">
                    No guest-order items were returned by the API.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[680px]">
                      <thead className="bg-white">
                        <tr className="border-b border-slate-200">
                          <GuestHeaderCell>Food</GuestHeaderCell>
                          <GuestHeaderCell>Quantity</GuestHeaderCell>
                          <GuestHeaderCell>Unit Price</GuestHeaderCell>
                          <GuestHeaderCell>Total</GuestHeaderCell>
                          <GuestHeaderCell>Notes</GuestHeaderCell>
                        </tr>
                      </thead>

                      <tbody>
                        {items.map((item) => (
                          <tr
                            key={String(item.id)}
                            className="border-b border-slate-100 last:border-b-0"
                          >
                            <GuestTableCell>
                              <p className="font-bold text-slate-900">
                                {guestItemName(item)}
                              </p>

                              {guestStringValue(
                                item.food_sku,
                                item.food_item?.sku,
                              ) && (
                                <p className="mt-1 text-xs text-slate-400">
                                  SKU:{' '}
                                  {guestStringValue(
                                    item.food_sku,
                                    item.food_item?.sku,
                                  )}
                                </p>
                              )}
                            </GuestTableCell>

                            <GuestTableCell>
                              {guestNumberValue(
                                item.quantity,
                              )}
                            </GuestTableCell>

                            <GuestTableCell>
                              {guestFormatMoney(
                                item.unit_price,
                              )}
                            </GuestTableCell>

                            <GuestTableCell>
                              <strong>
                                {guestFormatMoney(
                                  item.total_amount,
                                  item.subtotal_amount,
                                )}
                              </strong>
                            </GuestTableCell>

                            <GuestTableCell>
                              {guestStringValue(
                                item.notes,
                              ) || '—'}
                            </GuestTableCell>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <div className="grid gap-5 lg:grid-cols-2">
                <GuestNotesCard
                  title="Customer Notes"
                  value={order.customer_notes}
                />

                <GuestNotesCard
                  title="Staff Notes"
                  value={order.staff_notes}
                />
              </div>

              {order.cancellation_reason && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                  <p className="text-sm font-extrabold text-red-800">
                    Cancellation Reason
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-red-700">
                    {order.cancellation_reason}
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function GuestSummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  className,
}: {
  title: string
  value: number
  subtitle?: string
  icon: LucideIcon
  className: string
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500">
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
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${className}`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </article>
  )
}

function GuestDetailCard({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 font-extrabold text-slate-950">
        {value}
      </p>
    </div>
  )
}

function GuestDetailLine({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="flex gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-700">
        <Icon className="h-4 w-4" />
      </span>

      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p className="mt-1 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-800">
          {value}
        </p>
      </div>
    </div>
  )
}

function GuestNotesCard({
  title,
  value,
}: {
  title: string
  value?: string | null
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-5">
      <p className="font-extrabold text-slate-950">
        {title}
      </p>

      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
        {guestStringValue(value) || 'No notes.'}
      </p>
    </div>
  )
}

function GuestHeaderCell({
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

function GuestTableCell({
  children,
}: {
  children: ReactNode
}) {
  return (
    <td className="px-5 py-5 text-sm text-slate-700">
      {children}
    </td>
  )
}

function GuestIconButton({
  title,
  children,
  onClick,
  danger = false,
}: {
  title: string
  children: ReactNode
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${
        danger
          ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  )
}