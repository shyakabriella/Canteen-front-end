'use client'

import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
  WalletCards,
  XCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useState,
} from 'react'
import PurchaseRequestActionModal, {
  type PurchaseRequestAction,
} from '@/components/admin/purchase-requests/PurchaseRequestActionModal'
import PurchaseRequestDetailsModal from '@/components/admin/purchase-requests/PurchaseRequestDetailsModal'
import PurchaseRequestFormModal from '@/components/admin/purchase-requests/PurchaseRequestFormModal'
import PurchaseRequestTable from '@/components/admin/purchase-requests/PurchaseRequestTable'
import { getLowStockInventoryOptions } from '@/services/low-stock-alert.service'
import {
  approvePurchaseRequest,
  cancelPurchaseRequest,
  createPurchaseRequest,
  deletePurchaseRequest,
  getPurchaseRequest,
  getPurchaseRequests,
  getPurchaseRequestSummary,
  markPurchaseRequestOrdered,
  receivePurchaseRequest,
  rejectPurchaseRequest,
  restorePurchaseRequest,
  updatePurchaseRequest,
} from '@/services/purchase-request.service'
import { getSuppliers } from '@/services/supplier.service'
import type { InventoryStockOption } from '@/types/low-stock-alert'
import type {
  ApprovePurchaseRequestPayload,
  CancelPurchaseRequestPayload,
  MarkPurchaseRequestOrderedPayload,
  PurchaseRequest,
  PurchaseRequestPayload,
  PurchaseRequestSummary,
  ReceivePurchaseRequestPayload,
  RejectPurchaseRequestPayload,
} from '@/types/purchase-request'
import type { Supplier } from '@/types/supplier'

type ActionPayload =
  | ApprovePurchaseRequestPayload
  | RejectPurchaseRequestPayload
  | MarkPurchaseRequestOrderedPayload
  | ReceivePurchaseRequestPayload
  | CancelPurchaseRequestPayload

const emptySummary: PurchaseRequestSummary = {
  total_requests: 0,
  pending_requests: 0,
  approved_requests: 0,
  ordered_requests: 0,
  received_requests: 0,
  rejected_requests: 0,
  cancelled_requests: 0,
  urgent_requests: 0,
  total_estimated_amount: 0,
}

