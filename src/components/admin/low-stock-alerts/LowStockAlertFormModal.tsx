'use client'

import {
  AlertTriangle,
  CheckCircle2,
  LoaderCircle,
  PackageSearch,
  X,
} from 'lucide-react'
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'
import {
  formatLowStockQuantity,
  getAlertMessage,
  getAlertInventoryStock,
  getLowStockAlertSeverity,
  getStockFoodName,
  getStockQuantity,
  getStockThreshold,
  getStockUnit,
  recommendStockSeverity,
} from '@/lib/low-stock-alert'
import type {
  InventoryStockOption,
  LowStockAlert,
  LowStockAlertPayload,
} from '@/types/low-stock-alert'

interface LowStockAlertFormModalProps {
  isOpen: boolean
  alert?: LowStockAlert | null
  inventoryStocks: InventoryStockOption[]
  isLoadingStocks: boolean
  stockError: string
  isSubmitting: boolean
  onRefreshStocks: () => Promise<void>
  onClose: () => void
  onSubmit: (
    payload: LowStockAlertPayload,
  ) => Promise<void>
}

export default function LowStockAlertFormModal({
  isOpen,
  alert,
  inventoryStocks,
  isLoadingStocks,
  stockError,
  isSubmitting,
  onRefreshStocks,
  onClose,
  onSubmit,
}: LowStockAlertFormModalProps) {
  const [inventoryStockId, setInventoryStockId] =
    useState('')

  const [severity, setSeverity] =
    useState('warning')

  const [message, setMessage] =
    useState('')

  const [notes, setNotes] =
    useState('')

  const [formError, setFormError] =
    useState('')

  const editing = Boolean(alert)

  const selectedStock = useMemo(
    () =>
      inventoryStocks.find(
        (stock) =>
          String(stock.id) ===
          String(inventoryStockId),
      ) ?? null,
    [inventoryStocks, inventoryStockId],
  )

  const selectableStocks = useMemo(
    () =>
      inventoryStocks
        .filter((stock) => !stock.deleted_at)
        .sort((first, second) =>
          getStockFoodName(first).localeCompare(
            getStockFoodName(second),
          ),
        ),
    [inventoryStocks],
  )

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const relatedStock =
      getAlertInventoryStock(alert ?? {
        id: '',
      })

    setInventoryStockId(
      alert?.inventory_stock_id !== undefined &&
      alert?.inventory_stock_id !== null
        ? String(alert.inventory_stock_id)
        : relatedStock
          ? String(relatedStock.id)
          : '',
    )

    setSeverity(
      alert
        ? getLowStockAlertSeverity(alert)
        : 'warning',
    )

    setMessage(
      alert
        ? getAlertMessage(alert)
        : '',
    )

    setNotes(alert?.notes ?? '')
    setFormError('')
  }, [isOpen, alert])

  useEffect(() => {
    if (
      !editing &&
      selectedStock
    ) {
      setSeverity(
        recommendStockSeverity(selectedStock),
      )
    }
  }, [editing, selectedStock])

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setFormError('')

    if (!inventoryStockId) {
      setFormError(
        'Please select an inventory stock record.',
      )
      return
    }

    if (!selectedStock && !editing) {
      setFormError(
        'The selected inventory stock could not be found.',
      )
      return
    }

    const defaultMessage = selectedStock
      ? `${getStockFoodName(selectedStock)} stock is below the configured threshold.`
      : 'Inventory quantity is below the configured threshold.'

    try {
      await onSubmit({
        inventory_stock_id:
          inventoryStockId,

        severity,

        message:
          message.trim() || defaultMessage,

        notes: notes.trim(),
      })
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Unable to save the low-stock alert.',
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
        aria-label="Close low-stock alert form"
        onClick={onClose}
        disabled={isSubmitting}
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="relative z-10 my-auto w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
            </span>

            <div>
              <h2 className="font-extrabold text-slate-950">
                {editing
                  ? 'Update Low-Stock Alert'
                  : 'Create Manual Alert'}
              </h2>

              <p className="text-xs text-slate-500">
                Select inventory stock instead of typing
                its ID.
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
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          {stockError && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              <p>{stockError}</p>

              <button
                type="button"
                onClick={() =>
                  void onRefreshStocks()
                }
                className="mt-2 font-bold underline"
              >
                Reload inventory stocks
              </button>
            </div>
          )}

          <div>
            <label
              htmlFor="alert-inventory-stock"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Inventory stock
            </label>

            {isLoadingStocks ? (
              <div className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-500">
                <LoaderCircle className="h-4 w-4 animate-spin text-indigo-600" />
                Loading inventory stocks...
              </div>
            ) : (
              <select
                id="alert-inventory-stock"
                value={inventoryStockId}
                onChange={(event) =>
                  setInventoryStockId(
                    event.target.value,
                  )
                }
                required
                disabled={
                  isSubmitting || editing
                }
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 disabled:opacity-60"
              >
                <option value="">
                  Select inventory stock
                </option>

                {selectableStocks.map(
                  (stock) => (
                    <option
                      key={stock.id}
                      value={String(stock.id)}
                    >
                      {getStockFoodName(stock)}
                      {' — '}
                      {formatLowStockQuantity(
                        getStockQuantity(stock),
                        getStockUnit(stock),
                      )}
                      {' / minimum '}
                      {formatLowStockQuantity(
                        getStockThreshold(stock),
                        getStockUnit(stock),
                      )}
                    </option>
                  ),
                )}
              </select>
            )}

            {editing && (
              <p className="mt-2 text-xs text-slate-400">
                The related inventory stock cannot be
                changed after alert creation.
              </p>
            )}
          </div>

          {selectedStock && (
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm">
                  <PackageSearch className="h-5 w-5" />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-slate-900">
                    {getStockFoodName(selectedStock)}
                  </p>

                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <StockValue
                      label="Current"
                      value={formatLowStockQuantity(
                        getStockQuantity(
                          selectedStock,
                        ),
                        getStockUnit(
                          selectedStock,
                        ),
                      )}
                    />

                    <StockValue
                      label="Minimum"
                      value={formatLowStockQuantity(
                        getStockThreshold(
                          selectedStock,
                        ),
                        getStockUnit(
                          selectedStock,
                        ),
                      )}
                    />

                    <StockValue
                      label="Shortage"
                      value={formatLowStockQuantity(
                        Math.max(
                          getStockThreshold(
                            selectedStock,
                          ) -
                          getStockQuantity(
                            selectedStock,
                          ),
                          0,
                        ),
                        getStockUnit(
                          selectedStock,
                        ),
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="alert-severity"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Severity
            </label>

            <select
              id="alert-severity"
              value={severity}
              onChange={(event) =>
                setSeverity(event.target.value)
              }
              required
              disabled={isSubmitting}
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            >
              <option value="critical">
                Critical
              </option>

              <option value="warning">
                Warning
              </option>

              <option value="low">
                Low
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="alert-message"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Alert message
            </label>

            <textarea
              id="alert-message"
              value={message}
              onChange={(event) =>
                setMessage(event.target.value)
              }
              rows={3}
              disabled={isSubmitting}
              placeholder="Generated automatically when left empty"
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label
              htmlFor="alert-notes"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Administrative notes
            </label>

            <textarea
              id="alert-notes"
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              rows={4}
              disabled={isSubmitting}
              placeholder="Optional purchasing or stock notes..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                isSubmitting ||
                isLoadingStocks ||
                !inventoryStockId
              }
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
                    ? 'Update Alert'
                    : 'Create Alert'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
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
