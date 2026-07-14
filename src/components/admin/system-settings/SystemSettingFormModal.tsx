'use client'

import {
  CheckCircle2,
  LoaderCircle,
  Settings2,
  X,
} from 'lucide-react'
import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'
import {
  getSystemSettingDescription,
  getSystemSettingGroup,
  getSystemSettingKey,
  getSystemSettingLabel,
  getSystemSettingType,
  getSystemSettingValue,
  isEditableSystemSetting,
  isPublicSystemSetting,
  parseSystemSettingInput,
  systemSettingValueToInput,
} from '@/lib/system-setting'
import type {
  SystemSetting,
  SystemSettingPayload,
} from '@/types/system-setting'

interface Props {
  isOpen: boolean
  setting?: SystemSetting | null
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (
    payload: SystemSettingPayload,
  ) => Promise<void>
}

export default function SystemSettingFormModal({
  isOpen,
  setting,
  isSubmitting,
  onClose,
  onSubmit,
}: Props) {
  const [settingKey, setSettingKey] =
    useState('')

  const [label, setLabel] = useState('')
  const [type, setType] = useState('string')
  const [group, setGroup] =
    useState('general')

  const [valueText, setValueText] =
    useState('')

  const [description, setDescription] =
    useState('')

  const [isPublic, setIsPublic] =
    useState(false)

  const [isEditable, setIsEditable] =
    useState(true)

  const [formError, setFormError] =
    useState('')

  useEffect(() => {
    if (!isOpen) {
      return
    }

    if (setting) {
      const settingType =
        getSystemSettingType(setting)

      setSettingKey(
        getSystemSettingKey(setting),
      )

      setLabel(getSystemSettingLabel(setting))
      setType(settingType)
      setGroup(getSystemSettingGroup(setting))

      setValueText(
        systemSettingValueToInput(
          getSystemSettingValue(setting),
          settingType,
        ),
      )

      setDescription(
        getSystemSettingDescription(setting) ===
          'No description provided.'
          ? ''
          : getSystemSettingDescription(setting),
      )

      setIsPublic(
        isPublicSystemSetting(setting),
      )

      setIsEditable(
        isEditableSystemSetting(setting),
      )
    } else {
      setSettingKey('')
      setLabel('')
      setType('string')
      setGroup('general')
      setValueText('')
      setDescription('')
      setIsPublic(false)
      setIsEditable(true)
    }

    setFormError('')
  }, [isOpen, setting])

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setFormError('')

    if (!settingKey.trim()) {
      setFormError(
        'The setting key is required.',
      )
      return
    }

    if (!label.trim()) {
      setFormError(
        'The setting label is required.',
      )
      return
    }

    if (!group.trim()) {
      setFormError(
        'The setting group is required.',
      )
      return
    }

    try {
      const parsedValue =
        parseSystemSettingInput(
          valueText,
          type,
        )

      await onSubmit({
        setting_key: settingKey.trim(),
        label: label.trim(),
        value: parsedValue,
        type,
        group: group.trim(),
        description: description.trim(),
        is_public: isPublic,
        is_editable: isEditable,
      })
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Unable to save the setting.',
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
        aria-label="Close system setting form"
        onClick={onClose}
        disabled={isSubmitting}
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="relative z-10 my-auto w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Settings2 className="h-5 w-5" />
            </span>

            <div>
              <h2 className="font-extrabold text-slate-950">
                {setting
                  ? 'Update System Setting'
                  : 'Create System Setting'}
              </h2>

              <p className="text-xs text-slate-500">
                Configure the setting key, value and
                visibility.
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
            <Input
              label="Setting key"
              value={settingKey}
              onChange={setSettingKey}
              placeholder="Example: app_name"
              disabled={
                isSubmitting || Boolean(setting)
              }
              required
            />

            <Input
              label="Display label"
              value={label}
              onChange={setLabel}
              placeholder="Example: Application Name"
              disabled={isSubmitting}
              required
            />

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Value type
              </label>

              <select
                value={type}
                onChange={(event) =>
                  setType(event.target.value)
                }
                disabled={isSubmitting}
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400"
              >
                <option value="string">
                  Text
                </option>
                <option value="text">
                  Long Text
                </option>
                <option value="integer">
                  Integer
                </option>
                <option value="number">
                  Number
                </option>
                <option value="decimal">
                  Decimal
                </option>
                <option value="boolean">
                  Boolean
                </option>
                <option value="json">
                  JSON
                </option>
              </select>
            </div>

            <Input
              label="Group"
              value={group}
              onChange={setGroup}
              placeholder="Example: general"
              disabled={isSubmitting}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Setting value
            </label>

            {type === 'boolean' ? (
              <select
                value={valueText}
                onChange={(event) =>
                  setValueText(event.target.value)
                }
                disabled={isSubmitting}
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400"
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
                placeholder={
                  type === 'json'
                    ? '{\n  "example": true\n}'
                    : 'Enter the setting value...'
                }
                className={`w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400 ${
                  type === 'json'
                    ? 'bg-slate-950 font-mono text-slate-100'
                    : 'bg-slate-50'
                }`}
              />
            ) : (
              <input
                type={
                  ['integer', 'number', 'decimal'].includes(
                    type,
                  )
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
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400"
              />
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Description
            </label>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              rows={3}
              disabled={isSubmitting}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(event) =>
                  setIsPublic(event.target.checked)
                }
                disabled={isSubmitting}
                className="h-4 w-4 accent-indigo-600"
              />

              Public setting
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={isEditable}
                onChange={(event) =>
                  setIsEditable(
                    event.target.checked,
                  )
                }
                disabled={isSubmitting}
                className="h-4 w-4 accent-indigo-600"
              />

              Administrators can edit
            </label>
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
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  {setting
                    ? 'Update Setting'
                    : 'Create Setting'}
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
        disabled={disabled}
        required={required}
        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 disabled:opacity-60"
      />
    </div>
  )
}
