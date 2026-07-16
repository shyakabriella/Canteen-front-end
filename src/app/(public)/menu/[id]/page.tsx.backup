'use client'

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Coffee,
  LoaderCircle,
  QrCode,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  UtensilsCrossed,
  WalletCards,
} from 'lucide-react'
import Link from 'next/link'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

type RecordValue = Record<string, unknown>

interface Category {
  id: number
  name: string
  slug: string
}

interface FoodItem {
  id: number
  categoryId: number
  categoryName: string
  name: string
  description: string
  imageUrl: string
  price: number
  unit: string
  preparationMinutes: number
  availableQuantity: number
}

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  'https://www.canteen.asyncafrica.com/api'
).replace(/\/+$/, '')

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=85'

const steps = [
  {
    title: 'Choose your meal',
    description:
      'Browse categories and live food availability from the database.',
    icon: UtensilsCrossed,
  },
  {
    title: 'Place your order',
    description:
      'Open an item, select quantity and add your instructions.',
    icon: ShoppingBag,
  },
  {
    title: 'Pay securely',
    description:
      'Complete payment using your Smart Wallet.',
    icon: WalletCards,
  },
  {
    title: 'Collect with QR',
    description:
      'Show your unique order QR code to canteen staff.',
    icon: QrCode,
  },
]

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

function rows(
  payload: unknown,
): unknown[] {
  const root = record(payload)
  const data = root?.data

  if (Array.isArray(data)) {
    return data
  }

  const pagination = record(data)

  if (Array.isArray(pagination?.data)) {
    return pagination.data
  }

  return []
}

function categoryFrom(
  value: unknown,
): Category | null {
  const source = record(value)
  const id = number(source?.id)

  if (!source || !id) {
    return null
  }

  return {
    id,
    name:
      text(source.name) ||
      `Category ${id}`,
    slug: text(source.slug),
  }
}

function itemFrom(
  value: unknown,
): FoodItem | null {
  const source = record(value)
  const id = number(source?.id)

  if (!source || !id) {
    return null
  }

  const category =
    categoryFrom(source.category)

  return {
    id,
    categoryId: number(
      source.food_category_id,
      category?.id,
    ),
    categoryName:
      category?.name ?? 'Food',
    name:
      text(source.name) ||
      `Food Item ${id}`,
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
        `Unable to load menu. HTTP ${response.status}.`,
    )
  }

  return payload
}

