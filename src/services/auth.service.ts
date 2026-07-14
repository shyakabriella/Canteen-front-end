import {
  apiRequest,
  ApiError,
} from '@/lib/api'
import type {
  AuthSession,
  AuthUser,
  LoginPayload,
  RegisterPayload,
  RegisterResult,
} from '@/types/auth'

type UnknownRecord = Record<string, unknown>

function asRecord(value: unknown): UnknownRecord | null {
  if (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  ) {
    return value as UnknownRecord
  }

  return null
}

function extractToken(payload: unknown): string | undefined {
  const root = asRecord(payload)
  const data = asRecord(root?.data)

  const possibleTokens = [
    root?.token,
    root?.access_token,
    data?.token,
    data?.access_token,
  ]

  return possibleTokens.find(
    (value): value is string =>
      typeof value === 'string' && value.length > 0,
  )
}

function looksLikeUser(value: unknown): value is AuthUser {
  const record = asRecord(value)

  if (!record) {
    return false
  }

  return (
    'id' in record ||
    'email' in record ||
    'name' in record
  )
}

function extractUser(payload: unknown): AuthUser | undefined {
  const root = asRecord(payload)
  const data = asRecord(root?.data)

  const possibleUsers = [
    root?.user,
    root?.profile,
    data?.user,
    data?.profile,
    root?.data,
    payload,
  ]

  return possibleUsers.find(looksLikeUser)
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

export async function loginUser(
  payload: LoginPayload,
): Promise<AuthSession> {
  const response = await apiRequest<unknown>('/login', {
    method: 'POST',
    body: payload,
    auth: false,
  })

  const token = extractToken(response)
  const user = extractUser(response)

  if (!token) {
    throw new ApiError(
      'Login succeeded, but the backend did not return an authentication token.',
      500,
    )
  }

  if (!user) {
    throw new ApiError(
      'Login succeeded, but the backend did not return user information.',
      500,
    )
  }

  return {
    token,
    user,
    message: extractMessage(
      response,
      'Login successful.',
    ),
  }
}

export async function registerUser(
  payload: RegisterPayload,
): Promise<RegisterResult> {
  const response = await apiRequest<unknown>(
    '/register',
    {
      method: 'POST',
      body: payload,
      auth: false,
    },
  )

  return {
    message: extractMessage(
      response,
      'Your account was created successfully.',
    ),
    token: extractToken(response),
    user: extractUser(response),
  }
}

export async function getProfile(): Promise<AuthUser> {
  const response = await apiRequest<unknown>(
    '/profile',
    {
      method: 'GET',
      auth: true,
      cache: 'no-store',
    },
  )

  const user = extractUser(response)

  if (!user) {
    throw new ApiError(
      'The profile endpoint did not return user information.',
      500,
    )
  }

  return user
}

export async function logoutUser(): Promise<string> {
  const response = await apiRequest<unknown>(
    '/logout',
    {
      method: 'POST',
      auth: true,
    },
  )

  return extractMessage(
    response,
    'You have been logged out successfully.',
  )
}
