'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CATEGORIES, UNITS } from '@/lib/data'
import type { PantryItem, PantryCategory, PantryUnit } from '@/types'

type FormData = {
  name: string
  quantity: string
  unit: PantryUnit
  category: PantryCategory
  expiry_date: string
  min_quantity: string
  purchase_price: string
  notes: string
}

type Props = {
  initial?: Partial<PantryItem>
  onSubmit: (data: Omit<PantryItem, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  onCancel: () => void
  userId: string
}

export function PantryItemForm({ initial, onSubmit, onCancel, userId }: Props) {
  const [form, setForm] = useState<FormData>({
    name: initial?.name || '',
    quantity: String(initial?.quantity || ''),
    unit: initial?.unit || 'pcs',
    category: initial?.category || 'other',
    expiry_date: initial?.expiry_date?.split('T')[0] || '',
    min_quantity: initial?.min_quantity != null ? String(initial.min_quantity) : '',
    purchase_price: initial?.purchase_price != null ? String(initial.purchase_price) : '',
    notes: initial?.notes || '',
  })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.quantity) return
    setLoading(true)
    try {
      await onSubmit({
        user_id: userId,
        name: form.name.trim(),
        quantity: parseFloat(form.quantity),
        unit: form.unit,
        category: form.category,
        expiry_date: form.expiry_date || null,
        min_quantity: form.min_quantity ? parseFloat(form.min_quantity) : null,
        purchase_price: form.purchase_price ? parseFloat(form.purchase_price) : null,
        notes: form.notes || null,
      })
    } finally {
      setLoading(false)
    }
  }

  function set(key: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="name">Item name *</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Chicken breast"
            required
          />
        </div>
        <div>
          <Label htmlFor="quantity">Quantity *</Label>
          <Input
            id="quantity"
            type="number"
            min="0"
            step="any"
            value={form.quantity}
            onChange={(e) => set('quantity', e.target.value)}
            placeholder="0"
            required
          />
        </div>
        <div>
          <Label htmlFor="unit">Unit *</Label>
          <Select value={form.unit} onValueChange={(v) => set('unit', v)}>
            <SelectTrigger id="unit">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UNITS.map((u) => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="category">Category *</Label>
          <Select value={form.category} onValueChange={(v) => set('category', v)}>
            <SelectTrigger id="category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="expiry_date">Expiry date</Label>
          <Input
            id="expiry_date"
            type="date"
            value={form.expiry_date}
            onChange={(e) => set('expiry_date', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="min_quantity">Low-stock alert at</Label>
          <Input
            id="min_quantity"
            type="number"
            min="0"
            step="any"
            value={form.min_quantity}
            onChange={(e) => set('min_quantity', e.target.value)}
            placeholder="optional"
          />
        </div>
        <div>
          <Label htmlFor="purchase_price">Purchase price (R)</Label>
          <Input
            id="purchase_price"
            type="number"
            min="0"
            step="0.01"
            value={form.purchase_price}
            onChange={(e) => set('purchase_price', e.target.value)}
            placeholder="optional"
          />
        </div>
      </div>
      <div className="flex gap-2 pt-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving…' : initial?.id ? 'Save changes' : 'Add item'}
        </Button>
      </div>
    </form>
  )
}
