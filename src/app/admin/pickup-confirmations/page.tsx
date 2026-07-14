'use client'

import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  MapPin,
  PackageCheck,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  UserRound,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useState,
} from 'react'
import CancelPickupConfirmationModal from '@/components/admin/pickup-confirmations/CancelPickupConfirmationModal'
import PickupConfirmationDetailsModal from '@/components/admin/pickup-confirmations/PickupConfirmationDetailsModal'
import PickupConfirmationFormModal from '@/components/admin/pickup-confirmations/PickupConfirmationFormModal'
import PickupConfirmationTable from '@/components/admin/pickup-confirmations/PickupConfirmationTable'
import {
  cancelPickupConfirmation,
  createPickupConfirmation,
  deletePickupConfirmation,
  getPickupConfirmation,
  getPickupConfirmations,
  getPickupConfirmationSummary,
  restorePickupConfirmation,
} from '@/services/pickup-confirmation.service'
import { getOrderQrCodes } from '@/services/order-qr-code.service'
import { getOrders } from '@/services/order.service'
import type { Order } from '@/types/order'
import type { OrderQrCode } from '@/types/order-qr-code'
import type {
  CancelPickupConfirmationPayload,
  PickupConfirmation,
  PickupConfirmationPayload,
  PickupConfirmationSummary,
} from '@/types/pickup-confirmation'

const emptySummary: PickupConfirmationSummary = {
  total_confirmations: 0,
  confirmed_pickups: 0,
  cancelled_pickups: 0,
  today_pickups: 0,
  manual_pickups: 0,
  qr_pickups: 0,
  unique_locations: 0,
}

