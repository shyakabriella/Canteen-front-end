'use client'

import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Plus,
  QrCode,
  RefreshCw,
  ScanLine,
  Search,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import OrderQrCodeActionModal, {
  type OrderQrActionType,
} from '@/components/admin/order-qr-codes/OrderQrCodeActionModal'
import OrderQrCodeDetailsModal from '@/components/admin/order-qr-codes/OrderQrCodeDetailsModal'
import OrderQrCodeFormModal from '@/components/admin/order-qr-codes/OrderQrCodeFormModal'
import OrderQrCodeTable from '@/components/admin/order-qr-codes/OrderQrCodeTable'
import VerifyOrderQrCodeModal from '@/components/admin/order-qr-codes/VerifyOrderQrCodeModal'
import {
  getOrderQrCodeStatus,
} from '@/lib/order-qr-code'
import {
  cancelOrderQrCode,
  createOrderQrCode,
  deleteOrderQrCode,
  getOrderQrCode,
  getOrderQrCodes,
  markOrderQrCodeUsed,
  regenerateOrderQrCode,
  restoreOrderQrCode,
  updateOrderQrCode,
  verifyOrderQrCode,
} from '@/services/order-qr-code.service'
import { getOrders } from '@/services/order.service'
import type { Order } from '@/types/order'
import type {
  CancelOrderQrCodePayload,
  MarkOrderQrCodeUsedPayload,
  OrderQrCode,
  OrderQrCodePayload,
  RegenerateOrderQrCodePayload,
  VerifyOrderQrCodePayload,
  VerifyOrderQrCodeResult,
} from '@/types/order-qr-code'

type ActionPayload =
  | MarkOrderQrCodeUsedPayload
  | RegenerateOrderQrCodePayload
  | CancelOrderQrCodePayload

