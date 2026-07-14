import type {
  InventoryStockOption,
  LowStockAlert,
  LowStockAlertSeverity,
  LowStockAlertStatus,
  LowStockFoodItem,
} from '@/types/low-stock-alert'

export function lowStockNumber(
  value: unknown,
): number {
  const number = Number(value ?? 0)

  return Number.isFinite(number)
    ? number
    : 0
}

export function normalizeLowStockStatus(
  status?: LowStockAlertStatus | null,
): 'active' | 'resolved' | 'dismissed' {
  const value = String(status ?? 'active')
    .trim()
    .toLowerCase()
    .replaceAll('-', '_')
    .replaceAll(' ', '_')

  if (
    [
      'resolved',
      'completed',
      'fixed',
      'restocked',
      'closed',
    ].includes(value)
  ) {
    return 'resolved'
  }

  if (
    [
      'dismissed',
      'ignored',
      'cancelled',
      'canceled',
      'rejected',
    ].includes(value)
  ) {
    return 'dismissed'
  }

  return 'active'
}

export function getLowStockAlertStatus(
  alert: LowStockAlert,
): 'active' | 'resolved' | 'dismissed' {
  return normalizeLowStockStatus(alert.status)
}

export function lowStockStatusLabel(
  alert: LowStockAlert,
): string {
  const status = getLowStockAlertStatus(alert)

  if (status === 'resolved') {
    return 'Resolved'
  }

  if (status === 'dismissed') {
    return 'Dismissed'
  }

  return 'Active'
}

export function normalizeLowStockSeverity(
  severity?: LowStockAlertSeverity | null,
): 'critical' | 'warning' | 'low' {
  const value = String(severity ?? 'warning')
    .trim()
    .toLowerCase()
    .replaceAll('-', '_')
    .replaceAll(' ', '_')

  if (
    [
      'critical',
      'urgent',
      'high',
      'severe',
      'out_of_stock',
    ].includes(value)
  ) {
    return 'critical'
  }

  if (
    [
      'low',
      'info',
      'informational',
      'minor',
    ].includes(value)
  ) {
    return 'low'
  }

  return 'warning'
}

export function getLowStockAlertSeverity(
  alert: LowStockAlert,
): 'critical' | 'warning' | 'low' {
  return normalizeLowStockSeverity(
    alert.severity ?? alert.priority,
  )
}

export function lowStockSeverityLabel(
  alert: LowStockAlert,
): string {
  const severity =
    getLowStockAlertSeverity(alert)

  if (severity === 'critical') {
    return 'Critical'
  }

  if (severity === 'low') {
    return 'Low'
  }

  return 'Warning'
}

export function getAlertReference(
  alert: LowStockAlert,
): string {
  return (
    alert.alert_code ??
    alert.reference ??
    alert.code ??
    `LSA-${alert.id}`
  )
}

export function getAlertInventoryStock(
  alert: LowStockAlert,
): InventoryStockOption | null {
  return (
    alert.inventory_stock ??
    alert.inventoryStock ??
    null
  )
}

export function getStockFoodItem(
  stock?: InventoryStockOption | null,
): LowStockFoodItem | null {
  if (!stock) {
    return null
  }

  return stock.food_item ?? stock.foodItem ?? null
}

export function getAlertFoodItem(
  alert: LowStockAlert,
): LowStockFoodItem | null {
  return (
    alert.food_item ??
    alert.foodItem ??
    getStockFoodItem(
      getAlertInventoryStock(alert),
    )
  )
}

export function getAlertFoodName(
  alert: LowStockAlert,
): string {
  return (
    getAlertFoodItem(alert)?.name ??
    (
      alert.food_item_id
        ? `Food item #${alert.food_item_id}`
        : 'Food item not available'
    )
  )
}

export function getStockFoodName(
  stock: InventoryStockOption,
): string {
  return (
    getStockFoodItem(stock)?.name ??
    (
      stock.food_item_id
        ? `Food item #${stock.food_item_id}`
        : `Inventory stock #${stock.id}`
    )
  )
}

export function getStockQuantity(
  stock: InventoryStockOption,
): number {
  return lowStockNumber(
    stock.current_quantity ??
    stock.stock_quantity ??
    stock.quantity,
  )
}

export function getStockThreshold(
  stock: InventoryStockOption,
): number {
  return lowStockNumber(
    stock.low_stock_threshold ??
    stock.reorder_level ??
    stock.minimum_quantity ??
    stock.minimum_stock,
  )
}

