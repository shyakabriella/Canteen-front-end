'use client'

import {
  Building2,
  Eye,
  Mail,
  MapPin,
  Pencil,
  Phone,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import {
  formatSupplierAmount,
  formatSupplierDate,
  getSupplierCode,
  getSupplierContactPerson,
  getSupplierEmail,
  getSupplierLocation,
  getSupplierName,
  getSupplierPhone,
  getSupplierStatus,
  getSupplierTotalAmount,
  supplierStatusLabel,
} from '@/lib/supplier'
import type { Supplier } from '@/types/supplier'

interface SupplierTableProps {
  suppliers: Supplier[]
  processingId: number | string | null
  onView: (supplier: Supplier) => void
  onEdit: (supplier: Supplier) => void
  onDelete: (supplier: Supplier) => void
  onRestore: (supplier: Supplier) => void
}

export default function SupplierTable({
  suppliers,
  processingId,
  onView,
  onEdit,
  onDelete,
  onRestore,
}: SupplierTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1180px] text-left">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.14em] text-slate-400">
          <tr>
            <th className="px-6 py-4 font-extrabold">
              Supplier
            </th>

            <th className="px-4 py-4 font-extrabold">
              Contact Person
            </th>

            <th className="px-4 py-4 font-extrabold">
              Contact
            </th>

            <th className="px-4 py-4 font-extrabold">
              Location
            </th>

            <th className="px-4 py-4 font-extrabold">
              Total Purchases
            </th>

            <th className="px-4 py-4 font-extrabold">
              Status
            </th>

            <th className="px-4 py-4 font-extrabold">
              Created
            </th>

            <th className="px-6 py-4 text-right font-extrabold">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {suppliers.map((supplier) => {
            const status =
              getSupplierStatus(supplier)

            const deleted = Boolean(
              supplier.deleted_at,
            )

            const processing =
              String(processingId) ===
              String(supplier.id)

            return (
              <tr
                key={supplier.id}
                className={`text-sm transition hover:bg-slate-50 ${
                  deleted
                    ? 'bg-red-50/30'
                    : ''
                }`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                      <Building2 className="h-5 w-5" />
                    </span>

                    <div className="min-w-0">
                      <p className="max-w-[210px] truncate font-extrabold text-slate-900">
                        {getSupplierName(supplier)}
                      </p>

                      <p className="mt-1 text-xs font-semibold text-slate-400">
                        {getSupplierCode(supplier)}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-4">
                  <p className="max-w-[170px] truncate font-bold text-slate-700">
                    {getSupplierContactPerson(
                      supplier,
                    )}
                  </p>
                </td>

                <td className="px-4 py-4">
                  <div className="space-y-1.5">
                    <p className="flex max-w-[200px] items-center gap-2 truncate text-xs font-semibold text-slate-600">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      {getSupplierPhone(supplier)}
                    </p>

                    <p className="flex max-w-[200px] items-center gap-2 truncate text-xs text-slate-500">
                      <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      {getSupplierEmail(supplier)}
                    </p>
                  </div>
                </td>

                <td className="px-4 py-4">
                  <p className="flex max-w-[210px] items-center gap-2 text-xs font-semibold text-slate-600">
                    <MapPin className="h-4 w-4 shrink-0 text-slate-400" />

                    <span className="line-clamp-2">
                      {getSupplierLocation(
                        supplier,
                      )}
                    </span>
                  </p>
                </td>

                <td className="whitespace-nowrap px-4 py-4 font-extrabold text-slate-900">
                  {formatSupplierAmount(
                    getSupplierTotalAmount(
                      supplier,
                    ),
                  )}
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${
                      deleted
                        ? 'bg-red-50 text-red-700 ring-red-200'
                        : status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                          : status === 'suspended'
                            ? 'bg-red-50 text-red-700 ring-red-200'
                            : 'bg-slate-100 text-slate-700 ring-slate-200'
                    }`}
                  >
                    {deleted
                      ? 'Deleted'
                      : supplierStatusLabel(
                          supplier,
                        )}
                  </span>
                </td>

                <td className="whitespace-nowrap px-4 py-4 text-xs font-semibold text-slate-600">
                  {formatSupplierDate(
                    supplier.created_at,
                    false,
                  )}
                </td>

                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      title="View supplier"
                      onClick={() =>
                        onView(supplier)
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {!deleted && (
                      <>
                        <button
                          type="button"
                          title="Edit supplier"
                          onClick={() =>
                            onEdit(supplier)
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-200 text-blue-600 hover:bg-blue-50"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          title="Delete supplier"
                          onClick={() =>
                            onDelete(supplier)
                          }
                          disabled={processing}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}

                    {deleted && (
                      <button
                        type="button"
                        onClick={() =>
                          onRestore(supplier)
                        }
                        disabled={processing}
                        className="flex h-9 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 disabled:opacity-50"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Restore
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
