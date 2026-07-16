'use client'

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChefHat,
  Clock3,
  Info,
  LoaderCircle,
  Mail,
  MapPin,
  Minus,
  PackageCheck,
  Phone,
  Plus,
  Send,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'

type UnknownRecord =
  Record<string, unknown>

interface FoodItem {
  id: number
  categoryName: string
  name: string
  sku: string
  description: string
  imageUrl: string
  price: number
  unit: string
  preparationMinutes: number
  availableQuantity: number
}

interface GuestOrderResult {
  id: number | string
  orderNumber: string
  publicToken: string
  orderStatus: string
  paymentStatus: string
  deliveryStatus: string
  totalAmount: number
  amountDue: number
  customerName: string
  customerPhone: string
  deliveryLocation: string
}

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  'https://www.canteen.asyncafrica.com/api'
).replace(/\/+$/, '')

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1600&q=90'

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
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ''
    ) {
      return String(value).trim()
    }
  }

  return ''
}

function numberValue(
  ...values: unknown[]
): number {
  for (const value of values) {
    const parsed = Number(value)

    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return 0
}

function unwrapData(
  payload: unknown,
): unknown {
  const root = asRecord(payload)

  return root?.data ?? payload
}

function normalizeFoodItem(
  payload: unknown,
): FoodItem | null {
  const source = asRecord(
    unwrapData(payload),
  )

  if (!source) {
    return null
  }

  const id = numberValue(source.id)

  if (!id) {
    return null
  }

  const category = asRecord(
    source.category,
  )

  return {
    id,

    categoryName:
      stringValue(category?.name) ||
      'Food',

    name:
      stringValue(source.name) ||
      `Food Item ${id}`,

    sku:
      stringValue(source.sku),

    description:
      stringValue(
        source.description,
      ),

    imageUrl:
      stringValue(
        source.image_url,
        source.imageUrl,
        source.image,
      ) || FALLBACK_IMAGE,

    price:
      numberValue(source.price),

    unit:
      stringValue(source.unit) ||
      'piece',

    preparationMinutes:
      numberValue(
        source.preparation_time_minutes,
        source.preparationTimeMinutes,
      ),

    availableQuantity:
      numberValue(
        source.available_quantity,
        source.availableQuantity,
      ),
  }
}

function normalizeGuestOrder(
  payload: unknown,
): GuestOrderResult {
  const source =
    asRecord(
      unwrapData(payload),
    ) ?? {}

  return {
    id:
      typeof source.id === 'number' ||
      typeof source.id === 'string'
        ? source.id
        : '',

    orderNumber:
      stringValue(
        source.order_number,
        source.orderNumber,
        source.id,
        'New order',
      ),

    publicToken:
      stringValue(
        source.public_token,
        source.publicToken,
      ),

    orderStatus:
      stringValue(
        source.order_status,
        source.orderStatus,
      ) || 'pending',

    paymentStatus:
      stringValue(
        source.payment_status,
        source.paymentStatus,
      ) || 'pending',

    deliveryStatus:
      stringValue(
        source.delivery_status,
        source.deliveryStatus,
      ) || 'pending',

    totalAmount:
      numberValue(
        source.total_amount,
        source.totalAmount,
      ),

    amountDue:
      numberValue(
        source.amount_due,
        source.amountDue,
        source.total_amount,
      ),

    customerName:
      stringValue(
        source.customer_name,
        source.customerName,
      ),

    customerPhone:
      stringValue(
        source.customer_phone,
        source.customerPhone,
      ),

    deliveryLocation:
      stringValue(
        source.delivery_location,
        source.deliveryLocation,
      ),
  }
}

function formatMoney(
  value: number,
): string {
  return `${new Intl.NumberFormat(
    'en-US',
    {
      maximumFractionDigits: 0,
    },
  ).format(value)} RWF`
}

function firstValidationError(
  payload: unknown,
): string {
  const root = asRecord(payload)
  const errors = asRecord(
    root?.errors,
  )

  if (!errors) {
    return ''
  }

  for (const value of Object.values(
    errors,
  )) {
    if (Array.isArray(value)) {
      const first = value.find(
        (item) =>
          String(item).trim() !== '',
      )

      if (first) {
        return String(first)
      }
    }

    if (
      typeof value === 'string' &&
      value.trim() !== ''
    ) {
      return value
    }
  }

  return ''
}

async function apiRequest(
  path: string,
  options?: RequestInit,
): Promise<unknown> {
  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      ...options,

      headers: {
        Accept: 'application/json',
        ...(options?.body
          ? {
              'Content-Type':
                'application/json',
            }
          : {}),
        ...(options?.headers ?? {}),
      },

      cache: 'no-store',
    },
  )

  const responseText =
    await response.text()

  let payload: unknown = null

  if (responseText.trim()) {
    try {
      payload = JSON.parse(
        responseText,
      )
    } catch {
      payload = {
        message: responseText,
      }
    }
  }

  if (!response.ok) {
    const root = asRecord(payload)

    throw new Error(
      firstValidationError(payload) ||
        stringValue(
          root?.message,
          root?.error,
        ) ||
        `Request failed. HTTP ${response.status}.`,
    )
  }

  return payload
}

