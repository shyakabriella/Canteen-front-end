'use client'

import {
  Ban,
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
  getQrOrderReference,
  getQrOrderUserName,
  toApiDateTime,
} from '@/lib/order-qr-code'
import type {
  CancelOrderQrCodePayload,
  MarkOrderQrCodeUsedPayload,
  OrderQrCode,
  RegenerateOrderQrCodePayload,
} from '@/types/order-qr-code'

export type OrderQrActionType =
  | 'mark-used'
  | 'regenerate'
  | 'cancel'

type ActionPayload =
  | MarkOrderQrCodeUsedPayload
  | RegenerateOrderQrCodePayload
  | CancelOrderQrCodePayload

interface OrderQrCodeActionModalProps {
  isOpen: boolean
  type: OrderQrActionType
  qrCode: OrderQrCode | null
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (
    payload: ActionPayload,
  ) => Promise<void>
}

export default function OrderQrCodeActionModal({
  isOpen,
  type,
  qrCode,
  isSubmitting,
  onClose,
  onSubmit,
}: OrderQrCodeActionModalProps) {
  const [deviceName, setDeviceName] =
    useState('Staff Phone')
  const [deviceType, setDeviceType] =
    useState('android')
  const [location, setLocation] =
    useState('Main Canteen Pickup Point')
  const [expiresAt, setExpiresAt] =
    useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] =
    useState('')

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setDeviceName('Staff Phone')
    setDeviceType('android')
    setLocation(
      'Main Canteen Pickup Point',
    )
    setExpiresAt('')
    setReason('')
    setNotes('')
    setFormError('')
  }, [isOpen, type, qrCode])

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setFormError('')

    try {
      if (type === 'mark-used') {
        if (
          !deviceName.trim() ||
          !deviceType.trim() ||
          !location.trim()
        ) {
          setFormError(
            'Device and pickup location are required.',
          )
          return
        }

        await onSubmit({
          device_name: deviceName.trim(),
          device_type: deviceType.trim(),
          location: location.trim(),
          notes: notes.trim(),
        })

        return
      }

      if (type === 'regenerate') {
        if (!expiresAt) {
          setFormError(
            'A new expiration date is required.',
          )
          return
        }

        if (
          new Date(expiresAt).getTime() <=
          Date.now()
        ) {
          setFormError(
            'The expiration date must be in the future.',
          )
          return
        }

        await onSubmit({
          expires_at:
            toApiDateTime(expiresAt),
          notes: notes.trim(),
        })

        return
      }

      if (!reason.trim()) {
        setFormError(
          'A cancellation reason is required.',
        )
        return
      }

      await onSubmit({
        reason: reason.trim(),
        notes: notes.trim(),
      })
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Unable to process the QR code.',
      )
    }
  }

  if (!isOpen || !qrCode) {
    return null
  }

  const config = {
    'mark-used': {
      title: 'Mark QR Code Used',
      description:
        'Confirm that the customer collected the food.',
      icon: CheckCircle2,
      button: 'Confirm Pickup',
      buttonClass:
        'bg-emerald-600 hover:bg-emerald-700',
      iconClass:
        'bg-emerald-50 text-emerald-600',
    },

    regenerate: {
      title: 'Regenerate QR Code',
      description:
        'Create a new secure token and expiration date.',
      icon: RefreshCw,
      button: 'Regenerate QR',
      buttonClass:
        'bg-indigo-600 hover:bg-indigo-700',
      iconClass:
        'bg-indigo-50 text-indigo-600',
    },

    cancel: {
      title: 'Cancel QR Code',
      description:
        'Prevent this QR code from being used.',
      icon: Ban,
      button: 'Cancel QR Code',
      buttonClass:
        'bg-red-600 hover:bg-red-700',
      iconClass:
        'bg-red-50 text-red-600',
    },
  }[type]

  const Icon = config.icon

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto p-4">
      <button
        type="button"
        aria-label="Close QR action"
        onClick={onClose}
        disabled={isSubmitting}
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="relative z-10 my-auto w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-2xl ${config.iconClass}`}
            >
              <Icon className="h-5 w-5" />
            </span>

            <div>
              <h2 className="font-extrabold text-slate-950">
                {config.title}
              </h2>

              <p className="text-xs text-slate-500">
                {getQrOrderReference(qrCode)}
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
          className="space-y-5 p-6"
        >
          {formError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="font-extrabold text-slate-900">
              {getQrOrderUserName(qrCode)}
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              {config.description}
            </p>
          </div>

          {type === 'mark-used' && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="used-device-name"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Device name
                  </label>

                  <input
                    id="used-device-name"
                    value={deviceName}
                    onChange={(event) =>
                      setDeviceName(
                        event.target.value,
                      )
                    }
                    required
                    disabled={isSubmitting}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="used-device-type"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Device type
                  </label>

                  <select
                    id="used-device-type"
                    value={deviceType}
                    onChange={(event) =>
                      setDeviceType(
                        event.target.value,
                      )
                    }
                    required
                    disabled={isSubmitting}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                  >
                    <option value="android">
                      Android
                    </option>
                    <option value="ios">
                      iOS
                    </option>
                    <option value="scanner">
                      QR Scanner
                    </option>
                    <option value="web">
                      Web
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="pickup-location"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Pickup location
                </label>

                <input
                  id="pickup-location"
                  value={location}
                  onChange={(event) =>
                    setLocation(event.target.value)
                  }
                  required
                  disabled={isSubmitting}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                />
              </div>
            </>
          )}

          {type === 'regenerate' && (
            <div>
              <label
                htmlFor="regenerate-expiry"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                New expiration date
              </label>

              <input
                id="regenerate-expiry"
                type="datetime-local"
                value={expiresAt}
                onChange={(event) =>
                  setExpiresAt(
                    event.target.value,
                  )
                }
                required
                disabled={isSubmitting}
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              />
            </div>
          )}

          {type === 'cancel' && (
            <div>
              <label
                htmlFor="qr-cancel-reason"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                Cancellation reason
              </label>

              <input
                id="qr-cancel-reason"
                value={reason}
                onChange={(event) =>
                  setReason(event.target.value)
                }
                required
                disabled={isSubmitting}
                placeholder="Explain why this QR code is cancelled"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="qr-action-notes"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Notes
            </label>

            <textarea
              id="qr-action-notes"
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              rows={3}
              disabled={isSubmitting}
              placeholder={
                type === 'mark-used'
                  ? 'Food collected by customer'
                  : type === 'regenerate'
                    ? 'QR regenerated for customer'
                    : 'Optional cancellation notes'
              }
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-600"
            >
              Close
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-white disabled:opacity-50 ${config.buttonClass}`}
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Icon className="h-4 w-4" />
                  {config.button}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
