import { apiRequest } from '@/lib/api'
import {
  getAlertDate,
  getAlertFoodItem,
  getLowStockAlertSeverity,
  getLowStockAlertStatus,
} from '@/lib/low-stock-alert'
import type {
  DismissLowStockAlertPayload,
  GenerateLowStockAlertsResult,
  InventoryStockOption,
  LowStockAlert,
  LowStockAlertListParams,
  LowStockAlertListResult,
  LowStockAlertPayload,
  LowStockAlertSummary,
  ResolveLowStockAlertPayload,
} from '@/types/low-stock-alert'

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

function looksLikeAlert(
  value: unknown,
): value is LowStockAlert {
  const record = asRecord(value)

  if (!record) {
    return false
  }

  return (
    'id' in record ||
    'inventory_stock_id' in record ||
    'alert_code' in record ||
    'severity' in record
  )
}

function extractAlert(
  payload: unknown,
): LowStockAlert | undefined {
  if (looksLikeAlert(payload)) {
    return payload
  }

  const root = asRecord(payload)
  const data = root?.data
  const dataRecord = asRecord(data)

  const possibleValues = [
    root?.low_stock_alert,
    root?.lowStockAlert,
    root?.alert,
    data,
    dataRecord?.low_stock_alert,
    dataRecord?.lowStockAlert,
    dataRecord?.alert,
  ]

  return possibleValues.find(looksLikeAlert)
}

function extractAlertArray(
  payload: unknown,
): LowStockAlert[] {
  if (Array.isArray(payload)) {
    return payload.filter(looksLikeAlert)
  }

  const root = asRecord(payload)

  if (!root) {
    return []
  }

  const data = asRecord(root.data)

  const possibleArrays = [
    root.low_stock_alerts,
    root.lowStockAlerts,
    root.alerts,
    root.items,
    root.data,

    data?.low_stock_alerts,
    data?.lowStockAlerts,
    data?.alerts,
    data?.items,
    data?.data,
  ]

  for (const possibleArray of possibleArrays) {
    if (Array.isArray(possibleArray)) {
      return possibleArray.filter(
        looksLikeAlert,
      )
    }
  }

  return []
}

function looksLikeInventoryStock(
  value: unknown,
): value is InventoryStockOption {
  const record = asRecord(value)

  if (!record) {
    return false
  }

  return (
    'id' in record &&
    (
      'food_item_id' in record ||
      'quantity' in record ||
      'current_quantity' in record ||
      'stock_quantity' in record
    )
  )
}

