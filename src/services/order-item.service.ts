import { apiRequest } from '@/lib/api'
import type {
  OrderItemListParams,
  OrderItemListResult,
  OrderItemRecord,
  OrderItemUpdatePayload,
} from '@/types/order-item'

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

function looksLikeOrderItem(
  value: unknown,
): value is OrderItemRecord {
  const record = asRecord(value)

  if (!record) {
    return false
  }

  return (
    'id' in record ||
    'order_id' in record ||
    'food_item_id' in record
  )
}

function extractOrderItem(
  payload: unknown,
): OrderItemRecord | undefined {
  if (looksLikeOrderItem(payload)) {
    return payload
  }

  const root = asRecord(payload)
  const data = root?.data
  const dataRecord = asRecord(data)

  const possibleItems = [
    root?.order_item,
    root?.orderItem,
    root?.item,
    data,
    dataRecord?.order_item,
    dataRecord?.orderItem,
    dataRecord?.item,
  ]

  return possibleItems.find(
    looksLikeOrderItem,
  )
}

function extractOrderItemArray(
  payload: unknown,
): OrderItemRecord[] {
  if (Array.isArray(payload)) {
    return payload.filter(looksLikeOrderItem)
  }

  const root = asRecord(payload)

  if (!root) {
    return []
  }

  const data = asRecord(root.data)

  const possibleArrays = [
    root.order_items,
    root.orderItems,
    root.items,
    root.data,

    data?.order_items,
    data?.orderItems,
    data?.items,
    data?.data,
  ]

  for (const possibleArray of possibleArrays) {
    if (Array.isArray(possibleArray)) {
      return possibleArray.filter(
        looksLikeOrderItem,
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
  params: OrderItemListParams,
): string {
  const query = new URLSearchParams()

  if (params.search?.trim()) {
    query.set('search', params.search.trim())
  }

  if (params.orderId) {
    query.set('order_id', params.orderId)
  }

  if (params.foodItemId) {
    query.set(
      'food_item_id',
      params.foodItemId,
    )
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

  query.set(
    'per_page',
    String(params.perPage ?? 200),
  )

  return query.toString()
}

export async function getOrderItems(
  params: OrderItemListParams = {},
): Promise<OrderItemListResult> {
  const query = buildQuery(params)

  const response = await apiRequest<unknown>(
    `/order-items?${query}`,
    {
      method: 'GET',
      auth: true,
      cache: 'no-store',
    },
  )

  const root = asRecord(response)
  const data = asRecord(root?.data)

  return {
    orderItems:
      extractOrderItemArray(response),

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

export async function getOrderItem(
  id: number | string,
): Promise<OrderItemRecord> {
  const response = await apiRequest<unknown>(
    `/order-items/${id}`,
    {
      method: 'GET',
      auth: true,
      cache: 'no-store',
    },
  )

  const orderItem =
    extractOrderItem(response)

  if (!orderItem) {
    throw new Error(
      'The backend did not return the requested order item.',
    )
  }

  return orderItem
}

export async function updateOrderItem(
  id: number | string,
  payload: OrderItemUpdatePayload,
): Promise<{
  orderItem?: OrderItemRecord
  message: string
}> {
  const response = await apiRequest<unknown>(
    `/order-items/${id}`,
    {
      method: 'PATCH',
      auth: true,
      body: {
        status: payload.status,
        notes: payload.notes?.trim() || null,
      },
    },
  )

  return {
    orderItem: extractOrderItem(response),

    message: extractMessage(
      response,
      'Order item updated successfully.',
    ),
  }
}

export async function deleteOrderItem(
  id: number | string,
): Promise<string> {
  const response = await apiRequest<unknown>(
    `/order-items/${id}`,
    {
      method: 'DELETE',
      auth: true,
    },
  )

  return extractMessage(
    response,
    'Order item deleted successfully.',
  )
}

export async function restoreOrderItem(
  id: number | string,
): Promise<string> {
  const response = await apiRequest<unknown>(
    `/order-items/${id}/restore`,
    {
      method: 'POST',
      auth: true,
    },
  )

  return extractMessage(
    response,
    'Order item restored successfully.',
  )
}
