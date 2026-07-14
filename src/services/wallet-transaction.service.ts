import {
  apiRequest,
  ApiError,
} from '@/lib/api'
import {
  getTransactionAmount,
  getTransactionType,
} from '@/lib/wallet-transaction'
import type {
  WalletTransaction,
  WalletTransactionListParams,
  WalletTransactionListResult,
  WalletTransactionPayload,
  WalletTransactionSummary,
  WalletTransactionUpdatePayload,
} from '@/types/wallet-transaction'

type UnknownRecord = Record<string, unknown>

function asRecord(
  value: unknown,
): UnknownRecord | null {
  if (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  ) {
    return value as UnknownRecord
  }

  return null
}

function firstNumber(
  ...values: unknown[]
): number {
  for (const value of values) {
    if (
      value !== undefined &&
      value !== null &&
      value !== ''
    ) {
      const numeric = Number(value)

      if (Number.isFinite(numeric)) {
        return numeric
      }
    }
  }

  return 0
}

function optionalNumber(
  value: unknown,
): number | undefined {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return undefined
  }

  const numeric = Number(value)

  return Number.isFinite(numeric)
    ? numeric
    : undefined
}

function looksLikeTransaction(
  value: unknown,
): value is WalletTransaction {
  const record = asRecord(value)

  if (!record) {
    return false
  }

  return (
    'id' in record ||
    'amount' in record ||
    'user_id' in record ||
    'transaction_type' in record
  )
}

function extractTransaction(
  payload: unknown,
): WalletTransaction | undefined {
  if (looksLikeTransaction(payload)) {
    return payload
  }

  const root = asRecord(payload)
  const data = root?.data
  const dataRecord = asRecord(data)

  const possibleTransactions = [
    root?.wallet_transaction,
    root?.walletTransaction,
    root?.transaction,
    data,
    dataRecord?.wallet_transaction,
    dataRecord?.walletTransaction,
    dataRecord?.transaction,
  ]

  return possibleTransactions.find(
    looksLikeTransaction,
  )
}

function extractTransactionArray(
  payload: unknown,
): WalletTransaction[] {
  if (Array.isArray(payload)) {
    return payload.filter(looksLikeTransaction)
  }

  const root = asRecord(payload)

  if (!root) {
    return []
  }

  const data = asRecord(root.data)

  const possibleArrays = [
    root.wallet_transactions,
    root.walletTransactions,
    root.transactions,
    root.items,
    root.data,

    data?.wallet_transactions,
    data?.walletTransactions,
    data?.transactions,
    data?.items,
    data?.data,
  ]

  for (const possibleArray of possibleArrays) {
    if (Array.isArray(possibleArray)) {
      return possibleArray.filter(
        looksLikeTransaction,
      )
    }
  }

  return []
}

function extractMessage(
  payload: unknown,
  fallback: string,
): string {
  const root = asRecord(payload)

  return typeof root?.message === 'string'
    ? root.message
    : fallback
}

function buildListQuery(
  params: WalletTransactionListParams,
): string {
  const query = new URLSearchParams()

  if (params.search?.trim()) {
    query.set('search', params.search.trim())
  }

  if (params.transactionType) {
    query.set(
      'transaction_type',
      params.transactionType,
    )

    query.set('type', params.transactionType)
  }

  if (params.userId) {
    query.set('user_id', params.userId)
  }

  if (params.status) {
    query.set('status', params.status)
  }

  if (params.dateFrom) {
    query.set('date_from', params.dateFrom)
    query.set('from_date', params.dateFrom)
  }

  if (params.dateTo) {
    query.set('date_to', params.dateTo)
    query.set('to_date', params.dateTo)
  }

  if (params.includeDeleted) {
    query.set('with_trashed', '1')
    query.set('include_deleted', '1')
  }

  if (params.page) {
    query.set('page', String(params.page))
  }

  if (params.perPage) {
    query.set(
      'per_page',
      String(params.perPage),
    )
  }

  return query.toString()
}


function generateWalletTransactionReference(): string {
  const timestamp = new Date()
    .toISOString()
    .replace(/\D/g, '')
    .slice(0, 14)

  const randomCode = Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()

  return `WTX-${timestamp}-${randomCode}`
}

function createRequestPayload(
  payload: WalletTransactionPayload,
) {
  const description = payload.description.trim()
  const reference =
    payload.reference?.trim() ||
    generateWalletTransactionReference()

  return {
    user_id: payload.user_id,

    transaction_type:
      payload.transaction_type,

    /*
     * Some Laravel controllers use "type".
     */
    type: payload.transaction_type,

    amount: Number(payload.amount),

    description,
    reason: description,

    notes: payload.notes?.trim() || null,

    reference,
    transaction_reference: reference,
  }
}

