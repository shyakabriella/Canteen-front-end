'use client'

import {
  ArrowDownLeft,
  ArrowUpRight,
  Eye,
  Pencil,
  RefreshCw,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import {
  formatSignedWalletAmount,
  formatTransactionDate,
  formatWalletAmount,
  getBalanceAfter,
  getTransactionDescription,
  getTransactionReference,
  getTransactionType,
  getTransactionUserEmail,
  getTransactionUserName,
  transactionTypeLabel,
} from '@/lib/wallet-transaction'
import type { WalletTransaction } from '@/types/wallet-transaction'

interface WalletTransactionTableProps {
  transactions: WalletTransaction[]
  processingId: number | string | null
  onView: (
    transaction: WalletTransaction,
  ) => void
  onEdit: (
    transaction: WalletTransaction,
  ) => void
  onDelete: (
    transaction: WalletTransaction,
  ) => void
  onRestore: (
    transaction: WalletTransaction,
  ) => void
}

export default function WalletTransactionTable({
  transactions,
  processingId,
  onView,
  onEdit,
  onDelete,
  onRestore,
}: WalletTransactionTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1150px] text-left">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.14em] text-slate-400">
          <tr>
            <th className="px-6 py-4 font-extrabold">
              User
            </th>

            <th className="px-4 py-4 font-extrabold">
              Type
            </th>

            <th className="px-4 py-4 font-extrabold">
              Amount
            </th>

            <th className="px-4 py-4 font-extrabold">
              Balance After
            </th>

            <th className="px-4 py-4 font-extrabold">
              Description
            </th>

            <th className="px-4 py-4 font-extrabold">
              Date
            </th>

            <th className="px-6 py-4 text-right font-extrabold">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {transactions.map((transaction) => {
            const type =
              getTransactionType(transaction)

            const deleted = Boolean(
              transaction.deleted_at,
            )

            const processing =
              String(processingId) ===
              String(transaction.id)

            const Icon =
              type === 'credit'
                ? ArrowDownLeft
                : type === 'debit'
                  ? ArrowUpRight
                  : RefreshCw

            return (
              <tr
                key={transaction.id}
                className={`text-sm transition hover:bg-slate-50 ${
                  deleted ? 'bg-red-50/30' : ''
                }`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-extrabold text-indigo-700">
                      {getTransactionUserName(
                        transaction,
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </span>

                    <div className="min-w-0">
                      <p className="max-w-[190px] truncate font-extrabold text-slate-900">
                        {getTransactionUserName(
                          transaction,
                        )}
                      </p>

                      <p className="mt-1 max-w-[210px] truncate text-xs text-slate-400">
                        {getTransactionUserEmail(
                          transaction,
                        )}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${
                      deleted
                        ? 'bg-red-50 text-red-700 ring-red-200'
                        : type === 'credit'
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                          : type === 'debit'
                            ? 'bg-red-50 text-red-700 ring-red-200'
                            : 'bg-indigo-50 text-indigo-700 ring-indigo-200'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />

                    {deleted
                      ? 'Deleted'
                      : transactionTypeLabel(
                          transaction,
                        )}
                  </span>
                </td>

                <td className="whitespace-nowrap px-4 py-4">
                  <p
                    className={`font-extrabold ${
                      type === 'credit'
                        ? 'text-emerald-700'
                        : type === 'debit'
                          ? 'text-red-700'
                          : 'text-indigo-700'
                    }`}
                  >
                    {formatSignedWalletAmount(
                      transaction,
                    )}
                  </p>
                </td>

                <td className="whitespace-nowrap px-4 py-4 font-bold text-slate-700">
                  {getBalanceAfter(transaction) === null
                    ? '—'
                    : formatWalletAmount(
                        getBalanceAfter(
                          transaction,
                        ) ?? 0,
                      )}
                </td>

                <td className="max-w-[260px] px-4 py-4">
                  <p className="line-clamp-2 text-sm leading-5 text-slate-500">
                    {getTransactionDescription(
                      transaction,
                    )}
                  </p>

                  <p className="mt-1 max-w-[220px] truncate text-xs text-slate-400">
                    {getTransactionReference(
                      transaction,
                    )}
                  </p>
                </td>

                <td className="whitespace-nowrap px-4 py-4">
                  <p className="text-sm font-semibold text-slate-600">
                    {formatTransactionDate(
                      transaction.created_at,
                      false,
                    )}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Transaction #{transaction.id}
                  </p>
                </td>

                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onView(transaction)
                      }
                      title="View transaction"
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {!deleted && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            onEdit(transaction)
                          }
                          title="Update description"
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onDelete(transaction)
                          }
                          disabled={processing}
                          title="Delete transaction"
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}

                    {deleted && (
                      <button
                        type="button"
                        onClick={() =>
                          onRestore(transaction)
                        }
                        disabled={processing}
                        className="flex h-9 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Restore
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
