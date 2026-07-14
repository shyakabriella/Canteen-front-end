export type WalletTopUpStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | string

export interface WalletTopUpUser {
  id?: number | string
  name?: string
  email?: string
  phone?: string | null
}

export interface WalletTopUp {
  id: number | string

  user_id?: number | string | null
  user?: WalletTopUpUser | null

  amount: number | string
  status?: WalletTopUpStatus | null

  payment_method?: string | null
  transaction_reference?: string | null
  payment_reference?: string | null
  reference_number?: string | null
  reference?: string | null

  notes?: string | null
  reason?: string | null
  rejection_reason?: string | null
  cancellation_reason?: string | null
  approval_notes?: string | null

  approved_by?: number | string | null
  rejected_by?: number | string | null
  cancelled_by?: number | string | null

  approvedBy?: WalletTopUpUser | null
  rejectedBy?: WalletTopUpUser | null
  cancelledBy?: WalletTopUpUser | null
  createdBy?: WalletTopUpUser | null
  updatedBy?: WalletTopUpUser | null

  approved_at?: string | null
  rejected_at?: string | null
  cancelled_at?: string | null

  deleted_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface WalletTopUpPayload {
  amount: string
  payment_method: string
  transaction_reference?: string
  notes?: string
}

export interface WalletTopUpActionPayload {
  reason?: string
  notes?: string
}

export interface WalletTopUpListParams {
  search?: string
  status?: string
  userId?: string
  paymentMethod?: string
  dateFrom?: string
  dateTo?: string
  includeDeleted?: boolean
  page?: number
  perPage?: number
}

export interface WalletTopUpListResult {
  topUps: WalletTopUp[]
  current_page?: number
  last_page?: number
  per_page?: number
  total?: number
}

export interface WalletTopUpSummary {
  total_requests: number
  pending_requests: number
  approved_requests: number
  rejected_requests: number
  cancelled_requests: number

  total_requested_amount: number
  pending_amount: number
  approved_amount: number
  rejected_amount: number
  cancelled_amount: number
}