export default function PickupConfirmationsPage() {
  const [confirmations, setConfirmations] =
    useState<PickupConfirmation[]>([])

  const [summary, setSummary] =
    useState<PickupConfirmationSummary>(
      emptySummary,
    )

  const [orders, setOrders] =
    useState<Order[]>([])

  const [qrCodes, setQrCodes] =
    useState<OrderQrCode[]>([])

  const [searchInput, setSearchInput] =
    useState('')

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [method, setMethod] = useState('')
  const [orderId, setOrderId] = useState('')
  const [deviceType, setDeviceType] =
    useState('')
  const [location, setLocation] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [
    includeDeleted,
    setIncludeDeleted,
  ] = useState(false)

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

  const [cancelOpen, setCancelOpen] =
    useState(false)

  const [
    cancellingConfirmation,
    setCancellingConfirmation,
  ] = useState<PickupConfirmation | null>(
    null,
  )

  const [detailsOpen, setDetailsOpen] =
    useState(false)

  const [
    detailsConfirmation,
    setDetailsConfirmation,
  ] = useState<PickupConfirmation | null>(
    null,
  )

  const [detailsLoading, setDetailsLoading] =
    useState(false)

  const [detailsError, setDetailsError] =
    useState('')

  const [dependencyError, setDependencyError] =
    useState('')

  const [message, setMessage] = useState('')

  const [errorMessage, setErrorMessage] =
    useState('')

  const loadDependencies = useCallback(
    async () => {
      setIsLoadingDependencies(true)
      setDependencyError('')

      try {
        const [ordersResult, qrCodesResult] =
          await Promise.all([
            getOrders({
              perPage: 200,
            }),

            getOrderQrCodes({
              perPage: 200,
              includeDeleted: false,
            }),
          ])

        setOrders(ordersResult.orders)
        setQrCodes(qrCodesResult.qrCodes)
      } catch (error) {
        setDependencyError(
          error instanceof Error
            ? error.message
            : 'Unable to load orders and QR codes.',
        )
      } finally {
        setIsLoadingDependencies(false)
      }
    },
    [],
  )

  const loadConfirmations = useCallback(
    async (refresh = false) => {
      setErrorMessage('')

      if (refresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      try {
        const filters = {
          search,
          status,
          method,
          orderId,
          deviceType,
          location,
          dateFrom,
          dateTo,
          includeDeleted,
          perPage: 200,
        }

        const [
          listResult,
          summaryResult,
        ] = await Promise.all([
          getPickupConfirmations(filters),
          getPickupConfirmationSummary(
            filters,
          ),
        ])

        setConfirmations(
          listResult.confirmations,
        )

        setSummary(summaryResult)
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to load pickup confirmations.',
        )
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [
      search,
      status,
      method,
      orderId,
      deviceType,
      location,
      dateFrom,
      dateTo,
      includeDeleted,
    ],
  )

  useEffect(() => {
    void loadDependencies()
  }, [loadDependencies])

  useEffect(() => {
    void loadConfirmations()
  }, [loadConfirmations])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim())
    }, 400)

    return () =>
      window.clearTimeout(timer)
  }, [searchInput])

  async function handleCreate(
    payload: PickupConfirmationPayload,
  ) {
    setIsSubmitting(true)
    setMessage('')
    setErrorMessage('')

    try {
      const result =
        await createPickupConfirmation(
          payload,
        )

      setMessage(result.message)
      setFormOpen(false)

      await Promise.all([
        loadConfirmations(true),
        loadDependencies(),
      ])
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to confirm the pickup.',
      )

      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleView(
    confirmation: PickupConfirmation,
  ) {
    setDetailsOpen(true)
    setDetailsLoading(true)
    setDetailsConfirmation(null)
    setDetailsError('')

    try {
      const result =
        await getPickupConfirmation(
          confirmation.id,
        )

      setDetailsConfirmation(result)
    } catch (error) {
      setDetailsError(
        error instanceof Error
          ? error.message
          : 'Unable to load pickup confirmation.',
      )
    } finally {
      setDetailsLoading(false)
    }
  }

  function openCancellation(
    confirmation: PickupConfirmation,
  ) {
    setCancellingConfirmation(confirmation)
    setCancelOpen(true)
  }

  async function handleCancel(
    payload: CancelPickupConfirmationPayload,
  ) {
    if (!cancellingConfirmation) {
      return
    }

    setIsSubmitting(true)
    setMessage('')
    setErrorMessage('')

    try {
      const result =
        await cancelPickupConfirmation(
          cancellingConfirmation.id,
          payload,
        )

      setMessage(result.message)
      setCancelOpen(false)
      setCancellingConfirmation(null)

      await loadConfirmations(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to cancel the confirmation.',
      )

      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(
    confirmation: PickupConfirmation,
  ) {
    const confirmed = window.confirm(
      `Delete pickup confirmation #${confirmation.id}?\n\nDeleting the record should not automatically reverse the order or wallet transaction.`,
    )

    if (!confirmed) {
      return
    }

    setProcessingId(confirmation.id)
    setMessage('')
    setErrorMessage('')

    try {
      const responseMessage =
        await deletePickupConfirmation(
          confirmation.id,
        )

      setMessage(responseMessage)
      await loadConfirmations(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to delete the confirmation.',
      )
    } finally {
      setProcessingId(null)
    }
  }

  async function handleRestore(
    confirmation: PickupConfirmation,
  ) {
    const confirmed = window.confirm(
      `Restore pickup confirmation #${confirmation.id}?`,
    )

    if (!confirmed) {
      return
    }

    setProcessingId(confirmation.id)
    setMessage('')
    setErrorMessage('')

    try {
      const responseMessage =
        await restorePickupConfirmation(
          confirmation.id,
        )

      setMessage(responseMessage)
      await loadConfirmations(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to restore the confirmation.',
      )
    } finally {
      setProcessingId(null)
    }
  }

  function clearFilters() {
    setSearchInput('')
    setSearch('')
    setStatus('')
    setMethod('')
    setOrderId('')
    setDeviceType('')
    setLocation('')
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
              Pickup Management
            </p>

            <h1 className="mt-2 text-2xl font-extrabold text-slate-950 sm:text-3xl">
              Pickup Confirmations
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Review customer collections and create
              manual pickup confirmations.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                void Promise.all([
                  loadConfirmations(true),
                  loadDependencies(),
                ])
              }
              disabled={
                isRefreshing ||
                isLoadingDependencies
              }
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              {isRefreshing ||
              isLoadingDependencies ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}

              Refresh
            </button>

            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Confirm Pickup
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

        {dependencyError && !formOpen && (
          <div className="flex items-start justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            <span>{dependencyError}</span>

            <button
              type="button"
              onClick={() =>
                void loadDependencies()
              }
              className="shrink-0 font-bold underline"
            >
              Retry
            </button>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-7">
          <SummaryCard
            title="Total"
            value={summary.total_confirmations}
            icon={PackageCheck}
            iconClass="bg-indigo-50 text-indigo-600"
          />

          <SummaryCard
            title="Confirmed"
            value={summary.confirmed_pickups}
            icon={CheckCircle2}
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <SummaryCard
            title="Today"
            value={summary.today_pickups}
            icon={Clock3}
            iconClass="bg-blue-50 text-blue-600"
          />

          <SummaryCard
            title="Manual"
            value={summary.manual_pickups}
            icon={UserRound}
            iconClass="bg-violet-50 text-violet-600"
          />

          <SummaryCard
            title="QR Pickups"
            value={summary.qr_pickups}
            icon={QrCode}
            iconClass="bg-cyan-50 text-cyan-600"
          />

          <SummaryCard
            title="Cancelled"
            value={summary.cancelled_pickups}
            icon={Ban}
            iconClass="bg-red-50 text-red-600"
          />

          <SummaryCard
            title="Locations"
            value={summary.unique_locations}
            icon={MapPin}
            iconClass="bg-amber-50 text-amber-600"
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="space-y-3 border-b border-slate-200 p-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_170px_170px_260px]">
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
                  placeholder="Search order, customer, staff or notes..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                />
              </div>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value)
                }
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400"
              >
                <option value="">
                  All statuses
                </option>
                <option value="confirmed">
                  Confirmed
                </option>
                <option value="cancelled">
                  Cancelled
                </option>
              </select>

              <select
                value={method}
                onChange={(event) =>
                  setMethod(event.target.value)
                }
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400"
              >
                <option value="">
                  All methods
                </option>
                <option value="manual">
                  Manual
                </option>
                <option value="qr">
                  QR Scan
                </option>
              </select>

              <select
                value={orderId}
                onChange={(event) =>
                  setOrderId(event.target.value)
                }
                disabled={isLoadingDependencies}
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 disabled:opacity-50"
              >
                <option value="">
                  {isLoadingDependencies
                    ? 'Loading orders...'
                    : 'All orders'}
                </option>

                {orders.map((order) => (
                  <option
                    key={order.id}
                    value={String(order.id)}
                  >
                    {order.order_number ??
                      order.reference ??
                      `ORDER-${order.id}`}
                    {order.user?.name
                      ? ` — ${order.user.name}`
                      : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[170px_220px_180px_180px_auto_auto]">
              <select
                value={deviceType}
                onChange={(event) =>
                  setDeviceType(
                    event.target.value,
                  )
                }
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400"
              >
                <option value="">
                  All devices
                </option>
                <option value="android">
                  Android
                </option>
                <option value="ios">
                  iOS
                </option>
                <option value="scanner">
                  QR Scanner
                </option>
                <option value="web">
                  Web
                </option>
                <option value="desktop">
                  Desktop
                </option>
              </select>

              <input
                type="text"
                value={location}
                onChange={(event) =>
                  setLocation(event.target.value)
                }
                placeholder="Filter by location"
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400"
              />

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

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-600">
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
                  Loading pickup confirmations...
                </p>
              </div>
            </div>
          ) : confirmations.length === 0 ? (
            <div className="flex min-h-[390px] items-center justify-center px-6 text-center">
              <div>
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600">
                  <PackageCheck className="h-8 w-8" />
                </span>

                <h2 className="mt-5 text-lg font-extrabold text-slate-900">
                  No pickup confirmations found
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Confirmations appear when staff mark
                  QR codes as used or create a manual
                  pickup confirmation.
                </p>

                <button
                  type="button"
                  onClick={() => setFormOpen(true)}
                  className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white"
                >
                  <Plus className="h-4 w-4" />
                  Confirm Pickup
                </button>
              </div>
            </div>
          ) : (
            <PickupConfirmationTable
              confirmations={confirmations}
              processingId={processingId}
              onView={(confirmation) =>
                void handleView(confirmation)
              }
              onCancel={openCancellation}
              onDelete={(confirmation) =>
                void handleDelete(confirmation)
              }
              onRestore={(confirmation) =>
                void handleRestore(confirmation)
              }
            />
          )}
        </section>
      </div>

      <PickupConfirmationFormModal
        isOpen={formOpen}
        orders={orders}
        qrCodes={qrCodes}
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
          }
        }}
        onSubmit={handleCreate}
      />

      <CancelPickupConfirmationModal
        isOpen={cancelOpen}
        confirmation={
          cancellingConfirmation
        }
        isSubmitting={isSubmitting}
        onClose={() => {
          if (!isSubmitting) {
            setCancelOpen(false)
            setCancellingConfirmation(null)
          }
        }}
        onSubmit={handleCancel}
      />

      <PickupConfirmationDetailsModal
        isOpen={detailsOpen}
        confirmation={detailsConfirmation}
        isLoading={detailsLoading}
        errorMessage={detailsError}
        onClose={() => {
          setDetailsOpen(false)
          setDetailsConfirmation(null)
          setDetailsError('')
        }}
      />
    </>
  )
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  iconClass,
}: {
  title: string
  value: number
  icon: LucideIcon
  iconClass: string
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-extrabold text-slate-950">
            {value}
          </p>
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
