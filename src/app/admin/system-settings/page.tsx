'use client'

import {
  AlertTriangle,
  DatabaseZap,
  Eye,
  EyeOff,
  Layers3,
  LoaderCircle,
  LockKeyhole,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  SlidersHorizontal,
  ToggleLeft,
  Trash2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import SystemSettingBulkModal from '@/components/admin/system-settings/SystemSettingBulkModal'
import SystemSettingDetailsModal from '@/components/admin/system-settings/SystemSettingDetailsModal'
import SystemSettingFormModal from '@/components/admin/system-settings/SystemSettingFormModal'
import SystemSettingTable from '@/components/admin/system-settings/SystemSettingTable'
import SystemSettingValueModal from '@/components/admin/system-settings/SystemSettingValueModal'
import {
  bulkUpdateSystemSettings,
  createSystemSetting,
  deleteSystemSetting,
  getSystemSetting,
  getSystemSettingByKey,
  getSystemSettings,
  getSystemSettingSummary,
  restoreSystemSetting,
  seedDefaultSystemSettings,
  updateSystemSetting,
  updateSystemSettingByKey,
} from '@/services/system-setting-admin.service'
import {
  getSystemSettingGroup,
  getSystemSettingKey,
} from '@/lib/system-setting'
import type {
  SystemSetting,
  SystemSettingBulkPayload,
  SystemSettingPayload,
  SystemSettingSummary,
  SystemSettingValuePayload,
} from '@/types/system-setting'

const emptySummary: SystemSettingSummary = {
  total_settings: 0,
  public_settings: 0,
  private_settings: 0,
  editable_settings: 0,
  protected_settings: 0,
  groups_count: 0,
  boolean_settings: 0,
  deleted_settings: 0,
}

export default function SystemSettingsPage() {
  const [settings, setSettings] =
    useState<SystemSetting[]>([])

  const [summary, setSummary] =
    useState<SystemSettingSummary>(
      emptySummary,
    )

  const [searchInput, setSearchInput] =
    useState('')

  const [search, setSearch] = useState('')
  const [group, setGroup] = useState('')
  const [type, setType] = useState('')
  const [visibility, setVisibility] =
    useState('')

  const [
    includeDeleted,
    setIncludeDeleted,
  ] = useState(false)

  const [isLoading, setIsLoading] =
    useState(true)

  const [isRefreshing, setIsRefreshing] =
    useState(false)

  const [isSubmitting, setIsSubmitting] =
    useState(false)

  const [processingId, setProcessingId] =
    useState<number | string | null>(null)

  const [formOpen, setFormOpen] =
    useState(false)

  const [editingSetting, setEditingSetting] =
    useState<SystemSetting | null>(null)

  const [valueOpen, setValueOpen] =
    useState(false)

  const [valueSetting, setValueSetting] =
    useState<SystemSetting | null>(null)

  const [bulkOpen, setBulkOpen] =
    useState(false)

  const [detailsOpen, setDetailsOpen] =
    useState(false)

  const [detailsSetting, setDetailsSetting] =
    useState<SystemSetting | null>(null)

  const [detailsLoading, setDetailsLoading] =
    useState(false)

  const [detailsError, setDetailsError] =
    useState('')

  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] =
    useState('')

  const groups = useMemo(
    () =>
      Array.from(
        new Set(
          settings.map(getSystemSettingGroup),
        ),
      ).sort(),
    [settings],
  )

  const loadSettings = useCallback(
    async (refresh = false) => {
      setErrorMessage('')

      if (refresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      try {
        const filters = {
          search,
          group,
          type,
          visibility,
          includeDeleted,
          perPage: 200,
        }

        const [list, summaryResult] =
          await Promise.all([
            getSystemSettings(filters),
            getSystemSettingSummary(filters),
          ])

        setSettings(list.settings)
        setSummary(summaryResult)
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to load system settings.',
        )
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [
      search,
      group,
      type,
      visibility,
      includeDeleted,
    ],
  )

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim())
    }, 400)

    return () =>
      window.clearTimeout(timer)
  }, [searchInput])

  function openCreateForm() {
    setEditingSetting(null)
    setFormOpen(true)
  }

  function openEditForm(
    setting: SystemSetting,
  ) {
    setEditingSetting(setting)
    setFormOpen(true)
  }

  async function handleFormSubmit(
    payload: SystemSettingPayload,
  ) {
    setIsSubmitting(true)
    setMessage('')
    setErrorMessage('')

    try {
      const responseMessage = editingSetting
        ? await updateSystemSetting(
            editingSetting.id,
            payload,
          )
        : await createSystemSetting(payload)

      setMessage(responseMessage)
      setFormOpen(false)
      setEditingSetting(null)

      await loadSettings(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to save the setting.',
      )

      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleQuickEdit(
    setting: SystemSetting,
  ) {
    setProcessingId(setting.id)
    setErrorMessage('')

    try {
      const latest =
        await getSystemSettingByKey(
          getSystemSettingKey(setting),
        )

      setValueSetting(latest)
      setValueOpen(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to load the setting.',
      )
    } finally {
      setProcessingId(null)
    }
  }

  async function handleValueSubmit(
    payload: SystemSettingValuePayload,
  ) {
    if (!valueSetting) {
      return
    }

    setIsSubmitting(true)
    setMessage('')
    setErrorMessage('')

    try {
      setMessage(
        await updateSystemSettingByKey(
          getSystemSettingKey(valueSetting),
          payload,
        ),
      )

      setValueOpen(false)
      setValueSetting(null)

      await loadSettings(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to update the setting value.',
      )

      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleBulkUpdate(
    payload: SystemSettingBulkPayload,
  ) {
    setIsSubmitting(true)
    setMessage('')
    setErrorMessage('')

    try {
      setMessage(
        await bulkUpdateSystemSettings(
          payload,
        ),
      )

      setBulkOpen(false)
      await loadSettings(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to update settings.',
      )

      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSeedDefaults() {
    const confirmed = window.confirm(
      'Seed the default system settings?\n\nExisting settings should not be duplicated.',
    )

    if (!confirmed) {
      return
    }

    setIsSubmitting(true)
    setMessage('')
    setErrorMessage('')

    try {
      setMessage(
        await seedDefaultSystemSettings(),
      )

      await loadSettings(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to seed default settings.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleView(
    setting: SystemSetting,
  ) {
    setDetailsOpen(true)
    setDetailsLoading(true)
    setDetailsSetting(null)
    setDetailsError('')

    try {
      setDetailsSetting(
        await getSystemSetting(setting.id),
      )
    } catch (error) {
      setDetailsError(
        error instanceof Error
          ? error.message
          : 'Unable to load setting details.',
      )
    } finally {
      setDetailsLoading(false)
    }
  }

  async function handleDelete(
    setting: SystemSetting,
  ) {
    const confirmed = window.confirm(
      `Delete setting "${getSystemSettingKey(setting)}"?`,
    )

    if (!confirmed) {
      return
    }

    setProcessingId(setting.id)
    setMessage('')
    setErrorMessage('')

    try {
      setMessage(
        await deleteSystemSetting(setting.id),
      )

      await loadSettings(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to delete the setting.',
      )
    } finally {
      setProcessingId(null)
    }
  }

  async function handleRestore(
    setting: SystemSetting,
  ) {
    setProcessingId(setting.id)
    setMessage('')
    setErrorMessage('')

    try {
      setMessage(
        await restoreSystemSetting(setting.id),
      )

      await loadSettings(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to restore the setting.',
      )
    } finally {
      setProcessingId(null)
    }
  }

  function clearFilters() {
    setSearchInput('')
    setSearch('')
    setGroup('')
    setType('')
    setVisibility('')
    setIncludeDeleted(false)
  }

  return (
    <>
      <div className="space-y-6">
        <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-600">
              System Administration
            </p>

            <h1 className="mt-2 text-2xl font-extrabold text-slate-950 sm:text-3xl">
              System Settings
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage application configuration,
              public values and operational options.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                void loadSettings(true)
              }
              disabled={isRefreshing}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 disabled:opacity-50"
            >
              {isRefreshing ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </button>

            <button
              type="button"
              onClick={() =>
                void handleSeedDefaults()
              }
              disabled={isSubmitting}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 text-sm font-bold text-amber-700 disabled:opacity-50"
            >
              <DatabaseZap className="h-4 w-4" />
              Seed Defaults
            </button>

            <button
              type="button"
              onClick={() => setBulkOpen(true)}
              disabled={
                isSubmitting ||
                settings.length === 0
              }
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 text-sm font-bold text-violet-700 disabled:opacity-50"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Bulk Update
            </button>

            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white"
            >
              <Plus className="h-4 w-4" />
              Create Setting
            </button>
          </div>
        </section>

        {message && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            {message}
          </div>
        )}

        {errorMessage && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-8">
          <SummaryCard
            title="Total"
            value={summary.total_settings}
            icon={Settings2}
          />

          <SummaryCard
            title="Public"
            value={summary.public_settings}
            icon={Eye}
          />

          <SummaryCard
            title="Private"
            value={summary.private_settings}
            icon={EyeOff}
          />

          <SummaryCard
            title="Editable"
            value={summary.editable_settings}
            icon={SlidersHorizontal}
          />

          <SummaryCard
            title="Protected"
            value={summary.protected_settings}
            icon={LockKeyhole}
          />

          <SummaryCard
            title="Groups"
            value={summary.groups_count}
            icon={Layers3}
          />

          <SummaryCard
            title="Booleans"
            value={summary.boolean_settings}
            icon={ToggleLeft}
          />

          <SummaryCard
            title="Deleted"
            value={summary.deleted_settings}
            icon={Trash2}
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="space-y-3 border-b border-slate-200 p-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_180px_180px_180px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  value={searchInput}
                  onChange={(event) =>
                    setSearchInput(
                      event.target.value,
                    )
                  }
                  placeholder="Search key, label, value or description..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-indigo-400"
                />
              </div>

              <select
                value={group}
                onChange={(event) =>
                  setGroup(event.target.value)
                }
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm"
              >
                <option value="">
                  All groups
                </option>

                {groups.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ))}
              </select>

              <select
                value={type}
                onChange={(event) =>
                  setType(event.target.value)
                }
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm"
              >
                <option value="">
                  All types
                </option>
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

              <select
                value={visibility}
                onChange={(event) =>
                  setVisibility(
                    event.target.value,
                  )
                }
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm"
              >
                <option value="">
                  All visibility
                </option>
                <option value="public">
                  Public
                </option>
                <option value="private">
                  Private
                </option>
              </select>
            </div>

            <div className="flex flex-wrap gap-3">
              <label className="flex h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-600">
                <input
                  type="checkbox"
                  checked={includeDeleted}
                  onChange={(event) =>
                    setIncludeDeleted(
                      event.target.checked,
                    )
                  }
                  className="accent-indigo-600"
                />
                Include deleted
              </label>

              <button
                type="button"
                onClick={clearFilters}
                className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex min-h-96 items-center justify-center">
              <LoaderCircle className="h-9 w-9 animate-spin text-indigo-600" />
            </div>
          ) : settings.length === 0 ? (
            <div className="flex min-h-96 items-center justify-center px-6 text-center">
              <div>
                <Settings2 className="mx-auto h-14 w-14 text-indigo-200" />

                <h2 className="mt-4 text-lg font-extrabold text-slate-900">
                  No system settings found
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Seed the default configuration or
                  create the first system setting.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    void handleSeedDefaults()
                  }
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white"
                >
                  <DatabaseZap className="h-4 w-4" />
                  Seed Default Settings
                </button>
              </div>
            </div>
          ) : (
            <SystemSettingTable
              settings={settings}
              processingId={processingId}
              onView={(setting) =>
                void handleView(setting)
              }
              onEdit={openEditForm}
              onQuickEdit={(setting) =>
                void handleQuickEdit(setting)
              }
              onDelete={(setting) =>
                void handleDelete(setting)
              }
              onRestore={(setting) =>
                void handleRestore(setting)
              }
            />
          )}
        </section>
      </div>

      <SystemSettingFormModal
        isOpen={formOpen}
        setting={editingSetting}
        isSubmitting={isSubmitting}
        onClose={() => {
          if (!isSubmitting) {
            setFormOpen(false)
            setEditingSetting(null)
          }
        }}
        onSubmit={handleFormSubmit}
      />

      <SystemSettingValueModal
        isOpen={valueOpen}
        setting={valueSetting}
        isSubmitting={isSubmitting}
        onClose={() => {
          if (!isSubmitting) {
            setValueOpen(false)
            setValueSetting(null)
          }
        }}
        onSubmit={handleValueSubmit}
      />

      <SystemSettingBulkModal
        isOpen={bulkOpen}
        settings={settings}
        isSubmitting={isSubmitting}
        onClose={() => {
          if (!isSubmitting) {
            setBulkOpen(false)
          }
        }}
        onSubmit={handleBulkUpdate}
      />

      <SystemSettingDetailsModal
        isOpen={detailsOpen}
        setting={detailsSetting}
        isLoading={detailsLoading}
        errorMessage={detailsError}
        onClose={() => {
          setDetailsOpen(false)
          setDetailsSetting(null)
          setDetailsError('')
        }}
      />
    </>
  )
}

function SummaryCard({
  title,
  value,
  icon: Icon,
}: {
  title: string
  value: number
  icon: LucideIcon
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
        <Icon className="h-5 w-5" />
      </span>

      <p className="mt-3 text-xs font-semibold text-slate-500">
        {title}
      </p>

      <p className="mt-1 text-2xl font-extrabold text-slate-950">
        {value}
      </p>
    </article>
  )
}
