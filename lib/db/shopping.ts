import { createClient } from '@/lib/supabase/client'
import type { ShoppingItem } from '@/types'

export async function getShoppingItems(userId: string): Promise<ShoppingItem[]> {
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
  const supabase = createClient()
  const { error } = await supabase
    .from('shopping_list_items')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function clearCheckedItems(userId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('shopping_list_items')
    .delete()
    .eq('user_id', userId)
    .eq('checked', true)

  if (error) throw error
}
