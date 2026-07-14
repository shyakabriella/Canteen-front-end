import type { InventoryStock } from '@/types/inventory-stock'

function numericValue(value: unknown): number {
  const numberValue = Number(value ?? 0)

  return Number.isFinite(numberValue)
    ? numberValue
    : 0
}

export function getCurrentStock(
  stock: InventoryStock,
): number {
  return numericValue(
    stock.current_quantity ??
      stock.quantity ??
      stock.stock_quantity,
  )
}

export function getMinimumStock(
  stock: InventoryStock,
): number {
  return numericValue(
    stock.minimum_quantity ??
      stock.min_quantity ??
      stock.low_stock_quantity,
  )
}

export function getMaximumStock(
  stock: InventoryStock,
): number | null {
  const value =
    stock.maximum_quantity ??
    stock.max_quantity

  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return null
  }

  const numeric = Number(value)

  return Number.isFinite(numeric)
    ? numeric
    : null
}

export function getStockUnit(
  stock: InventoryStock,
): string {
  return stock.unit?.trim() || 'piece'
}

export function getInventoryFoodItem(
  stock: InventoryStock,
) {
  return stock.food_item ?? stock.foodItem ?? null
}

export function getInventoryFoodName(
  stock: InventoryStock,
): string {
  return (
    getInventoryFoodItem(stock)?.name ??
    `Food item #${stock.food_item_id ?? 'Unknown'}`
  )
}

export function isLowStock(
  stock: InventoryStock,
): boolean {
  return (
    getCurrentStock(stock) <=
    getMinimumStock(stock)
  )
}

export function isOutOfStock(
  stock: InventoryStock,
): boolean {
  return getCurrentStock(stock) <= 0
}

export function stockPercentage(
  stock: InventoryStock,
): number {
  const current = getCurrentStock(stock)
  const maximum = getMaximumStock(stock)

  if (maximum && maximum > 0) {
    return Math.min(
      Math.max((current / maximum) * 100, 0),
      100,
    )
  }

  const minimum = getMinimumStock(stock)
  const estimatedMaximum = Math.max(
    minimum * 4,
    current,
    1,
  )

  return Math.min(
    Math.max(
      (current / estimatedMaximum) * 100,
      0,
    ),
    100,
  )
}

export function formatStockQuantity(
  quantity: number | string,
  unit = 'piece',
): string {
  const numeric = Number(quantity)

  const formatted = Number.isFinite(numeric)
    ? new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 2,
      }).format(numeric)
    : String(quantity)

  return `${formatted} ${unit}`
}
