'use client'

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  LoaderCircle,
  RefreshCw,
  X,
} from 'lucide-react'
import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'
import {
  getInventoryFoodItem,
  getInventoryFoodName,
  getStockUnit,
} from '@/lib/inventory-stock'
import type { InventoryStock } from '@/types/inventory-stock'
import type {
  StockMovement,
  StockMovementPayload,
  StockMovementUpdatePayload,
} from '@/types/stock-movement'

interface StockMovementFormModalProps {
  isOpen: boolean
  movement?: StockMovement | null
  inventoryStocks: InventoryStock[]
  isSubmitting: boolean
  onClose: () => void
  onCreate: (
    payload: StockMovementPayload,
  ) => Promise<void>
  onUpdate: (
    payload: StockMovementUpdatePayload,
  ) => Promise<void>
}

export default function StockMovementFormModal({
  isOpen,
  movement,
  inventoryStocks,
  isSubmitting,
  onClose,
  onCreate,
  onUpdate,
}: StockMovementFormModalProps) {
  const [inventoryStockId, setInventoryStockId] =
    useState('')
  const [movementType, setMovementType] =
    useState<'in' | 'out' | 'adjustment'>('in')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState('')

  const editing = Boolean(movement)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setInventoryStockId(
      movement?.inventory_stock_id === undefined ||
        movement?.inventory_stock_id === null
        ? ''
        : String(movement.inventory_stock_id),
    )

    setMovementType('in')
    setQuantity(
      movement?.quantity === undefined
        ? ''
        : String(movement.quantity),
    )
    setReason(movement?.reason ?? '')
    setNotes(movement?.notes ?? '')
    setFormError('')
  }, [isOpen, movement])

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setFormError('')

    if (editing) {
      try {
        await onUpdate({
          reason: reason.trim(),
          notes: notes.trim(),
        })
      } catch (error) {
        setFormError(
          error instanceof Error
            ? error.message
            : 'Unable to update the movement.',
        )
      }

      return
    }

    if (!inventoryStockId) {
      setFormError(
        'Please select an inventory stock record.',
      )
      return
    }

    const numericQuantity = Number(quantity)

    if (
      !quantity ||
      !Number.isFinite(numericQuantity) ||
      numericQuantity <= 0
    ) {
      setFormError(
        'Movement quantity must be greater than zero.',
      )
      return
    }

    const selectedStock = inventoryStocks.find(
      (stock) =>
        String(stock.id) === inventoryStockId,
    )

    const foodItem =
      selectedStock
        ? getInventoryFoodItem(selectedStock)
        : null

    try {
      await onCreate({
        inventory_stock_id: inventoryStockId,
        food_item_id:
          foodItem?.id === undefined
            ? undefined
            : String(foodItem.id),
        movement_type: movementType,
        quantity,
        reason: reason.trim(),
        notes: notes.trim(),
      })
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Unable to create the movement.',
      )
    }
  }

  if (!isOpen) {
    return null
  }

  const selectedStock = inventoryStocks.find(
    (stock) =>
      String(stock.id) === inventoryStockId,
  )

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4">
      <button
        type="button"
        aria-label="Close movement form"
        onClick={onClose}
        disabled={isSubmitting}
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="relative z-10 my-auto w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="font-extrabold text-slate-950">
              {editing
                ? 'Update Movement Notes'
                : 'Create Stock Movement'}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {editing
                ? 'Only the reason and notes can be changed.'
                : 'Record stock coming in, going out or being adjusted.'}
            </p>
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
                <label
                  htmlFor="movement-stock"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Inventory stock
                </label>

                <select
                  id="movement-stock"
                  value={inventoryStockId}
                  onChange={(event) =>
                    setInventoryStockId(
                      event.target.value,
                    )
                  }
                  required
                  disabled={isSubmitting}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                >
                  <option value="">
                    Select stock record
                  </option>

                  {inventoryStocks
                    .filter(
                      (stock) => !stock.deleted_at,
                    )
                    .map((stock) => (
                      <option
                        key={stock.id}
                        value={String(stock.id)}
                      >
                        {getInventoryFoodName(stock)}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <p className="mb-2 text-sm font-bold text-slate-700">
                  Movement type
                </p>

                <div className="grid gap-3 sm:grid-cols-3">
                  <MovementTypeButton
                    active={movementType === 'in'}
                    label="Stock In"
                    description="Add inventory"
                    icon={ArrowDownToLine}
                    activeClass="border-emerald-500 bg-emerald-50 text-emerald-700"
                    onClick={() =>
                      setMovementType('in')
                    }
                  />

                  <MovementTypeButton
                    active={movementType === 'out'}
                    label="Stock Out"
                    description="Remove inventory"
                    icon={ArrowUpFromLine}
                    activeClass="border-amber-500 bg-amber-50 text-amber-700"
                    onClick={() =>
                      setMovementType('out')
                    }
                  />

                  <MovementTypeButton
                    active={
                      movementType === 'adjustment'
                    }
                    label="Adjustment"
                    description="Correct stock"
                    icon={RefreshCw}
                    activeClass="border-indigo-500 bg-indigo-50 text-indigo-700"
                    onClick={() =>
                      setMovementType('adjustment')
                    }
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="movement-quantity"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Quantity
                </label>

                <div className="relative">
                  <input
                    id="movement-quantity"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={quantity}
                    onChange={(event) =>
                      setQuantity(event.target.value)
                    }
                    required
                    disabled={isSubmitting}
                    placeholder="Enter quantity"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pr-24 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  />

                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    {selectedStock
                      ? getStockUnit(selectedStock)
                      : 'unit'}
                  </span>
                </div>
              </div>
            </>
          )}

          <div>
            <label
              htmlFor="movement-reason"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Reason
            </label>

            <input
              id="movement-reason"
              type="text"
              value={reason}
              onChange={(event) =>
                setReason(event.target.value)
              }
              disabled={isSubmitting}
              placeholder="Example: Supplier delivery"
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label
              htmlFor="movement-notes"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Notes
            </label>

            <textarea
              id="movement-notes"
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              rows={4}
              disabled={isSubmitting}
              placeholder="Add more information about this movement..."
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
                    ? 'Update Movement'
                    : 'Create Movement'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface MovementTypeButtonProps {
  active: boolean
  label: string
  description: string
  icon: typeof ArrowDownToLine
  activeClass: string
  onClick: () => void
}

function MovementTypeButton({
  active,
  label,
  description,
  icon: Icon,
  activeClass,
  onClick,
}: MovementTypeButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${
        active
          ? activeClass
          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
      }`}
    >
      <Icon className="h-5 w-5" />

      <p className="mt-3 text-sm font-extrabold">
        {label}
      </p>

      <p className="mt-1 text-xs opacity-70">
        {description}
      </p>
    </button>
  )
}
