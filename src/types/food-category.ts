export interface FoodCategory {
  id: number | string
  name: string
  description?: string | null
  is_active?: boolean | number | string
  status?: string | null
  food_items_count?: number
  deleted_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface FoodCategoryPayload {
  name: string
  description?: string
  is_active: boolean
}

export interface FoodCategoryListResult {
  categories: FoodCategory[]
  current_page?: number
  last_page?: number
  per_page?: number
  total?: number
}
