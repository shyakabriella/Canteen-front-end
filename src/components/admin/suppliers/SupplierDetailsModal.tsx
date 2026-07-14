'use client'

import {
  Building2,
  CalendarDays,
  CreditCard,
  FileText,
  Hash,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  ShoppingCart,
  UserRound,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  formatSupplierAmount,
  formatSupplierDate,
  getSupplierCode,
  getSupplierContactPerson,
  getSupplierEmail,
  getSupplierLastPurchaseDate,
  getSupplierLocation,
  getSupplierName,
  getSupplierOrderCount,
  getSupplierPhone,
  getSupplierPurchaseRequestCount,
  getSupplierSecondaryPhone,
  getSupplierStatus,
  getSupplierTaxNumber,
  getSupplierTotalAmount,
  supplierStatusLabel,
} from '@/lib/supplier'
import type { Supplier } from '@/types/supplier'

interface SupplierDetailsModalProps {
  isOpen: boolean
  supplier: Supplier | null
  isLoading: boolean
  errorMessage: string
  onClose: () => void
}

export default function SupplierDetailsModal({
  isOpen,
  supplier,
  isLoading,
  errorMessage,
  onClose,
}: SupplierDetailsModalProps) {
  if (!isOpen) {
    return null
  }

  const status = supplier
    ? getSupplierStatus(supplier)
    : 'active'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4">
      <button
        type="button"
        aria-label="Close supplier details"
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="relative z-10 my-auto w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="font-extrabold text-slate-950">
              Supplier Details
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Contact, location, purchasing and payment
              information.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(100vh-130px)] overflow-y-auto p-6">
          {isLoading && (
            <div className="flex min-h-72 items-center justify-center">
              <div className="text-center">
                <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-indigo-600" />

                <p className="mt-3 text-sm text-slate-500">
                  Loading supplier...
                </p>
              </div>
            </div>
          )}

          {!isLoading && errorMessage && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {!isLoading && supplier && (
            <div className="space-y-5">
              <div
                className={`rounded-3xl p-6 text-white ${
                  status === 'active'
                    ? 'bg-gradient-to-br from-indigo-600 to-blue-700'
                    : status === 'suspended'
                      ? 'bg-gradient-to-br from-red-600 to-rose-700'
                      : 'bg-gradient-to-br from-slate-600 to-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                      {getSupplierCode(supplier)}
                    </p>

                    <h3 className="mt-2 text-3xl font-extrabold">
                      {getSupplierName(supplier)}
                    </h3>

                    <p className="mt-3 text-sm text-white/80">
                      Contact:{' '}
                      {getSupplierContactPerson(
                        supplier,
                      )}
                    </p>
                  </div>

                  <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">
                    {supplierStatusLabel(supplier)}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  icon={Hash}
                  label="Supplier ID"
                  value={String(supplier.id)}
                />

                <DetailItem
                  icon={Building2}
                  label="Supplier Code"
                  value={getSupplierCode(supplier)}
                />

                <DetailItem
                  icon={UserRound}
                  label="Contact Person"
                  value={getSupplierContactPerson(
                    supplier,
                  )}
                />

                <DetailItem
                  icon={Mail}
                  label="Email"
                  value={getSupplierEmail(supplier)}
                />

                <DetailItem
                  icon={Phone}
                  label="Primary Phone"
                  value={getSupplierPhone(supplier)}
                />

                <DetailItem
                  icon={Phone}
                  label="Secondary Phone"
                  value={getSupplierSecondaryPhone(
                    supplier,
                  )}
                />

                <DetailItem
                  icon={MapPin}
                  label="Location"
                  value={getSupplierLocation(
                    supplier,
                  )}
                />

                <DetailItem
                  icon={FileText}
                  label="Tax / TIN Number"
                  value={getSupplierTaxNumber(
                    supplier,
                  )}
                />

                <DetailItem
                  icon={CreditCard}
                  label="Payment Terms"
                  value={
                    supplier.payment_terms ??
                    'Not provided'
                  }
                />

                <DetailItem
                  icon={CalendarDays}
                  label="Created At"
                  value={formatSupplierDate(
                    supplier.created_at,
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                  label="Purchase Requests"
                  value={String(
                    getSupplierPurchaseRequestCount(
                      supplier,
                    ),
                  )}
                />

                <StatCard
                  label="Purchase Orders"
                  value={String(
                    getSupplierOrderCount(
                      supplier,
                    ),
                  )}
                />

                <StatCard
                  label="Total Purchases"
                  value={formatSupplierAmount(
                    getSupplierTotalAmount(
                      supplier,
                    ),
                  )}
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-indigo-600" />

                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Last Purchase
                  </p>
                </div>

                <p className="mt-2 text-sm font-extrabold text-slate-700">
                  {formatSupplierDate(
                    getSupplierLastPurchaseDate(
                      supplier,
                    ),
                  )}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Notes
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {supplier.notes ||
                    'No supplier notes were provided.'}
                </p>
              </div>

              {supplier.deleted_at && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                  Deleted on{' '}
                  {formatSupplierDate(
                    supplier.deleted_at,
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
          <Icon className="h-5 w-5" />
        </span>

        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {label}
          </p>

          <p className="mt-1 break-words text-sm font-extrabold text-slate-800">
            {value}
          </p>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-indigo-500">
        {label}
      </p>

      <p className="mt-2 text-xl font-extrabold text-indigo-800">
        {value}
      </p>
    </div>
  )
}
