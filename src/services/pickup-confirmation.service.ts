import { apiRequest } from '@/lib/api'
import {
  getPickupDate,
  getPickupMethod,
  getPickupStatus,
} from '@/lib/pickup-confirmation'
import type {
  CancelPickupConfirmationPayload,
  PickupConfirmation,
  PickupConfirmationListParams,
  PickupConfirmationListResult,
  PickupConfirmationPayload,
  PickupConfirmationSummary,
} from '@/types/pickup-confirmation'

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

function firstNumber(
  ...values: unknown[]
): number {
  for (const value of values) {
    const numeric = optionalNumber(value)

    if (numeric !== undefined) {
      return numeric
    }
  }

  return 0
}

function looksLikeConfirmation(
  value: unknown,
): value is PickupConfirmation {
  const record = asRecord(value)

  if (!record) {
    return false
  }

  return (
    'id' in record ||
    'order_id' in record ||
    'confirmed_at' in record ||
    'confirmation_method' in record
  )
}

function extractConfirmation(
  payload: unknown,
): PickupConfirmation | undefined {
  if (looksLikeConfirmation(payload)) {
    return payload
  }

  const root = asRecord(payload)
  const data = root?.data
  const dataRecord = asRecord(data)

  const possibleValues = [
    root?.pickup_confirmation,
    root?.pickupConfirmation,
    root?.confirmation,
    data,
    dataRecord?.pickup_confirmation,
    dataRecord?.pickupConfirmation,
    dataRecord?.confirmation,
  ]

  return possibleValues.find(
    looksLikeConfirmation,
  )
}

