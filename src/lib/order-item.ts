import type { OrderItemRecord } from '@/types/order-item'

export function orderItemNumber(
  value: unknown,
): number {
  const numeric = Number(value ?? 0)

  return Number.isFinite(numeric)
    ? numeric
    : 0
}

export function normalizeOrderItemStatus(
  status?: string | null,
): 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled' {
  const normalized = String(status ?? 'pending')
    .trim()
    .toLowerCase()
    .replaceAll('-', '_')
    .replaceAll(' ', '_')

  if (
    [
      'preparing',
      'confirmed',
      'processing',
      'in_preparation',
    ].includes(normalized)
  ) {
    return 'preparing'
  }

  if (
    [
      'ready',
      'prepared',
      'ready_for_pickup',
    ].includes(normalized)
  ) {
    return 'ready'
  }

  if (
    [
      'completed',
      'complete',
      'collected',
      'picked_up',
      'delivered',
    ].includes(normalized)
  ) {
    return 'completed'
  }

  if (
    [
      'cancelled',
      'canceled',
      'cancel',
      'refunded',
    ].includes(normalized)
  ) {
    return 'cancelled'
  }

  return 'pending'
}

export function getOrderItemStatus(
  item: OrderItemRecord,
) {
  return normalizeOrderItemStatus(item.status)
}

export function orderItemStatusLabel(
  item: OrderItemRecord,
): string {
  const status = getOrderItemStatus(item)

  if (status === 'preparing') {
    return 'Preparing'
  }

  if (status === 'ready') {
    return 'Ready'
  }

  if (status === 'completed') {
    return 'Completed'
  }

  if (status === 'cancelled') {
    return 'Cancelled'
  }

  return 'Pending'
}

export function getOrderItemFood(
  item: OrderItemRecord,
) {
  return item.food_item ?? item.foodItem ?? null
}

export function getOrderItemFoodName(
  item: OrderItemRecord,
): string {
  return (
    getOrderItemFood(item)?.name ??
    `Food item #${item.food_item_id ?? 'Unknown'}`
  )
}

export function getOrderItemQuantity(
  item: OrderItemRecord,
): number {
  return orderItemNumber(item.quantity || 1)
}

export function getOrderItemUnitPrice(
  item: OrderItemRecord,
): number {
  return orderItemNumber(
    item.unit_price ??
      item.price ??
      getOrderItemFood(item)?.price,
  )
}

export function getOrderItemTotal(
  item: OrderItemRecord,
): number {
  const suppliedTotal =
    item.subtotal ??
    item.total_price ??
    item.total

  if (
    suppliedTotal !== undefined &&
    suppliedTotal !== null &&
    suppliedTotal !== ''
  ) {
    return orderItemNumber(suppliedTotal)
  }

  return (
    getOrderItemQuantity(item) *
    getOrderItemUnitPrice(item)
  )
}

export function getOrderItemNotes(
  item: OrderItemRecord,
): string {
  return (
    item.notes ??
    item.item_notes ??
    item.preparation_notes ??
    ''
  )
}

export function getOrderItemOrderReference(
  item: OrderItemRecord,
): string {
  return (
    item.order?.order_number ??
    item.order?.reference ??
    item.order?.code ??
    (
      item.order_id
        ? `ORDER-${item.order_id}`
        : 'Order not available'
    )
  )
}

export function getOrderItemCustomerName(
  item: OrderItemRecord,
): string {
  return (
    item.order?.user?.name ??
    item.user?.name ??
    (
      item.order?.user_id
        ? `User #${item.order.user_id}`
        : 'Customer not available'
    )
  )
}

export function getOrderItemCustomerEmail(
  item: OrderItemRecord,
): string {
  return (
    item.order?.user?.email ??
    item.user?.email ??
    'Email not available'
  )
}

export function formatOrderItemAmount(
  value: number | string,
): string {
  const numeric = Number(value)

  if (!Number.isFinite(numeric)) {
    return `${value} RWF`
  }

  return `${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(numeric)} RWF`
}

export function formatOrderItemDate(
  value?: string | null,
  includeTime = true,
): string {
  if (!value) {
    return 'Not available'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    ...(includeTime
      ? {
          timeStyle: 'short',
        }
      : {}),
  }).format(date)
}
