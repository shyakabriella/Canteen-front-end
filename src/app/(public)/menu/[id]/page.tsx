'use client'

import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChefHat,
  Clock3,
  Info,
  LoaderCircle,
  Minus,
  PackageCheck,
  Plus,
  ShieldCheck,
  ShoppingBag,
  UtensilsCrossed,
  WalletCards,
} from 'lucide-react'
import Link from 'next/link'
import {
  useParams,
  useRouter,
} from 'next/navigation'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'
import { apiRequest } from '@/lib/api'

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

interface CreatedOrder {
  id: number | string
  orderNumber: string
  status: string
  totalAmount: number
}

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  'https://www.canteen.asyncafrica.com/api'
).replace(/\/+$/, '')

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1600&q=90'

function record(
  value: unknown,
): RecordValue | null {
  return typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
    ? (value as RecordValue)
    : null
}

function text(
  ...values: unknown[]
): string {
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

function number(
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

function unwrap(
  payload: unknown,
): unknown {
  return record(payload)?.data ?? payload
}

function itemFrom(
  payload: unknown,
): FoodItem | null {
  const source = record(unwrap(payload))
  const id = number(source?.id)

  if (!source || !id) {
    return null
  }

  const category =
    record(source.category)

  return {
    id,
    categoryName:
      text(category?.name) || 'Food',
    name:
      text(source.name) ||
      `Food Item ${id}`,
    sku: text(source.sku),
    description: text(
      source.description,
    ),
    imageUrl:
      text(
        source.image_url,
        source.imageUrl,
        source.image,
      ) || FALLBACK_IMAGE,
    price: number(source.price),
    unit:
      text(source.unit) || 'piece',
    preparationMinutes: number(
      source.preparation_time_minutes,
      source.preparationTimeMinutes,
    ),
    availableQuantity: number(
      source.available_quantity,
      source.availableQuantity,
    ),
  }
}

function createdOrderFrom(
  payload: unknown,
): CreatedOrder {
  const source =
    record(unwrap(payload)) ?? {}

  return {
    id:
      typeof source.id === 'number' ||
      typeof source.id === 'string'
        ? source.id
        : '',
    orderNumber: text(
      source.order_number,
      source.orderNumber,
      source.id,
      'New order',
    ),
    status:
      text(
        source.order_status,
        source.status,
      ) || 'confirmed',
    totalAmount: number(
      source.total_amount,
      source.totalAmount,
    ),
  }
}

function money(
  value: number,
): string {
  return `${new Intl.NumberFormat(
    'en-US',
    {
      maximumFractionDigits: 0,
    },
  ).format(value)} RWF`
}

function statusOf(
  error: unknown,
): number {
  if (
    typeof error === 'object' &&
    error !== null &&
    'status' in error
  ) {
    return Number(
      (
        error as {
          status?: unknown
        }
      ).status,
    )
  }

  return 0
}

async function publicGet(
  path: string,
): Promise<unknown> {
  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    },
  )

  const payload = await response
    .json()
    .catch(() => null)

  if (!response.ok) {
    const source = record(payload)

    throw new Error(
      text(source?.message) ||
        `Unable to load item. HTTP ${response.status}.`,
    )
  }

  return payload
}

