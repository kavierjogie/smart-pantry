'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Trash2, ShoppingCart, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { ShoppingItemRow } from '@/components/shopping/ShoppingItemRow'
import { createClient } from '@/lib/supabase/client'
import {
  getShoppingItems, addShoppingItem, updateShoppingItem,
  deleteShoppingItem, clearCheckedItems,
} from '@/lib/db/shopping'
import { addPantryItem } from '@/lib/db/pantry'
import { CATEGORIES, UNITS } from '@/lib/data'
import type { ShoppingItem, PantryItem, PantryCategory, PantryUnit } from '@/types'
import { toast } from 'sonner'

export default function ShoppingPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({
    name: '', quantity: '1', unit: 'pcs' as PantryUnit,
    category: 'other' as PantryCategory, notes: '',
  })

  const loadItems = useCallback(async (uid: string) => {
    try {
      const data = await getShoppingItems(uid)
      setItems(data)
    } catch {
      toast.error('Failed to load shopping list')
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

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!userId || !form.name.trim()) return
    try {
      await addShoppingItem({
        user_id: userId,
        name: form.name.trim(),
        quantity: parseFloat(form.quantity) || 1,
        unit: form.unit,
        category: form.category,
        checked: false,
        recipe_id: null,
        recipe_name: null,
        notes: form.notes || null,
      })
      toast.success(`${form.name} added`)
      setForm({ name: '', quantity: '1', unit: 'pcs', category: 'other', notes: '' })
      setAddOpen(false)
      loadItems(userId)
    } catch {
      toast.error('Failed to add item')
    }
  }

  async function handleToggle(id: string, checked: boolean) {
    if (!userId) return
    await updateShoppingItem(id, { checked })
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked } : i)))
  }

  async function handleDelete(id: string) {
    const item = items.find(i => i.id === id)
    await deleteShoppingItem(id)
    toast.success(`${item?.name || 'Item'} removed`)
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  async function handleClearChecked() {
    if (!userId) return
    await clearCheckedItems(userId)
    toast.success('Checked items cleared')
    loadItems(userId)
  }

  async function handleMoveToStock(
    item: ShoppingItem, quantity: number, unit: PantryUnit, expiryDate: string
  ) {
    if (!userId) return
    try {
      await addPantryItem({
        user_id: userId,
        name: item.name,
        quantity,
        unit,
        category: item.category,
        expiry_date: expiryDate || null,
        min_quantity: null,
        purchase_price: null,
        notes: null,
      })
      await deleteShoppingItem(item.id)
      toast.success(`${item.name} moved to pantry`)
      loadItems(userId)
    } catch {
      toast.error('Failed to move item')
    }
  }

  const pending = items.filter(i => !i.checked)
  const checked = items.filter(i => i.checked)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Shopping List</h1>
          <p className="text-slate-500 text-sm mt-1">
            {pending.length} item{pending.length !== 1 ? 's' : ''} to buy
          </p>
        </div>
        <div className="flex gap-2">
          {checked.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 text-slate-600">
                  <Trash2 className="h-4 w-4" />
                  Clear checked
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear {checked.length} checked item{checked.length !== 1 ? 's' : ''}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove all ticked items from your list.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearChecked}>Clear</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button onClick={() => setAddOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add item
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ShoppingCart className="h-12 w-12 text-slate-200 mb-4" />
          <p className="font-medium text-slate-500">Your shopping list is empty</p>
          <p className="text-sm text-slate-400 mt-1">Add items manually or generate them from a recipe</p>
          <Button className="mt-4" onClick={() => setAddOpen(true)}>Add first item</Button>
        </div>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">To buy</h2>
              <div className="space-y-2">
                {pending.map((item) => (
                  <ShoppingItemRow
                    key={item.id}
                    item={item}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    onMoveToStock={handleMoveToStock}
                  />
                ))}
              </div>
            </div>
          )}

          {checked.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Done</h2>
                <CheckCheck className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="space-y-2">
                {checked.map((item) => (
                  <ShoppingItemRow
                    key={item.id}
                    item={item}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    onMoveToStock={handleMoveToStock}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add item dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add shopping item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <Label htmlFor="sname">Item name *</Label>
              <Input
                id="sname"
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Olive oil"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number" min="0" step="any"
                  value={form.quantity}
                  onChange={(e) => setForm(f => ({ ...f, quantity: e.target.value }))}
                />
              </div>
              <div>
                <Label>Unit</Label>
                <Select value={form.unit} onValueChange={(v) => setForm(f => ({ ...f, unit: v as PantryUnit }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm(f => ({ ...f, category: v as PantryCategory }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit">Add to list</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
