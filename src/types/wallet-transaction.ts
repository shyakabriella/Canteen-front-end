export type WalletTransactionType =
  | 'credit'
  | 'debit'
  | 'adjustment'
  | 'top_up'
  | 'payment'
  | 'refund'
  | 'purchase'
  | string

export interface WalletTransactionUser {
  id?: number | string
  name?: string
  email?: string
  phone?: string | null
  wallet_balance?: number | string | null
}

export interface WalletTransaction {
  id: number | string

  user_id?: number | string | null
  user?: WalletTransactionUser | null

  transaction_type?: WalletTransactionType | null
  type?: WalletTransactionType | null

  amount: number | string

  balance_before?: number | string | null
  previous_balance?: number | string | null

  balance_after?: number | string | null
  new_balance?: number | string | null

  description?: string | null
  notes?: string | null
  reason?: string | null

  reference?: string | null
  transaction_reference?: string | null
  reference_type?: string | null
  reference_id?: number | string | null

  status?: string | null

  created_by?: number | string | null
  updated_by?: number | string | null

  createdBy?: WalletTransactionUser | null
  updatedBy?: WalletTransactionUser | null
  created_by_user?: WalletTransactionUser | null
  updated_by_user?: WalletTransactionUser | null

  deleted_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface WalletTransactionPayload {
  user_id: string
  transaction_type: 'credit' | 'debit'
  amount: string
  description: string
  notes?: string
  reference?: string
}

export interface WalletTransactionUpdatePayload {
  description: string
  notes?: string
}

export interface WalletTransactionListParams {
  search?: string
  transactionType?: string
  userId?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  includeDeleted?: boolean
  page?: number
  perPage?: number
}

export interface WalletTransactionListResult {
  transactions: WalletTransaction[]
  current_page?: number
  last_page?: number
  per_page?: number
  total?: number
}

export interface WalletTransactionSummary {
  total_transactions: number

  credit_transactions: number
  debit_transactions: number
  adjustment_transactions: number

  total_credit_amount: number
  total_debit_amount: number
  net_amount: number
}
