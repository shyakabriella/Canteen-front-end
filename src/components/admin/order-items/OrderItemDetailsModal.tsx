'use client'

import {
  CalendarDays,
  Hash,
  LoaderCircle,
  ShoppingBag,
  UserRound,
  X,
} from 'lucide-react'
import {
  formatOrderItemAmount,
  formatOrderItemDate,
  getOrderItemCustomerEmail,
  getOrderItemCustomerName,
  getOrderItemFoodName,
  getOrderItemNotes,
  getOrderItemOrderReference,
  getOrderItemQuantity,
  getOrderItemStatus,
  getOrderItemTotal,
  getOrderItemUnitPrice,
  orderItemStatusLabel,
} from '@/lib/order-item'
import type { OrderItemRecord } from '@/types/order-item'

interface OrderItemDetailsModalProps {
  isOpen: boolean
  orderItem: OrderItemRecord | null
  isLoading: boolean
  errorMessage: string
  onClose: () => void
}

export default function OrderItemDetailsModal({
  isOpen,
  orderItem,
  isLoading,
  errorMessage,
  onClose,
}: OrderItemDetailsModalProps) {
  if (!isOpen) {
    return null
  }

  const status = orderItem
    ? getOrderItemStatus(orderItem)
    : 'pending'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4">
      <button
        type="button"
        aria-label="Close order item details"
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="relative z-10 my-auto w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="font-extrabold text-slate-950">
              Order Item Details
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Complete item and order information.
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
              <div className="text-center">
                <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-indigo-600" />

                <p className="mt-3 text-sm text-slate-500">
                  Loading order item...
                </p>
              </div>
            </div>
          )}

          {!isLoading && errorMessage && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {!isLoading && orderItem && (
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
                      {getOrderItemOrderReference(
                        orderItem,
                      )}
                    </p>

                    <h3 className="mt-2 text-2xl font-extrabold">
                      {getOrderItemFoodName(
                        orderItem,
                      )}
                    </h3>

                    <p className="mt-4 text-3xl font-extrabold">
                      {formatOrderItemAmount(
                        getOrderItemTotal(
                          orderItem,
                        ),
                      )}
                    </p>
                  </div>

                  <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">
                    {orderItemStatusLabel(
                      orderItem,
                    )}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  icon={Hash}
                  label="Order Item ID"
                  value={String(orderItem.id)}
                />

                <DetailItem
                  icon={Hash}
                  label="Order ID"
                  value={String(
                    orderItem.order_id ??
                      'Not available',
                  )}
                />

                <DetailItem
                  icon={ShoppingBag}
                  label="Quantity"
                  value={String(
                    getOrderItemQuantity(
                      orderItem,
                    ),
                  )}
                />

                <DetailItem
                  icon={ShoppingBag}
                  label="Unit Price"
                  value={formatOrderItemAmount(
                    getOrderItemUnitPrice(
                      orderItem,
                    ),
                  )}
                />

                <DetailItem
                  icon={UserRound}
                  label="Customer"
                  value={getOrderItemCustomerName(
                    orderItem,
                  )}
                />

                <DetailItem
                  icon={UserRound}
                  label="Customer Email"
                  value={getOrderItemCustomerEmail(
                    orderItem,
                  )}
                />

                <DetailItem
                  icon={CalendarDays}
                  label="Created At"
                  value={formatOrderItemDate(
                    orderItem.created_at,
                  )}
                />

                <DetailItem
                  icon={CalendarDays}
                  label="Updated At"
                  value={formatOrderItemDate(
                    orderItem.updated_at,
                  )}
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Notes
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {getOrderItemNotes(orderItem) ||
                    'No notes were provided.'}
                </p>
              </div>

              {orderItem.deleted_at && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                  Deleted on{' '}
                  {formatOrderItemDate(
                    orderItem.deleted_at,
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
  icon: typeof Hash
  label: string
  value: string
}) {
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
