'use client'

import {
  CheckCircle2,
  LoaderCircle,
  ScanLine,
  X,
  XCircle,
} from 'lucide-react'
import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'
import {
  getQrOrderReference,
  getQrOrderUserName,
  orderQrCodeStatusLabel,
} from '@/lib/order-qr-code'
import type {
  VerifyOrderQrCodePayload,
  VerifyOrderQrCodeResult,
} from '@/types/order-qr-code'

interface VerifyOrderQrCodeModalProps {
  isOpen: boolean
  isSubmitting: boolean
  result: VerifyOrderQrCodeResult | null
  onClose: () => void
  onSubmit: (
    payload: VerifyOrderQrCodePayload,
  ) => Promise<void>
}

export default function VerifyOrderQrCodeModal({
  isOpen,
  isSubmitting,
  result,
  onClose,
  onSubmit,
}: VerifyOrderQrCodeModalProps) {
  const [qrToken, setQrToken] = useState('')
  const [deviceName, setDeviceName] =
    useState('Staff Phone')
  const [deviceType, setDeviceType] =
    useState('android')
  const [location, setLocation] =
    useState('Main Canteen')
  const [formError, setFormError] =
    useState('')

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setQrToken('')
    setDeviceName('Staff Phone')
    setDeviceType('android')
    setLocation('Main Canteen')
    setFormError('')
  }, [isOpen])

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setFormError('')

    if (!qrToken.trim()) {
      setFormError(
        'Please scan or paste the QR token.',
      )
      return
    }

    if (
      !deviceName.trim() ||
      !deviceType.trim() ||
      !location.trim()
    ) {
      setFormError(
        'Device and location information is required.',
      )
      return
    }

    try {
      await onSubmit({
        qr_token: qrToken.trim(),
        device_name: deviceName.trim(),
        device_type: deviceType.trim(),
        location: location.trim(),
      })
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Unable to verify the QR code.',
      )
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto p-4">
      <button
        type="button"
        aria-label="Close QR verification"
        onClick={onClose}
        disabled={isSubmitting}
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="relative z-10 my-auto w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <ScanLine className="h-5 w-5" />
            </span>

            <div>
              <h2 className="font-extrabold text-slate-950">
                Verify Order QR Code
              </h2>

              <p className="text-xs text-slate-500">
                Scan or paste the customer QR token.
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

          {result && (
            <div
              className={`rounded-2xl border p-4 ${
                result.valid
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-start gap-3">
                {result.valid ? (
                  <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" />
                ) : (
                  <XCircle className="h-6 w-6 shrink-0 text-red-600" />
                )}

                <div>
                  <p
                    className={`font-extrabold ${
                      result.valid
                        ? 'text-emerald-800'
                        : 'text-red-800'
                    }`}
                  >
                    {result.valid
                      ? 'Valid QR Code'
                      : 'Invalid QR Code'}
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    {result.message}
                  </p>

                  {result.qrCode && (
                    <div className="mt-3 space-y-1 text-xs text-slate-600">
                      <p>
                        Order:{' '}
                        <strong>
                          {getQrOrderReference(
                            result.qrCode,
                          )}
                        </strong>
                      </p>

                      <p>
                        Customer:{' '}
                        <strong>
                          {getQrOrderUserName(
                            result.qrCode,
                          )}
                        </strong>
                      </p>

                      <p>
                        Status:{' '}
                        <strong>
                          {orderQrCodeStatusLabel(
                            result.qrCode,
                          )}
                        </strong>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="verify-qr-token"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              QR token
            </label>

            <textarea
              id="verify-qr-token"
              value={qrToken}
              onChange={(event) =>
                setQrToken(event.target.value)
              }
              rows={4}
              required
              disabled={isSubmitting}
              placeholder="PASTE_QR_TOKEN_HERE"
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="verify-device-name"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                Device name
              </label>

              <input
                id="verify-device-name"
                value={deviceName}
                onChange={(event) =>
                  setDeviceName(event.target.value)
                }
                required
                disabled={isSubmitting}
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label
                htmlFor="verify-device-type"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                Device type
              </label>

              <select
                id="verify-device-type"
                value={deviceType}
                onChange={(event) =>
                  setDeviceType(event.target.value)
                }
                required
                disabled={isSubmitting}
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              >
                <option value="android">
                  Android
                </option>
                <option value="ios">iOS</option>
                <option value="web">Web</option>
                <option value="scanner">
                  QR Scanner
                </option>
                <option value="other">
                  Other
                </option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="verify-location"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Location
            </label>

            <input
              id="verify-location"
              value={location}
              onChange={(event) =>
                setLocation(event.target.value)
              }
              required
              disabled={isSubmitting}
              placeholder="Main Canteen"
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
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
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <ScanLine className="h-4 w-4" />
                  Verify QR Code
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
