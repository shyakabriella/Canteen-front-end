import { apiRequest } from '@/lib/api'
import {
  getQrScanResult,
  getQrScanDate,
} from '@/lib/qr-scan-log'
import type {
  QrScanLog,
  QrScanLogListParams,
  QrScanLogListResult,
  QrScanLogSummary,
} from '@/types/qr-scan-log'

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

  const numeric = Number(value)

  return Number.isFinite(numeric)
    ? numeric
    : undefined
}

function firstNumber(
  ...values: unknown[]
): number {
  for (const value of values) {
    const numeric = optionalNumber(value)

    if (numeric !== undefined) {
      return numeric
    }
  }

  return 0
}

function looksLikeQrScanLog(
  value: unknown,
): value is QrScanLog {
  const record = asRecord(value)

  if (!record) {
    return false
  }

  return (
    'id' in record ||
    'scan_result' in record ||
    'order_qr_code_id' in record ||
    'device_name' in record
  )
}

function extractQrScanLog(
  payload: unknown,
): QrScanLog | undefined {
  if (looksLikeQrScanLog(payload)) {
    return payload
  }

  const root = asRecord(payload)
  const data = root?.data
  const dataRecord = asRecord(data)

  const possibleValues = [
    root?.qr_scan_log,
    root?.qrScanLog,
    root?.scan_log,
    root?.scanLog,
    data,
    dataRecord?.qr_scan_log,
    dataRecord?.qrScanLog,
    dataRecord?.scan_log,
    dataRecord?.scanLog,
  ]

  return possibleValues.find(looksLikeQrScanLog)
}

function extractQrScanLogArray(
  payload: unknown,
): QrScanLog[] {
  if (Array.isArray(payload)) {
    return payload.filter(looksLikeQrScanLog)
  }

  const root = asRecord(payload)

  if (!root) {
    return []
  }

  const data = asRecord(root.data)

  const possibleArrays = [
    root.qr_scan_logs,
    root.qrScanLogs,
    root.scan_logs,
    root.scanLogs,
    root.items,
    root.data,

    data?.qr_scan_logs,
    data?.qrScanLogs,
    data?.scan_logs,
    data?.scanLogs,
    data?.items,
    data?.data,
  ]

  for (const possibleArray of possibleArrays) {
    if (Array.isArray(possibleArray)) {
      return possibleArray.filter(
        looksLikeQrScanLog,
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
  params: QrScanLogListParams,
): string {
  const query = new URLSearchParams()

  if (params.search?.trim()) {
    query.set('search', params.search.trim())
  }

  if (params.result) {
    query.set('result', params.result)
    query.set('scan_result', params.result)
    query.set('status', params.result)
  }

  if (params.deviceType) {
    query.set(
      'device_type',
      params.deviceType,
    )
  }

  if (params.location?.trim()) {
    query.set(
      'location',
      params.location.trim(),
    )
  }

  if (params.orderId) {
    query.set('order_id', params.orderId)
  }

  if (params.qrCodeId) {
    query.set(
      'order_qr_code_id',
      params.qrCodeId,
    )
    query.set('qr_code_id', params.qrCodeId)
  }

  if (params.dateFrom) {
    query.set('date_from', params.dateFrom)
    query.set('from_date', params.dateFrom)
  }

  if (params.dateTo) {
    query.set('date_to', params.dateTo)
    query.set('to_date', params.dateTo)
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

export async function getQrScanLogs(
  params: QrScanLogListParams = {},
): Promise<QrScanLogListResult> {
  const query = buildQuery(params)

  const response = await apiRequest<unknown>(
    `/qr-scan-logs${query ? `?${query}` : ''}`,
    {
      method: 'GET',
      auth: true,
      cache: 'no-store',
    },
  )

  const root = asRecord(response)
  const data = asRecord(root?.data)

  return {
    logs: extractQrScanLogArray(response),

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

export async function getQrScanLogSummary(
  params: QrScanLogListParams = {},
): Promise<QrScanLogSummary> {
  const query = buildQuery(params)

  const response = await apiRequest<unknown>(
    `/qr-scan-logs/summary${query ? `?${query}` : ''}`,
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

  const logs = extractQrScanLogArray(response)

  const successful = logs.filter(
    (log) => getQrScanResult(log) === 'success',
  )

  const failed = logs.filter(
    (log) => getQrScanResult(log) === 'failed',
  )

  const invalid = logs.filter(
    (log) => getQrScanResult(log) === 'invalid',
  )

  const expired = logs.filter(
    (log) => getQrScanResult(log) === 'expired',
  )

  const used = logs.filter(
    (log) => getQrScanResult(log) === 'used',
  )

  const today = new Date()
  const todayKey = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-')

  const todayScans = logs.filter((log) => {
    const value = getQrScanDate(log)

    if (!value) {
      return false
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return value.startsWith(todayKey)
    }

    const key = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-')

    return key === todayKey
  })

  const uniqueDevices = new Set(
    logs
      .map((log) => log.device_id ?? log.device_name)
      .filter(Boolean)
      .map(String),
  ).size

  const uniqueLocations = new Set(
    logs
      .map((log) => log.location)
      .filter(Boolean)
      .map(String),
  ).size

  return {
    total_scans: firstNumber(
      summary.total_scans,
      summary.scans_count,
      summary.total,
      logs.length,
    ),

    successful_scans: firstNumber(
      summary.successful_scans,
      summary.success_count,
      summary.valid_scans,
      successful.length,
    ),

    failed_scans: firstNumber(
      summary.failed_scans,
      summary.failure_count,
      summary.failed_count,
      failed.length,
    ),

    invalid_scans: firstNumber(
      summary.invalid_scans,
      summary.invalid_count,
      invalid.length,
    ),

    expired_scans: firstNumber(
      summary.expired_scans,
      summary.expired_count,
      expired.length,
    ),

    used_scans: firstNumber(
      summary.used_scans,
      summary.already_used_scans,
      summary.used_count,
      used.length,
    ),

    today_scans: firstNumber(
      summary.today_scans,
      summary.scans_today,
      todayScans.length,
    ),

    unique_devices: firstNumber(
      summary.unique_devices,
      summary.devices_count,
      uniqueDevices,
    ),

    unique_locations: firstNumber(
      summary.unique_locations,
      summary.locations_count,
      uniqueLocations,
    ),
  }
}

export async function getQrScanLog(
  id: number | string,
): Promise<QrScanLog> {
  const response = await apiRequest<unknown>(
    `/qr-scan-logs/${id}`,
    {
      method: 'GET',
      auth: true,
      cache: 'no-store',
    },
  )

  const log = extractQrScanLog(response)

  if (!log) {
    throw new Error(
      'The backend did not return the requested QR scan log.',
    )
  }

  return log
}

export async function deleteQrScanLog(
  id: number | string,
): Promise<string> {
  const response = await apiRequest<unknown>(
    `/qr-scan-logs/${id}`,
    {
      method: 'DELETE',
      auth: true,
    },
  )

  return extractMessage(
    response,
    'QR scan log deleted successfully.',
  )
}

export async function restoreQrScanLog(
  id: number | string,
): Promise<string> {
  const response = await apiRequest<unknown>(
    `/qr-scan-logs/${id}/restore`,
    {
      method: 'POST',
      auth: true,
    },
  )

  return extractMessage(
    response,
    'QR scan log restored successfully.',
  )
}
