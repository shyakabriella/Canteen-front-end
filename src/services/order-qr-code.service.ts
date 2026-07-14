import { apiRequest } from '@/lib/api'
import type {
  CancelOrderQrCodePayload,
  MarkOrderQrCodeUsedPayload,
  OrderQrCode,
  OrderQrCodeListParams,
  OrderQrCodeListResult,
  OrderQrCodePayload,
  RegenerateOrderQrCodePayload,
  VerifyOrderQrCodePayload,
  VerifyOrderQrCodeResult,
} from '@/types/order-qr-code'

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

function looksLikeQrCode(
  value: unknown,
): value is OrderQrCode {
  const record = asRecord(value)

  if (!record) {
    return false
  }

  return (
    'id' in record ||
    'qr_token' in record ||
    'token' in record ||
    'order_id' in record
  )
}

function extractQrCode(
  payload: unknown,
): OrderQrCode | undefined {
  if (looksLikeQrCode(payload)) {
    return payload
  }

  const root = asRecord(payload)
  const data = root?.data
  const dataRecord = asRecord(data)

  const possibleQrCodes = [
    root?.order_qr_code,
    root?.orderQrCode,
    root?.qr_code,
    root?.qrCode,
    data,
    dataRecord?.order_qr_code,
    dataRecord?.orderQrCode,
    dataRecord?.qr_code,
    dataRecord?.qrCode,
  ]

  return possibleQrCodes.find(
    looksLikeQrCode,
  )
}

