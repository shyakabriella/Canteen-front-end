'use client'

import {
  BadgeDollarSign,
  CalendarDays,
  CheckCircle2,
  Hash,
  LoaderCircle,
  PackageCheck,
  ReceiptText,
  ShoppingCart,
  UserRound,
  X,
  XCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  formatSalesReportAmount,
  formatSalesReportDate,
  formatSalesReportNumber,
  getSalesReportAverageOrderValue,
  getSalesReportCancelledOrders,
  getSalesReportCompletedOrders,
  getSalesReportCostOfGoods,
  getSalesReportDiscounts,
  getSalesReportEndDate,
  getSalesReportFinalizedBy,
  getSalesReportGeneratedBy,
  getSalesReportGeneratedDate,
  getSalesReportGrossProfit,
  getSalesReportGrossSales,
  getSalesReportItemsSold,
  getSalesReportNetSales,
  getSalesReportNotes,
  getSalesReportPendingOrders,
  getSalesReportReference,
  getSalesReportRefunds,
  getSalesReportStartDate,
  getSalesReportStatus,
  getSalesReportTax,
  getSalesReportTitle,
  getSalesReportTotalOrders,
  salesReportStatusLabel,
  salesReportTypeLabel,
} from '@/lib/sales-report'
import type { SalesReport } from '@/types/sales-report'

interface Props {
  isOpen: boolean
  report: SalesReport | null
  isLoading: boolean
  errorMessage: string
  onClose: () => void
}

export default function SalesReportDetailsModal({
  isOpen,
  report,
  isLoading,
  errorMessage,
  onClose,
}: Props) {
  if (!isOpen) {
    return null
  }

  const finalized =
    report &&
    getSalesReportStatus(report) ===
      'finalized'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4">
      <button
        type="button"
        aria-label="Close sales report details"
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="relative z-10 my-auto w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="font-extrabold text-slate-950">
              Sales Report Details
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Revenue, orders, items, refunds and profit
              information.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(100vh-130px)] overflow-y-auto p-6">
          {isLoading && (
            <div className="flex min-h-72 items-center justify-center">
              <LoaderCircle className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          )}

          {!isLoading && errorMessage && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {!isLoading && report && (
            <div className="space-y-5">
              <div
                className={`rounded-3xl p-6 text-white ${
                  finalized
                    ? 'bg-gradient-to-br from-emerald-600 to-teal-700'
                    : 'bg-gradient-to-br from-indigo-600 to-violet-700'
                }`}
              >
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                      {getSalesReportReference(report)}
                    </p>

                    <h3 className="mt-2 text-3xl font-extrabold">
                      {getSalesReportTitle(report)}
                    </h3>

                    <p className="mt-3 text-sm text-white/80">
                      {formatSalesReportDate(
                        getSalesReportStartDate(
                          report,
                        ),
                        false,
                      )}
                      {' – '}
                      {formatSalesReportDate(
                        getSalesReportEndDate(
                          report,
                        ),
                        false,
                      )}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">
                      {salesReportTypeLabel(report)}
                    </span>

                    <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">
                      {salesReportStatusLabel(report)}
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-white/70">
                    Net Sales
                  </p>

                  <p className="mt-2 text-4xl font-extrabold">
                    {formatSalesReportAmount(
                      getSalesReportNetSales(
                        report,
                      ),
                    )}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Stat
                  label="Gross Sales"
                  value={formatSalesReportAmount(
                    getSalesReportGrossSales(
                      report,
                    ),
                  )}
                />

                <Stat
                  label="Refunds"
                  value={formatSalesReportAmount(
                    getSalesReportRefunds(report),
                  )}
                />

                <Stat
                  label="Discounts"
                  value={formatSalesReportAmount(
                    getSalesReportDiscounts(
                      report,
                    ),
                  )}
                />

                <Stat
                  label="Average Order"
                  value={formatSalesReportAmount(
                    getSalesReportAverageOrderValue(
                      report,
                    ),
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Stat
                  label="Total Orders"
                  value={formatSalesReportNumber(
                    getSalesReportTotalOrders(
                      report,
                    ),
                  )}
                />

                <Stat
                  label="Completed"
                  value={formatSalesReportNumber(
                    getSalesReportCompletedOrders(
                      report,
                    ),
                  )}
                />

                <Stat
                  label="Cancelled"
                  value={formatSalesReportNumber(
                    getSalesReportCancelledOrders(
                      report,
                    ),
                  )}
                />

                <Stat
                  label="Items Sold"
                  value={formatSalesReportNumber(
                    getSalesReportItemsSold(
                      report,
                    ),
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Detail
                  icon={Hash}
                  label="Report ID"
                  value={String(report.id)}
                />

                <Detail
                  icon={CalendarDays}
                  label="Generated At"
                  value={formatSalesReportDate(
                    getSalesReportGeneratedDate(
                      report,
                    ),
                  )}
                />

                <Detail
                  icon={UserRound}
                  label="Generated By"
                  value={getSalesReportGeneratedBy(
                    report,
                  )}
                />

                <Detail
                  icon={ShoppingCart}
                  label="Pending Orders"
                  value={formatSalesReportNumber(
                    getSalesReportPendingOrders(
                      report,
                    ),
                  )}
                />

                <Detail
                  icon={ReceiptText}
                  label="Tax Amount"
                  value={formatSalesReportAmount(
                    getSalesReportTax(report),
                  )}
                />

                <Detail
                  icon={PackageCheck}
                  label="Cost of Goods"
                  value={formatSalesReportAmount(
                    getSalesReportCostOfGoods(
                      report,
                    ),
                  )}
                />

                <Detail
                  icon={BadgeDollarSign}
                  label="Gross Profit"
                  value={formatSalesReportAmount(
                    getSalesReportGrossProfit(
                      report,
                    ),
                  )}
                />

                <Detail
                  icon={
                    finalized
                      ? CheckCircle2
                      : XCircle
                  }
                  label="Finalized At"
                  value={formatSalesReportDate(
                    report.finalized_at,
                  )}
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Report Notes
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {getSalesReportNotes(report)}
                </p>
              </div>

              {finalized && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                    Finalization
                  </p>

                  <p className="mt-2 text-sm text-emerald-800">
                    Finalized by{' '}
                    {getSalesReportFinalizedBy(
                      report,
                    )}
                    {' on '}
                    {formatSalesReportDate(
                      report.finalized_at,
                    )}
                  </p>

                  <p className="mt-2 text-sm text-emerald-700">
                    {report.finalization_notes ??
                      report.finalized_notes ??
                      'No finalization notes provided.'}
                  </p>
                </div>
              )}

              {report.deleted_at && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                  Deleted on{' '}
                  {formatSalesReportDate(
                    report.deleted_at,
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-indigo-500">
        {label}
      </p>

      <p className="mt-2 text-xl font-extrabold text-indigo-800">
        {value}
      </p>
    </div>
  )
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
          <Icon className="h-5 w-5" />
        </span>

        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {label}
          </p>

          <p className="mt-1 break-words text-sm font-extrabold text-slate-800">
            {value}
          </p>
        </div>
      </div>
    </div>
  )
}