export default function HomePage() {
  const [categories, setCategories] =
    useState<Category[]>([])

  const [items, setItems] =
    useState<FoodItem[]>([])

  const [activeCategory, setActiveCategory] =
    useState<number | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  const loadMenu = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [
        categoriesPayload,
        itemsPayload,
      ] = await Promise.all([
        publicGet(
          '/food-categories/public?per_page=200',
        ),
        publicGet(
          '/food-items/public?per_page=200',
        ),
      ])

      const loadedCategories =
        rows(categoriesPayload)
          .map(categoryFrom)
          .filter(
            (
              item,
            ): item is Category =>
              item !== null,
          )

      const loadedItems =
        rows(itemsPayload)
          .map(itemFrom)
          .filter(
            (
              item,
            ): item is FoodItem =>
              item !== null,
          )

      setCategories(loadedCategories)
      setItems(loadedItems)

      setActiveCategory((current) => {
        if (
          current &&
          loadedCategories.some(
            (category) =>
              category.id === current,
          )
        ) {
          return current
        }

        const firstWithItems =
          loadedCategories.find(
            (category) =>
              loadedItems.some(
                (item) =>
                  item.categoryId ===
                  category.id,
              ),
          )

        return (
          firstWithItems?.id ??
          loadedCategories[0]?.id ??
          null
        )
      })
    } catch (loadError) {
      setCategories([])
      setItems([])

      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load menu.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadMenu()
  }, [loadMenu])

  const visibleItems = useMemo(
    () =>
      activeCategory
        ? items.filter(
            (item) =>
              item.categoryId ===
              activeCategory,
          )
        : items,
    [activeCategory, items],
  )

  return (
    <main className="overflow-hidden bg-[#f7f3eb] text-[#17221b]">
      <section className="relative min-h-[720px] bg-[#102018]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(90deg,rgba(8,24,15,.97),rgba(8,24,15,.82) 48%,rgba(8,24,15,.18)),url('https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=2000&q=90')",
          }}
        />

        <div className="relative mx-auto flex min-h-[720px] max-w-7xl items-center px-5 py-20 sm:px-8">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#d9b779]/40 bg-[#d9b779]/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.24em] text-[#f0d7a8]">
              <Sparkles className="h-4 w-4" />
              Live restaurant menu
            </span>

            <h1 className="mt-7 text-4xl font-black leading-[1.05] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
              Fresh meals,
              <br />
              quality coffee,
              <br />
              <span className="text-[#e1bb75]">
                effortless ordering.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-8 text-white/70 sm:text-lg">
              View live categories, prices, preparation times and available
              stock directly from the Smart Canteen database.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="#menu"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-[#d9b779] px-7 text-sm font-extrabold text-[#152119]"
              >
                Explore live menu
                <ArrowRight className="h-4 w-4" />
              </a>

              <Link
                href="/login"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-white/25 bg-white/5 px-7 text-sm font-extrabold text-white"
              >
                Login to order
                <ShoppingBag className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section
        id="menu"
        className="py-20 sm:py-24"
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <SectionTitle
              eyebrow="Live menu"
              title="Food available right now"
              description="Every category and item below is loaded from Laravel and MySQL."
            />

            <button
              type="button"
              onClick={() => {
                void loadMenu()
              }}
              disabled={loading}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#d7cec0] bg-white px-5 text-sm font-extrabold text-[#173e2b] disabled:opacity-50"
            >
              {loading ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh menu
            </button>
          </div>

          {error && (
            <div className="mt-8 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex min-h-96 flex-col items-center justify-center">
              <LoaderCircle className="h-10 w-10 animate-spin text-[#173e2b]" />
              <p className="mt-4 font-extrabold">
                Loading food from database...
              </p>
            </div>
          ) : (
            <>
              <div className="mt-10 flex flex-wrap gap-2">
                {categories.map(
                  (category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() =>
                        setActiveCategory(
                          category.id,
                        )
                      }
                      className={`rounded-full px-5 py-3 text-sm font-extrabold ${
                        activeCategory ===
                        category.id
                          ? 'bg-[#173e2b] text-white shadow-lg'
                          : 'border border-[#d7cec0] bg-white text-[#4a554e]'
                      }`}
                    >
                      {category.name}
                    </button>
                  ),
                )}
              </div>

              {visibleItems.length === 0 ? (
                <div className="mt-10 rounded-[2rem] border border-[#ddd4c7] bg-white p-10 text-center">
                  <UtensilsCrossed className="mx-auto h-12 w-12 text-[#9b7640]" />
                  <h3 className="mt-4 text-xl font-black">
                    No available food
                  </h3>
                  <p className="mt-2 text-sm text-[#6c746f]">
                    This category has no active items with available stock.
                  </p>
                </div>
              ) : (
                <div className="mt-9 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {visibleItems.map(
                    (item) => (
                      <article
                        key={item.id}
                        className="overflow-hidden rounded-[1.75rem] border border-[#ddd4c7] bg-white shadow-[0_18px_50px_rgba(46,38,26,.08)]"
                      >
                        <Link
                          href={`/menu/${item.id}`}
                          className="block"
                        >
                          <div
                            className="relative h-64 bg-cover bg-center"
                            style={{
                              backgroundImage: `url('${item.imageUrl}')`,
                            }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                            <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-extrabold text-[#173e2b]">
                              {
                                item.availableQuantity
                              }{' '}
                              available
                            </span>

                            {item.preparationMinutes >
                              0 && (
                              <span className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-[#102018]/90 px-3 py-1.5 text-xs font-extrabold text-white">
                                <Clock3 className="h-3.5 w-3.5" />
                                {
                                  item.preparationMinutes
                                }{' '}
                                min
                              </span>
                            )}
                          </div>
                        </Link>

                        <div className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#9b7640]">
                                {item.categoryName}
                              </p>

                              <Link
                                href={`/menu/${item.id}`}
                                className="mt-2 block text-xl font-black"
                              >
                                {item.name}
                              </Link>
                            </div>

                            <p className="shrink-0 font-black text-[#173e2b]">
                              {money(item.price)}
                            </p>
                          </div>

                          <p className="mt-3 line-clamp-2 min-h-12 text-sm leading-6 text-[#6c746f]">
                            {item.description ||
                              'Freshly prepared food item.'}
                          </p>

                          <div className="mt-5 flex items-center justify-between border-t border-[#eee7dc] pt-5">
                            <span className="text-xs font-bold capitalize text-[#6c746f]">
                              Per {item.unit}
                            </span>

                            <Link
                              href={`/menu/${item.id}`}
                              className="inline-flex items-center gap-2 rounded-full bg-[#173e2b] px-5 py-2.5 text-xs font-extrabold text-white"
                            >
                              View & order
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </div>
                        </div>
                      </article>
                    ),
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <section className="bg-[#173e2b] py-20 text-white sm:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2">
          <div
            className="min-h-[500px] rounded-[2.5rem] bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=90')",
            }}
          />

          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.24em] text-[#e1bb75]">
              Smart dining experience
            </p>

            <h2 className="mt-4 text-3xl font-black sm:text-5xl">
              Real availability with professional service
            </h2>

            <div className="mt-8 space-y-5">
              <Experience
                icon={Coffee}
                title="Live catalogue"
                text="Food information is managed from the administration dashboard."
              />

              <Experience
                icon={ShieldCheck}
                title="Protected payment"
                text="Laravel validates wallet balance, availability and stock."
              />

              <Experience
                icon={Star}
                title="Verified pickup"
                text="A unique pickup QR is generated after successful payment."
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <SectionTitle
            eyebrow="Simple by design"
            title="From live menu to secure pickup"
            description="The food, inventory, wallet and order controllers work together."
            centered
          />

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {steps.map((step, index) => {
              const Icon = step.icon

              return (
                <article
                  key={step.title}
                  className="relative rounded-[1.75rem] border border-[#e3ddd4] bg-[#fbf9f5] p-6"
                >
                  <span className="absolute right-5 top-4 text-5xl font-black text-[#ebe4d9]">
                    {String(index + 1).padStart(
                      2,
                      '0',
                    )}
                  </span>

                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#173e2b] text-white">
                    <Icon className="h-5 w-5" />
                  </span>

                  <h3 className="mt-8 text-lg font-black">
                    {step.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-[#6c746f]">
                    {step.description}
                  </p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#102018] py-20 text-center text-white sm:py-24">
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <CheckCircle2 className="mx-auto h-12 w-12 text-[#e1bb75]" />

          <h2 className="mt-5 text-3xl font-black sm:text-5xl">
            Choose an available item and order
          </h2>

          <a
            href="#menu"
            className="mt-8 inline-flex h-14 items-center justify-center gap-2 rounded-full bg-[#d9b779] px-8 text-sm font-extrabold text-[#152119]"
          >
            Browse live menu
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>
    </main>
  )
}

function SectionTitle({
  eyebrow,
  title,
  description,
  centered = false,
}: {
  eyebrow: string
  title: string
  description: string
  centered?: boolean
}) {
  return (
    <div
      className={
        centered
          ? 'mx-auto max-w-3xl text-center'
          : 'max-w-3xl'
      }
    >
      <p className="text-xs font-extrabold uppercase tracking-[.24em] text-[#9b7640]">
        {eyebrow}
      </p>
      <h2 className="mt-4 text-3xl font-black sm:text-5xl">
        {title}
      </h2>
      <p className="mt-5 text-base leading-8 text-[#6c746f]">
        {description}
      </p>
    </div>
  )
}

function Experience({
  icon: Icon,
  title,
  text: description,
}: {
  icon: typeof Coffee
  title: string
  text: string
}) {
  return (
    <div className="flex gap-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#e1bb75]">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="font-extrabold">
          {title}
        </p>
        <p className="mt-1 text-sm leading-6 text-white/60">
          {description}
        </p>
      </div>
    </div>
  )
}