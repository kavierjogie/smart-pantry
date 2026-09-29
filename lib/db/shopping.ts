import { createClient } from '@/lib/supabase/client'
import type { ShoppingItem } from '@/types'
import { isDemoMode, demoList, demoInsert, demoUpdate, demoDelete } from '@/lib/demo'

export async function getShoppingItems(userId: string): Promise<ShoppingItem[]> {
  if (isDemoMode()) return demoList<ShoppingItem>('shopping_list_items')
  const supabase = createClient()
  const { data, error } = await supabase
    .from('shopping_list_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function addShoppingItem(
  item: Omit<ShoppingItem, 'id' | 'created_at' | 'updated_at'>
): Promise<ShoppingItem> {
  if (isDemoMode()) return demoInsert<ShoppingItem>('shopping_list_items', item)
  const supabase = createClient()
  const { data, error } = await supabase
    .from('shopping_list_items')
    .insert(item)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateShoppingItem(
  id: string,
  updates: Partial<ShoppingItem>
): Promise<ShoppingItem> {
  if (isDemoMode()) return demoUpdate<ShoppingItem>('shopping_list_items', id, updates)
  const supabase = createClient()
  const { data, error } = await supabase
    .from('shopping_list_items')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteShoppingItem(id: string): Promise<void> {
  if (isDemoMode()) return demoDelete<ShoppingItem>('shopping_list_items', r => r.id === id)
  const supabase = createClient()
  const { error } = await supabase
    .from('shopping_list_items')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function clearCheckedItems(userId: string): Promise<void> {
  if (isDemoMode()) return demoDelete<ShoppingItem>('shopping_list_items', r => r.checked)
  const supabase = createClient()
  const { error } = await supabase
    .from('shopping_list_items')
    .delete()
    .eq('user_id', userId)
    .eq('checked', true)

  if (error) throw error
}
