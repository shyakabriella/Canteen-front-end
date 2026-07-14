'use client'

import {
  CheckCircle2,
  LoaderCircle,
  RefreshCcw,
  X,
} from 'lucide-react'
import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'
import {
  getSalesReportEndDate,
  getSalesReportReference,
  getSalesReportStartDate,
  getSalesReportTitle,
} from '@/lib/sales-report'
import type {
  FinalizeSalesReportPayload,
  RegenerateSalesReportPayload,
  SalesReport,
} from '@/types/sales-report'

export type SalesReportActionType =
  | 'regenerate'
  | 'finalize'

type ActionPayload =
  | RegenerateSalesReportPayload
  | FinalizeSalesReportPayload

interface Props {
  isOpen: boolean
  type: SalesReportActionType
  report: SalesReport | null
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (
    payload: ActionPayload,
  ) => Promise<void>
}

export default function SalesReportActionModal({
  isOpen,
  type,
  report,
  isSubmitting,
  onClose,
  onSubmit,
}: Props) {
  const [startDate, setStartDate] =
    useState('')
  const [endDate, setEndDate] =
    useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] =
    useState('')

  useEffect(() => {
    if (!isOpen || !report) {
      return
    }

    setStartDate(
      String(
        getSalesReportStartDate(report) ?? '',
      ).slice(0, 10),
    )

    setEndDate(
      String(
        getSalesReportEndDate(report) ?? '',
      ).slice(0, 10),
    )

    setNotes('')
    setFormError('')
  }, [isOpen, type, report])

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setFormError('')

    try {
      if (type === 'finalize') {
        await onSubmit({
          notes: notes.trim(),
        })

        return
      }

      if (!startDate || !endDate) {
        setFormError(
          'Start and end dates are required.',
        )
        return
      }

      if (
        new Date(startDate).getTime() >
        new Date(endDate).getTime()
      ) {
        setFormError(
          'The start date cannot be after the end date.',
        )
        return
      }

      await onSubmit({
        start_date: startDate,
        end_date: endDate,
        notes: notes.trim(),
      })
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Unable to process the sales report.',
      )
    }
  }

  if (!isOpen || !report) {
    return null
  }

  const regenerating = type === 'regenerate'
  const Icon = regenerating
    ? RefreshCcw
    : CheckCircle2

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto p-4">
      <button
        type="button"
        aria-label="Close sales report action"
        onClick={onClose}
        disabled={isSubmitting}
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="relative z-10 my-auto w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                regenerating
                  ? 'bg-blue-50 text-blue-600'
                  : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              <Icon className="h-5 w-5" />
            </span>

            <div>
              <h2 className="font-extrabold text-slate-950">
                {regenerating
                  ? 'Regenerate Sales Report'
                  : 'Finalize Sales Report'}
              </h2>

              <p className="text-xs text-slate-500">
                {getSalesReportReference(report)}
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
          className="space-y-5 p-6"
        >
          {formError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {formError}
            </div>
          )}

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="font-extrabold text-slate-900">
              {getSalesReportTitle(report)}
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              {regenerating
                ? 'Recalculate report values using current order and transaction records.'
                : 'Finalized reports should become read-only and cannot be edited or deleted.'}
            </p>
          </div>

          {regenerating && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Start date
                </label>

                <input
                  type="date"
                  value={startDate}
                  onChange={(event) =>
                    setStartDate(
                      event.target.value,
                    )
                  }
                  required
                  disabled={isSubmitting}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  End date
                </label>

                <input
                  type="date"
                  value={endDate}
                  onChange={(event) =>
                    setEndDate(event.target.value)
                  }
                  required
                  disabled={isSubmitting}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm"
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              {regenerating
                ? 'Regeneration notes'
                : 'Finalization notes'}
            </label>

            <textarea
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              rows={4}
              disabled={isSubmitting}
              placeholder="Optional administrative notes..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400"
            />
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-600"
            >
              Close
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-white disabled:opacity-50 ${
                regenerating
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Icon className="h-4 w-4" />

                  {regenerating
                    ? 'Regenerate Report'
                    : 'Finalize Report'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
