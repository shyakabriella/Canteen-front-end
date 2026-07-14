import type { OrderQrCode } from '@/types/order-qr-code'
import type { Order } from '@/types/order'

export type QrScanResult =
  | 'success'
  | 'successful'
  | 'valid'
  | 'failed'
  | 'invalid'
  | 'expired'
  | 'used'
  | 'cancelled'
  | string

export interface QrScanLogUser {
  id?: number | string
  name?: string
  email?: string
  phone?: string | null
  role?: string | null
}

export interface QrScanLog {
  id: number | string

  order_qr_code_id?: number | string | null
  qr_code_id?: number | string | null

  order_qr_code?: OrderQrCode | null
  orderQrCode?: OrderQrCode | null
  qr_code?: OrderQrCode | null
  qrCode?: OrderQrCode | null

  order_id?: number | string | null
  order?: Order | null

  qr_token?: string | null
  scanned_token?: string | null
  token?: string | null

  status?: string | null
  result?: QrScanResult | null
  scan_result?: QrScanResult | null

  success?: boolean | number | string | null
  is_valid?: boolean | number | string | null
  valid?: boolean | number | string | null

  message?: string | null
  failure_reason?: string | null
  error_message?: string | null
  reason?: string | null
  notes?: string | null

  device_id?: string | null
  device_name?: string | null
  device_type?: string | null

  location?: string | null
  latitude?: number | string | null
  longitude?: number | string | null

  ip_address?: string | null
  user_agent?: string | null

  scanned_by?: number | string | null
  user_id?: number | string | null

  scanner?: QrScanLogUser | null
  user?: QrScanLogUser | null
  scannedBy?: QrScanLogUser | null
  scanned_by_user?: QrScanLogUser | null

  scanned_at?: string | null
  deleted_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface QrScanLogListParams {
  search?: string
  result?: string
  deviceType?: string
  location?: string
  orderId?: string
  qrCodeId?: string
  dateFrom?: string
  dateTo?: string
  includeDeleted?: boolean
  page?: number
  perPage?: number
}

export interface QrScanLogListResult {
  logs: QrScanLog[]
  current_page?: number
  last_page?: number
  per_page?: number
  total?: number
}

export interface QrScanLogSummary {
  total_scans: number
  successful_scans: number
  failed_scans: number
  invalid_scans: number
  expired_scans: number
  used_scans: number
  today_scans: number
  unique_devices: number
  unique_locations: number
}
