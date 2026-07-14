'use client'

import {
  CheckCircle2,
  Eye,
  Pencil,
  RefreshCcw,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  canDeleteSalesReport,
  canEditSalesReport,
  canFinalizeSalesReport,
  canRegenerateSalesReport,
  formatSalesReportAmount,
  formatSalesReportDate,
  formatSalesReportNumber,
  getSalesReportCompletedOrders,
  getSalesReportEndDate,
  getSalesReportGrossSales,
  getSalesReportNetSales,
  getSalesReportReference,
  getSalesReportStartDate,
  getSalesReportStatus,
  getSalesReportTitle,
  salesReportStatusLabel,
  salesReportTypeLabel,
} from '@/lib/sales-report'
import type { SalesReport } from '@/types/sales-report'

interface Props {
  reports: SalesReport[]
  processingId: number | string | null
  onView: (report: SalesReport) => void
  onEdit: (report: SalesReport) => void
  onRegenerate: (report: SalesReport) => void
  onFinalize: (report: SalesReport) => void
  onDelete: (report: SalesReport) => void
  onRestore: (report: SalesReport) => void
}

export default function SalesReportTable({
  reports,
  processingId,
  onView,
  onEdit,
  onRegenerate,
  onFinalize,
  onDelete,
  onRestore,
}: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1250px] text-left">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.14em] text-slate-400">
          <tr>
            <th className="px-6 py-4">
              Report
            </th>

            <th className="px-4 py-4">
              Period
            </th>

            <th className="px-4 py-4">
              Orders
            </th>

            <th className="px-4 py-4">
              Gross Sales
            </th>

            <th className="px-4 py-4">
              Net Sales
            </th>

            <th className="px-4 py-4">
              Type
            </th>

            <th className="px-4 py-4">
              Status
            </th>

            <th className="px-6 py-4 text-right">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {reports.map((report) => {
            const status =
              getSalesReportStatus(report)

            const deleted = Boolean(
              report.deleted_at,
            )

            const processing =
              String(processingId) ===
              String(report.id)

            return (
              <tr
                key={report.id}
                className={`text-sm hover:bg-slate-50 ${
                  deleted
                    ? 'bg-red-50/30'
                    : ''
                }`}
              >
                <td className="px-6 py-4">
                  <p className="max-w-[230px] truncate font-extrabold text-slate-900">
                    {getSalesReportTitle(report)}
                  </p>

                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    {getSalesReportReference(report)}
                  </p>
                </td>

                <td className="px-4 py-4">
                  <p className="whitespace-nowrap text-xs font-semibold text-slate-600">
                    {formatSalesReportDate(
                      getSalesReportStartDate(
                        report,
                      ),
                      false,
                    )}
                  </p>

                  <p className="mt-1 whitespace-nowrap text-xs text-slate-400">
                    to{' '}
                    {formatSalesReportDate(
                      getSalesReportEndDate(report),
                      false,
                    )}
                  </p>
                </td>

                <td className="whitespace-nowrap px-4 py-4 font-bold text-slate-700">
                  {formatSalesReportNumber(
                    getSalesReportCompletedOrders(
                      report,
                    ),
                  )}
                </td>

                <td className="whitespace-nowrap px-4 py-4 font-extrabold text-slate-900">
                  {formatSalesReportAmount(
                    getSalesReportGrossSales(
                      report,
                    ),
                  )}
                </td>

                <td className="whitespace-nowrap px-4 py-4 font-extrabold text-emerald-700">
                  {formatSalesReportAmount(
                    getSalesReportNetSales(report),
                  )}
                </td>

                <td className="px-4 py-4">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                    {salesReportTypeLabel(report)}
                  </span>
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      deleted
                        ? 'bg-red-50 text-red-700'
                        : status === 'finalized'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {deleted
                      ? 'Deleted'
                      : salesReportStatusLabel(
                          report,
                        )}
                  </span>
                </td>

                <td className="px-6 py-4">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Action
                      icon={Eye}
                      title="View report"
                      onClick={() => onView(report)}
                    />

                    {canEditSalesReport(report) && (
                      <Action
                        icon={Pencil}
                        title="Update draft"
                        onClick={() => onEdit(report)}
                        className="border-blue-200 text-blue-600"
                      />
                    )}

                    {canRegenerateSalesReport(
                      report,
                    ) && (
                      <Action
                        icon={RefreshCcw}
                        title="Regenerate report"
                        onClick={() =>
                          onRegenerate(report)
                        }
                        className="border-indigo-200 bg-indigo-50 text-indigo-600"
                      />
                    )}

                    {canFinalizeSalesReport(
                      report,
                    ) && (
                      <Action
                        icon={CheckCircle2}
                        title="Finalize report"
                        onClick={() =>
                          onFinalize(report)
                        }
                        className="border-emerald-200 bg-emerald-50 text-emerald-600"
                      />
                    )}

                    {canDeleteSalesReport(report) && (
                      <Action
                        icon={Trash2}
                        title="Delete draft"
                        onClick={() =>
                          onDelete(report)
                        }
                        disabled={processing}
                        className="border-red-200 text-red-600"
                      />
                    )}

                    {deleted && (
                      <button
                        type="button"
                        onClick={() =>
                          onRestore(report)
                        }
                        disabled={processing}
                        className="flex h-9 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 disabled:opacity-50"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Restore
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function Action({
  icon: Icon,
  title,
  onClick,
  className = 'border-slate-200 text-slate-500',
  disabled = false,
}: {
  icon: LucideIcon
  title: string
  onClick: () => void
  className?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-9 w-9 items-center justify-center rounded-xl border hover:opacity-80 disabled:opacity-40 ${className}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}
