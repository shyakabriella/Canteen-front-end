export type SupplierStatus =
  | 'active'
  | 'inactive'
  | 'suspended'
  | 'blocked'
  | string

export interface Supplier {
  id: number | string

  supplier_code?: string | null
  code?: string | null

  name?: string | null
  supplier_name?: string | null
  company_name?: string | null

  contact_person?: string | null
  contact_name?: string | null

  email?: string | null
  phone?: string | null
  secondary_phone?: string | null
  alternative_phone?: string | null

  address?: string | null
  city?: string | null
  country?: string | null

  tax_number?: string | null
  tin_number?: string | null

  payment_terms?: string | null
  status?: SupplierStatus | null
  notes?: string | null

  purchase_requests_count?: number | string | null
  purchase_orders_count?: number | string | null
  supplied_items_count?: number | string | null

  total_purchase_amount?: number | string | null
  total_amount?: number | string | null

  last_purchase_at?: string | null
  last_order_at?: string | null

  created_by?: number | string | null
  updated_by?: number | string | null

  deleted_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface SupplierPayload {
  name: string
  contact_person: string
  email?: string
  phone: string
  secondary_phone?: string
  address?: string
  city?: string
  country?: string
  tax_number?: string
  payment_terms?: string
  status: string
  notes?: string
}

export interface SupplierListParams {
  search?: string
  status?: string
  city?: string
  country?: string
  dateFrom?: string
  dateTo?: string
  includeDeleted?: boolean
  page?: number
  perPage?: number
}

export interface SupplierListResult {
  suppliers: Supplier[]
  current_page?: number
  last_page?: number
  per_page?: number
  total?: number
}

export interface SupplierSummary {
  total_suppliers: number
  active_suppliers: number
  inactive_suppliers: number
  suspended_suppliers: number
  suppliers_with_orders: number
  total_purchase_requests: number
  total_purchase_amount: number
}
