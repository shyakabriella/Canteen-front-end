'use client'

import {
  CalendarDays,
  Hash,
  LoaderCircle,
  MapPin,
  PackageCheck,
  QrCode,
  Smartphone,
  UserRound,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  formatPickupAmount,
  formatPickupDate,
  getPickupCancellationReason,
  getPickupConfirmerEmail,
  getPickupConfirmerName,
  getPickupCoordinates,
  getPickupCustomerEmail,
  getPickupCustomerName,
  getPickupDate,
  getPickupDevice,
  getPickupMethod,
  getPickupNotes,
  getPickupOrderAmount,
  getPickupOrderReference,
  getPickupQrCode,
  getPickupStatus,
  pickupMethodLabel,
  pickupStatusLabel,
} from '@/lib/pickup-confirmation'
import {
  getOrderQrToken,
} from '@/lib/order-qr-code'
import type { PickupConfirmation } from '@/types/pickup-confirmation'

interface PickupConfirmationDetailsModalProps {
  isOpen: boolean
  confirmation: PickupConfirmation | null
  isLoading: boolean
  errorMessage: string
  onClose: () => void
}

export default function PickupConfirmationDetailsModal({
  isOpen,
  confirmation,
  isLoading,
  errorMessage,
  onClose,
}: PickupConfirmationDetailsModalProps) {
  if (!isOpen) {
    return null
  }

  const status = confirmation
    ? getPickupStatus(confirmation)
    : 'confirmed'

  const qrCode = confirmation
    ? getPickupQrCode(confirmation)
    : null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4">
      <button
        type="button"
        aria-label="Close pickup details"
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="relative z-10 my-auto w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="font-extrabold text-slate-950">
              Pickup Confirmation Details
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Customer, order, staff, device and pickup
              information.
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
                  Loading pickup confirmation...
                </p>
              </div>
            </div>
          )}

          {!isLoading && errorMessage && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {!isLoading && confirmation && (
            <div className="space-y-5">
              <div
                className={`rounded-3xl p-6 text-white ${
                  status === 'cancelled'
                    ? 'bg-gradient-to-br from-red-600 to-rose-700'
                    : 'bg-gradient-to-br from-emerald-600 to-teal-700'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                      {getPickupOrderReference(
                        confirmation,
                      )}
                    </p>

                    <h3 className="mt-2 text-3xl font-extrabold">
                      {pickupStatusLabel(
                        confirmation,
                      )}
                    </h3>

                    <p className="mt-3 text-sm text-white/80">
                      {getPickupCustomerName(
                        confirmation,
                      )}
                    </p>

                    <p className="mt-1 text-lg font-extrabold">
                      {formatPickupAmount(
                        getPickupOrderAmount(
                          confirmation,
                        ),
                      )}
                    </p>
                  </div>

                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                    <PackageCheck className="h-6 w-6" />
                  </span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  icon={Hash}
                  label="Confirmation ID"
                  value={String(confirmation.id)}
                />

                <DetailItem
                  icon={Hash}
                  label="Order ID"
                  value={String(
                    confirmation.order_id ??
                      'Not available',
                  )}
                />

                <DetailItem
                  icon={UserRound}
                  label="Customer"
                  value={getPickupCustomerName(
                    confirmation,
                  )}
                />

                <DetailItem
                  icon={UserRound}
                  label="Customer Email"
                  value={getPickupCustomerEmail(
                    confirmation,
                  )}
                />

                <DetailItem
                  icon={CalendarDays}
                  label="Pickup Date"
                  value={formatPickupDate(
                    getPickupDate(confirmation),
                  )}
                />

                <DetailItem
                  icon={
                    getPickupMethod(
                      confirmation,
                    ) === 'qr'
                      ? QrCode
                      : PackageCheck
                  }
                  label="Confirmation Method"
                  value={pickupMethodLabel(
                    confirmation,
                  )}
                />

                <DetailItem
                  icon={UserRound}
                  label="Confirmed By"
                  value={getPickupConfirmerName(
                    confirmation,
                  )}
                />

                <DetailItem
                  icon={UserRound}
                  label="Staff Email"
                  value={getPickupConfirmerEmail(
                    confirmation,
                  )}
                />

                <DetailItem
                  icon={Smartphone}
                  label="Device"
                  value={getPickupDevice(
                    confirmation,
                  )}
                />

                <DetailItem
                  icon={MapPin}
                  label="Location"
                  value={
                    confirmation.location ??
                    'Location not available'
                  }
                />

                <DetailItem
                  icon={MapPin}
                  label="Coordinates"
                  value={getPickupCoordinates(
                    confirmation,
                  )}
                />

                <DetailItem
                  icon={QrCode}
                  label="QR Code ID"
                  value={String(
                    confirmation.order_qr_code_id ??
                      confirmation.qr_code_id ??
                      'Not linked',
                  )}
                />
              </div>

              {qrCode &&
                getOrderQrToken(qrCode) && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Related QR Token
                    </p>

                    <p className="mt-2 break-all font-mono text-xs leading-5 text-slate-700">
                      {getOrderQrToken(qrCode)}
                    </p>
                  </div>
                )}

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Pickup Notes
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {getPickupNotes(confirmation) ||
                    'No pickup notes were provided.'}
                </p>
              </div>

              {status === 'cancelled' && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-red-500">
                    Cancellation Reason
                  </p>

                  <p className="mt-2 text-sm text-red-700">
                    {getPickupCancellationReason(
                      confirmation,
                    )}
                  </p>

                  {confirmation.cancelled_at && (
                    <p className="mt-2 text-xs text-red-500">
                      Cancelled at:{' '}
                      {formatPickupDate(
                        confirmation.cancelled_at,
                      )}
                    </p>
                  )}
                </div>
              )}

              {confirmation.deleted_at && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                  Deleted on{' '}
                  {formatPickupDate(
                    confirmation.deleted_at,
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
