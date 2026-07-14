import type { FoodItem } from '@/types/food-item'

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled'
  | string

export type OrderPaymentStatus =
  | 'pending'
  | 'paid'
  | 'refunded'
  | 'failed'
  | string

export interface OrderUser {
  id?: number | string
  name?: string
  email?: string
  phone?: string | null
  user_code?: string | null
  wallet_balance?: number | string | null
}

export interface OrderItem {
  id?: number | string
  order_id?: number | string
  food_item_id?: number | string

  food_item?: FoodItem | null
  foodItem?: FoodItem | null

  quantity?: number | string
  unit_price?: number | string
  price?: number | string
  subtotal?: number | string
  total_price?: number | string

  notes?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface Order {
  id: number | string

  order_number?: string | null
  reference?: string | null
  code?: string | null

  user_id?: number | string | null
  user?: OrderUser | null

  status?: OrderStatus | null
  payment_status?: OrderPaymentStatus | null

  subtotal?: number | string | null
  total_amount?: number | string | null
  total?: number | string | null
  amount?: number | string | null

  notes?: string | null
  order_notes?: string | null
  pickup_notes?: string | null

  cancellation_reason?: string | null
  cancel_reason?: string | null

  items?: OrderItem[]
  order_items?: OrderItem[]
  orderItems?: OrderItem[]

  preparing_at?: string | null
  prepared_at?: string | null
  ready_at?: string | null
  completed_at?: string | null
  cancelled_at?: string | null

  created_by?: number | string | null
  updated_by?: number | string | null

  deleted_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface CreateOrderItemPayload {
  food_item_id: string
  quantity: number
}

export interface OrderPayload {
  user_id: string
  items: CreateOrderItemPayload[]
  notes?: string
  pickup_notes?: string
}

export interface OrderUpdatePayload {
  notes?: string
  pickup_notes?: string
}

export interface OrderActionPayload {
  reason?: string
  notes?: string
}

export interface OrderListParams {
  search?: string
  status?: string
  paymentStatus?: string
  userId?: string
  dateFrom?: string
  dateTo?: string
  includeDeleted?: boolean
  page?: number
  perPage?: number
}

export interface OrderListResult {
  orders: Order[]
  current_page?: number
  last_page?: number
  per_page?: number
  total?: number
}

export interface OrderSummary {
  total_orders: number
  pending_orders: number
  preparing_orders: number
  ready_orders: number
  completed_orders: number
  cancelled_orders: number

  total_sales: number
  completed_sales: number
  refunded_amount: number
}