function extractConfirmationArray(
  payload: unknown,
): PickupConfirmation[] {
  if (Array.isArray(payload)) {
    return payload.filter(
      looksLikeConfirmation,
    )
  }

  const root = asRecord(payload)

  if (!root) {
    return []
  }

  const data = asRecord(root.data)

  const possibleArrays = [
    root.pickup_confirmations,
    root.pickupConfirmations,
    root.confirmations,
    root.items,
    root.data,

    data?.pickup_confirmations,
    data?.pickupConfirmations,
    data?.confirmations,
    data?.items,
    data?.data,
  ]

  for (const possibleArray of possibleArrays) {
    if (Array.isArray(possibleArray)) {
      return possibleArray.filter(
        looksLikeConfirmation,
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

function buildQuery(
  params: PickupConfirmationListParams,
): string {
  const query = new URLSearchParams()

  if (params.search?.trim()) {
    query.set('search', params.search.trim())
  }

  if (params.status) {
    query.set('status', params.status)
  }

  if (params.method) {
    query.set(
      'confirmation_method',
      params.method,
    )

    query.set(
      'pickup_method',
      params.method,
    )
  }

  if (params.orderId) {
    query.set('order_id', params.orderId)
  }

  if (params.qrCodeId) {
    query.set(
      'order_qr_code_id',
      params.qrCodeId,
    )
  }

  if (params.deviceType) {
    query.set(
      'device_type',
      params.deviceType,
    )
  }

  if (params.location?.trim()) {
    query.set(
      'location',
      params.location.trim(),
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

  query.set(
    'per_page',
    String(params.perPage ?? 200),
  )

  return query.toString()
}

export async function getPickupConfirmations(
  params: PickupConfirmationListParams = {},
): Promise<PickupConfirmationListResult> {
  const query = buildQuery(params)

  const response = await apiRequest<unknown>(
    `/pickup-confirmations${query ? `?${query}` : ''}`,
    {
      method: 'GET',
      auth: true,
      cache: 'no-store',
    },
  )

  const root = asRecord(response)
  const data = asRecord(root?.data)

  return {
    confirmations:
      extractConfirmationArray(response),

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

export async function getPickupConfirmationSummary(
  params: PickupConfirmationListParams = {},
): Promise<PickupConfirmationSummary> {
  const query = buildQuery(params)

  const response = await apiRequest<unknown>(
    `/pickup-confirmations/summary${query ? `?${query}` : ''}`,
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

  const confirmations =
    extractConfirmationArray(response)

  const confirmed = confirmations.filter(
    (confirmation) =>
      getPickupStatus(confirmation) ===
      'confirmed',
  )

  const cancelled = confirmations.filter(
    (confirmation) =>
      getPickupStatus(confirmation) ===
      'cancelled',
  )

  const manual = confirmations.filter(
    (confirmation) =>
      getPickupMethod(confirmation) ===
      'manual',
  )

  const qr = confirmations.filter(
    (confirmation) =>
      getPickupMethod(confirmation) === 'qr',
  )

  const today = new Date()
  const todayKey = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-')

  const todayPickups = confirmations.filter(
    (confirmation) => {
      const value = getPickupDate(confirmation)

      if (!value) {
        return false
      }

      const date = new Date(value)

      if (Number.isNaN(date.getTime())) {
        return value.startsWith(todayKey)
      }

      const key = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(
          2,
          '0',
        ),
        String(date.getDate()).padStart(2, '0'),
      ].join('-')

      return key === todayKey
    },
  )

  const uniqueLocations = new Set(
    confirmations
      .map((confirmation) =>
        confirmation.location?.trim(),
      )
      .filter(Boolean),
  ).size

  return {
    total_confirmations: firstNumber(
      summary.total_confirmations,
      summary.confirmations_count,
      summary.total_pickups,
      summary.total,
      confirmations.length,
    ),

    confirmed_pickups: firstNumber(
      summary.confirmed_pickups,
      summary.confirmed_count,
      summary.completed_pickups,
      confirmed.length,
    ),

    cancelled_pickups: firstNumber(
      summary.cancelled_pickups,
      summary.canceled_pickups,
      summary.cancelled_count,
      cancelled.length,
    ),

    today_pickups: firstNumber(
      summary.today_pickups,
      summary.pickups_today,
      summary.today_count,
      todayPickups.length,
    ),

    manual_pickups: firstNumber(
      summary.manual_pickups,
      summary.manual_count,
      manual.length,
    ),

    qr_pickups: firstNumber(
      summary.qr_pickups,
      summary.qr_scan_pickups,
      summary.qr_count,
      qr.length,
    ),

    unique_locations: firstNumber(
      summary.unique_locations,
      summary.locations_count,
      uniqueLocations,
    ),
  }
}

export async function getPickupConfirmation(
  id: number | string,
): Promise<PickupConfirmation> {
  const response = await apiRequest<unknown>(
    `/pickup-confirmations/${id}`,
    {
      method: 'GET',
      auth: true,
      cache: 'no-store',
    },
  )

  const confirmation =
    extractConfirmation(response)

  if (!confirmation) {
    throw new Error(
      'The backend did not return the requested pickup confirmation.',
    )
  }

  return confirmation
}

export async function createPickupConfirmation(
  payload: PickupConfirmationPayload,
): Promise<{
  confirmation?: PickupConfirmation
  message: string
}> {
  const qrCodeId =
    payload.order_qr_code_id?.trim() || null

  const response = await apiRequest<unknown>(
    '/pickup-confirmations',
    {
      method: 'POST',
      auth: true,
      body: {
        order_id: payload.order_id,

        order_qr_code_id: qrCodeId,
        qr_code_id: qrCodeId,

        confirmation_method: 'manual',
        pickup_method: 'manual',
        method: 'manual',

        device_name:
          payload.device_name.trim(),

        device_type:
          payload.device_type.trim(),

        location: payload.location.trim(),

        notes: payload.notes?.trim() || null,
        pickup_notes:
          payload.notes?.trim() || null,
      },
    },
  )

  return {
    confirmation:
      extractConfirmation(response),

    message: extractMessage(
      response,
      'Pickup confirmed successfully.',
    ),
  }
}

export async function deletePickupConfirmation(
  id: number | string,
): Promise<string> {
  const response = await apiRequest<unknown>(
    `/pickup-confirmations/${id}`,
    {
      method: 'DELETE',
      auth: true,
    },
  )

  return extractMessage(
    response,
    'Pickup confirmation deleted successfully.',
  )
}

export async function cancelPickupConfirmation(
  id: number | string,
  payload: CancelPickupConfirmationPayload,
): Promise<{
  confirmation?: PickupConfirmation
  message: string
}> {
  const reason = payload.reason.trim()

  const response = await apiRequest<unknown>(
    `/pickup-confirmations/${id}/cancel`,
    {
      method: 'POST',
      auth: true,
      body: {
        reason,
        cancellation_reason: reason,
        cancel_reason: reason,
        notes: payload.notes?.trim() || null,
      },
    },
  )

  return {
    confirmation:
      extractConfirmation(response),

    message: extractMessage(
      response,
      'Pickup confirmation cancelled successfully.',
    ),
  }
}

export async function restorePickupConfirmation(
  id: number | string,
): Promise<string> {
  const response = await apiRequest<unknown>(
    `/pickup-confirmations/${id}/restore`,
    {
      method: 'POST',
      auth: true,
    },
  )

  return extractMessage(
    response,
    'Pickup confirmation restored successfully.',
  )
}
