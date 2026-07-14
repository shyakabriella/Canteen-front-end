'use client'

import {
  Eye,
  KeyRound,
  Pencil,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import {
  formatSystemSettingDate,
  formatSystemSettingValue,
  getSystemSettingGroup,
  getSystemSettingKey,
  getSystemSettingLabel,
  isEditableSystemSetting,
  isPublicSystemSetting,
  systemSettingTypeLabel,
} from '@/lib/system-setting'
import type { SystemSetting } from '@/types/system-setting'

interface Props {
  settings: SystemSetting[]
  processingId: number | string | null
  onView: (setting: SystemSetting) => void
  onEdit: (setting: SystemSetting) => void
  onQuickEdit: (setting: SystemSetting) => void
  onDelete: (setting: SystemSetting) => void
  onRestore: (setting: SystemSetting) => void
}

export default function SystemSettingTable({
  settings,
  processingId,
  onView,
  onEdit,
  onQuickEdit,
  onDelete,
  onRestore,
}: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1200px] text-left">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.14em] text-slate-400">
          <tr>
            <th className="px-6 py-4">
              Setting
            </th>
            <th className="px-4 py-4">
              Value
            </th>
            <th className="px-4 py-4">
              Group
            </th>
            <th className="px-4 py-4">
              Type
            </th>
            <th className="px-4 py-4">
              Visibility
            </th>
            <th className="px-4 py-4">
              Updated
            </th>
            <th className="px-6 py-4 text-right">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {settings.map((setting) => {
            const deleted = Boolean(
              setting.deleted_at,
            )

            const processing =
              String(processingId) ===
              String(setting.id)

            return (
              <tr
                key={setting.id}
                className={`text-sm hover:bg-slate-50 ${
                  deleted
                    ? 'bg-red-50/30'
                    : ''
                }`}
              >
                <td className="px-6 py-4">
                  <p className="font-extrabold text-slate-900">
                    {getSystemSettingLabel(
                      setting,
                    )}
                  </p>

                  <p className="mt-1 font-mono text-xs text-slate-400">
                    {getSystemSettingKey(setting)}
                  </p>
                </td>

                <td className="px-4 py-4">
                  <p className="max-w-[280px] truncate font-semibold text-slate-700">
                    {formatSystemSettingValue(
                      setting,
                    )}
                  </p>
                </td>

                <td className="px-4 py-4">
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                    {getSystemSettingGroup(setting)}
                  </span>
                </td>

                <td className="px-4 py-4 text-xs font-bold text-slate-600">
                  {systemSettingTypeLabel(setting)}
                </td>

                <td className="px-4 py-4">
                  <div className="flex flex-col items-start gap-1">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        deleted
                          ? 'bg-red-50 text-red-700'
                          : isPublicSystemSetting(
                                setting,
                              )
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {deleted
                        ? 'Deleted'
                        : isPublicSystemSetting(
                              setting,
                            )
                          ? 'Public'
                          : 'Private'}
                    </span>

                    {!isEditableSystemSetting(
                      setting,
                    ) && (
                      <span className="text-[10px] font-bold uppercase text-amber-600">
                        Protected
                      </span>
                    )}
                  </div>
                </td>

                <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-500">
                  {formatSystemSettingDate(
                    setting.updated_at,
                  )}
                </td>

                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      title="View setting"
                      onClick={() =>
                        onView(setting)
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {!deleted &&
                      isEditableSystemSetting(
                        setting,
                      ) && (
                        <>
                          <button
                            type="button"
                            title="Quick value update"
                            onClick={() =>
                              onQuickEdit(setting)
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-600"
                          >
                            <KeyRound className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            title="Edit full setting"
                            onClick={() =>
                              onEdit(setting)
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-200 text-indigo-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        </>
                      )}

                    {!deleted && (
                      <button
                        type="button"
                        title="Delete setting"
                        onClick={() =>
                          onDelete(setting)
                        }
                        disabled={processing}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 text-red-600 disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}

                    {deleted && (
                      <button
                        type="button"
                        onClick={() =>
                          onRestore(setting)
                        }
                        disabled={processing}
                        className="flex h-9 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 disabled:opacity-40"
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
