'use client'

import {
  Boxes,
  CheckCircle2,
  LoaderCircle,
  X,
} from 'lucide-react'
import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'
import type { FoodItem } from '@/types/food-item'
import type {
  InventoryStock,
  InventoryStockPayload,
} from '@/types/inventory-stock'
import {
  getCurrentStock,
  getInventoryFoodItem,
  getMaximumStock,
  getMinimumStock,
  getStockUnit,
} from '@/lib/inventory-stock'

interface InventoryStockFormModalProps {
  isOpen: boolean
  stock?: InventoryStock | null
  foodItems: FoodItem[]
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (
    payload: InventoryStockPayload,
  ) => Promise<void>
}

export default function InventoryStockFormModal({
  isOpen,
  stock,
  foodItems,
  isSubmitting,
  onClose,
  onSubmit,
}: InventoryStockFormModalProps) {
  const [foodItemId, setFoodItemId] =
    useState('')
  const [quantity, setQuantity] = useState('')
  const [
    minimumQuantity,
    setMinimumQuantity,
  ] = useState('5')
  const [
    maximumQuantity,
    setMaximumQuantity,
  ] = useState('')
  const [unit, setUnit] = useState('piece')
  const [status, setStatus] =
    useState<'active' | 'inactive'>('active')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] =
    useState('')

  const editing = Boolean(stock)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const relatedFoodItem =
      stock ? getInventoryFoodItem(stock) : null

    setFoodItemId(
      stock
        ? String(
            stock.food_item_id ??
              relatedFoodItem?.id ??
              '',
          )
        : '',
    )

    setQuantity(
      stock
        ? String(getCurrentStock(stock))
        : '',
    )

    setMinimumQuantity(
      stock
        ? String(getMinimumStock(stock))
        : '5',
    )

    const maximum = stock
      ? getMaximumStock(stock)
      : null

    setMaximumQuantity(
      maximum === null ? '' : String(maximum),
    )

    setUnit(
      stock ? getStockUnit(stock) : 'piece',
    )

    setStatus(
      stock?.status === 'inactive'
        ? 'inactive'
        : 'active',
    )

    setNotes(stock?.notes ?? '')
    setFormError('')
  }, [isOpen, stock])

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setFormError('')

    if (!foodItemId) {
      setFormError(
        'Please select a food item.',
      )
      return
    }

    const quantityNumber = Number(quantity)
    const minimumNumber = Number(
      minimumQuantity,
    )

    if (
      quantity === '' ||
      !Number.isFinite(quantityNumber) ||
      quantityNumber < 0
    ) {
      setFormError(
        'Please enter a valid stock quantity.',
      )
      return
    }

    if (
      minimumQuantity === '' ||
      !Number.isFinite(minimumNumber) ||
      minimumNumber < 0
    ) {
      setFormError(
        'Please enter a valid minimum quantity.',
      )
      return
    }

    if (
      maximumQuantity.trim() &&
      (
        !Number.isFinite(
          Number(maximumQuantity),
        ) ||
        Number(maximumQuantity) < quantityNumber
      )
    ) {
      setFormError(
        'Maximum quantity must be equal to or greater than the current quantity.',
      )
      return
    }

    if (!unit.trim()) {
      setFormError('Unit is required.')
      return
    }

    try {
      await onSubmit({
        food_item_id: foodItemId,
        quantity,
        minimum_quantity: minimumQuantity,
        maximum_quantity: maximumQuantity,
        unit: unit.trim(),
        status,
        notes: notes.trim(),
      })
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Unable to save stock record.',
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
        aria-label="Close inventory form"
        onClick={onClose}
        disabled={isSubmitting}
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="relative z-10 my-auto w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Boxes className="h-5 w-5" />
            </span>

            <div>
              <h2 className="font-extrabold text-slate-950">
                {editing
                  ? 'Update Stock Record'
                  : 'Create Stock Record'}
              </h2>

              <p className="text-xs text-slate-500">
                Set the food item quantity and stock
                thresholds.
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

          <div>
            <label
              htmlFor="inventory-food-item"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Food item
            </label>

            <select
              id="inventory-food-item"
              value={foodItemId}
              onChange={(event) =>
                setFoodItemId(event.target.value)
              }
              required
              disabled={isSubmitting || editing}
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <option value="">
                Select food item
              </option>

              {foodItems
                .filter(
                  (foodItem) =>
                    !foodItem.deleted_at,
                )
                .map((foodItem) => (
                  <option
                    key={foodItem.id}
                    value={String(foodItem.id)}
                  >
                    {foodItem.name}
                  </option>
                ))}
            </select>

            {editing && (
              <p className="mt-2 text-xs text-slate-400">
                The food item cannot be changed after
                creating the stock record.
              </p>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="stock-quantity"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                Current quantity
              </label>

              <input
                id="stock-quantity"
                type="number"
                min="0"
                step="0.01"
                value={quantity}
                onChange={(event) =>
                  setQuantity(event.target.value)
                }
                required
                disabled={isSubmitting}
                placeholder="Example: 100"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label
                htmlFor="stock-unit"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                Unit
              </label>

              <select
                id="stock-unit"
                value={unit}
                onChange={(event) =>
                  setUnit(event.target.value)
                }
                disabled={isSubmitting}
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              >
                <option value="piece">Piece</option>
                <option value="plate">Plate</option>
                <option value="kg">Kilogram</option>
                <option value="g">Gram</option>
                <option value="litre">Litre</option>
                <option value="ml">
                  Millilitre
                </option>
                <option value="bottle">
                  Bottle
                </option>
                <option value="packet">
                  Packet
                </option>
                <option value="crate">Crate</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="minimum-quantity"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                Minimum quantity
              </label>

              <input
                id="minimum-quantity"
                type="number"
                min="0"
                step="0.01"
                value={minimumQuantity}
                onChange={(event) =>
                  setMinimumQuantity(
                    event.target.value,
                  )
                }
                required
                disabled={isSubmitting}
                placeholder="Example: 10"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />

              <p className="mt-2 text-xs text-slate-400">
                A low-stock alert appears at or below
                this quantity.
              </p>
            </div>

            <div>
              <label
                htmlFor="maximum-quantity"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                Maximum quantity
              </label>

              <input
                id="maximum-quantity"
                type="number"
                min="0"
                step="0.01"
                value={maximumQuantity}
                onChange={(event) =>
                  setMaximumQuantity(
                    event.target.value,
                  )
                }
                disabled={isSubmitting}
                placeholder="Optional"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="stock-status"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Status
            </label>

            <select
              id="stock-status"
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value as
                    | 'active'
                    | 'inactive',
                )
              }
              disabled={isSubmitting}
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            >
              <option value="active">Active</option>
              <option value="inactive">
                Inactive
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="stock-notes"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Notes
            </label>

            <textarea
              id="stock-notes"
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              rows={3}
              disabled={isSubmitting}
              placeholder="Optional stock information..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            />
          </div>

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
              disabled={isSubmitting}
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
                    ? 'Update Stock'
                    : 'Create Stock'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
