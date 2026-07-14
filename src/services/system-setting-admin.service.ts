import { apiRequest } from '@/lib/api'
import {
  getSystemSettingGroup,
  getSystemSettingType,
  isEditableSystemSetting,
  isPublicSystemSetting,
} from '@/lib/system-setting'
import type {
  SystemSetting,
  SystemSettingBulkPayload,
  SystemSettingListParams,
  SystemSettingListResult,
  SystemSettingPayload,
  SystemSettingSummary,
  SystemSettingValuePayload,
} from '@/types/system-setting'

type UnknownRecord = Record<string, unknown>

function asRecord(
  value: unknown,
): UnknownRecord | null {
  if (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  ) {
    return value as UnknownRecord
  }

  return null
}

function optionalNumber(
  value: unknown,
): number | undefined {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return undefined
  }

  const number = Number(value)

  return Number.isFinite(number)
    ? number
    : undefined
}

function firstNumber(
  ...values: unknown[]
): number {
  for (const value of values) {
    const number = optionalNumber(value)

    if (number !== undefined) {
      return number
    }
  }

  return 0
}

function looksLikeSystemSetting(
  value: unknown,
): value is SystemSetting {
  const record = asRecord(value)

  if (!record) {
    return false
  }

  return (
    'id' in record ||
    'setting_key' in record ||
    'key' in record ||
    (
      'value' in record &&
      (
        'type' in record ||
        'group' in record
      )
    )
  )
}

function extractSystemSetting(
  payload: unknown,
): SystemSetting | undefined {
  if (looksLikeSystemSetting(payload)) {
    return payload
  }

  const root = asRecord(payload)
  const data = root?.data
  const dataRecord = asRecord(data)

  const values = [
    root?.system_setting,
    root?.systemSetting,
    root?.setting,
    data,
    dataRecord?.system_setting,
    dataRecord?.systemSetting,
    dataRecord?.setting,
  ]

  return values.find(looksLikeSystemSetting)
}

function extractSystemSettingArray(
  payload: unknown,
): SystemSetting[] {
  if (Array.isArray(payload)) {
    return payload.filter(
      looksLikeSystemSetting,
    )
  }

  const root = asRecord(payload)

  if (!root) {
    return []
  }

  const data = asRecord(root.data)

  const arrays = [
    root.system_settings,
    root.systemSettings,
    root.settings,
    root.items,
    root.data,

    data?.system_settings,
    data?.systemSettings,
    data?.settings,
    data?.items,
    data?.data,
  ]

  for (const array of arrays) {
    if (Array.isArray(array)) {
      return array.filter(
        looksLikeSystemSetting,
      )
    }
  }

  return []
}

function extractMessage(
  payload: unknown,
  fallback: string,
): string {
  const root = asRecord(payload)

  return typeof root?.message === 'string'
    ? root.message
    : fallback
}

function buildQuery(
  params: SystemSettingListParams,
): string {
  const query = new URLSearchParams()

  if (params.search?.trim()) {
    query.set('search', params.search.trim())
  }

  if (params.group) {
    query.set('group', params.group)
  }

  if (params.type) {
    query.set('type', params.type)
  }

  if (params.visibility === 'public') {
    query.set('is_public', '1')
  }

  if (params.visibility === 'private') {
    query.set('is_public', '0')
  }

  if (params.includeDeleted) {
    query.set('with_trashed', '1')
  }

  if (params.page) {
    query.set('page', String(params.page))
  }

  query.set(
    'per_page',
    String(params.perPage ?? 200),
  )

  return query.toString()
}

export async function getSystemSettings(
  params: SystemSettingListParams = {},
): Promise<SystemSettingListResult> {
  const query = buildQuery(params)

  const response = await apiRequest<unknown>(
    `/system-settings${query ? `?${query}` : ''}`,
    {
      method: 'GET',
      auth: true,
      cache: 'no-store',
    },
  )

  const root = asRecord(response)
  const data = asRecord(root?.data)

  return {
    settings:
      extractSystemSettingArray(response),

    current_page:
      optionalNumber(root?.current_page) ??
      optionalNumber(data?.current_page),

    last_page:
      optionalNumber(root?.last_page) ??
      optionalNumber(data?.last_page),

    per_page:
      optionalNumber(root?.per_page) ??
      optionalNumber(data?.per_page),

    total:
      optionalNumber(root?.total) ??
      optionalNumber(data?.total),
  }
}

