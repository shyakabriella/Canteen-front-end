import type { FoodItem } from './food-item'

export interface InventoryStock {
  id: number | string

  food_item_id?: number | string | null
  food_item?: FoodItem | null
  foodItem?: FoodItem | null

  quantity?: number | string
  current_quantity?: number | string
  stock_quantity?: number | string

  minimum_quantity?: number | string | null
  min_quantity?: number | string | null
  low_stock_quantity?: number | string | null

  maximum_quantity?: number | string | null
  max_quantity?: number | string | null

  unit?: string | null
  status?: string | null
  notes?: string | null

  deleted_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface InventoryStockPayload {
  food_item_id: string
  quantity: string
  minimum_quantity: string
  maximum_quantity?: string
  unit: string
  status?: 'active' | 'inactive'
  notes?: string
}

export interface StockAdjustmentPayload {
  quantity: string
  reason?: string
  notes?: string
}

export interface InventoryStockListParams {
  search?: string
  foodItemId?: string
  status?: string
  includeDeleted?: boolean
  page?: number
  perPage?: number
}

export interface InventoryStockListResult {
  stocks: InventoryStock[]
  current_page?: number
  last_page?: number
  per_page?: number
  total?: number
}
