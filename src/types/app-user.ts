export interface AppUserRole {
  id?: number | string
  name?: string
  slug?: string
}

export interface AppUserWallet {
  id?: number | string
  balance?: number | string | null
}

export interface AppUser {
  id: number | string

  name: string
  email?: string | null
  phone?: string | null

  user_code?: string | null
  qr_code?: string | null
  profile_photo?: string | null

  role?: string | AppUserRole | null
  role_name?: string | null

  status?: string | null
  is_active?: boolean | number | string | null

  wallet_balance?: number | string | null
  balance?: number | string | null
  wallet?: AppUserWallet | null

  device_id?: string | null
  device_name?: string | null
  device_type?: string | null
  device_token?: string | null

  email_verified_at?: string | null
  phone_verified_at?: string | null
  last_login_at?: string | null

  deleted_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface AppUserListResult {
  users: AppUser[]
  current_page?: number
  last_page?: number
  per_page?: number
  total?: number
}
