import {
  apiRequest,
  ApiError,
} from '@/lib/api'
import type {
  FoodItem,
  FoodItemListParams,
  FoodItemListResult,
  FoodItemPayload,
} from '@/types/food-item'

type UnknownRecord = Record<string, unknown>

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

function looksLikeFoodItem(
  value: unknown,
): value is FoodItem {
  const record = asRecord(value)

  return Boolean(
    record &&
      ('id' in record || 'name' in record) &&
      ('name' in record || 'price' in record),
  )
}

function extractFoodItem(
  payload: unknown,
): FoodItem | undefined {
  if (looksLikeFoodItem(payload)) {
    return payload
  }

  const root = asRecord(payload)
  const data = root?.data
  const dataRecord = asRecord(data)

  const possibleItems = [
    root?.food_item,
    root?.foodItem,
    root?.item,
    data,
    dataRecord?.food_item,
    dataRecord?.foodItem,
    dataRecord?.item,
  ]

  return possibleItems.find(looksLikeFoodItem)
}

function extractFoodItemArray(
  payload: unknown,
): FoodItem[] {
  if (Array.isArray(payload)) {
    return payload.filter(looksLikeFoodItem)
  }

  const root = asRecord(payload)

  if (!root) {
    return []
  }

  const data = asRecord(root.data)

  const possibleArrays = [
    root.food_items,
    root.foodItems,
    root.items,
    root.data,
    data?.food_items,
    data?.foodItems,
    data?.items,
    data?.data,
  ]

  for (const possibleArray of possibleArrays) {
    if (Array.isArray(possibleArray)) {
      return possibleArray.filter(looksLikeFoodItem)
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

function appendOptional(
  formData: FormData,
  key: string,
  value?: string,
): void {
  if (
    value !== undefined &&
    value !== null &&
    value.trim() !== ''
  ) {
    formData.append(key, value.trim())
  }
}

function createFoodItemFormData(
  payload: FoodItemPayload,
): FormData {
  const formData = new FormData()

  formData.append(
    'food_category_id',
    payload.food_category_id,
  )

  formData.append('name', payload.name.trim())
  formData.append(
    'description',
    payload.description.trim(),
  )
  formData.append('price', payload.price)

  /*
   * Multipart form boolean values are sent as 1 or 0.
   */
  formData.append(
    'is_available',
    payload.is_available ? '1' : '0',
  )

  appendOptional(formData, 'sku', payload.sku)
  appendOptional(
    formData,
    'cost_price',
    payload.cost_price,
  )
  appendOptional(formData, 'unit', payload.unit)
  appendOptional(
    formData,
    'low_stock_quantity',
    payload.low_stock_quantity,
  )
  appendOptional(formData, 'status', payload.status)
  appendOptional(
    formData,
    'preparation_time_minutes',
    payload.preparation_time_minutes,
  )
  appendOptional(
    formData,
    'sort_order',
    payload.sort_order,
  )

  if (payload.image instanceof File) {
    formData.append('image', payload.image)
  }

  return formData
}

export async function getFoodItems(
  params: FoodItemListParams = {},
): Promise<FoodItemListResult> {
  const query = new URLSearchParams()

  if (params.search?.trim()) {
    query.set('search', params.search.trim())
  }

  if (params.categoryId) {
    query.set(
      'food_category_id',
      params.categoryId,
    )
  }

  if (params.availability === 'available') {
    query.set('is_available', '1')
  }

  if (params.availability === 'unavailable') {
    query.set('is_available', '0')
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
    `/food-items${queryString ? `?${queryString}` : ''}`,
    {
      method: 'GET',
      auth: true,
      cache: 'no-store',
    },
  )

  const root = asRecord(response)
  const data = asRecord(root?.data)

  return {
    foodItems: extractFoodItemArray(response),

    current_page:
      asNumber(root?.current_page) ??
      asNumber(data?.current_page),

    last_page:
      asNumber(root?.last_page) ??
      asNumber(data?.last_page),

    per_page:
      asNumber(root?.per_page) ??
      asNumber(data?.per_page),

    total:
      asNumber(root?.total) ??
      asNumber(data?.total),
  }
}

export async function getFoodItem(
  id: number | string,
): Promise<FoodItem> {
  const response = await apiRequest<unknown>(
    `/food-items/${id}`,
    {
      method: 'GET',
      auth: true,
      cache: 'no-store',
    },
  )

  const foodItem = extractFoodItem(response)

  if (!foodItem) {
    throw new ApiError(
      'The backend did not return the requested food item.',
      500,
    )
  }

  return foodItem
}

export async function createFoodItem(
  payload: FoodItemPayload,
): Promise<{
  foodItem?: FoodItem
  message: string
}> {
  const response = await apiRequest<unknown>(
    '/food-items',
    {
      method: 'POST',
      auth: true,
      body: createFoodItemFormData(payload),
    },
  )

  return {
    foodItem: extractFoodItem(response),

    message: extractMessage(
      response,
      'Food item created successfully.',
    ),
  }
}

export async function updateFoodItem(
  id: number | string,
  payload: FoodItemPayload,
): Promise<{
  foodItem?: FoodItem
  message: string
}> {
  const formData = createFoodItemFormData(payload)

  /*
   * PHP handles uploaded files reliably with POST.
   * Laravel converts this request to PUT.
   */
  formData.append('_method', 'PUT')

  const response = await apiRequest<unknown>(
    `/food-items/${id}`,
    {
      method: 'POST',
      auth: true,
      body: formData,
    },
  )

  return {
    foodItem: extractFoodItem(response),

    message: extractMessage(
      response,
      'Food item updated successfully.',
    ),
  }
}

export async function deleteFoodItem(
  id: number | string,
): Promise<string> {
  const response = await apiRequest<unknown>(
    `/food-items/${id}`,
    {
      method: 'DELETE',
      auth: true,
    },
  )

  return extractMessage(
    response,
    'Food item deleted successfully.',
  )
}

export async function restoreFoodItem(
  id: number | string,
): Promise<string> {
  const response = await apiRequest<unknown>(
    `/food-items/${id}/restore`,
    {
      method: 'POST',
      auth: true,
    },
  )

  return extractMessage(
    response,
    'Food item restored successfully.',
  )
}

export async function updateFoodItemAvailability(
  id: number | string,
  isAvailable: boolean,
): Promise<{
  foodItem?: FoodItem
  message: string
}> {
  const response = await apiRequest<unknown>(
    `/food-items/${id}/availability`,
    {
      method: 'PATCH',
      auth: true,
      body: {
        is_available: isAvailable,
      },
    },
  )

  return {
    foodItem: extractFoodItem(response),

    message: extractMessage(
      response,
      'Food item availability updated successfully.',
    ),
  }
}
