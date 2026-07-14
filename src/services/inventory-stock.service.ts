import {
  apiRequest,
  ApiError,
} from '@/lib/api'
import type {
  InventoryStock,
  InventoryStockListParams,
  InventoryStockListResult,
  InventoryStockPayload,
  StockAdjustmentPayload,
} from '@/types/inventory-stock'

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

function looksLikeStock(
  value: unknown,
): value is InventoryStock {
  const record = asRecord(value)

  if (!record) {
    return false
  }

  return (
    'id' in record ||
    'food_item_id' in record ||
    'quantity' in record ||
    'current_quantity' in record
  )
}

function extractStock(
  payload: unknown,
): InventoryStock | undefined {
  if (looksLikeStock(payload)) {
    return payload
  }

  const root = asRecord(payload)
  const data = root?.data
  const dataRecord = asRecord(data)

  const possibleStocks = [
    root?.inventory_stock,
    root?.inventoryStock,
    root?.stock,
    data,
    dataRecord?.inventory_stock,
    dataRecord?.inventoryStock,
    dataRecord?.stock,
  ]

  return possibleStocks.find(looksLikeStock)
}

function extractStockArray(
  payload: unknown,
): InventoryStock[] {
  if (Array.isArray(payload)) {
    return payload.filter(looksLikeStock)
  }

  const root = asRecord(payload)

  if (!root) {
    return []
  }

  const data = asRecord(root.data)

  const possibleArrays = [
    root.inventory_stocks,
    root.inventoryStocks,
    root.stocks,
    root.items,
    root.data,
    data?.inventory_stocks,
    data?.inventoryStocks,
    data?.stocks,
    data?.items,
    data?.data,
  ]

  for (const possibleArray of possibleArrays) {
    if (Array.isArray(possibleArray)) {
      return possibleArray.filter(looksLikeStock)
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

function buildListQuery(
  params: InventoryStockListParams,
): string {
  const query = new URLSearchParams()

  if (params.search?.trim()) {
    query.set('search', params.search.trim())
  }

  if (params.foodItemId) {
    query.set(
      'food_item_id',
      params.foodItemId,
    )
  }

  if (params.status) {
    query.set('status', params.status)
  }

  if (params.includeDeleted) {
    query.set('with_trashed', '1')
    query.set('include_deleted', '1')
  }

  if (params.page) {
    query.set('page', String(params.page))
  }

  if (params.perPage) {
    query.set(
      'per_page',
      String(params.perPage),
    )
  }

  return query.toString()
}

function listResult(
  response: unknown,
): InventoryStockListResult {
  const root = asRecord(response)
  const data = asRecord(root?.data)

  return {
    stocks: extractStockArray(response),

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

function stockRequestPayload(
  payload: InventoryStockPayload,
) {
  return {
    food_item_id: payload.food_item_id,
    quantity: Number(payload.quantity),
    current_quantity: Number(payload.quantity),

    minimum_quantity: Number(
      payload.minimum_quantity,
    ),

    low_stock_quantity: Number(
      payload.minimum_quantity,
    ),

    maximum_quantity:
      payload.maximum_quantity?.trim()
        ? Number(payload.maximum_quantity)
        : null,

    unit: payload.unit.trim() || 'piece',
    status: payload.status ?? 'active',
    notes: payload.notes?.trim() || null,
  }
}

export async function getInventoryStocks(
  params: InventoryStockListParams = {},
): Promise<InventoryStockListResult> {
  const query = buildListQuery(params)

  const response = await apiRequest<unknown>(
    `/inventory-stocks${query ? `?${query}` : ''}`,
    {
      method: 'GET',
      auth: true,
      cache: 'no-store',
    },
  )

  return listResult(response)
}

export async function getLowStockItems(
  params: InventoryStockListParams = {},
): Promise<InventoryStockListResult> {
  const query = buildListQuery(params)

  const response = await apiRequest<unknown>(
    `/inventory-stocks/low-stock${query ? `?${query}` : ''}`,
    {
      method: 'GET',
      auth: true,
      cache: 'no-store',
    },
  )

  return listResult(response)
}

export async function getInventoryStock(
  id: number | string,
): Promise<InventoryStock> {
  const response = await apiRequest<unknown>(
    `/inventory-stocks/${id}`,
    {
      method: 'GET',
      auth: true,
      cache: 'no-store',
    },
  )

  const stock = extractStock(response)

  if (!stock) {
    throw new ApiError(
      'The backend did not return the requested stock record.',
      500,
    )
  }

  return stock
}

export async function createInventoryStock(
  payload: InventoryStockPayload,
): Promise<{
  stock?: InventoryStock
  message: string
}> {
  const response = await apiRequest<unknown>(
    '/inventory-stocks',
    {
      method: 'POST',
      auth: true,
      body: stockRequestPayload(payload),
    },
  )

  return {
    stock: extractStock(response),
    message: extractMessage(
      response,
      'Inventory stock created successfully.',
    ),
  }
}

export async function updateInventoryStock(
  id: number | string,
  payload: InventoryStockPayload,
): Promise<{
  stock?: InventoryStock
  message: string
}> {
  const response = await apiRequest<unknown>(
    `/inventory-stocks/${id}`,
    {
      method: 'PUT',
      auth: true,
      body: stockRequestPayload(payload),
    },
  )

  return {
    stock: extractStock(response),
    message: extractMessage(
      response,
      'Inventory stock updated successfully.',
    ),
  }
}

export async function deleteInventoryStock(
  id: number | string,
): Promise<string> {
  const response = await apiRequest<unknown>(
    `/inventory-stocks/${id}`,
    {
      method: 'DELETE',
      auth: true,
    },
  )

  return extractMessage(
    response,
    'Inventory stock deleted successfully.',
  )
}

export async function restoreInventoryStock(
  id: number | string,
): Promise<string> {
  const response = await apiRequest<unknown>(
    `/inventory-stocks/${id}/restore`,
    {
      method: 'POST',
      auth: true,
    },
  )

  return extractMessage(
    response,
    'Inventory stock restored successfully.',
  )
}

function adjustmentRequestPayload(
  payload: StockAdjustmentPayload,
) {
  const quantity = Number(payload.quantity)

  return {
    /*
     * Both names are sent because Laravel inventory
     * controllers commonly use either quantity or amount.
     */
    quantity,
    amount: quantity,
    reason: payload.reason?.trim() || null,
    notes: payload.notes?.trim() || null,
  }
}

export async function addInventoryStock(
  id: number | string,
  payload: StockAdjustmentPayload,
): Promise<{
  stock?: InventoryStock
  message: string
}> {
  const response = await apiRequest<unknown>(
    `/inventory-stocks/${id}/add-stock`,
    {
      method: 'PATCH',
      auth: true,
      body: adjustmentRequestPayload(payload),
    },
  )

  return {
    stock: extractStock(response),
    message: extractMessage(
      response,
      'Stock added successfully.',
    ),
  }
}

export async function reduceInventoryStock(
  id: number | string,
  payload: StockAdjustmentPayload,
): Promise<{
  stock?: InventoryStock
  message: string
}> {
  const response = await apiRequest<unknown>(
    `/inventory-stocks/${id}/reduce-stock`,
    {
      method: 'PATCH',
      auth: true,
      body: adjustmentRequestPayload(payload),
    },
  )

  return {
    stock: extractStock(response),
    message: extractMessage(
      response,
      'Stock reduced successfully.',
    ),
  }
}
