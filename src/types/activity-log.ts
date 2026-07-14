export type ActivityLogStatus =
  | 'success'
  | 'failed'
  | 'warning'
  | 'info'
  | string

export interface ActivityLogUser {
  id?: number | string
  name?: string | null
  email?: string | null
  phone?: string | null
  user_code?: string | null
  role?: string | null
}

export interface ActivityLog {
  id: number | string

  log_code?: string | null
  reference?: string | null
  code?: string | null

  user_id?: number | string | null
  actor_id?: number | string | null
  created_by?: number | string | null

  user?: ActivityLogUser | null
  actor?: ActivityLogUser | null
  creator?: ActivityLogUser | null
  createdBy?: ActivityLogUser | null

  action?: string | null
  event?: string | null
  activity?: string | null
  log_type?: string | null
  type?: string | null

  module?: string | null
  module_name?: string | null
  category?: string | null

  subject_type?: string | null
  entity_type?: string | null
  auditable_type?: string | null
  model_type?: string | null

  subject_id?: number | string | null
  entity_id?: number | string | null
  auditable_id?: number | string | null
  model_id?: number | string | null

  description?: string | null
  message?: string | null
  details?: string | null
  notes?: string | null

  status?: ActivityLogStatus | null
  result?: ActivityLogStatus | null

  old_values?: unknown
  new_values?: unknown
  properties?: unknown
  metadata?: unknown
  context?: unknown

  ip_address?: string | null
  ip?: string | null

  user_agent?: string | null
  browser?: string | null
  device?: string | null
  device_name?: string | null
  device_type?: string | null

  request_method?: string | null
  method?: string | null

  route?: string | null
  url?: string | null
  path?: string | null

  occurred_at?: string | null
  logged_at?: string | null

  deleted_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface ActivityLogPayload {
  action: string
  module: string
  description: string
  subject_type?: string
  subject_id?: string
  status: string
  metadata?: Record<string, unknown> | null
}

export interface ActivityLogListParams {
  search?: string
  action?: string
  module?: string
  status?: string
  userId?: string
  subjectType?: string
  dateFrom?: string
  dateTo?: string
  includeDeleted?: boolean
  page?: number
  perPage?: number
}

export interface ActivityLogListResult {
  logs: ActivityLog[]
  current_page?: number
  last_page?: number
  per_page?: number
  total?: number
}

export interface ActivityLogSummary {
  total_logs: number
  today_logs: number
  user_actions: number
  system_actions: number
  successful_actions: number
  failed_actions: number
  warning_actions: number
  deleted_logs: number
  unique_users: number
}
