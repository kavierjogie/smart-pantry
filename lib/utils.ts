import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { differenceInDays, format, parseISO } from 'date-fns'
import {
  Carrot, Milk, Beef, Fish, Wheat, Package,
  Snowflake, CupSoda, Droplet, Cookie, Croissant, Leaf,
  type LucideIcon,
} from 'lucide-react'
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

export function getCategoryIcon(category: string): LucideIcon {
  const icons: Record<string, LucideIcon> = {
    produce: Carrot,
    dairy: Milk,
    meat: Beef,
    seafood: Fish,
    grains: Wheat,
    canned: Package,
    frozen: Snowflake,
    beverages: CupSoda,
    condiments: Droplet,
    snacks: Cookie,
    baking: Croissant,
    spices: Leaf,
    other: Package,
  }
  return icons[category] || Package
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(amount)
}

export function generateYouTubeSearchUrl(recipeName: string): string {
  const query = encodeURIComponent(`${recipeName} recipe cooking`)
  return `https://www.youtube.com/results?search_query=${query}`
}
