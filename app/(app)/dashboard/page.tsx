'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Package, AlertTriangle, Clock, ShoppingCart, ChefHat, Plus, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RecipeCard } from '@/components/recipes/RecipeCard'
import { createClient } from '@/lib/supabase/client'
import { getPantryItems } from '@/lib/db/pantry'
import { getShoppingItems } from '@/lib/db/shopping'
import { getTopRecipes } from '@/lib/recipes'
import { isExpiringSoon, isExpired, isLowStock, formatDate, getCategoryIcon } from '@/lib/utils'
import type { PantryItem, ShoppingItem, RecipeMatch } from '@/types'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PantryItemForm } from '@/components/pantry/PantryItemForm'
import { addPantryItem } from '@/lib/db/pantry'
import { addShoppingItem } from '@/lib/db/shopping'

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: number | string; sub?: string; color: string
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
            {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([])
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([])
  const [topRecipes, setTopRecipes] = useState<RecipeMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [addingItem, setAddingItem] = useState(false)

  const loadData = useCallback(async (uid: string) => {
    try {
      const [pantry, shopping] = await Promise.all([
        getPantryItems(uid),
        getShoppingItems(uid),
      ])
      setPantryItems(pantry)
      setShoppingItems(shopping)
      try {
        setTopRecipes(await getTopRecipes(pantry, 3))
      } catch (err) {
        console.error(err)
        toast.error(err instanceof Error ? err.message : 'Failed to load recipe suggestions')
        setTopRecipes([])
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to load dashboard data')
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

  const lowStockItems = pantryItems.filter(isLowStock)
  const expiringItems = pantryItems.filter(i => !isExpired(i.expiry_date) && isExpiringSoon(i.expiry_date))
  const expiredItems = pantryItems.filter(i => isExpired(i.expiry_date))
  const pendingShopping = shoppingItems.filter(i => !i.checked)

  const todayRecipe = topRecipes[0]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <ChefHat className="h-8 w-8 animate-pulse" />
          <p className="text-sm">Loading your pantry…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">
            {new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setAddingItem(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add item
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href="/recipes">Find recipes</Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Package}
          label="Pantry items"
          value={pantryItems.length}
          sub={`${pantryItems.length === 1 ? '1 item' : `${pantryItems.length} items`} in stock`}
          color="bg-emerald-100 text-emerald-700"
        />
        <StatCard
          icon={TrendingDown}
          label="Running low"
          value={lowStockItems.length}
          sub={lowStockItems.length > 0 ? `${lowStockItems.map(i => i.name).slice(0, 2).join(', ')}` : 'All well stocked'}
          color="bg-amber-100 text-amber-700"
        />
        <StatCard
          icon={Clock}
          label="Expiring soon"
          value={expiringItems.length + expiredItems.length}
          sub={expiredItems.length > 0 ? `${expiredItems.length} already expired` : 'Within 7 days'}
          color="bg-orange-100 text-orange-700"
        />
        <StatCard
          icon={ShoppingCart}
          label="Shopping list"
          value={pendingShopping.length}
          sub="items to buy"
          color="bg-blue-100 text-blue-700"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's suggestion */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Cook tonight</h2>
          {topRecipes.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {topRecipes.map((match) => (
                <RecipeCard
                  key={match.recipe.id}
                  match={match}
                  onAddToShopping={async (items) => {
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
                      toast.success('Added to shopping list')
                      loadData(userId)
                    } catch {
                      toast.error('Failed to add items')
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <Card className="flex flex-col items-center justify-center py-12 text-center">
              <ChefHat className="h-10 w-10 text-slate-300 mb-3" />
              <p className="font-medium text-slate-600">Add pantry items to see recipe suggestions</p>
              <Button className="mt-4" size="sm" onClick={() => setAddingItem(true)}>
                Add your first item
              </Button>
            </Card>
          )}
        </div>

        {/* Sidebar panels */}
        <div className="space-y-4">
          {/* Expiring soon */}
          {(expiringItems.length > 0 || expiredItems.length > 0) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  Use these first
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[...expiredItems, ...expiringItems].slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span>{getCategoryIcon(item.category)}</span>
                      <span className="truncate">{item.name}</span>
                    </div>
                    <Badge
                      variant={isExpired(item.expiry_date) ? 'destructive' : 'warning'}
                      className="text-xs shrink-0 ml-2"
                    >
                      {isExpired(item.expiry_date) ? 'Expired' : formatDate(item.expiry_date)}
                    </Badge>
                  </div>
                ))}
                <Link href="/pantry" className="text-xs text-emerald-600 hover:underline font-medium">
                  View all pantry items →
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Shopping list preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-blue-500" />
                Shopping list
                {pendingShopping.length > 0 && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {pendingShopping.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingShopping.length > 0 ? (
                <div className="space-y-2">
                  {pendingShopping.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      <div className="h-4 w-4 rounded border border-slate-300 shrink-0" />
                      <span className="truncate">{item.name}</span>
                      <span className="text-slate-400 text-xs ml-auto shrink-0">{item.quantity} {item.unit}</span>
                    </div>
                  ))}
                  {pendingShopping.length > 5 && (
                    <p className="text-xs text-slate-400">+{pendingShopping.length - 5} more items</p>
                  )}
                  <Link href="/shopping" className="text-xs text-emerald-600 hover:underline font-medium block mt-1">
                    View full list →
                  </Link>
                </div>
              ) : (
                <div className="text-center py-3">
                  <p className="text-sm text-slate-400">Your shopping list is empty</p>
                  <Link href="/shopping">
                    <Button variant="outline" size="sm" className="mt-2">Add items</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {[
                { label: 'Add to pantry', href: '/pantry', icon: Package },
                { label: 'Find recipes', href: '/recipes', icon: ChefHat },
                { label: 'Shopping list', href: '/shopping', icon: ShoppingCart },
                { label: 'Ask AI', href: '/assistant', icon: AlertTriangle },
              ].map((action) => (
                <Link key={action.href} href={action.href}>
                  <div className="flex flex-col items-center gap-1.5 rounded-lg border p-3 hover:bg-slate-50 transition-colors cursor-pointer text-center">
                    <action.icon className="h-5 w-5 text-emerald-600" />
                    <span className="text-xs font-medium text-slate-700">{action.label}</span>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add item dialog */}
      <Dialog open={addingItem} onOpenChange={setAddingItem}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add pantry item</DialogTitle>
          </DialogHeader>
          {userId && (
            <PantryItemForm
              userId={userId}
              onCancel={() => setAddingItem(false)}
              onSubmit={async (data) => {
                await addPantryItem(data)
                toast.success(`${data.name} added to pantry`)
                setAddingItem(false)
                loadData(userId)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
