'use client'

import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  EyeOff,
  LoaderCircle,
  PackageSearch,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  TriangleAlert,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useState,
} from 'react'
import LowStockAlertActionModal, {
  type LowStockAlertActionType,
} from '@/components/admin/low-stock-alerts/LowStockAlertActionModal'
import LowStockAlertDetailsModal from '@/components/admin/low-stock-alerts/LowStockAlertDetailsModal'
import LowStockAlertFormModal from '@/components/admin/low-stock-alerts/LowStockAlertFormModal'
import LowStockAlertTable from '@/components/admin/low-stock-alerts/LowStockAlertTable'
import {
  createLowStockAlert,
  deleteLowStockAlert,
  dismissLowStockAlert,
  generateLowStockAlerts,
  getLowStockAlert,
  getLowStockAlerts,
  getLowStockAlertSummary,
  getLowStockInventoryOptions,
  resolveLowStockAlert,
  restoreLowStockAlert,
  updateLowStockAlert,
} from '@/services/low-stock-alert.service'
import type {
  DismissLowStockAlertPayload,
  InventoryStockOption,
  LowStockAlert,
  LowStockAlertPayload,
  LowStockAlertSummary,
  ResolveLowStockAlertPayload,
} from '@/types/low-stock-alert'

type ActionPayload =
  | ResolveLowStockAlertPayload
  | DismissLowStockAlertPayload

const emptySummary: LowStockAlertSummary = {
  total_alerts: 0,
  active_alerts: 0,
  critical_alerts: 0,
  warning_alerts: 0,
  resolved_alerts: 0,
  dismissed_alerts: 0,
  today_alerts: 0,
  affected_items: 0,
}

