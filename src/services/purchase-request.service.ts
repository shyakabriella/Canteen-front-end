import { apiRequest } from '@/lib/api'
import {
  getPurchaseRequestEstimatedTotal,
  getPurchaseRequestPriority,
  getPurchaseRequestStatus,
} from '@/lib/purchase-request'
import type {
  ApprovePurchaseRequestPayload,
  CancelPurchaseRequestPayload,
  MarkPurchaseRequestOrderedPayload,
  PurchaseRequest,
  PurchaseRequestListParams,
  PurchaseRequestListResult,
  PurchaseRequestPayload,
  PurchaseRequestSummary,
  ReceivePurchaseRequestPayload,
  RejectPurchaseRequestPayload,
} from '@/types/purchase-request'

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

function looksLikePurchaseRequest(
  value: unknown,
): value is PurchaseRequest {
  const record = asRecord(value)

  if (!record) {
    return false
  }

  return (
    'id' in record ||
    'request_number' in record ||
    'inventory_stock_id' in record ||
    'requested_quantity' in record
  )
}

function extractPurchaseRequest(
  payload: unknown,
): PurchaseRequest | undefined {
  if (looksLikePurchaseRequest(payload)) {
    return payload
  }

  const root = asRecord(payload)
  const data = root?.data
  const dataRecord = asRecord(data)

  const values = [
    root?.purchase_request,
    root?.purchaseRequest,
    root?.request,
    data,
    dataRecord?.purchase_request,
    dataRecord?.purchaseRequest,
    dataRecord?.request,
  ]

  return values.find(
    looksLikePurchaseRequest,
  )
}

