'use client'

import {
  Eye,
  Pencil,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import {
  formatOrderItemAmount,
  formatOrderItemDate,
  getOrderItemCustomerName,
  getOrderItemFood,
  getOrderItemFoodName,
  getOrderItemOrderReference,
  getOrderItemQuantity,
  getOrderItemStatus,
  getOrderItemTotal,
  getOrderItemUnitPrice,
  orderItemStatusLabel,
} from '@/lib/order-item'
import {
  getFoodItemImageUrl,
} from '@/lib/food-item'
import type { OrderItemRecord } from '@/types/order-item'

interface OrderItemTableProps {
  orderItems: OrderItemRecord[]
  processingId: number | string | null
  onView: (item: OrderItemRecord) => void
  onEdit: (item: OrderItemRecord) => void
  onDelete: (item: OrderItemRecord) => void
  onRestore: (item: OrderItemRecord) => void
}

export default function OrderItemTable({
  orderItems,
  processingId,
  onView,
  onEdit,
  onDelete,
  onRestore,
}: OrderItemTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1150px] text-left">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.14em] text-slate-400">
          <tr>
            <th className="px-6 py-4 font-extrabold">
              Food Item
            </th>

            <th className="px-4 py-4 font-extrabold">
              Order
            </th>

            <th className="px-4 py-4 font-extrabold">
              Quantity
            </th>

            <th className="px-4 py-4 font-extrabold">
              Unit Price
            </th>

            <th className="px-4 py-4 font-extrabold">
              Total
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
          {orderItems.map((item) => {
            const foodItem =
              getOrderItemFood(item)

            const imageUrl = foodItem
              ? getFoodItemImageUrl(foodItem)
              : null

            const status =
              getOrderItemStatus(item)

            const deleted = Boolean(
              item.deleted_at,
            )

            const processing =
              String(processingId) ===
              String(item.id)

            return (
              <tr
                key={item.id}
                className={`text-sm transition hover:bg-slate-50 ${
                  deleted
                    ? 'bg-red-50/30'
                    : ''
                }`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-indigo-50 font-extrabold text-indigo-600">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={getOrderItemFoodName(
                            item,
                          )}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        getOrderItemFoodName(item)
                          .charAt(0)
                          .toUpperCase()
                      )}
                    </span>

                    <div className="min-w-0">
                      <p className="max-w-[200px] truncate font-extrabold text-slate-900">
                        {getOrderItemFoodName(
                          item,
                        )}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Item #{item.id}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-4">
                  <p className="font-bold text-slate-700">
                    {getOrderItemOrderReference(
                      item,
                    )}
                  </p>

                  <p className="mt-1 max-w-[180px] truncate text-xs text-slate-400">
                    {getOrderItemCustomerName(
                      item,
                    )}
                  </p>
                </td>

                <td className="whitespace-nowrap px-4 py-4 font-extrabold text-slate-800">
                  {getOrderItemQuantity(item)}
                </td>

                <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                  {formatOrderItemAmount(
                    getOrderItemUnitPrice(item),
                  )}
                </td>

                <td className="whitespace-nowrap px-4 py-4 font-extrabold text-slate-900">
                  {formatOrderItemAmount(
                    getOrderItemTotal(item),
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
                      : orderItemStatusLabel(
                          item,
                        )}
                  </span>
                </td>

                <td className="whitespace-nowrap px-4 py-4 text-slate-500">
                  {formatOrderItemDate(
                    item.created_at,
                    false,
                  )}
                </td>

                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onView(item)}
                      title="View order item"
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {!deleted && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            onEdit(item)
                          }
                          title="Update item"
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onDelete(item)
                          }
                          disabled={processing}
                          title="Delete item"
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
                          onRestore(item)
                        }
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