export default function MenuItemDetailPage() {
  const params = useParams<{
    id: string
  }>()

  const router = useRouter()
  const itemId = Number(params.id)

  const [item, setItem] =
    useState<FoodItem | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [submitting, setSubmitting] =
    useState(false)

  const [error, setError] =
    useState('')

  const [createdOrder, setCreatedOrder] =
    useState<CreatedOrder | null>(null)

  const [quantity, setQuantity] =
    useState(1)

  const [preferredTime, setPreferredTime] =
    useState('12:30')

  const [notes, setNotes] =
    useState('')

  const [serviceType, setServiceType] =
    useState<'pickup' | 'dine_in'>(
      'pickup',
    )

  const loadItem = useCallback(async () => {
    if (
      !Number.isInteger(itemId) ||
      itemId <= 0
    ) {
      setError(
        'The food item ID is invalid.',
      )
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      const payload = await publicGet(
        `/food-items/public/${itemId}`,
      )

      const loaded = itemFrom(payload)

      if (!loaded) {
        throw new Error(
          'The API returned invalid food-item data.',
        )
      }

      setItem(loaded)

      const stored =
        sessionStorage.getItem(
          'smart_canteen_booking_draft',
        )

      if (stored) {
        try {
          const draft = JSON.parse(
            stored,
          ) as RecordValue

          if (
            number(
              draft.food_item_id,
            ) === loaded.id
          ) {
            setQuantity(
              Math.max(
                1,
                Math.min(
                  loaded.availableQuantity,
                  number(
                    draft.quantity,
                    1,
                  ),
                ),
              ),
            )

            setPreferredTime(
              text(
                draft.preferred_time,
                draft.pickup_time,
                '12:30',
              ),
            )

            setNotes(
              text(
                draft.customer_notes,
                draft.notes,
              ),
            )

            const type = text(
              draft.service_type,
            )

            if (
              type === 'pickup' ||
              type === 'dine_in'
            ) {
              setServiceType(type)
            }
          }
        } catch {
          sessionStorage.removeItem(
            'smart_canteen_booking_draft',
          )
        }
      }
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
    () =>
      item
        ? item.price * quantity
        : 0,
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
      item.availableQuantity <= 0 ||
      quantity > item.availableQuantity
    ) {
      setError(
        `Only ${item.availableQuantity} ${item.unit}(s) are available.`,
      )
      return
    }

    setSubmitting(true)
    setError('')
    setCreatedOrder(null)

    const draft = {
      food_item_id: item.id,
      food_name: item.name,
      quantity,
      service_type: serviceType,
      preferred_time: preferredTime,
      customer_notes: notes.trim(),
      unit_price: item.price,
      estimated_total: total,
    }

    sessionStorage.setItem(
      'smart_canteen_booking_draft',
      JSON.stringify(draft),
    )

    try {
      const noteParts = [
        `Preferred time: ${preferredTime}`,
        notes.trim(),
      ].filter(Boolean)

      const payload =
        await apiRequest<unknown>(
          '/orders',
          {
            method: 'POST',
            auth: true,
            body: {
              order_type: serviceType,
              payment_method: 'wallet',
              customer_notes:
                noteParts.join(' | ') ||
                null,
              items: [
                {
                  food_item_id: item.id,
                  quantity,
                  notes:
                    notes.trim() ||
                    null,
                },
              ],
            },
          },
        )

      setCreatedOrder(
        createdOrderFrom(payload),
      )

      sessionStorage.removeItem(
        'smart_canteen_booking_draft',
      )

      await loadItem()
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : 'Unable to create order.'

      const status =
        statusOf(submitError)

      if (
        status === 401 ||
        message
          .toLowerCase()
          .includes('unauthenticated') ||
        message
          .toLowerCase()
          .includes('login')
      ) {
        const redirect =
          encodeURIComponent(
            `/menu/${item.id}`,
          )

        router.push(
          `/login?redirect=${redirect}&resume_order=1`,
        )
        return
      }

      setError(message)
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
            {error ||
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

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:py-14">
        <article className="overflow-hidden rounded-[2rem] border border-[#ddd4c7] bg-white shadow-[0_20px_60px_rgba(46,38,26,.1)]">
          <div
            className="relative min-h-[430px] bg-cover bg-center sm:min-h-[540px]"
            style={{
              backgroundImage: `url('${item.imageUrl}')`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

            <span className="absolute left-5 top-5 rounded-full bg-white/95 px-4 py-2 text-xs font-extrabold text-[#173e2b]">
              {item.availableQuantity}{' '}
              {item.unit}(s) available
            </span>

            <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
              <div className="flex flex-wrap gap-3">
                {item.preparationMinutes >
                  0 && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 text-xs font-extrabold">
                    <Clock3 className="h-4 w-4" />
                    {
                      item.preparationMinutes
                    }{' '}
                    min
                  </span>
                )}

                {item.sku && (
                  <span className="rounded-full bg-black/40 px-3 py-1.5 text-xs font-extrabold">
                    SKU: {item.sku}
                  </span>
                )}
              </div>

              <h2 className="mt-4 text-3xl font-black sm:text-5xl">
                {item.name}
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
                {item.description ||
                  'Freshly prepared and available to order.'}
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
                  ? `Approximately ${item.preparationMinutes} minutes.`
                  : 'Preparation time will be confirmed.'
              }
            />

            <InfoCard
              icon={ShieldCheck}
              title="Database price"
              description={`${money(item.price)} per ${item.unit}. Laravel verifies it again at checkout.`}
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

            {createdOrder && (
              <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex gap-3">
                  <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-700" />

                  <div>
                    <p className="font-extrabold text-emerald-900">
                      Order created successfully
                    </p>

                    <p className="mt-1 text-sm font-bold text-emerald-800">
                      {createdOrder.orderNumber}
                    </p>

                    <p className="mt-1 text-sm text-emerald-800">
                      Total:{' '}
                      {money(
                        createdOrder.totalAmount ||
                          total,
                      )}
                    </p>

                    {createdOrder.id && (
                      <Link
                        href={`/student/orders/${createdOrder.id}`}
                        className="mt-3 inline-flex items-center gap-2 text-sm font-extrabold text-emerald-800 underline"
                      >
                        View order
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-start justify-between gap-4 border-b border-[#ece5da] pb-6">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#9b7640]">
                  Order this item
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  Build your order
                </h2>
              </div>

              <span className="rounded-full bg-[#edf4ef] px-4 py-2 text-sm font-black text-[#173e2b]">
                {money(item.price)}
              </span>
            </div>

            <div className="mt-6">
              <label className="text-sm font-extrabold">
                Service type
              </label>

              <div className="mt-2 grid grid-cols-2 gap-3">
                {(
                  [
                    ['pickup', 'Pickup'],
                    ['dine_in', 'Dine in'],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setServiceType(value)
                    }
                    className={`rounded-2xl border px-4 py-3 text-sm font-extrabold ${
                      serviceType === value
                        ? 'border-[#173e2b] bg-[#173e2b] text-white'
                        : 'border-[#dcd4c8] bg-[#fbf9f5] text-[#4f5b53]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <label className="text-sm font-extrabold">
                Quantity
              </label>

              <div className="mt-2 flex h-14 items-center justify-between rounded-2xl border border-[#dcd4c8] bg-[#fbf9f5] px-2">
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((value) =>
                      Math.max(1, value - 1),
                    )
                  }
                  disabled={quantity <= 1}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white disabled:opacity-40"
                >
                  <Minus className="h-4 w-4" />
                </button>

                <span className="text-lg font-black">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setQuantity((value) =>
                      Math.min(
                        item.availableQuantity,
                        value + 1,
                      ),
                    )
                  }
                  disabled={
                    quantity >=
                    item.availableQuantity
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#173e2b] text-white disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <p className="mt-2 text-xs text-[#7c837f]">
                Maximum available:{' '}
                {item.availableQuantity}
              </p>
            </div>

            <div className="mt-5">
              <label className="text-sm font-extrabold">
                Preferred time
              </label>

              <input
                type="time"
                value={preferredTime}
                onChange={(event) =>
                  setPreferredTime(
                    event.target.value,
                  )
                }
                required
                className="mt-2 h-14 w-full rounded-2xl border border-[#dcd4c8] bg-[#fbf9f5] px-4"
              />
            </div>

            <div className="mt-5">
              <label className="text-sm font-extrabold">
                Order notes
              </label>

              <textarea
                value={notes}
                onChange={(event) =>
                  setNotes(event.target.value)
                }
                rows={4}
                placeholder="Allergies, preferences or instructions..."
                className="mt-2 w-full resize-none rounded-2xl border border-[#dcd4c8] bg-[#fbf9f5] px-4 py-3"
              />
            </div>

            <div className="mt-6 space-y-3 rounded-2xl bg-[#f1ece3] p-5">
              <Summary
                label="Unit price"
                value={money(item.price)}
              />
              <Summary
                label="Quantity"
                value={String(quantity)}
              />
              <Summary
                label="Preparation"
                value={
                  item.preparationMinutes > 0
                    ? `${item.preparationMinutes} min`
                    : 'To be confirmed'
                }
              />

              <div className="border-t border-[#d8cec0] pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold">
                    Estimated total
                  </span>
                  <span className="text-2xl font-black text-[#173e2b]">
                    {money(total)}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={
                submitting ||
                item.availableQuantity <= 0
              }
              className="mt-6 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#173e2b] px-6 text-sm font-extrabold text-white disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Creating order...
                </>
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4" />
                  Pay with wallet and order
                </>
              )}
            </button>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <Benefit
                icon={WalletCards}
                text="Secure wallet payment"
              />
              <Benefit
                icon={UtensilsCrossed}
                text="Database-verified item"
              />
            </div>
          </form>
        </aside>
      </section>
    </main>
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

function Summary({
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

function Benefit({
  icon: Icon,
  text: label,
}: {
  icon: typeof WalletCards
  text: string
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-[#f8f5ef] px-3 py-3 text-xs font-bold text-[#4f5b53]">
      <Icon className="h-4 w-4 text-[#173e2b]" />
      {label}
    </div>
  )
}
