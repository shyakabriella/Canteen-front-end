import type {
  ActivityLog,
  ActivityLogStatus,
} from '@/types/activity-log'

export function activityLogNumber(
  value: unknown,
): number {
  const number = Number(value ?? 0)

  return Number.isFinite(number)
    ? number
    : 0
}

export function normalizeActivityLogStatus(
  status?: ActivityLogStatus | null,
): 'success' | 'failed' | 'warning' | 'info' {
  const value = String(status ?? 'info')
    .trim()
    .toLowerCase()
    .replaceAll('-', '_')
    .replaceAll(' ', '_')

  if (
    [
      'success',
      'successful',
      'completed',
      'approved',
      'ok',
      'passed',
    ].includes(value)
  ) {
    return 'success'
  }

  if (
    [
      'failed',
      'failure',
      'error',
      'rejected',
      'denied',
      'invalid',
    ].includes(value)
  ) {
    return 'failed'
  }

  if (
    [
      'warning',
      'warn',
      'attention',
      'suspicious',
    ].includes(value)
  ) {
    return 'warning'
  }

  return 'info'
}

export function getActivityLogStatus(
  log: ActivityLog,
) {
  return normalizeActivityLogStatus(
    log.status ?? log.result,
  )
}

export function activityLogStatusLabel(
  log: ActivityLog,
): string {
  const status = getActivityLogStatus(log)

  return {
    success: 'Success',
    failed: 'Failed',
    warning: 'Warning',
    info: 'Information',
  }[status]
}

export function getActivityLogReference(
  log: ActivityLog,
): string {
  return (
    log.log_code ??
    log.reference ??
    log.code ??
    `LOG-${log.id}`
  )
}

export function getActivityLogAction(
  log: ActivityLog,
): string {
  return (
    log.action ??
    log.event ??
    log.activity ??
    log.log_type ??
    log.type ??
    'activity'
  )
}

export function formatActivityLogAction(
  value?: string | null,
): string {
  return String(value ?? 'Activity')
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    )
}

export function getActivityLogModule(
  log: ActivityLog,
): string {
  return (
    log.module ??
    log.module_name ??
    log.category ??
    'System'
  )
}

export function getActivityLogSubjectType(
  log: ActivityLog,
): string {
  return (
    log.subject_type ??
    log.entity_type ??
    log.auditable_type ??
    log.model_type ??
    'Not available'
  )
}

export function getActivityLogSubjectId(
  log: ActivityLog,
): string {
  const value =
    log.subject_id ??
    log.entity_id ??
    log.auditable_id ??
    log.model_id

  return value === undefined ||
    value === null ||
    value === ''
    ? 'Not available'
    : String(value)
}

export function getActivityLogActor(
  log: ActivityLog,
) {
  return (
    log.user ??
    log.actor ??
    log.creator ??
    log.createdBy ??
    null
  )
}

export function getActivityLogActorName(
  log: ActivityLog,
): string {
  const actor = getActivityLogActor(log)

  return (
    actor?.name ??
    actor?.email ??
    (
      log.user_id
        ? `User #${log.user_id}`
        : log.actor_id
          ? `User #${log.actor_id}`
          : log.created_by
            ? `User #${log.created_by}`
            : 'System'
    )
  )
}

export function getActivityLogActorEmail(
  log: ActivityLog,
): string {
  return (
    getActivityLogActor(log)?.email ??
    'Not available'
  )
}

export function getActivityLogDescription(
  log: ActivityLog,
): string {
  return (
    log.description ??
    log.message ??
    log.details ??
    log.notes ??
    'No activity description was provided.'
  )
}

export function getActivityLogIpAddress(
  log: ActivityLog,
): string {
  return (
    log.ip_address ??
    log.ip ??
    'Not available'
  )
}

export function getActivityLogMethod(
  log: ActivityLog,
): string {
  return String(
    log.request_method ??
    log.method ??
    'Not available',
  ).toUpperCase()
}

export function getActivityLogRoute(
  log: ActivityLog,
): string {
  return (
    log.route ??
    log.url ??
    log.path ??
    'Not available'
  )
}

export function getActivityLogDevice(
  log: ActivityLog,
): string {
  return (
    log.device_name ??
    log.device ??
    log.device_type ??
    log.browser ??
    'Not available'
  )
}

export function getActivityLogDate(
  log: ActivityLog,
): string | null {
  return (
    log.occurred_at ??
    log.logged_at ??
    log.created_at ??
    null
  )
}

export function getActivityLogMetadata(
  log: ActivityLog,
): unknown {
  return (
    log.metadata ??
    log.properties ??
    log.context ??
    null
  )
}

export function formatActivityLogDate(
  value?: string | null,
  includeTime = true,
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
    ...(includeTime
      ? { timeStyle: 'short' }
      : {}),
  }).format(date)
}

export function formatActivityLogJson(
  value: unknown,
): string {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return 'No data available.'
  }

  if (typeof value === 'string') {
    try {
      return JSON.stringify(
        JSON.parse(value),
        null,
        2,
      )
    } catch {
      return value
    }
  }

  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export function isSystemActivityLog(
  log: ActivityLog,
): boolean {
  return !(
    log.user_id ??
    log.actor_id ??
    log.created_by ??
    getActivityLogActor(log)?.id
  )
}