function extractPurchaseRequestArray(
  payload: unknown,
): PurchaseRequest[] {
  if (Array.isArray(payload)) {
    return payload.filter(
      looksLikePurchaseRequest,
    )
  }

  const root = asRecord(payload)

  if (!root) {
    return []
  }

  const data = asRecord(root.data)

  const arrays = [
    root.purchase_requests,
    root.purchaseRequests,
    root.requests,
    root.items,
    root.data,

    data?.purchase_requests,
    data?.purchaseRequests,
    data?.requests,
    data?.items,
    data?.data,
  ]

  for (const array of arrays) {
    if (Array.isArray(array)) {
      return array.filter(
        looksLikePurchaseRequest,
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
  params: PurchaseRequestListParams,
): string {
  const query = new URLSearchParams()

  if (params.search?.trim()) {
    query.set('search', params.search.trim())
  }

  if (params.status) {
    query.set('status', params.status)
  }

  if (params.priority) {
    query.set('priority', params.priority)
  }

  if (params.supplierId) {
    query.set('supplier_id', params.supplierId)
  }

  if (params.inventoryStockId) {
    query.set(
      'inventory_stock_id',
      params.inventoryStockId,
    )
  }

  if (params.dateFrom) {
    query.set('date_from', params.dateFrom)
  }

  if (params.dateTo) {
    query.set('date_to', params.dateTo)
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

function requestPayload(
  payload: PurchaseRequestPayload,
) {
  const quantity = Number(payload.quantity)
  const unitCost = Number(payload.unit_cost)

  return {
    supplier_id: payload.supplier_id,

    inventory_stock_id:
      payload.inventory_stock_id,

    requested_quantity: quantity,
    quantity,

    estimated_unit_cost: unitCost,
    unit_cost: unitCost,

    expected_delivery_date:
      payload.expected_delivery_date || null,

    priority: payload.priority,

    reason: payload.reason.trim(),
    purpose: payload.reason.trim(),
    description: payload.reason.trim(),

    notes: payload.notes?.trim() || null,
  }
}

export async function getPurchaseRequests(
  params: PurchaseRequestListParams = {},
): Promise<PurchaseRequestListResult> {
  const query = buildQuery(params)

  const response = await apiRequest<unknown>(
    `/purchase-requests${query ? `?${query}` : ''}`,
    {
      method: 'GET',
      auth: true,
      cache: 'no-store',
    },
  )

  const root = asRecord(response)
  const data = asRecord(root?.data)

  return {
    requests:
      extractPurchaseRequestArray(response),

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

export async function getPurchaseRequestSummary(
  params: PurchaseRequestListParams = {},
): Promise<PurchaseRequestSummary> {
  const query = buildQuery(params)

  const response = await apiRequest<unknown>(
    `/purchase-requests/summary${query ? `?${query}` : ''}`,
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

  const requests =
    extractPurchaseRequestArray(response)

  const countStatus = (status: string) =>
    requests.filter(
      (request) =>
        getPurchaseRequestStatus(request) ===
        status,
    ).length

  const urgent = requests.filter(
    (request) =>
      getPurchaseRequestPriority(request) ===
      'urgent',
  ).length

  const totalAmount = requests.reduce(
    (total, request) =>
      total +
      getPurchaseRequestEstimatedTotal(request),
    0,
  )

  return {
    total_requests: firstNumber(
      summary.total_requests,
      summary.requests_count,
      summary.total,
      requests.length,
    ),

    pending_requests: firstNumber(
      summary.pending_requests,
      summary.pending_count,
      countStatus('pending'),
    ),

    approved_requests: firstNumber(
      summary.approved_requests,
      summary.approved_count,
      countStatus('approved'),
    ),

    ordered_requests: firstNumber(
      summary.ordered_requests,
      summary.ordered_count,
      countStatus('ordered'),
    ),

    received_requests: firstNumber(
      summary.received_requests,
      summary.received_count,
      countStatus('received'),
    ),

    rejected_requests: firstNumber(
      summary.rejected_requests,
      summary.rejected_count,
      countStatus('rejected'),
    ),

    cancelled_requests: firstNumber(
      summary.cancelled_requests,
      summary.canceled_requests,
      summary.cancelled_count,
      countStatus('cancelled'),
    ),

    urgent_requests: firstNumber(
      summary.urgent_requests,
      summary.critical_requests,
      urgent,
    ),

    total_estimated_amount: firstNumber(
      summary.total_estimated_amount,
      summary.estimated_total,
      summary.total_amount,
      totalAmount,
    ),
  }
}

export async function getPurchaseRequest(
  id: number | string,
): Promise<PurchaseRequest> {
  const response = await apiRequest<unknown>(
    `/purchase-requests/${id}`,
    {
      method: 'GET',
      auth: true,
      cache: 'no-store',
    },
  )

  const request =
    extractPurchaseRequest(response)

  if (!request) {
    throw new Error(
      'The backend did not return the requested purchase request.',
    )
  }

  return request
}

export async function createPurchaseRequest(
  payload: PurchaseRequestPayload,
): Promise<{
  request?: PurchaseRequest
  message: string
}> {
  const response = await apiRequest<unknown>(
    '/purchase-requests',
    {
      method: 'POST',
      auth: true,
      body: requestPayload(payload),
    },
  )

  return {
    request: extractPurchaseRequest(response),
    message: extractMessage(
      response,
      'Purchase request created successfully.',
    ),
  }
}

export async function updatePurchaseRequest(
  id: number | string,
  payload: PurchaseRequestPayload,
): Promise<{
  request?: PurchaseRequest
  message: string
}> {
  const response = await apiRequest<unknown>(
    `/purchase-requests/${id}`,
    {
      method: 'PATCH',
      auth: true,
      body: requestPayload(payload),
    },
  )

  return {
    request: extractPurchaseRequest(response),
    message: extractMessage(
      response,
      'Purchase request updated successfully.',
    ),
  }
}

export async function deletePurchaseRequest(
  id: number | string,
): Promise<string> {
  const response = await apiRequest<unknown>(
    `/purchase-requests/${id}`,
    {
      method: 'DELETE',
      auth: true,
    },
  )

  return extractMessage(
    response,
    'Purchase request deleted successfully.',
  )
}

export async function approvePurchaseRequest(
  id: number | string,
  payload: ApprovePurchaseRequestPayload,
): Promise<string> {
  const response = await apiRequest<unknown>(
    `/purchase-requests/${id}/approve`,
    {
      method: 'POST',
      auth: true,
      body: {
        notes: payload.notes?.trim() || null,
        approval_notes:
          payload.notes?.trim() || null,
      },
    },
  )

  return extractMessage(
    response,
    'Purchase request approved successfully.',
  )
}

export async function rejectPurchaseRequest(
  id: number | string,
  payload: RejectPurchaseRequestPayload,
): Promise<string> {
  const reason = payload.reason.trim()

  const response = await apiRequest<unknown>(
    `/purchase-requests/${id}/reject`,
    {
      method: 'POST',
      auth: true,
      body: {
        reason,
        rejection_reason: reason,
        reject_reason: reason,
        notes: payload.notes?.trim() || null,
      },
    },
  )

  return extractMessage(
    response,
    'Purchase request rejected successfully.',
  )
}

export async function markPurchaseRequestOrdered(
  id: number | string,
  payload: MarkPurchaseRequestOrderedPayload,
): Promise<string> {
  const response = await apiRequest<unknown>(
    `/purchase-requests/${id}/mark-ordered`,
    {
      method: 'POST',
      auth: true,
      body: {
        purchase_order_number:
          payload.purchase_order_number?.trim() ||
          null,

        po_number:
          payload.purchase_order_number?.trim() ||
          null,

        expected_delivery_date:
          payload.expected_delivery_date || null,

        notes: payload.notes?.trim() || null,
        order_notes:
          payload.notes?.trim() || null,
      },
    },
  )

  return extractMessage(
    response,
    'Purchase request marked as ordered.',
  )
}

export async function receivePurchaseRequest(
  id: number | string,
  payload: ReceivePurchaseRequestPayload,
): Promise<string> {
  const quantity = Number(
    payload.received_quantity,
  )

  const unitCost = payload.actual_unit_cost
    ? Number(payload.actual_unit_cost)
    : null

  const response = await apiRequest<unknown>(
    `/purchase-requests/${id}/receive`,
    {
      method: 'POST',
      auth: true,
      body: {
        received_quantity: quantity,
        quantity,

        actual_unit_cost: unitCost,
        unit_cost: unitCost,

        supplier_invoice_number:
          payload.supplier_invoice_number?.trim() ||
          null,

        invoice_number:
          payload.supplier_invoice_number?.trim() ||
          null,

        notes: payload.notes?.trim() || null,
        receiving_notes:
          payload.notes?.trim() || null,
        receipt_notes:
          payload.notes?.trim() || null,
      },
    },
  )

  return extractMessage(
    response,
    'Stock received successfully.',
  )
}

export async function cancelPurchaseRequest(
  id: number | string,
  payload: CancelPurchaseRequestPayload,
): Promise<string> {
  const reason = payload.reason.trim()

  const response = await apiRequest<unknown>(
    `/purchase-requests/${id}/cancel`,
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

  return extractMessage(
    response,
    'Purchase request cancelled successfully.',
  )
}

export async function restorePurchaseRequest(
  id: number | string,
): Promise<string> {
  const response = await apiRequest<unknown>(
    `/purchase-requests/${id}/restore`,
    {
      method: 'POST',
      auth: true,
    },
  )

  return extractMessage(
    response,
    'Purchase request restored successfully.',
  )
}
