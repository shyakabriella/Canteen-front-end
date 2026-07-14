'use client'

import {
  BellRing,
  CheckCircle2,
  CircleAlert,
  Clock3,
  CreditCard,
  LoaderCircle,
  Maximize,
  RefreshCw,
  ShoppingBag,
  UtensilsCrossed,
  Volume2,
  VolumeX,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

type UnknownRecord = Record<string, unknown>

type TableAction =
  | 'order'
  | 'call'
  | 'pay'

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

const API_BASE_URL = removeTrailingSlash(
  process.env.NEXT_PUBLIC_API_BASE_URL ??
    'https://www.canteen.asyncafrica.com/api',
)

const APP_NAME =
  process.env.NEXT_PUBLIC_APP_NAME ??
  'Smart Canteen'

const REFRESH_INTERVAL_MS = 2000

const actionConfig: Record<
  TableAction,
  {
    label: string
    shortLabel: string
    instruction: string
    icon: LucideIcon
    cardClass: string
    iconClass: string
    glowClass: string
    pulseClass: string
  }
> = {
  call: {
    label: 'CALL STAFF',
    shortLabel: 'Staff needed',
    instruction:
      'A customer is requesting waiter assistance.',
    icon: BellRing,
    cardClass:
      'border-cyan-300 bg-gradient-to-br from-cyan-300 via-cyan-400 to-blue-500 text-slate-950',
    iconClass:
      'border-cyan-100/70 bg-white/85 text-cyan-700',
    glowClass:
      'shadow-[0_0_65px_rgba(34,211,238,0.42)]',
    pulseClass:
      'bg-cyan-200',
  },

  order: {
    label: 'NEW ORDER',
    shortLabel: 'Order requested',
    instruction:
      'A customer wants to place or continue an order.',
    icon: ShoppingBag,
    cardClass:
      'border-lime-300 bg-gradient-to-br from-lime-300 via-lime-400 to-emerald-500 text-slate-950',
    iconClass:
      'border-lime-100/70 bg-white/85 text-lime-700',
    glowClass:
      'shadow-[0_0_65px_rgba(163,230,53,0.38)]',
    pulseClass:
      'bg-lime-200',
  },

  pay: {
    label: 'PAYMENT',
    shortLabel: 'Payment requested',
    instruction:
      'A customer is ready to pay.',
    icon: CreditCard,
    cardClass:
      'border-yellow-200 bg-gradient-to-br from-yellow-200 via-yellow-400 to-orange-500 text-slate-950',
    iconClass:
      'border-yellow-100/80 bg-white/90 text-amber-700',
    glowClass:
      'shadow-[0_0_65px_rgba(250,204,21,0.4)]',
    pulseClass:
      'bg-yellow-100',
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
    action === 'pay'
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

function extractEvents(
  payload: unknown,
): TableActionEvent[] {
  const root = asRecord(payload)
  const data = asRecord(root.data)

  const candidates: unknown[] = [
    data.events,
    root.events,
    data.data,
    root.data,
  ]

  const collection = candidates.find(
    (candidate) =>
      Array.isArray(candidate),
  )

  if (!Array.isArray(collection)) {
    return []
  }

  return collection
    .map(normalizeEvent)
    .filter(
      (event) =>
        event.id > 0 &&
        event.status.toLowerCase() ===
          'pending',
    )
}

function elapsedTime(
  value: string,
  now: Date,
): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'NOW'
  }

  const seconds = Math.max(
    0,
    Math.floor(
      (now.getTime() - date.getTime()) /
        1000,
    ),
  )

  if (seconds < 60) {
    return `${seconds}s`
  }

  const minutes = Math.floor(
    seconds / 60,
  )

  if (minutes < 60) {
    return `${minutes}m ${seconds % 60}s`
  }

  const hours = Math.floor(
    minutes / 60,
  )

  return `${hours}h ${minutes % 60}m`
}

function urgencyClass(
  occurredAt: string,
  now: Date,
): string {
  const date = new Date(occurredAt)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const seconds =
    (now.getTime() - date.getTime()) /
    1000

  if (seconds >= 300) {
    return 'ring-8 ring-red-500 animate-[urgentPulse_1s_ease-in-out_infinite]'
  }

  if (seconds >= 120) {
    return 'ring-4 ring-orange-300 animate-[warningPulse_1.4s_ease-in-out_infinite]'
  }

  return ''
}


type BrowserWindowWithWebkitAudio =
  typeof window & {
    webkitAudioContext?:
      typeof AudioContext
  }

function createAudioContext():
  | AudioContext
  | null {
  if (typeof window === 'undefined') {
    return null
  }

  const browserWindow =
    window as BrowserWindowWithWebkitAudio

  const AudioContextClass =
    window.AudioContext ??
    browserWindow.webkitAudioContext

  if (!AudioContextClass) {
    return null
  }

  return new AudioContextClass()
}

function scheduleTone(
  context: AudioContext,
  frequency: number,
  startAt: number,
  duration: number,
  volume = 0.2,
) {
  const oscillator =
    context.createOscillator()

  const gain = context.createGain()

  oscillator.type = 'sine'

  oscillator.frequency.setValueAtTime(
    frequency,
    startAt,
  )

  gain.gain.setValueAtTime(
    0.0001,
    startAt,
  )

  gain.gain.exponentialRampToValueAtTime(
    volume,
    startAt + 0.025,
  )

  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    startAt + duration,
  )

  oscillator.connect(gain)
  gain.connect(context.destination)

  oscillator.start(startAt)
  oscillator.stop(
    startAt + duration + 0.03,
  )
}

