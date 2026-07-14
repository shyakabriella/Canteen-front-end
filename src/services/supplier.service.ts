import { apiRequest } from '@/lib/api'
import {
  getSupplierOrderCount,
  getSupplierPurchaseRequestCount,
  getSupplierStatus,
  getSupplierTotalAmount,
} from '@/lib/supplier'
import type {
  Supplier,
  SupplierListParams,
  SupplierListResult,
  SupplierPayload,
  SupplierSummary,
} from '@/types/supplier'

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

function looksLikeSupplier(
  value: unknown,
): value is Supplier {
  const record = asRecord(value)

  if (!record) {
    return false
  }

  return (
    'id' in record ||
    'supplier_code' in record ||
    'company_name' in record ||
    'contact_person' in record
  )
}

function extractSupplier(
  payload: unknown,
): Supplier | undefined {
  if (looksLikeSupplier(payload)) {
    return payload
  }

  const root = asRecord(payload)
  const data = root?.data
  const dataRecord = asRecord(data)

  const possibleSuppliers = [
    root?.supplier,
    data,
    dataRecord?.supplier,
  ]

  return possibleSuppliers.find(
    looksLikeSupplier,
  )
}

function extractSupplierArray(
  payload: unknown,
): Supplier[] {
  if (Array.isArray(payload)) {
    return payload.filter(looksLikeSupplier)
  }

  const root = asRecord(payload)

  if (!root) {
    return []
  }

  const data = asRecord(root.data)

  const possibleArrays = [
    root.suppliers,
    root.items,
    root.data,

    data?.suppliers,
    data?.items,
    data?.data,
  ]

  for (const possibleArray of possibleArrays) {
    if (Array.isArray(possibleArray)) {
      return possibleArray.filter(
        looksLikeSupplier,
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

function buildSupplierQuery(
  params: SupplierListParams,
): string {
  const query = new URLSearchParams()

  if (params.search?.trim()) {
    query.set('search', params.search.trim())
  }

  if (params.status) {
    query.set('status', params.status)
  }

  if (params.city?.trim()) {
    query.set('city', params.city.trim())
  }

  if (params.country?.trim()) {
    query.set(
      'country',
      params.country.trim(),
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

function supplierRequestPayload(
  payload: SupplierPayload,
) {
  const name = payload.name.trim()
  const contactPerson =
    payload.contact_person.trim()

  return {
    name,
    supplier_name: name,
    company_name: name,

    contact_person: contactPerson,
    contact_name: contactPerson,

    email:
      payload.email?.trim() || null,

    phone: payload.phone.trim(),

    secondary_phone:
      payload.secondary_phone?.trim() ||
      null,

    alternative_phone:
      payload.secondary_phone?.trim() ||
      null,

    address:
      payload.address?.trim() || null,

    city: payload.city?.trim() || null,

    country:
      payload.country?.trim() || null,

    tax_number:
      payload.tax_number?.trim() || null,

    tin_number:
      payload.tax_number?.trim() || null,

    payment_terms:
      payload.payment_terms?.trim() ||
      null,

    status: payload.status,

    notes:
      payload.notes?.trim() || null,
  }
}

export async function getSuppliers(
  params: SupplierListParams = {},
): Promise<SupplierListResult> {
  const query = buildSupplierQuery(params)

  const response = await apiRequest<unknown>(
    `/suppliers${query ? `?${query}` : ''}`,
    {
      method: 'GET',
      auth: true,
      cache: 'no-store',
    },
  )

  const root = asRecord(response)
  const data = asRecord(root?.data)

  return {
    suppliers: extractSupplierArray(response),

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

export async function getSupplierSummary(
  params: SupplierListParams = {},
): Promise<SupplierSummary> {
  const query = buildSupplierQuery(params)

  const response = await apiRequest<unknown>(
    `/suppliers/summary${query ? `?${query}` : ''}`,
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

  const suppliers = extractSupplierArray(response)

  const active = suppliers.filter(
    (supplier) =>
      getSupplierStatus(supplier) === 'active',
  )

  const inactive = suppliers.filter(
    (supplier) =>
      getSupplierStatus(supplier) ===
      'inactive',
  )

  const suspended = suppliers.filter(
    (supplier) =>
      getSupplierStatus(supplier) ===
      'suspended',
  )

  const suppliersWithOrders = suppliers.filter(
    (supplier) =>
      getSupplierOrderCount(supplier) > 0,
  )

  const requestCount = suppliers.reduce(
    (total, supplier) =>
      total +
      getSupplierPurchaseRequestCount(
        supplier,
      ),
    0,
  )

  const purchaseAmount = suppliers.reduce(
    (total, supplier) =>
      total +
      getSupplierTotalAmount(supplier),
    0,
  )

  return {
    total_suppliers: firstNumber(
      summary.total_suppliers,
      summary.suppliers_count,
      summary.total,
      suppliers.length,
    ),

    active_suppliers: firstNumber(
      summary.active_suppliers,
      summary.active_count,
      active.length,
    ),

    inactive_suppliers: firstNumber(
      summary.inactive_suppliers,
      summary.inactive_count,
      inactive.length,
    ),

    suspended_suppliers: firstNumber(
      summary.suspended_suppliers,
      summary.blocked_suppliers,
      summary.suspended_count,
      suspended.length,
    ),

    suppliers_with_orders: firstNumber(
      summary.suppliers_with_orders,
      summary.suppliers_with_purchases,
      suppliersWithOrders.length,
    ),

    total_purchase_requests: firstNumber(
      summary.total_purchase_requests,
      summary.purchase_requests_count,
      requestCount,
    ),

    total_purchase_amount: firstNumber(
      summary.total_purchase_amount,
      summary.total_purchases,
      summary.purchase_amount,
      purchaseAmount,
    ),
  }
}

export async function getSupplier(
  id: number | string,
): Promise<Supplier> {
  const response = await apiRequest<unknown>(
    `/suppliers/${id}`,
    {
      method: 'GET',
      auth: true,
      cache: 'no-store',
    },
  )

  const supplier = extractSupplier(response)

  if (!supplier) {
    throw new Error(
      'The backend did not return the requested supplier.',
    )
  }

  return supplier
}

export async function createSupplier(
  payload: SupplierPayload,
): Promise<{
  supplier?: Supplier
  message: string
}> {
  const response = await apiRequest<unknown>(
    '/suppliers',
    {
      method: 'POST',
      auth: true,
      body: supplierRequestPayload(payload),
    },
  )

  return {
    supplier: extractSupplier(response),

    message: extractMessage(
      response,
      'Supplier created successfully.',
    ),
  }
}

export async function updateSupplier(
  id: number | string,
  payload: SupplierPayload,
): Promise<{
  supplier?: Supplier
  message: string
}> {
  const response = await apiRequest<unknown>(
    `/suppliers/${id}`,
    {
      method: 'PATCH',
      auth: true,
      body: supplierRequestPayload(payload),
    },
  )

  return {
    supplier: extractSupplier(response),

    message: extractMessage(
      response,
      'Supplier updated successfully.',
    ),
  }
}

export async function deleteSupplier(
  id: number | string,
): Promise<string> {
  const response = await apiRequest<unknown>(
    `/suppliers/${id}`,
    {
      method: 'DELETE',
      auth: true,
    },
  )

  return extractMessage(
    response,
    'Supplier deleted successfully.',
  )
}

export async function restoreSupplier(
  id: number | string,
): Promise<string> {
  const response = await apiRequest<unknown>(
    `/suppliers/${id}/restore`,
    {
      method: 'POST',
      auth: true,
    },
  )

  return extractMessage(
    response,
    'Supplier restored successfully.',
  )
}
