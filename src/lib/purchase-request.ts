import {
  getStockFoodName,
  getStockFoodItem,
  getStockQuantity,
  getStockThreshold,
  getStockUnit,
} from '@/lib/low-stock-alert'
import {
  getSupplierCode,
  getSupplierName,
} from '@/lib/supplier'
import type {
  PurchaseRequest,
  PurchaseRequestPriority,
  PurchaseRequestStatus,
} from '@/types/purchase-request'

export function purchaseRequestNumber(
  value: unknown,
): number {
  const numeric = Number(value ?? 0)

  return Number.isFinite(numeric)
    ? numeric
    : 0
}

export function normalizePurchaseRequestStatus(
  status?: PurchaseRequestStatus | null,
):
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'ordered'
  | 'received'
  | 'cancelled' {
  const value = String(status ?? 'pending')
    .trim()
    .toLowerCase()
    .replaceAll('-', '_')
    .replaceAll(' ', '_')

  if (
    ['approved', 'accepted', 'authorized'].includes(
      value,
    )
  ) {
    return 'approved'
  }

  if (
    ['rejected', 'declined', 'denied'].includes(
      value,
    )
  ) {
    return 'rejected'
  }

  if (
    ['ordered', 'purchased', 'sent_to_supplier'].includes(
      value,
    )
  ) {
    return 'ordered'
  }

  if (
    [
      'received',
      'completed',
      'delivered',
      'stock_received',
    ].includes(value)
  ) {
    return 'received'
  }

  if (
    [
      'cancelled',
      'canceled',
      'void',
      'revoked',
    ].includes(value)
  ) {
    return 'cancelled'
  }

  return 'pending'
}

export function getPurchaseRequestStatus(
  request: PurchaseRequest,
) {
  return normalizePurchaseRequestStatus(
    request.status,
  )
}

export function purchaseRequestStatusLabel(
  request: PurchaseRequest,
): string {
  const status = getPurchaseRequestStatus(request)

  return {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    ordered: 'Ordered',
    received: 'Received',
    cancelled: 'Cancelled',
  }[status]
}

export function normalizePurchaseRequestPriority(
  priority?: PurchaseRequestPriority | null,
): 'low' | 'normal' | 'high' | 'urgent' {
  const value = String(priority ?? 'normal')
    .trim()
    .toLowerCase()
    .replaceAll('-', '_')
    .replaceAll(' ', '_')

  if (
    ['urgent', 'critical', 'emergency'].includes(
      value,
    )
  ) {
    return 'urgent'
  }

  if (['high', 'important'].includes(value)) {
    return 'high'
  }

  if (['low', 'minor'].includes(value)) {
    return 'low'
  }

  return 'normal'
}

export function getPurchaseRequestPriority(
  request: PurchaseRequest,
) {
  return normalizePurchaseRequestPriority(
    request.priority,
  )
}

export function purchaseRequestPriorityLabel(
  request: PurchaseRequest,
): string {
  const priority =
    getPurchaseRequestPriority(request)

  return {
    low: 'Low',
    normal: 'Normal',
    high: 'High',
    urgent: 'Urgent',
  }[priority]
}

export function getPurchaseRequestReference(
  request: PurchaseRequest,
): string {
  return (
    request.request_number ??
    request.request_code ??
    request.reference ??
    request.code ??
    `PR-${request.id}`
  )
}

export function getPurchaseRequestSupplierName(
  request: PurchaseRequest,
): string {
  return request.supplier
    ? getSupplierName(request.supplier)
    : request.supplier_id
      ? `Supplier #${request.supplier_id}`
      : 'Supplier not assigned'
}

export function getPurchaseRequestSupplierCode(
  request: PurchaseRequest,
): string {
  return request.supplier
    ? getSupplierCode(request.supplier)
    : 'Not available'
}

export function getPurchaseRequestStock(
  request: PurchaseRequest,
) {
  return (
    request.inventory_stock ??
    request.inventoryStock ??
    null
  )
}

export function getPurchaseRequestFoodName(
  request: PurchaseRequest,
): string {
  const stock = getPurchaseRequestStock(request)

  return (
    request.food_item?.name ??
    request.foodItem?.name ??
    (stock ? getStockFoodName(stock) : null) ??
    (
      request.food_item_id
        ? `Food item #${request.food_item_id}`
        : 'Food item not available'
    )
  )
}

export function getPurchaseRequestUnit(
  request: PurchaseRequest,
): string {
  const stock = getPurchaseRequestStock(request)

  return (
    request.unit ??
    request.food_item?.unit ??
    request.foodItem?.unit ??
    (stock ? getStockUnit(stock) : null) ??
    'units'
  )
}

export function getPurchaseRequestQuantity(
  request: PurchaseRequest,
): number {
  return purchaseRequestNumber(
    request.requested_quantity ??
    request.quantity,
  )
}

export function getPurchaseRequestReceivedQuantity(
  request: PurchaseRequest,
): number {
  return purchaseRequestNumber(
    request.received_quantity,
  )
}

export function getPurchaseRequestUnitCost(
  request: PurchaseRequest,
): number {
  return purchaseRequestNumber(
    request.estimated_unit_cost ??
    request.unit_cost,
  )
}

