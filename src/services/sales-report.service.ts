import { apiRequest } from '@/lib/api'
import {
  getSalesReportAverageOrderValue,
  getSalesReportCancelledOrders,
  getSalesReportCompletedOrders,
  getSalesReportGrossSales,
  getSalesReportItemsSold,
  getSalesReportNetSales,
  getSalesReportRefunds,
  getSalesReportStatus,
  getSalesReportTotalOrders,
} from '@/lib/sales-report'
import type {
  FinalizeSalesReportPayload,
  RegenerateSalesReportPayload,
  SalesReport,
  SalesReportListParams,
  SalesReportListResult,
  SalesReportPayload,
  SalesReportSummary,
} from '@/types/sales-report'

type UnknownRecord = Record<string, unknown>

function asRecord(
  value: unknown,
): UnknownRecord | null {
  if (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  ) {
    return value as UnknownRecord
  }

  return null
}

function optionalNumber(
  value: unknown,
): number | undefined {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return undefined
  }

  const numeric = Number(value)

  return Number.isFinite(numeric)
    ? numeric
    : undefined
}

function firstNumber(
  ...values: unknown[]
): number {
  for (const value of values) {
    const numeric = optionalNumber(value)

    if (numeric !== undefined) {
      return numeric
    }
  }

  return 0
}

function looksLikeSalesReport(
  value: unknown,
): value is SalesReport {
  const record = asRecord(value)

  if (!record) {
    return false
  }

  return (
    'id' in record ||
    'report_number' in record ||
    'report_type' in record ||
    'gross_sales' in record ||
    'net_sales' in record
  )
}

function extractSalesReport(
  payload: unknown,
): SalesReport | undefined {
  if (looksLikeSalesReport(payload)) {
    return payload
  }

  const root = asRecord(payload)
  const data = root?.data
  const dataRecord = asRecord(data)

  const values = [
    root?.sales_report,
    root?.salesReport,
    root?.report,
    data,
    dataRecord?.sales_report,
    dataRecord?.salesReport,
    dataRecord?.report,
  ]

  return values.find(looksLikeSalesReport)
}

function extractSalesReportArray(
  payload: unknown,
): SalesReport[] {
  if (Array.isArray(payload)) {
    return payload.filter(looksLikeSalesReport)
  }

  const root = asRecord(payload)

  if (!root) {
    return []
  }

  const data = asRecord(root.data)

  const arrays = [
    root.sales_reports,
    root.salesReports,
    root.reports,
    root.items,
    root.data,

    data?.sales_reports,
    data?.salesReports,
    data?.reports,
    data?.items,
    data?.data,
  ]

  for (const array of arrays) {
    if (Array.isArray(array)) {
      return array.filter(
        looksLikeSalesReport,
      )
    }
  }

  return []
}

function extractMessage(
  payload: unknown,
  fallback: string,
): string {
  const root = asRecord(payload)

  return typeof root?.message === 'string'
    ? root.message
    : fallback
}

function buildQuery(
  params: SalesReportListParams,
): string {
  const query = new URLSearchParams()

  if (params.search?.trim()) {
    query.set('search', params.search.trim())
  }

  if (params.status) {
    query.set('status', params.status)
  }

  if (params.reportType) {
    query.set(
      'report_type',
      params.reportType,
    )
  }

  if (params.dateFrom) {
    query.set('date_from', params.dateFrom)
    query.set('start_date', params.dateFrom)
  }

  if (params.dateTo) {
    query.set('date_to', params.dateTo)
    query.set('end_date', params.dateTo)
  }

  if (params.includeDeleted) {
    query.set('with_trashed', '1')
    query.set('include_deleted', '1')
  }

  if (params.page) {
    query.set('page', String(params.page))
  }

  query.set(
    'per_page',
    String(params.perPage ?? 200),
  )

  return query.toString()
}

