import type {
  WalletTopUp,
  WalletTopUpStatus,
} from '@/types/wallet-top-up'

export function numberValue(value: unknown): number {
  const numeric = Number(value ?? 0)

  return Number.isFinite(numeric) ? numeric : 0
}

export function normalizeTopUpStatus(
  status?: WalletTopUpStatus | null,
): 'pending' | 'approved' | 'rejected' | 'cancelled' {
  const value = String(status ?? 'pending')
    .trim()
    .toLowerCase()
    .replaceAll('-', '_')
    .replaceAll(' ', '_')

  if (
    [
      'approved',
      'approve',
      'completed',
      'successful',
      'success',
      'paid',
    ].includes(value)
  ) {
    return 'approved'
  }

  if (
    [
      'rejected',
      'reject',
      'declined',
      'failed',
    ].includes(value)
  ) {
    return 'rejected'
  }

  if (
    [
      'cancelled',
      'canceled',
      'cancel',
    ].includes(value)
  ) {
    return 'cancelled'
  }

  return 'pending'
}

export function getTopUpStatus(
  topUp: WalletTopUp,
): 'pending' | 'approved' | 'rejected' | 'cancelled' {
  return normalizeTopUpStatus(topUp.status)
}

export function topUpStatusLabel(
  topUp: WalletTopUp,
): string {
  const status = getTopUpStatus(topUp)

  if (status === 'approved') {
    return 'Approved'
  }

  if (status === 'rejected') {
    return 'Rejected'
  }

  if (status === 'cancelled') {
    return 'Cancelled'
  }

  return 'Pending'
}

export function getTopUpUserName(
  topUp: WalletTopUp,
): string {
  return (
    topUp.user?.name ??
    topUp.createdBy?.name ??
    `User #${topUp.user_id ?? 'Unknown'}`
  )
}

export function getTopUpUserEmail(
  topUp: WalletTopUp,
): string {
  return (
    topUp.user?.email ??
    topUp.createdBy?.email ??
    'Email not available'
  )
}

export function getTopUpReference(
  topUp: WalletTopUp,
): string {
  return (
    topUp.transaction_reference ??
    topUp.payment_reference ??
    topUp.reference_number ??
    topUp.reference ??
    'Not provided'
  )
}

export function getTopUpReason(
  topUp: WalletTopUp,
): string {
  return (
    topUp.rejection_reason ??
    topUp.cancellation_reason ??
    topUp.reason ??
    topUp.approval_notes ??
    topUp.notes ??
    'No reason provided'
  )
}

export function formatTopUpAmount(
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

export function formatTopUpDate(
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

export function canUpdateTopUp(
  topUp: WalletTopUp,
): boolean {
  return (
    !topUp.deleted_at &&
    getTopUpStatus(topUp) === 'pending'
  )
}

export function canCancelTopUp(
  topUp: WalletTopUp,
): boolean {
  return canUpdateTopUp(topUp)
}

export function canApproveTopUp(
  topUp: WalletTopUp,
): boolean {
  return canUpdateTopUp(topUp)
}
