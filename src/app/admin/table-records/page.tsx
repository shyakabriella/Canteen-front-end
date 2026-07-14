'use client'

import {
  CheckCircle2,
  Download,
  Eye,
  LayoutGrid,
  LoaderCircle,
  MapPin,
  Pencil,
  Plus,
  Printer,
  QrCode,
  RefreshCw,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'

type TableStatus =
  | 'available'
  | 'occupied'
  | 'reserved'
  | 'inactive'

interface CanteenTable {
  id: number | string
  table_number: string
  name: string
  location: string
  capacity: number
  status: TableStatus
  description: string
  qr_token: string
  qr_url?: string | null
  created_at?: string | null
  updated_at?: string | null
}

interface TableFormState {
  table_number: string
  name: string
  location: string
  capacity: string
  status: TableStatus
  description: string
}

type UnknownRecord = Record<string, unknown>

class ApiRequestError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
  }
}

const API_BASE_URL = removeTrailingSlash(
  process.env.NEXT_PUBLIC_API_BASE_URL ??
    'http://localhost:8000/api',
)

const APP_URL = removeTrailingSlash(
  process.env.NEXT_PUBLIC_APP_URL ??
    'https://www.canabera.asyncafrica.com',
)

const emptyForm: TableFormState = {
  table_number: '',
  name: '',
  location: '',
  capacity: '4',
  status: 'available',
  description: '',
}

const statusOptions: Array<{
  value: TableStatus
  label: string
}> = [
  {
    value: 'available',
    label: 'Available',
  },
  {
    value: 'occupied',
    label: 'Occupied',
  },
  {
    value: 'reserved',
    label: 'Reserved',
  },
  {
    value: 'inactive',
    label: 'Inactive',
  },
]

const statusStyles: Record<TableStatus, string> = {
  available:
    'border-emerald-200 bg-emerald-50 text-emerald-700',
  occupied:
    'border-amber-200 bg-amber-50 text-amber-700',
  reserved:
    'border-blue-200 bg-blue-50 text-blue-700',
  inactive:
    'border-slate-200 bg-slate-100 text-slate-600',
}

const inputClass =
  'h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-black outline-none placeholder:text-slate-500 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-700'

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
  defaultValue = 0,
): number {
  const parsed = Number(value)

  return Number.isFinite(parsed)
    ? parsed
    : defaultValue
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
): CanteenTable {
  const record = asRecord(value)

  const tableNumber = stringValue(
    record.table_number,
    record.table_no,
    record.number,
  )

  return {
    id: stringValue(record.id) || tableNumber,

    table_number: tableNumber,

    name:
      stringValue(
        record.name,
        record.table_name,
      ) || `Table ${tableNumber}`,

    location: stringValue(
      record.location,
      record.area,
      record.section,
    ),

    capacity: numberValue(
      record.capacity,
      1,
    ),

    status: normalizeStatus(
      record.status,
    ),

    description: stringValue(
      record.description,
      record.notes,
    ),

    qr_token: stringValue(
      record.qr_token,
      record.public_token,
      record.token,
    ),

    qr_url:
      stringValue(
        record.qr_url,
        record.public_url,
      ) || null,

    created_at:
      stringValue(
        record.created_at,
      ) || null,

    updated_at:
      stringValue(
        record.updated_at,
      ) || null,
  }
}

function extractTableCollection(
  payload: unknown,
): CanteenTable[] {
  const root = asRecord(payload)
  const data = asRecord(root.data)

  const candidates: unknown[] = [
    data.data,
    root.data,
    root.tables,
    root.records,
    payload,
  ]

  const collection = candidates.find(
    (candidate) => Array.isArray(candidate),
  )

  if (!Array.isArray(collection)) {
    return []
  }

  return collection.map(normalizeTable)
}

function extractSingleTable(
  payload: unknown,
): CanteenTable {
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
    'The server did not return the saved table.',
  )
}

/**
 * Remove Bearer prefix and extra quotation marks.
 */
function cleanPlainToken(value: string): string {
  return value
    .trim()
    .replace(/^"|"$/g, '')
    .replace(/^Bearer\s+/i, '')
    .trim()
}

/**
 * Search for a token inside a string or JSON object.
 */