function reportPayload(
  payload: SalesReportPayload,
) {
  const title = payload.title.trim()
  const notes = payload.notes?.trim() || null

  return {
    title,
    report_name: title,
    name: title,

    report_type: payload.report_type,
    type: payload.report_type,

    start_date: payload.start_date,
    date_from: payload.start_date,
    period_start: payload.start_date,

    end_date: payload.end_date,
    date_to: payload.end_date,
    period_end: payload.end_date,

    notes,
    description: notes,
  }
}

export async function getSalesReports(
  params: SalesReportListParams = {},
): Promise<SalesReportListResult> {
  const query = buildQuery(params)

  const response = await apiRequest<unknown>(
    `/sales-reports${query ? `?${query}` : ''}`,
    {
      method: 'GET',
      auth: true,
      cache: 'no-store',
    },
  )

  const root = asRecord(response)
  const data = asRecord(root?.data)

  return {
    reports: extractSalesReportArray(response),

    current_page:
      optionalNumber(root?.current_page) ??
      optionalNumber(data?.current_page),

    last_page:
      optionalNumber(root?.last_page) ??
      optionalNumber(data?.last_page),

    per_page:
      optionalNumber(root?.per_page) ??
      optionalNumber(data?.per_page),

    total:
      optionalNumber(root?.total) ??
      optionalNumber(data?.total),
  }
}

export async function getSalesReportSummary(
  params: SalesReportListParams = {},
): Promise<SalesReportSummary> {
  const query = buildQuery(params)

  const response = await apiRequest<unknown>(
    `/sales-reports/summary${query ? `?${query}` : ''}`,
    {
      method: 'GET',
      auth: true,
      cache: 'no-store',
    },
  )

  const root = asRecord(response)
  const data = asRecord(root?.data)

  const summary =
    asRecord(root?.summary) ??
    asRecord(data?.summary) ??
    data ??
    root ??
    {}

  const reports =
    extractSalesReportArray(response)

  const draftReports = reports.filter(
    (report) =>
      getSalesReportStatus(report) === 'draft',
  )

  const finalizedReports = reports.filter(
    (report) =>
      getSalesReportStatus(report) ===
      'finalized',
  )

  const totals = reports.reduce(
    (result, report) => {
      result.totalOrders +=
        getSalesReportTotalOrders(report)

      result.completedOrders +=
        getSalesReportCompletedOrders(report)

      result.cancelledOrders +=
        getSalesReportCancelledOrders(report)

      result.itemsSold +=
        getSalesReportItemsSold(report)

      result.grossSales +=
        getSalesReportGrossSales(report)

      result.netSales +=
        getSalesReportNetSales(report)

      result.refunds +=
        getSalesReportRefunds(report)

      return result
    },
    {
      totalOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      itemsSold: 0,
      grossSales: 0,
      netSales: 0,
      refunds: 0,
    },
  )

  const averageOrderValue =
    totals.completedOrders > 0
      ? totals.netSales /
        totals.completedOrders
      : reports.length > 0
        ? reports.reduce(
            (total, report) =>
              total +
              getSalesReportAverageOrderValue(
                report,
              ),
            0,
          ) / reports.length
        : 0

  return {
    total_reports: firstNumber(
      summary.total_reports,
      summary.reports_count,
      summary.total,
      reports.length,
    ),

    draft_reports: firstNumber(
      summary.draft_reports,
      summary.draft_count,
      draftReports.length,
    ),

    finalized_reports: firstNumber(
      summary.finalized_reports,
      summary.finalised_reports,
      summary.finalized_count,
      finalizedReports.length,
    ),

    total_orders: firstNumber(
      summary.total_orders,
      summary.orders_count,
      totals.totalOrders,
    ),

    completed_orders: firstNumber(
      summary.completed_orders,
      summary.completed_count,
      totals.completedOrders,
    ),

    cancelled_orders: firstNumber(
      summary.cancelled_orders,
      summary.canceled_orders,
      summary.cancelled_count,
      totals.cancelledOrders,
    ),

    total_items_sold: firstNumber(
      summary.total_items_sold,
      summary.items_sold,
      summary.quantity_sold,
      totals.itemsSold,
    ),

    gross_sales: firstNumber(
      summary.gross_sales,
      summary.gross_revenue,
      summary.total_sales,
      totals.grossSales,
    ),

    net_sales: firstNumber(
      summary.net_sales,
      summary.net_revenue,
      summary.revenue,
      totals.netSales,
    ),

    total_refunds: firstNumber(
      summary.total_refunds,
      summary.refunds,
      summary.refund_amount,
      totals.refunds,
    ),

    average_order_value: firstNumber(
      summary.average_order_value,
      summary.avg_order_value,
      averageOrderValue,
    ),
  }
}

