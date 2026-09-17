'use client'

import { useState } from 'react'
import { Trash2, ArrowDownToLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UNITS } from '@/lib/data'
import type { ShoppingItem, PantryUnit } from '@/types'
import { cn } from '@/lib/utils'

type Props = {
  item: ShoppingItem
  onToggle: (id: string, checked: boolean) => void
  onDelete: (id: string) => void
  onMoveToStock: (item: ShoppingItem, quantity: number, unit: PantryUnit, expiryDate: string) => void
}

export function ShoppingItemRow({ item, onToggle, onDelete, onMoveToStock }: Props) {
  const [moveOpen, setMoveOpen] = useState(false)
  const [qty, setQty] = useState(String(item.quantity))
  const [unit, setUnit] = useState<PantryUnit>(item.unit)
  const [expiry, setExpiry] = useState('')

  function handleMove() {
    onMoveToStock(item, parseFloat(qty) || item.quantity, unit, expiry)
    setMoveOpen(false)
  }

  return (
    <>
      <div className={cn(
        'flex items-center gap-3 rounded-xl border bg-white p-3.5 shadow-sm transition-all',
        item.checked ? 'opacity-50' : ''
      )}>
        <Checkbox
          checked={item.checked}
          onCheckedChange={(v) => onToggle(item.id, !!v)}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('text-sm font-medium', item.checked && 'line-through text-slate-400')}>
              {item.name}
            </span>
            {item.recipe_name && (
              <Badge variant="info" className="text-xs">
                {item.recipe_name}
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {item.quantity} {item.unit}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {item.checked && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
              title="Move to pantry"
              aria-label="Move to pantry"
              onClick={() => setMoveOpen(true)}
            >
              <ArrowDownToLine className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-red-600"
            aria-label="Delete item"
            onClick={() => onDelete(item.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move {item.name} to pantry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Quantity</Label>
                <Input type="number" value={qty} onChange={e => setQty(e.target.value)} min="0" step="any" />
              </div>
              <div>
                <Label>Unit</Label>
                <Select value={unit} onValueChange={v => setUnit(v as PantryUnit)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Expiry date (optional)</Label>
              <Input type="date" value={expiry} onChange={e => setExpiry(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setMoveOpen(false)}>Cancel</Button>
              <Button onClick={handleMove}>Add to pantry</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
