import type { FoodItem } from '@/types/food-item'

export function isFoodItemAvailable(
  foodItem: FoodItem,
): boolean {
  if (foodItem.deleted_at) {
    return false
  }

  if (foodItem.is_available !== undefined) {
    return ![
      false,
      0,
      '0',
      'false',
      'unavailable',
      'inactive',
    ].includes(foodItem.is_available)
  }

  return ![
    'unavailable',
    'inactive',
    'disabled',
  ].includes(String(foodItem.status ?? '').toLowerCase())
}

export function getFoodItemCategoryId(
  foodItem: FoodItem,
): string {
  const categoryId =
    foodItem.category_id ??
    foodItem.food_category_id ??
    foodItem.category?.id ??
    foodItem.food_category?.id

  return categoryId === undefined || categoryId === null
    ? ''
    : String(categoryId)
}

export function getFoodItemCategoryName(
  foodItem: FoodItem,
): string {
  return (
    foodItem.category?.name ??
    foodItem.food_category?.name ??
    'Uncategorized'
  )
}

export function getFoodItemImageUrl(
  foodItem: FoodItem,
): string | null {
  const image =
    foodItem.image_url ??
    foodItem.photo_url ??
    foodItem.image

  if (!image) {
    return null
  }

  if (
    image.startsWith('http://') ||
    image.startsWith('https://') ||
    image.startsWith('data:') ||
    image.startsWith('blob:')
  ) {
    return image
  }

  const storageUrl = (
    process.env.NEXT_PUBLIC_STORAGE_URL ??
    'http://localhost:8000/storage'
  ).replace(/\/$/, '')

  const normalizedImage = image
    .replace(/^\/+/, '')
    .replace(/^storage\//, '')

  return `${storageUrl}/${normalizedImage}`
}

export function formatFoodPrice(
  value: number | string,
): string {
  const amount = Number(value)

  if (Number.isNaN(amount)) {
    return `${value} RWF`
  }

  return `${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(amount)} RWF`
}