export async function getSalesReport(
  id: number | string,
): Promise<SalesReport> {
  const response = await apiRequest<unknown>(
    `/sales-reports/${id}`,
    {
      method: 'GET',
      auth: true,
      cache: 'no-store',
    },
  )

  const report = extractSalesReport(response)

  if (!report) {
    throw new Error(
      'The backend did not return the requested sales report.',
    )
  }

  return report
}

export async function generateSalesReport(
  payload: SalesReportPayload,
): Promise<{
  report?: SalesReport
  message: string
}> {
  const response = await apiRequest<unknown>(
    '/sales-reports/generate',
    {
      method: 'POST',
      auth: true,
      body: reportPayload(payload),
    },
  )

  return {
    report: extractSalesReport(response),

    message: extractMessage(
      response,
      'Sales report generated successfully.',
    ),
  }
}

export async function createSalesReport(
  payload: SalesReportPayload,
): Promise<{
  report?: SalesReport
  message: string
}> {
  const response = await apiRequest<unknown>(
    '/sales-reports',
    {
      method: 'POST',
      auth: true,
      body: reportPayload(payload),
    },
  )

  return {
    report: extractSalesReport(response),

    message: extractMessage(
      response,
      'Sales report created successfully.',
    ),
  }
}

export async function updateSalesReport(
  id: number | string,
  payload: SalesReportPayload,
): Promise<{
  report?: SalesReport
  message: string
}> {
  const response = await apiRequest<unknown>(
    `/sales-reports/${id}`,
    {
      method: 'PATCH',
      auth: true,
      body: reportPayload(payload),
    },
  )

  return {
    report: extractSalesReport(response),

    message: extractMessage(
      response,
      'Sales report updated successfully.',
    ),
  }
}

export async function deleteSalesReport(
  id: number | string,
): Promise<string> {
  const response = await apiRequest<unknown>(
    `/sales-reports/${id}`,
    {
      method: 'DELETE',
      auth: true,
    },
  )

  return extractMessage(
    response,
    'Sales report deleted successfully.',
  )
}

export async function regenerateSalesReport(
  id: number | string,
  payload: RegenerateSalesReportPayload,
): Promise<string> {
  const notes = payload.notes?.trim() || null

  const response = await apiRequest<unknown>(
    `/sales-reports/${id}/regenerate`,
    {
      method: 'POST',
      auth: true,
      body: {
        start_date: payload.start_date || null,
        date_from: payload.start_date || null,

        end_date: payload.end_date || null,
        date_to: payload.end_date || null,

        notes,
        regeneration_notes: notes,
      },
    },
  )

  return extractMessage(
    response,
    'Sales report regenerated successfully.',
  )
}

export async function finalizeSalesReport(
  id: number | string,
  payload: FinalizeSalesReportPayload,
): Promise<string> {
  const notes = payload.notes?.trim() || null

  const response = await apiRequest<unknown>(
    `/sales-reports/${id}/finalize`,
    {
      method: 'POST',
      auth: true,
      body: {
        notes,
        finalization_notes: notes,
        finalized_notes: notes,
      },
    },
  )

  return extractMessage(
    response,
    'Sales report finalized successfully.',
  )
}

export async function restoreSalesReport(
  id: number | string,
): Promise<string> {
  const response = await apiRequest<unknown>(
    `/sales-reports/${id}/restore`,
    {
      method: 'POST',
      auth: true,
    },
  )

  return extractMessage(
    response,
    'Sales report restored successfully.',
  )
}
