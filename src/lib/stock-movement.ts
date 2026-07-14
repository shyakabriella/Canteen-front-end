import type { FoodItem } from '@/types/food-item'
import type { InventoryStock } from '@/types/inventory-stock'
import type {
  StockMovement,
  StockMovementType,
} from '@/types/stock-movement'

function numberValue(value: unknown): number {
  const numeric = Number(value ?? 0)

  return Number.isFinite(numeric) ? numeric : 0
}

export function getMovementType(
  movement: StockMovement,
): StockMovementType {
  return movement.movement_type ?? movement.type ?? 'adjustment'
}

export function normalizeMovementType(
  type?: StockMovementType | null,
): 'in' | 'out' | 'adjustment' {
  const normalized = String(type ?? '')
    .trim()
    .toLowerCase()
    .replaceAll('-', '_')
    .replaceAll(' ', '_')

  if (
    [
      'in',
      'stock_in',
      'addition',
      'add',
      'increase',
      'purchase',
      'restock',
      'received',
    ].includes(normalized)
  ) {
    return 'in'
  }

  if (
    [
      'out',
      'stock_out',
      'reduction',
      'reduce',
      'decrease',
      'sale',
      'sold',
      'used',
      'usage',
    ].includes(normalized)
  ) {
    return 'out'
  }

  return 'adjustment'
}

export function movementTypeLabel(
  movement: StockMovement,
): string {
  const type = normalizeMovementType(
    getMovementType(movement),
  )

  if (type === 'in') {
    return 'Stock In'
  }

  if (type === 'out') {
    return 'Stock Out'
  }

  return 'Adjustment'
}

export function getMovementQuantity(
  movement: StockMovement,
): number {
  return numberValue(
    movement.quantity ?? movement.amount,
  )
}

export function getQuantityBefore(
  movement: StockMovement,
): number | null {
  const value =
    movement.quantity_before ??
    movement.stock_before ??
    movement.previous_quantity

  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return null
  }

  return numberValue(value)
}

export function getQuantityAfter(
  movement: StockMovement,
): number | null {
  const value =
    movement.quantity_after ??
    movement.stock_after ??
    movement.new_quantity

  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return null
  }

  return numberValue(value)
}

export function getMovementInventoryStock(
  movement: StockMovement,
): InventoryStock | null {
  return (
    movement.inventory_stock ??
    movement.inventoryStock ??
    null
  )
}

export function getMovementFoodItem(
  movement: StockMovement,
): FoodItem | null {
  const inventoryStock =
    getMovementInventoryStock(movement)

  return (
    movement.food_item ??
    movement.foodItem ??
    inventoryStock?.food_item ??
    inventoryStock?.foodItem ??
    null
  )
}

export function getMovementFoodName(
  movement: StockMovement,
): string {
  return (
    getMovementFoodItem(movement)?.name ??
    `Food item #${movement.food_item_id ?? movement.inventory_stock_id ?? 'Unknown'}`
  )
}

export function getMovementUnit(
  movement: StockMovement,
): string {
  return (
    getMovementInventoryStock(movement)?.unit ??
    getMovementFoodItem(movement)?.unit ??
    'piece'
  )
}

export function getMovementUserName(
  movement: StockMovement,
): string {
  return (
    movement.createdBy?.name ??
    movement.created_by_user?.name ??
    'System User'
  )
}

export function formatMovementQuantity(
  value: number | string,
  unit = 'piece',
): string {
  const numeric = Number(value)

  const formatted = Number.isFinite(numeric)
    ? new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 2,
      }).format(numeric)
    : String(value)

  return `${formatted} ${unit}`
}

export function formatMovementDate(
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
      ? {
          timeStyle: 'short',
        }
      : {}),
  }).format(date)
}
