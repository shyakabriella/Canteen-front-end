import type {
  WalletTransaction,
  WalletTransactionType,
} from '@/types/wallet-transaction'

export function walletNumber(
  value: unknown,
): number {
  const numeric = Number(value ?? 0)

  return Number.isFinite(numeric) ? numeric : 0
}

export function normalizeTransactionType(
  type?: WalletTransactionType | null,
): 'credit' | 'debit' | 'adjustment' {
  const normalized = String(type ?? '')
    .trim()
    .toLowerCase()
    .replaceAll('-', '_')
    .replaceAll(' ', '_')

  if (
    [
      'credit',
      'top_up',
      'topup',
      'deposit',
      'refund',
      'addition',
      'increase',
      'wallet_credit',
      'cash_in',
    ].includes(normalized)
  ) {
    return 'credit'
  }

  if (
    [
      'debit',
      'payment',
      'purchase',
      'order_payment',
      'deduction',
      'reduction',
      'decrease',
      'wallet_debit',
      'cash_out',
    ].includes(normalized)
  ) {
    return 'debit'
  }

  return 'adjustment'
}

export function getTransactionType(
  transaction: WalletTransaction,
): 'credit' | 'debit' | 'adjustment' {
  return normalizeTransactionType(
    transaction.transaction_type ??
      transaction.type,
  )
}

export function transactionTypeLabel(
  transaction: WalletTransaction,
): string {
  const type = getTransactionType(transaction)

  if (type === 'credit') {
    return 'Credit'
  }

  if (type === 'debit') {
    return 'Debit'
  }

  return 'Adjustment'
}

export function getTransactionAmount(
  transaction: WalletTransaction,
): number {
  return walletNumber(transaction.amount)
}

export function getBalanceBefore(
  transaction: WalletTransaction,
): number | null {
  const value =
    transaction.balance_before ??
    transaction.previous_balance

  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return null
  }

  return walletNumber(value)
}

export function getBalanceAfter(
  transaction: WalletTransaction,
): number | null {
  const value =
    transaction.balance_after ??
    transaction.new_balance

  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return null
  }

  return walletNumber(value)
}

export function getTransactionUserName(
  transaction: WalletTransaction,
): string {
  return (
    transaction.user?.name ??
    `User #${transaction.user_id ?? 'Unknown'}`
  )
}

export function getTransactionUserEmail(
  transaction: WalletTransaction,
): string {
  return (
    transaction.user?.email ??
    'Email not available'
  )
}

export function getTransactionReference(
  transaction: WalletTransaction,
): string {
  return (
    transaction.transaction_reference ??
    transaction.reference ??
    (
      transaction.reference_type &&
      transaction.reference_id
        ? `${transaction.reference_type} #${transaction.reference_id}`
        : null
    ) ??
    'Not provided'
  )
}

export function getTransactionDescription(
  transaction: WalletTransaction,
): string {
  return (
    transaction.description ??
    transaction.reason ??
    transaction.notes ??
    'No description provided'
  )
}

export function getTransactionActor(
  transaction: WalletTransaction,
): string {
  return (
    transaction.createdBy?.name ??
    transaction.created_by_user?.name ??
    'System'
  )
}

export function formatWalletAmount(
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

export function formatSignedWalletAmount(
  transaction: WalletTransaction,
): string {
  const type = getTransactionType(transaction)
  const amount = formatWalletAmount(
    getTransactionAmount(transaction),
  )

  if (type === 'credit') {
    return `+${amount}`
  }

  if (type === 'debit') {
    return `-${amount}`
  }

  return amount
}

export function formatTransactionDate(
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
