'use client'

import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  LoaderCircle,
  Search,
  UserRound,
  WalletCards,
  X,
} from 'lucide-react'
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'
import {
  getTransactionDescription,
} from '@/lib/wallet-transaction'
import type { AppUser } from '@/types/app-user'
import type {
  WalletTransaction,
  WalletTransactionPayload,
  WalletTransactionUpdatePayload,
} from '@/types/wallet-transaction'

interface WalletTransactionFormModalProps {
  isOpen: boolean
  transaction?: WalletTransaction | null
  users: AppUser[]
  isLoadingUsers: boolean
  usersError: string
  isSubmitting: boolean
  onRefreshUsers: () => Promise<void>
  onClose: () => void
  onCreate: (
    payload: WalletTransactionPayload,
  ) => Promise<void>
  onUpdate: (
    payload: WalletTransactionUpdatePayload,
  ) => Promise<void>
}

function getUserRole(user: AppUser): string {
  if (typeof user.role === 'string') {
    return user.role
      .replaceAll('_', ' ')
      .replaceAll('-', ' ')
  }

  return (
    user.role?.name ??
    user.role?.slug ??
    user.role_name ??
    'user'
  )
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
}

function getUserWalletBalance(
  user: AppUser,
): number {
  const value =
    user.wallet_balance ??
    user.balance ??
    0

  const numeric = Number(value)

  return Number.isFinite(numeric)
    ? numeric
    : 0
}

function formatWalletBalance(
  value: number,
): string {
  return `${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(value)} RWF`
}

function isUserActive(user: AppUser): boolean {
  if (user.deleted_at) {
    return false
  }

  if (
    user.is_active !== undefined &&
    user.is_active !== null
  ) {
    const activeValue = String(user.is_active)
      .trim()
      .toLowerCase()

    return ![
      '0',
      'false',
      'no',
      'inactive',
      'disabled',
      'blocked',
      'suspended',
    ].includes(activeValue)
  }

  return ![
    'inactive',
    'disabled',
    'blocked',
    'suspended',
  ].includes(
    String(user.status ?? '')
      .trim()
      .toLowerCase(),
  )
}


function generateWalletReference(): string {
  const timestamp = new Date()
    .toISOString()
    .replace(/\D/g, '')
    .slice(0, 14)

  const randomCode = Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()

  return `WTX-${timestamp}-${randomCode}`
}

