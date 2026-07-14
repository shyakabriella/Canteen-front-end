import {
  apiRequest,
  ApiError,
} from '@/lib/api'
import {
  getTopUpStatus,
  numberValue,
} from '@/lib/wallet-top-up'
import type {
  WalletTopUp,
  WalletTopUpActionPayload,
  WalletTopUpListParams,
  WalletTopUpListResult,
  WalletTopUpPayload,
  WalletTopUpSummary,
} from '@/types/wallet-top-up'

function firstNumberValue(
  ...values: unknown[]
): number {
  for (const value of values) {
    if (
      value === undefined ||
      value === null ||
      value === ''
    ) {
      continue
    }

    const numeric = Number(value)

    if (Number.isFinite(numeric)) {
      return numeric
    }
  }

  return 0
}

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

function looksLikeTopUp(
  value: unknown,
): value is WalletTopUp {
  const record = asRecord(value)

  if (!record) {
    return false
  }

  return (
    'id' in record ||
    'amount' in record ||
    'user_id' in record
  )
}

function extractTopUp(
  payload: unknown,
): WalletTopUp | undefined {
  if (looksLikeTopUp(payload)) {
    return payload
  }

  const root = asRecord(payload)
  const data = root?.data
  const dataRecord = asRecord(data)

  const possibleValues = [
    root?.wallet_top_up,
    root?.walletTopUp,
    root?.top_up,
    root?.topUp,
    data,
    dataRecord?.wallet_top_up,
    dataRecord?.walletTopUp,
    dataRecord?.top_up,
    dataRecord?.topUp,
  ]

  return possibleValues.find(looksLikeTopUp)
}

