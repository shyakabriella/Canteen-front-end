'use client'

import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  WalletCards,
  XCircle,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useState,
} from 'react'
import WalletTopUpActionModal, {
  type TopUpActionType,
} from '@/components/admin/top-ups/WalletTopUpActionModal'
import WalletTopUpDetailsModal from '@/components/admin/top-ups/WalletTopUpDetailsModal'
import WalletTopUpFormModal from '@/components/admin/top-ups/WalletTopUpFormModal'
import WalletTopUpTable from '@/components/admin/top-ups/WalletTopUpTable'
import {
  approveWalletTopUp,
  cancelWalletTopUp,
  createWalletTopUp,
  deleteWalletTopUp,
  getWalletTopUp,
  getWalletTopUps,
  getWalletTopUpSummary,
  rejectWalletTopUp,
  restoreWalletTopUp,
  updateWalletTopUp,
} from '@/services/wallet-top-up.service'
import type {
  WalletTopUp,
  WalletTopUpActionPayload,
  WalletTopUpPayload,
  WalletTopUpSummary,
} from '@/types/wallet-top-up'

const emptySummary: WalletTopUpSummary = {
  total_requests: 0,
  pending_requests: 0,
  approved_requests: 0,
  rejected_requests: 0,
  cancelled_requests: 0,
  total_requested_amount: 0,
  pending_amount: 0,
  approved_amount: 0,
  rejected_amount: 0,
  cancelled_amount: 0,
}

