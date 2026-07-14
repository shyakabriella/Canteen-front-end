'use client'

import {
  AlertTriangle,
  CalendarDays,
  Hash,
  LoaderCircle,
  PackageSearch,
  UserRound,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  formatLowStockDate,
  formatLowStockQuantity,
  getAlertCreatedBy,
  getAlertCurrentQuantity,
  getAlertDate,
  getAlertDismissalReason,
  getAlertDismissedBy,
  getAlertFoodName,
  getAlertInventoryStock,
  getAlertMessage,
  getAlertReference,
  getAlertResolutionNotes,
  getAlertResolvedBy,
  getAlertShortage,
  getAlertThreshold,
  getLowStockAlertSeverity,
  getLowStockAlertStatus,
  getStockUnit,
  lowStockSeverityLabel,
  lowStockStatusLabel,
} from '@/lib/low-stock-alert'
import type { LowStockAlert } from '@/types/low-stock-alert'

interface LowStockAlertDetailsModalProps {
  isOpen: boolean
  alert: LowStockAlert | null
  isLoading: boolean
  errorMessage: string
  onClose: () => void
}

export default function LowStockAlertDetailsModal({
  isOpen,
  alert,
  isLoading,
  errorMessage,
  onClose,
}: LowStockAlertDetailsModalProps) {
  if (!isOpen) {
    return null
  }

  const status = alert
    ? getLowStockAlertStatus(alert)
    : 'active'

  const severity = alert
    ? getLowStockAlertSeverity(alert)
    : 'warning'

  const stock = alert
    ? getAlertInventoryStock(alert)
    : null

  const unit = stock
    ? getStockUnit(stock)
    : 'units'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4">
      <button
        type="button"
        aria-label="Close alert details"
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="relative z-10 my-auto w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="font-extrabold text-slate-950">
              Low-Stock Alert Details
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Inventory quantities, threshold and alert
              activity.
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

          {!isLoading && alert && (
            <div className="space-y-5">
              <div
                className={`rounded-3xl p-6 text-white ${
                  status === 'resolved'
                    ? 'bg-gradient-to-br from-emerald-600 to-teal-700'
                    : status === 'dismissed'
                      ? 'bg-gradient-to-br from-slate-600 to-slate-800'
                      : severity === 'critical'
                        ? 'bg-gradient-to-br from-red-600 to-rose-700'
                        : 'bg-gradient-to-br from-amber-500 to-orange-700'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                      {getAlertReference(alert)}
                    </p>

                    <h3 className="mt-2 text-3xl font-extrabold">
                      {getAlertFoodName(alert)}
                    </h3>

                    <p className="mt-3 text-sm text-white/80">
                      {getAlertMessage(alert)}
                    </p>
                  </div>

                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                    <AlertTriangle className="h-6 w-6" />
                  </span>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">
                    {lowStockStatusLabel(alert)}
                  </span>

                  <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">
                    {lowStockSeverityLabel(alert)}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <QuantityCard
                  label="Current Quantity"
                  value={formatLowStockQuantity(
                    getAlertCurrentQuantity(alert),
                    unit,
                  )}
                />

                <QuantityCard
                  label="Minimum Threshold"
                  value={formatLowStockQuantity(
                    getAlertThreshold(alert),
                    unit,
                  )}
                />

                <QuantityCard
                  label="Shortage"
                  value={formatLowStockQuantity(
                    getAlertShortage(alert),
                    unit,
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  icon={Hash}
                  label="Alert ID"
                  value={String(alert.id)}
                />

                <DetailItem
                  icon={Hash}
                  label="Inventory Stock ID"
                  value={String(
                    alert.inventory_stock_id ??
                    stock?.id ??
                    'Not available',
                  )}
                />

                <DetailItem
                  icon={PackageSearch}
                  label="Food Item ID"
                  value={String(
                    alert.food_item_id ??
                    alert.food_item?.id ??
                    stock?.food_item_id ??
                    'Not available',
                  )}
                />

                <DetailItem
                  icon={CalendarDays}
                  label="Generated At"
                  value={formatLowStockDate(
                    getAlertDate(alert),
                  )}
                />

                <DetailItem
                  icon={UserRound}
                  label="Generated By"
                  value={getAlertCreatedBy(alert)}
                />

                <DetailItem
                  icon={CalendarDays}
                  label="Updated At"
                  value={formatLowStockDate(
                    alert.updated_at,
                  )}
                />
              </div>

              <TextBlock
                label="Administrative Notes"
                value={
                  alert.notes ||
                  'No administrative notes provided.'
                }
              />

              {status === 'resolved' && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                    Resolution
                  </p>

                  <p className="mt-2 text-sm text-emerald-800">
                    {getAlertResolutionNotes(alert)}
                  </p>

                  <p className="mt-3 text-xs text-emerald-600">
                    Resolved by:{' '}
                    {getAlertResolvedBy(alert)}
                    {' • '}
                    {formatLowStockDate(
                      alert.resolved_at,
                    )}
                  </p>
                </div>
              )}

              {status === 'dismissed' && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Dismissal
                  </p>

                  <p className="mt-2 text-sm text-slate-700">
                    {getAlertDismissalReason(alert)}
                  </p>

                  <p className="mt-3 text-xs text-slate-500">
                    Dismissed by:{' '}
                    {getAlertDismissedBy(alert)}
                    {' • '}
                    {formatLowStockDate(
                      alert.dismissed_at,
                    )}
                  </p>
                </div>
              )}

              {alert.deleted_at && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                  Deleted on{' '}
                  {formatLowStockDate(
                    alert.deleted_at,
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

function QuantityCard({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-indigo-500">
        {label}
      </p>

      <p className="mt-2 text-xl font-extrabold text-indigo-800">
        {value}
      </p>
    </div>
  )
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
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
