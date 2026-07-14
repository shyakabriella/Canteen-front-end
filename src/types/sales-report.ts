export type SalesReportStatus =
  | 'draft'
  | 'generated'
  | 'finalized'
  | string

export type SalesReportType =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'custom'
  | string

export interface SalesReportUser {
  id?: number | string
  name?: string
  email?: string
  phone?: string | null
  role?: string | null
}

export interface SalesReport {
  id: number | string

  report_number?: string | null
  report_code?: string | null
  reference?: string | null
  code?: string | null

  title?: string | null
  report_name?: string | null
  name?: string | null

  report_type?: SalesReportType | null
  type?: SalesReportType | null

  status?: SalesReportStatus | null

  start_date?: string | null
  date_from?: string | null
  period_start?: string | null

  end_date?: string | null
  date_to?: string | null
  period_end?: string | null

  total_orders?: number | string | null
  orders_count?: number | string | null

  completed_orders?: number | string | null
  completed_orders_count?: number | string | null

  cancelled_orders?: number | string | null
  canceled_orders?: number | string | null
  cancelled_orders_count?: number | string | null

  pending_orders?: number | string | null
  pending_orders_count?: number | string | null

  total_items_sold?: number | string | null
  items_sold?: number | string | null
  quantity_sold?: number | string | null

  gross_sales?: number | string | null
  gross_revenue?: number | string | null
  total_sales?: number | string | null

  discounts?: number | string | null
  total_discounts?: number | string | null
  discount_amount?: number | string | null

  refunds?: number | string | null
  total_refunds?: number | string | null
  refund_amount?: number | string | null

  net_sales?: number | string | null
  net_revenue?: number | string | null
  revenue?: number | string | null

  average_order_value?: number | string | null
  avg_order_value?: number | string | null

  cash_sales?: number | string | null
  wallet_sales?: number | string | null
  card_sales?: number | string | null
  mobile_money_sales?: number | string | null

  tax_amount?: number | string | null
  total_tax?: number | string | null

  cost_of_goods?: number | string | null
  cost_of_goods_sold?: number | string | null

  gross_profit?: number | string | null
  profit?: number | string | null

  notes?: string | null
  description?: string | null

  generation_notes?: string | null
  regeneration_notes?: string | null
  finalization_notes?: string | null
  finalized_notes?: string | null

  generated_by?: number | string | null
  created_by?: number | string | null
  updated_by?: number | string | null
  finalized_by?: number | string | null

  generator?: SalesReportUser | null
  generatedBy?: SalesReportUser | null
  creator?: SalesReportUser | null
  createdBy?: SalesReportUser | null
  finalizer?: SalesReportUser | null
  finalizedBy?: SalesReportUser | null

  generated_at?: string | null
  regenerated_at?: string | null
  finalized_at?: string | null

  deleted_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface SalesReportPayload {
  title: string
  report_type: string
  start_date: string
  end_date: string
  notes?: string
}

export interface RegenerateSalesReportPayload {
  start_date?: string
  end_date?: string
  notes?: string
}

export interface FinalizeSalesReportPayload {
  notes?: string
}

export interface SalesReportListParams {
  search?: string
  status?: string
  reportType?: string
  dateFrom?: string
  dateTo?: string
  includeDeleted?: boolean
  page?: number
  perPage?: number
}

export interface SalesReportListResult {
  reports: SalesReport[]
  current_page?: number
  last_page?: number
  per_page?: number
  total?: number
}

export interface SalesReportSummary {
  total_reports: number
  draft_reports: number
  finalized_reports: number
  total_orders: number
  completed_orders: number
  cancelled_orders: number
  total_items_sold: number
  gross_sales: number
  net_sales: number
  total_refunds: number
  average_order_value: number
}