export default function WalletTopUpsPage() {
  const [topUps, setTopUps] = useState<
    WalletTopUp[]
  >([])

  const [summary, setSummary] =
    useState<WalletTopUpSummary>(emptySummary)

  const [searchInput, setSearchInput] =
    useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [paymentMethod, setPaymentMethod] =
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
  const [editingTopUp, setEditingTopUp] =
    useState<WalletTopUp | null>(null)

  const [detailsOpen, setDetailsOpen] =
    useState(false)
  const [detailsTopUp, setDetailsTopUp] =
    useState<WalletTopUp | null>(null)
  const [detailsLoading, setDetailsLoading] =
    useState(false)
  const [detailsError, setDetailsError] =
    useState('')

  const [actionOpen, setActionOpen] =
    useState(false)
  const [actionType, setActionType] =
    useState<TopUpActionType>('approve')
  const [actionTopUp, setActionTopUp] =
    useState<WalletTopUp | null>(null)

  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] =
    useState('')

  const loadTopUps = useCallback(
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
          paymentMethod,
          dateFrom,
          dateTo,
          includeDeleted,
          perPage: 200,
        }

        const [listResult, summaryResult] =
          await Promise.all([
            getWalletTopUps(filters),
            getWalletTopUpSummary(filters),
          ])

        setTopUps(listResult.topUps)
        setSummary(summaryResult)
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to load wallet top-ups.',
        )
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [
      search,
      status,
      paymentMethod,
      dateFrom,
      dateTo,
      includeDeleted,
    ],
  )

  useEffect(() => {
    void loadTopUps()
  }, [loadTopUps])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim())
    }, 400)

    return () => window.clearTimeout(timer)
  }, [searchInput])

  function openCreateForm() {
    setEditingTopUp(null)
    setFormOpen(true)
  }

  function openEditForm(topUp: WalletTopUp) {
    setEditingTopUp(topUp)
    setFormOpen(true)
  }

  async function handleFormSubmit(
    payload: WalletTopUpPayload,
  ) {
    setIsSubmitting(true)
    setMessage('')
    setErrorMessage('')

    try {
      const result = editingTopUp
        ? await updateWalletTopUp(
            editingTopUp.id,
            payload,
          )
        : await createWalletTopUp(payload)

      setMessage(result.message)
      setFormOpen(false)
      setEditingTopUp(null)

      await loadTopUps(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to save top-up request.',
      )

      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleView(
    topUp: WalletTopUp,
  ) {
    setDetailsOpen(true)
    setDetailsLoading(true)
    setDetailsTopUp(null)
    setDetailsError('')

    try {
      const result =
        await getWalletTopUp(topUp.id)

      setDetailsTopUp(result)
    } catch (error) {
      setDetailsError(
        error instanceof Error
          ? error.message
          : 'Unable to load top-up details.',
      )
    } finally {
      setDetailsLoading(false)
    }
  }

  function openAction(
    topUp: WalletTopUp,
    type: TopUpActionType,
  ) {
    setActionTopUp(topUp)
    setActionType(type)
    setActionOpen(true)
  }

  async function handleAction(
    payload: WalletTopUpActionPayload,
  ) {
    if (!actionTopUp) {
      return
    }

    setIsSubmitting(true)
    setMessage('')
    setErrorMessage('')

    try {
      const result =
        actionType === 'approve'
          ? await approveWalletTopUp(
              actionTopUp.id,
              payload,
            )
          : actionType === 'reject'
            ? await rejectWalletTopUp(
                actionTopUp.id,
                payload,
              )
            : await cancelWalletTopUp(
                actionTopUp.id,
                payload,
              )

      setMessage(result.message)
      setActionOpen(false)
      setActionTopUp(null)

      await loadTopUps(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : `Unable to ${actionType} top-up.`,
      )

      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(
    topUp: WalletTopUp,
  ) {
    const confirmed = window.confirm(
      `Delete top-up request #${topUp.id}?\n\nOnly pending requests should be deleted.`,
    )

    if (!confirmed) {
      return
    }

    setProcessingId(topUp.id)
    setMessage('')
    setErrorMessage('')

    try {
      const responseMessage =
        await deleteWalletTopUp(topUp.id)

      setMessage(responseMessage)
      await loadTopUps(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to delete top-up request.',
      )
    } finally {
      setProcessingId(null)
    }
  }

  async function handleRestore(
    topUp: WalletTopUp,
  ) {
    const confirmed = window.confirm(
      `Restore top-up request #${topUp.id}?`,
    )

    if (!confirmed) {
      return
    }

    setProcessingId(topUp.id)
    setMessage('')
    setErrorMessage('')

    try {
      const responseMessage =
        await restoreWalletTopUp(topUp.id)

      setMessage(responseMessage)
      await loadTopUps(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to restore top-up request.',
      )
    } finally {
      setProcessingId(null)
    }
  }

  function clearFilters() {
    setSearchInput('')
    setSearch('')
    setStatus('')
    setPaymentMethod('')
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
              Wallet Management
            </p>

            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
              Wallet Top-Ups
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Review, approve and manage wallet funding
              requests.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void loadTopUps(true)}
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
              onClick={openCreateForm}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Request Top-Up
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
            title="Total Requests"
            count={summary.total_requests}
            amount={summary.total_requested_amount}
            icon={WalletCards}
            iconClass="bg-indigo-50 text-indigo-600"
          />

          <SummaryCard
            title="Pending"
            count={summary.pending_requests}
            amount={summary.pending_amount}
            icon={Clock3}
            iconClass="bg-blue-50 text-blue-600"
          />

          <SummaryCard
            title="Approved"
            count={summary.approved_requests}
            amount={summary.approved_amount}
            icon={CheckCircle2}
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <SummaryCard
            title="Rejected"
            count={summary.rejected_requests}
            amount={summary.rejected_amount}
            icon={XCircle}
            iconClass="bg-red-50 text-red-600"
          />

          <SummaryCard
            title="Cancelled"
            count={summary.cancelled_requests}
            amount={summary.cancelled_amount}
            icon={Ban}
            iconClass="bg-amber-50 text-amber-600"
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="space-y-3 border-b border-slate-200 p-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_190px_210px]">
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
                  placeholder="Search user, reference or notes..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                />
              </div>

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
                <option value="approved">
                  Approved
                </option>
                <option value="rejected">
                  Rejected
                </option>
                <option value="cancelled">
                  Cancelled
                </option>
              </select>

              <select
                value={paymentMethod}
                onChange={(event) =>
                  setPaymentMethod(
                    event.target.value,
                  )
                }
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              >
                <option value="">
                  All payment methods
                </option>
                <option value="mobile_money">
                  Mobile Money
                </option>
                <option value="cash">
                  Cash
                </option>
                <option value="bank_transfer">
                  Bank Transfer
                </option>
                <option value="card">
                  Bank Card
                </option>
                <option value="other">
                  Other
                </option>
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
                  Loading wallet top-ups...
                </p>
              </div>
            </div>
          ) : topUps.length === 0 ? (
            <div className="flex min-h-[390px] items-center justify-center px-6 text-center">
              <div>
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600">
                  <WalletCards className="h-8 w-8" />
                </span>

                <h2 className="mt-5 text-lg font-extrabold text-slate-900">
                  No wallet top-ups found
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Create a wallet top-up request or
                  change the current filters.
                </p>

                <button
                  type="button"
                  onClick={openCreateForm}
                  className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white"
                >
                  <Plus className="h-4 w-4" />
                  Request First Top-Up
                </button>
              </div>
            </div>
          ) : (
            <WalletTopUpTable
              topUps={topUps}
              processingId={processingId}
              onView={(topUp) =>
                void handleView(topUp)
              }
              onEdit={openEditForm}
              onDelete={(topUp) =>
                void handleDelete(topUp)
              }
              onRestore={(topUp) =>
                void handleRestore(topUp)
              }
              onApprove={(topUp) =>
                openAction(topUp, 'approve')
              }
              onReject={(topUp) =>
                openAction(topUp, 'reject')
              }
              onCancel={(topUp) =>
                openAction(topUp, 'cancel')
              }
            />
          )}
        </section>
      </div>

      <WalletTopUpFormModal
        isOpen={formOpen}
        topUp={editingTopUp}
        isSubmitting={isSubmitting}
        onClose={() => {
          if (!isSubmitting) {
            setFormOpen(false)
            setEditingTopUp(null)
          }
        }}
        onSubmit={handleFormSubmit}
      />

      <WalletTopUpActionModal
        isOpen={actionOpen}
        type={actionType}
        topUp={actionTopUp}
        isSubmitting={isSubmitting}
        onClose={() => {
          if (!isSubmitting) {
            setActionOpen(false)
            setActionTopUp(null)
          }
        }}
        onSubmit={handleAction}
      />

      <WalletTopUpDetailsModal
        isOpen={detailsOpen}
        topUp={detailsTopUp}
        isLoading={detailsLoading}
        errorMessage={detailsError}
        onClose={() => {
          setDetailsOpen(false)
          setDetailsTopUp(null)
          setDetailsError('')
        }}
      />
    </>
  )
}

interface SummaryCardProps {
  title: string
  count: number
  amount: number
  icon: typeof WalletCards
  iconClass: string
}

function SummaryCard({
  title,
  count,
  amount,
  icon: Icon,
  iconClass,
}: SummaryCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-extrabold text-slate-950">
            {count}
          </p>

          <p className="mt-1 truncate text-xs font-semibold text-slate-400">
            {new Intl.NumberFormat('en-US', {
              maximumFractionDigits: 0,
            }).format(amount)}{' '}
            RWF
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