function extractQrCodeArray(
  payload: unknown,
): OrderQrCode[] {
  if (Array.isArray(payload)) {
    return payload.filter(looksLikeQrCode)
  }

  const root = asRecord(payload)

  if (!root) {
    return []
  }

  const data = asRecord(root.data)

  const possibleArrays = [
    root.order_qr_codes,
    root.orderQrCodes,
    root.qr_codes,
    root.qrCodes,
    root.items,
    root.data,

    data?.order_qr_codes,
    data?.orderQrCodes,
    data?.qr_codes,
    data?.qrCodes,
    data?.items,
    data?.data,
  ]

  for (const possibleArray of possibleArrays) {
    if (Array.isArray(possibleArray)) {
      return possibleArray.filter(
        looksLikeQrCode,
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
  params: OrderQrCodeListParams,
): string {
  const query = new URLSearchParams()

  if (params.search?.trim()) {
    query.set('search', params.search.trim())
  }

  if (params.status) {
    query.set('status', params.status)
  }

  if (params.orderId) {
    query.set('order_id', params.orderId)
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

export async function getOrderQrCodes(
  params: OrderQrCodeListParams = {},
): Promise<OrderQrCodeListResult> {
  const response = await apiRequest<unknown>(
    `/order-qr-codes?${buildQuery(params)}`,
    {
      method: 'GET',
      auth: true,
      cache: 'no-store',
    },
  )

  const root = asRecord(response)
  const data = asRecord(root?.data)

  return {
    qrCodes: extractQrCodeArray(response),

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

export async function getOrderQrCode(
  id: number | string,
): Promise<OrderQrCode> {
  const response = await apiRequest<unknown>(
    `/order-qr-codes/${id}`,
    {
      method: 'GET',
      auth: true,
      cache: 'no-store',
    },
  )

  const qrCode = extractQrCode(response)

  if (!qrCode) {
    throw new Error(
      'The backend did not return the requested QR code.',
    )
  }

  return qrCode
}

export async function createOrderQrCode(
  payload: OrderQrCodePayload,
): Promise<{
  qrCode?: OrderQrCode
  message: string
}> {
  const response = await apiRequest<unknown>(
    '/order-qr-codes',
    {
      method: 'POST',
      auth: true,
      body: {
        order_id: payload.order_id,
        expires_at:
          payload.expires_at || null,
        notes: payload.notes?.trim() || null,
      },
    },
  )

  return {
    qrCode: extractQrCode(response),

    message: extractMessage(
      response,
      'Order QR code created successfully.',
    ),
  }
}

export async function updateOrderQrCode(
  id: number | string,
  payload: OrderQrCodePayload,
): Promise<{
  qrCode?: OrderQrCode
  message: string
}> {
  const response = await apiRequest<unknown>(
    `/order-qr-codes/${id}`,
    {
      method: 'PATCH',
      auth: true,
      body: {
        order_id: payload.order_id,
        expires_at:
          payload.expires_at || null,
        notes: payload.notes?.trim() || null,
      },
    },
  )

  return {
    qrCode: extractQrCode(response),

    message: extractMessage(
      response,
      'Order QR code updated successfully.',
    ),
  }
}

export async function deleteOrderQrCode(
  id: number | string,
): Promise<string> {
  const response = await apiRequest<unknown>(
    `/order-qr-codes/${id}`,
    {
      method: 'DELETE',
      auth: true,
    },
  )

  return extractMessage(
    response,
    'Order QR code deleted successfully.',
  )
}

export async function restoreOrderQrCode(
  id: number | string,
): Promise<string> {
  const response = await apiRequest<unknown>(
    `/order-qr-codes/${id}/restore`,
    {
      method: 'POST',
      auth: true,
    },
  )

  return extractMessage(
    response,
    'Order QR code restored successfully.',
  )
}

export async function verifyOrderQrCode(
  payload: VerifyOrderQrCodePayload,
): Promise<VerifyOrderQrCodeResult> {
  const response = await apiRequest<unknown>(
    '/order-qr-codes/verify',
    {
      method: 'POST',
      auth: true,
      body: {
        qr_token: payload.qr_token.trim(),
        device_name: payload.device_name.trim(),
        device_type: payload.device_type.trim(),
        location: payload.location.trim(),
      },
    },
  )

  const root = asRecord(response)
  const data = asRecord(root?.data)
  const qrCode = extractQrCode(response)

  const explicitValid =
    root?.valid ??
    root?.is_valid ??
    data?.valid ??
    data?.is_valid

  return {
    valid:
      typeof explicitValid === 'boolean'
        ? explicitValid
        : Boolean(qrCode),

    message: extractMessage(
      response,
      qrCode
        ? 'QR code verified successfully.'
        : 'QR verification completed.',
    ),

    qrCode,
  }
}

export async function markOrderQrCodeUsed(
  id: number | string,
  payload: MarkOrderQrCodeUsedPayload,
): Promise<{
  qrCode?: OrderQrCode
  message: string
}> {
  const response = await apiRequest<unknown>(
    `/order-qr-codes/${id}/mark-used`,
    {
      method: 'POST',
      auth: true,
      body: {
        device_name: payload.device_name.trim(),
        device_type: payload.device_type.trim(),
        location: payload.location.trim(),
        notes: payload.notes?.trim() || null,
      },
    },
  )

  return {
    qrCode: extractQrCode(response),

    message: extractMessage(
      response,
      'QR code marked as used and pickup confirmed.',
    ),
  }
}

export async function regenerateOrderQrCode(
  id: number | string,
  payload: RegenerateOrderQrCodePayload,
): Promise<{
  qrCode?: OrderQrCode
  message: string
}> {
  const response = await apiRequest<unknown>(
    `/order-qr-codes/${id}/regenerate`,
    {
      method: 'POST',
      auth: true,
      body: {
        expires_at: payload.expires_at,
        notes: payload.notes?.trim() || null,
      },
    },
  )

  return {
    qrCode: extractQrCode(response),

    message: extractMessage(
      response,
      'QR code regenerated successfully.',
    ),
  }
}

export async function cancelOrderQrCode(
  id: number | string,
  payload: CancelOrderQrCodePayload,
): Promise<{
  qrCode?: OrderQrCode
  message: string
}> {
  const reason = payload.reason.trim()

  const response = await apiRequest<unknown>(
    `/order-qr-codes/${id}/cancel`,
    {
      method: 'POST',
      auth: true,
      body: {
        reason,
        cancellation_reason: reason,
        notes: payload.notes?.trim() || null,
      },
    },
  )

  return {
    qrCode: extractQrCode(response),

    message: extractMessage(
      response,
      'QR code cancelled successfully.',
    ),
  }
}
