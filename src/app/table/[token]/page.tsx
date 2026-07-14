'use client'

import {
  ArrowRight,
  BellRing,
  CheckCircle2,
  CircleAlert,
  CreditCard,
  LoaderCircle,
  MapPin,
  RefreshCw,
  ShoppingBag,
  Users,
  UtensilsCrossed,
  XCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

type UnknownRecord = Record<string, unknown>

type TableStatus =
  | 'available'
  | 'occupied'
  | 'reserved'
  | 'inactive'

type DeviceAction =
  | 'order'
  | 'call'
  | 'pay'
  | 'cancel'

interface PublicCanteenTable {
  id: number | string
  table_number: string
  name: string
  location: string
  capacity: number
  status: TableStatus
  description: string
  qr_token: string
}

const API_BASE_URL = removeTrailingSlash(
  process.env.NEXT_PUBLIC_API_BASE_URL ??
    'https://www.canteen.asyncafrica.com/api',
)

const APP_NAME =
  process.env.NEXT_PUBLIC_APP_NAME ??
  'Smart Canteen'

function removeTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

function asRecord(value: unknown): UnknownRecord {
  if (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  ) {
    return value as UnknownRecord
  }

  return {}
}

function stringValue(...values: unknown[]): string {
  const found = values.find(
    (value) =>
      value !== undefined &&
      value !== null &&
      String(value).trim() !== '',
  )

  return found === undefined ? '' : String(found)
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

function normalizeStatus(value: unknown): TableStatus {
  const status = String(value ?? '')
    .trim()
    .toLowerCase()

  if (
    status === 'available' ||
    status === 'occupied' ||
    status === 'reserved' ||
    status === 'inactive'
  ) {
    return status
  }

  return 'available'
}

function normalizeTable(
  value: unknown,
): PublicCanteenTable {
  const record = asRecord(value)

  const tableNumber = stringValue(
    record.table_number,
    record.table_no,
    record.number,
  )

  return {
    id:
      stringValue(record.id) ||
      tableNumber,

    table_number:
      tableNumber || 'Unknown',

    name:
      stringValue(
        record.name,
        record.table_name,
      ) ||
      `Table ${tableNumber}`,

    location:
      stringValue(
        record.location,
        record.area,
        record.section,
      ) || 'Canteen',

    capacity:
      numberValue(
        record.capacity,
        1,
      ),

    status:
      normalizeStatus(record.status),

    description:
      stringValue(
        record.description,
        record.notes,
      ),

    qr_token:
      stringValue(
        record.qr_token,
        record.public_token,
        record.token,
      ),
  }
}

function extractTable(
  payload: unknown,
): PublicCanteenTable {
  const root = asRecord(payload)
  const data = asRecord(root.data)

  const candidates: unknown[] = [
    data.data,
    root.data,
    root.table,
    root.record,
    payload,
  ]

  for (const candidate of candidates) {
    const record = asRecord(candidate)

    if (
      record.id !== undefined ||
      record.table_number !== undefined ||
      record.table_no !== undefined
    ) {
      return normalizeTable(record)
    }
  }

  throw new Error(
    'The table information was not found.',
  )
}

function formatStatus(status: string): string {
  return status
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    )
}

function getStatusClass(
  status: TableStatus,
): string {
  switch (status) {
    case 'available':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700'

    case 'occupied':
      return 'border-amber-200 bg-amber-50 text-amber-700'

    case 'reserved':
      return 'border-blue-200 bg-blue-50 text-blue-700'

    default:
      return 'border-slate-200 bg-slate-100 text-slate-600'
  }
}

export default function PublicTablePage() {
  const params = useParams<{ token: string }>()
  const router = useRouter()

  const token = String(params?.token ?? '')

  const [table, setTable] =
    useState<PublicCanteenTable | null>(null)

  const [isLoading, setIsLoading] =
    useState(true)

  const [errorMessage, setErrorMessage] =
    useState('')

  const [
    selectedAction,
    setSelectedAction,
  ] = useState<DeviceAction | null>(null)

  const fetchTable = useCallback(
    async () => {
      if (!token) {
        setErrorMessage(
          'The table QR token is missing.',
        )
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setErrorMessage('')

      try {
        const response = await fetch(
          `${API_BASE_URL}/canteen-tables/public/${encodeURIComponent(
            token,
          )}`,
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
          const record = asRecord(payload)

          throw new Error(
            stringValue(
              record.message,
              record.error,
            ) ||
              `Unable to load table. Status ${response.status}.`,
          )
        }

        setTable(extractTable(payload))
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to load this table.',
        )
      } finally {
        setIsLoading(false)
      }
    },
    [token],
  )

  useEffect(() => {
    void fetchTable()
  }, [fetchTable])

  function rememberTable() {
    if (
      typeof window === 'undefined' ||
      !table
    ) {
      return
    }

    window.localStorage.setItem(
      'selected_canteen_table',
      JSON.stringify({
        id: table.id,
        table_number:
          table.table_number,
        name: table.name,
        location: table.location,
        qr_token:
          table.qr_token || token,
      }),
    )
  }

  function handleOrder() {
    rememberTable()
    setSelectedAction('order')

    window.setTimeout(() => {
      router.push('/login')
    }, 450)
  }

  function handlePay() {
    rememberTable()
    setSelectedAction('pay')

    window.setTimeout(() => {
      router.push('/login')
    }, 450)
  }

  function handleCall() {
    setSelectedAction('call')
  }

  function handleCancel() {
    setSelectedAction('cancel')

    window.setTimeout(() => {
      setSelectedAction(null)
    }, 900)
  }

  if (isLoading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[radial-gradient(circle_at_top,#1e3a5f_0%,#07111f_42%,#020617_100%)] px-5">
        <div className="text-center text-white">
          <LoaderCircle className="mx-auto h-12 w-12 animate-spin text-cyan-300" />

          <p className="mt-4 text-sm font-semibold tracking-wide text-slate-200">
            Loading table device...
          </p>
        </div>
      </main>
    )
  }

  if (
    errorMessage ||
    !table
  ) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-slate-950 px-5 py-10">
        <div className="w-full max-w-md rounded-3xl border border-red-400/20 bg-white p-7 text-center shadow-2xl">
          <CircleAlert className="mx-auto h-14 w-14 text-red-500" />

          <h1 className="mt-4 text-2xl font-extrabold text-slate-950">
            Table unavailable
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            {errorMessage ||
              'This table could not be found.'}
          </p>

          <button
            type="button"
            onClick={() => void fetchTable()}
            className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            <RefreshCw className="h-5 w-5" />
            Try Again
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-dvh overflow-hidden bg-[radial-gradient(circle_at_top,#174878_0%,#07111f_42%,#020617_100%)] px-4 py-7 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-7 text-center text-white">
          <div className="mx-auto flex w-fit items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur">
            <UtensilsCrossed className="h-5 w-5 text-cyan-300" />

            <span className="text-sm font-extrabold uppercase tracking-[0.16em]">
              {APP_NAME}
            </span>
          </div>

          <h1 className="mt-5 text-3xl font-black sm:text-4xl">
            {table.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-sm">
            <span
              className={`rounded-full border px-3 py-1 font-bold ${getStatusClass(
                table.status,
              )}`}
            >
              {formatStatus(table.status)}
            </span>

            <span className="flex items-center gap-2 text-slate-200">
              <MapPin className="h-4 w-4" />
              {table.location}
            </span>

            <span className="flex items-center gap-2 text-slate-200">
              <Users className="h-4 w-4" />
              {table.capacity} seats
            </span>
          </div>
        </header>

        <section className="relative mx-auto aspect-square w-full max-w-[650px] rounded-full bg-[radial-gradient(circle_at_48%_28%,#475569_0%,#111827_36%,#020617_72%)] p-[14px] shadow-[0_45px_110px_rgba(0,0,0,0.72),inset_0_4px_12px_rgba(255,255,255,0.16)] sm:p-[20px]">
          <div className="h-full w-full rounded-full border-[8px] border-slate-300/70 bg-gradient-to-br from-slate-200 via-slate-500 to-slate-900 p-[5px] shadow-[inset_0_0_0_3px_rgba(255,255,255,0.3)] sm:border-[11px]">
            <div className="relative h-full w-full overflow-hidden rounded-full border border-white/20 bg-[radial-gradient(circle_at_50%_45%,#1f2937_0%,#0f172a_42%,#020617_82%)] shadow-[inset_0_0_70px_rgba(0,0,0,0.75)]">
              <div className="pointer-events-none absolute left-[17%] top-[17%] h-[12%] w-[42%] rotate-[-25deg] rounded-full bg-white/10 blur-xl" />

              <div className="absolute left-1/2 top-[4.5%] -translate-x-1/2">
                <DeviceButton
                  label="Pay"
                  icon={CreditCard}
                  className="border-yellow-200 bg-yellow-400 text-slate-950 shadow-[0_12px_30px_rgba(250,204,21,0.35)] hover:bg-yellow-300"
                  onClick={handlePay}
                  active={
                    selectedAction ===
                    'pay'
                  }
                />
              </div>

              <div className="absolute right-[4.5%] top-1/2 -translate-y-1/2">
                <DeviceButton
                  label="Cancel"
                  icon={XCircle}
                  className="border-rose-200 bg-amber-300 text-slate-950 shadow-[0_12px_30px_rgba(251,191,36,0.3)] hover:bg-amber-200"
                  onClick={handleCancel}
                  active={
                    selectedAction ===
                    'cancel'
                  }
                />
              </div>

              <div className="absolute bottom-[4.5%] left-1/2 -translate-x-1/2">
                <DeviceButton
                  label="Order"
                  icon={ShoppingBag}
                  className="border-lime-200 bg-lime-500 text-slate-950 shadow-[0_12px_30px_rgba(132,204,22,0.35)] hover:bg-lime-400"
                  onClick={handleOrder}
                  active={
                    selectedAction ===
                    'order'
                  }
                />
              </div>

              <button
                type="button"
                onClick={handleCall}
                className={`absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-[5px] border-slate-300 bg-white text-slate-950 shadow-[0_18px_45px_rgba(0,0,0,0.55),inset_0_0_0_3px_rgba(15,23,42,0.08)] transition duration-200 hover:scale-105 active:scale-95 sm:h-36 sm:w-36 ${
                  selectedAction ===
                  'call'
                    ? 'scale-105 ring-8 ring-cyan-400/35'
                    : ''
                }`}
              >
                <BellRing className="h-7 w-7 text-blue-700 sm:h-9 sm:w-9" />

                <span className="mt-1 text-xl font-black sm:text-2xl">
                  Call
                </span>

                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 sm:text-xs">
                  Staff
                </span>
              </button>

              <div className="pointer-events-none absolute left-[8%] top-1/2 -translate-y-1/2 -rotate-90 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.34em] text-white/35 sm:text-xs">
                  Table {table.table_number}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-7 max-w-2xl">
          {selectedAction ? (
            <ActionMessage
              action={selectedAction}
              tableNumber={
                table.table_number
              }
            />
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/10 px-5 py-4 text-center text-sm leading-6 text-slate-200 backdrop-blur">
              Select an action on the table
              device. Use{' '}
              <strong className="text-white">
                Order
              </strong>{' '}
              to start ordering,{' '}
              <strong className="text-white">
                Pay
              </strong>{' '}
              to continue to payment, or{' '}
              <strong className="text-white">
                Call
              </strong>{' '}
              for staff assistance.
            </div>
          )}

          {table.description && (
            <p className="mt-4 text-center text-sm leading-6 text-slate-400">
              {table.description}
            </p>
          )}
        </section>
      </div>
    </main>
  )
}

function DeviceButton({
  label,
  icon: Icon,
  className,
  onClick,
  active,
}: {
  label: string
  icon: LucideIcon
  className: string
  onClick: () => void
  active: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-20 w-20 flex-col items-center justify-center rounded-full border-[4px] font-black transition duration-200 hover:scale-105 active:scale-95 sm:h-24 sm:w-24 md:h-28 md:w-28 ${
        active
          ? 'scale-105 ring-8 ring-white/20'
          : ''
      } ${className}`}
    >
      <Icon className="h-5 w-5 sm:h-7 sm:w-7" />

      <span className="mt-1 text-sm sm:text-base">
        {label}
      </span>
    </button>
  )
}

function ActionMessage({
  action,
  tableNumber,
}: {
  action: DeviceAction
  tableNumber: string
}) {
  const config: Record<
    DeviceAction,
    {
      title: string
      message: string
      icon: LucideIcon
      className: string
    }
  > = {
    order: {
      title: 'Opening food ordering',
      message:
        `Table ${tableNumber} has been selected. Redirecting to sign in.`,
      icon: ShoppingBag,
      className:
        'border-lime-400/30 bg-lime-400/10 text-lime-100',
    },

    pay: {
      title: 'Opening payment',
      message:
        `Table ${tableNumber} has been selected. Redirecting to sign in.`,
      icon: CreditCard,
      className:
        'border-yellow-400/30 bg-yellow-400/10 text-yellow-100',
    },

    call: {
      title: 'Call Staff selected',
      message:
        `Staff assistance was selected for Table ${tableNumber}. Connect this action to your staff-call API when the endpoint is ready.`,
      icon: BellRing,
      className:
        'border-cyan-400/30 bg-cyan-400/10 text-cyan-100',
    },

    cancel: {
      title: 'Action cancelled',
      message:
        'No order or payment action was started.',
      icon: CheckCircle2,
      className:
        'border-slate-300/20 bg-white/10 text-slate-100',
    },
  }

  const current = config[action]
  const Icon = current.icon

  return (
    <div
      className={`flex items-start gap-4 rounded-3xl border px-5 py-4 backdrop-blur ${current.className}`}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10">
        <Icon className="h-6 w-6" />
      </span>

      <div className="min-w-0 flex-1">
        <h2 className="font-extrabold">
          {current.title}
        </h2>

        <p className="mt-1 text-sm leading-6 opacity-90">
          {current.message}
        </p>
      </div>

      {(action === 'order' ||
        action === 'pay') && (
        <ArrowRight className="mt-3 h-5 w-5 animate-pulse" />
      )}
    </div>
  )
}