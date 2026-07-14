import type {
  SalesReport,
  SalesReportStatus,
  SalesReportType,
} from '@/types/sales-report'

export function salesReportNumber(
  value: unknown,
): number {
  const numeric = Number(value ?? 0)

  return Number.isFinite(numeric)
    ? numeric
    : 0
}

export function normalizeSalesReportStatus(
  status?: SalesReportStatus | null,
): 'draft' | 'finalized' {
  const value = String(status ?? 'draft')
    .trim()
    .toLowerCase()
    .replaceAll('-', '_')
    .replaceAll(' ', '_')

  if (
    [
      'finalized',
      'finalised',
      'completed',
      'published',
      'approved',
      'closed',
    ].includes(value)
  ) {
    return 'finalized'
  }

  return 'draft'
}

export function getSalesReportStatus(
  report: SalesReport,
): 'draft' | 'finalized' {
  return normalizeSalesReportStatus(
    report.status,
  )
}

export function salesReportStatusLabel(
  report: SalesReport,
): string {
  return getSalesReportStatus(report) ===
    'finalized'
    ? 'Finalized'
    : 'Draft'
}

export function normalizeSalesReportType(
  type?: SalesReportType | null,
): 'daily' | 'weekly' | 'monthly' | 'custom' {
  const value = String(type ?? 'custom')
    .trim()
    .toLowerCase()
    .replaceAll('-', '_')
    .replaceAll(' ', '_')

  if (value === 'daily' || value === 'day') {
    return 'daily'
  }

  if (
    value === 'weekly' ||
    value === 'week'
  ) {
    return 'weekly'
  }

  if (
    value === 'monthly' ||
    value === 'month'
  ) {
    return 'monthly'
  }

  return 'custom'
}

export function getSalesReportType(
  report: SalesReport,
) {
  return normalizeSalesReportType(
    report.report_type ?? report.type,
  )
}

export function salesReportTypeLabel(
  report: SalesReport,
): string {
  const type = getSalesReportType(report)

  return {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    custom: 'Custom',
  }[type]
}

export function getSalesReportReference(
  report: SalesReport,
): string {
  return (
    report.report_number ??
    report.report_code ??
    report.reference ??
    report.code ??
    `SR-${report.id}`
  )
}

export function getSalesReportTitle(
  report: SalesReport,
): string {
  return (
    report.title ??
    report.report_name ??
    report.name ??
    `${salesReportTypeLabel(report)} Sales Report`
  )
}

export function getSalesReportStartDate(
  report: SalesReport,
): string | null {
  return (
    report.start_date ??
    report.date_from ??
    report.period_start ??
    null
  )
}

export function getSalesReportEndDate(
  report: SalesReport,
): string | null {
  return (
    report.end_date ??
    report.date_to ??
    report.period_end ??
    null
  )
}

export function getSalesReportTotalOrders(
  report: SalesReport,
): number {
  return salesReportNumber(
    report.total_orders ??
    report.orders_count,
  )
}

export function getSalesReportCompletedOrders(
  report: SalesReport,
): number {
  return salesReportNumber(
    report.completed_orders ??
    report.completed_orders_count,
  )
}

export function getSalesReportCancelledOrders(
  report: SalesReport,
): number {
  return salesReportNumber(
    report.cancelled_orders ??
    report.canceled_orders ??
    report.cancelled_orders_count,
  )
}

export function getSalesReportPendingOrders(
  report: SalesReport,
): number {
  return salesReportNumber(
    report.pending_orders ??
    report.pending_orders_count,
  )
}

export function getSalesReportItemsSold(
  report: SalesReport,
): number {
  return salesReportNumber(
    report.total_items_sold ??
    report.items_sold ??
    report.quantity_sold,
  )
}

export function getSalesReportGrossSales(
  report: SalesReport,
): number {
  return salesReportNumber(
    report.gross_sales ??
    report.gross_revenue ??
    report.total_sales,
  )
}

export function getSalesReportDiscounts(
  report: SalesReport,
): number {
  return salesReportNumber(
    report.discounts ??
    report.total_discounts ??
    report.discount_amount,
  )
}

