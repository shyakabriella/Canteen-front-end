'use client'

import {
  CheckCircle2,
  FilePlus2,
  LoaderCircle,
  X,
} from 'lucide-react'
import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'
import type { ActivityLogPayload } from '@/types/activity-log'

interface Props {
  isOpen: boolean
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (
    payload: ActivityLogPayload,
  ) => Promise<void>
}

export default function ActivityLogFormModal({
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
}: Props) {
  const [action, setAction] =
    useState('manual_note')

  const [moduleName, setModuleName] =
    useState('administration')

  const [description, setDescription] =
    useState('')

  const [subjectType, setSubjectType] =
    useState('')

  const [subjectId, setSubjectId] =
    useState('')

  const [status, setStatus] =
    useState('info')

  const [metadataText, setMetadataText] =
    useState('')

  const [formError, setFormError] =
    useState('')

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setAction('manual_note')
    setModuleName('administration')
    setDescription('')
    setSubjectType('')
    setSubjectId('')
    setStatus('info')
    setMetadataText('')
    setFormError('')
  }, [isOpen])

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setFormError('')

    if (!action.trim()) {
      setFormError('Action is required.')
      return
    }

    if (!moduleName.trim()) {
      setFormError('Module is required.')
      return
    }

    if (!description.trim()) {
      setFormError(
        'Activity description is required.',
      )
      return
    }

    let metadata:
      | Record<string, unknown>
      | null = null

    if (metadataText.trim()) {
      try {
        const parsed = JSON.parse(
          metadataText,
        )

        if (
          typeof parsed !== 'object' ||
          parsed === null ||
          Array.isArray(parsed)
        ) {
          setFormError(
            'Metadata must be a JSON object.',
          )
          return
        }

        metadata =
          parsed as Record<string, unknown>
      } catch {
        setFormError(
          'Metadata contains invalid JSON.',
        )
        return
      }
    }

    try {
      await onSubmit({
        action: action.trim(),
        module: moduleName.trim(),
        description: description.trim(),
        subject_type:
          subjectType.trim(),
        subject_id: subjectId.trim(),
        status,
        metadata,
      })
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Unable to create activity log.',
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
        aria-label="Close activity log form"
        onClick={onClose}
        disabled={isSubmitting}
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="relative z-10 my-auto w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <FilePlus2 className="h-5 w-5" />
            </span>

            <div>
              <h2 className="font-extrabold text-slate-950">
                Create Manual Activity Log
              </h2>

              <p className="text-xs text-slate-500">
                Record an administrative or system
                activity manually.
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

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Action
              </label>

              <select
                value={action}
                onChange={(event) =>
                  setAction(event.target.value)
                }
                disabled={isSubmitting}
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400"
              >
                <option value="manual_note">
                  Manual Note
                </option>
                <option value="created">
                  Created
                </option>
                <option value="updated">
                  Updated
                </option>
                <option value="deleted">
                  Deleted
                </option>
                <option value="restored">
                  Restored
                </option>
                <option value="approved">
                  Approved
                </option>
                <option value="rejected">
                  Rejected
                </option>
                <option value="login">
                  Login
                </option>
                <option value="logout">
                  Logout
                </option>
              </select>
            </div>

            <Input
              label="Module"
              value={moduleName}
              onChange={setModuleName}
              placeholder="Example: inventory"
              disabled={isSubmitting}
              required
            />

            <Input
              label="Subject type"
              value={subjectType}
              onChange={setSubjectType}
              placeholder="Example: InventoryStock"
              disabled={isSubmitting}
            />

            <Input
              label="Subject ID"
              value={subjectId}
              onChange={setSubjectId}
              placeholder="Example: 12"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Status
            </label>

            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value)
              }
              disabled={isSubmitting}
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400"
            >
              <option value="info">
                Information
              </option>
              <option value="success">
                Success
              </option>
              <option value="warning">
                Warning
              </option>
              <option value="failed">
                Failed
              </option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Activity description
            </label>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value,
                )
              }
              rows={4}
              required
              disabled={isSubmitting}
              placeholder="Describe the action that occurred..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Metadata JSON
            </label>

            <textarea
              value={metadataText}
              onChange={(event) =>
                setMetadataText(
                  event.target.value,
                )
              }
              rows={6}
              disabled={isSubmitting}
              placeholder={'{\n  "reason": "Manual stock correction"\n}'}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-950 px-4 py-3 font-mono text-sm text-slate-100 outline-none focus:border-indigo-400"
            />

            <p className="mt-2 text-xs text-slate-400">
              Optional. Enter a valid JSON object.
            </p>
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
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Create Log
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  required = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled: boolean
  required?: boolean
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <input
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400"
      />
    </div>
  )
}
