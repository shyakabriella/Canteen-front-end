export type LowStockAlertStatus =
  | 'active'
  | 'open'
  | 'pending'
  | 'resolved'
  | 'dismissed'
  | string

export type LowStockAlertSeverity =
  | 'critical'
  | 'warning'
  | 'low'
  | 'info'
  | string

export interface LowStockAlertUser {
  id?: number | string
  name?: string
  email?: string
  role?: string | null
}

export interface LowStockFoodItem {
  id?: number | string
  name?: string
  sku?: string | null
  image?: string | null
  unit?: string | null
  price?: number | string | null
}

export interface InventoryStockOption {
  id: number | string

  food_item_id?: number | string | null
  food_item?: LowStockFoodItem | null
  foodItem?: LowStockFoodItem | null

  quantity?: number | string | null
  current_quantity?: number | string | null
  stock_quantity?: number | string | null

  minimum_stock?: number | string | null
  minimum_quantity?: number | string | null
  reorder_level?: number | string | null
  low_stock_threshold?: number | string | null

  unit?: string | null
  status?: string | null

  deleted_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface LowStockAlert {
  id: number | string

  alert_code?: string | null
  reference?: string | null
  code?: string | null

  inventory_stock_id?: number | string | null
  food_item_id?: number | string | null

  inventory_stock?: InventoryStockOption | null
  inventoryStock?: InventoryStockOption | null

  food_item?: LowStockFoodItem | null
  foodItem?: LowStockFoodItem | null

  alert_type?: string | null
  type?: string | null

  severity?: LowStockAlertSeverity | null
  priority?: LowStockAlertSeverity | null

  status?: LowStockAlertStatus | null

  current_quantity?: number | string | null
  quantity?: number | string | null
  stock_quantity?: number | string | null

  threshold_quantity?: number | string | null
  minimum_quantity?: number | string | null
  reorder_level?: number | string | null

  shortage_quantity?: number | string | null
  shortage?: number | string | null

  message?: string | null
  description?: string | null
  notes?: string | null

  resolution_notes?: string | null
  resolved_notes?: string | null

  dismissal_reason?: string | null
  dismiss_reason?: string | null

  generated_by?: number | string | null
  created_by?: number | string | null
  resolved_by?: number | string | null
  dismissed_by?: number | string | null

  generator?: LowStockAlertUser | null
  createdBy?: LowStockAlertUser | null
  resolver?: LowStockAlertUser | null
  resolvedBy?: LowStockAlertUser | null
  dismisser?: LowStockAlertUser | null
  dismissedBy?: LowStockAlertUser | null

  generated_at?: string | null
  resolved_at?: string | null
  dismissed_at?: string | null

  deleted_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface LowStockAlertPayload {
  inventory_stock_id: string
  severity: string
  message?: string
  notes?: string
}

export interface ResolveLowStockAlertPayload {
  notes?: string
}

export interface DismissLowStockAlertPayload {
  reason: string
  notes?: string
}

export interface LowStockAlertListParams {
  search?: string
  status?: string
  severity?: string
  inventoryStockId?: string
  foodItemId?: string
  dateFrom?: string
  dateTo?: string
  includeDeleted?: boolean
  page?: number
  perPage?: number
}

export interface LowStockAlertListResult {
  alerts: LowStockAlert[]
  current_page?: number
  last_page?: number
  per_page?: number
  total?: number
}

export interface LowStockAlertSummary {
  total_alerts: number
  active_alerts: number
  critical_alerts: number
  warning_alerts: number
  resolved_alerts: number
  dismissed_alerts: number
  today_alerts: number
  affected_items: number
}

export interface GenerateLowStockAlertsResult {
  generated_count: number
  message: string
}
