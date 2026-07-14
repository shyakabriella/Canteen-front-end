'use client'

import {
  CheckCircle2,
  LoaderCircle,
  MapPin,
  PackageCheck,
  Smartphone,
  X,
} from 'lucide-react'
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'
import {
  getOrderReference,
  getOrderStatus,
  getOrderUserName,
} from '@/lib/order'
import {
  getOrderQrCodeStatus,
  getOrderQrToken,
} from '@/lib/order-qr-code'
import type { Order } from '@/types/order'
import type { OrderQrCode } from '@/types/order-qr-code'
import type { PickupConfirmationPayload } from '@/types/pickup-confirmation'

interface PickupConfirmationFormModalProps {
  isOpen: boolean
  orders: Order[]
  qrCodes: OrderQrCode[]
  isLoadingDependencies: boolean
  dependencyError: string
  isSubmitting: boolean
  onRefreshDependencies: () => Promise<void>
  onClose: () => void
  onSubmit: (
    payload: PickupConfirmationPayload,
  ) => Promise<void>
}

export default function PickupConfirmationFormModal({
  isOpen,
  orders,
  qrCodes,
  isLoadingDependencies,
  dependencyError,
  isSubmitting,
  onRefreshDependencies,
  onClose,
  onSubmit,
}: PickupConfirmationFormModalProps) {
  const [orderId, setOrderId] = useState('')
  const [qrCodeId, setQrCodeId] = useState('')

  const [deviceName, setDeviceName] =
    useState('Staff Phone')

  const [deviceType, setDeviceType] =
    useState('android')

  const [location, setLocation] = useState(
    'Main Canteen Pickup Point',
  )

  const [notes, setNotes] = useState(
    'Food collected by customer',
  )

  const [formError, setFormError] =
    useState('')

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setOrderId('')
    setQrCodeId('')
    setDeviceName('Staff Phone')
    setDeviceType('android')
    setLocation(
      'Main Canteen Pickup Point',
    )
    setNotes('Food collected by customer')
    setFormError('')
  }, [isOpen])

  const selectedOrder = useMemo(
    () =>
      orders.find(
        (order) =>
          String(order.id) === String(orderId),
      ) ?? null,
    [orders, orderId],
  )

  const selectableOrders = useMemo(
    () =>
      orders
        .filter((order) => {
          if (order.deleted_at) {
            return false
          }

          return (
            getOrderStatus(order) !== 'cancelled'
          )
        })
        .sort((first, second) =>
          String(getOrderReference(first)).localeCompare(
            String(getOrderReference(second)),
          ),
        ),
    [orders],
  )

  const matchingQrCodes = useMemo(
    () =>
      qrCodes.filter((qrCode) => {
        if (qrCode.deleted_at || !orderId) {
          return false
        }

        return (
          String(qrCode.order_id) ===
          String(orderId)
        )
      }),
    [qrCodes, orderId],
  )

  useEffect(() => {
    if (!orderId) {
      setQrCodeId('')
      return
    }

    const activeQrCode =
      matchingQrCodes.find(
        (qrCode) =>
          getOrderQrCodeStatus(qrCode) ===
          'active',
      )

    setQrCodeId(
      activeQrCode
        ? String(activeQrCode.id)
        : '',
    )
  }, [orderId, matchingQrCodes])

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setFormError('')

    if (!selectedOrder) {
      setFormError(
        'Please select the order being collected.',
      )
      return
    }

    if (
      !deviceName.trim() ||
      !deviceType.trim() ||
      !location.trim()
    ) {
      setFormError(
        'Device and pickup location information is required.',
      )
      return
    }

    try {
      await onSubmit({
        order_id: String(selectedOrder.id),
        order_qr_code_id:
          qrCodeId || undefined,
        device_name: deviceName.trim(),
        device_type: deviceType.trim(),
        location: location.trim(),
        notes: notes.trim(),
      })
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Unable to confirm the pickup.',
      )
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4">
      <button
        type="button"
        aria-label="Close pickup confirmation form"
        onClick={onClose}
        disabled={isSubmitting}
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="relative z-10 my-auto w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <PackageCheck className="h-5 w-5" />
            </span>

            <div>
              <h2 className="font-extrabold text-slate-950">
                Manual Pickup Confirmation
              </h2>

              <p className="text-xs text-slate-500">
                Confirm food collection without requiring
                the customer to scan again.
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
          className="max-h-[calc(100vh-130px)] space-y-5 overflow-y-auto p-6"
        >
          {formError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          {dependencyError && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              <p>{dependencyError}</p>

              <button
                type="button"
                onClick={() =>
                  void onRefreshDependencies()
                }
                className="mt-2 font-bold underline"
              >
                Reload orders and QR codes
              </button>
            </div>
          )}

          {isLoadingDependencies ? (
            <div className="flex min-h-64 items-center justify-center">
              <div className="text-center">
                <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-indigo-600" />

                <p className="mt-3 text-sm text-slate-500">
                  Loading orders and QR codes...
                </p>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label
                  htmlFor="pickup-order"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Order
                </label>

                <select
                  id="pickup-order"
                  value={orderId}
                  onChange={(event) =>
                    setOrderId(event.target.value)
                  }
                  required
                  disabled={isSubmitting}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                >
                  <option value="">
                    Select customer order
                  </option>

                  {selectableOrders.map(
                    (order) => (
                      <option
                        key={order.id}
                        value={String(order.id)}
                      >
                        {getOrderReference(order)}
                        {' — '}
                        {getOrderUserName(order)}
                        {' — '}
                        {getOrderStatus(order)}
                      </option>
                    ),
                  )}
                </select>
              </div>

              {selectedOrder && (
                <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-500">
                    Selected order
                  </p>

                  <p className="mt-2 font-extrabold text-slate-950">
                    {getOrderReference(selectedOrder)}
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    {getOrderUserName(selectedOrder)}
                  </p>

                  <p className="mt-2 text-xs font-bold capitalize text-indigo-700">
                    Order status:{' '}
                    {getOrderStatus(selectedOrder)}
                  </p>
                </div>
              )}

              <div>
                <label
                  htmlFor="pickup-qr-code"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Related QR code
                </label>

                <select
                  id="pickup-qr-code"
                  value={qrCodeId}
                  onChange={(event) =>
                    setQrCodeId(event.target.value)
                  }
                  disabled={
                    isSubmitting || !orderId
                  }
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 disabled:opacity-60"
                >
                  <option value="">
                    No QR code / manual pickup
                  </option>

                  {matchingQrCodes.map(
                    (qrCode) => (
                      <option
                        key={qrCode.id}
                        value={String(qrCode.id)}
                      >
                        QR #{qrCode.id}
                        {' — '}
                        {getOrderQrCodeStatus(qrCode)}
                        {getOrderQrToken(qrCode)
                          ? ` — ${getOrderQrToken(
                              qrCode,
                            ).slice(0, 18)}...`
                          : ''}
                      </option>
                    ),
                  )}
                </select>

                <p className="mt-2 text-xs text-slate-400">
                  This field is optional for manual
                  confirmation.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="pickup-device-name"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Device name
                  </label>

                  <div className="relative">
                    <Smartphone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      id="pickup-device-name"
                      value={deviceName}
                      onChange={(event) =>
                        setDeviceName(
                          event.target.value,
                        )
                      }
                      required
                      disabled={isSubmitting}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="pickup-device-type"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Device type
                  </label>

                  <select
                    id="pickup-device-type"
                    value={deviceType}
                    onChange={(event) =>
                      setDeviceType(
                        event.target.value,
                      )
                    }
                    required
                    disabled={isSubmitting}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
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
                    <option value="desktop">
                      Desktop
                    </option>
                    <option value="other">
                      Other
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

                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    id="pickup-location"
                    value={location}
                    onChange={(event) =>
                      setLocation(
                        event.target.value,
                      )
                    }
                    required
                    disabled={isSubmitting}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="pickup-notes"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Confirmation notes
                </label>

                <textarea
                  id="pickup-notes"
                  value={notes}
                  onChange={(event) =>
                    setNotes(event.target.value)
                  }
                  rows={4}
                  disabled={isSubmitting}
                  placeholder="Food collected by customer"
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                />
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                The authenticated staff member will be
                saved automatically as the person who
                confirmed this pickup.
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !selectedOrder
                  }
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Confirm Pickup
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
