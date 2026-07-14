export type UserRole =
  | 'admin'
  | 'manager'
  | 'canteen_staff'
  | 'staff'
  | 'student'
  | 'user'
  | string

export interface RoleObject {
  id?: number
  name?: string
  slug?: string
}

export interface AuthUser {
  id: number
  name: string
  email: string
  phone?: string | null
  role?: UserRole | RoleObject | null
  wallet_balance?: number | string
  status?: string
  avatar?: string | null
  avatar_url?: string | null
  created_at?: string
  updated_at?: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  phone?: string
  password: string
  password_confirmation: string
}

export interface AuthSession {
  token: string
  user: AuthUser
  message?: string
}

export interface RegisterResult {
  message: string
  token?: string
  user?: AuthUser
}
