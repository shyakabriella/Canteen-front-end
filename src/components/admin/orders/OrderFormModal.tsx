'use client'

import {
  CheckCircle2,
  LoaderCircle,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
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
  formatFoodPrice,
  getFoodItemImageUrl,
  isFoodItemAvailable,
} from '@/lib/food-item'
import {
  getOrderNotes,
} from '@/lib/order'
import type { AppUser } from '@/types/app-user'
import type { FoodItem } from '@/types/food-item'
import type {
  Order,
  OrderPayload,
  OrderUpdatePayload,
} from '@/types/order'

interface OrderFormModalProps {
  isOpen: boolean
  order?: Order | null
  users: AppUser[]
  foodItems: FoodItem[]
  isLoadingDependencies: boolean
  dependencyError: string
  isSubmitting: boolean
  onRefreshDependencies: () => Promise<void>
  onClose: () => void
  onCreate: (
    payload: OrderPayload,
  ) => Promise<void>
  onUpdate: (
    payload: OrderUpdatePayload,
  ) => Promise<void>
}

function userBalance(
  user: AppUser,
): number | null {
  const value =
    user.wallet_balance ??
    user.balance

  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return null
  }

  const numeric = Number(value)

  return Number.isFinite(numeric)
    ? numeric
    : null
}

function userIsActive(
  user: AppUser,
): boolean {
  if (user.deleted_at) {
    return false
  }

  return ![
    'inactive',
    'blocked',
    'disabled',
    'suspended',
  ].includes(
    String(user.status ?? '')
      .toLowerCase()
      .trim(),
  )
}

