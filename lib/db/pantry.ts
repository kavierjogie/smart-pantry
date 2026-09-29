import { createClient } from '@/lib/supabase/client'
import type { PantryItem } from '@/types'
import { isDemoMode, demoList, demoInsert, demoUpdate, demoDelete } from '@/lib/demo'

export async function getPantryItems(userId: string): Promise<PantryItem[]> {
  if (isDemoMode()) return demoList<PantryItem>('pantry_items').sort((a, b) => a.name.localeCompare(b.name))
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pantry_items')
    .select('*')
    .eq('user_id', userId)
    .order('name')

  if (error) throw error
  return data || []
}

export async function addPantryItem(
  item: Omit<PantryItem, 'id' | 'created_at' | 'updated_at'>
): Promise<PantryItem> {
  if (isDemoMode()) return demoInsert<PantryItem>('pantry_items', item)
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pantry_items')
    .insert(item)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updatePantryItem(
  id: string,
  updates: Partial<PantryItem>
): Promise<PantryItem> {
  if (isDemoMode()) return demoUpdate<PantryItem>('pantry_items', id, updates)
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pantry_items')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deletePantryItem(id: string): Promise<void> {
  if (isDemoMode()) return demoDelete<PantryItem>('pantry_items', r => r.id === id)
  const supabase = createClient()
  const { error } = await supabase
    .from('pantry_items')
    .delete()
    .eq('id', id)

  if (error) throw error
}
