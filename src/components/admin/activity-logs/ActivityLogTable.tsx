'use client'

import {
  Eye,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import {
  activityLogStatusLabel,
  formatActivityLogAction,
  formatActivityLogDate,
  getActivityLogAction,
  getActivityLogActorName,
  getActivityLogDate,
  getActivityLogDescription,
  getActivityLogModule,
  getActivityLogReference,
  getActivityLogStatus,
} from '@/lib/activity-log'
import type { ActivityLog } from '@/types/activity-log'

interface Props {
  logs: ActivityLog[]
  processingId: number | string | null
  onView: (log: ActivityLog) => void
  onDelete: (log: ActivityLog) => void
  onRestore: (log: ActivityLog) => void
}

export default function ActivityLogTable({
  logs,
  processingId,
  onView,
  onDelete,
  onRestore,
}: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1150px] text-left">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.14em] text-slate-400">
          <tr>
            <th className="px-6 py-4">
              Activity
            </th>

            <th className="px-4 py-4">
              Module
            </th>

            <th className="px-4 py-4">
              Actor
            </th>

            <th className="px-4 py-4">
              Description
            </th>

            <th className="px-4 py-4">
              Status
            </th>

            <th className="px-4 py-4">
              Date
            </th>

            <th className="px-6 py-4 text-right">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {logs.map((log) => {
            const status =
              getActivityLogStatus(log)

            const deleted = Boolean(
              log.deleted_at,
            )

            const processing =
              String(processingId) ===
              String(log.id)

            return (
              <tr
                key={log.id}
                className={`text-sm hover:bg-slate-50 ${
                  deleted
                    ? 'bg-red-50/30'
                    : ''
                }`}
              >
                <td className="px-6 py-4">
                  <p className="font-extrabold text-slate-900">
                    {formatActivityLogAction(
                      getActivityLogAction(log),
                    )}
                  </p>

                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    {getActivityLogReference(log)}
                  </p>
                </td>

                <td className="px-4 py-4">
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                    {getActivityLogModule(log)}
                  </span>
                </td>

                <td className="px-4 py-4 font-bold text-slate-700">
                  {getActivityLogActorName(log)}
                </td>

                <td className="px-4 py-4">
                  <p className="max-w-[300px] truncate text-slate-600">
                    {getActivityLogDescription(log)}
                  </p>
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      deleted
                        ? 'bg-red-50 text-red-700'
                        : status === 'success'
                          ? 'bg-emerald-50 text-emerald-700'
                          : status === 'failed'
                            ? 'bg-red-50 text-red-700'
                            : status === 'warning'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {deleted
                      ? 'Deleted'
                      : activityLogStatusLabel(log)}
                  </span>
                </td>

                <td className="whitespace-nowrap px-4 py-4 text-xs font-semibold text-slate-600">
                  {formatActivityLogDate(
                    getActivityLogDate(log),
                  )}
                </td>

                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      title="View log"
                      onClick={() => onView(log)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {!deleted && (
                      <button
                        type="button"
                        title="Delete log"
                        onClick={() =>
                          onDelete(log)
                        }
                        disabled={processing}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 text-red-600 disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}

                    {deleted && (
                      <button
                        type="button"
                        onClick={() =>
                          onRestore(log)
                        }
                        disabled={processing}
                        className="flex h-9 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 disabled:opacity-40"
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
