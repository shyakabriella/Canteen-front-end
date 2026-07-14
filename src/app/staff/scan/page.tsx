'use client'

import {
  CheckCircle2,
  LoaderCircle,
  QrCode,
  RefreshCw,
  ScanLine,
  XCircle,
} from 'lucide-react'
import {
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { apiRequest } from '@/lib/api'

type UnknownRecord = Record<string, unknown>

interface VerificationResult {
  valid: boolean | null
  message: string
  orderReference: string
  customerName: string
  orderStatus: string
}

function asRecord(
  value: unknown,
): UnknownRecord | null {
  if (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  ) {
    return value as UnknownRecord
  }

  return null
}

function stringValue(
  ...values: unknown[]
): string {
  for (const value of values) {
    if (
      typeof value === 'string' &&
      value.trim()
    ) {
      return value.trim()
    }

    if (
      typeof value === 'number' &&
      Number.isFinite(value)
    ) {
      return String(value)
    }
  }

  return ''
}

function booleanValue(
  value: unknown,
): boolean | null {
  if (value === true || value === 1 || value === '1') {
    return true
  }

  if (value === false || value === 0 || value === '0') {
    return false
  }

  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()

  if (
    [
      'true',
      'valid',
      'success',
      'verified',
      'active',
    ].includes(normalized)
  ) {
    return true
  }

  if (
    [
      'false',
      'invalid',
      'failed',
      'expired',
      'cancelled',
      'canceled',
    ].includes(normalized)
  ) {
    return false
  }

  return null
}

function parseVerificationResult(
  payload: unknown,
): VerificationResult {
  const root = asRecord(payload) ?? {}
  const data = asRecord(root.data) ?? root

  const qrCode =
    asRecord(data.order_qr_code) ??
    asRecord(data.orderQrCode) ??
    asRecord(data.qr_code) ??
    asRecord(data.qrCode) ??
    {}

  const order =
    asRecord(data.order) ??
    asRecord(qrCode.order) ??
    {}

  const user =
    asRecord(order.user) ??
    asRecord(order.customer) ??
    asRecord(data.user) ??
    asRecord(data.customer) ??
    {}

  const valid = booleanValue(
    data.valid ??
    data.is_valid ??
    data.verified ??
    root.success,
  )

  return {
    valid,

    message:
      stringValue(
        root.message,
        data.message,
      ) ||
      (
        valid === false
          ? 'This QR code is invalid or cannot be used.'
          : 'QR code verified successfully.'
      ),

    orderReference:
      stringValue(
        order.order_number,
        order.reference,
        order.code,
        order.id,
      ) || 'Not available',

    customerName:
      stringValue(
        user.name,
        user.full_name,
        user.email,
      ) || 'Not available',

    orderStatus:
      stringValue(
        order.status,
        data.order_status,
      ) || 'Not available',
  }
}

export default function StaffQrScannerPage() {
  const inputRef =
    useRef<HTMLInputElement>(null)

  const [qrToken, setQrToken] =
    useState('')

  const [deviceName, setDeviceName] =
    useState('Staff Web Scanner')

  const [location, setLocation] =
    useState('Main Canteen Pickup Point')

  const [isSubmitting, setIsSubmitting] =
    useState(false)

  const [errorMessage, setErrorMessage] =
    useState('')

  const [result, setResult] =
    useState<VerificationResult | null>(null)

  async function handleVerify(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    const token = qrToken.trim()

    if (!token) {
      setErrorMessage(
        'Please scan or enter the QR token.',
      )
      inputRef.current?.focus()
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')
    setResult(null)

    try {
      const response = await apiRequest<unknown>(
        '/order-qr-codes/verify',
        {
          method: 'POST',
          auth: true,
          body: {
            qr_token: token,
            token,

            device_name:
              deviceName.trim() ||
              'Staff Web Scanner',

            device_type: 'web',

            location:
              location.trim() || null,
          },
        },
      )

      setResult(
        parseVerificationResult(response),
      )
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to verify the QR code.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  function resetScanner() {
    setQrToken('')
    setResult(null)
    setErrorMessage('')

    window.setTimeout(() => {
      inputRef.current?.focus()
    }, 50)
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <section>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-600">
          Staff Pickup Management
        </p>

        <h1 className="mt-2 text-2xl font-extrabold text-slate-950 sm:text-3xl">
          QR Code Scanner
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Scan the customer&apos;s order QR code or
          enter its token to verify the pickup.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <form
          onSubmit={handleVerify}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <ScanLine className="h-6 w-6" />
            </span>

            <div>
              <h2 className="font-extrabold text-slate-950">
                Verify Order QR
              </h2>

              <p className="text-xs text-slate-500">
                Scanner devices can enter the token
                directly into the field.
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <div className="mt-5">
            <label
              htmlFor="qr-token"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              QR token
            </label>

            <div className="relative">
              <QrCode className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

              <input
                ref={inputRef}
                id="qr-token"
                value={qrToken}
                onChange={(event) =>
                  setQrToken(event.target.value)
                }
                autoFocus
                autoComplete="off"
                disabled={isSubmitting}
                placeholder="Scan or paste the QR token"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="scanner-device"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                Device name
              </label>

              <input
                id="scanner-device"
                value={deviceName}
                onChange={(event) =>
                  setDeviceName(event.target.value)
                }
                disabled={isSubmitting}
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400"
              />
            </div>

            <div>
              <label
                htmlFor="scanner-location"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                Pickup location
              </label>

              <input
                id="scanner-location"
                value={location}
                onChange={(event) =>
                  setLocation(event.target.value)
                }
                disabled={isSubmitting}
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={
                isSubmitting ||
                !qrToken.trim()
              }
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
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

            <button
              type="button"
              onClick={resetScanner}
              disabled={isSubmitting}
              className="flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Clear
            </button>
          </div>
        </form>

        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-extrabold text-slate-950">
            Verification Result
          </h2>

          {!result ? (
            <div className="flex min-h-72 flex-col items-center justify-center text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
                <QrCode className="h-8 w-8" />
              </span>

              <p className="mt-4 text-sm font-semibold text-slate-500">
                Scan a QR code to display the order
                information.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <div
                className={`rounded-2xl border p-4 ${
                  result.valid === false
                    ? 'border-red-200 bg-red-50'
                    : 'border-emerald-200 bg-emerald-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  {result.valid === false ? (
                    <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-600" />
                  ) : (
                    <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
                  )}

                  <div>
                    <p
                      className={`font-extrabold ${
                        result.valid === false
                          ? 'text-red-800'
                          : 'text-emerald-800'
                      }`}
                    >
                      {result.valid === false
                        ? 'Verification Failed'
                        : 'QR Code Verified'}
                    </p>

                    <p
                      className={`mt-1 text-sm leading-6 ${
                        result.valid === false
                          ? 'text-red-700'
                          : 'text-emerald-700'
                      }`}
                    >
                      {result.message}
                    </p>
                  </div>
                </div>
              </div>

              <ResultItem
                label="Order"
                value={result.orderReference}
              />

              <ResultItem
                label="Customer"
                value={result.customerName}
              />

              <ResultItem
                label="Order Status"
                value={result.orderStatus}
              />

              <button
                type="button"
                onClick={resetScanner}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white"
              >
                <RefreshCw className="h-4 w-4" />
                Scan Another QR
              </button>
            </div>
          )}
        </aside>
      </section>
    </div>
  )
}

function ResultItem({
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

      <p className="mt-1 break-words text-sm font-extrabold text-slate-900">
        {value}
      </p>
    </div>
  )
}