export default function OrderFormModal({
  isOpen,
  order,
  users,
  foodItems,
  isLoadingDependencies,
  dependencyError,
  isSubmitting,
  onRefreshDependencies,
  onClose,
  onCreate,
  onUpdate,
}: OrderFormModalProps) {
  const [userId, setUserId] = useState('')
  const [userSearch, setUserSearch] =
    useState('')
  const [foodSearch, setFoodSearch] =
    useState('')

  const [quantities, setQuantities] =
    useState<Record<string, number>>({})

  const [notes, setNotes] = useState('')
  const [pickupNotes, setPickupNotes] =
    useState('')
  const [formError, setFormError] =
    useState('')

  const editing = Boolean(order)

  const selectedUser = useMemo(
    () =>
      users.find(
        (user) =>
          String(user.id) === String(userId),
      ) ?? null,
    [users, userId],
  )

  const filteredUsers = useMemo(() => {
    const query = userSearch
      .trim()
      .toLowerCase()

    return users
      .filter(userIsActive)
      .filter((user) => {
        if (!query) {
          return true
        }

        return [
          user.name,
          user.email,
          user.phone,
          user.user_code,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(query),
          )
      })
      .sort((first, second) =>
        first.name.localeCompare(second.name),
      )
  }, [users, userSearch])

  const filteredFoodItems = useMemo(() => {
    const query = foodSearch
      .trim()
      .toLowerCase()

    return foodItems
      .filter(
        (foodItem) =>
          !foodItem.deleted_at &&
          isFoodItemAvailable(foodItem),
      )
      .filter((foodItem) => {
        if (!query) {
          return true
        }

        return [
          foodItem.name,
          foodItem.description,
          foodItem.sku,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(query),
          )
      })
  }, [foodItems, foodSearch])

  const cartItems = useMemo(
    () =>
      Object.entries(quantities)
        .filter(([, quantity]) => quantity > 0)
        .map(([foodItemId, quantity]) => {
          const foodItem = foodItems.find(
            (item) =>
              String(item.id) === foodItemId,
          )

          return {
            foodItem,
            foodItemId,
            quantity,
          }
        })
        .filter(
          (item) => Boolean(item.foodItem),
        ),
    [quantities, foodItems],
  )

  const totalAmount = useMemo(
    () =>
      cartItems.reduce(
        (total, item) =>
          total +
          Number(item.foodItem?.price ?? 0) *
            item.quantity,
        0,
      ),
    [cartItems],
  )

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setUserId('')
    setUserSearch('')
    setFoodSearch('')
    setQuantities({})

    setNotes(
      order ? getOrderNotes(order) : '',
    )

    setPickupNotes(
      order?.pickup_notes ?? '',
    )

    setFormError('')
  }, [isOpen, order])

  function changeQuantity(
    foodItemId: number | string,
    change: number,
  ) {
    const key = String(foodItemId)

    setQuantities((current) => {
      const nextQuantity = Math.max(
        (current[key] ?? 0) + change,
        0,
      )

      const next = {
        ...current,
        [key]: nextQuantity,
      }

      if (nextQuantity === 0) {
        delete next[key]
      }

      return next
    })
  }

  function removeItem(
    foodItemId: number | string,
  ) {
    const key = String(foodItemId)

    setQuantities((current) => {
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setFormError('')

    if (editing) {
      try {
        await onUpdate({
          notes: notes.trim(),
          pickup_notes: pickupNotes.trim(),
        })
      } catch (error) {
        setFormError(
          error instanceof Error
            ? error.message
            : 'Unable to update the order.',
        )
      }

      return
    }

    if (!selectedUser) {
      setFormError(
        'Please select the user placing the order.',
      )
      return
    }

    if (cartItems.length === 0) {
      setFormError(
        'Please add at least one food item.',
      )
      return
    }

    const balance = userBalance(selectedUser)

    if (
      balance !== null &&
      totalAmount > balance
    ) {
      setFormError(
        `The selected user has insufficient wallet balance. Available: ${formatFoodPrice(
          balance,
        )}.`,
      )
      return
    }

    try {
      await onCreate({
        user_id: String(selectedUser.id),

        items: cartItems.map((item) => ({
          food_item_id: item.foodItemId,
          quantity: item.quantity,
        })),

        notes: notes.trim(),
        pickup_notes: pickupNotes.trim(),
      })
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Unable to create the order.',
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
        aria-label="Close order form"
        onClick={onClose}
        disabled={isSubmitting}
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="relative z-10 my-auto w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <ShoppingCart className="h-5 w-5" />
            </span>

            <div>
              <h2 className="font-extrabold text-slate-950">
                {editing
                  ? 'Update Order Information'
                  : 'Create New Order'}
              </h2>

              <p className="text-xs text-slate-500">
                {editing
                  ? 'Update administrative and pickup notes.'
                  : 'Select a user and add food items.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="max-h-[calc(100vh-120px)] overflow-y-auto p-6"
        >
          {formError && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          {dependencyError && !editing && (
            <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              <p>{dependencyError}</p>

              <button
                type="button"
                onClick={() =>
                  void onRefreshDependencies()
                }
                className="mt-2 font-bold underline"
              >
                Reload users and food items
              </button>
            </div>
          )}

          {isLoadingDependencies && !editing ? (
            <div className="flex min-h-80 items-center justify-center">
              <div className="text-center">
                <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-indigo-600" />

                <p className="mt-3 text-sm text-slate-500">
                  Loading users and food items...
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {!editing && (
                <>
                  <section>
                    <h3 className="mb-3 text-sm font-extrabold text-slate-800">
                      1. Select user
                    </h3>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                        <input
                          type="search"
                          value={userSearch}
                          onChange={(event) =>
                            setUserSearch(
                              event.target.value,
                            )
                          }
                          placeholder="Search user..."
                          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                        />
                      </div>

                      <select
                        value={userId}
                        onChange={(event) =>
                          setUserId(
                            event.target.value,
                          )
                        }
                        required
                        className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                      >
                        <option value="">
                          Select user account
                        </option>

                        {filteredUsers.map(
                          (user) => (
                            <option
                              key={user.id}
                              value={String(user.id)}
                            >
                              {user.name}
                              {user.email
                                ? ` — ${user.email}`
                                : ''}
                            </option>
                          ),
                        )}
                      </select>
                    </div>

                    {selectedUser && (
                      <div className="mt-3 flex flex-col justify-between gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-3">
                          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-indigo-600 shadow-sm">
                            <UserRound className="h-5 w-5" />
                          </span>

                          <div>
                            <p className="font-extrabold text-slate-900">
                              {selectedUser.name}
                            </p>

                            <p className="text-xs text-slate-500">
                              {selectedUser.email ||
                                'Email not available'}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-xl bg-white px-4 py-3">
                          <p className="flex items-center gap-2 text-xs font-bold text-slate-400">
                            <WalletCards className="h-4 w-4 text-indigo-600" />
                            Wallet balance
                          </p>

                          <p className="mt-1 font-extrabold text-indigo-700">
                            {userBalance(selectedUser) ===
                            null
                              ? 'Not available'
                              : formatFoodPrice(
                                  userBalance(
                                    selectedUser,
                                  ) ?? 0,
                                )}
                          </p>
                        </div>
                      </div>
                    )}
                  </section>

                  <section>
                    <div className="mb-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <h3 className="text-sm font-extrabold text-slate-800">
                        2. Select food items
                      </h3>

                      <div className="relative w-full sm:max-w-sm">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                        <input
                          type="search"
                          value={foodSearch}
                          onChange={(event) =>
                            setFoodSearch(
                              event.target.value,
                            )
                          }
                          placeholder="Search food..."
                          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                        />
                      </div>
                    </div>

                    <div className="grid max-h-96 gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredFoodItems.map(
                        (foodItem) => {
                          const imageUrl =
                            getFoodItemImageUrl(
                              foodItem,
                            )

                          const quantity =
                            quantities[
                              String(foodItem.id)
                            ] ?? 0

                          return (
                            <article
                              key={foodItem.id}
                              className={`rounded-2xl border p-3 transition ${
                                quantity > 0
                                  ? 'border-indigo-300 bg-indigo-50'
                                  : 'border-slate-200 bg-white'
                              }`}
                            >
                              <div className="flex gap-3">
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-lg font-extrabold text-indigo-600">
                                  {imageUrl ? (
                                    <img
                                      src={imageUrl}
                                      alt={foodItem.name}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    foodItem.name
                                      .charAt(0)
                                      .toUpperCase()
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-extrabold text-slate-900">
                                    {foodItem.name}
                                  </p>

                                  <p className="mt-1 text-sm font-bold text-indigo-600">
                                    {formatFoodPrice(
                                      foodItem.price,
                                    )}
                                  </p>

                                  <div className="mt-3 flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        changeQuantity(
                                          foodItem.id,
                                          -1,
                                        )
                                      }
                                      disabled={
                                        quantity === 0
                                      }
                                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white disabled:opacity-40"
                                    >
                                      <Minus className="h-3.5 w-3.5" />
                                    </button>

                                    <span className="min-w-6 text-center text-sm font-extrabold">
                                      {quantity}
                                    </span>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        changeQuantity(
                                          foodItem.id,
                                          1,
                                        )
                                      }
                                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white"
                                    >
                                      <Plus className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </article>
                          )
                        },
                      )}
                    </div>
                  </section>

                  <section>
                    <h3 className="mb-3 text-sm font-extrabold text-slate-800">
                      3. Order cart
                    </h3>

                    {cartItems.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                        No food item selected.
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-2xl border border-slate-200">
                        <div className="divide-y divide-slate-100">
                          {cartItems.map((item) => (
                            <div
                              key={item.foodItemId}
                              className="flex items-center justify-between gap-4 p-4"
                            >
                              <div>
                                <p className="font-bold text-slate-900">
                                  {item.foodItem?.name}
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  {item.quantity} ×{' '}
                                  {formatFoodPrice(
                                    item.foodItem?.price ??
                                      0,
                                  )}
                                </p>
                              </div>

                              <div className="flex items-center gap-3">
                                <p className="font-extrabold text-slate-900">
                                  {formatFoodPrice(
                                    Number(
                                      item.foodItem
                                        ?.price ?? 0,
                                    ) *
                                      item.quantity,
                                  )}
                                </p>

                                <button
                                  type="button"
                                  onClick={() =>
                                    removeItem(
                                      item.foodItemId,
                                    )
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-xl text-red-500 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between bg-slate-50 px-4 py-4">
                          <span className="font-bold text-slate-600">
                            Order total
                          </span>

                          <span className="text-xl font-extrabold text-indigo-700">
                            {formatFoodPrice(totalAmount)}
                          </span>
                        </div>
                      </div>
                    )}
                  </section>
                </>
              )}

              <section className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="order-notes"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Order notes
                  </label>

                  <textarea
                    id="order-notes"
                    value={notes}
                    onChange={(event) =>
                      setNotes(event.target.value)
                    }
                    rows={4}
                    placeholder="Optional order notes..."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="pickup-notes"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Pickup notes
                  </label>

                  <textarea
                    id="pickup-notes"
                    value={pickupNotes}
                    onChange={(event) =>
                      setPickupNotes(
                        event.target.value,
                      )
                    }
                    rows={4}
                    placeholder="Optional pickup instructions..."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
              </section>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-600"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    (!editing &&
                      (
                        !selectedUser ||
                        cartItems.length === 0
                      ))
                  }
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white disabled:opacity-50"
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
                        ? 'Update Order'
                        : 'Create Order'}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