export default function LowStockAlertsPage() {
  const [alerts, setAlerts] =
    useState<LowStockAlert[]>([])

  const [inventoryStocks, setInventoryStocks] =
    useState<InventoryStockOption[]>([])

  const [summary, setSummary] =
    useState<LowStockAlertSummary>(
      emptySummary,
    )

  const [searchInput, setSearchInput] =
    useState('')

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [severity, setSeverity] = useState('')

  const [
    inventoryStockId,
    setInventoryStockId,
  ] = useState('')

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

  const [isLoadingStocks, setIsLoadingStocks] =
    useState(true)

  const [isGenerating, setIsGenerating] =
    useState(false)

  const [isSubmitting, setIsSubmitting] =
    useState(false)

  const [processingId, setProcessingId] =
    useState<number | string | null>(null)

  const [formOpen, setFormOpen] =
    useState(false)

  const [editingAlert, setEditingAlert] =
    useState<LowStockAlert | null>(null)

  const [detailsOpen, setDetailsOpen] =
    useState(false)

  const [detailsAlert, setDetailsAlert] =
    useState<LowStockAlert | null>(null)

  const [detailsLoading, setDetailsLoading] =
    useState(false)

  const [detailsError, setDetailsError] =
    useState('')

  const [actionOpen, setActionOpen] =
    useState(false)

  const [actionType, setActionType] =
    useState<LowStockAlertActionType>(
      'resolve',
    )

  const [actionAlert, setActionAlert] =
    useState<LowStockAlert | null>(null)

  const [stockError, setStockError] =
    useState('')

  const [message, setMessage] =
    useState('')

  const [errorMessage, setErrorMessage] =
    useState('')

  const loadInventoryStocks =
    useCallback(async () => {
      setIsLoadingStocks(true)
      setStockError('')

      try {
        setInventoryStocks(
          await getLowStockInventoryOptions(),
        )
      } catch (error) {
        setStockError(
          error instanceof Error
            ? error.message
            : 'Unable to load inventory stocks.',
        )
      } finally {
        setIsLoadingStocks(false)
      }
    }, [])

  const loadAlerts = useCallback(
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
          severity,
          inventoryStockId,
          dateFrom,
          dateTo,
          includeDeleted,
          perPage: 200,
        }

        const [
          listResult,
          summaryResult,
        ] = await Promise.all([
          getLowStockAlerts(filters),
          getLowStockAlertSummary(filters),
        ])

        setAlerts(listResult.alerts)
        setSummary(summaryResult)
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to load low-stock alerts.',
        )
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [
      search,
      status,
      severity,
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
    void loadAlerts()
  }, [loadAlerts])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim())
    }, 400)

    return () =>
      window.clearTimeout(timer)
  }, [searchInput])

  function openCreateForm() {
    setEditingAlert(null)
    setFormOpen(true)
  }

  function openEditForm(
    alert: LowStockAlert,
  ) {
    setEditingAlert(alert)
    setFormOpen(true)
  }

  async function handleFormSubmit(
    payload: LowStockAlertPayload,
  ) {
    setIsSubmitting(true)
    setMessage('')
    setErrorMessage('')

    try {
      const result = editingAlert
        ? await updateLowStockAlert(
            editingAlert.id,
            payload,
          )
        : await createLowStockAlert(payload)

      setMessage(result.message)
      setFormOpen(false)
      setEditingAlert(null)

      await Promise.all([
        loadAlerts(true),
        loadInventoryStocks(),
      ])
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to save the alert.',
      )

      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleGenerate() {
    const confirmed = window.confirm(
      'Scan all inventory stocks and automatically generate alerts for items below their minimum threshold?',
    )

    if (!confirmed) {
      return
    }

    setIsGenerating(true)
    setMessage('')
    setErrorMessage('')

    try {
      const result =
        await generateLowStockAlerts()

      setMessage(
        result.generated_count > 0
          ? `${result.message} ${result.generated_count} new alert(s) created.`
          : result.message,
      )

      await Promise.all([
        loadAlerts(true),
        loadInventoryStocks(),
      ])
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to generate low-stock alerts.',
      )
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleView(
    alert: LowStockAlert,
  ) {
    setDetailsOpen(true)
    setDetailsLoading(true)
    setDetailsAlert(null)
    setDetailsError('')

    try {
      setDetailsAlert(
        await getLowStockAlert(alert.id),
      )
    } catch (error) {
      setDetailsError(
        error instanceof Error
          ? error.message
          : 'Unable to load alert details.',
      )
    } finally {
      setDetailsLoading(false)
    }
  }

  function openAction(
    alert: LowStockAlert,
    type: LowStockAlertActionType,
  ) {
    setActionAlert(alert)
    setActionType(type)
    setActionOpen(true)
  }

  async function handleAction(
    payload: ActionPayload,
  ) {
    if (!actionAlert) {
      return
    }

    setIsSubmitting(true)
    setMessage('')
    setErrorMessage('')

    try {
      const result =
        actionType === 'resolve'
          ? await resolveLowStockAlert(
              actionAlert.id,
              payload as ResolveLowStockAlertPayload,
            )
          : await dismissLowStockAlert(
              actionAlert.id,
              payload as DismissLowStockAlertPayload,
            )

      setMessage(result.message)
      setActionOpen(false)
      setActionAlert(null)

      await loadAlerts(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to process the alert.',
      )

      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(
    alert: LowStockAlert,
  ) {
    const confirmed = window.confirm(
      `Delete low-stock alert #${alert.id}?`,
    )

    if (!confirmed) {
      return
    }

    setProcessingId(alert.id)
    setMessage('')
    setErrorMessage('')

    try {
      setMessage(
        await deleteLowStockAlert(alert.id),
      )

      await loadAlerts(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to delete the alert.',
      )
    } finally {
      setProcessingId(null)
    }
  }

  async function handleRestore(
    alert: LowStockAlert,
  ) {
    const confirmed = window.confirm(
      `Restore low-stock alert #${alert.id}?`,
    )

    if (!confirmed) {
      return
    }

    setProcessingId(alert.id)
    setMessage('')
    setErrorMessage('')

    try {
      setMessage(
        await restoreLowStockAlert(alert.id),
      )

      await loadAlerts(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to restore the alert.',
      )
    } finally {
      setProcessingId(null)
    }
  }

  function clearFilters() {
    setSearchInput('')
    setSearch('')
    setStatus('')
    setSeverity('')
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
              Inventory Monitoring
            </p>

            <h1 className="mt-2 text-2xl font-extrabold text-slate-950 sm:text-3xl">
              Low-Stock Alerts
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Detect inventory shortages, resolve
              restocked items and dismiss unnecessary
              alerts.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                void handleGenerate()
              }
              disabled={isGenerating}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-amber-500 px-4 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-50"
            >
              {isGenerating ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}

              Generate Alerts
            </button>

            <button
              type="button"
              onClick={() =>
                void Promise.all([
                  loadAlerts(true),
                  loadInventoryStocks(),
                ])
              }
              disabled={
                isRefreshing ||
                isLoadingStocks
              }
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              {isRefreshing ||
              isLoadingStocks ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}

              Refresh
            </button>

            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Manual Alert
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

        {stockError && !formOpen && (
          <div className="flex items-start justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            <span>
              Inventory stocks could not be loaded:
              {' '}
              {stockError}
            </span>

            <button
              type="button"
              onClick={() =>
                void loadInventoryStocks()
              }
              className="shrink-0 font-bold underline"
            >
              Retry
            </button>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-7">
          <SummaryCard
            title="Total Alerts"
            value={summary.total_alerts}
            subtitle={`${summary.today_alerts} today`}
            icon={BellRing}
            iconClass="bg-indigo-50 text-indigo-600"
          />

          <SummaryCard
            title="Active"
            value={summary.active_alerts}
            icon={AlertTriangle}
            iconClass="bg-amber-50 text-amber-600"
          />

          <SummaryCard
            title="Critical"
            value={summary.critical_alerts}
            icon={TriangleAlert}
            iconClass="bg-red-50 text-red-600"
          />

          <SummaryCard
            title="Warnings"
            value={summary.warning_alerts}
            icon={AlertTriangle}
            iconClass="bg-orange-50 text-orange-600"
          />

          <SummaryCard
            title="Resolved"
            value={summary.resolved_alerts}
            icon={CheckCircle2}
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <SummaryCard
            title="Dismissed"
            value={summary.dismissed_alerts}
            icon={EyeOff}
            iconClass="bg-slate-100 text-slate-600"
          />

          <SummaryCard
            title="Affected Items"
            value={summary.affected_items}
            icon={PackageSearch}
            iconClass="bg-blue-50 text-blue-600"
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="space-y-3 border-b border-slate-200 p-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_180px_180px_280px]">
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
                  placeholder="Search food item, code, message or notes..."
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

                <option value="active">
                  Active
                </option>

                <option value="resolved">
                  Resolved
                </option>

                <option value="dismissed">
                  Dismissed
                </option>
              </select>

              <select
                value={severity}
                onChange={(event) =>
                  setSeverity(event.target.value)
                }
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400"
              >
                <option value="">
                  All severities
                </option>

                <option value="critical">
                  Critical
                </option>

                <option value="warning">
                  Warning
                </option>

                <option value="low">
                  Low
                </option>
              </select>

              <select
                value={inventoryStockId}
                onChange={(event) =>
                  setInventoryStockId(
                    event.target.value,
                  )
                }
                disabled={isLoadingStocks}
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 disabled:opacity-50"
              >
                <option value="">
                  {isLoadingStocks
                    ? 'Loading inventory...'
                    : 'All inventory stocks'}
                </option>

                {inventoryStocks.map(
                  (stock) => (
                    <option
                      key={stock.id}
                      value={String(stock.id)}
                    >
                      {stock.food_item?.name ??
                       stock.foodItem?.name ??
                       `Inventory stock #${stock.id}`}
                    </option>
                  ),
                )}
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
                  Loading low-stock alerts...
                </p>
              </div>
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex min-h-[390px] items-center justify-center px-6 text-center">
              <div>
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-8 w-8" />
                </span>

                <h2 className="mt-5 text-lg font-extrabold text-slate-900">
                  No low-stock alerts found
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Generate alerts to scan the inventory
                  and identify items below their minimum
                  stock level.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    void handleGenerate()
                  }
                  className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-amber-500 px-5 text-sm font-bold text-white"
                >
                  <Sparkles className="h-4 w-4" />
                  Generate Alerts
                </button>
              </div>
            </div>
          ) : (
            <LowStockAlertTable
              alerts={alerts}
              processingId={processingId}
              onView={(alert) =>
                void handleView(alert)
              }
              onEdit={openEditForm}
              onResolve={(alert) =>
                openAction(alert, 'resolve')
              }
              onDismiss={(alert) =>
                openAction(alert, 'dismiss')
              }
              onDelete={(alert) =>
                void handleDelete(alert)
              }
              onRestore={(alert) =>
                void handleRestore(alert)
              }
            />
          )}
        </section>
      </div>

      <LowStockAlertFormModal
        isOpen={formOpen}
        alert={editingAlert}
        inventoryStocks={inventoryStocks}
        isLoadingStocks={isLoadingStocks}
        stockError={stockError}
        isSubmitting={isSubmitting}
        onRefreshStocks={loadInventoryStocks}
        onClose={() => {
          if (!isSubmitting) {
            setFormOpen(false)
            setEditingAlert(null)
          }
        }}
        onSubmit={handleFormSubmit}
      />

      <LowStockAlertActionModal
        isOpen={actionOpen}
        type={actionType}
        alert={actionAlert}
        isSubmitting={isSubmitting}
        onClose={() => {
          if (!isSubmitting) {
            setActionOpen(false)
            setActionAlert(null)
          }
        }}
        onSubmit={handleAction}
      />

      <LowStockAlertDetailsModal
        isOpen={detailsOpen}
        alert={detailsAlert}
        isLoading={detailsLoading}
        errorMessage={detailsError}
        onClose={() => {
          setDetailsOpen(false)
          setDetailsAlert(null)
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
  icon: LucideIcon
  iconClass: string
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
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
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </article>
  )
}
