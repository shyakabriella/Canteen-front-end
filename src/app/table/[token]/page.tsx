'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  LayoutGrid,
  LoaderCircle,
  MapPin,
  QrCode,
  Users,
  UtensilsCrossed,
} from 'lucide-react'
import {
  useEffect,
  useState,
} from 'react'

type TableStatus =
  | 'available'
  | 'occupied'
  | 'reserved'
  | 'inactive'

interface PublicTable {
  id: number | string
  table_number: string
  name: string
  location: string
  capacity: number
  status: TableStatus
  description: string
}

type UnknownRecord = Record<string, unknown>

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  'http://localhost:8000/api'
).replace(/\/+$/, '')

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

function valueFrom(
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

function normalizeStatus(
  value: unknown,
): TableStatus {
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
): PublicTable {
  const record = asRecord(value)

  const tableNumber = valueFrom(
    record.table_number,
    record.table_no,
    record.number,
  )

  return {
    id: valueFrom(record.id) || tableNumber,
    table_number: tableNumber,
    name:
      valueFrom(
        record.name,
        record.table_name,
      ) || `Table ${tableNumber}`,
    location: valueFrom(
      record.location,
      record.area,
      record.section,
    ),
    capacity:
      Number(record.capacity) || 1,
    status: normalizeStatus(record.status),
    description: valueFrom(
      record.description,
      record.notes,
    ),
  }
}

function extractTable(
  payload: unknown,
): PublicTable {
  const root = asRecord(payload)
  const data = asRecord(root.data)

  const candidates: unknown[] = [
    data.data,
    root.data,
    root.table,
    payload,
  ]

  for (const candidate of candidates) {
    const record = asRecord(candidate)

    if (
      record.id !== undefined ||
      record.table_number !== undefined
    ) {
      return normalizeTable(record)
    }
  }

  throw new Error(
    'Table information was not found.',
  )
}

const statusSettings: Record<
  TableStatus,
  {
    label: string
    description: string
    className: string
    icon: typeof CheckCircle2
  }
> = {
  available: {
    label: 'Available',
    description:
      'This table is currently available.',
    className:
      'border-emerald-200 bg-emerald-50 text-emerald-700',
    icon: CheckCircle2,
  },

  occupied: {
    label: 'Occupied',
    description:
      'This table is currently being used.',
    className:
      'border-amber-200 bg-amber-50 text-amber-700',
    icon: Users,
  },

  reserved: {
    label: 'Reserved',
    description:
      'This table has already been reserved.',
    className:
      'border-blue-200 bg-blue-50 text-blue-700',
    icon: Clock3,
  },

  inactive: {
    label: 'Inactive',
    description:
      'This table is currently unavailable.',
    className:
      'border-slate-200 bg-slate-100 text-slate-700',
    icon: AlertTriangle,
  },
}

export default function PublicTablePage() {
  const params = useParams()

  const tokenValue = params.token

  const token = Array.isArray(tokenValue)
    ? tokenValue[0]
    : String(tokenValue ?? '')

  const [table, setTable] =
    useState<PublicTable | null>(null)

  const [isLoading, setIsLoading] =
    useState(true)

  const [errorMessage, setErrorMessage] =
    useState('')

  useEffect(() => {
    async function loadTable() {
      if (!token) {
        setErrorMessage(
          'The table QR code is invalid.',
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
          const responseRecord =
            asRecord(payload)

          throw new Error(
            valueFrom(
              responseRecord.message,
              responseRecord.error,
            ) ||
              'This table QR code is invalid or no longer active.',
          )
        }

        setTable(extractTable(payload))
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to load table information.',
        )
      } finally {
        setIsLoading(false)
      }
    }

    void loadTable()
  }, [token])

  if (isLoading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-slate-100 p-4">
        <div className="text-center">
          <LoaderCircle className="mx-auto h-10 w-10 animate-spin text-indigo-600" />

          <p className="mt-4 font-semibold text-slate-700">
            Loading table information...
          </p>
        </div>
      </main>
    )
  }

  if (errorMessage || !table) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-slate-100 p-4">
        <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-8 text-center shadow-xl">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-700">
            <AlertTriangle className="h-8 w-8" />
          </span>

          <h1 className="mt-5 text-2xl font-extrabold text-slate-950">
            Table Not Found
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            {errorMessage}
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-indigo-600 px-6 text-sm font-bold text-white"
          >
            Return Home
          </Link>
        </div>
      </main>
    )
  }

  const status =
    statusSettings[table.status]

  const StatusIcon = status.icon

  return (
    <main className="min-h-dvh bg-gradient-to-b from-indigo-700 via-indigo-600 to-slate-100 px-4 py-8">
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-6 flex items-center justify-center gap-3 text-white">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-indigo-700 shadow-lg">
            <UtensilsCrossed className="h-7 w-7" />
          </span>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-100">
              Smart Canteen
            </p>

            <p className="text-lg font-extrabold">
              Table Information
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-[30px] bg-white shadow-2xl">
          <div className="bg-slate-950 px-6 py-8 text-center text-white">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600">
              <LayoutGrid className="h-8 w-8" />
            </span>

            <p className="mt-5 text-sm font-bold uppercase tracking-[0.2em] text-indigo-300">
              Table{' '}
              {table.table_number}
            </p>

            <h1 className="mt-2 text-3xl font-extrabold">
              {table.name}
            </h1>
          </div>

          <div className="p-6">
            <div
              className={`rounded-2xl border p-4 ${status.className}`}
            >
              <div className="flex items-center gap-3">
                <StatusIcon className="h-6 w-6 shrink-0" />

                <div>
                  <p className="font-extrabold">
                    {status.label}
                  </p>

                  <p className="mt-1 text-sm">
                    {status.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <InformationCard
                icon={MapPin}
                label="Location"
                value={
                  table.location ||
                  'Canteen area'
                }
              />

              <InformationCard
                icon={Users}
                label="Capacity"
                value={`${table.capacity} people`}
              />

              <InformationCard
                icon={QrCode}
                label="Table Number"
                value={table.table_number}
              />

              <InformationCard
                icon={LayoutGrid}
                label="Current Status"
                value={status.label}
              />
            </div>

            {table.description && (
              <div className="mt-6 rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  About this table
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {table.description}
                </p>
              </div>
            )}

            <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-center">
              <QrCode className="mx-auto h-6 w-6 text-indigo-700" />

              <p className="mt-2 text-sm font-bold text-indigo-800">
                QR code verified successfully
              </p>

              <p className="mt-1 text-xs leading-5 text-indigo-600">
                You are viewing the official
                information for this canteen
                table.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

function InformationCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <Icon className="h-5 w-5 text-indigo-600" />

      <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-1 font-extrabold text-slate-950">
        {value}
      </p>
    </div>
  )
}