export default function OrderQrCodesPage() {
  const [qrCodes, setQrCodes] =
    useState<OrderQrCode[]>([])
  const [orders, setOrders] =
    useState<Order[]>([])

  const [searchInput, setSearchInput] =
    useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [orderId, setOrderId] = useState('')
  const [dateFrom, setDateFrom] =
    useState('')
  const [dateTo, setDateTo] = useState('')
  const [
    includeDeleted,
    setIncludeDeleted,
  ] = useState(false)

  const [isLoading, setIsLoading] =
    useState(true)
  const [isRefreshing, setIsRefreshing] =
    useState(false)
  const [isLoadingOrders, setIsLoadingOrders] =
    useState(true)
  const [isSubmitting, setIsSubmitting] =
    useState(false)

  const [processingId, setProcessingId] =
    useState<number | string | null>(null)

  const [formOpen, setFormOpen] =
    useState(false)
  const [editingQrCode, setEditingQrCode] =
    useState<OrderQrCode | null>(null)

  const [detailsOpen, setDetailsOpen] =
    useState(false)
  const [detailsQrCode, setDetailsQrCode] =
    useState<OrderQrCode | null>(null)
  const [detailsLoading, setDetailsLoading] =
    useState(false)
  const [detailsError, setDetailsError] =
    useState('')

  const [verifyOpen, setVerifyOpen] =
    useState(false)
  const [verifyResult, setVerifyResult] =
    useState<VerifyOrderQrCodeResult | null>(
      null,
    )

  const [actionOpen, setActionOpen] =
    useState(false)
  const [actionType, setActionType] =
    useState<OrderQrActionType>('mark-used')
  const [actionQrCode, setActionQrCode] =
    useState<OrderQrCode | null>(null)

  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] =
    useState('')

  const loadOrders = useCallback(async () => {
    setIsLoadingOrders(true)

    try {
      const result = await getOrders({
        perPage: 200,
      })

      setOrders(result.orders)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to load orders.',
      )
    } finally {
      setIsLoadingOrders(false)
    }
  }, [])

  const loadQrCodes = useCallback(
    async (refresh = false) => {
      setErrorMessage('')

      if (refresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      try {
        const result = await getOrderQrCodes({
          search,
          status,
          orderId,
          dateFrom,
          dateTo,
          includeDeleted,
          perPage: 200,
        })

        setQrCodes(result.qrCodes)
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to load order QR codes.',
        )
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [
      search,
      status,
      orderId,
      dateFrom,
      dateTo,
      includeDeleted,
    ],
  )

  useEffect(() => {
    void loadOrders()
  }, [loadOrders])

  useEffect(() => {
    void loadQrCodes()
  }, [loadQrCodes])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim())
    }, 400)

    return () =>
      window.clearTimeout(timer)
  }, [searchInput])

  const summary = useMemo(() => {
    const activeRecords = qrCodes.filter(
      (qrCode) => !qrCode.deleted_at,
    )

    return {
      total: activeRecords.length,

      active: activeRecords.filter(
        (qrCode) =>
          getOrderQrCodeStatus(qrCode) ===
          'active',
      ).length,

      used: activeRecords.filter(
        (qrCode) =>
          getOrderQrCodeStatus(qrCode) ===
          'used',
      ).length,

      expired: activeRecords.filter(
        (qrCode) =>
          getOrderQrCodeStatus(qrCode) ===
          'expired',
      ).length,

      cancelled: activeRecords.filter(
        (qrCode) =>
          getOrderQrCodeStatus(qrCode) ===
          'cancelled',
      ).length,
    }
  }, [qrCodes])

  function openCreateForm() {
    setEditingQrCode(null)
    setFormOpen(true)
  }

  function openEditForm(
    qrCode: OrderQrCode,
  ) {
    setEditingQrCode(qrCode)
    setFormOpen(true)
  }

  async function handleFormSubmit(
    payload: OrderQrCodePayload,
  ) {
    setIsSubmitting(true)
    setMessage('')
    setErrorMessage('')

    try {
      const result = editingQrCode
        ? await updateOrderQrCode(
            editingQrCode.id,
            payload,
          )
        : await createOrderQrCode(payload)

      setMessage(result.message)
      setFormOpen(false)
      setEditingQrCode(null)

      await loadQrCodes(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to save the QR code.',
      )

      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleVerify(
    payload: VerifyOrderQrCodePayload,
  ) {
    setIsSubmitting(true)
    setVerifyResult(null)

    try {
      const result =
        await verifyOrderQrCode(payload)

      setVerifyResult(result)

      if (result.valid) {
        setMessage(result.message)
      }

      await loadQrCodes(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleView(
    qrCode: OrderQrCode,
  ) {
    setDetailsOpen(true)
    setDetailsLoading(true)
    setDetailsQrCode(null)
    setDetailsError('')

    try {
      const result = await getOrderQrCode(
        qrCode.id,
      )

      setDetailsQrCode(result)
    } catch (error) {
      setDetailsError(
        error instanceof Error
          ? error.message
          : 'Unable to load QR code details.',
      )
    } finally {
      setDetailsLoading(false)
    }
  }

  function openAction(
    qrCode: OrderQrCode,
    type: OrderQrActionType,
  ) {
    setActionQrCode(qrCode)
    setActionType(type)
    setActionOpen(true)
  }

  async function handleAction(
    payload: ActionPayload,
  ) {
    if (!actionQrCode) {
      return
    }

    setIsSubmitting(true)
    setMessage('')
    setErrorMessage('')

    try {
      const result =
        actionType === 'mark-used'
          ? await markOrderQrCodeUsed(
              actionQrCode.id,
              payload as MarkOrderQrCodeUsedPayload,
            )
          : actionType === 'regenerate'
            ? await regenerateOrderQrCode(
                actionQrCode.id,
                payload as RegenerateOrderQrCodePayload,
              )
            : await cancelOrderQrCode(
                actionQrCode.id,
                payload as CancelOrderQrCodePayload,
              )

      setMessage(result.message)
      setActionOpen(false)
      setActionQrCode(null)

      await loadQrCodes(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to process the QR code.',
      )

      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(
    qrCode: OrderQrCode,
  ) {
    if (
      !window.confirm(
        `Delete QR code record #${qrCode.id}?`,
      )
    ) {
      return
    }

    setProcessingId(qrCode.id)
    setMessage('')
    setErrorMessage('')

    try {
      setMessage(
        await deleteOrderQrCode(qrCode.id),
      )

      await loadQrCodes(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to delete the QR code.',
      )
    } finally {
      setProcessingId(null)
    }
  }

  async function handleRestore(
    qrCode: OrderQrCode,
  ) {
    if (
      !window.confirm(
        `Restore QR code record #${qrCode.id}?`,
      )
    ) {
      return
    }

    setProcessingId(qrCode.id)
    setMessage('')
    setErrorMessage('')

    try {
      setMessage(
        await restoreOrderQrCode(qrCode.id),
      )

      await loadQrCodes(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to restore the QR code.',
      )
    } finally {
      setProcessingId(null)
    }
  }

  function clearFilters() {
    setSearchInput('')
    setSearch('')
    setStatus('')
    setOrderId('')
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
              Order QR Codes
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Generate, verify and use secure QR codes
              for order pickup.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setVerifyResult(null)
                setVerifyOpen(true)
              }}
              className="flex h-11 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700"
            >
              <ScanLine className="h-4 w-4" />
              Verify QR
            </button>

            <button
              type="button"
              onClick={() =>
                void Promise.all([
                  loadQrCodes(true),
                  loadOrders(),
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
              className="flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Create QR Code
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

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            title="Total QR Codes"
            value={summary.total}
            icon={QrCode}
            iconClass="bg-indigo-50 text-indigo-600"
          />

          <SummaryCard
            title="Active"
            value={summary.active}
            icon={Clock3}
            iconClass="bg-blue-50 text-blue-600"
          />

          <SummaryCard
            title="Used"
            value={summary.used}
            icon={CheckCircle2}
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <SummaryCard
            title="Expired"
            value={summary.expired}
            icon={AlertTriangle}
            iconClass="bg-amber-50 text-amber-600"
          />

          <SummaryCard
            title="Cancelled"
            value={summary.cancelled}
            icon={Ban}
            iconClass="bg-red-50 text-red-600"
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="space-y-3 border-b border-slate-200 p-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_180px_280px]">
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
                  placeholder="Search token, order or customer..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
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
                <option value="active">
                  Active
                </option>
                <option value="used">
                  Used
                </option>
                <option value="expired">
                  Expired
                </option>
                <option value="cancelled">
                  Cancelled
                </option>
              </select>

              <select
                value={orderId}
                onChange={(event) =>
                  setOrderId(event.target.value)
                }
                disabled={isLoadingOrders}
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 disabled:opacity-50"
              >
                <option value="">
                  {isLoadingOrders
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

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-600">
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
          ) : qrCodes.length === 0 ? (
            <div className="flex min-h-[390px] items-center justify-center px-6 text-center">
              <div>
                <QrCode className="mx-auto h-12 w-12 text-indigo-200" />

                <h2 className="mt-4 text-lg font-extrabold text-slate-900">
                  No QR codes found
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  QR codes are normally created
                  automatically with new orders.
                </p>

                <button
                  type="button"
                  onClick={openCreateForm}
                  className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white"
                >
                  <Plus className="h-4 w-4" />
                  Create QR Code
                </button>
              </div>
            </div>
          ) : (
            <OrderQrCodeTable
              qrCodes={qrCodes}
              processingId={processingId}
              onView={(qrCode) =>
                void handleView(qrCode)
              }
              onEdit={openEditForm}
              onDelete={(qrCode) =>
                void handleDelete(qrCode)
              }
              onRestore={(qrCode) =>
                void handleRestore(qrCode)
              }
              onMarkUsed={(qrCode) =>
                openAction(
                  qrCode,
                  'mark-used',
                )
              }
              onRegenerate={(qrCode) =>
                openAction(
                  qrCode,
                  'regenerate',
                )
              }
              onCancel={(qrCode) =>
                openAction(qrCode, 'cancel')
              }
            />
          )}
        </section>
      </div>

      <OrderQrCodeFormModal
        isOpen={formOpen}
        qrCode={editingQrCode}
        orders={orders}
        isLoadingOrders={isLoadingOrders}
        isSubmitting={isSubmitting}
        onClose={() => {
          if (!isSubmitting) {
            setFormOpen(false)
            setEditingQrCode(null)
          }
        }}
        onSubmit={handleFormSubmit}
      />

      <VerifyOrderQrCodeModal
        isOpen={verifyOpen}
        isSubmitting={isSubmitting}
        result={verifyResult}
        onClose={() => {
          if (!isSubmitting) {
            setVerifyOpen(false)
            setVerifyResult(null)
          }
        }}
        onSubmit={handleVerify}
      />

      <OrderQrCodeActionModal
        isOpen={actionOpen}
        type={actionType}
        qrCode={actionQrCode}
        isSubmitting={isSubmitting}
        onClose={() => {
          if (!isSubmitting) {
            setActionOpen(false)
            setActionQrCode(null)
          }
        }}
        onSubmit={handleAction}
      />

      <OrderQrCodeDetailsModal
        isOpen={detailsOpen}
        qrCode={detailsQrCode}
        isLoading={detailsLoading}
        errorMessage={detailsError}
        onClose={() => {
          setDetailsOpen(false)
          setDetailsQrCode(null)
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
  icon: typeof QrCode
  iconClass: string
}) {
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
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </article>
  )
}
