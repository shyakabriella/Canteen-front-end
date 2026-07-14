'use client'

import {
  BellRing,
  CircleAlert,
  Clock3,
  CreditCard,
  LayoutDashboard,
  LoaderCircle,
  RefreshCw,
  ShoppingBag,
  UtensilsCrossed,
  XCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

type UnknownRecord = Record<string, unknown>

type TableAction =
  | 'order'
  | 'call'
  | 'pay'
  | 'cancel'

interface EventTable {
  id: number | string
  table_number: string
  name: string
  location: string
}

interface TableActionEvent {
  id: number
  action: TableAction
  status: string
  message: string
  occurred_at: string
  created_at: string
  table: EventTable
}

interface ActionSummary {
  all: number
  order: number
  call: number
  pay: number
  cancel: number
}

const API_BASE_URL = removeTrailingSlash(
  process.env.NEXT_PUBLIC_API_BASE_URL ??
    'https://www.canteen.asyncafrica.com/api',
)

const APP_NAME =
  process.env.NEXT_PUBLIC_APP_NAME ??
  'Smart Canteen'

const actionConfig: Record<
  TableAction,
  {
    label: string
    icon: LucideIcon
    cardClass: string
    iconClass: string
    badgeClass: string
  }
> = {
  call: {
    label: 'Call Staff',
    icon: BellRing,
    cardClass:
      'border-cyan-400/30 bg-cyan-400/10',
    iconClass:
      'bg-cyan-400 text-slate-950',
    badgeClass:
      'border-cyan-300/30 bg-cyan-300/10 text-cyan-100',
  },

  order: {
    label: 'Order',
    icon: ShoppingBag,
    cardClass:
      'border-lime-400/30 bg-lime-400/10',
    iconClass:
      'bg-lime-400 text-slate-950',
    badgeClass:
      'border-lime-300/30 bg-lime-300/10 text-lime-100',
  },

  pay: {
    label: 'Pay',
    icon: CreditCard,
    cardClass:
      'border-yellow-400/30 bg-yellow-400/10',
    iconClass:
      'bg-yellow-400 text-slate-950',
    badgeClass:
      'border-yellow-300/30 bg-yellow-300/10 text-yellow-100',
  },

  cancel: {
    label: 'Cancel',
    icon: XCircle,
    cardClass:
      'border-rose-400/30 bg-rose-400/10',
    iconClass:
      'bg-rose-400 text-white',
    badgeClass:
      'border-rose-300/30 bg-rose-300/10 text-rose-100',
  },
}

function removeTrailingSlash(
  value: string,
): string {
  return value.replace(/\/+$/, '')
}

function asRecord(
  value: unknown,
): UnknownRecord {
  if (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  ) {
    return value as UnknownRecord
  }

  return {}
}

function stringValue(
  ...values: unknown[]
): string {
  const found = values.find(
    (value) =>
      value !== undefined &&
      value !== null &&
      String(value).trim() !== '',
  )

  return found === undefined
    ? ''
    : String(found)
}

function numberValue(
  value: unknown,
  fallback = 0,
): number {
  const parsed = Number(value)

  return Number.isFinite(parsed)
    ? parsed
    : fallback
}

function normalizeAction(
  value: unknown,
): TableAction {
  const action = String(value ?? '')
    .trim()
    .toLowerCase()

  if (
    action === 'order' ||
    action === 'call' ||
    action === 'pay' ||
    action === 'cancel'
  ) {
    return action
  }

  return 'call'
}

function normalizeTable(
  value: unknown,
): EventTable {
  const record = asRecord(value)

  return {
    id:
      stringValue(record.id) ||
      stringValue(
        record.table_number,
      ),

    table_number:
      stringValue(
        record.table_number,
        record.table_no,
        record.number,
      ) || 'Unknown',

    name:
      stringValue(
        record.name,
        record.table_name,
      ) || 'Canteen Table',

    location:
      stringValue(
        record.location,
        record.area,
        record.section,
      ) || 'Canteen',
  }
}

function normalizeEvent(
  value: unknown,
): TableActionEvent {
  const record = asRecord(value)

  return {
    id: numberValue(record.id),

    action:
      normalizeAction(record.action),

    status:
      stringValue(
        record.status,
      ) || 'pending',

    message:
      stringValue(record.message),

    occurred_at:
      stringValue(
        record.occurred_at,
        record.created_at,
      ),

    created_at:
      stringValue(record.created_at),

    table:
      normalizeTable(
        record.table ??
          record.canteen_table,
      ),
  }
}

function extractPayload(
  payload: unknown,
): {
  events: TableActionEvent[]
  summary: ActionSummary
} {
  const root = asRecord(payload)
  const data = asRecord(root.data)

  const eventCandidates: unknown[] = [
    data.events,
    root.events,
    data.data,
    root.data,
  ]

  const collection = eventCandidates.find(
    (candidate) =>
      Array.isArray(candidate),
  )

  const summaryRecord = asRecord(
    data.summary ??
      root.summary,
  )

  const events = Array.isArray(collection)
    ? collection.map(normalizeEvent)
    : []

  return {
    events,

    summary: {
      all:
        numberValue(
          summaryRecord.all,
          events.length,
        ),

      order:
        numberValue(
          summaryRecord.order,
          events.filter(
            (event) =>
              event.action === 'order',
          ).length,
        ),

      call:
        numberValue(
          summaryRecord.call,
          events.filter(
            (event) =>
              event.action === 'call',
          ).length,
        ),

      pay:
        numberValue(
          summaryRecord.pay,
          events.filter(
            (event) =>
              event.action === 'pay',
          ).length,
        ),

      cancel:
        numberValue(
          summaryRecord.cancel,
          events.filter(
            (event) =>
              event.action === 'cancel',
          ).length,
        ),
    },
  }
}

function formatDateTime(
  value: string,
): string {
  if (!value) {
    return 'Now'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(
    'en',
    {
      dateStyle: 'medium',
      timeStyle: 'medium',
    },
  ).format(date)
}

function timeAgo(
  value: string,
): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Now'
  }

  const seconds = Math.max(
    0,
    Math.floor(
      (Date.now() - date.getTime()) /
        1000,
    ),
  )

  if (seconds < 10) {
    return 'Just now'
  }

  if (seconds < 60) {
    return `${seconds}s ago`
  }

  const minutes = Math.floor(
    seconds / 60,
  )

  if (minutes < 60) {
    return `${minutes}m ago`
  }

  const hours = Math.floor(
    minutes / 60,
  )

  if (hours < 24) {
    return `${hours}h ago`
  }

  const days = Math.floor(hours / 24)

  return `${days}d ago`
}

