'use client'

import {
  Ban,
  CheckCircle2,
  ChefHat,
  Eye,
  PackageCheck,
  Pencil,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import {
  canCancelOrder,
  canCompleteOrder,
  canMarkPreparing,
  canMarkReady,
  formatOrderAmount,
  formatOrderDate,
  getOrderItems,
  getOrderReference,
  getOrderStatus,
  getOrderTotal,
  getOrderUserEmail,
  getOrderUserName,
  orderStatusLabel,
} from '@/lib/order'
import type { Order } from '@/types/order'

interface OrderTableProps {
  orders: Order[]
  processingId: number | string | null
  onView: (order: Order) => void
  onEdit: (order: Order) => void
  onDelete: (order: Order) => void
  onRestore: (order: Order) => void
  onPreparing: (order: Order) => void
  onReady: (order: Order) => void
  onComplete: (order: Order) => void
  onCancel: (order: Order) => void
}

export default function OrderTable({
  orders,
  processingId,
  onView,
  onEdit,
  onDelete,
  onRestore,
  onPreparing,
  onReady,
  onComplete,
  onCancel,
}: OrderTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1200px] text-left">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.14em] text-slate-400">
          <tr>
            <th className="px-6 py-4 font-extrabold">
              Order
            </th>

            <th className="px-4 py-4 font-extrabold">
              Customer
            </th>

            <th className="px-4 py-4 font-extrabold">
              Items
            </th>

            <th className="px-4 py-4 font-extrabold">
              Amount
            </th>

            <th className="px-4 py-4 font-extrabold">
              Status
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
          {orders.map((order) => {
            const status = getOrderStatus(order)
            const deleted = Boolean(
              order.deleted_at,
            )

            const processing =
              String(processingId) ===
              String(order.id)

            return (
              <tr
                key={order.id}
                className={`text-sm hover:bg-slate-50 ${
                  deleted ? 'bg-red-50/30' : ''
                }`}
              >
                <td className="px-6 py-4">
                  <p className="font-extrabold text-slate-900">
                    {getOrderReference(order)}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    ID: {order.id}
                  </p>
                </td>

                <td className="px-4 py-4">
                  <p className="max-w-[180px] truncate font-bold text-slate-800">
                    {getOrderUserName(order)}
                  </p>

                  <p className="mt-1 max-w-[200px] truncate text-xs text-slate-400">
                    {getOrderUserEmail(order)}
                  </p>
                </td>

                <td className="px-4 py-4">
                  <p className="font-extrabold text-slate-800">
                    {getOrderItems(order).length}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    food items
                  </p>
                </td>

                <td className="whitespace-nowrap px-4 py-4 font-extrabold text-slate-900">
                  {formatOrderAmount(
                    getOrderTotal(order),
                  )}
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${
                      deleted
                        ? 'bg-red-50 text-red-700 ring-red-200'
                        : status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                          : status === 'cancelled'
                            ? 'bg-red-50 text-red-700 ring-red-200'
                            : status === 'ready'
                              ? 'bg-amber-50 text-amber-700 ring-amber-200'
                              : status === 'preparing'
                                ? 'bg-blue-50 text-blue-700 ring-blue-200'
                                : 'bg-indigo-50 text-indigo-700 ring-indigo-200'
                    }`}
                  >
                    {deleted
                      ? 'Deleted'
                      : orderStatusLabel(order)}
                  </span>
                </td>

                <td className="whitespace-nowrap px-4 py-4">
                  <p className="text-sm font-semibold text-slate-600">
                    {formatOrderDate(
                      order.created_at,
                      false,
                    )}
                  </p>
                </td>

                <td className="px-6 py-4">
                  <div className="flex flex-wrap justify-end gap-2">
                    <ActionButton
                      title="View order"
                      onClick={() => onView(order)}
                      icon={Eye}
                    />

                    {!deleted && (
                      <ActionButton
                        title="Edit notes"
                        onClick={() => onEdit(order)}
                        icon={Pencil}
                      />
                    )}

                    {canMarkPreparing(order) && (
                      <ActionButton
                        title="Start preparing"
                        onClick={() =>
                          onPreparing(order)
                        }
                        icon={ChefHat}
                        className="border-blue-200 bg-blue-50 text-blue-600"
                      />
                    )}

                    {canMarkReady(order) && (
                      <ActionButton
                        title="Mark ready"
                        onClick={() => onReady(order)}
                        icon={PackageCheck}
                        className="border-amber-200 bg-amber-50 text-amber-600"
                      />
                    )}

                    {canCompleteOrder(order) && (
                      <ActionButton
                        title="Complete order"
                        onClick={() =>
                          onComplete(order)
                        }
                        icon={CheckCircle2}
                        className="border-emerald-200 bg-emerald-50 text-emerald-600"
                      />
                    )}

                    {canCancelOrder(order) && (
                      <ActionButton
                        title="Cancel order"
                        onClick={() => onCancel(order)}
                        icon={Ban}
                        className="border-red-200 bg-red-50 text-red-600"
                      />
                    )}

                    {!deleted && (
                      <ActionButton
                        title="Delete order"
                        onClick={() => onDelete(order)}
                        icon={Trash2}
                        disabled={processing}
                      />
                    )}

                    {deleted && (
                      <button
                        type="button"
                        onClick={() => onRestore(order)}
                        disabled={processing}
                        className="flex h-9 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 disabled:opacity-50"
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

function ActionButton({
  title,
  onClick,
  icon: Icon,
  className = 'border-slate-200 text-slate-500',
  disabled = false,
}: {
  title: string
  onClick: () => void
  icon: typeof Eye
  className?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-9 w-9 items-center justify-center rounded-xl border hover:opacity-80 disabled:opacity-40 ${className}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}
