import type {
  AuthSession,
  AuthUser,
  RoleObject,
} from '@/types/auth'

const TOKEN_KEY = 'smart_canteen_token'
const USER_KEY = 'smart_canteen_user'

function browserAvailable(): boolean {
  return typeof window !== 'undefined'
}

export function saveAuthSession(
  session: AuthSession,
  rememberMe = true,
): void {
  if (!browserAvailable()) {
    return
  }

  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)

  const storage = rememberMe ? localStorage : sessionStorage

  storage.setItem(TOKEN_KEY, session.token)
  storage.setItem(USER_KEY, JSON.stringify(session.user))
}

export function getStoredToken(): string | null {
  if (!browserAvailable()) {
    return null
  }

  return (
    localStorage.getItem(TOKEN_KEY) ??
    sessionStorage.getItem(TOKEN_KEY)
  )
}

export function getStoredUser(): AuthUser | null {
  if (!browserAvailable()) {
    return null
  }

  const savedUser =
    localStorage.getItem(USER_KEY) ??
    sessionStorage.getItem(USER_KEY)

  if (!savedUser) {
    return null
  }

  try {
    return JSON.parse(savedUser) as AuthUser
  } catch {
    clearAuthSession()
    return null
  }
}

export function getStoredAuthSession(): AuthSession | null {
  const token = getStoredToken()
  const user = getStoredUser()

  if (!token || !user) {
    return null
  }

  return {
    token,
    user,
  }
}

export function clearAuthSession(): void {
  if (!browserAvailable()) {
    return
  }

  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
}

export function getRoleName(
  role?: AuthUser['role'],
): string {
  if (!role) {
    return 'user'
  }

  if (typeof role === 'string') {
    return role
  }

  const roleObject = role as RoleObject

  return roleObject.slug ?? roleObject.name ?? 'user'
}

export function formatRoleName(
  role?: AuthUser['role'],
): string {
  return getRoleName(role)
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
}
