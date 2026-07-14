'use client'

import {
  BarChart3,
  CheckCircle2,
  LoaderCircle,
  Sparkles,
  X,
} from 'lucide-react'
import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'
import {
  getSalesReportEndDate,
  getSalesReportStartDate,
  getSalesReportTitle,
  getSalesReportType,
} from '@/lib/sales-report'
import type {
  SalesReport,
  SalesReportPayload,
} from '@/types/sales-report'

export type SalesReportFormMode =
  | 'generate'
  | 'create'
  | 'edit'

interface Props {
  isOpen: boolean
  mode: SalesReportFormMode
  report?: SalesReport | null
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (
    payload: SalesReportPayload,
  ) => Promise<void>
}

function todayValue(): string {
  return new Date().toISOString().slice(0, 10)
}

function firstDayOfMonth(): string {
  const date = new Date()

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    '01',
  ].join('-')
}

export default function SalesReportFormModal({
  isOpen,
  mode,
  report,
  isSubmitting,
  onClose,
  onSubmit,
}: Props) {
  const [title, setTitle] = useState('')
  const [reportType, setReportType] =
    useState('monthly')
  const [startDate, setStartDate] =
    useState('')
  const [endDate, setEndDate] =
    useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] =
    useState('')

  useEffect(() => {
    if (!isOpen) {
      return
    }

    if (report && mode === 'edit') {
      setTitle(getSalesReportTitle(report))
      setReportType(getSalesReportType(report))

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

      setNotes(report.notes ?? '')
    } else {
      setTitle('Monthly Sales Report')
      setReportType('monthly')
      setStartDate(firstDayOfMonth())
      setEndDate(todayValue())
      setNotes('')
    }

    setFormError('')
  }, [isOpen, mode, report])

  useEffect(() => {
    if (mode === 'edit') {
      return
    }

    const labels = {
      daily: 'Daily Sales Report',
      weekly: 'Weekly Sales Report',
      monthly: 'Monthly Sales Report',
      custom: 'Custom Sales Report',
    } as const

    setTitle(
      labels[
        reportType as keyof typeof labels
      ] ?? 'Sales Report',
    )
  }, [reportType, mode])

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setFormError('')

    if (!title.trim()) {
      setFormError(
        'Report title is required.',
      )
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

    try {
      await onSubmit({
        title: title.trim(),
        report_type: reportType,
        start_date: startDate,
        end_date: endDate,
        notes: notes.trim(),
      })
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Unable to save the sales report.',
      )
    }
  }

  if (!isOpen) {
    return null
  }

  const generating = mode === 'generate'
  const editing = mode === 'edit'
  const Icon = generating ? Sparkles : BarChart3

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4">
      <button
        type="button"
        aria-label="Close sales report form"
        onClick={onClose}
        disabled={isSubmitting}
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="relative z-10 my-auto w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Icon className="h-5 w-5" />
            </span>

            <div>
              <h2 className="font-extrabold text-slate-950">
                {generating
                  ? 'Generate Sales Report'
                  : editing
                    ? 'Update Draft Report'
                    : 'Create Draft Report'}
              </h2>

              <p className="text-xs text-slate-500">
                Choose the sales period and report type.
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
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {formError}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Report title
            </label>

            <input
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              required
              disabled={isSubmitting}
              placeholder="Monthly Sales Report"
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Report type
            </label>

            <select
              value={reportType}
              onChange={(event) =>
                setReportType(event.target.value)
              }
              disabled={isSubmitting}
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            >
              <option value="daily">
                Daily
              </option>

              <option value="weekly">
                Weekly
              </option>

              <option value="monthly">
                Monthly
              </option>

              <option value="custom">
                Custom period
              </option>
            </select>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Start date
              </label>

              <input
                type="date"
                value={startDate}
                onChange={(event) =>
                  setStartDate(event.target.value)
                }
                required
                disabled={isSubmitting}
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400"
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
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Notes
            </label>

            <textarea
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              rows={4}
              disabled={isSubmitting}
              placeholder="Optional information about this report..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-700">
            Sales totals must be calculated by Laravel
            from completed orders. The frontend does not
            accept manually typed sales amounts.
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-600"
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
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />

                  {generating
                    ? 'Generate Report'
                    : editing
                      ? 'Update Report'
                      : 'Create Draft'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
