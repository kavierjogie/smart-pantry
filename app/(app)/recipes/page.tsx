'use client'

import { useEffect, useState, useCallback } from 'react'
import { BookOpen, Filter } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RecipeCard } from '@/components/recipes/RecipeCard'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { TogglePill } from '@/components/ui/toggle-pill'
import { createClient } from '@/lib/supabase/client'
import { getPantryItems } from '@/lib/db/pantry'
import { addShoppingItem } from '@/lib/db/shopping'
import { matchRecipesToPantry } from '@/lib/recipes'
import { getRecipesForPantry } from '@/lib/recipe-api'
import type { PantryItem, Recipe, RecipeMatch, ShoppingItem } from '@/types'
import { toast } from 'sonner'

const DIETARY_FILTERS = [
  'vegetarian', 'vegan', 'gluten-free', 'dairy-free',
  'keto', 'high-protein', 'low-carb',
]

const SORT_OPTIONS = [
  { value: 'match', label: 'Best match' },
  { value: 'difficulty', label: 'Easiest first' },
]

export default function RecipesPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [dietaryFilters, setDietaryFilters] = useState<string[]>([])
  const [sort, setSort] = useState('match')
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false)

  const loadData = useCallback(async (uid: string) => {
    try {
      const pantry = await getPantryItems(uid)
      // Fetch the broadest recipe set from the API and let the client-side
      // filter own dietary matching, so toggling filters afterward isn't
      // limited to whatever the initial profile preferences happened to be.
      const fetchedRecipes = await getRecipesForPantry(pantry, [])
      setPantryItems(pantry)
      setRecipes(fetchedRecipes)
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Failed to load recipes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        loadData(user.id)
      }
    })
  }, [loadData])

  function toggleDietary(tag: string) {
    setDietaryFilters((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  function getSorted(items: RecipeMatch[]) {
    const filtered = showOnlyAvailable ? items.filter(m => m.matchPercentage === 100) : items
    return [...filtered].sort((a, b) => {
      if (sort === 'match') return b.matchPercentage - a.matchPercentage
      if (sort === 'difficulty') {
        const d = { easy: 0, medium: 1, hard: 2 }
        return d[a.recipe.difficulty] - d[b.recipe.difficulty]
      }
      return 0
    })
  }

  const sorted = getSorted(matchRecipesToPantry(pantryItems, recipes, dietaryFilters))

  async function handleAddToShopping(items: Partial<ShoppingItem>[]) {
    if (!userId) return
    try {
      for (const item of items) {
        await addShoppingItem({
          user_id: userId,
          name: item.name!,
          quantity: item.quantity || 1,
          unit: item.unit || 'pcs',
          category: item.category || 'other',
          checked: false,
          recipe_id: null,
          recipe_name: item.recipe_name || null,
          notes: null,
        })
      }
      toast.success('Missing ingredients added to shopping list')
    } catch {
      toast.error('Failed to add items')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Recipes</h1>
        <p className="text-slate-500 text-sm mt-1">
          Matched against your {pantryItems.length} pantry items
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-3 border rounded-lg bg-slate-50 p-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Filter className="h-4 w-4" />
            <span className="font-medium">Dietary:</span>
          </div>
          {DIETARY_FILTERS.map((tag) => (
            <TogglePill key={tag} active={dietaryFilters.includes(tag)} onClick={() => toggleDietary(tag)}>
              {tag}
            </TogglePill>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <button
            onClick={() => setShowOnlyAvailable(!showOnlyAvailable)}
            className={`rounded-lg px-3 py-2 text-sm font-medium border transition-colors ${
              showOnlyAvailable
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
            }`}
          >
            Can make now only
          </button>

          {dietaryFilters.length > 0 && (
            <button
              onClick={() => setDietaryFilters([])}
              className="text-xs text-slate-400 hover:text-slate-600 underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No recipes match your current filters"
          description="Try removing some dietary filters or add more pantry items"
        />
      ) : (
        <>
          <p className="text-sm text-slate-500">{sorted.length} recipes found</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map((match) => (
              <RecipeCard
                key={match.recipe.id}
                match={match}
                onAddToShopping={handleAddToShopping}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
