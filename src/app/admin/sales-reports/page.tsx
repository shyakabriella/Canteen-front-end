'use client'

import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  LoaderCircle,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
  Sparkles,
  Undo2,
  WalletCards,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useState,
} from 'react'
import SalesReportActionModal, {
  type SalesReportActionType,
} from '@/components/admin/sales-reports/SalesReportActionModal'
import SalesReportDetailsModal from '@/components/admin/sales-reports/SalesReportDetailsModal'
import SalesReportFormModal, {
  type SalesReportFormMode,
} from '@/components/admin/sales-reports/SalesReportFormModal'
import SalesReportTable from '@/components/admin/sales-reports/SalesReportTable'
import {
  createSalesReport,
  deleteSalesReport,
  finalizeSalesReport,
  generateSalesReport,
  getSalesReport,
  getSalesReports,
  getSalesReportSummary,
  regenerateSalesReport,
  restoreSalesReport,
  updateSalesReport,
} from '@/services/sales-report.service'
import type {
  FinalizeSalesReportPayload,
  RegenerateSalesReportPayload,
  SalesReport,
  SalesReportPayload,
  SalesReportSummary,
} from '@/types/sales-report'

type ActionPayload =
  | RegenerateSalesReportPayload
  | FinalizeSalesReportPayload

const emptySummary: SalesReportSummary = {
  total_reports: 0,
  draft_reports: 0,
  finalized_reports: 0,
  total_orders: 0,
  completed_orders: 0,
  cancelled_orders: 0,
  total_items_sold: 0,
  gross_sales: 0,
  net_sales: 0,
  total_refunds: 0,
  average_order_value: 0,
}

