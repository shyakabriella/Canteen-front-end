import type { Order } from '@/types/order'

export type OrderQrCodeStatus =
  | 'active'
  | 'pending'
  | 'used'
  | 'expired'
  | 'cancelled'
  | string

export interface OrderQrCode {
  id: number | string

  order_id?: number | string | null
  order?: Order | null

  qr_token?: string | null
  token?: string | null
  code?: string | null

  status?: OrderQrCodeStatus | null

  expires_at?: string | null
  used_at?: string | null
  cancelled_at?: string | null

  used_by?: number | string | null
  cancelled_by?: number | string | null

  device_name?: string | null
  device_type?: string | null
  location?: string | null

  notes?: string | null
  cancellation_reason?: string | null

  qr_image_url?: string | null
  qr_code_url?: string | null
  image_url?: string | null
  qr_url?: string | null
  qr_image?: string | null
  qr_path?: string | null

  deleted_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface OrderQrCodePayload {
  order_id: string
  expires_at?: string
  notes?: string
}

export interface VerifyOrderQrCodePayload {
  qr_token: string
  device_name: string
  device_type: string
  location: string
}

export interface MarkOrderQrCodeUsedPayload {
  device_name: string
  device_type: string
  location: string
  notes?: string
}

export interface RegenerateOrderQrCodePayload {
  expires_at: string
  notes?: string
}

export interface CancelOrderQrCodePayload {
  reason: string
  notes?: string
}

export interface OrderQrCodeListParams {
  search?: string
  status?: string
  orderId?: string
  dateFrom?: string
  dateTo?: string
  includeDeleted?: boolean
  page?: number
  perPage?: number
}

export interface OrderQrCodeListResult {
  qrCodes: OrderQrCode[]
  current_page?: number
  last_page?: number
  per_page?: number
  total?: number
}

export interface VerifyOrderQrCodeResult {
  valid: boolean
  message: string
  qrCode?: OrderQrCode
}
