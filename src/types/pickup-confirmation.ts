import type { Order } from '@/types/order'
import type { OrderQrCode } from '@/types/order-qr-code'
import type { QrScanLog } from '@/types/qr-scan-log'

export type PickupConfirmationStatus =
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | string

export type PickupConfirmationMethod =
  | 'manual'
  | 'qr'
  | 'qr_scan'
  | string

export interface PickupConfirmationUser {
  id?: number | string
  name?: string
  email?: string
  phone?: string | null
  role?: string | null
}

export interface PickupConfirmation {
  id: number | string

  order_id?: number | string | null
  order?: Order | null

  order_qr_code_id?: number | string | null
  qr_code_id?: number | string | null

  order_qr_code?: OrderQrCode | null
  orderQrCode?: OrderQrCode | null
  qr_code?: OrderQrCode | null
  qrCode?: OrderQrCode | null

  qr_scan_log_id?: number | string | null
  qr_scan_log?: QrScanLog | null
  qrScanLog?: QrScanLog | null

  status?: PickupConfirmationStatus | null

  confirmation_method?: PickupConfirmationMethod | null
  pickup_method?: PickupConfirmationMethod | null
  method?: PickupConfirmationMethod | null

  confirmed_by?: number | string | null
  cancelled_by?: number | string | null

  confirmer?: PickupConfirmationUser | null
  confirmedBy?: PickupConfirmationUser | null
  confirmed_by_user?: PickupConfirmationUser | null

  canceller?: PickupConfirmationUser | null
  cancelledBy?: PickupConfirmationUser | null
  cancelled_by_user?: PickupConfirmationUser | null

  device_name?: string | null
  device_type?: string | null
  location?: string | null

  latitude?: number | string | null
  longitude?: number | string | null

  notes?: string | null
  pickup_notes?: string | null

  cancellation_reason?: string | null
  cancel_reason?: string | null

  confirmed_at?: string | null
  picked_up_at?: string | null
  pickup_at?: string | null
  cancelled_at?: string | null

  deleted_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface PickupConfirmationPayload {
  order_id: string
  order_qr_code_id?: string
  device_name: string
  device_type: string
  location: string
  notes?: string
}

export interface CancelPickupConfirmationPayload {
  reason: string
  notes?: string
}

export interface PickupConfirmationListParams {
  search?: string
  status?: string
  method?: string
  orderId?: string
  qrCodeId?: string
  deviceType?: string
  location?: string
  dateFrom?: string
  dateTo?: string
  includeDeleted?: boolean
  page?: number
  perPage?: number
}

export interface PickupConfirmationListResult {
  confirmations: PickupConfirmation[]
  current_page?: number
  last_page?: number
  per_page?: number
  total?: number
}

export interface PickupConfirmationSummary {
  total_confirmations: number
  confirmed_pickups: number
  cancelled_pickups: number
  today_pickups: number
  manual_pickups: number
  qr_pickups: number
  unique_locations: number
}
