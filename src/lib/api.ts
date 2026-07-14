import {
  clearAuthSession,
  getStoredToken,
} from '@/lib/auth'

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  'http://localhost:8000/api'
).replace(/\/$/, '')

interface ApiRequestOptions
  extends Omit<RequestInit, 'body'> {
  body?: unknown
  auth?: boolean
}

interface ApiErrorPayload {
  message?: string
  errors?: Record<string, string[]>
  success?: boolean
}

export class ApiError extends Error {
  status: number
  errors?: Record<string, string[]>

  constructor(
    message: string,
    status = 500,
    errors?: Record<string, string[]>,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

function firstValidationError(
  errors?: Record<string, string[]>,
): string | undefined {
  if (!errors) {
    return undefined
  }

  return Object.values(errors).flat()[0]
}

export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    auth = true,
    body,
    headers: customHeaders,
    ...fetchOptions
  } = options

  const headers = new Headers(customHeaders)

  headers.set('Accept', 'application/json')

  const isFormData =
    typeof FormData !== 'undefined' && body instanceof FormData

  if (body !== undefined && !isFormData) {
    headers.set('Content-Type', 'application/json')
  }

  if (auth) {
    const token = getStoredToken()

    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }

  const normalizedEndpoint = endpoint.startsWith('/')
    ? endpoint
    : `/${endpoint}`

  let requestBody: BodyInit | undefined

  if (body !== undefined) {
    requestBody = isFormData
      ? (body as FormData)
      : JSON.stringify(body)
  }

  let response: Response

  try {
    response = await fetch(
      `${API_BASE_URL}${normalizedEndpoint}`,
      {
        ...fetchOptions,
        headers,
        body: requestBody,
      },
    )
  } catch {
    throw new ApiError(
      'Unable to connect to the backend. Confirm Laravel is running on port 8000.',
      0,
    )
  }

  const responseText = await response.text()

  let payload: unknown = {}

  if (responseText) {
    try {
      payload = JSON.parse(responseText)
    } catch {
      payload = {
        message: responseText,
      }
    }
  }

  const errorPayload = payload as ApiErrorPayload

  if (!response.ok || errorPayload.success === false) {
    if (response.status === 401) {
      clearAuthSession()
    }

    const validationMessage = firstValidationError(
      errorPayload.errors,
    )

    throw new ApiError(
      validationMessage ??
        errorPayload.message ??
        `Request failed with status ${response.status}.`,
      response.status,
      errorPayload.errors,
    )
  }

  return payload as T
}
