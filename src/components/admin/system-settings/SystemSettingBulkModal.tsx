'use client'

import {
  Layers3,
  LoaderCircle,
  Save,
  X,
} from 'lucide-react'
import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'
import {
  getSystemSettingKey,
  getSystemSettingValue,
} from '@/lib/system-setting'
import type {
  SystemSetting,
  SystemSettingBulkPayload,
} from '@/types/system-setting'

interface Props {
  isOpen: boolean
  settings: SystemSetting[]
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (
    payload: SystemSettingBulkPayload,
  ) => Promise<void>
}

export default function SystemSettingBulkModal({
  isOpen,
  settings,
  isSubmitting,
  onClose,
  onSubmit,
}: Props) {
  const [jsonText, setJsonText] =
    useState('{}')

  const [formError, setFormError] =
    useState('')

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const values = Object.fromEntries(
      settings
        .filter(
          (setting) => !setting.deleted_at,
        )
        .map((setting) => [
          getSystemSettingKey(setting),
          getSystemSettingValue(setting),
        ]),
    )

    setJsonText(
      JSON.stringify(values, null, 2),
    )

    setFormError('')
  }, [isOpen, settings])

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setFormError('')

    try {
      const parsed: unknown =
        JSON.parse(jsonText)

      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        setFormError(
          'Bulk settings must be a JSON object.',
        )
        return
      }

      const payload: SystemSettingBulkPayload = {
        settings: Object.entries(parsed).map(
          ([setting_key, value]) => ({
            setting_key,
            value,
          }),
        ),
      }

      if (payload.settings.length === 0) {
        setFormError(
          'At least one setting is required.',
        )
        return
      }

      await onSubmit(payload)
    } catch (error) {
      setFormError(
        error instanceof SyntaxError
          ? 'The bulk settings JSON is invalid.'
          : error instanceof Error
            ? error.message
            : 'Unable to update settings.',
      )
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto p-4">
      <button
        type="button"
        onClick={onClose}
        disabled={isSubmitting}
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="relative z-10 my-auto w-full max-w-3xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
              <Layers3 className="h-5 w-5" />
            </span>

            <div>
              <h2 className="font-extrabold text-slate-950">
                Bulk Update Settings
              </h2>

              <p className="text-xs text-slate-500">
                Update multiple values using one JSON
                object.
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

          <textarea
            value={jsonText}
            onChange={(event) =>
              setJsonText(event.target.value)
            }
            rows={20}
            disabled={isSubmitting}
            className="w-full resize-none rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none focus:border-violet-500"
          />

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-700">
            Keep the setting keys unchanged. Modify only
            the values that need updating.
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
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
              className="flex h-11 items-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-bold text-white disabled:opacity-50"
            >
              {isSubmitting ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}

              Save All Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
