'use client'

import {
  BadgeCheck,
  Banknote,
  CheckCircle2,
  Clock3,
  Hash,
  LoaderCircle,
  PackageCheck,
  Phone,
  QrCode,
  RefreshCw,
  ScanLine,
  ShoppingBag,
  UserRound,
  XCircle,
} from 'lucide-react'
import {
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { apiRequest } from '@/lib/api'

type UnknownRecord = Record<string, unknown>
type ResultMode = 'verified' | 'completed'

interface ScannedQrInput {
  qrToken: string
  qrCodeNumber: string
  scannedPayload: string
}

interface VerificationResult {
  mode: ResultMode
  valid: boolean
  message: string

  qrCodeId: number | null
  qrCodeNumber: string
  qrStatus: string
  expiresAt: string

  orderId: number | null
  orderReference: string
  orderStatus: string
  pickupStatus: string
  paymentStatus: string
  totalAmount: number | null
  itemCount: number

  customerName: string
  customerPhone: string

  confirmationNumber: string
  canConfirmPickup: boolean
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

function asArray(
  value: unknown,
): unknown[] {
  return Array.isArray(value) ? value : []
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

function numberValue(
  ...values: unknown[]
): number | null {
  for (const value of values) {
    if (
      typeof value === 'number' &&
      Number.isFinite(value)
    ) {
      return value
    }

    if (
      typeof value === 'string' &&
      value.trim()
    ) {
      const parsed = Number(value)

      if (Number.isFinite(parsed)) {
        return parsed
      }
    }
  }

  return null
}

function normalizedStatus(
  value: unknown,
): string {
  return stringValue(value)
    .trim()
    .toLowerCase()
}

function humanizeStatus(
  value: string,
): string {
  if (!value) {
    return 'Not available'
  }

  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    )
}

function formatMoney(
  value: number | null,
): string {
  if (value === null) {
    return 'Not available'
  }

  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDateTime(
  value: string,
): string {
  if (!value) {
    return 'Not available'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-RW', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function parseScannedQrInput(
  rawValue: string,
): ScannedQrInput {
  const scannedPayload = rawValue.trim()

  if (!scannedPayload) {
    return {
      qrToken: '',
      qrCodeNumber: '',
      scannedPayload: '',
    }
  }

  try {
    const parsed = JSON.parse(scannedPayload)
    const record = asRecord(parsed)

    if (record) {
      const data = asRecord(record.data) ?? record

      return {
        qrToken: stringValue(
          data.qr_token,
          data.qrToken,
          data.token,
        ),
        qrCodeNumber: stringValue(
          data.qr_code_number,
          data.qrCodeNumber,
          data.code,
        ),
        scannedPayload,
      }
    }
  } catch {
    // The scanner may provide a token, QR number, or URL instead of JSON.
  }

  try {
    const url = new URL(scannedPayload)

    const qrToken = stringValue(
      url.searchParams.get('qr_token'),
      url.searchParams.get('token'),
    )

    const qrCodeNumber = stringValue(
      url.searchParams.get('qr_code_number'),
      url.searchParams.get('code'),
    )

    if (qrToken || qrCodeNumber) {
      return {
        qrToken,
        qrCodeNumber,
        scannedPayload,
      }
    }
  } catch {
    // It is not a URL. Continue with plain scanner text.
  }

  if (
    scannedPayload
      .toUpperCase()
      .startsWith('QR-')
  ) {
    return {
      qrToken: '',
      qrCodeNumber: scannedPayload,
      scannedPayload,
    }
  }

  return {
    qrToken: scannedPayload,
    qrCodeNumber: '',
    scannedPayload,
  }
}

function parseVerificationResult(
  payload: unknown,
  mode: ResultMode,
): VerificationResult {
  const root = asRecord(payload) ?? {}
  const data = asRecord(root.data) ?? root

  const nestedQrCode =
    asRecord(data.order_qr_code) ??
    asRecord(data.orderQrCode) ??
    asRecord(data.qr_code) ??
    asRecord(data.qrCode)

  const qrCode = nestedQrCode ?? data

  const order =
    asRecord(qrCode.order) ??
    asRecord(data.order) ??
    {}

  const user =
    asRecord(qrCode.user) ??
    asRecord(order.user) ??
    asRecord(order.customer) ??
    asRecord(data.user) ??
    asRecord(data.customer) ??
    {}

  const pickupConfirmation =
    asRecord(qrCode.pickup_confirmation) ??
    asRecord(qrCode.pickupConfirmation) ??
    asRecord(data.pickup_confirmation) ??
    asRecord(data.pickupConfirmation) ??
    {}

  const qrStatus = normalizedStatus(
    qrCode.status,
  )

  const orderStatus = normalizedStatus(
    order.order_status ?? order.status,
  )

  const pickupStatus = normalizedStatus(
    order.pickup_status,
  )

  const paymentStatus = normalizedStatus(
    order.payment_status,
  )

  const confirmationStatus = normalizedStatus(
    pickupConfirmation.status,
  )

  const isCompleted =
    mode === 'completed' ||
    qrStatus === 'used' ||
    orderStatus === 'completed' ||
    pickupStatus === 'collected' ||
    confirmationStatus === 'confirmed'

  const valid =
    root.success !== false &&
    data.success !== false

  const canConfirmPickup =
    valid &&
    !isCompleted &&
    qrStatus === 'active' &&
    paymentStatus === 'paid' &&
    orderStatus === 'ready' &&
    pickupStatus === 'ready'

  const items =
    asArray(order.order_items).length > 0
      ? asArray(order.order_items)
      : asArray(order.orderItems)

  return {
    mode,
    valid,

    message:
      stringValue(
        root.message,
        data.message,
      ) ||
      (
        mode === 'completed'
          ? 'Pickup confirmed successfully.'
          : 'QR code verified successfully.'
      ),

    qrCodeId: numberValue(
      qrCode.id,
      data.order_qr_code_id,
      data.qr_code_id,
    ),

    qrCodeNumber:
      stringValue(
        qrCode.qr_code_number,
        qrCode.qrCodeNumber,
      ) || 'Not available',

    qrStatus:
      humanizeStatus(qrStatus),

    expiresAt: stringValue(
      qrCode.expires_at,
      qrCode.expiresAt,
    ),

    orderId: numberValue(
      order.id,
      qrCode.order_id,
    ),

    orderReference:
      stringValue(
        order.order_number,
        order.reference,
        order.code,
        order.id,
      ) || 'Not available',

    orderStatus:
      humanizeStatus(orderStatus),

    pickupStatus:
      humanizeStatus(pickupStatus),

    paymentStatus:
      humanizeStatus(paymentStatus),

    totalAmount: numberValue(
      order.total_amount,
      order.total,
      data.total_amount,
    ),

    itemCount: items.length,

    customerName:
      stringValue(
        user.name,
        user.full_name,
        pickupConfirmation.customer_name,
        user.email,
      ) || 'Not available',

    customerPhone:
      stringValue(
        user.phone,
        pickupConfirmation.customer_phone,
      ) || 'Not available',

    confirmationNumber:
      stringValue(
        pickupConfirmation.confirmation_number,
        pickupConfirmation.confirmationNumber,
      ),

    canConfirmPickup,
  }
}

function playFeedbackTone(
  type: 'success' | 'error',
) {
  try {
    const AudioContextClass =
      window.AudioContext ??
      (
        window as typeof window & {
          webkitAudioContext?: typeof AudioContext
        }
      ).webkitAudioContext

    if (!AudioContextClass) {
      return
    }

    const context = new AudioContextClass()
    const oscillator = context.createOscillator()
    const gain = context.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.value =
      type === 'success' ? 880 : 220

    gain.gain.setValueAtTime(
      0.0001,
      context.currentTime,
    )
    gain.gain.exponentialRampToValueAtTime(
      0.15,
      context.currentTime + 0.01,
    )
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      context.currentTime + 0.25,
    )

    oscillator.connect(gain)
    gain.connect(context.destination)

    oscillator.start()
    oscillator.stop(context.currentTime + 0.26)

    oscillator.addEventListener('ended', () => {
      void context.close()
    })
  } catch {
    // Audio feedback is optional and must not block pickup processing.
  }
}

export default function StaffQrScannerPage() {
  const inputRef =
    useRef<HTMLInputElement>(null)

  const [scannerValue, setScannerValue] =
    useState('')

  const [lastScannedPayload, setLastScannedPayload] =
    useState('')

  const [deviceName, setDeviceName] =
    useState('Staff Web Scanner')

  const [location, setLocation] =
    useState('Main Canteen Pickup Point')

  const [isVerifying, setIsVerifying] =
    useState(false)

  const [isConfirming, setIsConfirming] =
    useState(false)

  const [errorMessage, setErrorMessage] =
    useState('')

  const [result, setResult] =
    useState<VerificationResult | null>(null)

  const isBusy =
    isVerifying || isConfirming

  async function handleVerify(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    const scanned = parseScannedQrInput(
      scannerValue,
    )

    if (
      !scanned.qrToken &&
      !scanned.qrCodeNumber
    ) {
      setErrorMessage(
        'Please scan or enter a valid QR token or QR code number.',
      )
      inputRef.current?.focus()
      return
    }

    setIsVerifying(true)
    setErrorMessage('')
    setResult(null)
    setLastScannedPayload(
      scanned.scannedPayload,
    )

    try {
      const body: Record<string, unknown> = {
        device_name:
          deviceName.trim() ||
          'Staff Web Scanner',
        device_type: 'web',
        location:
          location.trim() || null,
        scanned_payload:
          scanned.scannedPayload || null,
      }

      if (scanned.qrToken) {
        body.qr_token = scanned.qrToken
      }

      if (scanned.qrCodeNumber) {
        body.qr_code_number =
          scanned.qrCodeNumber
      }

      const response = await apiRequest<unknown>(
        '/order-qr-codes/verify',
        {
          method: 'POST',
          auth: true,
          body,
        },
      )

      const parsedResult =
        parseVerificationResult(
          response,
          'verified',
        )

      setResult(parsedResult)
      playFeedbackTone('success')
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to verify the QR code.',
      )
      playFeedbackTone('error')
    } finally {
      setIsVerifying(false)
    }
  }

  async function handleConfirmPickup() {
    if (
      !result?.qrCodeId ||
      !result.canConfirmPickup
    ) {
      setErrorMessage(
        'This order is not ready for pickup confirmation.',
      )
      return
    }

    setIsConfirming(true)
    setErrorMessage('')

    try {
      const response = await apiRequest<unknown>(
        `/order-qr-codes/${result.qrCodeId}/mark-used`,
        {
          method: 'POST',
          auth: true,
          body: {
            device_name:
              deviceName.trim() ||
              'Staff Web Scanner',
            device_type: 'web',
            location:
              location.trim() || null,
            scanned_payload:
              lastScannedPayload || null,
            notes:
              'Pickup confirmed from the staff web QR scanner.',
          },
        },
      )

      setResult(
        parseVerificationResult(
          response,
          'completed',
        ),
      )

      playFeedbackTone('success')
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to confirm the pickup.',
      )
      playFeedbackTone('error')
    } finally {
      setIsConfirming(false)
    }
  }

  function resetScanner() {
    setScannerValue('')
    setLastScannedPayload('')
    setResult(null)
    setErrorMessage('')

    window.setTimeout(() => {
      inputRef.current?.focus()
    }, 50)
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <section>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-600">
          Staff Pickup Management
        </p>

        <h1 className="mt-2 text-2xl font-extrabold text-slate-950 sm:text-3xl">
          QR Code Scanner
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Scan the customer&apos;s pickup QR code,
          verify that the paid order is ready, then
          confirm that the customer received the order.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
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

              <p className="text-xs leading-5 text-slate-500">
                Supports the QR JSON payload, QR token,
                or QR code number.
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <p>{errorMessage}</p>
            </div>
          )}

          <div className="mt-5">
            <label
              htmlFor="qr-value"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              QR value
            </label>

            <div className="relative">
              <QrCode className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

              <input
                ref={inputRef}
                id="qr-value"
                value={scannerValue}
                onChange={(event) => {
                  setScannerValue(
                    event.target.value,
                  )
                  setErrorMessage('')
                }}
                autoFocus
                autoComplete="off"
                disabled={isBusy}
                placeholder="Scan QR code or paste its value"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              A USB or Bluetooth scanner normally enters
              the value here and presses Enter automatically.
            </p>
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
                disabled={isBusy}
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-indigo-400 focus:bg-white disabled:opacity-60"
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
                disabled={isBusy}
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-indigo-400 focus:bg-white disabled:opacity-60"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={
                isBusy ||
                !scannerValue.trim()
              }
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isVerifying ? (
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
              disabled={isBusy}
              className="flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
              Clear
            </button>
          </div>
        </form>

        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Pickup Information
              </p>
              <h2 className="mt-1 font-extrabold text-slate-950">
                Verification Result
              </h2>
            </div>

            {result && (
              <StatusBadge
                value={
                  result.mode === 'completed'
                    ? 'Pickup completed'
                    : 'Ready for pickup'
                }
                success
              />
            )}
          </div>

          {!result ? (
            <div className="flex min-h-[430px] flex-col items-center justify-center text-center">
              <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
                <QrCode className="h-10 w-10" />
              </span>

              <p className="mt-5 font-bold text-slate-700">
                No QR code verified yet
              </p>

              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Scan a customer&apos;s pickup QR code to
                view the order, payment, customer, and
                pickup status.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              <div
                className={`rounded-2xl border p-4 ${
                  result.mode === 'completed'
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-indigo-200 bg-indigo-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  {result.mode === 'completed' ? (
                    <PackageCheck className="mt-0.5 h-7 w-7 shrink-0 text-emerald-600" />
                  ) : (
                    <CheckCircle2 className="mt-0.5 h-7 w-7 shrink-0 text-indigo-600" />
                  )}

                  <div>
                    <p
                      className={`font-extrabold ${
                        result.mode === 'completed'
                          ? 'text-emerald-900'
                          : 'text-indigo-900'
                      }`}
                    >
                      {result.mode === 'completed'
                        ? 'Pickup Confirmed'
                        : 'QR Code Verified'}
                    </p>

                    <p
                      className={`mt-1 text-sm leading-6 ${
                        result.mode === 'completed'
                          ? 'text-emerald-700'
                          : 'text-indigo-700'
                      }`}
                    >
                      {result.message}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <ResultItem
                  icon={Hash}
                  label="Order number"
                  value={result.orderReference}
                />

                <ResultItem
                  icon={QrCode}
                  label="QR number"
                  value={result.qrCodeNumber}
                />

                <ResultItem
                  icon={UserRound}
                  label="Customer"
                  value={result.customerName}
                />

                <ResultItem
                  icon={Phone}
                  label="Phone"
                  value={result.customerPhone}
                />

                <ResultItem
                  icon={Banknote}
                  label="Total amount"
                  value={formatMoney(
                    result.totalAmount,
                  )}
                />

                <ResultItem
                  icon={ShoppingBag}
                  label="Order items"
                  value={`${result.itemCount} item${
                    result.itemCount === 1 ? '' : 's'
                  }`}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <StatusResultItem
                  label="Payment"
                  value={result.paymentStatus}
                  success={
                    result.paymentStatus
                      .toLowerCase() === 'paid'
                  }
                />

                <StatusResultItem
                  label="Order"
                  value={result.orderStatus}
                  success={
                    ['ready', 'completed'].includes(
                      result.orderStatus.toLowerCase(),
                    )
                  }
                />

                <StatusResultItem
                  label="Pickup"
                  value={result.pickupStatus}
                  success={
                    ['ready', 'collected'].includes(
                      result.pickupStatus.toLowerCase(),
                    )
                  }
                />
              </div>

              <ResultItem
                icon={Clock3}
                label="QR expires"
                value={formatDateTime(
                  result.expiresAt,
                )}
              />

              {result.confirmationNumber && (
                <ResultItem
                  icon={BadgeCheck}
                  label="Confirmation number"
                  value={result.confirmationNumber}
                />
              )}

              {result.mode === 'verified' && (
                <button
                  type="button"
                  onClick={handleConfirmPickup}
                  disabled={
                    isBusy ||
                    !result.canConfirmPickup
                  }
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isConfirming ? (
                    <>
                      <LoaderCircle className="h-5 w-5 animate-spin" />
                      Confirming Pickup...
                    </>
                  ) : (
                    <>
                      <PackageCheck className="h-5 w-5" />
                      Confirm Customer Received Order
                    </>
                  )}
                </button>
              )}

              {result.mode === 'completed' && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                  <BadgeCheck className="mx-auto h-9 w-9 text-emerald-600" />
                  <p className="mt-2 font-extrabold text-emerald-900">
                    Order pickup is complete
                  </p>
                  <p className="mt-1 text-sm text-emerald-700">
                    The QR code is used and cannot be
                    accepted again.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={resetScanner}
                disabled={isBusy}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
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
  icon: Icon,
  label,
  value,
}: {
  icon: typeof QrCode
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-slate-400">
        <Icon className="h-4 w-4" />
        <p className="text-xs font-bold uppercase tracking-wider">
          {label}
        </p>
      </div>

      <p className="mt-2 break-words text-sm font-extrabold text-slate-900">
        {value || 'Not available'}
      </p>
    </div>
  )
}

function StatusResultItem({
  label,
  value,
  success,
}: {
  label: string
  value: string
  success: boolean
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <div className="mt-2">
        <StatusBadge
          value={value}
          success={success}
        />
      </div>
    </div>
  )
}

function StatusBadge({
  value,
  success,
}: {
  value: string
  success: boolean
}) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${
        success
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-amber-100 text-amber-700'
      }`}
    >
      {value || 'Not available'}
    </span>
  )
}