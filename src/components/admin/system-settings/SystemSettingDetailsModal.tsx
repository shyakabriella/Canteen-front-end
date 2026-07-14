'use client'

import {
  CalendarDays,
  Eye,
  EyeOff,
  Hash,
  KeyRound,
  Layers3,
  LoaderCircle,
  LockKeyhole,
  Pencil,
  Settings2,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  formatSystemSettingDate,
  formatSystemSettingValue,
  getSystemSettingDescription,
  getSystemSettingGroup,
  getSystemSettingKey,
  getSystemSettingLabel,
  isEditableSystemSetting,
  isPublicSystemSetting,
  systemSettingTypeLabel,
} from '@/lib/system-setting'
import type { SystemSetting } from '@/types/system-setting'

interface Props {
  isOpen: boolean
  setting: SystemSetting | null
  isLoading: boolean
  errorMessage: string
  onClose: () => void
}

export default function SystemSettingDetailsModal({
  isOpen,
  setting,
  isLoading,
  errorMessage,
  onClose,
}: Props) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4">
      <button
        type="button"
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="relative z-10 my-auto w-full max-w-4xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="font-extrabold text-slate-950">
              System Setting Details
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Setting value, type, visibility and
              administrative information.
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
              <LoaderCircle className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          )}

          {!isLoading && errorMessage && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {!isLoading && setting && (
            <div className="space-y-5">
              <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-white">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                  {getSystemSettingKey(setting)}
                </p>

                <h3 className="mt-2 text-3xl font-extrabold">
                  {getSystemSettingLabel(setting)}
                </h3>

                <p className="mt-3 text-sm leading-6 text-white/80">
                  {getSystemSettingDescription(
                    setting,
                  )}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">
                    {systemSettingTypeLabel(setting)}
                  </span>

                  <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">
                    {getSystemSettingGroup(setting)}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Detail
                  icon={Hash}
                  label="Setting ID"
                  value={String(setting.id)}
                />

                <Detail
                  icon={KeyRound}
                  label="Setting Key"
                  value={getSystemSettingKey(
                    setting,
                  )}
                />

                <Detail
                  icon={Layers3}
                  label="Group"
                  value={getSystemSettingGroup(
                    setting,
                  )}
                />

                <Detail
                  icon={
                    isPublicSystemSetting(setting)
                      ? Eye
                      : EyeOff
                  }
                  label="Visibility"
                  value={
                    isPublicSystemSetting(setting)
                      ? 'Public'
                      : 'Private'
                  }
                />

                <Detail
                  icon={
                    isEditableSystemSetting(setting)
                      ? Pencil
                      : LockKeyhole
                  }
                  label="Edit Permission"
                  value={
                    isEditableSystemSetting(setting)
                      ? 'Editable'
                      : 'Protected'
                  }
                />

                <Detail
                  icon={CalendarDays}
                  label="Updated At"
                  value={formatSystemSettingDate(
                    setting.updated_at,
                  )}
                />
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2 border-b border-slate-700 bg-slate-800 px-5 py-4 text-white">
                  <Settings2 className="h-4 w-4" />
                  <p className="text-sm font-bold">
                    Current Value
                  </p>
                </div>

                <pre className="max-h-96 overflow-auto whitespace-pre-wrap bg-slate-950 p-5 text-sm leading-6 text-slate-100">
                  {formatSystemSettingValue(
                    setting,
                  )}
                </pre>
              </div>

              {setting.deleted_at && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                  Deleted on{' '}
                  {formatSystemSettingDate(
                    setting.deleted_at,
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

function Detail({
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
