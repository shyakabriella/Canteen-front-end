import { apiRequest } from '@/lib/api'
import {
  getActivityLogDate,
  getActivityLogStatus,
  isSystemActivityLog,
} from '@/lib/activity-log'
import type {
  ActivityLog,
  ActivityLogListParams,
  ActivityLogListResult,
  ActivityLogPayload,
  ActivityLogSummary,
} from '@/types/activity-log'

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

function looksLikeActivityLog(
  value: unknown,
): value is ActivityLog {
  const record = asRecord(value)

  if (!record) {
    return false
  }

  return (
    'id' in record ||
    'action' in record ||
    'event' in record ||
    'description' in record ||
    'log_code' in record
  )
}

function extractActivityLog(
  payload: unknown,
): ActivityLog | undefined {
  if (looksLikeActivityLog(payload)) {
    return payload
  }

  const root = asRecord(payload)
  const data = root?.data
  const dataRecord = asRecord(data)

  const values = [
    root?.activity_log,
    root?.activityLog,
    root?.log,
    data,
    dataRecord?.activity_log,
    dataRecord?.activityLog,
    dataRecord?.log,
  ]

  return values.find(looksLikeActivityLog)
}

function extractActivityLogArray(
  payload: unknown,
): ActivityLog[] {
  if (Array.isArray(payload)) {
    return payload.filter(
      looksLikeActivityLog,
    )
  }

  const root = asRecord(payload)

  if (!root) {
    return []
  }

  const data = asRecord(root.data)

  const arrays = [
    root.activity_logs,
    root.activityLogs,
    root.logs,
    root.items,
    root.data,

    data?.activity_logs,
    data?.activityLogs,
    data?.logs,
    data?.items,
    data?.data,
  ]

  for (const array of arrays) {
    if (Array.isArray(array)) {
      return array.filter(
        looksLikeActivityLog,
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
  params: ActivityLogListParams,
): string {
  const query = new URLSearchParams()

  if (params.search?.trim()) {
    query.set('search', params.search.trim())
  }

  if (params.action) {
    query.set('action', params.action)
  }

  if (params.module) {
    query.set('module', params.module)
  }

  if (params.status) {
    query.set('status', params.status)
  }

  if (params.userId) {
    query.set('user_id', params.userId)
  }

  if (params.subjectType) {
    query.set(
      'subject_type',
      params.subjectType,
    )
  }

  if (params.dateFrom) {
    query.set('date_from', params.dateFrom)
  }

  if (params.dateTo) {
    query.set('date_to', params.dateTo)
  }

  if (params.includeDeleted) {
    query.set('with_trashed', '1')
    query.set('include_deleted', '1')
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

export async function getActivityLogs(
  params: ActivityLogListParams = {},
): Promise<ActivityLogListResult> {
  const query = buildQuery(params)

  const response = await apiRequest<unknown>(
    `/activity-logs${query ? `?${query}` : ''}`,
    {
      method: 'GET',
      auth: true,
      cache: 'no-store',
    },
  )

  const root = asRecord(response)
  const data = asRecord(root?.data)

  return {
    logs: extractActivityLogArray(response),

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

export async function getActivityLogSummary(
  params: ActivityLogListParams = {},
): Promise<ActivityLogSummary> {
  const query = buildQuery(params)

  const response = await apiRequest<unknown>(
    `/activity-logs/summary${query ? `?${query}` : ''}`,
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

  const logs = extractActivityLogArray(response)

  const today = new Date()
  const todayKey = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-')

  const todayLogs = logs.filter((log) => {
    const value = getActivityLogDate(log)

    if (!value) {
      return false
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return value.startsWith(todayKey)
    }

    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-') === todayKey
  })

  const userLogs = logs.filter(
    (log) => !isSystemActivityLog(log),
  )

  const systemLogs = logs.filter(
    isSystemActivityLog,
  )

  const successful = logs.filter(
    (log) =>
      getActivityLogStatus(log) === 'success',
  )

  const failed = logs.filter(
    (log) =>
      getActivityLogStatus(log) === 'failed',
  )

  const warnings = logs.filter(
    (log) =>
      getActivityLogStatus(log) === 'warning',
  )

  const deleted = logs.filter(
    (log) => Boolean(log.deleted_at),
  )

  const uniqueUsers = new Set(
    logs
      .map(
        (log) =>
          log.user_id ??
          log.actor_id ??
          log.created_by ??
          log.user?.id ??
          log.actor?.id,
      )
      .filter(
        (value) =>
          value !== undefined &&
          value !== null &&
          value !== '',
      )
      .map(String),
  ).size

  return {
    total_logs: firstNumber(
      summary.total_logs,
      summary.logs_count,
      summary.total,
      logs.length,
    ),

    today_logs: firstNumber(
      summary.today_logs,
      summary.logs_today,
      summary.today_count,
      todayLogs.length,
    ),

    user_actions: firstNumber(
      summary.user_actions,
      summary.user_logs,
      summary.user_action_count,
      userLogs.length,
    ),

    system_actions: firstNumber(
      summary.system_actions,
      summary.system_logs,
      summary.system_action_count,
      systemLogs.length,
    ),

    successful_actions: firstNumber(
      summary.successful_actions,
      summary.success_logs,
      summary.success_count,
      successful.length,
    ),

    failed_actions: firstNumber(
      summary.failed_actions,
      summary.failed_logs,
      summary.failed_count,
      failed.length,
    ),

    warning_actions: firstNumber(
      summary.warning_actions,
      summary.warning_logs,
      summary.warning_count,
      warnings.length,
    ),

    deleted_logs: firstNumber(
      summary.deleted_logs,
      summary.deleted_count,
      deleted.length,
    ),

    unique_users: firstNumber(
      summary.unique_users,
      summary.users_count,
      uniqueUsers,
    ),
  }
}

export async function getActivityLog(
  id: number | string,
): Promise<ActivityLog> {
  const response = await apiRequest<unknown>(
    `/activity-logs/${id}`,
    {
      method: 'GET',
      auth: true,
      cache: 'no-store',
    },
  )

  const log = extractActivityLog(response)

  if (!log) {
    throw new Error(
      'The backend did not return the requested activity log.',
    )
  }

  return log
}

export async function createActivityLog(
  payload: ActivityLogPayload,
): Promise<{
  log?: ActivityLog
  message: string
}> {
  const response = await apiRequest<unknown>(
    '/activity-logs',
    {
      method: 'POST',
      auth: true,
      body: {
        action: payload.action,
        module: payload.module,
        description:
          payload.description.trim(),

        subject_type:
          payload.subject_type?.trim() || null,

        subject_id:
          payload.subject_id?.trim() || null,

        status: payload.status,

        metadata:
          payload.metadata ?? null,
      },
    },
  )

  return {
    log: extractActivityLog(response),

    message: extractMessage(
      response,
      'Activity log created successfully.',
    ),
  }
}

export async function deleteActivityLog(
  id: number | string,
): Promise<string> {
  const response = await apiRequest<unknown>(
    `/activity-logs/${id}`,
    {
      method: 'DELETE',
      auth: true,
    },
  )

  return extractMessage(
    response,
    'Activity log deleted successfully.',
  )
}

export async function restoreActivityLog(
  id: number | string,
): Promise<string> {
  const response = await apiRequest<unknown>(
    `/activity-logs/${id}/restore`,
    {
      method: 'POST',
      auth: true,
    },
  )

  return extractMessage(
    response,
    'Activity log restored successfully.',
  )
}
