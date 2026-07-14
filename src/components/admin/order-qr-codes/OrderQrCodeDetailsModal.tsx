'use client'

import {
  CalendarDays,
  Copy,
  Hash,
  LoaderCircle,
  MapPin,
  QrCode,
  Smartphone,
  UserRound,
  X,
} from 'lucide-react'
import {
  formatOrderQrDate,
  getOrderQrImageUrl,
  getOrderQrToken,
  getQrOrderReference,
  getQrOrderUserEmail,
  getQrOrderUserName,
  orderQrCodeStatusLabel,
} from '@/lib/order-qr-code'
import type { OrderQrCode } from '@/types/order-qr-code'

interface OrderQrCodeDetailsModalProps {
  isOpen: boolean
  qrCode: OrderQrCode | null
  isLoading: boolean
  errorMessage: string
  onClose: () => void
}

export default function OrderQrCodeDetailsModal({
  isOpen,
  qrCode,
  isLoading,
  errorMessage,
  onClose,
}: OrderQrCodeDetailsModalProps) {
  if (!isOpen) {
    return null
  }

  async function copyToken() {
    if (!qrCode) {
      return
    }

    const token = getOrderQrToken(qrCode)

    if (token) {
      await navigator.clipboard.writeText(token)
    }
  }

  const imageUrl = qrCode
    ? getOrderQrImageUrl(qrCode)
    : null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4">
      <button
        type="button"
        aria-label="Close QR details"
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="relative z-10 my-auto w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="font-extrabold text-slate-950">
              Order QR Code Details
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              QR token, order and pickup information.
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

          {!isLoading && qrCode && (
            <div className="space-y-5">
              <div className="grid gap-5 md:grid-cols-[220px_1fr]">
                <div className="flex min-h-[220px] items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt="Order QR code"
                      className="h-full max-h-52 w-full object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <QrCode className="mx-auto h-20 w-20 text-indigo-200" />

                      <p className="mt-3 text-xs text-slate-400">
                        QR image not returned by backend.
                      </p>
                    </div>
                  )}
                </div>

                <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-blue-700 p-6 text-white">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                    {getQrOrderReference(qrCode)}
                  </p>

                  <h3 className="mt-2 text-2xl font-extrabold">
                    {getQrOrderUserName(qrCode)}
                  </h3>

                  <span className="mt-4 inline-flex rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">
                    {orderQrCodeStatusLabel(qrCode)}
                  </span>

                  <p className="mt-5 break-all rounded-2xl bg-white/10 p-3 font-mono text-xs leading-5">
                    {getOrderQrToken(qrCode) ||
                      'Token not returned'}
                  </p>

                  <button
                    type="button"
                    onClick={() => void copyToken()}
                    disabled={!getOrderQrToken(qrCode)}
                    className="mt-3 inline-flex h-9 items-center gap-2 rounded-xl bg-white px-3 text-xs font-bold text-indigo-700 disabled:opacity-50"
                  >
                    <Copy className="h-4 w-4" />
                    Copy Token
                  </button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  icon={Hash}
                  label="QR Record ID"
                  value={String(qrCode.id)}
                />

                <DetailItem
                  icon={Hash}
                  label="Order ID"
                  value={String(
                    qrCode.order_id ??
                      'Not available',
                  )}
                />

                <DetailItem
                  icon={UserRound}
                  label="Customer"
                  value={getQrOrderUserName(
                    qrCode,
                  )}
                />

                <DetailItem
                  icon={UserRound}
                  label="Customer Email"
                  value={getQrOrderUserEmail(
                    qrCode,
                  )}
                />

                <DetailItem
                  icon={CalendarDays}
                  label="Expires At"
                  value={formatOrderQrDate(
                    qrCode.expires_at,
                  )}
                />

                <DetailItem
                  icon={CalendarDays}
                  label="Used At"
                  value={formatOrderQrDate(
                    qrCode.used_at,
                  )}
                />

                <DetailItem
                  icon={Smartphone}
                  label="Device"
                  value={
                    [
                      qrCode.device_name,
                      qrCode.device_type,
                    ]
                      .filter(Boolean)
                      .join(' — ') ||
                    'Not available'
                  }
                />

                <DetailItem
                  icon={MapPin}
                  label="Pickup Location"
                  value={
                    qrCode.location ||
                    'Not available'
                  }
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Notes
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {qrCode.notes ||
                    'No notes were provided.'}
                </p>
              </div>

              {qrCode.cancellation_reason && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-red-500">
                    Cancellation Reason
                  </p>

                  <p className="mt-2 text-sm text-red-700">
                    {qrCode.cancellation_reason}
                  </p>
                </div>
              )}

              {qrCode.deleted_at && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                  Deleted on{' '}
                  {formatOrderQrDate(
                    qrCode.deleted_at,
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

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Hash
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
