import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface RatingItem {
  rating: number
}

export function computeAverageRating<T extends RatingItem>(items: T[]): number {
  if (items.length === 0) return 0
  const sum = items.reduce((acc, item) => acc + item.rating, 0)
  return parseFloat((sum / items.length).toFixed(1))
}
