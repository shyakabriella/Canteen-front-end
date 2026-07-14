import { apiRequest } from '@/lib/api'
import type {
  AppUser,
  AppUserListResult,
} from '@/types/app-user'

type UnknownRecord = Record<string, unknown>

interface UserListParams {
  search?: string
  status?: string
  role?: string
  page?: number
  perPage?: number
}

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

function looksLikeUser(
  value: unknown,
): value is AppUser {
  const record = asRecord(value)

  if (!record) {
    return false
  }

  return (
    ('id' in record || 'email' in record) &&
    ('name' in record || 'email' in record)
  )
}

function extractUserArray(
  payload: unknown,
): AppUser[] {
  if (Array.isArray(payload)) {
    return payload.filter(looksLikeUser)
  }

  const root = asRecord(payload)

  if (!root) {
    return []
  }

  const data = asRecord(root.data)

  const possibleArrays = [
    root.users,
    root.items,
    root.data,

    data?.users,
    data?.items,
    data?.data,
  ]

  for (const possibleArray of possibleArrays) {
    if (Array.isArray(possibleArray)) {
      return possibleArray.filter(looksLikeUser)
    }
  }

  return []
}

export async function getUsers(
  params: UserListParams = {},
): Promise<AppUserListResult> {
  const query = new URLSearchParams()

  if (params.search?.trim()) {
    query.set('search', params.search.trim())
  }

  if (params.status) {
    query.set('status', params.status)
  }

  if (params.role) {
    query.set('role', params.role)
  }

  if (params.page) {
    query.set('page', String(params.page))
  }

  query.set(
    'per_page',
    String(params.perPage ?? 200),
  )

  const response = await apiRequest<unknown>(
    `/users?${query.toString()}`,
    {
      method: 'GET',
      auth: true,
      cache: 'no-store',
    },
  )

  const root = asRecord(response)
  const data = asRecord(root?.data)

  return {
    users: extractUserArray(response),

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
