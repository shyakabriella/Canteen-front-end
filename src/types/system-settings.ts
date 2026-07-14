export interface PublicSystemSettings {
  app_name?: string
  app_logo?: string
  logo_url?: string
  primary_color?: string
  currency?: string
  currency_code?: string
  registration_enabled?: boolean | number | string
  maintenance_mode?: boolean | number | string
  contact_email?: string
  contact_phone?: string
  welcome_message?: string
  [key: string]: unknown
}
