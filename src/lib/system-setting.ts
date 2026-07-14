import type {
  SystemSetting,
  SystemSettingDataType,
} from '@/types/system-setting'

export function systemSettingBoolean(
  value: unknown,
  fallback = false,
): boolean {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return fallback
  }

  if (
    value === true ||
    value === 1 ||
    value === '1'
  ) {
    return true
  }

  if (
    value === false ||
    value === 0 ||
    value === '0'
  ) {
    return false
  }

  const normalized = String(value)
    .trim()
    .toLowerCase()

  if (
    [
      'true',
      'yes',
      'enabled',
      'active',
      'on',
      'public',
    ].includes(normalized)
  ) {
    return true
  }

  if (
    [
      'false',
      'no',
      'disabled',
      'inactive',
      'off',
      'private',
    ].includes(normalized)
  ) {
    return false
  }

  return fallback
}

export function normalizeSystemSettingType(
  type?: SystemSettingDataType | null,
):
  | 'string'
  | 'text'
  | 'integer'
  | 'number'
  | 'decimal'
  | 'boolean'
  | 'json' {
  const value = String(type ?? 'string')
    .trim()
    .toLowerCase()
    .replaceAll('-', '_')
    .replaceAll(' ', '_')

  if (
    ['bool', 'boolean', 'checkbox'].includes(
      value,
    )
  ) {
    return 'boolean'
  }

  if (['int', 'integer'].includes(value)) {
    return 'integer'
  }

  if (
    ['number', 'float', 'double'].includes(
      value,
    )
  ) {
    return 'number'
  }

  if (
    ['decimal', 'money', 'currency'].includes(
      value,
    )
  ) {
    return 'decimal'
  }

  if (
    ['json', 'array', 'object'].includes(value)
  ) {
    return 'json'
  }

  if (
    ['text', 'textarea', 'long_text'].includes(
      value,
    )
  ) {
    return 'text'
  }

  return 'string'
}

export function getSystemSettingType(
  setting: SystemSetting,
) {
  return normalizeSystemSettingType(
    setting.type ??
      setting.data_type ??
      setting.value_type,
  )
}

export function systemSettingTypeLabel(
  setting: SystemSetting,
): string {
  const type = getSystemSettingType(setting)

  return {
    string: 'Text',
    text: 'Long Text',
    integer: 'Integer',
    number: 'Number',
    decimal: 'Decimal',
    boolean: 'Boolean',
    json: 'JSON',
  }[type]
}

export function getSystemSettingKey(
  setting: SystemSetting,
): string {
  return (
    setting.setting_key ??
    setting.key ??
    setting.name ??
    `setting_${setting.id}`
  )
}

export function getSystemSettingLabel(
  setting: SystemSetting,
): string {
  return (
    setting.label ??
    setting.display_name ??
    getSystemSettingKey(setting)
      .replaceAll('_', ' ')
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase(),
      )
  )
}

export function getSystemSettingValue(
  setting: SystemSetting,
): unknown {
  return setting.value !== undefined
    ? setting.value
    : setting.setting_value
}

export function getSystemSettingGroup(
  setting: SystemSetting,
): string {
  return (
    setting.group ??
    setting.category ??
    setting.section ??
    'general'
  )
}

export function getSystemSettingDescription(
  setting: SystemSetting,
): string {
  return (
    setting.description ??
    setting.notes ??
    'No description provided.'
  )
}

export function isPublicSystemSetting(
  setting: SystemSetting,
): boolean {
  return systemSettingBoolean(
    setting.is_public ?? setting.public,
  )
}

export function isEditableSystemSetting(
  setting: SystemSetting,
): boolean {
  return systemSettingBoolean(
    setting.is_editable ?? setting.editable,
    true,
  )
}

export function systemSettingValueToInput(
  value: unknown,
  type?: SystemSettingDataType | null,
): string {
  const normalizedType =
    normalizeSystemSettingType(type)

  if (
    value === undefined ||
    value === null
  ) {
    return ''
  }

  if (normalizedType === 'boolean') {
    return systemSettingBoolean(value)
      ? 'true'
      : 'false'
  }

  if (
    normalizedType === 'json' ||
    typeof value === 'object'
  ) {
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return String(value)
    }
  }

  return String(value)
}

export function parseSystemSettingInput(
  value: string,
  type?: SystemSettingDataType | null,
): unknown {
  const normalizedType =
    normalizeSystemSettingType(type)

  if (normalizedType === 'boolean') {
    return systemSettingBoolean(value)
  }

  if (normalizedType === 'integer') {
    const number = Number.parseInt(value, 10)

    if (!Number.isFinite(number)) {
      throw new Error(
        'The setting value must be a valid integer.',
      )
    }

    return number
  }

  if (
    normalizedType === 'number' ||
    normalizedType === 'decimal'
  ) {
    const number = Number(value)

    if (!Number.isFinite(number)) {
      throw new Error(
        'The setting value must be a valid number.',
      )
    }

    return number
  }

  if (normalizedType === 'json') {
    try {
      return JSON.parse(value)
    } catch {
      throw new Error(
        'The setting value must contain valid JSON.',
      )
    }
  }

  return value
}

export function formatSystemSettingValue(
  setting: SystemSetting,
): string {
  const value = getSystemSettingValue(setting)
  const type = getSystemSettingType(setting)

  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return 'Not configured'
  }

  if (type === 'boolean') {
    return systemSettingBoolean(value)
      ? 'Enabled'
      : 'Disabled'
  }

  if (
    type === 'json' ||
    typeof value === 'object'
  ) {
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return String(value)
    }
  }

  return String(value)
}

export function formatSystemSettingDate(
  value?: string | null,
): string {
  if (!value) {
    return 'Not available'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}
