import type { PantryItem, Recipe } from '@/types'
import { isDemoMode } from '@/lib/demo'
import { SAMPLE_RECIPES } from '@/lib/data'

export async function getRecipesForPantry(
  pantryItems: PantryItem[],
  dietaryFilters: string[] = []
): Promise<Recipe[]> {
  if (!isDemoMode()) return fetchRecipes(pantryItems, dietaryFilters)
  // Demo: local recipes always work; live TheMealDB results are a bonus when reachable.
  const live = await fetchRecipes(pantryItems, dietaryFilters).catch(() => [])
  return [...SAMPLE_RECIPES, ...live]
}

async function fetchRecipes(
  pantryItems: PantryItem[],
  dietaryFilters: string[] = []
): Promise<Recipe[]> {
  if (pantryItems.length === 0) return []

  const params = new URLSearchParams({
    ingredients: pantryItems.map((item) => item.name).join(','),
  })
  if (dietaryFilters.length > 0) params.set('dietary', dietaryFilters.join(','))

  const response = await fetch(`/api/recipes?${params}`, { cache: 'no-store' })
  const data: unknown = await response.json()
  if (!response.ok) {
    const message = data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
      ? data.error
      : 'Failed to search for recipes.'
    throw new Error(message)
  }
  const recipes = data && typeof data === 'object' && 'recipes' in data
    ? data.recipes
    : null
  if (!Array.isArray(recipes)) {
    throw new Error('Recipe search returned invalid data.')
  }
  return recipes as Recipe[]
}