function playActionSound(
  context: AudioContext,
  action: TableAction,
  offset = 0,
) {
  const start =
    context.currentTime + offset

  if (action === 'call') {
    scheduleTone(
      context,
      880,
      start,
      0.18,
      0.25,
    )

    scheduleTone(
      context,
      1046.5,
      start + 0.22,
      0.18,
      0.25,
    )

    scheduleTone(
      context,
      1318.5,
      start + 0.44,
      0.26,
      0.28,
    )

    return
  }

  if (action === 'order') {
    scheduleTone(
      context,
      659.25,
      start,
      0.22,
      0.23,
    )

    scheduleTone(
      context,
      987.77,
      start + 0.26,
      0.3,
      0.25,
    )

    return
  }

  scheduleTone(
    context,
    523.25,
    start,
    0.18,
    0.22,
  )

  scheduleTone(
    context,
    659.25,
    start + 0.2,
    0.18,
    0.22,
  )

  scheduleTone(
    context,
    783.99,
    start + 0.4,
    0.32,
    0.25,
  )
}

export default function TableActivityPage() {
  const [events, setEvents] = useState<
    TableActionEvent[]
  >([])

  const [isLoading, setIsLoading] =
    useState(true)

  const [isRefreshing, setIsRefreshing] =
    useState(false)

  const [errorMessage, setErrorMessage] =
    useState('')

  const [now, setNow] =
    useState(new Date())

  const [
    processingIds,
    setProcessingIds,
  ] = useState<Set<number>>(
    new Set(),
  )

  const [
    newEventIds,
    setNewEventIds,
  ] = useState<Set<number>>(
    new Set(),
  )

  const knownIdsRef =
    useRef<Set<number>>(new Set())

  const hasLoadedRef =
    useRef(false)

  const audioContextRef =
    useRef<AudioContext | null>(null)

  const [soundEnabled, setSoundEnabled] =
    useState(false)

  const [soundNotice, setSoundNotice] =
    useState(
      'Touch Enable Sound once on this TV.',
    )

  const playIncomingEventSounds =
    useCallback(
      async (
        incomingEvents:
          TableActionEvent[],
      ) => {
        if (
          !soundEnabled ||
          incomingEvents.length === 0
        ) {
          return
        }

        let context =
          audioContextRef.current

        if (!context) {
          context =
            createAudioContext()

          audioContextRef.current =
            context
        }

        if (!context) {
          setSoundEnabled(false)
          setSoundNotice(
            'Audio is not supported by this browser.',
          )
          return
        }

        if (
          context.state ===
          'suspended'
        ) {
          try {
            await context.resume()
          } catch {
            setSoundEnabled(false)
            setSoundNotice(
              'Touch Enable Sound again.',
            )
            return
          }
        }

        incomingEvents
          .slice(0, 6)
          .forEach(
            (event, index) => {
              playActionSound(
                context,
                event.action,
                index * 0.8,
              )
            },
          )
      },
      [soundEnabled],
    )

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
          `${API_BASE_URL}/table-action-events/public?status=pending&limit=200`,
          {
            method: 'GET',
            headers: {
              Accept:
                'application/json',
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
              `Unable to load requests. Status ${response.status}.`,
          )
        }

        const nextEvents =
          extractEvents(payload)

        if (hasLoadedRef.current) {
          const incomingEvents =
            nextEvents.filter(
              (event) =>
                !knownIdsRef.current.has(
                  event.id,
                ),
            )

          const incomingIds =
            incomingEvents.map(
              (event) => event.id,
            )

          if (incomingIds.length > 0) {
            setNewEventIds(
              new Set(incomingIds),
            )

            void playIncomingEventSounds(
              incomingEvents,
            )

            window.setTimeout(() => {
              setNewEventIds(
                new Set(),
              )
            }, 5000)
          }
        }

        knownIdsRef.current =
          new Set(
            nextEvents.map(
              (event) => event.id,
            ),
          )

        hasLoadedRef.current = true

        setEvents(nextEvents)
        setErrorMessage('')
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to load table requests.',
        )
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [playIncomingEventSounds],
  )

  useEffect(() => {
    void fetchEvents(true)

    const requestInterval =
      window.setInterval(() => {
        void fetchEvents(false)
      }, REFRESH_INTERVAL_MS)

    const clockInterval =
      window.setInterval(() => {
        setNow(new Date())
      }, 1000)

    return () => {
      window.clearInterval(
        requestInterval,
      )

      window.clearInterval(
        clockInterval,
      )
    }
  }, [fetchEvents])

  const sortedEvents = useMemo(
    () =>
      [...events].sort(
        (first, second) =>
          new Date(
            first.occurred_at,
          ).getTime() -
          new Date(
            second.occurred_at,
          ).getTime(),
      ),
    [events],
  )

  const counts = useMemo(
    () => ({
      call:
        events.filter(
          (event) =>
            event.action === 'call',
        ).length,

      order:
        events.filter(
          (event) =>
            event.action === 'order',
        ).length,

      pay:
        events.filter(
          (event) =>
            event.action === 'pay',
        ).length,
    }),
    [events],
  )

  async function acknowledgeEvent(
    event: TableActionEvent,
  ) {
    if (
      processingIds.has(event.id)
    ) {
      return
    }

    setProcessingIds(
      (current) => {
        const next = new Set(current)
        next.add(event.id)
        return next
      },
    )

    /*
     * Remove immediately from the TV screen.
     * When the API request fails, it is loaded
     * again so the waiter does not lose it.
     */
    setEvents((current) =>
      current.filter(
        (item) =>
          item.id !== event.id,
      ),
    )

    try {
      const response = await fetch(
        `${API_BASE_URL}/table-action-events/public/${event.id}/acknowledge`,
        {
          method: 'POST',
          headers: {
            Accept:
              'application/json',
            'Content-Type':
              'application/json',
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
            `Unable to receive request. Status ${response.status}.`,
        )
      }

      knownIdsRef.current.delete(
        event.id,
      )

      setErrorMessage('')
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to receive this request.',
      )

      await fetchEvents(false)
    } finally {
      setProcessingIds(
        (current) => {
          const next =
            new Set(current)

          next.delete(event.id)

          return next
        },
      )
    }
  }

  async function toggleSound() {
    if (soundEnabled) {
      setSoundEnabled(false)
      setSoundNotice(
        'Sound is muted.',
      )
      return
    }

    let context =
      audioContextRef.current

    if (!context) {
      context =
        createAudioContext()

      audioContextRef.current =
        context
    }

    if (!context) {
      setSoundNotice(
        'Audio is not supported by this browser.',
      )
      return
    }

    try {
      if (
        context.state ===
        'suspended'
      ) {
        await context.resume()
      }

      /*
       * Confirmation chime.
       */
      playActionSound(
        context,
        'call',
      )

      setSoundEnabled(true)
      setSoundNotice(
        'Sound alerts are active.',
      )
    } catch {
      setSoundEnabled(false)
      setSoundNotice(
        'The browser blocked sound. Touch Enable Sound again.',
      )
    }
  }

  async function enterFullscreen() {
    try {
      if (
        document.fullscreenElement
      ) {
        await document.exitFullscreen()
        return
      }

      await document.documentElement
        .requestFullscreen()
    } catch {
      setErrorMessage(
        'Fullscreen mode could not be started by this browser.',
      )
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <LoaderCircle className="mx-auto h-16 w-16 animate-spin text-cyan-300" />

          <p className="mt-5 text-xl font-black">
            Connecting to table requests...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-dvh bg-[radial-gradient(circle_at_top,#183a63_0%,#07111f_38%,#020617_100%)] text-white">
      <style jsx global>{`
        @keyframes requestArrival {
          0% {
            opacity: 0;
            transform: scale(0.7) translateY(50px);
          }

          55% {
            opacity: 1;
            transform: scale(1.06) translateY(-8px);
          }

          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes newRequestFlash {
          0%,
          100% {
            box-shadow:
              0 0 0 rgba(255,255,255,0),
              0 0 60px rgba(255,255,255,0.22);
          }

          50% {
            box-shadow:
              0 0 0 12px rgba(255,255,255,0.18),
              0 0 100px rgba(255,255,255,0.55);
          }
        }

        @keyframes urgentPulse {
          0%,
          100% {
            transform: scale(1);
          }

          50% {
            transform: scale(1.025);
          }
        }

        @keyframes warningPulse {
          0%,
          100% {
            filter: brightness(1);
          }

          50% {
            filter: brightness(1.16);
          }
        }
      `}</style>

      <header
        className={`sticky top-0 z-30 border-b border-white/10 bg-slate-950/92 px-5 py-4 backdrop-blur-xl lg:px-8 ${
          newEventIds.size > 0
            ? 'shadow-[0_0_70px_rgba(34,211,238,0.35)]'
            : ''
        }`}
      >
        <div className="mx-auto flex max-w-[1900px] flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-500/30">
              <UtensilsCrossed className="h-8 w-8" />
            </span>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
                {APP_NAME}
              </p>

              <h1 className="text-2xl font-black sm:text-3xl lg:text-4xl">
                Waiter Request Screen
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <RequestCounter
              label="Call"
              value={counts.call}
              className="border-cyan-300/30 bg-cyan-300/10 text-cyan-100"
            />

            <RequestCounter
              label="Order"
              value={counts.order}
              className="border-lime-300/30 bg-lime-300/10 text-lime-100"
            />

            <RequestCounter
              label="Pay"
              value={counts.pay}
              className="border-yellow-300/30 bg-yellow-300/10 text-yellow-100"
            />

            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-2 text-right">
              <p className="text-2xl font-black tabular-nums">
                {now.toLocaleTimeString(
                  [],
                  {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  },
                )}
              </p>

              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Live
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void toggleSound()
              }
              className={`inline-flex h-14 items-center justify-center gap-3 rounded-2xl border px-5 text-sm font-black uppercase tracking-wider transition ${
                soundEnabled
                  ? 'border-emerald-300/40 bg-emerald-300 text-slate-950 shadow-lg shadow-emerald-500/25'
                  : 'animate-pulse border-amber-300/40 bg-amber-300 text-slate-950 shadow-lg shadow-amber-500/25'
              }`}
              aria-label={
                soundEnabled
                  ? 'Mute alert sounds'
                  : 'Enable alert sounds'
              }
            >
              {soundEnabled ? (
                <Volume2 className="h-6 w-6" />
              ) : (
                <VolumeX className="h-6 w-6" />
              )}

              {soundEnabled
                ? 'Sound On'
                : 'Enable Sound'}
            </button>

            <button
              type="button"
              onClick={() =>
                void enterFullscreen()
              }
              className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 transition hover:bg-white/20"
              aria-label="Toggle fullscreen"
            >
              <Maximize className="h-6 w-6" />
            </button>

            <button
              type="button"
              onClick={() =>
                void fetchEvents(false)
              }
              disabled={isRefreshing}
              className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 transition hover:bg-white/20 disabled:opacity-60"
              aria-label="Refresh requests"
            >
              <RefreshCw
                className={`h-6 w-6 ${
                  isRefreshing
                    ? 'animate-spin'
                    : ''
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      {!soundEnabled && (
        <button
          type="button"
          onClick={() =>
            void toggleSound()
          }
          className="mx-auto mt-5 flex w-[calc(100%-2.5rem)] max-w-[1800px] items-center justify-center gap-4 rounded-3xl border-2 border-amber-300/40 bg-amber-300 px-6 py-4 text-center text-lg font-black text-slate-950 shadow-xl shadow-amber-500/20 transition hover:scale-[1.005] lg:text-xl"
        >
          <VolumeX className="h-7 w-7 shrink-0" />

          {soundNotice}
        </button>
      )}

      {soundEnabled && (
        <div className="mx-auto mt-4 flex w-[calc(100%-2.5rem)] max-w-[1800px] items-center justify-center gap-3 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-5 py-3 text-sm font-bold text-emerald-200">
          <Volume2 className="h-5 w-5" />
          {soundNotice}
        </div>
      )}

      {errorMessage && (
        <div className="mx-auto mt-5 flex max-w-[1800px] items-start gap-3 rounded-3xl border border-red-400/30 bg-red-500/15 px-5 py-4 text-red-100">
          <CircleAlert className="mt-0.5 h-6 w-6 shrink-0" />

          <p className="text-base font-bold">
            {errorMessage}
          </p>
        </div>
      )}

      <section className="mx-auto max-w-[1900px] px-5 py-6 lg:px-8 lg:py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-slate-400">
              Active requests
            </p>

            <p className="mt-1 text-5xl font-black tabular-nums sm:text-6xl">
              {sortedEvents.length}
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-lg font-bold text-slate-200">
            <CheckCircle2 className="h-6 w-6 text-emerald-300" />
            Touch a request when received
          </div>
        </div>

        {sortedEvents.length === 0 ? (
          <div className="flex min-h-[62vh] flex-col items-center justify-center rounded-[42px] border border-white/10 bg-white/[0.04] px-8 text-center shadow-2xl">
            <span className="flex h-28 w-28 items-center justify-center rounded-full border border-emerald-300/25 bg-emerald-300/10">
              <CheckCircle2 className="h-16 w-16 text-emerald-300" />
            </span>

            <h2 className="mt-7 text-4xl font-black sm:text-6xl">
              All tables are served
            </h2>

            <p className="mt-4 text-xl font-semibold text-slate-400 sm:text-2xl">
              New requests will appear here automatically.
            </p>

            <div className="mt-8 flex items-center gap-3 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-6 py-3 text-lg font-black text-emerald-200">
              <span className="h-3 w-3 animate-pulse rounded-full bg-emerald-300" />
              Listening for requests
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,390px),1fr))] gap-6">
            {sortedEvents.map(
              (event) => (
                <RequestCard
                  key={event.id}
                  event={event}
                  now={now}
                  isNew={newEventIds.has(
                    event.id,
                  )}
                  isProcessing={
                    processingIds.has(
                      event.id,
                    )
                  }
                  onReceive={() =>
                    void acknowledgeEvent(
                      event,
                    )
                  }
                />
              ),
            )}
          </div>
        )}
      </section>
    </main>
  )
}

function RequestCounter({
  label,
  value,
  className,
}: {
  label: string
  value: number
  className: string
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-2 text-center ${className}`}
    >
      <p className="text-2xl font-black tabular-nums">
        {value}
      </p>

      <p className="text-[11px] font-black uppercase tracking-wider">
        {label}
      </p>
    </div>
  )
}

function RequestCard({
  event,
  now,
  isNew,
  isProcessing,
  onReceive,
}: {
  event: TableActionEvent
  now: Date
  isNew: boolean
  isProcessing: boolean
  onReceive: () => void
}) {
  const config =
    actionConfig[event.action]

  const Icon = config.icon

  return (
    <button
      type="button"
      onClick={onReceive}
      disabled={isProcessing}
      className={`group relative min-h-[410px] overflow-hidden rounded-[38px] border-[5px] p-7 text-left transition duration-200 hover:-translate-y-1 hover:scale-[1.01] active:scale-[0.98] disabled:cursor-wait disabled:opacity-70 ${config.cardClass} ${config.glowClass} ${urgencyClass(
        event.occurred_at,
        now,
      )} ${
        isNew
          ? 'animate-[requestArrival_.65s_cubic-bezier(.2,.8,.2,1),newRequestFlash_1.2s_ease-in-out_4]'
          : ''
      }`}
    >
      <span
        className={`absolute right-5 top-5 h-5 w-5 animate-ping rounded-full ${config.pulseClass}`}
      />

      <span
        className={`absolute right-5 top-5 h-5 w-5 rounded-full ${config.pulseClass}`}
      />

      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-start justify-between gap-5">
          <span
            className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-[26px] border-2 shadow-xl ${config.iconClass}`}
          >
            <Icon className="h-11 w-11" />
          </span>

          <div className="text-right">
            <p className="text-sm font-black uppercase tracking-[0.2em] opacity-70">
              Waiting
            </p>

            <p className="mt-1 text-3xl font-black tabular-nums">
              {elapsedTime(
                event.occurred_at,
                now,
              )}
            </p>
          </div>
        </div>

        <div className="mt-8">
          <p className="text-lg font-black uppercase tracking-[0.16em] opacity-70">
            Table
          </p>

          <p className="mt-1 text-[clamp(5rem,9vw,8.5rem)] font-black leading-[0.86] tracking-[-0.06em]">
            {event.table.table_number}
          </p>
        </div>

        <div className="mt-7">
          <p className="text-3xl font-black sm:text-4xl">
            {config.label}
          </p>

          <p className="mt-2 text-lg font-bold opacity-80">
            {config.instruction}
          </p>
        </div>

        <div className="mt-auto flex items-end justify-between gap-4 border-t-2 border-slate-950/15 pt-5">
          <div>
            <p className="text-xl font-black">
              {event.table.name}
            </p>

            <p className="mt-1 text-base font-bold opacity-70">
              {event.table.location}
            </p>
          </div>

          <span className="rounded-2xl bg-slate-950 px-5 py-3 text-center text-sm font-black uppercase tracking-wider text-white shadow-xl transition group-hover:scale-105">
            {isProcessing
              ? 'Receiving...'
              : 'Touch to receive'}
          </span>
        </div>
      </div>
    </button>
  )
}