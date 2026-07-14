import {
  apiRequest,
  ApiError,
} from '@/lib/api'
import {
  getOrderStatus,
  getOrderTotal,
  orderNumberValue,
} from '@/lib/order'
import type {
  Order,
  OrderActionPayload,
  OrderListParams,
  OrderListResult,
  OrderPayload,
  OrderSummary,
  OrderUpdatePayload,
} from '@/types/order'

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

function looksLikeOrder(
  value: unknown,
): value is Order {
  const record = asRecord(value)

  if (!record) {
    return false
  }

  return (
    'id' in record ||
    'order_number' in record ||
    'user_id' in record ||
    'total_amount' in record
  )
}

function extractOrder(
  payload: unknown,
): Order | undefined {
  if (looksLikeOrder(payload)) {
    return payload
  }

  const root = asRecord(payload)
  const data = root?.data
  const dataRecord = asRecord(data)

  const possibleOrders = [
    root?.order,
    data,
    dataRecord?.order,
  ]

  return possibleOrders.find(looksLikeOrder)
}

function extractOrderArray(
  payload: unknown,
): Order[] {
  if (Array.isArray(payload)) {
    return payload.filter(looksLikeOrder)
  }

  const root = asRecord(payload)

  if (!root) {
    return []
  }

  const data = asRecord(root.data)

  const possibleArrays = [
    root.orders,
    root.items,
    root.data,
    data?.orders,
    data?.items,
    data?.data,
  ]

  for (const possibleArray of possibleArrays) {
    if (Array.isArray(possibleArray)) {
      return possibleArray.filter(looksLikeOrder)
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
  params: OrderListParams,
): string {
  const query = new URLSearchParams()

  if (params.search?.trim()) {
    query.set('search', params.search.trim())
  }

  if (params.status) {
    query.set('status', params.status)
  }

  if (params.paymentStatus) {
    query.set(
      'payment_status',
      params.paymentStatus,
    )
  }

  if (params.userId) {
    query.set('user_id', params.userId)
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
    String(params.perPage ?? 100),
  )

  return query.toString()
}

function createRequestPayload(
  payload: OrderPayload,
) {
  const items = payload.items.map((item) => ({
    food_item_id: item.food_item_id,
    quantity: Number(item.quantity),
  }))

  return {
    user_id: payload.user_id,

    /*
     * Both names support common Laravel order
     * controller validation structures.
     */
    items,
    order_items: items,

    notes: payload.notes?.trim() || null,
    order_notes: payload.notes?.trim() || null,

    pickup_notes:
      payload.pickup_notes?.trim() || null,
  }
}

export async function getOrders(
  params: OrderListParams = {},
): Promise<OrderListResult> {
  const query = buildListQuery(params)

  const response = await apiRequest<unknown>(
    `/orders?${query}`,
    {
      method: 'GET',
      auth: true,
      cache: 'no-store',
    },
  )

  const root = asRecord(response)
  const data = asRecord(root?.data)

  return {
    orders: extractOrderArray(response),

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

export async function getOrderSummary(
  params: OrderListParams = {},
): Promise<OrderSummary> {
  const query = buildListQuery(params)

  const response = await apiRequest<unknown>(
    `/orders/summary?${query}`,
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

  const orders = extractOrderArray(response)

  const pending = orders.filter(
    (order) => getOrderStatus(order) === 'pending',
  )

  const preparing = orders.filter(
    (order) =>
      getOrderStatus(order) === 'preparing',
  )

  const ready = orders.filter(
    (order) => getOrderStatus(order) === 'ready',
  )

  const completed = orders.filter(
    (order) =>
      getOrderStatus(order) === 'completed',
  )

  const cancelled = orders.filter(
    (order) =>
      getOrderStatus(order) === 'cancelled',
  )

  const amountTotal = (records: Order[]) =>
    records.reduce(
      (total, order) =>
        total + getOrderTotal(order),
      0,
    )

  return {
    total_orders: firstNumber(
      summary.total_orders,
      summary.orders_count,
      summary.total,
      orders.length,
    ),

    pending_orders: firstNumber(
      summary.pending_orders,
      summary.pending_count,
      pending.length,
    ),

    preparing_orders: firstNumber(
      summary.preparing_orders,
      summary.preparing_count,
      preparing.length,
    ),

    ready_orders: firstNumber(
      summary.ready_orders,
      summary.ready_count,
      ready.length,
    ),

    completed_orders: firstNumber(
      summary.completed_orders,
      summary.completed_count,
      completed.length,
    ),

    cancelled_orders: firstNumber(
      summary.cancelled_orders,
      summary.canceled_orders,
      summary.cancelled_count,
      cancelled.length,
    ),

    total_sales: firstNumber(
      summary.total_sales,
      summary.total_amount,
      summary.sales_amount,
      amountTotal(orders),
    ),

    completed_sales: firstNumber(
      summary.completed_sales,
      summary.completed_amount,
      amountTotal(completed),
    ),

    refunded_amount: firstNumber(
      summary.refunded_amount,
      summary.total_refunded,
      amountTotal(cancelled),
    ),
  }
}

export async function getOrder(
  id: number | string,
): Promise<Order> {
  const response = await apiRequest<unknown>(
    `/orders/${id}`,
    {
      method: 'GET',
      auth: true,
      cache: 'no-store',
    },
  )

  const order = extractOrder(response)

  if (!order) {
    throw new ApiError(
      'The backend did not return the requested order.',
      500,
    )
  }

  return order
}

export async function createOrder(
  payload: OrderPayload,
): Promise<{
  order?: Order
  message: string
}> {
  const response = await apiRequest<unknown>(
    '/orders',
    {
      method: 'POST',
      auth: true,
      body: createRequestPayload(payload),
    },
  )

  return {
    order: extractOrder(response),

    message: extractMessage(
      response,
      'Order created successfully.',
    ),
  }
}

export async function updateOrder(
  id: number | string,
  payload: OrderUpdatePayload,
): Promise<{
  order?: Order
  message: string
}> {
  const notes = payload.notes?.trim() || null

  const response = await apiRequest<unknown>(
    `/orders/${id}`,
    {
      method: 'PATCH',
      auth: true,
      body: {
        notes,
        order_notes: notes,
        pickup_notes:
          payload.pickup_notes?.trim() || null,
      },
    },
  )

  return {
    order: extractOrder(response),

    message: extractMessage(
      response,
      'Order updated successfully.',
    ),
  }
}

export async function deleteOrder(
  id: number | string,
): Promise<string> {
  const response = await apiRequest<unknown>(
    `/orders/${id}`,
    {
      method: 'DELETE',
      auth: true,
    },
  )

  return extractMessage(
    response,
    'Order deleted successfully.',
  )
}

export async function restoreOrder(
  id: number | string,
): Promise<string> {
  const response = await apiRequest<unknown>(
    `/orders/${id}/restore`,
    {
      method: 'POST',
      auth: true,
    },
  )

  return extractMessage(
    response,
    'Order restored successfully.',
  )
}

async function runOrderAction(
  id: number | string,
  action: 'preparing' | 'ready' | 'complete' | 'cancel',
  payload: OrderActionPayload = {},
): Promise<{
  order?: Order
  message: string
}> {
  const reason = payload.reason?.trim() || null
  const notes = payload.notes?.trim() || null

  const response = await apiRequest<unknown>(
    `/orders/${id}/${action}`,
    {
      method: 'POST',
      auth: true,
      body: {
        reason,
        notes,

        ...(action === 'cancel'
          ? {
              cancellation_reason: reason,
              cancel_reason: reason,
            }
          : {}),
      },
    },
  )

  return {
    order: extractOrder(response),

    message: extractMessage(
      response,
      `Order ${action} action completed successfully.`,
    ),
  }
}

export function markOrderPreparing(
  id: number | string,
  payload: OrderActionPayload = {},
) {
  return runOrderAction(id, 'preparing', payload)
}

export function markOrderReady(
  id: number | string,
  payload: OrderActionPayload = {},
) {
  return runOrderAction(id, 'ready', payload)
}

export function completeOrder(
  id: number | string,
  payload: OrderActionPayload = {},
) {
  return runOrderAction(id, 'complete', payload)
}

export function cancelOrder(
  id: number | string,
  payload: OrderActionPayload,
) {
  return runOrderAction(id, 'cancel', payload)
}