export default function MenuItemDetailPage() {
  const params = useParams<{
    id: string
  }>()

  const itemId = Number(params.id)

  const [item, setItem] =
    useState<FoodItem | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [submitting, setSubmitting] =
    useState(false)

  const [errorMessage, setErrorMessage] =
    useState('')

  const [orderResult, setOrderResult] =
    useState<GuestOrderResult | null>(
      null,
    )

  const [quantity, setQuantity] =
    useState(1)

  const [customerName, setCustomerName] =
    useState('')

  const [
    customerEmail,
    setCustomerEmail,
  ] = useState('')

  const [
    customerPhone,
    setCustomerPhone,
  ] = useState('')

  const [
    deliveryLocation,
    setDeliveryLocation,
  ] = useState('')

  const [
    preferredDeliveryTime,
    setPreferredDeliveryTime,
  ] = useState('')

  const [notes, setNotes] =
    useState('')

  const [
    confirmInformation,
    setConfirmInformation,
  ] = useState(false)

  const loadItem =
    useCallback(async () => {
      if (
        !Number.isInteger(itemId) ||
        itemId <= 0
      ) {
        setItem(null)

        setErrorMessage(
          'The food item ID is invalid.',
        )

        setLoading(false)
        return
      }

      setLoading(true)
      setErrorMessage('')

      try {
        const payload =
          await apiRequest(
            `/food-items/public/${itemId}`,
          )

        const loadedItem =
          normalizeFoodItem(payload)

        if (!loadedItem) {
          throw new Error(
            'The API returned invalid food-item data.',
          )
        }

        setItem(loadedItem)
      } catch (error) {
        setItem(null)

        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to load this food item.',
        )
      } finally {
        setLoading(false)
      }
    }, [itemId])

  useEffect(() => {
    void loadItem()
  }, [loadItem])

  const totalAmount = useMemo(
    () =>
      item
        ? item.price * quantity
        : 0,
    [item, quantity],
  )

  async function submitGuestOrder(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (!item) {
      return
    }

    if (
      quantity < 1 ||
      quantity >
        item.availableQuantity
    ) {
      setErrorMessage(
        `Only ${item.availableQuantity} ${item.unit}(s) are currently available.`,
      )

      return
    }

    if (!confirmInformation) {
      setErrorMessage(
        'Confirm that your phone number and delivery location are correct.',
      )

      return
    }

    setSubmitting(true)
    setErrorMessage('')
    setOrderResult(null)

    try {
      const payload =
        await apiRequest(
          '/guest-orders',
          {
            method: 'POST',

            body: JSON.stringify({
              customer_name:
                customerName.trim(),

              customer_email:
                customerEmail.trim(),

              customer_phone:
                customerPhone.trim(),

              delivery_location:
                deliveryLocation.trim(),

              preferred_delivery_time:
                preferredDeliveryTime ||
                null,

              customer_notes:
                notes.trim() || null,

              items: [
                {
                  food_item_id:
                    item.id,

                  quantity,

                  notes:
                    notes.trim() ||
                    null,
                },
              ],
            }),
          },
        )

      const createdOrder =
        normalizeGuestOrder(payload)

      setOrderResult(createdOrder)
      setQuantity(1)
      setNotes('')
      setConfirmInformation(false)

      if (
        createdOrder.publicToken
      ) {
        window.localStorage.setItem(
          'smart_canteen_guest_order',
          JSON.stringify({
            order_number:
              createdOrder.orderNumber,

            public_token:
              createdOrder.publicToken,
          }),
        )
      }

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to submit the delivery order.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#f7f3eb]">
        <div className="text-center">
          <LoaderCircle className="mx-auto h-10 w-10 animate-spin text-[#173e2b]" />

          <p className="mt-4 font-extrabold text-[#17221b]">
            Loading food details...
          </p>
        </div>
      </main>
    )
  }

  if (!item) {
    return (
      <main className="min-h-[70vh] bg-[#f7f3eb] px-5 py-20">
        <div className="mx-auto max-w-xl rounded-[2rem] border border-[#ddd4c7] bg-white p-8 text-center shadow-xl">
          <Info className="mx-auto h-12 w-12 text-[#9b7640]" />

          <h1 className="mt-5 text-2xl font-black text-[#17221b]">
            Menu item unavailable
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#6c746f]">
            {errorMessage ||
              'This item is unavailable or out of stock.'}
          </p>

          <Link
            href="/#menu"
            className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#173e2b] px-6 text-sm font-extrabold text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to menu
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f7f3eb] text-[#17221b]">
      <section className="bg-[#102018]">
        <div className="mx-auto flex min-h-40 max-w-7xl items-center px-5 py-8 sm:px-8">
          <div>
            <Link
              href="/#menu"
              className="inline-flex items-center gap-2 text-sm font-bold text-white/65 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to live menu
            </Link>

            <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.22em] text-[#e1bb75]">
              {item.categoryName}
            </p>

            <h1 className="mt-2 text-3xl font-black text-white sm:text-5xl">
              {item.name}
            </h1>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-14">
        <article className="overflow-hidden rounded-[2rem] border border-[#ddd4c7] bg-white shadow-[0_20px_60px_rgba(46,38,26,.1)]">
          <div
            className="relative min-h-[430px] bg-cover bg-center sm:min-h-[540px]"
            style={{
              backgroundImage:
                `url('${item.imageUrl}')`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

            <span className="absolute left-5 top-5 rounded-full bg-white/95 px-4 py-2 text-xs font-extrabold text-[#173e2b] shadow">
              {item.availableQuantity}{' '}
              {item.unit}(s) available
            </span>

            <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
              <div className="flex flex-wrap gap-3">
                {item.preparationMinutes >
                  0 && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 text-xs font-extrabold backdrop-blur">
                    <Clock3 className="h-4 w-4" />

                    {
                      item.preparationMinutes
                    }{' '}
                    min preparation
                  </span>
                )}

                {item.sku && (
                  <span className="rounded-full bg-black/40 px-3 py-1.5 text-xs font-extrabold backdrop-blur">
                    SKU: {item.sku}
                  </span>
                )}
              </div>

              <h2 className="mt-4 text-3xl font-black sm:text-5xl">
                {item.name}
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
                {item.description ||
                  'Freshly prepared and available for delivery.'}
              </p>
            </div>
          </div>

          <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-2">
            <InfoCard
              icon={ChefHat}
              title="Food information"
              description={
                item.description ||
                'No additional description was provided.'
              }
            />

            <InfoCard
              icon={PackageCheck}
              title="Current availability"
              description={`${item.availableQuantity} ${item.unit}(s) can currently be ordered.`}
            />

            <InfoCard
              icon={Clock3}
              title="Preparation time"
              description={
                item.preparationMinutes >
                0
                  ? `Approximately ${item.preparationMinutes} minutes before delivery handling.`
                  : 'Preparation time will be confirmed by staff.'
              }
            />

            <InfoCard
              icon={ShieldCheck}
              title="Pay on delivery"
              description={`${formatMoney(item.price)} per ${item.unit}. No wallet balance is used.`}
            />
          </div>
        </article>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <form
            onSubmit={submitGuestOrder}
            className="rounded-[2rem] border border-[#ddd4c7] bg-white p-6 shadow-[0_20px_60px_rgba(46,38,26,.1)] sm:p-8"
          >
            {errorMessage && (
              <div className="mb-5 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <AlertTriangle className="h-5 w-5 shrink-0" />

                <div>
                  <p className="font-extrabold">
                    Order could not be sent
                  </p>

                  <p className="mt-1">
                    {errorMessage}
                  </p>
                </div>
              </div>
            )}

            {orderResult && (
              <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex gap-3">
                  <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-700" />

                  <div>
                    <p className="font-extrabold text-emerald-900">
                      Delivery order received
                    </p>

                    <p className="mt-1 text-lg font-black text-emerald-800">
                      {orderResult.orderNumber}
                    </p>

                    <p className="mt-2 text-sm text-emerald-800">
                      Amount due on delivery:{' '}
                      <strong>
                        {formatMoney(
                          orderResult.amountDue ||
                            orderResult.totalAmount,
                        )}
                      </strong>
                    </p>

                    <p className="mt-2 text-xs capitalize text-emerald-700">
                      Order status:{' '}
                      {orderResult.orderStatus.replaceAll(
                        '_',
                        ' ',
                      )}
                    </p>

                    <p className="mt-3 text-xs leading-5 text-emerald-800">
                      No wallet balance was changed. Keep the order number
                      for communication with the canteen.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="border-b border-[#ece5da] pb-6">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#9b7640]">
                Guest delivery order
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Delivery information
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#6c746f]">
                No account or mobile application is required. Submit the
                order now and pay when the food is delivered.
              </p>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <FormField
                label="Full name"
                icon={UserRound}
              >
                <input
                  type="text"
                  value={customerName}
                  onChange={(event) =>
                    setCustomerName(
                      event.target.value,
                    )
                  }
                  required
                  maxLength={255}
                  autoComplete="name"
                  placeholder="Your full name"
                  className="h-[52px] w-full bg-transparent px-4 text-sm font-medium outline-none"
                />
              </FormField>

              <FormField
                label="Phone number"
                icon={Phone}
              >
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(event) =>
                    setCustomerPhone(
                      event.target.value,
                    )
                  }
                  required
                  maxLength={50}
                  autoComplete="tel"
                  placeholder="+250 7..."
                  className="h-[52px] w-full bg-transparent px-4 text-sm font-medium outline-none"
                />
              </FormField>
            </div>

            <div className="mt-5">
              <label
                htmlFor="customer-email"
                className="flex items-center gap-2 text-sm font-extrabold"
              >
                <Mail className="h-4 w-4 text-[#173e2b]" />
                Email address
              </label>

              <input
                id="customer-email"
                type="email"
                value={customerEmail}
                onChange={(event) =>
                  setCustomerEmail(
                    event.target.value,
                  )
                }
                required
                maxLength={255}
                autoComplete="email"
                placeholder="name@example.com"
                className="mt-2 h-[52px] w-full rounded-2xl border border-[#dcd4c8] bg-[#fbf9f5] px-4 text-sm font-medium outline-none focus:border-[#173e2b] focus:ring-4 focus:ring-[#173e2b]/10"
              />
            </div>

            <div className="mt-5">
              <label
                htmlFor="delivery-location"
                className="flex items-center gap-2 text-sm font-extrabold"
              >
                <MapPin className="h-4 w-4 text-[#173e2b]" />
                Delivery location
              </label>

              <textarea
                id="delivery-location"
                value={deliveryLocation}
                onChange={(event) =>
                  setDeliveryLocation(
                    event.target.value,
                  )
                }
                required
                maxLength={1500}
                rows={3}
                placeholder="District, sector, street, building, gate or nearby landmark..."
                className="mt-2 w-full resize-none rounded-2xl border border-[#dcd4c8] bg-[#fbf9f5] px-4 py-3 text-sm font-medium outline-none focus:border-[#173e2b] focus:ring-4 focus:ring-[#173e2b]/10"
              />
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-sm font-extrabold">
                  Quantity
                </label>

                <div className="mt-2 flex h-[52px] items-center justify-between rounded-2xl border border-[#dcd4c8] bg-[#fbf9f5] px-2">
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity(
                        (current) =>
                          Math.max(
                            1,
                            current - 1,
                          ),
                      )
                    }
                    disabled={
                      quantity <= 1
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#173e2b] shadow-sm disabled:opacity-40"
                    aria-label="Reduce quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </button>

                  <span className="font-black">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setQuantity(
                        (current) =>
                          Math.min(
                            item.availableQuantity,
                            current + 1,
                          ),
                      )
                    }
                    disabled={
                      quantity >=
                      item.availableQuantity
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#173e2b] text-white disabled:opacity-40"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <p className="mt-2 text-xs text-[#7c837f]">
                  Maximum available:{' '}
                  {item.availableQuantity}
                </p>
              </div>

              <div>
                <label
                  htmlFor="delivery-time"
                  className="text-sm font-extrabold"
                >
                  Preferred delivery time
                </label>

                <input
                  id="delivery-time"
                  type="time"
                  value={
                    preferredDeliveryTime
                  }
                  onChange={(event) =>
                    setPreferredDeliveryTime(
                      event.target.value,
                    )
                  }
                  className="mt-2 h-[52px] w-full rounded-2xl border border-[#dcd4c8] bg-[#fbf9f5] px-4 text-sm font-medium outline-none focus:border-[#173e2b]"
                />
              </div>
            </div>

            <div className="mt-5">
              <label
                htmlFor="order-notes"
                className="text-sm font-extrabold"
              >
                Food or delivery notes
              </label>

              <textarea
                id="order-notes"
                value={notes}
                onChange={(event) =>
                  setNotes(
                    event.target.value,
                  )
                }
                maxLength={2000}
                rows={3}
                placeholder="Food preference, allergy, gate instructions or landmark..."
                className="mt-2 w-full resize-none rounded-2xl border border-[#dcd4c8] bg-[#fbf9f5] px-4 py-3 text-sm font-medium outline-none focus:border-[#173e2b]"
              />
            </div>

            <div className="mt-6 space-y-3 rounded-2xl bg-[#f1ece3] p-5">
              <SummaryRow
                label="Unit price"
                value={formatMoney(
                  item.price,
                )}
              />

              <SummaryRow
                label="Quantity"
                value={String(quantity)}
              />

              <SummaryRow
                label="Payment"
                value="Pay on delivery"
              />

              <div className="border-t border-[#d8cec0] pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold">
                    Amount due
                  </span>

                  <span className="text-2xl font-black text-[#173e2b]">
                    {formatMoney(
                      totalAmount,
                    )}
                  </span>
                </div>
              </div>
            </div>

            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-[#dcd4c8] bg-[#fbf9f5] p-4">
              <input
                type="checkbox"
                checked={
                  confirmInformation
                }
                onChange={(event) =>
                  setConfirmInformation(
                    event.target.checked,
                  )
                }
                className="mt-1 h-4 w-4 accent-[#173e2b]"
              />

              <span>
                <span className="block text-sm font-extrabold">
                  Confirm delivery information
                </span>

                <span className="mt-1 block text-xs leading-5 text-[#6c746f]">
                  I confirm that my phone number and delivery location are
                  correct and that payment is due when the food is delivered.
                </span>
              </span>
            </label>

            <button
              type="submit"
              disabled={
                submitting ||
                item.availableQuantity <=
                  0 ||
                !confirmInformation
              }
              className="mt-5 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#173e2b] px-6 text-sm font-extrabold text-white transition hover:bg-[#24583e] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Sending order...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send delivery order
                </>
              )}
            </button>

            <p className="mt-4 text-center text-xs leading-5 text-[#7c837f]">
              This website order does not use or change a Smart Wallet
              balance.
            </p>
          </form>
        </aside>
      </section>
    </main>
  )
}

function FormField({
  label,
  icon: Icon,
  children,
}: {
  label: string
  icon: typeof UserRound
  children: ReactNode
}) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-extrabold">
        <Icon className="h-4 w-4 text-[#173e2b]" />
        {label}
      </label>

      <div className="mt-2 flex items-center rounded-2xl border border-[#dcd4c8] bg-[#fbf9f5] focus-within:border-[#173e2b] focus-within:ring-4 focus-within:ring-[#173e2b]/10">
        {children}
      </div>
    </div>
  )
}

function InfoCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof ChefHat
  title: string
  description: string
}) {
  return (
    <div className="rounded-2xl bg-[#f1ece3] p-5">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#173e2b]">
        <Icon className="h-5 w-5" />
      </span>

      <p className="mt-4 text-sm font-extrabold">
        {title}
      </p>

      <p className="mt-2 text-xs leading-5 text-[#6c746f]">
        {description}
      </p>
    </div>
  )
}

function SummaryRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="font-semibold text-[#6c746f]">
        {label}
      </span>

      <span className="font-extrabold">
        {value}
      </span>
    </div>
  )
}
