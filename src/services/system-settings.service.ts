import { apiRequest } from '@/lib/api'
import type { PublicSystemSettings } from '@/types/system-settings'

interface SettingItem {
  key?: string
  name?: string
  value?: unknown
}

interface SettingsResponse {
  success?: boolean
  message?: string
  settings?: PublicSystemSettings | SettingItem[]
  data?:
    | PublicSystemSettings
    | SettingItem[]
    | {
        settings?: PublicSystemSettings | SettingItem[]
      }
}

function arrayToSettings(
  values: SettingItem[],
): PublicSystemSettings {
  return values.reduce<PublicSystemSettings>(
    (settings, item) => {
      const key = item.key ?? item.name

      if (key) {
        settings[key] = item.value
      }

      return settings
    },
    {},
  )
}

function normalizeSettings(
  response: SettingsResponse,
): PublicSystemSettings {
  let source:
    | PublicSystemSettings
    | SettingItem[]
    | undefined

  if (
    response.data &&
    !Array.isArray(response.data) &&
    'settings' in response.data
  ) {
    source = response.data.settings as
      | PublicSystemSettings
      | SettingItem[]
      | undefined
  } else {
    source =
      (response.data as PublicSystemSettings | SettingItem[]) ??
      response.settings
  }

  if (Array.isArray(source)) {
    return arrayToSettings(source)
  }

  return source ?? {}
}

export async function getPublicSystemSettings(): Promise<PublicSystemSettings> {
  const response =
    await apiRequest<SettingsResponse>(
      '/system-settings/public',
      {
        method: 'GET',
        auth: false,
        cache: 'no-store',
      },
    )

  return normalizeSettings(response)
}
