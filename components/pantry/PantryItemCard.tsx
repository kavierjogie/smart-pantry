'use client'

import { createElement, useState } from 'react'
import { Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { PantryItemForm } from './PantryItemForm'
import { getCategoryIcon, formatDate, daysUntilExpiry, isLowStock, getExpiryColor } from '@/lib/utils'
import type { PantryItem } from '@/types'
import { cn } from '@/lib/utils'

type Props = {
  item: PantryItem
  onUpdate: (id: string, data: Partial<PantryItem>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  userId: string
}

function CategoryGlyph({ category }: { category: string }) {
  return createElement(getCategoryIcon(category), { className: 'h-6 w-6' })
}

export function PantryItemCard({ item, onUpdate, onDelete, userId }: Props) {
  const [editing, setEditing] = useState(false)
  const days = daysUntilExpiry(item.expiry_date)
  const expired = days !== null && days < 0
  const expiringSoon = days !== null && days >= 0 && days <= 7
  const lowStock = isLowStock(item)

  return (
    <>
      <Card className={cn(
        'flex items-center gap-3 p-4 hover:shadow-md transition-shadow',
        expired ? 'border-red-200 bg-red-50/30' : expiringSoon ? 'border-amber-200 bg-amber-50/30' : ''
      )}>
        <div className="flex-shrink-0 text-slate-500">
          <CategoryGlyph category={item.category} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-slate-900 truncate">{item.name}</span>
            {lowStock && (
              <Badge variant="warning" className="shrink-0">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Low
              </Badge>
            )}
            {expired && <Badge variant="destructive" className="shrink-0">Expired</Badge>}
            {!expired && expiringSoon && (
              <Badge variant="warning" className="shrink-0">
                Expires {days === 0 ? 'today' : `in ${days}d`}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 text-sm text-slate-500 flex-wrap">
            <span className="text-sm font-medium text-slate-700">{item.quantity} {item.unit}</span>
            <span className="text-sm capitalize text-slate-500 bg-slate-100 rounded px-1.5 py-0.5">{item.category}</span>
            {item.expiry_date && (
              <span className={cn('text-xs', getExpiryColor(item.expiry_date))}>
                {expired ? 'Expired' : 'Expires'} {formatDate(item.expiry_date)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-slate-700"
            aria-label="Edit item"
            onClick={() => setEditing(true)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-red-600"
                aria-label="Delete item"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove {item.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove it from your pantry.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(item.id)}>Remove</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Card>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {item.name}</DialogTitle>
          </DialogHeader>
          <PantryItemForm
            initial={item}
            userId={userId}
            onCancel={() => setEditing(false)}
            onSubmit={async (data) => {
              await onUpdate(item.id, data)
              setEditing(false)
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
