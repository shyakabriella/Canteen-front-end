import type { OrderQrCode } from '@/types/order-qr-code'
import type {
  QrScanLog,
  QrScanResult,
} from '@/types/qr-scan-log'

function booleanValue(
  value: unknown,
): boolean | null {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return null
  }

  if (
    value === true ||
    value === 1 ||
    value === '1' ||
    String(value).toLowerCase() === 'true'
  ) {
    return true
  }

  if (
    value === false ||
    value === 0 ||
    value === '0' ||
    String(value).toLowerCase() === 'false'
  ) {
    return false
  }

  return null
}

export function normalizeQrScanResult(
  result?: QrScanResult | null,
): 'success' | 'failed' | 'invalid' | 'expired' | 'used' | 'cancelled' {
  const value = String(result ?? '')
    .trim()
    .toLowerCase()
    .replaceAll('-', '_')
    .replaceAll(' ', '_')

  if (
    [
      'success',
      'successful',
      'valid',
      'verified',
      'approved',
      'accepted',
    ].includes(value)
  ) {
    return 'success'
  }

  if (
    [
      'expired',
      'expiry',
      'token_expired',
      'qr_expired',
    ].includes(value)
  ) {
    return 'expired'
  }

  if (
    [
      'used',
      'already_used',
      'redeemed',
      'collected',
      'picked_up',
    ].includes(value)
  ) {
    return 'used'
  }

  if (
    [
      'cancelled',
      'canceled',
      'revoked',
    ].includes(value)
  ) {
    return 'cancelled'
  }

  if (
    [
      'invalid',
      'not_found',
      'unknown',
      'invalid_token',
      'invalid_qr',
    ].includes(value)
  ) {
    return 'invalid'
  }

  return 'failed'
}

export function getQrScanResult(
  log: QrScanLog,
): 'success' | 'failed' | 'invalid' | 'expired' | 'used' | 'cancelled' {
  const explicitResult =
    log.scan_result ??
    log.result ??
    log.status

  if (explicitResult) {
    return normalizeQrScanResult(explicitResult)
  }

  const valid =
    booleanValue(log.is_valid) ??
    booleanValue(log.valid) ??
    booleanValue(log.success)

  if (valid === true) {
    return 'success'
  }

  if (valid === false) {
    return 'failed'
  }

  return 'failed'
}

export function qrScanResultLabel(
  log: QrScanLog,
): string {
  const result = getQrScanResult(log)

  if (result === 'success') {
    return 'Successful'
  }

  if (result === 'invalid') {
    return 'Invalid'
  }

  if (result === 'expired') {
    return 'Expired'
  }

  if (result === 'used') {
    return 'Already Used'
  }

  if (result === 'cancelled') {
    return 'Cancelled'
  }

  return 'Failed'
}

export function getScanQrCode(
  log: QrScanLog,
): OrderQrCode | null {
  return (
    log.order_qr_code ??
    log.orderQrCode ??
    log.qr_code ??
    log.qrCode ??
    null
  )
}

export function getScanToken(
  log: QrScanLog,
): string {
  const qrCode = getScanQrCode(log)

  return (
    log.qr_token ??
    log.scanned_token ??
    log.token ??
    qrCode?.qr_token ??
    qrCode?.token ??
    qrCode?.code ??
    ''
  )
}

export function getScanOrderReference(
  log: QrScanLog,
): string {
  const qrCode = getScanQrCode(log)
  const order = log.order ?? qrCode?.order

  return (
    order?.order_number ??
    order?.reference ??
    order?.code ??
    (
      log.order_id
        ? `ORDER-${log.order_id}`
        : qrCode?.order_id
          ? `ORDER-${qrCode.order_id}`
          : 'Order not available'
    )
  )
}

export function getScanCustomerName(
  log: QrScanLog,
): string {
  const qrCode = getScanQrCode(log)
  const order = log.order ?? qrCode?.order

  return (
    order?.user?.name ??
    'Customer not available'
  )
}

export function getScanCustomerEmail(
  log: QrScanLog,
): string {
  const qrCode = getScanQrCode(log)
  const order = log.order ?? qrCode?.order

  return (
    order?.user?.email ??
    'Email not available'
  )
}

export function getScannerName(
  log: QrScanLog,
): string {
  return (
    log.scanner?.name ??
    log.scannedBy?.name ??
    log.scanned_by_user?.name ??
    log.user?.name ??
    (
      log.scanned_by
        ? `User #${log.scanned_by}`
        : 'System / Unknown'
    )
  )
}

export function getScannerEmail(
  log: QrScanLog,
): string {
  return (
    log.scanner?.email ??
    log.scannedBy?.email ??
    log.scanned_by_user?.email ??
    log.user?.email ??
    'Email not available'
  )
}

export function getScanMessage(
  log: QrScanLog,
): string {
  return (
    log.message ??
    log.failure_reason ??
    log.error_message ??
    log.reason ??
    log.notes ??
    'No additional information.'
  )
}

export function getScanDevice(
  log: QrScanLog,
): string {
  const values = [
    log.device_name,
    log.device_type,
  ].filter(Boolean)

  return values.length
    ? values.join(' — ')
    : 'Device not available'
}

export function getScanCoordinates(
  log: QrScanLog,
): string {
  if (
    log.latitude === undefined ||
    log.latitude === null ||
    log.longitude === undefined ||
    log.longitude === null
  ) {
    return 'Coordinates not available'
  }

  return `${log.latitude}, ${log.longitude}`
}

export function formatQrScanDate(
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

export function getQrScanDate(
  log: QrScanLog,
): string | null {
  return log.scanned_at ?? log.created_at ?? null
}
