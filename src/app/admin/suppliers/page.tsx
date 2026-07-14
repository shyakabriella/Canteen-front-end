'use client'

import {
  AlertTriangle,
  Ban,
  Building2,
  CheckCircle2,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
  WalletCards,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useState,
} from 'react'
import SupplierDetailsModal from '@/components/admin/suppliers/SupplierDetailsModal'
import SupplierFormModal from '@/components/admin/suppliers/SupplierFormModal'
import SupplierTable from '@/components/admin/suppliers/SupplierTable'
import {
  createSupplier,
  deleteSupplier,
  getSupplier,
  getSuppliers,
  getSupplierSummary,
  restoreSupplier,
  updateSupplier,
} from '@/services/supplier.service'
import type {
  Supplier,
  SupplierPayload,
  SupplierSummary,
} from '@/types/supplier'

const emptySummary: SupplierSummary = {
  total_suppliers: 0,
  active_suppliers: 0,
  inactive_suppliers: 0,
  suspended_suppliers: 0,
  suppliers_with_orders: 0,
  total_purchase_requests: 0,
  total_purchase_amount: 0,
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] =
    useState<Supplier[]>([])

  const [summary, setSummary] =
    useState<SupplierSummary>(emptySummary)

  const [searchInput, setSearchInput] =
    useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [
    includeDeleted,
    setIncludeDeleted,
  ] = useState(false)

  const [isLoading, setIsLoading] =
    useState(true)

  const [isRefreshing, setIsRefreshing] =
    useState(false)

  const [isSubmitting, setIsSubmitting] =
    useState(false)

  const [processingId, setProcessingId] =
    useState<number | string | null>(null)

  const [formOpen, setFormOpen] =
    useState(false)

  const [editingSupplier, setEditingSupplier] =
    useState<Supplier | null>(null)

  const [detailsOpen, setDetailsOpen] =
    useState(false)

  const [detailsSupplier, setDetailsSupplier] =
    useState<Supplier | null>(null)

  const [detailsLoading, setDetailsLoading] =
    useState(false)

  const [detailsError, setDetailsError] =
    useState('')

  const [message, setMessage] = useState('')

  const [errorMessage, setErrorMessage] =
    useState('')

  const loadSuppliers = useCallback(
    async (refresh = false) => {
      setErrorMessage('')

      if (refresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      try {
        const filters = {
          search,
          status,
          city,
          country,
          dateFrom,
          dateTo,
          includeDeleted,
          perPage: 200,
        }

        const [
          listResult,
          summaryResult,
        ] = await Promise.all([
          getSuppliers(filters),
          getSupplierSummary(filters),
        ])

        setSuppliers(listResult.suppliers)
        setSummary(summaryResult)
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to load suppliers.',
        )
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [
      search,
      status,
      city,
      country,
      dateFrom,
      dateTo,
      includeDeleted,
    ],
  )

  useEffect(() => {
    void loadSuppliers()
  }, [loadSuppliers])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim())
    }, 400)

    return () =>
      window.clearTimeout(timer)
  }, [searchInput])

  function openCreateForm() {
    setEditingSupplier(null)
    setFormOpen(true)
  }

  function openEditForm(
    supplier: Supplier,
  ) {
    setEditingSupplier(supplier)
    setFormOpen(true)
  }

  async function handleFormSubmit(
    payload: SupplierPayload,
  ) {
    setIsSubmitting(true)
    setMessage('')
    setErrorMessage('')

    try {
      const result = editingSupplier
        ? await updateSupplier(
            editingSupplier.id,
            payload,
          )
        : await createSupplier(payload)

      setMessage(result.message)
      setFormOpen(false)
      setEditingSupplier(null)

      await loadSuppliers(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to save the supplier.',
      )

      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleView(
    supplier: Supplier,
  ) {
    setDetailsOpen(true)
    setDetailsLoading(true)
    setDetailsSupplier(null)
    setDetailsError('')

    try {
      const result = await getSupplier(
        supplier.id,
      )

      setDetailsSupplier(result)
    } catch (error) {
      setDetailsError(
        error instanceof Error
          ? error.message
          : 'Unable to load supplier details.',
      )
    } finally {
      setDetailsLoading(false)
    }
  }

  async function handleDelete(
    supplier: Supplier,
  ) {
    const confirmed = window.confirm(
      `Delete ${supplier.name ?? supplier.company_name ?? `supplier #${supplier.id}`}?\n\nExisting purchase records should remain available.`,
    )

    if (!confirmed) {
      return
    }

    setProcessingId(supplier.id)
    setMessage('')
    setErrorMessage('')

    try {
      const responseMessage =
        await deleteSupplier(supplier.id)

      setMessage(responseMessage)
      await loadSuppliers(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to delete the supplier.',
      )
    } finally {
      setProcessingId(null)
    }
  }

  async function handleRestore(
    supplier: Supplier,
  ) {
    const confirmed = window.confirm(
      `Restore supplier #${supplier.id}?`,
    )

    if (!confirmed) {
      return
    }

    setProcessingId(supplier.id)
    setMessage('')
    setErrorMessage('')

    try {
      const responseMessage =
        await restoreSupplier(supplier.id)

      setMessage(responseMessage)
      await loadSuppliers(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to restore the supplier.',
      )
    } finally {
      setProcessingId(null)
    }
  }

  function clearFilters() {
    setSearchInput('')
    setSearch('')
    setStatus('')
    setCity('')
    setCountry('')
    setDateFrom('')
    setDateTo('')
    setIncludeDeleted(false)
  }

  function formatAmount(
    value: number,
  ): string {
    return `${new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(value)} RWF`
  }

  return (
    <>
      <div className="space-y-6">
        <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-600">
              Procurement Management
            </p>

            <h1 className="mt-2 text-2xl font-extrabold text-slate-950 sm:text-3xl">
              Suppliers
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage food, beverage and inventory
              suppliers for the canteen.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                void loadSuppliers(true)
              }
              disabled={isRefreshing}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              {isRefreshing ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}

              Refresh
            </button>

            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Add Supplier
            </button>
          </div>
        </section>

        {message && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {message}
          </div>
        )}

        {errorMessage && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <SummaryCard
            title="Total Suppliers"
            value={String(
              summary.total_suppliers,
            )}
            icon={Building2}
            iconClass="bg-indigo-50 text-indigo-600"
          />

          <SummaryCard
            title="Active"
            value={String(
              summary.active_suppliers,
            )}
            icon={CheckCircle2}
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <SummaryCard
            title="Inactive"
            value={String(
              summary.inactive_suppliers,
            )}
            icon={Building2}
            iconClass="bg-slate-100 text-slate-600"
          />

          <SummaryCard
            title="Suspended"
            value={String(
              summary.suspended_suppliers,
            )}
            icon={Ban}
            iconClass="bg-red-50 text-red-600"
          />

          <SummaryCard
            title="With Orders"
            value={String(
              summary.suppliers_with_orders,
            )}
            subtitle={`${summary.total_purchase_requests} requests`}
            icon={ShoppingCart}
            iconClass="bg-amber-50 text-amber-600"
          />

          <SummaryCard
            title="Purchases"
            value={formatAmount(
              summary.total_purchase_amount,
            )}
            icon={WalletCards}
            iconClass="bg-blue-50 text-blue-600"
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="space-y-3 border-b border-slate-200 p-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_180px_200px_200px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="search"
                  value={searchInput}
                  onChange={(event) =>
                    setSearchInput(
                      event.target.value,
                    )
                  }
                  placeholder="Search supplier, contact, phone or email..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                />
              </div>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value)
                }
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              >
                <option value="">
                  All statuses
                </option>

                <option value="active">
                  Active
                </option>

                <option value="inactive">
                  Inactive
                </option>

                <option value="suspended">
                  Suspended
                </option>
              </select>

              <input
                type="text"
                value={city}
                onChange={(event) =>
                  setCity(event.target.value)
                }
                placeholder="Filter by city"
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />

              <input
                type="text"
                value={country}
                onChange={(event) =>
                  setCountry(event.target.value)
                }
                placeholder="Filter by country"
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[190px_190px_auto_auto]">
              <input
                type="date"
                value={dateFrom}
                onChange={(event) =>
                  setDateFrom(event.target.value)
                }
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400"
              />

              <input
                type="date"
                value={dateTo}
                onChange={(event) =>
                  setDateTo(event.target.value)
                }
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400"
              />

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-600">
                <input
                  type="checkbox"
                  checked={includeDeleted}
                  onChange={(event) =>
                    setIncludeDeleted(
                      event.target.checked,
                    )
                  }
                  className="h-4 w-4 accent-indigo-600"
                />

                Include deleted
              </label>

              <button
                type="button"
                onClick={clearFilters}
                className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex min-h-[390px] items-center justify-center">
              <div className="text-center">
                <LoaderCircle className="mx-auto h-9 w-9 animate-spin text-indigo-600" />

                <p className="mt-3 text-sm font-semibold text-slate-500">
                  Loading suppliers...
                </p>
              </div>
            </div>
          ) : suppliers.length === 0 ? (
            <div className="flex min-h-[390px] items-center justify-center px-6 text-center">
              <div>
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600">
                  <Building2 className="h-8 w-8" />
                </span>

                <h2 className="mt-5 text-lg font-extrabold text-slate-900">
                  No suppliers found
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Add suppliers that provide food,
                  beverages and inventory materials.
                </p>

                <button
                  type="button"
                  onClick={openCreateForm}
                  className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white"
                >
                  <Plus className="h-4 w-4" />
                  Add Supplier
                </button>
              </div>
            </div>
          ) : (
            <SupplierTable
              suppliers={suppliers}
              processingId={processingId}
              onView={(supplier) =>
                void handleView(supplier)
              }
              onEdit={openEditForm}
              onDelete={(supplier) =>
                void handleDelete(supplier)
              }
              onRestore={(supplier) =>
                void handleRestore(supplier)
              }
            />
          )}
        </section>
      </div>

      <SupplierFormModal
        isOpen={formOpen}
        supplier={editingSupplier}
        isSubmitting={isSubmitting}
        onClose={() => {
          if (!isSubmitting) {
            setFormOpen(false)
            setEditingSupplier(null)
          }
        }}
        onSubmit={handleFormSubmit}
      />

      <SupplierDetailsModal
        isOpen={detailsOpen}
        supplier={detailsSupplier}
        isLoading={detailsLoading}
        errorMessage={detailsError}
        onClose={() => {
          setDetailsOpen(false)
          setDetailsSupplier(null)
          setDetailsError('')
        }}
      />
    </>
  )
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClass,
}: {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  iconClass: string
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">
            {title}
          </p>

          <p className="mt-2 truncate text-2xl font-extrabold text-slate-950">
            {value}
          </p>

          {subtitle && (
            <p className="mt-1 truncate text-xs text-slate-400">
              {subtitle}
            </p>
          )}
        </div>

        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </article>
  )
}
