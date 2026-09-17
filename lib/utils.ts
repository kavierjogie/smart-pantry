import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { differenceInDays, format, parseISO } from 'date-fns'
import type { PantryItem } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'No expiry'
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy')
  } catch {
    return dateStr
  }
}

export function daysUntilExpiry(dateStr: string | null): number | null {
  if (!dateStr) return null
  try {
    return differenceInDays(parseISO(dateStr), new Date())
  } catch {
    return null
  }
}

export function isExpiringSoon(dateStr: string | null, days = 7): boolean {
  const d = daysUntilExpiry(dateStr)
  if (d === null) return false
  return d >= 0 && d <= days
}

export function isExpired(dateStr: string | null): boolean {
  const d = daysUntilExpiry(dateStr)
  if (d === null) return false
  return d < 0
}

export function isLowStock(item: PantryItem): boolean {
  if (item.min_quantity === null || item.min_quantity === undefined) return false
  return item.quantity <= item.min_quantity
}

export function getExpiryColor(dateStr: string | null): string {
  if (!dateStr) return 'text-muted-foreground'
  const days = daysUntilExpiry(dateStr)
  if (days === null) return 'text-muted-foreground'
  if (days < 0) return 'text-red-600'
  if (days <= 3) return 'text-red-500'
  if (days <= 7) return 'text-amber-500'
  return 'text-green-600'
}

export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    produce: '🥦',
    dairy: '🥛',
    meat: '🥩',
    seafood: '🐟',
    grains: '🌾',
    canned: '🥫',
    frozen: '🧊',
    beverages: '🥤',
    condiments: '🫙',
    snacks: '🍪',
    baking: '🫓',
    spices: '🌿',
    other: '📦',
  }
  return icons[category] || '📦'
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(amount)
}

export function formatRecipeTime(prepTime: number | null, cookingTime: number | null): string {
  if (prepTime === null || cookingTime === null) return 'Time unavailable'
  const totalMinutes = prepTime + cookingTime
  if (totalMinutes <= 0) return 'Time unavailable'
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes} min`
  if (minutes === 0) return `${hours} hr`
  return `${hours} hr ${minutes} min`
}

export function generateYouTubeSearchUrl(recipeName: string): string {
  const query = encodeURIComponent(`${recipeName} recipe cooking`)
  return `https://www.youtube.com/results?search_query=${query}`
}