export function getSalesReportRefunds(
  report: SalesReport,
): number {
  return salesReportNumber(
    report.refunds ??
    report.total_refunds ??
    report.refund_amount,
  )
}

export function getSalesReportNetSales(
  report: SalesReport,
): number {
  const explicit =
    report.net_sales ??
    report.net_revenue ??
    report.revenue

  if (
    explicit !== undefined &&
    explicit !== null &&
    explicit !== ''
  ) {
    return salesReportNumber(explicit)
  }

  return Math.max(
    getSalesReportGrossSales(report) -
      getSalesReportDiscounts(report) -
      getSalesReportRefunds(report),
    0,
  )
}

export function getSalesReportAverageOrderValue(
  report: SalesReport,
): number {
  const explicit =
    report.average_order_value ??
    report.avg_order_value

  if (
    explicit !== undefined &&
    explicit !== null &&
    explicit !== ''
  ) {
    return salesReportNumber(explicit)
  }

  const completed =
    getSalesReportCompletedOrders(report)

  return completed > 0
    ? getSalesReportNetSales(report) /
        completed
    : 0
}

export function getSalesReportTax(
  report: SalesReport,
): number {
  return salesReportNumber(
    report.tax_amount ??
    report.total_tax,
  )
}

export function getSalesReportCostOfGoods(
  report: SalesReport,
): number {
  return salesReportNumber(
    report.cost_of_goods ??
    report.cost_of_goods_sold,
  )
}

export function getSalesReportGrossProfit(
  report: SalesReport,
): number {
  const explicit =
    report.gross_profit ??
    report.profit

  if (
    explicit !== undefined &&
    explicit !== null &&
    explicit !== ''
  ) {
    return salesReportNumber(explicit)
  }

  return (
    getSalesReportNetSales(report) -
    getSalesReportCostOfGoods(report)
  )
}

export function getSalesReportGeneratedBy(
  report: SalesReport,
): string {
  return (
    report.generator?.name ??
    report.generatedBy?.name ??
    report.creator?.name ??
    report.createdBy?.name ??
    (
      report.generated_by
        ? `User #${report.generated_by}`
        : report.created_by
          ? `User #${report.created_by}`
          : 'System'
    )
  )
}

export function getSalesReportFinalizedBy(
  report: SalesReport,
): string {
  return (
    report.finalizer?.name ??
    report.finalizedBy?.name ??
    (
      report.finalized_by
        ? `User #${report.finalized_by}`
        : 'Not available'
    )
  )
}

export function getSalesReportGeneratedDate(
  report: SalesReport,
): string | null {
  return (
    report.generated_at ??
    report.created_at ??
    null
  )
}

export function getSalesReportNotes(
  report: SalesReport,
): string {
  return (
    report.notes ??
    report.description ??
    'No report notes provided.'
  )
}

export function formatSalesReportAmount(
  value: number | string,
): string {
  const numeric = Number(value)

  if (!Number.isFinite(numeric)) {
    return `${value} RWF`
  }

  return `${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(numeric)} RWF`
}

export function formatSalesReportNumber(
  value: number | string,
): string {
  const numeric = Number(value)

  if (!Number.isFinite(numeric)) {
    return String(value)
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(numeric)
}

export function formatSalesReportDate(
  value?: string | null,
  includeTime = true,
): string {
  if (!value) {
    return 'Not available'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    ...(includeTime
      ? { timeStyle: 'short' }
      : {}),
  }).format(date)
}

export function getSalesReportPeriod(
  report: SalesReport,
): string {
  const start = formatSalesReportDate(
    getSalesReportStartDate(report),
    false,
  )

  const end = formatSalesReportDate(
    getSalesReportEndDate(report),
    false,
  )

  return `${start} – ${end}`
}

export function canEditSalesReport(
  report: SalesReport,
): boolean {
  return (
    !report.deleted_at &&
    getSalesReportStatus(report) === 'draft'
  )
}

export function canDeleteSalesReport(
  report: SalesReport,
): boolean {
  return canEditSalesReport(report)
}

export function canFinalizeSalesReport(
  report: SalesReport,
): boolean {
  return canEditSalesReport(report)
}

export function canRegenerateSalesReport(
  report: SalesReport,
): boolean {
  return !report.deleted_at
}
