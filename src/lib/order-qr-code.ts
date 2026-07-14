import {
  getOrderReference,
  getOrderStatus,
  getOrderTotal,
  getOrderUserEmail,
  getOrderUserName,
} from '@/lib/order'
import type {
  OrderQrCode,
  OrderQrCodeStatus,
} from '@/types/order-qr-code'

export function normalizeOrderQrCodeStatus(
  status?: OrderQrCodeStatus | null,
): 'active' | 'used' | 'expired' | 'cancelled' {
  const normalized = String(status ?? 'active')
    .trim()
    .toLowerCase()
    .replaceAll('-', '_')
    .replaceAll(' ', '_')

  if (
    [
      'used',
      'scanned',
      'completed',
      'redeemed',
      'collected',
      'picked_up',
    ].includes(normalized)
  ) {
    return 'used'
  }

  if (
    [
      'expired',
      'expiry',
      'invalid',
    ].includes(normalized)
  ) {
    return 'expired'
  }

  if (
    [
      'cancelled',
      'canceled',
      'cancel',
      'revoked',
    ].includes(normalized)
  ) {
    return 'cancelled'
  }

  return 'active'
}

export function getOrderQrCodeStatus(
  qrCode: OrderQrCode,
) {
  if (
    normalizeOrderQrCodeStatus(qrCode.status) ===
      'active' &&
    qrCode.expires_at
  ) {
    const expiry = new Date(qrCode.expires_at)

    if (
      !Number.isNaN(expiry.getTime()) &&
      expiry.getTime() < Date.now()
    ) {
      return 'expired' as const
    }
  }

  return normalizeOrderQrCodeStatus(
    qrCode.status,
  )
}

export function orderQrCodeStatusLabel(
  qrCode: OrderQrCode,
): string {
  const status = getOrderQrCodeStatus(qrCode)

  if (status === 'used') {
    return 'Used'
  }

  if (status === 'expired') {
    return 'Expired'
  }

  if (status === 'cancelled') {
    return 'Cancelled'
  }

  return 'Active'
}

export function getOrderQrToken(
  qrCode: OrderQrCode,
): string {
  return (
    qrCode.qr_token ??
    qrCode.token ??
    qrCode.code ??
    ''
  )
}

export function getQrOrderReference(
  qrCode: OrderQrCode,
): string {
  return qrCode.order
    ? getOrderReference(qrCode.order)
    : qrCode.order_id
      ? `ORDER-${qrCode.order_id}`
      : 'Order not available'
}

export function getQrOrderUserName(
  qrCode: OrderQrCode,
): string {
  return qrCode.order
    ? getOrderUserName(qrCode.order)
    : 'Customer not available'
}

export function getQrOrderUserEmail(
  qrCode: OrderQrCode,
): string {
  return qrCode.order
    ? getOrderUserEmail(qrCode.order)
    : 'Email not available'
}

export function getQrOrderAmount(
  qrCode: OrderQrCode,
): number {
  return qrCode.order
    ? getOrderTotal(qrCode.order)
    : 0
}

export function getQrOrderStatus(
  qrCode: OrderQrCode,
): string {
  return qrCode.order
    ? getOrderStatus(qrCode.order)
    : 'unknown'
}

export function getOrderQrImageUrl(
  qrCode: OrderQrCode,
): string | null {
  const candidate =
    qrCode.qr_image_url ??
    qrCode.qr_code_url ??
    qrCode.image_url ??
    qrCode.qr_url ??
    qrCode.qr_image ??
    qrCode.qr_path

  if (!candidate?.trim()) {
    return null
  }

  const value = candidate.trim()

  if (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('data:') ||
    value.startsWith('blob:')
  ) {
    return value
  }

  const storageUrl = (
    process.env.NEXT_PUBLIC_STORAGE_URL ??
    'http://localhost:8000/storage'
  ).replace(/\/+$/, '')

  return `${storageUrl}/${value.replace(/^\/+/, '')}`
}

export function canMarkQrUsed(
  qrCode: OrderQrCode,
): boolean {
  return (
    !qrCode.deleted_at &&
    getOrderQrCodeStatus(qrCode) === 'active'
  )
}

export function canRegenerateQr(
  qrCode: OrderQrCode,
): boolean {
  const status = getOrderQrCodeStatus(qrCode)

  return (
    !qrCode.deleted_at &&
    status !== 'used' &&
    status !== 'cancelled'
  )
}

export function canCancelQr(
  qrCode: OrderQrCode,
): boolean {
  const status = getOrderQrCodeStatus(qrCode)

  return (
    !qrCode.deleted_at &&
    status !== 'used' &&
    status !== 'cancelled'
  )
}

export function formatOrderQrDate(
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

export function toDateTimeLocal(
  value?: string | null,
): string {
  if (!value) {
    return ''
  }

  return value
    .replace(' ', 'T')
    .slice(0, 16)
}

export function toApiDateTime(
  value: string,
): string {
  if (!value.trim()) {
    return ''
  }

  const normalized = value.replace('T', ' ')

  return normalized.length === 16
    ? `${normalized}:00`
    : normalized
}