export async function getSystemSettingSummary(
  params: SystemSettingListParams = {},
): Promise<SystemSettingSummary> {
  const query = buildQuery(params)

  const response = await apiRequest<unknown>(
    `/system-settings/summary${query ? `?${query}` : ''}`,
    {
      method: 'GET',
      auth: true,
      cache: 'no-store',
    },
  )

  const root = asRecord(response)
  const data = asRecord(root?.data)

  const summary =
    asRecord(root?.summary) ??
    asRecord(data?.summary) ??
    data ??
    root ??
    {}

  const settings =
    extractSystemSettingArray(response)

  const publicSettings = settings.filter(
    isPublicSystemSetting,
  )

  const privateSettings = settings.filter(
    (setting) =>
      !isPublicSystemSetting(setting),
  )

  const editableSettings = settings.filter(
    isEditableSystemSetting,
  )

  const protectedSettings = settings.filter(
    (setting) =>
      !isEditableSystemSetting(setting),
  )

  const booleanSettings = settings.filter(
    (setting) =>
      getSystemSettingType(setting) ===
      'boolean',
  )

  const deletedSettings = settings.filter(
    (setting) => Boolean(setting.deleted_at),
  )

  const groups = new Set(
    settings.map(getSystemSettingGroup),
  )

  return {
    total_settings: firstNumber(
      summary.total_settings,
      summary.settings_count,
      summary.total,
      settings.length,
    ),

    public_settings: firstNumber(
      summary.public_settings,
      summary.public_count,
      publicSettings.length,
    ),

    private_settings: firstNumber(
      summary.private_settings,
      summary.private_count,
      privateSettings.length,
    ),

    editable_settings: firstNumber(
      summary.editable_settings,
      summary.editable_count,
      editableSettings.length,
    ),

    protected_settings: firstNumber(
      summary.protected_settings,
      summary.protected_count,
      protectedSettings.length,
    ),

    groups_count: firstNumber(
      summary.groups_count,
      summary.total_groups,
      groups.size,
    ),

    boolean_settings: firstNumber(
      summary.boolean_settings,
      summary.boolean_count,
      booleanSettings.length,
    ),

    deleted_settings: firstNumber(
      summary.deleted_settings,
      summary.deleted_count,
      deletedSettings.length,
    ),
  }
}

export async function seedDefaultSystemSettings():
Promise<string> {
  const response = await apiRequest<unknown>(
    '/system-settings/seed-defaults',
    {
      method: 'POST',
      auth: true,
      body: {},
    },
  )

  return extractMessage(
    response,
    'Default system settings seeded successfully.',
  )
}

export async function bulkUpdateSystemSettings(
  payload: SystemSettingBulkPayload,
): Promise<string> {
  const response = await apiRequest<unknown>(
    '/system-settings/bulk-update',
    {
      method: 'POST',
      auth: true,
      body: payload,
    },
  )

  return extractMessage(
    response,
    'System settings updated successfully.',
  )
}

export async function getSystemSettingByKey(
  settingKey: string,
): Promise<SystemSetting> {
  const response = await apiRequest<unknown>(
    `/system-settings/key/${encodeURIComponent(settingKey)}`,
    {
      method: 'GET',
      auth: true,
      cache: 'no-store',
    },
  )

  const setting = extractSystemSetting(response)

  if (!setting) {
    throw new Error(
      'The backend did not return the requested setting.',
    )
  }

  return setting
}

export async function updateSystemSettingByKey(
  settingKey: string,
  payload: SystemSettingValuePayload,
): Promise<string> {
  const response = await apiRequest<unknown>(
    `/system-settings/key/${encodeURIComponent(settingKey)}`,
    {
      method: 'PATCH',
      auth: true,
      body: payload,
    },
  )

  return extractMessage(
    response,
    'System setting updated successfully.',
  )
}

export async function getSystemSetting(
  id: number | string,
): Promise<SystemSetting> {
  const response = await apiRequest<unknown>(
    `/system-settings/${id}`,
    {
      method: 'GET',
      auth: true,
      cache: 'no-store',
    },
  )

  const setting = extractSystemSetting(response)

  if (!setting) {
    throw new Error(
      'The backend did not return the requested setting.',
    )
  }

  return setting
}

export async function createSystemSetting(
  payload: SystemSettingPayload,
): Promise<string> {
  const response = await apiRequest<unknown>(
    '/system-settings',
    {
      method: 'POST',
      auth: true,
      body: payload,
    },
  )

  return extractMessage(
    response,
    'System setting created successfully.',
  )
}

export async function updateSystemSetting(
  id: number | string,
  payload: SystemSettingPayload,
): Promise<string> {
  const response = await apiRequest<unknown>(
    `/system-settings/${id}`,
    {
      method: 'PATCH',
      auth: true,
      body: payload,
    },
  )

  return extractMessage(
    response,
    'System setting updated successfully.',
  )
}

export async function deleteSystemSetting(
  id: number | string,
): Promise<string> {
  const response = await apiRequest<unknown>(
    `/system-settings/${id}`,
    {
      method: 'DELETE',
      auth: true,
    },
  )

  return extractMessage(
    response,
    'System setting deleted successfully.',
  )
}

export async function restoreSystemSetting(
  id: number | string,
): Promise<string> {
  const response = await apiRequest<unknown>(
    `/system-settings/${id}/restore`,
    {
      method: 'POST',
      auth: true,
    },
  )

  return extractMessage(
    response,
    'System setting restored successfully.',
  )
}
