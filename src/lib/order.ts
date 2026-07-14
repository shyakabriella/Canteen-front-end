import type {
  Order,
  OrderItem,
  OrderStatus,
} from '@/types/order'

export function orderNumberValue(
  value: unknown,
): number {
  const numeric = Number(value ?? 0)

  return Number.isFinite(numeric)
    ? numeric
    : 0
}

export function normalizeOrderStatus(
  status?: OrderStatus | null,
): 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled' {
  const value = String(status ?? 'pending')
    .trim()
    .toLowerCase()
    .replaceAll('-', '_')
    .replaceAll(' ', '_')

  if (
    [
      'preparing',
      'processing',
      'in_preparation',
      'confirmed',
    ].includes(value)
  ) {
    return 'preparing'
  }

  if (
    [
      'ready',
      'ready_for_pickup',
      'prepared',
    ].includes(value)
  ) {
    return 'ready'
  }

  if (
    [
      'completed',
      'complete',
      'collected',
      'delivered',
      'picked_up',
    ].includes(value)
  ) {
    return 'completed'
  }

  if (
    [
      'cancelled',
      'canceled',
      'cancel',
      'refunded',
    ].includes(value)
  ) {
    return 'cancelled'
  }

  return 'pending'
}

export function getOrderStatus(
  order: Order,
) {
  return normalizeOrderStatus(order.status)
}

export function orderStatusLabel(
  order: Order,
): string {
  const status = getOrderStatus(order)

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

export function getOrderReference(
  order: Order,
): string {
  return (
    order.order_number ??
    order.reference ??
    order.code ??
    `ORDER-${order.id}`
  )
}

export function getOrderUserName(
  order: Order,
): string {
  return (
    order.user?.name ??
    `User #${order.user_id ?? 'Unknown'}`
  )
}

export function getOrderUserEmail(
  order: Order,
): string {
  return (
    order.user?.email ??
    'Email not available'
  )
}

export function getOrderItems(
  order: Order,
): OrderItem[] {
  return (
    order.items ??
    order.order_items ??
    order.orderItems ??
    []
  )
}

export function getOrderItemFood(
  item: OrderItem,
) {
  return item.food_item ?? item.foodItem ?? null
}

export function getOrderItemName(
  item: OrderItem,
): string {
  return (
    getOrderItemFood(item)?.name ??
    `Food item #${item.food_item_id ?? 'Unknown'}`
  )
}

export function getOrderItemQuantity(
  item: OrderItem,
): number {
  return orderNumberValue(item.quantity || 1)
}

export function getOrderItemUnitPrice(
  item: OrderItem,
): number {
  return orderNumberValue(
    item.unit_price ??
      item.price ??
      getOrderItemFood(item)?.price,
  )
}

export function getOrderItemTotal(
  item: OrderItem,
): number {
  const suppliedTotal =
    item.subtotal ?? item.total_price

  if (
    suppliedTotal !== undefined &&
    suppliedTotal !== null
  ) {
    return orderNumberValue(suppliedTotal)
  }

  return (
    getOrderItemQuantity(item) *
    getOrderItemUnitPrice(item)
  )
}

export function getOrderTotal(
  order: Order,
): number {
  const suppliedTotal =
    order.total_amount ??
    order.total ??
    order.amount

  if (
    suppliedTotal !== undefined &&
    suppliedTotal !== null
  ) {
    return orderNumberValue(suppliedTotal)
  }

  return getOrderItems(order).reduce(
    (total, item) =>
      total + getOrderItemTotal(item),
    0,
  )
}

export function getOrderSubtotal(
  order: Order,
): number {
  if (
    order.subtotal !== undefined &&
    order.subtotal !== null
  ) {
    return orderNumberValue(order.subtotal)
  }

  return getOrderTotal(order)
}

export function getOrderNotes(
  order: Order,
): string {
  return (
    order.notes ??
    order.order_notes ??
    ''
  )
}

export function getOrderCancellationReason(
  order: Order,
): string {
  return (
    order.cancellation_reason ??
    order.cancel_reason ??
    'No cancellation reason provided.'
  )
}

export function formatOrderAmount(
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

export function formatOrderDate(
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
      ? { timeStyle: 'short' }
      : {}),
  }).format(date)
}

export function canMarkPreparing(
  order: Order,
): boolean {
  return (
    !order.deleted_at &&
    getOrderStatus(order) === 'pending'
  )
}

export function canMarkReady(
  order: Order,
): boolean {
  return (
    !order.deleted_at &&
    getOrderStatus(order) === 'preparing'
  )
}

export function canCompleteOrder(
  order: Order,
): boolean {
  return (
    !order.deleted_at &&
    getOrderStatus(order) === 'ready'
  )
}

export function canCancelOrder(
  order: Order,
): boolean {
  const status = getOrderStatus(order)

  return (
    !order.deleted_at &&
    status !== 'completed' &&
    status !== 'cancelled'
  )
}
