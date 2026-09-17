'use client'

import { useState } from 'react'
import { Clock, ChefHat, CheckCircle2, XCircle, Play, Bookmark, ShoppingCart } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { generateYouTubeSearchUrl, formatRecipeTime } from '@/lib/utils'
import type { RecipeMatch, ShoppingItem } from '@/types'

type Props = {
  match: RecipeMatch
  onSave?: () => void
  onAddToShopping?: (items: Partial<ShoppingItem>[]) => void
  isSaved?: boolean
}

const difficultyColor = {
  easy: 'success',
  medium: 'warning',
  hard: 'destructive',
} as const

export function RecipeCard({ match, onSave, onAddToShopping, isSaved }: Props) {
  const [open, setOpen] = useState(false)
  const { recipe, availableIngredients, missingIngredients, matchPercentage } = match

  function handleAddMissing() {
    if (!onAddToShopping) return
    onAddToShopping(
      missingIngredients.map((ing) => ({
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit as ShoppingItem['unit'],
        category: 'other' as const,
        recipe_name: recipe.name,
        checked: false,
      }))
    )
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setOpen(true)}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-snug">{recipe.name}</CardTitle>
            <Badge variant={difficultyColor[recipe.difficulty]} className="shrink-0 capitalize">
              {recipe.difficulty}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 line-clamp-2">{recipe.description}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>{availableIngredients.length} of {recipe.ingredients.filter(i => !i.optional).length} ingredients on hand</span>
              <span className="font-medium">{matchPercentage}%</span>
            </div>
            <Progress value={matchPercentage} className="h-1.5" />
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatRecipeTime(recipe.prep_time, recipe.cooking_time)}
            </div>
            <div className="flex items-center gap-1">
              <ChefHat className="h-3.5 w-3.5" />
              {recipe.cuisine}
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            {(recipe.dietary_tags ?? []).slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs capitalize">{tag}</Badge>
            ))}
          </div>

          {missingIngredients.length > 0 && (
            <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-2 py-1.5">
              Missing: {missingIngredients.slice(0, 2).map(i => i.name).join(', ')}
              {missingIngredients.length > 2 && ` +${missingIngredients.length - 2} more`}
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{recipe.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <p className="text-slate-600">{recipe.description}</p>

            <div className="flex flex-wrap gap-2">
              <Badge variant={difficultyColor[recipe.difficulty]} className="capitalize">{recipe.difficulty}</Badge>
              <Badge variant="secondary">{recipe.cuisine}</Badge>
              <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />{formatRecipeTime(recipe.prep_time, recipe.cooking_time)}</Badge>
              <Badge variant="outline">Serves {recipe.servings}</Badge>
              {(recipe.dietary_tags ?? []).map(t => (
                <Badge key={t} variant="info" className="capitalize">{t}</Badge>
              ))}
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-slate-900">Ingredients</h4>
              <div className="grid gap-1.5">
                {recipe.ingredients.map((ing) => {
                  const have = availableIngredients.includes(ing.name)
                  return (
                    <div key={ing.name} className="flex items-center gap-2 text-sm">
                      {have ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                      )}
                      <span className={have ? 'text-slate-800' : 'text-slate-400'}>
                        {ing.quantity} {ing.unit} {ing.name}
                        {ing.optional && <span className="text-xs text-slate-400 ml-1">(optional)</span>}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-slate-900">Instructions</h4>
              <ol className="space-y-2">
                {recipe.instructions.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-700">
                    <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 font-semibold text-xs">
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {missingIngredients.length > 0 && onAddToShopping && (
                <Button variant="outline" size="sm" className="gap-2" onClick={handleAddMissing}>
                  <ShoppingCart className="h-4 w-4" />
                  Add {missingIngredients.length} missing to shopping list
                </Button>
              )}
              {onSave && (
                <Button variant="outline" size="sm" className="gap-2" onClick={onSave} disabled={isSaved}>
                  <Bookmark className="h-4 w-4" />
                  {isSaved ? 'Saved' : 'Save recipe'}
                </Button>
              )}
              <a
                href={generateYouTubeSearchUrl(recipe.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Play className="h-4 w-4" />
                Watch on YouTube
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