export default function SalesReportsPage() {
  const [reports, setReports] =
    useState<SalesReport[]>([])

  const [summary, setSummary] =
    useState<SalesReportSummary>(
      emptySummary,
    )

  const [searchInput, setSearchInput] =
    useState('')

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [reportType, setReportType] =
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
  const [isSubmitting, setIsSubmitting] =
    useState(false)

  const [processingId, setProcessingId] =
    useState<number | string | null>(null)

  const [formOpen, setFormOpen] =
    useState(false)
  const [formMode, setFormMode] =
    useState<SalesReportFormMode>('generate')
  const [editingReport, setEditingReport] =
    useState<SalesReport | null>(null)

  const [actionOpen, setActionOpen] =
    useState(false)
  const [actionType, setActionType] =
    useState<SalesReportActionType>(
      'regenerate',
    )
  const [actionReport, setActionReport] =
    useState<SalesReport | null>(null)

  const [detailsOpen, setDetailsOpen] =
    useState(false)
  const [detailsReport, setDetailsReport] =
    useState<SalesReport | null>(null)
  const [detailsLoading, setDetailsLoading] =
    useState(false)
  const [detailsError, setDetailsError] =
    useState('')

  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] =
    useState('')

  const loadReports = useCallback(
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
          reportType,
          dateFrom,
          dateTo,
          includeDeleted,
          perPage: 200,
        }

        const [list, summaryResult] =
          await Promise.all([
            getSalesReports(filters),
            getSalesReportSummary(filters),
          ])

        setReports(list.reports)
        setSummary(summaryResult)
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to load sales reports.',
        )
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [
      search,
      status,
      reportType,
      dateFrom,
      dateTo,
      includeDeleted,
    ],
  )

  useEffect(() => {
    void loadReports()
  }, [loadReports])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim())
    }, 400)

    return () =>
      window.clearTimeout(timer)
  }, [searchInput])

  function openGenerateForm() {
    setFormMode('generate')
    setEditingReport(null)
    setFormOpen(true)
  }

  function openCreateForm() {
    setFormMode('create')
    setEditingReport(null)
    setFormOpen(true)
  }

  function openEditForm(
    report: SalesReport,
  ) {
    setFormMode('edit')
    setEditingReport(report)
    setFormOpen(true)
  }

  async function handleFormSubmit(
    payload: SalesReportPayload,
  ) {
    setIsSubmitting(true)
    setMessage('')
    setErrorMessage('')

    try {
      const result =
        formMode === 'generate'
          ? await generateSalesReport(payload)
          : formMode === 'edit' &&
              editingReport
            ? await updateSalesReport(
                editingReport.id,
                payload,
              )
            : await createSalesReport(payload)

      setMessage(result.message)
      setFormOpen(false)
      setEditingReport(null)

      await loadReports(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to save the sales report.',
      )

      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleView(
    report: SalesReport,
  ) {
    setDetailsOpen(true)
    setDetailsLoading(true)
    setDetailsReport(null)
    setDetailsError('')

    try {
      setDetailsReport(
        await getSalesReport(report.id),
      )
    } catch (error) {
      setDetailsError(
        error instanceof Error
          ? error.message
          : 'Unable to load sales report details.',
      )
    } finally {
      setDetailsLoading(false)
    }
  }

  function openAction(
    report: SalesReport,
    type: SalesReportActionType,
  ) {
    setActionReport(report)
    setActionType(type)
    setActionOpen(true)
  }

  async function handleAction(
    payload: ActionPayload,
  ) {
    if (!actionReport) {
      return
    }

    setIsSubmitting(true)
    setMessage('')
    setErrorMessage('')

    try {
      const responseMessage =
        actionType === 'regenerate'
          ? await regenerateSalesReport(
              actionReport.id,
              payload as RegenerateSalesReportPayload,
            )
          : await finalizeSalesReport(
              actionReport.id,
              payload as FinalizeSalesReportPayload,
            )

      setMessage(responseMessage)
      setActionOpen(false)
      setActionReport(null)

      await loadReports(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to process the sales report.',
      )

      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(
    report: SalesReport,
  ) {
    const confirmed = window.confirm(
      `Delete sales report #${report.id}?\n\nOnly draft reports should be deleted.`,
    )

    if (!confirmed) {
      return
    }

    setProcessingId(report.id)
    setMessage('')
    setErrorMessage('')

    try {
      setMessage(
        await deleteSalesReport(report.id),
      )

      await loadReports(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to delete the sales report.',
      )
    } finally {
      setProcessingId(null)
    }
  }

  async function handleRestore(
    report: SalesReport,
  ) {
    const confirmed = window.confirm(
      `Restore sales report #${report.id}?`,
    )

    if (!confirmed) {
      return
    }

    setProcessingId(report.id)
    setMessage('')
    setErrorMessage('')

    try {
      setMessage(
        await restoreSalesReport(report.id),
      )

      await loadReports(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to restore the sales report.',
      )
    } finally {
      setProcessingId(null)
    }
  }

  function clearFilters() {
    setSearchInput('')
    setSearch('')
    setStatus('')
    setReportType('')
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
              Financial Reporting
            </p>

            <h1 className="mt-2 text-2xl font-extrabold text-slate-950 sm:text-3xl">
              Sales Reports
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Generate, review and finalize canteen sales
              reports.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                void loadReports(true)
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
              onClick={openCreateForm}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 text-sm font-bold text-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Create Draft
            </button>

            <button
              type="button"
              onClick={openGenerateForm}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white"
            >
              <Sparkles className="h-4 w-4" />
              Generate Report
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

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <SummaryCard
            title="Total Reports"
            value={String(summary.total_reports)}
            subtitle={`${summary.draft_reports} drafts`}
            icon={ClipboardList}
          />

          <SummaryCard
            title="Finalized"
            value={String(
              summary.finalized_reports,
            )}
            icon={CheckCircle2}
          />

          <SummaryCard
            title="Completed Orders"
            value={String(
              summary.completed_orders,
            )}
            subtitle={`${summary.cancelled_orders} cancelled`}
            icon={ShoppingCart}
          />

          <SummaryCard
            title="Items Sold"
            value={String(
              summary.total_items_sold,
            )}
            icon={PackageCheck}
          />

          <SummaryCard
            title="Gross Sales"
            value={formatAmount(
              summary.gross_sales,
            )}
            icon={BarChart3}
          />

          <SummaryCard
            title="Net Sales"
            value={formatAmount(
              summary.net_sales,
            )}
            subtitle={`${formatAmount(summary.total_refunds)} refunded`}
            icon={WalletCards}
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="space-y-3 border-b border-slate-200 p-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_180px_180px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  value={searchInput}
                  onChange={(event) =>
                    setSearchInput(
                      event.target.value,
                    )
                  }
                  placeholder="Search title, report number or notes..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-indigo-400"
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

                <option value="draft">
                  Draft
                </option>

                <option value="finalized">
                  Finalized
                </option>
              </select>

              <select
                value={reportType}
                onChange={(event) =>
                  setReportType(
                    event.target.value,
                  )
                }
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm"
              >
                <option value="">
                  All report types
                </option>

                <option value="daily">
                  Daily
                </option>

                <option value="weekly">
                  Weekly
                </option>

                <option value="monthly">
                  Monthly
                </option>

                <option value="custom">
                  Custom
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
          ) : reports.length === 0 ? (
            <div className="flex min-h-96 items-center justify-center px-6 text-center">
              <div>
                <BarChart3 className="mx-auto h-14 w-14 text-indigo-200" />

                <h2 className="mt-4 text-lg font-extrabold text-slate-900">
                  No sales reports found
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Generate a report from completed orders
                  for a selected sales period.
                </p>

                <button
                  type="button"
                  onClick={openGenerateForm}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white"
                >
                  <Sparkles className="h-4 w-4" />
                  Generate Report
                </button>
              </div>
            </div>
          ) : (
            <SalesReportTable
              reports={reports}
              processingId={processingId}
              onView={(report) =>
                void handleView(report)
              }
              onEdit={openEditForm}
              onRegenerate={(report) =>
                openAction(
                  report,
                  'regenerate',
                )
              }
              onFinalize={(report) =>
                openAction(report, 'finalize')
              }
              onDelete={(report) =>
                void handleDelete(report)
              }
              onRestore={(report) =>
                void handleRestore(report)
              }
            />
          )}
        </section>
      </div>

      <SalesReportFormModal
        isOpen={formOpen}
        mode={formMode}
        report={editingReport}
        isSubmitting={isSubmitting}
        onClose={() => {
          if (!isSubmitting) {
            setFormOpen(false)
            setEditingReport(null)
          }
        }}
        onSubmit={handleFormSubmit}
      />

      <SalesReportActionModal
        isOpen={actionOpen}
        type={actionType}
        report={actionReport}
        isSubmitting={isSubmitting}
        onClose={() => {
          if (!isSubmitting) {
            setActionOpen(false)
            setActionReport(null)
          }
        }}
        onSubmit={handleAction}
      />

      <SalesReportDetailsModal
        isOpen={detailsOpen}
        report={detailsReport}
        isLoading={detailsLoading}
        errorMessage={detailsError}
        onClose={() => {
          setDetailsOpen(false)
          setDetailsReport(null)
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
  value: string
  subtitle?: string
  icon: LucideIcon
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">
            {title}
          </p>

          <p className="mt-2 truncate text-2xl font-extrabold text-slate-950">
            {value}
          </p>

          {subtitle && (
            <p className="mt-1 truncate text-xs text-slate-400">
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
