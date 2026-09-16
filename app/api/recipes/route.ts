import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Recipe, RecipeDifficulty, RecipeIngredient } from '@/types'

const THEMEALDB_BASE_URL = process.env.THEMEALDB_API_BASE_URL || 'https://www.themealdb.com/api/json/v1/1'
const REQUEST_TIMEOUT_MS = 15_000
const MAX_INGREDIENTS = 8
const MAX_RECIPES = 24

type MealSummary = {
  strMeal?: unknown
  strMealThumb?: unknown
  idMeal?: unknown
  strArea?: unknown
}

type MealDetails = MealSummary & Record<string, unknown>

const CATEGORY_ALIASES: Record<string, string> = {
  fish: 'Seafood', seafood: 'Seafood', vegetable: 'Vegetarian', vegetables: 'Vegetarian',
  chicken: 'Chicken', beef: 'Beef', pork: 'Pork', lamb: 'Lamb',
}
const ANIMAL_INGREDIENTS = /beef|chicken|pork|lamb|goat|turkey|duck|ham|bacon|sausage|anchov|cod|fish|haddock|mackerel|salmon|sardine|shrimp|prawn|tuna|trout|crab|lobster|mussel|clam|oyster|squid|octopus|egg|milk|cream|cheese|butter|yogurt|honey/i
const DAIRY_INGREDIENTS = /milk|cream|cheese|butter|yogurt|ghee|whey/i
const GLUTEN_INGREDIENTS = /flour|bread|pasta|noodle|couscous|barley|rye|wheat|soy sauce/i

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

function normalizeDietaryTag(value: string): string {
  const tag = value.toLowerCase().trim().replace(/\s+/g, '-')
  return tag === 'ketogenic' ? 'keto' : tag
}

function getDifficulty(minutes: number): RecipeDifficulty {
  if (minutes <= 30) return 'easy'
  if (minutes <= 60) return 'medium'
  return 'hard'
}

function parseIngredients(meal: MealDetails): RecipeIngredient[] {
  const ingredients: RecipeIngredient[] = []
  for (let index = 1; index <= 20; index += 1) {
    const name = meal[`strIngredient${index}`]
    if (typeof name !== 'string' || !name.trim()) continue
    const measure = meal[`strMeasure${index}`]
    const unit = typeof measure === 'string' && measure.trim() ? measure.trim() : 'pcs'
    ingredients.push({ name: name.trim(), quantity: 1, unit })
  }
  return ingredients
}

function getDietaryTags(ingredients: RecipeIngredient[]): string[] {
  const names = ingredients.map((ingredient) => ingredient.name).join(' ')
  const tags: string[] = []
  if (!ANIMAL_INGREDIENTS.test(names)) tags.push('vegetarian', 'vegan')
  if (!DAIRY_INGREDIENTS.test(names)) tags.push('dairy-free')
  if (!GLUTEN_INGREDIENTS.test(names)) tags.push('gluten-free', 'low-carb')
  return [...new Set(tags)].map(normalizeDietaryTag)
}

function toRecipe(meal: MealDetails): Recipe | null {
  if (typeof meal.idMeal !== 'string' || typeof meal.strMeal !== 'string') return null
  const ingredients = parseIngredients(meal)
  if (ingredients.length === 0) return null
  const instructions = typeof meal.strInstructions === 'string'
    ? meal.strInstructions.split(/\r?\n+/).map(stripHtml).filter(Boolean)
    : []
  const tags = typeof meal.strTags === 'string'
    ? meal.strTags.split(',').map(normalizeDietaryTag).filter(Boolean)
    : []
  return {
    id: `themealdb-${meal.idMeal}`,
    name: meal.strMeal.trim(),
    description: `${typeof meal.strArea === 'string' && meal.strArea ? `${meal.strArea} cuisine` : 'TheMealDB recipe'} matched to your pantry.`,
    ingredients,
    instructions,
    cooking_time: 0,
    prep_time: 0,
    servings: 1,
    difficulty: getDifficulty(0),
    dietary_tags: [...new Set([...tags, ...getDietaryTags(ingredients)])],
    cuisine: typeof meal.strArea === 'string' && meal.strArea.trim() ? meal.strArea.trim() : 'International',
    image_url: typeof meal.strMealThumb === 'string' ? meal.strMealThumb : null,
    created_at: new Date().toISOString(),
  }
}

