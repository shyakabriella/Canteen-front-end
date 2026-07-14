'use client'

import {
  CheckCircle2,
  LoaderCircle,
  ShoppingCart,
  X,
} from 'lucide-react'
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'
import {
  formatPurchaseRequestAmount,
  getExpectedDeliveryDate,
  getPurchaseRequestPriority,
  getPurchaseRequestQuantity,
  getPurchaseRequestReason,
  getPurchaseRequestStock,
  getPurchaseRequestUnitCost,
} from '@/lib/purchase-request'
import {
  getStockFoodName,
  getStockQuantity,
  getStockThreshold,
  getStockUnit,
} from '@/lib/low-stock-alert'
import {
  getSupplierName,
  getSupplierStatus,
} from '@/lib/supplier'
import type { InventoryStockOption } from '@/types/low-stock-alert'
import type {
  PurchaseRequest,
  PurchaseRequestPayload,
} from '@/types/purchase-request'
import type { Supplier } from '@/types/supplier'

interface Props {
  isOpen: boolean
  request?: PurchaseRequest | null
  suppliers: Supplier[]
  inventoryStocks: InventoryStockOption[]
  isLoadingDependencies: boolean
  dependencyError: string
  isSubmitting: boolean
  onRefreshDependencies: () => Promise<void>
  onClose: () => void
  onSubmit: (
    payload: PurchaseRequestPayload,
  ) => Promise<void>
}

