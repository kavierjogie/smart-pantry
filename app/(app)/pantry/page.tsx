'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PantryItemCard } from '@/components/pantry/PantryItemCard'
import { PantryItemForm } from '@/components/pantry/PantryItemForm'
import { createClient } from '@/lib/supabase/client'
import { getPantryItems, addPantryItem, updatePantryItem, deletePantryItem } from '@/lib/db/pantry'
import { CATEGORIES } from '@/lib/data'
import { isLowStock, isExpiringSoon, isExpired } from '@/lib/utils'
import type { PantryItem } from '@/types'
import { toast } from 'sonner'

type SortKey = 'name' | 'expiry' | 'category' | 'quantity'

export default function PantryPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [items, setItems] = useState<PantryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sort, setSort] = useState<SortKey>('name')
  const [addingItem, setAddingItem] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  const loadItems = useCallback(async (uid: string) => {
    try {
      const data = await getPantryItems(uid)
      setItems(data)
    } catch {
      toast.error('Failed to load pantry')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        loadItems(user.id)
      }
    })
  }, [loadItems])

  async function handleAdd(data: Omit<PantryItem, 'id' | 'created_at' | 'updated_at'>) {
    await addPantryItem(data)
    toast.success(`${data.name} added to pantry`)
    setAddingItem(false)
    if (userId) loadItems(userId)
  }

  async function handleUpdate(id: string, data: Partial<PantryItem>) {
    await updatePantryItem(id, data)
    toast.success('Item updated')
    if (userId) loadItems(userId)
  }

  async function handleDelete(id: string) {
    const item = items.find(i => i.id === id)
    await deletePantryItem(id)
    toast.success(`${item?.name || 'Item'} removed`)
    if (userId) loadItems(userId)
  }

  function filterItems(items: PantryItem[]) {
    let filtered = items

    // Tab filter
    if (activeTab === 'low') filtered = filtered.filter(isLowStock)
    else if (activeTab === 'expiring') filtered = filtered.filter(i => isExpiringSoon(i.expiry_date) || isExpired(i.expiry_date))

    // Category filter
    if (categoryFilter !== 'all') filtered = filtered.filter(i => i.category === categoryFilter)

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      filtered = filtered.filter(i => i.name.toLowerCase().includes(q))
    }

    // Sort
    return filtered.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name)
      if (sort === 'expiry') {
        if (!a.expiry_date && !b.expiry_date) return 0
        if (!a.expiry_date) return 1
        if (!b.expiry_date) return -1
        return a.expiry_date.localeCompare(b.expiry_date)
      }
      if (sort === 'category') return a.category.localeCompare(b.category)
      if (sort === 'quantity') return a.quantity - b.quantity
      return 0
    })
  }

  const filtered = filterItems(items)
  const lowCount = items.filter(isLowStock).length
  const expiringCount = items.filter(i => isExpiringSoon(i.expiry_date) || isExpired(i.expiry_date)).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pantry</h1>
          <p className="text-slate-500 text-sm mt-1">{items.length} items in stock</p>
        </div>
        <Button onClick={() => setAddingItem(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add item
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All ({items.length})</TabsTrigger>
          <TabsTrigger value="low">Low stock ({lowCount})</TabsTrigger>
          <TabsTrigger value="expiring">Expiring ({expiringCount})</TabsTrigger>
        </TabsList>

        <div className="flex gap-2 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              className="pl-9"
              placeholder="Search pantry…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="expiry">Expiry</SelectItem>
              <SelectItem value="category">Category</SelectItem>
              <SelectItem value="quantity">Quantity</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value={activeTab} className="mt-4">
          {loading ? (
            <div className="grid gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="h-12 w-12 text-slate-200 mb-4" />
              <p className="font-medium text-slate-500">
                {search || categoryFilter !== 'all'
                  ? 'No items match your filters'
                  : 'Your pantry is empty'}
              </p>
              {!search && categoryFilter === 'all' && (
                <Button className="mt-4" onClick={() => setAddingItem(true)}>
                  Add your first item
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-3">
              {filtered.map((item) => (
                <PantryItemCard
                  key={item.id}
                  item={item}
                  userId={userId!}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={addingItem} onOpenChange={setAddingItem}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add pantry item</DialogTitle>
          </DialogHeader>
          {userId && (
            <PantryItemForm
              userId={userId}
              onCancel={() => setAddingItem(false)}
              onSubmit={handleAdd}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