export default function TableActivityPage() {
  const [events, setEvents] = useState<
    TableActionEvent[]
  >([])

  const [summary, setSummary] =
    useState<ActionSummary>({
      all: 0,
      order: 0,
      call: 0,
      pay: 0,
      cancel: 0,
    })

  const [filter, setFilter] =
    useState<'all' | TableAction>(
      'all',
    )

  const [isLoading, setIsLoading] =
    useState(true)

  const [isRefreshing, setIsRefreshing] =
    useState(false)

  const [errorMessage, setErrorMessage] =
    useState('')

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null)

  const fetchEvents = useCallback(
    async (
      showFullLoader = false,
    ) => {
      if (showFullLoader) {
        setIsLoading(true)
      } else {
        setIsRefreshing(true)
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/table-action-events/public?limit=100`,
          {
            method: 'GET',
            headers: {
              Accept: 'application/json',
            },
            credentials: 'omit',
            cache: 'no-store',
          },
        )

        const payload = await response
          .json()
          .catch(() => null)

        if (!response.ok) {
          const record =
            asRecord(payload)

          throw new Error(
            stringValue(
              record.message,
              record.error,
            ) ||
              `Unable to load table activity. Status ${response.status}.`,
          )
        }

        const result =
          extractPayload(payload)

        setEvents(result.events)
        setSummary(result.summary)
        setLastUpdated(new Date())
        setErrorMessage('')
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to load table activity.',
        )
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [],
  )

  useEffect(() => {
    void fetchEvents(true)

    const interval =
      window.setInterval(() => {
        void fetchEvents(false)
      }, 3000)

    return () => {
      window.clearInterval(interval)
    }
  }, [fetchEvents])

  const filteredEvents = useMemo(
    () =>
      filter === 'all'
        ? events
        : events.filter(
            (event) =>
              event.action === filter,
          ),
    [events, filter],
  )

  const newestEvent =
    filteredEvents[0] ?? null

  if (isLoading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <LoaderCircle className="mx-auto h-12 w-12 animate-spin text-cyan-300" />

          <p className="mt-4 text-sm font-semibold text-slate-300">
            Loading live table activity...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-dvh bg-[radial-gradient(circle_at_top,#12345b_0%,#07111f_38%,#020617_100%)] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20">
                <UtensilsCrossed className="h-7 w-7" />
              </span>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.26em] text-cyan-300">
                  {APP_NAME}
                </p>

                <h1 className="text-2xl font-black sm:text-3xl">
                  Live Table Activity
                </h1>
              </div>
            </div>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              This public screen shows every
              Order, Call Staff, Pay, and Cancel
              action received from canteen
              tables.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-200">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
              Live
            </span>

            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
              Updated:{' '}
              {lastUpdated
                ? lastUpdated.toLocaleTimeString()
                : '-'}
            </span>

            <button
              type="button"
              onClick={() =>
                void fetchEvents(false)
              }
              disabled={isRefreshing}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 text-sm font-bold transition hover:bg-white/15 disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  isRefreshing
                    ? 'animate-spin'
                    : ''
                }`}
              />
              Refresh
            </button>
          </div>
        </header>

        {errorMessage && (
          <div className="mt-6 flex items-start gap-3 rounded-3xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-red-100">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />

            <p className="text-sm leading-6">
              {errorMessage}
            </p>
          </div>
        )}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            label="All"
            value={summary.all}
            icon={LayoutDashboard}
            active={filter === 'all'}
            onClick={() => setFilter('all')}
            className="border-white/10 bg-white/5"
          />

          <SummaryCard
            label="Calls"
            value={summary.call}
            icon={BellRing}
            active={filter === 'call'}
            onClick={() => setFilter('call')}
            className="border-cyan-400/20 bg-cyan-400/10"
          />

          <SummaryCard
            label="Orders"
            value={summary.order}
            icon={ShoppingBag}
            active={filter === 'order'}
            onClick={() =>
              setFilter('order')
            }
            className="border-lime-400/20 bg-lime-400/10"
          />

          <SummaryCard
            label="Payments"
            value={summary.pay}
            icon={CreditCard}
            active={filter === 'pay'}
            onClick={() => setFilter('pay')}
            className="border-yellow-400/20 bg-yellow-400/10"
          />

          <SummaryCard
            label="Cancelled"
            value={summary.cancel}
            icon={XCircle}
            active={filter === 'cancel'}
            onClick={() =>
              setFilter('cancel')
            }
            className="border-rose-400/20 bg-rose-400/10"
          />
        </section>

        {newestEvent && (
          <section className="mt-6 rounded-[32px] border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur sm:p-7">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">
              Latest activity
            </p>

            <LatestEvent event={newestEvent} />
          </section>
        )}

        <section className="mt-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black">
                Activity Feed
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Showing{' '}
                {filteredEvents.length}{' '}
                event
                {filteredEvents.length === 1
                  ? ''
                  : 's'}
              </p>
            </div>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-[32px] border border-dashed border-white/15 bg-white/5 p-8 text-center">
              <Clock3 className="h-14 w-14 text-slate-500" />

              <h3 className="mt-4 text-xl font-black">
                No table activity yet
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                When a table selects Call,
                Order, Pay, or Cancel, the event
                will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredEvents.map(
                (event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                  />
                ),
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  active,
  onClick,
  className,
}: {
  label: string
  value: number
  icon: LucideIcon
  active: boolean
  onClick: () => void
  className: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-3xl border p-5 text-left transition hover:-translate-y-0.5 ${
        active
          ? 'ring-2 ring-white/40'
          : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
          <Icon className="h-6 w-6" />
        </span>

        <span className="text-3xl font-black">
          {value}
        </span>
      </div>

      <p className="mt-4 text-sm font-bold text-slate-200">
        {label}
      </p>
    </button>
  )
}

function LatestEvent({
  event,
}: {
  event: TableActionEvent
}) {
  const config =
    actionConfig[event.action]

  const Icon = config.icon

  return (
    <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-4">
        <span
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl ${config.iconClass}`}
        >
          <Icon className="h-8 w-8" />
        </span>

        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-3xl font-black sm:text-4xl">
              Table{' '}
              {event.table.table_number}
            </h2>

            <span
              className={`rounded-full border px-3 py-1 text-sm font-black ${config.badgeClass}`}
            >
              {config.label}
            </span>
          </div>

          <p className="mt-2 text-sm text-slate-300">
            {event.table.name}
            {' · '}
            {event.table.location}
          </p>
        </div>
      </div>

      <div className="lg:text-right">
        <p className="text-lg font-black">
          {timeAgo(
            event.occurred_at,
          )}
        </p>

        <p className="mt-1 text-sm text-slate-400">
          {formatDateTime(
            event.occurred_at,
          )}
        </p>
      </div>
    </div>
  )
}

function EventCard({
  event,
}: {
  event: TableActionEvent
}) {
  const config =
    actionConfig[event.action]

  const Icon = config.icon

  return (
    <article
      className={`rounded-[28px] border p-5 transition hover:-translate-y-0.5 ${config.cardClass}`}
    >
      <div className="flex items-start justify-between gap-4">
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${config.iconClass}`}
        >
          <Icon className="h-6 w-6" />
        </span>

        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {timeAgo(
            event.occurred_at,
          )}
        </span>
      </div>

      <div className="mt-5">
        <p className="text-sm font-bold text-slate-400">
          Table
        </p>

        <h3 className="mt-1 text-3xl font-black">
          {event.table.table_number}
        </h3>

        <p className="mt-1 text-sm text-slate-300">
          {event.table.name}
        </p>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
        <span
          className={`rounded-full border px-3 py-1 text-xs font-black ${config.badgeClass}`}
        >
          {config.label}
        </span>

        <span className="truncate text-xs text-slate-400">
          {event.table.location}
        </span>
      </div>
    </article>
  )
}
