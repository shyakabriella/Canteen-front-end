import { apiRequest } from '@/lib/api'
import type {
  PublicSettingItem,
  PublicSystemSettings,
} from '@/types/public-system-settings'

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

function firstDefined(
  ...values: unknown[]
): unknown {
  return values.find(
    (value) =>
      value !== undefined &&
      value !== null &&
      value !== '',
  )
}

function stringValue(
  ...values: unknown[]
): string {
  const value = firstDefined(...values)

  if (
    value === undefined ||
    value === null
  ) {
    return ''
  }

  return String(value).trim()
}

function nullableString(
  ...values: unknown[]
): string | null {
  const value = stringValue(...values)

  return value || null
}

function numberValue(
  ...values: unknown[]
): number {
  for (const value of values) {
    if (
      value === undefined ||
      value === null ||
      value === ''
    ) {
      continue
    }

    const number = Number(value)

    if (Number.isFinite(number)) {
      return number
    }
  }

  return 0
}

function booleanValue(
  ...values: unknown[]
): boolean {
  const value = firstDefined(...values)

  if (
    value === true ||
    value === 1 ||
    value === '1'
  ) {
    return true
  }

  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()

  return [
    'true',
    'yes',
    'enabled',
    'active',
    'on',
  ].includes(normalized)
}

function parseSettingValue(
  value: unknown,
  type?: string | null,
): unknown {
  const normalizedType = String(type ?? '')
    .trim()
    .toLowerCase()

  if (
    [
      'boolean',
      'bool',
      'checkbox',
    ].includes(normalizedType)
  ) {
    return booleanValue(value)
  }

  if (
    [
      'integer',
      'int',
      'number',
      'float',
      'decimal',
    ].includes(normalizedType)
  ) {
    return numberValue(value)
  }

  if (
    [
      'json',
      'array',
      'object',
    ].includes(normalizedType) &&
    typeof value === 'string'
  ) {
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }

  return value
}

function settingArrayToRecord(
  settings: PublicSettingItem[],
): UnknownRecord {
  return settings.reduce<UnknownRecord>(
    (result, setting) => {
      const key = stringValue(
        setting.key,
        setting.setting_key,
        setting.name,
      )

      if (!key) {
        return result
      }

      result[key] = parseSettingValue(
        firstDefined(
          setting.value,
          setting.setting_value,
        ),
        setting.type ?? setting.data_type,
      )

      return result
    },
    {},
  )
}

function extractSettingsRecord(
  response: unknown,
): UnknownRecord {
  if (Array.isArray(response)) {
    return settingArrayToRecord(
      response as PublicSettingItem[],
    )
  }

  const root = asRecord(response) ?? {}
  const data = root.data
  const dataRecord = asRecord(data)

  const candidates = [
    root.settings,
    root.public_settings,
    root.system_settings,

    dataRecord?.settings,
    dataRecord?.public_settings,
    dataRecord?.system_settings,

    data,
  ]

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return settingArrayToRecord(
        candidate as PublicSettingItem[],
      )
    }

    const record = asRecord(candidate)

    if (record) {
      return record
    }
  }

  return root
}

function normalizeAssetUrl(
  value: unknown,
): string | null {
  const path = nullableString(value)

  if (!path) {
    return null
  }

  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:')
  ) {
    return path
  }

  const storageBase =
    process.env.NEXT_PUBLIC_STORAGE_URL
      ?.replace(/\/+$/, '')

  if (storageBase) {
    return `${storageBase}/${path.replace(/^\/+/, '')}`
  }

  return path.startsWith('/')
    ? path
    : `/${path}`
}

export async function getPublicSystemSettings():
Promise<PublicSystemSettings> {
  const response = await apiRequest<unknown>(
    '/system-settings/public',
    {
      method: 'GET',
    },
  )

  const settings =
    extractSettingsRecord(response)

  return {
    app_name:
      stringValue(
        settings.app_name,
        settings.application_name,
        settings.system_name,
        settings.site_name,
      ) || 'Smart Canteen',

    app_short_name:
      stringValue(
        settings.app_short_name,
        settings.short_name,
        settings.application_short_name,
      ) || 'Smart Canteen',

    app_description:
      stringValue(
        settings.app_description,
        settings.description,
        settings.site_description,
      ) ||
      'Smart digital canteen ordering and inventory management system.',

    logo_url: normalizeAssetUrl(
      firstDefined(
        settings.logo_url,
        settings.logo,
        settings.app_logo,
        settings.system_logo,
      ),
    ),

    favicon_url: normalizeAssetUrl(
      firstDefined(
        settings.favicon_url,
        settings.favicon,
        settings.app_favicon,
      ),
    ),

    currency:
      stringValue(
        settings.currency,
        settings.currency_code,
        settings.default_currency,
      ) || 'RWF',

    currency_symbol:
      stringValue(
        settings.currency_symbol,
        settings.money_symbol,
      ) || 'RWF',

    timezone:
      stringValue(
        settings.timezone,
        settings.app_timezone,
      ) || 'Africa/Kigali',

    locale:
      stringValue(
        settings.locale,
        settings.default_language,
        settings.language,
      ) || 'en',

    support_email: nullableString(
      settings.support_email,
      settings.contact_email,
      settings.email,
    ),

    support_phone: nullableString(
      settings.support_phone,
      settings.contact_phone,
      settings.phone,
    ),

    address: nullableString(
      settings.address,
      settings.location,
      settings.canteen_address,
    ),

    allow_registration: booleanValue(
      firstDefined(
        settings.allow_registration,
        settings.registration_enabled,
        settings.enable_registration,
      ) ?? true,
    ),

    maintenance_mode: booleanValue(
      settings.maintenance_mode,
      settings.is_maintenance,
      settings.under_maintenance,
    ),

    ordering_enabled: booleanValue(
      firstDefined(
        settings.ordering_enabled,
        settings.orders_enabled,
        settings.enable_orders,
      ) ?? true,
    ),

    wallet_top_up_enabled: booleanValue(
      firstDefined(
        settings.wallet_top_up_enabled,
        settings.wallet_topup_enabled,
        settings.enable_wallet_top_up,
      ) ?? true,
    ),

    minimum_order_amount: numberValue(
      settings.minimum_order_amount,
      settings.min_order_amount,
    ),

    tax_percentage: numberValue(
      settings.tax_percentage,
      settings.tax_rate,
      settings.vat_percentage,
    ),

    service_charge: numberValue(
      settings.service_charge,
      settings.service_fee,
    ),

    opening_time: nullableString(
      settings.opening_time,
      settings.canteen_opening_time,
    ),

    closing_time: nullableString(
      settings.closing_time,
      settings.canteen_closing_time,
    ),

    raw: settings,
  }
}
