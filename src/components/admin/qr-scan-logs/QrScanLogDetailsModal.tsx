'use client'

import {
  CalendarDays,
  Copy,
  Globe2,
  Hash,
  LoaderCircle,
  MapPin,
  MonitorSmartphone,
  ScanLine,
  UserRound,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  formatQrScanDate,
  getQrScanDate,
  getQrScanResult,
  getScanCoordinates,
  getScanCustomerEmail,
  getScanCustomerName,
  getScanDevice,
  getScanMessage,
  getScannerEmail,
  getScannerName,
  getScanOrderReference,
  getScanToken,
  qrScanResultLabel,
} from '@/lib/qr-scan-log'
import type { QrScanLog } from '@/types/qr-scan-log'

interface QrScanLogDetailsModalProps {
  isOpen: boolean
  log: QrScanLog | null
  isLoading: boolean
  errorMessage: string
  onClose: () => void
}

export default function QrScanLogDetailsModal({
  isOpen,
  log,
  isLoading,
  errorMessage,
  onClose,
}: QrScanLogDetailsModalProps) {
  if (!isOpen) {
    return null
  }

  const result = log
    ? getQrScanResult(log)
    : 'failed'

  async function copyToken() {
    if (!log) {
      return
    }

    const token = getScanToken(log)

    if (token) {
      await navigator.clipboard.writeText(token)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4">
      <button
        type="button"
        aria-label="Close QR scan details"
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="relative z-10 my-auto w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="font-extrabold text-slate-950">
              QR Scan Log Details
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Device, location, QR and scan result information.
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
              <div className="text-center">
                <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-indigo-600" />

                <p className="mt-3 text-sm text-slate-500">
                  Loading scan log...
                </p>
              </div>
            </div>
          )}

          {!isLoading && errorMessage && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {!isLoading && log && (
            <div className="space-y-5">
              <div
                className={`rounded-3xl p-6 text-white ${
                  result === 'success'
                    ? 'bg-gradient-to-br from-emerald-600 to-teal-700'
                    : result === 'expired' ||
                        result === 'used'
                      ? 'bg-gradient-to-br from-amber-600 to-orange-700'
                      : 'bg-gradient-to-br from-red-600 to-rose-700'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                      QR Scan #{log.id}
                    </p>

                    <h3 className="mt-2 text-3xl font-extrabold">
                      {qrScanResultLabel(log)}
                    </h3>

                    <p className="mt-3 text-sm text-white/80">
                      {getScanOrderReference(log)}
                    </p>
                  </div>

                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                    <ScanLine className="h-6 w-6" />
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Scanned QR Token
                    </p>

                    <p className="mt-2 break-all font-mono text-xs leading-5 text-slate-700">
                      {getScanToken(log) ||
                        'Token not available'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void copyToken()}
                    disabled={!getScanToken(log)}
                    className="flex h-9 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-indigo-600 disabled:opacity-50"
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  icon={Hash}
                  label="Scan Log ID"
                  value={String(log.id)}
                />

                <DetailItem
                  icon={Hash}
                  label="QR Code ID"
                  value={String(
                    log.order_qr_code_id ??
                      log.qr_code_id ??
                      'Not available',
                  )}
                />

                <DetailItem
                  icon={CalendarDays}
                  label="Scanned At"
                  value={formatQrScanDate(
                    getQrScanDate(log),
                  )}
                />

                <DetailItem
                  icon={MonitorSmartphone}
                  label="Device"
                  value={getScanDevice(log)}
                />

                <DetailItem
                  icon={MapPin}
                  label="Location"
                  value={
                    log.location ??
                    'Location not available'
                  }
                />

                <DetailItem
                  icon={MapPin}
                  label="Coordinates"
                  value={getScanCoordinates(log)}
                />

                <DetailItem
                  icon={Globe2}
                  label="IP Address"
                  value={
                    log.ip_address ??
                    'IP address not available'
                  }
                />

                <DetailItem
                  icon={UserRound}
                  label="Scanned By"
                  value={getScannerName(log)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  icon={UserRound}
                  label="Scanner Email"
                  value={getScannerEmail(log)}
                />

                <DetailItem
                  icon={UserRound}
                  label="Customer"
                  value={getScanCustomerName(log)}
                />

                <DetailItem
                  icon={UserRound}
                  label="Customer Email"
                  value={getScanCustomerEmail(log)}
                />

                <DetailItem
                  icon={Hash}
                  label="Order"
                  value={getScanOrderReference(log)}
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Result Message
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {getScanMessage(log)}
                </p>
              </div>

              {log.user_agent && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    User Agent
                  </p>

                  <p className="mt-2 break-all font-mono text-xs leading-5 text-slate-600">
                    {log.user_agent}
                  </p>
                </div>
              )}

              {log.deleted_at && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                  Deleted on{' '}
                  {formatQrScanDate(log.deleted_at)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
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