export function getStockUnit(
  stock: InventoryStockOption,
): string {
  return (
    stock.unit ??
    getStockFoodItem(stock)?.unit ??
    'units'
  )
}

export function getAlertCurrentQuantity(
  alert: LowStockAlert,
): number {
  const supplied =
    alert.current_quantity ??
    alert.stock_quantity ??
    alert.quantity

  if (
    supplied !== undefined &&
    supplied !== null &&
    supplied !== ''
  ) {
    return lowStockNumber(supplied)
  }

  const stock = getAlertInventoryStock(alert)

  return stock
    ? getStockQuantity(stock)
    : 0
}

export function getAlertThreshold(
  alert: LowStockAlert,
): number {
  const supplied =
    alert.threshold_quantity ??
    alert.minimum_quantity ??
    alert.reorder_level

  if (
    supplied !== undefined &&
    supplied !== null &&
    supplied !== ''
  ) {
    return lowStockNumber(supplied)
  }

  const stock = getAlertInventoryStock(alert)

  return stock
    ? getStockThreshold(stock)
    : 0
}

export function getAlertShortage(
  alert: LowStockAlert,
): number {
  const supplied =
    alert.shortage_quantity ??
    alert.shortage

  if (
    supplied !== undefined &&
    supplied !== null &&
    supplied !== ''
  ) {
    return Math.max(
      lowStockNumber(supplied),
      0,
    )
  }

  return Math.max(
    getAlertThreshold(alert) -
      getAlertCurrentQuantity(alert),
    0,
  )
}

export function getAlertMessage(
  alert: LowStockAlert,
): string {
  return (
    alert.message ??
    alert.description ??
    'Inventory quantity is below the configured threshold.'
  )
}

export function getAlertResolutionNotes(
  alert: LowStockAlert,
): string {
  return (
    alert.resolution_notes ??
    alert.resolved_notes ??
    'No resolution notes provided.'
  )
}

export function getAlertDismissalReason(
  alert: LowStockAlert,
): string {
  return (
    alert.dismissal_reason ??
    alert.dismiss_reason ??
    'No dismissal reason provided.'
  )
}

export function getAlertCreatedBy(
  alert: LowStockAlert,
): string {
  return (
    alert.generator?.name ??
    alert.createdBy?.name ??
    (
      alert.generated_by
        ? `User #${alert.generated_by}`
        : alert.created_by
          ? `User #${alert.created_by}`
          : 'System'
    )
  )
}

export function getAlertResolvedBy(
  alert: LowStockAlert,
): string {
  return (
    alert.resolver?.name ??
    alert.resolvedBy?.name ??
    (
      alert.resolved_by
        ? `User #${alert.resolved_by}`
        : 'Not available'
    )
  )
}

export function getAlertDismissedBy(
  alert: LowStockAlert,
): string {
  return (
    alert.dismisser?.name ??
    alert.dismissedBy?.name ??
    (
      alert.dismissed_by
        ? `User #${alert.dismissed_by}`
        : 'Not available'
    )
  )
}

export function getAlertDate(
  alert: LowStockAlert,
): string | null {
  return (
    alert.generated_at ??
    alert.created_at ??
    null
  )
}

export function recommendStockSeverity(
  stock: InventoryStockOption,
): 'critical' | 'warning' | 'low' {
  const current = getStockQuantity(stock)
  const threshold = getStockThreshold(stock)

  if (current <= 0) {
    return 'critical'
  }

  if (
    threshold > 0 &&
    current <= threshold * 0.5
  ) {
    return 'critical'
  }

  if (
    threshold > 0 &&
    current <= threshold
  ) {
    return 'warning'
  }

  return 'low'
}

export function formatLowStockQuantity(
  value: number | string,
  unit = 'units',
): string {
  const numeric = Number(value)

  if (!Number.isFinite(numeric)) {
    return `${value} ${unit}`
  }

  return `${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(numeric)} ${unit}`
}

export function formatLowStockDate(
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

export function canResolveLowStockAlert(
  alert: LowStockAlert,
): boolean {
  return (
    !alert.deleted_at &&
    getLowStockAlertStatus(alert) === 'active'
  )
}

export function canDismissLowStockAlert(
  alert: LowStockAlert,
): boolean {
  return (
    !alert.deleted_at &&
    getLowStockAlertStatus(alert) === 'active'
  )
}
