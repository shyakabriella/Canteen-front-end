'use client'

import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  MapPin,
  MonitorSmartphone,
  RefreshCw,
  ScanLine,
  Search,
  XCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useState,
} from 'react'
import QrScanLogDetailsModal from '@/components/admin/qr-scan-logs/QrScanLogDetailsModal'
import QrScanLogTable from '@/components/admin/qr-scan-logs/QrScanLogTable'
import {
  deleteQrScanLog,
  getQrScanLog,
  getQrScanLogs,
  getQrScanLogSummary,
  restoreQrScanLog,
} from '@/services/qr-scan-log.service'
import type {
  QrScanLog,
  QrScanLogSummary,
} from '@/types/qr-scan-log'

const emptySummary: QrScanLogSummary = {
  total_scans: 0,
  successful_scans: 0,
  failed_scans: 0,
  invalid_scans: 0,
  expired_scans: 0,
  used_scans: 0,
  today_scans: 0,
  unique_devices: 0,
  unique_locations: 0,
}

export default function QrScanLogsPage() {
  const [logs, setLogs] = useState<QrScanLog[]>([])
  const [summary, setSummary] =
    useState<QrScanLogSummary>(emptySummary)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [result, setResult] = useState('')
  const [deviceType, setDeviceType] = useState('')
  const [location, setLocation] = useState('')
  const [orderId, setOrderId] = useState('')
  const [qrCodeId, setQrCodeId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [includeDeleted, setIncludeDeleted] =
    useState(false)

  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] =
    useState(false)

  const [processingId, setProcessingId] =
    useState<number | string | null>(null)

  const [detailsOpen, setDetailsOpen] =
    useState(false)
  const [detailsLog, setDetailsLog] =
    useState<QrScanLog | null>(null)
  const [detailsLoading, setDetailsLoading] =
    useState(false)
  const [detailsError, setDetailsError] =
    useState('')

  const [message, setMessage] = useState('')
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
          result,
          deviceType,
          location,
          orderId,
          qrCodeId,
          dateFrom,
          dateTo,
          includeDeleted,
          perPage: 200,
        }

        const [logsResult, summaryResult] =
          await Promise.all([
            getQrScanLogs(filters),
            getQrScanLogSummary(filters),
          ])

        setLogs(logsResult.logs)
        setSummary(summaryResult)
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to load QR scan logs.',
        )
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [
      search,
      result,
      deviceType,
      location,
      orderId,
      qrCodeId,
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

    return () => window.clearTimeout(timer)
  }, [searchInput])

  async function handleView(log: QrScanLog) {
    setDetailsOpen(true)
    setDetailsLoading(true)
    setDetailsLog(null)
    setDetailsError('')

    try {
      const result = await getQrScanLog(log.id)
      setDetailsLog(result)
    } catch (error) {
      setDetailsError(
        error instanceof Error
          ? error.message
          : 'Unable to load QR scan log details.',
      )
    } finally {
      setDetailsLoading(false)
    }
  }

  async function handleDelete(log: QrScanLog) {
    const confirmed = window.confirm(
      `Delete QR scan log #${log.id}?\n\nThis only removes the audit log record. It does not change the order or QR status.`,
    )

    if (!confirmed) {
      return
    }

    setProcessingId(log.id)
    setMessage('')
    setErrorMessage('')

    try {
      const responseMessage =
        await deleteQrScanLog(log.id)

      setMessage(responseMessage)
      await loadLogs(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to delete QR scan log.',
      )
    } finally {
      setProcessingId(null)
    }
  }

  async function handleRestore(log: QrScanLog) {
    const confirmed = window.confirm(
      `Restore QR scan log #${log.id}?`,
    )

    if (!confirmed) {
      return
    }

    setProcessingId(log.id)
    setMessage('')
    setErrorMessage('')

    try {
      const responseMessage =
        await restoreQrScanLog(log.id)

      setMessage(responseMessage)
      await loadLogs(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to restore QR scan log.',
      )
    } finally {
      setProcessingId(null)
    }
  }

  function clearFilters() {
    setSearchInput('')
    setSearch('')
    setResult('')
    setDeviceType('')
    setLocation('')
    setOrderId('')
    setQrCodeId('')
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
              Pickup Security
            </p>

            <h1 className="mt-2 text-2xl font-extrabold text-slate-950 sm:text-3xl">
              QR Scan Logs
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Review QR verification attempts, devices,
              locations and pickup scan results.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadLogs(true)}
            disabled={isRefreshing}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          >
            {isRefreshing ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}

            Refresh
          </button>
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

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <SummaryCard
            title="Total Scans"
            value={summary.total_scans}
            subtitle={`${summary.today_scans} today`}
            icon={ScanLine}
            iconClass="bg-indigo-50 text-indigo-600"
          />

          <SummaryCard
            title="Successful"
            value={summary.successful_scans}
            icon={CheckCircle2}
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <SummaryCard
            title="Failed"
            value={summary.failed_scans}
            icon={XCircle}
            iconClass="bg-red-50 text-red-600"
          />

          <SummaryCard
            title="Invalid / Expired"
            value={
              summary.invalid_scans +
              summary.expired_scans
            }
            subtitle={`${summary.expired_scans} expired`}
            icon={Clock3}
            iconClass="bg-amber-50 text-amber-600"
          />

          <SummaryCard
            title="Devices"
            value={summary.unique_devices}
            icon={MonitorSmartphone}
            iconClass="bg-blue-50 text-blue-600"
          />

          <SummaryCard
            title="Locations"
            value={summary.unique_locations}
            icon={MapPin}
            iconClass="bg-violet-50 text-violet-600"
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="space-y-3 border-b border-slate-200 p-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_180px_180px_220px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="search"
                  value={searchInput}
                  onChange={(event) =>
                    setSearchInput(event.target.value)
                  }
                  placeholder="Search order, token, scanner or message..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                />
              </div>

              <select
                value={result}
                onChange={(event) =>
                  setResult(event.target.value)
                }
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              >
                <option value="">All results</option>
                <option value="success">
                  Successful
                </option>
                <option value="failed">Failed</option>
                <option value="invalid">Invalid</option>
                <option value="expired">Expired</option>
                <option value="used">
                  Already Used
                </option>
                <option value="cancelled">
                  Cancelled
                </option>
              </select>

              <select
                value={deviceType}
                onChange={(event) =>
                  setDeviceType(event.target.value)
                }
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              >
                <option value="">
                  All device types
                </option>
                <option value="android">
                  Android
                </option>
                <option value="ios">iOS</option>
                <option value="scanner">
                  QR Scanner
                </option>
                <option value="web">Web</option>
                <option value="other">Other</option>
              </select>

              <input
                type="text"
                value={location}
                onChange={(event) =>
                  setLocation(event.target.value)
                }
                placeholder="Filter by location"
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[150px_150px_180px_180px_auto_auto]">
              <input
                type="text"
                inputMode="numeric"
                value={orderId}
                onChange={(event) =>
                  setOrderId(event.target.value)
                }
                placeholder="Order ID"
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />

              <input
                type="text"
                inputMode="numeric"
                value={qrCodeId}
                onChange={(event) =>
                  setQrCodeId(event.target.value)
                }
                placeholder="QR code ID"
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />

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
                  Loading QR scan logs...
                </p>
              </div>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex min-h-[390px] items-center justify-center px-6 text-center">
              <div>
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600">
                  <ScanLine className="h-8 w-8" />
                </span>

                <h2 className="mt-5 text-lg font-extrabold text-slate-900">
                  No QR scan logs found
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Scan logs will appear when staff verify
                  or use customer order QR codes.
                </p>
              </div>
            </div>
          ) : (
            <QrScanLogTable
              logs={logs}
              processingId={processingId}
              onView={(log) => void handleView(log)}
              onDelete={(log) => void handleDelete(log)}
              onRestore={(log) =>
                void handleRestore(log)
              }
            />
          )}
        </section>
      </div>

      <QrScanLogDetailsModal
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
      <div className="flex items-start justify-between gap-4">
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