function extractTokenFromValue(
  value: unknown,
  allowPlainString = false,
): string {
  if (
    value === undefined ||
    value === null
  ) {
    return ''
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()

    if (!trimmed) {
      return ''
    }

    /*
     * Try to decode JSON values such as:
     *
     * {"token":"..."}
     * {"access_token":"..."}
     * "plain-token"
     */
    try {
      const parsed = JSON.parse(trimmed)

      if (parsed !== trimmed) {
        const parsedToken =
          extractTokenFromValue(
            parsed,
            allowPlainString,
          )

        if (parsedToken) {
          return parsedToken
        }
      }
    } catch {
      // The value is not JSON.
    }

    return allowPlainString
      ? cleanPlainToken(trimmed)
      : ''
  }

  if (
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    return ''
  }

  const record = value as UnknownRecord

  /*
   * Common token field names used by
   * Laravel Sanctum and frontend auth systems.
   */
  const directTokenFields = [
    'access_token',
    'accessToken',
    'auth_token',
    'authToken',
    'token',
    'api_token',
    'apiToken',
    'plainTextToken',
    'plain_text_token',
    'bearer_token',
    'bearerToken',
  ]

  for (const field of directTokenFields) {
    if (record[field] === undefined) {
      continue
    }

    const token = extractTokenFromValue(
      record[field],
      true,
    )

    if (token) {
      return token
    }
  }

  /*
   * Search common nested objects.
   */
  const nestedFields = [
    'data',
    'auth',
    'session',
    'credentials',
    'response',
    'payload',
    'user',
  ]

  for (const field of nestedFields) {
    if (record[field] === undefined) {
      continue
    }

    const token = extractTokenFromValue(
      record[field],
      false,
    )

    if (token) {
      return token
    }
  }

  return ''
}

/**
 * Find the authentication token saved by AuthContext.
 *
 * It checks both localStorage and sessionStorage.
 */
function getStoredToken(): string {
  if (typeof window === 'undefined') {
    return ''
  }

  const preferredKeys = [
    'auth_token',
    'access_token',
    'token',
    'api_token',
    'sanctum_token',
    'smart_canteen_token',
    'smart-canteen-token',
    'canteen_token',
    'canteen-token',
    'auth',
    'auth_data',
    'authData',
    'user',
    'session',
  ]

  const storages: Storage[] = [
    window.localStorage,
    window.sessionStorage,
  ]

  /*
   * First check known storage keys.
   */
  for (const storage of storages) {
    for (const key of preferredKeys) {
      const storedValue = storage.getItem(key)

      if (!storedValue) {
        continue
      }

      const token = extractTokenFromValue(
        storedValue,
        true,
      )

      if (token) {
        return token
      }
    }
  }

  /*
   * Then inspect all storage entries in case
   * AuthContext uses a different key name.
   */
  for (const storage of storages) {
    for (
      let index = 0;
      index < storage.length;
      index += 1
    ) {
      const key = storage.key(index)

      if (!key) {
        continue
      }

      const storedValue = storage.getItem(key)

      if (!storedValue) {
        continue
      }

      const keyLooksLikeAuth =
        /token|auth|session|login|user/i.test(key)

      const token = extractTokenFromValue(
        storedValue,
        keyLooksLikeAuth,
      )

      if (token) {
        return token
      }
    }
  }

  return ''
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(
    options.headers,
  )

  headers.set(
    'Accept',
    'application/json',
  )

  if (
    options.body &&
    !(options.body instanceof FormData)
  ) {
    headers.set(
      'Content-Type',
      'application/json',
    )
  }

  const token = getStoredToken()

  if (!token) {
    throw new ApiRequestError(
      'Your login session was not found. Please log out and sign in again.',
      401,
    )
  }

  headers.set(
    'Authorization',
    `Bearer ${token}`,
  )

  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      ...options,
      headers,

      /*
       * Authentication is sent using the
       * Authorization Bearer header.
       */
      credentials: 'omit',

      cache: 'no-store',
    },
  )

  const payload = await response
    .json()
    .catch(() => null)

  if (!response.ok) {
    const responseRecord = asRecord(payload)

    const errors = asRecord(
      responseRecord.errors,
    )

    const firstError = Object.values(
      errors,
    ).find((value) =>
      Array.isArray(value),
    )

    const validationMessage =
      Array.isArray(firstError) &&
      firstError.length > 0
        ? String(firstError[0])
        : ''

    let message =
      validationMessage ||
      stringValue(
        responseRecord.message,
        responseRecord.error,
      ) ||
      `Request failed with status ${response.status}.`

    if (response.status === 401) {
      message =
        'Your login session is invalid or expired. Please log out and sign in again.'
    }

    throw new ApiRequestError(
      message,
      response.status,
    )
  }

  return payload as T
}

