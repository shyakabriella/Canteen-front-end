import {
  apiRequest,
  ApiError,
} from '@/lib/api'
import {
  getMovementQuantity,
  normalizeMovementType,
} from '@/lib/stock-movement'
import type {
  StockMovement,
  StockMovementListParams,
  StockMovementListResult,
  StockMovementPayload,
  StockMovementSummary,
  StockMovementUpdatePayload,
} from '@/types/stock-movement'

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

function numberValue(
  ...values: unknown[]
): number {
  for (const value of values) {
    if (
      value !== undefined &&
      value !== null &&
      value !== ''
    ) {
      const numeric = Number(value)

      if (Number.isFinite(numeric)) {
        return numeric
      }
    }
  }

  return 0
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

  const numeric = Number(value)

  return Number.isFinite(numeric)
    ? numeric
    : undefined
}

function looksLikeMovement(
  value: unknown,
): value is StockMovement {
  const record = asRecord(value)

  if (!record) {
    return false
  }

  return (
    'id' in record ||
    'movement_type' in record ||
    'type' in record ||
    'inventory_stock_id' in record
  )
}

function extractMovement(
  payload: unknown,
): StockMovement | undefined {
  if (looksLikeMovement(payload)) {
    return payload
  }

  const root = asRecord(payload)
  const data = root?.data
  const dataRecord = asRecord(data)

  const possibleMovements = [
    root?.stock_movement,
    root?.stockMovement,
    root?.movement,
    data,
    dataRecord?.stock_movement,
    dataRecord?.stockMovement,
    dataRecord?.movement,
  ]

  return possibleMovements.find(looksLikeMovement)
}