function matchesDietaryFilters(recipe: Recipe, filters: string[]): boolean {
  if (filters.length === 0) return true
  return filters.some((filter) => recipe.dietary_tags.includes(normalizeDietaryTag(filter)))
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS), headers: { Accept: 'application/json' } })
  if (response.status === 429) throw new Error('RATE_LIMITED')
  if (!response.ok) throw new Error(`UPSTREAM_${response.status}`)
  return response.json()
}

async function searchIngredient(ingredient: string): Promise<MealSummary[]> {
  const data = await fetchJson(`${THEMEALDB_BASE_URL}/filter.php?${new URLSearchParams({ i: ingredient })}`)
  const meals = data && typeof data === 'object' && 'meals' in data ? data.meals : null
  return Array.isArray(meals) ? meals.filter((meal): meal is MealSummary => !!meal && typeof meal === 'object') : []
}

async function searchCategory(category: string): Promise<MealSummary[]> {
  const data = await fetchJson(`${THEMEALDB_BASE_URL}/filter.php?${new URLSearchParams({ c: category })}`)
  const meals = data && typeof data === 'object' && 'meals' in data ? data.meals : null
  return Array.isArray(meals) ? meals.filter((meal): meal is MealSummary => !!meal && typeof meal === 'object') : []
}

async function getMealDetails(id: string): Promise<MealDetails | null> {
  const data = await fetchJson(`${THEMEALDB_BASE_URL}/lookup.php?${new URLSearchParams({ i: id })}`)
  const meals = data && typeof data === 'object' && 'meals' in data ? data.meals : null
  const meal = Array.isArray(meals) ? meals[0] : null
  return meal && typeof meal === 'object' ? meal as MealDetails : null
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const ingredients: string[] = request.nextUrl.searchParams.get('ingredients')
      ?.split(',').map((ingredient: string) => ingredient.trim().toLowerCase()).filter(Boolean).slice(0, MAX_INGREDIENTS) || []
    const dietaryFilters: string[] = request.nextUrl.searchParams.get('dietary')
      ?.split(',').map((filter: string) => filter.trim()).filter(Boolean) || []
    if (ingredients.length === 0) return NextResponse.json({ recipes: [] })

    const searches = await Promise.all(ingredients.map(async (ingredient: string) => {
      const direct = await searchIngredient(ingredient)
      const category = CATEGORY_ALIASES[ingredient]
      const fallback = category ? await searchCategory(category) : []
      return [...direct, ...fallback]
    }))
    const ids: string[] = [...new Set(searches.flat().map((meal: MealSummary) => meal.idMeal).filter((id: unknown): id is string => typeof id === 'string'))].slice(0, MAX_RECIPES)
    if (ids.length === 0) return NextResponse.json({ recipes: [] })

    const details = await Promise.all(ids.map(async (id) => {
      try { return await getMealDetails(id) } catch (error) {
        if (error instanceof Error && error.message === 'RATE_LIMITED') throw error
        return null
      }
    }))
    const recipes = details
      .filter((meal): meal is MealDetails => meal !== null)
      .map(toRecipe)
      .filter((recipe): recipe is Recipe => recipe !== null)
      .filter((recipe) => matchesDietaryFilters(recipe, dietaryFilters))

    return NextResponse.json({ recipes }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    if (error instanceof Error && error.message === 'RATE_LIMITED') {
      return NextResponse.json({ error: 'Recipe search is temporarily rate-limited. Please try again shortly.' }, { status: 429 })
    }
    if (error instanceof Error && error.name === 'TimeoutError') {
      return NextResponse.json({ error: 'Recipe search took too long to respond. Please try again.' }, { status: 504 })
    }
    console.error('TheMealDB recipe API error:', error)
    return NextResponse.json({ error: 'Recipe search is temporarily unavailable. Please try again.' }, { status: 502 })
  }
}
