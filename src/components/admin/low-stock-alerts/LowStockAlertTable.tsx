'use client'

import {
  CheckCircle2,
  Eye,
  EyeOff,
  Pencil,
  RotateCcw,
  Trash2,
  TriangleAlert,
} from 'lucide-react'
import {
  canDismissLowStockAlert,
  canResolveLowStockAlert,
  formatLowStockDate,
  formatLowStockQuantity,
  getAlertCurrentQuantity,
  getAlertDate,
  getAlertFoodName,
  getAlertInventoryStock,
  getAlertReference,
  getAlertShortage,
  getAlertThreshold,
  getLowStockAlertSeverity,
  getLowStockAlertStatus,
  getStockUnit,
  lowStockSeverityLabel,
  lowStockStatusLabel,
} from '@/lib/low-stock-alert'
import type { LowStockAlert } from '@/types/low-stock-alert'

interface LowStockAlertTableProps {
  alerts: LowStockAlert[]
  processingId: number | string | null
  onView: (alert: LowStockAlert) => void
  onEdit: (alert: LowStockAlert) => void
  onResolve: (alert: LowStockAlert) => void
  onDismiss: (alert: LowStockAlert) => void
  onDelete: (alert: LowStockAlert) => void
  onRestore: (alert: LowStockAlert) => void
}

export default function LowStockAlertTable({
  alerts,
  processingId,
  onView,
  onEdit,
  onResolve,
  onDismiss,
  onDelete,
  onRestore,
}: LowStockAlertTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1200px] text-left">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.14em] text-slate-400">
          <tr>
            <th className="px-6 py-4 font-extrabold">
              Alert
            </th>

            <th className="px-4 py-4 font-extrabold">
              Current Stock
            </th>

            <th className="px-4 py-4 font-extrabold">
              Threshold
            </th>

            <th className="px-4 py-4 font-extrabold">
              Shortage
            </th>

            <th className="px-4 py-4 font-extrabold">
              Severity
            </th>

            <th className="px-4 py-4 font-extrabold">
              Status
            </th>

            <th className="px-4 py-4 font-extrabold">
              Generated
            </th>

            <th className="px-6 py-4 text-right font-extrabold">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {alerts.map((alert) => {
            const status =
              getLowStockAlertStatus(alert)

            const severity =
              getLowStockAlertSeverity(alert)

            const stock =
              getAlertInventoryStock(alert)

            const unit = stock
              ? getStockUnit(stock)
              : 'units'

            const deleted = Boolean(
              alert.deleted_at,
            )

            const processing =
              String(processingId) ===
              String(alert.id)

            return (
              <tr
                key={alert.id}
                className={`text-sm transition hover:bg-slate-50 ${
                  deleted
                    ? 'bg-red-50/30'
                    : ''
                }`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                        severity === 'critical'
                          ? 'bg-red-50 text-red-600'
                          : severity === 'warning'
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-blue-50 text-blue-600'
                      }`}
                    >
                      <TriangleAlert className="h-5 w-5" />
                    </span>

                    <div className="min-w-0">
                      <p className="max-w-[220px] truncate font-extrabold text-slate-900">
                        {getAlertFoodName(alert)}
                      </p>

                      <p className="mt-1 text-xs font-semibold text-slate-400">
                        {getAlertReference(alert)}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="whitespace-nowrap px-4 py-4 font-extrabold text-slate-900">
                  {formatLowStockQuantity(
                    getAlertCurrentQuantity(alert),
                    unit,
                  )}
                </td>

                <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                  {formatLowStockQuantity(
                    getAlertThreshold(alert),
                    unit,
                  )}
                </td>

                <td className="whitespace-nowrap px-4 py-4 font-extrabold text-red-600">
                  {formatLowStockQuantity(
                    getAlertShortage(alert),
                    unit,
                  )}
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${
                      severity === 'critical'
                        ? 'bg-red-50 text-red-700 ring-red-200'
                        : severity === 'warning'
                          ? 'bg-amber-50 text-amber-700 ring-amber-200'
                          : 'bg-blue-50 text-blue-700 ring-blue-200'
                    }`}
                  >
                    {lowStockSeverityLabel(alert)}
                  </span>
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${
                      deleted
                        ? 'bg-red-50 text-red-700 ring-red-200'
                        : status === 'resolved'
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                          : status === 'dismissed'
                            ? 'bg-slate-100 text-slate-700 ring-slate-200'
                            : 'bg-indigo-50 text-indigo-700 ring-indigo-200'
                    }`}
                  >
                    {deleted
                      ? 'Deleted'
                      : lowStockStatusLabel(alert)}
                  </span>
                </td>

                <td className="whitespace-nowrap px-4 py-4 text-xs font-semibold text-slate-600">
                  {formatLowStockDate(
                    getAlertDate(alert),
                    false,
                  )}
                </td>

                <td className="px-6 py-4">
                  <div className="flex flex-wrap justify-end gap-2">
                    <ActionButton
                      title="View alert"
                      icon={Eye}
                      onClick={() => onView(alert)}
                    />

                    {!deleted &&
                      status === 'active' && (
                        <ActionButton
                          title="Update alert"
                          icon={Pencil}
                          onClick={() =>
                            onEdit(alert)
                          }
                          className="border-blue-200 text-blue-600"
                        />
                      )}

                    {canResolveLowStockAlert(
                      alert,
                    ) && (
                      <ActionButton
                        title="Resolve alert"
                        icon={CheckCircle2}
                        onClick={() =>
                          onResolve(alert)
                        }
                        className="border-emerald-200 bg-emerald-50 text-emerald-600"
                      />
                    )}

                    {canDismissLowStockAlert(
                      alert,
                    ) && (
                      <ActionButton
                        title="Dismiss alert"
                        icon={EyeOff}
                        onClick={() =>
                          onDismiss(alert)
                        }
                        className="border-slate-200 bg-slate-50 text-slate-600"
                      />
                    )}

                    {!deleted && (
                      <ActionButton
                        title="Delete alert"
                        icon={Trash2}
                        onClick={() =>
                          onDelete(alert)
                        }
                        disabled={processing}
                        className="border-red-200 text-red-600"
                      />
                    )}

                    {deleted && (
                      <button
                        type="button"
                        onClick={() =>
                          onRestore(alert)
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

function ActionButton({
  title,
  icon: Icon,
  onClick,
  className = 'border-slate-200 text-slate-500',
  disabled = false,
}: {
  title: string
  icon: typeof Eye
  onClick: () => void
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
