'use client'

import {
  CheckCircle2,
  KeyRound,
  LoaderCircle,
  X,
} from 'lucide-react'
import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'
import {
  getSystemSettingKey,
  getSystemSettingLabel,
  getSystemSettingType,
  getSystemSettingValue,
  parseSystemSettingInput,
  systemSettingValueToInput,
} from '@/lib/system-setting'
import type {
  SystemSetting,
  SystemSettingValuePayload,
} from '@/types/system-setting'

interface Props {
  isOpen: boolean
  setting: SystemSetting | null
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (
    payload: SystemSettingValuePayload,
  ) => Promise<void>
}

export default function SystemSettingValueModal({
  isOpen,
  setting,
  isSubmitting,
  onClose,
  onSubmit,
}: Props) {
  const [valueText, setValueText] =
    useState('')

  const [formError, setFormError] =
    useState('')

  useEffect(() => {
    if (!isOpen || !setting) {
      return
    }

    setValueText(
      systemSettingValueToInput(
        getSystemSettingValue(setting),
        getSystemSettingType(setting),
      ),
    )

    setFormError('')
  }, [isOpen, setting])

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setFormError('')

    if (!setting) {
      return
    }

    try {
      await onSubmit({
        value: parseSystemSettingInput(
          valueText,
          getSystemSettingType(setting),
        ),
      })
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Unable to update the setting.',
      )
    }
  }

  if (!isOpen || !setting) {
    return null
  }

  const type = getSystemSettingType(setting)

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button
        type="button"
        onClick={onClose}
        disabled={isSubmitting}
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="relative z-10 w-full max-w-xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <KeyRound className="h-5 w-5" />
            </span>

            <div>
              <h2 className="font-extrabold text-slate-950">
                Quick Value Update
              </h2>

              <p className="text-xs text-slate-500">
                {getSystemSettingKey(setting)}
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
              {getSystemSettingLabel(setting)}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Type: {type}
            </p>
          </div>

          {type === 'boolean' ? (
            <select
              value={valueText}
              onChange={(event) =>
                setValueText(event.target.value)
              }
              disabled={isSubmitting}
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm"
            >
              <option value="true">
                Enabled / True
              </option>
              <option value="false">
                Disabled / False
              </option>
            </select>
          ) : type === 'json' ||
            type === 'text' ? (
            <textarea
              value={valueText}
              onChange={(event) =>
                setValueText(event.target.value)
              }
              rows={type === 'json' ? 8 : 5}
              disabled={isSubmitting}
              className={`w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm ${
                type === 'json'
                  ? 'bg-slate-950 font-mono text-slate-100'
                  : 'bg-slate-50'
              }`}
            />
          ) : (
            <input
              type={
                [
                  'integer',
                  'number',
                  'decimal',
                ].includes(type)
                  ? 'number'
                  : 'text'
              }
              step={
                type === 'integer'
                  ? '1'
                  : type === 'number' ||
                      type === 'decimal'
                    ? 'any'
                    : undefined
              }
              value={valueText}
              onChange={(event) =>
                setValueText(event.target.value)
              }
              disabled={isSubmitting}
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm"
            />
          )}

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
              className="flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white disabled:opacity-50"
            >
              {isSubmitting ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}

              Update Value
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