function extractMovementArray(
  payload: unknown,
): StockMovement[] {
  if (Array.isArray(payload)) {
    return payload.filter(looksLikeMovement)
  }

  const root = asRecord(payload)

  if (!root) {
    return []
  }

  const data = asRecord(root.data)

  const possibleArrays = [
    root.stock_movements,
    root.stockMovements,
    root.movements,
    root.items,
    root.data,

    data?.stock_movements,
    data?.stockMovements,
    data?.movements,
    data?.items,
    data?.data,
  ]

  for (const possibleArray of possibleArrays) {
    if (Array.isArray(possibleArray)) {
      return possibleArray.filter(looksLikeMovement)
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
  params: StockMovementListParams,
): string {
  const query = new URLSearchParams()

  if (params.search?.trim()) {
    query.set('search', params.search.trim())
  }

  if (params.inventoryStockId) {
    query.set(
      'inventory_stock_id',
      params.inventoryStockId,
    )
  }

  if (params.foodItemId) {
    query.set(
      'food_item_id',
      params.foodItemId,
    )
  }

  if (params.movementType) {
    query.set(
      'movement_type',
      params.movementType,
    )
    query.set('type', params.movementType)
  }

  if (params.dateFrom) {
    query.set('date_from', params.dateFrom)
    query.set('from_date', params.dateFrom)
  }

  if (params.dateTo) {
    query.set('date_to', params.dateTo)
    query.set('to_date', params.dateTo)
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

function createMovementPayload(
  payload: StockMovementPayload,
) {
  const quantity = Number(payload.quantity)

  return {
    inventory_stock_id:
      payload.inventory_stock_id,

    ...(payload.food_item_id
      ? {
          food_item_id: payload.food_item_id,
        }
      : {}),

    movement_type: payload.movement_type,

    /*
     * Some controllers use "type" instead of
     * "movement_type". Laravel ignores extra fields
     * unless the controller explicitly rejects them.
     */
    type: payload.movement_type,

    quantity,
    amount: quantity,

    reason: payload.reason?.trim() || null,
    notes: payload.notes?.trim() || null,
  }
}

export async function getStockMovements(
  params: StockMovementListParams = {},
): Promise<StockMovementListResult> {
  const query = buildListQuery(params)

  const response = await apiRequest<unknown>(
    `/stock-movements${query ? `?${query}` : ''}`,
    {
      method: 'GET',
      auth: true,
      cache: 'no-store',
    },
  )

  const root = asRecord(response)
  const data = asRecord(root?.data)

  return {
    movements: extractMovementArray(response),

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

export async function getStockMovementSummary(
  params: StockMovementListParams = {},
): Promise<StockMovementSummary> {
  const query = buildListQuery(params)

  const response = await apiRequest<unknown>(
    `/stock-movements/summary${query ? `?${query}` : ''}`,
    {
      method: 'GET',
      auth: true,
      cache: 'no-store',
    },
  )

  const root = asRecord(response)
  const data = asRecord(root?.data)
  const nestedSummary =
    asRecord(root?.summary) ??
    asRecord(data?.summary) ??
    data ??
    root ??
    {}

  const movements = extractMovementArray(response)

  const derivedStockIn = movements.filter(
    (movement) =>
      normalizeMovementType(
        movement.movement_type ?? movement.type,
      ) === 'in',
  )

  const derivedStockOut = movements.filter(
    (movement) =>
      normalizeMovementType(
        movement.movement_type ?? movement.type,
      ) === 'out',
  )

  const derivedAdjustments = movements.filter(
    (movement) =>
      normalizeMovementType(
        movement.movement_type ?? movement.type,
      ) === 'adjustment',
  )

  const stockInQuantity = numberValue(
    nestedSummary.stock_in_quantity,
    nestedSummary.total_in_quantity,
    nestedSummary.quantity_in,
    nestedSummary.stock_in_total,
    derivedStockIn.reduce(
      (total, movement) =>
        total + getMovementQuantity(movement),
      0,
    ),
  )

  const stockOutQuantity = numberValue(
    nestedSummary.stock_out_quantity,
    nestedSummary.total_out_quantity,
    nestedSummary.quantity_out,
    nestedSummary.stock_out_total,
    derivedStockOut.reduce(
      (total, movement) =>
        total + getMovementQuantity(movement),
      0,
    ),
  )

  return {
    total_movements: numberValue(
      nestedSummary.total_movements,
      nestedSummary.movements_count,
      nestedSummary.total,
      movements.length,
    ),

    total_stock_in: numberValue(
      nestedSummary.total_stock_in,
      nestedSummary.stock_in_count,
      nestedSummary.in_count,
      derivedStockIn.length,
    ),

    total_stock_out: numberValue(
      nestedSummary.total_stock_out,
      nestedSummary.stock_out_count,
      nestedSummary.out_count,
      derivedStockOut.length,
    ),

    total_adjustments: numberValue(
      nestedSummary.total_adjustments,
      nestedSummary.adjustments_count,
      nestedSummary.adjustment_count,
      derivedAdjustments.length,
    ),

    stock_in_quantity: stockInQuantity,
    stock_out_quantity: stockOutQuantity,

    net_quantity: numberValue(
      nestedSummary.net_quantity,
      nestedSummary.net_stock,
      stockInQuantity - stockOutQuantity,
    ),
  }
}

export async function getStockMovement(
  id: number | string,
): Promise<StockMovement> {
  const response = await apiRequest<unknown>(
    `/stock-movements/${id}`,
    {
      method: 'GET',
      auth: true,
      cache: 'no-store',
    },
  )

  const movement = extractMovement(response)

  if (!movement) {
    throw new ApiError(
      'The backend did not return the requested stock movement.',
      500,
    )
  }

  return movement
}

export async function createStockMovement(
  payload: StockMovementPayload,
): Promise<{
  movement?: StockMovement
  message: string
}> {
  const response = await apiRequest<unknown>(
    '/stock-movements',
    {
      method: 'POST',
      auth: true,
      body: createMovementPayload(payload),
    },
  )

  return {
    movement: extractMovement(response),

    message: extractMessage(
      response,
      'Stock movement created successfully.',
    ),
  }
}

export async function updateStockMovement(
  id: number | string,
  payload: StockMovementUpdatePayload,
): Promise<{
  movement?: StockMovement
  message: string
}> {
  const response = await apiRequest<unknown>(
    `/stock-movements/${id}`,
    {
      method: 'PATCH',
      auth: true,
      body: {
        reason: payload.reason?.trim() || null,
        notes: payload.notes?.trim() || null,
      },
    },
  )

  return {
    movement: extractMovement(response),

    message: extractMessage(
      response,
      'Stock movement updated successfully.',
    ),
  }
}

export async function deleteStockMovement(
  id: number | string,
): Promise<string> {
  const response = await apiRequest<unknown>(
    `/stock-movements/${id}`,
    {
      method: 'DELETE',
      auth: true,
    },
  )

  return extractMessage(
    response,
    'Stock movement deleted successfully.',
  )
}

export async function restoreStockMovement(
  id: number | string,
): Promise<string> {
  const response = await apiRequest<unknown>(
    `/stock-movements/${id}/restore`,
    {
      method: 'POST',
      auth: true,
    },
  )

  return extractMessage(
    response,
    'Stock movement restored successfully.',
  )
}
