import { apiRequest, ApiError } from '@/lib/api'
import type {
  FoodCategory,
  FoodCategoryListResult,
  FoodCategoryPayload,
} from '@/types/food-category'

type UnknownRecord = Record<string, unknown>

interface CategoryListParams {
  search?: string
  includeDeleted?: boolean
  page?: number
  perPage?: number
}

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

function asNumber(
  value: unknown,
): number | undefined {
  if (typeof value === 'number') {
    return value
  }

  if (
    typeof value === 'string' &&
    value.trim() !== '' &&
    !Number.isNaN(Number(value))
  ) {
    return Number(value)
  }

  return undefined
}

function looksLikeCategory(
  value: unknown,
): value is FoodCategory {
  const record = asRecord(value)

  if (!record) {
    return false
  }

  return 'id' in record || 'name' in record
}

function extractCategory(
  payload: unknown,
): FoodCategory | undefined {
  if (looksLikeCategory(payload)) {
    return payload
  }

  const root = asRecord(payload)
  const data = root?.data
  const category = root?.category

  if (looksLikeCategory(category)) {
    return category
  }

  if (looksLikeCategory(data)) {
    return data
  }

  const dataRecord = asRecord(data)

  if (looksLikeCategory(dataRecord?.category)) {
    return dataRecord.category
  }

  return undefined
}

function extractCategoryArray(
  payload: unknown,
): FoodCategory[] {
  if (Array.isArray(payload)) {
    return payload.filter(looksLikeCategory)
  }

  const root = asRecord(payload)

  if (!root) {
    return []
  }

  const possibleArrays = [
    root.categories,
    root.data,
    asRecord(root.data)?.categories,
    asRecord(root.data)?.data,
  ]

  for (const possibleArray of possibleArrays) {
    if (Array.isArray(possibleArray)) {
      return possibleArray.filter(looksLikeCategory)
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

export async function getFoodCategories(
  params: CategoryListParams = {},
): Promise<FoodCategoryListResult> {
  const query = new URLSearchParams()

  if (params.search?.trim()) {
    query.set('search', params.search.trim())
  }

  if (params.includeDeleted) {
    query.set('with_trashed', '1')
    query.set('include_deleted', '1')
  }

  if (params.page) {
    query.set('page', String(params.page))
  }

  if (params.perPage) {
    query.set('per_page', String(params.perPage))
  }

  const queryString = query.toString()

  const response = await apiRequest<unknown>(
    `/food-categories${queryString ? `?${queryString}` : ''}`,
    {
      method: 'GET',
      auth: true,
      cache: 'no-store',
    },
  )

  const root = asRecord(response)
  const rootData = asRecord(root?.data)

  return {
    categories: extractCategoryArray(response),
    current_page:
      asNumber(root?.current_page) ??
      asNumber(rootData?.current_page),
    last_page:
      asNumber(root?.last_page) ??
      asNumber(rootData?.last_page),
    per_page:
      asNumber(root?.per_page) ??
      asNumber(rootData?.per_page),
    total:
      asNumber(root?.total) ??
      asNumber(rootData?.total),
  }
}

export async function getFoodCategory(
  id: number | string,
): Promise<FoodCategory> {
  const response = await apiRequest<unknown>(
    `/food-categories/${id}`,
    {
      method: 'GET',
      auth: true,
      cache: 'no-store',
    },
  )

  const category = extractCategory(response)

  if (!category) {
    throw new ApiError(
      'The backend did not return the requested category.',
      500,
    )
  }

  return category
}

export async function createFoodCategory(
  payload: FoodCategoryPayload,
): Promise<{
  category?: FoodCategory
  message: string
}> {
  const response = await apiRequest<unknown>(
    '/food-categories',
    {
      method: 'POST',
      auth: true,
      body: payload,
    },
  )

  return {
    category: extractCategory(response),
    message: extractMessage(
      response,
      'Food category created successfully.',
    ),
  }
}

export async function updateFoodCategory(
  id: number | string,
  payload: FoodCategoryPayload,
): Promise<{
  category?: FoodCategory
  message: string
}> {
  const response = await apiRequest<unknown>(
    `/food-categories/${id}`,
    {
      method: 'PUT',
      auth: true,
      body: payload,
    },
  )

  return {
    category: extractCategory(response),
    message: extractMessage(
      response,
      'Food category updated successfully.',
    ),
  }
}

export async function deleteFoodCategory(
  id: number | string,
): Promise<string> {
  const response = await apiRequest<unknown>(
    `/food-categories/${id}`,
    {
      method: 'DELETE',
      auth: true,
    },
  )

  return extractMessage(
    response,
    'Food category deleted successfully.',
  )
}

export async function restoreFoodCategory(
  id: number | string,
): Promise<string> {
  const response = await apiRequest<unknown>(
    `/food-categories/${id}/restore`,
    {
      method: 'POST',
      auth: true,
    },
  )

  return extractMessage(
    response,
    'Food category restored successfully.',
  )
}
