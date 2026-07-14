import type {
  Supplier,
  SupplierStatus,
} from '@/types/supplier'

export function supplierNumber(
  value: unknown,
): number {
  const numeric = Number(value ?? 0)

  return Number.isFinite(numeric)
    ? numeric
    : 0
}

export function normalizeSupplierStatus(
  status?: SupplierStatus | null,
): 'active' | 'inactive' | 'suspended' {
  const normalized = String(status ?? 'active')
    .trim()
    .toLowerCase()
    .replaceAll('-', '_')
    .replaceAll(' ', '_')

  if (
    [
      'inactive',
      'disabled',
      'closed',
      'unavailable',
    ].includes(normalized)
  ) {
    return 'inactive'
  }

  if (
    [
      'suspended',
      'blocked',
      'blacklisted',
      'restricted',
    ].includes(normalized)
  ) {
    return 'suspended'
  }

  return 'active'
}

export function getSupplierStatus(
  supplier: Supplier,
): 'active' | 'inactive' | 'suspended' {
  return normalizeSupplierStatus(
    supplier.status,
  )
}

export function supplierStatusLabel(
  supplier: Supplier,
): string {
  const status = getSupplierStatus(supplier)

  if (status === 'inactive') {
    return 'Inactive'
  }

  if (status === 'suspended') {
    return 'Suspended'
  }

  return 'Active'
}

export function getSupplierName(
  supplier: Supplier,
): string {
  return (
    supplier.name ??
    supplier.supplier_name ??
    supplier.company_name ??
    `Supplier #${supplier.id}`
  )
}

export function getSupplierCode(
  supplier: Supplier,
): string {
  return (
    supplier.supplier_code ??
    supplier.code ??
    `SUP-${supplier.id}`
  )
}

export function getSupplierContactPerson(
  supplier: Supplier,
): string {
  return (
    supplier.contact_person ??
    supplier.contact_name ??
    'Not provided'
  )
}

export function getSupplierPhone(
  supplier: Supplier,
): string {
  return (
    supplier.phone ??
    'Phone not provided'
  )
}

export function getSupplierSecondaryPhone(
  supplier: Supplier,
): string {
  return (
    supplier.secondary_phone ??
    supplier.alternative_phone ??
    'Not provided'
  )
}

export function getSupplierEmail(
  supplier: Supplier,
): string {
  return (
    supplier.email ??
    'Email not provided'
  )
}

export function getSupplierTaxNumber(
  supplier: Supplier,
): string {
  return (
    supplier.tax_number ??
    supplier.tin_number ??
    'Not provided'
  )
}

export function getSupplierLocation(
  supplier: Supplier,
): string {
  const location = [
    supplier.address,
    supplier.city,
    supplier.country,
  ]
    .filter(Boolean)
    .map(String)

  return location.length
    ? location.join(', ')
    : 'Location not provided'
}

export function getSupplierOrderCount(
  supplier: Supplier,
): number {
  return supplierNumber(
    supplier.purchase_orders_count ??
      supplier.purchase_requests_count,
  )
}

export function getSupplierPurchaseRequestCount(
  supplier: Supplier,
): number {
  return supplierNumber(
    supplier.purchase_requests_count,
  )
}

export function getSupplierTotalAmount(
  supplier: Supplier,
): number {
  return supplierNumber(
    supplier.total_purchase_amount ??
      supplier.total_amount,
  )
}

export function getSupplierLastPurchaseDate(
  supplier: Supplier,
): string | null {
  return (
    supplier.last_purchase_at ??
    supplier.last_order_at ??
    null
  )
}

export function formatSupplierAmount(
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

export function formatSupplierDate(
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