export function getPurchaseRequestActualUnitCost(
  request: PurchaseRequest,
): number {
  return purchaseRequestNumber(
    request.actual_unit_cost ??
    request.estimated_unit_cost ??
    request.unit_cost,
  )
}

export function getPurchaseRequestEstimatedTotal(
  request: PurchaseRequest,
): number {
  const explicit =
    request.estimated_total ??
    request.estimated_total_cost ??
    request.total_cost

  if (
    explicit !== undefined &&
    explicit !== null &&
    explicit !== ''
  ) {
    return purchaseRequestNumber(explicit)
  }

  return (
    getPurchaseRequestQuantity(request) *
    getPurchaseRequestUnitCost(request)
  )
}

export function getPurchaseRequestActualTotal(
  request: PurchaseRequest,
): number {
  if (
    request.actual_total !== undefined &&
    request.actual_total !== null &&
    request.actual_total !== ''
  ) {
    return purchaseRequestNumber(
      request.actual_total,
    )
  }

  return (
    getPurchaseRequestReceivedQuantity(request) *
    getPurchaseRequestActualUnitCost(request)
  )
}

export function getPurchaseRequestReason(
  request: PurchaseRequest,
): string {
  return (
    request.reason ??
    request.purpose ??
    request.description ??
    'No reason provided.'
  )
}

export function getPurchaseRequestRejectionReason(
  request: PurchaseRequest,
): string {
  return (
    request.rejection_reason ??
    request.reject_reason ??
    'No rejection reason provided.'
  )
}

export function getPurchaseRequestCancellationReason(
  request: PurchaseRequest,
): string {
  return (
    request.cancellation_reason ??
    request.cancel_reason ??
    'No cancellation reason provided.'
  )
}

export function getPurchaseRequestRequesterName(
  request: PurchaseRequest,
): string {
  return (
    request.requester?.name ??
    request.requestedBy?.name ??
    (
      request.requested_by
        ? `User #${request.requested_by}`
        : 'Authenticated user'
    )
  )
}

export function getPurchaseRequestApproverName(
  request: PurchaseRequest,
): string {
  return (
    request.approver?.name ??
    request.approvedBy?.name ??
    (
      request.approved_by
        ? `User #${request.approved_by}`
        : 'Not available'
    )
  )
}

export function getPurchaseRequestReceiverName(
  request: PurchaseRequest,
): string {
  return (
    request.receiver?.name ??
    request.receivedBy?.name ??
    (
      request.received_by
        ? `User #${request.received_by}`
        : 'Not available'
    )
  )
}

export function getPurchaseOrderNumber(
  request: PurchaseRequest,
): string {
  return (
    request.purchase_order_number ??
    request.po_number ??
    'Not provided'
  )
}

export function getSupplierInvoiceNumber(
  request: PurchaseRequest,
): string {
  return (
    request.supplier_invoice_number ??
    request.invoice_number ??
    'Not provided'
  )
}

export function getPurchaseRequestDate(
  request: PurchaseRequest,
): string | null {
  return (
    request.requested_at ??
    request.created_at ??
    null
  )
}

export function getExpectedDeliveryDate(
  request: PurchaseRequest,
): string | null {
  return (
    request.expected_delivery_date ??
    request.expected_delivery_at ??
    null
  )
}

export function getPurchaseRequestStockSnapshot(
  request: PurchaseRequest,
): {
  current: number
  threshold: number
  unit: string
} {
  const stock = getPurchaseRequestStock(request)

  if (!stock) {
    return {
      current: 0,
      threshold: 0,
      unit: getPurchaseRequestUnit(request),
    }
  }

  return {
    current: getStockQuantity(stock),
    threshold: getStockThreshold(stock),
    unit: getStockUnit(stock),
  }
}

export function formatPurchaseRequestAmount(
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

export function formatPurchaseRequestQuantity(
  value: number | string,
  unit = 'units',
): string {
  const numeric = Number(value)

  if (!Number.isFinite(numeric)) {
    return `${value} ${unit}`
  }

  return `${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(numeric)} ${unit}`
}

export function formatPurchaseRequestDate(
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

export function canEditPurchaseRequest(
  request: PurchaseRequest,
): boolean {
  return (
    !request.deleted_at &&
    getPurchaseRequestStatus(request) ===
      'pending'
  )
}

export function canApprovePurchaseRequest(
  request: PurchaseRequest,
): boolean {
  return canEditPurchaseRequest(request)
}

export function canRejectPurchaseRequest(
  request: PurchaseRequest,
): boolean {
  return canEditPurchaseRequest(request)
}

export function canMarkPurchaseRequestOrdered(
  request: PurchaseRequest,
): boolean {
  return (
    !request.deleted_at &&
    getPurchaseRequestStatus(request) ===
      'approved'
  )
}

export function canReceivePurchaseRequest(
  request: PurchaseRequest,
): boolean {
  return (
    !request.deleted_at &&
    getPurchaseRequestStatus(request) ===
      'ordered'
  )
}

export function canCancelPurchaseRequest(
  request: PurchaseRequest,
): boolean {
  const status = getPurchaseRequestStatus(request)

  return (
    !request.deleted_at &&
    ['pending', 'approved', 'ordered'].includes(
      status,
    )
  )
}