export async function getWalletTransactions(
  params: WalletTransactionListParams = {},
): Promise<WalletTransactionListResult> {
  const query = buildListQuery(params)

  const response = await apiRequest<unknown>(
    `/wallet-transactions${query ? `?${query}` : ''}`,
    {
      method: 'GET',
      auth: true,
      cache: 'no-store',
    },
  )

  const root = asRecord(response)
  const data = asRecord(root?.data)

  return {
    transactions:
      extractTransactionArray(response),

    current_page:
      optionalNumber(root?.current_page) ??
      optionalNumber(data?.current_page),

    last_page:
      optionalNumber(root?.last_page) ??
      optionalNumber(data?.last_page),

    per_page:
      optionalNumber(root?.per_page) ??
      optionalNumber(data?.per_page),

    total:
      optionalNumber(root?.total) ??
      optionalNumber(data?.total),
  }
}

export async function getWalletTransactionSummary(
  params: WalletTransactionListParams = {},
): Promise<WalletTransactionSummary> {
  const query = buildListQuery(params)

  const response = await apiRequest<unknown>(
    `/wallet-transactions/summary${query ? `?${query}` : ''}`,
    {
      method: 'GET',
      auth: true,
      cache: 'no-store',
    },
  )

  const root = asRecord(response)
  const data = asRecord(root?.data)

  const summary =
    asRecord(root?.summary) ??
    asRecord(data?.summary) ??
    data ??
    root ??
    {}

  const transactions =
    extractTransactionArray(response)

  const credits = transactions.filter(
    (transaction) =>
      getTransactionType(transaction) === 'credit',
  )

  const debits = transactions.filter(
    (transaction) =>
      getTransactionType(transaction) === 'debit',
  )

  const adjustments = transactions.filter(
    (transaction) =>
      getTransactionType(transaction) ===
      'adjustment',
  )

  const amountTotal = (
    records: WalletTransaction[],
  ): number =>
    records.reduce(
      (total, transaction) =>
        total + getTransactionAmount(transaction),
      0,
    )

  const creditAmount = firstNumber(
    summary.total_credit_amount,
    summary.credit_amount,
    summary.total_credits_amount,
    summary.total_credited,
    amountTotal(credits),
  )

  const debitAmount = firstNumber(
    summary.total_debit_amount,
    summary.debit_amount,
    summary.total_debits_amount,
    summary.total_debited,
    amountTotal(debits),
  )

  return {
    total_transactions: firstNumber(
      summary.total_transactions,
      summary.transactions_count,
      summary.total,
      transactions.length,
    ),

    credit_transactions: firstNumber(
      summary.credit_transactions,
      summary.credit_count,
      summary.credits_count,
      credits.length,
    ),

    debit_transactions: firstNumber(
      summary.debit_transactions,
      summary.debit_count,
      summary.debits_count,
      debits.length,
    ),

    adjustment_transactions: firstNumber(
      summary.adjustment_transactions,
      summary.adjustment_count,
      summary.adjustments_count,
      adjustments.length,
    ),

    total_credit_amount: creditAmount,
    total_debit_amount: debitAmount,

    net_amount: firstNumber(
      summary.net_amount,
      summary.net_balance_change,
      summary.balance_difference,
      creditAmount - debitAmount,
    ),
  }
}

export async function getWalletTransaction(
  id: number | string,
): Promise<WalletTransaction> {
  const response = await apiRequest<unknown>(
    `/wallet-transactions/${id}`,
    {
      method: 'GET',
      auth: true,
      cache: 'no-store',
    },
  )

  const transaction =
    extractTransaction(response)

  if (!transaction) {
    throw new ApiError(
      'The backend did not return the requested wallet transaction.',
      500,
    )
  }

  return transaction
}

export async function createWalletTransaction(
  payload: WalletTransactionPayload,
): Promise<{
  transaction?: WalletTransaction
  message: string
}> {
  const response = await apiRequest<unknown>(
    '/wallet-transactions',
    {
      method: 'POST',
      auth: true,
      body: createRequestPayload(payload),
    },
  )

  return {
    transaction: extractTransaction(response),

    message: extractMessage(
      response,
      'Wallet adjustment completed successfully.',
    ),
  }
}

export async function updateWalletTransaction(
  id: number | string,
  payload: WalletTransactionUpdatePayload,
): Promise<{
  transaction?: WalletTransaction
  message: string
}> {
  const description = payload.description.trim()

  const response = await apiRequest<unknown>(
    `/wallet-transactions/${id}`,
    {
      method: 'PATCH',
      auth: true,
      body: {
        description,
        reason: description,
        notes: payload.notes?.trim() || null,
      },
    },
  )

  return {
    transaction: extractTransaction(response),

    message: extractMessage(
      response,
      'Wallet transaction updated successfully.',
    ),
  }
}

export async function deleteWalletTransaction(
  id: number | string,
): Promise<string> {
  const response = await apiRequest<unknown>(
    `/wallet-transactions/${id}`,
    {
      method: 'DELETE',
      auth: true,
    },
  )

  return extractMessage(
    response,
    'Wallet transaction deleted successfully.',
  )
}

export async function restoreWalletTransaction(
  id: number | string,
): Promise<string> {
  const response = await apiRequest<unknown>(
    `/wallet-transactions/${id}/restore`,
    {
      method: 'POST',
      auth: true,
    },
  )

  return extractMessage(
    response,
    'Wallet transaction restored successfully.',
  )
}
