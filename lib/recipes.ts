import { getRecipesForPantry } from '@/lib/recipe-api'
import type { PantryItem, Recipe, RecipeMatch, RecipeIngredient } from '@/types'

function normalizeIngredientName(name: string): string {
  return name.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(?:fresh|dried|ground|raw|cooked|chopped|minced|sliced)\b/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((part) => part.length > 1)
    .join(' ')
}

function convertToBaseQuantity(quantity: number, unit: string): number {
  const normalized = unit.toLowerCase().trim()
  const factors: Record<string, number> = {
    g: 1,
    kg: 1000,
    mg: 0.001,
    ml: 1,
    l: 1000,
    tsp: 5,
    tbsp: 15,
    cup: 240,
    oz: 28.3495,
    lb: 453.592,
    pcs: 1,
    pc: 1,
    piece: 1,
    pieces: 1,
    clove: 1,
    cloves: 1,
    bunch: 1,
    bunches: 1,
    slice: 1,
    slices: 1,
    can: 1,
    cans: 1,
    bag: 1,
    bags: 1,
    box: 1,
    boxes: 1,
    bottle: 1,
    bottles: 1,
    pack: 1,
    packs: 1,
    sprig: 1,
    sprigs: 1,
    pinch: 0.25,
    '': 1,
  }

  return quantity * (factors[normalized] ?? 1)
}

function ingredientMatchStrength(itemName: string, ingredientName: string): number {
  const itemNorm = normalizeIngredientName(itemName)
  const ingredientNorm = normalizeIngredientName(ingredientName)

  if (!itemNorm || !ingredientNorm) return 0
  if (itemNorm === ingredientNorm) return 3
  if (itemNorm.includes(ingredientNorm) || ingredientNorm.includes(itemNorm)) return 2

  const semanticGroups = [
    ['fish', 'seafood', 'salmon', 'cod', 'tuna', 'trout', 'haddock', 'mackerel', 'sardine', 'anchovy', 'shrimp', 'prawn'],
    ['vegetable', 'vegetables', 'produce'],
  ]
  if (semanticGroups.some((group) => group.includes(itemNorm) && group.includes(ingredientNorm))) return 2

  const itemTokens = new Set(itemNorm.split(' '))
  const ingredientTokens = ingredientNorm.split(' ')
  const sharedTokens = ingredientTokens.filter((token) => itemTokens.has(token))

  return sharedTokens.length > 0 ? 1 : 0
}

function findPantryMatch(
  pantryItems: PantryItem[],
  ingredient: RecipeIngredient
): { pantryItem: PantryItem; availableQuantity: number; requiredQuantity: number; coverageRatio: number } | null {
  const requiredQuantity = convertToBaseQuantity(ingredient.quantity, ingredient.unit)
  const candidates = pantryItems
    .map((item) => {
      const strength = ingredientMatchStrength(item.name, ingredient.name)
      if (strength === 0) return null

      const availableQuantity = convertToBaseQuantity(item.quantity, item.unit)
      const coverageRatio = requiredQuantity > 0 ? Math.min(availableQuantity / requiredQuantity, 1) : 1

      return {
        pantryItem: item,
        availableQuantity,
        requiredQuantity,
        coverageRatio,
        strength,
      }
    })
    .filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null)
    .sort((a, b) => {
      if (b.strength !== a.strength) return b.strength - a.strength
      if (b.coverageRatio !== a.coverageRatio) return b.coverageRatio - a.coverageRatio
      return b.availableQuantity - a.availableQuantity
    })

  return candidates[0] ?? null
}

export function matchRecipesToPantry(
  pantryItems: PantryItem[],
  recipes: Recipe[] = [],
  dietaryFilters: string[] = []
): RecipeMatch[] {
  const activeFilters = dietaryFilters.filter((f) => f.trim().length > 0)

  return recipes
    .filter((recipe) => {
      if (activeFilters.length === 0) return true
      const tags = new Set((recipe.dietary_tags ?? []).map((t) => t.toLowerCase()))
      return activeFilters.every((f) => tags.has(f.toLowerCase()))
    })
    .map((recipe) => {
      const required = recipe.ingredients.filter((i) => !i.optional)
      const available: string[] = []
      const missing: RecipeIngredient[] = []
      let weightedCoverage = 0
      let readyNowCount = 0

      for (const ing of required) {
        const match = findPantryMatch(pantryItems, ing)

        if (match) {
          available.push(ing.name)
          weightedCoverage += match.coverageRatio
          if (match.coverageRatio >= 1) readyNowCount += 1
        } else {
          missing.push(ing)
        }
      }

      const matchPercentage =
        required.length > 0
          ? Math.min(100, Math.round((weightedCoverage / required.length) * 100))
          : 100

      return {
        recipe,
        availableIngredients: available,
        missingIngredients: missing,
        matchPercentage,
        _readyNowCount: readyNowCount,
      } as RecipeMatch & { _readyNowCount: number }
    })
    .sort((a, b) => {
      if (b.matchPercentage !== a.matchPercentage) return b.matchPercentage - a.matchPercentage
      if (b._readyNowCount !== a._readyNowCount) return b._readyNowCount - a._readyNowCount
      return b.availableIngredients.length - a.availableIngredients.length
    })
    .map(({ _readyNowCount, ...match }) => match)
}

export async function getTopRecipes(
  pantryItems: PantryItem[],
  count = 3,
  dietaryFilters: string[] = []
): Promise<RecipeMatch[]> {
  const recipes = await getRecipesForPantry(pantryItems, dietaryFilters)
  return matchRecipesToPantry(pantryItems, recipes, dietaryFilters).slice(0, count)
}
