import {
  getOrderReference,
  getOrderTotal,
  getOrderUserEmail,
  getOrderUserName,
} from '@/lib/order'
import type { OrderQrCode } from '@/types/order-qr-code'
import type {
  PickupConfirmation,
  PickupConfirmationMethod,
  PickupConfirmationStatus,
} from '@/types/pickup-confirmation'

export function normalizePickupStatus(
  status?: PickupConfirmationStatus | null,
): 'confirmed' | 'cancelled' {
  const value = String(status ?? 'confirmed')
    .trim()
    .toLowerCase()
    .replaceAll('-', '_')
    .replaceAll(' ', '_')

  if (
    [
      'cancelled',
      'canceled',
      'cancel',
      'revoked',
      'void',
    ].includes(value)
  ) {
    return 'cancelled'
  }

  return 'confirmed'
}

export function getPickupStatus(
  confirmation: PickupConfirmation,
): 'confirmed' | 'cancelled' {
  return normalizePickupStatus(
    confirmation.status,
  )
}

export function pickupStatusLabel(
  confirmation: PickupConfirmation,
): string {
  return getPickupStatus(confirmation) ===
    'cancelled'
    ? 'Cancelled'
    : 'Confirmed'
}

export function normalizePickupMethod(
  method?: PickupConfirmationMethod | null,
): 'manual' | 'qr' | 'other' {
  const value = String(method ?? '')
    .trim()
    .toLowerCase()
    .replaceAll('-', '_')
    .replaceAll(' ', '_')

  if (
    [
      'qr',
      'qr_scan',
      'scan',
      'scanned',
      'qr_code',
    ].includes(value)
  ) {
    return 'qr'
  }

  if (
    [
      'manual',
      'staff',
      'admin',
      'administrator',
    ].includes(value)
  ) {
    return 'manual'
  }

  return 'other'
}

export function getPickupMethod(
  confirmation: PickupConfirmation,
): 'manual' | 'qr' | 'other' {
  const suppliedMethod =
    confirmation.confirmation_method ??
    confirmation.pickup_method ??
    confirmation.method

  if (suppliedMethod) {
    return normalizePickupMethod(suppliedMethod)
  }

  if (
    confirmation.qr_scan_log_id ||
    confirmation.qr_scan_log ||
    confirmation.qrScanLog
  ) {
    return 'qr'
  }

  return 'manual'
}

export function pickupMethodLabel(
  confirmation: PickupConfirmation,
): string {
  const method = getPickupMethod(confirmation)

  if (method === 'qr') {
    return 'QR Scan'
  }

  if (method === 'manual') {
    return 'Manual'
  }

  return 'Other'
}

export function getPickupQrCode(
  confirmation: PickupConfirmation,
): OrderQrCode | null {
  return (
    confirmation.order_qr_code ??
    confirmation.orderQrCode ??
    confirmation.qr_code ??
    confirmation.qrCode ??
    null
  )
}

export function getPickupOrderReference(
  confirmation: PickupConfirmation,
): string {
  return confirmation.order
    ? getOrderReference(confirmation.order)
    : confirmation.order_id
      ? `ORDER-${confirmation.order_id}`
      : 'Order not available'
}

export function getPickupCustomerName(
  confirmation: PickupConfirmation,
): string {
  return confirmation.order
    ? getOrderUserName(confirmation.order)
    : 'Customer not available'
}

export function getPickupCustomerEmail(
  confirmation: PickupConfirmation,
): string {
  return confirmation.order
    ? getOrderUserEmail(confirmation.order)
    : 'Email not available'
}

export function getPickupOrderAmount(
  confirmation: PickupConfirmation,
): number {
  return confirmation.order
    ? getOrderTotal(confirmation.order)
    : 0
}

export function getPickupConfirmerName(
  confirmation: PickupConfirmation,
): string {
  return (
    confirmation.confirmer?.name ??
    confirmation.confirmedBy?.name ??
    confirmation.confirmed_by_user?.name ??
    (
      confirmation.confirmed_by
        ? `Staff #${confirmation.confirmed_by}`
        : 'Authenticated staff'
    )
  )
}

export function getPickupConfirmerEmail(
  confirmation: PickupConfirmation,
): string {
  return (
    confirmation.confirmer?.email ??
    confirmation.confirmedBy?.email ??
    confirmation.confirmed_by_user?.email ??
    'Email not available'
  )
}

export function getPickupCancellerName(
  confirmation: PickupConfirmation,
): string {
  return (
    confirmation.canceller?.name ??
    confirmation.cancelledBy?.name ??
    confirmation.cancelled_by_user?.name ??
    (
      confirmation.cancelled_by
        ? `Staff #${confirmation.cancelled_by}`
        : 'Not available'
    )
  )
}

export function getPickupNotes(
  confirmation: PickupConfirmation,
): string {
  return (
    confirmation.notes ??
    confirmation.pickup_notes ??
    ''
  )
}

export function getPickupCancellationReason(
  confirmation: PickupConfirmation,
): string {
  return (
    confirmation.cancellation_reason ??
    confirmation.cancel_reason ??
    'No cancellation reason provided.'
  )
}

export function getPickupDate(
  confirmation: PickupConfirmation,
): string | null {
  return (
    confirmation.confirmed_at ??
    confirmation.picked_up_at ??
    confirmation.pickup_at ??
    confirmation.created_at ??
    null
  )
}

export function getPickupDevice(
  confirmation: PickupConfirmation,
): string {
  const values = [
    confirmation.device_name,
    confirmation.device_type,
  ].filter(Boolean)

  return values.length
    ? values.join(' — ')
    : 'Device not available'
}

export function getPickupCoordinates(
  confirmation: PickupConfirmation,
): string {
  if (
    confirmation.latitude === undefined ||
    confirmation.latitude === null ||
    confirmation.longitude === undefined ||
    confirmation.longitude === null
  ) {
    return 'Coordinates not available'
  }

  return `${confirmation.latitude}, ${confirmation.longitude}`
}

export function formatPickupAmount(
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

export function formatPickupDate(
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

export function canCancelPickup(
  confirmation: PickupConfirmation,
): boolean {
  return (
    !confirmation.deleted_at &&
    getPickupStatus(confirmation) ===
      'confirmed'
  )
}