function formatStatus(
  status: string,
): string {
  return status
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    )
}

function formatDate(
  value?: string | null,
): string {
  if (!value) {
    return '-'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export default function TableRecordsPage() {
  const [tables, setTables] = useState<
    CanteenTable[]
  >([])

  const [search, setSearch] = useState('')

  const [statusFilter, setStatusFilter] =
    useState<'all' | TableStatus>('all')

  const [isLoading, setIsLoading] =
    useState(false)

  const [isSubmitting, setIsSubmitting] =
    useState(false)

  const [deletingId, setDeletingId] =
    useState<number | string | null>(null)

  const [errorMessage, setErrorMessage] =
    useState('')

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('')

  const [showForm, setShowForm] =
    useState(false)

  const [editingTable, setEditingTable] =
    useState<CanteenTable | null>(null)

  const [
    selectedTable,
    setSelectedTable,
  ] = useState<CanteenTable | null>(null)

  const [form, setForm] =
    useState<TableFormState>(emptyForm)

  const fetchTables = useCallback(
    async (showLoader = true) => {
      if (showLoader) {
        setIsLoading(true)
      }

      setErrorMessage('')

      try {
        const response =
          await apiRequest<unknown>(
            '/canteen-tables?per_page=200',
          )

        setTables(
          extractTableCollection(response),
        )
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to load canteen tables.',
        )
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    void fetchTables()
  }, [fetchTables])

  const filteredTables = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase()

    return tables.filter((table) => {
      const matchesSearch =
        !query ||
        table.table_number
          .toLowerCase()
          .includes(query) ||
        table.name
          .toLowerCase()
          .includes(query) ||
        table.location
          .toLowerCase()
          .includes(query)

      const matchesStatus =
        statusFilter === 'all' ||
        table.status === statusFilter

      return (
        matchesSearch &&
        matchesStatus
      )
    })
  }, [
    search,
    statusFilter,
    tables,
  ])

  const availableTables =
    tables.filter(
      (table) =>
        table.status === 'available',
    ).length

  const occupiedTables =
    tables.filter(
      (table) =>
        table.status === 'occupied',
    ).length

  const reservedTables =
    tables.filter(
      (table) =>
        table.status === 'reserved',
    ).length

  function getTableQrValue(
    table: CanteenTable,
  ): string {
    const token =
      table.qr_token ||
      String(table.id)

    /*
     * Always build the QR destination from NEXT_PUBLIC_APP_URL.
     * This prevents old API values such as localhost URLs from
     * being encoded in newly displayed or downloaded QR codes.
     */
    return `${APP_URL}/table/${encodeURIComponent(
      token,
    )}`
  }

  function openCreateForm() {
    setEditingTable(null)
    setForm(emptyForm)
    setErrorMessage('')
    setSuccessMessage('')
    setShowForm(true)
  }

  function openEditForm(
    table: CanteenTable,
  ) {
    setEditingTable(table)

    setForm({
      table_number:
        table.table_number,
      name: table.name,
      location: table.location,
      capacity: String(
        table.capacity,
      ),
      status: table.status,
      description:
        table.description,
    })

    setErrorMessage('')
    setSuccessMessage('')
    setShowForm(true)
  }

  function closeForm() {
    if (isSubmitting) {
      return
    }

    setShowForm(false)
    setEditingTable(null)
    setForm(emptyForm)
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setErrorMessage('')
    setSuccessMessage('')
    setIsSubmitting(true)

    try {
      const tableNumber =
        form.table_number.trim()

      const requestBody = {
        table_number: tableNumber,

        name:
          form.name.trim() ||
          `Table ${tableNumber}`,

        location:
          form.location.trim(),

        capacity:
          Number(form.capacity),

        status:
          form.status,

        description:
          form.description.trim() ||
          null,
      }

      const response =
        editingTable
          ? await apiRequest<unknown>(
              `/canteen-tables/${editingTable.id}`,
              {
                method: 'PUT',
                body: JSON.stringify(
                  requestBody,
                ),
              },
            )
          : await apiRequest<unknown>(
              '/canteen-tables',
              {
                method: 'POST',
                body: JSON.stringify(
                  requestBody,
                ),
              },
            )

      const savedTable =
        extractSingleTable(response)

      setSuccessMessage(
        editingTable
          ? 'Table updated successfully.'
          : 'Table created and QR code generated successfully.',
      )

      setShowForm(false)
      setEditingTable(null)
      setForm(emptyForm)

      await fetchTables(false)

      if (!editingTable) {
        setSelectedTable(savedTable)
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to save the table.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(
    table: CanteenTable,
  ) {
    const confirmed = window.confirm(
      `Delete ${table.name}? Its QR code will no longer work.`,
    )

    if (!confirmed) {
      return
    }

    setDeletingId(table.id)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      await apiRequest<unknown>(
        `/canteen-tables/${table.id}`,
        {
          method: 'DELETE',
        },
      )

      setTables((current) =>
        current.filter(
          (item) =>
            item.id !== table.id,
        ),
      )

      setSuccessMessage(
        `${table.name} deleted successfully.`,
      )
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to delete the table.',
      )
    } finally {
      setDeletingId(null)
    }
  }

  function downloadQrCode(
    table: CanteenTable,
  ) {
    const element =
      document.getElementById(
        `table-qr-${table.id}`,
      )

    if (
      !(
        element instanceof
        SVGElement
      )
    ) {
      setErrorMessage(
        'QR code is not available for download.',
      )
      return
    }

    const serializer =
      new XMLSerializer()

    const source =
      serializer.serializeToString(
        element,
      )

    const blob = new Blob(
      [source],
      {
        type: 'image/svg+xml;charset=utf-8',
      },
    )

    const url =
      URL.createObjectURL(blob)

    const anchor =
      document.createElement('a')

    anchor.href = url
    anchor.download =
      `${table.table_number}-qr-code.svg`

    document.body.appendChild(anchor)

    anchor.click()
    anchor.remove()

    URL.revokeObjectURL(url)
  }

  function printQrCode(
    table: CanteenTable,
  ) {
    const element =
      document.getElementById(
        `table-qr-${table.id}`,
      )

    if (
      !(
        element instanceof
        SVGElement
      )
    ) {
      setErrorMessage(
        'QR code is not available for printing.',
      )
      return
    }

    const printWindow = window.open(
      '',
      '_blank',
      'width=700,height=850',
    )

    if (!printWindow) {
      setErrorMessage(
        'Your browser blocked the print window.',
      )
      return
    }

    printWindow.document.write(`
      <!DOCTYPE html>

      <html>
        <head>
          <title>
            ${escapeHtml(table.name)} QR Code
          </title>

          <style>
            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              padding: 40px;
              background: #ffffff;
              color: #0f172a;
              font-family: Arial, sans-serif;
              text-align: center;
            }

            .card {
              width: 420px;
              margin: 0 auto;
              border: 2px solid #e2e8f0;
              border-radius: 24px;
              padding: 30px;
            }

            h1 {
              margin: 0 0 6px;
              font-size: 30px;
            }

            .number {
              margin-bottom: 24px;
              color: #4f46e5;
              font-size: 18px;
              font-weight: bold;
            }

            svg {
              width: 290px;
              height: 290px;
            }

            .details {
              margin-top: 22px;
              color: #475569;
              font-size: 15px;
              line-height: 1.8;
            }

            .instruction {
              margin-top: 20px;
              font-weight: bold;
            }
          </style>
        </head>

        <body>
          <div class="card">
            <h1>
              ${escapeHtml(table.name)}
            </h1>

            <div class="number">
              Table ${escapeHtml(
                table.table_number,
              )}
            </div>

            ${element.outerHTML}

            <div class="details">
              Capacity:
              ${table.capacity} people
              <br />

              Location:
              ${escapeHtml(
                table.location ||
                  'Canteen',
              )}
            </div>

            <div class="instruction">
              Scan to view table information
            </div>
          </div>

          <script>
            window.onload = function () {
              window.print();
            };
          </script>
        </body>
      </html>
    `)

    printWindow.document.close()
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-600">
              Canteen Management
            </p>

            <h1 className="mt-1 text-3xl font-extrabold text-slate-950">
              Table Records
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Register every canteen table and
              automatically create its unique QR
              code.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700"
          >
            <Plus className="h-5 w-5" />
            Add Table
          </button>
        </div>

        {errorMessage && (
          <div className="mt-6 flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            <span>
              {errorMessage}
            </span>

            <button
              type="button"
              onClick={() =>
                setErrorMessage('')
              }
              aria-label="Close error message"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />

              {successMessage}
            </span>

            <button
              type="button"
              onClick={() =>
                setSuccessMessage('')
              }
              aria-label="Close success message"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total Tables"
            value={tables.length}
            icon={LayoutGrid}
            iconClass="bg-indigo-100 text-indigo-700"
          />

          <SummaryCard
            title="Available"
            value={availableTables}
            icon={CheckCircle2}
            iconClass="bg-emerald-100 text-emerald-700"
          />

          <SummaryCard
            title="Occupied"
            value={occupiedTables}
            icon={Users}
            iconClass="bg-amber-100 text-amber-700"
          />

          <SummaryCard
            title="Reserved"
            value={reservedTables}
            icon={QrCode}
            iconClass="bg-blue-100 text-blue-700"
          />
        </div>

        <div className="mt-7 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Registered Tables
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {filteredTables.length}{' '}
                table record
                {filteredTables.length === 1
                  ? ''
                  : 's'}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                  placeholder="Search tables..."
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm font-medium text-black outline-none placeholder:text-slate-500 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 sm:w-64"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as
                      | 'all'
                      | TableStatus,
                  )
                }
                className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-black outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              >
                <option value="all">
                  All statuses
                </option>

                {statusOptions.map(
                  (option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ),
                )}
              </select>

              <button
                type="button"
                onClick={() =>
                  void fetchTables()
                }
                disabled={isLoading}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    isLoading
                      ? 'animate-spin'
                      : ''
                  }`}
                />

                Refresh
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex min-h-72 items-center justify-center">
              <div className="text-center">
                <LoaderCircle className="mx-auto h-9 w-9 animate-spin text-indigo-600" />

                <p className="mt-3 text-sm font-medium text-slate-600">
                  Loading table records...
                </p>
              </div>
            </div>
          ) : filteredTables.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <LayoutGrid className="h-8 w-8" />
              </span>

              <h3 className="mt-4 text-lg font-bold text-slate-950">
                No table records found
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                Create the first canteen table
                and its QR code will be generated
                automatically.
              </p>

              <button
                type="button"
                onClick={openCreateForm}
                className="mt-5 flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white"
              >
                <Plus className="h-4 w-4" />
                Add First Table
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-4">
                      Table
                    </th>

                    <th className="px-5 py-4">
                      Location
                    </th>

                    <th className="px-5 py-4">
                      Capacity
                    </th>

                    <th className="px-5 py-4">
                      Status
                    </th>

                    <th className="px-5 py-4">
                      QR Code
                    </th>

                    <th className="px-5 py-4">
                      Created
                    </th>

                    <th className="px-5 py-4 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredTables.map(
                    (table) => (
                      <tr
                        key={table.id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 font-extrabold text-indigo-700">
                              {table.table_number}
                            </span>

                            <div>
                              <p className="font-bold text-slate-950">
                                {table.name}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                Table number:{' '}
                                {table.table_number}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <MapPin className="h-4 w-4 text-slate-400" />

                            {table.location ||
                              'Not specified'}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <Users className="h-4 w-4 text-slate-400" />

                            {table.capacity}{' '}
                            people
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusStyles[table.status]}`}
                          >
                            {formatStatus(
                              table.status,
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedTable(
                                table,
                              )
                            }
                            className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100"
                          >
                            <QrCode className="h-4 w-4" />
                            View QR
                          </button>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatDate(
                            table.created_at,
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedTable(
                                  table,
                                )
                              }
                              title="View QR code"
                              className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openEditForm(
                                  table,
                                )
                              }
                              title="Edit table"
                              className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                void handleDelete(
                                  table,
                                )
                              }
                              disabled={
                                deletingId ===
                                table.id
                              }
                              title="Delete table"
                              className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deletingId ===
                              table.id ? (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 p-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-950">
                  {editingTable
                    ? 'Update Table'
                    : 'Create New Table'}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {editingTable
                    ? 'Update the selected table information.'
                    : 'A unique QR code will be generated after saving.'}
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100"
                aria-label="Close form"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  label="Table Number"
                  required
                >
                  <input
                    type="text"
                    value={form.table_number}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        table_number:
                          event.target.value,
                      }))
                    }
                    placeholder="Example: T01"
                    required
                    disabled={isSubmitting}
                    className={inputClass}
                  />
                </FormField>

                <FormField
                  label="Table Name"
                  required
                >
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name:
                          event.target.value,
                      }))
                    }
                    placeholder="Example: Window Table"
                    required
                    disabled={isSubmitting}
                    className={inputClass}
                  />
                </FormField>

                <FormField
                  label="Location or Area"
                  required
                >
                  <input
                    type="text"
                    value={form.location}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        location:
                          event.target.value,
                      }))
                    }
                    placeholder="Example: Ground Floor"
                    required
                    disabled={isSubmitting}
                    className={inputClass}
                  />
                </FormField>

                <FormField
                  label="Capacity"
                  required
                >
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={form.capacity}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        capacity:
                          event.target.value,
                      }))
                    }
                    required
                    disabled={isSubmitting}
                    className={inputClass}
                  />
                </FormField>

                <FormField
                  label="Status"
                  required
                >
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        status:
                          event.target
                            .value as TableStatus,
                      }))
                    }
                    disabled={isSubmitting}
                    className={inputClass}
                  >
                    {statusOptions.map(
                      (option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ),
                    )}
                  </select>
                </FormField>
              </div>

              <FormField label="Description">
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description:
                        event.target.value,
                    }))
                  }
                  placeholder="Add more information about this table..."
                  disabled={isSubmitting}
                  className={`${inputClass} h-auto resize-none py-3`}
                />
              </FormField>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={isSubmitting}
                  className="h-12 rounded-xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <LoaderCircle className="h-5 w-5 animate-spin" />

                      {editingTable
                        ? 'Updating...'
                        : 'Creating...'}
                    </>
                  ) : editingTable ? (
                    'Update Table'
                  ) : (
                    <>
                      <QrCode className="h-5 w-5" />
                      Create Table and QR
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedTable && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[95vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 p-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-950">
                  {selectedTable.name}
                </h2>

                <p className="mt-1 text-sm font-semibold text-indigo-600">
                  Table{' '}
                  {selectedTable.table_number}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedTable(null)
                }
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100"
                aria-label="Close QR code"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="rounded-3xl border-2 border-slate-200 bg-white p-5 text-center">
                <div className="mx-auto flex w-fit items-center justify-center rounded-2xl bg-white p-3">
                  <QRCodeSVG
                    id={`table-qr-${selectedTable.id}`}
                    value={getTableQrValue(
                      selectedTable,
                    )}
                    title={`${selectedTable.name} QR Code`}
                    size={260}
                    level="H"
                    marginSize={4}
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                </div>

                <h3 className="mt-4 text-2xl font-extrabold text-slate-950">
                  {selectedTable.name}
                </h3>

                <p className="mt-1 font-bold text-indigo-600">
                  Table{' '}
                  {selectedTable.table_number}
                </p>

                <p className="mt-4 text-sm font-semibold text-slate-600">
                  Scan this QR code to view
                  information about this table.
                </p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <DetailCard
                  label="Location"
                  value={
                    selectedTable.location ||
                    'Not specified'
                  }
                />

                <DetailCard
                  label="Capacity"
                  value={`${selectedTable.capacity} people`}
                />

                <DetailCard
                  label="Status"
                  value={formatStatus(
                    selectedTable.status,
                  )}
                />

                <DetailCard
                  label="Table Number"
                  value={
                    selectedTable.table_number
                  }
                />
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  QR Destination
                </p>

                <p className="mt-2 break-all text-sm font-medium text-black">
                  {getTableQrValue(
                    selectedTable,
                  )}
                </p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() =>
                    downloadQrCode(
                      selectedTable,
                    )
                  }
                  className="flex h-12 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100"
                >
                  <Download className="h-5 w-5" />
                  Download QR
                </button>

                <button
                  type="button"
                  onClick={() =>
                    printQrCode(
                      selectedTable,
                    )
                  }
                  className="flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-bold text-white transition hover:bg-indigo-700"
                >
                  <Printer className="h-5 w-5" />
                  Print QR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FormField({
  label,
  required = false,
  children,
}: {
  label: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-800">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </span>

      {children}
    </label>
  )
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  iconClass,
}: {
  title: string
  value: number
  icon: LucideIcon
  iconClass: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-extrabold text-slate-950">
            {value}
          </p>
        </div>

        <span
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconClass}`}
        >
          <Icon className="h-6 w-6" />
        </span>
      </div>
    </div>
  )
}

function DetailCard({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-sm font-bold text-slate-950">
        {value}
      </p>
    </div>
  )
}