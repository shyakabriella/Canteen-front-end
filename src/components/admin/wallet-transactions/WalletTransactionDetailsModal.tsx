'use client'

import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  FileText,
  Hash,
  LoaderCircle,
  RefreshCw,
  UserRound,
  WalletCards,
  X,
} from 'lucide-react'
import {
  formatTransactionDate,
  formatWalletAmount,
  getBalanceAfter,
  getBalanceBefore,
  getTransactionActor,
  getTransactionAmount,
  getTransactionDescription,
  getTransactionReference,
  getTransactionType,
  getTransactionUserEmail,
  getTransactionUserName,
  transactionTypeLabel,
} from '@/lib/wallet-transaction'
import type { WalletTransaction } from '@/types/wallet-transaction'

interface WalletTransactionDetailsModalProps {
  isOpen: boolean
  transaction: WalletTransaction | null
  isLoading: boolean
  errorMessage: string
  onClose: () => void
}

export default function WalletTransactionDetailsModal({
  isOpen,
  transaction,
  isLoading,
  errorMessage,
  onClose,
}: WalletTransactionDetailsModalProps) {
  if (!isOpen) {
    return null
  }

  const type = transaction
    ? getTransactionType(transaction)
    : 'adjustment'

  const TypeIcon =
    type === 'credit'
      ? ArrowDownLeft
      : type === 'debit'
        ? ArrowUpRight
        : RefreshCw

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4">
      <button
        type="button"
        aria-label="Close transaction details"
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="relative z-10 my-auto w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="font-extrabold text-slate-950">
              Wallet Transaction Details
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Complete wallet transaction information.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(100vh-130px)] overflow-y-auto p-6">
          {isLoading && (
            <div className="flex min-h-72 items-center justify-center">
              <div className="text-center">
                <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-indigo-600" />

                <p className="mt-3 text-sm font-semibold text-slate-500">
                  Loading transaction...
                </p>
              </div>
            </div>
          )}

          {!isLoading && errorMessage && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {!isLoading && transaction && (
            <div className="space-y-5">
              <div
                className={`rounded-3xl p-6 text-white ${
                  type === 'credit'
                    ? 'bg-gradient-to-br from-emerald-600 to-teal-700'
                    : type === 'debit'
                      ? 'bg-gradient-to-br from-red-600 to-rose-700'
                      : 'bg-gradient-to-br from-indigo-600 to-blue-700'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                      {transactionTypeLabel(
                        transaction,
                      )}
                    </p>

                    <h3 className="mt-2 text-3xl font-extrabold">
                      {type === 'credit'
                        ? '+'
                        : type === 'debit'
                          ? '-'
                          : ''}
                      {formatWalletAmount(
                        getTransactionAmount(
                          transaction,
                        ),
                      )}
                    </h3>

                    <p className="mt-3 text-sm text-white/80">
                      {getTransactionUserName(
                        transaction,
                      )}
                    </p>
                  </div>

                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                    <TypeIcon className="h-6 w-6" />
                  </span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  icon={UserRound}
                  label="User"
                  value={getTransactionUserName(
                    transaction,
                  )}
                />

                <DetailItem
                  icon={UserRound}
                  label="Email"
                  value={getTransactionUserEmail(
                    transaction,
                  )}
                />

                <DetailItem
                  icon={WalletCards}
                  label="Balance Before"
                  value={
                    getBalanceBefore(transaction) === null
                      ? 'Not available'
                      : formatWalletAmount(
                          getBalanceBefore(
                            transaction,
                          ) ?? 0,
                        )
                  }
                />

                <DetailItem
                  icon={WalletCards}
                  label="Balance After"
                  value={
                    getBalanceAfter(transaction) === null
                      ? 'Not available'
                      : formatWalletAmount(
                          getBalanceAfter(
                            transaction,
                          ) ?? 0,
                        )
                  }
                />

                <DetailItem
                  icon={Hash}
                  label="Transaction ID"
                  value={String(transaction.id)}
                />

                <DetailItem
                  icon={FileText}
                  label="Reference"
                  value={getTransactionReference(
                    transaction,
                  )}
                />

                <DetailItem
                  icon={CalendarDays}
                  label="Created At"
                  value={formatTransactionDate(
                    transaction.created_at,
                  )}
                />

                <DetailItem
                  icon={UserRound}
                  label="Processed By"
                  value={getTransactionActor(
                    transaction,
                  )}
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Description
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {getTransactionDescription(
                    transaction,
                  )}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Notes
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {transaction.notes ||
                    'No notes were provided.'}
                </p>
              </div>

              {transaction.deleted_at && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                  Deleted on{' '}
                  {formatTransactionDate(
                    transaction.deleted_at,
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface DetailItemProps {
  icon: typeof UserRound
  label: string
  value: string
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: DetailItemProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
          <Icon className="h-5 w-5" />
        </span>

        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {label}
          </p>

          <p className="mt-1 break-words text-sm font-extrabold text-slate-800">
            {value}
          </p>
        </div>
      </div>
    </div>
  )
}
