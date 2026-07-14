'use client'

import {
  CheckCircle2,
  Clock3,
  Eye,
  MapPin,
  MonitorSmartphone,
  RotateCcw,
  Trash2,
  XCircle,
} from 'lucide-react'
import {
  formatQrScanDate,
  getQrScanDate,
  getQrScanResult,
  getScanDevice,
  getScanMessage,
  getScannerName,
  getScanOrderReference,
  qrScanResultLabel,
} from '@/lib/qr-scan-log'
import type { QrScanLog } from '@/types/qr-scan-log'

interface QrScanLogTableProps {
  logs: QrScanLog[]
  processingId: number | string | null
  onView: (log: QrScanLog) => void
  onDelete: (log: QrScanLog) => void
  onRestore: (log: QrScanLog) => void
}

export default function QrScanLogTable({
  logs,
  processingId,
  onView,
  onDelete,
  onRestore,
}: QrScanLogTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1180px] text-left">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.14em] text-slate-400">
          <tr>
            <th className="px-6 py-4 font-extrabold">
              Scan
            </th>

            <th className="px-4 py-4 font-extrabold">
              Order
            </th>

            <th className="px-4 py-4 font-extrabold">
              Result
            </th>

            <th className="px-4 py-4 font-extrabold">
              Device
            </th>

            <th className="px-4 py-4 font-extrabold">
              Location
            </th>

            <th className="px-4 py-4 font-extrabold">
              Scanner
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
          {logs.map((log) => {
            const result = getQrScanResult(log)
            const deleted = Boolean(log.deleted_at)

            const processing =
              String(processingId) ===
              String(log.id)

            const ResultIcon =
              result === 'success'
                ? CheckCircle2
                : result === 'expired' ||
                    result === 'used'
                  ? Clock3
                  : XCircle

            return (
              <tr
                key={log.id}
                className={`text-sm transition hover:bg-slate-50 ${
                  deleted ? 'bg-red-50/30' : ''
                }`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                        result === 'success'
                          ? 'bg-emerald-50 text-emerald-600'
                          : result === 'expired' ||
                              result === 'used'
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-red-50 text-red-600'
                      }`}
                    >
                      <ResultIcon className="h-5 w-5" />
                    </span>

                    <div>
                      <p className="font-extrabold text-slate-900">
                        Scan #{log.id}
                      </p>

                      <p className="mt-1 max-w-[180px] truncate text-xs text-slate-400">
                        {getScanMessage(log)}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-4">
                  <p className="max-w-[180px] truncate font-bold text-slate-800">
                    {getScanOrderReference(log)}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    QR #{log.order_qr_code_id ??
                      log.qr_code_id ??
                      '—'}
                  </p>
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${
                      deleted
                        ? 'bg-red-50 text-red-700 ring-red-200'
                        : result === 'success'
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                          : result === 'expired' ||
                              result === 'used'
                            ? 'bg-amber-50 text-amber-700 ring-amber-200'
                            : 'bg-red-50 text-red-700 ring-red-200'
                    }`}
                  >
                    <ResultIcon className="h-3.5 w-3.5" />

                    {deleted
                      ? 'Deleted'
                      : qrScanResultLabel(log)}
                  </span>
                </td>

                <td className="px-4 py-4">
                  <div className="flex items-center gap-2 text-slate-600">
                    <MonitorSmartphone className="h-4 w-4 shrink-0 text-slate-400" />

                    <span className="max-w-[180px] truncate text-xs font-semibold">
                      {getScanDevice(log)}
                    </span>
                  </div>
                </td>

                <td className="px-4 py-4">
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="h-4 w-4 shrink-0 text-slate-400" />

                    <span className="max-w-[160px] truncate text-xs font-semibold">
                      {log.location ??
                        'Not available'}
                    </span>
                  </div>
                </td>

                <td className="px-4 py-4">
                  <p className="max-w-[150px] truncate text-xs font-bold text-slate-700">
                    {getScannerName(log)}
                  </p>
                </td>

                <td className="whitespace-nowrap px-4 py-4">
                  <p className="text-xs font-semibold text-slate-600">
                    {formatQrScanDate(
                      getQrScanDate(log),
                      false,
                    )}
                  </p>

                  <p className="mt-1 text-[11px] text-slate-400">
                    {formatQrScanDate(
                      getQrScanDate(log),
                    )}
                  </p>
                </td>

                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onView(log)}
                      title="View scan log"
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {!deleted && (
                      <button
                        type="button"
                        onClick={() => onDelete(log)}
                        disabled={processing}
                        title="Delete scan log"
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}

                    {deleted && (
                      <button
                        type="button"
                        onClick={() => onRestore(log)}
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
