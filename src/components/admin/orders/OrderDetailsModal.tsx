'use client'

import {
  CalendarDays,
  LoaderCircle,
  ShoppingBag,
  UserRound,
  WalletCards,
  X,
} from 'lucide-react'
import {
  formatOrderAmount,
  formatOrderDate,
  getOrderCancellationReason,
  getOrderItemName,
  getOrderItemQuantity,
  getOrderItemTotal,
  getOrderItemUnitPrice,
  getOrderItems,
  getOrderNotes,
  getOrderReference,
  getOrderStatus,
  getOrderTotal,
  getOrderUserEmail,
  getOrderUserName,
  orderStatusLabel,
} from '@/lib/order'
import type { Order } from '@/types/order'

interface OrderDetailsModalProps {
  isOpen: boolean
  order: Order | null
  isLoading: boolean
  errorMessage: string
  onClose: () => void
}

export default function OrderDetailsModal({
  isOpen,
  order,
  isLoading,
  errorMessage,
  onClose,
}: OrderDetailsModalProps) {
  if (!isOpen) {
    return null
  }

  const status = order
    ? getOrderStatus(order)
    : 'pending'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4">
      <button
        type="button"
        aria-label="Close order details"
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="relative z-10 my-auto w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="font-extrabold text-slate-950">
              Order Details
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Food items, payment and order progress.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(100vh-130px)] overflow-y-auto p-6">
          {isLoading && (
            <div className="flex min-h-72 items-center justify-center">
              <LoaderCircle className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          )}

          {!isLoading && errorMessage && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {!isLoading && order && (
            <div className="space-y-5">
              <div
                className={`rounded-3xl p-6 text-white ${
                  status === 'completed'
                    ? 'bg-gradient-to-br from-emerald-600 to-teal-700'
                    : status === 'cancelled'
                      ? 'bg-gradient-to-br from-red-600 to-rose-700'
                      : status === 'ready'
                        ? 'bg-gradient-to-br from-amber-600 to-orange-700'
                        : 'bg-gradient-to-br from-indigo-600 to-blue-700'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                      {getOrderReference(order)}
                    </p>

                    <h3 className="mt-2 text-3xl font-extrabold">
                      {formatOrderAmount(
                        getOrderTotal(order),
                      )}
                    </h3>

                    <p className="mt-3 text-sm text-white/80">
                      {getOrderUserName(order)}
                    </p>
                  </div>

                  <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">
                    {orderStatusLabel(order)}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  icon={UserRound}
                  label="Customer"
                  value={getOrderUserName(order)}
                />

                <DetailItem
                  icon={UserRound}
                  label="Email"
                  value={getOrderUserEmail(order)}
                />

                <DetailItem
                  icon={WalletCards}
                  label="Payment Status"
                  value={
                    order.payment_status
                      ?.replaceAll('_', ' ') ??
                    'Not available'
                  }
                />

                <DetailItem
                  icon={CalendarDays}
                  label="Created At"
                  value={formatOrderDate(
                    order.created_at,
                  )}
                />
              </div>

              <section className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
                  <ShoppingBag className="h-4 w-4 text-indigo-600" />

                  <h3 className="text-sm font-extrabold text-slate-800">
                    Order Items
                  </h3>
                </div>

                {getOrderItems(order).length === 0 ? (
                  <p className="p-5 text-sm text-slate-500">
                    The backend did not return order items.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {getOrderItems(order).map(
                      (item, index) => (
                        <div
                          key={
                            item.id ??
                            `${item.food_item_id}-${index}`
                          }
                          className="flex items-center justify-between gap-4 p-4"
                        >
                          <div>
                            <p className="font-bold text-slate-900">
                              {getOrderItemName(item)}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {getOrderItemQuantity(item)}
                              {' × '}
                              {formatOrderAmount(
                                getOrderItemUnitPrice(
                                  item,
                                ),
                              )}
                            </p>
                          </div>

                          <p className="font-extrabold text-slate-900">
                            {formatOrderAmount(
                              getOrderItemTotal(item),
                            )}
                          </p>
                        </div>
                      ),
                    )}

                    <div className="flex justify-between bg-slate-50 px-4 py-4">
                      <span className="font-bold text-slate-600">
                        Total
                      </span>

                      <span className="text-lg font-extrabold text-indigo-700">
                        {formatOrderAmount(
                          getOrderTotal(order),
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </section>

              <TextBlock
                label="Order Notes"
                value={
                  getOrderNotes(order) ||
                  'No order notes.'
                }
              />

              <TextBlock
                label="Pickup Notes"
                value={
                  order.pickup_notes ||
                  'No pickup notes.'
                }
              />

              {status === 'cancelled' && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-red-500">
                    Cancellation Reason
                  </p>

                  <p className="mt-2 text-sm text-red-700">
                    {getOrderCancellationReason(
                      order,
                    )}
                  </p>
                </div>
              )}

              {order.deleted_at && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                  Deleted on{' '}
                  {formatOrderDate(
                    order.deleted_at,
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

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
          <Icon className="h-5 w-5" />
        </span>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {label}
          </p>

          <p className="mt-1 break-all text-sm font-extrabold capitalize text-slate-800">
            {value}
          </p>
        </div>
      </div>
    </div>
  )
}

function TextBlock({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-sm leading-6 text-slate-700">
        {value}
      </p>
    </div>
  )
}