export default function PurchaseRequestFormModal({
  isOpen,
  request,
  suppliers,
  inventoryStocks,
  isLoadingDependencies,
  dependencyError,
  isSubmitting,
  onRefreshDependencies,
  onClose,
  onSubmit,
}: Props) {
  const [supplierId, setSupplierId] =
    useState('')
  const [stockId, setStockId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unitCost, setUnitCost] = useState('')
  const [expectedDate, setExpectedDate] =
    useState('')
  const [priority, setPriority] =
    useState('normal')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] =
    useState('')

  const editing = Boolean(request)

  const selectedStock = useMemo(
    () =>
      inventoryStocks.find(
        (stock) =>
          String(stock.id) === String(stockId),
      ) ?? null,
    [inventoryStocks, stockId],
  )

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setSupplierId(
      request?.supplier_id == null
        ? ''
        : String(request.supplier_id),
    )

    setStockId(
      request?.inventory_stock_id == null
        ? getPurchaseRequestStock(request ?? {
            id: '',
          })?.id
          ? String(
              getPurchaseRequestStock(
                request ?? { id: '' },
              )?.id,
            )
          : ''
        : String(request.inventory_stock_id),
    )

    setQuantity(
      request
        ? String(
            getPurchaseRequestQuantity(request),
          )
        : '',
    )

    setUnitCost(
      request
        ? String(
            getPurchaseRequestUnitCost(request),
          )
        : '',
    )

    setExpectedDate(
      request
        ? String(
            getExpectedDeliveryDate(request) ??
            '',
          ).slice(0, 10)
        : '',
    )

    setPriority(
      request
        ? getPurchaseRequestPriority(request)
        : 'normal',
    )

    setReason(
      request
        ? getPurchaseRequestReason(request)
        : '',
    )

    setNotes(request?.notes ?? '')
    setFormError('')
  }, [isOpen, request])

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setFormError('')

    const parsedQuantity = Number(quantity)
    const parsedUnitCost = Number(unitCost)

    if (!supplierId) {
      setFormError('Please select a supplier.')
      return
    }

    if (!stockId) {
      setFormError(
        'Please select an inventory item.',
      )
      return
    }

    if (
      !Number.isFinite(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      setFormError(
        'Requested quantity must be greater than zero.',
      )
      return
    }

    if (
      !Number.isFinite(parsedUnitCost) ||
      parsedUnitCost < 0
    ) {
      setFormError(
        'Unit cost must be zero or greater.',
      )
      return
    }

    if (!reason.trim()) {
      setFormError(
        'Please provide the reason for this purchase.',
      )
      return
    }

    try {
      await onSubmit({
        supplier_id: supplierId,
        inventory_stock_id: stockId,
        quantity,
        unit_cost: unitCost,
        expected_delivery_date: expectedDate,
        priority,
        reason: reason.trim(),
        notes: notes.trim(),
      })
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Unable to save the purchase request.',
      )
    }
  }

  if (!isOpen) {
    return null
  }

  const activeSuppliers = suppliers.filter(
    (supplier) =>
      !supplier.deleted_at &&
      getSupplierStatus(supplier) === 'active',
  )

  const availableStocks = inventoryStocks.filter(
    (stock) => !stock.deleted_at,
  )

  const estimatedTotal =
    Number(quantity || 0) *
    Number(unitCost || 0)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4">
      <button
        type="button"
        aria-label="Close purchase request form"
        onClick={onClose}
        disabled={isSubmitting}
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="relative z-10 my-auto w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <ShoppingCart className="h-5 w-5" />
            </span>

            <div>
              <h2 className="font-extrabold text-slate-950">
                {editing
                  ? 'Update Purchase Request'
                  : 'Create Purchase Request'}
              </h2>

              <p className="text-xs text-slate-500">
                Pending requests can be updated before
                approval.
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
          className="max-h-[calc(100vh-130px)] space-y-5 overflow-y-auto p-6"
        >
          {formError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {formError}
            </div>
          )}

          {dependencyError && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
              <p>{dependencyError}</p>

              <button
                type="button"
                onClick={() =>
                  void onRefreshDependencies()
                }
                className="mt-2 font-bold underline"
              >
                Reload suppliers and inventory
              </button>
            </div>
          )}

          {isLoadingDependencies ? (
            <div className="flex min-h-64 items-center justify-center">
              <LoaderCircle className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Supplier
                  </label>

                  <select
                    value={supplierId}
                    onChange={(event) =>
                      setSupplierId(
                        event.target.value,
                      )
                    }
                    required
                    disabled={isSubmitting}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400"
                  >
                    <option value="">
                      Select supplier
                    </option>

                    {activeSuppliers.map(
                      (supplier) => (
                        <option
                          key={supplier.id}
                          value={String(supplier.id)}
                        >
                          {getSupplierName(supplier)}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Inventory item
                  </label>

                  <select
                    value={stockId}
                    onChange={(event) =>
                      setStockId(event.target.value)
                    }
                    required
                    disabled={isSubmitting}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400"
                  >
                    <option value="">
                      Select inventory item
                    </option>

                    {availableStocks.map((stock) => (
                      <option
                        key={stock.id}
                        value={String(stock.id)}
                      >
                        {getStockFoodName(stock)}
                        {' — '}
                        {getStockQuantity(stock)}
                        {' '}
                        {getStockUnit(stock)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedStock && (
                <div className="grid gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 sm:grid-cols-3">
                  <StockValue
                    label="Food Item"
                    value={getStockFoodName(
                      selectedStock,
                    )}
                  />

                  <StockValue
                    label="Current Stock"
                    value={`${getStockQuantity(
                      selectedStock,
                    )} ${getStockUnit(
                      selectedStock,
                    )}`}
                  />

                  <StockValue
                    label="Minimum Level"
                    value={`${getStockThreshold(
                      selectedStock,
                    )} ${getStockUnit(
                      selectedStock,
                    )}`}
                  />
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <InputField
                  label="Requested quantity"
                  type="number"
                  value={quantity}
                  onChange={setQuantity}
                  min="0.01"
                  step="0.01"
                  required
                  disabled={isSubmitting}
                />

                <InputField
                  label="Estimated unit cost (RWF)"
                  type="number"
                  value={unitCost}
                  onChange={setUnitCost}
                  min="0"
                  step="1"
                  required
                  disabled={isSubmitting}
                />

                <InputField
                  label="Expected delivery date"
                  type="date"
                  value={expectedDate}
                  onChange={setExpectedDate}
                  disabled={isSubmitting}
                />

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Priority
                  </label>

                  <select
                    value={priority}
                    onChange={(event) =>
                      setPriority(
                        event.target.value,
                      )
                    }
                    disabled={isSubmitting}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400"
                  >
                    <option value="low">Low</option>
                    <option value="normal">
                      Normal
                    </option>
                    <option value="high">High</option>
                    <option value="urgent">
                      Urgent
                    </option>
                  </select>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                  Estimated Total
                </p>

                <p className="mt-2 text-2xl font-extrabold text-emerald-800">
                  {formatPurchaseRequestAmount(
                    estimatedTotal,
                  )}
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Purchase reason
                </label>

                <textarea
                  value={reason}
                  onChange={(event) =>
                    setReason(event.target.value)
                  }
                  rows={3}
                  required
                  disabled={isSubmitting}
                  placeholder="Explain why this inventory purchase is required..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Additional notes
                </label>

                <textarea
                  value={notes}
                  onChange={(event) =>
                    setNotes(event.target.value)
                  }
                  rows={3}
                  disabled={isSubmitting}
                  placeholder="Optional purchasing instructions..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400"
                />
              </div>

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
                  disabled={isSubmitting}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
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
                        ? 'Update Request'
                        : 'Create Request'}
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}

function InputField({
  label,
  type,
  value,
  onChange,
  required = false,
  disabled = false,
  min,
  step,
}: {
  label: string
  type: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  disabled?: boolean
  min?: string
  step?: string
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        required={required}
        disabled={disabled}
        min={min}
        step={step}
        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400"
      />
    </div>
  )
}

function StockValue({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl bg-white p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-extrabold text-slate-800">
        {value}
      </p>
    </div>
  )
}
