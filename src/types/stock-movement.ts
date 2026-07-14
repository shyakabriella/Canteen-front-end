import type { FoodItem } from '@/types/food-item'
import type { InventoryStock } from '@/types/inventory-stock'

export type StockMovementType =
  | 'in'
  | 'out'
  | 'adjustment'
  | 'stock_in'
  | 'stock_out'
  | 'addition'
  | 'reduction'
  | string

export interface StockMovementUser {
  id?: number | string
  name?: string
  email?: string
}

export interface StockMovement {
  id: number | string

  inventory_stock_id?: number | string | null
  inventory_stock?: InventoryStock | null
  inventoryStock?: InventoryStock | null

  food_item_id?: number | string | null
  food_item?: FoodItem | null
  foodItem?: FoodItem | null

  movement_type?: StockMovementType | null
  type?: StockMovementType | null

  quantity?: number | string
  amount?: number | string

  quantity_before?: number | string | null
  stock_before?: number | string | null
  previous_quantity?: number | string | null

  quantity_after?: number | string | null
  stock_after?: number | string | null
  new_quantity?: number | string | null

  reason?: string | null
  notes?: string | null
  reference?: string | null
  reference_type?: string | null
  reference_id?: number | string | null

  created_by?: number | string | null
  updated_by?: number | string | null
  createdBy?: StockMovementUser | null
  updatedBy?: StockMovementUser | null
  created_by_user?: StockMovementUser | null
  updated_by_user?: StockMovementUser | null

  deleted_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface StockMovementPayload {
  inventory_stock_id: string
  food_item_id?: string
  movement_type: 'in' | 'out' | 'adjustment'
  quantity: string
  reason?: string
  notes?: string
}

export interface StockMovementUpdatePayload {
  reason?: string
  notes?: string
}

export interface StockMovementListParams {
  search?: string
  inventoryStockId?: string
  foodItemId?: string
  movementType?: string
  dateFrom?: string
  dateTo?: string
  includeDeleted?: boolean
  page?: number
  perPage?: number
}

export interface StockMovementListResult {
  movements: StockMovement[]
  current_page?: number
  last_page?: number
  per_page?: number
  total?: number
}

export interface StockMovementSummary {
  total_movements: number
  total_stock_in: number
  total_stock_out: number
  total_adjustments: number
  stock_in_quantity: number
  stock_out_quantity: number
  net_quantity: number
}