function extractInventoryStocks(
  payload: unknown,
): InventoryStockOption[] {
  if (Array.isArray(payload)) {
    return payload.filter(
      looksLikeInventoryStock,
    )
  }

  const root = asRecord(payload)

  if (!root) {
    return []
  }

  const data = asRecord(root.data)

  const possibleArrays = [
    root.inventory_stocks,
    root.inventoryStocks,
    root.stocks,
    root.items,
    root.data,

    data?.inventory_stocks,
    data?.inventoryStocks,
    data?.stocks,
    data?.items,
    data?.data,
  ]

  for (const possibleArray of possibleArrays) {
    if (Array.isArray(possibleArray)) {
      return possibleArray.filter(
        looksLikeInventoryStock,
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
  params: LowStockAlertListParams,
): string {
  const query = new URLSearchParams()

  if (params.search?.trim()) {
    query.set('search', params.search.trim())
  }

  if (params.status) {
    query.set('status', params.status)
  }

  if (params.severity) {
    query.set('severity', params.severity)
  }

  if (params.inventoryStockId) {
    query.set(
      'inventory_stock_id',
      params.inventoryStockId,
    )
  }

  if (params.foodItemId) {
    query.set(
      'food_item_id',
      params.foodItemId,
    )
  }

  if (params.dateFrom) {
    query.set('date_from', params.dateFrom)
  }

  if (params.dateTo) {
    query.set('date_to', params.dateTo)
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

function alertRequestPayload(
  payload: LowStockAlertPayload,
) {
  const message =
    payload.message?.trim() || null

  return {
    inventory_stock_id:
      payload.inventory_stock_id,

    severity: payload.severity,
    priority: payload.severity,

    alert_type: 'low_stock',
    type: 'low_stock',

    message,
    description: message,

    notes: payload.notes?.trim() || null,
  }
}

export async function getLowStockInventoryOptions(): Promise<InventoryStockOption[]> {
  const response = await apiRequest<unknown>(
    '/inventory-stocks?per_page=200',
    {
      method: 'GET',
      auth: true,
      cache: 'no-store',
    },
  )

  return extractInventoryStocks(response)
}

export async function getLowStockAlerts(
  params: LowStockAlertListParams = {},
): Promise<LowStockAlertListResult> {
  const query = buildQuery(params)

  const response = await apiRequest<unknown>(
    `/low-stock-alerts${query ? `?${query}` : ''}`,
    {
      method: 'GET',
      auth: true,
      cache: 'no-store',
    },
  )

  const root = asRecord(response)
  const data = asRecord(root?.data)

  return {
    alerts: extractAlertArray(response),

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

export async function getLowStockAlertSummary(
  params: LowStockAlertListParams = {},
): Promise<LowStockAlertSummary> {
  const query = buildQuery(params)

  const response = await apiRequest<unknown>(
    `/low-stock-alerts/summary${query ? `?${query}` : ''}`,
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

  const alerts = extractAlertArray(response)

  const active = alerts.filter(
    (alert) =>
      getLowStockAlertStatus(alert) === 'active',
  )

  const resolved = alerts.filter(
    (alert) =>
      getLowStockAlertStatus(alert) ===
      'resolved',
  )

  const dismissed = alerts.filter(
    (alert) =>
      getLowStockAlertStatus(alert) ===
      'dismissed',
  )

  const critical = active.filter(
    (alert) =>
      getLowStockAlertSeverity(alert) ===
      'critical',
  )

  const warning = active.filter(
    (alert) =>
      getLowStockAlertSeverity(alert) ===
      'warning',
  )

  const today = new Date()

  const todayKey = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-')

  const todayAlerts = alerts.filter((alert) => {
    const value = getAlertDate(alert)

    if (!value) {
      return false
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return value.startsWith(todayKey)
    }

    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-') === todayKey
  })

  const affectedItems = new Set(
    active
      .map((alert) =>
        alert.food_item_id ??
        getAlertFoodItem(alert)?.id ??
        alert.inventory_stock_id,
      )
      .filter(Boolean)
      .map(String),
  ).size

  return {
    total_alerts: firstNumber(
      summary.total_alerts,
      summary.alerts_count,
      summary.total,
      alerts.length,
    ),

    active_alerts: firstNumber(
      summary.active_alerts,
      summary.open_alerts,
      summary.active_count,
      active.length,
    ),

    critical_alerts: firstNumber(
      summary.critical_alerts,
      summary.critical_count,
      critical.length,
    ),

    warning_alerts: firstNumber(
      summary.warning_alerts,
      summary.warning_count,
      warning.length,
    ),

    resolved_alerts: firstNumber(
      summary.resolved_alerts,
      summary.resolved_count,
      resolved.length,
    ),

    dismissed_alerts: firstNumber(
      summary.dismissed_alerts,
      summary.dismissed_count,
      dismissed.length,
    ),

    today_alerts: firstNumber(
      summary.today_alerts,
      summary.alerts_today,
      todayAlerts.length,
    ),

    affected_items: firstNumber(
      summary.affected_items,
      summary.affected_food_items,
      affectedItems,
    ),
  }
}

export async function generateLowStockAlerts(): Promise<GenerateLowStockAlertsResult> {
  const response = await apiRequest<unknown>(
    '/low-stock-alerts/generate',
    {
      method: 'POST',
      auth: true,
      body: {},
    },
  )

  const root = asRecord(response)
  const data = asRecord(root?.data)

  return {
    generated_count: firstNumber(
      root?.generated_count,
      root?.created_count,
      data?.generated_count,
      data?.created_count,
      data?.count,
    ),

    message: extractMessage(
      response,
      'Low-stock alerts generated successfully.',
    ),
  }
}

export async function getLowStockAlert(
  id: number | string,
): Promise<LowStockAlert> {
  const response = await apiRequest<unknown>(
    `/low-stock-alerts/${id}`,
    {
      method: 'GET',
      auth: true,
      cache: 'no-store',
    },
  )

  const alert = extractAlert(response)

  if (!alert) {
    throw new Error(
      'The backend did not return the requested low-stock alert.',
    )
  }

  return alert
}

export async function createLowStockAlert(
  payload: LowStockAlertPayload,
): Promise<{
  alert?: LowStockAlert
  message: string
}> {
  const response = await apiRequest<unknown>(
    '/low-stock-alerts',
    {
      method: 'POST',
      auth: true,
      body: alertRequestPayload(payload),
    },
  )

  return {
    alert: extractAlert(response),

    message: extractMessage(
      response,
      'Low-stock alert created successfully.',
    ),
  }
}

export async function updateLowStockAlert(
  id: number | string,
  payload: LowStockAlertPayload,
): Promise<{
  alert?: LowStockAlert
  message: string
}> {
  const response = await apiRequest<unknown>(
    `/low-stock-alerts/${id}`,
    {
      method: 'PATCH',
      auth: true,
      body: alertRequestPayload(payload),
    },
  )

  return {
    alert: extractAlert(response),

    message: extractMessage(
      response,
      'Low-stock alert updated successfully.',
    ),
  }
}

export async function deleteLowStockAlert(
  id: number | string,
): Promise<string> {
  const response = await apiRequest<unknown>(
    `/low-stock-alerts/${id}`,
    {
      method: 'DELETE',
      auth: true,
    },
  )

  return extractMessage(
    response,
    'Low-stock alert deleted successfully.',
  )
}

export async function resolveLowStockAlert(
  id: number | string,
  payload: ResolveLowStockAlertPayload,
): Promise<{
  alert?: LowStockAlert
  message: string
}> {
  const notes =
    payload.notes?.trim() || null

  const response = await apiRequest<unknown>(
    `/low-stock-alerts/${id}/resolve`,
    {
      method: 'POST',
      auth: true,
      body: {
        notes,
        resolution_notes: notes,
        resolved_notes: notes,
      },
    },
  )

  return {
    alert: extractAlert(response),

    message: extractMessage(
      response,
      'Low-stock alert resolved successfully.',
    ),
  }
}

export async function dismissLowStockAlert(
  id: number | string,
  payload: DismissLowStockAlertPayload,
): Promise<{
  alert?: LowStockAlert
  message: string
}> {
  const reason = payload.reason.trim()
  const notes =
    payload.notes?.trim() || null

  const response = await apiRequest<unknown>(
    `/low-stock-alerts/${id}/dismiss`,
    {
      method: 'POST',
      auth: true,
      body: {
        reason,
        dismissal_reason: reason,
        dismiss_reason: reason,
        notes,
      },
    },
  )

  return {
    alert: extractAlert(response),

    message: extractMessage(
      response,
      'Low-stock alert dismissed successfully.',
    ),
  }
}

export async function restoreLowStockAlert(
  id: number | string,
): Promise<string> {
  const response = await apiRequest<unknown>(
    `/low-stock-alerts/${id}/restore`,
    {
      method: 'POST',
      auth: true,
    },
  )

  return extractMessage(
    response,
    'Low-stock alert restored successfully.',
  )
}
