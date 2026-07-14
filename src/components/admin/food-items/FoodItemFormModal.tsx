'use client'

import {
  CheckCircle2,
  ImagePlus,
  LoaderCircle,
  UtensilsCrossed,
  X,
} from 'lucide-react'
import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import {
  getFoodItemCategoryId,
  getFoodItemImageUrl,
  isFoodItemAvailable,
} from '@/lib/food-item'
import type { FoodCategory } from '@/types/food-category'
import type {
  FoodItem,
  FoodItemPayload,
} from '@/types/food-item'

interface FoodItemFormModalProps {
  isOpen: boolean
  foodItem?: FoodItem | null
  categories: FoodCategory[]
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (
    payload: FoodItemPayload,
  ) => Promise<void>
}

export default function FoodItemFormModal({
  isOpen,
  foodItem,
  categories,
  isSubmitting,
  onClose,
  onSubmit,
}: FoodItemFormModalProps) {
  const [categoryId, setCategoryId] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] =
    useState('')
  const [price, setPrice] = useState('')
  const [isAvailable, setIsAvailable] =
    useState(true)

  const [image, setImage] =
    useState<File | null>(null)

  const [imagePreview, setImagePreview] =
    useState<string | null>(null)

  const [originalImage, setOriginalImage] =
    useState<string | null>(null)

  const [formError, setFormError] =
    useState('')

  const editing = Boolean(foodItem)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const existingImage = foodItem
      ? getFoodItemImageUrl(foodItem)
      : null

    setCategoryId(
      foodItem
        ? getFoodItemCategoryId(foodItem)
        : '',
    )

    setName(foodItem?.name ?? '')
    setDescription(foodItem?.description ?? '')

    setPrice(
      foodItem?.price === undefined
        ? ''
        : String(foodItem.price),
    )

    setIsAvailable(
      foodItem
        ? isFoodItemAvailable(foodItem)
        : true,
    )

    setImage(null)
    setOriginalImage(existingImage)
    setImagePreview(existingImage)
    setFormError('')
  }, [isOpen, foodItem])

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  function handleImageChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const selectedImage =
      event.target.files?.[0] ?? null

    if (!selectedImage) {
      return
    }

    if (!selectedImage.type.startsWith('image/')) {
      setFormError(
        'Please select a JPG, PNG or WEBP image.',
      )
      return
    }

    if (selectedImage.size > 5 * 1024 * 1024) {
      setFormError(
        'The selected image must be smaller than 5 MB.',
      )
      return
    }

    if (imagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview)
    }

    setImage(selectedImage)
    setImagePreview(
      URL.createObjectURL(selectedImage),
    )
    setFormError('')
  }

  function clearNewImage() {
    if (imagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview)
    }

    setImage(null)
    setImagePreview(originalImage)
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setFormError('')

    if (!categoryId) {
      setFormError(
        'Please select a food category.',
      )
      return
    }

    if (!name.trim()) {
      setFormError(
        'Food item name is required.',
      )
      return
    }

    const numericPrice = Number(price)

    if (
      !price ||
      Number.isNaN(numericPrice) ||
      numericPrice < 0
    ) {
      setFormError(
        'Please enter a valid food item price.',
      )
      return
    }

    try {
      await onSubmit({
        food_category_id: categoryId,
        name: name.trim(),
        description: description.trim(),
        price,
        is_available: isAvailable,
        image,
      })
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Unable to save the food item.',
      )
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4">
      <button
        type="button"
        aria-label="Close food item form"
        onClick={onClose}
        disabled={isSubmitting}
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="relative z-10 my-auto w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <UtensilsCrossed className="h-5 w-5" />
            </span>

            <div>
              <h2 className="font-extrabold text-slate-950">
                {editing
                  ? 'Update Food Item'
                  : 'Create Food Item'}
              </h2>

              <p className="text-xs text-slate-500">
                Upload the food image and enter the
                item information.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="max-h-[calc(100vh-130px)] overflow-y-auto p-6"
        >
          {formError && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[230px_1fr]">
            <div>
              <p className="mb-2 text-sm font-bold text-slate-700">
                Food image
              </p>

              <label className="group flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 transition hover:border-indigo-300 hover:bg-indigo-50">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Food image preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <>
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm">
                      <ImagePlus className="h-6 w-6" />
                    </span>

                    <p className="mt-3 text-sm font-bold text-slate-700">
                      Select an image
                    </p>

                    <p className="mt-1 px-4 text-center text-xs text-slate-400">
                      JPG, PNG or WEBP. Maximum 5 MB.
                    </p>
                  </>
                )}

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  disabled={isSubmitting}
                  className="hidden"
                />
              </label>

              {image && (
                <button
                  type="button"
                  onClick={clearNewImage}
                  disabled={isSubmitting}
                  className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel new image
                </button>
              )}

              {editing && !image && originalImage && (
                <p className="mt-3 text-center text-xs text-slate-400">
                  Select another image to replace the
                  current image.
                </p>
              )}
            </div>

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="food-category"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Food category
                </label>

                <select
                  id="food-category"
                  value={categoryId}
                  onChange={(event) =>
                    setCategoryId(event.target.value)
                  }
                  required
                  disabled={isSubmitting}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                >
                  <option value="">
                    Select category
                  </option>

                  {categories
                    .filter(
                      (category) =>
                        !category.deleted_at,
                    )
                    .map((category) => (
                      <option
                        key={category.id}
                        value={String(category.id)}
                      >
                        {category.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="food-name"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Food item name
                </label>

                <input
                  id="food-name"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Example: Rice and Chicken"
                  required
                  disabled={isSubmitting}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label
                  htmlFor="food-price"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Price in RWF
                </label>

                <input
                  id="food-price"
                  type="number"
                  min="0"
                  step="1"
                  value={price}
                  onChange={(event) =>
                    setPrice(event.target.value)
                  }
                  placeholder="Example: 3500"
                  required
                  disabled={isSubmitting}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label
                  htmlFor="food-description"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Description
                </label>

                <textarea
                  id="food-description"
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder="Describe the food item..."
                  rows={4}
                  disabled={isSubmitting}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                />
              </div>

              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Available for ordering
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Users can order this food item when
                    enabled.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(event) =>
                    setIsAvailable(
                      event.target.checked,
                    )
                  }
                  disabled={isSubmitting}
                  className="h-5 w-5 accent-indigo-600"
                />
              </label>
            </div>
          </div>

          <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />

                  {editing
                    ? 'Update Food Item'
                    : 'Create Food Item'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
