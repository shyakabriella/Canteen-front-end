export interface FoodItemCategory {
  id: number | string
  name: string
}

export interface FoodItem {
  id: number | string
  food_category_id?: number | string | null
  category_id?: number | string | null
  category?: FoodItemCategory | null
  food_category?: FoodItemCategory | null

  name: string
  slug?: string | null
  sku?: string | null
  description?: string | null

  price: number | string
  cost_price?: number | string | null
  unit?: string | null

  image?: string | null
  image_url?: string | null
  photo_url?: string | null

  low_stock_quantity?: number | string | null
  preparation_time_minutes?: number | string | null
  sort_order?: number | string | null

  is_available?: boolean | number | string
  status?: string | null

  deleted_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface FoodItemPayload {
  food_category_id: string
  name: string
  description: string
  price: string
  is_available: boolean
  image?: File | null

  sku?: string
  cost_price?: string
  unit?: string
  low_stock_quantity?: string
  status?: 'active' | 'inactive'
  preparation_time_minutes?: string
  sort_order?: string
}

export interface FoodItemListParams {
  search?: string
  categoryId?: string
  availability?: '' | 'available' | 'unavailable'
  includeDeleted?: boolean
  page?: number
  perPage?: number
}

export interface FoodItemListResult {
  foodItems: FoodItem[]
  current_page?: number
  last_page?: number
  per_page?: number
  total?: number
}
