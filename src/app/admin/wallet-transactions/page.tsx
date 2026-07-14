'use client'

import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  WalletCards,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useState,
} from 'react'
import WalletTransactionDetailsModal from '@/components/admin/wallet-transactions/WalletTransactionDetailsModal'
import WalletTransactionFormModal from '@/components/admin/wallet-transactions/WalletTransactionFormModal'
import WalletTransactionTable from '@/components/admin/wallet-transactions/WalletTransactionTable'
import { getUsers } from '@/services/user.service'
import {
  createWalletTransaction,
  deleteWalletTransaction,
  getWalletTransaction,
  getWalletTransactions,
  getWalletTransactionSummary,
  restoreWalletTransaction,
  updateWalletTransaction,
} from '@/services/wallet-transaction.service'
import type { AppUser } from '@/types/app-user'
import type {
  WalletTransaction,
  WalletTransactionPayload,
  WalletTransactionSummary,
  WalletTransactionUpdatePayload,
} from '@/types/wallet-transaction'

const emptySummary: WalletTransactionSummary = {
  total_transactions: 0,
  credit_transactions: 0,
  debit_transactions: 0,
  adjustment_transactions: 0,
  total_credit_amount: 0,
  total_debit_amount: 0,
  net_amount: 0,
}

export default function WalletTransactionsPage() {
  const [transactions, setTransactions] =
    useState<WalletTransaction[]>([])

  const [users, setUsers] =
    useState<AppUser[]>([])

  const [summary, setSummary] =
    useState<WalletTransactionSummary>(
      emptySummary,
    )

  const [searchInput, setSearchInput] =
    useState('')
  const [search, setSearch] = useState('')
  const [transactionType, setTransactionType] =
    useState('')
  const [userId, setUserId] = useState('')
  const [status, setStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [includeDeleted, setIncludeDeleted] =
    useState(false)

  const [isLoading, setIsLoading] =
    useState(true)
  const [isRefreshing, setIsRefreshing] =
    useState(false)
  const [isLoadingUsers, setIsLoadingUsers] =
    useState(true)
  const [isSubmitting, setIsSubmitting] =
    useState(false)

  const [processingId, setProcessingId] =
    useState<number | string | null>(null)

  const [formOpen, setFormOpen] =
    useState(false)

  const [
    editingTransaction,
    setEditingTransaction,
  ] = useState<WalletTransaction | null>(null)

  const [detailsOpen, setDetailsOpen] =
    useState(false)

  const [
    detailsTransaction,
    setDetailsTransaction,
  ] = useState<WalletTransaction | null>(null)

  const [detailsLoading, setDetailsLoading] =
    useState(false)
  const [detailsError, setDetailsError] =
    useState('')

  const [usersError, setUsersError] =
    useState('')
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] =
    useState('')

  const loadUsers = useCallback(
    async () => {
      setIsLoadingUsers(true)
      setUsersError('')

      try {
        const result = await getUsers({
          perPage: 200,
        })

        setUsers(result.users)
      } catch (error) {
        setUsersError(
          error instanceof Error
            ? error.message
            : 'Unable to load users.',
        )
      } finally {
        setIsLoadingUsers(false)
      }
    },
    [],
  )

  const loadTransactions = useCallback(
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
          transactionType,
          userId,
          status,
          dateFrom,
          dateTo,
          includeDeleted,
          perPage: 200,
        }

        const [listResult, summaryResult] =
          await Promise.all([
            getWalletTransactions(filters),
            getWalletTransactionSummary(filters),
          ])

        setTransactions(
          listResult.transactions,
        )

        setSummary(summaryResult)
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to load wallet transactions.',
        )
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [
      search,
      transactionType,
      userId,
      status,
      dateFrom,
      dateTo,
      includeDeleted,
    ],
  )

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  useEffect(() => {
    void loadTransactions()
  }, [loadTransactions])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim())
    }, 400)

    return () => window.clearTimeout(timer)
  }, [searchInput])

  function openCreateForm() {
    setEditingTransaction(null)
    setFormOpen(true)

    if (
      users.length === 0 &&
      !isLoadingUsers
    ) {
      void loadUsers()
    }
  }

  function openEditForm(
    transaction: WalletTransaction,
  ) {
    setEditingTransaction(transaction)
    setFormOpen(true)
  }

  async function handleCreate(
    payload: WalletTransactionPayload,
  ) {
    setIsSubmitting(true)
    setMessage('')
    setErrorMessage('')

    try {
      const result =
        await createWalletTransaction(payload)

      setMessage(result.message)
      setFormOpen(false)

      await Promise.all([
        loadTransactions(true),
        loadUsers(),
      ])
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to create wallet adjustment.',
      )

      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleUpdate(
    payload: WalletTransactionUpdatePayload,
  ) {
    if (!editingTransaction) {
      return
    }

    setIsSubmitting(true)
    setMessage('')
    setErrorMessage('')

    try {
      const result =
        await updateWalletTransaction(
          editingTransaction.id,
          payload,
        )

      setMessage(result.message)
      setFormOpen(false)
      setEditingTransaction(null)

      await loadTransactions(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to update wallet transaction.',
      )

      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleView(
    transaction: WalletTransaction,
  ) {
    setDetailsOpen(true)
    setDetailsLoading(true)
    setDetailsTransaction(null)
    setDetailsError('')

    try {
      const result =
        await getWalletTransaction(
          transaction.id,
        )

      setDetailsTransaction(result)
    } catch (error) {
      setDetailsError(
        error instanceof Error
          ? error.message
          : 'Unable to load transaction details.',
      )
    } finally {
      setDetailsLoading(false)
    }
  }

  async function handleDelete(
    transaction: WalletTransaction,
  ) {
    const confirmed = window.confirm(
      `Delete wallet transaction #${transaction.id}?\n\nDeleting the record may not reverse the wallet balance.`,
    )

    if (!confirmed) {
      return
    }

    setProcessingId(transaction.id)
    setMessage('')
    setErrorMessage('')

    try {
      const responseMessage =
        await deleteWalletTransaction(
          transaction.id,
        )

      setMessage(responseMessage)
      await loadTransactions(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to delete the transaction.',
      )
    } finally {
      setProcessingId(null)
    }
  }

  async function handleRestore(
    transaction: WalletTransaction,
  ) {
    const confirmed = window.confirm(
      `Restore wallet transaction #${transaction.id}?`,
    )

    if (!confirmed) {
      return
    }

    setProcessingId(transaction.id)
    setMessage('')
    setErrorMessage('')

    try {
      const responseMessage =
        await restoreWalletTransaction(
          transaction.id,
        )

      setMessage(responseMessage)
      await loadTransactions(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to restore the transaction.',
      )
    } finally {
      setProcessingId(null)
    }
  }

  function clearFilters() {
    setSearchInput('')
    setSearch('')
    setTransactionType('')
    setUserId('')
    setStatus('')
    setDateFrom('')
    setDateTo('')
    setIncludeDeleted(false)
  }

  function getUserFilterLabel(
    user: AppUser,
  ): string {
    return user.email
      ? `${user.name} — ${user.email}`
      : user.name
  }

  function formatAmount(
    amount: number,
  ): string {
    return `${new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(amount)} RWF`
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
              Wallet Transactions
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Track credits, debits, payments, top-ups
              and manual wallet adjustments.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                void Promise.all([
                  loadTransactions(true),
                  loadUsers(),
                ])
              }}
              disabled={
                isRefreshing ||
                isLoadingUsers
              }
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
            >
              {isRefreshing ||
              isLoadingUsers ? (
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
              Manual Adjustment
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

        {usersError && !formOpen && (
          <div className="flex items-start justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

              <span>
                Users could not be loaded:
                {' '}
                {usersError}
              </span>
            </div>

            <button
              type="button"
              onClick={() => void loadUsers()}
              className="shrink-0 font-bold underline"
            >
              Retry
            </button>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total Transactions"
            value={String(
              summary.total_transactions,
            )}
            subtitle={`${summary.adjustment_transactions} adjustments`}
            icon={WalletCards}
            iconClass="bg-indigo-50 text-indigo-600"
          />

          <SummaryCard
            title="Total Credits"
            value={formatAmount(
              summary.total_credit_amount,
            )}
            subtitle={`${summary.credit_transactions} credit transactions`}
            icon={ArrowDownLeft}
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <SummaryCard
            title="Total Debits"
            value={formatAmount(
              summary.total_debit_amount,
            )}
            subtitle={`${summary.debit_transactions} debit transactions`}
            icon={ArrowUpRight}
            iconClass="bg-red-50 text-red-600"
          />

          <SummaryCard
            title="Net Wallet Change"
            value={formatAmount(
              summary.net_amount,
            )}
            subtitle="Credits minus debits"
            icon={RefreshCw}
            iconClass={
              summary.net_amount >= 0
                ? 'bg-blue-50 text-blue-600'
                : 'bg-amber-50 text-amber-600'
            }
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="space-y-3 border-b border-slate-200 p-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_190px_260px_180px]">
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
                  placeholder="Search description, user or reference..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                />
              </div>

              <select
                value={transactionType}
                onChange={(event) =>
                  setTransactionType(
                    event.target.value,
                  )
                }
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              >
                <option value="">
                  All transaction types
                </option>
                <option value="credit">
                  Credit
                </option>
                <option value="debit">
                  Debit
                </option>
                <option value="adjustment">
                  Adjustment
                </option>
                <option value="top_up">
                  Top-Up
                </option>
                <option value="payment">
                  Payment
                </option>
                <option value="refund">
                  Refund
                </option>
              </select>

              <select
                value={userId}
                onChange={(event) =>
                  setUserId(event.target.value)
                }
                disabled={isLoadingUsers}
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 disabled:opacity-60"
              >
                <option value="">
                  {isLoadingUsers
                    ? 'Loading users...'
                    : 'All users'}
                </option>

                {users
                  .filter(
                    (user) => !user.deleted_at,
                  )
                  .sort((first, second) =>
                    first.name.localeCompare(
                      second.name,
                    ),
                  )
                  .map((user) => (
                    <option
                      key={user.id}
                      value={String(user.id)}
                    >
                      {getUserFilterLabel(user)}
                    </option>
                  ))}
              </select>

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
                <option value="completed">
                  Completed
                </option>
                <option value="pending">
                  Pending
                </option>
                <option value="failed">
                  Failed
                </option>
                <option value="reversed">
                  Reversed
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
                  Loading wallet transactions...
                </p>
              </div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex min-h-[390px] items-center justify-center px-6 text-center">
              <div>
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600">
                  <WalletCards className="h-8 w-8" />
                </span>

                <h2 className="mt-5 text-lg font-extrabold text-slate-900">
                  No wallet transactions found
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Transactions will appear after wallet
                  top-ups, orders, refunds or manual
                  adjustments.
                </p>

                <button
                  type="button"
                  onClick={openCreateForm}
                  className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white"
                >
                  <Plus className="h-4 w-4" />
                  Create Manual Adjustment
                </button>
              </div>
            </div>
          ) : (
            <WalletTransactionTable
              transactions={transactions}
              processingId={processingId}
              onView={(transaction) =>
                void handleView(transaction)
              }
              onEdit={openEditForm}
              onDelete={(transaction) =>
                void handleDelete(transaction)
              }
              onRestore={(transaction) =>
                void handleRestore(transaction)
              }
            />
          )}
        </section>
      </div>

      <WalletTransactionFormModal
        isOpen={formOpen}
        transaction={editingTransaction}
        users={users}
        isLoadingUsers={isLoadingUsers}
        usersError={usersError}
        isSubmitting={isSubmitting}
        onRefreshUsers={loadUsers}
        onClose={() => {
          if (!isSubmitting) {
            setFormOpen(false)
            setEditingTransaction(null)
          }
        }}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />

      <WalletTransactionDetailsModal
        isOpen={detailsOpen}
        transaction={detailsTransaction}
        isLoading={detailsLoading}
        errorMessage={detailsError}
        onClose={() => {
          setDetailsOpen(false)
          setDetailsTransaction(null)
          setDetailsError('')
        }}
      />
    </>
  )
}

interface SummaryCardProps {
  title: string
  value: string
  subtitle: string
  icon: typeof WalletCards
  iconClass: string
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClass,
}: SummaryCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">
            {title}
          </p>

          <p className="mt-2 truncate text-2xl font-extrabold text-slate-950">
            {value}
          </p>

          <p className="mt-1 truncate text-xs text-slate-400">
            {subtitle}
          </p>
        </div>

        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}
        >
          <Icon className="h-6 w-6" />
        </span>
      </div>
    </article>
  )
}
