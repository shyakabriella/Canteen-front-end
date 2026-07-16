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

type RecordValue = Record<string, unknown>

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
  totalAmount: number
  paymentStatus: string
  orderStatus: string
  deliveryLocation: string
}

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  'https://www.canteen.asyncafrica.com/api'
).replace(/\/+$/, '')

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1600&q=90'

function asRecord(value: unknown): RecordValue | null {
  return typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
    ? (value as RecordValue)
    : null
}

function text(...values: unknown[]): string {
  for (const value of values) {
    if (
      value !== null &&
      value !== undefined &&
      String(value).trim()
    ) {
      return String(value).trim()
    }
  }

  return ''
}

function numeric(...values: unknown[]): number {
  for (const value of values) {
    const parsed = Number(value)

    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return 0
}

function unwrap(payload: unknown): unknown {
  return asRecord(payload)?.data ?? payload
}

function parseItem(payload: unknown): FoodItem | null {
  const source = asRecord(unwrap(payload))
  const id = numeric(source?.id)

  if (!source || !id) {
    return null
  }

  const category = asRecord(source.category)

  return {
    id,
    categoryName: text(category?.name) || 'Food',
    name: text(source.name) || `Food Item ${id}`,
    sku: text(source.sku),
    description: text(source.description),
    imageUrl:
      text(
        source.image_url,
        source.imageUrl,
        source.image,
      ) || FALLBACK_IMAGE,
    price: numeric(source.price),
    unit: text(source.unit) || 'piece',
    preparationMinutes: numeric(
      source.preparation_time_minutes,
      source.preparationTimeMinutes,
    ),
    availableQuantity: numeric(
      source.available_quantity,
      source.availableQuantity,
    ),
  }
}

function parseGuestOrder(payload: unknown): GuestOrderResult {
  const source = asRecord(unwrap(payload)) ?? {}

  return {
    id:
      typeof source.id === 'number' ||
      typeof source.id === 'string'
        ? source.id
        : '',
    orderNumber: text(
      source.order_number,
      source.id,
      'New delivery order',
    ),
    totalAmount: numeric(
      source.total_amount,
      source.amount_due,
    ),
    paymentStatus: text(source.payment_status) || 'pending',
    orderStatus: text(source.order_status) || 'pending',
    deliveryLocation: text(source.delivery_location),
  }
}

function money(value: number): string {
  return `${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(value)} RWF`
}

async function apiRequest(
  path: string,
  options?: RequestInit,
): Promise<unknown> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    cache: 'no-store',
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const source = asRecord(payload)
    const errors = asRecord(source?.errors)

    const firstValidationError = errors
      ? Object.values(errors)
          .flat()
          .map(String)
          .find(Boolean)
      : ''

    throw new Error(
      firstValidationError ||
        text(source?.message) ||
        `Request failed. HTTP ${response.status}.`,
    )
  }

  return payload
}

