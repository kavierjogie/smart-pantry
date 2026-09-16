import { createClient } from '@/lib/supabase/client'
import type { PantryItem } from '@/types'

export async function getPantryItems(userId: string): Promise<PantryItem[]> {
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
  const supabase = createClient()
  const { error } = await supabase
    .from('pantry_items')
    .delete()
    .eq('id', id)

  if (error) throw error
}
