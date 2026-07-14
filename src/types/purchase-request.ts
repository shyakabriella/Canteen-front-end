import type { InventoryStockOption } from '@/types/low-stock-alert'
import type { Supplier } from '@/types/supplier'

export type PurchaseRequestStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'ordered'
  | 'received'
  | 'cancelled'
  | string

export type PurchaseRequestPriority =
  | 'low'
  | 'normal'
  | 'medium'
  | 'high'
  | 'urgent'
  | 'critical'
  | string

export interface PurchaseRequestUser {
  id?: number | string
  name?: string
  email?: string
  phone?: string | null
  role?: string | null
}

export interface PurchaseRequestFoodItem {
  id?: number | string
  name?: string
  sku?: string | null
  unit?: string | null
}

export interface PurchaseRequest {
  id: number | string

  request_number?: string | null
  request_code?: string | null
  reference?: string | null
  code?: string | null

  supplier_id?: number | string | null
  supplier?: Supplier | null

  inventory_stock_id?: number | string | null
  inventory_stock?: InventoryStockOption | null
  inventoryStock?: InventoryStockOption | null

  food_item_id?: number | string | null
  food_item?: PurchaseRequestFoodItem | null
  foodItem?: PurchaseRequestFoodItem | null

  requested_quantity?: number | string | null
  quantity?: number | string | null
  received_quantity?: number | string | null

  unit?: string | null

  estimated_unit_cost?: number | string | null
  unit_cost?: number | string | null
  actual_unit_cost?: number | string | null

  estimated_total?: number | string | null
  estimated_total_cost?: number | string | null
  total_cost?: number | string | null
  actual_total?: number | string | null

  priority?: PurchaseRequestPriority | null
  status?: PurchaseRequestStatus | null

  reason?: string | null
  purpose?: string | null
  description?: string | null
  notes?: string | null

  approval_notes?: string | null
  rejection_reason?: string | null
  reject_reason?: string | null

  cancellation_reason?: string | null
  cancel_reason?: string | null

  order_notes?: string | null
  receiving_notes?: string | null
  receipt_notes?: string | null

  purchase_order_number?: string | null
  po_number?: string | null

  supplier_invoice_number?: string | null
  invoice_number?: string | null

  requested_by?: number | string | null
  approved_by?: number | string | null
  rejected_by?: number | string | null
  ordered_by?: number | string | null
  received_by?: number | string | null
  cancelled_by?: number | string | null

  requester?: PurchaseRequestUser | null
  requestedBy?: PurchaseRequestUser | null

  approver?: PurchaseRequestUser | null
  approvedBy?: PurchaseRequestUser | null

  rejecter?: PurchaseRequestUser | null
  rejectedBy?: PurchaseRequestUser | null

  orderer?: PurchaseRequestUser | null
  orderedBy?: PurchaseRequestUser | null

  receiver?: PurchaseRequestUser | null
  receivedBy?: PurchaseRequestUser | null

  canceller?: PurchaseRequestUser | null
  cancelledBy?: PurchaseRequestUser | null

  requested_at?: string | null
  approved_at?: string | null
  rejected_at?: string | null
  ordered_at?: string | null
  received_at?: string | null
  cancelled_at?: string | null

  expected_delivery_date?: string | null
  expected_delivery_at?: string | null

  deleted_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface PurchaseRequestPayload {
  supplier_id: string
  inventory_stock_id: string
  quantity: string
  unit_cost: string
  expected_delivery_date?: string
  priority: string
  reason: string
  notes?: string
}

export interface ApprovePurchaseRequestPayload {
  notes?: string
}

export interface RejectPurchaseRequestPayload {
  reason: string
  notes?: string
}

export interface MarkPurchaseRequestOrderedPayload {
  purchase_order_number?: string
  expected_delivery_date?: string
  notes?: string
}

export interface ReceivePurchaseRequestPayload {
  received_quantity: string
  actual_unit_cost?: string
  supplier_invoice_number?: string
  notes?: string
}

export interface CancelPurchaseRequestPayload {
  reason: string
  notes?: string
}

export interface PurchaseRequestListParams {
  search?: string
  status?: string
  priority?: string
  supplierId?: string
  inventoryStockId?: string
  dateFrom?: string
  dateTo?: string
  includeDeleted?: boolean
  page?: number
  perPage?: number
}

export interface PurchaseRequestListResult {
  requests: PurchaseRequest[]
  current_page?: number
  last_page?: number
  per_page?: number
  total?: number
}

export interface PurchaseRequestSummary {
  total_requests: number
  pending_requests: number
  approved_requests: number
  ordered_requests: number
  received_requests: number
  rejected_requests: number
  cancelled_requests: number
  urgent_requests: number
  total_estimated_amount: number
}
