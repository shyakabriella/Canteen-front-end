'use client'

import {
  Building2,
  CheckCircle2,
  LoaderCircle,
  X,
} from 'lucide-react'
import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'
import {
  getSupplierContactPerson,
  getSupplierName,
  getSupplierSecondaryPhone,
  getSupplierStatus,
  getSupplierTaxNumber,
} from '@/lib/supplier'
import type {
  Supplier,
  SupplierPayload,
} from '@/types/supplier'

interface SupplierFormModalProps {
  isOpen: boolean
  supplier?: Supplier | null
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (
    payload: SupplierPayload,
  ) => Promise<void>
}

export default function SupplierFormModal({
  isOpen,
  supplier,
  isSubmitting,
  onClose,
  onSubmit,
}: SupplierFormModalProps) {
  const [name, setName] = useState('')
  const [contactPerson, setContactPerson] =
    useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [secondaryPhone, setSecondaryPhone] =
    useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] =
    useState('Rwanda')
  const [taxNumber, setTaxNumber] =
    useState('')
  const [paymentTerms, setPaymentTerms] =
    useState('')
  const [status, setStatus] =
    useState('active')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] =
    useState('')

  const editing = Boolean(supplier)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setName(
      supplier
        ? getSupplierName(supplier)
        : '',
    )

    setContactPerson(
      supplier
        ? getSupplierContactPerson(supplier)
        : '',
    )

    setEmail(supplier?.email ?? '')
    setPhone(supplier?.phone ?? '')

    setSecondaryPhone(
      supplier
        ? getSupplierSecondaryPhone(supplier) ===
          'Not provided'
          ? ''
          : getSupplierSecondaryPhone(supplier)
        : '',
    )

    setAddress(supplier?.address ?? '')
    setCity(supplier?.city ?? '')
    setCountry(supplier?.country ?? 'Rwanda')

    setTaxNumber(
      supplier
        ? getSupplierTaxNumber(supplier) ===
          'Not provided'
          ? ''
          : getSupplierTaxNumber(supplier)
        : '',
    )

    setPaymentTerms(
      supplier?.payment_terms ?? '',
    )

    setStatus(
      supplier
        ? getSupplierStatus(supplier)
        : 'active',
    )

    setNotes(supplier?.notes ?? '')
    setFormError('')
  }, [isOpen, supplier])

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setFormError('')

    if (!name.trim()) {
      setFormError(
        'Supplier or company name is required.',
      )
      return
    }

    if (!contactPerson.trim()) {
      setFormError(
        'Contact person is required.',
      )
      return
    }

    if (!phone.trim()) {
      setFormError(
        'Primary phone number is required.',
      )
      return
    }

    try {
      await onSubmit({
        name: name.trim(),
        contact_person:
          contactPerson.trim(),
        email: email.trim(),
        phone: phone.trim(),
        secondary_phone:
          secondaryPhone.trim(),
        address: address.trim(),
        city: city.trim(),
        country: country.trim(),
        tax_number: taxNumber.trim(),
        payment_terms:
          paymentTerms.trim(),
        status,
        notes: notes.trim(),
      })
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Unable to save the supplier.',
      )
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4">
      <button
        type="button"
        aria-label="Close supplier form"
        onClick={onClose}
        disabled={isSubmitting}
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="relative z-10 my-auto w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Building2 className="h-5 w-5" />
            </span>

            <div>
              <h2 className="font-extrabold text-slate-950">
                {editing
                  ? 'Update Supplier'
                  : 'Create Supplier'}
              </h2>

              <p className="text-xs text-slate-500">
                Manage company, contact and payment
                information.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="max-h-[calc(100vh-130px)] space-y-5 overflow-y-auto p-6"
        >
          {formError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              id="supplier-name"
              label="Supplier / company name"
              value={name}
              onChange={setName}
              placeholder="Example: Kigali Fresh Foods Ltd"
              required
              disabled={isSubmitting}
            />

            <Field
              id="supplier-contact-person"
              label="Contact person"
              value={contactPerson}
              onChange={setContactPerson}
              placeholder="Example: Jean Claude"
              required
              disabled={isSubmitting}
            />

            <Field
              id="supplier-email"
              label="Email address"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="supplier@example.com"
              disabled={isSubmitting}
            />

            <Field
              id="supplier-phone"
              label="Primary phone"
              type="tel"
              value={phone}
              onChange={setPhone}
              placeholder="0788000000"
              required
              disabled={isSubmitting}
            />

            <Field
              id="supplier-secondary-phone"
              label="Secondary phone"
              type="tel"
              value={secondaryPhone}
              onChange={setSecondaryPhone}
              placeholder="Optional phone number"
              disabled={isSubmitting}
            />

            <Field
              id="supplier-tax-number"
              label="Tax / TIN number"
              value={taxNumber}
              onChange={setTaxNumber}
              placeholder="Optional tax number"
              disabled={isSubmitting}
            />

            <Field
              id="supplier-city"
              label="City"
              value={city}
              onChange={setCity}
              placeholder="Kigali"
              disabled={isSubmitting}
            />

            <Field
              id="supplier-country"
              label="Country"
              value={country}
              onChange={setCountry}
              placeholder="Rwanda"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label
              htmlFor="supplier-address"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Physical address
            </label>

            <input
              id="supplier-address"
              value={address}
              onChange={(event) =>
                setAddress(event.target.value)
              }
              disabled={isSubmitting}
              placeholder="Street, sector, district..."
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="supplier-payment-terms"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                Payment terms
              </label>

              <input
                id="supplier-payment-terms"
                value={paymentTerms}
                onChange={(event) =>
                  setPaymentTerms(
                    event.target.value,
                  )
                }
                disabled={isSubmitting}
                placeholder="Example: Payment within 30 days"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label
                htmlFor="supplier-status"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                Status
              </label>

              <select
                id="supplier-status"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value)
                }
                required
                disabled={isSubmitting}
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              >
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
            </div>
          </div>

          <div>
            <label
              htmlFor="supplier-notes"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Notes
            </label>

            <textarea
              id="supplier-notes"
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              rows={4}
              disabled={isSubmitting}
              placeholder="Products supplied, delivery information or administrative notes..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />

                  {editing
                    ? 'Update Supplier'
                    : 'Create Supplier'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
}: {
  id: string
  label: string
  type?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-bold text-slate-700"
      >
        {label}
      </label>

      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
      />
    </div>
  )
}
