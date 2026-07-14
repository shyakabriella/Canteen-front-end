export type SystemSettingDataType =
  | 'string'
  | 'text'
  | 'integer'
  | 'number'
  | 'decimal'
  | 'boolean'
  | 'json'
  | 'array'
  | 'object'
  | string

export interface SystemSettingUser {
  id?: number | string
  name?: string | null
  email?: string | null
}

export interface SystemSetting {
  id: number | string

  setting_key?: string | null
  key?: string | null
  name?: string | null

  label?: string | null
  display_name?: string | null

  value?: unknown
  setting_value?: unknown

  type?: SystemSettingDataType | null
  data_type?: SystemSettingDataType | null
  value_type?: SystemSettingDataType | null

  group?: string | null
  category?: string | null
  section?: string | null

  description?: string | null
  notes?: string | null

  is_public?: boolean | number | string | null
  public?: boolean | number | string | null

  is_editable?: boolean | number | string | null
  editable?: boolean | number | string | null

  status?: string | null

  validation_rules?: unknown
  options?: unknown
  metadata?: unknown

  created_by?: number | string | null
  updated_by?: number | string | null

  creator?: SystemSettingUser | null
  createdBy?: SystemSettingUser | null
  updater?: SystemSettingUser | null
  updatedBy?: SystemSettingUser | null

  deleted_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface SystemSettingPayload {
  setting_key: string
  label: string
  value: unknown
  type: string
  group: string
  description?: string
  is_public: boolean
  is_editable: boolean
}

export interface SystemSettingValuePayload {
  value: unknown
}

export interface SystemSettingBulkItem {
  setting_key: string
  value: unknown
}

export interface SystemSettingBulkPayload {
  settings: SystemSettingBulkItem[]
}

export interface SystemSettingListParams {
  search?: string
  group?: string
  type?: string
  visibility?: string
  includeDeleted?: boolean
  page?: number
  perPage?: number
}

export interface SystemSettingListResult {
  settings: SystemSetting[]
  current_page?: number
  last_page?: number
  per_page?: number
  total?: number
}

export interface SystemSettingSummary {
  total_settings: number
  public_settings: number
  private_settings: number
  editable_settings: number
  protected_settings: number
  groups_count: number
  boolean_settings: number
  deleted_settings: number
}