function extractTopUpArray(
  payload: unknown,
): WalletTopUp[] {
  if (Array.isArray(payload)) {
    return payload.filter(looksLikeTopUp)
  }

  const root = asRecord(payload)

  if (!root) {
    return []
  }

  const data = asRecord(root.data)

  const possibleArrays = [
    root.wallet_top_ups,
    root.walletTopUps,
    root.top_ups,
    root.topUps,
    root.items,
    root.data,

    data?.wallet_top_ups,
    data?.walletTopUps,
    data?.top_ups,
    data?.topUps,
    data?.items,
    data?.data,
  ]

  for (const possibleArray of possibleArrays) {
    if (Array.isArray(possibleArray)) {
      return possibleArray.filter(looksLikeTopUp)
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
  params: WalletTopUpListParams,
): string {
  const query = new URLSearchParams()

  if (params.search?.trim()) {
    query.set('search', params.search.trim())
  }

  if (params.status) {
    query.set('status', params.status)
  }

  if (params.userId) {
    query.set('user_id', params.userId)
  }

  if (params.paymentMethod) {
    query.set(
      'payment_method',
      params.paymentMethod,
    )
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

function requestPayload(
  payload: WalletTopUpPayload,
) {
  const reference =
    payload.transaction_reference?.trim() || null

  return {
    amount: Number(payload.amount),
    payment_method: payload.payment_method,

    transaction_reference: reference,

    /*
     * These aliases make the frontend compatible
     * with controllers using another reference name.
     */
    payment_reference: reference,
    reference_number: reference,

    notes: payload.notes?.trim() || null,
  }
}

export async function getWalletTopUps(
  params: WalletTopUpListParams = {},
): Promise<WalletTopUpListResult> {
  const query = buildListQuery(params)

  const response = await apiRequest<unknown>(
    `/wallet-top-ups${query ? `?${query}` : ''}`,
    {
      method: 'GET',
      auth: true,
      cache: 'no-store',
    },
  )

  const root = asRecord(response)
  const data = asRecord(root?.data)

  return {
    topUps: extractTopUpArray(response),

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

export async function getWalletTopUpSummary(
  params: WalletTopUpListParams = {},
): Promise<WalletTopUpSummary> {
  const query = buildListQuery(params)

  const response = await apiRequest<unknown>(
    `/wallet-top-ups/summary${query ? `?${query}` : ''}`,
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

  const topUps = extractTopUpArray(response)

  const pending = topUps.filter(
    (item) => getTopUpStatus(item) === 'pending',
  )

  const approved = topUps.filter(
    (item) => getTopUpStatus(item) === 'approved',
  )

  const rejected = topUps.filter(
    (item) => getTopUpStatus(item) === 'rejected',
  )

  const cancelled = topUps.filter(
    (item) => getTopUpStatus(item) === 'cancelled',
  )

  const amountTotal = (
    items: WalletTopUp[],
  ): number =>
    items.reduce(
      (total, item) =>
        total + firstNumberValue(item.amount),
      0,
    )

  return {
    total_requests: firstNumberValue(
      summary.total_requests,
      summary.total_top_ups,
      summary.total,
      topUps.length,
    ),

    pending_requests: firstNumberValue(
      summary.pending_requests,
      summary.pending_count,
      summary.pending,
      pending.length,
    ),

    approved_requests: firstNumberValue(
      summary.approved_requests,
      summary.approved_count,
      summary.approved,
      approved.length,
    ),

    rejected_requests: firstNumberValue(
      summary.rejected_requests,
      summary.rejected_count,
      summary.rejected,
      rejected.length,
    ),

    cancelled_requests: firstNumberValue(
      summary.cancelled_requests,
      summary.canceled_requests,
      summary.cancelled_count,
      summary.canceled_count,
      cancelled.length,
    ),

    total_requested_amount: firstNumberValue(
      summary.total_requested_amount,
      summary.total_amount,
      summary.requested_amount,
      amountTotal(topUps),
    ),

    pending_amount: firstNumberValue(
      summary.pending_amount,
      summary.total_pending_amount,
      amountTotal(pending),
    ),

    approved_amount: firstNumberValue(
      summary.approved_amount,
      summary.total_approved_amount,
      amountTotal(approved),
    ),

    rejected_amount: firstNumberValue(
      summary.rejected_amount,
      summary.total_rejected_amount,
      amountTotal(rejected),
    ),

    cancelled_amount: firstNumberValue(
      summary.cancelled_amount,
      summary.canceled_amount,
      summary.total_cancelled_amount,
      amountTotal(cancelled),
    ),
  }
}

export async function getWalletTopUp(
  id: number | string,
): Promise<WalletTopUp> {
  const response = await apiRequest<unknown>(
    `/wallet-top-ups/${id}`,
    {
      method: 'GET',
      auth: true,
      cache: 'no-store',
    },
  )

  const topUp = extractTopUp(response)

  if (!topUp) {
    throw new ApiError(
      'The backend did not return the requested top-up.',
      500,
    )
  }

  return topUp
}

export async function createWalletTopUp(
  payload: WalletTopUpPayload,
): Promise<{
  topUp?: WalletTopUp
  message: string
}> {
  const response = await apiRequest<unknown>(
    '/wallet-top-ups',
    {
      method: 'POST',
      auth: true,
      body: requestPayload(payload),
    },
  )

  return {
    topUp: extractTopUp(response),

    message: extractMessage(
      response,
      'Wallet top-up requested successfully.',
    ),
  }
}

export async function updateWalletTopUp(
  id: number | string,
  payload: WalletTopUpPayload,
): Promise<{
  topUp?: WalletTopUp
  message: string
}> {
  const response = await apiRequest<unknown>(
    `/wallet-top-ups/${id}`,
    {
      method: 'PATCH',
      auth: true,
      body: requestPayload(payload),
    },
  )

  return {
    topUp: extractTopUp(response),

    message: extractMessage(
      response,
      'Wallet top-up updated successfully.',
    ),
  }
}

export async function deleteWalletTopUp(
  id: number | string,
): Promise<string> {
  const response = await apiRequest<unknown>(
    `/wallet-top-ups/${id}`,
    {
      method: 'DELETE',
      auth: true,
    },
  )

  return extractMessage(
    response,
    'Wallet top-up deleted successfully.',
  )
}

export async function restoreWalletTopUp(
  id: number | string,
): Promise<string> {
  const response = await apiRequest<unknown>(
    `/wallet-top-ups/${id}/restore`,
    {
      method: 'POST',
      auth: true,
    },
  )

  return extractMessage(
    response,
    'Wallet top-up restored successfully.',
  )
}

function actionPayload(
  payload: WalletTopUpActionPayload,
  action: 'approve' | 'reject' | 'cancel',
) {
  const reason = payload.reason?.trim() || null
  const notes = payload.notes?.trim() || null

  return {
    reason,
    notes,

    ...(action === 'approve'
      ? {
          approval_notes: notes ?? reason,
        }
      : {}),

    ...(action === 'reject'
      ? {
          rejection_reason: reason,
        }
      : {}),

    ...(action === 'cancel'
      ? {
          cancellation_reason: reason,
        }
      : {}),
  }
}

export async function approveWalletTopUp(
  id: number | string,
  payload: WalletTopUpActionPayload = {},
): Promise<{
  topUp?: WalletTopUp
  message: string
}> {
  const response = await apiRequest<unknown>(
    `/wallet-top-ups/${id}/approve`,
    {
      method: 'POST',
      auth: true,
      body: actionPayload(payload, 'approve'),
    },
  )

  return {
    topUp: extractTopUp(response),

    message: extractMessage(
      response,
      'Wallet top-up approved successfully.',
    ),
  }
}

export async function rejectWalletTopUp(
  id: number | string,
  payload: WalletTopUpActionPayload,
): Promise<{
  topUp?: WalletTopUp
  message: string
}> {
  const response = await apiRequest<unknown>(
    `/wallet-top-ups/${id}/reject`,
    {
      method: 'POST',
      auth: true,
      body: actionPayload(payload, 'reject'),
    },
  )

  return {
    topUp: extractTopUp(response),

    message: extractMessage(
      response,
      'Wallet top-up rejected successfully.',
    ),
  }
}

export async function cancelWalletTopUp(
  id: number | string,
  payload: WalletTopUpActionPayload,
): Promise<{
  topUp?: WalletTopUp
  message: string
}> {
  const response = await apiRequest<unknown>(
    `/wallet-top-ups/${id}/cancel`,
    {
      method: 'POST',
      auth: true,
      body: actionPayload(payload, 'cancel'),
    },
  )

  return {
    topUp: extractTopUp(response),

    message: extractMessage(
      response,
      'Wallet top-up cancelled successfully.',
    ),
  }
}
