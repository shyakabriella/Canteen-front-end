'use client'

import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  FilePlus2,
  Info,
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  UserRound,
  UsersRound,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useState,
} from 'react'
import ActivityLogDetailsModal from '@/components/admin/activity-logs/ActivityLogDetailsModal'
import ActivityLogFormModal from '@/components/admin/activity-logs/ActivityLogFormModal'
import ActivityLogTable from '@/components/admin/activity-logs/ActivityLogTable'
import {
  createActivityLog,
  deleteActivityLog,
  getActivityLog,
  getActivityLogs,
  getActivityLogSummary,
  restoreActivityLog,
} from '@/services/activity-log.service'
import type {
  ActivityLog,
  ActivityLogPayload,
  ActivityLogSummary,
} from '@/types/activity-log'

const emptySummary: ActivityLogSummary = {
  total_logs: 0,
  today_logs: 0,
  user_actions: 0,
  system_actions: 0,
  successful_actions: 0,
  failed_actions: 0,
  warning_actions: 0,
  deleted_logs: 0,
  unique_users: 0,
}

export default function ActivityLogsPage() {
  const [logs, setLogs] =
    useState<ActivityLog[]>([])

  const [summary, setSummary] =
    useState<ActivityLogSummary>(
      emptySummary,
    )

  const [searchInput, setSearchInput] =
    useState('')

  const [search, setSearch] = useState('')
  const [action, setAction] = useState('')
  const [moduleName, setModuleName] =
    useState('')
  const [status, setStatus] = useState('')
  const [userId, setUserId] = useState('')
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

  const [formOpen, setFormOpen] =
    useState(false)

  const [detailsOpen, setDetailsOpen] =
    useState(false)

  const [detailsLog, setDetailsLog] =
    useState<ActivityLog | null>(null)

  const [detailsLoading, setDetailsLoading] =
    useState(false)

  const [detailsError, setDetailsError] =
    useState('')

  const [message, setMessage] =
    useState('')

  const [errorMessage, setErrorMessage] =
    useState('')

  const loadLogs = useCallback(
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
          action,
          module: moduleName,
          status,
          userId,
          dateFrom,
          dateTo,
          includeDeleted,
          perPage: 200,
        }

        const [list, summaryResult] =
          await Promise.all([
            getActivityLogs(filters),
            getActivityLogSummary(filters),
          ])

        setLogs(list.logs)
        setSummary(summaryResult)
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to load activity logs.',
        )
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [
      search,
      action,
      moduleName,
      status,
      userId,
      dateFrom,
      dateTo,
      includeDeleted,
    ],
  )

  useEffect(() => {
    void loadLogs()
  }, [loadLogs])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim())
    }, 400)

    return () =>
      window.clearTimeout(timer)
  }, [searchInput])

  async function handleCreate(
    payload: ActivityLogPayload,
  ) {
    setIsSubmitting(true)
    setMessage('')
    setErrorMessage('')

    try {
      const result =
        await createActivityLog(payload)

      setMessage(result.message)
      setFormOpen(false)

      await loadLogs(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to create activity log.',
      )

      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleView(
    log: ActivityLog,
  ) {
    setDetailsOpen(true)
    setDetailsLoading(true)
    setDetailsLog(null)
    setDetailsError('')

    try {
      setDetailsLog(
        await getActivityLog(log.id),
      )
    } catch (error) {
      setDetailsError(
        error instanceof Error
          ? error.message
          : 'Unable to load log details.',
      )
    } finally {
      setDetailsLoading(false)
    }
  }

  async function handleDelete(
    log: ActivityLog,
  ) {
    const confirmed = window.confirm(
      `Delete activity log #${log.id}?`,
    )

    if (!confirmed) {
      return
    }

    setProcessingId(log.id)
    setMessage('')
    setErrorMessage('')

    try {
      setMessage(
        await deleteActivityLog(log.id),
      )

      await loadLogs(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to delete activity log.',
      )
    } finally {
      setProcessingId(null)
    }
  }

  async function handleRestore(
    log: ActivityLog,
  ) {
    const confirmed = window.confirm(
      `Restore activity log #${log.id}?`,
    )

    if (!confirmed) {
      return
    }

    setProcessingId(log.id)
    setMessage('')
    setErrorMessage('')

    try {
      setMessage(
        await restoreActivityLog(log.id),
      )

      await loadLogs(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to restore activity log.',
      )
    } finally {
      setProcessingId(null)
    }
  }

  function clearFilters() {
    setSearchInput('')
    setSearch('')
    setAction('')
    setModuleName('')
    setStatus('')
    setUserId('')
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
              System Auditing
            </p>

            <h1 className="mt-2 text-2xl font-extrabold text-slate-950 sm:text-3xl">
              Activity Logs
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Review user actions, system events,
              requests and changed records.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                void loadLogs(true)
              }
              disabled={isRefreshing}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 disabled:opacity-50"
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
              onClick={() => setFormOpen(true)}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700"
            >
              <FilePlus2 className="h-4 w-4" />
              Manual Log
            </button>
          </div>
        </section>

        {message && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            {message}
          </div>
        )}

        {errorMessage && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-7">
          <SummaryCard
            title="Total Logs"
            value={summary.total_logs}
            subtitle={`${summary.today_logs} today`}
            icon={Info}
          />

          <SummaryCard
            title="User Actions"
            value={summary.user_actions}
            icon={UserRound}
          />

          <SummaryCard
            title="System Actions"
            value={summary.system_actions}
            icon={Bot}
          />

          <SummaryCard
            title="Successful"
            value={summary.successful_actions}
            icon={CheckCircle2}
          />

          <SummaryCard
            title="Failed"
            value={summary.failed_actions}
            icon={ShieldAlert}
          />

          <SummaryCard
            title="Unique Users"
            value={summary.unique_users}
            icon={UsersRound}
          />

          <SummaryCard
            title="Deleted"
            value={summary.deleted_logs}
            icon={Trash2}
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="space-y-3 border-b border-slate-200 p-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_180px_180px_180px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  value={searchInput}
                  onChange={(event) =>
                    setSearchInput(
                      event.target.value,
                    )
                  }
                  placeholder="Search action, actor, description or IP..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-indigo-400"
                />
              </div>

              <select
                value={action}
                onChange={(event) =>
                  setAction(event.target.value)
                }
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm"
              >
                <option value="">
                  All actions
                </option>
                <option value="created">
                  Created
                </option>
                <option value="updated">
                  Updated
                </option>
                <option value="deleted">
                  Deleted
                </option>
                <option value="restored">
                  Restored
                </option>
                <option value="approved">
                  Approved
                </option>
                <option value="rejected">
                  Rejected
                </option>
                <option value="login">
                  Login
                </option>
                <option value="logout">
                  Logout
                </option>
              </select>

              <input
                value={moduleName}
                onChange={(event) =>
                  setModuleName(
                    event.target.value,
                  )
                }
                placeholder="Module"
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm"
              />

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
                <option value="success">
                  Success
                </option>
                <option value="failed">
                  Failed
                </option>
                <option value="warning">
                  Warning
                </option>
                <option value="info">
                  Information
                </option>
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[160px_190px_190px_auto_auto]">
              <input
                value={userId}
                onChange={(event) =>
                  setUserId(event.target.value)
                }
                placeholder="User ID"
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm"
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
          ) : logs.length === 0 ? (
            <div className="flex min-h-96 items-center justify-center px-6 text-center">
              <div>
                <Info className="mx-auto h-14 w-14 text-indigo-200" />

                <h2 className="mt-4 text-lg font-extrabold text-slate-900">
                  No activity logs found
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  System and user activities will
                  appear here when actions are recorded.
                </p>
              </div>
            </div>
          ) : (
            <ActivityLogTable
              logs={logs}
              processingId={processingId}
              onView={(log) =>
                void handleView(log)
              }
              onDelete={(log) =>
                void handleDelete(log)
              }
              onRestore={(log) =>
                void handleRestore(log)
              }
            />
          )}
        </section>
      </div>

      <ActivityLogFormModal
        isOpen={formOpen}
        isSubmitting={isSubmitting}
        onClose={() => {
          if (!isSubmitting) {
            setFormOpen(false)
          }
        }}
        onSubmit={handleCreate}
      />

      <ActivityLogDetailsModal
        isOpen={detailsOpen}
        log={detailsLog}
        isLoading={detailsLoading}
        errorMessage={detailsError}
        onClose={() => {
          setDetailsOpen(false)
          setDetailsLog(null)
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
}: {
  title: string
  value: number
  subtitle?: string
  icon: LucideIcon
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-extrabold text-slate-950">
            {value}
          </p>

          {subtitle && (
            <p className="mt-1 text-xs text-slate-400">
              {subtitle}
            </p>
          )}
        </div>

        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </article>
  )
}