export default function PurchaseRequestsPage() {
  const [requests, setRequests] =
    useState<PurchaseRequest[]>([])
  const [suppliers, setSuppliers] =
    useState<Supplier[]>([])
  const [inventoryStocks, setInventoryStocks] =
    useState<InventoryStockOption[]>([])
  const [summary, setSummary] =
    useState<PurchaseRequestSummary>(
      emptySummary,
    )

  const [searchInput, setSearchInput] =
    useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [supplierId, setSupplierId] =
    useState('')
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
  const [editingRequest, setEditingRequest] =
    useState<PurchaseRequest | null>(null)

  const [detailsOpen, setDetailsOpen] =
    useState(false)
  const [detailsRequest, setDetailsRequest] =
    useState<PurchaseRequest | null>(null)
  const [detailsLoading, setDetailsLoading] =
    useState(false)
  const [detailsError, setDetailsError] =
    useState('')

  const [actionOpen, setActionOpen] =
    useState(false)
  const [actionType, setActionType] =
    useState<PurchaseRequestAction>('approve')
  const [actionRequest, setActionRequest] =
    useState<PurchaseRequest | null>(null)

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
        const [supplierResult, stocks] =
          await Promise.all([
            getSuppliers({
              perPage: 200,
            }),
            getLowStockInventoryOptions(),
          ])

        setSuppliers(supplierResult.suppliers)
        setInventoryStocks(stocks)
      } catch (error) {
        setDependencyError(
          error instanceof Error
            ? error.message
            : 'Unable to load suppliers and inventory.',
        )
      } finally {
        setIsLoadingDependencies(false)
      }
    },
    [],
  )

  const loadRequests = useCallback(
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
          priority,
          supplierId,
          dateFrom,
          dateTo,
          includeDeleted,
          perPage: 200,
        }

        const [list, summaryResult] =
          await Promise.all([
            getPurchaseRequests(filters),
            getPurchaseRequestSummary(
              filters,
            ),
          ])

        setRequests(list.requests)
        setSummary(summaryResult)
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to load purchase requests.',
        )
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [
      search,
      status,
      priority,
      supplierId,
      dateFrom,
      dateTo,
      includeDeleted,
    ],
  )

  useEffect(() => {
    void loadDependencies()
  }, [loadDependencies])

  useEffect(() => {
    void loadRequests()
  }, [loadRequests])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim())
    }, 400)

    return () =>
      window.clearTimeout(timer)
  }, [searchInput])

  async function handleFormSubmit(
    payload: PurchaseRequestPayload,
  ) {
    setIsSubmitting(true)
    setMessage('')
    setErrorMessage('')

    try {
      const result = editingRequest
        ? await updatePurchaseRequest(
            editingRequest.id,
            payload,
          )
        : await createPurchaseRequest(payload)

      setMessage(result.message)
      setFormOpen(false)
      setEditingRequest(null)

      await loadRequests(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to save purchase request.',
      )
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleView(
    request: PurchaseRequest,
  ) {
    setDetailsOpen(true)
    setDetailsLoading(true)
    setDetailsRequest(null)
    setDetailsError('')

    try {
      setDetailsRequest(
        await getPurchaseRequest(request.id),
      )
    } catch (error) {
      setDetailsError(
        error instanceof Error
          ? error.message
          : 'Unable to load request details.',
      )
    } finally {
      setDetailsLoading(false)
    }
  }

  function openAction(
    request: PurchaseRequest,
    type: PurchaseRequestAction,
  ) {
    setActionRequest(request)
    setActionType(type)
    setActionOpen(true)
  }

  async function handleAction(
    payload: ActionPayload,
  ) {
    if (!actionRequest) {
      return
    }

    setIsSubmitting(true)
    setMessage('')
    setErrorMessage('')

    try {
      let resultMessage = ''

      if (actionType === 'approve') {
        resultMessage =
          await approvePurchaseRequest(
            actionRequest.id,
            payload as ApprovePurchaseRequestPayload,
          )
      } else if (actionType === 'reject') {
        resultMessage =
          await rejectPurchaseRequest(
            actionRequest.id,
            payload as RejectPurchaseRequestPayload,
          )
      } else if (
        actionType === 'mark-ordered'
      ) {
        resultMessage =
          await markPurchaseRequestOrdered(
            actionRequest.id,
            payload as MarkPurchaseRequestOrderedPayload,
          )
      } else if (actionType === 'receive') {
        resultMessage =
          await receivePurchaseRequest(
            actionRequest.id,
            payload as ReceivePurchaseRequestPayload,
          )
      } else {
        resultMessage =
          await cancelPurchaseRequest(
            actionRequest.id,
            payload as CancelPurchaseRequestPayload,
          )
      }

      setMessage(resultMessage)
      setActionOpen(false)
      setActionRequest(null)

      await Promise.all([
        loadRequests(true),
        loadDependencies(),
      ])
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to process request.',
      )
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(
    request: PurchaseRequest,
  ) {
    if (
      !window.confirm(
        `Delete purchase request #${request.id}?`,
      )
    ) {
      return
    }

    setProcessingId(request.id)

    try {
      setMessage(
        await deletePurchaseRequest(
          request.id,
        ),
      )
      await loadRequests(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to delete request.',
      )
    } finally {
      setProcessingId(null)
    }
  }

  async function handleRestore(
    request: PurchaseRequest,
  ) {
    if (
      !window.confirm(
        `Restore purchase request #${request.id}?`,
      )
    ) {
      return
    }

    setProcessingId(request.id)

    try {
      setMessage(
        await restorePurchaseRequest(
          request.id,
        ),
      )
      await loadRequests(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to restore request.',
      )
    } finally {
      setProcessingId(null)
    }
  }

  function clearFilters() {
    setSearchInput('')
    setSearch('')
    setStatus('')
    setPriority('')
    setSupplierId('')
    setDateFrom('')
    setDateTo('')
    setIncludeDeleted(false)
  }

  const formatAmount = (value: number) =>
    `${new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(value)} RWF`

  return (
    <>
      <div className="space-y-6">
        <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-600">
              Procurement Management
            </p>

            <h1 className="mt-2 text-2xl font-extrabold text-slate-950 sm:text-3xl">
              Purchase Requests
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Request, approve, order and receive
              inventory from suppliers.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                void Promise.all([
                  loadRequests(true),
                  loadDependencies(),
                ])
              }
              disabled={isRefreshing}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600"
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
              onClick={() => {
                setEditingRequest(null)
                setFormOpen(true)
              }}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white"
            >
              <Plus className="h-4 w-4" />
              New Request
            </button>
          </div>
        </section>

        {message && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            {message}
          </div>
        )}

        {errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <SummaryCard
            title="Total"
            value={String(summary.total_requests)}
            icon={ShoppingCart}
          />
          <SummaryCard
            title="Pending"
            value={String(
              summary.pending_requests,
            )}
            icon={Clock3}
          />
          <SummaryCard
            title="Approved"
            value={String(
              summary.approved_requests,
            )}
            icon={CheckCircle2}
          />
          <SummaryCard
            title="Ordered"
            value={String(
              summary.ordered_requests,
            )}
            icon={ShoppingCart}
          />
          <SummaryCard
            title="Received"
            value={String(
              summary.received_requests,
            )}
            icon={PackageCheck}
          />
          <SummaryCard
            title="Estimated Value"
            value={formatAmount(
              summary.total_estimated_amount,
            )}
            icon={WalletCards}
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="space-y-3 border-b border-slate-200 p-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_180px_180px_260px]">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  value={searchInput}
                  onChange={(event) =>
                    setSearchInput(
                      event.target.value,
                    )
                  }
                  placeholder="Search request, food item or supplier..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm"
                />
              </div>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value)
                }
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm"
              >
                <option value="">All statuses</option>
                <option value="pending">
                  Pending
                </option>
                <option value="approved">
                  Approved
                </option>
                <option value="ordered">
                  Ordered
                </option>
                <option value="received">
                  Received
                </option>
                <option value="rejected">
                  Rejected
                </option>
                <option value="cancelled">
                  Cancelled
                </option>
              </select>

              <select
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value)
                }
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm"
              >
                <option value="">All priorities</option>
                <option value="low">Low</option>
                <option value="normal">
                  Normal
                </option>
                <option value="high">High</option>
                <option value="urgent">
                  Urgent
                </option>
              </select>

              <select
                value={supplierId}
                onChange={(event) =>
                  setSupplierId(event.target.value)
                }
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm"
              >
                <option value="">
                  All suppliers
                </option>

                {suppliers.map((supplier) => (
                  <option
                    key={supplier.id}
                    value={String(supplier.id)}
                  >
                    {supplier.name ??
                      supplier.company_name ??
                      `Supplier #${supplier.id}`}
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
            <div className="flex min-h-96 items-center justify-center">
              <LoaderCircle className="h-9 w-9 animate-spin text-indigo-600" />
            </div>
          ) : requests.length === 0 ? (
            <div className="flex min-h-96 items-center justify-center text-center">
              <div>
                <ShoppingCart className="mx-auto h-12 w-12 text-indigo-200" />

                <h2 className="mt-4 text-lg font-extrabold">
                  No purchase requests found
                </h2>

                <button
                  type="button"
                  onClick={() => setFormOpen(true)}
                  className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white"
                >
                  Create Request
                </button>
              </div>
            </div>
          ) : (
            <PurchaseRequestTable
              requests={requests}
              processingId={processingId}
              onView={(request) =>
                void handleView(request)
              }
              onEdit={(request) => {
                setEditingRequest(request)
                setFormOpen(true)
              }}
              onApprove={(request) =>
                openAction(request, 'approve')
              }
              onReject={(request) =>
                openAction(request, 'reject')
              }
              onMarkOrdered={(request) =>
                openAction(
                  request,
                  'mark-ordered',
                )
              }
              onReceive={(request) =>
                openAction(request, 'receive')
              }
              onCancel={(request) =>
                openAction(request, 'cancel')
              }
              onDelete={(request) =>
                void handleDelete(request)
              }
              onRestore={(request) =>
                void handleRestore(request)
              }
            />
          )}
        </section>
      </div>

      <PurchaseRequestFormModal
        isOpen={formOpen}
        request={editingRequest}
        suppliers={suppliers}
        inventoryStocks={inventoryStocks}
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
            setEditingRequest(null)
          }
        }}
        onSubmit={handleFormSubmit}
      />

      <PurchaseRequestActionModal
        isOpen={actionOpen}
        type={actionType}
        request={actionRequest}
        isSubmitting={isSubmitting}
        onClose={() => {
          if (!isSubmitting) {
            setActionOpen(false)
            setActionRequest(null)
          }
        }}
        onSubmit={handleAction}
      />

      <PurchaseRequestDetailsModal
        isOpen={detailsOpen}
        request={detailsRequest}
        isLoading={detailsLoading}
        errorMessage={detailsError}
        onClose={() => {
          setDetailsOpen(false)
          setDetailsRequest(null)
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
}: {
  title: string
  value: string
  icon: LucideIcon
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">
            {title}
          </p>

          <p className="mt-2 truncate text-2xl font-extrabold text-slate-950">
            {value}
          </p>
        </div>

        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </article>
  )
}