export default function MenuItemDetailPage() {
  const params = useParams<{ id: string }>()
  const itemId = Number(params.id)

  const [item, setItem] = useState<FoodItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<GuestOrderResult | null>(null)

  const [quantity, setQuantity] = useState(1)
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [deliveryLocation, setDeliveryLocation] = useState('')
  const [preferredDeliveryTime, setPreferredDeliveryTime] = useState('')
  const [notes, setNotes] = useState('')

  const loadItem = useCallback(async () => {
    if (!Number.isInteger(itemId) || itemId <= 0) {
      setError('The food item ID is invalid.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      const payload = await apiRequest(
        `/food-items/public/${itemId}`,
      )

      const loadedItem = parseItem(payload)

      if (!loadedItem) {
        throw new Error(
          'The API returned invalid food-item data.',
        )
      }

      setItem(loadedItem)
    } catch (loadError) {
      setItem(null)
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load this food item.',
      )
    } finally {
      setLoading(false)
    }
  }, [itemId])

  useEffect(() => {
    void loadItem()
  }, [loadItem])

  const total = useMemo(
    () => (item ? item.price * quantity : 0),
    [item, quantity],
  )

  async function submitOrder(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (!item) {
      return
    }

    if (
      quantity < 1 ||
      quantity > item.availableQuantity
    ) {
      setError(
        `Only ${item.availableQuantity} ${item.unit}(s) are available.`,
      )
      return
    }

    setSubmitting(true)
    setError('')
    setResult(null)

    try {
      const payload = await apiRequest('/orders/guest', {
        method: 'POST',
        body: JSON.stringify({
          customer_name: customerName.trim(),
          customer_email: customerEmail.trim(),
          customer_phone: customerPhone.trim(),
          delivery_location: deliveryLocation.trim(),
          preferred_delivery_time:
            preferredDeliveryTime || null,
          customer_notes: notes.trim() || null,
          items: [
            {
              food_item_id: item.id,
              quantity,
              notes: notes.trim() || null,
            },
          ],
        }),
      })

      setResult(parseGuestOrder(payload))
      setQuantity(1)
      setNotes('')
      await loadItem()
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to submit delivery order.',
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
          <p className="mt-4 font-extrabold">
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
          <h1 className="mt-5 text-2xl font-black">
            Menu item unavailable
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#6c746f]">
            {error || 'This item is unavailable or out of stock.'}
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
              className="inline-flex items-center gap-2 text-sm font-bold text-white/65"
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
            style={{ backgroundImage: `url('${item.imageUrl}')` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
            <span className="absolute left-5 top-5 rounded-full bg-white/95 px-4 py-2 text-xs font-extrabold text-[#173e2b]">
              {item.availableQuantity} {item.unit}(s) available
            </span>
            <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
              {item.preparationMinutes > 0 && (
                <span className="inline-flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 text-xs font-extrabold">
                  <Clock3 className="h-4 w-4" />
                  {item.preparationMinutes} min preparation
                </span>
              )}
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
                'No additional description provided.'
              }
            />
            <InfoCard
              icon={PackageCheck}
              title="Current availability"
              description={`${item.availableQuantity} ${item.unit}(s) can be ordered.`}
            />
            <InfoCard
              icon={Clock3}
              title="Preparation time"
              description={
                item.preparationMinutes > 0
                  ? `Approximately ${item.preparationMinutes} minutes before delivery handling.`
                  : 'Preparation time will be confirmed.'
              }
            />
            <InfoCard
              icon={ShieldCheck}
              title="Pay later"
              description={`${money(item.price)} per ${item.unit}. No wallet is charged; payment is due on delivery.`}
            />
          </div>
        </article>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <form
            onSubmit={submitOrder}
            className="rounded-[2rem] border border-[#ddd4c7] bg-white p-6 shadow-[0_20px_60px_rgba(46,38,26,.1)] sm:p-8"
          >
            {error && (
              <div className="mb-5 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {result && (
              <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex gap-3">
                  <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-700" />
                  <div>
                    <p className="font-extrabold text-emerald-900">
                      Delivery order received
                    </p>
                    <p className="mt-1 text-sm font-black text-emerald-800">
                      {result.orderNumber}
                    </p>
                    <p className="mt-2 text-sm text-emerald-800">
                      Amount due on delivery:{' '}
                      <strong>
                        {money(result.totalAmount || total)}
                      </strong>
                    </p>
                    <p className="mt-2 text-xs leading-5 text-emerald-700">
                      No wallet balance was changed. We will use
                      the phone number and delivery location provided.
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
                No account or app is required. Submit now and pay
                when the food is delivered.
              </p>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <FormField label="Full name" icon={UserRound}>
                <input
                  type="text"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  required
                  autoComplete="name"
                  placeholder="Your full name"
                  className="h-13 w-full rounded-2xl border border-[#dcd4c8] bg-[#fbf9f5] px-4 text-sm outline-none focus:border-[#173e2b]"
                />
              </FormField>

              <FormField label="Phone number" icon={Phone}>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  required
                  autoComplete="tel"
                  placeholder="+250..."
                  className="h-13 w-full rounded-2xl border border-[#dcd4c8] bg-[#fbf9f5] px-4 text-sm outline-none focus:border-[#173e2b]"
                />
              </FormField>
            </div>

            <div className="mt-5">
              <FormField label="Email address" icon={Mail}>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(event) => setCustomerEmail(event.target.value)}
                  required
                  autoComplete="email"
                  placeholder="name@example.com"
                  className="h-13 w-full rounded-2xl border border-[#dcd4c8] bg-[#fbf9f5] px-4 text-sm outline-none focus:border-[#173e2b]"
                />
              </FormField>
            </div>

            <div className="mt-5">
              <FormField label="Delivery location" icon={MapPin}>
                <textarea
                  value={deliveryLocation}
                  onChange={(event) => setDeliveryLocation(event.target.value)}
                  required
                  rows={3}
                  placeholder="District, sector, street, building, gate or nearby landmark..."
                  className="w-full resize-none rounded-2xl border border-[#dcd4c8] bg-[#fbf9f5] px-4 py-3 text-sm outline-none focus:border-[#173e2b]"
                />
              </FormField>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-sm font-extrabold">
                  Quantity
                </label>
                <div className="mt-2 flex h-13 items-center justify-between rounded-2xl border border-[#dcd4c8] bg-[#fbf9f5] px-2">
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((value) => Math.max(1, value - 1))
                    }
                    disabled={quantity <= 1}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-white disabled:opacity-40"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="font-black">{quantity}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((value) =>
                        Math.min(item.availableQuantity, value + 1),
                      )
                    }
                    disabled={quantity >= item.availableQuantity}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#173e2b] text-white disabled:opacity-40"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-extrabold">
                  Preferred delivery time
                </label>
                <input
                  type="time"
                  value={preferredDeliveryTime}
                  onChange={(event) =>
                    setPreferredDeliveryTime(event.target.value)
                  }
                  className="mt-2 h-13 w-full rounded-2xl border border-[#dcd4c8] bg-[#fbf9f5] px-4 text-sm"
                />
              </div>
            </div>

            <div className="mt-5">
              <label className="text-sm font-extrabold">
                Delivery or food notes
              </label>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                placeholder="Allergies, food preference, gate instructions or landmark..."
                className="mt-2 w-full resize-none rounded-2xl border border-[#dcd4c8] bg-[#fbf9f5] px-4 py-3 text-sm"
              />
            </div>

            <div className="mt-6 rounded-2xl bg-[#f1ece3] p-5">
              <Summary label="Unit price" value={money(item.price)} />
              <Summary label="Quantity" value={String(quantity)} />
              <div className="mt-3 border-t border-[#d8cec0] pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold">
                    Pay on delivery
                  </span>
                  <span className="text-2xl font-black text-[#173e2b]">
                    {money(total)}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || item.availableQuantity <= 0}
              className="mt-6 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#173e2b] px-6 text-sm font-extrabold text-white transition hover:bg-[#24583e] disabled:cursor-not-allowed disabled:opacity-50"
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
              This website order does not use or change a Smart Wallet balance.
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
      <label className="mb-2 flex items-center gap-2 text-sm font-extrabold">
        <Icon className="h-4 w-4 text-[#173e2b]" />
        {label}
      </label>
      {children}
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
      <p className="mt-4 text-sm font-extrabold">{title}</p>
      <p className="mt-2 text-xs leading-5 text-[#6c746f]">
        {description}
      </p>
    </div>
  )
}

function Summary({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="font-semibold text-[#6c746f]">{label}</span>
      <span className="font-extrabold">{value}</span>
    </div>
  )
}