export default function WalletTransactionFormModal({
  isOpen,
  transaction,
  users,
  isLoadingUsers,
  usersError,
  isSubmitting,
  onRefreshUsers,
  onClose,
  onCreate,
  onUpdate,
}: WalletTransactionFormModalProps) {
  const [userId, setUserId] = useState('')
  const [userSearch, setUserSearch] =
    useState('')

  const [transactionType, setTransactionType] =
    useState<'credit' | 'debit'>('credit')

  const [amount, setAmount] = useState('')
  const [description, setDescription] =
    useState('')
  const [notes, setNotes] = useState('')
  const [reference, setReference] = useState('')
  const [formError, setFormError] = useState('')

  const editing = Boolean(transaction)

  const selectableUsers = useMemo(() => {
    const query = userSearch
      .trim()
      .toLowerCase()

    return users
      .filter(isUserActive)
      .filter((user) => {
        if (!query) {
          return true
        }

        const role = getUserRole(user)

        return [
          user.name,
          user.email,
          user.phone,
          role,
          String(user.id),
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(query),
          )
      })
      .sort((firstUser, secondUser) =>
        firstUser.name.localeCompare(
          secondUser.name,
        ),
      )
  }, [users, userSearch])

  const selectedUser = useMemo(
    () =>
      users.find(
        (user) =>
          String(user.id) === String(userId),
      ) ?? null,
    [users, userId],
  )

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setUserId(
      transaction?.user_id === undefined ||
        transaction?.user_id === null
        ? ''
        : String(transaction.user_id),
    )

    setUserSearch('')
    setTransactionType('credit')

    setAmount(
      transaction?.amount === undefined
        ? ''
        : String(transaction.amount),
    )

    setDescription(
      transaction
        ? getTransactionDescription(transaction)
        : '',
    )

    setNotes(transaction?.notes ?? '')

    setReference(
      transaction
        ? (
            transaction.transaction_reference ??
            transaction.reference ??
            ''
          )
        : generateWalletReference(),
    )

    setFormError('')
  }, [isOpen, transaction])

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setFormError('')

    if (!description.trim()) {
      setFormError(
        'Transaction description is required.',
      )
      return
    }

    if (editing) {
      try {
        await onUpdate({
          description: description.trim(),
          notes: notes.trim(),
        })
      } catch (error) {
        setFormError(
          error instanceof Error
            ? error.message
            : 'Unable to update the transaction.',
        )
      }

      return
    }

    if (!userId) {
      setFormError(
        'Please select a user account.',
      )
      return
    }

    if (!selectedUser) {
      setFormError(
        'The selected user could not be found.',
      )
      return
    }

    const numericAmount = Number(amount)

    if (
      !amount ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      setFormError(
        'Transaction amount must be greater than zero.',
      )
      return
    }

    if (
      transactionType === 'debit' &&
      numericAmount >
        getUserWalletBalance(selectedUser)
    ) {
      setFormError(
        `The debit amount cannot exceed the user's wallet balance of ${formatWalletBalance(
          getUserWalletBalance(selectedUser),
        )}.`,
      )
      return
    }

    try {
      await onCreate({
        user_id: String(selectedUser.id),
        transaction_type: transactionType,
        amount,
        description: description.trim(),
        notes: notes.trim(),
        reference: reference.trim(),
      })
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Unable to create the transaction.',
      )
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4">
      <button
        type="button"
        aria-label="Close wallet transaction form"
        onClick={onClose}
        disabled={isSubmitting}
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="relative z-10 my-auto w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <WalletCards className="h-5 w-5" />
            </span>

            <div>
              <h2 className="font-extrabold text-slate-950">
                {editing
                  ? 'Update Transaction'
                  : 'Manual Wallet Adjustment'}
              </h2>

              <p className="text-xs text-slate-500">
                {editing
                  ? 'Update the description and notes.'
                  : 'Select a user and credit or debit their wallet.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="max-h-[calc(100vh-130px)] space-y-5 overflow-y-auto p-6"
        >
          {formError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          {!editing && (
            <>
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="wallet-user-search"
                    className="block text-sm font-bold text-slate-700"
                  >
                    Search user
                  </label>

                  <button
                    type="button"
                    onClick={() =>
                      void onRefreshUsers()
                    }
                    disabled={
                      isLoadingUsers ||
                      isSubmitting
                    }
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                  >
                    Refresh users
                  </button>
                </div>

                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    id="wallet-user-search"
                    type="search"
                    value={userSearch}
                    onChange={(event) =>
                      setUserSearch(
                        event.target.value,
                      )
                    }
                    disabled={
                      isSubmitting ||
                      isLoadingUsers
                    }
                    placeholder="Search by name, email, phone or role..."
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="wallet-user-select"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Select user
                </label>

                {isLoadingUsers ? (
                  <div className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-500">
                    <LoaderCircle className="h-4 w-4 animate-spin text-indigo-600" />
                    Loading users...
                  </div>
                ) : usersError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="text-sm text-red-700">
                      {usersError}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        void onRefreshUsers()
                      }
                      className="mt-2 text-xs font-bold text-red-700 underline"
                    >
                      Try loading users again
                    </button>
                  </div>
                ) : (
                  <select
                    id="wallet-user-select"
                    value={userId}
                    onChange={(event) =>
                      setUserId(
                        event.target.value,
                      )
                    }
                    required
                    disabled={isSubmitting}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  >
                    <option value="">
                      Select user account
                    </option>

                    {selectableUsers.map(
                      (user) => (
                        <option
                          key={user.id}
                          value={String(user.id)}
                        >
                          {user.name}
                          {user.email
                            ? ` — ${user.email}`
                            : ''}
                          {' — '}
                          {formatWalletBalance(
                            getUserWalletBalance(
                              user,
                            ),
                          )}
                        </option>
                      ),
                    )}
                  </select>
                )}

                {!isLoadingUsers &&
                  !usersError &&
                  selectableUsers.length === 0 && (
                    <p className="mt-2 text-xs font-semibold text-amber-600">
                      No active users match your search.
                    </p>
                  )}
              </div>

              {selectedUser && (
                <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white font-extrabold text-indigo-700 shadow-sm">
                      {selectedUser.name
                        .charAt(0)
                        .toUpperCase()}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                        <div>
                          <p className="font-extrabold text-slate-950">
                            {selectedUser.name}
                          </p>

                          <p className="mt-1 break-all text-xs text-slate-500">
                            {selectedUser.email ||
                              'Email not available'}
                          </p>

                          {selectedUser.phone && (
                            <p className="mt-1 text-xs text-slate-500">
                              {selectedUser.phone}
                            </p>
                          )}
                        </div>

                        <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-bold capitalize text-indigo-700 shadow-sm">
                          {getUserRole(selectedUser)}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center justify-between rounded-xl bg-white p-3">
                        <span className="flex items-center gap-2 text-xs font-bold text-slate-500">
                          <WalletCards className="h-4 w-4 text-indigo-600" />
                          Current wallet balance
                        </span>

                        <span className="text-sm font-extrabold text-indigo-700">
                          {formatWalletBalance(
                            getUserWalletBalance(
                              selectedUser,
                            ),
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <p className="mb-2 text-sm font-bold text-slate-700">
                  Adjustment type
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() =>
                      setTransactionType('credit')
                    }
                    disabled={isSubmitting}
                    className={`rounded-2xl border p-4 text-left transition ${
                      transactionType === 'credit'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <ArrowDownLeft className="h-6 w-6" />

                    <p className="mt-3 font-extrabold">
                      Credit Wallet
                    </p>

                    <p className="mt-1 text-xs opacity-70">
                      Add money to the selected user’s wallet.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setTransactionType('debit')
                    }
                    disabled={isSubmitting}
                    className={`rounded-2xl border p-4 text-left transition ${
                      transactionType === 'debit'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <ArrowUpRight className="h-6 w-6" />

                    <p className="mt-3 font-extrabold">
                      Debit Wallet
                    </p>

                    <p className="mt-1 text-xs opacity-70">
                      Remove money from the selected user’s wallet.
                    </p>
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="wallet-transaction-amount"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Amount
                </label>

                <div className="relative">
                  <input
                    id="wallet-transaction-amount"
                    type="number"
                    min="1"
                    step="1"
                    value={amount}
                    onChange={(event) =>
                      setAmount(event.target.value)
                    }
                    required
                    disabled={isSubmitting}
                    placeholder="Example: 5000"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pr-20 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  />

                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    RWF
                  </span>
                </div>
              </div>
            </>
          )}

          {editing && transaction?.user && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-indigo-600 shadow-sm">
                  <UserRound className="h-5 w-5" />
                </span>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Transaction user
                  </p>

                  <p className="mt-1 font-extrabold text-slate-900">
                    {transaction.user.name ??
                      `User #${transaction.user_id}`}
                  </p>

                  <p className="text-xs text-slate-500">
                    {transaction.user.email ??
                      'Email not available'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="wallet-description"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Description
            </label>

            <input
              id="wallet-description"
              type="text"
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value,
                )
              }
              required
              disabled={isSubmitting}
              placeholder="Example: Manual wallet correction"
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          {!editing && (
            <div>
              <label
                htmlFor="wallet-reference"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                Reference (auto-generated)
              </label>

              <input
                id="wallet-reference"
                type="text"
                value={reference}
                onChange={(event) =>
                  setReference(
                    event.target.value,
                  )
                }
                disabled={isSubmitting}
                placeholder="Example: MANUAL-ADJ-001"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="wallet-notes"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Notes
            </label>

            <textarea
              id="wallet-notes"
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              rows={4}
              disabled={isSubmitting}
              placeholder="Additional administrative information..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          {!editing && (
            <div
              className={`rounded-2xl border p-4 text-sm ${
                transactionType === 'credit'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {transactionType === 'credit'
                ? 'The selected user’s wallet balance will increase.'
                : 'The selected user’s wallet balance will decrease.'}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                isSubmitting ||
                (!editing &&
                  (
                    isLoadingUsers ||
                    Boolean(usersError) ||
                    !userId
                  ))
              }
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />

                  {editing
                    ? 'Update Transaction'
                    : 'Complete Adjustment'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
