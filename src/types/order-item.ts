import type { FoodItem } from '@/types/food-item'
import type { Order, OrderUser } from '@/types/order'

export type OrderItemStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled'
  | string

export interface OrderItemRecord {
  id: number | string

  order_id?: number | string | null
  order?: Order | null

  food_item_id?: number | string | null
  food_item?: FoodItem | null
  foodItem?: FoodItem | null

  user?: OrderUser | null

  quantity?: number | string
  unit_price?: number | string
  price?: number | string

  subtotal?: number | string
  total_price?: number | string
  total?: number | string

  status?: OrderItemStatus | null

  notes?: string | null
  item_notes?: string | null
  preparation_notes?: string | null

  deleted_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface OrderItemUpdatePayload {
  status: string
  notes?: string
}

export interface OrderItemListParams {
  search?: string
  orderId?: string
  foodItemId?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  includeDeleted?: boolean
  page?: number
  perPage?: number
}

export interface OrderItemListResult {
  orderItems: OrderItemRecord[]
  current_page?: number
  last_page?: number
  per_page?: number
  total?: number
}
