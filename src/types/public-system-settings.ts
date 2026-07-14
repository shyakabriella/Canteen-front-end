export interface PublicSettingItem {
  id?: number | string
  key?: string | null
  setting_key?: string | null
  name?: string | null
  value?: unknown
  setting_value?: unknown
  type?: string | null
  data_type?: string | null
  group?: string | null
  category?: string | null
  description?: string | null
  is_public?: boolean | number | string | null
}

export interface PublicSystemSettings {
  app_name: string
  app_short_name: string
  app_description: string

  logo_url: string | null
  favicon_url: string | null

  currency: string
  currency_symbol: string
  timezone: string
  locale: string

  support_email: string | null
  support_phone: string | null
  address: string | null

  allow_registration: boolean
  maintenance_mode: boolean
  ordering_enabled: boolean
  wallet_top_up_enabled: boolean

  minimum_order_amount: number
  tax_percentage: number
  service_charge: number

  opening_time: string | null
  closing_time: string | null

  raw: Record<string, unknown>
}
